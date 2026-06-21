const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {},
});
const reviewQueue = new Queue('review-pr', { connection });

function verifySignature(req) {
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return false;
  const secret = process.env.GITHUB_WEBHOOK_SECRET || '';
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(req.body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
  } catch {
    return false;
  }
}

router.post('/github', express.raw({ type: '*/*' }), async (req, res) => {
  console.log('📬 Webhook received!');

  if (!verifySignature(req)) {
    console.warn('⚠️ Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'];
  const payload = JSON.parse(req.body.toString());

  res.status(200).json({ received: true });

  if (event === 'pull_request' && ['opened', 'synchronize'].includes(payload.action)) {
    const { pull_request: pr, repository } = payload;
    console.log(`🔔 PR #${pr.number} "${pr.title}" in ${repository.full_name}`);

    try {
      const Repo = require('../models/Repo');
      const Review = require('../models/Review');

      const repo = await Repo.findOne({ githubRepoId: repository.id, active: true });
      if (!repo) {
        console.warn('⚠️ Repo not found:', repository.id);
        return;
      }

      if (!['ready', 'complete'].includes(repo.scanStatus)) {
        console.warn('⚠️ Repo not scanned yet:', repo.scanStatus);
        return;
      }

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

      console.log(`✅ PR #${pr.number} queued for review`);
    } catch (err) {
      console.error('❌ Webhook error:', err.message);
    }
  }
});

module.exports = router;