#!/bin/bash
set -euo pipefail

echo "Applying database migrations..."
python manage.py migrate

echo "Starting local server..."
python manage.py runserver 0.0.0.0:8000
