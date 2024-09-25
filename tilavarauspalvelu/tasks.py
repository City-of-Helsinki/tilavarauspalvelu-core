from __future__ import annotations

import datetime
import logging
import uuid
from contextlib import suppress

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Prefetch
from django.db.transaction import atomic
from django.utils import timezone
from lookup_property import L

from applications.enums import ApplicationRoundStatusChoice, ApplicationSectionStatusChoice
from applications.models import Application
from common.date_utils import local_datetime
from config.celery import app
from tilavarauspalvelu.enums import EmailType, OrderStatus, ReservationNotification
from tilavarauspalvelu.exceptions import SendEmailNotificationError
from tilavarauspalvelu.models import (
    AffectingTimeSpan,
    PaymentOrder,
    Reservation,
    ReservationStatistic,
    ReservationStatisticsReservationUnit,
)
from tilavarauspalvelu.utils.email.email_sender import EmailNotificationSender
from tilavarauspalvelu.utils.pruning import (
    prune_inactive_reservations,
    prune_recurring_reservations,
    prune_reservation_statistics,
    prune_reservation_with_inactive_payments,
)
from tilavarauspalvelu.utils.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.utils.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.sentry import SentryLogger

logger = logging.getLogger(__name__)


@app.task(name="rebuild_space_tree_hierarchy")
def rebuild_space_tree_hierarchy() -> None:
    from reservation_units.models import ReservationUnitHierarchy
    from tilavarauspalvelu.models import Space

    with atomic():
        Space.objects.rebuild()
        ReservationUnitHierarchy.refresh()


@app.task(name="update_units_from_tprek")
def update_units_from_tprek() -> None:
    from tilavarauspalvelu.models import Unit
    from tilavarauspalvelu.utils.importers.tprek_unit_importer import TprekUnitImporter

    units_to_update = Unit.objects.exclude(tprek_id__isnull=True)
    tprek_unit_importer = TprekUnitImporter()
    tprek_unit_importer.update_unit_from_tprek(units_to_update)


@app.task(name="save_personal_info_view_log")
def save_personal_info_view_log(user_id: int, viewer_user_id: int, field: str) -> None:
    from tilavarauspalvelu.models import PersonalInfoViewLog

    user = get_user_model().objects.filter(id=user_id).first()
    viewer_user = get_user_model().objects.filter(id=viewer_user_id).first()

    # Do not log own views.
    if user == viewer_user:
        return

    PersonalInfoViewLog.objects.create(
        user=user,
        viewer_user=viewer_user,
        viewer_username=viewer_user.username,
        field=field,
        viewer_user_full_name=viewer_user.get_full_name(),
        viewer_user_email=viewer_user.email,
    )


@app.task(name="remove_old_personal_info_view_logs")
def remove_old_personal_info_view_logs() -> None:
    remove_personal_info_view_logs_older_than()


REMOVE_OLDER_THAN_DAYS = 365 * 2


def remove_personal_info_view_logs_older_than(days: int = REMOVE_OLDER_THAN_DAYS) -> None:
    from tilavarauspalvelu.models import PersonalInfoViewLog

    remove_lt = timezone.now() - timezone.timedelta(days=days)
    PersonalInfoViewLog.objects.filter(access_time__lt=remove_lt).delete()


@app.task(name="send_reservation_email")
def send_reservation_email_task(reservation_id: int, email_type: EmailType) -> None:
    if not settings.SEND_RESERVATION_NOTIFICATION_EMAILS:
        return
    reservation = Reservation.objects.filter(id=reservation_id).first()
    if not reservation:
        return

    email_notification_sender = EmailNotificationSender(email_type=email_type, recipients=None)
    email_notification_sender.send_reservation_email(reservation=reservation)


@app.task(name="send_staff_reservation_email")
def send_staff_reservation_email_task(
    reservation_id: int,
    email_type: EmailType,
    notification_settings: list[ReservationNotification],
) -> None:
    if not settings.SEND_RESERVATION_NOTIFICATION_EMAILS:
        return
    reservation = Reservation.objects.filter(id=reservation_id).first()
    if not reservation:
        return

    recipients = _get_reservation_staff_notification_recipients(reservation, notification_settings)
    if not recipients:
        return

    email_notification_sender = EmailNotificationSender(email_type=email_type, recipients=recipients)
    email_notification_sender.send_reservation_email(reservation=reservation, forced_language=settings.LANGUAGE_CODE)


