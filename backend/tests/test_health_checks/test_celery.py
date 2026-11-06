from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from celery import Celery
from health_check.exceptions import ServiceUnavailable
from redis.exceptions import ConnectionError as RedisConnectionError

from config.health_checks import CeleryHealthCheck

# ── Celery health check ──


def test_celery_health_check_pings_with_a_fresh_connection() -> None:
    app = Celery("health-check-test")
    connection = MagicMock()
    connection.__enter__.return_value = connection
    read_connection = MagicMock()
    read_connection.__enter__.return_value = read_connection
    control = app.control

    with (
        patch.object(app, "connection_for_write", return_value=connection) as connection_for_write,
        patch.object(app, "connection_for_read", return_value=read_connection),
        patch.object(control, "ping", return_value=[{"celery@test": {"ok": "pong"}}]) as ping,
        patch.object(control, "inspect") as inspect,
    ):
        inspect.return_value.active_queues.return_value = {"celery@test": [{"name": "celery"}]}
        CeleryHealthCheck(app=app).run()

    connection_for_write.assert_called_once_with()
    ping.assert_called_once_with(timeout=1.0, limit=None, connection=connection)
    inspect.assert_called_once_with(("celery@test",), connection=read_connection)


def test_celery_health_check_maps_broker_connection_errors_to_service_unavailable() -> None:
    app = Celery("health-check-test")
    connection = MagicMock()
    connection.__enter__.return_value = connection
    connection.connection_errors = (RedisConnectionError,)
    control = app.control
    connection_error = RedisConnectionError("Connection closed by server")

    with (
        patch.object(app, "connection_for_write", return_value=connection),
        patch.object(control, "ping", side_effect=connection_error) as ping,
        pytest.raises(ServiceUnavailable) as error,
    ):
        CeleryHealthCheck(app=app).run()

    assert str(error.value) == "Unavailable: Unable to connect to the Celery broker."
    assert error.value.__cause__ is connection_error
    ping.assert_called_once_with(timeout=1.0, limit=None, connection=connection)
