from __future__ import annotations

import pytest
from django.urls import reverse

from utils.date_utils import local_datetime

from tests.factories import ReservationUnitFactory, UnitFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_palvelukartta_api__reservation_units(api_client):
    unit_1 = UnitFactory.create(tprek_id="1234")
    reservation_unit_1 = ReservationUnitFactory.create(unit=unit_1)
    reservation_unit_2 = ReservationUnitFactory.create(unit=unit_1)

    unit_2 = UnitFactory.create(tprek_id="5678")
    ReservationUnitFactory.create(unit=unit_2)

    url = reverse("palvelukartta:reservation_units", args=["1234"])
    response = api_client.get(url)
    assert response.status_code == 200
    assert response.json() == [
        {
            "pk": reservation_unit_1.pk,
            "name_fi": reservation_unit_1.name_fi,
            "name_en": reservation_unit_1.name_en,
            "name_sv": reservation_unit_1.name_sv,
        },
        {
            "pk": reservation_unit_2.pk,
            "name_fi": reservation_unit_2.name_fi,
            "name_en": reservation_unit_2.name_en,
            "name_sv": reservation_unit_2.name_sv,
        },
    ]


def test_palvelukartta_api__reservation_units__only_visible(api_client):
    unit = UnitFactory.create(tprek_id="1234")
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    ReservationUnitFactory.create(unit=unit, publish_ends=local_datetime(year=2022, month=1, day=1))

    url = reverse("palvelukartta:reservation_units", args=["1234"])
    response = api_client.get(url)
    assert response.status_code == 200
    assert response.json() == [
        {
            "pk": reservation_unit.pk,
            "name_fi": reservation_unit.name_fi,
            "name_en": reservation_unit.name_en,
            "name_sv": reservation_unit.name_sv,
        },
    ]
