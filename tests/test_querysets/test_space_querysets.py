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
