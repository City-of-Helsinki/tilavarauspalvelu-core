from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any, Self

from django.utils.timezone import now
from factory import fuzzy

from tilavarauspalvelu.enums import ApplicationStatusChoice, MunicipalityChoice, Priority, ReserveeType, Weekday
from tilavarauspalvelu.models import Application
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime, local_time

from ._base import FakerFI, ForeignKeyFactory, GenericDjangoModelFactory, ModelFactoryBuilder, ReverseForeignKeyFactory

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound, ReservationUnit

__all__ = [
    "ApplicationBuilder",
    "ApplicationFactory",
]


class ApplicationFactory(GenericDjangoModelFactory[Application]):
    class Meta:
        model = Application

    applicant_type = fuzzy.FuzzyChoice(choices=ReserveeType.values)
    additional_information = FakerFI("sentence")
    working_memo = FakerFI("sentence")

    cancelled_at = None
    sent_at = None
    in_allocation_notification_sent_at = None
    results_ready_notification_sent_at = None

    contact_person_first_name = FakerFI("first_name")
    contact_person_last_name = FakerFI("last_name")
    contact_person_email = FakerFI("ascii_email")
    contact_person_phone_number = FakerFI("phone_number")

    organisation_name = FakerFI("company")
    organisation_email = FakerFI("ascii_email")
    organisation_identifier = FakerFI("company_business_id")
    organisation_year_established = fuzzy.FuzzyInteger(low=2000, high=2025)
    organisation_active_members = fuzzy.FuzzyInteger(low=1, high=500)
    organisation_core_business = FakerFI("sentence")
    organisation_street_address = FakerFI("address")
    organisation_post_code = FakerFI("postcode")
    organisation_city = FakerFI("city")

    billing_street_address = FakerFI("address")
    billing_post_code = FakerFI("postcode")
    billing_city = FakerFI("city")

    municipality = MunicipalityChoice.HELSINKI

    application_round = ForeignKeyFactory("tests.factories.ApplicationRoundFactory")
    user = ForeignKeyFactory("tests.factories.UserFactory", required=True)

    application_sections = ReverseForeignKeyFactory("tests.factories.ApplicationSectionFactory")

    @classmethod
    def create_in_status(cls, status: ApplicationStatusChoice) -> Application:
        match status:
            case ApplicationStatusChoice.DRAFT:
                return cls.create_in_status_draft_no_sections()
            case ApplicationStatusChoice.RECEIVED:
                return cls.create_in_status_received()
            case ApplicationStatusChoice.IN_ALLOCATION:
                return cls.create_in_status_in_allocation_no_sections()
            case ApplicationStatusChoice.HANDLED:
                return cls.create_in_status_handled_no_sections()
            case ApplicationStatusChoice.RESULTS_SENT:
                return cls.create_in_status_results_sent()
            case ApplicationStatusChoice.EXPIRED:
                return cls.create_in_status_expired()
            case ApplicationStatusChoice.CANCELLED:
                return cls.create_in_status_cancelled()

    @classmethod
    def create_in_status_draft_no_sections(cls, **kwargs: Any) -> Application:
        return ApplicationBuilder().draft(sections=False).create(**kwargs)

    @classmethod
    def create_in_status_draft(cls, **kwargs: Any) -> Application:
        return ApplicationBuilder().draft().create(**kwargs)

    @classmethod
    def create_in_status_received(cls, **kwargs: Any) -> Application:
        return ApplicationBuilder().received().create(**kwargs)

    @classmethod
    def create_in_status_in_allocation_no_sections(cls, **kwargs: Any) -> Application:
        return ApplicationBuilder().in_allocation(sections=False).create(**kwargs)

    @classmethod
    def create_in_status_in_allocation(cls, **kwargs: Any) -> Application:
        return ApplicationBuilder().in_allocation().create(**kwargs)

    @classmethod
    def create_in_status_handled_no_sections(cls, **kwargs: Any) -> Application:
        return ApplicationBuilder().handled(sections=False).create(**kwargs)

    @classmethod
    def create_in_status_handled(cls, **kwargs: Any) -> Application:
        return ApplicationBuilder().handled().create(**kwargs)

    @classmethod
    def create_in_status_results_sent(cls, **kwargs: Any) -> Application:
        return ApplicationBuilder().results_sent().create(**kwargs)

    @classmethod
    def create_in_status_expired(cls, **kwargs: Any) -> Application:
        return ApplicationBuilder().expired().create(**kwargs)

    @classmethod
    def create_in_status_cancelled(cls, **kwargs: Any) -> Application:
        return ApplicationBuilder().cancelled().create(**kwargs)

    @classmethod
    def create_application_ready_for_sending(
        cls,
        *,
        applicant_type: ReserveeType = ReserveeType.INDIVIDUAL,
        unregistered: bool = False,
        **kwargs: Any,
    ) -> Application:
        """
        Create an application that is ready to be sent (for individual applicant by default):
        - is in an open application round
        - is a draft
        - has one application section
        - section has a name
        - section has a non-zero number of participants
        - section has an age group
        - section has a purpose
        - section has applied for 1 reservation per week
        - section has applied for minimum reservation duration of 1 hour
        - section has one suitable timeslot, that is at least as long as the minimum reservation duration
        - section has at lest one reservation unit option
        - application is for an individual
        """
        from .application_round import ApplicationRoundFactory

        round_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
        application_round = ApplicationRoundFactory.create_in_status_open(**round_kwargs)

        builder = ApplicationBuilder()
        match applicant_type:
            case ReserveeType.INDIVIDUAL:
                builder = builder.for_individual()
            case ReserveeType.NONPROFIT:
                builder = builder.for_non_profit(unregistered=unregistered)
            case ReserveeType.COMPANY:
                builder = builder.for_company()

        defaults: dict[str, Any] = {
            "application_round": application_round,
            #
            # Is of age
            "user__date_of_birth": datetime.date(1980, 1, 1),
            #
            # Not sent or handled
            "cancelled_at": None,
            "sent_at": None,
            #
            # Applicant data
            **builder.kwargs,
            #
            # Overrides.
            **kwargs,
        }

        if "application_sections" not in kwargs:
            defaults.setdefault("application_sections__name", "Test application section")
            defaults.setdefault("application_sections__num_persons", 1)
            defaults.setdefault("application_sections__applied_reservations_per_week", 1)
            defaults.setdefault("application_sections__reservation_min_duration", datetime.timedelta(hours=1))
            defaults.setdefault("application_sections__reservation_max_duration", datetime.timedelta(hours=2))

            if "application_sections__purpose" not in kwargs:
                defaults.setdefault("application_sections__purpose__name", "Test purpose")

            if "application_sections__age_group" not in kwargs:
                defaults.setdefault("application_sections__age_group__minimum", 1)
                defaults.setdefault("application_sections__age_group__maximum", 10)

            if "application_sections__reservation_unit_options" not in kwargs:
                defaults.setdefault("application_sections__reservation_unit_options__preferred_order", 1)

            if "application_sections__suitable_time_ranges" not in kwargs:
                defaults.setdefault("application_sections__suitable_time_ranges__priority", Priority.PRIMARY)
                defaults.setdefault("application_sections__suitable_time_ranges__day_of_the_week", Weekday.MONDAY)
                defaults.setdefault("application_sections__suitable_time_ranges__begin_time", local_time(10, 0))
                defaults.setdefault("application_sections__suitable_time_ranges__end_time", local_time(11, 0))

        return cls.create(**defaults)

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
        from .allocated_time_slot import AllocatedTimeSlotFactory
        from .application_round import ApplicationRoundFactory
        from .application_section import ApplicationSectionFactory
        from .reservation_unit import ReservationUnitFactory
        from .space import SpaceFactory
        from .suitable_time_range import SuitableTimeRangeFactory

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
            cancelled_at=None,
            sent_at=this_moment - datetime.timedelta(days=2),
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
                begin_time=datetime.time(10, 0, tzinfo=DEFAULT_TIMEZONE),
                end_time=datetime.time(14, 0, tzinfo=DEFAULT_TIMEZONE),
            )
            if not pre_allocated:
                continue

            AllocatedTimeSlotFactory.create(
                reservation_unit_option=reservation_unit_option,
                day_of_the_week=day_of_the_week,
                begin_time=datetime.time(10, 0, tzinfo=DEFAULT_TIMEZONE),
                end_time=datetime.time(10 + max_duration_hours, 0, tzinfo=DEFAULT_TIMEZONE),
            )

        return application


