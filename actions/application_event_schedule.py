import datetime
from dataclasses import dataclass
from typing import TYPE_CHECKING

import recurrence
from django.utils.timezone import get_default_timezone

from applications.models import Address, Organisation, Person
from opening_hours.hours import can_reserve_based_on_opening_hours, get_opening_hours
from reservations.choices import ReservationStateChoice
from reservations.models import RecurringReservation, Reservation
from tilavarauspalvelu.utils.date_util import next_or_current_matching_weekday, previous_or_current_matching_weekday

if TYPE_CHECKING:
    from applications.models import ApplicationEventSchedule


@dataclass
class EventOccurrence:
    weekday: int
    begin: datetime.time
    end: datetime.time
    occurrences: list[datetime.datetime]


class ApplicationEventScheduleActions:
    def __init__(self, application_event_schedule: "ApplicationEventSchedule") -> None:
        self.schedule = application_event_schedule

    def create_reservation_for_schedule(self):
        application_event = self.schedule.application_event
        application = application_event.application
        organisation: Organisation | None = application.organisation
        reservee: Person | None = application.contact_person
        address: Address | None = organisation.address if organisation is not None else None
        billing_address: Address | None = application.billing_address

        interval = 14 if application_event.biweekly else 7
        reservation_date = next_or_current_matching_weekday(application_event.begin, self.schedule.allocated_day)

        unit_uuid = str(self.schedule.allocated_reservation_unit.uuid)
        opening_hours = get_opening_hours(
            resource_id=unit_uuid,
            start_date=reservation_date,
            end_date=application_event.end,
        )

        recurring_reservation = self.create_recurring_reservation_for_schedule()

        while reservation_date < application_event.end:
            reservations_start = datetime.datetime.combine(reservation_date, self.schedule.allocated_begin).astimezone(
                get_default_timezone(),
            )
            reservations_end = datetime.datetime.combine(reservation_date, self.schedule.allocated_end).astimezone(
                get_default_timezone(),
            )

            is_overlapping = self.schedule.allocated_reservation_unit.check_reservation_overlap(
                reservations_start,
                reservations_end,
            )

            valid_reservation = can_reserve_based_on_opening_hours(
                opening_hours=opening_hours,
                reservations_start=reservations_start,
                reservations_end=reservations_end,
            )

            reservation = Reservation.objects.create(
                name=application_event.name,
                num_persons=application_event.num_persons,
                priority=self.schedule.priority,
                begin=reservations_start,
                end=reservations_end,
                state=(
                    ReservationStateChoice.DENIED
                    if is_overlapping or not valid_reservation
                    else ReservationStateChoice.CONFIRMED
                ),
                user=application_event.application.user,
                recurring_reservation=recurring_reservation,
                purpose=application_event.purpose,
                age_group=application_event.age_group,
                home_city=application.home_city,
                working_memo=application.working_memo,
                # Person details
                reservee_first_name=getattr(reservee, "first_name", ""),
                reservee_last_name=getattr(reservee, "last_name", ""),
                reservee_email=getattr(reservee, "email", ""),
                reservee_phone=getattr(reservee, "phone_number", ""),
                # Organisation details
                reservee_id=getattr(organisation, "identifier", ""),
                reservee_organisation_name=getattr(organisation, "name", ""),
                reservee_address_zip=getattr(address, "post_code", ""),
                reservee_address_street=getattr(address, "street_address", ""),
                reservee_address_city=getattr(address, "city", ""),
                # Billing details
                billing_address_street=getattr(billing_address, "street_address", ""),
                billing_address_city=getattr(billing_address, "city", ""),
                billing_address_zip=getattr(billing_address, "post_code", ""),
            )
            reservation.reservation_unit.add(self.schedule.allocated_reservation_unit)

            reservation_date += datetime.timedelta(days=interval)

    def create_recurring_reservation_for_schedule(self) -> RecurringReservation:
        return RecurringReservation.objects.create(
            user=self.schedule.application_event.application.user,
            application_event_schedule=self.schedule,
            age_group=self.schedule.application_event.age_group,
            ability_group=self.schedule.application_event.ability_group,
            reservation_unit=self.schedule.allocated_reservation_unit,
        )

    @staticmethod
    def get_event_occurrences(
        weekday: int,
        begin: datetime.time,
        end: datetime.time,
        event_period_begin: datetime.date,
        event_period_end: datetime.date,
        biweekly: bool,
    ) -> EventOccurrence:
        """
        Create a weekly (or biweekly) date-times inside the given event period.
        Times are generated on weekdays, starting from the first weekday in the period,
        and ending on the last weekday in the period.
        """
        start_date = next_or_current_matching_weekday(event_period_begin, weekday)
        end_date = previous_or_current_matching_weekday(event_period_end, weekday)
        pattern = recurrence.Recurrence(
            dtstart=datetime.datetime(
                year=start_date.year,
                month=start_date.month,
                day=start_date.day,
                hour=begin.hour,
                minute=begin.minute,
                second=0,
                tzinfo=get_default_timezone(),
            ),
            rrules=[
                recurrence.Rule(
                    recurrence.WEEKLY,
                    interval=1 if not biweekly else 2,
                    byday=weekday,
                    until=datetime.datetime(
                        year=end_date.year,
                        month=end_date.month,
                        day=end_date.day,
                        hour=end.hour,
                        minute=end.minute,
                        second=0,
                        tzinfo=get_default_timezone(),
                    ),
                ),
            ],
        )
        return EventOccurrence(
            weekday=weekday,
            begin=begin,
            end=end,
            occurrences=list(pattern.occurrences()),
        )
