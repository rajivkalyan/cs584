# Part 1 — Do this on GitHub (no CLI required)

Your repo: **https://github.com/rajivkalyan/cs584** (adjust if you use a fork).

Create the **`tech-debt`** label, then open **three** issues (below). Each has a **one-sentence problem** and **documented as known limitation in final report** (all scope/TDSOW-aligned). Optionally add a fourth **`.env.example`** issue with **fixed in commit [hash]** — see [`TECH_DEBT_ISSUES.md`](TECH_DEBT_ISSUES.md).

---

## Step 1 — Create the label `tech-debt`

1. Open: **https://github.com/rajivkalyan/cs584/labels**  
2. **New label** → Name: **`tech-debt`** → Description: `Structural, documentation, or scope debt (final cleanup)` → Color: **`#FBCA04`** → Create.

---

## Step 2 — Three issues (paste title + body + label `tech-debt`)

### Issue 1 — Multi-user / RBAC (scope)

**Title:**
```text
tech-debt: single-tenant physician model; no RBAC or multi-facility org
```

**Body:**
```markdown
**Problem:** The shipped system models one physician `User` type with no roles (e.g. nurse, admin), shared org/tenant, or facility-level separation, which limits credible multi-staff UHC deployments.

**Resolution:** documented as known limitation in final report.
```

---

### Issue 2 — Whisper + browser STT (scope / structural, TDSOW)

**Title:**
```text
tech-debt: optional Whisper and browser STT fall short of reliable rural Bangla intake
```

**Body:**
```markdown
**Problem:** OpenAI Whisper via `/api/transcribe` is optional, API- and network-dependent, and may be slow for high-volume sessions, while default browser Web Speech STT remains device- and browser-variable for Bangla accuracy—so the dual STT pipeline in the TDSOW does not guarantee the consistency needed for stressed rural consults.

**Resolution:** documented as known limitation in final report.
```

---

### Issue 3 — Intermittent connectivity (scope, TDSOW LMIC)

**Title:**
```text
tech-debt: no offline queue or sync for intermittent connectivity
```

**Body:**
```markdown
**Problem:** The TDSOW cites intermittent connectivity as an LMIC constraint, but the prototype does not persist-and-forward voice intakes or server transcription when the network drops, so users cannot complete a deferred sync once connectivity returns.

**Resolution:** documented as known limitation in final report.
```

---

## Step 3 — Canvas

Submit: **https://github.com/rajivkalyan/cs584/issues?q=is%3Aissue+label%3Atech-debt** (adjust owner/repo).

---

## CLI alternative

Use **`scripts/setup-tech-debt-issues.sh`** after `gh auth login`, or the block in **`docs/TECH_DEBT_ISSUES.md`**.
