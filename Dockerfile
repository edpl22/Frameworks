# syntax=docker/dockerfile:1.7
# ── Stage 1: build ──────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN npm test && npm run build

# ── Stage 2: serve ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime
LABEL org.opencontainers.image.title="Frameworks Studio" \
      org.opencontainers.image.description="Visual website design framework that exports production-ready Claude Code prompts" \
      org.opencontainers.image.licenses="MIT"
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
