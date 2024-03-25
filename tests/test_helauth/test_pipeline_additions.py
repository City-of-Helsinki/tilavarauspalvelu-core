from datetime import date
from typing import Any, NamedTuple
from unittest.mock import patch

import pytest
from graphene_django_extensions.testing import parametrize_helper

from tests.factories import UserFactory
from tests.helpers import ResponseMock, patch_method
from users.helauth.pipeline import id_number_to_date, update_user_from_profile
from utils.sentry import SentryLogger


class ErrorParams(NamedTuple):
    token: str | None
    profile_response: dict[str, Any]
    error_message: str


@pytest.mark.django_db()
def test_update_user_from_profile():
    # given:
    # - There is a user without profile info
    user = UserFactory.create(
        profile_id="",
        date_of_birth=None,
    )

    # when:
    # - This user's info is updated from profile
    mock_1 = ResponseMock(
        json_data={
            "data": {
                "myProfile": {
                    "id": "foo",
                    "verifiedPersonalInformation": {
                        "nationalIdentificationNumber": "010101A1234",
                    },
                },
            },
        },
    )
    with patch("users.helauth.pipeline.requests.get", return_value=mock_1):
        update_user_from_profile(user, token="x")

    # then:
    # - The user's profile id and date of birth are updated
    assert user.profile_id == "foo"
    assert user.date_of_birth == date(2001, 1, 1)


@pytest.mark.django_db()
@patch_method(SentryLogger.log_message)
@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "JWT fetch failed": ErrorParams(
                token=None,
                profile_response={},
                error_message="Helsinki-profiili: Could not fetch JWT from Tunnistamo for user",
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
                error_message="Helsinki-profiili: Profile ID not found for user",
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
                error_message="Helsinki-profiili: ID number not found for user",
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
                error_message="Helsinki-profiili: ID number not found for user",
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
                error_message="Helsinki-profiili: ID number received from profile was not of correct format for user",
            ),
            "Unexpected Errors": ErrorParams(
                token="x",
                profile_response={
                    "errors": [
                        {
                            "message": "foo",
                        },
                    ],
                },
                error_message="foo",
            ),
        },
    ),
)
def test_update_user_from_profile_logs_to_sentry_if_unsuccessful(token, profile_response, error_message):
    # given:
    # - There is a user without profile info
    user = UserFactory.create(
        first_name="foo",
        last_name="bar",
        profile_id="",
        date_of_birth=None,
    )

    # when:
    # - This user's info is updated from profile
    response = ResponseMock(json_data=profile_response)
    mock_requests_get = patch("users.helauth.pipeline.requests.get", return_value=response)
    with mock_requests_get:
        update_user_from_profile(user, token=token)

    assert SentryLogger.log_message.call_count == 1
    log_message = SentryLogger.log_message.mock_calls[0][1][0]
    assert log_message.startswith(error_message), log_message


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
def test_id_number_to_date(id_number, expected):
    assert id_number_to_date(id_number) == expected
