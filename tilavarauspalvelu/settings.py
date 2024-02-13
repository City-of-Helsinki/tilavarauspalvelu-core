import zoneinfo
from pathlib import Path

import environ
import graphql
import sentry_sdk
from django.conf import global_settings
from django.utils.log import DEFAULT_LOGGING
from django.utils.translation import gettext_lazy as _
from helusers import defaults
from sentry_sdk.integrations.django import DjangoIntegration

from .utils.logging import getLogger

# This is a temporary fix for graphene_permissions to avoid ImportError when importing ResolveInfo
# This can be removed when graphene_permissions is updated to import ResolveInfo from the correct package.
graphql.ResolveInfo = graphql.GraphQLResolveInfo


# ----- ENV Setup --------------------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
root = environ.Path(BASE_DIR)

env = environ.Env(
    ADMINS=(list, []),
    ALLOWED_HOSTS=(list, []),
    APP_LOGGING_LEVEL=(str, "WARNING"),
    AUDIT_LOGGING_ENABLED=(bool, False),
    CELERY_BROKER_URL=(str, "filesystem://"),
    CELERY_CACHE_BACKEND=(str, "django-cache"),
    CELERY_ENABLED=(bool, True),
    CELERY_FILESYSTEM_BACKEND=(bool, True),
    CELERY_LOG_FILE=(str, "./broker/worker.log"),
    CELERY_LOG_LEVEL=(str, "INFO"),
    CELERY_PROCESSED_FOLDER=(str, "./broker/processed/"),
    CELERY_QUEUE_FOLDER_IN=(str, "./broker/queue/"),
    CELERY_QUEUE_FOLDER_OUT=(str, "./broker/queue/"),
    CELERY_RESULT_BACKEND=(str, "django-db"),
    CELERY_TASK_TIME_LIMIT=(int, 5 * 60),
    CELERY_TASK_TRACK_STARTED=(bool, False),
    CELERY_TIMEZONE=(str, "Europe/Helsinki"),
    CONN_MAX_AGE=(int, 0),
    CORS_ALLOWED_ORIGINS=(list, []),
    CSRF_TRUSTED_ORIGINS=(list, []),
    DATABASE_ENGINE=(str, ""),
    DATABASE_URL=(str, "sqlite:../db.sqlite3"),
    DEBUG=(bool, False),
    DEFAULT_FROM_EMAIL=(str, global_settings.DEFAULT_FROM_EMAIL),
    DJANGO_LOG_LEVEL=(str, "DEBUG"),
    ELASTICSEARCH_URL=(str, "http://localhost:9200"),
    EMAIL_FEEDBACK_EXT_LINK=(str, None),
    EMAIL_HOST=(str, None),
    EMAIL_HTML_MAX_FILE_SIZE=(int, 150000),
    EMAIL_MAX_RECIPIENTS=(int, 100),
    EMAIL_PORT=(str, global_settings.EMAIL_PORT),
    EMAIL_USE_TLS=(bool, True),
    EMAIL_VARAAMO_EXT_LINK=(str, None),
    GDPR_API_DELETE_SCOPE=(str, ""),
    GDPR_API_QUERY_SCOPE=(str, ""),
    HAUKI_ADMIN_UI_URL=(str, None),
    HAUKI_API_KEY=(str, None),
    HAUKI_API_URL=(str, None),
    HAUKI_EXPORTS_ENABLED=(bool, False),
    HAUKI_ORGANISATION_ID=(str, None),
    HAUKI_ORIGIN_ID=(str, "tvp"),
    HAUKI_SECRET=(str, None),
    ICAL_HASH_SECRET=(str, ""),
    IMAGE_CACHE_ENABLED=(bool, False),
    IMAGE_CACHE_HOST_HEADER=(str, ""),
    IMAGE_CACHE_PURGE_KEY=(str, ""),
    IMAGE_CACHE_VARNISH_HOST=(str, ""),
    IPWARE_META_PRECEDENCE_ORDER=(str, "HTTP_X_FORWARDED_FOR"),
    LOGIN_ERROR_URL=(str, "/admin/"),
    MAIL_MAILGUN_API=(str, ""),
    MAIL_MAILGUN_DOMAIN=(str, ""),
    MAIL_MAILGUN_KEY=(str, ""),
    MEDIA_ROOT=(root, root("media")),
    MEDIA_URL=(str, "/media/"),
    MULTI_PROXY_HEADERS=(bool, False),
    OIDC_LEEWAY=(int, 3600),
    OPEN_CITY_PROFILE_GRAPHQL_API=(str, "https://profile-api.test.hel.ninja/graphql/"),
    OPEN_CITY_PROFILE_SCOPE=(str, "https://api.hel.fi/auth/helsinkiprofile"),
    PREFILL_RESERVATION_WITH_PROFILE_DATA=(bool, False),
    PRIMARY_MUNICIPALITY_NAME=(str, "Helsinki"),
    PRIMARY_MUNICIPALITY_NUMBER=(str, "091"),
    REDIS_MASTER=(str, None),
    REDIS_PASSWORD=(str, None),
    REDIS_SENTINEL_SERVICE=(str, None),
    REDIS_URL=(str, None),
    RESOURCE_DEFAULT_TIMEZONE=(str, "Europe/Helsinki"),
    SECONDARY_MUNICIPALITY_NAME=(str, "Other"),
    SECRET_KEY=(str, ""),  # NOSONAR
    SECURE_PROXY_SSL_HEADER=(tuple, None),
    SEND_RESERVATION_NOTIFICATION_EMAILS=(str, False),
    SENTRY_DSN=(str, ""),
    SENTRY_ENVIRONMENT=(str, "development"),
    SESSION_COOKIE_DOMAIN=(str, None),
    SOURCE_BRANCH_NAME=(str, ""),
    SOURCE_VERSION=(str, ""),
    STATIC_ROOT=(root, root("staticroot")),
    STATIC_URL=(str, "/static/"),
    TOKEN_AUTH_ACCEPTED_AUDIENCE=(str, ""),
    TOKEN_AUTH_SHARED_SECRET=(str, ""),
    TPREK_UNIT_URL=(str, "https://www.hel.fi/palvelukarttaws/rest/v4/unit/"),
    TRUST_X_FORWARDED_HOST=(bool, True),
    TUNNISTAMO_ADMIN_KEY=(str, "tilavaraus-django-admin-dev"),
    TUNNISTAMO_ADMIN_OIDC_ENDPOINT=(str, "https://tunnistamo.test.hel.ninja/openid"),
    TUNNISTAMO_ADMIN_SECRET=(str, None),
    TUNNISTAMO_ALLOWED_REDIRECT_HOSTS=(list, []),
    TUNNISTAMO_BASE_URL=(str, "https://tunnistamo.test.hel.ninja"),
    TUNNISTAMO_JWT_AUDIENCE=(str, "https://api.hel.fi/auth/tilavarausapidev"),
    TUNNISTAMO_JWT_ISSUER=(str, "https://tunnistamo.test.hel.ninja/openid"),
    UPDATE_ACCOUNTING=(bool, False),
    UPDATE_PRODUCT_MAPPING=(bool, False),
    VERKKOKAUPPA_API_KEY=(str, None),
    VERKKOKAUPPA_MERCHANT_API_URL=(str, None),
    VERKKOKAUPPA_NAMESPACE=(str, None),
    VERKKOKAUPPA_NEW_LOGIN=(bool, True),
    VERKKOKAUPPA_ORDER_API_URL=(str, None),
    VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES=(int, 10),
    VERKKOKAUPPA_PAYMENT_API_URL=(str, None),
    VERKKOKAUPPA_PRODUCT_API_URL=(str, None),
    VERKKOKAUPPA_TIMEZONE=(str, "Europe/Helsinki"),
)
environ.Env.read_env(BASE_DIR / ".env")

