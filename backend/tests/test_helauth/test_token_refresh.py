from __future__ import annotations

import json
import uuid
from typing import TYPE_CHECKING

import pytest
from django.test import Client
from graphene_django_extensions.testing import build_query

from tests.factories import ApplicationFactory, UserFactory

from .helpers import KeycloakUser, browse, find_helsinki_login_button

if TYPE_CHECKING:
    from django.http import HttpResponse

    from .helpers import FakeKeycloak

pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────


STAFF_MEMBER = KeycloakUser(
    sub=str(uuid.uuid4()),
    email="staff.member@hel.fi",
    given_name="Maija",
    family_name="Virtanen",
    amr=["helsinkiad"],
    loa="low",
)


def log_in_staff_member(keycloak: FakeKeycloak) -> Client:
    UserFactory.create_superuser(uuid=STAFF_MEMBER.sub, email=STAFF_MEMBER.email)
    client = Client(enforce_csrf_checks=True)

    login_page = client.get("/admin/login/?next=/admin/")
    button = find_helsinki_login_button(login_page.content.decode())
    response = browse(client, method=button.method, url=button.action, data=button.data)
    callback_url = keycloak.log_in(authorization_url=response["Location"], user=STAFF_MEMBER)
    browse(client, method="GET", url=callback_url)

    return client


def query_applicant_profile(client: Client) -> HttpResponse:
    applicant = UserFactory.create_profile_user()
    application = ApplicationFactory.create(user=applicant)
    query = build_query("profileData", fields="firstName lastName", application_pk=application.pk)

    return client.post(
        "/graphql/",
        data=json.dumps({"query": query}),
        content_type="application/json",
        headers={"X-CSRFToken": client.cookies["csrftoken"].value},
    )


# ── Keycloak token refresh ──────────────────────────────────────────────────────────────────────────────────────────


def test_token_refresh__keycloak_rejects_refresh_token__frontend_is_told_to_log_in_again(keycloak: FakeKeycloak):
    client = log_in_staff_member(keycloak)
    keycloak.refresh_failure_status_code = 400
    keycloak.refresh_failure_error = "invalid_grant"

    response = query_applicant_profile(client)

    assert response.status_code == 200
    assert response["X-Keycloak-Refresh-Token-Expired"] == "true"

    errors = response.json()["errors"]
    assert [(error["message"], error["extensions"]["code"]) for error in errors] == [
        (
            "Keycloak refresh token is expired. Please log out and back in again.",
            "HELSINKI_PROFILE_KEYCLOAK_REFRESH_TOKEN_EXPIRED",
        ),
    ]


def test_token_refresh__keycloak_is_unavailable__profile_token_is_invalid(keycloak: FakeKeycloak):
    client = log_in_staff_member(keycloak)
    keycloak.refresh_failure_status_code = 503
    keycloak.refresh_failure_error = "temporarily_unavailable"

    response = query_applicant_profile(client)

    assert response.status_code == 200
    assert "X-Keycloak-Refresh-Token-Expired" not in response

    errors = response.json()["errors"]
    assert [(error["message"], error["extensions"]["code"]) for error in errors] == [
        (
            "Helsinki profile token is not valid and could not be refreshed.",
            "HELSINKI_PROFILE_TOKEN_INVALID",
        ),
    ]
