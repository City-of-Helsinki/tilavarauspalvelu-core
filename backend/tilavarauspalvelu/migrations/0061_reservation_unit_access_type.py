# Generated by Django 5.1.4 on 2025-01-10 09:52
from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0060_unitrole_unique_role_user_for_ad_group"),
    ]

    operations = [
        migrations.AddField(
            model_name="reservationunit",
            name="access_type",
            field=models.CharField(
                choices=[
                    ("ACCESS_CODE", "access code"),
                    ("OPENED_BY_STAFF", "opened by staff"),
                    ("PHYSICAL_KEY", "physical key"),
                    ("UNRESTRICTED", "unrestricted"),
                ],
                default="UNRESTRICTED",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="access_type_end_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="access_type_start_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddConstraint(
            model_name="reservationunit",
            constraint=models.CheckConstraint(
                check=models.Q(
                    ("access_type_start_date__isnull", True),
                    ("access_type_end_date__isnull", True),
                    ("access_type_start_date__lte", models.F("access_type_end_date")),
                    _connector="OR",
                ),
                name="access_type_starts_before_ends",
                violation_error_message="Access type start date must be the same or before its end date",
            ),
        ),
    ]
