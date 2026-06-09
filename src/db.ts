import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(path.join(dataDir, 'db.sqlite'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    refresh_token TEXT
  );

  CREATE TABLE IF NOT EXISTS todo_categories (
    id TEXT PRIMARY KEY,
    app_user_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    category_sort INTEGER NOT NULL DEFAULT 0,
    tag TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (app_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS todo_priorities (
    id TEXT PRIMARY KEY,
    app_user_id TEXT NOT NULL,
    priority_name TEXT NOT NULL,
    priority_sort INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (app_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS todo_tasks (
    id TEXT PRIMARY KEY,
    app_user_id TEXT NOT NULL,
    task_name TEXT NOT NULL,
    task_sort INTEGER NOT NULL DEFAULT 0,
    is_completed INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    due_dt TEXT,
    created_dt TEXT NOT NULL,
    todo_category_id TEXT,
    todo_priority_id TEXT,
    FOREIGN KEY (app_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (todo_category_id) REFERENCES todo_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (todo_priority_id) REFERENCES todo_priorities(id) ON DELETE SET NULL
  );
`)

export default db
