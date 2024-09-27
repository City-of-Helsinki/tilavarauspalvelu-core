# ruff: noqa: S311


from django.contrib.auth.models import Group, Permission

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import GeneralRole, Unit, UnitGroup, UnitRole, User

from .utils import with_logs


@with_logs("Setting group permissions...", "Group permissions set!")
def _set_user_group_permissions(users: list[User]) -> None:
    group = Group.objects.get_or_create(name="ALL")[0]
    group.permissions.add(*Permission.objects.all())
    for user in users:
        user.groups.add(group)


@with_logs("Setting user roles...", "User roles set!")
def _set_user_roles(
    users: list[User],
    units: list[Unit],
    unit_groups: list[UnitGroup],
) -> None:
    # TODO: Refactor this function
    for user in users[1:]:
        kind, user_role = user.last_name.split("-")
        user_role: UserRoleChoice = UserRoleChoice(user_role)

        if kind == "Unit":
            _create_unit_role(
                user,
                user_role,
                assigner=users[0],
                units=units,
                unit_groups=unit_groups,
            )

        elif kind == "General":
            _create_general_role(user, user_role, assigner=users[0])

        else:
            raise ValueError(f"Unknown role kind: {kind}")


def _create_general_role(
    user: User,
    role: UserRoleChoice,
    *,
    assigner: User,
) -> GeneralRole:
    return GeneralRole.objects.create(
        user=user,
        role=role,
        assigner=assigner,
    )


def _create_unit_role(
    user: User,
    role: UserRoleChoice,
    *,
    assigner: User,
    units: list[Unit],
    unit_groups: list[UnitGroup],
) -> UnitRole:
    unit_role = UnitRole.objects.create(
        user=user,
        role=role,
        assigner=assigner,
    )
    unit_role.units.add(*units)
    unit_role.unit_groups.add(*unit_groups)
    return unit_role
