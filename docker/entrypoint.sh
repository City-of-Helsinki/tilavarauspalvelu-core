#!/bin/bash
set -euo pipefail

echo "Applying database migrations..."
python manage.py migrate

echo "Starting uWSGI server..."
exec uwsgi --yaml /tvp/deploy/uwsgi.yml
