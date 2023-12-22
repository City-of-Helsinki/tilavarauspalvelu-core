from typing import Self

from common.querysets.mptt import ExtendedTreeQuerySet

__all__ = [
    "SpaceQuerySet",
]


class SpaceQuerySet(ExtendedTreeQuerySet):
    def all_space_ids_though_hierarchy(self: Self) -> set[int]:
        """
        Get ids of all spaces that are accessible though the space hierarchy
        for the spaces currently in the queryset.
        """
        all_families: list[list[int]] = self.with_family().values_list("family", flat=True)

        return {pk for family in all_families for pk in family}

    def all_spaces_though_hierarchy(self: Self) -> Self:
        """
        Get all spaces that are accessible though the space hierarchy for the spaces currently in the queryset.

        Returns a completely new queryset, so all annotations etc. are lost.
        """
        return self.model.objects.filter(pk__in=self.all_space_ids_though_hierarchy())

    def space_to_family(self: Self) -> dict[int, set[int]]:
        """
        Map each space in the queryset with their space "family"/hierarchy.
        These are all the spaces whose reservations could block reservations for the reservation units
        the spaces in the queryset are attached to.
        """
        qs = self.with_family(include_self=True).values("pk", "family")
        return {space["pk"]: set(space["family"]) for space in qs}
