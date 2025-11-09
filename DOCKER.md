# Docker Setup Guide

This application uses Docker and Docker Compose to run the client, server, and PostgreSQL database in separate containers.

## Architecture

- **PostgreSQL Database** - Port 5432
- **Backend (Express/Node.js)** - Port 3001
- **Frontend (Vite/React)** - Port 5173

## Prerequisites

- Docker Desktop or Docker Engine installed
- Docker Compose installed

## Quick Start

1. **Create environment file**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values**
   - Set a secure `DB_PASSWORD`
   - Set a secure `SESSION_SECRET` (minimum 32 characters)
   - Configure Authentik settings (if using)

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **View logs**
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   docker-compose logs -f postgres
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432

## Development

The Docker setup is configured for development with hot-reload:

- **Frontend**: Vite dev server with HMR (Hot Module Replacement)
  - Source files are mounted as volumes
  - Changes to `packages/client/src` will auto-reload
  - Changes to `packages/shared/src` will auto-reload

- **Backend**: Node.js production build
  - To enable hot-reload for backend, modify the Dockerfile to use `tsx watch`

## Managing Containers

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (WARNING: deletes database data)
```bash
docker-compose down -v
```

### Rebuild containers after code changes
```bash
docker-compose up -d --build
```

### Rebuild specific service
```bash
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

## Troubleshooting

### Database connection issues
```bash
# Check if postgres is healthy
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Frontend can't connect to backend
1. Ensure `VITE_API_URL` in `.env` is set to `http://localhost:3001`
2. Check backend logs: `docker-compose logs backend`
3. Verify backend is running: `docker-compose ps backend`

### Port conflicts
If ports 5432, 3001, or 5173 are already in use:

Edit `docker-compose.yml` and change the port mappings:
```yaml
ports:
  - "NEW_PORT:CONTAINER_PORT"
```

### Clear and restart
```bash
# Stop everything
docker-compose down

# Remove old images
docker-compose rm -f

# Rebuild and start fresh
docker-compose up -d --build
```

## Production Deployment

For production:

1. Update `.env` with production values
2. Change `NODE_ENV` to `production` in docker-compose.yml
3. Use proper secrets management (don't commit `.env`)
4. Consider using a reverse proxy (nginx, Traefik) for HTTPS
5. Set up proper backup strategy for PostgreSQL data

## Volume Information

### postgres_data
Persistent storage for PostgreSQL database

### logs
Backend application logs (mounted from host)

## Environment Variables

See `.env.example` for all available environment variables and their descriptions.

## Monorepo Structure

The application uses npm workspaces:

```
packages/
  ├── client/     - React frontend (Vite)
  ├── server/     - Express backend
  └── shared/     - Shared TypeScript types
```

Both Dockerfiles handle the monorepo structure by:
1. Installing workspace dependencies at the root level
2. Building the shared package first
3. Building the respective package (client or server)
