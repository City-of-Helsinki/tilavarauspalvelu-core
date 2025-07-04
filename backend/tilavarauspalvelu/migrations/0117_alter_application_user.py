# Generated by Django 5.1.8 on 2025-06-11 06:05
from __future__ import annotations

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def check_no_null_application_user(apps, schema_editor):
    Application = apps.get_model("tilavarauspalvelu", "Application")

    null_user_applications = Application.objects.filter(user__isnull=True).count()

    if null_user_applications > 0:
        msg = f"{null_user_applications} application have a null user. Cannot migrate to non-null column."
        raise RuntimeError(msg)


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0116_migrate_metadata_to_forms"),
    ]

    operations = [
        migrations.RunPython(
            code=check_no_null_application_user,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="application",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="applications",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
