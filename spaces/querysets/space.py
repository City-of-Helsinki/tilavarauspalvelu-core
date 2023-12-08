from django.db import models
from mptt.models import MPTTOptions
from mptt.querysets import TreeQuerySet

from common.db import SubqueryArray

__all__ = [
    "SpaceQuerySet",
]


class SpaceQuerySet(TreeQuerySet):
    def all_space_ids_though_hierarchy(self) -> set[int]:
        """
        Get ids for all spaces that are accessible though the space hierarchy
        for the spaces currently in the queryset.
        """
        from spaces.models import Space

        opts: MPTTOptions = self.model._mptt_meta

        # Get all "families" for the spaces in the queryset.
        # A "family" is defined as all spaces that are direct "ancestors" or "descendants" of the space.
        # An "ancestor" is a space that is a parent, grandparent, etc. of the space.
        # A "descendant" is a space that is a child, grandchild, etc. of the space.
        # See: `mptt.models.MPTTModel.get_family`
        all_families: list[list[int]] = self.annotate(
            family_tree=SubqueryArray(
                queryset=(
                    Space.objects.filter(
                        # ancestors
                        models.Q(
                            **{
                                f"{opts.left_attr}__lte": models.OuterRef(opts.left_attr),
                                f"{opts.right_attr}__gte": models.OuterRef(opts.right_attr),
                                opts.tree_id_attr: models.OuterRef(opts.tree_id_attr),
                            }
                        )
                        # descendants
                        | models.Q(
                            **{
                                f"{opts.left_attr}__gte": models.OuterRef(opts.left_attr),
                                f"{opts.right_attr}__lte": models.OuterRef(opts.right_attr),
                                opts.tree_id_attr: models.OuterRef(opts.tree_id_attr),
                            }
                        )
                    ).values("id")
                ),
                agg_field="id",
            ),
        ).values_list("family_tree", flat=True)

        # Filter out duplicates
        return {pk for family in all_families for pk in family}

    def all_spaces_though_hierarchy(self):
        """
        Get all spaces that are accessible though the space hierarchy for the spaces currently in the queryset.
        Returns a completely new queryset, so all annotations etc. are lost.
        """
        from spaces.models import Space

        return Space.objects.filter(pk__in=self.all_space_ids_though_hierarchy())
