#!/usr/bin/env bash
# Part 1: create `tech-debt` label + 3 scope/TDSOW issues (GitHub CLI).
# Prerequisite: `gh auth login` completed successfully.
# Run once — re-running creates duplicate issues.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in. Run:  gh auth login"
  exit 1
fi

gh label create "tech-debt" \
  --description "Structural, documentation, or scope debt (final cleanup)" \
  --color "FBCA04" 2>/dev/null || echo "Label tech-debt already exists (ok)."

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

echo ""
echo "Done. Filtered issues URL:"
if SLUG="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)"; then
  echo "https://github.com/${SLUG}/issues?q=is%3Aissue+label%3Atech-debt"
else
  echo "https://github.com/<OWNER>/<REPO>/issues?q=is%3Aissue+label%3Atech-debt"
fi
