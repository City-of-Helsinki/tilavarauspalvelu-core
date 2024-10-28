# Generated by Django 5.0.8 on 2024-09-02 12:44

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0025_remove_duplicate_date_pricings"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="reservationunitpricing",
            constraint=models.UniqueConstraint(
                fields=("reservation_unit", "begins"),
                name="reservation_unit_begin_date_unique_together",
                violation_error_message="Pricing for this reservation unit already exists for this date.",
            ),
        ),
    ]