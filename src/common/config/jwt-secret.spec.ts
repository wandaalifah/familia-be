import { getJwtSecret } from './jwt-secret';

describe('getJwtSecret', () => {
  const original = process.env.JWT_SECRET;
  afterEach(() => {
    process.env.JWT_SECRET = original;
  });

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow('JWT_SECRET');
  });

  it('throws when JWT_SECRET is too short', () => {
    process.env.JWT_SECRET = 'default-secret';
    expect(() => getJwtSecret()).toThrow('at least 32');
  });

  it('returns a strong secret', () => {
    process.env.JWT_SECRET = 'x'.repeat(40);
    expect(getJwtSecret()).toBe('x'.repeat(40));
  });
});
