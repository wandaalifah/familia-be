const MIN_SECRET_LENGTH = 32;

// The app must never sign tokens with a guessable fallback: fail fast at startup instead.
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters long`,
    );
  }

  return secret;
};
