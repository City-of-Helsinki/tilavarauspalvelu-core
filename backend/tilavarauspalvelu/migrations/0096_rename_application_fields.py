# Generated by Django 5.1.8 on 2025-06-05 10:19
from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0095_migrate_null_additional_information"),
    ]

    operations = [
        migrations.RenameField(
            model_name="application",
            old_name="created_date",
            new_name="created_at",
        ),
        migrations.RenameField(
            model_name="application",
            old_name="last_modified_date",
            new_name="updated_at",
        ),
        migrations.RenameField(
            model_name="application",
            old_name="cancelled_date",
            new_name="cancelled_at",
        ),
        migrations.RenameField(
            model_name="application",
            old_name="in_allocation_notification_sent_date",
            new_name="in_allocation_notification_sent_at",
        ),
        migrations.RenameField(
            model_name="application",
            old_name="results_ready_notification_sent_date",
            new_name="results_ready_notification_sent_at",
        ),
        migrations.RenameField(
            model_name="application",
            old_name="sent_date",
            new_name="sent_at",
        ),
        migrations.AlterField(
            model_name="application",
            name="additional_information",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="application",
            name="cancelled_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="application",
            name="sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="application",
            name="in_allocation_notification_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="application",
            name="results_ready_notification_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
