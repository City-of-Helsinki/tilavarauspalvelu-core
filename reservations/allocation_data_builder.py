import datetime
from typing import Dict, List

from django.utils import timezone

from applications.models import ApplicationRound
from reservation_units.models import ReservationUnit
from reservations.allocation_models import (
    AllocationBasket,
    AllocationData,
    AllocationEvent,
    AllocationSpace,
)


class AllocationDataBuilder(object):
    def __init__(
        self, application_round: ApplicationRound, included_baskets: [int] = []
    ):
        self.period_start: datetime.date = application_round.reservation_period_begin
        self.period_end: datetime.date = application_round.reservation_period_end
        self.application_round = application_round
        self.included_baskets = included_baskets
        self.baskets = {}

    def get_allocation_data(self):
        spaces: dict[int, AllocationSpace] = {}
        for unit in self.application_round.reservation_units.all():
            space = self.get_space(unit=unit)
            spaces[space.id] = space
        allocation_events = []
        event_baskets = self.get_event_baskets()

        for application in self.application_round.applications.all():
            for application_event in application.application_events.all():
                space_ids = list(
                    map(
                        lambda x: x.reservation_unit.id,
                        application_event.event_reservation_units.all(),
                    )
                )
                allocation_events.append(
                    AllocationEvent(
                        id=application_event.id,
                        occurrences=application_event.get_all_occurrences(),
                        period_start=self.period_start,
                        period_end=self.period_end,
                        baskets=event_baskets.get(application_event.id),
                        space_ids=space_ids,
                        begin=application_event.begin,
                        end=application_event.end,
                        min_duration=application_event.min_duration,
                        max_duration=application_event.max_duration
                        if application_event.max_duration is not None
                        else application_event.min_duration,
                        events_per_week=application_event.events_per_week,
                        num_persons=application_event.num_persons,
                    )
                )

        return AllocationData(
            period_start=self.period_start,
            period_end=self.period_end,
            spaces=spaces,
            events=allocation_events,
            baskets=self.baskets,
        )

    def get_all_dates(self):
        dates = []
        start = self.period_start
        delta = datetime.timedelta(days=1)
        while start <= self.period_end:
            dates.append(start)
            start += delta
        return dates

    def get_space(self, unit: ReservationUnit):
        all_dates = self.get_all_dates()
        space = AllocationSpace(
            unit=unit,
            period_start=self.period_start,
            period_end=self.period_end,
            times=[],
        )
        # TODO: This is hardcoded for now so we can go ahead with this
        # replace with dates from models when it's implemented
        for the_date in all_dates:
            space.add_time(
                start=datetime.datetime(
                    the_date.year,
                    the_date.month,
                    the_date.day,
                    hour=10,
                    tzinfo=timezone.get_default_timezone(),
                ),
                end=datetime.datetime(
                    the_date.year,
                    the_date.month,
                    the_date.day,
                    hour=22,
                    tzinfo=timezone.get_default_timezone(),
                ),
            )
        return space

    def get_event_baskets(self) -> Dict[int, List[int]]:
        event_baskets = {}
        for (
            basket_id,
            application_events,
        ) in self.application_round.get_application_events_by_basket(
            self.included_baskets
        ).items():
            basket = next(
                basket
                for basket in self.application_round.application_round_baskets.filter(
                    pk=basket_id
                )
                if basket.id == basket_id
            )
            allocation_basket = AllocationBasket(
                id=basket.id,
                allocation_percentage=basket.allocation_percentage,
                order_number=basket.order_number,
            )

            self.baskets[basket_id] = allocation_basket
            for application_event in application_events:
                if event_baskets.get(application_event.id):
                    event_baskets[application_event.id].append(basket_id)
                else:
                    event_baskets[application_event.id] = [basket_id]
        return event_baskets
