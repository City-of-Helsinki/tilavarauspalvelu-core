from __future__ import annotations

import contextlib
import datetime
from typing import Any
from unittest.mock import patch

import pytest


@pytest.hookimpl(tryfirst=True)
def pytest_load_initial_conftests(early_config: pytest.Config, parser: pytest.Parser, args: list[str]) -> None:
    setup_now_tt()


def setup_now_tt():
    """
    Setup NowTT for tests so that when freezegun is used,
    it will also setup the offset in the database for NowTT.
    """
    from freezegun.api import _freeze_time  # noqa: PLC2701

    freezes: dict[int, int] = {}

    class MockFreezeTime(_freeze_time):
        def start(self) -> Any:
            """Called when 'freeze_time' is started."""
            from utils.db import NowTT

            # Calculate offset for time travel.
            delta = self.time_to_freeze - datetime.datetime.now()
            offset = int(delta.total_seconds())

            # Set offset for to database, but ignore errors if test doesn't have database access.
            with contextlib.suppress(RuntimeError):
                NowTT.set_offset(seconds=offset)

            # Save offset in case we make multiple calls to 'freeze_time'.
            freezes[id(self)] = offset

            return super().start()

        def stop(self) -> None:
            """Called when 'freeze_time' is stopped."""
            from utils.db import NowTT

            # Remove the saved offset.
            del freezes[id(self)]

            # If there are no more freezes, reset the offset to 0.
            # Otherwise, use the last set offset.
            if freezes:
                key, value = freezes.popitem()
                freezes[key] = value
            else:
                value = 0

            # Set offset for to database, but ignore errors if test doesn't have database access.
            with contextlib.suppress(RuntimeError):
                NowTT.set_offset(seconds=value)

            return super().stop()

    # Just apply the patch for the whole duration of the test run.
    patch("freezegun.api._freeze_time", MockFreezeTime).start()


@pytest.hookimpl()
def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption("--skip-slow", action="store_true", default=False, help="Skip slow running tests.")


@pytest.hookimpl()
def pytest_collection_modifyitems(config, items):
    skip_slow = config.getoption("--skip-slow")

    for item in items:
        if skip_slow and "slow" in item.keywords:
            item.add_marker(pytest.mark.skip(reason="Skipped due to --skip-slow option"))
