from __future__ import annotations

import datetime
from decimal import Decimal

import pytest

from tilavarauspalvelu.enums import PaymentType, PriceUnit
from tilavarauspalvelu.models import ReservationUnit, ReservationUnitPricing
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_date

from tests.factories import (
    ReservationUnitAccessTypeFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    SpaceFactory,
    TaxPercentageFactory,
)

from .helpers import (
    CREATE_MUTATION,
    UPDATE_MUTATION,
    get_create_draft_input_data,
    get_create_non_draft_input_data,
    get_pricing_data,
    reservation_units_query,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__query__pricing__old_pricings_not_returned(graphql):
    today = local_date()

    reservation_unit = ReservationUnitFactory.create()

    # Past, Active and Future pricings
    ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=today - datetime.timedelta(days=1),
        highest_price=9,
    )
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit, begins=today, highest_price=10)
    ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit, begins=today + datetime.timedelta(days=1), highest_price=11
    )

    # Only active pricing, which has been active for a while
    reservation_unit_2 = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit_2,
        begins=today - datetime.timedelta(days=10),
        highest_price=20,
        is_activated_on_begins=True,
    )

    graphql.login_with_superuser()
    query = reservation_units_query(fields="pk pricings { highestPrice isActivatedOnBegins }")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "pricings": [
            {"highestPrice": "10.00", "isActivatedOnBegins": False},
            {"highestPrice": "11.00", "isActivatedOnBegins": False},
        ],
    }
    assert response.node(1) == {
        "pk": reservation_unit_2.pk,
        "pricings": [
            {"highestPrice": "20.00", "isActivatedOnBegins": True},
        ],
    }


def test_reservation_unit__query__pricing__disabled_tax_percentage_returned(graphql):
    tax_percentage = TaxPercentageFactory.create(is_enabled=False, value=24)

    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=local_date(),
        tax_percentage=tax_percentage,
    )

    graphql.login_with_superuser()

    query = reservation_units_query(fields="pk pricings { taxPercentage { value isEnabled } }")
    response = graphql(query)

    assert response.has_errors is False, response.errors

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "pricings": [
            {
                "taxPercentage": {
                    "value": "24.00",
                    "isEnabled": False,
                },
            },
        ],
    }


# Create


def test_reservation_unit__create__pricing__is_not_required_for_drafts(graphql):
    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=get_create_draft_input_data())

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 0


