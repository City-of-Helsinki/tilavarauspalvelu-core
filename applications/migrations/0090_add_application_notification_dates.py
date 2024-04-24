# Generated by Django 5.0.4 on 2024-04-24 12:08

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0089_migrate_old_application_data"),
    ]

    operations = [
        migrations.AddField(
            model_name="application",
            name="in_allocation_notification_sent_date",
            field=models.DateTimeField(blank=True, default=None, null=True),
        ),
        migrations.AddField(
            model_name="application",
            name="results_ready_notification_sent_date",
            field=models.DateTimeField(blank=True, default=None, null=True),
        ),
    ]
