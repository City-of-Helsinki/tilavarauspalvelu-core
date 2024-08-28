from typing import Any, Literal

from django.conf import settings
from django.db.models.signals import m2m_changed, post_delete, post_save
from django.dispatch import receiver

from reservations.models import Reservation
from reservations.tasks import create_or_update_reservation_statistics, update_affecting_time_spans_task

type M2MAction = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]


@receiver(post_save, sender=Reservation, dispatch_uid="reservation_create")
def reservation_create(
    sender: type[Reservation],
    instance: Reservation,
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
        create_or_update_reservation_statistics([instance.pk])

    if not raw and settings.UPDATE_AFFECTING_TIME_SPANS:
        update_affecting_time_spans_task.delay()


@receiver(post_delete, sender=Reservation, dispatch_uid="reservation_delete")
def reservation_delete(
    sender: type[Reservation],
    **kwargs,
) -> None:
    if settings.UPDATE_AFFECTING_TIME_SPANS:
        update_affecting_time_spans_task.delay()


@receiver(
    m2m_changed,
    sender=Reservation.reservation_unit.through,
    dispatch_uid="reservations_reservation_units_m2m",
)
def reservations_reservation_units_m2m(
    action: M2MAction,
    instance: Reservation,
    reverse: bool = False,
    raw: bool = False,
    **kwargs: Any,
) -> None:
    if action == "post_add" and not raw and not reverse and settings.SAVE_RESERVATION_STATISTICS:
        create_or_update_reservation_statistics([instance.pk])

    if not raw and settings.UPDATE_AFFECTING_TIME_SPANS:
        update_affecting_time_spans_task.delay()
