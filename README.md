# Tilavarauspalvelu Core

[![Maintainability Rating]][Maintainability Rating Link]
[![Reliability Rating]][Reliability Rating Link]
[![Security Rating]][Security Rating Link]
[![Coverage]][Coverage Link]
[![License]][License Link]

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Integrations](#integrations)
- [Setup](#setup)
    - [Frontend devs](#frontend-devs)
    - [Backend devs](#backend-devs)
- [Testing](#testing)
- [Updating dependencies](#updating-dependencies)
- [Miscellaneous](#miscellaneous)
    - [Background processing](#background-processing)
    - [Authentication](#authentication)
    - [Static files](#static-files)
    - [Translations](#translations)
    - [Debugging](#debugging)
    - [Image cache](#image-cache)

## Overview

This repository contains the backend of the new [reservation platform] for city of Helsinki.
Its main purpose is to act as a backend for [tilavarauspalvelu-ui] through the GraphQL API.

For more detailed information, please refer to the [Tilavarauspalvelu page in Confluence].
This is also where you can find the list of [members of the project].
The preferred contact method is through Helsinki City Slack.

## Tech Stack

- [PostgreSQL] (with the [PostGIS] extension) for database needs
- [Redis] for in-memory caching
- [Celery] for scheduling and background task handling
- [Elasticsearch] you know, for search
- [Poetry] for dependency management
- [Docker] for containerization
- [Django] as the web framework
- [Graphene] as the GraphQL framework
- [Make] ([Windows][Make (Windows)], [Mac][Make (Mac)]) for running common commands

## Integrations

- Authentication with [Tunnistamo]
- Profile data from [Helsinki Profile]
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

3. Connect to running container

```shell
make bash
```

4. (Re)create elastic search index

```shell
make indices
```

5. Generate test data

```shell
make generate
```

You should not be able to log into Django admin panel at `localhost:8000/admin/`.
GraphQL endpoint is at `localhost:8000/graphql/`.

### Backend devs

1. Copy `.env.example` to `.env`

```shell
cp .env.example .env
```

2. Start required services

```shell
make services
```

3. Install GDAL.

Linux: `sudo apt-get install gdal-bin`
Mac: `brew install gdal`
Windows: Use WSL or Docker.

4. Create a virtual environment & install dependencies

```shell
poetry install
```

5. Add pre-commit hooks

```shell
poetry run make hooks
```

6. Run migrations

```shell
poetry run make migrate
```

7. (Re)create elastic search indices

```shell
poetry run make indices
```

8. Generate test data

```shell
poetry run make generate
```

9. Start the server

```shell
make dev
```

Backend should now be running at `localhost:8000`.

## Testing

Tests are run with `pytest`.

Some flags that can save time when running tests:

- To skip slow-running tests: `pytest --skip-slow`
- To skip tests requiring Elasticsearch: `pytest --skip-elastic`
- To retain test database between runs: `pytest --reuse-db`
- To skip migration-checks at the start of tests: `pytest --no-migrations`
- To run tests in parallel: `pytest -n 8 --dist=loadscope` (=8 cores, use `-n auto` to use all available cores)

You can use a `pytest.ini` file to set up flags for local development.

## Updating dependencies

Dependencies are managed by [Poetry]. Normally, they are automatically updated by [dependabot]
without any manual intervention (given updates don't fail any automated tests).

However, if you want to update them manually, you can do so by running:

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

### Background processing

Scheduled & background tasks are run with [Celery].

When developing locally, you can run these tasks in a Celery worker with `make celery`.
This uses the filesystem as the message broker.
You'll need to create queue and processed folders according to the
`CELERY_QUEUE_FOLDER_OUT`, `CELERY_QUEUE_FOLDER_IN`, `CELERY_PROCESSED_FOLDER`
environment variables (see `.env.example`).

If you want to run background tasks synchronously without Celery, set the environment variable
`CELERY_ENABLED` to `False`. Scheduled tasks still need the worker in order to run.

### Authentication

Authentication is handled by [Tunnistamo] using the [django-helusers] library.
You'll need to get the `TUNNISTAMO_ADMIN_SECRET` from the [Azure Pipelines library]
or from a colleague and set that in your `.env` file.

Instead of JWTs, authentication is managed with via sessions. See [this ADR][auth-ARD] in
confluence for why this decision was made.

### Static files

Static files are served by the [Whitenoise] package.
These are all files that are not uploaded by the users in Django Admin pages.

Media files are served by the [uWSGI static files implementation], offloaded to threads.
These are all files uploaded by users in Django Admin pages.

> If there are performance issues (I.E. 502 errors from the Application Gateway)
> it is very likely process count and or process scale-up must be tweaked higher.

### Translations

Translations are handled by Django's built-in translation system.
GitHub Actions CI will check that all translations are up-to-date during PRs.
To update translations, run `make translations`. This will update the `.po` files
located in the `locale` directory.

For model field translations, we use `django-modeltranslation`.
The package has integrations in all the relevant parts of the project
(serializers, admin, etc.). See code for more details.

### Debugging

For debugging during development, the [Django Debug Toolbar] package can be used.
The [Django GraphQL Debug Toolbar] extension is used for the GraphQL endpoint.

You'll need to add a `local_settings.py` on the root level of the project and add the following code
to it in order to enable the debug toolbar:

```python
try:
    # Assure debug toolbars are installed
    import debug_toolbar
    import graphiql_debug_toolbar

except ImportError:
    pass

else:  # No Error
    # Hardcode to internal IPs as debug toolbar will expose internal information
    INTERNAL_IPS = ["127.0.0.1", "localhost"]

    # Graphene debug settings
    GRAPHENE["MIDDLEWARE"] += ["graphene_django.debug.DjangoDebugMiddleware"]

    INSTALLED_APPS.append("debug_toolbar")
    INSTALLED_APPS.append("graphiql_debug_toolbar")

    # According to documentation, this should be as early as possible in the middleware tree
    MIDDLEWARE.insert(0, "graphiql_debug_toolbar.middleware.DebugToolbarMiddleware")
```

### Image cache

In production, [Varnish cache] is used for reservation unit and purpose images.
When new image is uploaded, existing images are removed from the cache using [purge task].
For more details about how purge is done, check the [image cache utility].

In settings there are four configurations:
- `IMAGE_CACHE_ENABLED` = Toggle caching on/off
- `IMAGE_CACHE_VARNISH_HOST` = Varnish hostname
- `IMAGE_CACHE_PURGE_KEY` = Secret key for doing purge requests
- `IMAGE_CACHE_HOST_HEADER` = `Host` header value in purge request

---

[auth-ARD]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/8524300289/Kirjautumisen+keskitt+minen+b+ckendiin
[Azure DevOps]: https://dev.azure.com/City-of-Helsinki/tilavarauspalvelu
[Azure Pipelines library]: https://dev.azure.com/City-of-Helsinki/tilavarauspalvelu/_library?itemType=VariableGroups
[Celery]: https://github.com/celery/
[Coverage Link]: https://sonarcloud.io/summary/new_code?id=City-of-Helsinki_tilavarauspalvelu-core
[Coverage]: https://sonarcloud.io/api/project_badges/measure?project=City-of-Helsinki_tilavarauspalvelu-core&metric=coverage
[dependabot]: https://github.com/dependabot
[Django Debug Toolbar]: https://django-debug-toolbar.readthedocs.io/en/latest/
[Django GraphQL Debug Toolbar]: https://github.com/flavors/django-graphiql-debug-toolbar
[django-helusers]: https://github.com/City-of-Helsinki/django-helusers
[Django]: https://www.djangoproject.com/
[Docker]: https://www.docker.com/
[Elasticsearch]: https://www.elastic.co/guide/en/elasticsearch/reference/current/elasticsearch-intro.html
[Graphene]: https://github.com/graphql-python/graphene-django
[Hauki]: https://github.com/City-of-Helsinki/hauki
[Helsinki Profile]: https://github.com/City-of-Helsinki/open-city-profile-ui
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
[Poetry]: https://python-poetry.org/
[PostGIS]: https://postgis.net/
[PostgreSQL]: https://www.postgresql.org/
[purge task]: https://github.com/City-of-Helsinki/tilavarauspalvelu-core/blob/main/reservation_units/tasks.py#L143C2-L143C2
[Redis]: https://redis.io/
[Reliability Rating Link]: https://sonarcloud.io/summary/new_code?id=City-of-Helsinki_tilavarauspalvelu-core
[Reliability Rating]: https://sonarcloud.io/api/project_badges/measure?project=City-of-Helsinki_tilavarauspalvelu-core&metric=reliability_rating
[reservation platform]: https://tilavaraus.hel.fi/
[Security Rating Link]: https://sonarcloud.io/summary/new_code?id=City-of-Helsinki_tilavarauspalvelu-core
[Security Rating]: https://sonarcloud.io/api/project_badges/measure?project=City-of-Helsinki_tilavarauspalvelu-core&metric=security_rating
[Tilavarauspalvelu page in Confluence]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/887029864/Tilavarauspalvelu+Varaamo
[tilavarauspalvelu-ui]: https://github.com/City-of-Helsinki/tilavarauspalvelu-ui
[Toimipaikkarekisteri]: https://www.hel.fi/palvelukarttaws/restpages/ver4.html#_unit
[Tunnistamo]: https://github.com/City-of-Helsinki/tunnistamo
[uWSGI static files implementation]: https://uwsgi-docs.readthedocs.io/en/latest/StaticFiles.html
[Varnish cache]: https://varnish-cache.org/
[Whitenoise]: https://whitenoise.evans.io/en/stable/
