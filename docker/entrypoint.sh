#!/bin/bash
set -euo pipefail

echo "Starting Celery worker and uWSGI server..."
exec celery -A tilavarauspalvelu worker --detach & uwsgi --yaml /tvp/docker/uwsgi.yml
