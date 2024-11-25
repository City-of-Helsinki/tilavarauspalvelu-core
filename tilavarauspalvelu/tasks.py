from __future__ import annotations

import datetime
import json
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
from elasticsearch_django.index import create_index, delete_index, update_index
from lookup_property import L

from config.celery import app
from tilavarauspalvelu.enums import (
    ApplicantTypeChoice,
    ApplicationRoundStatusChoice,
    ApplicationStatusChoice,
    CustomerTypeChoice,
    HaukiResourceState,
    OrderStatus,
    ReservationStateChoice,
    ReservationTypeChoice,
    Weekday,
)
from tilavarauspalvelu.models import (
    AffectingTimeSpan,
    AllocatedTimeSlot,
    Application,
    PaymentOrder,
    PaymentProduct,
    PersonalInfoViewLog,
    RecurringReservation,
    Reservation,
    ReservationStatistic,
    ReservationStatisticsReservationUnit,
    ReservationUnit,
    ReservationUnitHierarchy,
    ReservationUnitImage,
    ReservationUnitPricing,
    Space,
    TaxPercentage,
    Unit,
    User,
)
from tilavarauspalvelu.models.recurring_reservation.actions import ReservationDetails
from tilavarauspalvelu.models.request_log.model import RequestLog
from tilavarauspalvelu.models.sql_log.model import SQLLog
from tilavarauspalvelu.services.permission_service import deactivate_old_permissions
from tilavarauspalvelu.translation import translate_for_user
from tilavarauspalvelu.utils.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.utils.opening_hours.time_span_element import TimeSpanElement
from tilavarauspalvelu.utils.pruning import (
    prune_inactive_reservations,
    prune_recurring_reservations,
    prune_reservation_statistics,
    prune_reservation_with_inactive_payments,
)
from tilavarauspalvelu.utils.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.utils.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.utils.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError
from tilavarauspalvelu.utils.verkkokauppa.product.types import CreateOrUpdateAccountingParams, CreateProductParams
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_date, local_datetime, local_end_of_day, local_start_of_day
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    from collections.abc import Collection, Iterable

    from tilavarauspalvelu.models import Address, Organisation, Person
    from tilavarauspalvelu.typing import QueryInfo

type Action = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]

logger = logging.getLogger(__name__)


@app.task(name="rebuild_space_tree_hierarchy")
def rebuild_space_tree_hierarchy() -> None:
    with atomic():
        Space.objects.rebuild()
        ReservationUnitHierarchy.refresh()


@app.task(name="update_units_from_tprek")
def update_units_from_tprek() -> None:
    from tilavarauspalvelu.utils.importers.tprek_unit_importer import TprekUnitImporter

    units_to_update = Unit.objects.exclude(tprek_id__isnull=True)
    tprek_unit_importer = TprekUnitImporter()
    tprek_unit_importer.update_unit_from_tprek(units_to_update)


@app.task(name="save_personal_info_view_log")
def save_personal_info_view_log(user_id: int, viewer_user_id: int, field: str) -> None:
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
    remove_lt = timezone.now() - timezone.timedelta(days=365 * 2)
    PersonalInfoViewLog.objects.filter(access_time__lt=remove_lt).delete()


@app.task(name="update_origin_hauki_resource_reservable_time_spans")
def update_origin_hauki_resource_reservable_time_spans() -> None:
    from tilavarauspalvelu.utils.opening_hours.hauki_resource_hash_updater import HaukiResourceHashUpdater

    logger.info("Updating OriginHaukiResource reservable time spans...")
    HaukiResourceHashUpdater().run()


@app.task(name="prune_reservations")
def prune_reservations_task() -> None:
    prune_inactive_reservations()
    prune_reservation_with_inactive_payments()


@app.task(name="send_application_in_allocation_email")
def send_application_in_allocation_email_task() -> None:
    from tilavarauspalvelu.integrations.email.main import EmailService

    EmailService.send_application_in_allocation_emails()


@app.task(name="send_application_handled_email")
def send_application_handled_email_task() -> None:
    from tilavarauspalvelu.integrations.email.main import EmailService

    EmailService.send_application_handled_emails()


