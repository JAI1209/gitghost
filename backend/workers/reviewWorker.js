const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const Repo = require('../models/Repo');
const Review = require('../models/Review');
const User = require('../models/User');
const { getPRDiff, postPRReview } = require('../services/githubService');
const { reviewPRDiff } = require('../services/claudeService');


const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);


const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker('review-pr', async (job) => {
  const { reviewId } = job.data;
  const start = Date.now();
  console.log(`📝 Starting review ${reviewId}`);

  const review = await Review.findById(reviewId);
  if (!review) throw new Error('Review not found');

  const repo = await Repo.findById(review.repoId);
  const user = await User.findById(review.userId);

  if (!user?.accessToken) throw new Error('No access token');
  if (!repo?.styleProfile?.summary) throw new Error('Repo not scanned yet');

  await Review.findByIdAndUpdate(reviewId, { status: 'processing' });

  try {
    const [owner, repoName] = repo.fullName.split('/');

    // Get PR diff from GitHub
    const { pr, files } = await getPRDiff(user.accessToken, owner, repoName, review.prNumber);
    job.updateProgress(30);

    // Call Claude for review
    const result = await reviewPRDiff(repo.styleProfile, files, pr.title);
    job.updateProgress(80);

    // Post review to GitHub
    let githubCommentId = null;
    try {
      const ghReview = await postPRReview(
        user.accessToken, owner, repoName, review.prNumber,
        `## 👻 GitGhost Review\n\n${result.summary}\n\n**Style Consistency Score: ${result.driftScore}/100**`,
        result.comments || []
      );
      githubCommentId = ghReview.id;
    } catch (ghErr) {
      console.warn('⚠️  Could not post to GitHub:', ghErr.message);
    }

    // Save review results
    await Review.findByIdAndUpdate(reviewId, {
      status: 'complete',
      driftScore: result.driftScore,
      summary: result.summary,
      comments: result.comments || [],
      githubCommentId,
      filesReviewed: files.length,
      linesChanged: files.reduce((acc, f) => acc + f.changes, 0),
      processingTimeMs: Date.now() - start,
    });

    // Update repo drift score (rolling average)
    const reviews = await Review.find({ repoId: repo._id, status: 'complete' }).sort({ createdAt: -1 }).limit(10);
    const avgDrift = Math.round(reviews.reduce((acc, r) => acc + (r.driftScore || 100), 0) / reviews.length);
    await Repo.findByIdAndUpdate(repo._id, {
      driftScore: avgDrift,
      $inc: { totalReviews: 1 },
    });

    // Increment user review count
    await User.findByIdAndUpdate(user._id, { $inc: { reviewsThisMonth: 1 } });

    console.log(`✅ Review ${reviewId} complete — drift score: ${result.driftScore}`);
    return { success: true, driftScore: result.driftScore };
  } catch (err) {
    await Review.findByIdAndUpdate(reviewId, { status: 'error' });
    throw err;
  }
}, { connection });

worker.on('failed', (job, err) => {
  console.error(`❌ Review job ${job.id} failed:`, err.message);
});

module.exports = worker;
