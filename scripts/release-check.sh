#!/usr/bin/env bash
# Checks that a release is live on a Varaamo environment. Run with --help for the options.
set -euo pipefail

usage() {
    cat <<'EOF'
Usage: release-check.sh [options] <env>

Checks which release runs on a Varaamo environment.

  <env>                  dev, test, staging, production, or a base URL such as https://varaamo.test.hel.ninja

Without --version, prints the version of each target and exits.
With --version, checks that each target runs that version, then loads a few pages of each target.

Options:
  -v, --version VERSION  Expected version, such as v1.74.2, 1.74.2 or a short commit hash.
  -w, --wait             Poll until each target runs the version. Needs --version.
  -t, --timeout SECONDS  Stop polling after this time. Default 900.
  -i, --interval SECONDS Time between polls. Default 15.
  --targets LIST         Comma-separated list of customer, staff and backend. Default all of them.
  --no-pages             Check only the versions, not the pages.
  -h, --help             Show this help.

Exit codes: 0 when all checks pass, 1 when a check fails, 2 for a usage error.
EOF
}

# --- Arguments ------------------------------------------------------------------------------------------------------

expected_version=""
is_wait=false
timeout_seconds=900
interval_seconds=15
targets="customer,staff,backend"
is_page_check=true
environment=""

while [ $# -gt 0 ]; do
    case "$1" in
        -v | --version) expected_version="${2:?--version needs a value}"; shift 2 ;;
        -w | --wait) is_wait=true; shift ;;
        -t | --timeout) timeout_seconds="${2:?--timeout needs a value}"; shift 2 ;;
        -i | --interval) interval_seconds="${2:?--interval needs a value}"; shift 2 ;;
        --targets) targets="${2:?--targets needs a value}"; shift 2 ;;
        --no-pages) is_page_check=false; shift ;;
        -h | --help) usage; exit 0 ;;
        -*) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
        *)
            if [ -n "$environment" ]; then
                echo "Give only one env." >&2
                exit 2
            fi
            environment="$1"
            shift
            ;;
    esac
done

case "$environment" in
    dev) base_url="https://varaamo.dev.hel.ninja" ;;
    test) base_url="https://varaamo.test.hel.ninja" ;;
    stage | staging) base_url="https://varaamo.stage.hel.ninja" ;;
    prod | production) base_url="https://varaamo.hel.fi" ;;
    http://* | https://*) base_url="${environment%/}" ;;
    "") usage >&2; exit 2 ;;
    *) echo "Unknown env '$environment'. Use dev, test, staging, production or a base URL." >&2; exit 2 ;;
esac

if [ "$is_wait" = true ] && [ -z "$expected_version" ]; then
    echo "--wait needs --version." >&2
    exit 2
fi

for number in "$timeout_seconds" "$interval_seconds"; do
    if ! [[ "$number" =~ ^[0-9]+$ ]]; then
        echo "Timeout and interval must be whole seconds, not '$number'." >&2
        exit 2
    fi
done

IFS=',' read -r -a target_list <<<"$targets"
for target in "${target_list[@]}"; do
    case "$target" in
        customer | staff | backend) ;;
        *) echo "Unknown target '$target'. Use customer, staff or backend." >&2; exit 2 ;;
    esac
done

for command in curl jq; do
    if ! command -v "$command" >/dev/null; then
        echo "This script needs '$command'." >&2
        exit 2
    fi
done

work_directory=$(mktemp -d)
trap 'rm -rf "$work_directory"' EXIT
cookie_jar="$work_directory/cookies"

# --- Helpers --------------------------------------------------------------------------------------------------------

# The tag in git starts with "v". Accept the version with or without it.
normalize_version() {
    echo "${1#v}"
}

version_url() {
    case "$1" in
        customer) echo "$base_url/healthcheck" ;;
        staff) echo "$base_url/kasittely/healthcheck" ;;
        backend) echo "$base_url/monitoring/readiness/" ;;
    esac
}

