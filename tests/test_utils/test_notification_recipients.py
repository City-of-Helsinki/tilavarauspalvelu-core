import pytest

from email_notification.tasks import _get_staff_notification_recipients
from tests.factories import ReservationFactory, ReservationUnitFactory, UserFactory
from users.models import ReservationNotification

pytestmark = [
    pytest.mark.django_db,
]


def test_get_staff_get_notification_recipients__all_and_handling_required():
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    unit_admin_1 = UserFactory.create_with_unit_permissions(
        unit=reservation_unit_1.unit,
        reservation_notification=ReservationNotification.ALL,
        perms=["can_manage_reservations"],
    )
    unit_admin_2 = UserFactory.create_with_unit_permissions(
        unit=reservation_unit_1.unit,
        reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
        perms=["can_manage_reservations"],
    )
    UserFactory.create(reservation_notification=ReservationNotification.NONE)

    reservation = ReservationFactory.create(reservation_unit=[reservation_unit_1, reservation_unit_2])

    result = _get_staff_notification_recipients(
        reservation,
        [
            ReservationNotification.ALL,
            ReservationNotification.ONLY_HANDLING_REQUIRED,
        ],
    )
    assert sorted(result) == sorted((unit_admin_1.email, unit_admin_2.email))


def test_get_staff_get_notification_recipients__only_handling_required():
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    UserFactory.create_with_unit_permissions(
        unit=reservation_unit_1.unit,
        reservation_notification=ReservationNotification.ALL,
        perms=["can_manage_reservations"],
    )
    unit_admin = UserFactory.create_with_unit_permissions(
        unit=reservation_unit_1.unit,
        reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
        perms=["can_manage_reservations"],
    )
    UserFactory.create(reservation_notification=ReservationNotification.NONE)

    reservation = ReservationFactory.create(reservation_unit=[reservation_unit_1, reservation_unit_2])

    result = _get_staff_notification_recipients(
        reservation,
        [
            ReservationNotification.ONLY_HANDLING_REQUIRED,
        ],
    )
    assert result == [unit_admin.email]


def test_get_staff_get_notification_recipients__dont_include_reservation_recipient():
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    UserFactory.create_with_unit_permissions(
        unit=reservation_unit_1.unit,
        reservation_notification=ReservationNotification.ALL,
        perms=["can_manage_reservations"],
    )
    unit_admin_1 = UserFactory.create_with_unit_permissions(
        unit=reservation_unit_1.unit,
        reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
        perms=["can_manage_reservations"],
    )
    unit_admin_2 = UserFactory.create(reservation_notification=ReservationNotification.NONE)

    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit_1, reservation_unit_2],
        user=unit_admin_2,
    )

    result = _get_staff_notification_recipients(
        reservation,
        [
            ReservationNotification.ONLY_HANDLING_REQUIRED,
        ],
    )
    assert result == [unit_admin_1.email]
