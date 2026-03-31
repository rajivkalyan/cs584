# SHUNO — Voice-enabled clinical assessment (UHC Bangladesh prototype)

Next.js app for **Union Health Complex** physicians: register patients, run **voice intake** (Bangla/English), optional **English translation**, **AI clinical summary** (with fallback), and **approve-before-save** persistence to **PostgreSQL** (or in-memory demo mode).

## Stack

- **Next.js 14** (App Router), **NextAuth** (credentials + JWT)
- **Prisma** + **PostgreSQL** (local or [Neon](https://neon.tech))
- **Web Speech API** (browser STT/TTS); optional **OpenAI** (Whisper transcribe + GPT summarize)
- **Netlify** (`@netlify/plugin-nextjs`)

## Quick start (local)

1. **Clone and install**

   ```bash
   git clone <your-repo-url>
   cd SWE
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` (see [Environment variables](#environment-variables)).

3. **Database**

   Create a local DB (e.g. `uhc_voice`), set `DATABASE_URL` in `.env`, then:

   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) (or the port Next prints). Sign in with the seeded physician (see below).

## Default login (after seed)

| Field    | Value                 |
|----------|------------------------|
| Email    | `doctor@shuno.online` |
| Password | `1234`                 |

Override seed password with `SEED_PASSWORD` in `.env` before `npm run db:seed`.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes for real persistence | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random secret (e.g. `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | App origin: `http://localhost:3000` locally, `https://your-site.netlify.app` in production |
| `UHC_DEMO_MODE` | No | `true` = no DB needed; in-memory data + demo login. Use `false` or unset with Neon. |
| `OPENAI_API_KEY` | No | Cloud transcribe + GPT summary; app has fallbacks if missing |
| `UHC_DEMO_EMAIL` / `UHC_DEMO_PASSWORD` | No | Demo login when `UHC_DEMO_MODE=true` |

**Neon (pooled URL):** append `&pgbouncer=true` to `DATABASE_URL` for Prisma + PgBouncer.

**Never commit `.env`** — only `.env.example`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Run production build locally |
| `npm run db:push` | Apply `schema.prisma` to the database |
| `npm run db:seed` | Seed default physician user |
| `npm run lint` | ESLint |

## Deploy on Netlify

1. Connect the repo; build is driven by **`netlify.toml`** (`scripts/netlify-build.cjs`: `db push`, `db seed`, then `npm run build`).
2. In **Site settings → Environment variables**, set at least:
   - `DATABASE_URL` (Build **and** Functions scopes)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your live site URL, no trailing slash)
   - `UHC_DEMO_MODE=false` (or remove) when using Postgres
3. Redeploy after changing env vars.

**Smoke test:** `https://YOUR_SITE.netlify.app/api/health/db` — expect `demoMode: false` and `prisma: "ok"` when the database is wired correctly.

## Main routes

| Path | Description |
|------|-------------|
| `/login` | Physician sign-in |
| `/` | Dashboard |
| `/voice` | Intake: patient search, quick register, free-form or guided voice |
| `/patients` | Patient list, edit, delete, intakes |
| `/history` | Past intakes |

## Project layout (short)

- `app/` — pages and API routes (`/api/patients`, `/api/intakes`, `/api/auth`, etc.)
- `components/` — UI (e.g. `VoiceCapture`, `GuidedIntake`, `AppShell`)
- `context/` — `LanguageProvider`, `StoreProvider`
- `lib/` — auth, Prisma/db helpers, copy strings, API client
- `prisma/` — `schema.prisma`, `seed.js`

## License / course use

Private academic / prototype — adjust as needed for your institution.