# Prints the version of a target, "missing" when the response has no version, or "error" when the request fails.
read_version() {
    local body
    if ! body=$(curl --silent --fail --max-time 20 "$(version_url "$1")"); then
        echo "error"
        return
    fi
    echo "$body" | jq --raw-output '.version // "missing"' 2>/dev/null || echo "missing"
}

# The first page load redirects to the backend '/csrf/' and back, so the requests share a cookie jar.
page_paths() {
    case "$1" in
        customer) echo "/ /en/search /sv/search" ;;
        staff) echo "/kasittely/" ;;
        backend) echo "/graphql/?query=%7B__typename%7D" ;;
    esac
}

# Prints "ok" or the reason why the page failed.
check_page() {
    local target="$1" path="$2" page="$work_directory/page" status
    status=$(
        curl --silent --location --max-time 30 --cookie "$cookie_jar" --cookie-jar "$cookie_jar" \
            --output "$page" --write-out "%{http_code}" "$base_url$path"
    ) || status="error"

    if [ "$status" != "200" ]; then
        echo "HTTP $status"
        return
    fi

    if [ "$target" = "backend" ]; then
        if [ "$(jq --raw-output '.data.__typename' "$page" 2>/dev/null)" = "Query" ]; then
            echo "ok"
        else
            echo "no GraphQL data"
        fi
        return
    fi

    local page_version
    page_version=$(grep --only-matching --max-count=1 '<meta name="version" content="[^"]*"' "$page" | sed 's/.*content="//; s/"$//' || true)
    if [ -z "$page_version" ]; then
        echo "no version meta"
    elif [ -n "$expected_version" ] && [ "$(normalize_version "$page_version")" != "$(normalize_version "$expected_version")" ]; then
        echo "version $page_version"
    else
        echo "ok"
    fi
}

# --- Versions -------------------------------------------------------------------------------------------------------

echo "Env: $base_url"

# Bash 3 on macOS has no associative arrays. 'versions' has the same order as 'target_list'.
versions=()
read_all_versions() {
    for index in "${!target_list[@]}"; do
        versions[index]=$(read_version "${target_list[index]}")
    done
}

all_versions_match() {
    for version in "${versions[@]}"; do
        if [ "$(normalize_version "$version")" != "$(normalize_version "$expected_version")" ]; then
            return 1
        fi
    done
}

print_versions() {
    for index in "${!target_list[@]}"; do
        printf "  %-9s %s\n" "${target_list[index]}" "${versions[index]}"
    done
}

read_all_versions

if [ -z "$expected_version" ]; then
    print_versions
    exit 0
fi

if [ "$is_wait" = true ]; then
    start_seconds=$SECONDS
    while ! all_versions_match; do
        elapsed_seconds=$((SECONDS - start_seconds))
        if [ "$elapsed_seconds" -ge "$timeout_seconds" ]; then
            echo "Timeout after ${timeout_seconds}s. Not all targets run $expected_version:"
            print_versions
            exit 1
        fi
        summary=""
        for index in "${!target_list[@]}"; do
            summary+=" ${target_list[index]}=${versions[index]}"
        done
        echo "$(date +%H:%M:%S) waiting for $expected_version:$summary"
        sleep "$interval_seconds"
        read_all_versions
    done
fi

echo "Versions:"
print_versions
if ! all_versions_match; then
    echo "FAIL: not all targets run $expected_version."
    exit 1
fi

# --- Pages ----------------------------------------------------------------------------------------------------------

if [ "$is_page_check" = false ]; then
    echo "OK: all targets run $expected_version."
    exit 0
fi

echo "Pages:"
failure_count=0
for target in "${target_list[@]}"; do
    for path in $(page_paths "$target"); do
        result=$(check_page "$target" "$path")
        printf "  %-9s %-40s %s\n" "$target" "$path" "$result"
        if [ "$result" != "ok" ]; then
            failure_count=$((failure_count + 1))
        fi
    done
done

if [ "$failure_count" -gt 0 ]; then
    echo "FAIL: $failure_count page checks failed."
    exit 1
fi

echo "OK: all targets run $expected_version and the pages load."
