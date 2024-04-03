import datetime
from contextlib import contextmanager
from functools import partial
from typing import Any
from unittest.mock import patch

from graphene_django_extensions.testing import build_mutation, build_query

from common.date_utils import local_datetime
from reservation_units.models import ReservationUnit
from reservations.choices import ReservationTypeChoice
from reservations.models import Reservation
from tests.factories import ReservationCancelReasonFactory, ReservationDenyReasonFactory
from tests.helpers import ResponseMock

reservation_query = partial(build_query, "reservation")
reservations_query = partial(build_query, "reservations", connection=True, order_by="pkAsc")

CREATE_MUTATION = build_mutation("createReservation", "ReservationCreateMutation")
UPDATE_MUTATION = build_mutation("updateReservation", "ReservationUpdateMutation")
DELETE_MUTATION = build_mutation("deleteReservation", "ReservationDeleteMutation", fields="deleted")
ADJUST_MUTATION = build_mutation("adjustReservationTime", "ReservationAdjustTimeMutation")
APPROVE_MUTATION = build_mutation("approveReservation", "ReservationApproveMutation")
DENY_MUTATION = build_mutation("denyReservation", "ReservationDenyMutation")
CANCEL_MUTATION = build_mutation("cancelReservation", "ReservationCancellationMutation")
CONFIRM_MUTATION = build_mutation("confirmReservation", "ReservationConfirmMutation")
REFUND_MUTATION = build_mutation("refundReservation", "ReservationRefundMutation")
REQUIRE_HANDLING_MUTATION = build_mutation("requireHandlingForReservation", "ReservationRequiresHandlingMutation")
CREATE_STAFF_MUTATION = build_mutation("createStaffReservation", "ReservationStaffCreateMutation")
UPDATE_STAFF_MUTATION = build_mutation("staffReservationModify", "ReservationStaffModifyMutation")
ADJUST_STAFF_MUTATION = build_mutation("staffAdjustReservationTime", "ReservationStaffAdjustTimeMutation")
UPDATE_WORKING_MEMO_MUTATION = build_mutation("updateReservationWorkingMemo", "ReservationWorkingMemoMutation")


@contextmanager
def mock_profile_reader(profile_data: dict[str, Any] | None = None, **kwargs: Any):
    if profile_data is None:
        profile_data = {
            "firstName": "John",
            "lastName": "Doe",
            "primaryAddress": {
                "postalCode": "00100",
                "address": "Test street 1",
                "city": "Helsinki",
                "addressType": "HOME",
            },
            "primaryPhone": {
                "phone": "123456789",
            },
            "verifiedPersonalInformation": {
                "municipalityOfResidence": "Helsinki",
                "municipalityOfResidenceNumber": "12345",
            },
        }

    profile_data.update(kwargs)
    data = {"data": {"myProfile": profile_data}}

    response = ResponseMock(status_code=200, json_data=data)
    get_from_profile = "users.utils.open_city_profile.basic_info_resolver.requests.get"
    get_profile_token = "users.utils.open_city_profile.mixins.get_profile_token"  # noqa: S105
    with patch(get_from_profile, return_value=response) as mock, patch(get_profile_token, return_value="token"):
        yield mock


def next_hour(hours: int = 0, *, minutes: int = 0, days: int = 0) -> datetime.datetime:
    """
    Return a timestamp for the next hour.

    Without any arguments, the timestamp will be for the next full hour, any additional arguments will be added to that.
    e.g.
    Now the time is 12:30
    next_hour() -> 13:00
    next_hour(hours=1, minutes=30) -> 14:30
    """
    now = local_datetime()
    return now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(
        hours=1 + hours, minutes=minutes, days=days
    )


def get_adjust_data(
    reservation: Reservation,
    **overrides: Any,
) -> dict[str, Any]:
    return {
        "pk": reservation.pk,
        "begin": (reservation.begin + datetime.timedelta(hours=2)).isoformat(),
        "end": (reservation.end + datetime.timedelta(hours=2)).isoformat(),
        **overrides,
    }


def get_approve_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    return {
        "pk": reservation.pk,
        "handlingDetails": "You're welcome.",
        "price": 10.59,
        "priceNet": 8.61,
        **overrides,
    }


def get_cancel_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    reason = ReservationCancelReasonFactory.create()
    return {
        "pk": reservation.pk,
        "cancelReasonPk": reason.pk,
        **overrides,
    }


def get_confirm_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    return {"pk": reservation.pk, **overrides}


def get_staff_create_data(
    reservation_unit: ReservationUnit,
    begin: datetime.datetime | None = None,
    end: datetime.datetime | None = None,
    **overrides: Any,
) -> dict[str, Any]:
    if begin is None:
        begin = next_hour(1)
    if end is None:
        end = begin + datetime.timedelta(hours=1)

    return {
        "type": ReservationTypeChoice.STAFF,
        "begin": begin.isoformat(),
        "end": end.isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
        **overrides,
    }


def get_create_data(
    reservation_unit: ReservationUnit,
    begin: datetime.datetime | None = None,
    end: datetime.datetime | None = None,
    **overrides: Any,
) -> dict[str, Any]:
    if begin is None:
        begin = next_hour(1)
    if end is None:
        end = begin + datetime.timedelta(hours=1)

    return {
        "begin": begin.isoformat(),
        "end": end.isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
        **overrides,
    }


def get_update_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    return {
        "pk": reservation.pk,
        "name": "foo",
        **overrides,
    }


def get_delete_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    return {"pk": reservation.id, **overrides}


def get_deny_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    reason = ReservationDenyReasonFactory.create()
    return {
        "pk": reservation.pk,
        "handlingDetails": "foo",
        "denyReasonPk": reason.pk,
        **overrides,
    }


def get_refund_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    return {
        "pk": reservation.pk,
        **overrides,
    }


def get_require_handling_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    return {
        "pk": reservation.pk,
        **overrides,
    }


def get_staff_adjust_data(
    reservation: Reservation,
    begin: datetime.datetime | None = None,
    end: datetime.datetime | None = None,
    **overrides: Any,
) -> dict[str, Any]:
    if begin is None:
        begin = next_hour(1)
    if end is None:
        end = begin + datetime.timedelta(hours=1)

    return {
        "pk": reservation.pk,
        "begin": begin.isoformat(),
        "end": end.isoformat(),
        **overrides,
    }


def get_staff_modify_data(reservation: Reservation, **override: Any) -> dict[str, Any]:
    return {
        "pk": reservation.pk,
        "name": "foo",
        **override,
    }


def get_working_memo_update_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    return {
        "pk": reservation.pk,
        "workingMemo": "I'm looking into this",
        **overrides,
    }
