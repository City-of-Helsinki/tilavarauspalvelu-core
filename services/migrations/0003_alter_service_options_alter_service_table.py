# Generated by Django 4.2.9 on 2024-01-23 07:12

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("services", "0002_services_modeltranslation"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="service",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelTable(
            name="service",
            table="services",
        ),
    ]