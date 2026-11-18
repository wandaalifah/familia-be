// Credential columns that must never leave the API
export const USER_SECRET_OMIT = { password: true, hashed_refresh_token: true } as const;
