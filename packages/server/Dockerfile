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

# Copy root package.json
COPY package*.json ./

# Copy package.json files for workspaces
COPY packages/server/package*.json ./packages/server/
COPY packages/shared/package*.json ./packages/shared/

# Install production dependencies only
RUN npm install --production --workspaces --if-present

# Copy built files from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/server/dist ./packages/server/dist

WORKDIR /app/packages/server

EXPOSE 3000

# Start the server
CMD ["npm", "start"]
