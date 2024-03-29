# Generated by Django 3.0.10 on 2020-11-19 12:03

import django.db.models.deletion
import recurrence.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0002_add_recurring_reservation_fields"),
        ("spaces", "0003_hierarchy_and_type_for_districts"),
        ("applications", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ApplicationEvent",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("num_persons", models.PositiveIntegerField(blank=True, null=True, verbose_name="Number of persons")),
                ("num_events", models.PositiveIntegerField(verbose_name="Number of events")),
                ("duration", models.DurationField(verbose_name="Duration")),
                (
                    "ability_group",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="reservations.AbilityGroup",
                        verbose_name="Ability group",
                    ),
                ),
                (
                    "age_group",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="reservations.AgeGroup",
                        verbose_name="Age group",
                    ),
                ),
                (
                    "application",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="application_events",
                        to="applications.Application",
                        verbose_name="Application",
                    ),
                ),
                (
                    "district",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="spaces.District",
                        verbose_name="Area",
                    ),
                ),
            ],
            options={
                "db_table": "application_event",
            },
        ),
        migrations.CreateModel(
            name="Recurrence",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("recurrence", recurrence.fields.RecurrenceField()),
                ("priority", models.IntegerField(choices=[(100, "Low"), (200, "Medium"), (300, "High")], default=200)),
                (
                    "application_event",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recurrences",
                        to="applications.ApplicationEvent",
                    ),
                ),
            ],
            options={
                "db_table": "recurrence",
            },
        ),
    ]
