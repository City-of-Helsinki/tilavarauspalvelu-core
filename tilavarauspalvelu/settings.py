import os
import subprocess  # nosec
import zoneinfo

import environ
import graphql
import sentry_sdk
from pathlib import Path
from corsheaders.defaults import default_headers
from django.conf.global_settings import DEFAULT_FROM_EMAIL as django_default_from_email
from django.conf.global_settings import EMAIL_PORT as django_default_email_port
from django.utils.log import DEFAULT_LOGGING
from django.utils.translation import gettext_lazy as _
from sentry_sdk.integrations.django import DjangoIntegration

from tilavarauspalvelu.utils.logging import getLogger

# This is a temporary fix for graphene_permissions to avoid ImportError when importing ResolveInfo
# This can be removed when graphene_permissions is updated to import ResolveInfo from the correct package.
graphql.ResolveInfo = graphql.GraphQLResolveInfo


def get_git_revision_hash() -> str:
    """
    Retrieve the git hash for the underlying git repository or die trying
    We need a way to retrieve git revision hash for sentry reports
    I assume that if we have a git repository available we will
    have git-the-comamand as well
    """
    try:
        # We are not interested in gits complaints
        git_hash = subprocess.check_output(  # nosec
            ["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL, encoding="utf8"
        )
    # i.e. "git" was not found
    # should we return a more generic meta hash here?
    # like "undefined"?
    except FileNotFoundError:
        git_hash = "git_not_available"
    except subprocess.CalledProcessError:
        # Ditto
        git_hash = "no_repository"
    return git_hash.rstrip()


BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.0/howto/deployment/checklist/

# Application definition

INSTALLED_APPS = [
    "helusers.apps.HelusersConfig",
    "helusers.apps.HelusersAdminConfig",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "whitenoise.runserver_nostatic",
    "django.contrib.staticfiles",
    "graphene_django",
    "rest_framework",
    "drf_spectacular",
    "resources",
    "spaces",
    "reservations",
    "services",
    "reservation_units",
    "merchants",
    "api",
    "applications",
    "opening_hours",
    "django_extensions",
    "mptt",
    "django_filters",
    "corsheaders",
    "auditlog",
    "modeltranslation",
    "django.contrib.gis",
    "permissions",
    "users",
    "social_django",
    "tinymce",
    "easy_thumbnails",
    "django_celery_results",
    "terms_of_use",
    "email_notification",
    "django_celery_beat",
    "adminsortable2",
    "django_prometheus",
    "admin_extra_buttons",
    "import_export",
    "rangefilter",
    "elasticsearch_django",
    "common",
]

MIDDLEWARE = [
    # Make sure PrometheusBeforeMiddleware is the first one
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "tilavarauspalvelu.multi_proxy_middleware.MultipleProxyMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # Keep this after security middleware, correct place according to whitenoise documentation
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "auditlog.middleware.AuditlogMiddleware",
    # Make sure PrometheusAfterMiddleware is the last one
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

ROOT_URLCONF = "tilavarauspalvelu.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "helusers.context_processors.settings",
            ],
        },
    },
]

WSGI_APPLICATION = "tilavarauspalvelu.wsgi.application"


root = environ.Path(BASE_DIR)

