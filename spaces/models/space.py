from typing import TYPE_CHECKING, Optional

from django.db import models
from mptt.managers import TreeManager
from mptt.models import MPTTModel, TreeForeignKey

from spaces.querysets.space import SpaceQuerySet

if TYPE_CHECKING:
    from spaces.models import Building, Unit

__all__ = [
    "Space",
]


class SpaceManager(models.Manager.from_queryset(SpaceQuerySet), TreeManager):
    pass


class Space(MPTTModel):
    name: str = models.CharField(max_length=255)
    surface_area: int | None = models.IntegerField(blank=True, null=True)
    max_persons: int | None = models.fields.PositiveIntegerField(null=True, blank=True)
    code: str = models.CharField(max_length=255, db_index=True, blank=True, default="")

    parent: Optional["Space"] = TreeForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="children",
        on_delete=models.SET_NULL,
    )
    building: Optional["Building"] = models.ForeignKey(
        "spaces.Building",
        related_name="spaces",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    unit: Optional["Unit"] = models.ForeignKey(
        "spaces.Unit",
        related_name="spaces",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    # MPTT field hints
    tree_id: int
    level: int
    lft: int
    rght: int

    objects = SpaceManager()

    class Meta:
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.name} ({getattr(self.building, 'name', '')})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        tree_id = self.parent.tree_id if self.parent else self.tree_id
        try:
            self.__class__.objects.partial_rebuild(tree_id)
        except RuntimeError:
            # If the tree now has more than one root node,
            # we need to rebuild the whole tree.
            self.__class__.objects.rebuild()
