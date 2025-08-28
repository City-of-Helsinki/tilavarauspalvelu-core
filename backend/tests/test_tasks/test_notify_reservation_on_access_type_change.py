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

    assert EmailService.send_reservation_access_type_changed_email.call_count == 2
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

    assert EmailService.send_reservation_access_type_changed_email.call_count == 1
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
    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 2


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
    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 1


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
    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 1


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

    assert EmailService.send_reservation_access_type_changed_email.call_count == 1
    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 1
