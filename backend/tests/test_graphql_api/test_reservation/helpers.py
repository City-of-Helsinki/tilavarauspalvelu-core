from __future__ import annotations

import datetime
from contextlib import contextmanager
from functools import partial
from typing import TYPE_CHECKING, Any

from graphene_django_extensions.testing import build_mutation, build_query

from tilavarauspalvelu.enums import ReservationCancelReasonChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from utils.date_utils import next_hour

from tests.factories import ReservationDenyReasonFactory
from tests.factories.helsinki_profile import MyProfileDataFactory
from tests.helpers import ResponseMock, patch_method

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation, ReservationUnit

reservation_query = partial(build_query, "reservation")
reservations_query = partial(build_query, "reservations", connection=True, order_by="pkAsc")

CREATE_MUTATION = build_mutation("createReservation", "ReservationCreateMutation")
UPDATE_MUTATION = build_mutation("updateReservation", "ReservationUpdateMutation")
DELETE_MUTATION = build_mutation("deleteTentativeReservation", "ReservationDeleteTentativeMutation", fields="deleted")
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

CHANGE_ACCESS_CODE_STAFF_MUTATION = build_mutation(
    "staffChangeReservationAccessCode",
    "ReservationStaffChangeAccessCodeMutation",
    fields="pk accessCodeIsActive accessCodeGeneratedAt",
)
REPAIR_ACCESS_CODE_STAFF_MUTATION = build_mutation(
    "staffRepairReservationAccessCode",
    "ReservationStaffRepairAccessCodeMutation",
    fields="pk accessCodeIsActive accessCodeGeneratedAt",
)


@contextmanager
def mock_profile_reader(**kwargs: Any):
    profile_data = MyProfileDataFactory.create_basic(**kwargs)
    response = ResponseMock(json_data={"data": {"myProfile": profile_data}})
    patch_http = patch_method(HelsinkiProfileClient.request, return_value=response)
    patch_token = patch_method(HelsinkiProfileClient.get_token, return_value="foo")

    with patch_http, patch_token:
        yield


def get_adjust_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    return {
        "pk": reservation.pk,
        "beginsAt": (reservation.begins_at + datetime.timedelta(hours=2)).isoformat(),
        "endsAt": (reservation.ends_at + datetime.timedelta(hours=2)).isoformat(),
        **overrides,
    }


def get_approve_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    return {
        "pk": reservation.pk,
        "handlingDetails": "You're welcome.",
        "price": "0",
        **overrides,
    }


def get_cancel_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    return {
        "pk": reservation.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        **overrides,
    }


def get_confirm_data(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    return {"pk": reservation.pk, **overrides}


def get_staff_create_data(
    reservation_unit: ReservationUnit,
    begins_at: datetime.datetime | None = None,
    ends_at: datetime.datetime | None = None,
    **overrides: Any,
) -> dict[str, Any]:
    if begins_at is None:
        begins_at = next_hour(plus_hours=1)
    if ends_at is None:
        ends_at = begins_at + datetime.timedelta(hours=1)

    return {
        "type": ReservationTypeChoice.STAFF,
        "beginsAt": begins_at.isoformat(),
        "endsAt": ends_at.isoformat(),
        "reservationUnit": reservation_unit.pk,
        **overrides,
    }


def get_create_data(
    reservation_unit: ReservationUnit,
    begins_at: datetime.datetime | None = None,
    ends_at: datetime.datetime | None = None,
    **overrides: Any,
) -> dict[str, Any]:
    if begins_at is None:
        begins_at = next_hour(plus_hours=1)
    if ends_at is None:
        ends_at = begins_at + datetime.timedelta(hours=1)

    return {
        "reservationUnit": reservation_unit.pk,
        "beginsAt": begins_at.isoformat(),
        "endsAt": ends_at.isoformat(),
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
    begins_at: datetime.datetime | None = None,
    ends_at: datetime.datetime | None = None,
    **overrides: Any,
) -> dict[str, Any]:
    if begins_at is None:
        begins_at = next_hour(plus_hours=1)
    if ends_at is None:
        ends_at = begins_at + datetime.timedelta(hours=1)

    return {
        "pk": reservation.pk,
        "beginsAt": begins_at.isoformat(),
        "endsAt": ends_at.isoformat(),
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
