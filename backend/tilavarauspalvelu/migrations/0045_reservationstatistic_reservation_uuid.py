# Generated by Django 5.1.3 on 2024-11-28 07:48
from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0044_change_uuid_to_unique"),
    ]

    operations = [
        migrations.AddField(
            model_name="reservationstatistic",
            name="reservation_uuid",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
