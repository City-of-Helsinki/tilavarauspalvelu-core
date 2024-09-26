from __future__ import annotations

import datetime
import logging
import uuid
from contextlib import suppress
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Literal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Prefetch, Q
from django.db.transaction import atomic
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from easy_thumbnails.exceptions import InvalidImageFormatError
from lookup_property import L

from common.date_utils import local_datetime, local_end_of_day, local_start_of_day
from common.utils import translate_for_user
from config.celery import app
from tilavarauspalvelu.enums import (
    ApplicantTypeChoice,
    ApplicationRoundStatusChoice,
    ApplicationSectionStatusChoice,
    CustomerTypeChoice,
    EmailType,
    HaukiResourceState,
    OrderStatus,
    PricingStatus,
    PricingType,
    ReservationNotification,
    ReservationStateChoice,
    ReservationTypeChoice,
    Weekday,
)
from tilavarauspalvelu.exceptions import SendEmailNotificationError
from tilavarauspalvelu.models import (
    AffectingTimeSpan,
    AllocatedTimeSlot,
    Application,
    PaymentOrder,
    PaymentProduct,
    RecurringReservation,
    Reservation,
    ReservationStatistic,
    ReservationStatisticsReservationUnit,
)
from tilavarauspalvelu.models.recurring_reservation.actions import ReservationDetails
from tilavarauspalvelu.utils.email.email_sender import EmailNotificationSender
from tilavarauspalvelu.utils.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.utils.opening_hours.time_span_element import TimeSpanElement
from tilavarauspalvelu.utils.pricing_updates import update_reservation_unit_pricings
from tilavarauspalvelu.utils.pruning import (
    prune_inactive_reservations,
    prune_recurring_reservations,
    prune_reservation_statistics,
    prune_reservation_with_inactive_payments,
)
from tilavarauspalvelu.utils.reservation_units.reservation_unit_payment_helper import ReservationUnitPaymentHelper
from tilavarauspalvelu.utils.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.utils.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.utils.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError
from tilavarauspalvelu.utils.verkkokauppa.product.types import CreateOrUpdateAccountingParams, CreateProductParams
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.image_cache import purge
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    from collections.abc import Collection

    from tilavarauspalvelu.models import Address, Organisation, Person


type Action = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]

logger = logging.getLogger(__name__)


@app.task(name="rebuild_space_tree_hierarchy")
def rebuild_space_tree_hierarchy() -> None:
    from tilavarauspalvelu.models import ReservationUnitHierarchy, Space

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
    from tilavarauspalvelu.models import PersonalInfoViewLog

    remove_lt = timezone.now() - timezone.timedelta(days=365 * 2)
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
    from tilavarauspalvelu.models import Unit, User

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
    from tilavarauspalvelu.models import ReservationUnit

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


@app.task(name="update_reservation_unit_pricings")
def _update_reservation_unit_pricings() -> None:
    today = date.today()

    logger.info(f"Updating reservation unit pricing with date {today}")
    num_updated = update_reservation_unit_pricings(today)
    logger.info(f"Updated {num_updated} reservation units with date {today}")


