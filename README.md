# ⬡ TaskFlow — Team Task Manager

A full-stack web application for team task management with role-based access control, built with Node.js, Express, PostgreSQL, and React.

---

## 🚀 Live Demo

> Deploy to Railway and your live URL will be `https://your-app.railway.app`

---

## ✨ Features

- **Authentication** — Signup/Login with JWT tokens, persistent sessions
- **Role-Based Access Control** — System-level Admin vs Member; Project-level Admin vs Member
- **Projects** — Create, update, delete; invite team members by email
- **Tasks** — Kanban board (Todo / In Progress / Done), priority levels, due dates, assignment
- **Dashboard** — Stats overview, personal task list, project progress bars, overdue tracking
- **Filters** — Filter tasks by status and priority per project
- **Validations** — Input validation on both client and server side

---

## 🏗 Architecture

```
task-manager/
├── src/                      # Backend (Node.js + Express)
│   ├── server.js             # Entry point, serves API + React build
│   ├── db/index.js           # PostgreSQL pool + auto migrations
│   ├── middleware/auth.js    # JWT auth + role guards
│   └── routes/
│       ├── auth.js           # POST /auth/signup, /auth/login, GET /auth/me
│       ├── projects.js       # CRUD + member management
│       ├── tasks.js          # Task CRUD scoped to project
│       ├── dashboard.js      # Aggregated stats endpoint
│       └── users.js          # User management (admin)
├── client/                   # Frontend (React)
│   └── src/
│       ├── api/index.js      # Fetch wrapper
│       ├── contexts/         # AuthContext
│       ├── pages/            # Dashboard, Login, Signup, Projects, ProjectDetail
│       └── components/       # Navbar, TaskModal
├── railway.toml              # Railway deployment config
├── nixpacks.toml             # Build config
└── .env.example              # Environment variables template
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js ≥ 18
- PostgreSQL (local or cloud instance)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd task-manager
npm install
cd client && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
```

### 3. Run Dev Servers

```bash
npm run dev
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

The database tables are created automatically on first run.

---

## 🌐 Deploying to Railway

### Step 1 — Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/task-manager.git
git push -u origin main
```

### Step 2 — Create Railway Project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → Choose your repo

### Step 3 — Add PostgreSQL

1. In Railway dashboard → **+ New** → **Database** → **PostgreSQL**
2. Railway automatically sets `DATABASE_URL` in your environment

### Step 4 — Set Environment Variables

In Railway → your web service → **Variables**, add:

```
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
NODE_ENV=production
```

### Step 5 — Deploy

Railway will auto-deploy. After build completes:
- Your app is live at `https://<project>.railway.app`
- Database tables are created automatically on startup

---

## 📡 REST API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/projects` | User | List accessible projects |
| POST | `/api/projects` | User | Create project |
| GET | `/api/projects/:id` | Member | Project details + members |
| PUT | `/api/projects/:id` | Project Admin | Update project |
| DELETE | `/api/projects/:id` | Project Admin | Delete project |
| POST | `/api/projects/:id/members` | Project Admin | Add member by email |
| DELETE | `/api/projects/:id/members/:uid` | Project Admin | Remove member |

### Tasks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/projects/:pid/tasks` | Member | List tasks (filter: status, priority) |
| POST | `/api/projects/:pid/tasks` | Member | Create task |
| PUT | `/api/projects/:pid/tasks/:tid` | Member+ | Update task |
| DELETE | `/api/projects/:pid/tasks/:tid` | Member+ | Delete task |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard` | Stats, my tasks, project progress |

---

## 🔐 Role-Based Access

### System Roles
| Role | Capabilities |
|------|-------------|
| `admin` | Full access to all projects, tasks, and users |
| `member` | Access only to projects they're members of |

### Project Roles
| Role | Capabilities |
|------|-------------|
| `admin` | Edit project, manage members, full task control |
| `member` | View project, create tasks, edit own/assigned tasks |

---

## 🗃 Database Schema

```sql
users (id, name, email, password_hash, role, created_at)
projects (id, name, description, owner_id→users, created_at)
project_members (project_id→projects, user_id→users, role, joined_at)
tasks (id, project_id→projects, title, description, assigned_to→users,
       status, priority, due_date, created_by→users, created_at)
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | PostgreSQL (via `pg`) |
| Auth | JWT + bcrypt |
| Validation | express-validator |
| Frontend | React 18, React Router v6 |
| Deployment | Railway |
