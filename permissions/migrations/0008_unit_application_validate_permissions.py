# Generated by Django 3.1.7 on 2021-04-26 12:12

from django.db import migrations, models


def update_permissions(apps, schema_editor):
    UnitRoleChoice = apps.get_model("permissions", "UnitRoleChoice")
    UnitRolePermission = apps.get_model("permissions", "UnitRolePermission")

    # General Admin
    unit_manager = UnitRoleChoice.objects.get(
        code="manager"
    )
    UnitRolePermission.objects.create(
        role=unit_manager,
        permission="can_validate_applications"
    )

class Migration(migrations.Migration):

    dependencies = [
        ('permissions', '0007_city_modify_permissions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='unitrolepermission',
            name='permission',
            field=models.CharField(choices=[('can_manage_unit_roles', 'Can modify roles for the unit'), ('can_manage_reservation_units', 'Can create, edit and delete reservation units in the unit'), ('can_manage_reservations', 'Can create, edit and cancel reservations in the unit'), ('can_view_reservations', 'Can view details of all reservations in the unit'), ('can_view_users', 'Can view users in the whole system'), ('can_allocate_applications', 'Can allocate applications'), ('can_validate_applications', 'Can validate applications')], max_length=255, verbose_name='Permission'),
        ),
        migrations.RunPython(update_permissions, migrations.RunPython.noop),
    ]
