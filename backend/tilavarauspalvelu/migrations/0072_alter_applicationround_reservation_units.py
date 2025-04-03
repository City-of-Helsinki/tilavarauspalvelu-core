# Generated by Django 5.1.6 on 2025-04-03 06:33
from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0071_reservationunit_updated_at"),
    ]

    operations = [
        migrations.AlterField(
            model_name="applicationround",
            name="reservation_units",
            field=models.ManyToManyField(
                limit_choices_to=models.Q(("reservation_kind__in", ["season", "direct_and_season"])),
                related_name="application_rounds",
                to="tilavarauspalvelu.reservationunit",
            ),
        ),
    ]
