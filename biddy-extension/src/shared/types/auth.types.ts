export interface StoredUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  plan: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthCheckResult {
  loggedIn: boolean;
  user?: StoredUser;
}
