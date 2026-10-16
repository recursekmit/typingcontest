# Recurse Type

**Recurse Type** is the typing test of [Recurse](https://recurse.qzz.io), the technical club of KMIT. Students sign in with their roll number, type, climb the leaderboards and race each other 1v1.

Live (self-hosted): https://adityas-mac-mini.tail00078f.ts.net

Contact: recursekmit@gmail.com

## Features

- **Roll number accounts**: sign up once with roll number, name, email and password, then sign in with roll number and password. KMIT (JNTUH) roll numbers only, e.g. `23BD1A0501`, `24BD5A6612`, `25BD1A055W`.
- **1v1 races**: create a race, share the 5 letter code or link, the host starts a synced countdown and everyone types the same text with live progress bars. Finish times are measured by the server. Up to 4 players per room, rematch with a new text.
- **Festive stories**: 10 Navratri and Dussehra short stories, used as the default custom text (a different one each visit), in saved texts, as quotes and as race texts.
- **Leaderboards**: all-time and daily (time 15 / 60, English) and weekly XP (counts every test, including stories and races).
- **Recurse look**: terminal green `recurse` theme, Recurse branding, hero, footer and about page.

## Stack

| Part | Tech |
| --- | --- |
| Frontend | SolidJS + TypeScript, Vite, served by nginx |
| Backend | Node 24, Express, ts-rest contracts |
| Data | MongoDB 5 (users, results, passwords), Redis (leaderboards, race rooms) |
| Proxy | Traefik |
| Hosting | Docker Compose |

Monorepo with pnpm workspaces: `frontend`, `backend`, `packages/*` (shared schemas, contracts, utils).

## Run locally

Needs Node 24, pnpm and Docker.

```bash
pnpm install
cd backend && docker compose -f docker/compose.db-only.yml up -d && cd ..   # mongodb + redis
pnpm dev-be        # backend on http://localhost:5005
pnpm dev-fe        # frontend on http://localhost:3000
```

## Self-hosting with Docker

```bash
cd docker
cp example.env .env
# set ROLL_AUTH_SECRET (openssl rand -hex 32)
# for a public domain also set DOMAIN, BASE_URL and ACME_EMAIL
docker build -t monkeytype/monkeytype-backend:latest -f docker/backend/Dockerfile ..
docker build -t monkeytype/monkeytype-frontend:latest -f docker/frontend/Dockerfile ..
docker compose -p recurse-type up -d
```

The Dockerfiles download dependencies in a separate cached layer (`pnpm fetch`), so rebuilds after code changes only take a few minutes.

## Change log

### 2026-10-16

- **Passwords**: roll number accounts now sign up with name, email and password and sign in with roll number and password. Passwords are hashed with scrypt in their own `rollCredentials` collection. Accounts made before passwords existed set theirs via sign up and keep their name.
- **Results fixed**: results from roll number accounts were rejected (`Invalid request data schema`) because their `roll-...` user ids failed the id check. Fixed, results save again.
- **Leaderboards**: daily leaderboard (time 15 / 60) and weekly XP leaderboard turned on.
- **Rate limits**: all limits raised 100x (3M requests per hour per IP) so a whole college lab behind one IP can compete.
- **Race polling**: rooms poll every 0.5 s only while racing, 2 s while waiting, 5 s after a race, 15 s in a background tab.
- **Faster builds**: dependency layer caching in both Dockerfiles, about 5 minutes per full deploy (was about 20).
- **Hosting**: Docker data moved back to the Mac mini's internal SSD, sandboxes stopped to free resources.
- **Roll numbers**: last two characters can be any letters or digits (`25BD1A055W` was rejected before).
- **Stories**: festive texts rewritten as short stories and made the default custom text for everyone.
- **Contact email** changed to recursekmit@gmail.com.

### 2026-10-15

- **1v1 races**: race rooms in Redis, join by code or link, synced countdown, live progress, server timed finish, rematch. `1v1` button in the header.
- **Roll number login**: sign in with roll number and name, signed session tokens instead of Firebase.
- **Festive texts**: Navratri and Dussehra passages added to saved texts and as quotes 7771-7780.
- **Self-hosting**: production Docker Compose setup, published via Tailscale Funnel from the club's Mac mini.
- **About page** rewritten for Recurse.
- **Redesign** in the Recurse website style: hero, grid background, ticker footer.
- **Rebrand** as Recurse Type with the `recurse` theme as default.

## License

GPL-3.0. Recurse Type is built on [Monkeytype](https://github.com/monkeytypegame/monkeytype) by Miodec and contributors.
