import { Router } from 'express';
import * as oauth from 'openid-client';
import {
  getAuthentikConfig,
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
    const authConfig = getAuthentikConfig();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store code verifier and state in session
    req.session.codeVerifier = codeVerifier;
    req.session.state = state;

    const issuerUrl = new URL(authConfig.issuer);
    const authUrl = oauth.buildAuthorizationUrl(issuerUrl, {
      client_id: authConfig.clientId,
      redirect_uri: authConfig.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    res.json({ success: true, data: { url: authUrl.href } });
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
    const authConfig = getAuthentikConfig();
    const { codeVerifier, state } = req.session;

    if (!codeVerifier || !state) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session state'
      });
    }

    const currentUrl = new URL(
      req.url,
      `${req.protocol}://${req.get('host')}`
    );

    // Verify state matches
    const params = oauth.validateAuthResponse(
      new URL(authConfig.issuer),
      authConfig.clientId,
      currentUrl,
      state
    );

    if (oauth.isOAuth2Error(params)) {
      console.error('OAuth error:', params);
      return res.redirect(`${config.clientUrl}/auth/callback?success=false`);
    }

    const issuerUrl = new URL(authConfig.issuer);
    const authorizationServer = await oauth
      .discoveryRequest(issuerUrl)
      .then((response) => oauth.processDiscoveryResponse(issuerUrl, response));

    const tokenSet = await oauth
      .authorizationCodeGrantRequest(
        authorizationServer,
        authConfig,
        params,
        authConfig.redirectUri,
        codeVerifier
      )
      .then((response) =>
        oauth.processAuthorizationCodeResponse(
          authorizationServer,
          authConfig,
          response
        )
      );

    const claims = oauth.getValidatedIdTokenClaims(tokenSet);

    // Get additional user info if needed
    let userInfo: any = claims;
    if (authorizationServer.userinfo_endpoint && tokenSet.access_token) {
      const userInfoResponse = await oauth.userInfoRequest(
        authorizationServer,
        authConfig,
        tokenSet.access_token
      );
      userInfo = await oauth.processUserInfoResponse(
        authorizationServer,
        authConfig,
        claims.sub,
        userInfoResponse
      );
    }

    const authentikUser = userInfo as AuthentikUserInfo;

    // Map Authentik user to our User type
    const user: User = {
      id: authentikUser.sub,
      email: authentikUser.email,
      username: authentikUser.preferred_username || authentikUser.email,
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
