# Generated by Django 5.0.4 on 2024-04-08 08:47

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("permissions", "0025_alter_unitrolepermission_permission"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="generalrole",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="generalrolechoice",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="generalrolepermission",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="servicesectorrole",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="servicesectorrolechoice",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="servicesectorrolepermission",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="unitrole",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="unitrolechoice",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
        migrations.AlterModelOptions(
            name="unitrolepermission",
            options={"base_manager_name": "objects", "ordering": ["pk"]},
        ),
    ]
