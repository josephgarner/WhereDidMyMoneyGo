import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  authentik: {
    issuer: process.env.AUTHENTIK_ISSUER || '',
    clientId: process.env.AUTHENTIK_CLIENT_ID || '',
    clientSecret: process.env.AUTHENTIK_CLIENT_SECRET || '',
    redirectUri: process.env.AUTHENTIK_REDIRECT_URI || 'http://localhost:3001/auth/callback',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

export function validateConfig() {
  const required = [
    'AUTHENTIK_ISSUER',
    'AUTHENTIK_CLIENT_ID',
    'AUTHENTIK_CLIENT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn('Please copy .env.example to .env and fill in the values');
  }
}
