# Generated by Django 4.2.9 on 2024-01-23 07:12

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0009_profileuser"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="personalinfoviewlog",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelOptions(
            name="user",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelTable(
            name="personalinfoviewlog",
            table="personal_info_view_log",
        ),
        migrations.AlterModelTable(
            name="user",
            table="user",
        ),
    ]
