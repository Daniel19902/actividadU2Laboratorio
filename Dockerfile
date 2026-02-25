# ── Stage 1: Dependencias ────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: Build / validación ──────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Ejecutar lint y tests en build time (fail-fast)
RUN npm run lint
RUN npm test

# ── Stage 3: Imagen de producción ────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Seguridad: ejecutar como usuario no-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup src/ ./src/
COPY --chown=appuser:appgroup package.json ./

USER appuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
