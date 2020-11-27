# Dockerfile for Tilavarauspalvelu backend

FROM python:3.8-buster as appbase

RUN useradd -ms /bin/bash -d /tvp tvp

WORKDIR /tvp

# Can be used to inquire about running app
# eg. by running `echo $APP_NAME`
ENV APP_NAME tilavarauspalvelu

# Served by whitenoise middleware
ENV STATIC_ROOT /srv/static

ENV PYTHONUNBUFFERED True

RUN apt-get update && apt-get install -y postgresql-client gdal-bin

RUN pip install --no-cache-dir uwsgi
# Sentry CLI for sending events from non-Python processes to Sentry
# eg. https://docs.sentry.io/cli/send-event/#bash-hook
RUN curl -sL https://sentry.io/get-cli/ | bash

# Copy and install requirements files to image
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Statics are kept inside container image for serving using whitenoise
ENV DEBUG=True
RUN mkdir -p /srv/static && python manage.py collectstatic --noinput

ENTRYPOINT ["deploy/entrypoint.sh"]

EXPOSE 8000

# Next, the development & testing extras
FROM appbase as development

ENV DEBUG=True

USER tvp

#production
FROM appbase as production

ENV DEBUG=False

USER tvp