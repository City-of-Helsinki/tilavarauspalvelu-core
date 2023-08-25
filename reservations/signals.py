from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver

from reservations.models import Reservation
from reservations.statistic_utils import create_or_update_reservation_statistics


@receiver(post_save, sender=Reservation, dispatch_uid="update_reservation_statistics_on_save")
def update_reservation_statistics_on_save(sender, instance=None, raw=False, **kwargs):
    if raw:
        return

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
    create_or_update_reservation_statistics(instance.pk)


@receiver(
    m2m_changed,
    sender=Reservation.reservation_unit.through,
    dispatch_uid="update_reservation_statistics_on_runit_change",
)
def update_reservation_statistics_on_runit_change(sender, instance=None, action="", reverse=False, **kwargs):
    raw = kwargs.get("raw", False)
    if action == "post_add" and reverse is False and raw is False:
        create_or_update_reservation_statistics(instance.pk)
