from collections.abc import Iterable
from datetime import timedelta
from typing import Any

import factory
from factory import fuzzy

from applications.enums import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from common.date_utils import utc_start_of_day
from reservation_units.models import Purpose, ReservationUnit

from ._base import GenericDjangoModelFactory

__all__ = [
    "ApplicationRoundFactory",
]


class ApplicationRoundFactory(GenericDjangoModelFactory[ApplicationRound]):
    class Meta:
        model = ApplicationRound
        exclude = ["timestamp"]

    name = fuzzy.FuzzyText()

    timestamp = factory.LazyFunction(utc_start_of_day)  # private helper (see Meta.exclude)

    application_period_begin = factory.LazyAttribute(lambda a: a.timestamp)
    application_period_end = factory.LazyAttribute(lambda a: a.application_period_begin + timedelta(weeks=4))

    reservation_period_begin = factory.LazyAttribute(lambda a: a.timestamp.date())
    reservation_period_end = factory.LazyAttribute(lambda a: a.reservation_period_begin + timedelta(weeks=4))

    public_display_begin = factory.LazyAttribute(lambda a: a.timestamp)
    public_display_end = factory.LazyAttribute(lambda a: a.public_display_begin + timedelta(weeks=4))

    handled_date = None
    sent_date = None

    terms_of_use = factory.SubFactory("tests.factories.TermsOfUseFactory")
    criteria = ""
    notes_when_applying = ""

    @classmethod
    def create_in_status(cls, status: ApplicationRoundStatusChoice, **kwargs: Any) -> ApplicationRound:
        match status:
            case ApplicationRoundStatusChoice.UPCOMING:
                return cls.create_in_status_upcoming(**kwargs)
            case ApplicationRoundStatusChoice.OPEN:
                return cls.create_in_status_open(**kwargs)
            case ApplicationRoundStatusChoice.IN_ALLOCATION:
                return cls.create_in_status_in_allocation(**kwargs)
            case ApplicationRoundStatusChoice.HANDLED:
                return cls.create_in_status_handled(**kwargs)
            case ApplicationRoundStatusChoice.RESULTS_SENT:
                return cls.create_in_status_result_sent(**kwargs)

    @classmethod
    def create_in_status_upcoming(cls, **kwargs: Any) -> ApplicationRound:
        """Create an upcoming application round."""
        kwargs.setdefault("sent_date", None)
        kwargs.setdefault("handled_date", None)
        kwargs.setdefault("application_period_begin", utc_start_of_day() + timedelta(days=2))
        return cls.create(**kwargs)

    @classmethod
    def create_in_status_open(cls, **kwargs: Any) -> ApplicationRound:
        """Create an open application round."""
        kwargs.setdefault("sent_date", None)
        kwargs.setdefault("handled_date", None)
        kwargs.setdefault("application_period_begin", utc_start_of_day() - timedelta(days=2))
        kwargs.setdefault("application_period_end", utc_start_of_day() + timedelta(days=2))
        return cls.create(**kwargs)

    @classmethod
    def create_in_status_in_allocation(cls, **kwargs: Any) -> ApplicationRound:
        """Create an application round in allocation."""
        kwargs.setdefault("sent_date", None)
        kwargs.setdefault("handled_date", None)
        kwargs.setdefault("application_period_begin", utc_start_of_day() - timedelta(days=2))
        kwargs.setdefault("application_period_end", utc_start_of_day() - timedelta(days=2))
        return cls.create(**kwargs)

    @classmethod
    def create_in_status_handled(cls, **kwargs: Any) -> ApplicationRound:
        """Create a handled application round."""
        kwargs.setdefault("sent_date", None)
        kwargs.setdefault("handled_date", utc_start_of_day())
        kwargs.setdefault("application_period_begin", utc_start_of_day() - timedelta(days=2))
        kwargs.setdefault("application_period_end", utc_start_of_day() - timedelta(days=2))
        return cls.create(**kwargs)

    @classmethod
    def create_in_status_result_sent(cls, **kwargs: Any) -> ApplicationRound:
        """Create an application round with results sent."""
        kwargs.setdefault("sent_date", utc_start_of_day())
        kwargs.setdefault("handled_date", utc_start_of_day())
        kwargs.setdefault("application_period_begin", utc_start_of_day() - timedelta(days=2))
        kwargs.setdefault("application_period_end", utc_start_of_day() - timedelta(days=2))
        return cls.create(**kwargs)

    @factory.post_generation
    def purposes(self, create: bool, purposes: Iterable[Purpose] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not purposes and kwargs:
            from .purpose import PurposeFactory

            self.purposes.add(PurposeFactory.create(**kwargs))

        for purpose in purposes or []:
            self.purposes.add(purpose)

    @factory.post_generation
    def reservation_units(
        self,
        create: bool,
        reservation_units: Iterable[ReservationUnit] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not reservation_units and kwargs:
            from .reservation_unit import ReservationUnitFactory

            self.reservation_units.add(ReservationUnitFactory.create(**kwargs))

        for reservation_unit in reservation_units or []:
            self.reservation_units.add(reservation_unit)
