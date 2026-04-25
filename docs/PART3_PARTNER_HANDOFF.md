# SHUNO - Partner handoff 

**To:** GitHub project partner  
**From:** *Rajiv Chilla*  
**Product:** SHUNO (Union Health Complex Bangladesh voice-intake prototype)

---

## (a) What the app does and who it is for

SHUNO is a web app for **physicians at a Union Health Complex–style clinic** who need to **capture patient history by voice** in **Bangla or English**, optionally **see an English translation** of Bangla speech, and get a **short AI-assisted clinical summary** before **saving** the intake to a database. It is a **course prototype**, not a certified medical device or HIPAA-compliant record system; it is meant for **demos and user research**, not for real patient identifiers or PHI in production.

---

## (b) How to access it

- **Deployed (recommended for a quick look):** *`https://darling-raindrop-b4c5ed.netlify.app`*  
- **Local (for development):** Clone the repo, follow the **README** “Local setup (full path)” or “Fast path (demo mode, no database)” sections, run `npm run dev`, then open the URL Next.js prints (usually `http://localhost:3000`).

If the live site uses **demo mode**, use the **demo** email/password from the README / Netlify env. If it uses **Postgres**, use the **seeded physician** credentials after `npm run db:seed` (also in the README).

---

## (c) One specific first task to try

1. Open the app and **sign in** as the demo or seeded physician.  
2. Go to **Voice** (`/voice`), **register or pick a test patient**, then run **one voice intake** (or type if your browser blocks the mic): speak or simulate a short history, **review translation and summary** if enabled, then **approve and save**.  
3. Open **Patients** or **History** and **confirm the intake appears** linked to that patient.

That single path exercises login, intake UI, optional AI pieces, and persistence (or in-memory behavior in demo mode).

---

## (d) What is not finished

- **No multi-role access** (only the physician-style account; no separate nurse/admin flows).  
- **Speech quality** depends on the **browser Web Speech API** and optional **OpenAI**; without keys, transcription/summary use **placeholders or fallbacks**.  
- **Bangla→English translation** uses a **public third-party API** (MyMemory); not suitable for sensitive real clinical text without a different design.  
- **Not audited** for security, accessibility, or regulatory use; **`_legacy/`** code is **not** part of the running app.

---

## (e) What I would build next

- **Role-based access** (e.g. read-only nurse, site admin) and **audit log** of who viewed or edited intakes.  
- **Replace or gate MyMemory** with an on-prem or contracted translation path and explicit consent copy.  
- **Automated tests** (API + critical UI paths) and **CI** on every PR.  
- **Remove or archive `_legacy/`** into a branch so the default tree matches the shipped stack only.

---

