# Generated by Django 4.2.9 on 2024-01-23 07:12

from django.db import migrations

from utils.migration import AlterModelTable


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0059_add_base_manager_name_to_all_models"),
    ]

    operations = [
        AlterModelTable(
            name="abilitygroup",
            table="ability_group",
        ),
        AlterModelTable(
            name="agegroup",
            table="age_group",
        ),
        AlterModelTable(
            name="recurringreservation",
            table="recurring_reservation",
        ),
        AlterModelTable(
            name="reservation",
            table="reservation",
        ),
        AlterModelTable(
            name="reservationcancelreason",
            table="reservation_cancel_reason",
        ),
        AlterModelTable(
            name="reservationdenyreason",
            table="reservation_deny_reason",
        ),
        AlterModelTable(
            name="reservationmetadatafield",
            table="reservation_metadata_field",
        ),
        AlterModelTable(
            name="reservationmetadataset",
            table="reservation_metadata_set",
        ),
        AlterModelTable(
            name="reservationpurpose",
            table="reservation_purpose",
        ),
        AlterModelTable(
            name="reservationstatistic",
            table="reservation_statistic",
        ),
        AlterModelTable(
            name="reservationstatisticsreservationunit",
            table="reservation_statistics_reservation_unit",
        ),
    ]
