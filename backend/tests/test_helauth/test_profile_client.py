from __future__ import annotations

import datetime
import re
from typing import NamedTuple
from unittest.mock import MagicMock

import pytest
from django.contrib.auth.models import AnonymousUser
from freezegun import freeze_time
from graphene_django_extensions.testing import parametrize_helper

from tilavarauspalvelu.enums import MunicipalityChoice
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import local_datetime
from utils.external_service.errors import (
    ExternalServiceError,
    ExternalServiceParseJSONError,
    ExternalServiceRequestError,
)

from tests.factories import UserFactory
from tests.factories.helsinki_profile import (
    MyProfileDataFactory,
    ProfileAddressFactory,
    ProfileEmailFactory,
    ProfilePhoneFactory,
)
from tests.helpers import ResponseMock, exact, patch_method

from .helpers import UMA_TICKET_GRANT, ErrorResponse, TokenRequest

pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


class Params(NamedTuple):
    types: list[str]
    select: int


# ── Reservation prefill info ──


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__all_primary():
    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info == {
        "reservee_first_name": "Example",
        "reservee_last_name": "User",
        "reservee_email": "user@example.com",
        "reservee_phone": "0123456789",
        "reservee_address_zip": "00100",
        "municipality": MunicipalityChoice.HELSINKI.value,
    }


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@pytest.mark.parametrize(
    **parametrize_helper({
        "HOME address": Params(
            types=["NONE", "OTHER", "WORK", "HOME"],
            select=-1,
        ),
        "WORK address": Params(
            types=["NONE", "OTHER", "WORK"],
            select=-1,
        ),
        "OTHER address": Params(
            types=["NONE", "OTHER"],
            select=-1,
        ),
        "NONE address": Params(
            types=["NONE"],
            select=-1,
        ),
        "highest priority address not last": Params(
            types=["NONE", "HOME", "OTHER", "WORK"],
            select=1,
        ),
    })
)
def test_helsinki_profile_client__prefill_info__highest_priority_address(types, select):
    addresses = [ProfileAddressFactory.create(addressType=type_) for type_ in types]

    profile_data = MyProfileDataFactory.create_basic(primaryAddress=None, addresses=addresses)
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_address_zip"] == addresses[select]["postalCode"]


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__permanent_address():
    profile_data = MyProfileDataFactory.create_basic(
        primaryAddress=None,
        addresses=[],
        verifiedPersonalInformation__permanentAddress__streetAddress="Permanent street 1",
        verifiedPersonalInformation__permanentAddress__postalCode="00100",
        verifiedPersonalInformation__permanentAddress__postOffice="Helsinki",
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_address_zip"] == "00100"


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__permanent_foreign_address():
    profile_data = MyProfileDataFactory.create_basic(
        primaryAddress=None,
        addresses=[],
        verifiedPersonalInformation__permanentAddress=None,
        verifiedPersonalInformation__permanentForeignAddress__streetAddress="Foreign street 1",
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_address_zip"] is None


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__no_address():
    profile_data = MyProfileDataFactory.create_basic(
        primaryAddress=None,
        addresses=[],
        verifiedPersonalInformation__permanentAddress=None,
        verifiedPersonalInformation__permanentForeignAddress=None,
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_address_zip"] is None


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@pytest.mark.parametrize(
    **parametrize_helper({
        "MOBILE phone": Params(
            types=["NONE", "OTHER", "WORK", "HOME", "MOBILE"],
            select=-1,
        ),
        "HOME phone": Params(
            types=["NONE", "OTHER", "WORK", "HOME"],
            select=-1,
        ),
        "WORK phone": Params(
            types=["NONE", "OTHER", "WORK"],
            select=-1,
        ),
        "OTHER phone": Params(
            types=["NONE", "OTHER"],
            select=-1,
        ),
        "NONE phone": Params(
            types=["NONE"],
            select=-1,
        ),
        "highest priority phone not last": Params(
            types=["NONE", "OTHER", "MOBILE", "WORK", "HOME"],
            select=2,
        ),
    })
)
def test_helsinki_profile_client__prefill_info__highest_priority_phone(types, select):
    phones = [ProfilePhoneFactory.create(phoneType=type_) for type_ in types]

    profile_data = MyProfileDataFactory.create_basic(primaryPhone=None, phones=phones)
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_phone"] == phones[select]["phone"]


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__no_phone():
    profile_data = MyProfileDataFactory.create_basic(primaryPhone=None, phones=[])
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_phone"] is None


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@pytest.mark.parametrize(
    **parametrize_helper({
        "PERSONAL email": Params(
            types=["NONE", "OTHER", "WORK", "PERSONAL"],
            select=-1,
        ),
        "WORK email": Params(
            types=["NONE", "OTHER", "WORK"],
            select=-1,
        ),
        "OTHER email": Params(
            types=["NONE", "OTHER"],
            select=-1,
        ),
        "NONE email": Params(
            types=["NONE"],
            select=-1,
        ),
        "highest priority email not last": Params(
            types=["NONE", "PERSONAL", "OTHER", "WORK"],
            select=1,
        ),
    })
)
def test_helsinki_profile_client__prefill_info__highest_priority_email(types, select):
    emails = [ProfileEmailFactory.create(emailType=type_) for type_ in types]

    profile_data = MyProfileDataFactory.create_basic(primaryEmail=None, emails=emails)
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_email"] == emails[select]["email"]


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__no_email():
    profile_data = MyProfileDataFactory.create_basic(primaryEmail=None, emails=[])
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_email"] is None


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__municipality_matching_municipality_number():
    profile_data = MyProfileDataFactory.create_basic(
        verifiedPersonalInformation__municipalityOfResidenceNumber=MunicipalityChoice.HELSINKI.code,
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["municipality"] == MunicipalityChoice.HELSINKI.value


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__municipality_matching_municipality_name():
    profile_data = MyProfileDataFactory.create_basic(
        verifiedPersonalInformation__municipalityOfResidence=MunicipalityChoice.HELSINKI.value,
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["municipality"] == MunicipalityChoice.HELSINKI.value


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__unknown_municipality_is_other():
    profile_data = MyProfileDataFactory.create_basic(
        verifiedPersonalInformation__municipalityOfResidence="foo",
        verifiedPersonalInformation__municipalityOfResidenceNumber="bar",
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["municipality"] == MunicipalityChoice.OTHER.value


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@patch_method(SentryLogger.log_message)
@pytest.mark.parametrize("status_code", [400, 500])
def test_helsinki_profile_client__prefill_info__non_200_response(status_code):
    response = MagicMock()
    response.status_code = status_code
    response.request = MagicMock()
    response.request.method = "get"
    response.url = "example.com"

    HelsinkiProfileClient.request.return_value = response

    user = UserFactory.create()

    msg = f"GET request to HELSINKI PROFILE (example.com) failed with status {status_code}."
    with pytest.raises(ExternalServiceRequestError, match=exact(msg)):
        HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert SentryLogger.log_message.call_count == 1


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@patch_method(SentryLogger.log_message)
def test_helsinki_profile_client__prefill_info__contains_errors():
    profile_data = MyProfileDataFactory.create_basic()

    HelsinkiProfileClient.request.return_value = ResponseMock(
        json_data={
            "data": {"myProfile": profile_data},
            "errors": [{"message": "foo"}],
        }
    )

    user = UserFactory.create()

    msg = 'Helsinki profile: Response contains errors. [{"message": "foo"}]'
    with pytest.raises(ExternalServiceError, match=exact(msg)):
        HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert SentryLogger.log_message.call_count == 1


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__json_decode_error():
    response = MagicMock()
    response.status_code = 200
    response.json.side_effect = ValueError("foo")

    HelsinkiProfileClient.request.return_value = response

    user = UserFactory.create()

    msg = "Parsing Helsinki Profile return data failed."
    with pytest.raises(ExternalServiceParseJSONError, match=exact(msg)):
        HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})


@patch_method(HelsinkiProfileClient.get_token, return_value=None)
def test_helsinki_profile_client__prefill_info__no_token():
    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})
    assert prefill_info is None


# ── User profile info ──


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__user_profile_info__queries_only_requested_fields():
    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    user = UserFactory.create_profile_user(profile_id="profile-id")
    profile_info = HelsinkiProfileClient.get_user_profile_info(
        user=user,
        request_user=user,
        session={},
        fields=["email"],
    )

    assert profile_info["email"] == "user@example.com"

    query = HelsinkiProfileClient.request.call_args.kwargs["json"]["query"]
    match = re.fullmatch(
        r'query \{ profile\(id:"profile-id"\) \{ (?P<selections>[^{}]*) \} \}(?P<fragments>.*)',
        query,
        flags=re.DOTALL,
    )
    assert match is not None, query

    selections = sorted(match["selections"].split())
    assert selections == ["...Emails", "...PrimaryEmail"]

    fragment_names = sorted(re.findall(r"fragment (\w+) on", match["fragments"]))
    assert fragment_names == ["Emails", "PrimaryEmail"]


# ── Token ──


def test_helsinki_profile_client__ensure_token_valid__anonymous_user(keycloak):
    session = {}

    is_valid = HelsinkiProfileClient.ensure_token_valid(user=AnonymousUser(), session=session)

    assert is_valid is False
    assert session == {}
    assert keycloak.token_requests == []


def test_helsinki_profile_client__ensure_token_valid__valid_token_in_session(keycloak):
    user = UserFactory.create_profile_user()
    session = {
        "profile_access_token": "session-profile-access-token",
        "profile_access_token_expires_at": local_datetime() + datetime.timedelta(minutes=5),
    }

    is_valid = HelsinkiProfileClient.ensure_token_valid(user=user, session=session)

    assert is_valid is True
    assert keycloak.token_requests == []


@freeze_time("2024-01-01T12:00:00+02:00")
def test_helsinki_profile_client__get_token__refresh_with_profile_refresh_token(keycloak):
    user = UserFactory.create_profile_user()
    session = {
        "profile_access_token": "session-profile-access-token",
        "profile_access_token_expires_at": local_datetime() - datetime.timedelta(minutes=5),
        "profile_refresh_token": "session-profile-refresh-token",
        "profile_refresh_token_expires_at": local_datetime() + datetime.timedelta(minutes=5),
    }

    token = HelsinkiProfileClient.get_token(user=user, session=session)

    assert token == "profile-access-token"
    assert keycloak.token_requests == [
        TokenRequest(grant_type="refresh_token", token="session-profile-refresh-token"),
        TokenRequest(grant_type=UMA_TICKET_GRANT, token="refreshed-access-token"),
    ]
    assert session == {
        "profile_access_token": "profile-access-token",
        "profile_access_token_expires_at": local_datetime(2024, 1, 1, 12, 5),
        "profile_refresh_token": "profile-refresh-token",
        "profile_refresh_token_expires_at": local_datetime(2024, 1, 1, 12, 30),
    }


def test_helsinki_profile_client__get_token__profile_refresh_token_rejected__use_keycloak_refresh_token(keycloak):
    user = UserFactory.create_profile_user()
    keycloak_refresh_token = user.current_social_auth.extra_data["refresh_token"]
    keycloak.refresh_error_responses["session-profile-refresh-token"] = ErrorResponse(
        status_code=400,
        error="invalid_grant",
    )
    session = {
        "profile_refresh_token": "session-profile-refresh-token",
        "profile_refresh_token_expires_at": local_datetime() + datetime.timedelta(minutes=5),
    }

    token = HelsinkiProfileClient.get_token(user=user, session=session)

    assert token == "profile-access-token"
    assert keycloak.token_requests == [
        TokenRequest(grant_type="refresh_token", token="session-profile-refresh-token"),
        TokenRequest(grant_type="refresh_token", token=keycloak_refresh_token),
        TokenRequest(grant_type=UMA_TICKET_GRANT, token="refreshed-access-token"),
    ]
    assert session["profile_access_token"] == "profile-access-token"
    assert session["keycloak_access_token"] == "refreshed-access-token"


@patch_method(SentryLogger.log_message)
def test_helsinki_profile_client__get_token__profile_and_keycloak_refresh_tokens_rejected(keycloak):
    user = UserFactory.create_profile_user()
    keycloak_refresh_token = user.current_social_auth.extra_data["refresh_token"]
    keycloak.refresh_error_responses["session-profile-refresh-token"] = ErrorResponse(
        status_code=400,
        error="invalid_grant",
    )
    keycloak.refresh_error_responses[keycloak_refresh_token] = ErrorResponse(status_code=400, error="invalid_grant")
    session = {
        "profile_refresh_token": "session-profile-refresh-token",
        "profile_refresh_token_expires_at": local_datetime() + datetime.timedelta(minutes=5),
    }

    token = HelsinkiProfileClient.get_token(user=user, session=session)

    assert token is None
    assert keycloak.token_requests == [
        TokenRequest(grant_type="refresh_token", token="session-profile-refresh-token"),
        TokenRequest(grant_type="refresh_token", token=keycloak_refresh_token),
    ]
    assert session["keycloak_refresh_token_expired"] is True
    assert "profile_access_token" not in session

    SentryLogger.log_message.assert_called_once_with(
        "Unable to refresh Helsinki profile token",
        details={
            "user": user.pk,
            "code": "reauthentication_required",
            "provider_code": "invalid_grant",
            "status_code": 400,
            "detail": "",
        },
        level="warning",
    )


def test_helsinki_profile_client__get_token__expired_profile_refresh_token__use_keycloak_token(keycloak):
    user = UserFactory.create_profile_user()
    session = {
        "profile_refresh_token": "session-profile-refresh-token",
        "profile_refresh_token_expires_at": local_datetime() - datetime.timedelta(minutes=5),
        "keycloak_access_token": "session-keycloak-access-token",
        "keycloak_access_token_expires_at": local_datetime() + datetime.timedelta(minutes=5),
    }

    token = HelsinkiProfileClient.get_token(user=user, session=session)

    assert token == "profile-access-token"
    assert keycloak.token_requests == [
        TokenRequest(grant_type=UMA_TICKET_GRANT, token="session-keycloak-access-token"),
    ]
    assert session["profile_access_token"] == "profile-access-token"


@patch_method(SentryLogger.log_message)
def test_helsinki_profile_client__get_token__no_profile_refresh_token__no_keycloak_token(keycloak):
    user = UserFactory.create()
    session = {}

    token = HelsinkiProfileClient.get_token(user=user, session=session)

    assert token is None
    assert keycloak.token_requests == []
    assert session == {}


@patch_method(SentryLogger.log_message)
def test_helsinki_profile_client__get_token__profile_token_request_rejected(keycloak):
    user = UserFactory.create_profile_user()
    keycloak.profile_token_error_response = ErrorResponse(status_code=403, text="Access denied")
    session = {
        "keycloak_access_token": "session-keycloak-access-token",
        "keycloak_access_token_expires_at": local_datetime() + datetime.timedelta(minutes=5),
    }

    token = HelsinkiProfileClient.get_token(user=user, session=session)

    assert token is None
    assert keycloak.token_requests == [
        TokenRequest(grant_type=UMA_TICKET_GRANT, token="session-keycloak-access-token"),
    ]
    assert "profile_access_token" not in session

    SentryLogger.log_message.assert_called_once_with(
        "Unable to get Helsinki profile token",
        details={"user": user.pk, "code": "http_error", "provider_code": None, "status_code": 403, "detail": ""},
        level="warning",
    )


def test_helsinki_profile_client__refresh_token__anonymous_user(keycloak):
    session = {}

    token = HelsinkiProfileClient.refresh_token(user=AnonymousUser(), session=session)

    assert token is None
    assert session == {}
    assert keycloak.token_requests == []
