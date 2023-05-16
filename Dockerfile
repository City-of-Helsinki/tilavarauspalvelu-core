# Dockerfile for Tilavarauspalvelu backend

FROM registry.access.redhat.com/ubi9/python-311 as appbase

USER root

RUN rm /etc/rhsm-host

ARG LOCAL_REDHAT_USERNAME
ARG LOCAL_REDHAT_PASSWORD
ARG BUILD_MODE

# Creating dummy directories
RUN mkdir ./etc-pki-entitlement && mkdir ./rhsm-conf && mkdir ./rhsm-ca

# Copy entitlements
COPY *etc-pki-entitlement /etc/pki/entitlement

# Copy subscription manager configurations if required
COPY *rhsm-conf /etc/rhsm
COPY *rhsm-ca /etc/rhsm/ca

RUN if [ "x$BUILD_MODE" = "xlocal" ]; \
    then \
        subscription-manager register --username $LOCAL_REDHAT_USERNAME --password $LOCAL_REDHAT_PASSWORD --auto-attach; \
    else \
        subscription-manager register --auto-attach; \
        # Delete /etc/rhsm-host to use entitlements from the build container
        #rm /etc/rhsm-host; \
        # Initialize /etc/yum.repos.d/redhat.repo
        # See <https://access.redhat.com/solutions/1443553>
        yum repolist --disablerepo=*; \
    fi;

# Enable the repos you need
RUN subscription-manager repos --enable codeready-builder-for-rhel-8-x86_64-rpms
#RUN subscription-manager repos --disable rhel-8-for-x86_64-baseos-beta-rpms
#RUN subscription-manager repos --disable rhel-8-for-x86_64-appstream-beta-rpms
RUN yum -y update

# If needed, add additional packets
RUN rpm -Uvh https://download.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm

# Install what you need
RUN yum install -y gdal

RUN if [ "x$BUILD_MODE" != "xlocal" ]; \
    then \
        # Remove entitlements and Subscription Manager configs
        rm -rf /etc/pki/entitlement; \
        rm -rf /etc/rhsm; \
    fi;


RUN useradd -ms /bin/bash -d /tvp tvp
# Statics are kept inside container image for serving using whitenoise
RUN mkdir -p /srv/static && chown tvp /srv/static && chown tvp /opt/app-root/bin


RUN chown tvp /opt/app-root/lib/python3.8/site-packages
RUN chown tvp /opt/app-root/lib/python3.8/site-packages/*
RUN pip install --upgrade pip

ENV APP_NAME tilavarauspalvelu

WORKDIR /tvp

COPY deploy/* ./deploy/

RUN subscription-manager remove --all

RUN npm install @sentry/cli

# Can be used to inquire about running app
# eg. by running `echo $APP_NAME`

# Served by whitenoise middleware
ENV STATIC_ROOT /srv/static

ENV PYTHONUNBUFFERED True

ENV PYTHONUSERBASE /pythonbase

# Copy and install requirements files to image
COPY requirements.txt ./

RUN pip install --no-cache-dir wheel
RUN pip install --use-pep517 --no-cache-dir -r requirements.txt

COPY . .

ENV DEBUG=True

RUN python manage.py collectstatic --noinput

RUN chgrp -R 0 /tvp
RUN chmod g=u -R /tvp

RUN mkdir -p /broker/queue && chown tvp /broker/queue && chmod g+rw /broker/queue

RUN mkdir -p /broker/processed && chown tvp /broker/processed && chmod g+rw /broker/processed

RUN mkdir -p /metrics && chown tvp /metrics && chmod g+rw /metrics

ENTRYPOINT ["/tvp/deploy/entrypoint.sh"]

EXPOSE 8000

# Next, the development & testing extras
FROM appbase as development

ENV DEBUG=True

#production
FROM appbase as production

ENV DEBUG=False
