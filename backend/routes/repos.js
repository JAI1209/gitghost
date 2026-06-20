const router = require('express').Router();
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const { requireAuth } = require('../middleware/auth');
const Repo = require('../models/Repo');
const { listRepos, createWebhook, deleteWebhook } = require('../services/githubService');

const connection = new IORedis(process.env.REDIS_URL, { 
  maxRetriesPerRequest: null,
  tls: {},
});
const scanQueue = new Queue('scan-repo', { connection });

// GET /api/repos
router.get('/', requireAuth, async (req, res) => {
  const repos = await Repo.find({ userId: req.user._id, active: true }).sort({ updatedAt: -1 });
  res.json({ repos });
});

// GET /api/repos/available
router.get('/available', requireAuth, async (req, res) => {
  try {
    const ghRepos = await listRepos(req.user.accessToken);
    const connected = await Repo.find({ userId: req.user._id }).select('githubRepoId');
    const connectedIds = new Set(connected.map(r => r.githubRepoId));
    const available = ghRepos.filter(r => !connectedIds.has(r.id)).map(r => ({
      id: r.id,
      fullName: r.full_name,
      name: r.name,
      description: r.description,
      private: r.private,
      language: r.language,
      defaultBranch: r.default_branch,
    }));
    res.json({ repos: available });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repos — connect a repo
router.post('/', requireAuth, async (req, res) => {
  const { githubRepoId, fullName, name, description, private: isPrivate, language, defaultBranch } = req.body;
  if (!githubRepoId || !fullName) return res.status(400).json({ error: 'githubRepoId and fullName required' });

  const existing = await Repo.findOne({ userId: req.user._id, githubRepoId });
  if (existing) return res.status(409).json({ error: 'Repo already connected' });

  const repo = await Repo.create({
    userId: req.user._id,
    githubRepoId,
    fullName,
    name,
    description,
    private: isPrivate,
    language,
    defaultBranch: defaultBranch || 'main',
  });

  // Register webhook on GitHub
  try {
    const [owner, repoName] = fullName.split('/');
    const webhookUrl = `${process.env.BACKEND_URL || 'https://your-backend.com'}/webhooks/github`;
    const hook = await createWebhook(req.user.accessToken, owner, repoName, webhookUrl, process.env.GITHUB_WEBHOOK_SECRET);
    await Repo.findByIdAndUpdate(repo._id, { webhookId: hook.id });
  } catch (err) {
    console.warn('⚠️  Could not register webhook:', err.message);
  }

  // Queue scan
  await scanQueue.add('scan', { 
    repoId: repo._id.toString(),
    userId: req.user._id.toString()
  }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });

  res.status(201).json({ repo });
});

// DELETE /api/repos/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
  if (!repo) return res.status(404).json({ error: 'Not found' });

  if (repo.webhookId) {
    try {
      const [owner, repoName] = repo.fullName.split('/');
      await deleteWebhook(req.user.accessToken, owner, repoName, repo.webhookId);
    } catch {}
  }

  await Repo.findByIdAndUpdate(repo._id, { active: false });
  res.json({ success: true });
});

// POST /api/repos/:id/scan — manual rescan
router.post('/:id/scan', requireAuth, async (req, res) => {
  const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
  if (!repo) return res.status(404).json({ error: 'Not found' });
  
  await Repo.findByIdAndUpdate(repo._id, { scanStatus: 'pending' });
  await scanQueue.add('scan', { 
    repoId: repo._id.toString(),
    userId: req.user._id.toString()
  }, { attempts: 3 });
  
  res.json({ success: true, message: 'Scan queued' });
});

module.exports = router;