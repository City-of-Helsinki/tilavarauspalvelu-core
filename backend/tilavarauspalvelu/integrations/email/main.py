from __future__ import annotations

from typing import TYPE_CHECKING
from warnings import deprecated

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

    # Reservation ######################################################################################################

    @staticmethod
    def send_reservation_access_code_added_email(reservation: Reservation, *, language: Lang | None = None) -> None:
        """Sends an email to the user when an access code has been or added to or activated for their reservation."""
        if reservation.type == ReservationTypeChoice.SEASONAL:
            section = reservation.actions.get_application_section()
            if section is None:
                return

            EmailService.send_seasonal_booking_access_code_added_email(section)
            return

        if reservation.access_type != AccessType.ACCESS_CODE:
            return

        if reservation.type not in ReservationTypeChoice.types_created_by_the_reservee:
            return

        if reservation.end.astimezone(DEFAULT_TIMEZONE) <= local_datetime():
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'reservation access code added' email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_ACCESS_CODE_ADDED
        context = email_type.get_email_context(reservation, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_access_code_changed_email(reservation: Reservation, *, language: Lang | None = None) -> None:
        """Sends an email to the reservee when their reservation's access code has been modified."""
        if reservation.type == ReservationTypeChoice.SEASONAL:
            section = reservation.actions.get_application_section()
            if section is None:
                return

            EmailService.send_seasonal_booking_access_code_changed_email(section)
            return

        if reservation.access_type != AccessType.ACCESS_CODE:
            return

        if reservation.type not in ReservationTypeChoice.types_created_by_the_reservee:
            return

        if reservation.end.astimezone(DEFAULT_TIMEZONE) <= local_datetime():
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'reservation access code changed' email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_ACCESS_CODE_CHANGED
        context = email_type.get_email_context(reservation, language=language)
        attachment = get_reservation_ical_attachment(reservation)
        email = EmailData.build(recipients, context, email_type, attachment=attachment)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_approved_email(reservation: Reservation, *, language: Lang | None = None) -> None:
        """Sends an email to the reservee when their reservation has been approved in handling."""
        if reservation.state != ReservationStateChoice.CONFIRMED:
            return

        if reservation.end.astimezone(DEFAULT_TIMEZONE) <= local_datetime():
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'reservation approved' email",
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
        """Sends an email to the reservee when they have cancelled their reservation."""
        if reservation.type == ReservationTypeChoice.SEASONAL:
            EmailService.send_seasonal_booking_cancelled_single_email(reservation=reservation)
            return

        if reservation.state != ReservationStateChoice.CANCELLED:
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'reservation cancelled' email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_CANCELLED
        context = email_type.get_email_context(reservation, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_confirmed_email(reservation: Reservation, *, language: Lang | None = None) -> None:
        """Sends an email to the reservee when their reservation has been confirmed after checkout or payment."""
        if reservation.state != ReservationStateChoice.CONFIRMED:
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'reservation confirmed' email",
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
    def send_reservation_confirmed_staff_notification_email(reservation: Reservation) -> None:
        """
        Sends an email to staff when a new reservation has been made
        in a reservation unit they are responsible for.
        """
        if reservation.state != ReservationStateChoice.CONFIRMED:
            return

        recipients_by_language = get_reservation_staff_notification_recipients_by_language(reservation)
        if not recipients_by_language:
            SentryLogger.log_message(
                "No recipients for the 'reservation confirmed staff notification' email",
                details={"reservation": reservation.pk},
            )
            return

        emails: list[EmailData] = []
        email_type = EmailType.RESERVATION_CONFIRMED_STAFF_NOTIFICATION

        for language, recipients in recipients_by_language.items():
            context = email_type.get_email_context(reservation, language=language)
            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)

    @staticmethod
    def send_reservation_denied_email(reservation: Reservation, *, language: Lang | None = None) -> None:
        """Sends an email about the reservation being denied in handling."""
        if reservation.type == ReservationTypeChoice.SEASONAL:
            EmailService.send_seasonal_booking_denied_single_email(reservation=reservation)
            return

        if reservation.state != ReservationStateChoice.DENIED:
            return

        if reservation.type not in ReservationTypeChoice.types_created_by_the_reservee:
            return

        if reservation.end.astimezone(DEFAULT_TIMEZONE) <= local_datetime():
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'reservation denied' email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_DENIED
        context = email_type.get_email_context(reservation, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_requires_handling_email(reservation: Reservation, *, language: Lang | None = None) -> None:
        """Sends an email to the reservee when a their reservation requires handling before it can be confirmed."""
        if reservation.state != ReservationStateChoice.REQUIRES_HANDLING:
            return

        if reservation.type not in ReservationTypeChoice.types_created_by_the_reservee:
            return

        if reservation.end.astimezone(DEFAULT_TIMEZONE) <= local_datetime():
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'reservation requires handling' email",
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
    def send_reservation_requires_handling_staff_notification_email(reservation: Reservation) -> None:
        """
        Sends an email to staff when a new reservation has been made
        in a reservation unit they are responsible for, and that reservation requires handling.
        """
        if reservation.state != ReservationStateChoice.REQUIRES_HANDLING:
            return

        recipients_by_language = get_reservation_staff_notification_recipients_by_language(reservation, handling=True)
        if not recipients_by_language:
            SentryLogger.log_message(
                "No recipients for the 'reservation requires handling staff notification' email",
                details={"reservation": reservation.pk},
            )
            return

        emails: list[EmailData] = []
        email_type = EmailType.RESERVATION_REQUIRES_HANDLING_STAFF_NOTIFICATION

        for language, recipients in recipients_by_language.items():
            context = email_type.get_email_context(reservation, language=language)
            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)

    @staticmethod
    @deprecated("This doesn't seem to be used anywhere")
    def send_reservation_requires_payment_email(reservation: Reservation, *, language: Lang | None = None) -> None:
        """Sends an email to the reservee when their reservation requires payment."""
        if reservation.price <= 0:
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'reservation requires payment' email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_REQUIRES_PAYMENT
        context = email_type.get_email_context(reservation, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_reservation_rescheduled_email(reservation: Reservation, *, language: Lang | None = None) -> None:
        """Sends an email to the reservee when their reservation has being rescheduled."""
        if reservation.type == ReservationTypeChoice.SEASONAL:
            EmailService.send_seasonal_booking_rescheduled_single_email(reservation=reservation)
            return

        if reservation.type not in ReservationTypeChoice.types_created_by_the_reservee:
            return

        if reservation.end.astimezone(DEFAULT_TIMEZONE) <= local_datetime():
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'reservation rescheduled' email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.RESERVATION_RESCHEDULED
        context = email_type.get_email_context(reservation, language=language)
        attachment = get_reservation_ical_attachment(reservation)
        email = EmailData.build(recipients, context, email_type, attachment=attachment)
        send_emails_in_batches_task.delay(email_data=email)

    # Seasonal booking #################################################################################################

    @staticmethod
    def send_seasonal_booking_access_code_added_email(
        application_section: ApplicationSection,
        *,
        language: Lang | None = None,
    ) -> None:
        """
        Sends an email to the applicant when an access code has been
        or added to or activated for their seasonal booking.
        """
        if application_section.application.status != ApplicationStatusChoice.RESULTS_SENT:
            return

        if not application_section.actions.get_reservations().exists():
            return

        recipients = get_application_email_recipients(application=application_section.application)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'seasonal booking access code added' email",
                details={"application_section": application_section.pk},
            )
            return

        if language is None:
            language = get_application_email_language(application=application_section.application)

        email_type = EmailType.SEASONAL_BOOKING_ACCESS_CODE_ADDED
        context = email_type.get_email_context(application_section, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_seasonal_booking_access_code_changed_email(
        application_section: ApplicationSection,
        *,
        language: Lang | None = None,
    ) -> None:
        """Sends an email to the applicant then staff has changed the access code for their seasonal booking."""
        if application_section.application.status != ApplicationStatusChoice.RESULTS_SENT:
            return

        if not application_section.actions.get_reservations().exists():
            return

        recipients = get_application_email_recipients(application=application_section.application)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'seasonal booking access code changed' email",
                details={"application_section": application_section.pk},
            )
            return

        if language is None:
            language = get_application_email_language(application=application_section.application)

        email_type = EmailType.SEASONAL_BOOKING_ACCESS_CODE_CHANGED
        context = email_type.get_email_context(application_section, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_seasonal_booking_application_received_email(
        application: Application,
        *,
        language: Lang | None = None,
    ) -> None:
        """Sends an email to the applicant when their application has been received for allocation."""
        if application.status != ApplicationStatusChoice.RECEIVED:
            return

        recipients = get_application_email_recipients(application=application)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'seasonal booking application received' email",
                details={"application": application.pk},
            )
            return

        if language is None:
            language = get_application_email_language(application=application)

        email_type = EmailType.SEASONAL_BOOKING_APPLICATION_RECEIVED
        context = email_type.get_email_context(language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_seasonal_booking_application_round_in_allocation_emails() -> None:
        """Sends an email to all applicants when an application round has entered the allocation phase."""
        applications = Application.objects.should_send_in_allocation_email().order_by("created_date")
        if not applications:
            msg = "Zero applications require the 'seasonal booking application round in allocation email' to be sent"
            SentryLogger.log_message(msg)
            return

        recipients_by_language = get_recipients_for_applications_by_language(applications)
        if not recipients_by_language:
            SentryLogger.log_message(
                "No recipients for the 'seasonal booking application round in allocation' email",
                details={"applications": ",".join(str(application.pk) for application in applications)},
            )
            return

        emails: list[EmailData] = []
        email_type = EmailType.SEASONAL_BOOKING_APPLICATION_ROUND_IN_ALLOCATION

        for language, recipients in recipients_by_language.items():
            context = email_type.get_email_context(language=language)
            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)
        applications.update(in_allocation_notification_sent_date=local_datetime())

    @staticmethod
    def send_seasonal_booking_application_round_handled_emails() -> None:
        """Sends an email to all applicants when an application round has its allocation results available."""
        applications = Application.objects.should_send_handled_email().order_by("created_date")
        if not applications:
            msg = "Zero applications require the 'seasonal booking application round handled email' to be sent"
            SentryLogger.log_message(msg)
            return

        recipients_by_language = get_recipients_for_applications_by_language(applications)
        if not recipients_by_language:
            SentryLogger.log_message(
                "No recipients for the 'send seasonal booking application round handled emails' email",
                details={"applications": ",".join(str(application.pk) for application in applications)},
            )
            return

        emails: list[EmailData] = []
        email_type = EmailType.SEASONAL_BOOKING_APPLICATION_ROUND_HANDLED

        for language, recipients in recipients_by_language.items():
            context = email_type.get_email_context(language=language)
            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)
        applications.update(results_ready_notification_sent_date=local_datetime())

    @staticmethod
    def send_seasonal_booking_cancelled_all_email(
        application_section: ApplicationSection,
        *,
        language: Lang | None = None,
    ) -> None:
        """Sends an email to the applicant when they have cancelled their whole seasonal booking."""
        if application_section.application.status != ApplicationStatusChoice.RESULTS_SENT:
            return

        if application_section.actions.get_last_reservation() is None:
            return

        recipients = get_application_email_recipients(application=application_section.application)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'seasonal booking cancelled all' email",
                details={"application_section": application_section.pk},
            )
            return

        if language is None:
            language = get_application_email_language(application=application_section.application)

        email_type = EmailType.SEASONAL_BOOKING_CANCELLED_ALL
        context = email_type.get_email_context(application_section, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_seasonal_booking_cancelled_all_staff_notification_email(
        application_section: ApplicationSection,
    ) -> None:
        """Sends an email to staff when the applicant has cancelled their whole seasonal booking."""
        if application_section.application.status != ApplicationStatusChoice.RESULTS_SENT:
            return

        if application_section.actions.get_last_reservation() is None:
            return

        recipients_by_language = get_application_section_staff_notification_recipients_by_language(application_section)
        if not recipients_by_language:
            SentryLogger.log_message(
                "No recipients for the 'seasonal booking cancelled all staff notification' email",
                details={"application_section": application_section.pk},
            )
            return

        emails: list[EmailData] = []
        email_type = EmailType.SEASONAL_BOOKING_CANCELLED_ALL_STAFF_NOTIFICATION

        for language, recipients in recipients_by_language.items():
            context = email_type.get_email_context(application_section, language=language)
            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)

    @staticmethod
    def send_seasonal_booking_cancelled_single_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """Sends an email to the applicant when they have cancelled a single reservation in their seasonal booking."""
        if reservation.state != ReservationStateChoice.CANCELLED:
            return

        if reservation.type != ReservationTypeChoice.SEASONAL:
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'seasonal booking cancelled single' email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.SEASONAL_BOOKING_CANCELLED_SINGLE
        context = email_type.get_email_context(reservation, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_seasonal_booking_denied_series_email(
        application_section: ApplicationSection,
        *,
        language: Lang | None = None,
    ) -> None:
        """Sends an email to the applicant when staff has denied a series in their seasonal booking."""
        if not application_section.actions.get_reservations().exists():
            return

        recipients = get_application_email_recipients(application=application_section.application)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'seasonal booking deny series' email",
                details={"application_section": application_section.pk},
            )
            return

        if language is None:
            language = get_application_email_language(application=application_section.application)

        email_type = EmailType.SEASONAL_BOOKING_DENIED_SERIES
        context = email_type.get_email_context(application_section, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_seasonal_booking_denied_single_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """Sends an email to the applicant when staff has denied a reservation in their seasonal booking."""
        if reservation.state != ReservationStateChoice.DENIED:
            return

        if reservation.type != ReservationTypeChoice.SEASONAL:
            return

        if reservation.end.astimezone(DEFAULT_TIMEZONE) <= local_datetime():
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'seasonal booking deny single' email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.SEASONAL_BOOKING_DENIED_SINGLE
        context = email_type.get_email_context(reservation, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_seasonal_booking_rescheduled_series_email(
        application_section: ApplicationSection,
        *,
        language: Lang | None = None,
    ) -> None:
        """Send an email to the applicant when staff has rescheduled a series in their seasonal booking."""
        if not application_section.actions.get_reservations().exists():
            return

        recipients = get_application_email_recipients(application=application_section.application)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'seasonal booking rescheduled series' email",
                details={"application_section": application_section.pk},
            )
            return

        if language is None:
            language = get_application_email_language(application=application_section.application)

        email_type = EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES
        context = email_type.get_email_context(application_section, language=language)
        email = EmailData.build(recipients, context, email_type)
        send_emails_in_batches_task.delay(email_data=email)

    @staticmethod
    def send_seasonal_booking_rescheduled_single_email(
        reservation: Reservation,
        *,
        language: Lang | None = None,
    ) -> None:
        """Sends an email to the applicant when a single reservation in their seasonal booking has been rescheduled."""
        if reservation.type != ReservationTypeChoice.SEASONAL:
            return

        if reservation.end.astimezone(DEFAULT_TIMEZONE) <= local_datetime():
            return

        recipients = get_reservation_email_recipients(reservation=reservation)
        if not recipients:
            SentryLogger.log_message(
                "No recipients for the 'seasonal booking rescheduled single' email",
                details={"reservation": reservation.pk},
            )
            return

        if language is None:
            language = get_reservation_email_language(reservation=reservation)

        email_type = EmailType.SEASONAL_BOOKING_RESCHEDULED_SINGLE
        context = email_type.get_email_context(reservation, language=language)
        attachment = get_reservation_ical_attachment(reservation)
        email = EmailData.build(recipients, context, email_type, attachment=attachment)
        send_emails_in_batches_task.delay(email_data=email)

    # User #############################################################################################################

    @staticmethod
    def send_user_permissions_deactivation_emails() -> None:
        """Sends an email to users whose permissions are about to be deactivated."""
        users = (
            User.objects.should_deactivate_permissions(in_days=settings.PERMISSION_NOTIFICATION_BEFORE_DAYS)
            .exclude(models.Q(email="") | models.Q(sent_email_about_deactivating_permissions=True))
            .order_by("last_login")
        )
        if not users:
            return

        recipients_by_language = get_users_by_email_language(users)

        emails: list[EmailData] = []
        email_type = EmailType.USER_PERMISSIONS_DEACTIVATION

        for language, recipients in recipients_by_language.items():
            context = email_type.get_email_context(language=language)

            email = EmailData.build(recipients, context, email_type)
            emails.append(email)

        send_multiple_emails_in_batches_task.delay(emails=emails)
        users.update(sent_email_about_deactivating_permissions=True)

    @staticmethod
    def send_user_anonymization_emails() -> None:
        """Sends an email to users whose data is about to be anonymized."""
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
