# Generated by Django 5.1.8 on 2025-06-11 11:56
from __future__ import annotations

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0128_remove_old_series_weekdays"),
    ]

    operations = [
        migrations.RenameField(
            model_name="reservationseries",
            old_name="new_weekdays",
            new_name="weekdays",
        ),
    ]
