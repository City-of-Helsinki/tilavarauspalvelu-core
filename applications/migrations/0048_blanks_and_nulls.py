# Generated by Django 3.1.9 on 2021-06-08 10:57

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reservation_units", "0014_reservationunit_contact_information"),
        ("applications", "0047_applicationevent_uuid"),
    ]

    operations = [
        migrations.AlterField(
            model_name="applicationevent",
            name="declined_reservation_units",
            field=models.ManyToManyField(
                blank=True, to="reservation_units.ReservationUnit", verbose_name="Declined reservation units"
            ),
        ),
        migrations.AlterField(
            model_name="organisation",
            name="active_members",
            field=models.PositiveIntegerField(null=True, verbose_name="Active members"),
        ),
        migrations.AlterField(
            model_name="organisation",
            name="address",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to="applications.Address"),
        ),
        migrations.AlterField(
            model_name="organisation",
            name="email",
            field=models.EmailField(default="", max_length=254, verbose_name="Email"),
        ),
        migrations.AlterField(
            model_name="person",
            name="first_name",
            field=models.TextField(max_length=50, verbose_name="First name"),
        ),
        migrations.AlterField(
            model_name="person",
            name="last_name",
            field=models.TextField(max_length=50, verbose_name="Last name"),
        ),
    ]
