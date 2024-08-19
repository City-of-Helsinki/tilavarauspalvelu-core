from django.db import migrations, models


class UserRoleChoices(models.TextChoices):
    ADMIN = "ADMIN"  # Pääkäyttäjä
    HANDLER = "HANDLER"  # Käsittelijä
    VIEWER = "VIEWER"  # Katselija
    RESERVER = "RESERVER"  # Varaaja
    NOTIFICATION_MANAGER = "NOTIFICATION_MANAGER"  # Ilmoituksen ylläpitäjä


RESERVER_PERMISSIONS = [
    "can_create_staff_reservations",
]

VIEWER_PERMISSIONS = [
    "can_comment_reservations",
    "can_view_reservations",
]

NOTIFICATION_HANDLER_PERMISSIONS = [
    "can_manage_notifications",
]

HANDLER_PERMISSIONS = [
    "can_allocate_applications",
    "can_comment_reservations",
    "can_create_staff_reservations",
    "can_handle_applications",
    "can_manage_reservations",
    "can_validate_applications",
    "can_view_reservations",
]


def migrate_permissions_to_new_models(apps, schema_editor):
    # General permissions

    GeneralRole = apps.get_model("permissions", "GeneralRole")
    NewGeneralRole = apps.get_model("permissions", "NewGeneralRole")

    new_general_roles = [
        NewGeneralRole(
            role=_determine_role(permissions=sorted(perm.permission.lower() for perm in role.role.permissions.all())),
            user=role.user,
            assigner=role.assigner,
            created=role.created,
            modified=role.modified,
        )
        for role in GeneralRole.objects.select_related("user", "role").prefetch_related("role__permissions").all()
    ]
    NewGeneralRole.objects.bulk_create(new_general_roles)

    # Unit permissions

    UnitRole = apps.get_model("permissions", "UnitRole")
    NewUnitRole = apps.get_model("permissions", "NewUnitRole")
    NewUnitRoleUnit = NewUnitRole.units.through
    NewUnitRoleUnitGroup = NewUnitRole.unit_groups.through

    unit_roles = (
        UnitRole.objects.select_related("user", "role")
        .prefetch_related("unit", "unit_group", "role__permissions")
        .all()
    )

    new_unit_roles = []
    new_unit_roles_units = []
    new_unit_roles_unit_groups = []
    for role in unit_roles:
        new_role = NewUnitRole(
            role=_determine_role(permissions=sorted(perm.permission.lower() for perm in role.role.permissions.all())),
            user=role.user,
            assigner=role.assigner,
            created=role.created,
            modified=role.modified,
        )
        new_unit_roles.append(new_role)

        for unit in role.unit.all():
            new_unit_roles_units.append(NewUnitRoleUnit(unit=unit, newunitrole=new_role))

        for unit_group in role.unit_group.all():
            new_unit_roles_unit_groups.append(NewUnitRoleUnitGroup(unitgroup=unit_group, newunitrole=new_role))

    NewUnitRole.objects.bulk_create(new_unit_roles)
    NewUnitRoleUnit.objects.bulk_create(new_unit_roles_units)
    NewUnitRoleUnitGroup.objects.bulk_create(new_unit_roles_unit_groups)


def _determine_role(permissions: list[str]) -> str:
    if permissions == RESERVER_PERMISSIONS:
        return UserRoleChoices.RESERVER.value
    if permissions == VIEWER_PERMISSIONS:
        return UserRoleChoices.VIEWER.value
    if permissions == NOTIFICATION_HANDLER_PERMISSIONS:
        return UserRoleChoices.NOTIFICATION_MANAGER.value
    if permissions == HANDLER_PERMISSIONS:
        return UserRoleChoices.HANDLER.value
    return UserRoleChoices.ADMIN.value


class Migration(migrations.Migration):
    dependencies = [
        ("permissions", "0028_add_new_models"),
    ]

    operations = [
        migrations.RunPython(
            code=migrate_permissions_to_new_models,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
