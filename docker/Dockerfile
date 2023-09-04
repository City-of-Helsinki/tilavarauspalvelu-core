FROM python:3.11-slim-bullseye AS base

# Make sure we build as the root user.
USER root

# Setup environment variables.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONFAULTHANDLER=1 \
    PYTHONHASHSEED=random

# Setup build time variables.
ARG PROJECT_ROOT=/tvp
ARG STATIC_ROOT=/srv/static

# Setup common dependencies and create required directories.
RUN echo "Install common dependencies" \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      gdal-bin \
      gettext \
      libpq5 \
      make \
    && echo "Create project directory" \
    && mkdir -p $PROJECT_ROOT \
    && chmod g=u $PROJECT_ROOT \
    && echo "Create directories for static files" \
    && mkdir -p $STATIC_ROOT \
    && chmod g=u $STATIC_ROOT \
    && echo "Create celery broker directories and set permissions" \
    && mkdir -p /broker/queue \
    && mkdir -p /broker/processed \
    && chmod g+rw /broker/queue \
    && chmod g+rw /broker/processed \
    && echo "Create directory for django-prometheus metrics" \
    && mkdir -p /metrics \
    && chmod g+rw /metrics \
    && echo "Done"


FROM base AS builder

# Setup build time variables.
# Old variables need to be redeclared so that defaults can be used.
ARG PROJECT_ROOT=/tvp
ARG VENV_ROOT=$PROJECT_ROOT/venv
ARG DEPS=main

# Install build dependencies
# - build-essential: for building uWSGI
# - curl: for installing poetry
# - libpcre3 & libpcre3-dev: for uWSGI internal routing support
# - libpq-dev: for building psycopg2
RUN apt-get install -y --no-install-recommends \
      build-essential \
      curl \
      libpcre3 \
      libpcre3-dev \
      libpq-dev

# Setup environment variables for poetry.
ENV POETRY_HOME=/usr/pypoetry
ENV PATH=$POETRY_HOME/bin:$PATH
ENV POETRY_VIRTUALENVS_IN_PROJECT=true
# Disable parallel installer to avoid out-of-memory errors in Azure Pipelines.
ENV POETRY_INSTALLER_PARALLEL=false

# Install poetry.
RUN curl -sSL https://install.python-poetry.org | POETRY_VERSION=1.6.0 python -

# Copy poetry files.
COPY poetry.lock pyproject.toml /

# Create virtualenv.
RUN python -m venv $VENV_ROOT

# Activate virtualenv by setting some environment variables.
ENV PATH=$VENV_ROOT/bin:$PATH \
    VIRTUAL_ENV=$VENV_ROOT

# Install production dependencies (to previously created virtualenv).
RUN poetry install --no-root --only $DEPS


FROM base AS build-static

# Setup build time variables.
# Old variables need to be redeclared so that defaults can be used.
ARG PROJECT_ROOT=/tvp
ARG VENV_ROOT=$PROJECT_ROOT/venv

# Change working directory to project directory.
WORKDIR $PROJECT_ROOT

# Copy project files and virtualenv.
COPY . .
COPY --from=builder $VENV_ROOT $VENV_ROOT

# Activate virtualenv by setting some environment variables.
ENV PATH=$VENV_ROOT/bin:$PATH \
    VIRTUAL_ENV=$VENV_ROOT

# Collect static files.
RUN python manage.py collectstatic --clear --no-input --verbosity=2


FROM base AS production

# Setup build time variables.
# Old variables need to be redeclared after "from" statements" so that defaults can be used.
ARG PROJECT_ROOT=/tvp
ARG VENV_ROOT=$PROJECT_ROOT/venv
ARG STATIC_ROOT=/srv/static

# Change working directory to project directory.
WORKDIR $PROJECT_ROOT

# Copy project files, virtualenv, and static files.
# Give ownership and permissions to root group to support running with arbitrary user IDs.
# https://docs.openshift.com/container-platform/4.11/openshift_images/create-images.html#:~:text=Support%20arbitrary%20user%20ids
COPY --chown=root:root --chmod=774 . .
COPY --chown=root:root --chmod=774 --from=builder $VENV_ROOT $VENV_ROOT
COPY --chown=root:root --chmod=774 --from=build-static $STATIC_ROOT $STATIC_ROOT

# Activate virtualenv by setting some environment variables.
ENV PATH=$VENV_ROOT/bin:$PATH \
    VIRTUAL_ENV=$VENV_ROOT

# Expose port for uWSGI.
EXPOSE 8000

ENTRYPOINT ["/tvp/docker/entrypoint.sh"]
