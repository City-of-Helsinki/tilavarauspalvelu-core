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
    exec deploy/start_dev_server.sh
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
    black --check .
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
    pytest
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
    exec uwsgi -y deploy/uwsgi.yml
fi

_log_boxed "Tilavaraus entrypoint finished"