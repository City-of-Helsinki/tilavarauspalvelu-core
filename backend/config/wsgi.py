from __future__ import annotations

import locale
import logging
import os

from django.core.wsgi import get_wsgi_application

logger = logging.getLogger(__name__)

# Setup locale is not set in the environment.
lang_code, encoding = locale.getlocale()
if lang_code is None:
    logger.info("Locale not set up. Defaulting to 'C.UTF-8'.")
    locale.setlocale(locale.LC_ALL, "")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()
