from __future__ import annotations

import dataclasses
import logging
from typing import TYPE_CHECKING

from django.conf import settings
from django_redis.pool import get_connection_factory
from health_check.base import HealthCheck
from health_check.exceptions import ServiceUnavailable
from redis import exceptions

if TYPE_CHECKING:
    from django_redis.pool import SentinelConnectionFactory

logger = logging.getLogger(__name__)


# Adapted from `health_check.contrib.redis.backends.RedisHealthCheck`
@dataclasses.dataclass
class RedisSentinelHealthCheck(HealthCheck):
    """Health check for Redis using a sentinel."""

    def run(self) -> None:
        """Check the connection to Redis using a sentinel."""
        logger.debug("Creating connection factory for Redis sentinel...")

        url = settings.CACHES["default"]["LOCATION"]
        options = settings.CACHES["default"]["OPTIONS"]
        connection_factory: SentinelConnectionFactory = get_connection_factory(options=options)

        logger.debug("Attempting to connect to redis...")

        try:
            # conn is used as a context to release opened resources later
            with connection_factory.connect(url=url) as conn:
                conn.ping()  # exceptions may be raised upon ping
        except ConnectionRefusedError as error:
            raise ServiceUnavailable("Unable to connect to Redis: Connection was refused.") from error
        except exceptions.TimeoutError as error:
            raise ServiceUnavailable("Unable to connect to Redis: Timeout.") from error
        except exceptions.ConnectionError as error:
            raise ServiceUnavailable("Unable to connect to Redis: Connection Error") from error
        else:
            logger.debug("Connection established. Redis sentinel is healthy.")
