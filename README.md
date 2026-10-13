# Smart Campus Complaint & Facility Portal

A full-stack campus portal for student and administrator complaint workflows.

## Stack

- Static HTML, CSS, and JavaScript frontend
- Express API deployed as a Netlify Function
- Netlify Database (PostgreSQL) in production
- MySQL for local development
- Database-backed storage for complaint photos

## Netlify deployment

The root `netlify.toml` publishes `frontend/`, builds the backend dependencies, and routes `/api/*` and `/uploads/*` to the API function. Netlify migrations create the PostgreSQL schema. Set `JWT_SECRET` as a protected Netlify environment variable; the production database URL is configured as `NETLIFY_DB_URL`.

The production database contains the migrated local accounts and complaint. Login and registration use the deployed API on Netlify and the local API on localhost.

## Local development

Use Node.js 18 or newer and MySQL 8. Run `database/schema.sql` from a MySQL client to create the local database and tables, then configure `backend/.env` using `.env.example`.

```bash
cd backend
npm install
npm start
```

The API runs at `http://localhost:5000`. Open `frontend/index.html` with VS Code Live Server; student registration and login use the local API automatically.
