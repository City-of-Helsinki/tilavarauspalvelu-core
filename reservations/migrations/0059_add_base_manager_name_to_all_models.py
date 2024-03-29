# Generated by Django 4.2.9 on 2024-01-23 07:12

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0058_alter_reservation_user"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="abilitygroup",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelOptions(
            name="agegroup",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelOptions(
            name="reservationcancelreason",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelOptions(
            name="reservationdenyreason",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelOptions(
            name="reservationmetadatafield",
            options={
                "base_manager_name": "objects",
                "verbose_name": "Reservation metadata field",
                "verbose_name_plural": "Reservation metadata fields",
            },
        ),
        migrations.AlterModelOptions(
            name="reservationmetadataset",
            options={
                "base_manager_name": "objects",
                "verbose_name": "Reservation metadata set",
                "verbose_name_plural": "Reservation metadata sets",
            },
        ),
        migrations.AlterModelOptions(
            name="reservationpurpose",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelOptions(
            name="reservationstatistic",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelOptions(
            name="reservationstatisticsreservationunit",
            options={"base_manager_name": "objects"},
        ),
    ]
