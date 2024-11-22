from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.contrib.auth import user_logged_in
from django.db.models.signals import m2m_changed, post_delete, post_save, pre_save
from django.dispatch import receiver

from tilavarauspalvelu.models import Purpose, Reservation, ReservationUnit, ReservationUnitImage, Space
from tilavarauspalvelu.tasks import (
    create_or_update_reservation_statistics,
    create_reservation_unit_thumbnails_and_urls,
    refresh_reservation_unit_product_mapping,
    update_affecting_time_spans_task,
    update_reservation_unit_hierarchy_task,
)
from utils.date_utils import local_datetime
from utils.image_cache import purge_previous_image_cache

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.tasks import Action
    from tilavarauspalvelu.typing import M2MAction


@receiver([post_save, post_delete], sender=Space, dispatch_uid="space_modify")
def space_modify(instance: Space, *args: Any, **kwargs: Any) -> None:
    if settings.REBUILD_SPACE_HIERARCHY:
        tree_id = instance.parent.tree_id if instance.parent else instance.tree_id
        try:
            instance.__class__.objects.partial_rebuild(tree_id)
        except RuntimeError:
            # If the tree now has more than one root node,
            # we need to rebuild the whole tree.
            instance.__class__.objects.rebuild()

    # Refresh the reservation unit hierarchy since spaces have changed.
    if settings.UPDATE_RESERVATION_UNIT_HIERARCHY:
        update_reservation_unit_hierarchy_task.delay(using=kwargs.get("using"))


@receiver(post_save, sender=Reservation, dispatch_uid="reservation_create")
def reservation_create(
    sender: type[Reservation],  # noqa: ARG001
    instance: Reservation,
    *,
    raw: bool = False,
    **kwargs,
) -> None:
    if not raw and settings.SAVE_RESERVATION_STATISTICS:
        # Note that many-to-many relationships are not yet available at this time so
        # statistics might be saved with the previous reservation unit value. That is why
        # we also have m2m_changed signal below.
        #
        # It gets triggered when relationships are being changed and happens always after post_save signal.
        # It will update the reservation unit with the new value.
        #
        # Current implementation allows reservation to have multiple reservation units, but in practise, only
        # one can be defined. If in the future we truly support reservations with multiple reservation units,
        # we need to change this implementation so that we either have multiple reservation units in the statistics
        # or we have better way to indicate which one is the primary unit.
        create_or_update_reservation_statistics.delay([instance.pk])

    if not raw and settings.UPDATE_AFFECTING_TIME_SPANS:
        update_affecting_time_spans_task.delay(using=kwargs.get("using"))


@receiver(post_delete, sender=Reservation, dispatch_uid="reservation_delete")
def reservation_delete(sender: type[Reservation], **kwargs) -> None:  # noqa: ARG001
    if settings.UPDATE_AFFECTING_TIME_SPANS:
        update_affecting_time_spans_task.delay(using=kwargs.get("using"))


@receiver(m2m_changed, sender=Reservation.reservation_units.through, dispatch_uid="reservations_reservation_units_m2m")
def reservations_reservation_units_m2m(
    action: M2MAction,
    instance: Reservation,
    *,
    reverse: bool = False,
    raw: bool = False,
    **kwargs: Any,
) -> None:
    if action == "post_add" and not raw and not reverse and settings.SAVE_RESERVATION_STATISTICS:
        create_or_update_reservation_statistics.delay([instance.pk])

    if not raw and settings.UPDATE_AFFECTING_TIME_SPANS:
        update_affecting_time_spans_task.delay(using=kwargs.get("using"))


@receiver(post_save, sender=ReservationUnit, dispatch_uid="reservation_unit_saved")
def reservation_unit_saved(instance: ReservationUnit, *, created: bool, **kwargs: Any) -> None:
    if settings.UPDATE_PRODUCT_MAPPING:
        refresh_reservation_unit_product_mapping.delay(instance.pk)

    if settings.UPDATE_RESERVATION_UNIT_HIERARCHY and created:
        update_reservation_unit_hierarchy_task.delay(using=kwargs.get("using"))


@receiver(post_delete, sender=ReservationUnit, dispatch_uid="reservation_unit_deleted")
def reservation_unit_deleted(*args: Any, **kwargs: Any) -> None:
    if settings.UPDATE_RESERVATION_UNIT_HIERARCHY:
        update_reservation_unit_hierarchy_task.delay(using=kwargs.get("using"))


@receiver(m2m_changed, sender=ReservationUnit.spaces.through, dispatch_uid="reservation_unit_spaces_modified")
def reservation_unit_spaces_modified(action: Action, *args: Any, **kwargs: Any) -> None:
    if settings.UPDATE_RESERVATION_UNIT_HIERARCHY and action in {"post_add", "post_remove", "post_clear"}:
        update_reservation_unit_hierarchy_task.delay(using=kwargs.get("using"))


@receiver(m2m_changed, sender=ReservationUnit.resources.through, dispatch_uid="reservation_unit_resources_modified")
def reservation_unit_resources_modified(action: Action, *args: Any, **kwargs: Any) -> None:
    if settings.UPDATE_RESERVATION_UNIT_HIERARCHY and action in {"post_add", "post_remove", "post_clear"}:
        update_reservation_unit_hierarchy_task.delay(using=kwargs.get("using"))


@receiver(user_logged_in, dispatch_uid="user_logged_in")
def update_last_login(user: User, **kwargs: Any) -> None:
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


@receiver(pre_save, sender=Purpose, dispatch_uid="purpose_to_save")
def purpose_to_save(instance: Purpose, *args: Any, **kwargs: Any) -> None:
    if settings.IMAGE_CACHE_ENABLED:
        purge_previous_image_cache(instance)


@receiver(pre_save, sender=ReservationUnitImage, dispatch_uid="reservation_unit_image_to_save")
def reservation_unit_image_to_save(instance: ReservationUnitImage, *args: Any, **kwargs: Any) -> None:
    if settings.UPDATE_RESERVATION_UNIT_THUMBNAILS and settings.IMAGE_CACHE_ENABLED:
        purge_previous_image_cache(instance)


@receiver(post_save, sender=ReservationUnitImage, dispatch_uid="reservation_unit_image_saved")
def reservation_unit_image_saved(instance: ReservationUnitImage, *args: Any, **kwargs: Any) -> None:
    if settings.UPDATE_RESERVATION_UNIT_THUMBNAILS:
        create_reservation_unit_thumbnails_and_urls.delay(instance.pk)
