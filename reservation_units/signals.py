from django.db.models.signals import post_save
from django.dispatch import receiver

from reservation_units.models import Purpose, ReservationUnit


@receiver(post_save, sender=ReservationUnit, dispatch_uid="update_reservation_unit_rank")
def update_reservation_unit_rank(sender, instance, **kwargs):
    if kwargs.get("created", False):
        instance.rank = instance.id
        instance.save()


@receiver(post_save, sender=Purpose, dispatch_uid="update_reservation_unit_purpose_rank")
def update_reservation_unit_purpose_rank(sender, instance, **kwargs):
    if kwargs.get("created", False):
        instance.rank = instance.id
        instance.save()
