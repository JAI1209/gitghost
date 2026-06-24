const router = require('express').Router();
const User = require('../models/User');
const Repo = require('../models/Repo');
const Review = require('../models/Review');

// GET /api/profile/:username — public, no auth
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('username displayName avatar plan createdAt');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const repos = await Repo.find({ userId: user._id, scanStatus: 'ready' })
      .select('name fullName driftScore language')
      .sort({ driftScore: -1 });

    const reviews = await Review.find({ userId: user._id, status: 'complete' })
      .select('prTitle prNumber driftScore repoId createdAt')
      .populate('repoId', 'name fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    const allReviews = await Review.find({ userId: user._id, status: 'complete' });
    const avgDrift = allReviews.length
      ? Math.round(allReviews.reduce((a, r) => a + (r.driftScore || 0), 0) / allReviews.length)
      : null;

    res.json({
      user,
      stats: {
        totalReviews: allReviews.length,
        avgDrift,
        reposConnected: repos.length,
      },
      repos,
      recentReviews: reviews,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;