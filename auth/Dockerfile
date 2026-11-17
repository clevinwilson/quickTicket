# syntax=docker/dockerfile:1

# This service runs TypeScript directly via Node's native type stripping
# (tsconfig has noEmit + allowImportingTsExtensions), so there is no build step.
ARG NODE_VERSION=24-alpine

# --- deps: install production dependencies only ---------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- runtime --------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Drop privileges (the node image ships an unprivileged `node` user).
USER node

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/index.ts"]


# --- dev: hot-reload target used by Tilt ----------------------------------
FROM node:${NODE_VERSION} AS dev
ENV NODE_ENV=development
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src

ENV PORT=3000
EXPOSE 3000

CMD ["node", "--watch", "src/index.ts"]
