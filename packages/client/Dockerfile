FROM node:22-alpine

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

# Set working directory to client
WORKDIR /app/packages/client

# Expose Vite dev server port
EXPOSE 5173

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=5173

# Run Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
