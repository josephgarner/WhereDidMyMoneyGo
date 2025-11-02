import { Issuer, Client, generators } from 'openid-client';
import { config } from './env';

let client: Client | null = null;

export async function initializeAuthentikClient(): Promise<Client> {
  if (client) {
    return client;
  }

  try {
    const issuer = await Issuer.discover(config.authentik.issuer);

    client = new issuer.Client({
      client_id: config.authentik.clientId,
      client_secret: config.authentik.clientSecret,
      redirect_uris: [config.authentik.redirectUri],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post',
    });

    console.log('Authentik client initialized successfully');
    return client;
  } catch (error) {
    console.error('Failed to initialize Authentik client:', error);
    throw error;
  }
}

export function getAuthentikClient(): Client {
  if (!client) {
    throw new Error('Authentik client not initialized. Call initializeAuthentikClient() first.');
  }
  return client;
}

export function generateCodeVerifier(): string {
  return generators.codeVerifier();
}

export function generateCodeChallenge(verifier: string): string {
  return generators.codeChallenge(verifier);
}

export function generateState(): string {
  return generators.state();
}
