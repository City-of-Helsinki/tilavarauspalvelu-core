from __future__ import annotations

from contextlib import ExitStack, nullcontext
from typing import TYPE_CHECKING

import pytest
import stamina
from pytest_undine.client import GraphQLClient
from rest_framework.test import APIClient

from tests.factories._base import FakerEN, FakerFI, FakerSV
from tests.helpers import patch_method

if TYPE_CHECKING:
    from _pytest.mark import Mark
    from django.core.mail import EmailMessage


@pytest.fixture
def graphql() -> GraphQLClient:
    return GraphQLClient()


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture(autouse=True, scope="session")
def _deactivate_retries():
    """Deactivate all retry logic during testing."""
    stamina.set_active(False)


@pytest.fixture
def outbox() -> list[EmailMessage]:
    from django.core import mail

    return mail.outbox


@pytest.fixture(autouse=True)
def _reset_faker_uniqueness():
    """Reset the uniqueness of all faker instances between tests so that they don't run out of unique values."""
    FakerFI.clear_unique()
    FakerSV.clear_unique()
    FakerEN.clear_unique()


@pytest.fixture(autouse=True)
def _patch_method_marker(request: pytest.FixtureRequest):
    """
    Allows using the 'patch_method' in 'pytestmark' to patch methods in multiple tests at once.

    Must use the 'with_args' method due how 'MarkDecorator.__call__' is implemented.

    >>> pytestmark = [
    >>>     pytest.mark.patch_method.with_args(HaukiAPIClient.get_date_periods, return_value=[]),  # type: ignore
    >>>     pytest.mark.patch_method.with_args(PindoraClient.activate_reservation_access_code),  # type: ignore
    >>> ]
    """
    markers: list[Mark] = list(request.node.iter_markers(name="patch_method"))
    if markers:
        with ExitStack() as stack:
            for mark in markers:
                patch = patch_method(*mark.args, **mark.kwargs)
                stack.enter_context(patch)
            yield

    else:
        with nullcontext():
            yield
