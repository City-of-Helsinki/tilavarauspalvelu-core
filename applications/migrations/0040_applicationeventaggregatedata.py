# Generated by Django 3.1.7 on 2021-05-06 06:55

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0039_applicationeventscheduleresult_declined"),
    ]

    operations = [
        migrations.CreateModel(
            name="ApplicationEventAggregateData",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, verbose_name="Name")),
                ("value", models.FloatField(max_length=255, verbose_name="Value")),
                (
                    "application_event",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="aggregated_data",
                        to="applications.ApplicationEvent",
                    ),
                ),
            ],
            options={
                "db_table": "application_event_aggregate_data",
            },
        ),
    ]
