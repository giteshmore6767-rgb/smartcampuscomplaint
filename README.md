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
