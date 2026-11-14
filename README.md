# Task Board Application

Kanban task planner with Story Point capacity limits.
**Angular 22 (Angular Material + CDK drag & drop) · Node.js/Express · MySQL · JWT**

## Features
- Login (JWT in localStorage), route guard, logout
- Dashboard: task counts per status, total story points, today and this-week capacity bars
- Settings: daily and weekly story point limits
- Tasks: create, view, edit, delete (with confirmation) and a table with search, priority/status filters, sorting and pagination
- Kanban board with drag and drop, per-column counts, status persisted to the database
- Capacity planning enforced by the API (daily and weekly), with a live hint in the task form
- Loading bar, toasts, form validation, responsive layout

## Prerequisites
- Node.js 20.19+ or 22 LTS, npm 10+
- MySQL 8.x running locally

## 1. Database
```bash
mysql -u root -p < backend/database/taskboard.sql
```
This creates the `taskboard` database, tables, indexes, the admin user, default limits (8 / 40) and 10 sample tasks.

## 2. Backend (http://localhost:3000)
```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
# edit .env: set DB_PASSWORD (and DB_USER if not root) and a JWT_SECRET
npm start
```

## 3. Frontend (http://localhost:4200)
```bash
cd frontend
npm install
npm start
```
If the API runs on another URL, change `src/app/core/api.config.ts`.

## Login
`admin@test.com` / `Admin@123`


Import `postman/TaskBoard.postman_collection.json` into Postman, run **Auth > Login** first (it stores the token), then any request. The collection includes negative cases (400, 401, 404, 422).

## API summary
All routes except `/login` need `Authorization: Bearer <token>`.

| Method | Path | Notes |
|---|---|---|
| POST | /login | `{email, password}` returns `{token, user}` |
| GET | /tasks | `search, priority, status, sortBy, sortOrder, page, limit` returns `{data, pagination}` |
| GET | /tasks/:id | |
| POST | /tasks | 201, capacity-checked |
| PUT | /tasks/:id | capacity-checked |
| DELETE | /tasks/:id | 204 |
| GET / PUT | /settings | `{dailyPointLimit, weeklyPointLimit}` |
| GET | /tasks/summary | dashboard counts (extra) |
| GET | /tasks/board | all tasks for the board (extra) |
| GET | /tasks/capacity?date=&excludeId= | capacity preview for the form (extra) |
| PATCH | /tasks/:id/status | board drag and drop (extra) |

Errors: `{ success:false, code, message, details? }`. 400 validation, 401 auth, 404 not found, 422 business rule.


## Troubleshooting
- **`Could not connect to MySQL`**: check `.env` credentials and that MySQL is running.
- **`ER_ACCESS_DENIED_ERROR` with MySQL 8**: use a user with a password, e.g. `ALTER USER 'root'@'localhost' IDENTIFIED BY 'yourpass';`.
- **CORS error in the browser**: `CORS_ORIGIN` in `.env` must match the frontend URL (default `http://localhost:4200`).
- **Port in use**: change `PORT` in `.env`, and `API_URL` in the frontend.
- **Session expired toast**: the JWT lasts 8 hours (`JWT_EXPIRES_IN`); just log in again.
