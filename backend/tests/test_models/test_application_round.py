from __future__ import annotations

import datetime

import pytest
from lookup_property import L

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice
from tilavarauspalvelu.models import ApplicationRound

from tests.factories import ApplicationRoundFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_round__status():
    now = datetime.datetime.now(tz=datetime.UTC)
    application_round = ApplicationRoundFactory.create(
        application_period_begins_at=now + datetime.timedelta(days=1),
        application_period_ends_at=now + datetime.timedelta(days=2),
    )

    # Application round application period has not started -> application round is UPCOMING
    assert application_round.status == ApplicationRoundStatusChoice.UPCOMING
    assert ApplicationRound.objects.filter(L(status=ApplicationRoundStatusChoice.UPCOMING)).exists()

    # Application round application period has started, but has not ended -> application round is OPEN
    application_round.application_period_begins_at = now - datetime.timedelta(days=2)
    application_round.save()
    assert application_round.status == ApplicationRoundStatusChoice.OPEN
    assert ApplicationRound.objects.filter(L(status=ApplicationRoundStatusChoice.OPEN)).exists()

    # Application round application period has ended, but has not ended -> application round is IN_ALLOCATION
    application_round.application_period_ends_at = now - datetime.timedelta(days=1)
    application_round.save()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION
    assert ApplicationRound.objects.filter(L(status=ApplicationRoundStatusChoice.IN_ALLOCATION)).exists()

    # Application round has been handled -> application round is HANDLED
    application_round.handled_at = now
    application_round.save()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED
    assert ApplicationRound.objects.filter(L(status=ApplicationRoundStatusChoice.HANDLED)).exists()

    # Application round has been sent -> application round is RESULTS_SENT
    application_round.sent_at = now
    application_round.save()
    assert application_round.status == ApplicationRoundStatusChoice.RESULTS_SENT
    assert ApplicationRound.objects.filter(L(status=ApplicationRoundStatusChoice.RESULTS_SENT)).exists()
