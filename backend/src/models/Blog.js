const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String },
  content: { type: String, required: true },
  category: { type: String },
  image: { type: String },
  tags: [String],
  author: { type: String },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  publishedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
