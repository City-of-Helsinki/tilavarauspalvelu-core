#!/bin/bash
set -euo pipefail

echo "Starting uWSGI server..."
uwsgi --yaml /tvp/docker/uwsgi.yml
