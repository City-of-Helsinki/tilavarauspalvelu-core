# Generated by Django 5.1.6 on 2025-03-20 09:50
from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0070_reservation_unit_image_ordering"),
    ]

    operations = [
        migrations.AddField(
            model_name="reservationunit",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, db_index=True),
        ),
    ]
