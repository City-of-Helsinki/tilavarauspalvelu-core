from functools import partial

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import UnitFactory, UnitGroupFactory, UnitRoleFactory, UserFactory
from tilavarauspalvelu.enums import UserPermissionChoice, UserRoleChoice

pytestmark = [
    pytest.mark.django_db,
]


permissions_query = partial(
    build_query,
    "checkPermissions",
    fields="hasPermission",
)


def test_permission_checker__superuser(graphql):
    graphql.login_with_superuser()

    permission = UserPermissionChoice.CAN_MANAGE_APPLICATIONS
    query = permissions_query(permission=permission)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": True}


def test_permission_checker__inactive(graphql):
    user = graphql.login_with_superuser()
    user.is_active = False
    user.save()

    permission = UserPermissionChoice.CAN_MANAGE_APPLICATIONS
    query = permissions_query(permission=permission)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": False}


def test_permission_checker__general_role__admin(graphql):
    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    permission = UserPermissionChoice.CAN_MANAGE_APPLICATIONS
    query = permissions_query(permission=permission)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": True}


def test_permission_checker__general_role__reserver__has_permission(graphql):
    admin = UserFactory.create_with_general_role(role=UserRoleChoice.RESERVER)
    graphql.force_login(admin)

    permission = UserPermissionChoice.CAN_CREATE_STAFF_RESERVATIONS
    query = permissions_query(permission=permission)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": True}


def test_permission_checker__general_role__reserver__no_permission(graphql):
    admin = UserFactory.create_with_general_role(role=UserRoleChoice.RESERVER)
    graphql.force_login(admin)

    permission = UserPermissionChoice.CAN_MANAGE_APPLICATIONS
    query = permissions_query(permission=permission)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": False}


def test_permission_checker__unit_role__admin(graphql):
    unit = UnitFactory.create()
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    permission = UserPermissionChoice.CAN_MANAGE_APPLICATIONS
    query = permissions_query(permission=permission, units=[unit.pk])
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": True}


def test_permission_checker__unit_role__admin__different_unit(graphql):
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()
    admin = UserFactory.create_with_unit_role(units=[unit_1])
    graphql.force_login(admin)

    permission = UserPermissionChoice.CAN_MANAGE_APPLICATIONS
    query = permissions_query(permission=permission, units=[unit_2.pk])
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": False}


def test_permission_checker__unit_role__admin__unit_group(graphql):
    unit_group = UnitGroupFactory.create()
    unit = UnitFactory.create(unit_groups=[unit_group])
    admin = UserFactory.create_with_unit_role(unit_groups=[unit_group])
    graphql.force_login(admin)

    permission = UserPermissionChoice.CAN_MANAGE_APPLICATIONS
    query = permissions_query(permission=permission, units=[unit.pk])
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": True}


def test_permission_checker__unit_role__admin__require_any__has_permission(graphql):
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()
    admin = UserFactory.create_with_unit_role(units=[unit_1])
    graphql.force_login(admin)

    permission = UserPermissionChoice.CAN_MANAGE_APPLICATIONS
    query = permissions_query(permission=permission, units=[unit_1.pk, unit_2.pk])
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": True}


def test_permission_checker__unit_role__admin__require_all__no_permission(graphql):
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()
    admin = UserFactory.create_with_unit_role(units=[unit_1])
    graphql.force_login(admin)

    permission = UserPermissionChoice.CAN_MANAGE_APPLICATIONS
    query = permissions_query(permission=permission, units=[unit_1.pk, unit_2.pk], require_all=True)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": False}


def test_permission_checker__unit_role__admin__require_all__has_permission(graphql):
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()
    admin = UserFactory.create_with_unit_role(units=[unit_1])
    UnitRoleFactory.create(user=admin, units=[unit_2])
    graphql.force_login(admin)

    permission = UserPermissionChoice.CAN_MANAGE_APPLICATIONS
    query = permissions_query(permission=permission, units=[unit_1.pk, unit_2.pk], require_all=True)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": True}


def test_permission_checker__unit_role__admin__require_all__has_permission__one_through_unit_group(graphql):
    unit_group = UnitGroupFactory.create()
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create(unit_groups=[unit_group])
    admin = UserFactory.create_with_unit_role(units=[unit_1])
    UnitRoleFactory.create(user=admin, unit_groups=[unit_group])
    graphql.force_login(admin)

    permission = UserPermissionChoice.CAN_MANAGE_APPLICATIONS
    query = permissions_query(permission=permission, units=[unit_1.pk, unit_2.pk], require_all=True)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {"hasPermission": True}
