# Finance Manager Monorepo

A full-stack monorepo application with Authentik authentication, featuring a Node.js/Express backend and a React frontend.

## Project Structure

```
finances-monorepo/
├── packages/
│   ├── shared/          # Shared TypeScript types
│   ├── server/          # Node.js + Express backend
│   └── client/          # React + Vite frontend
└── package.json         # Root workspace configuration
```

## Technology Stack

### Server (packages/server)
- Node.js 22 with TypeScript
- Express.js
- Authentik OAuth2/OIDC authentication
- Session-based authentication

### Client (packages/client)
- React 19
- TypeScript
- Vite 6
- Chakra UI
- React Router 7
- Axios for API calls

### Shared (packages/shared)
- TypeScript type definitions shared between client and server

## Getting Started

### Prerequisites
- Node.js 22+
- npm 10+
- Authentik instance configured with OAuth2/OIDC provider

### Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Server Environment:**
   ```bash
   cd packages/server
   cp .env.example .env
   ```

   Edit `.env` and add your Authentik configuration:
   ```env
   AUTHENTIK_ISSUER=https://your-authentik-domain.com/application/o/your-app/
   AUTHENTIK_CLIENT_ID=your-client-id
   AUTHENTIK_CLIENT_SECRET=your-client-secret
   AUTHENTIK_REDIRECT_URI=http://localhost:3001/auth/callback
   SESSION_SECRET=your-random-secret
   CLIENT_URL=http://localhost:5173
   ```

3. **Configure Client Environment:**
   ```bash
   cd packages/client
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_AUTHENTIK_ISSUER=https://your-authentik-domain.com/application/o/your-app/
   VITE_AUTHENTIK_CLIENT_ID=your-client-id
   ```

4. **Run in Development Mode:**

   From the root directory:
   ```bash
   # Run both server and client
   npm run dev

   # Or run separately:
   npm run dev:server   # Server on http://localhost:3001
   npm run dev:client   # Client on http://localhost:5173
   ```

## Docker Deployment

### Server

1. **Configure environment variables:**
   Create a `.env` file in `packages/server/` with your Authentik configuration.

2. **Run with Docker Compose:**
   ```bash
   cd packages/server
   docker-compose up -d
   ```

   The server will be available at `http://localhost:3001`

### Client

1. **Build with environment variables:**
   ```bash
   cd packages/client
   docker-compose up -d
   ```

   The client will be available at `http://localhost:5173`

### Full Stack Deployment

You can create a root-level `docker-compose.yml` to run both services together:

```yaml
version: '3.8'

services:
  server:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      # Add all required environment variables
    networks:
      - finances-network

  client:
    build:
      context: .
      dockerfile: packages/client/Dockerfile
      args:
        - VITE_API_URL=http://localhost:3001
        # Add other build args
    ports:
      - "5173:80"
    depends_on:
      - server
    networks:
      - finances-network

networks:
  finances-network:
    driver: bridge
```

## Authentik Configuration

1. Create a new OAuth2/OIDC Provider in Authentik
2. Set the redirect URI to: `http://localhost:3001/auth/callback` (development) or your production URL
3. Copy the Client ID and Client Secret
4. Create an Application in Authentik and link it to the provider
5. Use the application's issuer URL in your configuration

## API Endpoints

### Authentication
- `GET /auth/login` - Initiate login flow
- `GET /auth/callback` - OAuth callback endpoint
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Example Protected Route
- `GET /api/protected` - Example protected API endpoint

## Development Commands

```bash
# Install dependencies
npm install

# Run development servers
npm run dev

# Build for production
npm run build

# Build server only
npm run build:server

# Build client only
npm run build:client
```

## Project Features

- Monorepo structure with npm workspaces
- Shared TypeScript types between frontend and backend
- OAuth2/OIDC authentication with Authentik
- Session-based authentication
- Protected routes on both client and server
- Docker support for both services
- Type-safe API communication
- Modern React with hooks and context
- Chakra UI for consistent styling

## License

MIT
