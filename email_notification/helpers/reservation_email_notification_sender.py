from common.date_utils import local_datetime
from email_notification.models import EmailType
from email_notification.tasks import send_reservation_email_task, send_staff_reservation_email_task
from reservations.enums import ReservationStateChoice, ReservationTypeChoice
from reservations.models import Reservation
from users.models import ReservationNotification


class ReservationEmailNotificationSender:
    """Helper class for triggering reservation email sending tasks."""

    RESERVATION_STATE_EMAIL_TYPE_MAP = {
        ReservationStateChoice.CONFIRMED.value: EmailType.RESERVATION_CONFIRMED,
        ReservationStateChoice.REQUIRES_HANDLING.value: EmailType.HANDLING_REQUIRED_RESERVATION,
        ReservationStateChoice.CANCELLED.value: EmailType.RESERVATION_CANCELLED,
        ReservationStateChoice.DENIED.value: EmailType.RESERVATION_REJECTED,
        "APPROVED": EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
    }

    @classmethod
    def send_confirmation_email(cls, reservation: Reservation) -> None:
        # Prevent accidental sending of wrong email.
        if reservation.state not in [ReservationStateChoice.CONFIRMED, ReservationStateChoice.REQUIRES_HANDLING]:
            return

        # Only send emails if reservation is not in the past.
        now = local_datetime()
        if now >= reservation.end:
            return

        cls._send_customer_email(reservation)

        if reservation.state == ReservationStateChoice.REQUIRES_HANDLING:
            cls._send_staff_requires_handling_email(reservation)
        elif reservation.state == ReservationStateChoice.CONFIRMED:
            cls._send_staff_reservation_made_email(reservation)

    @classmethod
    def send_cancellation_email(cls, reservation: Reservation) -> None:
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.CANCELLED:
            return

        cls._send_customer_email(reservation)

    @classmethod
    def send_deny_email(cls, reservation: Reservation) -> None:
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.DENIED:
            return

        # Only send emails if reservation is not in the past.
        now = local_datetime()
        if now >= reservation.end:
            return

        # Don't send notifications for reservations not made by the reservee themselves.
        if reservation.type != ReservationTypeChoice.NORMAL:
            return

        cls._send_customer_email(reservation)

    @classmethod
    def send_approve_email(cls, reservation: Reservation) -> None:
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.CONFIRMED:
            return

        # Only send emails if reservation is not in the past.
        now = local_datetime()
        if now >= reservation.end:
            return

        send_reservation_email_task.delay(
            reservation_id=reservation.id,
            email_type=cls.RESERVATION_STATE_EMAIL_TYPE_MAP["APPROVED"],
        )
        cls._send_staff_reservation_made_email(reservation)

    @classmethod
    def send_requires_handling_email(cls, reservation: Reservation) -> None:
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.REQUIRES_HANDLING:
            return

        # Only send emails if reservation is not in the past.
        now = local_datetime()
        if now >= reservation.end:
            return

        # Don't send notifications for reservations not made by the reservee themselves.
        if reservation.type != ReservationTypeChoice.NORMAL:
            return

        cls._send_customer_email(reservation)

    @classmethod
    def send_reservation_modified_email(cls, reservation: Reservation) -> None:
        send_reservation_email_task.delay(
            reservation_id=reservation.id,
            email_type=EmailType.RESERVATION_MODIFIED,
        )

        if reservation.state == ReservationStateChoice.REQUIRES_HANDLING:
            cls._send_staff_requires_handling_email(reservation)

    # Helpers
    @classmethod
    def _send_customer_email(cls, reservation) -> None:
        send_reservation_email_task.delay(
            reservation_id=reservation.id,
            email_type=cls.RESERVATION_STATE_EMAIL_TYPE_MAP[reservation.state],
        )

    @classmethod
    def _send_staff_requires_handling_email(cls, reservation) -> None:
        send_staff_reservation_email_task.delay(
            reservation_id=reservation.id,
            email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
            notification_settings=[
                ReservationNotification.ALL,
                ReservationNotification.ONLY_HANDLING_REQUIRED,
            ],
        )

    @classmethod
    def _send_staff_reservation_made_email(cls, reservation) -> None:
        send_staff_reservation_email_task.delay(
            reservation_id=reservation.id,
            email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
            notification_settings=[ReservationNotification.ALL],
        )
