from applications.models import PRIORITIES
from reservations.models import (
    Reservation,
    ReservationStatistic,
    ReservationStatisticsReservationUnit,
)


def create_or_update_reservation_statistics(reservation_pk: Reservation):
    reservation = Reservation.objects.get(pk=reservation_pk)
    recurring = getattr(reservation, "recurring_reservation", None)
    stat, _ = ReservationStatistic.objects.update_or_create(
        reservation=reservation,
        defaults={
            "reservation": reservation,
            "reservation_created_at": reservation.created_at,
            "reservation_handled_at": reservation.handled_at,
            "reservation_confirmed_at": reservation.confirmed_at,
            "reservee_type": reservation.reservee_type,
            "applying_for_free_of_charge": reservation.applying_for_free_of_charge,
            "buffer_time_before": reservation.buffer_time_before,
            "buffer_time_after": reservation.buffer_time_after,
            "reservee_language": reservation.reservee_language,
            "num_persons": reservation.num_persons,
            "priority": reservation.priority,
            "priority_name": PRIORITIES.get_priority_name_from_constant(reservation.priority),
            "home_city": reservation.home_city,
            "home_city_name": reservation.home_city.name if reservation.home_city else "",
            "home_city_municipality_code": reservation.home_city.municipality_code if reservation.home_city else "",
            "purpose": reservation.purpose,
            "purpose_name": reservation.purpose.name if reservation.purpose else "",
            "age_group": reservation.age_group,
            "age_group_name": str(reservation.age_group),
            "is_applied": getattr(recurring, "application", None) is not None,
            "ability_group": getattr(reservation.recurring_reservation, "ability_group", None),
            "begin": reservation.begin,
            "end": reservation.end,
            "duration_minutes": (reservation.end - reservation.begin).total_seconds() / 60,
            "reservation_type": reservation.type,
            "state": reservation.state,
            "cancel_reason": reservation.cancel_reason,
            "cancel_reason_text": getattr(reservation.cancel_reason, "reason", ""),
            "deny_reason": reservation.deny_reason,
            "deny_reason_text": getattr(reservation.deny_reason, "reason", ""),
            "price": reservation.price,
            "price_net": reservation.price_net,
            "tax_percentage_value": reservation.tax_percentage_value,
            "non_subsidised_price": reservation.non_subsidised_price,
            "non_subsidised_price_net": reservation.non_subsidised_price_net,
            "is_subsidised": reservation.price < reservation.non_subsidised_price,
            "is_recurring": recurring is not None,
            "recurrence_begin_date": getattr(recurring, "begin_date", None),
            "recurrence_end_date": getattr(recurring, "end_date", None),
            "recurrence_uuid": getattr(recurring, "uuid", ""),
            "reservee_is_unregistered_association": reservation.reservee_is_unregistered_association,
            "reservee_uuid": str(reservation.user.tvp_uuid) if reservation.user else "",
        },
    )

    for res_unit in reservation.reservation_unit.all():
        ReservationStatisticsReservationUnit.objects.get_or_create(
            reservation_statistics=stat,
            reservation_unit=res_unit,
            defaults={
                "reservation_statistics": stat,
                "reservation_unit": res_unit,
                "unit_tprek_id": getattr(res_unit.unit, "tprek_id", ""),
                "name": res_unit.name,
                "unit_name": getattr(res_unit.unit, "name", ""),
            },
        )

    stat.reservation_stats_reservation_units.exclude(reservation_unit__in=reservation.reservation_unit.all()).delete()

    res_unit = reservation.reservation_unit.first()
    if res_unit:
        stat.primary_reservation_unit = res_unit
        stat.primary_reservation_unit_name = res_unit.name
        stat.primary_unit_name = getattr(res_unit.unit, "name", "")
        stat.primary_unit_tprek_id = getattr(res_unit.unit, "tprek_id", "")

    if stat.is_applied and reservation.recurring_reservation.ability_group:
        stat.ability_group_name = reservation.recurring_reservation.ability_group.name

    stat.save()
