# Generated by Django 3.0.10 on 2020-11-18 09:12

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("reservations", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Address",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("street_address", models.TextField(max_length=80, verbose_name="Street address")),
                ("post_code", models.PositiveIntegerField(verbose_name="Post code")),
                ("city", models.TextField(max_length=80, verbose_name="City")),
            ],
            options={
                "db_table": "address",
            },
        ),
        migrations.CreateModel(
            name="Person",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(blank=True, max_length=254, null=True, verbose_name="Email")),
                ("phone_number", models.TextField(blank=True, max_length=50, null=True, verbose_name="Phone number")),
                ("first_name", models.TextField(max_length=50, verbose_name="First name")),
                ("last_name", models.TextField(max_length=50, verbose_name="Last name")),
            ],
            options={
                "abstract": False,
                "db_table": "person",
            },
        ),
        migrations.CreateModel(
            name="Organisation",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField(max_length=255, verbose_name="Name")),
                ("identifier", models.TextField(max_length=255, unique=True, verbose_name="Organisation identifier")),
                (
                    "address",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="applications.Address"
                    ),
                ),
            ],
            options={
                "db_table": "organisation",
            },
        ),
        migrations.CreateModel(
            name="Application",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("description", models.TextField(blank=True, max_length=1000, null=True, verbose_name="Description")),
                (
                    "contact_person",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="applications.Person",
                        verbose_name="Contact person",
                    ),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="applications.Organisation",
                        verbose_name="Organisation",
                    ),
                ),
                (
                    "reservation_purpose",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="reservations.ReservationPurpose",
                        verbose_name="Purpose",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Applicant",
                    ),
                ),
            ],
            options={
                "db_table": "application",
            },
        ),
    ]