# ----- Basic settings  --------------------------------------------------------------------------------

DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")
WSGI_APPLICATION = "tilavarauspalvelu.wsgi.application"
ROOT_URLCONF = "tilavarauspalvelu.urls"
AUTH_USER_MODEL = "users.User"
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"
ADMINS = env("ADMINS")

# Either the release tag or git short hash (or "local" if running locally)
APP_VERSION = env("SOURCE_BRANCH_NAME").replace("main", "") or env("SOURCE_VERSION")[:8] or "local"

if DEBUG is True and env("SECRET_KEY") == "":
    SECRET_KEY = "example_secret"  # nosec
else:
    SECRET_KEY = env("SECRET_KEY")  # NOSONAR

# ----- CORS and CSRF settings -------------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

# Whether to trust X-Forwarded-Host headers for all purposes
# where Django would need to make use of its own hostname
# fe. generating absolute URLs pointing to itself
# Most often used in reverse proxy setups
USE_X_FORWARDED_HOST = env("TRUST_X_FORWARDED_HOST")
MULTI_PROXY_HEADERS = env("MULTI_PROXY_HEADERS")
SECURE_PROXY_SSL_HEADER = env("SECURE_PROXY_SSL_HEADER")
IPWARE_META_PRECEDENCE_ORDER = ("HTTP_X_FORWARDED_FOR",)

