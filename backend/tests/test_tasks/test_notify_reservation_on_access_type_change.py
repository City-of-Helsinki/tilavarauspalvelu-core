from __future__ import annotations

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.tasks import notify_reservation_on_access_type_change_task
from utils.date_utils import local_datetime

from tests.factories import ApplicationSectionFactory, ReservationFactory, ReservationUnitFactory
from tests.helpers import patch_method


@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 12))
@patch_method(EmailService.send_reservation_access_type_changed_email)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
def test_notify_reservation_on_access_type_change_task():
    reservation_unit = ReservationUnitFactory.create()

    reservation_1 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.UNRESTRICTED,
    )
    reservation_2 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.OPENED_BY_STAFF,
    )

    notify_reservation_on_access_type_change_task(reservation_pks=[reservation_1.pk, reservation_2.pk])

    calls = EmailService.send_reservation_access_type_changed_email.call_args_list
    emailed_reservation_pks = [call.args[0].pk for call in calls]
    assert sorted(emailed_reservation_pks) == sorted([reservation_1.pk, reservation_2.pk])
    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 0


@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 13))  # Note time!
@patch_method(EmailService.send_reservation_access_type_changed_email)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
def test_notify_reservation_on_access_type_change_task__dont_send_for_past_reservations():
    reservation_unit = ReservationUnitFactory.create()

    reservation_1 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.UNRESTRICTED,
    )
    reservation_2 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.OPENED_BY_STAFF,
    )

    notify_reservation_on_access_type_change_task(reservation_pks=[reservation_1.pk, reservation_2.pk])

    calls = EmailService.send_reservation_access_type_changed_email.call_args_list
    emailed_reservation_pks = [call.args[0].pk for call in calls]
    assert emailed_reservation_pks == [reservation_2.pk]
    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 0


@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.parametrize(
    "state",
    [
        ReservationStateChoice.CANCELLED,
        ReservationStateChoice.DENIED,
        ReservationStateChoice.CREATED,
        ReservationStateChoice.WAITING_FOR_PAYMENT,
        ReservationStateChoice.REQUIRES_HANDLING,
    ],
)
@patch_method(EmailService.send_reservation_access_type_changed_email)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
def test_notify_reservation_on_access_type_change_task__dont_send_for_unconfirmed_reservations(state):
    reservation = ReservationFactory.create(
        state=state,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.OPENED_BY_STAFF,
    )

    notify_reservation_on_access_type_change_task(reservation_pks=[reservation.pk])

    assert EmailService.send_reservation_access_type_changed_email.call_count == 0
    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 0


@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 12))
@patch_method(EmailService.send_reservation_access_type_changed_email)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
def test_notify_reservation_on_access_type_change_task__seasonal_bookings():
    reservation_unit = ReservationUnitFactory.create()

    section_1 = ApplicationSectionFactory.create()
    section_2 = ApplicationSectionFactory.create()

    reservation_1 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.SEASONAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.UNRESTRICTED,
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section_1,
    )
    reservation_2 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.SEASONAL,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.OPENED_BY_STAFF,
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section_2,
    )

    notify_reservation_on_access_type_change_task(reservation_pks=[reservation_1.pk, reservation_2.pk])

    assert EmailService.send_reservation_access_type_changed_email.call_count == 0
    calls = EmailService.send_seasonal_booking_access_type_changed_email.call_args_list
    emailed_section_pks = [call.args[0].pk for call in calls]
    assert sorted(emailed_section_pks) == sorted([section_1.pk, section_2.pk])


@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 13))  # Note time!
@patch_method(EmailService.send_reservation_access_type_changed_email)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
def test_notify_reservation_on_access_type_change_task__seasonal_bookings__dont_send_for_past_reservations():
    reservation_unit = ReservationUnitFactory.create()

    section_1 = ApplicationSectionFactory.create()
    section_2 = ApplicationSectionFactory.create()

    reservation_1 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.SEASONAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.UNRESTRICTED,
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section_1,
    )
    reservation_2 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.SEASONAL,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.OPENED_BY_STAFF,
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section_2,
    )

    notify_reservation_on_access_type_change_task(reservation_pks=[reservation_1.pk, reservation_2.pk])

    assert EmailService.send_reservation_access_type_changed_email.call_count == 0
    calls = EmailService.send_seasonal_booking_access_type_changed_email.call_args_list
    emailed_section_pks = [call.args[0].pk for call in calls]
    assert emailed_section_pks == [section_2.pk]


@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 12))
@patch_method(EmailService.send_reservation_access_type_changed_email)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
def test_notify_reservation_on_access_type_change_task__seasonal_bookings__dont_send_for_cancelled_reservations():
    section = ApplicationSectionFactory.create()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        type=ReservationTypeChoice.SEASONAL,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.OPENED_BY_STAFF,
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    notify_reservation_on_access_type_change_task(reservation_pks=[reservation.pk])

    assert EmailService.send_reservation_access_type_changed_email.call_count == 0
    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 0


@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 12))
@patch_method(EmailService.send_reservation_access_type_changed_email)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
def test_notify_reservation_on_access_type_change_task__seasonal_bookings__same_section():
    reservation_unit = ReservationUnitFactory.create()

    section = ApplicationSectionFactory.create()

    reservation_1 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.SEASONAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.UNRESTRICTED,
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation_2 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.SEASONAL,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.OPENED_BY_STAFF,
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    notify_reservation_on_access_type_change_task(reservation_pks=[reservation_1.pk, reservation_2.pk])

    # Only send once for the same section.
    assert EmailService.send_reservation_access_type_changed_email.call_count == 0
    calls = EmailService.send_seasonal_booking_access_type_changed_email.call_args_list
    emailed_section_pks = [call.args[0].pk for call in calls]
    assert emailed_section_pks == [section.pk]


@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 12))
@patch_method(EmailService.send_reservation_access_type_changed_email)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
def test_notify_reservation_on_access_type_change_task__normal_and_seasonal_bookings():
    reservation_unit = ReservationUnitFactory.create()

    reservation_1 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.UNRESTRICTED,
    )

    section = ApplicationSectionFactory.create()
    reservation_2 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.SEASONAL,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.OPENED_BY_STAFF,
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    notify_reservation_on_access_type_change_task(reservation_pks=[reservation_1.pk, reservation_2.pk])

    reservation_calls = EmailService.send_reservation_access_type_changed_email.call_args_list
    emailed_reservation_pks = [call.args[0].pk for call in reservation_calls]
    assert emailed_reservation_pks == [reservation_1.pk]

    section_calls = EmailService.send_seasonal_booking_access_type_changed_email.call_args_list
    emailed_section_pks = [call.args[0].pk for call in section_calls]
    assert emailed_section_pks == [section.pk]
