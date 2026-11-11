# Shared code for the Sentry scripts. Source it, do not run it.
# The token is read from the secret file if it exists, else from 1Password.

org="city-of-helsinki"
base_url="https://sentry.io/api/0/organizations/$org"
token_file="/run/secrets/sentry/token"

# Parse a Sentry issue ID or URL. Set issue_id, and event_id to the event in the URL or "latest".
# Return 1 if the argument is not an issue ID or URL.
parse_issue() {
  local issue_path='issues/([0-9]+)/?(events/([0-9a-f]{32})/?)?([?#].*)?'
  if [[ "$1" =~ ^([0-9]+)$ ]]; then
    issue_id="${BASH_REMATCH[1]}"
    event_id="latest"
  elif [[ "$1" =~ ^https://$org\.sentry\.io/$issue_path$ ]] \
    || [[ "$1" =~ ^https://sentry\.io/organizations/$org/$issue_path$ ]]; then
    issue_id="${BASH_REMATCH[1]}"
    event_id="${BASH_REMATCH[3]:-latest}"
  else
    echo "Not a Sentry issue ID or URL: $1" >&2
    return 1
  fi
}

# Read the token from the secret file, or from 1Password if the secret directory does not exist.
# Call this after the arguments are validated.
load_token() {
  if [[ -d "${token_file%/*}" ]]; then
    if [[ ! -f "$token_file" ]]; then
      echo "The token file $token_file is missing." >&2
      exit 1
    fi
    token="$(<"$token_file")"
    # Remove a carriage return that a file with CRLF line endings leaves.
    token="${token%$'\r'}"
    if [[ -z "${token//[[:space:]]/}" ]]; then
      echo "The token file $token_file is empty." >&2
      exit 1
    fi
  else
    : "${SENTRY_ISSUE_OP_ACCOUNT:?Set SENTRY_ISSUE_OP_ACCOUNT to your 1Password account, e.g. vincit.1password.eu}"
    : "${SENTRY_ISSUE_OP_VAULT:?Set SENTRY_ISSUE_OP_VAULT to the 1Password vault that has the item, e.g. Private}"
    : "${SENTRY_ISSUE_OP_ITEM:?Set SENTRY_ISSUE_OP_ITEM to the name of the 1Password item, e.g. Sentry API PAT}"
    token="$(op read --account "$SENTRY_ISSUE_OP_ACCOUNT" "op://$SENTRY_ISSUE_OP_VAULT/$SENTRY_ISSUE_OP_ITEM/credential")"
  fi

  # Escape backslashes and double quotes for the quoted value in the curl config.
  token="${token//\\/\\\\}"
  token="${token//\"/\\\"}"
}

# Call the API. The path is relative to the organization. Extra arguments go to curl.
api() {
  local path="$1"
  shift
  # Pass the token through stdin so it does not show up in the process list.
  printf 'header = "Authorization: Bearer %s"\n' "$token" \
    | curl --silent --show-error --fail-with-body --max-time 30 --config - "$@" "$base_url/$path"
}
