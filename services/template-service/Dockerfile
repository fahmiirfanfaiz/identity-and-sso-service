# ============================================
# Template Service - Dockerfile
# ============================================
# Multi-stage build: deps → dev → prod

# ─── Stage: deps ──────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    cp -R node_modules /prod_modules && \
    npm ci

# ─── Stage: dev (with nodemon hot-reload) ─────
FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ─── Stage: prod ──────────────────────────────
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /prod_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
