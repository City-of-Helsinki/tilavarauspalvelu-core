from __future__ import annotations

import pytest

from tilavarauspalvelu.models import Reservation, ReservationStatistic
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
