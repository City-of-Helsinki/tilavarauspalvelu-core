#!/bin/bash
set -euo pipefail

echo "Starting Celery worker..."
exec celery -A config worker --loglevel=INFO
