const router = require('express').Router();
const crypto = require('crypto');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const Repo = require('../models/Repo');
const Review = require('../models/Review');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
const reviewQueue = new Queue('review-pr', { connection });

// Raw body needed for HMAC verification
router.use(require('express').raw({ type: 'application/json' }));

function verifySignature(req) {
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return false;
  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET || '');
  const digest = 'sha256=' + hmac.update(req.body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
}

router.post('/github', async (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'];
  const payload = JSON.parse(req.body.toString());

  res.status(200).json({ received: true }); // Respond immediately

  // Handle PR opened/synchronized
  if (event === 'pull_request' && ['opened', 'synchronize'].includes(payload.action)) {
    const { pull_request: pr, repository } = payload;
    try {
      const repo = await Repo.findOne({ githubRepoId: repository.id, active: true });
      if (!repo || repo.scanStatus !== 'complete') return;

      const review = await Review.create({
        repoId: repo._id,
        userId: repo.userId,
        prNumber: pr.number,
        prTitle: pr.title,
        prUrl: pr.html_url,
        commitSha: pr.head.sha,
        status: 'pending',
      });

      await reviewQueue.add('review', { reviewId: review._id.toString() }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
      });

      console.log(`📬 PR #${pr.number} queued for review in ${repository.full_name}`);
    } catch (err) {
      console.error('Webhook handler error:', err);
    }
  }
});

module.exports = router;
