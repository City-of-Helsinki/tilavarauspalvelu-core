from __future__ import annotations

import dataclasses
import json
import time
import uuid
from html.parser import HTMLParser
from typing import TYPE_CHECKING, Any, Literal
from unittest.mock import MagicMock
from urllib.parse import parse_qsl, urlencode, urlsplit

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from django.conf import settings

if TYPE_CHECKING:
    from django.http import HttpResponse
    from django.test import Client
    from requests import PreparedRequest
    from responses import RequestsMock

    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import WSGIRequest


def mock_request(user: User) -> WSGIRequest:
    request = MagicMock()
    request.user = user
    return request


# ── Browser ─────────────────────────────────────────────────────────────────────────────────────────────────────────


REDIRECT_STATUS_CODES = {301, 302, 303, 307, 308}
METHOD_PRESERVING_REDIRECT_STATUS_CODES = {307, 308}


def browse(
    client: Client,
    *,
    method: Literal["GET", "POST"],
    url: str,
    data: dict[str, str] | None = None,
) -> HttpResponse:
    """
    Send a request like a browser does. Follow the redirects that stay in the backend,
    and submit the pages that submit a form automatically when they load.
    Return the first response that is not one of those, or that redirects to an external service.
    """
    response = send_request(client, method=method, url=url, data=data)

    while True:
        if response.status_code in REDIRECT_STATUS_CODES:
            location = response["Location"]
            target = urlsplit(location)
            if target.netloc not in {"", "testserver"}:
                return response

            if response.status_code not in METHOD_PRESERVING_REDIRECT_STATUS_CODES:
                method = "GET"
                data = None

            response = send_request(client, method=method, url=location, data=data)
            continue

        auto_submit_form = find_auto_submit_form(response)
        if auto_submit_form is None:
            return response

        response = send_request(
            client,
            method=auto_submit_form.method,
            url=auto_submit_form.action,
            data=auto_submit_form.data,
        )


def send_request(
    client: Client,
    *,
    method: Literal["GET", "POST"],
    url: str,
    data: dict[str, str] | None,
) -> HttpResponse:
    if method == "POST":
        return client.post(url, data=data or {})
    return client.get(url)


@dataclasses.dataclass(slots=True)
class PageRequest:
    """A request that a browser sends from a page, when the user clicks a link or a form is submitted."""

    method: Literal["GET", "POST"]
    action: str
    data: dict[str, str]


def find_helsinki_login_button(html: str) -> PageRequest:
    """Find the 'Helsinki Login' button on the admin login page, and the request that clicking it sends."""
    parser = PageParser()
    parser.feed(html)
    parser.close()

    if parser.helsinki_login_button is None:
        msg = "Admin login page has no 'Helsinki Login' button."
        raise AssertionError(msg)

    return parser.helsinki_login_button


def find_auto_submit_form(response: HttpResponse) -> PageRequest | None:
    """Find the form that the login page submits with a script when the page loads."""
    if not response.get("Content-Type", "").startswith("text/html"):
        return None

    parser = PageParser()
    parser.feed(response.content.decode())
    parser.close()

    return parser.forms_by_id.get("keycloak-redirect-form")


class PageParser(HTMLParser):
    """Find the forms on a page, and the link or the form that contains the 'Helsinki Login' button."""

    def __init__(self) -> None:
        super().__init__()
        self.forms_by_id: dict[str, PageRequest] = {}
        self.helsinki_login_button: PageRequest | None = None
        self.open_link: PageRequest | None = None
        self.open_form: PageRequest | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {name: value or "" for name, value in attrs}

        if tag == "a":
            self.open_link = PageRequest(method="GET", action=attributes.get("href", ""), data={})

        if tag == "form":
            method = "POST" if attributes.get("method", "get").lower() == "post" else "GET"
            self.open_form = PageRequest(method=method, action=attributes.get("action", ""), data={})
            if "id" in attributes:
                self.forms_by_id[attributes["id"]] = self.open_form

        if tag == "input" and self.open_form is not None and attributes.get("type") == "hidden":
            self.open_form.data[attributes["name"]] = attributes.get("value", "")

        if attributes.get("id") == "helsinki-login-btn":
            self.helsinki_login_button = self.open_link or self.open_form

    def handle_endtag(self, tag: str) -> None:
        if tag == "a":
            self.open_link = None
        if tag == "form":
            self.open_form = None


# ── Keycloak ────────────────────────────────────────────────────────────────────────────────────────────────────────


KEYCLOAK_SIGNING_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
KEYCLOAK_SIGNING_KEY_ID = "fake-keycloak-signing-key"


@dataclasses.dataclass(frozen=True, slots=True)
class KeycloakUser:
    sub: str
    email: str
    given_name: str
    family_name: str
    amr: list[str]
    loa: Literal["low", "substantial", "high"]
    ad_groups: list[str] = dataclasses.field(default_factory=list)


