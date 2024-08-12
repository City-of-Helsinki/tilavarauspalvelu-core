# Generated by Django 5.0.6 on 2024-06-12 10:15

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0074_alter_reservationstatistic_ability_group_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="reservationstatistic",
            name="reservee_address_zip",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="reservationstatistic",
            name="reservee_id",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="reservationstatistic",
            name="reservee_organisation_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]