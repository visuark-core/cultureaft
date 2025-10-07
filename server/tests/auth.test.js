const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwtService = require('../services/jwtService');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth Service', () => {
  it('should generate a valid access token', () => {
    const user = { _id: new mongoose.Types.ObjectId(), role: 'user' };
    const token = jwtService.generateAccessToken(user);
    const decoded = jwtService.verifyToken(token);
    expect(decoded.id).toBe(user._id.toString());
    expect(decoded.role).toBe(user.role);
  });

  it('should generate a random refresh token', () => {
    const token1 = jwtService.generateRefreshToken();
    const token2 = jwtService.generateRefreshToken();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(128);
  });

  it('should throw an error for an invalid token', () => {
    expect(() => jwtService.verifyToken('invalidtoken')).toThrow();
  });

  it('should correctly handle password reset tokens', async () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    await user.save();

    const resetToken = user.generatePasswordResetToken();
    expect(user.passwordResetToken.token).toBeDefined();
    expect(user.passwordResetToken.expiresAt).toBeDefined();

    const isValid = user.verifyPasswordResetToken(resetToken);
    expect(isValid).toBe(true);

    user.clearPasswordResetToken();
    expect(user.passwordResetToken).toBeUndefined();
  });
});