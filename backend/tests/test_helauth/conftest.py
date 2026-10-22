from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
import responses

from .helpers import FakeKeycloak

if TYPE_CHECKING:
    from collections.abc import Generator


@pytest.fixture
def requests_mock() -> Generator[responses.RequestsMock]:
    with responses.RequestsMock(assert_all_requests_are_fired=False) as mock:
        yield mock


@pytest.fixture
def keycloak(requests_mock: responses.RequestsMock) -> FakeKeycloak:
    fake_keycloak = FakeKeycloak(requests_mock=requests_mock)
    fake_keycloak.start()
    return fake_keycloak
