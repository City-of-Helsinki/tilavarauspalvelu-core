# Generated by Django 5.1.3 on 2024-12-11 08:26
from __future__ import annotations

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0065_reservation_access_code_generated_at_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="reservationunit",
            name="require_introduction",
        ),
    ]
