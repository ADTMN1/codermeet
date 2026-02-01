const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    enum: ['BookOpen', 'FileText', 'Github', 'Code', 'Database', 'Globe', 'Package', 'Settings']
  },
  color: {
    type: String,
    required: true,
    enum: ['text-purple-400', 'text-blue-400', 'text-cyan-400', 'text-green-400', 'text-yellow-400', 'text-red-400', 'text-indigo-400']
  },
  bgColor: {
    type: String,
    required: true,
    enum: ['bg-purple-500/10', 'bg-blue-500/10', 'bg-cyan-500/10', 'bg-green-500/10', 'bg-yellow-500/10', 'bg-red-500/10', 'bg-indigo-500/10']
  },
  category: {
    type: String,
    required: true,
    enum: ['template', 'documentation', 'ui', 'tool', 'tutorial', 'library'],
    default: 'tool'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
resourceSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
