import datetime
from contextlib import contextmanager
from functools import partial
from typing import Any

from graphene_django_extensions.testing import build_mutation, build_query

from tests.factories import ReservationCancelReasonFactory, ReservationDenyReasonFactory
from tests.factories.helsinki_profile import MyProfileDataFactory
from tests.helpers import ResponseMock, patch_method
from tilavarauspalvelu.enums import ReservationTypeChoice
from tilavarauspalvelu.models import Reservation, ReservationUnit
from tilavarauspalvelu.utils.helauth.clients import HelsinkiProfileClient
from utils.date_utils import next_hour

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
def mock_profile_reader(**kwargs: Any):
    profile_data = MyProfileDataFactory.create_basic(**kwargs)
    response = ResponseMock(json_data={"data": {"myProfile": profile_data}})
    patch_http = patch_method(HelsinkiProfileClient.generic, return_value=response)
    patch_token = patch_method(HelsinkiProfileClient.get_token, return_value="foo")

    with patch_http, patch_token:
        yield


def get_adjust_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
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
        "price": "10.59",
        **overrides,
    }


def get_cancel_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    reason = ReservationCancelReasonFactory.create()
    return {
        "pk": reservation.pk,
        "cancelReason": reason.pk,
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
        begin = next_hour(plus_hours=1)
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
        begin = next_hour(plus_hours=1)
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
        "denyReason": reason.pk,
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
        begin = next_hour(plus_hours=1)
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
