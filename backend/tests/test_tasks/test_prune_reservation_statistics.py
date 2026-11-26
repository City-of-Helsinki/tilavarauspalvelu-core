from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from dateutil.relativedelta import relativedelta

from tilavarauspalvelu.models import ReservationStatistic
from tilavarauspalvelu.tasks import prune_reservation_statistics_task
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory

if TYPE_CHECKING:
    from pytest_django import DjangoCaptureOnCommitCallbacks, Settings

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_prune_reservation_statistics__deletes_in_the_given_time(
    settings: Settings, django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks
) -> None:
    settings.SAVE_RESERVATION_STATISTICS = True

    five_years_ago = local_datetime() - relativedelta(years=5)
    four_years_ago = local_datetime() - relativedelta(years=4)

    with django_capture_on_commit_callbacks(execute=True):
        delete = ReservationFactory.create(created_at=five_years_ago, name="DELETE ME")
        keep = ReservationFactory.create(created_at=four_years_ago, name="KEEP ME")

    prune_reservation_statistics_task()

    assert ReservationStatistic.objects.filter(reservation=delete).exists() is False
    assert ReservationStatistic.objects.filter(reservation=keep).count() == 1
