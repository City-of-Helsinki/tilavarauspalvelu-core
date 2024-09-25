
from django.db import migrations, models


def fix_reservation_price_net(apps, schema_editor):
    Reservation = apps.get_model("reservations", "Reservation")
    Reservation.objects.filter(
        handled_at__isnull=False,
        tax_percentage_value__gt=0,
        price__gt=0,
    ).update(price_net=models.F("price") / ((100 + models.F("tax_percentage_value")) / 100))

    ReservationStatistic = apps.get_model("reservations", "ReservationStatistic")
    ReservationStatistic.objects.filter(
        reservation_handled_at__isnull=False,
        tax_percentage_value__gt=0,
        price__gt=0,
    ).update(price_net=models.F("price") / ((100 + models.F("tax_percentage_value")) / 100))


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0078_alter_reservationdenyreason_options_and_more"),
    ]

    operations = [
        migrations.RunPython(
            code=fix_reservation_price_net,
            reverse_code=migrations.RunPython.noop,
        )
    ]
