import datetime
from collections.abc import Iterable
from datetime import timedelta
from typing import Any

import factory
from django.utils.timezone import get_default_timezone, now
from factory import fuzzy

from applications.choices import ApplicantTypeChoice, ApplicationStatusChoice, PriorityChoice, WeekdayChoice
from applications.models import Application, ApplicationEvent, ApplicationRound
from reservation_units.models import ReservationUnit

from ._base import GenericDjangoModelFactory

__all__ = [
    "ApplicationFactory",
]


class ApplicationFactory(GenericDjangoModelFactory[Application]):
    class Meta:
        model = Application

    applicant_type = fuzzy.FuzzyChoice(choices=ApplicantTypeChoice.values)
    application_round = factory.SubFactory("tests.factories.ApplicationRoundFactory")

    organisation = factory.SubFactory("tests.factories.OrganisationFactory")
    contact_person = factory.SubFactory("tests.factories.PersonFactory")
    user = factory.SubFactory("tests.factories.UserFactory")
    billing_address = factory.SubFactory("tests.factories.AddressFactory")
    home_city = factory.SubFactory("tests.factories.CityFactory")

    cancelled_date = None
    sent_date = None
    additional_information = fuzzy.FuzzyText()
    working_memo = fuzzy.FuzzyText()

    @classmethod
    def create_in_status(cls, status: ApplicationStatusChoice, **kwargs: Any) -> Application:
        match status:
            case ApplicationStatusChoice.DRAFT:
                return cls.create_in_status_draft(**kwargs)
            case ApplicationStatusChoice.RECEIVED:
                return cls.create_in_status_received(**kwargs)
            case ApplicationStatusChoice.IN_ALLOCATION:
                return cls.create_in_status_in_allocation(**kwargs)
            case ApplicationStatusChoice.HANDLED:
                return cls.create_in_status_handled(**kwargs)
            case ApplicationStatusChoice.RESULTS_SENT:
                return cls.create_in_status_result_sent(**kwargs)
            case ApplicationStatusChoice.EXPIRED:
                return cls.create_in_status_expired(**kwargs)
            case ApplicationStatusChoice.CANCELLED:
                return cls.create_in_status_cancelled(**kwargs)

    @classmethod
    def create_in_status_draft(cls, **kwargs: Any) -> Application:
        """Create a draft application in an open application round."""
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", None)

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_open(**sub_kwargs)

        return cls.create(**kwargs)

    @classmethod
    def create_in_status_received(cls, **kwargs: Any) -> Application:
        """
        Create a received application with an unallocated application event
        in an open application round.
        """
        from .application_event import ApplicationEventFactory
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_open(**sub_kwargs)

        event_key = "application_events"
        event_kwargs = cls.pop_sub_kwargs(event_key, kwargs)

        application = cls.create(**kwargs)
        if event_key not in kwargs:
            event_kwargs["application"] = application
            ApplicationEventFactory.create_in_status_unallocated(**event_kwargs)

        return application

    @classmethod
    def create_in_status_in_allocation(cls, **kwargs: Any) -> Application:
        """
        Create an application to be allocated with a single unallocated application event
        in an application round in the allocation stage.
        """
        from .application_event import ApplicationEventFactory
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_in_allocation(**sub_kwargs)

        event_key = "application_events"
        event_kwargs = cls.pop_sub_kwargs(event_key, kwargs)

        application = cls.create(**kwargs)

        if event_key not in kwargs:
            event_kwargs["application"] = application
            ApplicationEventFactory.create_in_status_unallocated(**event_kwargs)

        return application

    @classmethod
    def create_in_status_handled(cls, **kwargs: Any) -> Application:
        """
        Create a handled application with a single approved application event
        in an application round in the handled stage.
        """
        from .application_event import ApplicationEventFactory
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_handled(**sub_kwargs)

        event_key = "application_events"
        event_kwargs = cls.pop_sub_kwargs(event_key, kwargs)

        application = cls.create(**kwargs)

        if event_key not in kwargs:
            event_kwargs["application"] = application
            ApplicationEventFactory.create_in_status_approved(**event_kwargs)

        return application

    @classmethod
    def create_in_status_result_sent(cls, **kwargs: Any) -> Application:
        """
        Create an application, the result of which has been sent to the user,
        with a single reserved application event in an application round in the handled stage.
        """
        from .application_event import ApplicationEventFactory
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            round_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_result_sent(**round_kwargs)

        event_key = "application_events"
        event_kwargs = cls.pop_sub_kwargs(event_key, kwargs)

        application = cls.create(**kwargs)

        if event_key not in kwargs:
            event_kwargs["application"] = application
            ApplicationEventFactory.create_in_status_reserved(**event_kwargs)

        return application

    @classmethod
    def create_in_status_expired(cls, **kwargs: Any) -> Application:
        """Create an expired application in a handled application round."""
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", None)

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_handled(**sub_kwargs)

        return cls.create(**kwargs)

    @classmethod
    def create_in_status_cancelled(cls, **kwargs: Any) -> Application:
        """Create a cancelled application."""
        kwargs.setdefault("cancelled_date", now())
        return cls.create(**kwargs)

    @classmethod
    def create_application_ready_for_allocation(
        cls,
        application_round: ApplicationRound | None = None,
        reservation_unit: ReservationUnit | None = None,
        *,
        events_per_week: int = 2,
        schedules_to_create: int = 2,
        min_duration_hours: int = 1,
        max_duration_hours: int = 2,
        begin: datetime.date | None = None,
        end: datetime.date | None = None,
        pre_allocated: bool = False,
    ) -> Application:
        """
        Create an application with a single application event in an application round in the allocation stage.
        - The application round has a single reservation unit.
        - The same reservation unit is included in the application event's event reservation units.
        - By default, the application has 2 schedules from 10:00-14:00 (Monday & Tuesday).
        - By default, the application event can have 2 events per week.
        - By default, the application event has a minimum duration of 1 hour and a maximum duration of 2 hours.
        """
        from .application_event import ApplicationEventFactory
        from .application_event_schedule import ApplicationEventScheduleFactory
        from .application_round import ApplicationRoundFactory
        from .reservation_unit import ReservationUnitFactory
        from .space import SpaceFactory

        if reservation_unit is None:
            reservation_unit = ReservationUnitFactory.create(spaces=[SpaceFactory.create()])

        if application_round is None:
            application_round = ApplicationRoundFactory.create_in_status_in_allocation(
                reservation_units=[reservation_unit],
            )
        elif reservation_unit not in application_round.reservation_units.all():
            application_round.reservation_units.add(reservation_unit)

        this_moment = now()
        application = cls.create(
            cancelled_date=None,
            sent_date=this_moment - timedelta(days=2),
            application_round=application_round,
        )
        application_event = ApplicationEventFactory.create(
            application=application,
            event_reservation_units__reservation_unit=reservation_unit,
            events_per_week=events_per_week,
            min_duration=datetime.timedelta(hours=min_duration_hours),
            max_duration=datetime.timedelta(hours=max_duration_hours),
            begin=begin or this_moment.date(),
            end=end or (this_moment + datetime.timedelta(days=7)).date(),
        )

        weekdays = iter(WeekdayChoice.values)
        schedules_to_create = min(schedules_to_create, 7)
        while schedules_to_create > 0:
            day = next(weekdays)
            ApplicationEventScheduleFactory.create(
                application_event=application_event,
                day=day,
                begin=datetime.time(10, 0, tzinfo=get_default_timezone()),
                end=datetime.time(14, 0, tzinfo=get_default_timezone()),
                priority=PriorityChoice.HIGH,
                allocated_day=day if pre_allocated else None,
                allocated_begin=datetime.time(10, 0, tzinfo=get_default_timezone()) if pre_allocated else None,
                allocated_end=(
                    datetime.time(10 + max_duration_hours, 0, tzinfo=get_default_timezone()) if pre_allocated else None
                ),
                allocated_reservation_unit=reservation_unit if pre_allocated else None,
            )
            schedules_to_create -= 1

        return application

    @factory.post_generation
    def application_events(
        self,
        create: bool,
        application_events: Iterable[ApplicationEvent] | None,
        **kwargs: Any,
    ):
        if not create:
            return

        if not application_events and kwargs:
            from .application_event import ApplicationEventFactory

            kwargs.setdefault("application", self)
            self.application_events.add(ApplicationEventFactory.create(**kwargs))

        for event in application_events or []:
            self.application_events.add(event)
