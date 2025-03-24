# Tilavarauspalvelu

[![Maintainability Rating]][Maintainability Rating Link]
[![Reliability Rating]][Reliability Rating Link]
[![Security Rating]][Security Rating Link]
[![Coverage]][Coverage Link]
[![License]][License Link]

[Maintainability Rating Link]: https://sonarcloud.io/summary/new_code?id=City-of-Helsinki_tilavarauspalvelu-core
[Maintainability Rating]: https://sonarcloud.io/api/project_badges/measure?project=City-of-Helsinki_tilavarauspalvelu-core&metric=sqale_rating
[Reliability Rating Link]: https://sonarcloud.io/summary/new_code?id=City-of-Helsinki_tilavarauspalvelu-core
[Reliability Rating]: https://sonarcloud.io/api/project_badges/measure?project=City-of-Helsinki_tilavarauspalvelu-core&metric=reliability_rating
[Security Rating Link]: https://sonarcloud.io/summary/new_code?id=City-of-Helsinki_tilavarauspalvelu-core
[Security Rating]: https://sonarcloud.io/api/project_badges/measure?project=City-of-Helsinki_tilavarauspalvelu-core&metric=security_rating
[Coverage Link]: https://sonarcloud.io/summary/new_code?id=City-of-Helsinki_tilavarauspalvelu-core
[Coverage]: https://sonarcloud.io/api/project_badges/measure?project=City-of-Helsinki_tilavarauspalvelu-core&metric=coverage
[License Link]: https://github.com/City-of-Helsinki/tilavarauspalvelu-core/blob/main/LICENSE
[License]: https://img.shields.io/badge/license-MIT-blue.svg

This repository contains the new space and resource [reservation platform] for City of Helsinki,
colloquially known as "Varaamo". In Varaamo, citizens of Helsinki can make reservations for spaces
and resources owned by the City of Helsinki.

This project replaces the [old Varaamo] platform.
For more detailed information, please refer to the [Tilavarauspalvelu page in Confluence]
(accessible to the City of Helsinki organization only).

[reservation platform]: https://varaamo.hel.fi/
[old Varaamo]: https://github.com/City-of-Helsinki/varaamo
[Tilavarauspalvelu page in Confluence]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/887029864/

---

