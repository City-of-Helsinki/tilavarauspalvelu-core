from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import PriceUnit

from tests.factories import PriceComponentFactory, PriceOptionFactory, PricingGroupFactory, UnitGroupFactory

from .helpers import pricing_group_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Pricing group ──


def test_pricing_group__query__components_and_options(graphql):
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group, name="Sports 1")
    option = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    component = PriceComponentFactory.create(
        pricing_group=pricing_group,
        price_option=option,
        valid_from=datetime.date(2026, 1, 1),
        amount=Decimal("12.50"),
        price_unit=PriceUnit.PER_HOUR,
    )

    fields = """
        pk
        nameFi
        components {
            pk
            validFrom
            validUntil
            amount
            priceUnit
            priceOption { pk nameFi }
            taxLevel { pk currentPercentage }
        }
    """
    query = pricing_group_query(fields=fields, id=to_global_id("PricingGroupNode", pricing_group.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "pk": pricing_group.pk,
        "nameFi": "Sports 1",
        "components": [
            {
                "pk": component.pk,
                "validFrom": "2026-01-01",
                "validUntil": None,
                "amount": "12.50",
                "priceUnit": PriceUnit.PER_HOUR,
                "priceOption": {"pk": option.pk, "nameFi": "Adults"},
                "taxLevel": {"pk": component.tax_level.pk, "currentPercentage": "25.50"},
            },
        ],
    }
