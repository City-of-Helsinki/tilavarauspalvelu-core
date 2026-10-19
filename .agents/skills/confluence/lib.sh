# Shared code for the Confluence scripts. Source it, do not run it.
# Credentials are read from 1Password. They are the same as for the jira-issue skill.

base_url="https://helsinkisolutionoffice.atlassian.net/wiki"
host='https://helsinkisolutionoffice\.atlassian\.net'

# Read the credentials from 1Password. Call this after the arguments are validated.
load_credentials() {
  : "${JIRA_ISSUE_OP_ACCOUNT:?Set JIRA_ISSUE_OP_ACCOUNT to your 1Password account, e.g. vincit.1password.eu}"
  : "${JIRA_ISSUE_OP_VAULT:?Set JIRA_ISSUE_OP_VAULT to the 1Password vault that has the item, e.g. Private}"
  : "${JIRA_ISSUE_OP_ITEM:?Set JIRA_ISSUE_OP_ITEM to the name of the 1Password item, e.g. Jira API key}"
  local ref="op://$JIRA_ISSUE_OP_VAULT/$JIRA_ISSUE_OP_ITEM" user token
  user="$(op read --account "$JIRA_ISSUE_OP_ACCOUNT" "$ref/username")"
  token="$(op read --account "$JIRA_ISSUE_OP_ACCOUNT" "$ref/credential")"

  # Escape backslashes and double quotes for the quoted value in the curl config.
  credentials="$user:$token"
  credentials="${credentials//\\/\\\\}"
  credentials="${credentials//\"/\\\"}"
}

api() {
  # Pass credentials through stdin so they do not show up in the process list.
  printf 'user = "%s"\n' "$credentials" \
    | curl --silent --show-error --fail-with-body --max-time 30 --config - "$base_url/$1"
}

# Fetch all pages of a v2 list endpoint. Print the merged results array.
api_all_v2() {
  local path="$1" results="[]" batch next
  while [[ -n "$path" ]]; do
    batch="$(api "$path")"
    results="$(jq --slurp '.[0] + .[1].results' <(printf '%s' "$results") <(printf '%s' "$batch"))"
    next="$(jq -r '._links.next // empty' <<<"$batch")"
    next="${next#/}"
    path="${next#wiki/}"
  done
  printf '%s' "$results"
}
