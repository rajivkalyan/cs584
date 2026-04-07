# Person B — Peer README review (Canvas submission)

**Documentation reviewed:** Repository **cs584-saathi** (GitHub: **shreeyanallaboina/cs584-saathi**), primary source **README.md** at repo root.  
**Developer / partner (Person A):** **Shreeya Nallaboina** (GitHub: **shreeyanallaboina**) — *correct if your roster uses a different legal/spelling name.*  
**Reviewer (Person B — you):** *[Your full name]*  
**Course / due date:** *[e.g. CS 584 — Mar 31]*

---

## 1. What does this app do in one sentence?

**Saathi** is a **mobile-first web portal** for **private reproductive health information** (contraception, menstrual health, abortion-related education) where **returning users** log in with username/password, **new users** register with an **LHW referral code**, **Lady Health Workers** have a **separate portal** to mint **single-use codes**, a **Gemini-grounded chatbot** answers only when **confidence ≥ 75%** (otherwise it offers to post the question to an **anonymous forum** with **pseudonymous handles** and **fixed topics**), and the UI uses **pink/green branding** with an **otter FAB** for chat.

---

## 2. What environment variables are needed, and are they in a `.env.example`?

### Variables the README describes (directly or by deployment context)

| Variable / setting | When / purpose |
|--------------------|----------------|
| **`GEMINI_API_KEY`** | **Google Gemini** for `/api/chat` in normal (SOW) operation; README says create a key in Google AI Studio (or Vertex billing path). |
| **`GOOGLE_API_KEY`** | **Alternative name** for the same; README states it also works. |
| **`GEMINI_MODEL`** | **Optional**; default **`gemini-2.0-flash`**; can switch (e.g. `gemini-1.5-flash`). |
| **`SECRET_KEY`** | **Production / Cloud Run** — README instructs setting a **strong** secret (example: `openssl rand -hex 32`); warns **never commit** it. |
| **`DATABASE_URL`** | **Optional upgrade path** — README says to use **PostgreSQL** (e.g. **Cloud SQL**) when moving beyond default SQLite / ephemeral DB. |
| **`PORT`** | **Docker / Cloud Run** — container listens on **`PORT`** (Cloud Run sets this, often **8080**). |
| **`K_SERVICE`** | **Not set by the developer** — README notes **Cloud Run injects** this; app then **defaults** to **`sqlite:////tmp/saathi.db`** (ephemeral). |

**Local backend:** README tells you to **`export GEMINI_API_KEY=...`** (or `GOOGLE_API_KEY`) before **`python app.py`**, rather than listing a `.env` workflow.

### Is there a `.env.example`, and does the README point to it?

**Honest answer from the documentation alone:** The **README does not mention** a **`.env.example`** file or **`python-dotenv`** / loading from `.env`. The **repository navigation snippet** shared with the review (top-level files) listed **`backend/`**, **`frontend/`**, Docker/git files, and images — **no `.env.example` was shown**.  

**Conclusion for grading:** Environment needs are **explained in prose and deploy commands**, but **alignment with a committed `.env.example` is not documented**. If the repo **does** include `.env.example` inside `backend/` or elsewhere, the **README should say so**; as a reviewer I can only report **what the README makes verifiable**.

---

## 3. Describe the code structure — top-level folders/modules and what each contains (plain language)

- **`backend/`** — **Python Flask** server: **`app.py`** as the main entrypoint; **SQLite** database file **`saathi.db`** lives **beside `app.py`** per README; **`knowledge_base.txt`** holds **curated text** injected into the model **system prompt** (expand this file to improve grounded answers); **API** listens on **`http://127.0.0.1:5000`** in local dev; **`requirements.txt`** for dependencies; first run **seeds** demo LHW credentials and a sample referral code.
- **`frontend/`** — **React** app built with **Vite** and **TypeScript**; **`npm install`** / **`npm run dev`** for local UI; **Vite dev server proxies `/api`** to the Flask backend so the browser calls **relative `/api/...`** paths.
- **Repo root `Dockerfile`** — **Build pipeline in one image:** builds the **frontend**, copies the built **`dist`** into **`backend/static/dist`**, and runs the app with **Gunicorn** on **`PORT`** so **one container** serves both the **SPA** and **`/api/*`** (no separate public API hostname).
- **Image / branding assets** — README says **logo** and **otter** live under **`frontend/public/`** as **`logo.png`** and **`otter.png`**; additional **Saathi-branded PNGs** appear at **repo root** in the file listing (likely design exports or duplicates — README emphasizes `frontend/public/` for runtime assets).
- **`.dockerignore`**, **`.gitignore`** — standard ignore rules for Docker builds and Git.
- **`.Rhistory`** — present at root (R session history); **not described** in README as part of the app stack.

