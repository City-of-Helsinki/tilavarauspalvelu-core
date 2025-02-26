# ruff: noqa: N802
from __future__ import annotations

import os
import zoneinfo
from pathlib import Path

from django.utils.translation import gettext_lazy as _
from env_config import Environment, values
from env_config.decorators import classproperty
from helusers.defaults import SOCIAL_AUTH_PIPELINE

try:
    from local_settings import AutomatedTestMixin
except ImportError:

    class AutomatedTestMixin: ...


try:
    from local_settings import DockerMixin
except ImportError:

    class DockerMixin: ...


try:
    from local_settings import LocalMixin
except ImportError:

    class LocalMixin: ...


class Common(Environment):
    """Common settings for all environments."""

    BASE_DIR = Path(__file__).resolve().parent.parent

    # --- Basic settings ---------------------------------------------------------------------------------------------

    WSGI_APPLICATION = "config.wsgi.application"
    ROOT_URLCONF = "config.urls"
    AUTH_USER_MODEL = "tilavarauspalvelu.User"
    DEFAULT_AUTO_FIELD = "django.db.models.AutoField"
    SECRET_KEY = values.StringValue()
    ALLOWED_HOSTS = values.ListValue()

    INSTALLED_APPS = [
        # Load order important
        "modeltranslation",
        "helusers.apps.HelusersConfig",
        "helusers.apps.HelusersAdminConfig",
        # Django builtins
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.messages",
        "django.contrib.postgres",
        "django.contrib.gis",
        #  Load order important
        "whitenoise.runserver_nostatic",
        "django.contrib.staticfiles",
        #  Third party apps
        "django_jinja",
        "admin_data_views",
        "admin_extra_buttons",
        "more_admin_filters",
        "adminsortable2",
        "auditlog",
        "corsheaders",
        "django_celery_beat",
        "django_celery_results",
        "django_extensions",
        "django_filters",
        "easy_thumbnails",
        "graphene_django",
        "import_export",
        "mptt",
        "rangefilter",
        "rest_framework",
        "social_django",
        "tinymce",
        "subforms",
        # Health check
        "health_check",
        "health_check.db",
        "health_check.cache",
        "health_check.contrib.celery",
        # Our app
        "tilavarauspalvelu",
    ]

    MIDDLEWARE = [
        "config.middleware.QueryLoggingMiddleware",
        "config.middleware.MultipleProxyMiddleware",
        "corsheaders.middleware.CorsMiddleware",
        "django.middleware.security.SecurityMiddleware",
        # Keep this after security middleware, correct place according to whitenoise documentation
        "whitenoise.middleware.WhiteNoiseMiddleware",
        "django.contrib.sessions.middleware.SessionMiddleware",
        # Must be after the session middleware, since it looks for a flag in the session
        "config.middleware.KeycloakRefreshTokenExpiredMiddleware",
        "django.middleware.common.CommonMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
        "django.middleware.clickjacking.XFrameOptionsMiddleware",
        "auditlog.middleware.AuditlogMiddleware",
        "social_django.middleware.SocialAuthExceptionMiddleware",
    ]

    # --- Versioning settings ----------------------------------------------------------------------------------------

    SOURCE_BRANCH_NAME: str = values.StringValue(default="")
    SOURCE_VERSION: str = values.StringValue(default="")

    @classproperty
    def APP_VERSION(cls) -> str:
        """Either the release tag or git short hash (or "local" if running locally)"""
        return cls.SOURCE_BRANCH_NAME.replace("main", "") or cls.SOURCE_VERSION[:8] or "local"

    # --- CORS and CSRF settings -------------------------------------------------------------------------------------

    CORS_ALLOWED_ORIGINS = values.ListValue()
    CSRF_TRUSTED_ORIGINS = values.ListValue()
    CORS_ALLOWED_ORIGIN_REGEXES = values.ListValue(default=[])
    CORS_ALLOW_CREDENTIALS = True

    # --- Proxy settings ---------------------------------------------------------------------------------------------

    USE_X_FORWARDED_HOST = values.BooleanValue(default=False, env_name="TRUST_X_FORWARDED_HOST")
    MULTI_PROXY_HEADERS = values.BooleanValue(default=False)
    SECURE_PROXY_SSL_HEADER = values.TupleValue(default=None)

    # --- Database settings ------------------------------------------------------------------------------------------

    DATABASES = values.DatabaseURLValue(conn_max_age=int(os.getenv("CONN_MAX_AGE", "0")))

    # --- Template settings ------------------------------------------------------------------------------------------

    TEMPLATES = [
        {
            "BACKEND": "django_jinja.jinja2.Jinja2",
            "DIRS": [BASE_DIR / "templates"],
            "APP_DIRS": True,
        },
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

    # --- Static file settings ---------------------------------------------------------------------------------------

    STATIC_ROOT = values.PathValue(default="staticroot")
    MEDIA_ROOT = values.PathValue(default="media")

    STATIC_URL = values.StringValue(default="/static/")
    MEDIA_URL = values.StringValue(default="/media/")

    STORAGES = {
        "default": {
            "BACKEND": "config.storage.FileSystemStorageASCII",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

    THUMBNAIL_DEFAULT_STORAGE_ALIAS = "default"
    THUMBNAIL_ALIASES = {
        "": {
            # Currently, all custom sized images are wanted to be cropped.
            "small": {"size": (250, 250), "crop": True},
            "medium": {"size": (384, 384), "crop": True},
            "large": {"size": (0, 728), "crop": False},
            "purpose_image": {"size": (390, 245), "crop": True},
        },
    }

    IMAGE_CACHE_ENABLED = values.BooleanValue(default=False)
    IMAGE_CACHE_VARNISH_HOST = values.StringValue(default="")
    IMAGE_CACHE_PURGE_KEY = values.StringValue(default="")
    IMAGE_CACHE_HOST_HEADER = values.StringValue(default="")

    # Do not try to chmod when uploading images.
    # Our environments use persistent storage for media and operation will not be permitted.
    # https://dev.azure.com/City-of-Helsinki/devops-guides/_git/devops-handbook?path=/storage.md&_a=preview&anchor=operation-not-permitted
    FILE_UPLOAD_PERMISSIONS = None

    # --- Email settings ---------------------------------------------------------------------------------------------

    EMAIL_HOST = values.StringValue(default=None)
    EMAIL_PORT = values.IntegerValue(default=25)
    EMAIL_USE_TLS = values.BooleanValue(default=True)
    EMAIL_MAX_RECIPIENTS = values.IntegerValue(default=100)
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    DEFAULT_FROM_EMAIL = values.StringValue(default="tilavarauspalvelu@localhost")

    SEND_EMAILS = values.BooleanValue(default=True)
    EMAIL_VARAAMO_EXT_LINK = values.StringValue()
    EMAIL_FEEDBACK_EXT_LINK = values.StringValue()

    # ----- Logging settings -----------------------------------------------------------------------------------------

    APP_LOGGING_LEVEL = values.StringValue(default="WARNING")

    @classproperty
    def LOGGING(cls):
        return {
            "version": 1,
            "disable_existing_loggers": False,
            "filters": {},
            "formatters": {
                "common": {
                    "()": "config.logging.TVPFormatter",
                    "format": (
                        "Time: {asctime} "
                        "| Level: {levelname} "
                        "| Location: {dotpath}.{funcName}:{lineno} "
                        "| Message: {message} "
                        # These will be filled if the request is added as an extra to the logging function:
                        # > logger.info("message", extra={"request": request})
                        # `django.utils.log.log_response` will add this automatically for failing requests.
                        "| URL: {url} "
                        "| Headers: {headers} "
                        "| User: {user_id}"
                    ),
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
                "level": cls.APP_LOGGING_LEVEL,
                "handlers": ["stdout"],
            },
        }

    AUDIT_LOGGING_ENABLED = values.BooleanValue(default=False)

    QUERY_LOGGING_ENABLED = values.BooleanValue(default=False)
    QUERY_LOGGING_SKIP_ROUTES = values.ListValue(default=[])
    QUERY_LOGGING_DURATION_MS_THRESHOLD = values.IntegerValue(default=5_000)
    QUERY_LOGGING_QUERY_COUNT_THRESHOLD = values.IntegerValue(default=100)
    QUERY_LOGGING_BODY_LENGTH_THRESHOLD = values.IntegerValue(default=50_000)

    # --- Internationalization settings ------------------------------------------------------------------------------

    LANGUAGE_CODE = "fi"
    LANGUAGES = [
        ("fi", _("Finnish")),
        ("en", _("English")),
        ("sv", _("Swedish")),
    ]
    LOCALE_PATHS = [
        BASE_DIR / "locale",
    ]
    TIME_ZONE = "Europe/Helsinki"
    USE_I18N = True
    USE_TZ = True

    # --- Authentication settings ------------------------------------------------------------------------------------

    AUTHENTICATION_BACKENDS = [
        "config.auth.ProxyTunnistamoOIDCAuthBackend",
        "config.auth.ProxyModelBackend",
    ]

    AUTH_PASSWORD_VALIDATORS = [
        {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
        {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
        {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
        {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    ]

    LOGIN_REDIRECT_URL = "/admin/"
    LOGOUT_REDIRECT_URL = "/admin/login/"

    SESSION_SERIALIZER = "helusers.sessions.TunnistamoOIDCSerializer"
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"

    # --- Helsinki profile settings ----------------------------------------------------------------------------------

    OPEN_CITY_PROFILE_SCOPE = values.StringValue()
    OPEN_CITY_PROFILE_GRAPHQL_API = values.StringValue()
    PREFILL_RESERVATION_WITH_PROFILE_DATA = values.BooleanValue(default=False)

    # Defaults when fetching profile data
    PRIMARY_MUNICIPALITY_NUMBER = values.StringValue(default="091")
    PRIMARY_MUNICIPALITY_NAME = values.StringValue(default="Helsinki")
    SECONDARY_MUNICIPALITY_NAME = values.StringValue(default="Other")

    # --- Tunnistamo / Social Auth settings --------------------------------------------------------------------------

    OIDC_LEEWAY = values.IntegerValue(default=3600)
    TUNNISTAMO_BASE_URL = values.StringValue()

    SOCIAL_AUTH_TUNNISTAMO_OIDC_ENDPOINT = values.StringValue(env_name="TUNNISTAMO_BASE_URL")
    SOCIAL_AUTH_TUNNISTAMO_KEY = values.StringValue(env_name="TUNNISTAMO_ADMIN_KEY")
    SOCIAL_AUTH_TUNNISTAMO_SECRET = values.StringValue(env_name="TUNNISTAMO_ADMIN_SECRET")
    SOCIAL_AUTH_TUNNISTAMO_SCOPE = values.ListValue(env_name="TUNNISTAMO_SCOPE", default=[])

    SOCIAL_AUTH_TUNNISTAMO_LOGIN_ERROR_URL = "/admin/"
    SOCIAL_AUTH_TUNNISTAMO_INACTIVE_USER_URL = values.StringValue(
        env_name="TUNNISTAMO_INACTIVE_USER_URL",
        default="/deactivated-account",
    )
    SOCIAL_AUTH_TUNNISTAMO_PIPELINE = (
        *SOCIAL_AUTH_PIPELINE,
        "tilavarauspalvelu.integrations.helauth.pipeline.fetch_additional_info_for_user_from_helsinki_profile",
        "tilavarauspalvelu.integrations.helauth.pipeline.migrate_user_from_tunnistamo_to_keycloak",
        "tilavarauspalvelu.integrations.helauth.pipeline.update_roles_from_ad_groups",
    )

    @classproperty
    def OIDC_AUTH(cls):
        # See 'oidc_auth/settings.py'
        return {
            "OIDC_LEEWAY": cls.OIDC_LEEWAY,
        }

    @classproperty
    def OIDC_API_TOKEN_AUTH(cls):
        # See 'helusers/settings.py'
        return {
            "API_AUTHORIZATION_FIELD": "authorization.permissions.scopes",
            "AUDIENCE": cls.GDPR_API_AUDIENCE,
            "ISSUER": cls.GDPR_API_ISSUER,
        }

    # --- GDPR settings ----------------------------------------------------------------------------------------------

    GDPR_API_MODEL = "tilavarauspalvelu.ProfileUser"
    GDPR_API_QUERY_SCOPE = values.StringValue(default="gdprquery")
    GDPR_API_DELETE_SCOPE = values.StringValue(default="gdprdelete")

    GDPR_API_AUDIENCE = values.StringValue(env_name="TUNNISTAMO_AUDIENCE")
    GDPR_API_ISSUER = values.StringValue(env_name="TUNNISTAMO_ISSUER")

    # --- (H)Aukiolosovellus settings --------------------------------------------------------------------------------

    HAUKI_API_URL = values.StringValue()
    HAUKI_ADMIN_UI_URL = values.StringValue()
    HAUKI_ORIGIN_ID = values.StringValue()
    HAUKI_ORGANISATION_ID = values.StringValue()
    HAUKI_EXPORTS_ENABLED = values.BooleanValue(default=False)
    HAUKI_SECRET = values.StringValue()
    HAUKI_API_KEY = values.StringValue()

    # --- Verkkokauppa settings --------------------------------------------------------------------------------------

    VERKKOKAUPPA_PRODUCT_API_URL = values.StringValue()
    VERKKOKAUPPA_ORDER_API_URL = values.StringValue()
    VERKKOKAUPPA_PAYMENT_API_URL = values.StringValue()
    VERKKOKAUPPA_MERCHANT_API_URL = values.StringValue()
    VERKKOKAUPPA_NAMESPACE = values.StringValue()
    VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = values.IntegerValue(default=10)
    VERKKOKAUPPA_NEW_LOGIN = values.BooleanValue(default=True)
    VERKKOKAUPPA_TIMEZONE = zoneinfo.ZoneInfo("Europe/Helsinki")
    VERKKOKAUPPA_API_KEY = values.StringValue()

    MOCK_VERKKOKAUPPA_API_ENABLED = values.BooleanValue(default=False)
    MOCK_VERKKOKAUPPA_FRONTEND_URL = values.StringValue(default="")
    MOCK_VERKKOKAUPPA_BACKEND_URL = values.StringValue(default="")
    UPDATE_PRODUCT_MAPPING = values.BooleanValue(default=False)
    UPDATE_ACCOUNTING = values.BooleanValue(default=False)

    # --- Pindora settings -------------------------------------------------------------------------------------------

    PINDORA_API_URL = values.StringValue()
    PINDORA_API_KEY = values.StringValue()

    # --- Graphene settings ------------------------------------------------------------------------------------------

    GRAPHENE = {
        "SCHEMA": "tilavarauspalvelu.api.graphql.schema.schema",
        "MIDDLEWARE": [
            "config.middleware.GraphQLSentryMiddleware",
        ],
    }

    # --- Django REST Framework settings -----------------------------------------------------------------------------

    REST_FRAMEWORK = {
        "DEFAULT_AUTHENTICATION_CLASSES": [
            "rest_framework.authentication.SessionAuthentication",
            "rest_framework.authentication.BasicAuthentication",
        ],
    }

    # --- Celery settings --------------------------------------------------------------------------------------------

    CELERY_ENABLED = values.BooleanValue(default=True)
    CELERY_LOG_LEVEL = values.StringValue(default="INFO")
    CELERY_LOG_FILE = values.StringValue(default="/broker/worker.log")
    CELERY_RESULT_BACKEND = "django-db"
    CELERY_CACHE_BACKEND = "django-cache"
    CELERY_TIMEZONE = "Europe/Helsinki"
    CELERY_TASK_TRACK_STARTED = False
    CELERY_TASK_TIME_LIMIT = values.IntegerValue(default=5 * 60)  # 5 minutes

    CELERY_QUEUE_FOLDER_OUT = values.StringValue(default="/broker/queue/")
    CELERY_QUEUE_FOLDER_IN = values.StringValue(default="/broker/queue/")
    CELERY_PROCESSED_FOLDER = values.StringValue(default="/broker/processed/")

    @classproperty
    def CELERY_BROKER_URL(cls) -> str:
        return "filesystem://"

    @classproperty
    def CELERY_BROKER_TRANSPORT_OPTIONS(cls):
        # Use filesystem as message broker
        return {
            "data_folder_out": cls.CELERY_QUEUE_FOLDER_OUT,
            "data_folder_in": cls.CELERY_QUEUE_FOLDER_IN,
            "processed_folder": cls.CELERY_PROCESSED_FOLDER,
            "store_processed": True,
        }

    # --- Redis settings ---------------------------------------------------------------------------------------------

    REDIS_URL = values.StringValue()

    @classproperty
    def CACHES(cls):
        return {
            "default": {
                "BACKEND": "django_redis.cache.RedisCache",
                "LOCATION": cls.REDIS_URL,
                "OPTIONS": {
                    "CLIENT_CLASS": "django_redis.client.DefaultClient",
                },
            }
        }

    # --- Admin data views ------------------------------------------------------------------------------------------

    ADMIN_DATA_VIEWS = {
        "URLS": [
            {
                "route": "text-searches/",
                "view": "tilavarauspalvelu.admin.text_search_view.text_search_list_view",
                "name": "text_searches",
            },
            {
                "route": "email-templates/",
                "view": "tilavarauspalvelu.admin.email_template.view.email_templates_admin_list_view",
                "name": "email_templates",
                "items": {
                    "route": "<str:email_type>/",
                    "view": "tilavarauspalvelu.admin.email_template.view.email_type_admin_view",
                    "name": "view_email_type",
                },
            },
            {
                "route": "email-tester/",
                "view": "tilavarauspalvelu.admin.email_template.tester.email_tester_admin_redirect_view",
                "name": "email_template_tester",
                "items": {
                    "route": "<str:email_type>/",
                    "view": "tilavarauspalvelu.admin.email_template.tester.email_tester_admin_view",
                    "name": "email_tester",
                },
            },
        ],
    }

    # --- Misc settings ----------------------------------------------------------------------------------------------

    RESERVATION_UNIT_IMAGES_ROOT = "reservation_unit_images"
    RESERVATION_UNIT_PURPOSE_IMAGES_ROOT = "reservation_unit_purpose_images"
    TPREK_UNIT_URL = values.URLValue()
    GRAPHQL_CODEGEN_ENABLED = False
    UPDATE_RESERVATION_UNIT_HIERARCHY = True
    UPDATE_SEARCH_VECTORS = True
    UPDATE_AFFECTING_TIME_SPANS = True
    SAVE_RESERVATION_STATISTICS = True
    REBUILD_SPACE_HIERARCHY = True
    SENTRY_LOGGER_ALWAYS_RE_RAISE = False
    UNSAFE_SKIP_IAT_CLAIM_VALIDATION = False
    UPDATE_RESERVATION_UNIT_THUMBNAILS = True
    DOWNLOAD_IMAGES_FOR_TEST_DATA = True
    FRONTEND_TESTING_API_ENABLED = False

    PRUNE_RESERVATIONS_OLDER_THAN_MINUTES = 20
    REMOVE_RESERVATION_STATS_OLDER_THAN_YEARS = 5
    REMOVE_RECURRING_RESERVATIONS_OLDER_THAN_DAYS = 1
    REMOVE_EXPIRED_APPLICATIONS_OLDER_THAN_DAYS = 365
    TEXT_SEARCH_CACHE_TIME_DAYS = 30
    USER_IS_ADULT_AT_AGE = 18
    MAXIMUM_SECTIONS_PER_APPLICATION = 100

    APPLICATION_ROUND_RESERVATION_CREATION_TIMEOUT_MINUTES = values.IntegerValue(default=10)
    AFFECTING_TIME_SPANS_UPDATE_INTERVAL_MINUTES = values.IntegerValue(default=2)
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS = values.IntegerValue(default=730)
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS = values.IntegerValue(default=14)
    PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS = values.IntegerValue(default=365)
    PERMISSION_NOTIFICATION_BEFORE_DAYS = values.IntegerValue(default=14)
    RAISE_ERROR_ON_REFRESH_FAILURE = False

    ICAL_HASH_SECRET = values.StringValue()
    EXPORT_AUTHORIZATION_TOKEN = values.StringValue()

    # Allows faking membership to certain AD groups for testing automatic role assignment
    FAKE_SUPERUSER_AD_GROUPS = values.ListValue(default=[])


class EmptyDefaults:
    """
    A mixin-class that gives 'empty' default values for all settings that would otherwise
    require an environment variable. This is used to populate settings with default values
    in environments that might not care about specific variables to do their job (e.g. Ci environment),
    but allows other environments to still require them (e.g. production environments).
    """

    # Don't set default for DEBUG, so that it's clear which environment is in debug mode and which isn't.
    SECRET_KEY = "secret"  # noqa: S105 # nosec # NOSONAR
    ALLOWED_HOSTS = ["*"]

    CORS_ALLOWED_ORIGINS = []
    CSRF_TRUSTED_ORIGINS = []

    DATABASES = {}
    REDIS_URL = ""

    STATIC_ROOT = Common.BASE_DIR / "staticroot"
    MEDIA_ROOT = Common.BASE_DIR / "media"

    HAUKI_API_URL = ""
    HAUKI_ADMIN_UI_URL = ""
    HAUKI_ORIGIN_ID = ""
    HAUKI_ORGANISATION_ID = ""
    HAUKI_SECRET = ""  # nosec # NOSONAR
    HAUKI_API_KEY = ""

    VERKKOKAUPPA_PRODUCT_API_URL = ""
    VERKKOKAUPPA_ORDER_API_URL = ""
    VERKKOKAUPPA_PAYMENT_API_URL = ""
    VERKKOKAUPPA_MERCHANT_API_URL = ""
    VERKKOKAUPPA_NAMESPACE = ""
    VERKKOKAUPPA_API_KEY = ""

    PINDORA_API_URL = ""
    PINDORA_API_KEY = ""

    TUNNISTAMO_BASE_URL = ""

    SOCIAL_AUTH_TUNNISTAMO_OIDC_ENDPOINT = ""
    SOCIAL_AUTH_TUNNISTAMO_KEY = ""
    SOCIAL_AUTH_TUNNISTAMO_SECRET = ""  # nosec # NOSONAR

    GDPR_API_AUDIENCE = ""
    GDPR_API_ISSUER = ""

    OPEN_CITY_PROFILE_SCOPE = ""
    OPEN_CITY_PROFILE_GRAPHQL_API = ""

    TPREK_UNIT_URL = ""
    ICAL_HASH_SECRET = ""  # nosec # NOSONAR
    EXPORT_AUTHORIZATION_TOKEN = ""

    EMAIL_VARAAMO_EXT_LINK = ""
    EMAIL_FEEDBACK_EXT_LINK = ""


class Local(Common, overrides_from=LocalMixin):
    """Settings for local development."""

    # --- Basic settings ---------------------------------------------------------------------------------------------

    DEBUG = True
    SECRET_KEY = "secret"  # noqa: S105 # nosec # NOSONAR
    ALLOWED_HOSTS = ["*"]

    INSTALLED_APPS = [
        *Common.INSTALLED_APPS,
        "debug_toolbar",
        "graphiql_debug_toolbar",
    ]

    MIDDLEWARE = [
        "graphiql_debug_toolbar.middleware.DebugToolbarMiddleware",
        *Common.MIDDLEWARE,
    ]

    # Hardcode to internal IPs as debug toolbar will expose internal information
    INTERNAL_IPS = ["127.0.0.1", "localhost"]

    # --- CORS and CSRF settings -------------------------------------------------------------------------------------

    CORS_ALLOWED_ORIGINS = values.ListValue(default=[])
    CSRF_TRUSTED_ORIGINS = values.ListValue(default=[])

    # --- Database settings ------------------------------------------------------------------------------------------

    DATABASES = values.DatabaseURLValue(default="postgis://tvp:tvp@127.0.0.1:5432/tvp")

    # --- Static file settings ---------------------------------------------------------------------------------------

    STATIC_ROOT = values.PathValue(default="staticroot", create_if_missing=True)
    MEDIA_ROOT = values.PathValue(default="media", create_if_missing=True)

    # --- Logging settings -------------------------------------------------------------------------------------------

    APP_LOGGING_LEVEL = values.StringValue(default="INFO")

    # --- Tunnistamo / Social Auth settings --------------------------------------------------------------------------

    SOCIAL_AUTH_TUNNISTAMO_INACTIVE_USER_URL = "http://localhost:3000/deactivated-account"

    # --- (H)Aukiolosovellus settings --------------------------------------------------------------------------------

    HAUKI_API_KEY = values.StringValue(default=None)

    # --- Verkkokauppa settings --------------------------------------------------------------------------------------

    VERKKOKAUPPA_PRODUCT_API_URL = values.StringValue(default="")
    VERKKOKAUPPA_ORDER_API_URL = values.StringValue(default="")
    VERKKOKAUPPA_PAYMENT_API_URL = values.StringValue(default="")
    VERKKOKAUPPA_MERCHANT_API_URL = values.StringValue(default="")
    VERKKOKAUPPA_NAMESPACE = values.StringValue(default="tilanvaraus_dev")
    VERKKOKAUPPA_API_KEY = values.StringValue(default="")

    MOCK_VERKKOKAUPPA_API_ENABLED = values.BooleanValue(default=True)
    MOCK_VERKKOKAUPPA_FRONTEND_URL = values.StringValue(default="http://localhost:3000")
    MOCK_VERKKOKAUPPA_BACKEND_URL = values.StringValue(default="http://localhost:8000")

    # --- Graphene settings ------------------------------------------------------------------------------------------

    GRAPHENE = {
        "SCHEMA": Common.GRAPHENE["SCHEMA"],
        "MIDDLEWARE": [
            "graphene_django.debug.DjangoDebugMiddleware",
            "config.middleware.GraphQLErrorLoggingMiddleware",
        ],
    }

    # --- Celery settings --------------------------------------------------------------------------------------------

    CELERY_LOG_FILE = values.StringValue(default="./broker/worker.log")
    CELERY_QUEUE_FOLDER_OUT = values.StringValue(default="./broker/queue/")
    CELERY_QUEUE_FOLDER_IN = values.StringValue(default="./broker/queue/")
    CELERY_PROCESSED_FOLDER = values.StringValue(default="./broker/processed/")

    # --- Redis settings ---------------------------------------------------------------------------------------------

    REDIS_URL = values.StringValue(default="redis://127.0.0.1:6379/0")

    # --- Misc settings-----------------------------------------------------------------------------------------------

    SENTRY_LOGGER_ALWAYS_RE_RAISE = True
    GRAPHQL_CODEGEN_ENABLED = values.BooleanValue(default=False)
    ICAL_HASH_SECRET = values.StringValue(default="")  # nosec # NOSONAR
    EXPORT_AUTHORIZATION_TOKEN = values.StringValue(default="")  # nosec # NOSONAR
    UPDATE_RESERVATION_UNIT_HIERARCHY = values.BooleanValue(default=True)
    UPDATE_SEARCH_VECTORS = values.BooleanValue(default=True)
    UPDATE_AFFECTING_TIME_SPANS = values.BooleanValue(default=True)
    SAVE_RESERVATION_STATISTICS = values.BooleanValue(default=True)
    REBUILD_SPACE_HIERARCHY = values.BooleanValue(default=True)
    RAISE_ERROR_ON_REFRESH_FAILURE = True
    FRONTEND_TESTING_API_ENABLED = values.BooleanValue(default=True)

    EMAIL_VARAAMO_EXT_LINK = "https://fake.local.varaamo.hel.fi"
    EMAIL_FEEDBACK_EXT_LINK = "https://fake.local.varaamo.hel.fi/feedback"

    @classmethod
    def post_setup(cls) -> None:
        # Validate Verkkokauppa settings
        if cls.MOCK_VERKKOKAUPPA_API_ENABLED:
            assert cls.MOCK_VERKKOKAUPPA_FRONTEND_URL, "Mock Verkkokauppa frontend URL is required"
            assert cls.MOCK_VERKKOKAUPPA_BACKEND_URL, "Mock Verkkokauppa backend URL is required"
        else:
            assert cls.VERKKOKAUPPA_PRODUCT_API_URL, "Verkkokauppa product API URL is required"
            assert cls.VERKKOKAUPPA_ORDER_API_URL, "Verkkokauppa order API URL is required"
            assert cls.VERKKOKAUPPA_PAYMENT_API_URL, "Verkkokauppa payment API URL is required"
            assert cls.VERKKOKAUPPA_MERCHANT_API_URL, "Verkkokauppa merchant API URL is required"
            assert cls.VERKKOKAUPPA_NAMESPACE, "Verkkokauppa namespace is required"
            assert cls.VERKKOKAUPPA_API_KEY, "Verkkokauppa API key is required"


class Docker(Common, overrides_from=DockerMixin):
    """Settings for local Docker development."""

    DEBUG = True
    SECRET_KEY = "secret"  # noqa: S105 # nosec # NOSONAR
    ALLOWED_HOSTS = ["*"]

    CORS_ALLOWED_ORIGINS = values.ListValue(default=[])
    CSRF_TRUSTED_ORIGINS = values.ListValue(default=[])

    STATIC_ROOT = "/srv/static"
    MEDIA_ROOT = "/media"

    DATABASES = values.DatabaseURLValue(default="postgis://tvp:tvp@db/tvp")

    SOCIAL_AUTH_TUNNISTAMO_INACTIVE_USER_URL = "http://localhost:3000/deactivated-account"

    REDIS_URL = values.StringValue(default="redis://redis:6379/0")

    @classproperty
    def CELERY_BROKER_URL(cls):
        return cls.REDIS_URL

    @classproperty
    def CELERY_BROKER_TRANSPORT_OPTIONS(cls):
        return {}

    HAUKI_API_KEY = values.StringValue(default=None)

    GRAPHQL_CODEGEN_ENABLED = values.BooleanValue(default=False)
    ICAL_HASH_SECRET = values.StringValue(default="")  # nosec # NOSONAR
    EXPORT_AUTHORIZATION_TOKEN = values.StringValue(default="")  # nosec # NOSONAR
    RAISE_ERROR_ON_REFRESH_FAILURE = True
    FRONTEND_TESTING_API_ENABLED = values.BooleanValue(default=True)

    EMAIL_VARAAMO_EXT_LINK = "https://fake.local.varaamo.hel.fi"
    EMAIL_FEEDBACK_EXT_LINK = "https://fake.local.varaamo.hel.fi/feedback"


class AutomatedTests(EmptyDefaults, Common, dotenv_path=None, overrides_from=AutomatedTestMixin):
    """Settings when running automated tests."""

    # --- Basic settings ---------------------------------------------------------------------------------------------

    DEBUG = False

    # --- Database settings ------------------------------------------------------------------------------------------

    DATABASES = values.DatabaseURLValue(default="postgis://tvp:tvp@localhost:5432/tvp")

    # --- Logging settings -------------------------------------------------------------------------------------------

    APP_LOGGING_LEVEL = values.StringValue(default="INFO")
    AUDIT_LOGGING_ENABLED = False

    # --- Email settings ---------------------------------------------------------------------------------------------

    EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

    SEND_EMAILS = False

    # --- Helsinki profile settings ----------------------------------------------------------------------------------

    OPEN_CITY_PROFILE_GRAPHQL_API = "https://fake.test.profile.api.com"
    OPEN_CITY_PROFILE_SCOPE = "https://fake.api.hel.fi/auth/helsinkiprofile"

    # --- Tunnistamo / Social Auth -----------------------------------------------------------------------------------

    TUNNISTAMO_BASE_URL = "https://fake.test.tunnistamo.com"
    SOCIAL_AUTH_TUNNISTAMO_SECRET = "SOCIAL_AUTH_TUNNISTAMO_SECRET"  # noqa: S105 # nosec # NOSONAR
    SOCIAL_AUTH_TUNNISTAMO_KEY = "SOCIAL_AUTH_TUNNISTAMO_KEY"

    # --- GDPR settings ----------------------------------------------------------------------------------------------

    GDPR_API_AUDIENCE = "TUNNISTAMO_AUDIENCE"
    GDPR_API_ISSUER = "TUNNISTAMO_ISSUER"

    # --- Celery settings --------------------------------------------------------------------------------------------

    CELERY_TASK_ALWAYS_EAGER = True

    # --- Graphene settings ------------------------------------------------------------------------------------------

    GRAPHENE = {
        "SCHEMA": Common.GRAPHENE["SCHEMA"],
        "TESTING_ENDPOINT": "/graphql/",
        "MIDDLEWARE": [
            "config.middleware.GraphQLErrorLoggingMiddleware",
        ],
    }

    # --- Static file settings ---------------------------------------------------------------------------------------

    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.memory.InMemoryStorage",
        },
        "staticfiles": {
            "BACKEND": "django.core.files.storage.memory.InMemoryStorage",
        },
    }

    IMAGE_CACHE_ENABLED = False
    IMAGE_CACHE_VARNISH_HOST = "https://fake.test.url"
    IMAGE_CACHE_PURGE_KEY = "test-purge-key"
    IMAGE_CACHE_HOST_HEADER = "test.tilavaraus.url"

    # --- Internationalization settings ------------------------------------------------------------------------------

    LOCALE_PATHS = []  # Translations are not needed in tests
    USE_I18N = False  # In fact, turn off whole translation system
    MODELTRANSLATION_ENABLE_REGISTRATIONS = True  # Modeltranslation should still be enabled

    # --- (H)Aukiolosovellus settings --------------------------------------------------------------------------------

    HAUKI_API_URL = "https://fake.test.hauki.api.com"
    HAUKI_ADMIN_UI_URL = "https://fake.test.hauki.admin.com"
    HAUKI_EXPORTS_ENABLED = False
    HAUKI_ORIGIN_ID = "test-origin"
    HAUKI_ORGANISATION_ID = "test-org:965b1630-6e5a-41f9-ab19-217d90e9729b"
    HAUKI_SECRET = "HAUKI_SECRET"  # noqa: S105 # nosec # NOSONAR
    HAUKI_API_KEY = "HAUKI_API_KEY"

    # --- Pindora settings -------------------------------------------------------------------------------------------

    PINDORA_API_URL = "https://fake.test.pindora.api.com"
    PINDORA_API_KEY = "PINDORA_API_KEY"

    # --- Verkkokauppa settings --------------------------------------------------------------------------------------

    VERKKOKAUPPA_API_KEY = "test-api-key"
    VERKKOKAUPPA_NAMESPACE = "tilanvaraus"
    VERKKOKAUPPA_MERCHANT_API_URL = "https://fake.test-merchant:1234"
    VERKKOKAUPPA_ORDER_API_URL = "https://fake.test-order:1234"
    VERKKOKAUPPA_PAYMENT_API_URL = "https://fake.test-payment:1234"
    VERKKOKAUPPA_PRODUCT_API_URL = "https://fake.test-product:1234"
    VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5
    UPDATE_PRODUCT_MAPPING = False
    UPDATE_ACCOUNTING = False

    MOCK_VERKKOKAUPPA_API_ENABLED = False
    MOCK_VERKKOKAUPPA_FRONTEND_URL = "https://mock-verkkokauppa.com"
    MOCK_VERKKOKAUPPA_BACKEND_URL = "https://mock-verkkokauppa.com"

    # --- Redis settings ---------------------------------------------------------------------------------------------

    REDIS_URL = values.StringValue(default="redis://localhost:6379/0")

    # --- Misc settings ----------------------------------------------------------------------------------------------

    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }

    TPREK_UNIT_URL = "https://fake.test.tprek.com"
    ICAL_HASH_SECRET = "qhoew923uqqwee"  # noqa: S105 # nosec # NOSONAR
    EXPORT_AUTHORIZATION_TOKEN = "CASO8I4V4ITNKCKTM48ZZNK8RT"  # noqa: S105 # nosec # NOSONAR

    # Turn off materialized view updates from signals during tests,
    # since they slow them down a lot in CI. Refresh should be called manually when needed.
    UPDATE_RESERVATION_UNIT_HIERARCHY = False
    UPDATE_AFFECTING_TIME_SPANS = False
    # Turn off search vector updates from signals during tests.
    UPDATE_SEARCH_VECTORS = False
    # Turn off reservation unit thumbnail updates from signals during tests.
    UPDATE_RESERVATION_UNIT_THUMBNAILS = False
    # Turn off image downloads during tests.
    DOWNLOAD_IMAGES_FOR_TEST_DATA = False
    # Turn off statistics saving during tests for performance reasons
    SAVE_RESERVATION_STATISTICS = False
    # Always re-raise silenced Sentry errors during testing for better debugging
    SENTRY_LOGGER_ALWAYS_RE_RAISE = True
    # Enable frontend testing API for testing
    FRONTEND_TESTING_API_ENABLED = True

    EMAIL_VARAAMO_EXT_LINK = "https://fake.varaamo.hel.fi"
    EMAIL_FEEDBACK_EXT_LINK = "https://fake.varaamo.hel.fi/feedback"


class Build(EmptyDefaults, Common, use_environ=True):
    """Settings when building the docker image."""

    DEBUG = True

    STATIC_ROOT = "/srv/static"
    MEDIA_ROOT = "/media"


class CI(EmptyDefaults, Common, use_environ=True):
    """Settings for commands in GitHub Actions."""

    DEBUG = False

    # Migrations require the database
    DATABASES = values.DatabaseURLValue()


class Platta(Common, use_environ=True):
    """Common settings for platta environments. Not to be used directly."""

    # --- Email settings ---------------------------------------------------------------------------------------------

    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

    # --- Sentry -----------------------------------------------------------------------------------------------------

    SENTRY_DSN: str = values.StringValue()
    SENTRY_ENVIRONMENT: str = values.StringValue()

    # --- Redis settings ---------------------------------------------------------------------------------------------

    REDIS_URL = ""  # Not used in Platta environments
    REDIS_SENTINEL_SERVICE: str = values.StringValue()
    REDIS_MASTER: str = values.StringValue()
    REDIS_PASSWORD: str = values.StringValue()

    DJANGO_REDIS_CONNECTION_FACTORY = "django_redis.pool.SentinelConnectionFactory"

    # --- Misc settings ----------------------------------------------------------------------------------------------

    @classproperty
    def CACHES(cls):
        sentinel_host, sentinel_port = cls.REDIS_SENTINEL_SERVICE.split(":")
        return {
            "default": {
                "BACKEND": "django_redis.cache.RedisCache",
                "LOCATION": cls.REDIS_MASTER,
                "OPTIONS": {
                    "CLIENT_CLASS": "django_redis.client.SentinelClient",
                    "SENTINELS": [(sentinel_host, sentinel_port)],
                    "SENTINEL_KWARGS": {"password": cls.REDIS_PASSWORD},
                    "PASSWORD": cls.REDIS_PASSWORD,
                },
            }
        }

    # --- Celery settings --------------------------------------------------------------------------------------------

    @classproperty
    def CELERY_BROKER_URL(cls) -> str:
        return f"sentinel://:{cls.REDIS_PASSWORD}@{cls.REDIS_SENTINEL_SERVICE}"

    @classproperty
    def CELERY_BROKER_TRANSPORT_OPTIONS(cls):
        # Use redis as message broker
        return {
            "master_name": cls.REDIS_MASTER.removeprefix("redis://"),
            "sentinel_kwargs": {
                "password": cls.REDIS_PASSWORD,
            },
        }

    # ----------------------------------------------------------------------------------------------------------------

    @classmethod
    def post_setup(cls) -> None:
        import sentry_sdk
        from health_check.plugins import plugin_dir
        from sentry_sdk.integrations.django import DjangoIntegration

        from .health_checks import RedisSentinelHealthCheck

        sentry_sdk.init(
            dsn=cls.SENTRY_DSN,
            environment=cls.SENTRY_ENVIRONMENT,
            release=cls.APP_VERSION,  # type: ignore
            integrations=[DjangoIntegration()],
        )

        plugin_dir.register(RedisSentinelHealthCheck)


class MidHook(EmptyDefaults, Platta, use_environ=True):
    """
    Settings for the mid lifecycle hook which runs migrations on when pods are created.
    See: https://docs.openshift.com/container-platform/latest/applications/deployments/deployment-strategies.html

    Similar to the 'CI' environment, but includes setup for Redis and Sentry as well.
    """

    DEBUG = True

    # Migrations require the database
    DATABASES = values.DatabaseURLValue()


class Development(Platta, use_environ=True):
    """Settings for the Development environment on Platta."""

    DEBUG = True


class Testing(Platta, use_environ=True):
    """Settings for the Testing environment on Platta."""

    DEBUG = True


class Staging(Platta, use_environ=True):
    """Settings for the Staging environment on Platta."""

    DEBUG = False


class Production(Platta, use_environ=True):
    """Settings for the Production environment on Platta."""

    DEBUG = False