env = environ.Env(
    DEBUG=(bool, False),
    DJANGO_LOG_LEVEL=(str, "DEBUG"),
    CONN_MAX_AGE=(int, 0),
    DATABASE_ENGINE=(str, ""),
    DATABASE_URL=(str, "sqlite:../db.sqlite3"),
    TOKEN_AUTH_ACCEPTED_AUDIENCE=(str, ""),
    TOKEN_AUTH_SHARED_SECRET=(str, ""),
    SECRET_KEY=(str, ""),
    ALLOWED_HOSTS=(list, []),
    ADMINS=(list, []),
    SECURE_PROXY_SSL_HEADER=(tuple, None),
    MEDIA_ROOT=(root, root("media")),
    STATIC_ROOT=(root, root("staticroot")),
    MEDIA_URL=(str, "/media/"),
    STATIC_URL=(str, "/static/"),
    TRUST_X_FORWARDED_HOST=(bool, True),
    SENTRY_DSN=(str, ""),
    SENTRY_ENVIRONMENT=(str, "development"),
    MAIL_MAILGUN_KEY=(str, ""),
    MAIL_MAILGUN_DOMAIN=(str, ""),
    MAIL_MAILGUN_API=(str, ""),
    RESOURCE_DEFAULT_TIMEZONE=(str, "Europe/Helsinki"),
    CORS_ALLOWED_ORIGINS=(list, []),
    AUDIT_LOGGING_ENABLED=(bool, False),
    TUNNISTAMO_JWT_AUDIENCE=(str, "https://api.hel.fi/auth/tilavarausapidev"),
    TUNNISTAMO_JWT_ISSUER=(str, "https://tunnistamo.test.hel.ninja/openid"),
    TUNNISTAMO_ADMIN_KEY=(str, "tilavaraus-django-admin-dev"),
    TUNNISTAMO_ADMIN_SECRET=(str, None),
    TUNNISTAMO_ADMIN_OIDC_ENDPOINT=(str, "https://tunnistamo.test.hel.ninja/openid"),
    OIDC_LEEWAY=(int, 60 * 60),
    IPWARE_META_PRECEDENCE_ORDER=(str, "HTTP_X_FORWARDED_FOR"),
    HAUKI_API_URL=(str, None),
    HAUKI_ADMIN_UI_URL=(str, None),
    HAUKI_ORIGIN_ID=(str, "tvp"),
    HAUKI_SECRET=(str, None),
    HAUKI_ORGANISATION_ID=(str, None),
    HAUKI_EXPORTS_ENABLED=(bool, False),
    HAUKI_API_KEY=(str, None),
    CSRF_TRUSTED_ORIGINS=(list, []),
    MULTI_PROXY_HEADERS=(bool, False),
    ICAL_HASH_SECRET=(str, ""),
    PRIMARY_MUNICIPALITY_NUMBER=(str, "091"),  # Default to Helsinki
    PRIMARY_MUNICIPALITY_NAME=(str, "Helsinki"),  # Default to Helsinki
    SECONDARY_MUNICIPALITY_NAME=(str, "Other"),  # Default to Other
    # Celery
    CELERY_ENABLED=(bool, True),
    CELERY_RESULT_BACKEND=(str, "django-db"),
    CELERY_CACHE_BACKEND=(str, "django-cache"),
    CELERY_TIMEZONE=(str, "Europe/Helsinki"),
    CELERY_TASK_TRACK_STARTED=(bool, False),
    CELERY_TASK_TIME_LIMIT=(int, 5 * 60),
    CELERY_BROKER_URL=(str, "filesystem://"),
    # Celery filesystem backend
    CELERY_FILESYSTEM_BACKEND=(bool, True),
    CELERY_QUEUE_FOLDER_OUT=(str, "./broker/queue/"),
    CELERY_QUEUE_FOLDER_IN=(str, "./broker/queue/"),
    CELERY_PROCESSED_FOLDER=(str, "./broker/processed/"),
    # Verkkokauppa integration
    VERKKOKAUPPA_API_KEY=(str, None),
    VERKKOKAUPPA_PRODUCT_API_URL=(str, None),
    VERKKOKAUPPA_ORDER_API_URL=(str, None),
    VERKKOKAUPPA_PAYMENT_API_URL=(str, None),
    VERKKOKAUPPA_MERCHANT_API_URL=(str, None),
    VERKKOKAUPPA_NAMESPACE=(str, None),
    VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES=(int, 10),
    VERKKOKAUPPA_TIMEZONE=(str, "Europe/Helsinki"),
    UPDATE_PRODUCT_MAPPING=(bool, False),
    UPDATE_ACCOUNTING=(bool, False),
    # Email
    EMAIL_HOST=(str, None),
    EMAIL_PORT=(str, django_default_email_port),
    EMAIL_MAX_RECIPIENTS=(int, 100),
    SEND_RESERVATION_NOTIFICATION_EMAILS=(str, False),
    DEFAULT_FROM_EMAIL=(str, django_default_from_email),
    EMAIL_HTML_MAX_FILE_SIZE=(int, 150000),
    EMAIL_VARAAMO_EXT_LINK=(str, None),
    EMAIL_FEEDBACK_EXT_LINK=(str, None),
    # Tprek
    TPREK_UNIT_URL=(str, "https://www.hel.fi/palvelukarttaws/rest/v4/unit/"),
    # GDPR API
    GDPR_API_QUERY_SCOPE=(str, ""),
    GDPR_API_DELETE_SCOPE=(str, ""),
    # Open City Profile
    OPEN_CITY_PROFILE_GRAPHQL_API=(str, "https://profile-api.test.hel.ninja/graphql/"),
    OPEN_CITY_PROFILE_LEVELS_OF_ASSURANCES=(list, ["substantial", "high"]),
    PREFILL_RESERVATION_WITH_PROFILE_DATA=(bool, False),
    # Logging
    ENABLE_SQL_LOGGING=(bool, False),
    APP_LOGGING_LEVEL=(str, "WARNING"),
    # Redis cache
    REDIS_MASTER=(str, None),
    REDIS_SENTINEL_SERVICE=(str, None),
    REDIS_URL=(str, None),
    REDIS_PASSWORD=(str, None),
    SESSION_COOKIE_DOMAIN=(str, None),
    # Elasticsearch
    ELASTICSEARCH_URL=(str, "http://localhost:9200"),
    # Image cache
    IMAGE_CACHE_ENABLED=(bool, False),
    IMAGE_CACHE_VARNISH_HOST=(str, ""),
    IMAGE_CACHE_PURGE_KEY=(str, ""),
    IMAGE_CACHE_HOST_HEADER=(str, ""),
)

