from __future__ import annotations

import pytest

from tilavarauspalvelu.models import Space

from tests.factories import SpaceFactory, UnitFactory

pytestmark = [
    pytest.mark.django_db,
]


# ── Space tree ──


def test_space__save__rebuilds_space_tree(settings):
    settings.REBUILD_SPACE_HIERARCHY = True

    unit = UnitFactory.create()
    parent = SpaceFactory.build_for_bulk_create(unit=unit)
    Space.objects.bulk_create([parent])
    child = SpaceFactory.build_for_bulk_create(unit=unit, parent=parent)
    Space.objects.bulk_create([child])

    SpaceFactory.create(unit=unit)

    parent = Space.objects.get(pk=parent.pk)
    assert list(parent.get_descendants()) == [child]


def test_space__delete__children_of_deleted_space_leave_the_tree(settings):
    settings.REBUILD_SPACE_HIERARCHY = True

    unit = UnitFactory.create()
    root = SpaceFactory.create(unit=unit)
    middle = SpaceFactory.create(unit=unit, parent=root)
    orphan = SpaceFactory.create(unit=unit, parent=middle)
    sibling = SpaceFactory.create(unit=unit, parent=root)

    middle.delete()

    root = Space.objects.get(pk=root.pk)
    assert list(root.get_descendants()) == [sibling]

    orphan = Space.objects.get(pk=orphan.pk)
    assert orphan.parent is None
    assert list(orphan.get_family()) == [orphan]
