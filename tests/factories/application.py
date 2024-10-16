import datetime
from collections.abc import Iterable
from datetime import timedelta
from typing import Any

import factory
from django.utils.timezone import get_default_timezone, now
from factory import fuzzy

from tilavarauspalvelu.enums import ApplicantTypeChoice, ApplicationStatusChoice, Priority, Weekday
from tilavarauspalvelu.models import Application, ApplicationRound, ApplicationSection, ReservationUnit

from ._base import GenericDjangoModelFactory
from .allocated_time_slot import AllocatedTimeSlotFactory
from .application_round import ApplicationRoundFactory
from .application_section import ApplicationSectionFactory
from .reservation_unit import ReservationUnitFactory
from .space import SpaceFactory
from .suitable_time_range import SuitableTimeRangeFactory

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
                return cls.create_in_status_results_sent(**kwargs)
            case ApplicationStatusChoice.EXPIRED:
                return cls.create_in_status_expired(**kwargs)
            case ApplicationStatusChoice.CANCELLED:
                return cls.create_in_status_cancelled(**kwargs)

    @classmethod
    def create_in_status_draft_no_sections(cls, **kwargs: Any) -> Application:
        return cls.create_in_status_draft(application_sections=[], **kwargs)

    @classmethod
    def create_in_status_draft(cls, **kwargs: Any) -> Application:
        """
        Create a draft application:
        - in an open application round
        - with a single application section
            - with a single reservation unit option
        """
        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", None)

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_open(**sub_kwargs)

        key = "application_sections"
        application_section_kwargs = cls.pop_sub_kwargs(key, kwargs)

        application = cls.create(**kwargs)

        if key not in kwargs:  # allow for empty application sections
            application_section_kwargs["application"] = application
            ApplicationSectionFactory.create_in_status_unallocated(**application_section_kwargs)

        return application

    @classmethod
    def create_in_status_received(cls, **kwargs: Any) -> Application:
        """
        Create a received application:
        - in an open application round
        - with a single application section
            - with a single reservation unit option
        """
        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_open(**sub_kwargs)

        key = "application_sections"
        application_section_kwargs = cls.pop_sub_kwargs(key, kwargs)

        application = cls.create(**kwargs)

        if key not in kwargs:  # allow for empty application sections
            application_section_kwargs["application"] = application
            ApplicationSectionFactory.create_in_status_unallocated(**application_section_kwargs)

        return application

    @classmethod
    def create_in_status_in_allocation_no_sections(cls, **kwargs: Any) -> Application:
        return cls.create_in_status_in_allocation(application_sections=[], **kwargs)

    @classmethod
    def create_in_status_in_allocation(cls, **kwargs: Any) -> Application:
        """
        Create an application to be allocated:
        - in an application round in allocation
        - with a single application section
            - with a single reservation unit option
        """
        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_in_allocation(**sub_kwargs)

        key = "application_sections"
        key_kwargs = cls.pop_sub_kwargs(key, kwargs)

        application = cls.create(**kwargs)
        if key not in kwargs:
            key_kwargs["application"] = application
            ApplicationSectionFactory.create_in_status_in_allocation(**key_kwargs)

        return application

    @classmethod
    def create_in_status_handled_no_sections(cls, **kwargs: Any) -> Application:
        return cls.create_in_status_handled(application_sections=[], **kwargs)

    @classmethod
    def create_in_status_handled(cls, **kwargs: Any) -> Application:
        """
        Create a handled application:
        - in a handled application round
        - with a single application section
            - with a single reservation unit option
                - that has been allocated
        """
        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_handled(**sub_kwargs)

        key = "application_sections"
        key_kwargs = cls.pop_sub_kwargs(key, kwargs)

        application = cls.create(**kwargs)
        if key not in kwargs:
            key_kwargs["application"] = application
            ApplicationSectionFactory.create_in_status_handled(**key_kwargs)

        return application

    @classmethod
    def create_in_status_results_sent(cls, **kwargs: Any) -> Application:
        """
        Create an application, the result of which has been sent to the user:
        - in a handled application round
        - with a single application section
            - with a single reservation unit option
                - that has been allocated
        """
        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            round_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_result_sent(**round_kwargs)

        key = "application_sections"
        key_kwargs = cls.pop_sub_kwargs(key, kwargs)

        application = cls.create(**kwargs)
        if key not in kwargs:
            key_kwargs["application"] = application
            ApplicationSectionFactory.create_in_status_handled(**key_kwargs)

        return application

    @classmethod
    def create_in_status_expired(cls, **kwargs: Any) -> Application:
        """
        Create an expired application:
        - in a handled application round
        - with a single unallocated application section
            - with a single reservation unit option
        """
        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", None)

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_handled(**sub_kwargs)

        key = "application_sections"
        key_kwargs = cls.pop_sub_kwargs(key, kwargs)

        application = cls.create(**kwargs)
        if key not in kwargs:
            key_kwargs["application"] = application
            ApplicationSectionFactory.create_in_status_unallocated(**key_kwargs)

        return application

    @classmethod
    def create_in_status_cancelled(cls, **kwargs: Any) -> Application:
        """
        Create a cancelled application.
        - in an open application round
        - with a single application section
            - with a single reservation unit option
        """
        kwargs.setdefault("cancelled_date", now())

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_open(**sub_kwargs)

        key = "application_sections"
        key_kwargs = cls.pop_sub_kwargs(key, kwargs)

        application = cls.create(**kwargs)

        if key not in kwargs:
            key_kwargs["application"] = application
            ApplicationSectionFactory.create_in_status_unallocated(**key_kwargs)

        return application

    @classmethod
    def create_application_ready_for_allocation(
        cls,
        application_round: ApplicationRound | None = None,
        reservation_unit: ReservationUnit | None = None,
        *,
        applied_reservations_per_week: int = 1,
        times_slots_to_create: int = 2,
        min_duration_hours: int = 1,
        max_duration_hours: int = 2,
        begin_date: datetime.date | None = None,
        end_date: datetime.date | None = None,
        pre_allocated: bool = False,
    ) -> Application:
        """
        Create an application:
        - In an application round in the allocation stage.
            - The application round has a single reservation unit.
        - With a single application section.
            - with a single reservation unit option

        - By default, the applicant has applied for 1 reservation per week.
        - By default, the application section has a minimum duration of 1 hour and a maximum duration of 2 hours.
        - By default, the application has 2 suitable time ranges from 10:00-14:00 (Monday & Tuesday).
        - If pre_allocated, there are allocated time slots equal to reservations per week.
        """
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
        application_section = ApplicationSectionFactory.create(
            application=application,
            applied_reservations_per_week=applied_reservations_per_week,
            reservation_min_duration=datetime.timedelta(hours=min_duration_hours),
            reservation_max_duration=datetime.timedelta(hours=max_duration_hours),
            reservations_begin_date=begin_date or this_moment.date(),
            reservations_end_date=end_date or (this_moment + datetime.timedelta(days=7)).date(),
            reservation_unit_options__reservation_unit=reservation_unit,
        )

        weekdays = iter(Weekday.values)
        times_slots_to_create = min(times_slots_to_create, 7)
        reservation_unit_option = application_section.reservation_unit_options.first()

        while times_slots_to_create > 0:
            times_slots_to_create -= 1
            day_of_the_week = next(weekdays)

            SuitableTimeRangeFactory.create(
                application_section=application_section,
                priority=Priority.PRIMARY,
                day_of_the_week=day_of_the_week,
                begin_time=datetime.time(10, 0, tzinfo=get_default_timezone()),
                end_time=datetime.time(14, 0, tzinfo=get_default_timezone()),
            )
            if not pre_allocated:
                continue

            AllocatedTimeSlotFactory.create(
                reservation_unit_option=reservation_unit_option,
                day_of_the_week=day_of_the_week,
                begin_time=datetime.time(10, 0, tzinfo=get_default_timezone()),
                end_time=datetime.time(10 + max_duration_hours, 0, tzinfo=get_default_timezone()),
            )

        return application

    @factory.post_generation
    def application_sections(
        self,
        create: bool,
        application_sections: Iterable[ApplicationSection] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not application_sections and kwargs:
            kwargs.setdefault("application", self)
            ApplicationSectionFactory.create(**kwargs)
