# Generated by Django 4.2.9 on 2024-01-23 07:12

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("opening_hours", "0001_initial"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="originhaukiresource",
            options={"base_manager_name": "objects"},
        ),
    ]