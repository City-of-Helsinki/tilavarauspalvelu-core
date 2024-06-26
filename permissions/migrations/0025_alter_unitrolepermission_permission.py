# Generated by Django 5.0.3 on 2024-03-25 08:54

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("permissions", "0024_change_database_table_names"),
    ]

    operations = [
        migrations.AlterField(
            model_name="unitrolepermission",
            name="permission",
            field=models.CharField(
                choices=[
                    ("can_manage_unit_roles", "Can modify roles for the unit"),
                    ("can_manage_reservation_units", "Can create, edit and delete reservation units in the unit"),
                    ("can_manage_reservations", "Can create, edit and cancel reservations in the unit"),
                    ("can_view_reservations", "Can view details of all reservations in the unit"),
                    ("can_view_users", "Can view users in the whole system"),
                    ("can_validate_applications", "Can validate applications in the unit"),
                    ("can_allocate_applications", "Can allocate application in the unit"),
                    ("can_handle_applications", "Can handle application in the unit"),
                    ("can_manage_units", "Can edit unit information"),
                    ("can_manage_spaces", "Can create, edit and delete spaces in the unit"),
                    ("can_manage_resources", "Can create, edit and delete resources in the given unit"),
                    ("can_create_staff_reservations", "Can create staff reservations in the given unit"),
                    ("can_comment_reservations", "Can comment reservations in the unit"),
                ],
                max_length=255,
                verbose_name="Permission",
            ),
        ),
    ]