@app.task(name="update_reservation_unit_pricings_tax_percentage")
def update_reservation_unit_pricings_tax_percentage(
    change_date: str,
    current_tax: str,
    future_tax: str,
    ignored_company_codes: Collection[str] = (),
) -> None:
    from tilavarauspalvelu.models import ReservationUnitPricing, TaxPercentage

    SentryLogger.log_message(
        message="Task `update_reservation_unit_pricings_tax_percentage` started",
        details=(
            f"Task was run with "
            f"change_date: {change_date}, "
            f"current_tax: {current_tax}, "
            f"future_tax: {future_tax}, "
            f"ignored_company_codes: {ignored_company_codes}"
        ),
        level="info",
    )

    change_date = date.fromisoformat(change_date)  # e.g. "2024-09-01"
    current_tax_percentage, _ = TaxPercentage.objects.get_or_create(value=Decimal(current_tax))
    future_tax_percentage, _ = TaxPercentage.objects.get_or_create(value=Decimal(future_tax))

    # Last pricing for each reservation unit before the change date
    latest_pricings = (
        ReservationUnitPricing.objects.filter(
            Q(begins__lte=change_date, pricing_type=PricingType.FREE)  # Ignore FREE pricings after the change date
            | Q(pricing_type=PricingType.PAID)
        )
        .filter(status__in=(PricingStatus.PRICING_STATUS_ACTIVE, PricingStatus.PRICING_STATUS_FUTURE))
        .exclude(reservation_unit__payment_accounting__company_code__in=ignored_company_codes)
        .order_by("reservation_unit_id", "-begins")
        .distinct("reservation_unit_id")
    )
    for pricing in latest_pricings:
        # Skip pricings that are FREE or have a different tax percentage
        # We don't want to filter these away in the queryset, as that might cause us to incorrectly create new pricings
        # in some cases. e.g. Current pricing is PAID, but the future pricing is FREE or has a different tax percentage.
        if (
            pricing.pricing_type == PricingType.PAID
            and pricing.highest_price > 0
            and pricing.tax_percentage == current_tax_percentage
            # Don't create a new pricing if the reservation unit has a future pricing after the change date
            and pricing.begins < change_date
        ):
            ReservationUnitPricing(
                begins=change_date,
                tax_percentage=future_tax_percentage,
                status=PricingStatus.PRICING_STATUS_FUTURE,
                pricing_type=pricing.pricing_type,
                price_unit=pricing.price_unit,
                lowest_price=pricing.lowest_price,
                highest_price=pricing.highest_price,
                reservation_unit=pricing.reservation_unit,
            ).save()

    # Log any unhandled future pricings
    # PAID Pricings that begin on or after the change date
    unhandled_future_pricings = ReservationUnitPricing.objects.filter(
        begins__gte=change_date,
        tax_percentage=current_tax_percentage,
        pricing_type=PricingType.PAID,
        highest_price__gte=0,
        status__in=(PricingStatus.PRICING_STATUS_ACTIVE, PricingStatus.PRICING_STATUS_FUTURE),
    )

    if not unhandled_future_pricings:
        return

    for pricing in unhandled_future_pricings:
        logger.info(f"Pricing should be handled manually: {pricing.id} {pricing.reservation_unit.name} {pricing}")

    unhandled_future_pricings_str = ", ".join(
        [f"<{pricing.id}: {pricing.reservation_unit}: {pricing}>" for pricing in unhandled_future_pricings]
    )
    SentryLogger.log_message(
        message="Task `update_reservation_unit_pricings_tax_percentage` has unhandled future pricings",
        details=f"Task found the following unhandled future pricings: {unhandled_future_pricings_str}",
        level="info",
    )


@app.task(
    name="refresh_reservation_unit_product_mapping",
    autoretry_for=(TypeError,),
    max_retries=5,
    retry_backoff=True,
)
def refresh_reservation_unit_product_mapping(reservation_unit_pk) -> None:
    from tilavarauspalvelu.models import ReservationUnit

    reservation_unit = ReservationUnit.objects.filter(pk=reservation_unit_pk).first()
    if reservation_unit is None:
        SentryLogger.log_message(
            message=f"Unable to refresh reservation unit ({reservation_unit_pk}) product mapping.",
            details=f"Reservation unit ({reservation_unit_pk}) not found.",
            level="warning",
        )
        return

    payment_merchant = ReservationUnitPaymentHelper.get_merchant(reservation_unit)

    if ReservationUnitPaymentHelper.requires_product_mapping_update(reservation_unit):
        params = CreateProductParams(
            namespace=settings.VERKKOKAUPPA_NAMESPACE,
            namespace_entity_id=reservation_unit.pk,
            merchant_id=payment_merchant.id,
        )
        api_product = VerkkokauppaAPIClient.create_product(params=params)
        payment_product, _ = PaymentProduct.objects.update_or_create(
            id=api_product.product_id,
            defaults={"merchant": payment_merchant},
        )

        ReservationUnit.objects.filter(pk=reservation_unit_pk).update(payment_product=payment_product)

        refresh_reservation_unit_accounting.delay(reservation_unit_pk)

    # Remove product mapping if merchant is removed
    if reservation_unit.payment_product and not payment_merchant:
        ReservationUnit.objects.filter(pk=reservation_unit_pk).update(payment_product=None)