# ----- Installed apps ---------------------------------------------------------------------------------

INSTALLED_APPS = [
    # -- Load order important ---
    "modeltranslation",
    "helusers.apps.HelusersConfig",
    "helusers.apps.HelusersAdminConfig",
    # ---Django builtins --------
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.postgres",
    "django.contrib.gis",
    # -- Load order important ---
    "whitenoise.runserver_nostatic",
    "django.contrib.staticfiles",
    # -- Third party apps -------
    "admin_extra_buttons",
    "adminsortable2",
    "auditlog",
    "corsheaders",
    "django_celery_beat",
    "django_celery_results",
    "django_extensions",
    "django_filters",
    "django_prometheus",
    "drf_spectacular",
    "easy_thumbnails",
    "elasticsearch_django",
    "graphene_django",
    "import_export",
    "mptt",
    "rangefilter",
    "rest_framework",
    "social_django",
    "tinymce",
    "subforms",
    # -- Our apps ------------
    "common",
    "users",
    "applications",
    "email_notification",
    "merchants",
    "opening_hours",
    "permissions",
    "reservation_units",
    "reservations",
    "resources",
    "services",
    "spaces",
    "terms_of_use",
    "api",
]

# ----- Middleware -------------------------------------------------------------------------------------

MIDDLEWARE = [
    # Make sure PrometheusBeforeMiddleware is the first one
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "tilavarauspalvelu.middleware.MultipleProxyMiddleware",
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
    "social_django.middleware.SocialAuthExceptionMiddleware",
    # Make sure PrometheusAfterMiddleware is the last one
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

# ----- Database ---------------------------------------------------------------------------------------

DATABASES = {"default": env.db()}
DATABASES["default"]["CONN_MAX_AGE"] = env("CONN_MAX_AGE")

# Database engine can be overridden for Prometheus monitoring
if env("DATABASE_ENGINE"):
    DATABASES["default"]["ENGINE"] = env("DATABASE_ENGINE")

# ----- Templates --------------------------------------------------------------------------------------

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
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

# ----- Static files -----------------------------------------------------------------------------------

STATIC_ROOT = env("STATIC_ROOT")
MEDIA_ROOT = env("MEDIA_ROOT")

STATIC_URL = env("STATIC_URL")
MEDIA_URL = env("MEDIA_URL")

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

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

# ----- Email ------------------------------------------------------------------------------------------

EMAIL_HOST = env("EMAIL_HOST")
EMAIL_PORT = env("EMAIL_PORT")
EMAIL_USE_TLS = env("EMAIL_USE_TLS")
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

# ----- Logging ----------------------------------------------------------------------------------------

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {},
    "formatters": {
        "common": {
            "format": "{asctime} | {levelname} | {module}.{funcName}:{lineno} | {message}",
            "datefmt": "%Y-%m-%dT%H:%M:%S%z",
            "style": "{",
        },
    },
    "handlers": {
        "stdout": {
            "class": "logging.StreamHandler",
            "formatter": "common",
        },
    },
    "root": {
        "level": env("APP_LOGGING_LEVEL"),
        "handlers": ["stdout"],
    },
}

AUDIT_LOGGING_ENABLED = env("AUDIT_LOGGING_ENABLED")

