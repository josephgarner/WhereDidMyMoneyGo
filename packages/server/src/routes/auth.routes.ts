import { Router } from 'express';
import {
  getAuthentikClient,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState
} from '../config/authentik';
import { config } from '../config/env';
import { User, AuthentikUserInfo, ApiResponse } from '@finances/shared';

const router = Router();

// Start authentication flow
router.get('/login', (req, res) => {
  try {
    const client = getAuthentikClient();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store code verifier and state in session
    req.session.codeVerifier = codeVerifier;
    req.session.state = state;

    const authUrl = client.authorizationUrl({
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    res.json({ success: true, data: { url: authUrl } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate login'
    });
  }
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const client = getAuthentikClient();
    const params = client.callbackParams(req);
    const { codeVerifier, state } = req.session;

    if (!codeVerifier || !state) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session state'
      });
    }

    // Verify state matches
    if (params.state !== state) {
      return res.status(400).json({
        success: false,
        error: 'State mismatch'
      });
    }

    // Manually exchange the authorization code for tokens
    // This avoids the encrypted ID token validation issue
    const tokenSet = await client.grant({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: config.authentik.redirectUri,
      code_verifier: codeVerifier,
    });

    // Get user info from userinfo endpoint
    const userInfo = await client.userinfo(tokenSet.access_token!);
    const authentikUser = userInfo as AuthentikUserInfo;

    // Map Authentik user to our User type
    const user: User = {
      id: authentikUser.sub,
      email: authentikUser.email,
      username: authentikUser.preferred_username,
      name: authentikUser.name,
      groups: authentikUser.groups,
    };

    // Store user in session
    req.session.user = user;

    // Clear temporary session data
    delete req.session.codeVerifier;
    delete req.session.state;

    // Redirect to client
    res.redirect(`${config.clientUrl}/auth/callback?success=true`);
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${config.clientUrl}/auth/callback?success=false`);
  }
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
  }

  const response: ApiResponse<User> = {
    success: true,
    data: req.session.user,
  };

  res.json(response);
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to logout'
      });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  });
});

export default router;
