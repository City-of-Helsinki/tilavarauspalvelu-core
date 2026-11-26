from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

import freezegun
import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraConflictError
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraAccessCodeModifyResponse
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import local_datetime

from tests.factories import ApplicationSectionFactory, ReservationFactory, ReservationSeriesFactory, UserFactory
from tests.helpers import as_mock, patch_method

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection, Reservation, ReservationSeries

pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


# The unused argument matches how the service calls the mocked client methods. This lets it be their side effect.
def access_code_response(
    target: Reservation | ReservationSeries | ApplicationSection | None = None,
    /,
    *,
    is_active: bool,
) -> PindoraAccessCodeModifyResponse:
    return PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2024, 1, 1),
        access_code_is_active=is_active,
    )


# ── Reservation ──


@patch_method(PindoraClient.create_reservation, side_effect=access_code_response)
@patch_method(EmailService.send_reservation_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__reservation() -> None:
    reservation = ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation).call_count == 1
    assert as_mock(PindoraClient.create_reservation).call_args.args == (reservation,)

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is True

    assert as_mock(EmailService.send_reservation_access_type_changed_email).call_count == 1
    assert as_mock(EmailService.send_reservation_access_type_changed_email).call_args.kwargs == {
        "reservation": reservation
    }


@patch_method(PindoraClient.create_reservation, side_effect=access_code_response)
@patch_method(EmailService.send_reservation_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__reservation__as_inactive() -> None:
    reservation = ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation).call_count == 1
    assert as_mock(PindoraClient.create_reservation).call_args.args == (reservation,)

    assert as_mock(PindoraClient.create_reservation).call_args.kwargs == {"is_active": False}

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is False

    assert as_mock(EmailService.send_reservation_access_type_changed_email).call_count == 0


@patch_method(PindoraClient.create_reservation, side_effect=access_code_response)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__reservation__not_confirmed() -> None:
    reservation = ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation).call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False


@patch_method(PindoraClient.create_reservation, side_effect=access_code_response)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__reservation__already_generated() -> None:
    reservation = ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation).call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is False


@patch_method(PindoraClient.create_reservation, side_effect=PindoraConflictError("conflict"))
@patch_method(
    PindoraClient.get_reservation,
    return_value={
        "reservation_unit_id": uuid.uuid4(),
        "access_code": "1234",
        "access_code_keypad_url": "1234",
        "access_code_phone_number": "1234",
        "access_code_sms_number": "1234",
        "access_code_sms_message": "1234",
        "access_code_valid_minutes_before": 0,
        "access_code_valid_minutes_after": 0,
        "access_code_generated_at": local_datetime(2023, 12, 31),
        "access_code_is_active": True,
        "begin": local_datetime(2024, 1, 1, 12),
        "end": local_datetime(2024, 1, 1, 13),
    },
)
@patch_method(EmailService.send_reservation_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__reservation__get_if_exists() -> None:
    reservation = ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_unit__access_types__access_type=AccessType.ACCESS_CODE,
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation).call_count == 1
    assert as_mock(PindoraClient.get_reservation).call_count == 1
    assert as_mock(PindoraClient.get_reservation).call_args.args == (reservation,)

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2023, 12, 31)
    assert reservation.access_code_is_active is True

    assert as_mock(EmailService.send_reservation_access_type_changed_email).call_count == 1
    assert as_mock(EmailService.send_reservation_access_type_changed_email).call_args.kwargs == {
        "reservation": reservation
    }


# ── Reservation series ──


@patch_method(PindoraClient.create_reservation_series, side_effect=access_code_response)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series() -> None:
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation_series).call_count == 1
    assert as_mock(PindoraClient.create_reservation_series).call_args.args == (series,)

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is True


@patch_method(PindoraClient.create_reservation_series, side_effect=access_code_response)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series__as_inactive() -> None:
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation_series).call_count == 1
    assert as_mock(PindoraClient.create_reservation_series).call_args.args == (series,)

    assert as_mock(PindoraClient.create_reservation_series).call_args.kwargs == {"is_active": False}

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False


@patch_method(PindoraClient.create_reservation_series, side_effect=access_code_response)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series__not_confirmed() -> None:
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation_series).call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False


@patch_method(PindoraClient.create_reservation_series, side_effect=access_code_response)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series__already_generated() -> None:
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation_series).call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is False


@patch_method(PindoraClient.create_reservation_series, side_effect=PindoraConflictError("conflict"))
@patch_method(PindoraClient.reschedule_reservation_series, return_value=access_code_response(is_active=True))
@patch_method(PindoraClient.activate_reservation_series_access_code)
@patch_method(PindoraClient.deactivate_reservation_series_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series__reschedule_if_exists() -> None:
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation_series).call_count == 1
    assert as_mock(PindoraClient.reschedule_reservation_series).call_count == 1
    assert as_mock(PindoraClient.reschedule_reservation_series).call_args.args == (series,)
    assert as_mock(PindoraClient.activate_reservation_series_access_code).call_count == 0
    assert as_mock(PindoraClient.deactivate_reservation_series_access_code).call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is True


@patch_method(PindoraClient.create_reservation_series, side_effect=PindoraConflictError("conflict"))
@patch_method(PindoraClient.reschedule_reservation_series, return_value=access_code_response(is_active=False))
@patch_method(PindoraClient.activate_reservation_series_access_code)
@patch_method(PindoraClient.deactivate_reservation_series_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series__reschedule_if_exists__activate() -> None:
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation_series).call_count == 1
    assert as_mock(PindoraClient.reschedule_reservation_series).call_count == 1
    assert as_mock(PindoraClient.reschedule_reservation_series).call_args.args == (series,)
    assert as_mock(PindoraClient.activate_reservation_series_access_code).call_count == 1
    assert as_mock(PindoraClient.activate_reservation_series_access_code).call_args.args == (series,)
    assert as_mock(PindoraClient.deactivate_reservation_series_access_code).call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is True