environ.Env.read_env(BASE_DIR / ".env")

APP_LOGGING_LEVEL = env("APP_LOGGING_LEVEL")

LOGGING = DEFAULT_LOGGING
LOGGING["handlers"]["console"] = {
    "level": "DEBUG",
    "class": "logging.StreamHandler",
}
LOGGING["loggers"]["tilavaraus"] = {
    "handlers": ["console"],
    "level": APP_LOGGING_LEVEL,
    "propagate": True,
}

ENABLE_SQL_LOGGING = env("ENABLE_SQL_LOGGING")
if ENABLE_SQL_LOGGING:
    LOGGING["loggers"].update(
        {
            "django.db.backends": {
                "handlers": ["console"],
                "level": "DEBUG",
                "propagate": True,
            },
        }
    )

logger = getLogger("settings")

ALLOWED_HOSTS = env("ALLOWED_HOSTS")
DEBUG = env("DEBUG")

# Database configuration
DATABASES = {"default": env.db()}
DATABASES["default"]["CONN_MAX_AGE"] = env("CONN_MAX_AGE")

# Database engine can be overridden for Prometheus monitoring
if env("DATABASE_ENGINE"):
    DATABASES["default"]["ENGINE"] = env("DATABASE_ENGINE")

# SECURITY WARNING: keep the secret key used in production secret!
# Using hard coded in dev environments if not defined.
if DEBUG is True and env("SECRET_KEY") == "":
    logger.warning("Running in debug mode without proper secret key. Fix if not intentional")
    SECRET_KEY = "example_secret"  # nosec
else:
    SECRET_KEY = env("SECRET_KEY")

ADMINS = env("ADMINS")

SECURE_PROXY_SSL_HEADER = env("SECURE_PROXY_SSL_HEADER")

# Static files (CSS, JavaScript, Images) and media uploads
# https://docs.djangoproject.com/en/3.0/howto/static-files/
STATIC_ROOT = env("STATIC_ROOT")
MEDIA_ROOT = env("MEDIA_ROOT")

STATIC_URL = env("STATIC_URL")
MEDIA_URL = env("MEDIA_URL")

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

HAUKI_API_URL = env("HAUKI_API_URL")
HAUKI_ORIGIN_ID = env("HAUKI_ORIGIN_ID")
HAUKI_SECRET = env("HAUKI_SECRET")
HAUKI_ORGANISATION_ID = env("HAUKI_ORGANISATION_ID")
HAUKI_ADMIN_UI_URL = env("HAUKI_ADMIN_UI_URL")
HAUKI_EXPORTS_ENABLED = env("HAUKI_EXPORTS_ENABLED")
HAUKI_API_KEY = env("HAUKI_API_KEY")

VERKKOKAUPPA_API_KEY = env("VERKKOKAUPPA_API_KEY")
VERKKOKAUPPA_PRODUCT_API_URL = env("VERKKOKAUPPA_PRODUCT_API_URL")
VERKKOKAUPPA_ORDER_API_URL = env("VERKKOKAUPPA_ORDER_API_URL")
VERKKOKAUPPA_PAYMENT_API_URL = env("VERKKOKAUPPA_PAYMENT_API_URL")
VERKKOKAUPPA_MERCHANT_API_URL = env("VERKKOKAUPPA_MERCHANT_API_URL")
VERKKOKAUPPA_NAMESPACE = env("VERKKOKAUPPA_NAMESPACE")
VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = env("VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES")
VERKKOKAUPPA_TIMEZONE = zoneinfo.ZoneInfo(env("VERKKOKAUPPA_TIMEZONE"))
UPDATE_PRODUCT_MAPPING = env("UPDATE_PRODUCT_MAPPING")
UPDATE_ACCOUNTING = env("UPDATE_ACCOUNTING")

