const axios = require('axios');

const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const gh = (token) => axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

async function listRepos(token) {
  const api = gh(token);
  const repos = [];
  let page = 1;
  while (true) {
    const { data } = await api.get('/user/repos', {
      params: { per_page: 100, page, sort: 'updated', affiliation: 'owner' },
    });
    repos.push(...data);
    if (data.length < 100) break;
    page++;
  }
  return repos;
}

async function getTree(token, owner, repo, branch = 'main') {
  const api = gh(token);
  const { data } = await api.get(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  return data.tree;
}

async function getFileContent(token, owner, repo, path) {
  const api = gh(token);
  try {
    const { data } = await api.get(`/repos/${owner}/${repo}/contents/${path}`);
    if (data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }
    return data.content;
  } catch {
    return null;
  }
}

async function getRepoFiles(token, fullName, branch = 'main') {
  const [owner, repo] = fullName.split('/');
  const tree = await getTree(token, owner, repo, branch);

  const jsFiles = tree.filter(f =>
    f.type === 'blob' &&
    /\.(js|jsx|ts|tsx)$/.test(f.path) &&
    !f.path.includes('node_modules')
  ).slice(0, 20);

  const files = [];
  for (const file of jsFiles) {
    const content = await getFileContent(token, owner, repo, file.path);
    if (content) files.push({ path: file.path, content });
  }
  return files;
}

async function getPRDiff(token, owner, repo, prNumber) {
  const api = gh(token);
  const { data: pr } = await api.get(`/repos/${owner}/${repo}/pulls/${prNumber}`);
  const { data: files } = await api.get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`);
  return { pr, files };
}

async function postPRReview(token, owner, repo, prNumber, body, comments = []) {
  const api = gh(token);
  const { data } = await api.post(`/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
    body,
    event: 'COMMENT',
    comments: comments.map(c => ({
      path: c.file,
      line: c.line,
      body: `**[GitGhost ${c.severity?.toUpperCase() || 'INFO'}]** ${c.message}${c.suggestion ? `\n\n💡 **Suggestion:** ${c.suggestion}` : ''}${c.pastExample ? `\n\n📌 ${c.pastExample}` : ''}`,
    })).filter(c => c.path && c.line),
  });
  return data;
}

async function createWebhook(token, owner, repo, webhookUrl, secret) {
  const api = gh(token);
  const { data } = await api.post(`/repos/${owner}/${repo}/hooks`, {
    name: 'web',
    active: true,
    events: ['pull_request', 'push'],
    config: {
      url: webhookUrl,
      content_type: 'json',
      secret,
    },
  });
  return data;
}

async function deleteWebhook(token, owner, repo, hookId) {
  const api = gh(token);
  await api.delete(`/repos/${owner}/${repo}/hooks/${hookId}`);
}

module.exports = { listRepos, getTree, getFileContent, getRepoFiles, getPRDiff, postPRReview, createWebhook, deleteWebhook };