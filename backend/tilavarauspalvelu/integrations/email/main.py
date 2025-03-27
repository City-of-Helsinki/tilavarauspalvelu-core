from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from django.db import models

from tilavarauspalvelu.enums import AccessType, ApplicationStatusChoice, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Application, User
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from .attachements import get_reservation_ical_attachment
from .find_language import get_application_email_language, get_reservation_email_language
from .find_recipients import (
    get_application_email_recipients,
    get_application_section_staff_notification_recipients_by_language,
    get_recipients_for_applications_by_language,
    get_reservation_email_recipients,
    get_reservation_staff_notification_recipients_by_language,
    get_users_by_email_language,
)
from .sending import send_emails_in_batches_task, send_multiple_emails_in_batches_task
from .typing import EmailData, EmailType

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection, Reservation
    from tilavarauspalvelu.typing import Lang

__all__ = [
    "EmailService",
]


class EmailService:
    """Service for sending email notifications available in the system."""

    # Application ######################################################################################################

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
            context = email_type.get_email_context(language=language)
            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)
        applications.update(results_ready_notification_sent_date=local_datetime())

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
            context = email_type.get_email_context(language=language)
            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)
        applications.update(in_allocation_notification_sent_date=local_datetime())

    @staticmethod
    def send_application_received_email(application: Application, *, language: Lang | None = None) -> None:
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
        context = email_type.get_email_context(language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_application_section_cancelled(
        application_section: ApplicationSection,
        *,
        language: Lang | None = None,
    ) -> None:
        """Sends an email that the whole application section was cancelled by the user"""
        if application_section.application.status != ApplicationStatusChoice.RESULTS_SENT:
            return
        if application_section.actions.get_last_reservation() is None:
            return

        recipients = get_application_email_recipients(application=application_section.application)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for application section cancelled email",
                details={"application_section": application_section.pk},
            )
            return

        if language is None:
            language = get_application_email_language(application=application_section.application)

        email_type = EmailType.APPLICATION_SECTION_CANCELLED
        context = email_type.get_email_context(application_section, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    # Permissions ######################################################################################################

    @staticmethod
    def send_permission_deactivation_emails() -> None:
        users = (
            User.objects.should_deactivate_permissions(in_days=settings.PERMISSION_NOTIFICATION_BEFORE_DAYS)
            .exclude(models.Q(email="") | models.Q(sent_email_about_deactivating_permissions=True))
            .order_by("last_login")
        )
        if not users:
            return

        recipients_by_language = get_users_by_email_language(users)

        emails: list[EmailData] = []
        email_type = EmailType.PERMISSION_DEACTIVATION

        for language, recipients in recipients_by_language.items():
            context = email_type.get_email_context(language=language)

            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)
        users.update(sent_email_about_deactivating_permissions=True)

    @staticmethod
    def send_user_anonymization_emails() -> None:
        users = (
            User.objects.should_anonymize_users(in_days=settings.ANONYMIZATION_NOTIFICATION_BEFORE_DAYS)
            .exclude(models.Q(email="") | models.Q(sent_email_about_anonymization=True))
            .order_by("last_login")
        )
        if not users:
            return

        recipients_by_language = get_users_by_email_language(users)

        emails: list[EmailData] = []
        email_type = EmailType.USER_ANONYMIZATION

        for language, recipients in recipients_by_language.items():
            context = email_type.get_email_context(language=language)
            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)
        users.update(sent_email_about_anonymization=True)

    # Reservation ######################################################################################################

    @staticmethod
    def send_reservation_approved_email(reservation: Reservation, *, language: Lang | None = None) -> None:
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
        context = email_type.get_email_context(reservation, language=language)
        attachment = get_reservation_ical_attachment(reservation)
        email = EmailData.build(recipients, context, email_type, attachment=attachment)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_cancelled_email(reservation: Reservation, *, language: Lang | None = None) -> None:
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

        if reservation.type == ReservationTypeChoice.SEASONAL:
            email_type = EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE
        else:
            email_type = EmailType.RESERVATION_CANCELLED

        context = email_type.get_email_context(reservation, language=language)

        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_confirmed_email(reservation: Reservation, *, language: Lang | None = None) -> None:
        """
        Sends an email about the reservation being confirmed.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.CONFIRMED:
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
        context = email_type.get_email_context(reservation, language=language)
        attachment = get_reservation_ical_attachment(reservation)
        email = EmailData.build(recipients, context, email_type, attachment=attachment)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_modified_email(reservation: Reservation, *, language: Lang | None = None) -> None:
        """
        Sends an email about the reservation being modified.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        if reservation.type not in {ReservationTypeChoice.NORMAL, ReservationTypeChoice.SEASONAL}:
            return

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

        if reservation.type == ReservationTypeChoice.SEASONAL:
            email_type = EmailType.SEASONAL_RESERVATION_MODIFIED_SINGLE
        else:
            email_type = EmailType.RESERVATION_MODIFIED

        context = email_type.get_email_context(reservation, language=language)

        attachment = get_reservation_ical_attachment(reservation)
        email = EmailData.build(recipients, context, email_type, attachment=attachment)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_modified_access_code_email(reservation: Reservation, *, language: Lang | None = None) -> None:
        """
        Sends an email about the reservation access code being modified.

        :param reservation: The reservation the email concerns.
        :param language: The language of the email. Determine from reservation if not given.
        """
        if reservation.type not in {ReservationTypeChoice.NORMAL, ReservationTypeChoice.SEASONAL}:
            return

        if reservation.access_type != AccessType.ACCESS_CODE:
            return

        # Only send emails if reservation is not in the past.
        if local_datetime() >= reservation.end.astimezone(DEFAULT_TIMEZONE):
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for reservation modified access code email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_MODIFIED_ACCESS_CODE
        context = email_type.get_email_context(reservation, language=language)
        attachment = get_reservation_ical_attachment(reservation)
        email = EmailData.build(recipients, context, email_type, attachment=attachment)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_rejected_email(reservation: Reservation, *, language: Lang | None = None) -> None:
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
        if reservation.type not in {ReservationTypeChoice.NORMAL, ReservationTypeChoice.SEASONAL}:
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

        if reservation.type == ReservationTypeChoice.SEASONAL:
            email_type = EmailType.SEASONAL_RESERVATION_REJECTED_SINGLE
        else:
            email_type = EmailType.RESERVATION_REJECTED

        context = email_type.get_email_context(reservation, language=language)

        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_requires_handling_email(reservation: Reservation, *, language: Lang | None = None) -> None:
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
        context = email_type.get_email_context(reservation, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_requires_payment_email(reservation: Reservation, *, language: Lang | None = None) -> None:
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
        context = email_type.get_email_context(reservation, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    # Reservation Series ###############################################################################################

    # Seasonal booking #################################################################################################

    @staticmethod
    def send_seasonal_reservation_modified_series_email(
        application_section: ApplicationSection,
        *,
        language: Lang | None = None,
    ) -> None:
        if not application_section.actions.get_reservations().exists():
            return

        recipients = get_application_email_recipients(application=application_section.application)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for reservation modified series access code email",
                details={"application_section": application_section.pk},
            )
            return

        if language is None:
            language = get_application_email_language(application=application_section.application)

        email_type = EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES
        context = email_type.get_email_context(application_section, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_seasonal_reservation_modified_series_access_code_email(
        application_section: ApplicationSection,
        *,
        language: Lang | None = None,
    ) -> None:
        if not application_section.actions.get_reservations().exists():
            return

        if application_section.application.status != ApplicationStatusChoice.RESULTS_SENT:
            return

        recipients = get_application_email_recipients(application=application_section.application)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for reservation series modified email",
                details={"application_section": application_section.pk},
            )
            return

        if language is None:
            language = get_application_email_language(application=application_section.application)

        email_type = EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES_ACCESS_CODE
        context = email_type.get_email_context(application_section, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_seasonal_reservation_rejected_series_email(
        application_section: ApplicationSection,
        *,
        language: Lang | None = None,
    ) -> None:
        if not application_section.actions.get_reservations().exists():
            return

        recipients = get_application_email_recipients(application=application_section.application)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for reservation series rejected email",
                details={"application_section": application_section.pk},
            )
            return

        if language is None:
            language = get_application_email_language(application=application_section.application)

        email_type = EmailType.SEASONAL_RESERVATION_REJECTED_SERIES
        context = email_type.get_email_context(application_section, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    # Staff ############################################################################################################

    @staticmethod
    def send_staff_notification_application_section_cancelled(application_section: ApplicationSection) -> None:
        """Sends an email to Staff that the whole application section was cancelled by the user"""
        if application_section.application.status != ApplicationStatusChoice.RESULTS_SENT:
            return
        if application_section.actions.get_last_reservation() is None:
            return

        recipients_by_language = get_application_section_staff_notification_recipients_by_language(application_section)
        if not recipients_by_language:
            SentryLogger.log_message(
                "No recipients for staff notification application section cancelled email",
                details={"application_section": application_section.pk},
            )
            return

        emails: list[EmailData] = []
        email_type = EmailType.STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED

        for language, recipients in recipients_by_language.items():
            context = email_type.get_email_context(application_section, language=language)
            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)

    @staticmethod
    def send_staff_notification_reservation_made_email(reservation: Reservation) -> None:
        """
        Sends an email about the reservation to staff users when a reservation has been made
        in a reservation unit they are responsible for.

        :param reservation: The reservation the email concerns.
        """
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.CONFIRMED:
            return

        recipients_by_language = get_reservation_staff_notification_recipients_by_language(reservation)
        if not recipients_by_language:
            SentryLogger.log_message(
                "No recipients for staff notification reservation made email",
                details={"reservation": reservation.pk},
            )
            return

        emails: list[EmailData] = []
        email_type = EmailType.STAFF_NOTIFICATION_RESERVATION_MADE

        for language, recipients in recipients_by_language.items():
            context = email_type.get_email_context(reservation, language=language)
            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)

    @staticmethod
    def send_staff_notification_reservation_requires_handling_email(reservation: Reservation) -> None:
        """
        Sends an email about the reservation to staff users when a reservation has been made
        in a reservation unit they are responsible for that requires handling.

        :param reservation: The reservation the email concerns.
        """
        # Prevent accidental sending of wrong email.
        if reservation.state != ReservationStateChoice.REQUIRES_HANDLING:
            return

        recipients_by_language = get_reservation_staff_notification_recipients_by_language(reservation, handling=True)
        if not recipients_by_language:
            SentryLogger.log_message(
                "No recipients for staff notification reservation requires handling email",
                details={"reservation": reservation.pk},
            )
            return

        emails: list[EmailData] = []
        email_type = EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING

        for language, recipients in recipients_by_language.items():
            context = email_type.get_email_context(reservation, language=language)
            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)
