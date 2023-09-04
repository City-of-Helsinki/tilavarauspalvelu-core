#!/bin/bash
set -euo pipefail

echo "Starting uWSGI server..."
exec uwsgi --yaml /tvp/docker/uwsgi.yml
