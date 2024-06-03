from typing import Any, Literal

from django.conf import settings
from django.db.models.signals import m2m_changed, post_delete, post_save
from django.dispatch import receiver

from reservation_units.models import ReservationUnit, ReservationUnitHierarchy
from reservation_units.tasks import refresh_reservation_unit_product_mapping

type Action = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]


@receiver(post_save, sender=ReservationUnit, dispatch_uid="reservation_unit_saved")
def reservation_unit_saved(instance: ReservationUnit, created: bool, *args: Any, **kwargs: Any):
    if settings.UPDATE_PRODUCT_MAPPING:
        refresh_reservation_unit_product_mapping.delay(instance.pk)

    if created:
        ReservationUnitHierarchy.refresh(kwargs.get("using"))


@receiver(post_delete, sender=ReservationUnit, dispatch_uid="reservation_unit_deleted")
def reservation_unit_deleted(*args: Any, **kwargs: Any):
    ReservationUnitHierarchy.refresh(kwargs.get("using"))


@receiver(m2m_changed, sender=ReservationUnit.spaces.through, dispatch_uid="reservation_unit_spaces_modified")
def reservation_unit_spaces_modified(action: Action, *args: Any, **kwargs: Any):
    if action in ["post_add", "post_remove", "post_clear"]:
        ReservationUnitHierarchy.refresh(kwargs.get("using"))


@receiver(m2m_changed, sender=ReservationUnit.resources.through, dispatch_uid="reservation_unit_resources_modified")
def reservation_unit_resources_modified(action: Action, *args: Any, **kwargs: Any):
    if action in ["post_add", "post_remove", "post_clear"]:
        ReservationUnitHierarchy.refresh(kwargs.get("using"))
