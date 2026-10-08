# ==========================================
# Phase 1: Build stage
# ==========================================
FROM node:20-slim AS builder

# Install build dependencies and openssl for Prisma
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy Prisma schema and generate Client first so imports in server.ts resolve correctly
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application files
COPY . .

# Build the client app and bundle the server
RUN npm run build

# ==========================================
# Phase 2: Production runtime stage
# ==========================================
FROM node:20-slim AS runner

# Install lightweight runtime dependencies for Prisma
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Set up the work directory and make sure the node user owns it
RUN mkdir -p /app && chown -R node:node /app
WORKDIR /app

ENV NODE_ENV=production

# Switch to non-privileged user for security
USER node

# Copy package manifests, prisma schema, and scripts with correct ownership
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production

# Re-generate Prisma Client in the production node_modules directory
RUN npx prisma generate

# Copy bundled server and built client pages from builder stage
COPY --from=builder --chown=node:node /app/dist ./dist

# Expose port 3000 (ingress routing)
EXPOSE 3000

# Start the bundled production server
CMD ["npm", "run", "start"]