RESERVATION_UNIT_IMAGES_ROOT = "reservation_unit_images"
RESERVATION_UNIT_PURPOSE_IMAGES_ROOT = "reservation_unit_purpose_images"

ICAL_HASH_SECRET = env("ICAL_HASH_SECRET")

PRIMARY_MUNICIPALITY_NUMBER = env("PRIMARY_MUNICIPALITY_NUMBER")
PRIMARY_MUNICIPALITY_NAME = env("PRIMARY_MUNICIPALITY_NAME")
SECONDARY_MUNICIPALITY_NAME = env("SECONDARY_MUNICIPALITY_NAME")

# Whether to trust X-Forwarded-Host headers for all purposes
# where Django would need to make use of its own hostname
# fe. generating absolute URLs pointing to itself
# Most often used in reverse proxy setups
USE_X_FORWARDED_HOST = env("TRUST_X_FORWARDED_HOST")

MULTI_PROXY_HEADERS = env("MULTI_PROXY_HEADERS")

# Configure cors
CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS")
CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-referrer",  # for authenticating requests from the frontend
    "x-authorization",  # for passing Open City Profile API token from frontend
]

AUDIT_LOGGING_ENABLED = env("AUDIT_LOGGING_ENABLED")

# Email settings
EMAIL_HOST = env("EMAIL_HOST")
EMAIL_PORT = env("EMAIL_PORT")
EMAIL_MAX_RECIPIENTS = env("EMAIL_MAX_RECIPIENTS")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL")
EMAIL_TEMPLATE_CONTEXT_VARIABLES = [
    "reservee_name",
    "name",
    "begin_date",
    "begin_time",
    "end_date",
    "end_time",
    "reservation_number",
    "unit_name",
    "unit_location",
    "reservation_unit",
    "price",
    "non_subsidised_price",
    "subsidised_price",
    "tax_percentage",
    "confirmed_instructions",
    "pending_instructions",
    "cancelled_instructions",
    "deny_reason",
    "cancel_reason",
    "current_year",
    "varaamo_ext_link",
    "my_reservations_ext_link",
    "feedback_ext_link",
]
EMAIL_TEMPLATE_SUPPORTED_EXPRESSIONS = ["if", "elif", "else", "endif"]

SEND_RESERVATION_NOTIFICATION_EMAILS = env("SEND_RESERVATION_NOTIFICATION_EMAILS")
EMAIL_HTML_MAX_FILE_SIZE = env("EMAIL_HTML_MAX_FILE_SIZE")
EMAIL_HTML_TEMPLATES_ROOT = "email_html_templates"
EMAIL_VARAAMO_EXT_LINK = env("EMAIL_VARAAMO_EXT_LINK")
EMAIL_FEEDBACK_EXT_LINK = env("EMAIL_FEEDBACK_EXT_LINK")

# TPREK
TPREK_UNIT_URL = env("TPREK_UNIT_URL")

# GDPR API
GDPR_API_MODEL = "api.ProfileUser"
GDPR_API_QUERY_SCOPE = env("GDPR_API_QUERY_SCOPE")
GDPR_API_DELETE_SCOPE = env("GDPR_API_DELETE_SCOPE")

# Configure sentry
if env("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=env("SENTRY_DSN"),
        environment=env("SENTRY_ENVIRONMENT"),
        release=get_git_revision_hash(),
        integrations=[DjangoIntegration()],
    )

# Password validation
# https://docs.djangoproject.com/en/3.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.0/topics/i18n/

LANGUAGE_CODE = "fi"
LANGUAGES = (("fi", _("Finnish")), ("en", _("English")), ("sv", _("Swedish")))

TIME_ZONE = "Europe/Helsinki"

USE_I18N = True

USE_L10N = True

USE_TZ = True

AUTH_USER_MODEL = "users.User"

