from __future__ import annotations

import datetime
import time
import uuid
from contextlib import suppress
from decimal import Decimal
from functools import wraps
from typing import TYPE_CHECKING

from django.core.cache import cache
from django.db import transaction

from config.celery import app
from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import (
    AffectingTimeSpan,
    Application,
    ApplicationRound,
    PaymentOrder,
    PersonalInfoViewLog,
    RecurringReservation,
    Reservation,
    ReservationStatistic,
    ReservationUnit,
    ReservationUnitHierarchy,
    ReservationUnitImage,
    ReservationUnitPricing,
    Space,
    SQLLog,
    TaxPercentage,
    Unit,
    User,
)
from utils.date_utils import local_datetime
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from collections.abc import Collection

    from celery.contrib.django.task import Task

    from tilavarauspalvelu.typing import QueryInfo


__all__ = [
    "anonymize_old_users_task",
    "create_missing_pindora_reservations",
    "create_reservation_unit_thumbnails_and_urls",
    "deactivate_old_permissions_task",
    "delete_expired_applications",
    "delete_pindora_reservation",
    "generate_reservation_series_from_allocations",
    "prune_recurring_reservations_task",
    "prune_reservation_statistics_task",
    "prune_reservations_task",
    "purge_image_cache",
    "rebuild_space_tree_hierarchy",
    "refresh_reservation_unit_accounting",
    "refresh_reservation_unit_product_mapping",
    "refund_paid_reservation_task",
    "remove_old_personal_info_view_logs",
    "save_personal_info_view_log",
    "save_sql_queries_from_request",
    "send_application_handled_email_task",
    "send_application_in_allocation_email_task",
    "send_permission_deactivation_email_task",
    "send_user_anonymization_email_task",
    "update_affecting_time_spans_task",
    "update_expired_orders_task",
    "update_origin_hauki_resource_reservable_time_spans",
    "update_pindora_access_code_is_active",
    "update_reservation_unit_hierarchy_task",
    "update_reservation_unit_pricings_tax_percentage",
    "update_reservation_unit_search_vectors_task",
    "update_units_from_tprek",
]


