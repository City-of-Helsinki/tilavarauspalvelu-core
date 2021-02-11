#!/bin/bash

./manage.py migrate

exec ./manage.py runserver 0:8000