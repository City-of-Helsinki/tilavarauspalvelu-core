[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)


Tilavarauspalvelu-core
===================
This repository contains core of the new reservation platform for city of Helsinki.

# Installation
To run tilavarauspalvelu locally you need to have DEBUG=True in your .env file. 

Easiest way is to copy and rename .env.example to .env and make sure DEBUG=True is set. 
 
## Installation with docker

You'll need a redhat developer account to gain access to redhat subsriptions
needed to run the docker image. 

Register at https://developers.redhat.com/register and confirm your email address. 

Set following environment variables in .env file or pass them to docker compose
- BUILD_MODE=local
- REDHAT_USERNAME=your redhat account username 
- REDHAT_PASSWORD=your redhat account password

Then you can run docker image with

`docker-compose up dev`

# Running tests and formatting

Tests are run with pytest. Use `pytest` to run all tests. Use `pytest -W default` to show third party warnings ignored in `pytest.ini`.

To run static code checks and tests with coverage:

In docker

`docker-compose run dev test`

Locally:

`deploy/entrypoint.sh test`


##Requirements

Workflow with requirements is as follows.

requirements.txt is not edited manually, but is generated with pip-compile.

requirements.txt contains fully tested, pinned versions of the requirements. requirements.in contains the primary, requirements of the project without their dependencies.

In production, deployments should always use requirements.txt and the versions pinned therein. In development, new virtualenvs and development environments should also be initialised using requirements.txt. pip-sync will synchronize the active virtualenv to match exactly the packages in requirements.txt.

In development and testing, to update a package update it in requirements.in and use the command pip-compile.

To remove a dependency, remove it from requirements.in, run pip-compile and then pip-sync. If everything works as expected, commit the changes.


# Background processing

Background processes are run with [Celery](https://docs.celeryproject.org/).

If you want to run background processes synchronously without celery, 
set environment variable CELERY_ENABLED to false.

When developing locally without docker, you need to run celery worker manually
by executing in the project root `celery -A tilavarauspalvelu worker --beat` if you want to run background jobs with celery.

In development environments it's easiest to use file system backend (the current default),
you need to create a queue and processed folders and update env variables 
CELERY_QUEUE_FOLDER_OUT, CELERY_QUEUE_FOLDER_IN, CELERY_PROCESSED_FOLDER to match.
Default value is ./broker/queue/ for in and out and ./broker/processed/ for processed. 

# Environments

## Environmental variables

See [.env.example](.env.example) for environment variable documentation

## Database requirements

Postgresql 11 database with postgis extension.
 
# Authentication

We use Tunnistamo and JWT tokens for API authentication. Support for Tunnistamo authentication is implemented by django-helusers library. Following env variables must be set for authentication to work properly:

- TUNNISTAMO_JWT_AUDIENCE - Client ID of tunnistamo client for API. By default `https://api.hel.fi/auth/tilavarausapidev`
- TUNNISTAMO_JWT_ISSUER - Issuer of the JWT token. By default `https://api.hel.fi/sso/openid`.
- TUNNISTAMO_ADMIN_KEY - Tunnistamo client ID for Django Admin. By default `tilanvaraus-django-admin-dev`.
- TUNNISTAMO_ADMIN_SECRET - Secret for the same tunnistamo client for Django Admin. There is no default. Get this value from Tilavarauspalvelu backend developers.
- TUNNISTAMO_ADMIN_OIDC_ENDPOINT - OIDC endpoint of the SSO provider. By default `https://api.hel.fi/sso/openid`.

Each UI has implemented Tunnistamo login which will provide UI with JWT token for API. The token is used for 

In debug mode basic and session authentication are also enabled.

## Known issue
For unknown reason separate user objects are created for JWT and Django Admin authentications. This is not intended and will probably be fixed at some point.


For development purposes requirement to authenticate can be turned off by setting
environment variable TMP_PERMISSIONS_DISABLED to True.

![Data model visualization](tilavarauspalvelu_visualized.svg)