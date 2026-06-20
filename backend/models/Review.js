const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  file: String,
  line: Number,
  type: { type: String, enum: ['style', 'pattern', 'naming', 'structure', 'suggestion'] },
  severity: { type: String, enum: ['info', 'warning', 'error'] },
  message: String,
  suggestion: String,
  pastExample: String,  // "In src/utils/format.js line 23, you used..."
});

const reviewSchema = new mongoose.Schema({
  repoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repo', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prNumber: Number,
  prTitle: String,
  prUrl: String,
  commitSha: String,
  status: { type: String, enum: ['pending', 'processing', 'complete', 'error'], default: 'pending' },
  driftScore: Number,       // consistency score for this PR (0-100)
  summary: String,          // Claude's overall review summary
  comments: [commentSchema],
  githubCommentId: Number,  // ID of the comment posted on GitHub
  filesReviewed: Number,
  linesChanged: Number,
  processingTimeMs: Number,
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
