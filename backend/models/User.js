const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  displayName: String,
  email: String,
  avatar: String,
  accessToken: String,
  plan: { type: String, enum: ['free', 'pro', 'team'], default: 'free' },
  reviewsThisMonth: { type: Number, default: 0 },
  reviewsResetAt: { type: Date, default: () => new Date() },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
