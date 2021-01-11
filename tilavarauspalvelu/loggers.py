import os

from django.utils.log import DEFAULT_LOGGING

FORMATTERS = {
    "verbose": {
        "format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s"
    },
    "simple": {
        "format": "{levelname} {message}",
        "style": "{",
    },
}


LOGGING_CONSOLE = DEFAULT_LOGGING

LOGGING_ELASTIC = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": FORMATTERS,
    "handlers": {
        "elasticapm": {
            "level": "WARNING",
            "class": "elasticapm.contrib.django.handlers.LoggingHandler",
        },
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
            "level": os.getenv("DJANGO_LOG_LEVEL", "ERROR"),
            "handlers": ["elasticapm"],
            "propagate": True,
        },
        # Log errors from the Elastic APM module to the console
        "elasticapm.errors": {
            "level": "ERROR",
            "handlers": ["console"],
            "propagate": False,
        },
    },
}
