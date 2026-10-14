from __future__ import annotations

import pytest
from django.contrib.auth.models import AnonymousUser

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import (
    ApplicationFactory,
    ApplicationRoundFactory,
    ReservationFactory,
    ReservationSeriesFactory,
    ReservationUnitFactory,
    SpaceFactory,
    UnitFactory,
    UnitGroupFactory,
    UserFactory,
)

pytestmark = [
    pytest.mark.django_db,
]


# ── No permissions ──


@pytest.mark.parametrize("kind", ["anonymous", "inactive"])
def test_permission_resolver__anonymous_or_inactive_user__has_no_permissions(kind):
    unit = UnitFactory.create()
    space = SpaceFactory.create(unit=unit)
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    reservation = ReservationFactory.create(reservation_unit=reservation_unit)
    reservation_series = ReservationSeriesFactory.create(reservation_unit=reservation_unit)
    application = ApplicationFactory.create()
    application_round = ApplicationRoundFactory.create()

    user = AnonymousUser() if kind == "anonymous" else UserFactory.create_superuser(is_active=False)

    assert user.permissions.has_any_role() is False
    assert user.permissions.has_general_role() is False
    assert user.permissions.has_role_for_units_or_their_unit_groups(units=[unit]) is False
    assert user.permissions.unit_ids_where_has_role(role_choices=[UserRoleChoice.ADMIN]) == []
    assert user.permissions.unit_group_ids_where_has_role(role_choices=[UserRoleChoice.ADMIN]) == []

    assert user.permissions.can_create_staff_reservation(reservation_unit) is False
    assert user.permissions.can_manage_application(application) is False
    assert user.permissions.can_manage_application_round(application_round) is False
    assert user.permissions.can_manage_applications_for_units([unit]) is False
    assert user.permissions.can_manage_notifications() is False
    assert user.permissions.can_manage_reservation(reservation) is False
    assert user.permissions.can_manage_reservation_related_data() is False
    assert user.permissions.can_manage_reservations_for_units([unit]) is False
    assert user.permissions.can_manage_resources(space) is False
    assert user.permissions.can_manage_spaces(unit) is False
    assert user.permissions.can_manage_unit(unit) is False
    assert user.permissions.can_view_application(application) is False
    assert user.permissions.can_view_reservation_series(reservation_series) is False
    assert user.permissions.can_view_reservation(reservation) is False
    assert user.permissions.can_view_user(UserFactory.create()) is False


# ── Superuser ──


def test_permission_resolver__superuser__can_manage_notifications_and_reservations():
    unit = UnitFactory.create()
    user = UserFactory.create_superuser()

    assert user.permissions.can_manage_notifications() is True
    assert user.permissions.can_manage_reservations_for_units([unit]) is True


# ── Roles for units ──


def test_permission_resolver__has_role_for_units__any_role_by_default():
    unit = UnitFactory.create()
    other_unit = UnitFactory.create()
    user = UserFactory.create_with_unit_role(units=[unit], role=UserRoleChoice.VIEWER)

    assert user.permissions.has_role_for_units_or_their_unit_groups(units=[unit]) is True
    assert user.permissions.has_role_for_units_or_their_unit_groups(units=[other_unit]) is False


def test_permission_resolver__has_role_for_units__no_units_given__uses_units_from_roles():
    unit = UnitFactory.create()
    unit_group = UnitGroupFactory.create(units=[UnitFactory.create()])
    unit_user = UserFactory.create_with_unit_role(units=[unit])
    unit_group_user = UserFactory.create_with_unit_role(unit_groups=[unit_group])
    user_without_roles = UserFactory.create()

    assert unit_user.permissions.has_role_for_units_or_their_unit_groups() is True
    assert unit_group_user.permissions.has_role_for_units_or_their_unit_groups() is True
    assert user_without_roles.permissions.has_role_for_units_or_their_unit_groups() is False


