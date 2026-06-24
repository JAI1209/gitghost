<div align="center">

<img src="gitghost\assets\1.png" alt="GitGhost" width="140"/>

# GitGhost 👻

**The AI code reviewer that knows YOU.**

*GitHub Copilot knows code. GitGhost knows your style.*

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![GitHub OAuth](https://img.shields.io/badge/GitHub_OAuth-181717?style=flat&logo=github&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=flat&logo=groq&logoColor=white)

</div>

---

## What is GitGhost?

GitGhost is an AI-powered personal code reviewer that **learns your coding style** from your GitHub repositories and automatically reviews every PR — not against generic best practices, but against **your own patterns**.

> *"You use camelCase. You prefer arrow functions. You never use semicolons. GitGhost knows this — and flags when you drift."*

---

## How It Works


You connect your GitHub repo

↓

GitGhost scans your codebase (AST analysis)

↓

Builds your personal Style Fingerprint

↓

You open a PR on GitHub

↓

GitGhost webhook fires automatically

↓

AI reviews your PR against YOUR style

↓

👻 Review comment posted on GitHub PR ✅


---

## Features

- 🔐 **GitHub OAuth** — one-click login, zero friction
- 🧠 **Style Fingerprinting** — AST-level analysis of your naming conventions, patterns, and architecture
- 👻 **Auto PR Reviews** — webhook-triggered, zero manual effort
- 📊 **Drift Score** — 0-100 style consistency score per PR
- ⚡ **Async Job Queue** — BullMQ + Redis for background processing
- 🎯 **Personal, not generic** — reviews YOUR code like YOU would

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| AI Engine | Groq API (Llama 3.3 70B) |
| Database | MongoDB Atlas |
| Auth | GitHub OAuth 2.0 |
| Webhooks | GitHub Webhooks |
| Queue | BullMQ + Redis (Upstash) |
| AST Parsing | @babel/parser |

---

## Live Demo

> Connect your GitHub → Select a repo → Open a PR → Watch GitGhost review it in your own style.

---

## Setup & Installation

### 1. Clone
```bash
git clone https://github.com/JAI1209/gitghost.git
cd gitghost
```

### 2. Install
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Environment Variables
```bash
cp backend/.env.example backend/.env
```

```env
MONGODB_URI=your_mongodb_atlas_uri
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GROQ_API_KEY=your_groq_api_key
REDIS_URL=your_upstash_redis_url
SESSION_SECRET=any_random_string
JWT_SECRET=any_random_string
GITHUB_WEBHOOK_SECRET=any_random_string
FRONTEND_URL=http://localhost:3000
BACKEND_URL=https://your-ngrok-url
```

### 4. Run
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — ngrok
ngrok http 5000
```

### 5. GitHub Webhook Setup
- Repo → Settings → Webhooks → Add webhook
- Payload URL: `https://your-ngrok-url/webhooks/github`
- Content type: `application/json`
- Secret: same as `GITHUB_WEBHOOK_SECRET`
- Events: **Pull requests** + **Pushes**

---

## Project Structure


gitghost/

├── backend/

│   ├── config/          # Passport OAuth config

│   ├── middleware/       # Auth middleware

│   ├── models/           # MongoDB schemas

│   ├── routes/           # API routes

│   ├── services/         # GitHub API, AI, AST

│   └── workers/          # BullMQ job workers

└── frontend/

└── src/

├── pages/        # Dashboard, Repos, Reviews

└── components/   # UI components



---

## Built By

<div align="center">

**Jai Surya Kumar**

[GitHub](https://github.com/JAI1209) · [Portfolio](https://jaiportfolioreact.netlify.app) · [LinkedIn](https://linkedin.com/in/jai-surya-kumar)

*Digital Krantikari 🚀*

</div>
