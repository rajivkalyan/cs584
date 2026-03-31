#!/usr/bin/env bash
# Add PROJECT_BOARD items to GitHub Project (Kanban) and set Status column
# Project: https://github.com/users/rajivkalyan/projects/8
# Run: GITHUB_TOKEN=ghp_xxx ./scripts/sync-project-board.sh
# Requires: curl, jq. Create token: GitHub → Settings → Developer settings → PAT (scope: project)

set -e
USER="rajivkalyan"
PROJECT_NUMBER=8
API="https://api.github.com/graphql"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Set GITHUB_TOKEN (GitHub → Settings → Developer settings → PAT, scope: project)"
  exit 1
fi
if ! command -v jq &>/dev/null; then
  echo "jq is required to parse responses and set Status. Install: brew install jq"
  exit 1
fi

# Get project node ID (user-owned project); build payload in jq to avoid quoting issues
PROJECT_PAYLOAD=$(jq -n --arg user "$USER" --argjson num "$PROJECT_NUMBER" '{query: ("query { user(login: \"" + $user + "\") { projectV2(number: " + ($num|tostring) + ") { id } } }")}')
RESP=$(curl -s -H "Authorization: bearer $GITHUB_TOKEN" -H "Content-Type: application/json" \
  -X POST -d "$PROJECT_PAYLOAD" "$API")
PROJECT_ID=$(echo "$RESP" | jq -r '.data.user.projectV2.id // empty')
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  echo "Could not get project ID. Check token and that project $PROJECT_NUMBER exists under @$USER."
  echo "$RESP" | jq -r '.errors[]?.message // .message // .' 2>/dev/null || true
  exit 1
fi
echo "Project ID: $PROJECT_ID"

# Get Status field and option IDs (build payload in jq to avoid shell quoting issues)
RESP_FILE=$(mktemp)
trap 'rm -f "$RESP_FILE"' EXIT
FIELDS_PAYLOAD=$(jq -n --arg projectId "$PROJECT_ID" '{query: ("query { node(id: \"" + $projectId + "\") { ... on ProjectV2 { fields(first: 20) { nodes { ... on ProjectV2SingleSelectField { id name options { id name } } } } } } }")}')
curl -s -H "Authorization: bearer $GITHUB_TOKEN" -H "Content-Type: application/json" \
  -X POST -d "$FIELDS_PAYLOAD" "$API" -o "$RESP_FILE"
if ! jq -e . "$RESP_FILE" >/dev/null 2>&1; then
  echo "API response was not valid JSON. First 500 chars:"
  head -c 500 "$RESP_FILE"
  echo ""
  exit 1
fi

STATUS_FIELD_ID=""
OPTION_DONE=""
OPTION_IN_PROGRESS=""
OPTION_BACKLOG=""

status_node=$(jq -c '.data.node.fields.nodes[]? | select(.name == "Status")' "$RESP_FILE" 2>/dev/null | head -1)
if [ -z "$status_node" ] || [ "$status_node" = "null" ]; then
  echo "Could not find Status field."
  jq -r '.errors[]?.message // empty' "$RESP_FILE" 2>/dev/null || true
  exit 1
fi
STATUS_FIELD_ID=$(echo "$status_node" | jq -r '.id')
for opt in $(echo "$status_node" | jq -c '.options[]? // []'); do
  oid=$(echo "$opt" | jq -r '.id')
  oname=$(echo "$opt" | jq -r '.name')
  case "$(echo "$oname" | tr '[:upper:]' '[:lower:]')" in
    done) OPTION_DONE="$oid" ;;
    in\ progress) OPTION_IN_PROGRESS="$oid" ;;
    todo|backlog) OPTION_BACKLOG="$oid" ;;
  esac
done
if [ -z "$STATUS_FIELD_ID" ] || [ "$STATUS_FIELD_ID" = "null" ]; then
  echo "Could not find Status field on project."
  exit 1
fi
echo "Status field: $STATUS_FIELD_ID (Done=$OPTION_DONE, In progress=$OPTION_IN_PROGRESS, Backlog/Todo=$OPTION_BACKLOG)"

# Add draft and set status. Title must be JSON-escaped for GraphQL string.
add_draft() {
  local title="$1"
  local status="$2"   # done | in_progress | backlog
  local option_id=""
  case "$status" in
    done) option_id="$OPTION_DONE" ;;
    in_progress) option_id="$OPTION_IN_PROGRESS" ;;
    backlog) option_id="$OPTION_BACKLOG" ;;
    *) option_id="$OPTION_BACKLOG" ;;
  esac
  add_payload=$(jq -n --arg projectId "$PROJECT_ID" --arg title "$title" \
    '{query: ("mutation { addProjectV2DraftIssue(input: { projectId: \"" + $projectId + "\", title: " + ($title | @json) + " }) { projectItem { id } } }")}')
  resp=$(curl -s -H "Authorization: bearer $GITHUB_TOKEN" -H "Content-Type: application/json" \
    -X POST -d "$add_payload" "$API")
  item_id=$(echo "$resp" | jq -r '.data.addProjectV2DraftIssue.projectItem.id // empty')
  if [ -z "$item_id" ] || [ "$item_id" = "null" ]; then
    echo "  ! failed to add: $title" >&2
    echo "$resp" | jq -r '.errors[]?.message // .' 2>/dev/null || true
    return 1
  fi
  if [ -n "$option_id" ]; then
    update_payload=$(jq -n --arg projectId "$PROJECT_ID" --arg itemId "$item_id" \
      --arg fieldId "$STATUS_FIELD_ID" --arg optionId "$option_id" \
      '{query: ("mutation { updateProjectV2ItemFieldValue(input: { projectId: \"" + $projectId + "\", itemId: \"" + $itemId + "\", fieldId: \"" + $fieldId + "\", value: { singleSelectOptionId: \"" + $optionId + "\" } }) { projectV2Item { id } } }")}')
    curl -s -H "Authorization: bearer $GITHUB_TOKEN" -H "Content-Type: application/json" \
      -X POST -d "$update_payload" "$API" > /dev/null
  fi
  echo "  + [$status] $title"
}

echo "Adding Completed → Done..."
add_draft "UHC Physician Login & Auth (UI)" "done"
add_draft "Patient data collection (UI)" "done"
add_draft "Voice capture interface" "done"
add_draft "STT pipeline (Whisper)" "done"
add_draft "Browser (free) transcription" "done"
add_draft "English translation" "done"
add_draft "Session persistence (client)" "done"
add_draft "Automated summary display" "done"
add_draft "Full app UI (EN + BN)" "done"
add_draft "Netlify deploy config" "done"
add_draft "Single-app structure" "done"

echo "Adding In progress..."
add_draft "Public Netlify URL" "in_progress"
add_draft "Project board update" "in_progress"

echo "Adding Backlog..."
add_draft "Auth (NextAuth / backend)" "backlog"
add_draft "Database (PostgreSQL + Prisma)" "backlog"
add_draft "Structured history questionnaire" "backlog"
add_draft "Bangla voice feedback" "backlog"
add_draft "DHIS2 integration (out of scope)" "backlog"
add_draft "Acuity classification (out of scope)" "backlog"
add_draft "Offline mode (out of scope)" "backlog"
add_draft "Dialect adaptation (out of scope)" "backlog"

echo "Done. Open https://github.com/users/rajivkalyan/projects/8 — cards are in Done / In progress / Backlog."