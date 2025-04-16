"""
Signal receivers.

Note: All signal functions must have names, since Django's signal handlers only store weak references to them.
This means that a using "_" as the name (meaning we don't care about the name of the function) is not enough,
as this module must hold strong references to the signal functions.
"""

from __future__ import annotations

import sys
from typing import TYPE_CHECKING, Any, Unpack

from django.conf import settings
from django.contrib.auth import user_logged_in
from django.core.signals import got_request_exception
from django.db.models.signals import m2m_changed, post_delete, post_save, pre_save
from django.dispatch import receiver
from graphene_django_extensions.errors import (
    GQLCreatePermissionDeniedError,
    GQLDeletePermissionDeniedError,
    GQLFieldPermissionDeniedError,
    GQLFilterPermissionDeniedError,
    GQLMutationPermissionDeniedError,
    GQLNodePermissionDeniedError,
    GQLNotFoundError,
    GQLUpdatePermissionDeniedError,
    GQLValidationError,
)
from rest_framework.exceptions import ValidationError
from sentry_sdk.integrations.django import _got_request_exception  # noqa: PLC2701
from social_core.exceptions import AuthCanceled, AuthFailed, AuthStateForbidden, AuthStateMissing, AuthTokenError

from tilavarauspalvelu.integrations.image_cache import purge_previous_image_cache
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import (
    PaymentAccounting,
    Purpose,
    Reservation,
    ReservationUnit,
    ReservationUnitImage,
    Space,
    Unit,
)
from tilavarauspalvelu.tasks import (
    create_or_update_reservation_statistics,
    create_reservation_unit_thumbnails_and_urls,
    refresh_reservation_unit_accounting,
    refresh_reservation_unit_product_mapping,
    update_affecting_time_spans_task,
    update_reservation_unit_hierarchy_task,
    update_reservation_unit_search_vectors_task,
)
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import M2MChangedKwargs, PostDeleteKwargs, PostSaveKwargs, PreSaveKwargs, WSGIRequest


# --- Pre save signals --------------------------------------------------------------------------------------------


@receiver(pre_save, sender=Purpose, dispatch_uid="purpose_pre_save")
def _purpose_pre_save(sender: Any, **kwargs: Unpack[PreSaveKwargs[Purpose]]) -> None:
    instance = kwargs["instance"]

    if settings.IMAGE_CACHE_ENABLED:
        purge_previous_image_cache(instance)


@receiver(pre_save, sender=ReservationUnitImage, dispatch_uid="reservation_unit_image_pre_save")
def _reservation_unit_image_pre_save(sender: Any, **kwargs: Unpack[PreSaveKwargs[ReservationUnitImage]]) -> None:
    instance = kwargs["instance"]

    if settings.UPDATE_RESERVATION_UNIT_THUMBNAILS and settings.IMAGE_CACHE_ENABLED:
        purge_previous_image_cache(instance)


# --- Post save signals -------------------------------------------------------------------------------------------


@receiver(post_save, sender=Space, dispatch_uid="space_post_save")
def _space_post_save(sender: Any, **kwargs: Unpack[PostSaveKwargs[Space]]) -> None:
    using = kwargs["using"]

    if settings.REBUILD_SPACE_HIERARCHY:
        Space.objects.rebuild()

    if settings.UPDATE_RESERVATION_UNIT_HIERARCHY:
        update_reservation_unit_hierarchy_task.delay(using=using)


@receiver(post_save, sender=Reservation, dispatch_uid="reservation_post_save")
def _reservation_post_save(sender: Any, **kwargs: Unpack[PostSaveKwargs[Reservation]]) -> None:
    instance = kwargs["instance"]
    using = kwargs["using"]

    if settings.SAVE_RESERVATION_STATISTICS:
        create_or_update_reservation_statistics.delay(reservation_pks=[instance.pk])

    if settings.UPDATE_AFFECTING_TIME_SPANS:
        update_affecting_time_spans_task.delay(using=using)


@receiver(post_save, sender=ReservationUnit, dispatch_uid="reservation_unit_post_save")
def _reservation_unit_post_save(sender: Any, **kwargs: Unpack[PostSaveKwargs[ReservationUnit]]) -> None:
    instance: ReservationUnit = kwargs["instance"]
    created: bool = kwargs["created"]
    using = kwargs["using"]

    if settings.UPDATE_PRODUCT_MAPPING:
        refresh_reservation_unit_product_mapping.delay(instance.pk)

    if settings.UPDATE_RESERVATION_UNIT_HIERARCHY and created:
        update_reservation_unit_hierarchy_task.delay(using=using)

    if settings.UPDATE_SEARCH_VECTORS:
        update_reservation_unit_search_vectors_task.delay(pks=[instance.pk])