def _get_reservation_staff_notification_recipients(
    reservation: Reservation,
    notification_settings: list[ReservationNotification],
) -> list[str]:
    """
    Get staff users who should receive reservation notifications based on their unit roles and notification settings.

    Get users with unit roles and notifications enabled, collect the ones that can manage relevant units,
    have matching notification setting are not the reservation creator
    """
    from tilavarauspalvelu.models import Unit
    from tilavarauspalvelu.models.user.model import User

    notification_recipients: list[str] = []
    reservation_units = reservation.reservation_unit.all()
    units = Unit.objects.filter(reservationunit__in=reservation_units).prefetch_related("unit_groups").distinct()
    users = User.objects.filter(unit_roles__isnull=False).exclude(reservation_notification="NONE")
    for user in users:
        # Skip users who don't have the correct unit role
        if not user.permissions.can_manage_reservations_for_units(units, any_unit=True):
            continue

        # Skip users who don't have the correct notification setting
        if not (any(user.reservation_notification.upper() == setting.upper() for setting in notification_settings)):
            continue

        # Skip the reservation creator
        if reservation.user and reservation.user.pk == user.pk:
            continue

        notification_recipients.append(user.email)

    # Remove possible duplicates
    return list(set(notification_recipients))


@app.task(name="send_application_email")
def send_application_email_task(application_id: int, email_type: EmailType) -> None:
    if not settings.SEND_RESERVATION_NOTIFICATION_EMAILS:
        return
    application = Application.objects.filter(id=application_id).first()
    if not application:
        return

    email_notification_sender = EmailNotificationSender(email_type=email_type, recipients=None)
    email_notification_sender.send_application_email(application=application)


@app.task(name="send_application_in_allocation_emails")
def send_application_in_allocation_email_task() -> None:
    if not settings.SEND_RESERVATION_NOTIFICATION_EMAILS:
        return

    # Don't try to send anything if the email template is not defined (EmailNotificationSender will raise an error)
    try:
        email_sender = EmailNotificationSender(email_type=EmailType.APPLICATION_IN_ALLOCATION, recipients=None)
    except SendEmailNotificationError:
        msg = "Tried to send an email, but Email Template for APPLICATION_IN_ALLOCATION was not found."
        SentryLogger.log_message(msg, level="warning")
        return

    # Get all applications that need a notification to be sent
    applications = Application.objects.filter(
        L(application_round__status=ApplicationRoundStatusChoice.IN_ALLOCATION.value),
        L(status=ApplicationSectionStatusChoice.IN_ALLOCATION.value),
        in_allocation_notification_sent_date__isnull=True,
        application_sections__isnull=False,
    ).order_by("created_date")
    if not applications:
        return

    email_sender.send_batch_application_emails(applications=applications)
    applications.update(in_allocation_notification_sent_date=local_datetime())


@app.task(name="send_application_handled_emails")
def send_application_handled_email_task() -> None:
    if not settings.SEND_RESERVATION_NOTIFICATION_EMAILS:
        return

    # Don't try to send anything if the email template is not defined (EmailNotificationSender will raise an error)
    try:
        email_sender = EmailNotificationSender(email_type=EmailType.APPLICATION_HANDLED, recipients=None)
    except SendEmailNotificationError:
        msg = "Tried to send an email, but Email Template for APPLICATION_HANDLED was not found."
        SentryLogger.log_message(msg, level="warning")
        return

    # Get all applications that need a notification to be sent
    applications = Application.objects.filter(
        L(application_round__status=ApplicationRoundStatusChoice.HANDLED.value),
        L(status=ApplicationSectionStatusChoice.HANDLED.value),
        results_ready_notification_sent_date__isnull=True,
        application_sections__isnull=False,
    ).order_by("created_date")
    if not applications:
        return

    email_sender.send_batch_application_emails(applications=applications)
    applications.update(results_ready_notification_sent_date=local_datetime())


