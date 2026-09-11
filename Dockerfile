# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim
LABEL org.opencontainers.image.source="https://github.com/Galitube-Developement/GalitubeTickets" \
      org.opencontainers.image.description="Galitube Hosting ticket bot" \
      org.opencontainers.image.licenses="GPL-3.0-or-later"
RUN apt-get update && apt-get install -y --no-install-recommends git curl ca-certificates openssl && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --home-dir /home/container container
COPY --chmod=755 scripts/start.sh /app/scripts/start.sh
ENV DOCKER=true NODE_ENV=production HTTP_HOST=0.0.0.0 HTTP_PORT=8169
USER container
WORKDIR /home/container
VOLUME ["/home/container"]
ENTRYPOINT ["/app/scripts/start.sh"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=600s CMD curl -f "http://localhost:${HTTP_PORT}/status" || exit 1
