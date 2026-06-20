const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const Review = require('../models/Review');
const Repo = require('../models/Repo');

// GET /api/reviews — all reviews for user
router.get('/', requireAuth, async (req, res) => {
  const { repoId, limit = 20, page = 1 } = req.query;
  const query = { userId: req.user._id };
  if (repoId) query.repoId = repoId;
  const reviews = await Review.find(query)
    .populate('repoId', 'fullName name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await Review.countDocuments(query);
  res.json({ reviews, total, page: Number(page) });
});

// GET /api/reviews/:id — single review
router.get('/:id', requireAuth, async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('repoId', 'fullName name styleProfile');
  if (!review) return res.status(404).json({ error: 'Not found' });
  res.json({ review });
});

module.exports = router;
