#!/bin/bash
set -euo pipefail

echo "Starting Celery beat task scheduler..."
exec celery -A config beat --loglevel=INFO --scheduler=django-tvp
