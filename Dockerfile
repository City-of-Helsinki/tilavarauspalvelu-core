# Dockerfile for Tilavarauspalvelu backend

FROM registry.access.redhat.com/ubi8/python-38 as appbase

USER root
RUN rpm -Uvh https://yum.postgresql.org/11/redhat/rhel-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
RUN yum -y install postgresql11
RUN rpm -Uvh https://download.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm
RUN yum -y install epel-release

RUN useradd -ms /bin/bash -d /tvp tvp
# Statics are kept inside container image for serving using whitenoise
RUN mkdir -p /srv/static && chown tvp /srv/static && chown tvp /opt/app-root/bin

RUN chown tvp /opt/app-root/lib/python3.8/site-packages
RUN chown tvp /opt/app-root/lib/python3.8/site-packages/*
RUN pip install --upgrade pip

ARG BUILD_MODE

ARG REDHAT_USERNAME
ARG REDHAT_PASSWORD

ENV APP_NAME tilavarauspalvelu

WORKDIR /tvp

COPY deploy/* ./deploy/

RUN if [ "x$BUILD_MODE" = "xlocal" ] ; then ./deploy/local_deps.sh ${REDHAT_USERNAME} ${REDHAT_PASSWORD}; fi

RUN dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm
RUN yum install -y gdal

RUN if [ "x$BUILD_MODE" = "xlocal" ] ; then ./deploy/unregister_local.sh ; fi

RUN npm install @sentry/cli


# Can be used to inquire about running app
# eg. by running `echo $APP_NAME`

# Served by whitenoise middleware
ENV STATIC_ROOT /srv/static

ENV PYTHONUNBUFFERED True

ENV PYTHONUSERBASE /pythonbase

# Copy and install requirements files to image
COPY requirements.txt ./

RUN pip install --no-cache-dir uwsgi
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DEBUG=True

RUN python manage.py collectstatic --noinput

ENTRYPOINT ["deploy/entrypoint.sh"]

EXPOSE 8000

# Next, the development & testing extras
FROM appbase as development

ENV DEBUG=True

#production
FROM appbase as production

ENV DEBUG=False
