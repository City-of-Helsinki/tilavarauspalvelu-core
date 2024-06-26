# Generated by Django 5.0.4 on 2024-05-23 05:32

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reservation_units", "0099_alter_equipment_options_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reservationunitimage",
            name="image_type",
            field=models.CharField(
                choices=[("main", "Main image"), ("ground_plan", "Ground plan"), ("map", "Map"), ("other", "Other")],
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="reservationunitimage",
            name="reservation_unit",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="images",
                to="reservation_units.reservationunit",
            ),
        ),
    ]
