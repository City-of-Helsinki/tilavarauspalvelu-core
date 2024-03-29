# Generated by Django 4.2.7 on 2023-11-08 12:56

import django.db.models.constraints
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0076_fix_preferred_order"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="eventreservationunit",
            constraint=models.UniqueConstraint(
                deferrable=django.db.models.constraints.Deferrable["DEFERRED"],
                fields=("application_event", "preferred_order"),
                name="unique_application_event_preferred_order",
            ),
        ),
    ]
