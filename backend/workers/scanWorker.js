const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const { Worker } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {},
});

connection.on('connect', () => console.log('✅ Redis connected (scanWorker)'));
connection.on('error', (e) => console.error('❌ Redis error:', e.message));

const worker = new Worker('scan-repo', async (job) => {
  const { repoId, userId } = job.data;
  console.log(`📂 Scanning repo ${repoId}...`);

  // Lazy imports to avoid circular dependency
  const Repo = require('../models/Repo');
  const User = require('../models/User');
  const { getRepoFiles } = require('../services/githubService');
  const { analyseFile, buildStyleProfile } = require('../services/astService');
  const { generateStyleSummary } = require('../services/claudeService');

  try {
    const repo = await Repo.findById(repoId);
    const user = await User.findById(userId);

    if (!repo || !user) throw new Error('Repo or user not found');

    await Repo.findByIdAndUpdate(repoId, { scanStatus: 'scanning' });

    const token = user.githubAccessToken || user.accessToken;
    const files = await getRepoFiles(token, repo.fullName, repo.defaultBranch || 'main');

    console.log(`📄 Found ${files.length} files to scan`);

    const analyses = [];
    for (const file of files) {
      try {
        const analysis = await analyseFile(file.content, file.path);
        if (analysis) analyses.push(analysis);
      } catch (e) {
        console.warn(`⚠️ Skipped ${file.path}:`, e.message);
      }
    }

    const styleProfile = buildStyleProfile(analyses);
    const summary = await generateStyleSummary(styleProfile);

    await Repo.findByIdAndUpdate(repoId, {
      scanStatus: 'ready',
      styleProfile: { ...styleProfile, summary },
    });

    console.log(`✅ Scan complete for ${repo.fullName}`);
  } catch (err) {
    console.error(`❌ Scan failed:`, err.message);
    const Repo = require('../models/Repo');
    await Repo.findByIdAndUpdate(repoId, { scanStatus: 'failed' });
  }
}, { connection });

worker.on('failed', (job, err) => {
  console.error(`❌ Job failed:`, err.message);
});

console.log('✅ Scan worker started');