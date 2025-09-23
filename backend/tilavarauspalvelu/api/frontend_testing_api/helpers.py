from __future__ import annotations

from contextlib import contextmanager
from typing import TYPE_CHECKING

from freezegun import freeze_time

from tests.plugins import setup_now_tt

if TYPE_CHECKING:
    import datetime


freeze_factory = None
now_tt_freeze_factory = None


def set_current_datetime(value: datetime.datetime) -> None:
    """
    Freeze the current time to the given value.
    The time will be frozen until `stop_time_freeze` is called.
    """
    global freeze_factory  # noqa: PLW0603
    global now_tt_freeze_factory  # noqa: PLW0603

    if freeze_factory:
        stop_time_freeze()

    # Small memory leak here, since used for testing should be fine
    freeze_factory = freeze_time(value)
    freeze_factory.start()
    now_tt_freeze_factory = setup_now_tt()


def stop_time_freeze() -> None:
    """Stop the time freeze if it is currently active."""
    global freeze_factory  # noqa: PLW0603
    global now_tt_freeze_factory  # noqa: PLW0602

    if freeze_factory:
        freeze_factory.stop()
        now_tt_freeze_factory.stop()
        freeze_factory = None


@contextmanager
def unfreeze_at_end() -> None:
    """
    Temporarily unfreeze the time for the duration of the context.

    This should be used for all tests that call `set_current_datetime`, so the time is not frozen for all later tests.
    """
    try:
        yield
    finally:
        stop_time_freeze()