@patch_method(PindoraClient.create_reservation_series, side_effect=PindoraConflictError("conflict"))
@patch_method(PindoraClient.reschedule_reservation_series, return_value=access_code_response(is_active=True))
@patch_method(PindoraClient.activate_reservation_series_access_code)
@patch_method(PindoraClient.deactivate_reservation_series_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series__reschedule_if_exists__deactivate() -> None:
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_reservation_series).call_count == 1
    assert as_mock(PindoraClient.reschedule_reservation_series).call_count == 1
    assert as_mock(PindoraClient.reschedule_reservation_series).call_args.args == (series,)
    assert as_mock(PindoraClient.activate_reservation_series_access_code).call_count == 0
    assert as_mock(PindoraClient.deactivate_reservation_series_access_code).call_count == 1
    assert as_mock(PindoraClient.deactivate_reservation_series_access_code).call_args.args == (series,)

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False


# ── Seasonal booking ──


@patch_method(PindoraClient.create_seasonal_booking, side_effect=access_code_response)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking() -> None:
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_seasonal_booking).call_count == 1
    assert as_mock(PindoraClient.create_seasonal_booking).call_args.args == (section,)

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is True

    assert as_mock(EmailService.send_seasonal_booking_access_type_changed_email).call_count == 1


@patch_method(PindoraClient.create_seasonal_booking, side_effect=access_code_response)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking__as_inactive() -> None:
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_seasonal_booking).call_count == 1
    assert as_mock(PindoraClient.create_seasonal_booking).call_args.args == (section,)

    assert as_mock(PindoraClient.create_seasonal_booking).call_args.kwargs == {"is_active": False}

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False

    assert as_mock(EmailService.send_seasonal_booking_access_type_changed_email).call_count == 0


@patch_method(PindoraClient.create_seasonal_booking, side_effect=access_code_response)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking__not_confirmed() -> None:
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_seasonal_booking).call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False


@patch_method(PindoraClient.create_seasonal_booking, side_effect=access_code_response)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking__already_generated() -> None:
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_seasonal_booking).call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is False


@patch_method(PindoraClient.create_seasonal_booking, side_effect=PindoraConflictError("conflict"))
@patch_method(PindoraClient.reschedule_seasonal_booking, return_value=access_code_response(is_active=True))
@patch_method(PindoraClient.activate_seasonal_booking_access_code)
@patch_method(PindoraClient.deactivate_seasonal_booking_access_code)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking__reschedule_if_exists() -> None:
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_seasonal_booking).call_count == 1
    assert as_mock(PindoraClient.reschedule_seasonal_booking).call_count == 1
    assert as_mock(PindoraClient.reschedule_seasonal_booking).call_args.args == (section,)
    assert as_mock(PindoraClient.activate_seasonal_booking_access_code).call_count == 0
    assert as_mock(PindoraClient.deactivate_seasonal_booking_access_code).call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is True

    assert as_mock(EmailService.send_seasonal_booking_access_type_changed_email).call_count == 1


@patch_method(PindoraClient.create_seasonal_booking, side_effect=PindoraConflictError("conflict"))
@patch_method(PindoraClient.reschedule_seasonal_booking, return_value=access_code_response(is_active=False))
@patch_method(PindoraClient.activate_seasonal_booking_access_code)
@patch_method(PindoraClient.deactivate_seasonal_booking_access_code)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking__reschedule_if_exists__activate() -> None:
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_seasonal_booking).call_count == 1
    assert as_mock(PindoraClient.reschedule_seasonal_booking).call_count == 1
    assert as_mock(PindoraClient.reschedule_seasonal_booking).call_args.args == (section,)
    assert as_mock(PindoraClient.activate_seasonal_booking_access_code).call_count == 1
    assert as_mock(PindoraClient.activate_seasonal_booking_access_code).call_args.args == (section,)
    assert as_mock(PindoraClient.deactivate_seasonal_booking_access_code).call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is True

    assert as_mock(EmailService.send_seasonal_booking_access_type_changed_email).call_count == 1


@patch_method(PindoraClient.create_seasonal_booking, side_effect=PindoraConflictError("conflict"))
@patch_method(PindoraClient.reschedule_seasonal_booking, return_value=access_code_response(is_active=True))
@patch_method(PindoraClient.activate_seasonal_booking_access_code)
@patch_method(PindoraClient.deactivate_seasonal_booking_access_code)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking__reschedule_if_exists__deactivate() -> None:
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_seasonal_booking).call_count == 1
    assert as_mock(PindoraClient.reschedule_seasonal_booking).call_count == 1
    assert as_mock(PindoraClient.reschedule_seasonal_booking).call_args.args == (section,)
    assert as_mock(PindoraClient.activate_seasonal_booking_access_code).call_count == 0
    assert as_mock(PindoraClient.deactivate_seasonal_booking_access_code).call_count == 1
    assert as_mock(PindoraClient.deactivate_seasonal_booking_access_code).call_args.args == (section,)

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False

    assert as_mock(EmailService.send_seasonal_booking_access_type_changed_email).call_count == 0


@patch_method(PindoraClient.create_seasonal_booking, side_effect=PindoraAPIError("error"))
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@patch_method(SentryLogger.log_exception)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking__pindora_error() -> None:
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert as_mock(PindoraClient.create_seasonal_booking).call_count == 1
    assert as_mock(SentryLogger.log_exception).call_count == 1

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False

    assert as_mock(EmailService.send_seasonal_booking_access_type_changed_email).call_count == 0
