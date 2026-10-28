const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('./server');

let mongoServer;

// Khởi tạo một MongoDB chạy ngầm trong RAM trước khi test
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

// Ngắt kết nối và tắt Database RAM sau khi test xong
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('GET /notes', () => {
  it('should return a list of notes or empty array with status 200', async () => {
    const res = await request(app).get('/notes');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});