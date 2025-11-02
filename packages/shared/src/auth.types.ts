export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  groups?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
}

export interface AuthUser extends User {
  tokens: AuthTokens;
}

export interface AuthentikUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  preferred_username: string;
  nickname?: string;
  groups?: string[];
}
