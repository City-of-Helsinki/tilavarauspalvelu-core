# Generated by Django 5.0.4 on 2024-05-07 23:06

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("spaces", "0037_alter_building_options_alter_location_options_and_more"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="unitgroup",
            options={"base_manager_name": "objects", "ordering": ["name"]},
        ),
    ]