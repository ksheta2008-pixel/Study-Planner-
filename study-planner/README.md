# Study Planner

A beginner-friendly full-stack web application that helps students organize subjects, plan study tasks, track due dates, estimate study time, and mark work complete.

## 1. Problem statement

Students often keep assignments and revision plans in different places. Study Planner provides one dashboard for study tasks and subjects, helping students see upcoming work and track completion.

## 2. Objectives

- Organize study tasks by subject and due date.
- Estimate time needed for each task.
- Track pending and completed tasks.
- Search and filter tasks.
- Store data persistently in Supabase PostgreSQL.

## 3. Users and features

This MVP is a single shared study-planning workspace and does not include accounts or private per-user data. Anyone who can reach the running app can view and change its data. Run it locally for demonstrations; do not expose it publicly as-is.

Implemented:
- Dashboard summary cards.
- Create, edit, delete, and complete tasks.
- Optional subject, due date, notes, and study-time estimate.
- Add and remove subjects.
- Search tasks and filter by status.
- Responsive layout and friendly error messages.
- Express REST API and Supabase PostgreSQL storage.

Not included: login, per-student accounts, calendar sync, notifications, or automatic study scheduling.

## 4. Technology stack

- Frontend: HTML5, CSS3, vanilla JavaScript
- Backend: Node.js and Express.js
- Database: Supabase PostgreSQL
- Security utilities: Helmet, rate limiting, environment variables

## 5. Folder structure

```text
study-planner/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── routes/
│   │   ├── tasks.js
│   │   └── subjects.js
│   ├── utils/
│   │   └── validation.js
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   ├── .env.example
│   ├── .env                 # create locally; never commit
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## 6. Prerequisites

Install:
- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js LTS (includes npm)](https://nodejs.org/)
- [Git](https://git-scm.com/downloads)
- A free [Supabase](https://supabase.com/) account

Check installations in a new VS Code terminal:
```bash
node --version
npm --version
git --version
```
Node.js 20 or newer is required.

## 7. Supabase setup

1. Sign in to Supabase and create a new project.
2. Set a database password and wait for provisioning to finish.
3. In the project dashboard, open **SQL Editor** and choose **New query**.
4. Open `database/schema.sql` in VS Code, copy all its contents, paste them into the SQL Editor, and click **Run**.
5. Open **Table Editor** and confirm the `subjects` and `tasks` tables exist.
6. In **Project Settings → API Keys** (the exact labels may vary), copy the Project URL and the server-side `service_role`/secret key. Never use this privileged key in frontend code or GitHub.

## 8. Environment configuration

From the project root in VS Code, copy the example file:
- PowerShell: `Copy-Item backend/.env.example backend/.env`
- Command Prompt: `copy backend\.env.example backend\.env`

Open `backend/.env` and replace the placeholder values:
```dotenv
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-real-server-side-key
```

`SUPABASE_URL` identifies your project. `SUPABASE_SERVICE_ROLE_KEY` allows backend database access and is privileged. Keep it only in `backend/.env`. The `.env.example` file is a safe template, not working credentials. Never commit `.env`.

This starter uses the server-side privileged key, so the API is not user-authenticated. Use it only on your own computer for a college demonstration unless you add authentication, per-user ownership, and authorization before deployment.

## 9. Install and run

Open the project folder in VS Code. Select **Terminal → New Terminal**.

```bash
cd backend
npm install
npm run check
npm start
```

Expected terminal output includes:
```text
Study Planner running at http://localhost:3000
Health check: http://localhost:3000/api/health
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Do not double-click `frontend/index.html`; the app should be served by Express so `/api` requests work.

