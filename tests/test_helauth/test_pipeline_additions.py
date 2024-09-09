import re
from datetime import date
from typing import Any, NamedTuple

import pytest

from tests.factories import (
    ApplicationFactory,
    GeneralRoleFactory,
    RecurringReservationFactory,
    ReservationFactory,
    UnitRoleFactory,
    UserFactory,
)
from tests.helpers import ResponseMock, patch_method
from users.helauth.clients import HelsinkiProfileClient
from users.helauth.parsers import ssn_to_date
from users.helauth.pipeline import migrate_from_tunnistamo_to_keycloak, update_user_from_profile
from utils.external_service.errors import ExternalServiceError
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


@patch_method(HelsinkiProfileClient.get_token, return_value=None)
@patch_method(HelsinkiProfileClient.generic, return_value=ResponseMock(json_data={}))
@patch_method(SentryLogger.log_message)
def test_update_user_from_profile_logs_to_sentry_if_unsuccessful():
    # given:
    # - There is a user without profile info
    user = UserFactory.create(profile_id="", date_of_birth=None)

    # when:
    # - This user's info is updated from profile
    update_user_from_profile(request=mock_request(user))

    assert SentryLogger.log_message.call_count == 1
    log_message = SentryLogger.log_message.mock_calls[0][1][0]
    assert log_message == "Helsinki profile: Could not fetch JWT from Tunnistamo."


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.generic, return_value=ResponseMock(json_data={"errors": [{"message": "foo"}]}))
@patch_method(SentryLogger.log_exception)
@patch_method(SentryLogger.log_message)
def test_update_user_from_profile_logs_to_sentry_if_raises():
    user = UserFactory.create(profile_id="", date_of_birth=None)

    msg = "Helsinki profile: Response contains errors."
    with pytest.raises(ExternalServiceError, match=re.escape(msg)):
        update_user_from_profile(request=mock_request(user))

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_exception.call_count == 1


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


# TODO: Test "users.helauth.pipeline.migrate_from_tunnistamo_to_keycloak"


def test_migrate_from_tunnistamo_to_keycloak():
    old_user = UserFactory.create(email="foo@example.com", profile_id="", is_staff=True, is_superuser=True)

    application = ApplicationFactory.create(user=old_user)
    reservation = ReservationFactory.create(user=old_user)
    recurring_reservation = RecurringReservationFactory.create(user=old_user)
    general_role = GeneralRoleFactory.create(user=old_user)
    unit_role = UnitRoleFactory.create(user=old_user)

    new_user = UserFactory.create(email="foo@example.com", profile_id="", is_staff=False, is_superuser=False)

    migrate_from_tunnistamo_to_keycloak(email=new_user.email)

    application.refresh_from_db()
    reservation.refresh_from_db()
    recurring_reservation.refresh_from_db()
    general_role.refresh_from_db()
    unit_role.refresh_from_db()
    old_user.refresh_from_db()
    new_user.refresh_from_db()

    assert application.user == new_user
    assert reservation.user == new_user
    assert recurring_reservation.user == new_user
    assert general_role.user == new_user
    assert unit_role.user == new_user

    assert new_user.is_staff is True
    assert new_user.is_superuser is True

    assert old_user.is_active is False
