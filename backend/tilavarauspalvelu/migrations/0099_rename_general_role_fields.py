# Generated by Django 5.1.8 on 2025-06-05 12:55
from __future__ import annotations

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0098_rename_application_round_time_slot_fields"),
    ]

    operations = [
        migrations.RenameField(
            model_name="generalrole",
            old_name="created",
            new_name="created_at",
        ),
        migrations.RenameField(
            model_name="generalrole",
            old_name="role_active",
            new_name="is_role_active",
        ),
        migrations.RenameField(
            model_name="generalrole",
            old_name="modified",
            new_name="updated_at",
        ),
    ]
