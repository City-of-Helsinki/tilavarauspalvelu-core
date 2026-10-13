from __future__ import annotations

import contextlib
import datetime
import hashlib
from pathlib import Path
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

            # Calculate offset for time travel. Freezegun stores 'time_to_freeze' as naive UTC.
            time_to_freeze = self.time_to_freeze.replace(tzinfo=datetime.UTC)
            delta = time_to_freeze - datetime.datetime.now(tz=datetime.UTC)
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


@pytest.hookimpl()
def pytest_configure(config: pytest.Config) -> None:
    recreate_stale_test_database(config)


@pytest.hookimpl()
def pytest_report_header(config: pytest.Config) -> list[str]:
    if not config.stash.get(stale_worker_databases_key, False):
        return []
    return ["Test databases can be stale. Recreating them with migrations."]


@pytest.hookimpl()
def pytest_fixture_post_finalizer(fixturedef: pytest.FixtureDef, request: pytest.FixtureRequest) -> None:
    if fixturedef.argname != "django_db_setup" or fixturedef.cached_result is None:
        return

    # The third item is the exception info, which is None if the setup succeeded.
    exception_info = fixturedef.cached_result[2]
    request.config.stash[database_was_set_up_key] = exception_info is None


@pytest.hookimpl()
def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    save_test_database_schema_hash(session.config, exitstatus=exitstatus)


def recreate_stale_test_database(config: pytest.Config) -> None:
    """
    Recreate a reused test database with migrations if the model or migration files
    have changed since it was last created, e.g., after switching branches.
    """
    if not config.option.reuse_db or config.cache is None:
        return

    if config.option.create_db:
        # A database recreated with '--nomigrations' must not keep the hash of the old migrated database.
        # A new hash is saved only after a successful setup with migrations.
        cache_key = get_schema_hash_cache_key(config)
        if cache_key is not None:
            config.cache.set(cache_key, None)
        return

    schema_hash = get_schema_hash()
    config.stash[schema_hash_key] = schema_hash

    cache_key = get_schema_hash_cache_key(config)
    if cache_key is None:
        # The xdist controller has no database, but it reports whether any worker database is stale.
        number_of_workers = config.getoption("numprocesses")
        if isinstance(number_of_workers, int):
            for worker_number in range(number_of_workers):
                saved_hash = config.cache.get(f"{SCHEMA_HASH_CACHE_KEY}/gw{worker_number}", None)
                if saved_hash != schema_hash:
                    config.stash[stale_worker_databases_key] = True
                    break
        return

    saved_hash = config.cache.get(cache_key, None)
    if saved_hash == schema_hash:
        return

    config.option.create_db = True
    config.option.nomigrations = False
    config.stash[stale_worker_databases_key] = True


def save_test_database_schema_hash(config: pytest.Config, *, exitstatus: int) -> None:
    if config.cache is None:
        return

    cache_key = get_schema_hash_cache_key(config)
    if cache_key is None:
        return

    created_with_migrations = config.option.reuse_db and config.option.create_db and not config.option.nomigrations
    database_was_set_up = config.stash.get(database_was_set_up_key, False)
    tests_ran = exitstatus in {pytest.ExitCode.OK, pytest.ExitCode.TESTS_FAILED}
    if not created_with_migrations or not database_was_set_up or not tests_ran:
        return

    schema_hash = config.stash.get(schema_hash_key, None)
    if schema_hash is None:
        schema_hash = get_schema_hash()

    config.cache.set(cache_key, schema_hash)


# Internals

SCHEMA_HASH_CACHE_KEY = "tilavarauspalvelu/test_database_schema_hash"
BACKEND_ROOT = Path(__file__).parent.parent

schema_hash_key = pytest.StashKey[str]()
stale_worker_databases_key = pytest.StashKey[bool]()
database_was_set_up_key = pytest.StashKey[bool]()


def get_schema_hash_cache_key(config: pytest.Config) -> str | None:
    """
    Get the cache key for the test database of this process.
    Each xdist worker has its own test database, and a run without xdist uses another one.
    Returns None for the xdist controller, since it has no database.
    """
    if hasattr(config, "workerinput"):
        worker_id = config.workerinput["workerid"]
        return f"{SCHEMA_HASH_CACHE_KEY}/{worker_id}"

    number_of_workers = config.getoption("numprocesses", default=None)
    if number_of_workers:
        return None

    return f"{SCHEMA_HASH_CACHE_KEY}/main"


def get_schema_hash() -> str:
    digest = hashlib.sha1(usedforsecurity=False)

    for path in sorted(BACKEND_ROOT.rglob("*.py")):
        relative_path = path.relative_to(BACKEND_ROOT)
        if any(part.startswith(".") or part == "node_modules" for part in relative_path.parts):
            continue

        is_model_file = path.name in {"model.py", "models.py"}
        is_migration_file = "migrations" in relative_path.parts
        if not is_model_file and not is_migration_file:
            continue

        digest.update(str(relative_path).encode())
        digest.update(path.read_bytes())

    return digest.hexdigest()
