#!/bin/bash
set -euo pipefail

echo "Starting Celery worker and uWSGI server..."
exec celery \
    -A tilavarauspalvelu \
    worker \
    --loglevel="${CELERY_LOG_LEVEL:-INFO}" \
    --logfile=/broker/worker.log \
    --detach \
    & uwsgi --yaml /tvp/docker/uwsgi.yml
