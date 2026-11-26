#!/usr/bin/env bash
# This VPS uses a host-owned build and activation controller.
if [[ $EUID -eq 0 && -x /usr/local/sbin/web-release ]]; then
  printf '%s\n' 'Use sudo /usr/local/sbin/web-release stiles-sand-gravel on this VPS.' >&2
  exit 2
fi
set -Eeuo pipefail
export GIT_TERMINAL_PROMPT=0
umask 022

deploy_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
cd "$deploy_dir/.."
source "$deploy_dir/app.sh"
backup_dir="${BACKUP_DIR:-/var/backups/$app/deploy}"
mode=${0##*/}

die() { printf 'Error: %s\n' "$*" >&2; exit 1; }
repo_git() { git -c safe.directory="$PWD" "$@"; }
step() { printf '==> %s\n' "$*"; }
as_admin() { if (( EUID == 0 )); then "$@"; else sudo -n "$@"; fi; }

check_tools() {
  local tool
  for tool in git curl flock tar "${tools[@]}"; do
    command -v "$tool" >/dev/null || die "install $tool"
  done
  if [[ -n $env_file ]]; then
    [[ -r $env_file ]] || die "configure a readable production environment at $PWD/$env_file"
  fi
  local lock
  for lock in "${locks[@]}"; do [[ -s $lock ]] || die "missing lockfile $lock"; done
}

check_units() {
  local unit
  for unit in "${units[@]}"; do
    [[ $(systemctl show -p LoadState --value "$unit") == loaded ]] || die "systemd unit $unit is missing"
  done
}

install_units() {
  [[ $PWD == "/var/www/$app" ]] || die "unit templates require checkout at /var/www/$app"
  local unit file identity data
  local -a installed=()
  for unit in "${units[@]}"; do
    if [[ $(systemctl show -p LoadState --value "$unit") == loaded ]]; then continue; fi
    file="$deploy_dir/systemd/$unit.service"
    [[ -s $file ]] || die "missing unit template $file"
    identity=$(sed -n 's/^User=//p' "$file")
    [[ $identity == svc-* ]] || die "invalid service account in $file"
    if ! id "$identity" >/dev/null 2>&1; then
      as_admin useradd --system --user-group --home-dir /nonexistent --shell /usr/sbin/nologin "$identity"
    fi
    while IFS= read -r data; do
      if [[ ! -d $data ]]; then as_admin install -d -m 0750 -o "$identity" -g "$identity" "$data"; fi
    done < <(sed -n 's/^ReadWritePaths=//p' "$file")
    local file_env
    file_env=$(sed -n 's/^EnvironmentFile=//p' "$file" | head -1)
    if [[ -n $file_env ]]; then
      as_admin chown "root:$(id -gn "$identity")" "$file_env"
      as_admin chmod 0640 "$file_env"
    fi
    as_admin install -m 0644 "$file" "/etc/systemd/system/$unit.service"
    installed+=("$unit")
  done
  if (( ${#installed[@]} )); then
    as_admin systemctl daemon-reload
    as_admin systemctl enable "${installed[@]}"
  fi
}

run_env() {
  if [[ -z $env_file ]]; then "$@"; return; fi
  node --env-file="$env_file" -e '
    const { status, error } = require("node:child_process").spawnSync(
      process.argv[1], process.argv.slice(2), { stdio: "inherit" }
    );
    if (error) console.error(error.message);
    process.exit(status ?? 1);
  ' -- "$@"
}

db_backup() {
  case $database in
    postgres)
      node --env-file="$env_file" - "$snapshot/database.dump" <<'JS'
const { spawnSync } = require('node:child_process');
let url;
try {
  url = new URL(process.env.DATABASE_URL);
} catch {
  console.error('DATABASE_URL is missing or invalid');
  process.exit(1);
}
if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw Error('DATABASE_URL must use PostgreSQL');
const env = { ...process.env };
delete env.DATABASE_URL;
Object.assign(env, {
  PGHOST: url.searchParams.get('host') || url.hostname.replace(/^\[|\]$/g, ''),
  PGPORT: url.port || '5432',
  PGUSER: decodeURIComponent(url.username),
  PGPASSWORD: decodeURIComponent(url.password),
  PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
  PGCONNECT_TIMEOUT: '10'
});
for (const key of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) {
  if (url.searchParams.has(key)) env['PG' + key.toUpperCase()] = url.searchParams.get(key);
}
const result = spawnSync('pg_dump', ['--no-password', '--format=custom', '--file', process.argv[2]], { env, stdio: 'inherit' });
process.exit(result.status ?? 1);
JS
      ;;
    sqlite)
      if [[ -f $sqlite_file ]]; then
        python3 - "$sqlite_file" "$snapshot/database.sqlite" <<'PY'
from pathlib import Path
import sqlite3
import sys
source = Path(sys.argv[1]).resolve().as_uri() + '?mode=ro'
with sqlite3.connect(source, uri=True) as db, sqlite3.connect(sys.argv[2]) as backup:
    db.backup(backup)
PY
      fi
      ;;
  esac
}

health() {
  local unit attempt all_ok port status
  for attempt in {1..12}; do
    all_ok=true
    for unit in "${units[@]}"; do systemctl is-active --quiet "$unit" || all_ok=false; done
    for port in "${backend_ports[@]}"; do
      status=$(curl -sS --max-time 3 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/" 2>/dev/null || true)
      case $status in 2??|3??|4??) ;; *) all_ok=false ;; esac
    done
    if $all_ok && curl -fsS --max-time 6 --resolve "$host:443:127.0.0.1" "https://$host$health_path" -o /dev/null; then
      if declare -F extra_health >/dev/null; then
        if extra_health; then return 0; fi
      else
        return 0
      fi
    fi
    sleep 2
  done
  die "production health check failed for $host$health_path"
}

(( $# <= 1 )) || die 'pass only one option'
case "$mode:${1:-}" in
  setup.sh:--check) check_tools; check_units; step 'Setup checks passed'; exit ;;
  setup.sh:|setup.sh:--install-units)
    check_tools
    if [[ ${1:-} == --install-units ]]; then install_units; fi
    check_units
    as_admin install -d -m 0700 "$backup_dir"
    step "Deployment backup directory ready at $backup_dir"
    exit ;;
  update.sh:|update.sh:--check) ;;
  *) die "usage: setup.sh [--check|--install-units] or update.sh [--check]" ;;
