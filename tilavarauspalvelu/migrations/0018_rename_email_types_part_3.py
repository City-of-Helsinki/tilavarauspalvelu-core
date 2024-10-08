# Generated by Django 5.1.1 on 2024-09-24 08:20

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0017_rename_email_types_part_2"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="emailtemplate",
            options={"base_manager_name": "objects", "ordering": ["type"]},
        ),
        migrations.AlterField(
            model_name="emailtemplate",
            name="type",
            field=models.CharField(
                choices=[
                    ("application_handled", "Application Handled"),
                    ("application_in_allocation", "Application In Allocation"),
                    ("application_received", "Application Received"),
                    ("reservation_cancelled", "Reservation Cancelled"),
                    ("reservation_confirmed", "Reservation Confirmed"),
                    ("reservation_handled_and_confirmed", "Reservation Handled And Confirmed"),
                    ("reservation_handling_required", "Reservation Handling Required"),
                    ("reservation_modified", "Reservation Modified"),
                    ("reservation_needs_to_be_paid", "Reservation Needs To Be Paid"),
                    ("reservation_rejected", "Reservation Rejected"),
                    ("staff_notification_reservation_made", "Staff Notification Reservation Made"),
                    (
                        "staff_notification_reservation_requires_handling",
                        "Staff Notification Reservation Requires Handling",
                    ),
                ],
                help_text="Only one template per type can be created.",
                max_length=254,
                unique=True,
                verbose_name="Email type",
            ),
        ),
    ]
