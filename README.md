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

![Tietokantakuvaus](tilavarauspalvelu_visualized.png)