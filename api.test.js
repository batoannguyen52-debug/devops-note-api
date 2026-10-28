const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('GET /notes', () => {
  it('should return a list of notes or empty array with status 200', async () => {
    const res = await request(app).get('/notes');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});

afterAll(async () => {
  await mongoose.connection.close(); // Đóng kết nối sau khi test xong
});