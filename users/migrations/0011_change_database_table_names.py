# Generated by Django 4.2.9 on 2024-01-23 07:12

from django.db import migrations

from utils.migration import AlterModelTable


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0010_add_base_manager_name_to_all_models"),
    ]

    operations = [
        AlterModelTable(
            name="personalinfoviewlog",
            table="personal_info_view_log",
        ),
        AlterModelTable(
            name="user",
            table="user",
        ),
    ]
