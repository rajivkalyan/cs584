# Part 1 — Tech debt audit (GitHub issues)

Create the **`tech-debt`** label once, then open **at least three** issues (one per item). Each issue: **one-sentence problem** + **resolution** line — either `fixed in commit [hash]` or `documented as known limitation in final report.`

Categories used below: **scope** (multi-user, Whisper/STT, LMIC connectivity) aligned with **[`docs/TDSOW-pd.txt`](TDSOW-pd.txt)** (TDSOW); add a **documentation** issue with a real commit hash if you want both resolution types represented.

---

## 1. Create the `tech-debt` label

**GitHub UI:** Issues → Labels → New label  

- **Name:** `tech-debt`  
- **Description:** Structural, documentation, or scope debt (final cleanup)  
- **Color:** `#FBCA04`

**CLI:**

```bash
gh label create "tech-debt" --description "Structural, documentation, or scope debt (final cleanup)" --color "FBCA04"
```

---

## 2. Recommended three issues (scope + TDSOW)

### Issue 1 — Scope debt (multi-user)

**Title:** `tech-debt: single-tenant physician model; no RBAC or multi-facility org`

**Body:**
```markdown
**Problem:** The shipped system models one physician `User` type with no roles (e.g. nurse, admin), shared org/tenant, or facility-level separation, which limits credible multi-staff UHC deployments.

**Resolution:** documented as known limitation in final report.
```

---

### Issue 2 — Scope / structural debt (Whisper + STT, TDSOW §2–3)

**Title:** `tech-debt: optional Whisper and browser STT fall short of reliable rural Bangla intake`

**Body:**
```markdown
**Problem:** OpenAI Whisper via `/api/transcribe` is optional, API- and network-dependent, and may be slow for high-volume sessions, while default browser Web Speech STT remains device- and browser-variable for Bangla accuracy—so the dual STT pipeline in the TDSOW does not guarantee the consistency needed for stressed rural consults.

**Resolution:** documented as known limitation in final report.
```

---

### Issue 3 — Scope debt (LMIC connectivity, TDSOW §1)

**Title:** `tech-debt: no offline queue or sync for intermittent connectivity`

**Body:**
```markdown
**Problem:** The TDSOW cites intermittent connectivity as an LMIC constraint, but the prototype does not persist-and-forward voice intakes or server transcription when the network drops, so users cannot complete a deferred sync once connectivity returns.

**Resolution:** documented as known limitation in final report.
```

---

## 3. Optional fourth issue — documentation debt (`fixed in commit`)

Use this if you want one issue resolved with a **commit hash** (e.g. generic `DATABASE_URL` in `.env.example`).

**Title:** `tech-debt: .env.example used machine-specific DATABASE_URL`

**Body:**
```markdown
**Problem:** The committed `.env.example` used a developer-specific PostgreSQL username, which misleads new clones and violates the “drop-in template” expectation for onboarding.

**Resolution:** fixed in commit [COMMIT_HASH]
```

Replace `[COMMIT_HASH]` with `git rev-list -1 --short HEAD -- .env.example` after pushing.

---

## 4. CLI: create the three recommended issues

```bash
gh auth login   # once
cd /path/to/cs584

gh label create "tech-debt" --description "Structural, documentation, or scope debt (final cleanup)" --color "FBCA04" 2>/dev/null || true

gh issue create --label tech-debt \
  --title "tech-debt: single-tenant physician model; no RBAC or multi-facility org" \
  --body "**Problem:** The shipped system models one physician \`User\` type with no roles (e.g. nurse, admin), shared org/tenant, or facility-level separation, which limits credible multi-staff UHC deployments.

**Resolution:** documented as known limitation in final report."

gh issue create --label tech-debt \
  --title "tech-debt: optional Whisper and browser STT fall short of reliable rural Bangla intake" \
  --body "**Problem:** OpenAI Whisper via \`/api/transcribe\` is optional, API- and network-dependent, and may be slow for high-volume sessions, while default browser Web Speech STT remains device- and browser-variable for Bangla accuracy—so the dual STT pipeline in the TDSOW does not guarantee the consistency needed for stressed rural consults.

**Resolution:** documented as known limitation in final report."

gh issue create --label tech-debt \
  --title "tech-debt: no offline queue or sync for intermittent connectivity" \
  --body "**Problem:** The TDSOW cites intermittent connectivity as an LMIC constraint, but the prototype does not persist-and-forward voice intakes or server transcription when the network drops, so users cannot complete a deferred sync once connectivity returns.

**Resolution:** documented as known limitation in final report."
```

---

## 5. Canvas submission link

`https://github.com/OWNER/REPO/issues?q=is%3Aissue+label%3Atech-debt`
