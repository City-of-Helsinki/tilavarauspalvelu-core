from __future__ import annotations

import datetime
import re
import urllib.parse
import uuid
from typing import TYPE_CHECKING, Any

import pytest
from django.contrib.messages import get_messages
from django.urls import reverse

from tilavarauspalvelu.enums import ADLoginAMR, ProfileLoginAMR, UserRoleChoice
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.models import UnitRole, User
from utils.date_utils import local_datetime

from tests.factories import UnitFactory, UserFactory
from tests.factories.helsinki_profile import MyProfileDataFactory
from tests.helpers import ResponseMock, patch_method

from .helpers import OIDC_CONFIG, OIDC_ENDPOINT, UMA_TICKET_GRANT, TokenRequest

if TYPE_CHECKING:
    from django.test import Client

pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def start_social_login(client: Client) -> dict[str, str]:
    """Start the social login and return the query parameters of the redirect to the Keycloak login page."""
    url = reverse("social:begin", kwargs={"backend": "tunnistamo"})
    response = client.get(url, data={"next": "/reservations"})
    assert response.status_code == 302, response

    redirect_url = urllib.parse.urlparse(response.url)
    return dict(urllib.parse.parse_qsl(redirect_url.query))


def complete_social_login(client: Client, *, state: str) -> Any:
    """Return to the service from the Keycloak login page with an authorization code."""
    url = reverse("social:complete", kwargs={"backend": "tunnistamo"})
    return client.get(url, data={"code": "login-code", "state": state})


def id_token_claims(
    *,
    nonce: str,
    amr: ADLoginAMR | ProfileLoginAMR,
    email: str = "user@example.com",
    ad_groups: list[str] | None = None,
    issued_at: datetime.datetime | None = None,
) -> dict[str, Any]:
    now = local_datetime()
    issued_at = issued_at or now
    return {
        "iss": OIDC_ENDPOINT,
        "sub": str(uuid.uuid4()),
        "aud": "SOCIAL_AUTH_TUNNISTAMO_KEY",
        "jti": uuid.uuid4().hex,
        "typ": "ID",
        "exp": int((now + datetime.timedelta(minutes=5)).timestamp()),
        "iat": int(issued_at.timestamp()),
        "auth_time": int(now.timestamp()),
        "nonce": nonce,
        "email": email,
        "given_name": "Example",
        "family_name": "User",
        "ad_groups": ad_groups or [],
        "amr": [amr.value],
        "loa": "substantial",
    }


def build_end_session_url(*, id_token: str, post_logout_redirect_uri: str) -> str:
    query = urllib.parse.urlencode({
        "id_token_hint": id_token,
        "post_logout_redirect_uri": post_logout_redirect_uri,
    })
    return f"{OIDC_CONFIG['end_session_endpoint']}?{query}"


def message_texts(response: Any) -> list[str]:
    messages = get_messages(response.wsgi_request)
    return [str(message.message) for message in messages]


# ── Login view ──


def test_login_view__redirect_to_social_login(client):
    url = reverse("helusers:auth_login")
    response = client.get(url, data={"next": "http://localhost:3000/reservations", "lang": "sv", "ui": "customer"})

    assert response.status_code == 302

    redirect_url = urllib.parse.urlparse(response.url)
    assert redirect_url.path == "/pysocial/login/tunnistamo/"
    assert dict(urllib.parse.parse_qsl(redirect_url.query)) == {
        "next": "http://localhost:3000/reservations",
        "ui_locales": "sv",
        "kc_idp_hint": "suomi_fi",
    }


def test_login_view__redirect_to_social_login__no_customer_login(client):
    url = reverse("helusers:auth_login")
    response = client.get(url, data={"ui": "admin"})

    assert response.status_code == 302
    assert response.url == "/pysocial/login/tunnistamo/"


def test_login_view__logs_out_current_user(client):
    user = UserFactory.create()
    client.force_login(user)

    url = reverse("helusers:auth_login")
    response = client.get(url)

    assert response.status_code == 302
    assert "_auth_user_id" not in client.session