def test_reservation_unit__create__pricing__is_required_for_non_drafts(graphql):
    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=get_create_draft_input_data(isDraft=False))

    assert response.has_errors is True, response
    assert response.field_error_codes()[0] == error_codes.RESERVATION_UNIT_PRICINGS_MISSING
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__pricing__free_pricing_doesnt_require_price_information(graphql):
    tax_percentage = TaxPercentageFactory.create(value=Decimal("0.0"))

    graphql.login_with_superuser()
    data = get_create_draft_input_data(
        pricings=[
            {
                "begins": local_date().isoformat(),
                "taxPercentage": tax_percentage.id,
            },
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 1

    pricing = reservation_unit.pricings.first()
    assert pricing.begins == local_date()
    assert pricing.lowest_price == 0
    assert pricing.highest_price == 0
    assert pricing.lowest_price_net == 0
    assert pricing.highest_price_net == 0
    assert pricing.tax_percentage.value == 0
    assert pricing.payment_type is None


def test_reservation_unit__create__pricing__begins_is_required(graphql):
    graphql.login_with_superuser()

    pricing_data = get_pricing_data(begins=None)
    response = graphql(CREATE_MUTATION, input_data=get_create_draft_input_data(pricings=pricing_data))
    assert response.has_errors is True, response

    del pricing_data["begins"]
    response = graphql(CREATE_MUTATION, input_data=get_create_draft_input_data(pricings=pricing_data))
    assert response.has_errors is True, response


def test_reservation_unit__create__pricing__lowest_price_is_higher_than_highest(graphql):
    graphql.login_with_superuser()

    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(
                lowestPrice=20,
                highestPrice=10,
            )
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is True, response
    assert response.field_error_codes()[0] == error_codes.RESERVATION_UNIT_PRICINGS_INVALID_PRICES
    assert ReservationUnit.objects.count() == 0


@pytest.mark.parametrize("missing_field", ["lowestPrice", "highestPrice"])
def test_reservation_unit__create__pricing__missing_one_price_field(graphql, missing_field):
    graphql.login_with_superuser()

    pricing_data = get_pricing_data()
    del pricing_data[missing_field]
    data = get_create_draft_input_data(pricings=[pricing_data])
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is True, response
    assert response.field_error_codes()[0] == error_codes.RESERVATION_UNIT_PRICINGS_INVALID_PRICES
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__pricing__payment_type_field_is_required(graphql):
    graphql.login_with_superuser()

    pricing_data = get_pricing_data()
    del pricing_data["paymentType"]
    data = get_create_draft_input_data(pricings=[pricing_data])
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is True, response
    assert response.field_error_codes()[0] == error_codes.RESERVATION_UNIT_PRICING_NO_PAYMENT_TYPE
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__pricing__allow_only_one_pricing_per_date(graphql):
    graphql.login_with_superuser()
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(),
            get_pricing_data(),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is True, response
    assert response.field_error_codes()[0] == error_codes.RESERVATION_UNIT_PRICINGS_DUPLICATE_DATE
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__pricing__creating_future_pricing_without_active_is_blocked(graphql):
    graphql.login_with_superuser()
    tomorrow = local_date() + datetime.timedelta(days=1)
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(begins=tomorrow.isoformat()),
        ],
    )

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is True, response
    assert response.field_error_codes()[0] == error_codes.RESERVATION_UNIT_PRICINGS_NO_ACTIVE_PRICING
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__pricing__cannot_use_disabled_tax_percentage(graphql):
    tax_percentage = TaxPercentageFactory.create(is_enabled=False, value=Decimal("11.0"))

    input_data = get_create_draft_input_data(
        pricings=[
            {
                "begins": "2022-09-11",
                "priceUnit": PriceUnit.PER_15_MINS.value.upper(),
                "lowestPrice": "18.2",
                "highestPrice": "21.5",
                "taxPercentage": tax_percentage.id,
                "paymentType": PaymentType.ONLINE_OR_INVOICE,
            },
        ],
    )

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is True, response
    assert response.error_message() == "Mutation was unsuccessful."

    # Since "Pricing <-> Tax Percentage" relation has the "limit_choices_to" constraint,
    # disabled pricings are treated as not existing in serializers.
    assert response.field_error_messages("pricings") == [
        {"taxPercentage": [f'Invalid pk "{tax_percentage.pk}" - object does not exist.']},
    ]

    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__pricing__material_pricing_allowed_tags(graphql):
    graphql.login_with_superuser()

    material_price_description = '<strong>Valid</strong> <a href="https://example.com" target="_blank" rel="">link</a>'

    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(materialPriceDescriptionFi=material_price_description),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response
    assert ReservationUnitPricing.objects.first().material_price_description_fi == material_price_description


def test_reservation_unit__create__pricing__material_pricing_blocked_tags(graphql):
    graphql.login_with_superuser()
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(materialPriceDescriptionFi="<h1>Title</h1> <script>alert('xss')</script>"),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response
    assert ReservationUnitPricing.objects.first().material_price_description_fi == "<h1>Title</h1> alert('xss')"


# Update


def test_reservation_unit__update__pricing__active_pricing_can_be_created_on_update(graphql):
    graphql.login_with_superuser()
    data = get_create_non_draft_input_data(pricings=[])
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 0

    # Update the reservation unit with active pricing
    data["pk"] = reservation_unit.pk
    data["isDraft"] = False
    data["pricings"] = [get_pricing_data()]
    data["accessTypes"] = []
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 1


def test_reservation_unit__update__pricing__future_pricing_can_be_created_on_update(graphql):
    graphql.login_with_superuser()
    today = local_date()
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(begins=today.isoformat()),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 1

    # Reservation unit already has an active pricing, add a future pricing
    tomorrow = today + datetime.timedelta(days=1)
    data["pk"] = reservation_unit.pk
    data["pricings"][0]["pk"] = reservation_unit.pricings.first().pk
    data["pricings"].append(get_pricing_data(begins=tomorrow.isoformat()))
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 2


