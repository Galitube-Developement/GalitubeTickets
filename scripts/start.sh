#!/usr/bin/env sh
set -eu

# /app is the source copied from the image built by this repository. Do not
# clone a repository here: Pterodactyl and Pelican must run that same image.
if [ -f /app/package.json ]; then
    base_dir=/app
else
    # Keep direct local script execution useful during development.
    base_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
fi
mkdir -p /home/container/user /home/container/logs /home/container/prisma /home/container/.prisma
cd "$base_dir"

# Keep the established lifecycle: create configuration, select/copy the Prisma
# provider schema, generate Prisma, deploy non-destructive migrations, start.
node scripts/preinstall.js
node scripts/postinstall.js
exec node src/index.js
