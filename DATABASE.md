# JobHunter Local Database (SQLite + Drizzle)

JobHunter has been migrated from Supabase to a local **SQLite** database managed by **Drizzle ORM**. This setup ensures privacy, zero cost, and near-instant performance for personal use.

## 🏗️ Architecture

### 1. SQLite Backend
The database is stored in a single file: `data/jobhunter.sqlite`.
- **Persistence:** This file contains all your profiles, job listings, cover letters, and AI-learned signals.
- **Local First:** Since it's a local file, it's 100% private and stays on your machine.

### 2. Drizzle ORM
We use Drizzle to interact with the SQLite database.
- **Schema:** Defined in `lib/db/schema.ts`.
- **Client:** The database client is initialized in `lib/db/index.ts`.

### 3. Auto-Initialization
The database and all required tables are automatically created the first time the app runs. The `initDb()` function in `lib/db/index.ts` handles the initial SQL schema setup using `CREATE TABLE IF NOT EXISTS` statements.

## 👤 User Management

Since this is a personal tool, the authentication system has been simplified:
- **Local User:** The app defaults to a single user with the ID `local-user`, defined in `lib/db/user.ts`.
- **Automatic Setup:** On first run, the system ensures this local user profile exists via `ensureLocalUser()`.
- **Multiple Users:** While designed for one person, if multiple people use the same code on different machines, they each have their own independent `jobhunter.sqlite` file.

## 🛠️ Maintenance

### Accessing Data Directly
You can use any SQLite viewer (like DB Browser for SQLite) if you want to inspect or export your data.

### Migrations
For this personal version, we use simple `CREATE TABLE IF NOT EXISTS` statements on startup. If you need to make schema changes:
1. Update `lib/db/schema.ts`.
2. Update the `initDb()` function in `lib/db/index.ts` with the new SQL.
3. If changing existing tables, you may need to manually run `ALTER TABLE` commands or delete the `.sqlite` file to start fresh.

## 🚀 Deployment Warning

**IMPORTANT:** This SQLite setup is designed for **local use**.
- If you deploy to **Vercel**, your data will be lost every time the app redeploys or sleeps, because Vercel's filesystem is ephemeral.
- For persistent cloud deployment, you should use **Turso** (SQLite in the cloud) or a managed Postgres database.
