# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package.json and lock file
COPY package*.json ./

# Copy package.json files for workspaces
COPY packages/client/package*.json ./packages/client/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies (respects workspaces)
RUN npm install

# Copy source files
COPY packages/client ./packages/client
COPY packages/shared ./packages/shared

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build client for production
WORKDIR /app/packages/client
RUN npm run build

# Production stage - use Node to serve with Vite preview
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/shared/package*.json ./packages/shared/

# Copy built shared package from builder (needed for client dependency)
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Install all dependencies (vite preview needs vite which is a devDependency)
RUN npm install

# Copy built files from builder
COPY --from=builder /app/packages/client/dist ./packages/client/dist

WORKDIR /app/packages/client

# Expose Vite preview port
EXPOSE 5173

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=5173

# Run Vite preview server (serves production build)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
