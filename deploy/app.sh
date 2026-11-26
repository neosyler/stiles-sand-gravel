#!/usr/bin/env bash
# Production defaults. Keep credentials in the server environment file.
app=stiles-sand-gravel
host=stilessandgravel.com
deploy_branch=main
env_file=.env
database=sqlite
sqlite_file=data/quotes.db
health_path=/
units=(stiles-sand-gravel)
tools=(node npm python3)
locks=(package-lock.json)
artifacts=(dist/apps/api/server.js dist/apps/web/server/main.js)
data_paths=(media)
backend_ports=(3010)

build_app() {
  npm ci
  npm run build
}

migrate_app() {
  :
}
