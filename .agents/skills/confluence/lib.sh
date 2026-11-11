# Shared code for the Confluence scripts. Source it, do not run it.
# Credentials are read from the secret files or from 1Password. They are the same as for the jira-issue skill.

base_url="https://helsinkisolutionoffice.atlassian.net/wiki"
host='https://helsinkisolutionoffice\.atlassian\.net'

# Read the credentials from the secret files, or from 1Password if the secret directory does not exist.
# Call this after the arguments are validated.
load_credentials() {
  local secret_dir="/run/secrets/jira" user token name
  if [[ -d "$secret_dir" ]]; then
    for name in username token; do
      if [[ ! -f "$secret_dir/$name" ]]; then
        echo "The credential file $secret_dir/$name is missing. Mount both username and token." >&2
        exit 1
      fi
    done
    user="$(<"$secret_dir/username")"
    token="$(<"$secret_dir/token")"
    # Remove a carriage return that a file with CRLF line endings leaves.
    user="${user%$'\r'}"
    token="${token%$'\r'}"
    if [[ -z "${user//[[:space:]]/}" || -z "${token//[[:space:]]/}" ]]; then
      echo "A credential file in $secret_dir is empty." >&2
      exit 1
    fi
  else
    : "${JIRA_ISSUE_OP_ACCOUNT:?Set JIRA_ISSUE_OP_ACCOUNT to your 1Password account, e.g. vincit.1password.eu}"
    : "${JIRA_ISSUE_OP_VAULT:?Set JIRA_ISSUE_OP_VAULT to the 1Password vault that has the item, e.g. Private}"
    : "${JIRA_ISSUE_OP_ITEM:?Set JIRA_ISSUE_OP_ITEM to the name of the 1Password item, e.g. Jira API key}"
    local ref="op://$JIRA_ISSUE_OP_VAULT/$JIRA_ISSUE_OP_ITEM"
    user="$(op read --account "$JIRA_ISSUE_OP_ACCOUNT" "$ref/username")"
    token="$(op read --account "$JIRA_ISSUE_OP_ACCOUNT" "$ref/credential")"
  fi

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
