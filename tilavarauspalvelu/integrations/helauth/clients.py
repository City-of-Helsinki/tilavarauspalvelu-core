from __future__ import annotations

import datetime
import time
from typing import TYPE_CHECKING

from requests import HTTPError
from social_django.models import DjangoStorage
from social_django.strategy import DjangoStrategy

from config.auth import ProxyTunnistamoOIDCAuthBackend
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.base_external_service_client import BaseExternalServiceClient

if TYPE_CHECKING:
    from tilavarauspalvelu.integrations.helauth.typing import RefreshResponse
    from tilavarauspalvelu.typing import AnyUser, ExtraData, SessionMapping

__all__ = [
    "KeyCloakClient",
]


class KeyCloakClient(BaseExternalServiceClient):
    SERVICE_NAME = "KeyCloak"
    REQUEST_TIMEOUT_SECONDS = 5

    # The strategy/storage doesn't matter here.
    oidc_backend = ProxyTunnistamoOIDCAuthBackend(strategy=DjangoStrategy(storage=DjangoStorage()))

    @classmethod
    def get_token(cls, *, user: AnyUser, session: SessionMapping) -> str | None:
        """
        Get KeyCloak access token from the user session. Refresh if necessary.

        :return: The access token if one is valid or could be refreshed, None otherwise.
        """
        if user.is_anonymous:
            return None

        leeway = 60
        cutoff = local_datetime() - datetime.timedelta(seconds=leeway)
        keycloak_access_token: str | None = session.get("keycloak_access_token")
        keycloak_access_token_expires_at: datetime.datetime | None = session.get("keycloak_access_token_expires_at")

        if (
            keycloak_access_token is not None
            and keycloak_access_token_expires_at is not None
            and keycloak_access_token_expires_at.astimezone(DEFAULT_TIMEZONE) >= cutoff
        ):
            return keycloak_access_token

        return cls.refresh_token(user=user, session=session)

    @classmethod
    def refresh_token(cls, *, user: AnyUser, session: SessionMapping) -> str | None:
        """
        Refresh KeyCloak access and refresh tokens.

        :return: The new access token if refresh was successful, None otherwise.
        """
        if user.is_anonymous:
            return None

        social_auth = user.current_social_auth
        if social_auth is None:
            msg = f"Unable to get `social_auth` for user {int(user.pk)}."
            SentryLogger.log_message(msg)
            return None

        extra_data: ExtraData = social_auth.extra_data
        keycloak_refresh_token = extra_data["refresh_token"]

        try:
            # Delegate refresh to OAuth backend.
            response: RefreshResponse = cls.oidc_backend.refresh_token(token=keycloak_refresh_token)
        except HTTPError as error:
            try:
                # Catch known error for expired keycloak refresh token. This cannot be solved without a
                # logging out and back in again. Set a flag in the session which is used by the
                # `KeycloakRefreshTokenExpiredMiddleware` middleware to set a response header to indicate
                # to frontend that the token is expired.
                error_data = error.response.json()
                if "error" in error_data and error_data["error"] == "invalid_grant":
                    session["keycloak_refresh_token_expired"] = True

            except Exception:  # noqa: BLE001
                msg = f"Unable to refresh keycloak token for user {int(user.pk)}: {error.response.text}"
                SentryLogger.log_exception(error, details=msg)

            return None

        now = local_datetime()
        session["keycloak_access_token"] = response["access_token"]
        session["keycloak_access_token_expires_at"] = now + datetime.timedelta(seconds=response["expires_in"])

        extra_data["id_token"] = response["id_token"]
        extra_data["auth_time"] = int(time.time())
        extra_data["token_type"] = response["token_type"]
        extra_data["refresh_token"] = response["refresh_token"]
        extra_data["access_token"] = response["access_token"]
        social_auth.save(update_fields=["extra_data"])

        return response["access_token"]
