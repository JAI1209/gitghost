const mongoose = require('mongoose');

const repoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  githubRepoId: { type: Number, required: true },
  fullName: { type: String, required: true },   // "username/repo-name"
  name: String,
  description: String,
  private: Boolean,
  language: String,
  defaultBranch: { type: String, default: 'main' },
  webhookId: Number,                             // GitHub webhook ID for this repo
  scanStatus: {
    type: String,
    enum: ['pending', 'scanning', 'complete', 'error'],
    default: 'pending',
  },
  lastScannedAt: Date,
  styleProfile: {
    namingConventions: {
      variables: String,      // camelCase | snake_case | PascalCase
      functions: String,
      files: String,
      components: String,
    },
    avgFunctionLength: Number,
    avgNestingDepth: Number,
    commentDensity: Number,   // comments per 100 lines
    semicolonUsage: String,   // always | never | mixed
    quoteStyle: String,       // single | double | mixed
    indentSize: Number,
    patterns: [String],       // e.g. ["uses arrow functions", "prefers async/await"]
    summary: String,          // Claude-generated plain-English style summary
  },
  driftScore: { type: Number, default: 100 },   // 0-100, higher = more consistent
  totalReviews: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

repoSchema.index({ userId: 1, githubRepoId: 1 }, { unique: true });

module.exports = mongoose.model('Repo', repoSchema);
