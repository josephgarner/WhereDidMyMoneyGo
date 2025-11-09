# Authentication Setup Guide

## Overview

This application uses Authentik for OAuth2/OIDC authentication with PKCE (Proof Key for Code Exchange).

## Configuration

### 1. Environment Variables

Required environment variables in `.env`:

```bash
# Authentik Configuration
AUTHENTIK_ISSUER=https://your-authentik-instance.com/application/o/your-app/
AUTHENTIK_CLIENT_ID=your_client_id
AUTHENTIK_CLIENT_SECRET=your_client_secret
AUTHENTIK_REDIRECT_URI=http://localhost:3001/auth/callback

# Session Configuration
SESSION_SECRET=your_secure_session_secret_min_32_chars

# Backend Configuration
CLIENT_URL=http://localhost:5173
```

### 2. Authentik Provider Configuration

In your Authentik admin panel, configure the OAuth2/OIDC Provider:

**Redirect URIs:**
- Development: `http://localhost:3001/auth/callback`
- Production: `https://your-domain.com/auth/callback`

**Client Type:** Confidential

**Scopes:**
- `openid`
- `email`
- `profile`

**Grant Types:**
- Authorization Code
- Refresh Token

### 3. Session Configuration

The application uses `express-session` for session management.

**Important for Docker/Local Development:**
- `secure` cookie flag is set to `false` (allows HTTP)
- `sameSite` is set to `lax` (allows cross-origin redirects)
- Set `secure: true` only when using HTTPS in production

## Common Issues

### "Invalid session state" Error (400)

**Cause:** Session data is lost between the `/auth/login` and `/auth/callback` requests.

**Solutions:**

1. **Check Cookie Configuration**
   - Ensure `secure: false` for HTTP (development)
   - Ensure `sameSite: 'lax'` (not 'strict')
   - Browser should accept cookies from localhost

2. **Check Environment Variables**
   ```bash
   # Make sure these match
   AUTHENTIK_REDIRECT_URI=http://localhost:3001/auth/callback
   CLIENT_URL=http://localhost:5173
   ```

3. **Verify Session Secret**
   ```bash
   # Must be at least 32 characters
   SESSION_SECRET=your_secure_session_secret_min_32_chars
   ```

4. **Check Docker Environment**
   ```bash
   # Rebuild containers after .env changes
   docker-compose down
   docker-compose up -d --build backend
   ```

5. **Browser DevTools Check**
   - Open Network tab
   - Check cookies after visiting `/auth/login`
   - Should see `connect.sid` cookie set
   - Cookie should be sent with `/auth/callback` request

### "State mismatch" Error

**Cause:** CSRF state parameter doesn't match.

**Solutions:**
- Clear browser cookies
- Ensure no proxy/middleware is stripping cookies
- Check that the same session store is used across requests

### CORS Issues

**Symptoms:**
- Cookies not being sent
- Preflight requests failing

**Solutions:**

1. **Check CORS configuration in server:**
   ```typescript
   app.use(cors({
     origin: config.clientUrl,  // http://localhost:5173
     credentials: true,
   }));
   ```

2. **Check API client configuration:**
   ```typescript
   const apiClient = axios.create({
     baseURL: import.meta.env.VITE_API_URL,
     withCredentials: true,  // Important!
   });
   ```

3. **Verify environment variables:**
   ```bash
   # Backend
   CLIENT_URL=http://localhost:5173

   # Frontend
   VITE_API_URL=http://localhost:3001
   ```

### Callback URL Mismatch

**Symptoms:**
- Redirect fails
- "redirect_uri_mismatch" error from Authentik

**Solutions:**

1. **Verify redirect URI in Authentik matches exactly:**
   - Development: `http://localhost:3001/auth/callback`
   - NO trailing slash
   - Match protocol (http vs https)
   - Match port number

2. **Check environment variable:**
   ```bash
   AUTHENTIK_REDIRECT_URI=http://localhost:3001/auth/callback
   ```

## Authentication Flow

1. **User clicks "Login"**
   - Frontend calls `GET /auth/login`
   - Backend generates PKCE code verifier/challenge
   - Backend stores verifier and state in session
   - Backend returns Authentik authorization URL
   - Frontend redirects to Authentik

2. **User authenticates in Authentik**
   - User logs in to Authentik
   - Authentik redirects to callback URL with `code` and `state`

3. **Backend handles callback**
   - `GET /auth/callback?code=...&state=...`
   - Backend verifies state matches session
   - Backend exchanges code for tokens using PKCE verifier
   - Backend fetches user info
   - Backend stores user in session
   - Backend redirects to frontend

4. **Frontend completes login**
   - Frontend receives redirect to `/auth/callback?success=true`
   - Frontend calls `GET /auth/me` to get user data
   - User is logged in

## Testing Authentication

### 1. Test Login Flow

```bash
# 1. Start backend
docker-compose up backend

# 2. Check login endpoint
curl http://localhost:3001/auth/login

# Should return:
# {"success":true,"data":{"url":"https://authentik.../authorize?..."}}
```

### 2. Check Session Cookie

```bash
# Make request and save cookies
curl -c cookies.txt http://localhost:3001/auth/login

# View cookies
cat cookies.txt
# Should see 'connect.sid' cookie
```

### 3. Test Me Endpoint

```bash
# Without session (should fail)
curl http://localhost:3001/auth/me
# {"success":false,"error":"Not authenticated"}

# With valid session (after login)
# Check in browser DevTools after successful login
```

## Production Deployment

For production with HTTPS:

1. **Update session configuration:**
   ```typescript
   cookie: {
     secure: true,  // Requires HTTPS
     httpOnly: true,
     sameSite: 'strict',
   }
   ```

2. **Update environment variables:**
   ```bash
   NODE_ENV=production
   AUTHENTIK_REDIRECT_URI=https://your-domain.com/auth/callback
   CLIENT_URL=https://your-frontend-domain.com
   ```

3. **Configure reverse proxy** (nginx, Traefik, etc.)
   - Enable HTTPS
   - Forward auth headers
   - Set `X-Forwarded-Proto` header

4. **Use session store** (Redis, PostgreSQL)
   - Install `connect-redis` or similar
   - Configure session store in `index.ts`

## Security Notes

- **Never commit `.env` file** - Contains secrets
- **Rotate SESSION_SECRET regularly** in production
- **Use HTTPS in production** - Required for secure cookies
- **Validate redirect URIs** - Prevent open redirects
- **Short session lifetime** - Default 24 hours, adjust as needed
