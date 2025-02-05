from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db import models
from mptt.managers import TreeManager
from mptt.querysets import TreeQuerySet

from utils.db import SubqueryArray

if TYPE_CHECKING:
    from mptt.models import MPTTOptions

__all__ = [
    "SpaceManager",
    "SpaceQuerySet",
]


class SpaceQuerySet(TreeQuerySet):
    def all_space_ids_though_hierarchy(self) -> set[int]:
        """
        Get ids for all spaces that are accessible though the space hierarchy
        for the spaces currently in the queryset.
        """
        all_families: list[list[int]] = self.with_family(include_self=True).values_list("family", flat=True)

        return {pk for family in all_families for pk in family}

    def all_spaces_though_hierarchy(self) -> Self:
        """
        Get all spaces that are accessible though the space hierarchy for the spaces currently in the queryset.

        Returns a completely new queryset, so all annotations etc. are lost.
        """
        return self.model.objects.filter(pk__in=self.all_space_ids_though_hierarchy())

    def space_to_family(self) -> dict[int, set[int]]:
        """
        Map each space in the queryset with their space "family"/hierarchy.
        These are all the spaces whose reservations could block reservations for the reservation units
        the spaces in the queryset are attached to.
        """
        qs = self.with_family(include_self=True).values("pk", "family")
        return {space["pk"]: set(space["family"]) for space in qs}

    @property
    def _ancestors_q_object(self) -> models.Q:
        """
        Get a Q object that can be used to filter objects that are ancestors of the given object.

        An "ancestor" is defined as an object that is a parent, grandparent, etc. of the object.

        See: `mptt.MPTTModel.get_ancestors`
        """
        opts: MPTTOptions = self.model._mptt_meta
        return models.Q(
            lft__lte=models.OuterRef(opts.left_attr),
            rght__gte=models.OuterRef(opts.right_attr),
            tree_id=models.OuterRef(opts.tree_id_attr),
        )

    @property
    def _descendants_q_object(self) -> models.Q:
        """
        Get a Q object that can be used to filter objects that are descendants of the given object.

        A "descendant" is defined as an object that is a child, grandchild, etc. of the object.

        See: `mptt.MPTTModel.get_descendants`
        """
        opts: MPTTOptions = self.model._mptt_meta
        return models.Q(
            lft__gte=models.OuterRef(opts.left_attr),
            rght__lte=models.OuterRef(opts.right_attr),
            tree_id=models.OuterRef(opts.tree_id_attr),
        )

    def with_ancestors(self, *, include_self: bool = False) -> Self:
        """Annotate a list of all "ancestors" of the object to the queryset."""
        qs = self.model.objects.filter(self._ancestors_q_object)

        if not include_self:
            qs = qs.exclude(pk=models.OuterRef("pk"))

        return self.annotate(ancestors=SubqueryArray(qs.values("id"), agg_field="id"))

    def with_descendants(self, *, include_self: bool = False) -> Self:
        """Annotate a list of all "descendants" of the object to the queryset."""
        qs = self.model.objects.filter(self._descendants_q_object)

        if not include_self:
            qs = qs.exclude(pk=models.OuterRef("pk"))

        return self.annotate(descendants=SubqueryArray(qs.values("id"), agg_field="id"))

    def with_family(self, *, include_self: bool = False) -> Self:
        """
        Annotate a list of "family" of the object to the queryset.

        A "family" is defined as all objects that are "ascendants" or "descendants" of the object.
        Siblings of the object are not included.
        """
        qs = self.model.objects.filter(self._ancestors_q_object | self._descendants_q_object)

        if not include_self:
            qs = qs.exclude(pk=models.OuterRef("pk"))

        return self.annotate(family=SubqueryArray(qs.values("id"), agg_field="id"))


class SpaceManager(TreeManager.from_queryset(SpaceQuerySet)): ...
