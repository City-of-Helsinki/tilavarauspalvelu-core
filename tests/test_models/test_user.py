import datetime

import pytest
from django.utils.timezone import get_default_timezone

from tests.factories import (
    ServiceSectorFactory,
    ServiceSectorRoleChoiceFactory,
    ServiceSectorRoleFactory,
    ServiceSectorRolePermissionFactory,
    UnitFactory,
    UnitGroupFactory,
    UnitRoleChoiceFactory,
    UnitRoleFactory,
    UnitRolePermissionFactory,
    UserFactory,
)
from users.models import get_user

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
    )

    assert str(user) == "Last First (test@localhost)"


def test_user__general_user__has_no_staff_permissions():
    user = UserFactory.create()
    assert user.has_staff_permissions is False


def test_user__superuser__has_staff_permissions():
    user = UserFactory.create_superuser()
    assert user.has_staff_permissions is True


def test_user__general_admin__has_staff_permissions():
    user = UserFactory.create_with_general_permissions(
        perms=["can_manage_general_roles"],
        code="foo",
    )
    assert user.has_staff_permissions is True


def test_user__general_admin__access_to_permissions(query_counter):
    user = UserFactory.create_with_general_permissions(
        perms=["can_manage_general_roles"],
        code="foo",
    )
    with query_counter() as count:
        perms = user.general_permissions

    assert len(count.queries) == 1, count.log

    assert perms == ["can_manage_general_roles"]


def test_user__service_sector_admin__has_staff_permissions():
    sector = ServiceSectorFactory.create()
    user = UserFactory.create_with_service_sector_permissions(
        service_sector=sector,
        perms=["can_manage_service_sector_roles"],
        code="foo",
    )
    assert user.has_staff_permissions is True


def test_user__service_sector_admin__access_to_permissions(query_counter):
    sector_1 = ServiceSectorFactory.create()
    sector_2 = ServiceSectorFactory.create()
    user = UserFactory.create_with_service_sector_permissions(
        service_sector=sector_1,
        perms=["can_manage_service_sector_roles", "can_handle_applications"],
        code="foo",
    )

    choice = ServiceSectorRoleChoiceFactory.create(code="bar")
    ServiceSectorRoleFactory.create(role=choice, service_sector=sector_2, user=user)
    ServiceSectorRolePermissionFactory.create(role=choice, permission="can_manage_unit_roles")

    with query_counter() as count:
        perms = user.service_sector_permissions

    assert len(count.queries) == 1, count.log

    assert sorted(perms) == sorted([sector_1.pk, sector_2.pk])
    assert sorted(perms[sector_1.pk]) == sorted(["can_manage_service_sector_roles", "can_handle_applications"])
    assert sorted(perms[sector_2.pk]) == sorted(["can_manage_unit_roles"])


def test_user__unit_admin__has_staff_permissions():
    unit = UnitFactory.create()
    user = UserFactory.create_with_unit_permissions(
        unit=unit,
        perms=["can_manage_unit_roles"],
        code="foo",
    )
    assert user.has_staff_permissions is True


def test_user__unit_admin__access_to_permissions(query_counter):
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()
    unit_3 = UnitFactory.create()
    unit_group = UnitGroupFactory.create()

    user = UserFactory.create_with_unit_permissions(
        unit=unit_1,
        perms=["can_manage_unit_roles", "can_handle_applications"],
        code="foo",
    )

    choice_1 = UnitRoleChoiceFactory.create(code="bar")
    role = UnitRoleFactory.create(role=choice_1, user=user)
    role.unit.add(unit_2, unit_3)
    UnitRolePermissionFactory.create(role=choice_1, permission="can_manage_spaces")

    # Unit group only role should not show up here
    choice_2 = UnitRoleChoiceFactory.create(code="baz")
    role = UnitRoleFactory.create(role=choice_2, user=user)
    role.unit_group.add(unit_group)
    UnitRolePermissionFactory.create(role=choice_2, permission="can_create_staff_reservations")

    with query_counter() as count:
        perms = user.unit_permissions

    assert len(count.queries) == 1, count.log

    assert sorted(perms) == sorted([unit_1.pk, unit_2.pk, unit_3.pk])
    assert sorted(perms[unit_1.pk]) == sorted(["can_handle_applications", "can_manage_unit_roles"])
    assert sorted(perms[unit_2.pk]) == sorted(["can_manage_spaces"])
    assert sorted(perms[unit_3.pk]) == sorted(["can_manage_spaces"])


def test_user__unit_group_admin__has_staff_permissions():
    unit_group = UnitGroupFactory.create()
    user = UserFactory.create_with_unit_group_permissions(
        unit_group=unit_group, perms=["can_manage_unit_roles"], code="foo"
    )
    assert user.has_staff_permissions is True


