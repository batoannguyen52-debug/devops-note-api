process.env.NODE_ENV = 'test';
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('./server');

let mongoServer;

// Tăng thời gian chờ cho Jest khi khởi tạo MongoDB RAM
jest.setTimeout(60000);

// Khởi tạo kết nối DB trước khi test: ưu tiên MONGO_URI, fallback về RAM DB
beforeAll(async () => {
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
  } else {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }
});

// Ngắt kết nối và giải phóng tài nguyên sau khi test xong
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('GET /notes', () => {
  it('should return a list of notes or empty array with status 200', async () => {
    const res = await request(app).get('/notes');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});

describe('POST /notes', () => {
  it('should create a new note with status 201', async () => {
    const noteData = { title: 'Test Note CI/CD', content: 'Testing automated workflow', category: 'DevOps' };
    const res = await request(app).post('/notes').send(noteData);
    expect(res.statusCode).toEqual(201);
    expect(res.body.title).toEqual(noteData.title);
    expect(res.body.content).toEqual(noteData.content);
    expect(res.body.category).toEqual('DevOps');
    expect(res.body).toHaveProperty('_id');
  });
});

describe('DELETE /notes/:id', () => {
  it('should delete an existing note with status 200', async () => {
    const noteRes = await request(app)
      .post('/notes')
      .send({ title: 'Temporary Note', content: 'To be deleted' });
    const noteId = noteRes.body._id;

    const res = await request(app).delete(`/notes/${noteId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toContain('thành công');
  });

  it('should return 404 when deleting a non-existent note', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/notes/${fakeId}`);
    expect(res.statusCode).toEqual(404);
  });
});