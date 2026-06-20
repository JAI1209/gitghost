# 👻 GitGhost — Your Personal AI Code Reviewer

> "GitHub Copilot knows code. GitGhost knows **you**."

GitGhost learns your personal coding style from your GitHub repos and reviews every PR like *you* would — catching naming drift, pattern violations, and architectural inconsistencies in real-time.

---

## 🗂 Project Structure

```
gitghost/
├── backend/          # Node.js + Express API
│   ├── config/       # Passport OAuth config
│   ├── middleware/   # Auth guard
│   ├── models/       # Mongoose schemas (User, Repo, Review)
│   ├── routes/       # auth, repos, reviews, webhooks, dashboard
│   ├── services/     # GitHub API, AST fingerprinter, Claude reviewer
│   ├── workers/      # BullMQ scan + review workers
│   └── server.js
└── frontend/         # React + Vite + Tailwind
    └── src/
        ├── pages/    # Landing, Login, Dashboard, Repos, ReviewDetail
        ├── components/ # Layout, Sidebar
        ├── hooks/    # useAuth
        └── utils/    # axios instance
```

---

## ⚙️ Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- GitHub OAuth App
- Anthropic API key

---

## 🚀 Setup — Step by Step

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**
2. Set:
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:5000/auth/github/callback`
3. Copy **Client ID** and **Client Secret**

### 3. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Fill in `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gitghost
GITHUB_CLIENT_ID=<from step 2>
GITHUB_CLIENT_SECRET=<from step 2>
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback
GITHUB_WEBHOOK_SECRET=any_random_string_you_choose
ANTHROPIC_API_KEY=sk-ant-...
SESSION_SECRET=another_random_long_string
JWT_SECRET=yet_another_random_string
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
BACKEND_URL=https://your-public-url.com   # needed for webhook registration
```

### 4. Start services

```bash
# Terminal 1 — MongoDB (if local)
mongod

# Terminal 2 — Redis (if local)
redis-server

# Terminal 3 — Backend
cd backend
npm run dev

# Terminal 4 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:3000**

---

## 🔗 GitHub Webhooks (for PR auto-review)

GitGhost registers webhooks automatically when you connect a repo. For this to work during local development, your backend needs a public URL. Use **ngrok**:

```bash
# Install ngrok, then:
ngrok http 5000
```

Set `BACKEND_URL=https://xxxx.ngrok.io` in your `.env` and restart the backend.

---

## 📋 What YOU Need to Do After Setup

These parts require your manual configuration or external services:

| Task | What to do |
|------|-----------|
| **GitHub OAuth App** | Create at github.com/settings/developers |
| **Anthropic API Key** | Get at console.anthropic.com |
| **MongoDB** | Use local install or MongoDB Atlas (free tier) |
| **Redis** | Use local install or Upstash (free tier at upstash.com) |
| **Public URL for webhooks** | Use ngrok locally, or deploy backend to Render/Railway |
| **Domain for production** | Deploy frontend to Vercel/Netlify, backend to Render |

---

## 🌐 Production Deployment

### Backend → Render (free tier)
1. Push code to GitHub
2. Create a new **Web Service** on render.com
3. Set all environment variables
4. Deploy

### Frontend → Vercel
1. Push frontend to GitHub
2. Import to vercel.com
3. Set `VITE_API_URL` if needed (defaults to same origin via proxy)

---

## 💰 Pricing Plans (built-in)

| Plan | Price | Repos | Reviews/month |
|------|-------|-------|---------------|
| Free | ₹0 | 1 | 50 |
| Pro | ₹499/mo | 10 | Unlimited |
| Team | ₹1999/mo | Unlimited | Unlimited |

*(Enforcement logic can be added in the review worker's plan check)*

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Auth | Passport.js + GitHub OAuth 2.0 |
| Database | MongoDB + Mongoose |
| AI Engine | Claude API (claude-sonnet-4-6) |
| Job Queue | BullMQ + Redis |
| AST Parsing | @babel/parser + @babel/traverse |
| Webhooks | GitHub Webhooks |

---

Built by **Jai Surya Kumar** · [GitHub](https://github.com/JAI1209) · [Portfolio](https://jaiportfolioreact.netlify.app)
