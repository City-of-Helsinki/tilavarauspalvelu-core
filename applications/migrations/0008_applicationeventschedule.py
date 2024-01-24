# Generated by Django 3.0.10 on 2020-12-18 09:56

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0007_remove_applicationevent_num_events"),
    ]

    operations = [
        migrations.CreateModel(
            name="ApplicationEventSchedule",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "day",
                    models.IntegerField(
                        choices=[
                            (0, "Monday"),
                            (1, "Tuesday"),
                            (2, "Wednesday"),
                            (3, "Thursday"),
                            (4, "Friday"),
                            (5, "Saturday"),
                            (6, "Sunday"),
                        ],
                        verbose_name="Day",
                    ),
                ),
                ("begin", models.TimeField(verbose_name="Start")),
                ("end", models.TimeField(verbose_name="End")),
                ("priority", models.IntegerField(choices=[(100, "Low"), (200, "Medium"), (300, "High")], default=200)),
                (
                    "application_event",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="application_event_schedules",
                        to="applications.ApplicationEvent",
                    ),
                ),
            ],
            options={
                "db_table": "application_event_schedule",
            },
        ),
    ]
