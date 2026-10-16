from __future__ import annotations

import datetime
from unittest.mock import MagicMock

import pytest
from django.contrib.auth.models import AnonymousUser
from freezegun import freeze_time

from tilavarauspalvelu.integrations.helauth.clients import KeyCloakClient
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import local_datetime

from tests.factories import UserFactory
from tests.helpers import ResponseMock, patch_method

from .helpers import TokenRequest

pytestmark = [
    pytest.mark.django_db,
]


# ── Get token ──


def test_keycloak_client__get_token__anonymous_user(keycloak):
    session = {}

    token = KeyCloakClient.get_token(user=AnonymousUser(), session=session)

    assert token is None
    assert session == {}
    assert keycloak.token_requests == []


def test_keycloak_client__get_token__valid_token_in_session(keycloak):
    user = UserFactory.create_profile_user()
    session = {
        "keycloak_access_token": "session-access-token",
        "keycloak_access_token_expires_at": local_datetime() + datetime.timedelta(minutes=5),
    }

    token = KeyCloakClient.get_token(user=user, session=session)

    assert token == "session-access-token"
    assert keycloak.token_requests == []


@freeze_time("2024-01-01T12:00:00+02:00")
def test_keycloak_client__get_token__expired_token_is_refreshed(keycloak):
    user = UserFactory.create_profile_user()
    refresh_token = user.current_social_auth.extra_data["refresh_token"]
    session = {
        "keycloak_access_token": "session-access-token",
        "keycloak_access_token_expires_at": local_datetime() - datetime.timedelta(minutes=5),
    }

    token = KeyCloakClient.get_token(user=user, session=session)

    assert token == "refreshed-access-token"
    assert keycloak.token_requests == [TokenRequest(grant_type="refresh_token", token=refresh_token)]
    assert session == {
        "keycloak_access_token": "refreshed-access-token",
        "keycloak_access_token_expires_at": local_datetime(2024, 1, 1, 12, 5),
    }

    social_auth = user.social_auth.get()
    assert social_auth.extra_data["id_token"] == keycloak.id_token
    assert social_auth.extra_data["auth_time"] == int(local_datetime().timestamp())
    assert social_auth.extra_data["token_type"] == "bearer"
    assert social_auth.extra_data["refresh_token"] == "refreshed-refresh-token"
    assert social_auth.extra_data["access_token"] == "refreshed-access-token"


# ── Refresh token ──


def test_keycloak_client__refresh_token__anonymous_user(keycloak):
    session = {}

    token = KeyCloakClient.refresh_token(user=AnonymousUser(), session=session)

    assert token is None
    assert session == {}
    assert keycloak.token_requests == []


@patch_method(SentryLogger.log_message)
def test_keycloak_client__refresh_token__user_without_social_auth(keycloak):
    user = UserFactory.create()
    session = {}

    token = KeyCloakClient.refresh_token(user=user, session=session)

    assert token is None
    assert session == {}
    assert keycloak.token_requests == []

    SentryLogger.log_message.assert_called_once_with(
        "Unable to get `social_auth` for user.",
        details={"user": user.pk},
        level="error",
    )


@patch_method(SentryLogger.log_message)
def test_keycloak_client__refresh_token__expired_refresh_token(keycloak):
    user = UserFactory.create_profile_user()
    refresh_token = user.current_social_auth.extra_data["refresh_token"]
    keycloak.refresh_error_responses[refresh_token] = ResponseMock(
        json_data={"error": "invalid_grant"},
        status_code=400,
    )
    session = {}

    token = KeyCloakClient.refresh_token(user=user, session=session)

    assert token is None
    assert session == {"keycloak_refresh_token_expired": True}
    assert SentryLogger.log_message.call_count == 0

    social_auth = user.social_auth.get()
    assert social_auth.extra_data["refresh_token"] == refresh_token


@patch_method(SentryLogger.log_message)
def test_keycloak_client__refresh_token__other_error(keycloak):
    user = UserFactory.create_profile_user()
    refresh_token = user.current_social_auth.extra_data["refresh_token"]
    keycloak.refresh_error_responses[refresh_token] = ResponseMock(
        json_data={"error": "invalid_client"},
        status_code=401,
    )
    session = {}

    token = KeyCloakClient.refresh_token(user=user, session=session)

    assert token is None
    assert session == {}
    assert SentryLogger.log_message.call_count == 0


@patch_method(SentryLogger.log_message)
def test_keycloak_client__refresh_token__error_response_is_not_json(keycloak):
    user = UserFactory.create_profile_user()
    refresh_token = user.current_social_auth.extra_data["refresh_token"]

    error_response = MagicMock()
    error_response.text = "Bad Gateway"
    error_response.json.side_effect = ValueError("Not JSON")
    keycloak.refresh_error_responses[refresh_token] = error_response

    session = {}

    token = KeyCloakClient.refresh_token(user=user, session=session)

    assert token is None
    assert session == {}

    SentryLogger.log_message.assert_called_once_with(
        "Unable to refresh keycloak token",
        details={"user": user.pk, "error": "Bad Gateway"},
        level="error",
    )
