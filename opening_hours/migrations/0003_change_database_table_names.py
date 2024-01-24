# Generated by Django 4.2.9 on 2024-01-23 07:12

from django.db import migrations

from utils.migration import AlterModelTable


class Migration(migrations.Migration):
    dependencies = [
        ("opening_hours", "0002_add_base_manager_name_to_all_models"),
    ]

    operations = [
        AlterModelTable(
            name="originhaukiresource",
            table="origin_hauki_resource",
        ),
        AlterModelTable(
            name="reservabletimespan",
            table="reservable_time_span",
        ),
    ]
