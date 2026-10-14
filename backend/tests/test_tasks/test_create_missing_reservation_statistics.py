from __future__ import annotations

import pytest

from tilavarauspalvelu.models import ReservationStatistic
from tilavarauspalvelu.tasks import create_missing_reservation_statistics_task

from tests.factories import ReservationFactory


@pytest.mark.django_db
def test_create_missing_reservation_statistics_task():
    reservation = ReservationFactory.create()

    assert ReservationStatistic.objects.exists() is False

    create_missing_reservation_statistics_task()

    statistics = list(ReservationStatistic.objects.all())

    assert len(statistics) == 1
    assert statistics[0].reservation == reservation
