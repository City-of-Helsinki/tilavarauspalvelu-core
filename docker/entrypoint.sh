#!/bin/bash

echo "Apply database migrations"
python manage.py migrate

echo "Create initial user if needed"
python manage.py ensure_admin_user --username=admin --email=admin@example.com --password=admin

echo "Starting server"
python manage.py runserver 0.0.0.0:8000
