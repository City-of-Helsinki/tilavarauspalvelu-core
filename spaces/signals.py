from typing import Any

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from spaces.models import Space


@receiver([post_save, post_delete], sender=Space, dispatch_uid="space_modify")
def space_modify(instance: Space, *args: Any, **kwargs: Any):
    tree_id = instance.parent.tree_id if instance.parent else instance.tree_id
    try:
        instance.__class__.objects.partial_rebuild(tree_id)
    except RuntimeError:
        # If the tree now has more than one root node,
        # we need to rebuild the whole tree.
        instance.__class__.objects.rebuild()

    # Refresh the reservation unit hierarchy since spaces have changed.
    from reservation_units.models import ReservationUnitHierarchy

    ReservationUnitHierarchy.refresh()
