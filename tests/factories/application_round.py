from datetime import timedelta
from typing import Any

import factory
from factory import LazyAttribute

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice
from tilavarauspalvelu.models import ApplicationRound
from utils.date_utils import utc_start_of_day

from ._base import FakerEN, FakerFI, FakerSV, ForeignKeyFactory, GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "ApplicationRoundFactory",
]


class ApplicationRoundFactory(GenericDjangoModelFactory[ApplicationRound]):
    class Meta:
        model = ApplicationRound
        exclude = ["timestamp"]

    name = FakerFI("name")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("name")
    name_sv = FakerSV("name")

    criteria = FakerFI("sentence")
    criteria_fi = LazyAttribute(lambda i: i.name)
    criteria_en = FakerEN("sentence")
    criteria_sv = FakerSV("sentence")

    notes_when_applying = FakerFI("sentence")
    notes_when_applying_fi = LazyAttribute(lambda i: i.name)
    notes_when_applying_en = FakerEN("sentence")
    notes_when_applying_sv = FakerSV("sentence")

    timestamp = factory.LazyFunction(utc_start_of_day)  # private helper (see Meta.exclude)

    application_period_begin = factory.LazyAttribute(lambda i: i.timestamp)
    application_period_end = factory.LazyAttribute(lambda i: i.application_period_begin + timedelta(weeks=4))

    reservation_period_begin = factory.LazyAttribute(lambda i: i.timestamp.date())
    reservation_period_end = factory.LazyAttribute(lambda i: i.reservation_period_begin + timedelta(weeks=4))

    public_display_begin = factory.LazyAttribute(lambda i: i.timestamp)
    public_display_end = factory.LazyAttribute(lambda i: i.public_display_begin + timedelta(weeks=4))

    handled_date = None
    sent_date = None

    reservation_units = ManyToManyFactory("tests.factories.ReservationUnitFactory")
    purposes = ManyToManyFactory("tests.factories.ReservationPurposeFactory")
    terms_of_use = ForeignKeyFactory("tests.factories.TermsOfUseFactory")

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