@app.task(
    name="refresh_reservation_unit_accounting",
    autoretry_for=(TypeError,),
    max_retries=5,
    retry_backoff=True,
)
def refresh_reservation_unit_accounting(reservation_unit_pk) -> None:
    from tilavarauspalvelu.models import ReservationUnit

    reservation_unit = ReservationUnit.objects.filter(pk=reservation_unit_pk).first()
    if reservation_unit is None:
        SentryLogger.log_message(
            message=f"Unable to refresh reservation unit ({reservation_unit_pk}) accounting data.",
            details=f"Reservation unit ({reservation_unit_pk}) not found.",
            level="warning",
        )
        return

    accounting = ReservationUnitPaymentHelper.get_accounting(reservation_unit)

    if reservation_unit.payment_product and accounting:
        params = CreateOrUpdateAccountingParams(
            vat_code=accounting.vat_code,
            internal_order=accounting.internal_order,
            profit_center=accounting.profit_center,
            project=accounting.project,
            operation_area=accounting.operation_area,
            company_code=accounting.company_code,
            main_ledger_account=accounting.main_ledger_account,
            balance_profit_center=accounting.balance_profit_center,
        )
        try:
            VerkkokauppaAPIClient.create_or_update_accounting(
                product_uuid=reservation_unit.payment_product.id, params=params
            )
        except CreateOrUpdateAccountingError as err:
            SentryLogger.log_exception(
                err,
                details="Unable to refresh reservation unit accounting data",
                reservation_unit_id=reservation_unit_pk,
            )


@app.task(name="update_reservation_unit_image_urls")
def update_urls(pk: int | None = None) -> None:
    from tilavarauspalvelu.models import ReservationUnitImage

    images = ReservationUnitImage.objects.filter(image__isnull=False)

    if pk:
        images = images.filter(pk=pk)

    for image in images:
        try:
            image.large_url = image.image["large"].url
            image.medium_url = image.image["medium"].url
            image.small_url = image.image["small"].url
            image.save(update_urls=False)

        except InvalidImageFormatError as err:
            SentryLogger.log_exception(err, details="Unable to update image urls", reservation_unit_image_id=image.pk)


@app.task(name="purge_image_cache")
def purge_image_cache(image_path: str) -> None:
    purge(image_path)


def _get_series_override_closed_time_spans(allocations: list[AllocatedTimeSlot]) -> dict[int, list[TimeSpanElement]]:
    """
    Find all closed opening hours for all reservation units where allocations were made.
    Check against these and not fully normalized opening hours since allocations can be made
    outside opening hours (as this system defines them), but should not be on explicitly
    closed hours, like holidays.
    """
    closed_time_spans: dict[int, list[TimeSpanElement]] = {}
    for allocation in allocations:
        resource = allocation.reservation_unit_option.reservation_unit.origin_hauki_resource
        if resource is None or resource.id in closed_time_spans:
            continue  # Skip if already fetched

        application_round = allocation.reservation_unit_option.application_section.application.application_round

        # Fetch periods from Hauki API
        date_periods = HaukiAPIClient.get_date_periods(
            hauki_resource_id=resource.id,
            start_date_lte=application_round.reservation_period_end.isoformat(),  # Starts before period ends
            end_date_gte=application_round.reservation_period_begin.isoformat(),  # Ends after period begins
        )

        # Convert periods to TimeSpanElements
        closed_time_spans[resource.id] = [
            TimeSpanElement(
                start_datetime=local_start_of_day(datetime.date.fromisoformat(period["start_date"])),
                end_datetime=local_end_of_day(datetime.date.fromisoformat(period["end_date"])),
                is_reservable=False,
            )
            for period in date_periods
            # Overriding closed date periods are exceptions to the normal opening hours
            if period["override"] and period["resource_state"] == HaukiResourceState.CLOSED.value
        ]

    return closed_time_spans