class ApplicationBuilder(ModelFactoryBuilder[Application]):
    factory = ApplicationFactory

    def with_status(self, status: ApplicationStatusChoice) -> Self:
        match status:
            case ApplicationStatusChoice.DRAFT:
                return self.draft()
            case ApplicationStatusChoice.RECEIVED:
                return self.received()
            case ApplicationStatusChoice.IN_ALLOCATION:
                return self.in_allocation()
            case ApplicationStatusChoice.HANDLED:
                return self.handled()
            case ApplicationStatusChoice.RESULTS_SENT:
                return self.results_sent()
            case ApplicationStatusChoice.EXPIRED:
                return self.expired()
            case ApplicationStatusChoice.CANCELLED:
                return self.cancelled()

    def draft(self, *, sections: bool = True) -> Self:
        """
        Create a draft application:
        - in an open application round
        - with a single application section
            - with a single reservation unit option
        """
        from .application_round import ApplicationRoundBuilder
        from .application_section import ApplicationSectionBuilder

        self.kwargs.setdefault("cancelled_at", None)
        self.kwargs.setdefault("sent_at", None)

        for key, value in ApplicationRoundBuilder().open().kwargs.items():
            self.kwargs.setdefault(f"application_round__{key}", value)

        if sections:
            for key, value in ApplicationSectionBuilder().unallocated().kwargs.items():
                self.kwargs.setdefault(f"application_sections__{key}", value)

        return self

    def received(self, *, sections: bool = True) -> Self:
        """
        Create a received application:
        - in an open application round
        - with a single application section
            - with a single reservation unit option
        """
        from .application_round import ApplicationRoundBuilder
        from .application_section import ApplicationSectionBuilder

        self.kwargs.setdefault("cancelled_at", None)
        self.kwargs.setdefault("sent_at", local_datetime())

        for key, value in ApplicationRoundBuilder().open().kwargs.items():
            self.kwargs.setdefault(f"application_round__{key}", value)

        if sections:
            for key, value in ApplicationSectionBuilder().unallocated().kwargs.items():
                self.kwargs.setdefault(f"application_sections__{key}", value)

        return self

    def in_allocation(self, *, sections: bool = True) -> Self:
        """
        Create an application to be allocated:
        - in an application round in allocation
        - with a single application section
            - with a single reservation unit option
        """
        from .application_round import ApplicationRoundBuilder
        from .application_section import ApplicationSectionBuilder

        self.kwargs.setdefault("cancelled_at", None)
        self.kwargs.setdefault("sent_at", local_datetime())
        self.kwargs.setdefault("in_allocation_notification_sent_at", local_datetime())

        for key, value in ApplicationRoundBuilder().in_allocation().kwargs.items():
            self.kwargs.setdefault(f"application_round__{key}", value)

        if sections:
            for key, value in ApplicationSectionBuilder().in_allocation().kwargs.items():
                self.kwargs.setdefault(f"application_sections__{key}", value)

        return self

    def handled(self, *, sections: bool = True) -> Self:
        """
        Create a handled application:
        - in a handled application round
        - with a single application section
            - with a single reservation unit option
                - that has been allocated
        """
        from .application_round import ApplicationRoundBuilder
        from .application_section import ApplicationSectionBuilder

        self.kwargs.setdefault("cancelled_at", None)
        self.kwargs.setdefault("sent_at", local_datetime())
        self.kwargs.setdefault("in_allocation_notification_sent_at", local_datetime())

        for key, value in ApplicationRoundBuilder().handled().kwargs.items():
            self.kwargs.setdefault(f"application_round__{key}", value)

        if sections:
            for key, value in ApplicationSectionBuilder().handled().kwargs.items():
                self.kwargs.setdefault(f"application_sections__{key}", value)

        return self

    def results_sent(self, *, sections: bool = True) -> Self:
        """
        Create an application, the result of which has been sent to the user:
        - in a handled application round
        - with a single application section
            - with a single reservation unit option
                - that has been allocated
        """
        from .application_round import ApplicationRoundBuilder
        from .application_section import ApplicationSectionBuilder

        self.kwargs.setdefault("cancelled_at", None)
        self.kwargs.setdefault("sent_at", local_datetime())
        self.kwargs.setdefault("in_allocation_notification_sent_at", local_datetime())
        self.kwargs.setdefault("results_ready_notification_sent_at", local_datetime())

        for key, value in ApplicationRoundBuilder().results_sent().kwargs.items():
            self.kwargs.setdefault(f"application_round__{key}", value)

        if sections:
            for key, value in ApplicationSectionBuilder().handled().kwargs.items():
                self.kwargs.setdefault(f"application_sections__{key}", value)

        return self

    def expired(self, *, sections: bool = True) -> Self:
        """
        Create an expired application:
        - in a handled application round
        - with a single unallocated application section
            - with a single reservation unit option
        """
        from .application_round import ApplicationRoundBuilder
        from .application_section import ApplicationSectionBuilder

        self.kwargs.setdefault("cancelled_at", None)
        self.kwargs.setdefault("sent_at", None)

        for key, value in ApplicationRoundBuilder().handled().kwargs.items():
            self.kwargs.setdefault(f"application_round__{key}", value)

        if sections:
            for key, value in ApplicationSectionBuilder().unallocated().kwargs.items():
                self.kwargs.setdefault(f"application_sections__{key}", value)

        return self

    def cancelled(self, *, sections: bool = True) -> Self:
        """
        Create a cancelled application.
        - in an open application round
        - with a single application section
            - with a single reservation unit option
        """
        from .application_round import ApplicationRoundBuilder
        from .application_section import ApplicationSectionBuilder

        self.kwargs.setdefault("cancelled_at", now())

        for key, value in ApplicationRoundBuilder().open().kwargs.items():
            self.kwargs.setdefault(f"application_round__{key}", value)

        if sections:
            for key, value in ApplicationSectionBuilder().unallocated().kwargs.items():
                self.kwargs.setdefault(f"application_sections__{key}", value)

        return self

    def in_application_round(self, application_round: ApplicationRound) -> Self:
        for key in list(self.kwargs):
            if key.startswith("application_round"):
                del self.kwargs[key]

        self.kwargs.setdefault("application_round", application_round)
        return self

    def for_applicant_type(
        self,
        *,
        applicant_type: ReserveeType,
        unregistered: bool = False,
    ) -> ApplicationBuilder:
        match applicant_type:
            case ReserveeType.INDIVIDUAL:
                return self.for_individual()
            case ReserveeType.NONPROFIT:
                return self.for_non_profit(unregistered=unregistered)
            case ReserveeType.COMPANY:
                return self.for_company()
            case _:
                msg = f"Unknown applicant type: {applicant_type}"
                raise ValueError(msg)

    def for_individual(self) -> ApplicationBuilder:
        self.kwargs["applicant_type"] = ReserveeType.INDIVIDUAL

        self.kwargs["organisation_name"] = ""
        self.kwargs["organisation_email"] = None
        self.kwargs["organisation_identifier"] = ""
        self.kwargs["organisation_year_established"] = None
        self.kwargs["organisation_active_members"] = None
        self.kwargs["organisation_core_business"] = ""
        self.kwargs["organisation_street_address"] = ""
        self.kwargs["organisation_post_code"] = ""
        self.kwargs["organisation_city"] = ""

        self.kwargs["municipality"] = None

        return self

    def for_non_profit(self, *, unregistered: bool) -> ApplicationBuilder:
        self.kwargs["applicant_type"] = ReserveeType.NONPROFIT
        self.kwargs["organisation_identifier"] = ""

        if not unregistered:
            self.kwargs["organisation_identifier"] = ApplicationFactory.organisation_identifier.generate()

        return self

    def for_company(self) -> ApplicationBuilder:
        self.kwargs["applicant_type"] = ReserveeType.COMPANY

        self.kwargs["organisation_identifier"] = ApplicationFactory.organisation_identifier.generate()

        self.kwargs["municipality"] = None

        return self

    def set_description_info(
        self,
        applicant_type: str,
        suitable_time: str,
        section: str,
        option: str,
    ) -> Self:
        self.kwargs["additional_information"] = "\n".join(
            [
                f"Applicant type: {applicant_type}",
                f"Suitable time ranges: {suitable_time}",
                f"Application section: {section}",
                f"Reservation unit options: {option}",
            ],
        )
        return self
