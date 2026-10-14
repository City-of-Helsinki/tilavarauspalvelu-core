from __future__ import annotations

import dataclasses
import json
from typing import TYPE_CHECKING, Any, NamedTuple
from unittest.mock import MagicMock

import jwt
from requests import HTTPError

from tests.helpers import ResponseMock
from tests.test_gdpr_api.helpers import RSA

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import WSGIRequest


OIDC_ENDPOINT = "https://tunnistus.example.com/auth/realms/helsinki-tunnistus"

OIDC_CONFIG = {
    "issuer": OIDC_ENDPOINT,
    "authorization_endpoint": f"{OIDC_ENDPOINT}/protocol/openid-connect/auth",
    "token_endpoint": f"{OIDC_ENDPOINT}/protocol/openid-connect/token",
    "userinfo_endpoint": f"{OIDC_ENDPOINT}/protocol/openid-connect/userinfo",
    "jwks_uri": f"{OIDC_ENDPOINT}/protocol/openid-connect/certs",
    "end_session_endpoint": f"{OIDC_ENDPOINT}/protocol/openid-connect/logout",
}

UMA_TICKET_GRANT = "urn:ietf:params:oauth:grant-type:uma-ticket"


def mock_request(user: User) -> WSGIRequest:
    request = MagicMock()
    request.user = user
    return request


class TokenRequest(NamedTuple):
    grant_type: str
    token: str
    """The refresh token, the bearer access token, or the authorization code that the request sent."""


@dataclasses.dataclass
class FakeKeycloak:
    """Answers the HTTP requests that the Tunnistamo OIDC backend sends to Keycloak."""

    id_token_claims: dict[str, Any] = dataclasses.field(default_factory=dict)

    refresh_error_responses: dict[str, ResponseMock | MagicMock] = dataclasses.field(default_factory=dict)
    """Keycloak rejects these refresh tokens with the given response."""

    profile_token_error_response: ResponseMock | None = None
    """If set, Keycloak rejects all Helsinki profile token requests with this response."""

    token_requests: list[TokenRequest] = dataclasses.field(default_factory=list)

    @property
    def id_token(self) -> str:
        return jwt.encode(self.id_token_claims, key=RSA.private_key_pem, algorithm=RSA.algorithm)

    def request(self, url: str, **kwargs: Any) -> ResponseMock:
        if url == f"{OIDC_ENDPOINT}/.well-known/openid-configuration":
            return ResponseMock(json_data=OIDC_CONFIG)

        if url == OIDC_CONFIG["jwks_uri"]:
            return ResponseMock(text=json.dumps({"keys": [RSA.public_key]}))

        if url == OIDC_CONFIG["userinfo_endpoint"]:
            return ResponseMock(
                json_data={
                    "sub": self.id_token_claims["sub"],
                    "email": self.id_token_claims["email"],
                    "given_name": self.id_token_claims["given_name"],
                    "family_name": self.id_token_claims["family_name"],
                }
            )

        if url == OIDC_CONFIG["token_endpoint"]:
            return self.token_response(data=kwargs["data"], headers=kwargs["headers"])

        msg = f"Unexpected request to '{url}'"
        raise AssertionError(msg)

    def token_response(self, *, data: dict[str, str], headers: dict[str, str]) -> ResponseMock:
        grant_type = data["grant_type"]

        if grant_type == "authorization_code":
            self.token_requests.append(TokenRequest(grant_type=grant_type, token=data["code"]))
            return ResponseMock(
                json_data={
                    "access_token": "login-access-token",
                    "id_token": self.id_token,
                    "refresh_token": "login-refresh-token",
                    "token_type": "bearer",
                    "expires_in": 300,
                }
            )

        if grant_type == "refresh_token":
            refresh_token = data["refresh_token"]
            self.token_requests.append(TokenRequest(grant_type=grant_type, token=refresh_token))

            error_response = self.refresh_error_responses.get(refresh_token)
            if error_response is not None:
                raise HTTPError(response=error_response)

            return ResponseMock(
                json_data={
                    "access_token": "refreshed-access-token",
                    "id_token": self.id_token,
                    "refresh_token": "refreshed-refresh-token",
                    "token_type": "bearer",
                    "expires_in": 300,
                }
            )

        if grant_type == UMA_TICKET_GRANT:
            access_token = headers["Authorization"].removeprefix("Bearer ")
            self.token_requests.append(TokenRequest(grant_type=grant_type, token=access_token))

            if self.profile_token_error_response is not None:
                raise HTTPError(response=self.profile_token_error_response)

            return ResponseMock(
                json_data={
                    "access_token": "profile-access-token",
                    "refresh_token": "profile-refresh-token",
                    "expires_in": 300,
                    "refresh_expires_in": 1800,
                }
            )

        msg = f"Unexpected grant type '{grant_type}'"
        raise AssertionError(msg)
