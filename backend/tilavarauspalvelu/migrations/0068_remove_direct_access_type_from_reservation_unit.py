# Generated by Django 5.1.4 on 2025-02-18 16:02
from __future__ import annotations

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0067_reservationunitaccesstype"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="reservationunit",
            name="access_type_starts_before_ends",
        ),
        migrations.RemoveField(
            model_name="reservationunit",
            name="access_type",
        ),
        migrations.RemoveField(
            model_name="reservationunit",
            name="access_type_end_date",
        ),
        migrations.RemoveField(
            model_name="reservationunit",
            name="access_type_start_date",
        ),
    ]
