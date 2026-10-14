from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from config.auth import ProxyTunnistamoOIDCAuthBackend

from tests.helpers import patch_method

from .helpers import OIDC_ENDPOINT, FakeKeycloak

if TYPE_CHECKING:
    from collections.abc import Iterator


@pytest.fixture
def keycloak(settings) -> Iterator[FakeKeycloak]:
    settings.SOCIAL_AUTH_TUNNISTAMO_OIDC_ENDPOINT = OIDC_ENDPOINT
    settings.SOCIAL_AUTH_TUNNISTAMO_SCOPE = []

    fake_keycloak = FakeKeycloak()
    with patch_method(ProxyTunnistamoOIDCAuthBackend.request, side_effect=fake_keycloak.request):
        yield fake_keycloak
