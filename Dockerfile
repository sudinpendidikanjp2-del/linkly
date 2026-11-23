# syntax=docker/dockerfile:1
#
# Multi-architecture image. Build for ARM64 with:
#   docker buildx build --platform linux/arm64/v8 -t linkly:arm64 .
# (see scripts/docker-build.sh)

# ==========================================
# Phase 1: Build stage
# ==========================================
# The build output (dist/) is plain JavaScript, so this stage always runs on the machine doing the build.
# That keeps cross-builds fast: nothing here runs under CPU emulation.
FROM --platform=$BUILDPLATFORM node:20-slim AS builder

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# Client bundle (vite) and server bundle (esbuild)
RUN npm run build

# ==========================================
# Phase 2: Production runtime stage (target platform)
# ==========================================
FROM node:20-slim AS runner

# Prisma's query engine needs OpenSSL at runtime.
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app && chown -R node:node /app
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

USER node

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node prisma ./prisma/

# Production dependencies only. Native pieces (the Prisma engine) are fetched for this image's own architecture.
RUN npm ci --omit=dev && \
    npx prisma generate && \
    npm cache clean --force

COPY --from=builder --chown=node:node /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Applies pending migrations, then starts the server.
CMD ["npm", "run", "start"]
