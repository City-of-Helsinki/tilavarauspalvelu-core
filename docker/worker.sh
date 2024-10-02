#!/bin/bash
set -euo pipefail

echo "Starting Celery worker and Celery beat task scheduler..."
exec celery \
    -A config \
    worker \
    --loglevel="${CELERY_LOG_LEVEL:-INFO}" \
    --logfile=/broker/worker.log \
    --detach \
    & celery \
    -A config \
    beat \
    --loglevel="${CELERY_LOG_LEVEL:-INFO}" \
    --scheduler=django
