from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lookup_property import lookup_property
from mptt.fields import TreeForeignKey
from mptt.models import MPTTModel

from utils.db import SubqueryArray
from utils.utils import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Unit

    from .actions import SpaceActions
    from .queryset import SpaceManager
    from .validators import SpaceValidator


__all__ = [
    "Space",
]


class Space(MPTTModel):
    name: str = models.CharField(max_length=255)
    surface_area: int | None = models.IntegerField(blank=True, null=True)
    max_persons: int | None = models.PositiveIntegerField(null=True, blank=True)
    code: str = models.CharField(max_length=255, db_index=True, blank=True, default="")

    parent: Space | None = TreeForeignKey(
        "self",
        related_name="children",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    unit: Unit | None = models.ForeignKey(
        "tilavarauspalvelu.Unit",
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

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[SpaceManager] = LazyModelManager.new()
    actions: SpaceActions = LazyModelAttribute.new()
    validators: SpaceValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "space"
        base_manager_name = "objects"
        verbose_name = _("space")
        verbose_name_plural = _("spaces")
        ordering = ["pk"]

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