---

## 4. How many external cloud services or APIs does this app use — name each?

Count depends slightly on how strict “external” is; below is an **honest enumeration** from the README.

**Named third-party / cloud products**

1. **Google Gemini (Generative Language API)** — **`/api/chat`**; default model **`gemini-2.0-flash`**; JSON-grounded answers with **confidence ≥ 0.75** per SOW; requires **`GEMINI_API_KEY`** or **`GOOGLE_API_KEY`** (or heuristic fallback locally without a key).

**Google Cloud Platform (GCP) — named in deploy instructions**

2. **Google Cloud Run** — **hosting** for the **containerized** app (`gcloud run deploy`, service URL example given).
3. **Google Container Registry (GCR)** — **`gcloud builds submit --tag gcr.io/PROJECT_ID/saathi`** for the image used by Cloud Run.
4. **Secret Manager** (optional but **documented**) — example **`gcloud secrets create`** and **`--set-secrets`** for **`GEMINI_API_KEY`** on Cloud Run.
5. **Cloud SQL (PostgreSQL)** — **recommended** in README for a **real pilot** instead of **ephemeral SQLite** on Cloud Run (`DATABASE_URL`).

**Not “cloud APIs” in the README’s sense**

- **SQLite** — **local file** (`saathi.db`) or **`/tmp`** on Cloud Run; **not** an external vendor API.
- **Browser / same-origin** — frontend talks to **`/api`** on the **same deployment**; no separate **Vercel/Netlify** API host is required per README.

**Reasonable totals to put in Canvas**

- **If counting only “vendor APIs” the app calls at runtime:** **1** (**Google Gemini**).  
- **If counting every **named** Google Cloud product in the deploy path:** **up to 5** (Gemini + Cloud Run + GCR + Secret Manager + Cloud SQL).  
- **Middle ground (common for class submissions):** **1 primary external API (Gemini)** plus **GCP Cloud Run** (and optionally **GCR**, **Secret Manager**, **Cloud SQL**) as **infrastructure**.

---

## 5. List every question the README didn’t answer

Be thorough; items below are **not** claimed to be flaws — many are **out of scope** for a prototype README — but they **are** unanswered in the text provided.

**Repository & onboarding**

- Whether a **`.env.example`** (or `.env.template`) exists **anywhere** in the repo and **which variables** it lists.
- **Minimum Python** and **Node.js** versions (only `python3` and `npm` are implied).
- **Windows-specific** notes beyond **one line** for venv activation (e.g. common Flask/`python` path issues).
- **Exact clone URL** / repo name consistency (Docker section says **`cd /path/to/Final`**, which **does not match** the **`cs584-saathi`** repo name — likely a copy-paste error; README doesn’t clarify the correct path).

**Backend internals**

- **Full list of HTTP routes** (only **`/api/chat`**, **`/api/health`**, and generic **`/api/*`** are mentioned).
- How **database tables** for **users, LHW, referrals, forum posts** are **created** (migrations, `create_all`, scripts).
- **Authentication** implementation details (sessions, JWT, Flask-Login, etc.).
- **How anonymous forum handles** are generated and stored.
- **Rate limiting**, **CORS**, and **security headers** for production.

**Frontend**

- **Key routes/pages** in the SPA (beyond “mobile-first portal”).
- **Environment variables for Vite** (`VITE_*`) — README says **none required** for API URL in production; doesn’t document any optional ones (analytics, feature flags, etc.).

**Chatbot / AI**

- **Exact JSON schema** returned by `/api/chat` (field names for confidence, `can_answer`, etc.).
- **How the “overlap heuristic” fallback** works when **no API key** is set (algorithm, limitations).
- **Token limits**, **latency**, or **cost** expectations for Gemini.

**Testing & quality**

- **How to run tests** (pytest, frontend tests) — **not mentioned**.
- **Linting / formatting** commands — **not mentioned**.
- **CI/CD** (GitHub Actions, etc.) — **not mentioned**.

**Legal, ethics, content**

- **Content moderation** workflow for the forum beyond topic restrictions.
- **Data retention**, **deletion**, **export** for user accounts.
- **Disclaimer** text scope (README is product-focused, not legal policy).

**Misc**

- Purpose of **`.Rhistory`** at repo root and whether it should be **gitignored**.
- Whether **Vertex AI** vs **Google AI Studio** keys differ in setup for this codebase.

---

*End of submission — paste into Canvas text box or Google Doc as required.*
