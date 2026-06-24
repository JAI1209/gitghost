const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendReviewCompleteEmail({ to, username, prTitle, prUrl, driftScore, repoName }) {
  const scoreColor = driftScore >= 80 ? '#4ade80' : driftScore >= 60 ? '#facc15' : '#f87171';

  await transporter.sendMail({
    from: `"GitGhost 👻" <${process.env.EMAIL_USER}>`,
    to,
    subject: `PR Review Complete — ${prTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d1117;color:#e6edf3;padding:32px;border-radius:12px">
        <h2 style="margin:0 0 8px">👻 GitGhost Review Done</h2>
        <p style="color:#8892b0;margin:0 0 24px">Hey ${username}, your PR has been reviewed.</p>

        <div style="background:#141720;border-radius:8px;padding:20px;margin-bottom:20px">
          <p style="margin:0 0 4px;color:#8892b0;font-size:12px">${repoName}</p>
          <p style="margin:0;font-weight:600">${prTitle}</p>
        </div>

        <div style="text-align:center;margin-bottom:24px">
          <p style="color:#8892b0;font-size:13px;margin:0 0 4px">Style Drift Score</p>
          <p style="font-size:48px;font-weight:700;color:${scoreColor};margin:0">${driftScore}</p>
          <p style="color:#8892b0;font-size:12px;margin:4px 0 0">/ 100 — higher is better</p>
        </div>

        <a href="${prUrl}" style="display:block;text-align:center;background:#7c5cfc;color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:600">
          View Full Review →
        </a>

        <p style="color:#8892b0;font-size:11px;text-align:center;margin-top:24px">GitGhost · AI code reviewer that knows your style</p>
      </div>
    `,
  });
}

module.exports = { sendReviewCompleteEmail };