# ruff: noqa: S311

from typing import Literal

from django.contrib.auth.models import Group, Permission

from permissions.models import (
    GeneralPermissionChoices,
    GeneralRole,
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorPermissionsChoices,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitPermissionChoices,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from spaces.models import ServiceSector, Unit, UnitGroup
from users.models import User

from .utils import RoleChoice, RolePermission, Roles, UserType, batched, pascal_case_to_snake_case, with_logs


@with_logs("Setting group permissions...", "Group permissions set!")
def _set_user_group_permissions(users: list[User]) -> None:
    group = Group.objects.get_or_create(name="ALL")[0]
    group.permissions.add(*Permission.objects.all())
    for user in users:
        user.groups.add(group)


@with_logs()
def _create_roles_and_permissions() -> Roles:
    roles: Roles = {}
    permission_types = [
        (
            "general",
            GeneralRoleChoice,
            GeneralRolePermission,
            GeneralPermissionChoices.values,
        ),
        (
            "unit",
            UnitRoleChoice,
            UnitRolePermission,
            UnitPermissionChoices.values,
        ),
        (
            "service_sector",
            ServiceSectorRoleChoice,
            ServiceSectorRolePermission,
            ServiceSectorPermissionsChoices.values,
        ),
    ]
    role_kind: Literal["general", "unit", "service_sector"]
    role_choice: type[RoleChoice]
    permission: type[RolePermission]
    choices: tuple[str, ...]

    for role_kind, role_choice, permission, choices in permission_types:
        role_choices: list[RoleChoice] = []
        role_permissions: list[RolePermission] = []

        for user_type in UserType:
            new_role = role_choice(
                code=f"{role_kind}_{user_type.name}",
                verbose_name=user_type.value,
            )
            role_choices.append(new_role)
            role_permissions.extend(permission(role=new_role, permission=name) for name in choices)

        roles[role_kind] = {role.code: role for role in role_choice.objects.bulk_create(role_choices)}
        permission.objects.bulk_create(role_permissions)

    return roles


@with_logs("Setting user roles...", "User roles set!")
def _set_user_roles(
    users: list[User],
    roles: Roles,
    units: list[Unit],
    unit_groups: list[UnitGroup],
    service_sectors: list[ServiceSector],
) -> None:
    for user in users:
        if user.get_full_name() in ("Pää Käyttäjä", "Admin User"):
            user_role: RoleChoice = roles["general"]["general_admin"]
            _create_general_role(user, user_role, assigner=users[0])
            continue

        kind, user_type = user.last_name.split("-", maxsplit=2)
        user_type: UserType = UserType(user_type)
        kind = pascal_case_to_snake_case(kind)

        user_role: RoleChoice = roles[kind][f"{kind}_{user_type.name}"]

        if kind == "unit":
            _create_unit_role(
                user,
                user_role,
                assigner=users[0],
                units=units,
                unit_groups=unit_groups,
            )

        elif kind == "service_sector":
            _create_service_sector_roles(
                user,
                user_role,
                assigner=users[0],
                service_sectors=service_sectors,
            )

        elif kind == "general":
            _create_general_role(user, user_role, assigner=users[0])

        else:
            raise ValueError(f"Unknown role kind: {kind}")


def _create_general_role(
    user: User,
    role: GeneralRoleChoice,
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
    role: UnitRoleChoice,
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
    unit_role.unit.add(*units)
    unit_role.unit_group.add(*unit_groups)
    return unit_role


def _create_service_sector_roles(
    user: User,
    role: ServiceSectorRoleChoice,
    *,
    assigner: User,
    service_sectors: list[ServiceSector],
) -> list[ServiceSectorRole]:
    service_sector_roles: list[ServiceSectorRole] = []
    for service_sector in service_sectors:
        service_sector_role = ServiceSectorRole(
            user=user,
            role=role,
            assigner=assigner,
            service_sector=service_sector,
        )
        service_sector_roles.append(service_sector_role)

    return ServiceSectorRole.objects.bulk_create(service_sector_roles)


@with_logs()
def _create_service_sectors(units: list[Unit], *, number: int = 3) -> list[ServiceSector]:
    service_sectors: list[ServiceSector] = []
    for i in range(number):
        service_sector = ServiceSector(
            name=f"Service Sector {i}",
            name_fi=f"Service Sector {i}",
            name_sv=f"Service Sector {i}",
            name_en=f"Service Sector {i}",
        )
        service_sectors.append(service_sector)

    service_sectors = ServiceSector.objects.bulk_create(service_sectors)

    units_batched = batched(units, batch_size=len(service_sectors))
    for service_sector in service_sectors:
        units_batch = next(units_batched)
        service_sector.units.add(*units_batch)

    return service_sectors
