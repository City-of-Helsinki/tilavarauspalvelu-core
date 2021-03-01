import datetime
from itertools import chain
from typing import Dict, List

from django.utils import timezone

from applications.models import ApplicationEvent, ApplicationRound
from reservation_units.models import ReservationUnit
from reservations.allocation_models import (
    AllocationBasket,
    AllocationData,
    AllocationEvent,
    AllocationSpace,
)


class AllocationDataBuilder(object):
    def __init__(
        self, application_round: ApplicationRound, output_basket_ids: [int] = []
    ):
        self.period_start: datetime.date = application_round.reservation_period_begin
        self.period_end: datetime.date = application_round.reservation_period_end
        self.application_round = application_round
        self.output_basket_ids = output_basket_ids
        self.baskets = {}

    def get_allocation_data(self):
        spaces: dict[int, AllocationSpace] = {}
        for unit in self.application_round.reservation_units.all():
            space = self.get_space(unit=unit)
            spaces[space.id] = space

        self.get_event_baskets()

        return AllocationData(
            period_start=self.period_start,
            period_end=self.period_end,
            spaces=spaces,
            baskets=self.baskets,
            output_basket_ids=self.output_basket_ids,
        )

    def get_allocation_events(
        self, application_events: [ApplicationEvent]
    ) -> [AllocationEvent]:
        events = []
        for application_event in application_events:
            space_ids = list(
                map(
                    lambda x: x.reservation_unit.id,
                    application_event.event_reservation_units.all(),
                )
            )
            events.append(
                AllocationEvent(
                    id=application_event.id,
                    occurrences=application_event.get_all_occurrences(),
                    period_start=self.period_start,
                    period_end=self.period_end,
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
        return events

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
        ) in self.application_round.get_application_events_by_basket().items():
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
                events=self.get_allocation_events(application_events),
                score=basket.get_score(),
            )

            self.baskets[basket_id] = allocation_basket
            for application_event in application_events:
                if event_baskets.get(application_event.id):
                    event_baskets[application_event.id].append(basket_id)
                else:
                    event_baskets[application_event.id] = [basket_id]

        all_events = chain(
            *[
                application.application_events.all()
                for application in self.application_round.applications.all()
            ]
        )
        catchall_basket = AllocationBasket(
            id=None,
            allocation_percentage=None,
            order_number=1000,
            events=self.get_allocation_events(all_events),
            score=1,
        )
        self.baskets[None] = catchall_basket
        for application in self.application_round.applications.all():
            for application_event in application.application_events.all():
                if event_baskets.get(application_event.id):
                    event_baskets[application_event.id].append(None)
                else:
                    event_baskets[application_event.id] = [None]

        return event_baskets
