# Generated by Django 5.1.8 on 2025-06-12 10:36
from __future__ import annotations

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0141_migrate_reservation_kind"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="reservationunit",
            name="reservation_kind",
        ),
    ]
