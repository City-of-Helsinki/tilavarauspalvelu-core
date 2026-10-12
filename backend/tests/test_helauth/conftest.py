from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
import responses

from config.auth import ProxyTunnistamoOIDCAuthBackend

from tests.helpers import patch_method

from .helpers import OIDC_ENDPOINT, FakeKeycloak, FakeKeycloakServer

if TYPE_CHECKING:
    from collections.abc import Generator, Iterator


@pytest.fixture
def keycloak(settings) -> Iterator[FakeKeycloak]:
    settings.SOCIAL_AUTH_TUNNISTAMO_OIDC_ENDPOINT = OIDC_ENDPOINT
    settings.SOCIAL_AUTH_TUNNISTAMO_SCOPE = []

    fake_keycloak = FakeKeycloak()
    with patch_method(ProxyTunnistamoOIDCAuthBackend.request, side_effect=fake_keycloak.request):
        yield fake_keycloak


@pytest.fixture
def requests_mock() -> Generator[responses.RequestsMock]:
    with responses.RequestsMock(assert_all_requests_are_fired=False) as mock:
        yield mock


@pytest.fixture
def keycloak_server(requests_mock: responses.RequestsMock) -> FakeKeycloakServer:
    fake_keycloak = FakeKeycloakServer(requests_mock=requests_mock)
    fake_keycloak.start()
    return fake_keycloak
