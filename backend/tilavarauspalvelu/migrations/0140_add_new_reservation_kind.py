# Generated by Django 5.1.8 on 2025-06-12 10:36
from __future__ import annotations

from django.db import migrations, models

import tilavarauspalvelu.enums
import utils.fields.model


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0139_migrate_metadata_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="applicationround",
            name="reservation_units",
            field=models.ManyToManyField(
                limit_choices_to=models.Q(("reservation_kind__in", ["SEASON", "DIRECT_AND_SEASON"])),
                related_name="application_rounds",
                to="tilavarauspalvelu.reservationunit",
            ),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="new_reservation_kind",
            field=utils.fields.model.StrChoiceField(
                choices=[("DIRECT", "Direct"), ("SEASON", "Season"), ("DIRECT_AND_SEASON", "Direct and season")],
                db_index=True,
                default="DIRECT_AND_SEASON",
                enum=tilavarauspalvelu.enums.ReservationKind,
                max_length=17,
            ),
        ),
    ]
