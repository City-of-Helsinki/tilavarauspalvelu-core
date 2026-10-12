from __future__ import annotations

import uuid
from typing import TYPE_CHECKING
from urllib.parse import parse_qsl, urlsplit

import pytest
from django.conf import settings
from django.contrib import auth
from django.test import Client

from tilavarauspalvelu.models import User

from tests.factories import UserFactory
from tests.factories.helsinki_profile import MyProfileDataFactory

from .helpers import KeycloakUser, browse, find_helsinki_login_button

if TYPE_CHECKING:
    from pytest_django.fixtures import SettingsWrapper
    from responses import RequestsMock

    from .helpers import FakeKeycloakServer

pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────


FRONTEND_HOST = "fake.test.varaamo.com"

CUSTOMER = KeycloakUser(
    sub=str(uuid.uuid4()),
    email="customer@example.com",
    given_name="Matti",
    family_name="Meikäläinen",
    amr=["suomi_fi"],
    loa="substantial",
)

STAFF_MEMBER = KeycloakUser(
    sub=str(uuid.uuid4()),
    email="staff.member@hel.fi",
    given_name="Maija",
    family_name="Virtanen",
    amr=["helsinkiad"],
    loa="low",
)


def mock_helsinki_profile(requests_mock: RequestsMock, *, profile_id: str) -> None:
    profile_data = MyProfileDataFactory.create_basic(id=profile_id)
    requests_mock.post(settings.OPEN_CITY_PROFILE_GRAPHQL_API, json={"data": {"myProfile": profile_data}})


# ── Customer login ──────────────────────────────────────────────────────────────────────────────────────────────────


def test_login_flow__customer__starts_login_on_keycloak(keycloak_server: FakeKeycloakServer, settings: SettingsWrapper):
    settings.SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS = [FRONTEND_HOST]
    client = Client(enforce_csrf_checks=True)

    next_url = f"https://{FRONTEND_HOST}/reservations"
    response = browse(client, method="GET", url=f"/helauth/login/?next={next_url}&ui=customer&lang=fi")

    assert response.status_code == 302

    authorization_url = urlsplit(response["Location"])
    assert f"{authorization_url.scheme}://{authorization_url.netloc}{authorization_url.path}" == (
        keycloak_server.authorization_endpoint
    )

    query = dict(parse_qsl(authorization_url.query))
    assert query == {
        "client_id": settings.SOCIAL_AUTH_TUNNISTAMO_KEY,
        "redirect_uri": "http://testserver/pysocial/complete/tunnistamo/",
        "response_type": "code",
        "scope": "openid profile email",
        "state": query["state"],
        "nonce": query["nonce"],
        "ui_locales": "fi",
        "kc_idp_hint": "suomi_fi",
    }


def test_login_flow__customer__logs_in_and_returns_to_frontend(
    keycloak_server: FakeKeycloakServer,
    requests_mock: RequestsMock,
    settings: SettingsWrapper,
):
    settings.SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS = [FRONTEND_HOST]
    mock_helsinki_profile(requests_mock, profile_id="fake-profile-id")
    client = Client(enforce_csrf_checks=True)

    next_url = f"https://{FRONTEND_HOST}/reservations"
    response = browse(client, method="GET", url=f"/helauth/login/?next={next_url}&ui=customer&lang=fi")
    callback_url = keycloak_server.log_in(authorization_url=response["Location"], user=CUSTOMER)
    response = browse(client, method="GET", url=callback_url)

    assert response.status_code == 302
    assert response["Location"] == next_url

    user = User.objects.get(uuid=CUSTOMER.sub)
    assert user.email == CUSTOMER.email
    assert user.first_name == CUSTOMER.given_name
    assert user.last_name == CUSTOMER.family_name
    assert user.profile_id == "fake-profile-id"

    logged_in_user = auth.get_user(client)
    assert logged_in_user.pk == user.pk


