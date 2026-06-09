# todo-api-express — Todo REST API (Express.js + TypeScript)

Express.js + TypeScript REST API backend (JWT + refresh-token auth, Todo tasks /
categories / priorities). Serves as the shared backend for two interchangeable
SPA clients.

> **Part of a 3-repo Todo system** — one backend, two front ends sharing the same API:
>
> | Repo | Role |
> |---|---|
> | **todo-api-express** (this repo) | REST API backend — Express.js + TypeScript, SQLite, JWT |
> | **todo-nextjs** | Client — Next.js 15 + React 19 + TypeScript |
> | **todo-vue** | Client — Vue 3 + Pinia |

## API Endpoints

### Info

| Method | Path | Description |
|---|---|---|
| GET | `/` | API info and endpoint list |
| GET | `/api/v1/health` | Health check |

### Auth — `/api/v1/Account`

| Method | Path | Description |
|---|---|---|
| POST | `/Account/Login` | Login with email + password, returns JWT + refreshToken |
| POST | `/Account/Register` | Register new user, returns JWT + refreshToken |
| POST | `/Account/RefreshToken` | Exchange refreshToken for new tokens |

### Todo Tasks — `/api/v1/TodoTasks`

| Method | Path | Description |
|---|---|---|
| GET | `/TodoTasks` | List all tasks (auth required) |
| POST | `/TodoTasks` | Create task |
| GET | `/TodoTasks/:id` | Get task by id |
| PUT | `/TodoTasks/:id` | Update task |
| DELETE | `/TodoTasks/:id` | Delete task |

### Todo Categories — `/api/v1/TodoCategories`

| Method | Path | Description |
|---|---|---|
| GET | `/TodoCategories` | List all categories |
| POST | `/TodoCategories` | Create category |
| GET | `/TodoCategories/:id` | Get category by id |
| PUT | `/TodoCategories/:id` | Update category |
| DELETE | `/TodoCategories/:id` | Delete category |

### Todo Priorities — `/api/v1/TodoPriorities`

| Method | Path | Description |
|---|---|---|
| GET | `/TodoPriorities` | List all priorities |
| POST | `/TodoPriorities` | Create priority |
| GET | `/TodoPriorities/:id` | Get priority by id |
| PUT | `/TodoPriorities/:id` | Update priority |
| DELETE | `/TodoPriorities/:id` | Delete priority |

## Tech Stack

- **Runtime:** Node.js 22 + TypeScript
- **Framework:** Express.js 4
- **Database:** SQLite (via better-sqlite3) — persisted via Docker volume
- **Auth:** JWT (jsonwebtoken) + bcryptjs + UUID refresh tokens
- **Deployment:** Docker + Docker Compose

## Local Development

```bash
npm install
npm run dev       # tsx watch mode
```

## Deploy to VPS

```bash
docker compose -p jsa6 up --build --remove-orphans --detach
```

App runs on **port 85** (mapped to container port 3000).

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `supersecretchangeme` | Secret key for signing JWTs |
| `PORT` | `3000` | Server port inside container |
| `DATA_DIR` | `./data` | Directory for SQLite database file |

Set `JWT_SECRET` in a `.env` file on the VPS (not committed to git).

## CI/CD

GitLab CI deploys automatically on push to `main` via the shared runner.
