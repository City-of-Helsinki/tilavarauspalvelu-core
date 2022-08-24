#!/bin/bash
TIMESTAMP_FORMAT="+%Y-%m-%d %H:%M:%S"

function _log () {
    echo $(date "$TIMESTAMP_FORMAT"): $RUN_ID: $@
}

function _log_boxed () {
    _log ---------------------------------
    _log $@
    _log ---------------------------------
}

_log_boxed "Tilavarauspalvelu container"

if [ "$1" = "start_django_development_server" ]; then
    _log_boxed "Running development server"
    if [ "$CELERY_ENABLED" = true ] ; then
      _log_boxed "Running with celery"
      exec celery -A tilavarauspalvelu worker --detach & celery -A tilavarauspalvelu beat -l info -S django --detach & deploy/start_dev_server.sh
    else
      _log_boxed "Running without celery"
      exec deploy/start_dev_server.sh
    fi

elif [ "$1" = "migrate" ]; then
    _log_boxed "Running migrations"
    ./manage.py migrate
elif [ "$1" = "test" ]; then

    _log_boxed "Running flake8"
    flake8
    exitcode=$?
    if [ $exitcode -ne 0 ]; then
        exit $exitcode
    fi
    _log_boxed "Running black"
    black --check --config black.toml .
    exitcode=$?
    if [ $exitcode -ne 0 ]; then
        exit $exitcode
    fi
    _log_boxed "Running isort"
    isort --check-only --diff .
    exitcode=$?
    if [ $exitcode -ne 0 ]; then
        exit $exitcode
    fi
    _log_boxed "Running tests"
    pytest --cov-report=html --cov
    exitcode=$?
    if [ $exitcode -ne 0 ]; then
        exit $exitcode
    fi

elif [ "$1" = "e" ]; then
    shift
    _log_boxed "exec'n $@"
    exec "$@"
else
    _log_boxed "Starting production server"
    if [ "$WORKER_SERVER" = true ] ; then
      exec celery -A tilavarauspalvelu worker --detach & celery -A tilavarauspalvelu beat -l info -S django --detach
    elif [ "$CELERY_ENABLED" = true ] ; then
      exec celery -A tilavarauspalvelu worker --detach & uwsgi -y deploy/uwsgi.yml
    else
      exec uwsgi -y deploy/uwsgi.yml
    fi

fi

_log_boxed "Tilavaraus entrypoint finished"
