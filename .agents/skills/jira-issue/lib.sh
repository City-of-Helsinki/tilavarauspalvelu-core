# Shared code for the Jira scripts. Source it, do not run it.
# Each script defines `usage` before it sources this file.
# macOS ships Bash 3.2. With `set -u`, it fails on "${arr[@]}" when the array is empty.
# Expand an array that can be empty as ${arr[@]+"${arr[@]}"}.

base_url="https://helsinkisolutionoffice.atlassian.net"
host='https://helsinkisolutionoffice\.atlassian\.net'
key_pattern='[A-Z][A-Z0-9]*-[0-9]+'
allowed_labels=(backend frontend operations infra design)

# Print the issue key from a key or an issue URL. Exit with the usage if it is neither.
parse_key() {
  if [[ "$1" =~ ^($key_pattern)$ ]]; then
    echo "${BASH_REMATCH[1]}"
  elif [[ "$1" =~ ^$host/browse/($key_pattern)([?#].*)?$ ]]; then
    echo "${BASH_REMATCH[1]}"
  elif [[ "$1" =~ ^$host/[^?#]*\?(.*\&)?selectedIssue=($key_pattern)([\&#].*)?$ ]]; then
    echo "${BASH_REMATCH[2]}"
  else
    echo "Not a Jira issue key or URL: $1" >&2
    usage
  fi
}

# Return 0 if the first argument is one of the other arguments.
contains() {
  local needle="$1" item
  shift
  for item in "$@"; do
    [[ "$item" == "$needle" ]] && return 0
  done
  return 1
}

# Exit if the label is not an allowed label.
check_label() {
  contains "$1" "${allowed_labels[@]}" \
    || { echo "Not an allowed label: $1. Use one of: ${allowed_labels[*]}" >&2; exit 2; }
}

# Exit if the description file cannot be read or is empty.
check_description_file() {
  [[ -f "$1" && -r "$1" ]] || { echo "Cannot read the description file: $1" >&2; exit 2; }
  [[ -s "$1" ]] || { echo "The description file is empty: $1" >&2; exit 2; }
}

# Set link_type, link_text and link_body for a link option between issue `key` and issue `other`.
# The two views of a link use the field names in opposite ways. For "A blocks B":
# - In issue A, the link has `outwardIssue: B`. In issue B, it has `inwardIssue: A`.
# - The link itself (GET or POST rest/api/2/issueLink) has `inwardIssue: A` and `outwardIssue: B`.
make_link() {
  local option="$1" key="$2" other="$3" source target
  case "$option" in
    --blocks) link_type=Blocks source="$key" target="$other" link_text="$key blocks $other" ;;
    --blocked-by) link_type=Blocks source="$other" target="$key" link_text="$key is blocked by $other" ;;
    --relates) link_type=Relates source="$key" target="$other" link_text="$key relates to $other" ;;
    *) echo "Not a link option: $option" >&2; exit 2 ;;
  esac
  link_body="$(jq --null-input --compact-output --arg t "$link_type" --arg s "$source" --arg d "$target" \
    '{type: {name: $t}, inwardIssue: {key: $s}, outwardIssue: {key: $d}}')"
}

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

# Send a GET request and print the response.
api() {
  # Pass credentials through stdin so they do not show up in the process list.
  printf 'user = "%s"\n' "$credentials" \
    | curl --silent --show-error --fail-with-body --max-time 30 --config - "$base_url/$1"
}

# Send a write request and print the response.
# The body goes through stdin, so the credentials go through a file descriptor.
send() {
  local method="$1" path="$2" body="${3-}"
  if [[ -n "$body" ]]; then
    printf '%s' "$body" \
      | curl --silent --show-error --fail-with-body --max-time 30 \
        --config <(printf 'user = "%s"\n' "$credentials") \
        --request "$method" --header 'Content-Type: application/json' --data-binary @- \
        "$base_url/$path"
  else
    curl --silent --show-error --fail-with-body --max-time 30 \
      --config <(printf 'user = "%s"\n' "$credentials") \
      --request "$method" "$base_url/$path"
  fi
}
