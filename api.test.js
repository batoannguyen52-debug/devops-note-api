const request = require('supertest');
const app = require('./server');
const mongoose = require('mongoose');

// Tăng giới hạn thời gian chờ của Jest lên 20 giây (20000 ms)
jest.setTimeout(20000);

describe('GET /notes', () => {
  it('should return a list of notes or empty array with status 200', async () => {
    const res = await request(app).get('/notes');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});

afterAll(async () => {
  // Buộc ngắt toàn bộ kết nối Database sau khi test xong để không bị treo hook
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});