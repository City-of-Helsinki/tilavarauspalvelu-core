# Generated by Django 4.2.9 on 2024-01-31 09:00

import datetime

from django.db import migrations


def update_null_buffers_to_zero(apps, schema_editor):
    ReservationUnit = apps.get_model("reservation_units", "ReservationUnit")
    ReservationUnit.objects.filter(buffer_time_before=None).update(buffer_time_before=datetime.timedelta())
    ReservationUnit.objects.filter(buffer_time_after=None).update(buffer_time_after=datetime.timedelta())


def update_zero_buffers_to_null(apps, schema_editor):
    ReservationUnit = apps.get_model("reservation_units", "ReservationUnit")
    ReservationUnit.objects.filter(buffer_time_before=datetime.timedelta()).update(buffer_time_before=None)
    ReservationUnit.objects.filter(buffer_time_after=datetime.timedelta()).update(buffer_time_after=None)


class Migration(migrations.Migration):
    dependencies = [
        ("reservation_units", "0093_change_database_table_names"),
    ]

    operations = [
        migrations.RunPython(update_null_buffers_to_zero, update_zero_buffers_to_null),
    ]