AUTHENTICATION_BACKENDS = [
    "helusers.tunnistamo_oidc.TunnistamoOIDCAuth",
    "django.contrib.auth.backends.ModelBackend",
    "tilavarauspalvelu.graphql_api_token_authentication.GraphQLApiTokenAuthentication",
]

LOGIN_REDIRECT_URL = "/admin/"
LOGOUT_REDIRECT_URL = "/admin/"

SESSION_SERIALIZER = "django.contrib.sessions.serializers.PickleSerializer"
SESSION_COOKIE_AGE = 12 * 60 * 60  # 12 hours in seconds
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_DOMAIN = env("SESSION_COOKIE_DOMAIN")

OIDC_API_TOKEN_AUTH = {
    "AUDIENCE": env("TUNNISTAMO_JWT_AUDIENCE"),
    "ISSUER": env("TUNNISTAMO_JWT_ISSUER"),
    # Use a custom resolve user for fetching date of birth.
    "USER_RESOLVER": "users.utils.open_city_profile.resolve_user",
    "API_SCOPE_PREFIX": "",
    "TOKEN_AUTH_REQUIRE_SCOPE_PREFIX": True,
}

OIDC_AUTH = {"OIDC_LEEWAY": env("OIDC_LEEWAY")}

SOCIAL_AUTH_TUNNISTAMO_KEY = env("TUNNISTAMO_ADMIN_KEY")
SOCIAL_AUTH_TUNNISTAMO_SECRET = env("TUNNISTAMO_ADMIN_SECRET")
SOCIAL_AUTH_TUNNISTAMO_OIDC_ENDPOINT = env("TUNNISTAMO_ADMIN_OIDC_ENDPOINT")
IPWARE_META_PRECEDENCE_ORDER = ("HTTP_X_FORWARDED_FOR",)

GRAPHENE = {
    "SCHEMA": "api.graphql.schema.schema",
    "MIDDLEWARE": [
        "graphql_jwt.middleware.JSONWebTokenMiddleware",
    ],
    "TESTING_ENDPOINT": "/graphql/",
}

GRAPHQL_JWT = {"JWT_AUTH_HEADER_PREFIX": "Bearer"}

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["permissions.api_permissions.drf_permissions.ReadOnly"],
    "DEFAULT_AUTHENTICATION_CLASSES": ["helusers.oidc.ApiTokenAuthentication"]
    + (
        [
            "rest_framework.authentication.SessionAuthentication",
            "rest_framework.authentication.BasicAuthentication",
        ]
        if DEBUG
        else []
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}
SPECTACULAR_SETTINGS = {
    # path prefix is used for tagging the discovered operations.
    # use '/api/v[0-9]' for tagging apis like '/api/v1/albums' with ['albums']
    "SCHEMA_PATH_PREFIX": r"/v[^/]",
    "TITLE": "Tilavaraus API",
    "DESCRIPTION": "",
    "VERSION": "1.0.0",
    "TAGS": [
        {
            "name": "openapi",
            "description": "",
        },
        {
            "name": "application",
            "description": "Applications for recurring reservations for individuals and organisations.",
        },
        {
            "name": "application_event",
            "description": "Single recurring events related to a certain application.",
        },
        {
            "name": "application_round",
            "description": "Information of past, current and future application periods "
            "to where applications are targeted to.",
        },
        {
            "name": "parameters",
            "description": "",
        },
        {
            "name": "reservation",
            "description": "Reservation for single or multiple reservation units.",
        },
        {
            "name": "reservation_unit",
            "description": "A single unit that can be reserved. "
            "Wrapper for combinations of spaces, resources and services.",
        },
    ],
}


THUMBNAIL_ALIASES = {
    "": {
        # Currently, all custom sized images are wanted to be cropped.
        "small": {"size": (250, 250), "crop": True},
        "medium": {"size": (384, 384), "crop": True},
        "large": {"size": (0, 728), "crop": False},
        "purpose_image": {"size": (390, 245), "crop": True},
    },
}
IMAGE_CACHE_ENABLED = env("IMAGE_CACHE_ENABLED")
IMAGE_CACHE_VARNISH_HOST = env("IMAGE_CACHE_VARNISH_HOST")
IMAGE_CACHE_PURGE_KEY = env("IMAGE_CACHE_PURGE_KEY")
IMAGE_CACHE_HOST_HEADER = env("IMAGE_CACHE_HOST_HEADER")