if env("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=env("SENTRY_DSN"),
        environment=env("SENTRY_ENVIRONMENT"),
        release=APP_VERSION,
        integrations=[DjangoIntegration()],
    )

# ----- Internationalization ---------------------------------------------------------------------------

LANGUAGE_CODE = "fi"
LANGUAGES = (("fi", _("Finnish")), ("en", _("English")), ("sv", _("Swedish")))
LOCALE_PATHS = [BASE_DIR / "locale"]
TIME_ZONE = "Europe/Helsinki"
USE_I18N = True
USE_L10N = True
USE_TZ = True

# ----- Authentication settings ------------------------------------------------------------------------

AUTHENTICATION_BACKENDS = [
    "helusers.tunnistamo_oidc.TunnistamoOIDCAuth",
    "django.contrib.auth.backends.ModelBackend",
]

LOGIN_REDIRECT_URL = "/admin/"
LOGOUT_REDIRECT_URL = "/admin/"
SESSION_SERIALIZER = "django.contrib.sessions.serializers.PickleSerializer"

# See 'oidc_auth/settings.py'
OIDC_AUTH = {
    "OIDC_LEEWAY": env("OIDC_LEEWAY"),
}

# See 'helusers/settings.py'
OIDC_API_TOKEN_AUTH = {
    "AUDIENCE": env("TUNNISTAMO_JWT_AUDIENCE"),
    "ISSUER": env("TUNNISTAMO_JWT_ISSUER"),
}

TUNNISTAMO_BASE_URL = env("TUNNISTAMO_BASE_URL")

# Url where user is redirected after login error or cancellation
SOCIAL_AUTH_LOGIN_ERROR_URL = env("LOGIN_ERROR_URL")
# Overridden to get access to user fetching
SOCIAL_AUTH_STORAGE = "users.models.ProxyDjangoStorage"

SOCIAL_AUTH_TUNNISTAMO_KEY = env("TUNNISTAMO_ADMIN_KEY")
SOCIAL_AUTH_TUNNISTAMO_SECRET = env("TUNNISTAMO_ADMIN_SECRET")
SOCIAL_AUTH_TUNNISTAMO_SCOPE = [env("OPEN_CITY_PROFILE_SCOPE")]
SOCIAL_AUTH_TUNNISTAMO_OIDC_ENDPOINT = env("TUNNISTAMO_ADMIN_OIDC_ENDPOINT")
SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS = env("TUNNISTAMO_ALLOWED_REDIRECT_HOSTS")
SOCIAL_AUTH_TUNNISTAMO_PIPELINE = defaults.SOCIAL_AUTH_PIPELINE + (
    "users.helauth.pipeline.fetch_additional_info_for_user_from_helsinki_profile",
)

HELUSERS_PASSWORD_LOGIN_DISABLED = False
HELUSERS_BACK_CHANNEL_LOGOUT_ENABLED = False

# Open city profile confs
OPEN_CITY_PROFILE_GRAPHQL_API = env("OPEN_CITY_PROFILE_GRAPHQL_API")
OPEN_CITY_PROFILE_SCOPE = env("OPEN_CITY_PROFILE_SCOPE")
PREFILL_RESERVATION_WITH_PROFILE_DATA = env("PREFILL_RESERVATION_WITH_PROFILE_DATA")

# GDPR API settings
GDPR_API_MODEL = "users.ProfileUser"
GDPR_API_QUERY_SCOPE = env("GDPR_API_QUERY_SCOPE")
GDPR_API_DELETE_SCOPE = env("GDPR_API_DELETE_SCOPE")

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ----- 'Aukiolosovellus' settings ---------------------------------------------------------------------

HAUKI_API_URL = env("HAUKI_API_URL")
HAUKI_ORIGIN_ID = env("HAUKI_ORIGIN_ID")
HAUKI_SECRET = env("HAUKI_SECRET")
HAUKI_ORGANISATION_ID = env("HAUKI_ORGANISATION_ID")
HAUKI_ADMIN_UI_URL = env("HAUKI_ADMIN_UI_URL")
HAUKI_EXPORTS_ENABLED = env("HAUKI_EXPORTS_ENABLED")
HAUKI_API_KEY = env("HAUKI_API_KEY")

