# Generated by Django 5.1.3 on 2024-11-27 11:35
from __future__ import annotations

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0032_delete_servicesector"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="reservationunit",
            name="services",
        ),
        migrations.DeleteModel(
            name="Service",
        ),
    ]