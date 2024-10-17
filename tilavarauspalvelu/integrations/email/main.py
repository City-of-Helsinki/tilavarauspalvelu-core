from __future__ import annotations

from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import ApplicationStatusChoice, EmailType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.models import Application, User
from tilavarauspalvelu.typing import EmailData
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.sentry import SentryLogger

from .attachements import get_reservation_ical_attachment
from .find_language import get_application_email_language, get_reservation_email_language
from .find_recipients import (
    get_application_email_recipients,
    get_recipients_for_applications_by_language,
    get_reservation_email_recipients,
    get_reservation_staff_notification_recipients,
    get_users_by_email_language,
)
from .rendering import render_html, render_text
from .sending import send_emails_in_batches_task, send_multiple_emails_in_batches_task
from .template_context import (
    get_context_for_application_handled,
    get_context_for_application_in_allocation,
    get_context_for_application_received,
    get_context_for_permission_deactivation,
    get_context_for_reservation_approved,
    get_context_for_reservation_cancelled,
    get_context_for_reservation_confirmed,
    get_context_for_reservation_modified,
    get_context_for_reservation_rejected,
    get_context_for_reservation_requires_handling,
    get_context_for_reservation_requires_payment,
    get_context_for_staff_notification_reservation_made,
    get_context_for_staff_notification_reservation_requires_handling,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation
    from tilavarauspalvelu.typing import Lang

__all__ = [
    "EmailService",
]


class EmailService:
    """Service for sending email notifications available in the system."""

    @staticmethod
    def send_application_received_email(
        application: Application,
        *,
        language: Lang | None = None,
    ) -> None:
        """
        Sends email about the application being received.

        :param application: The application the email concerns.
        :param language: The language of the email. Determine from application if not given.
        """
        # Prevent accidental sending of wrong email.
        if application.status != ApplicationStatusChoice.RECEIVED:
            return

        recipients = get_application_email_recipients(application=application)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for application received email",
                details={"application": application.pk},
            )
            return

        if language is None:
            language = get_application_email_language(application=application)

        email_type = EmailType.APPLICATION_RECEIVED
        context = get_context_for_application_received(language=language)
        send_emails_in_batches_task.delay(
            recipients=recipients,
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
        )

    @staticmethod
    def send_application_in_allocation_emails() -> None:
        """Sends emails to applicants when application round has entered the allocation phase."""
        applications = Application.objects.should_send_in_allocation_email().order_by("created_date")
        if not applications:
            return

        recipients_by_language = get_recipients_for_applications_by_language(applications)
        if not recipients_by_language:
            SentryLogger.log_message(
                "No recipients for application in allocation emails",
                details={"applications": ",".join(str(application.pk) for application in applications)},
            )
            return

        emails: list[EmailData] = []
        email_type = EmailType.APPLICATION_IN_ALLOCATION

        for language, recipients in recipients_by_language.items():
            context = get_context_for_application_in_allocation(language=language)

            emails.append(
                EmailData(
                    recipients=list(recipients),
                    subject=context["title"],
                    text_content=render_text(email_type=email_type, context=context),
                    html_content=render_html(email_type=email_type, context=context),
                    attachments=[],
                )
            )

        send_multiple_emails_in_batches_task.delay(emails=emails)
        applications.update(in_allocation_notification_sent_date=local_datetime())

    @staticmethod
    def send_application_handled_emails() -> None:
        """Sends email to applicants when application round has its allocation results available."""
        applications = Application.objects.should_send_handled_email().order_by("created_date")
        if not applications:
            SentryLogger.log_message("Zero applications require the 'application handled' email to be sent")
            return

        recipients_by_language = get_recipients_for_applications_by_language(applications)
        if not recipients_by_language:
            SentryLogger.log_message(
                "No recipients for application handled emails",
                details={"applications": ",".join(str(application.pk) for application in applications)},
            )
            return

        emails: list[EmailData] = []
        email_type = EmailType.APPLICATION_HANDLED

        for language, recipients in recipients_by_language.items():
            context = get_context_for_application_handled(language=language)

            emails.append(
                EmailData(
                    recipients=list(recipients),
                    subject=context["title"],
                    text_content=render_text(email_type=email_type, context=context),
                    html_content=render_html(email_type=email_type, context=context),
                    attachments=[],
                )
            )

        send_multiple_emails_in_batches_task.delay(emails=emails)
        applications.update(results_ready_notification_sent_date=local_datetime())

    @staticmethod
    def send_permission_deactivation_emails() -> None:
        users = User.objects.should_deactivate_permissions().exclude(email="").order_by("last_login")
        if not users:
            return

        recipients_by_language = get_users_by_email_language(users)

        emails: list[EmailData] = []
        email_type = EmailType.PERMISSION_DEACTIVATION

        for language, recipients in recipients_by_language.items():
            context = get_context_for_permission_deactivation(language=language)

            emails.append(
                EmailData(
                    recipients=list(recipients),
                    subject=context["title"],
                    text_content=render_text(email_type=email_type, context=context),
                    html_content=render_html(email_type=email_type, context=context),
                    attachments=[],
                )
            )

        send_multiple_emails_in_batches_task.delay(emails=emails)

    @staticmethod
    def send_reservation_cancelled_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """
        Sends an email about the reservation being cancelled.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.CANCELLED:
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for reservation cancelled email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_CANCELLED
        context = get_context_for_reservation_cancelled(reservation, language=language)
        send_emails_in_batches_task.delay(
            recipients=recipients,
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
        )

    @staticmethod
    def send_reservation_confirmed_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """
        Sends an email about the reservation being confirmed.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        # Prevent accidental sending of wrong email.
        if reservation.state not in ReservationStateChoice.CONFIRMED:
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for reservation confirmed email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_CONFIRMED
        context = get_context_for_reservation_confirmed(reservation, language=language)
        attachment = get_reservation_ical_attachment(reservation)
        send_emails_in_batches_task.delay(
            recipients=recipients,
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
            attachments=[attachment] if attachment else None,
        )

    @staticmethod
    def send_reservation_approved_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """
        Sends an email about the reservation being approved in handling.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.CONFIRMED:
            return

        # Only send emails if reservation is not in the past.
        if local_datetime() >= reservation.end.astimezone(DEFAULT_TIMEZONE):
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for reservation approved email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_APPROVED
        context = get_context_for_reservation_approved(reservation, language=language)
        attachment = get_reservation_ical_attachment(reservation)
        send_emails_in_batches_task.delay(
            recipients=recipients,
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
            attachments=[attachment] if attachment else None,
        )

    @staticmethod
    def send_reservation_requires_handling_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """
        Sends an email about the reservation requiring handling.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.REQUIRES_HANDLING:
            return

        # Only send emails if reservation is not in the past.
        if local_datetime() >= reservation.end.astimezone(DEFAULT_TIMEZONE):
            return

        # Don't send notifications for reservations not made by the reservee themselves.
        if reservation.type != ReservationTypeChoice.NORMAL:
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for reservation requires handling email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_REQUIRES_HANDLING
        context = get_context_for_reservation_requires_handling(reservation, language=language)
        send_emails_in_batches_task.delay(
            recipients=recipients,
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
        )

    @staticmethod
    def send_reservation_modified_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """
        Sends an email about the reservation being modified.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        # Only send emails if reservation is not in the past.
        if local_datetime() >= reservation.end.astimezone(DEFAULT_TIMEZONE):
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for reservation modified email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_MODIFIED
        context = get_context_for_reservation_modified(reservation, language=language)
        attachment = get_reservation_ical_attachment(reservation)
        send_emails_in_batches_task.delay(
            recipients=recipients,
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
            attachments=[attachment] if attachment else None,
        )

    @staticmethod
    def send_reservation_requires_payment_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """
        Sends an email about the reservation requiring payment.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        # Only sent message if reservation has a price.
        if reservation.price == 0:
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for reservation requires payment email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_REQUIRES_PAYMENT
        context = get_context_for_reservation_requires_payment(reservation, language=language)
        send_emails_in_batches_task.delay(
            recipients=recipients,
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
        )

    @staticmethod
    def send_reservation_rejected_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """
        Sends an email about the reservation being rejected in handling.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.DENIED:
            return

        # Only send emails if reservation is not in the past.
        if local_datetime() >= reservation.end.astimezone(DEFAULT_TIMEZONE):
            return

        # Don't send notifications for reservations not made by the reservee themselves.
        if reservation.type != ReservationTypeChoice.NORMAL:
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for reservation rejected email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_REJECTED
        context = get_context_for_reservation_rejected(reservation, language=language)
        send_emails_in_batches_task.delay(
            recipients=recipients,
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
        )

    @staticmethod
    def send_staff_notification_reservation_made_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """
        Sends an email about the reservation to staff users when a reservation has been made
        in a reservation unit they are responsible for.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.CONFIRMED:
            return

        recipients = get_reservation_staff_notification_recipients(reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for staff notification reservation made email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.STAFF_NOTIFICATION_RESERVATION_MADE
        context = get_context_for_staff_notification_reservation_made(reservation, language=language)
        send_emails_in_batches_task.delay(
            recipients=recipients,
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
        )

    @staticmethod
    def send_staff_notification_reservation_requires_handling_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """
        Sends an email about the reservation to staff users when a reservation has been made
        in a reservation unit they are responsible for that requires handling.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.REQUIRES_HANDLING:
            return

        recipients = get_reservation_staff_notification_recipients(reservation, handling=True)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for staff notification reservation requires handling email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING
        context = get_context_for_staff_notification_reservation_requires_handling(reservation, language=language)
        send_emails_in_batches_task.delay(
            recipients=recipients,
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
        )
