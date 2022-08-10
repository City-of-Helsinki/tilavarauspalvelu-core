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

## Requirements

Workflow with requirements is as follows.

requirements.txt is not edited manually, but is generated with pip-compile.

requirements.txt contains fully tested, pinned versions of the requirements. requirements.in contains the primary, requirements of the project without their dependencies.

In production, deployments should always use requirements.txt and the versions pinned therein. In development, new virtualenvs and development environments should also be initialised using requirements.txt. pip-sync will synchronize the active virtualenv to match exactly the packages in requirements.txt.

In development and testing, to update a package update it in requirements.in and use the command pip-compile.

To remove a dependency, remove it from requirements.in, run pip-compile and then pip-sync. If everything works as expected, commit the changes.

### Database requirements

Postgresql 11 database with postgis extension. Find postgis installation instructions [here](https://postgis.net/install/).

### Installation issues on Mac

#### Psycopg2 issue
You might get an error when installing psycopg2. To fix the issue, you need to install OpenSSL and then update the LIBRARY_PATH env:
```
brew install openssl
export LIBRARY_PATH=$LIBRARY_PATH:/usr/local/opt/openssl/lib/
```

#### OR-Tools issue
At the time of writing this, OR-Tools only supports x86_64/amd64 architecture so it does not work on M1 Macs. On M1 Macs you'll get an error when you try install `requirements.txt`.

To solve the issues, follow [this guide](https://dev.to/yulin/how-to-install-google-or-tools-on-apple-m1-arm64-346b). Just remember to install Python 3.8 instead of the latest version available:

```
brew86 install python@3.8
```

### Potential build problems

Docker compose might fail building with an error about missing source files. This is fixed by creating hte following directories (empty dirs are fine).

```sh
$ mkdir ./etc-pki-entitlement && mkdir ./rhsm-conf && mkdir ./rhsm-ca
```

Some RHEL repos can cause build to fail. These can be added or removed with these lines in the `Dockerfile` before `RUN yum -y update` line.

```docker
RUN subscription-manager repos --enable codeready-builder-for-rhel-8-x86_64-rpms
RUN subscription-manager repos --disable rhel-8-for-x86_64-baseos-beta-rpms
RUN subscription-manager repos --disable rhel-8-for-x86_64-appstream-beta-rpms
```

If a build fails, remove the failed `dev` docker container and all intermediary related containers. When docker containers has been cleaned, try the build again with one of the repo enabled/disabled (depending on what settings you had when first building the project).

# Running tests and formatting

Tests are run with pytest. Use `pytest` to run all tests. Use `pytest -W default` to show third party warnings ignored in `pytest.ini`.

To run static code checks and tests with coverage:

In docker

`docker-compose run dev test`

Locally:

`deploy/entrypoint.sh test`

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

For detailed documentation about specific environment variables, see [.env.example](.env.example).

For this project, `.env.example` must be copied both to the root directory as `.env` and to the `tilavarauspalvelu` directory (as `.env` as well). To reduce confusion and potential misconfiguration, it is advisable to only have `.env` as a file in the root directory. The `.env` file can then be symlinked to `tilavarauspalvelu` directory with the commands:
```sh
$ cd tilavarauspalvelu
$ ln -s ../.env .env
```
 
# Authentication

We use Tunnistamo and JWT tokens for API authentication. Support for Tunnistamo authentication is implemented by django-helusers library. Following env variables must be set for authentication to work properly:

- TUNNISTAMO_JWT_AUDIENCE - Client ID of tunnistamo client for API. By default `tilavaraus-ui-dev`
- TUNNISTAMO_JWT_ISSUER - Issuer of the JWT token. By default `https://tunnistamo.test.hel.ninja/openid`.
- TUNNISTAMO_ADMIN_KEY - Tunnistamo client ID for Django Admin. By default `tilanvaraus-django-admin-dev`.
- TUNNISTAMO_ADMIN_SECRET - Secret for the same tunnistamo client for Django Admin. There is no default. Get this value from Tilavarauspalvelu backend developers.
- TUNNISTAMO_ADMIN_OIDC_ENDPOINT - OIDC endpoint of the SSO provider. By default `https://tunnistamo.test.hel.ninja/openid`.

Each UI has implemented Tunnistamo login which will provide UI with JWT token for API. The token is used for 

In debug mode basic and session authentication are also enabled.

## Known issue
For unknown reason separate user objects are created for JWT and Django Admin authentications. This is not intended and will probably be fixed at some point.


For development purposes requirement to authenticate can be turned off by setting
environment variable TMP_PERMISSIONS_DISABLED to True.

![Data model visualization](tilavarauspalvelu_visualized.svg)

## Deployed application settings & static files

Contrary to more common set-ups, this application does not have a reverse proxy serving static files. Instead, static files are served by both Django and uwsgi.

Static files are served by the [Whitenoise](https://whitenoise.evans.io/en/stable/) package. These are all files that are not uploaded by the users in Django Admin pages.

Media files are served by the [uwsgi static files implementation](https://uwsgi-docs.readthedocs.io/en/latest/StaticFiles.html) offloaded to threads. These are all files uploaded by users in Django Admin pages. If there are performance issues (I.E. 502 errors from the Application Gateway) it is very likely process count and or process scale-up must be tweaked higher.

# Performance testing and optimization

To debug REST API endpoints, the [Django debug toolbar](https://django-debug-toolbar.readthedocs.io/en/latest/) package can be used. The debug toolbar will gather information of code execution and database interactions with which it is possible to optimize both code and query usage. A similar package is available for GraphQL endpoint optimization, the [Django GraphQL Debug Toolbar](https://github.com/flavors/django-graphiql-debug-toolbar). These are not currently installed in the project. When optimization is done, these must be installed first before proceeding to the next steps.

### Django Debug Toolbar
To set-up django debug toolbar, these settings are needed.

```py
# Hardcode to internal IPs as debug toolbar will expose internal information
INTERNAL_IPS = ["127.0.0.1", "localhost"]
INSTALLED_APPS.append("debug_toolbar")

# According to documentation, this should be as early as possible in the middleware tree
MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")
```

Also, add the following line to the end of the tilavarauspalvelu [urls.py](./api/urls.py) file:

```py
urlpatterns += [path("__debug__/", include("debug_toolbar.urls"))]
```

When the lines above are added to the bottom of [settings.py](./tilavarauspalvelu/settings.py), the debug toolbar will be visible when a REST API endpoint is loaded in any browser.

### GraphQL Debug Toolbar
To set-up Django GraphQL debug toolbar, copy the following lines of code to the end of [settings.py](./tilavarauspalvelu/settings.py). Please make sure to remove all "debug toolbar" related lines first as they do not work together! Yes, the lines below are correct, debug_toolbar must be in installed apps but its middleware cannot be added.

```py
# Hardcode to internal IPs as debug toolbar will expose internal information
INTERNAL_IPS = ["127.0.0.1", "localhost"]

# Graphene debug settings
GRAPHENE["MIDDLEWARE"] += ["graphene_django.debug.DjangoDebugMiddleware"]

INSTALLED_APPS.append("debug_toolbar")
INSTALLED_APPS.append("graphiql_debug_toolbar")

# According to documentation, this should be as early as possible in the middleware tree
MIDDLEWARE.insert(0, "graphiql_debug_toolbar.middleware.DebugToolbarMiddleware")
```

Also, add the following line to the end of the "tilavarauspalvelu" [urls.py](./api/urls.py) file:

```py
urlpatterns += [path("__debug__/", include("debug_toolbar.urls"))]
```

When the lines above have been added and the server has been re-/started, the django debug toolbar will load in `/graphql/` endpoint.
