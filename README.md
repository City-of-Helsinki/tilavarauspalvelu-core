# Tilavarauspalvelu Core

[![Maintainability Rating]][Maintainability Rating Link]
[![Reliability Rating]][Reliability Rating Link]
[![Security Rating]][Security Rating Link]
[![Coverage]][Coverage Link]
[![Code style: black]][Code style: black Link]
[![License]][License Link]

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Integrations](#integrations)
- [Setup](#setup)
    - [Frontend devs](#frontend-devs)
    - [Backend devs](#backend-devs)
- [Environments](#environments)
- [Making a Release](#making-a-release)
- [Testing](#testing)
- [Upgrading dependencies](#upgrading-dependencies)
- [Miscellaneous](#miscellaneous)
    - [Running background processing](#running-background-processing)
    - [Authentication](#authentication)
    - [Static files](#static-files)
    - [Performance testing and optimization](#performance-testing-and-optimization)
        - [Django Debug Toolbar](#django-debug-toolbar)
        - [GraphQL Debug Toolbar](#graphql-debug-toolbar)
    - [Image cache](#image-cache)
    - [Serializers](#serializers)
    - [Permissions](#permissions)
    - [Translations](#translations)

## Overview

This repository contains the backend of the new [reservation platform] for city of Helsinki.
The main purpose of the service is to act as a backend for [tilavarauspalvelu-ui] through the GraphQL API.
In addition to the API, the core also handles scheduled tasks and serves as a
webhook endpoint for [Helsinki Web Shop].

For more information, please refer to the [Tilavarauspalvelu] page in Confluence.
This is also where you can find the list of [members of the project].
The preferred contact method is Through Helsinki City Slack.

## Tech Stack

- [PostgreSQL] (with the [PostGIS] extension) for database needs
- [Redis] for in-memory caching
- [Celery] for scheduling and background task handling
- [Elasticsearch] you know, for search
- [Poetry] for dependency management
- [Docker] for containerization
- [Django] as the web framework
- [Make] ([Windows][Make (Windows)], [Mac][Make (Mac)]) for running common commands

## Integrations

- Opening hours from [Hauki]
- Unit information from [Toimipaikkarekisteri]
- Payments are handled by [Helsinki Web Shop]

## Setup

### Frontend devs

1. Copy `.env.example` to `.env`

```shell
cp .env.example .env
```

2. Start backend in docker

```shell
make run
```

3. (Re)create elastic search index

```shell
make bash
make indexes
```

3. Generate test data

```shell
# make bash (if not in container)
make generate
```

You should not be able to log into Django admin panel at `localhost:8000/admin`.
GraphQL endpoint is at `localhost:8000/graphql`.

### Backend devs

1. Copy `.env.example` to `.env`

```shell
cp .env.example .env
```

2. Start required services

```shell
make services
```

3. Create a virtual environment & install dependencies

```shell
poetry install
```

4. Add pre-commit hooks

```shell
make hooks
```

5. Run migrations

```shell
make migrate
```

6. (Re)create elastic search indices

```shell
make indices
```

7. Generate test data

```shell
make generate
```

8. Start the server

```shell
make dev
```

Backend should now be running at `localhost:8000`.

## Environments

The service is managed via [Red Hat OpenShift]. Management UIs:
- [Development and Test environment]
- [Staging and Production environment] (requires [Helsinki VPN])

The four environments are the following:
- `dev`: runs the latest merged code
- `test`: used for approval testing
- `staging`: used to verify the release
- `production`: final product for the end users

## Making a Release

CI pipelines are defined in [Azure DevOps]. There are two pipelines:

1. [tilavarauspalvelu-core-devtest]

- Deploys the service to `dev` and `test` environments every time a pull request is merged into the main branch.
  Deployment to `test` environment requires manual approval.

2. [tilavarauspalvelu-core-stageprod]

- Deploys the service to `staging` and `production` environments.
  Manual approval is required for both.

For `staging` and `production` releases:

1. Bump the [__version__] in `tilavarauspalvelu/__init__.py`
2. Create a [new tag] that matches the version, for example, `release-0.21.0`.

Environment configurations for each environment are defined in the [Azure Pipelines library].

## Testing

To run all tests with verbose output, you can simply run `pytest`.
To ignore third-party warnings, you can run `pytest -W default`.

Not that some unit tests may take longer to run.
If you want to ignore the slow tests, run `SKIP_LONG_RUNNING=1 pytest -W default`.

If you'd like the unittests not to mess up your development environment use
a `local_settings.py` file (at root level) to make own search index for test database.

```
env = Env(TEST=(bool, False))

if env("TEST"):
    settings.DATABASES["default"]["NAME"] = "test_tvp"
    SEARCH_SETTINGS = {
        "connections": {
            "default": env("ELASTICSEARCH_URL"),
        },
        "indexes": {
            "test_reservation_units": {
                "models": [
                    "reservation_units.ReservationUnit",
                ]
            }
        },
        "settings": {
            "chunk_size": 500,
            "page_size": 10000,
            "auto_sync": True,
            "never_auto_sync": [],
            "strict_validation": False,
            "mappings_dir": "elastic_django/tests/mappings",
        },
    }
```

The above settings expects that there is an environment variable
`TEST` present and the mappings files has then the `test_reservation_units.json`.
You could then run the tests like: `TEST=True pytest`.

To guarantee that software is working as it supposed to, we obey the following testing principles.
These principles are based on [Helsinki Testing requirements].

- By default, everything should be tested. We use `pytest` for testing.
- Single unit test should only cover a single feature/function/method.
  When a test breaks, it should be as obvious as possible to detect where the problem lies.
- Use clear and descriptive naming, such as
  `test_authenticated_user_can_make_reservation` or `test_order_cannot_be_modified`.
- Readability is important. Avoid loops in tests.
- Tests are located under their respective apps,
  for example tests for Space-models should be in `spaces/tests.py`.
  API-related tests are under `api` application, post-fixed by related endpoint,
  such as `api/test_reservation_api.py`.
- Abstract reusable test data in fixtures (`conftest.py`).
  Sometimes creating or manipulating objects during a test is necessary,
  but if the data could be used in another test, put it in fixtures.

## Upgrading dependencies

To upgrade python dependencies, run:

```shell
poetry update
```

This will update all dependencies according to the rules defined in `pyproject.toml`.
To see all outdated dependencies, run:

```shell
poetry show --outdated
```

Note that this will also include any sub-dependencies that are not directly defined in `pyproject.toml`.

## Miscellaneous

### Running background processing

Background processes are run with [Celery].

If you want to run background processes synchronously without Celery,
set the environment variable `CELERY_ENABLED` to `false`.

When developing locally without Docker, you need to manually run the Celery worker
by executing `celery -A tilavarauspalvelu worker --beat --loglevel info --scheduler django`
in the project root if you want to run background jobs with Celery.

In development environments, the file system backend is easiest to use (the current default).
You need to create a queue and processed folders and update the environment variables
`CELERY_QUEUE_FOLDER_OUT`, `CELERY_QUEUE_FOLDER_IN`, `CELERY_PROCESSED_FOLDER` to match.
The default values are `./broker/queue/` for in and out, and `./broker/processed/` for processed.

### Authentication

We use Tunnistamo and JWT tokens for API authentication.
Support for Tunnistamo authentication is implemented by django-helusers library.
Following env variables must be set for authentication to work properly:

- `TUNNISTAMO_JWT_AUDIENCE` - Client ID of tunnistamo client for API.
    - By default `https://api.hel.fi/auth/tilavarausapidev`
- `TUNNISTAMO_JWT_ISSUER` - Issuer of the JWT token.
    - By default `https://tunnistamo.test.hel.ninja/openid`.
- `TUNNISTAMO_ADMIN_KEY` - Tunnistamo client ID for Django Admin.
    - By default `tilanvaraus-django-admin-dev`.
- `TUNNISTAMO_ADMIN_SECRET` - Secret for the same tunnistamo client for Django Admin.
    - Get this value from Tilavarauspalvelu backend developers. There is no default.
- `TUNNISTAMO_ADMIN_OIDC_ENDPOINT` - OIDC endpoint of the SSO provider.
    - By default `https://tunnistamo.test.hel.ninja/openid`.

Each UI has implemented Tunnistamo login which will provide UI with JWT token for API.
In debug mode basic and session authentication are also enabled.

> There is a **known issue**, where separate user objects are created for JWT and Django Admin authentications.
> This is not intended and will probably be fixed at some point.

### Static files

Contrary to more common set-ups, this application does not have a reverse proxy serving static files.
Instead, static files are served by both Django and uwsgi.

Static files are served by the [Whitenoise] package.
These are all files that are not uploaded by the users in Django Admin pages.

Media files are served by the [uwsgi static files implementation] offloaded to threads.
These are all files uploaded by users in Django Admin pages.
If there are performance issues (I.E. 502 errors from the Application Gateway)
it is very likely process count and or process scale-up must be tweaked higher.

### Performance testing and optimization

To debug REST API endpoints, the [Django debug toolbar] package can be used.
The debug toolbar will gather information of code execution and database interactions
with which it is possible to optimize both code and query usage.
A similar package is available for GraphQL endpoint optimization,
the [Django GraphQL Debug Toolbar]. These are not currently installed in the project.
When optimization is done, these must be installed first before proceeding to the next steps.

#### Django Debug Toolbar

To set up django debug toolbar, these settings are needed.

```python
# Hardcode to internal IPs as debug toolbar will expose internal information
INTERNAL_IPS = ["127.0.0.1", "localhost"]
INSTALLED_APPS.append("debug_toolbar")

# According to documentation, this should be as early as possible in the middleware tree
MIDDLEWARE.insert(1, "debug_toolbar.middleware.DebugToolbarMiddleware")
```

Do not add these changes to `settings.py`. Use `local_settings.py` instead so that the
changes are applied to your dev environment only. When above lines are added bottom of the file,
the debug toolbar will be visible when a REST API endpoint is loaded in any browser.

#### GraphQL Debug Toolbar

To set up Django GraphQL debug toolbar, copy the following lines of code to the end of `local_settings.py`.
Please make sure to remove all "debug toolbar" related lines first as they do not work together!
Yes, the lines below are correct, debug_toolbar must be in installed apps but its middleware cannot be added.

```py
# Hardcode to internal IPs as debug toolbar will expose internal information
INTERNAL_IPS = ["127.0.0.1", "localhost"]

# Graphene debug settings
GRAPHENE["MIDDLEWARE"] += ["graphene_django.debug.DjangoDebugMiddleware"]

INSTALLED_APPS.append("debug_toolbar")
INSTALLED_APPS.append("graphiql_debug_toolbar")

# According to documentation, this should be as early as possible in the middleware tree
MIDDLEWARE.insert(1, "graphiql_debug_toolbar.middleware.DebugToolbarMiddleware")
```

When the lines above have been added and the server has been re-/started,
the django debug toolbar will load in `/graphql/` endpoint.

### Image cache

In production environment, [Varnish cache] is used for reservation unit and purpose images.
When new image is uploaded, existing images are removed from the cache using [purge task].
For more details about how purge is done, check the [image cache utility].

In settings there are four configurations:
- `IMAGE_CACHE_ENABLED` = Toggle caching on/off
- `IMAGE_CACHE_VARNISH_HOST` = Varnish hostname
- `IMAGE_CACHE_PURGE_KEY` = Secret key for doing purge requests
- `IMAGE_CACHE_HOST_HEADER` = `Host` header value in purge request

### Serializers

To keep serializers consistent, we obey the following principles (these principles may change in the future).

- We want to easily determine if related field contains id or whole object.
  Always use `_id` at end of the field name if it is a foreign key id field.
- If related models are exposed in their own API endpoint, use it to CRUD them.
  Use nested objects only if they are not used separately.
- Check examples in `api/examples.py` for samples how to do different implementations using above rules.

### Permissions

When implementing new API endpoints or new methods for existing ones
permissions should always be checked and modified as needed.
Permissions are implemented in tilavarauspalvelu as following.

#### Role models

- Permissions are currently role based. There are currently
  `general roles`, `service sector` roles and `unit roles`.
- Roles are dynamic, and they can be modified or created without changing code.
  You can manage role choices and their permissions in Django Admin.
- Roles can be assigned to users from Django Admin or through API.
- Role models are located in `permissions/models.py`.

#### Helpers

- To make code more readable helpers are implemented for checking if
  user has roles that has permissions for certain actions.
- For example there is helper `can_manage_service_sectors_applications`
  that takes user and service sector as parameters, and it then checks
  if user has roles required for that action.
- New helpers should be created any time there is need for these kind of
  checks rather than directly accessing users roles.
- Helpers are located in `permissions/helpers.py`.

#### API permissions

- API permissions are permission classes that are assigned to each viewsets
  `permission_classes` attribute. They are inherited from rest frameworks `BasePermission` class.
- API permission class should be implemented for each viewset. By default, everything is restricted.
- API permissions uses helpers to determine if user has permission for certain actions.
- API permission classes can be found from `permissions/api_permissions.py`.

### Translations

We use `django-modeltranslation` to deal with translations.
Use `TranslatedModelSerializer` located in `api/base.py` to automatically register translated fields in API.
Note: You still need to register the original field, such as `fields = ["name"]`.
This will automatically register translated fields `name_fi`, `name_en`, `name_sv`,
which will be nested in an object under the original field name as a key,
by their respective language codes as field keys:

```
{
    "name": {
        "fi": "foo",
        "en": "bar",
        "sv": "baz",
    }
}
```

---

[__version__]: https://github.com/City-of-Helsinki/tilavarauspalvelu-core/blob/main/tilavarauspalvelu/__init__.py#L9
[Azure DevOps]: https://dev.azure.com/City-of-Helsinki/tilavarauspalvelu
[Azure Pipelines library]: https://dev.azure.com/City-of-Helsinki/tilavarauspalvelu/_library?itemType=VariableGroups
[Celery]: https://github.com/celery/
[Code style: black Link]: https://github.com/psf/black
[Code style: black]: https://img.shields.io/badge/code%20style-black-000000.svg
[Coverage Link]: https://sonarcloud.io/summary/new_code?id=City-of-Helsinki_tilavarauspalvelu-core
[Coverage]: https://sonarcloud.io/api/project_badges/measure?project=City-of-Helsinki_tilavarauspalvelu-core&metric=coverage
[Development and Test environment]: https://console-openshift-console.apps.arodevtest.hel.fi/topology/ns/hki-kanslia-aok-tilavarauspalvelu-test
[Django debug toolbar]: https://django-debug-toolbar.readthedocs.io/en/latest/
[Django GraphQL Debug Toolbar]: https://github.com/flavors/django-graphiql-debug-toolbar
[Django]: https://www.djangoproject.com/
[Docker]: https://www.docker.com/
[Elasticsearch]: https://www.elastic.co/guide/en/elasticsearch/reference/current/elasticsearch-intro.html
[Hauki]: https://github.com/City-of-Helsinki/hauki
[Helsinki Testing requirements]: https://dev.hel.fi/testing-requirements
[Helsinki VPN]: https://huolto.hel.fi/
[Helsinki Web Shop]: https://github.com/City-of-Helsinki/verkkokauppa-experience-api
[image cache utility]: https://github.com/City-of-Helsinki/tilavarauspalvelu-core/blob/main/utils/image_cache.py
[License Link]: https://github.com/City-of-Helsinki/tilavarauspalvelu-core/blob/main/LICENSE
[License]: https://img.shields.io/badge/license-MIT-blue.svg
[Maintainability Rating Link]: https://sonarcloud.io/summary/new_code?id=City-of-Helsinki_tilavarauspalvelu-core
[Maintainability Rating]: https://sonarcloud.io/api/project_badges/measure?project=City-of-Helsinki_tilavarauspalvelu-core&metric=sqale_rating
[Make (Mac)]: https://formulae.brew.sh/formula/make
[Make (Windows)]: https://community.chocolatey.org/packages/make
[Make]: https://www.gnu.org/software/make/
[members of the project]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/1138065426/Tiimin+j+senet+ja+roolit
[new tag]: https://github.com/City-of-Helsinki/tilavarauspalvelu-core/tags
[Poetry]: https://python-poetry.org/
[PostGIS]: https://postgis.net/
[PostgreSQL]: https://www.postgresql.org/
[purge task]: https://github.com/City-of-Helsinki/tilavarauspalvelu-core/blob/main/reservation_units/tasks.py#L143C2-L143C2
[Red Hat OpenShift]: https://www.openshift.com/
[Redis]: https://redis.io/
[Reliability Rating Link]: https://sonarcloud.io/summary/new_code?id=City-of-Helsinki_tilavarauspalvelu-core
[Reliability Rating]: https://sonarcloud.io/api/project_badges/measure?project=City-of-Helsinki_tilavarauspalvelu-core&metric=reliability_rating
[reservation platform]: https://tilavaraus.hel.fi/
[Security Rating Link]: https://sonarcloud.io/summary/new_code?id=City-of-Helsinki_tilavarauspalvelu-core
[Security Rating]: https://sonarcloud.io/api/project_badges/measure?project=City-of-Helsinki_tilavarauspalvelu-core&metric=security_rating
[Staging and Production environment]: https://console-openshift-console.apps.platta.hel.fi/add/all-namespaces
[tilavarauspalvelu-core-devtest]: https://dev.azure.com/City-of-Helsinki/tilavarauspalvelu/_build?definitionId=1230
[tilavarauspalvelu-core-stageprod]: https://dev.azure.com/City-of-Helsinki/tilavarauspalvelu/_build?definitionId=1231
[tilavarauspalvelu-ui]: https://github.com/City-of-Helsinki/tilavarauspalvelu-ui
[Tilavarauspalvelu]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/887029864/Tilavarauspalvelu+Varaamo
[Toimipaikkarekisteri]: https://www.hel.fi/palvelukarttaws/restpages/ver4.html#_unit
[uwsgi static files implementation]: https://uwsgi-docs.readthedocs.io/en/latest/StaticFiles.html
[Varnish cache]: https://varnish-cache.org/
[Whitenoise]: https://whitenoise.evans.io/en/stable/
