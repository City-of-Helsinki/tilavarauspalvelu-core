from __future__ import annotations

import datetime

import pytest
from graphql_relay import to_global_id

from utils.date_utils import local_date

from tests.factories import ReservationUnitFactory, ReservationUnitPricingGroupFactory

from .helpers import reservation_unit_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Pricing groups ──


def test_reservation_unit__query__pricing_groups_exclude_past_rows(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create()

    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        begins=today - datetime.timedelta(days=20),
    )
    active = ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        begins=today - datetime.timedelta(days=10),
    )
    future = ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        begins=today + datetime.timedelta(days=10),
    )

    fields = "pricingGroups { begins pricingGroup { pk } }"
    query = reservation_unit_query(fields=fields, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "pricingGroups": [
            {"begins": active.begins.isoformat(), "pricingGroup": {"pk": active.pricing_group.pk}},
            {"begins": future.begins.isoformat(), "pricingGroup": {"pk": future.pricing_group.pk}},
        ],
    }


def test_reservation_unit__query__only_future_pricing_group(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create()
    future = ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        begins=today + datetime.timedelta(days=10),
    )

    fields = "pricingGroups { begins }"
    query = reservation_unit_query(fields=fields, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"pricingGroups": [{"begins": future.begins.isoformat()}]}
