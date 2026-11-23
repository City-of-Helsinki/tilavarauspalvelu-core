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

# Exit if the text file cannot be read, is empty or is a secret file. The second argument names the file in the error, e.g. description.
check_text_file() {
  [[ -f "$1" && -r "$1" ]] || { echo "Cannot read the $2 file: $1" >&2; exit 2; }
  [[ -s "$1" ]] || { echo "The $2 file is empty: $1" >&2; exit 2; }
  # Resolve the path, so that "//", "." and symbolic links cannot hide a secret file.
  local resolved
  resolved="$(realpath "$1")" || { echo "Cannot resolve the $2 file: $1" >&2; exit 2; }
  if [[ "$resolved" == /run/secrets/* ]]; then
    echo "The $2 file cannot be a secret file: $1" >&2
    exit 2
  fi
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

# The team members that --assignee accepts, by their Jira display name.
# The Jira user search finds hundreds of users across the City, so the scripts accept only these names.
# Keep this list the same as the team table in SKILL.md.
team=(
  "Matti Lamppu"
  "Joonatan Kuosa"
  "Mats Eriksson"
  "Eemeli Ranta"
  "noora.alikirri"
  "Juvonen Jesse"
  "Tuomas Alahäivälä"
  "Tuomas Haapala"
)

# Print the --assignee value as "me", "none" or the Jira name in the team list. Exit if it is none of these.
parse_assignee() {
  local value="$1" lower_value member
  [[ -n "${value//[[:space:]]/}" ]] || { echo "The assignee is empty." >&2; exit 2; }
  lower_value="$(tr '[:upper:]' '[:lower:]' <<<"$value")"
  if [[ "$lower_value" == me || "$lower_value" == none ]]; then
    echo "$lower_value"
    return
  fi
  for member in "${team[@]}"; do
    if [[ "$(tr '[:upper:]' '[:lower:]' <<<"$member")" == "$lower_value" ]]; then
      echo "$member"
      return
    fi
  done
  echo "The assignee $value is not in the team list. Give me, none or one of these Jira names:" >&2
  printf '  %s\n' "${team[@]}" >&2
  exit 2
}

# Set account_id and assignee_name for a value from parse_assignee. Call it after load_credentials.
# "me" is the owner of the API token. "none" gives an empty account_id and assignee_name.
# `scope` is the query parameter for the assignable user search, e.g. issueKey=TILA-123 or project=TILA.
resolve_assignee() {
  local assignee="$1" scope="$2" myself query users
  case "$assignee" in
    none)
      account_id=""
      assignee_name=""
      ;;
    me)
      myself="$(api "rest/api/2/myself")"
      account_id="$(jq --raw-output '.accountId' <<<"$myself")"
      assignee_name="$(jq --raw-output '.displayName' <<<"$myself")"
      ;;
    *)
      query="$(jq --null-input --raw-output --arg q "$assignee" '$q | @uri')"
      # The search is fuzzy, so keep only the exact display name.
      users="$(
        api "rest/api/2/user/assignable/search?$scope&query=$query" \
          | jq --arg n "$assignee" '[.[] | select(.active and .displayName == $n)]'
      )"
      if [[ "$(jq length <<<"$users")" -ne 1 ]]; then
        echo "Jira has no single assignable user for ${scope#*=} with the name $assignee." >&2
        echo "If the name changed in Jira, update the team list in lib.sh and SKILL.md." >&2
        exit 2
      fi
      account_id="$(jq --raw-output '.[0].accountId' <<<"$users")"
      assignee_name="$(jq --raw-output '.[0].displayName' <<<"$users")"
      ;;
  esac
}
