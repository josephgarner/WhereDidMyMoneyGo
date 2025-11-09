# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package.json and lock file
COPY package*.json ./

# Copy package.json files for workspaces
COPY packages/server/package*.json ./packages/server/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies (respects workspaces)
RUN npm install

# Copy source files
COPY packages/server ./packages/server
COPY packages/shared ./packages/shared

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build server
WORKDIR /app/packages/server
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
COPY packages/shared/package*.json ./packages/shared/

# Copy node_modules from builder (includes all dependencies needed for drizzle-kit)
COPY --from=builder /app/node_modules ./node_modules

# Copy built files from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/server/dist ./packages/server/dist

# Copy drizzle config and schema for database initialization
COPY packages/server/drizzle.config.ts ./packages/server/drizzle.config.ts
COPY --from=builder /app/packages/server/src/db ./packages/server/src/db

EXPOSE 3001

# Run db:push from root where node_modules exists, then start server from packages/server
CMD ["sh", "-c", "cd /app && npm run db:push --workspace=@finances/server && cd /app/packages/server && npm start"]