# ── Reservations ──


def test_permission_resolver__can_manage_reservations_for_units__general_role():
    unit = UnitFactory.create()
    admin = UserFactory.create_with_general_role(role=UserRoleChoice.ADMIN)
    viewer = UserFactory.create_with_general_role(role=UserRoleChoice.VIEWER)

    assert admin.permissions.can_manage_reservations_for_units([unit]) is True
    assert viewer.permissions.can_manage_reservations_for_units([unit]) is False


def test_permission_resolver__can_view_reservation_series__general_role():
    reservation_series = ReservationSeriesFactory.create()
    viewer = UserFactory.create_with_general_role(role=UserRoleChoice.VIEWER)
    reserver = UserFactory.create_with_general_role(role=UserRoleChoice.RESERVER)

    assert viewer.permissions.can_view_reservation_series(reservation_series) is True
    assert reserver.permissions.can_view_reservation_series(reservation_series) is False


# ── Resources and spaces ──


def test_permission_resolver__can_manage_resources__general_role():
    user = UserFactory.create_with_general_role(role=UserRoleChoice.ADMIN)

    assert user.permissions.can_manage_resources(None) is True


def test_permission_resolver__can_manage_resources__unit_role__no_space():
    unit = UnitFactory.create()
    user = UserFactory.create_with_unit_role(units=[unit], role=UserRoleChoice.ADMIN)

    assert user.permissions.can_manage_resources(SpaceFactory.create(unit=unit)) is True
    assert user.permissions.can_manage_resources(None) is False


def test_permission_resolver__can_manage_spaces__unit_role__no_unit():
    unit = UnitFactory.create()
    user = UserFactory.create_with_unit_role(units=[unit], role=UserRoleChoice.ADMIN)

    assert user.permissions.can_manage_spaces(unit) is True
    assert user.permissions.can_manage_spaces(None) is False


# ── Applications ──


def test_permission_resolver__can_view_application__owner():
    user = UserFactory.create()
    application = ApplicationFactory.create(user=user)

    assert user.permissions.can_view_application(application) is True
    assert user.permissions.can_view_application(application, reserver_needs_role=True) is False
    assert UserFactory.create().permissions.can_view_application(application) is False


# ── Users ──


def test_permission_resolver__can_view_user__self():
    user = UserFactory.create()

    assert user.permissions.can_view_user(user) is True


def test_permission_resolver__can_view_user__other_user_without_roles():
    user = UserFactory.create()

    assert user.permissions.can_view_user(UserFactory.create()) is False


def test_permission_resolver__can_view_user__superuser():
    user = UserFactory.create_superuser()

    assert user.permissions.can_view_user(UserFactory.create()) is True


@pytest.mark.parametrize(
    ("role", "expected"),
    [
        (UserRoleChoice.ADMIN, True),
        (UserRoleChoice.HANDLER, False),
        (UserRoleChoice.VIEWER, False),
        (UserRoleChoice.RESERVER, False),
    ],
)
def test_permission_resolver__can_view_user__general_role(role, expected):
    user = UserFactory.create_with_general_role(role=role)

    assert user.permissions.can_view_user(UserFactory.create()) is expected


@pytest.mark.parametrize(
    ("role", "expected"),
    [
        (UserRoleChoice.ADMIN, True),
        (UserRoleChoice.HANDLER, False),
    ],
)
def test_permission_resolver__can_view_user__unit_role(role, expected):
    user = UserFactory.create_with_unit_role(units=[UnitFactory.create()], role=role)

    assert user.permissions.can_view_user(UserFactory.create()) is expected


def test_permission_resolver__can_view_user__unit_group_role():
    unit_group = UnitGroupFactory.create(units=[UnitFactory.create()])
    user = UserFactory.create_with_unit_role(unit_groups=[unit_group], role=UserRoleChoice.ADMIN)

    assert user.permissions.can_view_user(UserFactory.create()) is True
