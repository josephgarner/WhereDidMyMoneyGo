import * as oauth from 'openid-client';
import { config } from './env';

interface AuthentikConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

let authConfig: AuthentikConfig | null = null;

export async function initializeAuthentikClient(): Promise<void> {
  try {
    authConfig = {
      issuer: config.authentik.issuer,
      clientId: config.authentik.clientId,
      clientSecret: config.authentik.clientSecret,
      redirectUri: config.authentik.redirectUri,
    };

    // Verify the issuer is reachable
    const issuerUrl = new URL(config.authentik.issuer);
    await oauth.discoveryRequest(issuerUrl);

    console.log('Authentik client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Authentik client:', error);
    throw error;
  }
}

export function getAuthentikConfig(): AuthentikConfig {
  if (!authConfig) {
    throw new Error('Authentik client not initialized. Call initializeAuthentikClient() first.');
  }
  return authConfig;
}

export function generateCodeVerifier(): string {
  return oauth.randomPKCECodeVerifier();
}

export function generateCodeChallenge(verifier: string): string {
  return oauth.calculatePKCECodeChallenge(verifier);
}

export function generateState(): string {
  return oauth.randomState();
}
