from __future__ import annotations

from typing import TYPE_CHECKING

from tilavarauspalvelu.models import RecurringReservation, Reservation

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.models import ApplicationSection
    from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet


class ApplicationSectionActions:
    def __init__(self, application_section: ApplicationSection) -> None:
        self.application_section = application_section

    def get_reservation_series(self) -> QuerySet[RecurringReservation]:
        return (
            RecurringReservation.objects.filter(
                allocated_time_slot__reservation_unit_option__application_section=self.application_section
            )
            .prefetch_related("reservations")
            .order_by("begin_date")
        )

    def get_reservations(self) -> ReservationQuerySet:
        return Reservation.objects.filter(
            user=self.application_section.application.user,
            recurring_reservation__allocated_time_slot__reservation_unit_option__application_section=(
                self.application_section
            ),
        )

    def get_last_reservation(self) -> Reservation | None:
        return self.get_reservations().last()
