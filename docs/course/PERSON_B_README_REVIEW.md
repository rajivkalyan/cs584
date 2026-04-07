# Person B — Peer README review

**Course / assignment:** *(fill in, e.g. CS 584 — README review, due Mar 31)*  

**Reviewer (Person B):** *(your full name)*  

**Partner reviewed (Person A):** Rajiv *(adjust if different)*  

**Repository reviewed:** https://github.com/rajivkalyan/cs584 *(update if the canonical URL differs)*  

**Sources used:** Partner’s `README.md` and `.env.example` only (no direct questions to the developer).

---

### 1. In one sentence, what does this application do?

It is a **Next.js physician-facing prototype (“SHUNO”) for Union Health Complex** that lets doctors **register patients**, run **voice intake in Bangla/English**, optionally **translate Bangla to English**, generate an **AI clinical summary** (with fallbacks), and **save approved data** to **PostgreSQL** or to **in-memory demo mode** when configured that way.

---

### 2. Environment variables: Does the README explain how to configure the app? Is there a `.env.example`, and does it match what the README describes?

**Yes.** The README has a dedicated **Environment variables** table with each variable’s **required/optional** status and **purpose**, plus notes on **Neon pooled URLs** (`pgbouncer=true`) and a reminder **not to commit `.env`**.

A **`.env.example`** is present and **`cp .env.example .env`** is documented in Quick start. The example file lists the same core settings the README covers (`OPENAI_API_KEY`, `UHC_DEMO_FALLBACK`, `NEXTAUTH_*`, `UHC_DEMO_MODE`, demo credentials, `DATABASE_URL`, optional `SEED_PASSWORD`) and adds **inline comments** (e.g. Neon/Netlify steps) that complement the README rather than contradict it. **README and `.env.example` are aligned** for grading purposes.

---

### 3. How is the code organized? (Brief summary of folders / main pieces.)

- **`app/`** — App Router **pages** and **API routes** (patients, intakes, auth, translate, transcribe, summarize, health check, etc.).
- **`components/`** — UI building blocks (e.g. voice capture, guided intake, shell).
- **`context/`** — React context (language, store).
- **`lib/`** — Shared logic: auth, Prisma/DB helpers, copy strings, API client.
- **`prisma/`** — Schema and **seed** script.
- **`_legacy/`** — Older Deno prototype; **explicitly noted as unused** by the Next.js app.

The README also lists **npm scripts** (`dev`, `build`, `start`, `db:push`, `db:seed`, `lint`) and **main UI routes** (`/login`, `/`, `/voice`, `/patients`, `/history`).

---

### 4. External cloud services or third-party APIs: how many, and what are they named?

From the **README** (and the API surface it names), the app integrates with:

| # | Service | Role |
|---|---------|------|
| 1 | **OpenAI** | Optional **Whisper** transcription and **GPT**-style summarization (`OPENAI_API_KEY`). |
| 2 | **MyMemory** (via **`/api/translate`**) | **Bangla → English** translation proxy; **no API key** in docs. |
| 3 | **PostgreSQL** | Primary persistence; README points to **Neon** as a hosted option. |
| 4 | **Netlify** | **Hosting/build** (`netlify.toml`, env vars for deploy). |

**NextAuth** is documented as the **auth** layer (credentials + JWT); it is not described as calling an extra external identity provider beyond what the app configures. **Browser Web Speech API** is local to the client, not a separate billed cloud API in the README.

**Count (for a strict “named external dependency” reading):** **four** named external/integration categories above (OpenAI, MyMemory, Postgres/Neon, Netlify).

---

### 5. What did the README still not answer? (Be honest but proportional.)

The README is **strong on setup, env, deploy, routes, and stack**. Items it **does not fully spell out**—mostly **nice-to-haves**, not blockers for running the app—include:

- **Automated testing** beyond documenting `npm run lint` (no unit/e2e suite or CI workflow is described).
- **Exact OpenAI model IDs / API versioning** and **rate-limit or cost** expectations (only high-level “optional OpenAI” is given).
- **Operational runbooks** (backup/restore, rotation of secrets, monitoring) and **contribution / PR** conventions.
- **MyMemory** limits, privacy implications of sending intake text to a public translation endpoint, and **data retention** policies (the README does state the app is **not HIPAA-compliant** and should not hold real PHI).

None of these omissions prevent a reader from **cloning, configuring `.env`, running migrations/seed, and starting the app** as documented.

---

*End of Person B submission.*