def test_user__unit_group_admin__access_to_permissions(query_counter):
    unit_group_1 = UnitGroupFactory.create()
    unit_group_2 = UnitGroupFactory.create()
    unit_group_3 = UnitGroupFactory.create()
    unit = UnitFactory.create()

    user = UserFactory.create_with_unit_group_permissions(
        unit_group=unit_group_1,
        perms=["can_manage_unit_roles", "can_handle_applications"],
        code="foo",
    )

    choice_1 = UnitRoleChoiceFactory.create(code="bar")
    role = UnitRoleFactory.create(role=choice_1, user=user)
    role.unit_group.add(unit_group_2, unit_group_3)
    UnitRolePermissionFactory.create(role=choice_1, permission="can_manage_spaces")

    # Unit only role should not show up here
    choice_2 = UnitRoleChoiceFactory.create(code="baz")
    role = UnitRoleFactory.create(role=choice_2, user=user)
    role.unit.add(unit)
    UnitRolePermissionFactory.create(role=choice_2, permission="can_create_staff_reservations")

    with query_counter() as count:
        perms = user.unit_group_permissions

    assert len(count.queries) == 1, count.log

    assert sorted(perms) == sorted([unit_group_1.pk, unit_group_2.pk, unit_group_3.pk])
    assert sorted(perms[unit_group_1.pk]) == sorted(["can_handle_applications", "can_manage_unit_roles"])
    assert sorted(perms[unit_group_2.pk]) == sorted(["can_manage_spaces"])
    assert sorted(perms[unit_group_3.pk]) == sorted(["can_manage_spaces"])


def test_request_user__general_admin__permission_are_fetched(query_counter):
    user = UserFactory.create_with_general_permissions(
        perms=["can_manage_general_roles"],
        code="foo",
    )

    with query_counter() as count_1:
        same_user = get_user(user.pk)

    # Should only need one query.
    assert len(count_1.queries) == 1, count_1.log

    with query_counter() as count_2:
        assert same_user.general_permissions == ["can_manage_general_roles"]
        assert same_user.service_sector_permissions == {}
        assert same_user.unit_permissions == {}
        assert same_user.unit_group_permissions == {}

    # Things should be cached, not additional queries needed.
    assert len(count_2.queries) == 0, count_2.log


def test_request_user__service_sector_admin__permission_are_fetched(query_counter):
    sector = ServiceSectorFactory.create()
    user = UserFactory.create_with_service_sector_permissions(
        service_sector=sector,
        perms=["can_manage_service_sector_roles"],
        code="foo",
    )

    with query_counter() as count_1:
        same_user = get_user(user.pk)

    # Should only need one query.
    assert len(count_1.queries) == 1, count_1.log

    with query_counter() as count_2:
        assert same_user.general_permissions == []
        assert same_user.service_sector_permissions == {sector.pk: ["can_manage_service_sector_roles"]}
        assert same_user.unit_permissions == {}
        assert same_user.unit_group_permissions == {}

    # Things should be cached, not additional queries needed.
    assert len(count_2.queries) == 0, count_2.log


def test_request_user__unit_admin__permission_are_fetched(query_counter):
    unit = UnitFactory.create()
    user = UserFactory.create_with_unit_permissions(
        unit=unit,
        perms=["can_manage_unit_roles"],
        code="foo",
    )

    with query_counter() as count_1:
        same_user = get_user(user.pk)

    # Should only need one query.
    assert len(count_1.queries) == 1, count_1.log

    with query_counter() as count_2:
        assert same_user.general_permissions == []
        assert same_user.service_sector_permissions == {}
        assert same_user.unit_permissions == {unit.pk: ["can_manage_unit_roles"]}
        assert same_user.unit_group_permissions == {}

    # Things should be cached, not additional queries needed.
    assert len(count_2.queries) == 0, count_2.log


def test_request_user__unit_group_admin__permission_are_fetched(query_counter):
    unit_group = UnitGroupFactory.create()
    user = UserFactory.create_with_unit_group_permissions(
        unit_group=unit_group,
        perms=["can_manage_unit_roles"],
        code="foo",
    )

    with query_counter() as count_1:
        same_user = get_user(user.pk)

    # Should only need one query.
    assert len(count_1.queries) == 1, count_1.log

    with query_counter() as count_2:
        assert same_user.general_permissions == []
        assert same_user.service_sector_permissions == {}
        assert same_user.unit_permissions == {}
        assert same_user.unit_group_permissions == {unit_group.pk: ["can_manage_unit_roles"]}

    # Things should be cached, not additional queries needed.
    assert len(count_2.queries) == 0, count_2.log
