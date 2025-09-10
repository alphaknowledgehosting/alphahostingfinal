const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  problemId: {
    type: String,
    required: true,
    index: true
  },
  sheetId: {
    type: String,
    required: true,
    index: true
  },
  sectionId: {
    type: String,
    required: true,
    index: true
  },
  subsectionId: {
    type: String,
    required: true,
    index: true
  },
  difficulty: { // 🆕 NEW FIELD
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    // required: true,
    index: true
  },
  isCompleted: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: {
    type: Date,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for efficient queries
ProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });
ProgressSchema.index({ userId: 1, sheetId: 1 });
ProgressSchema.index({ userId: 1, sectionId: 1 });
ProgressSchema.index({ userId: 1, subsectionId: 1 });
ProgressSchema.index({ userId: 1, isCompleted: 1 });
ProgressSchema.index({ userId: 1, completedAt: -1 });
ProgressSchema.index({ userId: 1, difficulty: 1 }); // 🆕 NEW INDEX
ProgressSchema.index({ userId: 1, sheetId: 1, difficulty: 1 }); // 🆕 NEW INDEX

module.exports = mongoose.model('Progress', ProgressSchema);