@receiver(post_save, sender=ReservationUnitImage, dispatch_uid="reservation_unit_image_post_save")
def _reservation_unit_image_post_save(sender: Any, **kwargs: Unpack[PostSaveKwargs[ReservationUnitImage]]) -> None:
    instance = kwargs["instance"]

    if settings.UPDATE_RESERVATION_UNIT_THUMBNAILS:
        create_reservation_unit_thumbnails_and_urls.delay(instance.pk)


@receiver(post_save, sender=Unit, dispatch_uid="unit_post_save")
def _unit_post_save(sender: Any, **kwargs: Unpack[PostSaveKwargs[Unit]]) -> None:
    instance = kwargs["instance"]

    if settings.UPDATE_SEARCH_VECTORS:
        pks = list(instance.reservation_units.values_list("pk", flat=True))
        update_reservation_unit_search_vectors_task.delay(pks=pks)


@receiver(post_save, sender=PaymentAccounting, dispatch_uid="payment_accounting_post_save")
def _payment_accounting_post_save(sender: Any, **kwargs: Unpack[PostSaveKwargs[PaymentAccounting]]) -> None:
    instance = kwargs["instance"]

    if settings.UPDATE_ACCOUNTING:
        reservation_units_from_units = ReservationUnit.objects.filter(unit__in=instance.units.all())
        reservation_units = reservation_units_from_units.union(instance.reservation_units.all())
        for reservation_unit in reservation_units:
            refresh_reservation_unit_accounting.delay(reservation_unit.pk)


# --- Post delete signals -----------------------------------------------------------------------------------------


@receiver(post_delete, sender=Space, dispatch_uid="space_post_delete")
def _space_post_delete(sender: Any, **kwargs: Unpack[PostDeleteKwargs[Space]]) -> None:
    using = kwargs["using"]

    if settings.REBUILD_SPACE_HIERARCHY:
        Space.objects.rebuild()

    if settings.UPDATE_RESERVATION_UNIT_HIERARCHY:
        update_reservation_unit_hierarchy_task.delay(using=using)


@receiver(post_delete, sender=Reservation, dispatch_uid="reservation_post_delete")
def _reservation_post_delete(sender: Any, **kwargs: Unpack[PostDeleteKwargs[Reservation]]) -> None:
    using = kwargs["using"]

    if settings.UPDATE_AFFECTING_TIME_SPANS:
        update_affecting_time_spans_task.delay(using=using)


@receiver(post_delete, sender=ReservationUnit, dispatch_uid="reservation_unit_post_delete")
def _reservation_unit_post_delete(sender: Any, **kwargs: Unpack[PostDeleteKwargs[ReservationUnit]]) -> None:
    using = kwargs["using"]

    if settings.UPDATE_RESERVATION_UNIT_HIERARCHY:
        update_reservation_unit_hierarchy_task.delay(using=using)


# --- M2M changed signals -----------------------------------------------------------------------------------------


@receiver(m2m_changed, sender=Reservation.reservation_units.through, dispatch_uid="reservation_reservation_units_m2m")
def _reservation_reservation_units_m2m(sender: Any, **kwargs: Unpack[M2MChangedKwargs[Reservation]]) -> None:
    action = kwargs["action"]
    instance = kwargs["instance"]
    reverse = kwargs["reverse"]
    using = kwargs["using"]

    if action == "post_add" and not reverse and settings.SAVE_RESERVATION_STATISTICS:
        create_or_update_reservation_statistics.delay(reservation_pks=[instance.pk])

    if settings.UPDATE_AFFECTING_TIME_SPANS:
        update_affecting_time_spans_task.delay(using=using)


@receiver(m2m_changed, sender=ReservationUnit.spaces.through, dispatch_uid="reservation_unit_spaces_m2m")
def _reservation_unit_spaces_m2m(sender: Any, **kwargs: Unpack[M2MChangedKwargs[ReservationUnit]]) -> None:
    action = kwargs["action"]
    instance = kwargs["instance"]
    using = kwargs["using"]

    post_modify = action in {"post_add", "post_remove", "post_clear"}

    if settings.UPDATE_RESERVATION_UNIT_HIERARCHY and post_modify:
        update_reservation_unit_hierarchy_task.delay(using=using)

    if settings.UPDATE_SEARCH_VECTORS and post_modify:
        update_reservation_unit_search_vectors_task.delay(pks=[instance.pk])


