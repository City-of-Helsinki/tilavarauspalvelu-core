# Generated by Django 5.1.3 on 2024-11-27 12:04
from __future__ import annotations

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0035_delete_building"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Introduction",
        ),
    ]