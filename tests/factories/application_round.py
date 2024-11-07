import datetime
from typing import Any, Self

import factory
from factory import LazyAttribute

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice
from tilavarauspalvelu.models import ApplicationRound
from utils.date_utils import local_start_of_day

from ._base import (
    FakerEN,
    FakerFI,
    FakerSV,
    ForeignKeyFactory,
    GenericDjangoModelFactory,
    ManyToManyFactory,
    ModelFactoryBuilder,
)

__all__ = [
    "ApplicationRoundBuilder",
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

    timestamp = factory.LazyFunction(local_start_of_day)  # private helper (see Meta.exclude)

    application_period_begin = factory.LazyAttribute(lambda i: i.timestamp)
    application_period_end = factory.LazyAttribute(lambda i: i.application_period_begin + datetime.timedelta(weeks=4))

    reservation_period_begin = factory.LazyAttribute(lambda i: i.timestamp.date())
    reservation_period_end = factory.LazyAttribute(lambda i: i.reservation_period_begin + datetime.timedelta(weeks=4))

    public_display_begin = factory.LazyAttribute(lambda i: i.timestamp)
    public_display_end = factory.LazyAttribute(lambda i: i.public_display_begin + datetime.timedelta(weeks=4))

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
                return cls.create_in_status_results_sent(**kwargs)

    @classmethod
    def create_in_status_upcoming(cls, **kwargs: Any) -> ApplicationRound:
        return ApplicationRoundBuilder().upcoming().create(**kwargs)

    @classmethod
    def create_in_status_open(cls, **kwargs: Any) -> ApplicationRound:
        return ApplicationRoundBuilder().open().create(**kwargs)

    @classmethod
    def create_in_status_in_allocation(cls, **kwargs: Any) -> ApplicationRound:
        return ApplicationRoundBuilder().in_allocation().create(**kwargs)

    @classmethod
    def create_in_status_handled(cls, **kwargs: Any) -> ApplicationRound:
        return ApplicationRoundBuilder().handled().create(**kwargs)

    @classmethod
    def create_in_status_results_sent(cls, **kwargs: Any) -> ApplicationRound:
        return ApplicationRoundBuilder().results_sent().create(**kwargs)


class ApplicationRoundBuilder(ModelFactoryBuilder[ApplicationRound]):
    factory = ApplicationRoundFactory

    def with_status(self, status: ApplicationRoundStatusChoice) -> Self:
        match status:
            case ApplicationRoundStatusChoice.UPCOMING:
                return self.upcoming()
            case ApplicationRoundStatusChoice.OPEN:
                return self.open()
            case ApplicationRoundStatusChoice.IN_ALLOCATION:
                return self.in_allocation()
            case ApplicationRoundStatusChoice.HANDLED:
                return self.handled()
            case ApplicationRoundStatusChoice.RESULTS_SENT:
                return self.results_sent()

    def upcoming(self) -> Self:
        return self.set(
            sent_date=None,
            handled_date=None,
            application_period_begin=local_start_of_day() + datetime.timedelta(days=2),
            application_period_end=local_start_of_day() + datetime.timedelta(days=4),
        )

    def open(self) -> Self:
        return self.set(
            sent_date=None,
            handled_date=None,
            application_period_begin=local_start_of_day() - datetime.timedelta(days=2),
            application_period_end=local_start_of_day() + datetime.timedelta(days=2),
        )

    def in_allocation(self) -> Self:
        return self.set(
            sent_date=None,
            handled_date=None,
            application_period_begin=local_start_of_day() - datetime.timedelta(days=4),
            application_period_end=local_start_of_day() - datetime.timedelta(days=2),
        )

    def handled(self) -> Self:
        return self.set(
            sent_date=None,
            handled_date=local_start_of_day(),
            application_period_begin=local_start_of_day() - datetime.timedelta(days=4),
            application_period_end=local_start_of_day() - datetime.timedelta(days=2),
        )

    def results_sent(self) -> Self:
        return self.set(
            sent_date=local_start_of_day(),
            handled_date=local_start_of_day(),
            application_period_begin=local_start_of_day() - datetime.timedelta(days=4),
            application_period_end=local_start_of_day() - datetime.timedelta(days=2),
        )
