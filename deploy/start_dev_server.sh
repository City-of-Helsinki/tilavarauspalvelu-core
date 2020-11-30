#!/bin/bash
# Wait for database present as docker-compose is bringing it up in parallel
if [[ "$WAIT_FOR_IT_ADDRESS" ]]; then
    deploy/wait-for-it.sh $WAIT_FOR_IT_ADDRESS --timeout=30
fi

./manage.py migrate

deploy/init_application.sh

exec ./manage.py runserver 0:8000