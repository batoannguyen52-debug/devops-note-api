const request = require('supertest');
const app = require('./server');
const mongoose = require('mongoose');

// Nới lỏng thời gian chờ lên hẳn 30 giây cho môi trường ảo
jest.setTimeout(30000);

beforeAll(async () => {
  // Ép test phải đợi DB kết nối thành công 100% trước khi chạy API
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notedb');
  }
});

describe('GET /notes', () => {
  it('should return a list of notes or empty array with status 200', async () => {
    const res = await request(app).get('/notes');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});

afterAll(async () => {
  // Dọn dẹp sạch sẽ tiến trình sau khi Test xong
  await mongoose.disconnect();
});