@receiver(m2m_changed, sender=ReservationUnit.resources.through, dispatch_uid="reservation_unit_resources_m2m")
def _reservation_unit_resources_m2m(sender: Any, **kwargs: Unpack[M2MChangedKwargs[ReservationUnit]]) -> None:
    action = kwargs["action"]
    instance = kwargs["instance"]
    using = kwargs["using"]

    post_modify = action in {"post_add", "post_remove", "post_clear"}

    if settings.UPDATE_RESERVATION_UNIT_HIERARCHY and post_modify:
        update_reservation_unit_hierarchy_task.delay(using=using)

    if settings.UPDATE_SEARCH_VECTORS and post_modify:
        update_reservation_unit_search_vectors_task.delay(pks=[instance.pk])


@receiver(m2m_changed, sender=ReservationUnit.purposes.through, dispatch_uid="reservation_unit_purposes_m2m")
def _reservation_unit_purposes_m2m(sender: Any, **kwargs: Unpack[M2MChangedKwargs[ReservationUnit]]) -> None:
    action = kwargs["action"]
    instance = kwargs["instance"]

    post_modify = action in {"post_add", "post_remove", "post_clear"}

    if settings.UPDATE_SEARCH_VECTORS and post_modify:
        update_reservation_unit_search_vectors_task.delay(pks=[instance.pk])


@receiver(m2m_changed, sender=ReservationUnit.equipments.through, dispatch_uid="reservation_unit_equipments_m2m")
def _reservation_unit_equipments_m2m(sender: Any, **kwargs: Unpack[M2MChangedKwargs[ReservationUnit]]) -> None:
    action = kwargs["action"]
    instance = kwargs["instance"]

    post_modify = action in {"post_add", "post_remove", "post_clear"}

    if settings.UPDATE_SEARCH_VECTORS and post_modify:
        update_reservation_unit_search_vectors_task.delay(pks=[instance.pk])


# --- Misc signals ------------------------------------------------------------------------------------------------


@receiver(user_logged_in, dispatch_uid="user_logged_in")
def _user_logged_in(user: User, **kwargs: Any) -> None:
    user.last_login = local_datetime()
    user.sent_email_about_deactivating_permissions = False
    user.sent_email_about_anonymization = False
    user.save(
        update_fields=[
            "last_login",
            "sent_email_about_deactivating_permissions",
            "sent_email_about_anonymization",
        ]
    )


sentry_disconnected = got_request_exception.disconnect(_got_request_exception)
if sentry_disconnected:

    @receiver(got_request_exception, dispatch_uid="sentry_log_exception")
    def _sentry_log_exception(request: WSGIRequest, **kwargs: Any) -> None:
        """
        Replace Sentry's default request exception handler with our own.
        This allows us to conditionally log exceptions differently.
        """
        _exception_class, exception, _traceback = sys.exc_info()

        # Social auth errors

        if isinstance(exception, AuthFailed):
            msg = "Authentication failed"
            SentryLogger.log_message(msg, details=str(exception), level="info")
            return

        if isinstance(exception, AuthCanceled):
            msg = "Authentication cancelled"
            SentryLogger.log_message(msg, details=str(exception), level="info")
            return

        if isinstance(exception, AuthTokenError):
            msg = "Authentication token is invalid"
            SentryLogger.log_message(msg, details=str(exception), level="info")
            return

        if isinstance(exception, AuthStateMissing | AuthStateForbidden):
            msg = "Authentication state is invalid"
            SentryLogger.log_message(msg, details=str(exception), level="info")
            return

        # Validation errors

        if isinstance(exception, ValidationError | GQLValidationError):
            # No need to log these as they are handled errors
            return

        # Permission errors

        if isinstance(
            exception,
            (
                GQLNodePermissionDeniedError
                | GQLFilterPermissionDeniedError
                | GQLCreatePermissionDeniedError
                | GQLUpdatePermissionDeniedError
                | GQLDeletePermissionDeniedError
                | GQLMutationPermissionDeniedError
                | GQLFieldPermissionDeniedError
            ),
        ):
            # No need to log these as they are handled errors
            return

        # Not found errors

        if isinstance(exception, GQLNotFoundError):
            msg = "Resource not found"
            SentryLogger.log_message(msg, details=str(exception), level="info")
            return

        _got_request_exception(request, **kwargs)
        return
