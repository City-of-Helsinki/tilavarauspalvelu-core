from django.conf import settings

from email_notification.models import EmailType
from email_notification.sender.senders import send_reservation_email_notification
from reservations.models import Reservation
from tilavarauspalvelu.celery import app


@app.task(name="send_reservation_email")
def send_reservation_email_task(reservation_id: int, type: EmailType):
    if not settings.SEND_RESERVATION_NOTIFICATION_EMAILS:
        return
    reservation = Reservation.objects.filter(id=reservation_id).first()
    if not reservation:
        return
    send_reservation_email_notification(type, reservation)
