# Signal Room IoT Analytics

Signal Room is a MERN dashboard for generating, analyzing, and reviewing IoT temperature, humidity, and pressure readings. It combines JWT authentication, role-based access, robust anomaly detection, and a focused React data workspace.

## Features

- JWT registration/login with analyst and admin roles
- Gaussian IoT data generation with occasional sensor spikes
- Modified z-score anomaly detection using median and MAD
- Summary statistics, alert messages, charts, and readings tables
- Admin view of readings across every user
- Centralized validation and JSON error responses
- Responsive, keyboard-accessible React interface

## Tech Stack

MongoDB, Mongoose, Express, Node.js, React, Vite, React Router, Recharts, Vitest, ESLint, Helmet, CORS, bcryptjs, and jsonwebtoken.

## Architecture

`client/` is a Vite React single-page application. `server/` is an ES module Express API that owns authentication, validation, generation, analysis, and MongoDB persistence. In development, Vite proxies `/api` to Express. The original Flask prototype remains in `legacy-flask/` for reference.

## Folder Structure

```text
server/src/       Express app, routes, models, middleware, generator, analysis
server/tests/     Vitest unit tests for anomaly analysis
client/src/       React routes, dashboard, API client, styles
legacy-flask/     Original Flask implementation
.github/workflows/ Server lint and test workflow
```

## API

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | No | Create an analyst or configured admin |
| POST | `/api/auth/login` | No | Return a JWT and user |
| GET | `/api/auth/me` | JWT | Return the current user |
| POST | `/api/readings/generate` | JWT | Generate 1-500 readings |
| GET | `/api/readings` | JWT | List the current user's readings |
| GET | `/api/readings/analysis` | JWT | Return statistics, anomalies, alerts, and readings |
| GET | `/api/admin/readings` | Admin JWT | List all users' readings |

## Setup

Prerequisites: Node.js 20+, npm, and MongoDB. Use a local MongoDB instance or a free MongoDB Atlas cluster.

```bash
git switch mern-rewrite
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env with your MongoDB URI, JWT secret, and admin username.
cd server && npm install
cd ../client && npm install
```

Run the API and client in separate terminals:

```bash
cd server && npm run dev
cd client && npm run dev
```

Open http://localhost:5173. Register with the exact `ADMIN_USERNAME` value to receive the admin role. Never commit `.env` files or secrets.

## Environment Variables

Server: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`, and `ADMIN_USERNAME`.

Client: `VITE_API_URL` (defaults to `/api`).

## Tests and Quality

```bash
cd server && npm test && npm run lint
cd client && npm run lint && npm run build
```

GitHub Actions runs server install, lint, and tests on pushes and pull requests.

## Screenshots

Add screenshots of the login page, analyst dashboard, anomaly alerts, and admin readings tab here.
