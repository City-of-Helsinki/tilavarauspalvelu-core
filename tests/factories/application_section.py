import datetime
import random
from collections.abc import Iterable
from typing import Any

import factory
from factory import fuzzy

from applications.choices import ApplicationSectionStatusChoice, Weekday
from applications.models import ApplicationSection, ReservationUnitOption, SuitableTimeRange

from ._base import GenericDjangoModelFactory
from .reservation_unit_option import ReservationUnitOptionFactory
from .suitable_time_range import SuitableTimeRangeFactory

__all__ = [
    "ApplicationSectionFactory",
]


class ApplicationSectionFactory(GenericDjangoModelFactory[ApplicationSection]):
    class Meta:
        model = ApplicationSection

    name = fuzzy.FuzzyText()
    num_persons = fuzzy.FuzzyInteger(low=1, high=1000)
    reservations_begin_date = factory.LazyAttribute(
        lambda section: section.application.application_round.reservation_period_begin,
    )
    reservations_end_date = factory.LazyAttribute(
        lambda section: section.application.application_round.reservation_period_end,
    )

    reservation_min_duration = datetime.timedelta(hours=1)
    reservation_max_duration = datetime.timedelta(hours=2)
    applied_reservations_per_week = fuzzy.FuzzyInteger(low=1, high=7)

    application = factory.SubFactory("tests.factories.ApplicationFactory")
    purpose = factory.SubFactory("tests.factories.ReservationPurposeFactory")
    age_group = factory.SubFactory("tests.factories.AgeGroupFactory")

    @classmethod
    def create_in_status(cls, status: ApplicationSectionStatusChoice, **kwargs: Any) -> ApplicationSection:
        match status:
            case ApplicationSectionStatusChoice.UNALLOCATED:
                return cls.create_in_status_unallocated(**kwargs)
            case ApplicationSectionStatusChoice.IN_ALLOCATION:
                return cls.create_in_status_in_allocation(**kwargs)
            case ApplicationSectionStatusChoice.HANDLED:
                return cls.create_in_status_handled(**kwargs)
            case ApplicationSectionStatusChoice.REJECTED:
                return cls.create_in_status_rejected(**kwargs)

    @classmethod
    def create_in_status_unallocated(cls, **kwargs: Any) -> ApplicationSection:
        """
        Create an unallocated application section:
        - in a draft application
        - in an open application round
        - with a single reservation unit option
        """
        from .application import ApplicationFactory

        if "application" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application", kwargs)
            sub_kwargs["application_sections"] = []
            kwargs["application"] = ApplicationFactory.create_in_status_draft(**sub_kwargs)

        if not cls.has_sub_kwargs("reservation_unit_options", kwargs):
            kwargs["reservation_unit_options__rejected"] = False

        return cls.create(**kwargs)

    @classmethod
    def create_in_status_in_allocation(cls, **kwargs: Any) -> ApplicationSection:
        """
        Create an unallocated application section:
        - in an application in allocation
        - in an application round in allocation
        - with a single reservation unit option
        """
        from .application import ApplicationFactory

        if "application" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application", kwargs)
            sub_kwargs["application_sections"] = []
            kwargs["application"] = ApplicationFactory.create_in_status_in_allocation(**sub_kwargs)

        if not cls.has_sub_kwargs("reservation_unit_options", kwargs):
            kwargs["reservation_unit_options__rejected"] = False

        return cls.create(**kwargs)

    @classmethod
    def create_in_status_handled(cls, **kwargs: Any) -> ApplicationSection:
        """
        Create a handled application section:
        - in an application in allocation
        - in an application round in allocation
        - with a single reservation unit option with a single allocation
        - with 1 applied reservations per week
        """
        from .application import ApplicationFactory

        kwargs["applied_reservations_per_week"] = 1

        if "application" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application", kwargs)
            sub_kwargs["application_sections"] = []
            kwargs["application"] = ApplicationFactory.create_in_status_in_allocation(**sub_kwargs)

        if not cls.has_sub_kwargs("reservation_unit_options", kwargs):
            kwargs["reservation_unit_options__allocated_time_slots__day_of_the_week"] = Weekday.MONDAY

        return cls.create(**kwargs)

    @classmethod
    def create_in_status_rejected(cls, **kwargs: Any) -> ApplicationSection:
        """
        Create a rejected application section:
        - in an application in allocation
        - in an application round in allocation
        - without any allocated reservation unit options
        """
        from .application import ApplicationFactory

        kwargs["applied_reservations_per_week"] = 1

        if "application" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application", kwargs)
            sub_kwargs["application_sections"] = []
            kwargs["application"] = ApplicationFactory.create_in_status_in_allocation(**sub_kwargs)

        if not cls.has_sub_kwargs("reservation_unit_options", kwargs):
            # All options are either locked or rejected
            is_rejected = random.choice([True, False])
            kwargs["reservation_unit_options__rejected"] = is_rejected
            kwargs["reservation_unit_options__locked"] = not is_rejected

        return cls.create(**kwargs)

    @factory.post_generation
    def reservation_unit_options(
        self,
        create: bool,
        reservation_unit_options: Iterable[ReservationUnitOption] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not reservation_unit_options and kwargs:
            kwargs.setdefault("application_section", self)
            ReservationUnitOptionFactory.create(**kwargs)

    @factory.post_generation
    def suitable_time_ranges(
        self,
        create: bool,
        suitable_time_ranges: Iterable[SuitableTimeRange] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not suitable_time_ranges and kwargs:
            kwargs.setdefault("application_section", self)
            SuitableTimeRangeFactory.create(**kwargs)
