# Generated by Django 5.1.8 on 2025-06-12 10:36
from __future__ import annotations

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0142_remove_old_reservation_kind"),
    ]

    operations = [
        migrations.RenameField(
            model_name="reservationunit",
            old_name="new_reservation_kind",
            new_name="reservation_kind",
        ),
    ]
