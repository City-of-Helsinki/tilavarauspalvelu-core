import datetime
from typing import Any, Self

import factory
from factory import fuzzy

from tilavarauspalvelu.enums import ApplicationSectionStatusChoice, Weekday
from tilavarauspalvelu.models import Application, ApplicationSection

from ._base import FakerFI, ForeignKeyFactory, GenericDjangoModelFactory, ModelFactoryBuilder, ReverseForeignKeyFactory

__all__ = [
    "ApplicationSectionBuilder",
    "ApplicationSectionFactory",
]


class ApplicationSectionFactory(GenericDjangoModelFactory[ApplicationSection]):
    class Meta:
        model = ApplicationSection

    name = FakerFI("word")
    num_persons = fuzzy.FuzzyInteger(low=1, high=1000)

    reservations_begin_date = factory.LazyAttribute(lambda i: i.application.application_round.reservation_period_begin)
    reservations_end_date = factory.LazyAttribute(lambda i: i.application.application_round.reservation_period_end)

    reservation_min_duration = datetime.timedelta(hours=1)
    reservation_max_duration = datetime.timedelta(hours=2)
    applied_reservations_per_week = fuzzy.FuzzyInteger(low=1, high=7)

    application = ForeignKeyFactory("tests.factories.ApplicationFactory")

    purpose = ForeignKeyFactory("tests.factories.ReservationPurposeFactory", required=True)
    age_group = ForeignKeyFactory("tests.factories.AgeGroupFactory", required=True)

    reservation_unit_options = ReverseForeignKeyFactory("tests.factories.ReservationUnitOptionFactory")
    suitable_time_ranges = ReverseForeignKeyFactory("tests.factories.SuitableTimeRangeFactory")

    @classmethod
    def create_in_status_unallocated(cls, **kwargs: Any) -> ApplicationSection:
        return ApplicationSectionBuilder().unallocated().create(**kwargs)

    @classmethod
    def create_in_status_in_allocation(cls, **kwargs: Any) -> ApplicationSection:
        return ApplicationSectionBuilder().in_allocation().create(**kwargs)

    @classmethod
    def create_in_status_handled(cls, **kwargs: Any) -> ApplicationSection:
        return ApplicationSectionBuilder().handled().create(**kwargs)

    @classmethod
    def create_in_status_rejected(cls, **kwargs: Any) -> ApplicationSection:
        return ApplicationSectionBuilder().rejected().create(**kwargs)


class ApplicationSectionBuilder(ModelFactoryBuilder[ApplicationSection]):
    factory = ApplicationSectionFactory

    def with_status(self, status: ApplicationSectionStatusChoice) -> Self:
        match status:
            case ApplicationSectionStatusChoice.UNALLOCATED:
                return self.unallocated()
            case ApplicationSectionStatusChoice.IN_ALLOCATION:
                return self.in_allocation()
            case ApplicationSectionStatusChoice.HANDLED:
                return self.handled()
            case ApplicationSectionStatusChoice.REJECTED:
                return self.rejected()

    def unallocated(self) -> Self:
        """
        Create an unallocated application section:
        - in a draft application
        - in an open application round
        - with a single reservation unit option
        """
        from .application import ApplicationBuilder

        for key, value in ApplicationBuilder().draft(sections=False).kwargs.items():
            self.kwargs.setdefault(f"application__{key}", value)

        self.kwargs["reservation_unit_options__rejected"] = False
        return self

    def in_allocation(self) -> Self:
        """
        Create an unallocated application section:
        - in an application in allocation
        - in an application round in allocation
        - with a single reservation unit option
        """
        from .application import ApplicationBuilder

        for key, value in ApplicationBuilder().in_allocation(sections=False).kwargs.items():
            self.kwargs.setdefault(f"application__{key}", value)

        self.kwargs["reservation_unit_options__rejected"] = False
        return self

    def handled(self, *, allocations: bool = True) -> Self:
        """
        Create a handled application section:
        - in an application in allocation
        - in an application round in allocation
        - with a single reservation unit option with a single allocation
        - with 1 applied reservations per week
        """
        from .application import ApplicationBuilder

        for key, value in ApplicationBuilder().in_allocation(sections=False).kwargs.items():
            self.kwargs.setdefault(f"application__{key}", value)

        self.kwargs["applied_reservations_per_week"] = 1
        self.kwargs["reservation_unit_options__rejected"] = False

        if allocations:
            self.kwargs["reservation_unit_options__allocated_time_slots__day_of_the_week"] = Weekday.MONDAY

        return self

    def rejected(self) -> Self:
        """
        Create a rejected application section:
        - in an application in allocation
        - in an application round in allocation
        - without any allocated reservation unit options
        """
        from .application import ApplicationBuilder

        for key, value in ApplicationBuilder().in_allocation(sections=False).kwargs.items():
            self.kwargs.setdefault(f"application__{key}", value)

        self.kwargs["applied_reservations_per_week"] = 1
        self.kwargs["reservation_unit_options__rejected"] = True
        self.kwargs["reservation_unit_options__locked"] = False
        return self

    def in_application(self, application: Application) -> Self:
        for key in list(self.kwargs):
            if key.startswith("application"):
                del self.kwargs[key]

        self.kwargs.setdefault("application", application)
        return self
