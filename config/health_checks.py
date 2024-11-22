import logging
from typing import TYPE_CHECKING

from django.conf import settings
from django_redis.pool import get_connection_factory
from health_check.backends import BaseHealthCheckBackend
from health_check.exceptions import ServiceUnavailable
from redis import exceptions

if TYPE_CHECKING:
    from django_redis.pool import SentinelConnectionFactory

logger = logging.getLogger(__name__)


# Adapted from `health_check.contrib.redis.backends.RedisHealthCheck`
class RedisSentinelHealthCheck(BaseHealthCheckBackend):
    """Health check for Redis using a sentinel."""

    def check_status(self) -> None:
        """Check the connectio to Redis using a sentinel."""
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
            self.add_error(ServiceUnavailable("Unable to connect to Redis: Connection was refused."), error)
        except exceptions.TimeoutError as error:
            self.add_error(ServiceUnavailable("Unable to connect to Redis: Timeout."), error)
        except exceptions.ConnectionError as error:
            self.add_error(ServiceUnavailable("Unable to connect to Redis: Connection Error"), error)
        except BaseException as error:
            self.add_error(ServiceUnavailable("Unknown error"), error)
        else:
            logger.debug("Connection established. Redis sentinel is healthy.")
