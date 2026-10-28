const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Sử dụng biến môi trường cho Database
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notedb';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Database connection error:', err));

const Note = mongoose.model('Note', new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
}));

app.get('/notes', async (req, res) => {
  const notes = await Note.find().sort({ createdAt: -1 });
  res.json(notes);
});

app.post('/notes', async (req, res) => {
  const newNote = await Note.create(req.body);
  res.status(201).json(newNote);
});

// Phục vụ chạy Test: Chỉ listen khi không bị require bởi Jest
if (require.main === module) {
  app.listen(3000, () => console.log('🚀 API Server running on port 3000'));
}
module.exports = app;