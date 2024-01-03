import pytest

from spaces.models import Space
from tests.factories import SpaceFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test__space_queryset__space_to_family():
    # Space 1
    # └── Space 2
    # Space 3
    # ├── Space 4
    # └── Space 5
    #     └── Space 6
    space_1 = SpaceFactory.create(parent=None)
    space_2 = SpaceFactory.create(parent=space_1)
    space_3 = SpaceFactory.create(parent=None)
    space_4 = SpaceFactory.create(parent=space_3)
    space_5 = SpaceFactory.create(parent=space_3)
    space_6 = SpaceFactory.create(parent=space_5)

    space_to_family = Space.objects.space_to_family()
    assert space_to_family[space_1.pk] == {space_1.pk, space_2.pk}
    assert space_to_family[space_2.pk] == {space_1.pk, space_2.pk}
    assert space_to_family[space_3.pk] == {space_3.pk, space_4.pk, space_5.pk, space_6.pk}
    assert space_to_family[space_4.pk] == {space_3.pk, space_4.pk}
    assert space_to_family[space_5.pk] == {space_3.pk, space_5.pk, space_6.pk}
    assert space_to_family[space_6.pk] == {space_3.pk, space_5.pk, space_6.pk}


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