esac
check_tools
check_units

if [[ ${1:-} == --check ]]; then
  step "Checkout $(repo_git branch --show-current) at $(repo_git rev-parse --short HEAD)"
  if [[ -n $(repo_git status --porcelain --untracked-files=no) ]]; then
    step 'Tracked changes present. A full update requires a clean checkout.'
  fi
  step 'Deployment prerequisites verified'
  exit
fi
(( EUID == 0 )) || die 'run setup first, then run update as a server administrator via sudo'
[[ -d $backup_dir ]] || die 'run deploy/setup.sh first'
exec 9>"$backup_dir/update.lock"
flock -n 9 || die 'another deployment is running'
[[ -z $(repo_git status --porcelain --untracked-files=no) ]] || die 'tracked changes present; commit or preserve them before updating'

branch=$(repo_git branch --show-current)
[[ $branch == "$deploy_branch" ]] || die "run the update from $deploy_branch"
step "Fetching origin/$deploy_branch"
repo_git fetch origin "$deploy_branch"
repo_git merge-base --is-ancestor HEAD FETCH_HEAD || die 'checkout is ahead or diverged; reconcile it before deploying'
snapshot=$(mktemp -d "$backup_dir/$(date -u +%Y%m%dT%H%M%SZ).XXXXXX")
repo_git rev-parse HEAD > "$snapshot/REVISION"
step "Backing up data to $snapshot"
(umask 077; db_backup)
data_to_backup=()
for path in "${data_paths[@]}"; do [[ ! -e $path ]] || data_to_backup+=("$path"); done
if (( ${#data_to_backup[@]} )); then (umask 077; tar -czf "$snapshot/files.tar.gz" -- "${data_to_backup[@]}"); fi
step "Updating to $(repo_git rev-parse --short FETCH_HEAD)"
repo_git merge --ff-only FETCH_HEAD
source "$deploy_dir/app.sh"
check_tools
check_units

step 'Installing and building'
build_app
for artifact in "${artifacts[@]}"; do [[ -s $artifact ]] || die "build output is missing: $artifact"; done

step 'Applying database migrations'
migrate_app
if (( ${#units[@]} )); then
  step 'Restarting application services'
  systemctl restart "${units[@]}"
fi
health
step "Deployment verified at https://$host$health_path"