def singleton_task[**P](task: Task) -> Task:
    """
    Lock task execution to a single concurrent instance based on a lock set in cache.
    Must be added on top of the `@app.task` decorator!

    See: https://docs.celeryq.dev/en/stable/tutorials/task-cookbook.html#ensuring-a-task-is-only-executed-one-at-a-time
    """
    task_func = task.run

    @wraps(task_func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> None:
        lock_timeout = 300  # 5 mins
        timeout_leeway = 3  # Some leeway for cache operations

        timeout_at = time.monotonic() + lock_timeout - timeout_leeway
        lock_id: str = task.name

        # Assuming the operation here is atomic, or at least close enough to be safe.
        has_lock = cache.add(lock_id, 1, lock_timeout)

        if not has_lock:
            SentryLogger.log_message(
                message="Task skipped since another instance is already running.",
                details={"task_name": task.name},
            )
            return None

        try:
            return task_func(*args, **kwargs)
        finally:
            # Only release lock if we didn't time out (another task may have acquired the lock)
            if time.monotonic() < timeout_at:
                cache.delete(lock_id)

    task.run = wrapper
    return task


@app.task(name="rebuild_space_tree_hierarchy")
def rebuild_space_tree_hierarchy() -> None:
    with transaction.atomic():
        Space.objects.rebuild()
        ReservationUnitHierarchy.refresh()


@app.task(name="update_units_from_tprek")
def update_units_from_tprek() -> None:
    from tilavarauspalvelu.integrations.tprek.tprek_unit_importer import TprekUnitImporter

    units_to_update = Unit.objects.exclude(tprek_id__isnull=True)
    tprek_unit_importer = TprekUnitImporter()
    tprek_unit_importer.update_unit_from_tprek(units_to_update)


@app.task(name="save_personal_info_view_log")
def save_personal_info_view_log(user_id: int, viewer_user_id: int, field: str) -> None:
    user = User.objects.filter(id=user_id).first()
    viewer_user = User.objects.filter(id=viewer_user_id).first()

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
    remove_lt = local_datetime() - datetime.timedelta(days=365 * 2)
    PersonalInfoViewLog.objects.filter(access_time__lt=remove_lt).delete()


@app.task(name="update_origin_hauki_resource_reservable_time_spans")
def update_origin_hauki_resource_reservable_time_spans() -> None:
    from tilavarauspalvelu.integrations.opening_hours.hauki_resource_hash_updater import HaukiResourceHashUpdater

    HaukiResourceHashUpdater().run()


@app.task(name="prune_reservations")
def prune_reservations_task() -> None:
    Reservation.objects.delete_inactive()
    Reservation.objects.delete_with_inactive_payments()


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
    from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CancelOrderError
    from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError

    for payment_order in PaymentOrder.objects.expired():
        # Do not update the PaymentOrder status if an error occurs
        with suppress(GetPaymentError, CancelOrderError), transaction.atomic():
            payment_order.actions.refresh_order_status_from_webshop()

            if payment_order.status == OrderStatus.EXPIRED:
                payment_order.actions.cancel_order_in_webshop()


@app.task(name="prune_reservation_statistics")
def prune_reservation_statistics_task() -> None:
    ReservationStatistic.objects.delete_expired_statistics()


@app.task(name="prune_recurring_reservations")
def prune_recurring_reservations_task() -> None:
    RecurringReservation.objects.delete_empty_series()


@app.task(
    name="refund_paid_reservation",
    autoretry_for=(Exception,),
    max_retries=5,
    retry_backoff=True,
)
def refund_paid_reservation_task(reservation_pk: int) -> None:
    reservation: Reservation | None = Reservation.objects.filter(pk=reservation_pk).first()
    if reservation is not None:
        reservation.actions.refund_paid_reservation()


@app.task(name="update_reservation_unit_hierarchy")
def update_reservation_unit_hierarchy_task(using: str | None = None) -> None:
    ReservationUnitHierarchy.refresh(using=using)


@app.task(name="update_affecting_time_spans")
def update_affecting_time_spans_task(using: str | None = None) -> None:
    AffectingTimeSpan.refresh(using=using)


@app.task(name="create_statistics_for_reservations")
def create_or_update_reservation_statistics(reservation_pks: list[int]) -> None:
    Reservation.objects.upsert_statistics(reservation_pks=reservation_pks)


@app.task(name="update_reservation_unit_pricings_tax_percentage")
def update_reservation_unit_pricings_tax_percentage(
    change_date: str,
    current_tax: str,
    future_tax: str,
    ignored_company_codes: Collection[str] = (),
) -> None:
    SentryLogger.log_message(
        message="Task `update_reservation_unit_pricings_tax_percentage` started",
        details=f"Task was run with {change_date=}, {current_tax=}, {future_tax=}, {ignored_company_codes=}",
        level="info",
    )

    change_date = datetime.date.fromisoformat(change_date)
    current_tax_percentage, _ = TaxPercentage.objects.get_or_create(value=Decimal(current_tax))
    future_tax_percentage, _ = TaxPercentage.objects.get_or_create(value=Decimal(future_tax))

    ReservationUnitPricing.actions.add_new_pricings_for_tax_percentage(
        future_tax_percentage=future_tax_percentage,
        current_tax_percentage=current_tax_percentage,
        change_date=change_date,
        ignored_company_codes=ignored_company_codes,
    )

    # Log any unhandled future pricings
    # PAID Pricings that begin on or after the change date
    unhandled: list[ReservationUnitPricing] = list(
        ReservationUnitPricing.objects.pricings_with_tax_percentage(
            after_date=change_date,
            tax_percentage=current_tax_percentage,
        ).select_related("reservation_unit", "reservation_unit__unit")
    )

    if not unhandled:
        return

    info_str = ", ".join(f"<{pricing.id}: {pricing.reservation_unit}: {pricing}>" for pricing in unhandled)
    SentryLogger.log_message(
        message="Task `update_reservation_unit_pricings_tax_percentage` has unhandled future pricings",
        details=f"Task found the following unhandled future pricings: {info_str}",
        level="info",
    )


@app.task(
    name="refresh_reservation_unit_product_mapping",
    autoretry_for=(TypeError,),
    max_retries=5,
    retry_backoff=True,
)
def refresh_reservation_unit_product_mapping(reservation_unit_pk: int) -> None:
    reservation_unit: ReservationUnit | None = ReservationUnit.objects.filter(pk=reservation_unit_pk).first()
    if reservation_unit is None:
        SentryLogger.log_message(
            message=f"Unable to refresh reservation unit ({reservation_unit_pk}) product mapping.",
            details=f"Reservation unit ({reservation_unit_pk}) not found.",
            level="warning",
        )
        return

    reservation_unit.actions.refresh_reservation_unit_product_mapping()


@app.task(
    name="refresh_reservation_unit_accounting",
    autoretry_for=(TypeError,),
    max_retries=5,
    retry_backoff=True,
)
def refresh_reservation_unit_accounting(reservation_unit_pk: int) -> None:
    reservation_unit: ReservationUnit | None = ReservationUnit.objects.filter(pk=reservation_unit_pk).first()
    if reservation_unit is None:
        SentryLogger.log_message(
            message=f"Unable to refresh reservation unit ({reservation_unit_pk}) accounting data.",
            details=f"Reservation unit ({reservation_unit_pk}) not found.",
            level="warning",
        )
        return

    reservation_unit.actions.refresh_reservation_unit_accounting()


@app.task(name="update_reservation_unit_image_urls")
def create_reservation_unit_thumbnails_and_urls(pk: int | None = None) -> None:
    """Create optimized thumbnail images and update URLs to the reservation unit instances."""
    images = ReservationUnitImage.objects.all()
    if pk is not None:
        images = images.filter(pk=pk)

    images.update_thumbnail_urls()


@app.task(name="purge_image_cache")
def purge_image_cache(image_path: str) -> None:
    from tilavarauspalvelu.integrations.image_cache import purge

    purge(image_path)


@singleton_task
@app.task(name="generate_reservation_series_from_allocations")
@SentryLogger.log_if_raises("Failed to generate reservation series from allocations")
def generate_reservation_series_from_allocations(application_round_id: int) -> None:
    application_round: ApplicationRound | None = ApplicationRound.objects.filter(pk=application_round_id).first()
    if application_round is None:
        return

    application_round.actions.generate_reservations_from_allocations()

    # Run creation of missing Pindora reservations ahead of its normal background task schedule
    create_missing_pindora_reservations.delay()


@app.task(name="delete_expired_applications")
def delete_expired_applications() -> None:
    Application.objects.delete_expired_applications()


@app.task(name="save_sql_queries_from_request")
def save_sql_queries_from_request(queries: list[QueryInfo], path: str, body: bytes, duration_ms: int) -> None:
    SQLLog.actions.create_for_request(queries, path, body, duration_ms)


@app.task(name="Update ReservationUnit Search vectors")
def update_reservation_unit_search_vectors_task(reservation_unit_pk: int | None = None) -> None:
    ReservationUnit.objects.update_search_vectors(reservation_unit_pk=reservation_unit_pk)


@app.task(name="deactivate_old_permissions")
def deactivate_old_permissions_task() -> None:
    from tilavarauspalvelu.services.permission_service import deactivate_old_permissions

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


@app.task(
    name="delete_pindora_reservation",
    autoretry_for=(ExternalServiceError,),
    max_retries=5,
    retry_backoff=True,
)
def delete_pindora_reservation(reservation_uuid: str) -> None:
    """
    Task that can be used to retry a Pindora reservation deletion if it fails
    in the endpoint. This should only be called if the access code is known to
    be inactive, since this task may also fail to delete the reservation if
    Pindora is down for an extended period of time.
    """
    from tilavarauspalvelu.integrations.keyless_entry import PindoraClient

    PindoraClient.delete_reservation(reservation=uuid.UUID(reservation_uuid))


@singleton_task
@app.task(name="create_missing_pindora_reservations")
def create_missing_pindora_reservations() -> None:
    from tilavarauspalvelu.integrations.keyless_entry import PindoraService

    PindoraService.create_missing_access_codes()


@singleton_task
@app.task(name="update_pindora_access_code_is_active")
def update_pindora_access_code_is_active() -> None:
    from tilavarauspalvelu.integrations.keyless_entry import PindoraService

    PindoraService.update_access_code_is_active()
