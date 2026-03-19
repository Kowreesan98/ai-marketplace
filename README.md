# AgentHub — AI Agent Marketplace

A full-stack platform to browse, hire, and chat with specialized AI agents — powered by MiniMax.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (stored client-side) |
| AI | MiniMax API (per-agent system prompts) |

## Project Structure

```
ai-marketplace/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js          # POST /auth/register, /auth/login
│   │   ├── agents.js        # GET /agents, GET /agents/:id
│   │   ├── sessions.js      # POST /sessions, GET /sessions, GET /sessions/:id
│   │   └── chat.js          # POST /chat, GET /chat/:session_id
│   ├── database.js          # SQLite schema + agent seeding
│   ├── server.js            # Express app entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api/client.js    # Axios instance with JWT interceptor
    │   ├── components/      # Navbar, ProtectedRoute, Spinner
    │   ├── context/         # AuthContext (login, register, logout)
    │   ├── pages/           # Home, AgentDetail, HireFlow, Workspace, Dashboard, Login, Signup
    │   ├── App.jsx
    │   └── index.js
    └── package.json
```

## Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/yourname/ai-marketplace.git
cd ai-marketplace
```

### 2. Setup the backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in your keys:
```
PORT=5000
JWT_SECRET=any_long_random_string
MINIMAX_API_KEY=your_real_minimax_key
MINIMAX_GROUP_ID=your_minimax_group_id
```

Start the backend:
```bash
npm run dev
```
Backend runs on http://localhost:5000. SQLite DB is auto-created on first run with all 5 agents seeded.

### 3. Setup the frontend
```bash
cd ../frontend
npm install
npm start
```
Frontend runs on http://localhost:3000.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | No | Create account |
| POST | /auth/login | No | Login, get JWT |
| GET | /agents | No | List all agents |
| GET | /agents/:id | No | Single agent detail |
| POST | /sessions | Yes | Hire an agent |
| GET | /sessions | Yes | My sessions |
| GET | /sessions/:id | Yes | Session + time remaining |
| POST | /chat | Yes | Send message (403 if expired) |
| GET | /chat/:session_id | Yes | Message history |

## AI Agents

| Agent | Rate | Specialty |
|-------|------|-----------|
| PDF Generator | $2/hr | Structured document content |
| Content Writing Companion | $3/hr | Blogs, emails, marketing |
| Learn English | $2/hr | Conversational tutoring |
| Code Reviewer | $4/hr | Code analysis & feedback |
| Data Summarizer | $2/hr | Key insights from long text |

## AI Tooling Used

- **Claude AI**
- **Kilo Code** (VS Code)
