# Generated by Django 4.2.6 on 2023-10-20 12:16

from django.db import migrations


def convert_enums_to_upper_case(apps, schema_editor):
    Reservation = apps.get_model("reservations", "Reservation")
    for reservation in Reservation.objects.all():
        if reservation.reservee_type is not None:
            reservation.reservee_type = reservation.reservee_type.upper()
            reservation.save()


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0054_remove_recurringreservation_application_and_more"),
    ]

    operations = [
        migrations.RunPython(convert_enums_to_upper_case, migrations.RunPython.noop),
    ]