def test_login_flow__customer__rejects_callback_with_wrong_state(
    keycloak_server: FakeKeycloakServer, settings: SettingsWrapper
):
    settings.SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS = [FRONTEND_HOST]
    client = Client(enforce_csrf_checks=True)

    response = browse(client, method="GET", url="/helauth/login/?ui=customer&lang=fi")
    callback_url = keycloak_server.log_in(authorization_url=response["Location"], user=CUSTOMER)
    forged_callback_url = callback_url.replace("state=", "state=forged")
    browse(client, method="GET", url=forged_callback_url)

    assert User.objects.filter(uuid=CUSTOMER.sub).exists() is False

    logged_in_user = auth.get_user(client)
    assert logged_in_user.is_anonymous is True


# ── Admin login ─────────────────────────────────────────────────────────────────────────────────────────────────────


def test_login_flow__admin__helsinki_login_button_starts_login_on_keycloak(keycloak_server: FakeKeycloakServer):
    client = Client(enforce_csrf_checks=True)

    login_page = client.get("/admin/login/?next=/admin/")
    assert login_page.status_code == 200

    button = find_helsinki_login_button(login_page.content.decode())
    response = browse(client, method=button.method, url=button.action, data=button.data)

    assert response.status_code == 302

    authorization_url = urlsplit(response["Location"])
    assert f"{authorization_url.scheme}://{authorization_url.netloc}{authorization_url.path}" == (
        keycloak_server.authorization_endpoint
    )

    query = dict(parse_qsl(authorization_url.query))
    assert query == {
        "client_id": settings.SOCIAL_AUTH_TUNNISTAMO_KEY,
        "redirect_uri": "http://testserver/pysocial/complete/tunnistamo/",
        "response_type": "code",
        "scope": "openid profile email",
        "state": query["state"],
        "nonce": query["nonce"],
    }


def test_login_flow__admin__staff_member_logs_in_to_admin(keycloak_server: FakeKeycloakServer):
    UserFactory.create(uuid=STAFF_MEMBER.sub, email=STAFF_MEMBER.email, is_staff=True)
    client = Client(enforce_csrf_checks=True)

    login_page = client.get("/admin/login/?next=/admin/")
    button = find_helsinki_login_button(login_page.content.decode())
    response = browse(client, method=button.method, url=button.action, data=button.data)
    callback_url = keycloak_server.log_in(authorization_url=response["Location"], user=STAFF_MEMBER)
    response = browse(client, method="GET", url=callback_url)

    assert response.status_code == 200
    assert response.request["PATH_INFO"] == "/admin/"

    logged_in_user = auth.get_user(client)
    assert logged_in_user.uuid == uuid.UUID(STAFF_MEMBER.sub)


# ── Logout ──────────────────────────────────────────────────────────────────────────────────────────────────────────


def test_login_flow__logout__ends_keycloak_session(
    keycloak_server: FakeKeycloakServer,
    requests_mock: RequestsMock,
    settings: SettingsWrapper,
):
    settings.SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS = [FRONTEND_HOST]
    mock_helsinki_profile(requests_mock, profile_id="fake-profile-id")
    client = Client(enforce_csrf_checks=True)

    response = browse(client, method="GET", url="/helauth/login/?ui=customer&lang=fi")
    callback_url = keycloak_server.log_in(authorization_url=response["Location"], user=CUSTOMER)
    browse(client, method="GET", url=callback_url)

    client.get("/csrf/")
    logout_data = {
        "csrfmiddlewaretoken": client.cookies["csrftoken"].value,
        "redirect_to": f"https://{FRONTEND_HOST}/auth/logout/",
    }
    response = browse(client, method="POST", url="/helauth/logout/", data=logout_data)

    assert response.status_code == 302

    end_session_url = urlsplit(response["Location"])
    assert f"{end_session_url.scheme}://{end_session_url.netloc}{end_session_url.path}" == (
        keycloak_server.end_session_endpoint
    )

    query = dict(parse_qsl(end_session_url.query))
    assert query == {
        "id_token_hint": query["id_token_hint"],
        "post_logout_redirect_uri": f"https://{FRONTEND_HOST}/auth/logout/",
    }

    logged_in_user = auth.get_user(client)
    assert logged_in_user.is_anonymous is True