# ----- 'Verkkokauppa' settings ------------------------------------------------------------------------

VERKKOKAUPPA_API_KEY = env("VERKKOKAUPPA_API_KEY")
VERKKOKAUPPA_PRODUCT_API_URL = env("VERKKOKAUPPA_PRODUCT_API_URL")
VERKKOKAUPPA_ORDER_API_URL = env("VERKKOKAUPPA_ORDER_API_URL")
VERKKOKAUPPA_PAYMENT_API_URL = env("VERKKOKAUPPA_PAYMENT_API_URL")
VERKKOKAUPPA_MERCHANT_API_URL = env("VERKKOKAUPPA_MERCHANT_API_URL")
VERKKOKAUPPA_NAMESPACE = env("VERKKOKAUPPA_NAMESPACE")
VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = env("VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES")
VERKKOKAUPPA_TIMEZONE = zoneinfo.ZoneInfo(env("VERKKOKAUPPA_TIMEZONE"))
VERKKOKAUPPA_NEW_LOGIN = env("VERKKOKAUPPA_NEW_LOGIN")
UPDATE_PRODUCT_MAPPING = env("UPDATE_PRODUCT_MAPPING")
UPDATE_ACCOUNTING = env("UPDATE_ACCOUNTING")

# ----- Graphene settings ------------------------------------------------------------------------------

GRAPHENE = {
    "SCHEMA": "api.graphql.schema.schema",
    "MIDDLEWARE": [
        "graphql_jwt.middleware.JSONWebTokenMiddleware",
        "tilavarauspalvelu.middleware.GraphQLSentryMiddleware",
    ],
    "TESTING_ENDPOINT": "/graphql/",
}

GRAPHQL_JWT = {"JWT_AUTH_HEADER_PREFIX": "Bearer"}

# ----- Django Rest Framework --------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "helusers.oidc.ApiTokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
}

# ----- Celery settings --------------------------------------------------------------------------------

CELERY_ENABLED = env("CELERY_ENABLED")
CELERY_LOG_LEVEL = env("CELERY_LOG_LEVEL")
CELERY_LOG_FILE = env("CELERY_LOG_FILE")
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

# Use redis as broker if redis url is set
elif env("REDIS_SENTINEL_SERVICE") and env("REDIS_MASTER") and env("REDIS_PASSWORD"):
    CELERY_BROKER_URL = f"sentinel://:{env('REDIS_PASSWORD')}@{env('REDIS_SENTINEL_SERVICE')}"
    CELERY_BROKER_TRANSPORT_OPTIONS = {
        "master_name": env("REDIS_MASTER").removeprefix("redis://"),
        "sentinel_kwargs": {
            "password": env("REDIS_PASSWORD"),
        },
    }

# ----- Redis settings ---------------------------------------------------------------------------------

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
elif env("REDIS_SENTINEL_SERVICE") and env("REDIS_MASTER") and env("REDIS_PASSWORD"):
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

# ----- Elasticsearch settings -------------------------------------------------------------------------

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

# ----- Misc -------------------------------------------------------------------------------------------

RESERVATION_UNIT_IMAGES_ROOT = "reservation_unit_images"
RESERVATION_UNIT_PURPOSE_IMAGES_ROOT = "reservation_unit_purpose_images"

ICAL_HASH_SECRET = env("ICAL_HASH_SECRET")

PRIMARY_MUNICIPALITY_NUMBER = env("PRIMARY_MUNICIPALITY_NUMBER")
PRIMARY_MUNICIPALITY_NAME = env("PRIMARY_MUNICIPALITY_NAME")
SECONDARY_MUNICIPALITY_NAME = env("SECONDARY_MUNICIPALITY_NAME")

TPREK_UNIT_URL = env("TPREK_UNIT_URL")

# ----- Local settings ---------------------------------------------------------------------------------

local_settings_path = BASE_DIR / "local_settings.py"
if local_settings_path.exists():
    with open(local_settings_path) as fp:
        code = compile(fp.read(), local_settings_path, "exec")
    exec(code, globals(), locals())  # nosec
