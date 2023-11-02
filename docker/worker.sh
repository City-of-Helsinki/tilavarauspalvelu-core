#!/bin/bash
set -euo pipefail

echo "Starting Celery worker and Celery beat task scheduler..."
exec celery \
    -A tilavarauspalvelu \
    worker \
    --loglevel="${CELERY_LOG_LEVEL:-INFO}" \
    --logfile=/broker/worker.log \
    --detach \
    & celery \
    -A tilavarauspalvelu \
    beat \
    --loglevel="${CELERY_LOG_LEVEL:-INFO}" \
    --scheduler=django
