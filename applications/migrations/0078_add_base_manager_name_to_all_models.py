# Generated by Django 4.2.9 on 2024-01-23 07:12

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        (
            "applications",
            "0077_eventreservationunit_unique_application_event_preferred_order",
        ),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="address",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelOptions(
            name="applicationroundtimeslot",
            options={
                "base_manager_name": "objects",
                "ordering": ["reservation_unit", "weekday"],
            },
        ),
        migrations.AlterModelOptions(
            name="city",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelOptions(
            name="eventreservationunit",
            options={"base_manager_name": "objects", "ordering": ["preferred_order"]},
        ),
        migrations.AlterModelOptions(
            name="organisation",
            options={"base_manager_name": "objects"},
        ),
        migrations.AlterModelOptions(
            name="person",
            options={"base_manager_name": "objects"},
        ),
    ]
