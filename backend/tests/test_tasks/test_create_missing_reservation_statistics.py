from __future__ import annotations

import pytest
from dateutil.relativedelta import relativedelta

from tilavarauspalvelu.models import Reservation, ReservationStatistic
from tilavarauspalvelu.tasks import create_missing_reservation_statistics_task
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory


@pytest.mark.django_db
def test_create_missing_reservation_statistics_task():
    reservation = ReservationFactory.create()

    assert ReservationStatistic.objects.exists() is False

    create_missing_reservation_statistics_task()

    statistics = list(ReservationStatistic.objects.all())

    assert len(statistics) == 1
    assert statistics[0].reservation == reservation


@pytest.mark.django_db
def test_create_missing_reservation_statistics__limit_and_batches():
    reservation_1 = ReservationFactory.create()
    reservation_2 = ReservationFactory.create()
    reservation_3 = ReservationFactory.create()
    reservation_4 = ReservationFactory.create()

    Reservation.objects.filter(pk=reservation_1.pk).upsert_statistics()

    Reservation.objects.create_missing_statistics(limit=2, batch_size=1)

    reservation_pks = list(ReservationStatistic.objects.order_by("reservation").values_list("reservation", flat=True))

    assert reservation_pks == [reservation_1.pk, reservation_2.pk, reservation_3.pk]

    Reservation.objects.create_missing_statistics(limit=2, batch_size=1)

    reservation_pks = list(ReservationStatistic.objects.order_by("reservation").values_list("reservation", flat=True))

    assert reservation_pks == [reservation_1.pk, reservation_2.pk, reservation_3.pk, reservation_4.pk]


@pytest.mark.django_db
def test_create_missing_reservation_statistics__skip_reservations_past_retention(settings):
    settings.REMOVE_RESERVATION_STATS_OLDER_THAN_YEARS = 5

    created_at = local_datetime() - relativedelta(years=5, days=1)
    ReservationFactory.create(created_at=created_at)
    reservation = ReservationFactory.create()

    Reservation.objects.create_missing_statistics(limit=10, batch_size=10)

    reservation_pks = list(ReservationStatistic.objects.values_list("reservation", flat=True))

    assert reservation_pks == [reservation.pk]
