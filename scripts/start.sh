#!/usr/bin/env sh
set -eu

if [ "${DOCKER:-false}" = "true" ] || [ "${PTERODACTYL:-false}" = "true" ]; then
    base_dir=/home/container/app
    mkdir -p /home/container/user /home/container/logs
    if [ ! -d "$base_dir/.git" ]; then
        if [ -e "$base_dir" ]; then
            echo "Existing /home/container/app is not a Git checkout. Back it up and move it before starting. No files were deleted."
            exit 1
        fi
        git clone --branch main --single-branch https://github.com/Galitube-Developement/GalitubeTickets.git "$base_dir"
    fi
    cd "$base_dir"
    [ -e user ] || ln -s /home/container/user user
    [ -e logs ] || ln -s /home/container/logs logs
    [ -L .env ] || [ -e .env ] || ln -s /home/container/.env .env
    if [ ! -d node_modules ]; then npm ci; fi
else
    base_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
    cd "$base_dir"
fi

node scripts/preinstall.js
# Updates run before database preparation, Discord login, and the web server.
exec node src/index.js
