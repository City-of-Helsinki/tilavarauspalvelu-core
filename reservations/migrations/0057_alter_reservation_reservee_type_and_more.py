# Generated by Django 4.2.7 on 2023-11-09 10:42

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0056_revert_update_reservation_enums"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reservation",
            name="reservee_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("business", "Business"),
                    ("nonprofit", "Nonprofit"),
                    ("individual", "Individual"),
                ],
                help_text="Type of reservee",
                max_length=50,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="reservee_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("business", "Business"),
                    ("nonprofit", "Nonprofit"),
                    ("individual", "Individual"),
                ],
                help_text="Type of reservee",
                max_length=50,
                null=True,
            ),
        ),
    ]