**Table of Contents:**
- [Setup](#setup)
  - [Requirements](#requirements)
  - [Setup backend](#setup-backend)
  - [Setup frontend](#setup-frontend)
- [Backend](#backend)
  - [Tech Stack](#tech-stack)
  - [Integrations](#integrations)
  - [Local backend setup](#local-backend-setup)
  - [Linting](#linting)
  - [Testing](#testing)
  - [Updating dependencies](#updating-dependencies)
  - [Background tasks](#background-tasks)
  - [Authentication](#authentication)
  - [Static files](#static-files)
  - [Image cache](#image-cache)
  - [Translations](#translations)
  - [Debugging](#debugging)
- [Frontend](#frontend)

---

## Setup

These instructions will set you up for local development the backend running in Docker
and frontend running locally. If you want to run the backend without Docker,
see the [backend](#backend) section.

### Requirements

- Docker
  - Ubuntu: https://docs.docker.com/engine/install/ubuntu/
  - Mac: https://docs.docker.com/desktop/setup/install/mac-install/
  - Windows: https://docs.docker.com/desktop/setup/install/windows-install/
- Node version manager
  - Ubuntu: https://github.com/nvm-sh/nvm
  - Mac: `brew install nvm`
  - Windows: https://github.com/coreybutler/nvm-windows
- Make
  - Ubuntu: `sudo apt-get install make`
  - Mac: `brew install make`
  - Windows: `choco install make` (using [chocolatey])

[chocolatey]: https://chocolatey.org/install

### Setup backend

1. Copy `backend/.env.example` to `backend/.env`.

```shell
cp backend/.env.example backend/.env
```

2. Build and run backend with Docker.

```shell
make run
```

You should now be able to open Django admin panel at `localhost:8000/admin/`.
GraphQL endpoint is at `localhost:8000/graphql/`.

To generate test data, follow the steps below.

1. Connect to running container.

```shell
make bash
```

2. Generate test data.

```shell
make generate
```

### Setup frontend

1. Install correct Node version.

```shell
nvm use 20
```

2. Install pnpm.

```shell
npm install -g pnpm
```

3. Install dependencies.

```shell
pnpm i
```

4. Start the frontend.

```shell
pnpm dev
```

You should now be able to open the customer UI at `localhost:3000`
and the admin UI at `localhost:3001/kasittely`.

## Backend

### Tech Stack

- [PostgreSQL] (with the [PostGIS] extension) for database needs
- [Redis] for in-memory caching
- [Celery] for scheduling and background task handling
- [Poetry] for dependency management
- [Django] as the web framework
- [Graphene] as the GraphQL framework

[PostgreSQL]: https://www.postgresql.org/
[PostGIS]: https://postgis.net/
[Redis]: https://redis.io/
[Celery]: https://docs.celeryq.dev/en/stable/index.html
[Poetry]: https://python-poetry.org/
[Django]: https://www.djangoproject.com/
[Graphene]: https://github.com/graphql-python/graphene-django

### Integrations

- Authentication with [Helsinki Tunnistus]
- Profile data from [Helsinki Profile]
- Opening hours from [Aukiolosovellus]
- Unit information from [Toimipisterekisteri]
- Payments are handled by [Helsinki Web Shop]
- Access codes handled by [Pindora]
- Emails are sent using [relay.hel.fi]

[Helsinki Tunnistus]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/419463195/
[Helsinki Profile]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/236060735/
[Aukiolosovellus]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/162758954/
[Toimipisterekisteri]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/8502673414/
[Helsinki Web Shop]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KYV/overview
[Pindora]: https://www.pindora.fi/
[relay.hel.fi]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/platta/pages/7725416472/

### Local backend setup

These instructions will set up the backend for local development without Docker.
This is mainly for backend developers, as it requires more dependencies and setup.

> Windows users:
>
> Some of the dependencies used by the project are not available for Windows.
> We recommend using [WSL2] running Ubuntu for local development.

[WSL2]: https://docs.microsoft.com/en-us/windows/wsl/install

Requirements:

- CPython (check `pyproject.toml` for version)
- [Poetry] (latest version)
- [PostgreSQL] (with the [PostGIS] extension) (version 13 or newer)
- [Redis] (version 7 or newer)
- [GDAL] (version compatible with Django, check their documentation for more info)
  - Ubuntu: `sudo apt-get install gdal-bin`
  - Mac: `brew install gdal`
- [gettext]
  - Ubuntu: `sudo apt-get install gettext`
  - Mac: `brew install gettext`

[Poetry]: https://python-poetry.org/
[PostgreSQL]: https://www.postgresql.org/
[PostGIS]: https://postgis.net/
[Redis]: https://redis.io/
[GDAL]: https://gdal.org/index.html
[gettext]: https://www.gnu.org/software/gettext/

> Installation instructions for dependencies will vary based on your OS and can
> change over time, so please refer to the official documentation for each dependency
> on how to set them up correctly.

Now, follow the steps below in the `backend` directory.

1. Copy `.env.example` to `.env`.

```shell
cp .env.example .env
```

> This file contains environment variables used by the project. You can modify these
> to suit your local development environment.

2. Copy `local_settings_example.py` to `local_settings.py`.

```shell
cp local_settings_example.py local_settings.py
```

> These can be used to modify settings for local development without changing the main settings file.

3. Create a virtual environment & install dependencies.

```shell
poetry install
```

4. Add pre-commit hooks

```shell
poetry run pre-commit install
```

5. Run migrations

```shell
poetry run python manage.py migrate
```

6. Generate test data

```shell
poetry run python manage.py create_test_data
```

7. Start the server

```shell
poetry run manage.py runserver localhost:8000
```

Backend should now be running at `localhost:8000`.

> Since the backend is not in the root of the project, the source path is not correct for linting out of the box.
> Fixing this is specific to your IDE, but here are some setups for popular ones:
>
> PyCharm: Right click on the `backend` folder and select "Mark Directory as" and then select "Sources Root".
>
> VSCode: In your workspace settings (`.vscode/settings.json`), add the following:
>
> ```json
> {
>     "python.analysis.extraPaths": [
>         "$(workspaceFolder)/backend"
>     ]
> }
> ```

### Linting

It's recommended to set up [Ruff] linting and formatting support in your editor.

[Ruff]: https://docs.astral.sh/ruff/editors/setup/

### Testing

Tests are run with `pytest`.

Some flags that can save time when running tests:

- To skip slow-running tests: `pytest --skip-slow`
- To retain test database between runs: `pytest --reuse-db`
- To skip migration-checks at the start of tests: `pytest --no-migrations`
- To run tests in parallel: `pytest -n 8 --dist=loadscope` (=8 cores, use `-n auto` to use all available cores)

You can use a `pytest.ini` file to set up flags for local development.

### Updating dependencies

Dependencies are managed by [Poetry]. Normally, they are automatically updated by [dependabot]
without any manual intervention (given updates don't fail any automated tests).

[Poetry]: https://python-poetry.org/
[dependabot]: https://github.com/dependabot

However, if you want to update them manually, you should first check all
outdated dependencies by running:

```shell
poetry show -o
```

Then pin the **_exact_** new versions for all outdated dependencies
in the `pyproject.toml` file. Next, create a new lock file by running:

```shell
poetry lock
```

And finally, update to the new versions by running:

```shell
poetry update
```

### Background tasks

Scheduled & background tasks are run with [Celery].

[Celery]: https://github.com/celery/

When developing locally, you can run these tasks in a Celery worker with `make celery`.
This uses the filesystem as the message broker.
You'll need to create queue and processed folders according to the
`CELERY_QUEUE_FOLDER_OUT`, `CELERY_QUEUE_FOLDER_IN`, `CELERY_PROCESSED_FOLDER`
environment variables (see `.env.example`).

If you want to run background tasks synchronously without Celery, set the environment variable
`CELERY_TASK_ALWAYS_EAGER` to `True`. Scheduled tasks still need the worker in order to run.

### Authentication

Authentication is handled by [Helsinki Tunnistus] Keycloak using the [django-helusers] library.
You'll need to get the `TUNNISTAMO_ADMIN_SECRET` from the [Azure Pipelines library]
or from a colleague and set that in your `.env` file.

[Helsinki Tunnistus]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/419463195/
[django-helusers]: https://github.com/City-of-Helsinki/django-helusers
[Azure Pipelines library]: https://dev.azure.com/City-of-Helsinki/tilavarauspalvelu/_library?itemType=VariableGroups

For development, you can also use local user accounts. Generated test data includes a superuser
named `tvp` with password `tvp`. You can log in with these credentials at the admin panel.

Authentication in application is managed using session cookies.

### Static files

Static files are served by the [Whitenoise] package.
These are all files that are not uploaded by the users in Django Admin pages.

[Whitenoise]: https://whitenoise.evans.io/en/stable/

Media files are served by the [uWSGI static files implementation], offloaded to threads.
These are all files uploaded by users in Django Admin pages.

[uWSGI static files implementation]: https://uwsgi-docs.readthedocs.io/en/latest/StaticFiles.html

### Image cache

In production, [Varnish cache] is used for reservation unit and purpose images.
When new image is uploaded, existing images are removed from the cache.

[Varnish cache]: https://varnish-cache.org/

In settings there are four configurations:
- `IMAGE_CACHE_ENABLED` = Toggle caching on/off
- `IMAGE_CACHE_VARNISH_HOST` = Varnish hostname
- `IMAGE_CACHE_PURGE_KEY` = Secret key for doing purge requests
- `IMAGE_CACHE_HOST_HEADER` = `Host` header value in purge request

### Translations

Translations are handled by Django's built-in translation system.
GitHub Actions CI will check that all translations are up-to-date during PRs.

To update translations, run `make translations`. This will add any missing translations
and remove any removed translations from the `.po` files located in the `locale` directory.
After filling in the translations, run `make translate` to compile the `.po` files to `.mo` files.
The `.mo` will be used by Django to display translations. This compilation step is part of the
Dockerfile build process, so you don't need to commit the `.mo` files.

For model field translations, we use [django-modeltranslation].
The package has integrations in all the relevant parts of the project
(serializers, admin, etc.). See code for more details.

[django-modeltranslation]: https://django-modeltranslation.readthedocs.io/en/latest/

### Debugging

For debugging during development, the [Django Debug Toolbar] package can be used.
The [Django GraphQL Debug Toolbar] extension is used for the GraphQL endpoint.

[Django Debug Toolbar]: https://django-debug-toolbar.readthedocs.io/en/latest/
[Django GraphQL Debug Toolbar]: https://github.com/flavors/django-graphiql-debug-toolbar

The `local_settings.py` file added during setup can be used to change settings
locally that are not configurable using environment variables.
See documentation for [django-environment-config] for more details.

[django-environment-config]: https://mrthearman.github.io/django-environment-config/

## Frontend

TODO: Check [old readme](README-ui.md)