@app.task(name="update_expired_orders")
def update_expired_orders_task() -> None:
    older_than_minutes = settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES
    expired_datetime = local_datetime() - datetime.timedelta(minutes=older_than_minutes)
    expired_orders: Iterable[PaymentOrder] = PaymentOrder.objects.filter(
        status=OrderStatus.DRAFT,
        created_at__lte=expired_datetime,
        remote_id__isnull=False,
    ).all()

    for payment_order in expired_orders:
        # Do not update the PaymentOrder status if an error occurs
        with suppress(GetPaymentError, CancelOrderError), atomic():
            payment_order.actions.refresh_order_status_from_webshop()

            if payment_order.status == OrderStatus.EXPIRED:
                payment_order.actions.cancel_order_in_webshop()


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


@app.task(name="update_reservation_unit_hierarchy")
def update_reservation_unit_hierarchy_task(using: str | None = None) -> None:
    ReservationUnitHierarchy.refresh(using=using)


@app.task(name="update_affecting_time_spans")
def update_affecting_time_spans_task(using: str | None = None) -> None:
    AffectingTimeSpan.refresh(using=using)


@app.task(name="create_statistics_for_reservations")
def create_or_update_reservation_statistics(reservation_pks: list[int]) -> None:
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
                "reservation_units",
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


