# Deploy stiles-sand-gravel

## This VPS

Use `sudo /usr/local/sbin/web-release stiles-sand-gravel --check` for a preflight and `sudo /usr/local/sbin/web-release stiles-sand-gravel` to deploy. The controller lives outside the checkout and runs dependency installation and builds under a dedicated non-root account. Use the original setup instructions below only on hosts without the controller.

The production checkout is /var/www/stiles-sand-gravel and the HTTPS hostname is stilessandgravel.com. Build commands and outputs are listed in [app.sh](app.sh).

## Set up the host

1. Install Git, curl, Bash, tar, util-linux, and the tools in [app.sh](app.sh). Node applications on this server use Node.js 22.
2. Clone with a repository-scoped deploy credential. Provision /var/www/stiles-sand-gravel/.env with the production settings and mode 0600. Install Python 3 and preserve the SQLite database and media. The updater uses the SQLite backup API.
3. Configure Nginx and TLS. Proxy to loopback port 3010 for the application services.
4. On a fresh host, install missing services with sudo deploy/setup.sh --install-units. On the current server run sudo deploy/setup.sh. Existing units are preserved. Existing data folders must be writable by their service account.
5. Run sudo deploy/update.sh --check for a read-only preflight.

Systemd services: [stiles-sand-gravel](systemd/stiles-sand-gravel.service)

## Update

Run sudo deploy/update.sh from the server. The updater uses a deployment lock, checks that origin/main can be merged by fast-forward, backs up data, installs from lockfiles, builds, applies configured production migrations, restarts the services, and checks HTTPS through local Nginx. Tracked edits or a diverged branch must be reconciled before updating.

The updater builds in the live checkout. Schedule production updates during a maintenance window. Backups are private under /var/backups/stiles-sand-gravel/deploy and record the previous Git revision. Keep off-server backups and test restores separately. Restoring an application revision and restoring database state are separate decisions.

## Nginx routing

Proxy all requests to the integrated web and API server on port 3010.
