from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from applications.choices import PriorityChoice
from email_notification.models import EmailType
from email_notification.tasks import send_reservation_email_task, send_staff_reservation_email_task
from reservations.choices import ReservationStateChoice
from users.models import ReservationNotification

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit
    from reservations.models import Reservation

RESERVATION_STATE_EMAIL_TYPE_MAP = {
    ReservationStateChoice.CONFIRMED.value: EmailType.RESERVATION_CONFIRMED,
    ReservationStateChoice.REQUIRES_HANDLING.value: EmailType.HANDLING_REQUIRED_RESERVATION,
    ReservationStateChoice.CANCELLED.value: EmailType.RESERVATION_CANCELLED,
    ReservationStateChoice.DENIED.value: EmailType.RESERVATION_REJECTED,
    "NEEDS_PAYMENT": EmailType.RESERVATION_NEEDS_TO_BE_PAID,
}


class ReservationActions:
    def __init__(self, reservation: Reservation) -> None:
        self.reservation = reservation

    def get_actual_before_buffer(self) -> datetime.timedelta:
        buffer_time_before: datetime.timedelta = self.reservation.buffer_time_before or datetime.timedelta()
        reservation_unit: ReservationUnit
        for reservation_unit in self.reservation.reservation_unit.all():
            before = reservation_unit.actions.get_actual_before_buffer(self.reservation.begin)
            if before > buffer_time_before:
                buffer_time_before = before
        return buffer_time_before

    def get_actual_after_buffer(self) -> datetime.timedelta:
        buffer_time_after: datetime.timedelta = self.reservation.buffer_time_after or datetime.timedelta()
        reservation_unit: ReservationUnit
        for reservation_unit in self.reservation.reservation_unit.all():
            after = reservation_unit.actions.get_actual_after_buffer(self.reservation.end)
            if after > buffer_time_after:
                buffer_time_after = after
        return buffer_time_after

    def get_location_string(self) -> str:
        return ", ".join(
            str(location)
            for reservation_unit in self.reservation.reservation_units.all()
            if (location := reservation_unit.get_location()) is not None
        )

    def get_ical_summary(self) -> str:
        if self.reservation.name:
            return self.reservation.name
        if self.reservation.recurring_reservation is not None:
            return self.reservation.recurring_reservation.application_event_schedule.application_event.name
        return ""

    def get_ical_description(self):
        reservation_units = self.reservation.reservation_units.select_related("unit").all()
        unit_names: str = ", ".join([reservation_unit.unit.name for reservation_unit in reservation_units])
        reservation_unit_names: str = ", ".join([reservation_unit.name for reservation_unit in reservation_units])

        if self.reservation.recurring_reservation is None:
            return f"{self.reservation.description}\n{reservation_unit_names}\n{unit_names}"

        application_event = self.reservation.recurring_reservation.application_event_schedule.application_event
        application = application_event.application
        organisation = application.organisation
        contact_person = application.contact_person

        applicant_name = ""
        if organisation:
            applicant_name = organisation.name
        elif contact_person:
            applicant_name = f"{contact_person.first_name} {contact_person.last_name}"

        return (
            f"{applicant_name}\n"
            f"{application_event.name}\n"
            f"{self.reservation.description}\n"
            f"{reservation_unit_names}\n"
            f"{unit_names}"
        )

    def send_confirmation_email(self) -> None:
        email_type = ReservationStateChoice(self.reservation.state).email_type

        if email_type is not None:
            send_reservation_email_task.delay(self.reservation.id, email_type)

        if self.reservation.state == ReservationStateChoice.REQUIRES_HANDLING:
            send_staff_reservation_email_task.delay(
                self.reservation.id,
                EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
                [ReservationNotification.ALL, ReservationNotification.ONLY_HANDLING_REQUIRED],
            )

        elif self.reservation.state == ReservationStateChoice.CONFIRMED:
            send_staff_reservation_email_task.delay(
                self.reservation.id,
                EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
                [ReservationNotification.ALL],
            )

    def send_cancellation_email(self) -> None:
        email_type = ReservationStateChoice(self.reservation.state).email_type
        if email_type is not None:
            send_reservation_email_task.delay(self.reservation.id, email_type)

    def send_deny_email(self) -> None:
        email_type = ReservationStateChoice(self.reservation.state).email_type
        if email_type is not None:
            send_reservation_email_task.delay(self.reservation.id, email_type)

    def send_approve_email(self) -> None:
        if self.reservation.state == ReservationStateChoice.CONFIRMED:
            send_reservation_email_task.delay(
                self.reservation.id,
                EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
            )
            send_staff_reservation_email_task.delay(
                self.reservation.id,
                EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
                [ReservationNotification.ALL],
            )

    def send_requires_handling_email(self) -> None:
        email_type = ReservationStateChoice(self.reservation.state).email_type
        if self.reservation.state != ReservationStateChoice.REQUIRES_HANDLING and email_type is not None:
            send_reservation_email_task.delay(self.reservation.id, email_type)

        if self.reservation.state == ReservationStateChoice.REQUIRES_HANDLING:
            send_staff_reservation_email_task.delay(
                self.reservation.id,
                EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
                [ReservationNotification.ALL, ReservationNotification.ONLY_HANDLING_REQUIRED],
            )

    def send_reservation_modified_email(self) -> None:
        send_reservation_email_task.delay(self.reservation.id, EmailType.RESERVATION_MODIFIED)

        if self.reservation.state == ReservationStateChoice.REQUIRES_HANDLING:
            send_staff_reservation_email_task.delay(
                self.reservation.id,
                EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
                [ReservationNotification.ALL, ReservationNotification.ONLY_HANDLING_REQUIRED],
            )

    def create_or_update_reservation_statistics(self):
        from reservations.models import ReservationStatistic, ReservationStatisticsReservationUnit

        recurring = getattr(self.reservation, "recurring_reservation", None)
        stat, _ = ReservationStatistic.objects.update_or_create(
            reservation=self.reservation,
            defaults={
                "reservation": self.reservation,
                "reservation_created_at": self.reservation.created_at,
                "reservation_handled_at": self.reservation.handled_at,
                "reservation_confirmed_at": self.reservation.confirmed_at,
                "reservee_type": self.reservation.reservee_type,
                "applying_for_free_of_charge": self.reservation.applying_for_free_of_charge,
                "buffer_time_before": self.reservation.buffer_time_before,
                "buffer_time_after": self.reservation.buffer_time_after,
                "reservee_language": self.reservation.reservee_language,
                "num_persons": self.reservation.num_persons,
                "priority": self.reservation.priority,
                "priority_name": PriorityChoice(self.reservation.priority).name,
                "home_city": self.reservation.home_city,
                "home_city_name": self.reservation.home_city.name if self.reservation.home_city else "",
                "home_city_municipality_code": (
                    self.reservation.home_city.municipality_code if self.reservation.home_city else ""
                ),
                "purpose": self.reservation.purpose,
                "purpose_name": self.reservation.purpose.name if self.reservation.purpose else "",
                "age_group": self.reservation.age_group,
                "age_group_name": str(self.reservation.age_group),
                "is_applied": getattr(recurring, "application_event_schedule", None) is not None,
                "ability_group": getattr(self.reservation.recurring_reservation, "ability_group", None),
                "begin": self.reservation.begin,
                "end": self.reservation.end,
                "duration_minutes": (self.reservation.end - self.reservation.begin).total_seconds() / 60,
                "reservation_type": self.reservation.type,
                "state": self.reservation.state,
                "cancel_reason": self.reservation.cancel_reason,
                "cancel_reason_text": getattr(self.reservation.cancel_reason, "reason", ""),
                "deny_reason": self.reservation.deny_reason,
                "deny_reason_text": getattr(self.reservation.deny_reason, "reason", ""),
                "price": self.reservation.price,
                "price_net": self.reservation.price_net,
                "tax_percentage_value": self.reservation.tax_percentage_value,
                "non_subsidised_price": self.reservation.non_subsidised_price,
                "non_subsidised_price_net": self.reservation.non_subsidised_price_net,
                "is_subsidised": self.reservation.price < self.reservation.non_subsidised_price,
                "is_recurring": recurring is not None,
                "recurrence_begin_date": getattr(recurring, "begin_date", None),
                "recurrence_end_date": getattr(recurring, "end_date", None),
                "recurrence_uuid": getattr(recurring, "uuid", ""),
                "reservee_is_unregistered_association": self.reservation.reservee_is_unregistered_association,
                "reservee_uuid": str(self.reservation.user.tvp_uuid) if self.reservation.user else "",
            },
        )

        for res_unit in self.reservation.reservation_units.all():
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

        stat.reservation_stats_reservation_units.exclude(
            reservation_unit__in=self.reservation.reservation_units.all()
        ).delete()

        res_unit = self.reservation.reservation_units.first()
        if res_unit:
            stat.primary_reservation_unit = res_unit
            stat.primary_reservation_unit_name = res_unit.name
            stat.primary_unit_name = getattr(res_unit.unit, "name", "")
            stat.primary_unit_tprek_id = getattr(res_unit.unit, "tprek_id", "")

        if stat.is_applied and self.reservation.recurring_reservation.ability_group:
            stat.ability_group_name = self.reservation.recurring_reservation.ability_group.name

        stat.save()
