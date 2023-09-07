from datetime import date
from typing import Any, NamedTuple
from unittest.mock import patch

import pytest
from django.conf import settings

from tests.factories import UserFactory
from tests.helpers import ResponseMock, parametrize_helper
from users.helauth.pipeline import id_number_to_date, update_user_from_profile


class ErrorParams(NamedTuple):
    oidc_response: dict[str, Any]
    profile_response: dict[str, Any]
    error_message: str


@pytest.mark.django_db
def test_update_user_from_profile():
    # given:
    # - There is a user without profile info
    user = UserFactory.create(
        profile_id="",
        date_of_birth=None,
    )

    # when:
    # - This user's info is updated from profile
    response_1 = ResponseMock(
        json_data={
            settings.OPEN_CITY_PROFILE_SCOPE: "x",
        },
    )
    response_2 = ResponseMock(
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
    with patch("users.helauth.pipeline.requests.get", side_effect=[response_1, response_2]):
        update_user_from_profile(user, oidc_access_token="")

    # then:
    # - The user's profile id and date of birth are updated
    assert user.profile_id == "foo"
    assert user.date_of_birth == date(2001, 1, 1)


@pytest.mark.django_db
@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "JWT fetch failed": ErrorParams(
                oidc_response={},
                profile_response={},
                error_message="Could not fetch JWT from Tunnistamo for user",
            ),
            "Missing Profile ID": ErrorParams(
                oidc_response={settings.OPEN_CITY_PROFILE_SCOPE: "x"},
                profile_response={
                    "data": {
                        "myProfile": {
                            "id": None,
                        },
                    },
                },
                error_message="Profile ID not found for user",
            ),
            "Missing ID number": ErrorParams(
                oidc_response={settings.OPEN_CITY_PROFILE_SCOPE: "x"},
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
                error_message="ID number not found for user",
            ),
            "Missing verifiedPersonalInformation": ErrorParams(
                oidc_response={settings.OPEN_CITY_PROFILE_SCOPE: "x"},
                profile_response={
                    "data": {
                        "myProfile": {
                            "id": "foo",
                            "verifiedPersonalInformation": None,
                        },
                    },
                },
                error_message="ID number not found for user",
            ),
            "Invalid ID number": ErrorParams(
                oidc_response={settings.OPEN_CITY_PROFILE_SCOPE: "x"},
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
                error_message="ID number received from profile was not of correct format for user",
            ),
            "Unexpected Errors": ErrorParams(
                oidc_response={settings.OPEN_CITY_PROFILE_SCOPE: "x"},
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
def test_update_user_from_profile_logs_to_sentry_if_unsuccessful(oidc_response, profile_response, error_message):
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
    response_1 = ResponseMock(json_data=oidc_response)
    response_2 = ResponseMock(json_data=profile_response)
    mock_requests = patch("users.helauth.pipeline.requests.get", side_effect=[response_1, response_2])
    mock_capture_message = patch("users.helauth.pipeline.capture_message")
    with mock_requests, mock_capture_message as mock:
        update_user_from_profile(user, oidc_access_token="")

    # then:
    # - The user's profile id and date of birth are updated
    assert mock.call_count == 1
    log_message = str(mock.mock_calls[0][1][0])
    assert log_message.startswith(error_message), log_message


@pytest.mark.parametrize(
    ["id_number", "expected"],
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
