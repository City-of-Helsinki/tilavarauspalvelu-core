from __future__ import annotations

from django.contrib.auth.models import Group, Permission

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import Unit, UnitGroup, User

from tests.factories import GeneralRoleFactory, UnitGroupFactory, UnitRoleFactory

from .utils import with_logs


@with_logs
def _set_user_group_permissions() -> None:
    group = Group.objects.get_or_create(name="ALL")[0]
    group.permissions.add(*Permission.objects.all())
    for user in User.objects.all():
        user.groups.add(group)


@with_logs
def _set_user_roles() -> None:
    users = User.objects.exclude(username="tvp").all()
    units = list(Unit.objects.all())
    unit_groups = list(UnitGroup.objects.all())

    for user in users:
        kind, user_role = user.last_name.split("-")
        user_role: UserRoleChoice = UserRoleChoice(user_role)

        if kind == "Unit":
            UnitRoleFactory.create(
                user=user,
                role=user_role,
                assigner=users[0],
                units=units,
                unit_groups=unit_groups,
            )

        elif kind == "General":
            GeneralRoleFactory.create(
                user=user,
                role=user_role,
                assigner=users[0],
            )

        else:
            msg = f"Unknown role kind: {kind}"
            raise ValueError(msg)


@with_logs
def _create_unit_groups() -> list[UnitGroup]:
    units = list(Unit.objects.all())

    unit_group_1 = UnitGroupFactory.create()
    unit_group_2 = UnitGroupFactory.create()

    # Add half of the units to the first group, the other half to the second group
    unit_group_1.units.add(*units[: len(units) // 2])
    unit_group_2.units.add(*units[len(units) // 2 :])

    return [unit_group_1, unit_group_2]
