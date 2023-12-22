from datetime import UTC, datetime

import pytest
from django.utils.timezone import get_current_timezone

from spaces.models import Space
from tests.factories import (
    SpaceFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]

DEFAULT_TIMEZONE = get_current_timezone()


def _datetime(year=2023, month=5, day=1, hour=0, minute=0) -> datetime:
    # Convert to UTC to match timezone returned by GQL endpoint
    return datetime(year, month, day, hour, minute, tzinfo=DEFAULT_TIMEZONE).astimezone(UTC)


def test__space_queryset__space_to_family():
    # Space 1
    # └── Space 2
    # Space 3
    # ├── Space 4
    # └── Space 5
    #     └── Space 6
    s_1 = SpaceFactory(id=1, parent=None)
    s_2 = SpaceFactory(id=2, parent=s_1)
    s_3 = SpaceFactory(id=3, parent=None)
    s_4 = SpaceFactory(id=4, parent=s_3)
    s_5 = SpaceFactory(id=5, parent=s_3)
    s_6 = SpaceFactory(id=6, parent=s_5)

    space_to_family = Space.objects.space_to_family()
    assert space_to_family[s_1.id] == {1, 2}
    assert space_to_family[s_2.id] == {1, 2}
    assert space_to_family[s_3.id] == {3, 4, 5, 6}
    assert space_to_family[s_4.id] == {3, 4}
    assert space_to_family[s_5.id] == {3, 5, 6}
    assert space_to_family[s_6.id] == {3, 5, 6}
