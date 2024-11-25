from __future__ import annotations

import datetime

import pytest
from django.utils.timezone import get_default_timezone

from tests.factories import UnitFactory, UnitGroupFactory, UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user__str__last_login_displays_if_has_logged():
    user = UserFactory.create(
        username="test",
        first_name="First",
        last_name="Last",
        email="test@localhost",
        last_login=datetime.datetime(2023, 5, 16, 15, 0, tzinfo=get_default_timezone()),
    )

    assert str(user) == "Last First (test@localhost) - 16.05.2023 15:00"


def test_user__str__last_login_does_not_display_if_has_not_logged():
    user = UserFactory.create(
        username="test",
        first_name="First",
        last_name="Last",
        email="test@localhost",
        last_login=None,
    )

    assert str(user) == "Last First (test@localhost)"


def test_user__general_user__has_any_role():
    user = UserFactory.create()
    assert user.permissions.has_any_role() is False


def test_user__superuser__has_any_role():
    user = UserFactory.create_superuser()
    assert user.permissions.has_any_role() is True


def test_user__general_admin__has_any_role():
    user = UserFactory.create_with_general_role()
    assert user.permissions.has_any_role() is True


def test_user__unit_admin__has_any_role():
    unit = UnitFactory.create()
    user = UserFactory.create_with_unit_role(units=[unit])
    assert user.permissions.has_any_role() is True


def test_user__unit_group_admin__has_any_role():
    unit_group = UnitGroupFactory.create()
    user = UserFactory.create_with_unit_role(unit_groups=[unit_group])
    assert user.permissions.has_any_role() is True
