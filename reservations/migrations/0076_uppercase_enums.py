from django.db import migrations, models
from django.db.models import F
from django.db.models.functions import Lower, Upper


def uppercase_enums(apps, schema_editor):
    Reservation = apps.get_model("reservations", "Reservation")
    ReservationStatistic = apps.get_model("reservations", "ReservationStatistic")

    Reservation.objects.all().update(
        state=Upper(F("state")),
        type=Upper(F("type")),
        reservee_type=Upper(F("reservee_type")),
    )
    ReservationStatistic.objects.all().update(
        reservee_type=Upper(F("reservee_type")),
    )


def lowercase_enums(apps, schema_editor):
    Reservation = apps.get_model("reservations", "Reservation")
    ReservationStatistic = apps.get_model("reservations", "ReservationStatistic")

    Reservation.objects.all().update(
        state=Lower(F("state")),
        type=Lower(F("type")),
        reservee_type=Lower(F("reservee_type")),
    )
    ReservationStatistic.objects.all().update(
        reservee_type=Lower(F("reservee_type")),
    )


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0075_reservationstatistic_reservee_address_zip_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reservation",
            name="reservee_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("BUSINESS", "Business"),
                    ("NONPROFIT", "Nonprofit"),
                    ("INDIVIDUAL", "Individual"),
                ],
                max_length=50,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="reservation",
            name="state",
            field=models.CharField(
                choices=[
                    ("CREATED", "Created"),
                    ("CANCELLED", "Cancelled"),
                    ("REQUIRES_HANDLING", "Requires handling"),
                    ("WAITING_FOR_PAYMENT", "Waiting for payment"),
                    ("CONFIRMED", "Confirmed"),
                    ("DENIED", "Denied"),
                ],
                db_index=True,
                default="CREATED",
                max_length=32,
            ),
        ),
        migrations.AlterField(
            model_name="reservation",
            name="type",
            field=models.CharField(
                choices=[
                    ("NORMAL", "Normal"),
                    ("BLOCKED", "Blocked"),
                    ("STAFF", "Staff"),
                    ("BEHALF", "Behalf"),
                    ("SEASONAL", "Seasonal"),
                ],
                default="NORMAL",
                max_length=50,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="reservationstatistic",
            name="reservee_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("BUSINESS", "Business"),
                    ("NONPROFIT", "Nonprofit"),
                    ("INDIVIDUAL", "Individual"),
                ],
                help_text="Type of reservee",
                max_length=50,
                null=True,
            ),
        ),
        migrations.RunPython(code=uppercase_enums, reverse_code=lowercase_enums),
    ]
