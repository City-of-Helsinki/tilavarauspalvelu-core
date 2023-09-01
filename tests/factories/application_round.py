from datetime import date, timedelta

import factory
from django.utils.timezone import now
from factory import fuzzy

from applications.models import ApplicationRound, ApplicationRoundStatus

from ._base import GenericDjangoModelFactory

__all__ = [
    "ApplicationRoundFactory",
    "ApplicationRoundStatusFactory",
]


class ApplicationRoundFactory(GenericDjangoModelFactory[ApplicationRound]):
    class Meta:
        model = ApplicationRound

    name = fuzzy.FuzzyText()
    target_group = fuzzy.FuzzyChoice(
        choices=(
            ApplicationRound.TARGET_GROUP_INTERNAL,
            ApplicationRound.TARGET_GROUP_PUBLIC,
            ApplicationRound.TARGET_GROUP_ALL,
        )
    )
    service_sector = factory.SubFactory("tests.factories.ServiceSectorFactory")
    application_period_begin = fuzzy.FuzzyDateTime(
        start_dt=now(),
        end_dt=now(),
    )
    application_period_end = fuzzy.FuzzyDateTime(
        start_dt=now() + timedelta(weeks=4),
        end_dt=now() + timedelta(weeks=4),
    )
    reservation_period_begin = fuzzy.FuzzyDate(
        start_date=date.today(),
        end_date=date.today(),
    )
    reservation_period_end = fuzzy.FuzzyDate(
        start_date=date.today() + timedelta(days=1),
        end_date=date.today() + timedelta(weeks=4),
    )
    public_display_begin = fuzzy.FuzzyDateTime(
        start_dt=now(),
        end_dt=now(),
    )
    public_display_end = fuzzy.FuzzyDateTime(
        start_dt=now() + timedelta(weeks=4),
        end_dt=now() + timedelta(weeks=4),
    )

    @factory.post_generation
    def purposes(self, create, purposes, **kwargs):
        if not create or not purposes:
            return

        for purpose in purposes:
            self.purposes.add(purpose)

    @factory.post_generation
    def reservation_units(self, create, reservation_units, **kwargs):
        if not create or not reservation_units:
            return

        for reservation_unit in reservation_units:
            self.reservation_units.add(reservation_unit)


class ApplicationRoundStatusFactory(GenericDjangoModelFactory[ApplicationRoundStatus]):
    class Meta:
        model = ApplicationRoundStatus

    status = fuzzy.FuzzyChoice(
        choices=[
            ApplicationRoundStatus.DRAFT,
            ApplicationRoundStatus.IN_REVIEW,
            ApplicationRoundStatus.REVIEW_DONE,
            ApplicationRoundStatus.ALLOCATED,
            ApplicationRoundStatus.RESERVING,
            ApplicationRoundStatus.HANDLED,
            ApplicationRoundStatus.SENDING,
            ApplicationRoundStatus.SENT,
            ApplicationRoundStatus.ARCHIVED,
        ]
    )
    application_round = factory.SubFactory("tests.factories.ApplicationRoundFactory")