def test_reservation_unit__update__pricing__add_another_active_pricing(graphql):
    graphql.login_with_superuser()
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(begins="2022-09-01"),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 1

    data["pk"] = reservation_unit.pk
    data["pricings"][0]["pk"] = reservation_unit.pricings.first().pk
    data["pricings"].append(get_pricing_data(begins="2022-09-02"))  # Becomes the new active pricing
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 2


def test_reservation_unit__update__pricing__add_another_future_pricing(graphql):
    graphql.login_with_superuser()
    tomorrow = local_date() + datetime.timedelta(days=1)
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(),
            get_pricing_data(begins=tomorrow.isoformat()),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 2

    day_after_tomorrow = tomorrow + datetime.timedelta(days=1)
    data["pk"] = reservation_unit.pk
    data["pricings"][0]["pk"] = reservation_unit.pricings.first().pk
    data["pricings"][1]["pk"] = reservation_unit.pricings.last().pk
    data["pricings"].append(get_pricing_data(begins=day_after_tomorrow.isoformat()))
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 3


def test_reservation_unit__update__pricing__remove_pricings(graphql):
    graphql.login_with_superuser()

    today = local_date()
    past_pricing_date = (today - datetime.timedelta(days=2)).isoformat()
    future_pricing_date = (today + datetime.timedelta(days=2)).isoformat()
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(begins=past_pricing_date),
            get_pricing_data(begins=today.isoformat()),
            get_pricing_data(begins=future_pricing_date),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 3

    # Remove past and future pricing from the payload
    data["pk"] = reservation_unit.pk
    data["pricings"].pop(0)  # Remove past pricing
    data["pricings"].pop(1)  # Remove future pricing
    active_pricing_pk = reservation_unit.pricings.filter(begins=today).first().pk
    data["pricings"][0]["pk"] = active_pricing_pk
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 2  # Past and active pricing
    assert reservation_unit.pricings.last().pk == active_pricing_pk

    # Try to remove all pricings, which fails silently, as only future pricings can be removed (not past or active ones)
    data["pricings"] = []
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 2  # Past and active pricing
    assert reservation_unit.pricings.last().pk == active_pricing_pk


def test_reservation_unit__update__pricing__remove_active_pricing_while_future_exists(graphql):
    graphql.login_with_superuser()

    future_pricing_date = local_date() + datetime.timedelta(days=2)
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(),
            get_pricing_data(begins=future_pricing_date.isoformat()),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 2

    # Remove active pricing
    data["pk"] = reservation_unit.pk
    data["pricings"].pop(0)
    data["pricings"][0]["pk"] = reservation_unit.pricings.first().pk
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is True, response
    assert response.field_error_codes()[0] == error_codes.RESERVATION_UNIT_PRICINGS_NO_ACTIVE_PRICING

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 2


def test_reservation_unit__update__pricing__pricings_not_sent_for_non_draft_reservation_unit(graphql):
    graphql.login_with_superuser()

    data = get_create_non_draft_input_data(pricings=[get_pricing_data()])
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 1

    data["pk"] = reservation_unit.pk
    data["isDraft"] = False
    del data["pricings"]
    data["accessTypes"] = []
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response


def test_reservation_unit__update__pricing__cannot_use_disabled_tax_percentage(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])
    ReservationUnitAccessTypeFactory.create(reservation_unit=reservation_unit)

    tax_percentage = TaxPercentageFactory.create(is_enabled=False, value=Decimal("10.0"))

    update_data = {
        "pk": reservation_unit.pk,
        "pricings": [
            {
                "begins": "2022-09-11",
                "priceUnit": PriceUnit.PER_15_MINS.value.upper(),
                "lowestPrice": "18.2",
                "highestPrice": "21.5",
                "taxPercentage": tax_percentage.id,
                "paymentType": PaymentType.ONLINE_OR_INVOICE,
            },
        ],
    }

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, variables={"input": update_data})

    assert response.has_errors is True, response
    assert response.error_message() == "Mutation was unsuccessful."

    # Since "Pricing <-> Tax Percentage" relation has the "limit_choices_to" constraint,
    # disabled pricings are treated as not existing in serializers.
    assert response.field_error_messages("pricings") == [
        {"taxPercentage": [f'Invalid pk "{tax_percentage.pk}" - object does not exist.']},
    ]
