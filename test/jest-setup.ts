// Tests never read .env; provide a throwaway signing secret that satisfies getJwtSecret()
process.env.JWT_SECRET ??= 'test-only-secret-0123456789-abcdefghijklmnop';