@app.task(name="update_origin_hauki_resource_reservable_time_spans")
def update_origin_hauki_resource_reservable_time_spans() -> None:
    from tilavarauspalvelu.utils.opening_hours.hauki_resource_hash_updater import HaukiResourceHashUpdater

    logger.info("Updating OriginHaukiResource reservable time spans...")
    HaukiResourceHashUpdater().run()


@app.task(name="prune_reservations")
def prune_reservations_task() -> None:
    prune_inactive_reservations()
    prune_reservation_with_inactive_payments()


@app.task(name="update_expired_orders")
def update_expired_orders_task() -> None:
    older_than_minutes = settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES
    expired_datetime = local_datetime() - datetime.timedelta(minutes=older_than_minutes)
    expired_orders = PaymentOrder.objects.filter(
        status=OrderStatus.DRAFT,
        created_at__lte=expired_datetime,
        remote_id__isnull=False,
    ).all()

    for payment_order in expired_orders:
        # Do not update the PaymentOrder status if an error occurs
        with suppress(GetPaymentError, CancelOrderError), atomic():
            payment_order.refresh_order_status_from_webshop()

            if payment_order.status == OrderStatus.EXPIRED:
                payment_order.cancel_order_in_webshop()


@app.task(name="prune_reservation_statistics")
def prune_reservation_statistics_task() -> None:
    prune_reservation_statistics()


@app.task(name="prune_recurring_reservations")
def prune_recurring_reservations_task() -> None:
    prune_recurring_reservations()


@app.task(
    name="refund_paid_reservation",
    autoretry_for=(Exception,),
    max_retries=5,
    retry_backoff=True,
)
def refund_paid_reservation_task(reservation_pk: int) -> None:
    reservation = Reservation.objects.filter(pk=reservation_pk).first()
    if not reservation:
        return

    payment_order: PaymentOrder | None = PaymentOrder.objects.filter(reservation=reservation).first()
    if not payment_order:
        return

    if not settings.MOCK_VERKKOKAUPPA_API_ENABLED:
        refund = VerkkokauppaAPIClient.refund_order(order_uuid=payment_order.remote_id)
        payment_order.refund_id = refund.refund_id
    else:
        payment_order.refund_id = uuid.uuid4()
    payment_order.status = OrderStatus.REFUNDED
    payment_order.save(update_fields=["refund_id", "status"])


@app.task(name="update_affecting_time_spans")
def update_affecting_time_spans_task() -> None:
    AffectingTimeSpan.refresh()


@app.task(name="create_statistics_for_reservations")
def create_or_update_reservation_statistics(reservation_pks: list[int]) -> None:
    from reservation_units.models import ReservationUnit

    new_statistics: list[ReservationStatistic] = []
    new_statistics_units: list[ReservationStatisticsReservationUnit] = []

    reservations = (
        Reservation.objects.filter(pk__in=reservation_pks)
        .select_related(
            "user",
            "recurring_reservation",
            "recurring_reservation__ability_group",
            "recurring_reservation__allocated_time_slot",
            "deny_reason",
            "cancel_reason",
            "purpose",
            "home_city",
            "age_group",
        )
        .prefetch_related(
            Prefetch(
                "reservation_unit",
                queryset=ReservationUnit.objects.select_related("unit"),
            ),
        )
    )

    for reservation in reservations:
        statistic = ReservationStatistic.for_reservation(reservation, save=False)
        statistic_units = ReservationStatisticsReservationUnit.for_statistic(statistic, save=False)
        new_statistics.append(statistic)
        new_statistics_units.extend(statistic_units)

    fields_to_update: list[str] = [
        field.name
        for field in ReservationStatistic._meta.get_fields()
        # Update all fields that can be updated
        if field.concrete and not field.many_to_many and not field.primary_key
    ]

    with transaction.atomic():
        new_statistics = ReservationStatistic.objects.bulk_create(
            new_statistics,
            update_conflicts=True,
            update_fields=fields_to_update,
            unique_fields=["reservation"],
        )
        ReservationStatisticsReservationUnit.objects.filter(reservation_statistics__in=new_statistics).delete()
        ReservationStatisticsReservationUnit.objects.bulk_create(new_statistics_units)