@dataclasses.dataclass(slots=True)
class FakeKeycloak:
    """
    Fake of the Helsinki Keycloak server.
    Answers the HTTP requests the backend sends to Keycloak, and signs ID tokens with a test key.
    """

    requests_mock: RequestsMock
    user: KeycloakUser | None = None
    nonce: str | None = None
    authorization_code: str = "fake-authorization-code"

    issuer: str = f"{settings.SOCIAL_AUTH_TUNNISTAMO_OIDC_ENDPOINT}/auth/realms/helsinki-tunnistus"

    @property
    def authorization_endpoint(self) -> str:
        return f"{self.issuer}/protocol/openid-connect/auth"

    @property
    def token_endpoint(self) -> str:
        return f"{self.issuer}/protocol/openid-connect/token"

    @property
    def userinfo_endpoint(self) -> str:
        return f"{self.issuer}/protocol/openid-connect/userinfo"

    @property
    def jwks_uri(self) -> str:
        return f"{self.issuer}/protocol/openid-connect/certs"

    @property
    def end_session_endpoint(self) -> str:
        return f"{self.issuer}/protocol/openid-connect/logout"

    def start(self) -> None:
        discovery_url = f"{settings.SOCIAL_AUTH_TUNNISTAMO_OIDC_ENDPOINT}/.well-known/openid-configuration"
        discovery_document = {
            "issuer": self.issuer,
            "authorization_endpoint": self.authorization_endpoint,
            "token_endpoint": self.token_endpoint,
            "userinfo_endpoint": self.userinfo_endpoint,
            "jwks_uri": self.jwks_uri,
            "end_session_endpoint": self.end_session_endpoint,
            "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
        }
        self.requests_mock.get(discovery_url, json=discovery_document)

        public_key = jwt.algorithms.RSAAlgorithm.to_jwk(KEYCLOAK_SIGNING_KEY.public_key(), as_dict=True)
        public_key |= {"kid": KEYCLOAK_SIGNING_KEY_ID, "alg": "RS256", "use": "sig"}
        self.requests_mock.get(self.jwks_uri, json={"keys": [public_key]})

        self.requests_mock.add_callback("POST", self.token_endpoint, callback=self.token_endpoint_response)
        self.requests_mock.add_callback("GET", self.userinfo_endpoint, callback=self.userinfo_endpoint_response)

    def log_in(self, *, authorization_url: str, user: KeycloakUser) -> str:
        """
        Act as the user who logs in on the Keycloak login page.
        Return the URL that Keycloak then redirects the browser to.
        """
        query = dict(parse_qsl(urlsplit(authorization_url).query))
        self.user = user
        self.nonce = query["nonce"]

        callback_query = urlencode({"state": query["state"], "code": self.authorization_code})
        return f"{query['redirect_uri']}?{callback_query}"

    def token_endpoint_response(self, request: PreparedRequest) -> tuple[int, dict[str, str], str]:
        body = request.body.decode() if isinstance(request.body, bytes) else request.body or ""
        params = dict(parse_qsl(body))

        match params.get("grant_type"):
            case "authorization_code":
                if params.get("code") != self.authorization_code:
                    return 400, {}, json.dumps({"error": "invalid_grant"})
                return 200, {}, json.dumps(self.user_tokens())

            case "refresh_token":
                return 200, {}, json.dumps(self.user_tokens())

            case "urn:ietf:params:oauth:grant-type:uma-ticket":
                profile_tokens = {
                    "access_token": "fake-profile-access-token",
                    "refresh_token": "fake-profile-refresh-token",
                    "token_type": "Bearer",
                    "expires_in": 300,
                    "refresh_expires_in": 1800,
                }
                return 200, {}, json.dumps(profile_tokens)

        return 400, {}, json.dumps({"error": "unsupported_grant_type"})

    def userinfo_endpoint_response(self, request: PreparedRequest) -> tuple[int, dict[str, str], str]:
        if self.user is None:
            return 401, {}, json.dumps({"error": "invalid_token"})

        userinfo = {
            "sub": self.user.sub,
            "email": self.user.email,
            "given_name": self.user.given_name,
            "family_name": self.user.family_name,
            "name": f"{self.user.given_name} {self.user.family_name}",
        }
        return 200, {}, json.dumps(userinfo)

    def user_tokens(self) -> dict[str, Any]:
        if self.user is None:
            msg = "No user has logged in to Keycloak."
            raise AssertionError(msg)

        now = int(time.time())
        id_token_claims = {
            "iss": self.issuer,
            "sub": self.user.sub,
            "aud": settings.SOCIAL_AUTH_TUNNISTAMO_KEY,
            "azp": settings.SOCIAL_AUTH_TUNNISTAMO_KEY,
            "typ": "ID",
            "jti": str(uuid.uuid4()),
            "exp": now + 300,
            "iat": now,
            "auth_time": now,
            "nonce": self.nonce,
            "sid": str(uuid.uuid4()),
            "email": self.user.email,
            "email_verified": True,
            "given_name": self.user.given_name,
            "family_name": self.user.family_name,
            "name": f"{self.user.given_name} {self.user.family_name}",
            "amr": self.user.amr,
            "loa": self.user.loa,
            "ad_groups": self.user.ad_groups,
        }
        id_token = jwt.encode(
            id_token_claims,
            KEYCLOAK_SIGNING_KEY,
            algorithm="RS256",
            headers={"kid": KEYCLOAK_SIGNING_KEY_ID},
        )
        return {
            "access_token": "fake-keycloak-access-token",
            "refresh_token": "fake-keycloak-refresh-token",
            "id_token": id_token,
            "token_type": "Bearer",
            "expires_in": 300,
            "refresh_expires_in": 1800,
        }
