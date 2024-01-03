from typing import Self

from django.db.models import OuterRef, Q
from django.db.models.functions import Coalesce
from mptt.models import MPTTOptions
from mptt.querysets import TreeQuerySet

from common.db import ArrayRemove, SubqueryArray


class ExtendedTreeQuerySet(TreeQuerySet):
    @property
    def _ancestors_q_object(self) -> Q:
        """
        Get a Q object that can be used to filter objects that are ancestors of the given object.

        An "ancestor" is defined as an object that is a parent, grandparent, etc. of the object.

        See: `mptt.MPTTModel.get_ancestors`
        """
        opts: MPTTOptions = self.model._mptt_meta
        return Q(
            lft__lte=OuterRef(opts.left_attr),
            rght__gte=OuterRef(opts.right_attr),
            tree_id=OuterRef(opts.tree_id_attr),
        )

    @property
    def _descendants_q_object(self) -> Q:
        """
        Get a Q object that can be used to filter objects that are descendants of the given object.

        A "descendant" is defined as an object that is a child, grandchild, etc. of the object.

        See: `mptt.MPTTModel.get_descendants`
        """
        opts: MPTTOptions = self.model._mptt_meta
        return Q(
            lft__gte=OuterRef(opts.left_attr),
            rght__lte=OuterRef(opts.right_attr),
            tree_id=OuterRef(opts.tree_id_attr),
        )

    def with_ancestors(self, *, include_self: bool = False) -> Self:
        """Annotate a list of all "ancestors" of the object to the queryset."""
        qs = self.model.objects.filter(self._ancestors_q_object)

        if not include_self:
            qs = qs.exclude(pk=OuterRef("pk"))

        return self.annotate(
            ancestors=Coalesce(ArrayRemove(SubqueryArray(qs.values("id"), agg_field="id"), None), []),
        )

    def with_descendants(self, *, include_self: bool = False) -> Self:
        """Annotate a list of all "descendants" of the object to the queryset."""
        qs = self.model.objects.filter(self._descendants_q_object)

        if not include_self:
            qs = qs.exclude(pk=OuterRef("pk"))

        return self.annotate(
            descendants=Coalesce(ArrayRemove(SubqueryArray(qs.values("id"), agg_field="id"), None), []),
        )

    def with_family(self, *, include_self: bool = False) -> Self:
        """
        Annotate a list of "family" of the object to the queryset.

        A "family" is defined as all objects that are "ascendants" or "descendants" of the object.
        Siblings of the object are not included.
        """
        qs = self.model.objects.filter(self._ancestors_q_object | self._descendants_q_object)

        if not include_self:
            qs = qs.exclude(pk=OuterRef("pk"))

        return self.annotate(
            family=Coalesce(ArrayRemove(SubqueryArray(qs.values("id"), agg_field="id"), None), []),
        )
