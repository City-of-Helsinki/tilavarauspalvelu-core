import pytest

from spaces.models import Space
from tests.factories import SpaceFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_space_queryset__all_spaces_though_hierarchy():
    parent = SpaceFactory.create(name="Parent")
    foo = SpaceFactory.create(name="Foo", parent=parent)
    bar = SpaceFactory.create(name="Bar", parent=parent)
    child_1 = SpaceFactory.create(name="Child 1", parent=foo)
    child_2 = SpaceFactory.create(name="Child 2", parent=foo)
    child_3 = SpaceFactory.create(name="Child 3", parent=bar)

    assert list(Space.objects.filter(name="Foo").all_spaces_though_hierarchy()) == [parent, foo, child_1, child_2]
    assert list(Space.objects.filter(name="Bar").all_spaces_though_hierarchy()) == [parent, bar, child_3]
    assert list(Space.objects.filter(name__in=["Foo", "Bar"]).all_spaces_though_hierarchy()) == [
        parent,
        foo,
        child_1,
        child_2,
        bar,
        child_3,
    ]
