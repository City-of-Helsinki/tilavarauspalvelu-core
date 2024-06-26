# Generated by Django 5.0.4 on 2024-05-10 09:24

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0090_add_application_notification_dates"),
        ("reservations", "0069_alter_reservation_type"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="recurringreservation",
            name="allocated_time_slot",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="recurring_reservation",
                to="applications.allocatedtimeslot",
            ),
        ),
        migrations.AlterField(
            model_name="recurringreservation",
            name="recurrence_in_days",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="recurringreservation",
            name="user",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AlterField(
            model_name="reservation",
            name="confirmed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