def _get_recurring_reservation_details(recurring_reservation: RecurringReservation) -> ReservationDetails:
    application_section = recurring_reservation.allocated_time_slot.reservation_unit_option.application_section
    application = application_section.application

    reservee_type = ApplicantTypeChoice(application.applicant_type).get_customer_type_choice()
    contact_person: Person | None = getattr(application, "contact_person", None)
    billing_address: Address | None = getattr(application, "billing_address", None)

    reservation_details = ReservationDetails(
        name=recurring_reservation.name,
        type=ReservationTypeChoice.SEASONAL,
        reservee_type=reservee_type,
        state=ReservationStateChoice.CONFIRMED,
        user=recurring_reservation.user,
        handled_at=application.application_round.handled_date,
        num_persons=application_section.num_persons,
        buffer_time_before=datetime.timedelta(0),
        buffer_time_after=datetime.timedelta(0),
        reservee_first_name=getattr(contact_person, "first_name", ""),
        reservee_last_name=getattr(contact_person, "last_name", ""),
        reservee_email=getattr(contact_person, "email", ""),
        reservee_phone=getattr(contact_person, "phone_number", ""),
        billing_address_street=getattr(billing_address, "street_address", ""),
        billing_address_city=getattr(billing_address, "city", ""),
        billing_address_zip=getattr(billing_address, "post_code", ""),
        purpose=application_section.purpose,
        home_city=application.home_city,
    )

    if reservee_type == CustomerTypeChoice.INDIVIDUAL:
        reservation_details["description"] = application.additional_information
        reservation_details["reservee_address_street"] = reservation_details["billing_address_street"]
        reservation_details["reservee_address_city"] = reservation_details["billing_address_city"]
        reservation_details["reservee_address_zip"] = reservation_details["billing_address_zip"]

    else:
        organisation: Organisation | None = getattr(application, "organisation", None)
        organisation_identifier: str = getattr(organisation, "identifier", "") or ""
        organisation_address: Address | None = getattr(organisation, "address", None)

        reservation_details["description"] = (
            translate_for_user(_("Core business"), application.user) + f": {organisation.core_business}"
        )
        reservation_details["reservee_organisation_name"] = getattr(organisation, "name", "")
        reservation_details["reservee_id"] = organisation_identifier
        reservation_details["reservee_is_unregistered_association"] = not organisation_identifier
        reservation_details["reservee_address_street"] = getattr(organisation_address, "street_address", "")
        reservation_details["reservee_address_city"] = getattr(organisation_address, "city", "")
        reservation_details["reservee_address_zip"] = getattr(organisation_address, "post_code", "")

    return reservation_details


@app.task(name="generate_reservation_series_from_allocations")
@SentryLogger.log_if_raises("Failed to generate reservation series from allocations")
def generate_reservation_series_from_allocations(application_round_id: int) -> None:
    allocations = AllocatedTimeSlot.objects.filter(
        reservation_unit_option__application_section__application__application_round=application_round_id,
    ).select_related(
        "reservation_unit_option__reservation_unit__origin_hauki_resource",
        "reservation_unit_option__application_section__application__application_round",
    )

    closed_time_spans: dict[int, list[TimeSpanElement]] = _get_series_override_closed_time_spans(allocations)

    recurring_reservations: list[RecurringReservation] = [
        RecurringReservation(
            name=allocation.reservation_unit_option.application_section.name,
            description=translate_for_user(
                _("Seasonal Booking"),
                allocation.reservation_unit_option.application_section.application.user,
            ),
            begin_date=allocation.reservation_unit_option.application_section.reservations_begin_date,
            begin_time=allocation.begin_time,
            end_date=allocation.reservation_unit_option.application_section.reservations_end_date,
            end_time=allocation.end_time,
            recurrence_in_days=7,
            weekdays=str(Weekday(allocation.day_of_the_week).as_weekday_number),
            reservation_unit=allocation.reservation_unit_option.reservation_unit,
            user=allocation.reservation_unit_option.application_section.application.user,
            allocated_time_slot=allocation,
            age_group=allocation.reservation_unit_option.application_section.age_group,
        )
        for allocation in allocations
    ]

    reservation_pks: set[int] = set()

    with transaction.atomic():
        recurring_reservations = RecurringReservation.objects.bulk_create(recurring_reservations)

        for recurring_reservation in recurring_reservations:
            reservation_details: ReservationDetails = _get_recurring_reservation_details(recurring_reservation)

            hauki_resource_id = getattr(recurring_reservation.reservation_unit.origin_hauki_resource, "id", None)
            slots = recurring_reservation.actions.pre_calculate_slots(
                check_start_interval=True,
                closed_hours=closed_time_spans.get(hauki_resource_id, []),
            )

            reservations = recurring_reservation.actions.bulk_create_reservation_for_periods(
                periods=slots.possible,
                reservation_details=reservation_details,
            )
            reservation_pks.update(reservation.pk for reservation in reservations)

            recurring_reservation.actions.bulk_create_rejected_occurrences_for_periods(
                overlapping=slots.overlapping,
                not_reservable=slots.not_reservable,
                invalid_start_interval=slots.invalid_start_interval,
            )

    # Must refresh the materialized view after the reservation is created.
    if settings.UPDATE_AFFECTING_TIME_SPANS:
        update_affecting_time_spans_task.delay()

    if settings.SAVE_RESERVATION_STATISTICS:
        create_or_update_reservation_statistics.delay(reservation_pks=list(reservation_pks))