# ── Social login ──


def test_social_login__redirect_to_keycloak(client, keycloak):
    url = reverse("social:begin", kwargs={"backend": "tunnistamo"})
    response = client.get(url, data={"ui_locales": "sv", "kc_idp_hint": "suomi_fi"})

    assert response.status_code == 302

    redirect_url = urllib.parse.urlparse(response.url)
    assert redirect_url._replace(query="").geturl() == OIDC_CONFIG["authorization_endpoint"]

    params = dict(urllib.parse.parse_qsl(redirect_url.query))
    nonce = params.pop("nonce")
    assert re.fullmatch(r"[a-zA-Z0-9]{64}", nonce), nonce
    assert params == {
        "client_id": "SOCIAL_AUTH_TUNNISTAMO_KEY",
        "redirect_uri": "http://testserver/pysocial/complete/tunnistamo/",
        "state": client.session["tunnistamo_state"],
        "response_type": "code",
        "scope": "openid profile email",
        "ui_locales": "sv",
        "kc_idp_hint": "suomi_fi",
    }


def test_social_login__redirect_to_keycloak__no_language_or_identity_provider(client, keycloak):
    params = start_social_login(client)

    assert "ui_locales" not in params
    assert "kc_idp_hint" not in params


@patch_method(HelsinkiProfileClient.request)
def test_social_login__profile_login(client, keycloak):
    profile_data = MyProfileDataFactory.create_basic(
        id="profile-id",
        verifiedPersonalInformation__nationalIdentificationNumber="010101A1234",
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    params = start_social_login(client)
    keycloak.id_token_claims = id_token_claims(nonce=params["nonce"], amr=ProfileLoginAMR.SUOMI_FI)

    response = complete_social_login(client, state=params["state"])

    assert response.status_code == 302
    assert response.url == "/reservations"

    user = User.objects.get(uuid=keycloak.id_token_claims["sub"])
    assert user.email == "user@example.com"
    assert user.profile_id == "profile-id"
    assert user.date_of_birth == datetime.date(2001, 1, 1)

    social_auth = user.social_auth.get()
    assert social_auth.extra_data["refresh_token"] == "refreshed-refresh-token"

    assert keycloak.token_requests == [
        TokenRequest(grant_type="authorization_code", token="login-code"),
        TokenRequest(grant_type="refresh_token", token="login-refresh-token"),
        TokenRequest(grant_type=UMA_TICKET_GRANT, token="refreshed-access-token"),
    ]

    session = client.session
    assert session["_auth_user_id"] == str(user.pk)
    assert session["profile_access_token"] == "profile-access-token"
    assert session["social_auth_end_session_url"] == build_end_session_url(
        id_token=keycloak.id_token,
        post_logout_redirect_uri="http://testserver/admin/login/",
    )
    assert session["reservation_prefill_info"] == {
        "municipality": "HELSINKI",
        "reservee_address_zip": "00100",
        "reservee_email": "user@example.com",
        "reservee_first_name": "Example",
        "reservee_last_name": "User",
        "reservee_phone": "0123456789",
    }


@patch_method(HelsinkiProfileClient.request)
def test_social_login__ad_login(client, keycloak):
    old_user = UserFactory.create(
        email="user@hel.fi",
        profile_id="",
        is_staff=True,
        date_joined=local_datetime(2021, 1, 1),
    )
    unit = UnitFactory.create(tprek_id="1234", allow_permissions_from_ad_groups=True)

    params = start_social_login(client)
    keycloak.id_token_claims = id_token_claims(
        nonce=params["nonce"],
        amr=ADLoginAMR.HELSINKIAZUREAD,
        email="user@hel.fi",
        ad_groups=["unit__varaamo__handler__1234"],
    )

    response = complete_social_login(client, state=params["state"])

    assert response.status_code == 302
    assert response.url == "/reservations"

    user = User.objects.get(uuid=keycloak.id_token_claims["sub"])
    assert user.is_staff is True

    old_user.refresh_from_db()
    assert old_user.is_active is False

    unit_role = UnitRole.objects.get(user=user)
    assert unit_role.role == UserRoleChoice.HANDLER
    assert unit_role.is_from_ad_group is True
    assert list(unit_role.units.all()) == [unit]

    assert HelsinkiProfileClient.request.call_count == 0
    assert keycloak.token_requests == [
        TokenRequest(grant_type="authorization_code", token="login-code"),
    ]


def test_social_login__id_token_issued_in_the_future(client, keycloak):
    params = start_social_login(client)
    keycloak.id_token_claims = id_token_claims(
        nonce=params["nonce"],
        amr=ADLoginAMR.HELSINKIAZUREAD,
        issued_at=local_datetime() + datetime.timedelta(minutes=1),
    )

    response = complete_social_login(client, state=params["state"])

    assert response.status_code == 302
    assert response.url == "/admin/"
    assert "_auth_user_id" not in client.session
    assert User.objects.filter(uuid=keycloak.id_token_claims["sub"]).exists() is False


def test_social_login__id_token_issued_in_the_future__skip_iat_claim_validation(client, keycloak, settings):
    settings.UNSAFE_SKIP_IAT_CLAIM_VALIDATION = True

    params = start_social_login(client)
    keycloak.id_token_claims = id_token_claims(
        nonce=params["nonce"],
        amr=ADLoginAMR.HELSINKIAZUREAD,
        issued_at=local_datetime() + datetime.timedelta(minutes=1),
    )

    response = complete_social_login(client, state=params["state"])

    assert response.status_code == 302
    assert response.url == "/reservations"

    user = User.objects.get(uuid=keycloak.id_token_claims["sub"])
    assert client.session["_auth_user_id"] == str(user.pk)


# ── Logout view ──


def test_logout_view__redirect_to_end_session_url(client):
    user = UserFactory.create()
    client.force_login(user)

    session = client.session
    session["social_auth_end_session_url"] = f"{OIDC_CONFIG['end_session_endpoint']}?id_token_hint=foo"
    session.save()

    url = reverse("helusers:auth_logout")
    response = client.post(url)

    assert response.status_code == 302
    assert response.url == build_end_session_url(
        id_token="foo", post_logout_redirect_uri="http://testserver/admin/login/"
    )
    assert "_auth_user_id" not in client.session
    assert message_texts(response) == ["You have been successfully logged out."]


def test_logout_view__redirect_to_end_session_url__given_redirect_url(client):
    user = UserFactory.create()
    client.force_login(user)

    session = client.session
    session["social_auth_end_session_url"] = f"{OIDC_CONFIG['end_session_endpoint']}?id_token_hint=foo"
    session.save()

    url = reverse("helusers:auth_logout")
    response = client.post(url, data={"redirect_to": "http://localhost:3000/"})

    assert response.status_code == 302
    assert response.url == build_end_session_url(id_token="foo", post_logout_redirect_uri="http://localhost:3000/")


def test_logout_view__no_end_session_url__anonymous_user(client):
    url = reverse("helusers:auth_logout")
    response = client.post(url, data={"redirect_to": "http://localhost:3000/"})

    assert response.status_code == 302
    assert response.url == "http://localhost:3000/"
    assert message_texts(response) == []


def test_logout_view__django_admin_login(client):
    user = UserFactory.create()
    client.force_login(user, backend="config.auth.ProxyModelBackend")

    url = reverse("helusers:auth_logout")
    response = client.post(url)

    assert response.status_code == 302
    assert response.url == "http://testserver/admin/login/"
    assert "_auth_user_id" not in client.session
    assert message_texts(response) == ["You have been successfully logged out."]


def test_logout_view__session_user_deleted(client):
    user = UserFactory.create()
    client.force_login(user)
    user.delete()

    url = reverse("helusers:auth_logout")
    response = client.post(url)

    assert response.status_code == 302
    assert message_texts(response) == []
