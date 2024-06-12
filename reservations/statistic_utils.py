from reservations.enums import CustomerTypeChoice
from reservations.models import Reservation, ReservationStatistic, ReservationStatisticsReservationUnit


def create_or_update_reservation_statistics(reservation_pk: Reservation) -> None:
    reservation = Reservation.objects.get(pk=reservation_pk)
    recurring = getattr(reservation, "recurring_reservation", None)
    requires_org_name = reservation.reservee_type != CustomerTypeChoice.INDIVIDUAL
    requires_org_id = not reservation.reservee_is_unregistered_association and requires_org_name

    by_profile_user = bool(getattr(reservation.user, "profile_id", ""))

    stat, _ = ReservationStatistic.objects.update_or_create(
        reservation=reservation,
        defaults={
            "ability_group": getattr(recurring, "ability_group", None),
            "age_group": reservation.age_group,
            "age_group_name": str(reservation.age_group),
            "applying_for_free_of_charge": reservation.applying_for_free_of_charge,
            "begin": reservation.begin,
            "buffer_time_after": reservation.buffer_time_after,
            "buffer_time_before": reservation.buffer_time_before,
            "cancel_reason": reservation.cancel_reason,
            "cancel_reason_text": getattr(reservation.cancel_reason, "reason", ""),
            "deny_reason": reservation.deny_reason,
            "deny_reason_text": getattr(reservation.deny_reason, "reason", ""),
            "duration_minutes": (reservation.end - reservation.begin).total_seconds() / 60,
            "end": reservation.end,
            "home_city": reservation.home_city,
            "home_city_municipality_code": reservation.home_city.municipality_code if reservation.home_city else "",
            "home_city_name": reservation.home_city.name if reservation.home_city else "",
            "is_applied": getattr(recurring, "allocated_time_slot", None) is not None,
            "is_recurring": recurring is not None,
            "is_subsidised": reservation.price < reservation.non_subsidised_price,
            "non_subsidised_price": reservation.non_subsidised_price,
            "non_subsidised_price_net": reservation.non_subsidised_price_net,
            "num_persons": reservation.num_persons,
            "price": reservation.price,
            "price_net": reservation.price_net,
            "purpose": reservation.purpose,
            "purpose_name": reservation.purpose.name if reservation.purpose else "",
            "recurrence_begin_date": getattr(recurring, "begin_date", None),
            "recurrence_end_date": getattr(recurring, "end_date", None),
            "recurrence_uuid": getattr(recurring, "uuid", ""),
            "reservation": reservation,
            "reservation_confirmed_at": reservation.confirmed_at,
            "reservation_created_at": reservation.created_at,
            "reservation_handled_at": reservation.handled_at,
            "reservation_type": reservation.type,
            "reservee_address_zip": reservation.reservee_address_zip if by_profile_user else "",
            "reservee_id": reservation.reservee_id if requires_org_id else "",
            "reservee_is_unregistered_association": reservation.reservee_is_unregistered_association,
            "reservee_language": reservation.reservee_language,
            "reservee_organisation_name": reservation.reservee_organisation_name if requires_org_name else "",
            "reservee_type": reservation.reservee_type,
            "reservee_uuid": str(reservation.user.tvp_uuid) if reservation.user else "",
            "state": reservation.state,
            "tax_percentage_value": reservation.tax_percentage_value,
        },
    )

    for res_unit in reservation.reservation_unit.all():
        ReservationStatisticsReservationUnit.objects.get_or_create(
            reservation_statistics=stat,
            reservation_unit=res_unit,
            defaults={
                "name": res_unit.name,
                "reservation_statistics": stat,
                "reservation_unit": res_unit,
                "unit_name": getattr(res_unit.unit, "name", ""),
                "unit_tprek_id": getattr(res_unit.unit, "tprek_id", ""),
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
