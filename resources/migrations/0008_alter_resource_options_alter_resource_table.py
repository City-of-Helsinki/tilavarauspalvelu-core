# Generated by Django 4.2.9 on 2024-01-23 07:12

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("resources", "0007_auto_20220616_1006"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="resource",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelTable(
            name="resource",
            table="resources",
        ),
    ]
