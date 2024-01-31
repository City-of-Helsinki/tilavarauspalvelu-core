from django.db import migrations


def update_reservations(apps, schema_editor):
    Reservation = apps.get_model("reservations", "Reservation")
    for reservation in Reservation.objects.all():
        if reservation.reservee_type is not None:
            reservation.reservee_type = reservation.reservee_type.upper()
        if reservation.type is not None:
            reservation.type = reservation.type.upper()

        # convert previous "" choices to Nones
        reservation.reservee_language = reservation.reservee_language or None
        reservation.state = reservation.state.upper()
        # convert previous Nones to empty strings
        reservation.working_memo = reservation.working_memo or ""
        # convert previous Nones to empty strings
        reservation.free_of_charge_reason = reservation.free_of_charge_reason or ""
        reservation.save()

    ReservationStatistic = apps.get_model("reservations", "ReservationStatistic")
    for reservation_statistic in ReservationStatistic.objects.all():
        if reservation_statistic.reservee_type is not None:
            reservation_statistic.reservee_type = reservation_statistic.reservee_type.upper()
        if reservation_statistic.reservation_type is not None:
            reservation_statistic.reservation_type = reservation_statistic.reservation_type.upper()

        # convert previous "" choices to Nones
        reservation_statistic.reservee_language = reservation_statistic.reservee_language or None
        reservation_statistic.state = reservation_statistic.state.upper()
        reservation_statistic.save()


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0063_alter_recurringreservation_options_and_more"),
    ]

    operations = [migrations.RunPython(update_reservations, migrations.RunPython.noop)]
