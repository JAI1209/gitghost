const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function profileToText(profile) {
  if (!profile) return 'No style profile available yet.';
  const lines = [
    `Function naming: ${profile.namingConventions?.functions || 'unknown'}`,
    `Variable naming: ${profile.namingConventions?.variables || 'unknown'}`,
    `Average function length: ${profile.avgFunctionLength || 'unknown'} lines`,
    `Average nesting depth: ${profile.avgNestingDepth || 'unknown'} levels`,
    `Comment density: ${profile.commentDensity || 0} comments per 100 lines`,
    `Semicolons: ${profile.semicolonUsage || 'unknown'}`,
    `Quote style: ${profile.quoteStyle || 'unknown'}`,
    `Patterns: ${(profile.patterns || []).join(', ') || 'none detected'}`,
  ];
  if (profile.summary) lines.push(`\nStyle summary: ${profile.summary}`);
  return lines.join('\n');
}

async function generateStyleSummary(profile) {
  // Temporary mock — add Anthropic credits to enable AI summary
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Based on these coding style metrics, write a 2-3 sentence plain-English description of this developer's coding style fingerprint:\n\n${profileToText(profile)}\n\nBe specific and concrete. Mention naming conventions, preferences, and any notable patterns.`,
      }],
    });
    return msg.content[0].text;
  } catch (err) {
    console.warn('⚠️  Claude API unavailable, using mock summary:', err.message);
    return `Developer uses ${profile?.namingConventions?.functions || 'standard'} naming conventions with an average function length of ${profile?.avgFunctionLength || 'unknown'} lines. Quote style: ${profile?.quoteStyle || 'unknown'}. Semicolons: ${profile?.semicolonUsage || 'unknown'}.`;
  }
}

async function reviewPRDiff(styleProfile, prFiles, prTitle = '') {
  const diffText = prFiles.map(f => {
    const header = `### ${f.filename} (+${f.additions} -${f.deletions})`;
    const patch = f.patch || '(binary or too large)';
    return `${header}\n\`\`\`diff\n${patch}\n\`\`\``;
  }).join('\n\n').slice(0, 12000);

  const systemPrompt = `You are GitGhost, a personal AI code reviewer. Your job is to review code changes ONLY against the developer's personal coding style — not general best practices.

The developer's style fingerprint:
${profileToText(styleProfile)}

Rules:
- ONLY flag deviations from THIS developer's own style — not general "best practices"
- If they always use camelCase and the PR uses snake_case, flag it
- If they always use semicolons and this PR doesn't, flag it
- Do NOT suggest improvements unless they contradict the developer's own patterns
- Be specific: reference the style profile data when explaining issues
- Tone: like a friendly colleague who knows the codebase well

Respond ONLY with valid JSON:
{
  "summary": "Overall review summary (2-3 sentences)",
  "driftScore": <0-100, where 100 = perfectly consistent with style>,
  "comments": [
    {
      "file": "path/to/file.js",
      "line": <line number in diff>,
      "type": "naming|style|pattern|structure|suggestion",
      "severity": "info|warning|error",
      "message": "What's inconsistent and why",
      "suggestion": "What to do instead",
      "pastExample": "Optional: reference to how they've done it before"
    }
  ]
}`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `PR Title: "${prTitle}"\n\nFiles changed:\n${diffText}`,
    }],
  });

  const raw = msg.content[0].text;
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      summary: raw.slice(0, 500),
      driftScore: 75,
      comments: [],
    };
  }
}

module.exports = { generateStyleSummary, reviewPRDiff, profileToText };