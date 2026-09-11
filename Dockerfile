# syntax=docker/dockerfile:1

# Build the application from this checkout. The production dependency install is
# intentionally lockfile-based so published images are reproducible.
FROM oven/bun:1 AS builder
WORKDIR /app

# The repository is npm-lockfile based (there is no bun.lock in this fork).
# Install npm and Git in the builder only; Git is needed by an optional package.
RUN apt-get update && apt-get install -y --no-install-recommends git npm \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY LICENSE NOTICE.md ./
RUN npm ci --omit=dev --ignore-scripts

COPY db ./db
COPY scripts ./scripts
COPY src ./src
COPY web/package.json web/package-lock.json ./web/
COPY web/src ./web/src
COPY web/static ./web/static
COPY web/svelte.config.js web/tailwind.config.js web/tsconfig.json web/vite.config.js web/postcss.config.js ./web/
RUN npm ci --prefix web --include=dev --ignore-scripts && npm run build --prefix web && rm -rf web/node_modules

# Node Alpine is small and works for Docker, Pterodactyl, and Pelican. Prisma
# is generated on startup for the selected database provider and this platform.
FROM node:22-alpine
LABEL org.opencontainers.image.source="https://github.com/Galitube-Developement/GalitubeTickets" \
      org.opencontainers.image.description="GalitubeTickets Discord ticket bot" \
      org.opencontainers.image.licenses="GPL-3.0-or-later" \
      org.opencontainers.image.url="https://github.com/Galitube-Developement/GalitubeTickets"

RUN apk add --no-cache ca-certificates curl git openssl libc6-compat \
    && adduser -D -h /home/container container \
    && mkdir -p /home/container/user /home/container/logs \
    && chown -R container:container /home/container

WORKDIR /app
COPY --from=builder --chown=container:container /app /app
RUN chmod 755 /app/scripts/start.sh

ENV NODE_ENV=production \
    HTTP_HOST=0.0.0.0 \
    DOCKER=true \
    AUTO_UPDATE=false

VOLUME ["/home/container/user", "/home/container/logs"]
USER container
ENTRYPOINT ["/app/scripts/start.sh"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=600s CMD curl -fsS "http://localhost:${HTTP_PORT:-8169}/status" || exit 1
