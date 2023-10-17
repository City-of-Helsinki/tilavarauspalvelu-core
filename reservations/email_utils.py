from email_notification.models import EmailType
from email_notification.tasks import (
    send_reservation_email_task,
    send_staff_reservation_email_task,
)
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation
from users.models import ReservationNotification

RESERVATION_STATE_EMAIL_TYPE_MAP = {
    ReservationStateChoice.CONFIRMED.value: EmailType.RESERVATION_CONFIRMED,
    ReservationStateChoice.REQUIRES_HANDLING.value: EmailType.HANDLING_REQUIRED_RESERVATION,
    ReservationStateChoice.CANCELLED.value: EmailType.RESERVATION_CANCELLED,
    ReservationStateChoice.DENIED.value: EmailType.RESERVATION_REJECTED,
    "APPROVED": EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
    "NEEDS_PAYMENT": EmailType.RESERVATION_NEEDS_TO_BE_PAID,
}


def send_confirmation_email(reservation: Reservation):
    if reservation.state in RESERVATION_STATE_EMAIL_TYPE_MAP:
        send_reservation_email_task.delay(reservation.id, RESERVATION_STATE_EMAIL_TYPE_MAP[reservation.state])

    if reservation.state == ReservationStateChoice.REQUIRES_HANDLING:
        send_staff_reservation_email_task.delay(
            reservation.id,
            EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
            [
                ReservationNotification.ALL,
                ReservationNotification.ONLY_HANDLING_REQUIRED,
            ],
        )
    elif reservation.state == ReservationStateChoice.CONFIRMED:
        send_staff_reservation_email_task.delay(
            reservation.id,
            EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
            [ReservationNotification.ALL],
        )


def send_cancellation_email(reservation: Reservation):
    if reservation.state in RESERVATION_STATE_EMAIL_TYPE_MAP:
        send_reservation_email_task.delay(reservation.id, RESERVATION_STATE_EMAIL_TYPE_MAP[reservation.state])


def send_deny_email(reservation: Reservation):
    if reservation.state in RESERVATION_STATE_EMAIL_TYPE_MAP:
        send_reservation_email_task.delay(reservation.id, RESERVATION_STATE_EMAIL_TYPE_MAP[reservation.state])


def send_approve_email(reservation: Reservation):
    if reservation.state == ReservationStateChoice.CONFIRMED:
        send_reservation_email_task.delay(reservation.id, RESERVATION_STATE_EMAIL_TYPE_MAP["APPROVED"])
        send_staff_reservation_email_task.delay(
            reservation.id,
            EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
            [ReservationNotification.ALL],
        )


def send_requires_handling_email(reservation: Reservation):
    if (
        reservation.state != ReservationStateChoice.REQUIRES_HANDLING
        and reservation.state in RESERVATION_STATE_EMAIL_TYPE_MAP
    ):
        send_reservation_email_task.delay(reservation.id, RESERVATION_STATE_EMAIL_TYPE_MAP[reservation.state])

    if reservation.state == ReservationStateChoice.REQUIRES_HANDLING:
        send_staff_reservation_email_task.delay(
            reservation.id,
            EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
            [
                ReservationNotification.ALL,
                ReservationNotification.ONLY_HANDLING_REQUIRED,
            ],
        )


def send_reservation_modified_email(reservation: Reservation):
    send_reservation_email_task.delay(reservation.id, EmailType.RESERVATION_MODIFIED)

    if reservation.state == ReservationStateChoice.REQUIRES_HANDLING:
        send_staff_reservation_email_task.delay(
            reservation.id,
            EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
            [
                ReservationNotification.ALL,
                ReservationNotification.ONLY_HANDLING_REQUIRED,
            ],
        )
