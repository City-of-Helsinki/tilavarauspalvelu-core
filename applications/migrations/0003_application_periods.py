# Generated by Django 3.0.10 on 2020-11-20 05:34

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reservation_units", "0001_initial"),
        ("applications", "0002_applicationevent_recurrence"),
    ]

    operations = [
        migrations.CreateModel(
            name="ApplicationPeriod",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, verbose_name="Name")),
                ("application_period_begin", models.DateField(verbose_name="Application period begin")),
                ("application_period_end", models.DateField(verbose_name="Application period end")),
                ("reservation_period_begin", models.DateField(verbose_name="Reservation period begin")),
                ("reservation_period_end", models.DateField(verbose_name="Reservation period end")),
                (
                    "purposes",
                    models.ManyToManyField(
                        blank=True,
                        related_name="application_periods",
                        to="reservation_units.Purpose",
                        verbose_name="Purposes",
                    ),
                ),
                (
                    "reservation_units",
                    models.ManyToManyField(
                        related_name="application_periods",
                        to="reservation_units.ReservationUnit",
                        verbose_name="Reservation units",
                    ),
                ),
            ],
            options={
                "db_table": "application_period",
            },
        ),
        migrations.AddField(
            model_name="application",
            name="application_period",
            field=models.ForeignKey(
                default=0,
                on_delete=django.db.models.deletion.PROTECT,
                to="applications.ApplicationPeriod",
                verbose_name="Applicantion period",
            ),
            preserve_default=False,
        ),
    ]
