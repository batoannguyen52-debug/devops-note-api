const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Kết nối MongoDB local
mongoose.connect('mongodb://127.0.0.1:27017/notedb')
  .then(() => console.log('✅ Connected to MongoDB (notedb)'))
  .catch(err => console.error('❌ Database connection error:', err));

// Định nghĩa Model Note
const Note = mongoose.model('Note', new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
}));

// API Lấy danh sách ghi chú
app.get('/notes', async (req, res) => {
  const notes = await Note.find().sort({ createdAt: -1 });
  res.json(notes);
});

// API Tạo ghi chú mới
app.post('/notes', async (req, res) => {
  const newNote = await Note.create(req.body);
  res.status(201).json(newNote);
});

// API Xoá ghi chú
app.delete('/notes/:id', async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.json({ message: 'Note deleted' });
});

app.listen(3000, () => console.log('🚀 Note API Server running on port 3000'));