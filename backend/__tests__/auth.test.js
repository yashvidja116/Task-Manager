const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user and returns token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('rejects duplicate email', async () => {
      await User.create({ name: 'Existing', email: 'dup@example.com', password: 'password123' });
      const res = await request(app).post('/api/auth/register').send({
        name: 'Another',
        email: 'dup@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(400);
    });

    it('rejects invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'User',
        email: 'not-an-email',
        password: 'password123',
      });
      expect(res.status).toBe(400);
    });

    it('rejects short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'User',
        email: 'short@example.com',
        password: '123',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Test',
        email: 'login@example.com',
        password: 'password123',
      });
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('rejects wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
    });

    it('rejects non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user with valid token', async () => {
      const regRes = await request(app).post('/api/auth/register').send({
        name: 'Me Test',
        email: 'me@example.com',
        password: 'password123',
      });
      const token = regRes.body.data.token;

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('me@example.com');
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
