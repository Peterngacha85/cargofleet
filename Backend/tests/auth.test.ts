import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../src/utils/tokenUtils';

describe('tokenUtils', () => {
  const payload = { id: '123', email: 'driver@example.com', role: 'driver' as const };

  it('generates a verifiable access token', () => {
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('rejects an invalid token', () => {
    expect(() => verifyAccessToken('not-a-real-token')).toThrow();
  });

  it('generates a refresh token distinct from the access token', () => {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    expect(refreshToken).not.toEqual(accessToken);
  });
});
