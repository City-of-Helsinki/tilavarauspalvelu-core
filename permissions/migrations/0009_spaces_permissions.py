from django.db import migrations, models


def update_permissions(apps, schema_editor):
    GeneralRoleChoice = apps.get_model('permissions', 'GeneralRoleChoice')
    GeneralRolePermission = apps.get_model('permissions', 'GeneralRolePermission')

    # General Admin
    general_admin = GeneralRoleChoice.objects.get(
        code="admin",
    )
    GeneralRolePermission.objects.create(
        role=general_admin,
        permission="can_manage_spaces"
    )


class Migration(migrations.Migration):

    dependencies = [
        ('permissions', '0008_unit_application_validate_permissions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='generalrolepermission',
            name='permission',
            field=models.CharField(choices=[('can_manage_general_roles', 'Can manage general roles for the whole system'), ('can_manage_service_sector_roles', 'Can manage roles for service sectorsfor the whole system'), ('can_manage_unit_roles', 'Can manage roles for units in the whole system'), ('can_manage_reservation_units', 'Can create, edit and delete reservation units in the whole system'), ('can_manage_purposes', 'Can create, edit and delete purposes in the whole system'), ('can_manage_age_groups', 'Can create, edit and delete age groups in the whole system'), ('can_manage_districts', 'Can create, edit and delete districts in the whole system'), ('can_manage_ability_groups', 'Can create, edit and delete ability groups in the whole system'), ('can_manage_reservation_unit_types', 'Can create, edit and delete reservation unit types in the whole system'), ('can_manage_equipment_categories', 'Can create, edit and delete equipment_categories in the whole system'), ('can_manage_equipment', 'Can create, edit and delete equipment in the whole system'), ('can_view_reservations', 'Can create, edit and delete equipment in the whole system'), ('can_manage_reservations', 'Can create, edit and delete equipment in the whole system'), ('can_manage_reservations', 'Can create, edit and cancel reservations in the whole system'), ('can_view_reservations', 'Can view details of all reservations in the whole system'), ('can_manage_resources', 'Can create, edit and delete resources in the whole system'), ('can_manage_spaces', 'Can create, edit and delete spaces in the whole system'), ('can_handle_applications', 'Can handle applications in the whole system'), ('can_manage_application_rounds', 'Can create, edit and delete application rounds in the whole system'), ('can_view_users', 'Can view users in the whole system')], max_length=255, verbose_name='Permission'),
        ),
        migrations.RunPython(update_permissions, migrations.RunPython.noop),
    ]