# Do not try to chmod when uploading images.
# Our environments use persistent storage for media and operation will not be permitted.
# https://dev.azure.com/City-of-Helsinki/devops-guides/_git/devops-handbook?path=/storage.md&_a=preview&anchor=operation-not-permitted
FILE_UPLOAD_PERMISSIONS = None

CELERY_ENABLED = env("CELERY_ENABLED")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND")

CELERY_CACHE_BACKEND = env("CELERY_CACHE_BACKEND")

CELERY_TIMEZONE = env("CELERY_TIMEZONE")
CELERY_TASK_TRACK_STARTED = env("CELERY_TASK_TRACK_STARTED")
CELERY_TASK_TIME_LIMIT = env("CELERY_TASK_TIME_LIMIT")
CELERY_BROKER_URL = env("CELERY_BROKER_URL")
CELERY_FILESYSTEM_BACKEND = env("CELERY_FILESYSTEM_BACKEND")


if CELERY_FILESYSTEM_BACKEND:
    CELERY_QUEUE_FOLDER_OUT = env("CELERY_QUEUE_FOLDER_OUT")
    CELERY_QUEUE_FOLDER_IN = env("CELERY_QUEUE_FOLDER_IN")
    CELERY_PROCESSED_FOLDER = env("CELERY_PROCESSED_FOLDER")

    CELERY_BROKER_TRANSPORT_OPTIONS = {
        "data_folder_out": CELERY_QUEUE_FOLDER_OUT,
        "data_folder_in": CELERY_QUEUE_FOLDER_IN,
        "processed_folder": CELERY_PROCESSED_FOLDER,
        "store_processed": True,
    }


if not all(
    [
        OIDC_API_TOKEN_AUTH["AUDIENCE"],
        OIDC_API_TOKEN_AUTH["ISSUER"],
        SOCIAL_AUTH_TUNNISTAMO_KEY,
        SOCIAL_AUTH_TUNNISTAMO_SECRET,
        SOCIAL_AUTH_TUNNISTAMO_OIDC_ENDPOINT,
    ]
):
    logger.error("Some of Tunnistamo environment variables are not set. Authentication may not work properly!")


# Settings for generating model visualizaxtion
GRAPH_MODELS = {
    "all_applications": True,
    "group_models": True,
}

DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

# Open city profile confs
OPEN_CITY_PROFILE_GRAPHQL_API = env("OPEN_CITY_PROFILE_GRAPHQL_API")
OPEN_CITY_PROFILE_LEVELS_OF_ASSURANCES = env("OPEN_CITY_PROFILE_LEVELS_OF_ASSURANCES")
PREFILL_RESERVATION_WITH_PROFILE_DATA = env("PREFILL_RESERVATION_WITH_PROFILE_DATA")

# Configure Redis cache for local dev environment
if env("REDIS_URL"):
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": env("REDIS_URL"),
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            },
        }
    }

# Configure Redis cache for production OpenShift environment
elif env("REDIS_SENTINEL_SERVICE") and env("REDIS_MASTER"):
    sentinel_host, sentinel_port = env("REDIS_SENTINEL_SERVICE").split(":")
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"
    DJANGO_REDIS_CONNECTION_FACTORY = "django_redis.pool.SentinelConnectionFactory"
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": env("REDIS_MASTER"),
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.SentinelClient",
                "SENTINELS": [(sentinel_host, sentinel_port)],
                "SENTINEL_KWARGS": {"password": env("REDIS_PASSWORD")},
                "PASSWORD": env("REDIS_PASSWORD"),
            },
        }
    }


SEARCH_SETTINGS = {
    "connections": {
        "default": env("ELASTICSEARCH_URL"),
    },
    "indexes": {
        "reservation_units": {
            "models": [
                "reservation_units.ReservationUnit",
            ]
        }
    },
    "settings": {
        # batch size for ES bulk api operations
        "chunk_size": 500,
        # default page size for search results
        "page_size": 10000,
        # set to True to connect post_save/delete signals
        "auto_sync": True,
        # List of models which will never auto_sync even if auto_sync is True
        "never_auto_sync": [],
        # if true, then indexes must have mapping files
        "strict_validation": False,
        "mappings_dir": "elastic_django",
    },
}


# local_settings.py can be used to override environment-specific settings
# like database and email that differ between development and production.
local_settings_path = BASE_DIR / "local_settings.py"
if local_settings_path.exists():
    with open(local_settings_path) as fp:
        code = compile(fp.read(), local_settings_path, "exec")
    exec(code, globals(), locals())  # nosec
