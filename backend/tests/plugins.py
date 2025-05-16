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
    mocked_freeze_factory = patch("freezegun.api._freeze_time", MockFreezeTime)
    mocked_freeze_factory.start()
    return mocked_freeze_factory


@pytest.hookimpl()
def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption(
        "--skip-slow",
        action="store_true",
        default=False,
        help="Skip slow running tests.",
    )

    parser.addoption(
        "--only-frontend-query-tests",
        action="store_true",
        default=False,
        help="Only run frontend query tests.",
    )
    parser.addoption(
        "--with-frontend-query-tests",
        action="store_true",
        default=False,
        help="Also run frontend query tests.",
    )


@pytest.hookimpl()
def pytest_collection_modifyitems(config, items):
    skip_slow = config.getoption("--skip-slow")
    only_frontend_query_tests = config.getoption("--only-frontend-query-tests")
    with_frontend_query_tests = config.getoption("--with-frontend-query-tests")

    if only_frontend_query_tests and with_frontend_query_tests:
        msg = "Cannot use '--only-frontend-query-tests' and '--with-frontend-query-tests' together"
        raise ValueError(msg)

    for item in items:
        is_slow_test = "slow" in item.keywords

        if skip_slow and is_slow_test:
            msg = "Skipped due to '--skip-slow' option"
            item.add_marker(pytest.mark.skip(reason=msg))
            continue

        if with_frontend_query_tests:
            continue

        is_frontend_query_test = "frontend_query" in item.keywords

        if is_frontend_query_test and not only_frontend_query_tests:
            msg = "Frontend query test skipped due to '--only-frontend-query-tests' option not set"
            item.add_marker(pytest.mark.skip(reason=msg))

        if not is_frontend_query_test and only_frontend_query_tests:
            msg = "Non frontend query test skipped due to '--only-frontend-query-tests option' option"
            item.add_marker(pytest.mark.skip(reason=msg))
