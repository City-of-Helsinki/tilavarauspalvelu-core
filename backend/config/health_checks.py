from __future__ import annotations

import dataclasses
import logging
from typing import TYPE_CHECKING

from django.conf import settings
from django_redis.pool import get_connection_factory
from health_check.base import HealthCheck
from health_check.contrib.celery import Ping
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
            msg = "Unable to connect to Redis: Connection was refused."
            raise ServiceUnavailable(msg) from error
        except exceptions.TimeoutError as error:
            msg = "Unable to connect to Redis: Timeout."
            raise ServiceUnavailable(msg) from error
        except exceptions.ConnectionError as error:
            msg = "Unable to connect to Redis: Connection Error"
            raise ServiceUnavailable(msg) from error
        else:
            logger.debug("Connection established. Redis sentinel is healthy.")


@dataclasses.dataclass
class CeleryHealthCheck(Ping):
    """Celery health check using a dedicated broker connection for queue inspection."""

    def check_active_queues(self, *active_workers: str) -> None:
        try:
            defined_queues = {queue.name for queue in self.app.conf.task_queues}
        except TypeError:
            defined_queues = {self.app.conf.task_default_queue}

        with self.app.connection_for_read() as conn:
            active_queues = {
                queue.get("name")
                for queues in self.app.control.inspect(active_workers, connection=conn).active_queues().values()
                for queue in queues
            }

        for queue in defined_queues - active_queues:
            msg = f"No worker for Celery task queue {queue}"
            raise ServiceUnavailable(msg)
