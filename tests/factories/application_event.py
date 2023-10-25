import datetime
import random
from collections.abc import Iterable
from typing import Any

import factory
from django.utils.timezone import get_default_timezone
from factory import fuzzy

from applications.choices import ApplicationEventStatusChoice, WeekdayChoice
from applications.models import ApplicationEvent, ApplicationEventSchedule, EventReservationUnit
from reservations.choices import ReservationStateChoice
from reservations.models import RecurringReservation

from ._base import GenericDjangoModelFactory

__all__ = [
    "ApplicationEventFactory",
    "EventReservationUnitFactory",
]


class ApplicationEventFactory(GenericDjangoModelFactory[ApplicationEvent]):
    class Meta:
        model = ApplicationEvent

    name = fuzzy.FuzzyText()
    num_persons = fuzzy.FuzzyInteger(low=1, high=1000)
    application = factory.SubFactory("tests.factories.ApplicationFactory")
    age_group = factory.SubFactory("tests.factories.AgeGroupFactory")
    ability_group = factory.SubFactory("tests.factories.AbilityGroupFactory")
    purpose = factory.SubFactory("tests.factories.ReservationPurposeFactory")

    min_duration = datetime.timedelta(hours=1)
    max_duration = datetime.timedelta(hours=2)

    begin = factory.LazyAttribute(lambda event: event.application.application_round.reservation_period_begin)
    end = factory.LazyAttribute(lambda event: event.application.application_round.reservation_period_end)

    events_per_week = fuzzy.FuzzyInteger(low=1, high=4)

    @classmethod
    def create_in_status(cls, status: ApplicationEventStatusChoice, **kwargs: Any) -> ApplicationEvent:
        match status:
            case ApplicationEventStatusChoice.UNALLOCATED:
                return cls.create_in_status_unallocated(**kwargs)
            case ApplicationEventStatusChoice.APPROVED:
                return cls.create_in_status_approved(**kwargs)
            case ApplicationEventStatusChoice.RESERVED:
                return cls.create_in_status_reserved(**kwargs)
            case ApplicationEventStatusChoice.FAILED:
                return cls.create_in_status_failed(**kwargs)
            case ApplicationEventStatusChoice.DECLINED:
                return cls.create_in_status_declined(**kwargs)

    @classmethod
    def create_in_status_unallocated(cls, **kwargs: Any) -> ApplicationEvent:
        """Create an application event in a draft application that has yet to be allocated."""
        from .application import ApplicationFactory

        kwargs.setdefault("application_event_schedules__declined", False)
        kwargs.setdefault("application_event_schedules__allocated_day", None)
        kwargs.setdefault("application_event_schedules__allocated_begin", None)
        kwargs.setdefault("application_event_schedules__allocated_end", None)
        kwargs.setdefault("application_event_schedules__allocated_reservation_unit", None)
        kwargs.setdefault("recurring_reservations", None)

        if "application" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application", kwargs)
            kwargs["application"] = ApplicationFactory.create_in_status_draft(**sub_kwargs)

        return cls.create(**kwargs)

    @classmethod
    def create_in_status_approved(cls, **kwargs: Any) -> ApplicationEvent:
        """
        Create an approved application event in an application in allocation,
        but its reservations have not been made.
        """
        from .application import ApplicationFactory

        cls._add_allocated_args(kwargs)
        kwargs.setdefault("recurring_reservations", None)

        if "application" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application", kwargs)
            sub_kwargs.setdefault("application_events", [])
            kwargs["application"] = ApplicationFactory.create_in_status_in_allocation(**sub_kwargs)

        return cls.create(**kwargs)

    @classmethod
    def create_in_status_reserved(cls, **kwargs: Any) -> ApplicationEvent:
        """
        Create an approved application event in an application in allocation,
        and its reservations have been made successfully.
        """
        from .application import ApplicationFactory

        cls._add_allocated_args(kwargs)
        kwargs.setdefault("recurring_reservations__reservations__state", ReservationStateChoice.CONFIRMED)

        if "application" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application", kwargs)
            sub_kwargs.setdefault("application_events", [])
            kwargs["application"] = ApplicationFactory.create_in_status_in_allocation(**sub_kwargs)

        return cls.create(**kwargs)

    @classmethod
    def create_in_status_failed(cls, **kwargs: Any) -> ApplicationEvent:
        """
        Create an approved application event in an application in allocation,
        but its reservations could not be made.
        """
        from .application import ApplicationFactory

        cls._add_allocated_args(kwargs)
        kwargs.setdefault("recurring_reservations__reservations__state", ReservationStateChoice.DENIED)

        if "application" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application", kwargs)
            sub_kwargs.setdefault("application_events", [])
            kwargs["application"] = ApplicationFactory.create_in_status_in_allocation(**sub_kwargs)

        return cls.create(**kwargs)

    @classmethod
    def create_in_status_declined(cls, **kwargs: Any) -> ApplicationEvent:
        """Create a declined application event in a draft application."""
        from .application import ApplicationFactory

        kwargs.setdefault("application_event_schedules__declined", True)

        if "application" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application", kwargs)
            sub_kwargs.setdefault("application_events", [])
            kwargs["application"] = ApplicationFactory.create_in_status_draft(**sub_kwargs)

        return cls.create(**kwargs)

    @factory.post_generation
    def application_event_schedules(
        self,
        create: bool,
        application_event_schedules: Iterable[ApplicationEventSchedule] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not application_event_schedules and kwargs:
            from .application_event_schedule import ApplicationEventScheduleFactory

            kwargs.setdefault("application_event", self)
            ApplicationEventScheduleFactory.create(**kwargs)

    @factory.post_generation
    def recurring_reservations(
        self,
        create: bool,
        recurring_reservations: Iterable[RecurringReservation] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not recurring_reservations and kwargs:
            from .reservation import RecurringReservationFactory

            kwargs.setdefault("application_event", self)
            kwargs.setdefault("application", self.application)
            RecurringReservationFactory.create(**kwargs)

    @factory.post_generation
    def event_reservation_units(
        self,
        create: bool,
        event_reservation_units: Iterable[EventReservationUnit] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not event_reservation_units and kwargs:
            kwargs.setdefault("application_event", self)
            EventReservationUnitFactory.create(**kwargs)

    @classmethod
    def _add_allocated_args(cls, kwargs: Any) -> None:
        from .reservation_unit import ReservationUnitFactory

        kwargs.setdefault("application_event_schedules__declined", False)
        kwargs.setdefault(
            "application_event_schedules__allocated_day",
            random.choice(WeekdayChoice.values),  # noqa: S311
        )
        kwargs.setdefault(
            "application_event_schedules__allocated_begin",
            datetime.time(12, 0, tzinfo=get_default_timezone()),
        )
        kwargs.setdefault(
            "application_event_schedules__allocated_end",
            datetime.time(12, 0, tzinfo=get_default_timezone()),
        )
        unit_key = "application_event_schedules__allocated_reservation_unit"
        if unit_key not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs(unit_key, kwargs)
            kwargs[unit_key] = ReservationUnitFactory.create(**sub_kwargs)


class EventReservationUnitFactory(GenericDjangoModelFactory[EventReservationUnit]):
    class Meta:
        model = EventReservationUnit

    application_event = factory.SubFactory("tests.factories.ApplicationEventFactory")
    priority = fuzzy.FuzzyInteger(low=0, high=1000, step=100)
    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")
