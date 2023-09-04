#!/bin/bash
set -euo pipefail

echo "Starting worker server..."
exec celery -A tilavarauspalvelu worker --detach & celery -A tilavarauspalvelu beat -l info -S django
