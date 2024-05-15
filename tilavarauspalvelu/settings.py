# ruff: noqa: N802
import os
import zoneinfo
from pathlib import Path

from django.utils.translation import gettext_lazy
from env_config import Environment, values
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

    WSGI_APPLICATION = "tilavarauspalvelu.wsgi.application"
    ROOT_URLCONF = "tilavarauspalvelu.urls"
    AUTH_USER_MODEL = "users.User"
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
        "admin_extra_buttons",
        "adminsortable2",
        "auditlog",
        "corsheaders",
        "django_celery_beat",
        "django_celery_results",
        "django_extensions",
        "django_filters",
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
        # Our apps
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

    MIDDLEWARE = [
        "tilavarauspalvelu.middleware.QueryLoggingMiddleware",
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
    ]

    # --- Versioning settings ----------------------------------------------------------------------------------------

    SOURCE_BRANCH_NAME: str = values.StringValue(default="")
    SOURCE_VERSION: str = values.StringValue(default="")

    @classmethod
    @property
    def APP_VERSION(cls) -> str:
        """Either the release tag or git short hash (or "local" if running locally)"""
        return cls.SOURCE_BRANCH_NAME.replace("main", "") or cls.SOURCE_VERSION[:8] or "local"

    # --- CORS and CSRF settings -------------------------------------------------------------------------------------

    CORS_ALLOWED_ORIGINS = values.ListValue()
    CSRF_TRUSTED_ORIGINS = values.ListValue()
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
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
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

    SEND_RESERVATION_NOTIFICATION_EMAILS = values.BooleanValue(default=False)
    EMAIL_HTML_MAX_FILE_SIZE = values.IntegerValue(default=150_000)
    EMAIL_HTML_TEMPLATES_ROOT = "email_html_templates"
    EMAIL_VARAAMO_EXT_LINK = values.StringValue(default=None)
    EMAIL_FEEDBACK_EXT_LINK = values.StringValue(default=None)

    # ----- Logging settings -----------------------------------------------------------------------------------------

    APP_LOGGING_LEVEL = values.StringValue(default="WARNING")

    @classmethod
    @property
    def LOGGING(cls):
        return {
            "version": 1,
            "disable_existing_loggers": False,
            "filters": {},
            "formatters": {
                "common": {
                    "()": "tilavarauspalvelu.logging.TVPFormatter",
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

    # --- Internationalization settings ------------------------------------------------------------------------------

    LANGUAGE_CODE = "fi"
    LANGUAGES = [
        ("fi", gettext_lazy("Finnish")),
        ("en", gettext_lazy("English")),
        ("sv", gettext_lazy("Swedish")),
    ]
    LOCALE_PATHS = [
        BASE_DIR / "locale",
    ]
    TIME_ZONE = "Europe/Helsinki"
    USE_I18N = True
    USE_TZ = True

    # --- Authentication settings ------------------------------------------------------------------------------------

    AUTHENTICATION_BACKENDS = [
        "tilavarauspalvelu.auth.ProxyTunnistamoOIDCAuthBackend",
        "tilavarauspalvelu.auth.ProxyModelBackend",
    ]

    AUTH_PASSWORD_VALIDATORS = [
        {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
        {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
        {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
        {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    ]

    LOGIN_REDIRECT_URL = "/admin/"
    LOGOUT_REDIRECT_URL = "/admin/"

    SESSION_SERIALIZER = "helusers.sessions.TunnistamoOIDCSerializer"
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"

    # --- Helsinki profile settings ----------------------------------------------------------------------------------

    OPEN_CITY_PROFILE_SCOPE = values.StringValue()
    OPEN_CITY_PROFILE_GRAPHQL_API = values.StringValue()
    PREFILL_RESERVATION_WITH_PROFILE_DATA = values.BooleanValue(default=False)
    HELSINKI_PROFILE_TOKEN_EXPIRATION_LEEWAY_SECONDS = values.IntegerValue(default=60)

    # Defaults when fetching profile data
    PRIMARY_MUNICIPALITY_NUMBER = values.StringValue(default="091")
    PRIMARY_MUNICIPALITY_NAME = values.StringValue(default="Helsinki")
    SECONDARY_MUNICIPALITY_NAME = values.StringValue(default="Other")

    # --- Tunnistamo / Social Auth settings --------------------------------------------------------------------------

    OIDC_LEEWAY = values.IntegerValue(default=3600)
    TUNNISTAMO_BASE_URL = values.StringValue()
    TUNNISTAMO_JWT_AUDIENCE = values.StringValue()
    TUNNISTAMO_JWT_ISSUER = values.StringValue()

    SOCIAL_AUTH_TUNNISTAMO_KEY = values.StringValue(env_name="TUNNISTAMO_ADMIN_KEY")
    SOCIAL_AUTH_TUNNISTAMO_SECRET = values.StringValue(env_name="TUNNISTAMO_ADMIN_SECRET")
    SOCIAL_AUTH_TUNNISTAMO_LOGIN_ERROR_URL = "/admin/"
    SOCIAL_AUTH_TUNNISTAMO_PIPELINE = (
        *SOCIAL_AUTH_PIPELINE,
        "users.helauth.pipeline.fetch_additional_info_for_user_from_helsinki_profile",
    )

    @classmethod
    @property
    def OIDC_AUTH(cls):
        # See 'oidc_auth/settings.py'
        return {
            "OIDC_LEEWAY": cls.OIDC_LEEWAY,
        }

    @classmethod
    @property
    def OIDC_API_TOKEN_AUTH(cls):
        # See 'helusers/settings.py'
        return {
            "AUDIENCE": cls.TUNNISTAMO_JWT_AUDIENCE,
            "ISSUER": cls.TUNNISTAMO_JWT_ISSUER,
        }

    @classmethod
    @property
    def SOCIAL_AUTH_TUNNISTAMO_OIDC_ENDPOINT(cls):
        return f"{cls.TUNNISTAMO_BASE_URL}/openid"

    @classmethod
    @property
    def SOCIAL_AUTH_TUNNISTAMO_SCOPE(cls):
        return [
            cls.OPEN_CITY_PROFILE_SCOPE,
        ]

    # --- GDPR settings ----------------------------------------------------------------------------------------------

    GDPR_API_MODEL = "users.ProfileUser"
    GDPR_API_QUERY_SCOPE = values.StringValue(default="")
    GDPR_API_DELETE_SCOPE = values.StringValue(default="")

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

    # --- Graphene settings ------------------------------------------------------------------------------------------

    GRAPHENE = {
        "SCHEMA": "api.graphql.schema.schema",
        "MIDDLEWARE": [
            "tilavarauspalvelu.middleware.GraphQLSentryMiddleware",
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

    CELERY_QUEUE_FOLDER_OUT = values.StringValue(default="/broker/processed/")
    CELERY_QUEUE_FOLDER_IN = values.StringValue(default="/broker/processed/")
    CELERY_PROCESSED_FOLDER = values.StringValue(default="/broker/processed/")

    @classmethod
    @property
    def CELERY_BROKER_URL(cls):
        return "filesystem://"

    @classmethod
    @property
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

    @classmethod
    @property
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

    # --- Elasticsearch settings -------------------------------------------------------------------------------------

    ELASTICSEARCH_URL = values.StringValue()

    @classmethod
    @property
    def SEARCH_SETTINGS(cls):
        return {
            "connections": {
                "default": cls.ELASTICSEARCH_URL,
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

    # --- Misc settings ----------------------------------------------------------------------------------------------

    RESERVATION_UNIT_IMAGES_ROOT = "reservation_unit_images"
    RESERVATION_UNIT_PURPOSE_IMAGES_ROOT = "reservation_unit_purpose_images"
    TPREK_UNIT_URL = values.URLValue()
    GRAPHQL_CODEGEN_ENABLED = False

    PRUNE_RESERVATIONS_OLDER_THAN_MINUTES = 20
    REMOVE_RESERVATION_STATS_OLDER_THAN_YEARS = 5
    REMOVE_RECURRING_RESERVATIONS_OLDER_THAN_DAYS = 1

    ICAL_HASH_SECRET = values.StringValue()


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
    ELASTICSEARCH_URL = ""

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

    TUNNISTAMO_BASE_URL = ""
    TUNNISTAMO_JWT_AUDIENCE = ""
    TUNNISTAMO_JWT_ISSUER = ""

    SOCIAL_AUTH_TUNNISTAMO_KEY = ""
    SOCIAL_AUTH_TUNNISTAMO_SECRET = ""  # nosec # NOSONAR

    OPEN_CITY_PROFILE_SCOPE = ""
    OPEN_CITY_PROFILE_GRAPHQL_API = ""

    TPREK_UNIT_URL = ""
    ICAL_HASH_SECRET = ""  # nosec # NOSONAR


class Local(LocalMixin, Common):
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

    # --- (H)Aukiolosovellus settings --------------------------------------------------------------------------------

    HAUKI_API_KEY = values.StringValue(default=None)

    # --- Graphene settings ------------------------------------------------------------------------------------------

    GRAPHENE = {
        "SCHEMA": Common.GRAPHENE["SCHEMA"],
        "MIDDLEWARE": [
            "graphene_django.debug.DjangoDebugMiddleware",
        ],
    }

    # --- Celery settings --------------------------------------------------------------------------------------------

    CELERY_LOG_FILE = values.StringValue(default="./broker/worker.log")
    CELERY_QUEUE_FOLDER_OUT = values.StringValue(default="./broker/processed/")
    CELERY_QUEUE_FOLDER_IN = values.StringValue(default="./broker/processed/")
    CELERY_PROCESSED_FOLDER = values.StringValue(default="./broker/processed/")

    # --- Redis settings ---------------------------------------------------------------------------------------------

    REDIS_URL = values.StringValue(default="redis://127.0.0.1:6379/0")

    # --- Elasticsearch settings -------------------------------------------------------------------------------------

    ELASTICSEARCH_URL = values.StringValue(default="http://localhost:9200")

    @classmethod
    @property
    def SEARCH_SETTINGS(cls):
        search_settings = super().SEARCH_SETTINGS
        search_settings["settings"]["mappings_dir"] = str(Common.BASE_DIR / "elastic_django")
        return search_settings

    # --- Misc settings-----------------------------------------------------------------------------------------------

    GRAPHQL_CODEGEN_ENABLED = values.BooleanValue(default=False)
    ICAL_HASH_SECRET = values.StringValue(default="")  # nosec # NOSONAR


class Docker(DockerMixin, Common):
    """Settings for local Docker development."""

    DEBUG = True
    SECRET_KEY = "secret"  # noqa: S105 # nosec # NOSONAR
    ALLOWED_HOSTS = ["*"]

    CORS_ALLOWED_ORIGINS = values.ListValue(default=[])
    CSRF_TRUSTED_ORIGINS = values.ListValue(default=[])

    STATIC_ROOT = "/srv/static"
    MEDIA_ROOT = "/media"

    DATABASES = values.ParentValue(
        values.DatabaseURLValue(),
        default="postgis://tvp:tvp@db/tvp",
        env_name="DATABASE_URL",
        check_limit=1,
    )

    REDIS_URL = values.ParentValue(default="redis://redis:6379/0", check_limit=1)
    ELASTICSEARCH_URL = values.ParentValue(default="http://elastic:9200", check_limit=1)

    @classmethod
    @property
    def CELERY_BROKER_URL(cls):
        return cls.REDIS_URL

    @classmethod
    @property
    def CELERY_BROKER_TRANSPORT_OPTIONS(cls):
        return {}

    HAUKI_API_KEY = values.StringValue(default=None)

    GRAPHQL_CODEGEN_ENABLED = values.BooleanValue(default=False)
    ICAL_HASH_SECRET = values.StringValue(default="")  # nosec # NOSONAR


class AutomatedTests(AutomatedTestMixin, EmptyDefaults, Common, dotenv_path=None):
    """Settings when running automated tests."""

    # --- Basic settings ---------------------------------------------------------------------------------------------

    DEBUG = False

    # --- Database settings ------------------------------------------------------------------------------------------

    DATABASES = values.ParentValue(
        values.DatabaseURLValue(),
        default="postgis://tvp:tvp@localhost:5432/tvp",
        env_name="DATABASE_URL",
        check_limit=1,
    )

    # --- Logging settings -------------------------------------------------------------------------------------------

    APP_LOGGING_LEVEL = values.ParentValue(default="INFO", check_limit=1)
    AUDIT_LOGGING_ENABLED = False

    # --- Email settings ---------------------------------------------------------------------------------------------

    EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

    SEND_RESERVATION_NOTIFICATION_EMAILS = False
    EMAIL_HTML_MAX_FILE_SIZE = 150_000
    EMAIL_VARAAMO_EXT_LINK = "https://fake.varaamo.hel.fi"
    EMAIL_FEEDBACK_EXT_LINK = "https://fake.varaamo.hel.fi/feedback"

    # --- Helsinki profile settings ----------------------------------------------------------------------------------

    OPEN_CITY_PROFILE_GRAPHQL_API = "https://fake.test.profile.api.com"
    OPEN_CITY_PROFILE_SCOPE = "https://fake.api.hel.fi/auth/helsinkiprofile"

    # --- Tunnistamo / Social Auth -----------------------------------------------------------------------------------

    TUNNISTAMO_BASE_URL = "https://fake.test.tunnistamo.com"
    SOCIAL_AUTH_TUNNISTAMO_SECRET = "SOCIAL_AUTH_TUNNISTAMO_SECRET"  # noqa: S105 # nosec # NOSONAR
    SOCIAL_AUTH_TUNNISTAMO_KEY = "SOCIAL_AUTH_TUNNISTAMO_KEY"
    TUNNISTAMO_JWT_AUDIENCE = "TUNNISTAMO_JWT_AUDIENCE"
    TUNNISTAMO_JWT_ISSUER = "TUNNISTAMO_JWT_ISSUER"

    # --- Celery settings --------------------------------------------------------------------------------------------

    CELERY_TASK_ALWAYS_EAGER = True

    # --- Graphene settings ------------------------------------------------------------------------------------------

    GRAPHENE = {
        "SCHEMA": Common.GRAPHENE["SCHEMA"],
        "TESTING_ENDPOINT": "/graphql/",
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

    REDIS_URL = values.ParentValue(default="redis://localhost:6379/0", check_limit=1)

    # --- Elasticsearch settings -------------------------------------------------------------------------------------

    ELASTICSEARCH_URL = values.ParentValue(default="http://localhost:9200", check_limit=1)

    @classmethod
    @property
    def SEARCH_SETTINGS(cls):
        search_settings = super().SEARCH_SETTINGS
        search_settings["settings"]["mappings_dir"] = str(Common.BASE_DIR / "elastic_django")
        search_settings["settings"]["auto_sync"] = False
        return search_settings

    # --- Misc settings ----------------------------------------------------------------------------------------------

    TPREK_UNIT_URL = "https://fake.test.tprek.com"
    ICAL_HASH_SECRET = "qhoew923uqqwee"  # nosec # NOSONAR


class Build(EmptyDefaults, Common, use_environ=True):
    """Settings when building the docker image."""

    DEBUG = True

    STATIC_ROOT = "/srv/static"
    MEDIA_ROOT = "/media"


class CI(EmptyDefaults, Common, use_environ=True):
    """Settings for commands in GitHub Actions and Azure Pipelines CI environment."""

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

    @classmethod
    @property
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

    @classmethod
    @property
    def CELERY_BROKER_URL(cls):
        return f"sentinel://:{cls.REDIS_PASSWORD}@{cls.REDIS_SENTINEL_SERVICE}"

    @classmethod
    @property
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
        from sentry_sdk.integrations.django import DjangoIntegration

        sentry_sdk.init(
            dsn=cls.SENTRY_DSN,
            environment=cls.SENTRY_ENVIRONMENT,
            release=cls.APP_VERSION,  # type: ignore
            integrations=[DjangoIntegration()],
        )


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
