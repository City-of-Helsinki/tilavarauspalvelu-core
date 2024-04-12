from datetime import date
from typing import Any, NamedTuple

import pytest
from graphene_django_extensions.testing import parametrize_helper

from tests.factories import UserFactory
from tests.helpers import ResponseMock, patch_method
from users.helauth.clients import HelsinkiProfileClient
from users.helauth.pipeline import ssn_to_date, update_user_from_profile
from utils.sentry import SentryLogger

from .helpers import mock_request

pytestmark = [
    pytest.mark.django_db(),
]


class ErrorParams(NamedTuple):
    token: str | None
    profile_response: dict[str, Any]
    error_message: str


@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@patch_method(
    HelsinkiProfileClient.generic,
    return_value=ResponseMock(
        json_data={
            "data": {
                "myProfile": {
                    "id": "foo",
                    "verifiedPersonalInformation": {
                        "nationalIdentificationNumber": "010101A1234",
                    },
                },
            },
        }
    ),
)
def test_update_user_from_profile():
    # given:
    # - There is a user without profile info
    user = UserFactory.create(profile_id="", date_of_birth=None)

    # when:
    # - This user's info is updated from profile
    update_user_from_profile(mock_request(user))

    # then:
    # - The user's profile id and date of birth are updated
    user.refresh_from_db()
    assert user.profile_id == "foo"
    assert user.date_of_birth == date(2001, 1, 1)


@patch_method(SentryLogger.log_message)
@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "JWT fetch failed": ErrorParams(
                token=None,
                profile_response={},
                error_message="Helsinki profile: Could not fetch JWT from Tunnistamo for user",
            ),
            "Missing Profile ID": ErrorParams(
                token="x",
                profile_response={
                    "data": {
                        "myProfile": {
                            "id": None,
                        },
                    },
                },
                error_message="Helsinki profile: Profile ID not found for user",
            ),
            "Missing ID number": ErrorParams(
                token="x",
                profile_response={
                    "data": {
                        "myProfile": {
                            "id": "foo",
                            "verifiedPersonalInformation": {
                                "nationalIdentificationNumber": None,
                            },
                        },
                    },
                },
                error_message="Helsinki profile: ID number not found for user",
            ),
            "Missing verifiedPersonalInformation": ErrorParams(
                token="x",
                profile_response={
                    "data": {
                        "myProfile": {
                            "id": "foo",
                            "verifiedPersonalInformation": None,
                        },
                    },
                },
                error_message="Helsinki profile: ID number not found for user",
            ),
            "Invalid ID number": ErrorParams(
                token="x",
                profile_response={
                    "data": {
                        "myProfile": {
                            "id": "foo",
                            "verifiedPersonalInformation": {
                                "nationalIdentificationNumber": "foo",
                            },
                        },
                    },
                },
                error_message="Helsinki profile: ID number received from profile was not of correct format for user",
            ),
        },
    ),
)
def test_update_user_from_profile_logs_to_sentry_if_unsuccessful(token, profile_response, error_message):
    # given:
    # - There is a user without profile info
    user = UserFactory.create(profile_id="", date_of_birth=None)

    # when:
    # - This user's info is updated from profile
    patch_token = patch_method(HelsinkiProfileClient.get_token, return_value=token)
    patch_http = patch_method(HelsinkiProfileClient.generic, return_value=ResponseMock(json_data=profile_response))

    with patch_http, patch_token:
        update_user_from_profile(request=mock_request(user))

    assert SentryLogger.log_message.call_count == 1
    log_message = SentryLogger.log_message.mock_calls[0][1][0]
    assert log_message.startswith(error_message), log_message


@patch_method(SentryLogger.log_exception)
def test_update_user_from_profile_logs_to_sentry_if_raises():
    # given:
    # - There is a user without profile info
    user = UserFactory.create(profile_id="", date_of_birth=None)

    # when:
    # - This user's info is updated from profile
    patch_token = patch_method(HelsinkiProfileClient.get_token, return_value="x")
    patch_http = patch_method(
        HelsinkiProfileClient.generic,
        return_value=ResponseMock(json_data={"errors": [{"message": "foo"}]}),
    )

    with patch_http, patch_token:
        update_user_from_profile(request=mock_request(user))

    assert SentryLogger.log_exception.call_count == 1
    log_message = SentryLogger.log_exception.mock_calls[0][1][1]
    assert log_message == "Helsinki profile: Failed to update user from profile"
    log_message = SentryLogger.log_exception.mock_calls[0][1][0].args[0]
    assert log_message == 'Helsinki profile: Helsinki profile response contains errors. [{"message": "foo"}]'


@pytest.mark.parametrize(
    ("id_number", "expected"),
    [
        ("010101+1234", date(1801, 1, 1)),
        ("020201-1234", date(1901, 2, 2)),
        ("030301A1234", date(2001, 3, 3)),
        ("040401B1234", date(2001, 4, 4)),
        ("050501C1234", date(2001, 5, 5)),
        ("060601D1234", date(2001, 6, 6)),
        ("070701E1234", date(2001, 7, 7)),
        ("080801F1234", date(2001, 8, 8)),
        ("090901U1234", date(1901, 9, 9)),
        ("101001V1234", date(1901, 10, 10)),
        ("111101W1234", date(1901, 11, 11)),
        ("121201X1234", date(1901, 12, 12)),
        ("130101Y1234", date(1901, 1, 13)),
        ("010101H1234", None),
        ("010101-123", None),
        ("01010-12345", None),
        ("010101-", None),
    ],
)
def test_ssn_to_date(id_number, expected):
    assert ssn_to_date(id_number) == expected
