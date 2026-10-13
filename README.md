# Smart Campus Complaint & Facility Portal

A full-stack campus portal for student and administrator complaint workflows.

## Stack

- Static HTML, CSS, and JavaScript frontend
- Express API deployed as a Netlify Function
- Netlify Database (PostgreSQL)
- PostgreSQL storage for complaint photos

## Netlify deployment

The root `netlify.toml` publishes `frontend/`, builds the backend dependencies, and routes `/api/*` and `/uploads/*` to the API function. The PostgreSQL schema is managed by the migration in `netlify/database/migrations/`.

Configure `JWT_SECRET` in the Netlify project environment before using login. Use a long, random value and never commit it. Netlify provides `NETLIFY_DB_URL` to functions when the project's database is enabled.

The API returns `GET /api/health` for a database-backed health check. The database starts empty: students should create accounts through the registration page. Existing records from a local MySQL database are not copied automatically. Provision administrator accounts separately with a secure password hash.

## Local development

Use Node.js 18 or newer and a PostgreSQL `DATABASE_URL`.

```bash
cd backend
npm install
```

Copy `.env.example` to `.env`, set `DATABASE_URL` and `JWT_SECRET`, then start the API:

```bash
npm start
```

The API runs at `http://localhost:5000`. Open `frontend/index.html` with VS Code Live Server; local frontend pages use that API automatically. Apply `database/schema.sql` to a local PostgreSQL database before using the API.
# Smart Campus Complaint & Facility Portal

A full-stack BCA project starter with:
- Student login
- Student dashboard
- Complaint registration
- Photo upload
- Department/location
- Complaint tracking
- Admin login
- Admin dashboard
- Admin complaint management
- MySQL database schema
- Node.js + Express backend
- Clean responsive frontend

## Requirements
- Node.js 18+
- MySQL 8+

## 1. Start the backend
Open terminal in `backend`:

```bash
npm install
```

Copy `.env.example` to `.env` and update MySQL credentials.

Then:

```bash
npm start
```

Backend runs at `http://localhost:5000`.

## 2. Database
Create a MySQL database and run:

```sql
source database/schema.sql;
```

You can also copy the SQL into MySQL Workbench.

## 3. Open the website
Open `frontend/index.html` with VS Code Live Server, or visit:

`http://127.0.0.1:5500/frontend/`

Demo accounts are created by `database/schema.sql`:
- Student: `student@campus.com` / `student123`
- Admin: `admin@campus.com` / `admin123`

For a classroom/demo project these accounts are intentionally simple. Change them before deployment.