@app.task(name="update_reservation_unit_pricings_tax_percentage")
def update_reservation_unit_pricings_tax_percentage(
    change_date: str,
    current_tax: str,
    future_tax: str,
    ignored_company_codes: Collection[str] = (),
) -> None:
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
            Q(begins__lte=change_date, highest_price=0)  # Ignore FREE pricings after the change date
            | Q(highest_price__gt=0)
        )
        .exclude(reservation_unit__payment_accounting__company_code__in=ignored_company_codes)
        .exclude(
            # Use Unit's Payment Accounting, only if Reservation Unit's Payment Accounting is not set
            reservation_unit__unit__payment_accounting__company_code__in=ignored_company_codes,
            reservation_unit__payment_accounting__isnull=True,
        )
        .order_by("reservation_unit_id", "-begins")
        .distinct("reservation_unit_id")
    )
    for pricing in latest_pricings:
        # Skip pricings that are FREE or have a different tax percentage
        # We don't want to filter these away in the queryset, as that might cause us to incorrectly create new pricings
        # in some cases. e.g. Current pricing is PAID, but the future pricing is FREE or has a different tax percentage.
        if (
            pricing.highest_price > 0
            and pricing.tax_percentage == current_tax_percentage
            # Don't create a new pricing if the reservation unit has a future pricing after the change date
            and pricing.begins < change_date
        ):
            ReservationUnitPricing(
                begins=change_date,
                tax_percentage=future_tax_percentage,
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
        highest_price__gt=0,
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
def refresh_reservation_unit_product_mapping(reservation_unit_pk: int) -> None:
    reservation_unit = ReservationUnit.objects.filter(pk=reservation_unit_pk).first()
    if reservation_unit is None:
        SentryLogger.log_message(
            message=f"Unable to refresh reservation unit ({reservation_unit_pk}) product mapping.",
            details=f"Reservation unit ({reservation_unit_pk}) not found.",
            level="warning",
        )
        return

    payment_merchant = reservation_unit.actions.get_merchant()

    if reservation_unit.actions.requires_product_mapping_update():
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
def refresh_reservation_unit_accounting(reservation_unit_pk: int) -> None:
    reservation_unit = ReservationUnit.objects.filter(pk=reservation_unit_pk).first()
    if reservation_unit is None:
        SentryLogger.log_message(
            message=f"Unable to refresh reservation unit ({reservation_unit_pk}) accounting data.",
            details=f"Reservation unit ({reservation_unit_pk}) not found.",
            level="warning",
        )
        return

    accounting = reservation_unit.actions.get_accounting()

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
def create_reservation_unit_thumbnails_and_urls(pk: int | None = None) -> None:
    """Create optimized thumbnail images and update URLs to the reservation unit instances."""
    reservation_unit_images = ReservationUnitImage.objects.filter(image__isnull=False)
    if pk is not None:
        reservation_unit_images = reservation_unit_images.filter(pk=pk)

    images: list[ReservationUnitImage] = list(reservation_unit_images)
    if not images:
        return

    for image in images:
        try:
            image.large_url = image.image["large"].url
            image.medium_url = image.image["medium"].url
            image.small_url = image.image["small"].url
        except InvalidImageFormatError as err:
            SentryLogger.log_exception(err, details="Unable to update image urls", reservation_unit_image_id=image.pk)

    ReservationUnitImage.objects.bulk_update(images, ["large_url", "medium_url", "small_url"])


@app.task(name="purge_image_cache")
def purge_image_cache(image_path: str) -> None:
    from utils.image_cache import purge

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

    reservee_type = ApplicantTypeChoice(application.applicant_type).customer_type_choice
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

        reservation_details["description"] = getattr(organisation, "core_business", "")
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


@app.task(name="delete_expired_applications")
def delete_expired_applications() -> None:
    cutoff_date = local_date() - datetime.timedelta(days=settings.REMOVE_EXPIRED_APPLICATIONS_OLDER_THAN_DAYS)
    Application.objects.filter(
        L(status__in=[ApplicationStatusChoice.EXPIRED, ApplicationStatusChoice.CANCELLED])
        & L(application_round__status=ApplicationRoundStatusChoice.RESULTS_SENT)
        & Q(application_round__application_period_end__lte=cutoff_date)
    ).delete()


@app.task(name="save_sql_queries_from_request")
def save_sql_queries_from_request(queries: list[QueryInfo], path: str, body: bytes, duration_ms: int) -> None:
    decoded_body: str | None = None
    if path.startswith("/graphql"):
        with suppress(Exception):
            decoded_body = body.decode()
        if decoded_body:
            data = json.loads(decoded_body)
            decoded_body = data.get("query")

    request_log = RequestLog.objects.create(
        path=path,
        body=decoded_body,
        duration_ms=duration_ms,
    )
    sql_logs = [
        SQLLog(
            request_log=request_log,
            sql=query["sql"],
            succeeded=query["succeeded"],
            duration_ns=query["duration_ns"],
            stack_info=query["stack_info"],
        )
        for query in queries
    ]
    SQLLog.objects.bulk_create(sql_logs)

    log_to_sentry_if_suspicious(request_log, duration_ms)


def log_to_sentry_if_suspicious(request_log: RequestLog, duration_ms: int) -> None:
    if duration_ms >= settings.QUERY_LOGGING_DURATION_MS_THRESHOLD:
        msg = "Request took too suspiciously long to complete"
        details = {
            "request_log": request_log.request_id,
            "duration": duration_ms,
        }
        SentryLogger.log_message(msg, details=details, level="warning")

    if request_log.body and (body_length := len(request_log.body)) >= settings.QUERY_LOGGING_BODY_LENGTH_THRESHOLD:
        msg = "Body of request is too suspiciously large"
        details = {
            "request_log": request_log.request_id,
            "body_length": body_length,
        }
        SentryLogger.log_message(msg, details=details, level="warning")

    if num_of_queries := request_log.sql_logs.count() >= settings.QUERY_LOGGING_QUERY_COUNT_THRESHOLD:
        msg = "Request made suspiciously many queries"
        details = {
            "request_log": request_log.request_id,
            "num_of_queries": num_of_queries,
        }
        SentryLogger.log_message(msg, details=details, level="warning")


@app.task(name="Update ReservationUnit Elastic index")
def update_reservation_unit_elastic_index() -> None:
    index = next(iter(settings.SEARCH_SETTINGS["indexes"].keys()))
    update_index(index)


@app.task(name="Create ReservationUnit Elastic index")
def create_reservation_unit_elastic_index() -> None:
    index = next(iter(settings.SEARCH_SETTINGS["indexes"].keys()))
    create_index(index)


@app.task(name="Delete ReservationUnit Elastic index")
def delete_reservation_unit_elastic_index() -> None:
    index = next(iter(settings.SEARCH_SETTINGS["indexes"].keys()))
    delete_index(index)


@app.task(name="deactivate_old_permissions")
def deactivate_old_permissions_task() -> None:
    deactivate_old_permissions()


@app.task(name="send_permission_deactivation_email")
def send_permission_deactivation_email_task() -> None:
    from tilavarauspalvelu.integrations.email.main import EmailService

    EmailService.send_permission_deactivation_emails()


@app.task(name="send_user_anonymization_email")
def send_user_anonymization_email_task() -> None:
    from tilavarauspalvelu.integrations.email.main import EmailService

    EmailService.send_user_anonymization_emails()


@app.task(name="anonymize_old_users")
def anonymize_old_users_task() -> None:
    User.objects.anonymize_inactive_users()