Check the health endpoint at [http://localhost:3000/api/health](http://localhost:3000/api/health). It should return JSON similar to:
```json
{"status":"ok","service":"study-planner-api"}
```

## 10. Architecture

1. Browser renders HTML and CSS and runs `frontend/app.js`.
2. The frontend uses `fetch('/api/...')` to call Express.
3. Express validates inputs and sends database queries through `backend/supabase.js`.
4. Supabase PostgreSQL stores subjects and tasks.
5. Express returns JSON to the browser.

## 11. API reference

All endpoints are unauthenticated in this local-demo MVP. Do not expose them to the public internet.

| Method | Path | Purpose | Body / result |
|---|---|---|---|
| GET | `/api/health` | API health check | JSON status |
| GET | `/api/tasks` | List tasks | Returns task array with optional subject name |
| POST | `/api/tasks` | Create task | `title` required; optional `notes`, `subject_id`, `due_date`, `estimated_minutes` |
| PUT | `/api/tasks/:id` | Edit task | Same fields as create |
| PATCH | `/api/tasks/:id/complete` | Change completion | `{"completed":true}` or `false` |
| DELETE | `/api/tasks/:id` | Delete task | `204` on success |
| GET | `/api/subjects` | List subjects | Returns subject array |
| POST | `/api/subjects` | Create subject | `{"name":"Mathematics"}` |
| DELETE | `/api/subjects/:id` | Remove subject | `204`; linked tasks remain without a subject |

Typical errors: `400` invalid input, `404` missing record, `409` duplicate subject, `503` missing database configuration, `500` unexpected database failure.

## 12. Use the application

1. Add subjects such as Mathematics, Physics, and Programming.
2. Select **Add task**.
3. Enter a title, optionally select a subject and due date, set the time estimate, and add notes.
4. Save the task. It should appear in the list.
5. Use the checkbox to mark it complete.
6. Use Edit to change task details and Delete to remove a task.
7. Search by title, notes, or subject; filter by pending/completed.
8. Reload the page. Saved data should remain because it is stored in Supabase.

## 13. Testing checklist

- [ ] `/api/health` returns status `ok`.
- [ ] Add a subject; it appears in Your subjects.
- [ ] Add a task with a title; it appears in the task list.
- [ ] Add a task with a due date and subject; metadata is displayed.
- [ ] Edit a task; updated values appear after refresh.
- [ ] Mark a task complete; dashboard counts update.
- [ ] Delete a task; it disappears.
- [ ] Search a term; unrelated tasks are hidden.
- [ ] Filter pending/completed tasks.
- [ ] Submit a blank task title; the form/API reports a validation error.
- [ ] Enter study time below 5 or above 720; the API rejects it.
- [ ] Add the same subject twice; API returns a conflict.
- [ ] Remove a subject; its tasks remain, without a subject.
- [ ] Stop or misconfigure Supabase; the UI shows an error instead of pretending data was saved.
- [ ] Resize the browser to mobile width; the layout adapts.

Syntax checks can be run with `npm run check`. A real database connection cannot be verified until you add your own Supabase credentials and run the app.

## 14. Troubleshooting

- **`npm` is not recognized:** install Node.js LTS, close and reopen VS Code, then run `npm --version`.
- **Port 3000 is already in use:** change `PORT=3001` in `backend/.env` and open `http://localhost:3001`.
- **Database not configured:** confirm `backend/.env` exists, values are real, and you restarted the server.
- **Invalid API key / database errors:** confirm the project URL and server-side key belong to the same Supabase project.
- **Table not found:** run `database/schema.sql` in the Supabase SQL Editor.
- **Frontend cannot load API:** visit the app through `http://localhost:3000`, not by opening the HTML file directly.
- **Changes do not appear:** check the terminal for errors and refresh the browser.

## 15. Git and GitHub

1. Create an empty repository on [GitHub](https://github.com/).
2. From the project root, run:
```bash
git init
git status
git add .
git status
git commit -m "Build Study Planner"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
3. Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository's HTTPS URL.
4. Check the repository page and confirm the source files and README are visible.

Before committing, ensure `backend/.env` and `node_modules/` are ignored and no secrets are in frontend files. `.gitignore` does not remove a secret already committed. If a credential was exposed, rotate it immediately and remove it from repository history as appropriate.

## 16. Security and limitations

- The API currently has no login and uses a privileged Supabase key on the server. Anyone who can reach the server can read or modify all shared tasks and subjects.
- RLS is enabled; the backend service-role key bypasses RLS. No browser policies are needed for this server-only access pattern.
- Keep the server private for local demos. Before public deployment, implement Supabase Auth, per-user ownership, authorization checks, appropriate RLS policies, and production CORS settings.
- The app does not provide reminders, calendar integration, or automatic timetable optimization.

## 17. Git hygiene

The root `.gitignore` excludes local `.env` files, dependencies, and logs. Commit `.env.example`, but never a real `.env`.
