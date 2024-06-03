from typing import TYPE_CHECKING, Optional

from django.db import models
from lookup_property import lookup_property
from mptt.managers import TreeManager
from mptt.models import MPTTModel, TreeForeignKey

from common.db import SubqueryArray
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

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "space"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        value = self.name
        if self.unit is not None:
            value += f", {self.unit!s}"
        return value

    @lookup_property(skip_codegen=True)
    def family() -> list[int]:
        """Return space ids of all spaces that are either the space itself, its descendants or its ancestors."""
        ancestors = models.Q(
            lft__lte=models.OuterRef("lft"),
            rght__gte=models.OuterRef("rght"),
            tree_id=models.OuterRef("tree_id"),
        )
        descendants = models.Q(
            lft__gte=models.OuterRef("lft"),
            rght__lte=models.OuterRef("rght"),
            tree_id=models.OuterRef("tree_id"),
        )
        return SubqueryArray(  # type: ignore[return-value]
            queryset=Space.objects.filter(ancestors | descendants).values("id"),
            agg_field="id",
        )

    @family.override
    def _(self) -> list[int]:
        return self.get_family().values_list("id", flat=True)
