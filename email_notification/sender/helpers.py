from django.db.models import Q

from permissions.helpers import has_unit_permission
from reservations.models import Reservation
from spaces.models import Unit
from users.models import ReservationNotification, User


def get_staff_notification_recipients(
    reservation: Reservation, notification_settings: list[ReservationNotification]
) -> list[str]:
    """
    Get users with unit roles and notifications enabled, collect the ones that can manage relevant units,
    have matching notification setting are not the reservation creator
    """
    notification_recipients: list[str] = []
    reservation_units = reservation.reservation_unit.all()
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))

    users = User.objects.filter(Q(unit_roles__isnull=False) & ~Q(reservation_notification="NONE"))
    for user in users:
        if (
            has_unit_permission(user, "can_manage_reservations", units)
            and __user_has_notification_setting(user, notification_settings)
            and (reservation.user is None or user.pk != reservation.user.pk)
        ):
            notification_recipients.append(user.email)

    # Remove possible(?) duplicates
    return list(set(notification_recipients))


def __user_has_notification_setting(user: User, notification_settings: list[ReservationNotification]):
    return any(user.reservation_notification.upper() == setting.upper() for setting in notification_settings)
