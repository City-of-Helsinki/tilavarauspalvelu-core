# Generated by Django 5.1.3 on 2024-12-10 07:58
from __future__ import annotations

import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0050_change_reservation_unit_vectors_to_non_null"),
    ]

    operations = [
        migrations.AddField(
            model_name="applicationsection",
            name="ext_uuid",
            field=models.UUIDField(default=uuid.uuid4, null=True),
        ),
    ]