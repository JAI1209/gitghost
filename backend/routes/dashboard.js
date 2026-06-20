const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const Review = require('../models/Review');
const Repo = require('../models/Repo');

// GET /api/dashboard — aggregated stats for logged-in user
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user._id;

  const [repos, recentReviews, reviewStats] = await Promise.all([
    Repo.find({ userId, active: true }).select('fullName name driftScore scanStatus totalReviews styleProfile language').sort({ updatedAt: -1 }),
    Review.find({ userId, status: 'complete' })
      .populate('repoId', 'fullName name')
      .sort({ createdAt: -1 })
      .limit(5),
    Review.aggregate([
      { $match: { userId, status: 'complete' } },
      { $group: { _id: null, avgDrift: { $avg: '$driftScore' }, totalReviews: { $sum: 1 }, totalComments: { $sum: { $size: '$comments' } } } },
    ]),
  ]);

  // Drift score over time (last 30 reviews)
  const driftHistory = await Review.find({ userId, status: 'complete', driftScore: { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(30)
    .select('driftScore createdAt repoId');

  res.json({
    repos,
    recentReviews,
    stats: reviewStats[0] || { avgDrift: 100, totalReviews: 0, totalComments: 0 },
    driftHistory: driftHistory.reverse(),
  });
});

module.exports = router;
