# Generated by Django 5.1.3 on 2024-12-11 08:44
from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0058_unit_search_terms"),
    ]

    operations = [
        migrations.AddField(
            model_name="unit",
            name="allow_permissions_from_ad_groups",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="unitrole",
            name="is_from_ad_group",
            field=models.BooleanField(default=False),
        ),
    ]
