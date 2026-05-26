# TaskFlow — Task & Team Management System

A full-stack task and project management web application built with React, Node.js/Express, and MongoDB. Supports JWT authentication, role-based access control, real-time updates via WebSockets, and a comprehensive dashboard with analytics.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, React Router v6, Tailwind CSS |
| Charts     | Recharts                                |
| Backend    | Node.js + Express.js                    |
| Database   | MongoDB + Mongoose                      |
| Auth       | JWT (access + refresh tokens)           |
| Real-time  | Socket.IO                               |
| Testing    | Jest + Supertest                        |

---

## Project Structure

```
task-manager/
├── backend/
│   ├── __tests__/        # Unit & integration tests
│   ├── config/           # DB connection
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Auth, error handler, validator
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── utils/            # JWT helpers
│   ├── server.js         # Entry point
│   ├── .env
│  
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React Context (Auth)
│   │   ├── pages/        # Page components
│   │   ├── services/     # Axios API layer
│   │   └── utils/        # Helpers
│── ├── .env

```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB running locally (or use MongoDB Atlas)
- npm

### 1. Clone and setup environment

```bash
git clone <your-repo-url>
cd task-manager

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Run the app

```bash
# Terminal 1 — Backend (runs on :5000)
cd backend && npm run dev

# Terminal 2 — Frontend (runs on :3000)
cd frontend && npm run dev
```

Open **http://localhost:3000**

---


App will be available at **http://localhost**

---

## How to login step

Create new account (its default admin role)

## Environment Variables

### Backend (`backend/.env`)

| Variable             | Description                        | Default             |
|----------------------|------------------------------------|---------------------|
| `PORT`               | Server port                        | `5000`              |
| `NODE_ENV`           | Environment                        | `development`       |
| `MONGO_URI`          | MongoDB connection string          | Required            |
| `JWT_SECRET`         | JWT signing secret                 | Required            |
| `JWT_EXPIRE`         | Access token expiry                | `7d`                |
| `JWT_REFRESH_SECRET` | Refresh token secret               | Required            |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry               | `30d`               |
| `CLIENT_URL`         | Frontend URL for CORS              | `http://localhost:3000` |

### Frontend (`frontend/.env`)

| Variable          | Description       | Default                    |
|-------------------|-------------------|----------------------------|
| `VITE_API_URL`    | Backend API URL   | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket.IO URL     | `http://localhost:5000`     |

---

## Features

### Authentication
- Register / Login / Logout
- JWT access tokens (7 days)
- Protected routes on both FE and BE
- Change password from profile

### Role-Based Access Control
| Feature              | Admin | Member |
|----------------------|-------|--------|
| Create/Edit Projects | ✅    | ❌     |
| Add Project Members  | ✅    | ❌     |
| Create/Edit Tasks    | ✅    | ✅     |
| Delete Tasks         | ✅    | Own only |
| Manage Users         | ✅    | ❌     |
| View All Projects    | ✅    | Own only |

### Task Module
- Title, Description, Priority (low/medium/high/critical)
- Status: Todo → In Progress → Review → Completed
- Due Date with overdue detection
- Assignment to team members
- Estimated hours
- Tags
- Comments with edit/delete

### Dashboard
- Total / Completed / In Progress / Overdue task counts
- Bar chart: tasks created per day (last 7 days)
- Pie chart: task status distribution
- Recent tasks list

### Projects
- Kanban board view per project
- Member management with roles
- Status and priority filters
- Tag support

### Real-time Updates (WebSocket)
- Tasks created/updated/deleted broadcast to project room
- Comments added in real-time

---

## API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint            | Access  | Description         |
|--------|---------------------|---------|---------------------|
| POST   | `/auth/register`    | Public  | Register user       |
| POST   | `/auth/login`       | Public  | Login               |
| GET    | `/auth/me`          | Private | Get current user    |
| POST   | `/auth/logout`      | Private | Logout              |
| PUT    | `/auth/password`    | Private | Update password     |

### Users

| Method | Endpoint            | Access       | Description       |
|--------|---------------------|--------------|-------------------|
| GET    | `/users`            | Admin        | List all users    |
| GET    | `/users/members`    | Private      | Members dropdown  |
| GET    | `/users/:id`        | Private      | Get user          |
| PUT    | `/users/:id`        | Private/Admin| Update user       |
| DELETE | `/users/:id`        | Admin        | Delete user       |

### Projects

| Method | Endpoint                      | Access  | Description       |
|--------|-------------------------------|---------|-------------------|
| GET    | `/projects`                   | Private | List projects     |
| GET    | `/projects/:id`               | Private | Get project       |
| POST   | `/projects`                   | Admin   | Create project    |
| PUT    | `/projects/:id`               | Admin   | Update project    |
| DELETE | `/projects/:id`               | Admin   | Delete project    |
| POST   | `/projects/:id/members`       | Admin   | Add member        |
| DELETE | `/projects/:id/members/:userId`| Admin  | Remove member     |

### Tasks

| Method | Endpoint              | Access  | Description       |
|--------|-----------------------|---------|-------------------|
| GET    | `/tasks`              | Private | List tasks        |
| GET    | `/tasks/:id`          | Private | Get task          |
| POST   | `/tasks`              | Private | Create task       |
| PUT    | `/tasks/:id`          | Private | Update task       |
| DELETE | `/tasks/:id`          | Private | Delete task       |
| PATCH  | `/tasks/:id/status`   | Private | Update status only|

**Query params for GET /tasks:**
`status`, `priority`, `project`, `assignedTo`, `search`, `overdue`, `page`, `limit`, `sortBy`, `sortOrder`

### Comments

| Method | Endpoint                  | Access  | Description         |
|--------|---------------------------|---------|---------------------|
| GET    | `/comments/task/:taskId`  | Private | Get task comments   |
| POST   | `/comments`               | Private | Add comment         |
| PUT    | `/comments/:id`           | Private | Edit own comment    |
| DELETE | `/comments/:id`           | Private | Delete comment      |

### Dashboard

| Method | Endpoint             | Access  | Description     |
|--------|----------------------|---------|-----------------|
| GET    | `/dashboard/stats`   | Private | Get statistics  |

---

## Running Tests

```bash
cd backend

# Run all tests
npm test

# With coverage report
npm test -- --coverage

# Watch mode
npm test -- --watch
