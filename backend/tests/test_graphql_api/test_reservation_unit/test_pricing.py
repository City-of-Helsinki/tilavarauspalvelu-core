from __future__ import annotations

import datetime
from decimal import Decimal

import pytest

from tilavarauspalvelu.enums import PaymentType
from tilavarauspalvelu.models import ReservationUnit
from utils.date_utils import local_date

from tests.factories import (
    ReservationUnitAccessTypeFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    SpaceFactory,
)

from .helpers import (
    CREATE_MUTATION,
    UPDATE_MUTATION,
    get_create_draft_input_data,
    get_create_non_draft_input_data,
    get_pricing_data,
    get_update_draft_input_data,
    reservation_units_query,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# Query


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
    )

    graphql.login_with_superuser()
    query = reservation_units_query(fields="pk pricings { highestPrice }")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "pricings": [
            {"highestPrice": "10.00"},
            {"highestPrice": "11.00"},
        ],
    }
    assert response.node(1) == {
        "pk": reservation_unit_2.pk,
        "pricings": [
            {"highestPrice": "20.00"},
        ],
    }


# Create


def test_reservation_unit__create__pricing__is_not_required_for_drafts(graphql):
    graphql.login_with_superuser()
    input_data = get_create_draft_input_data()

    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.results["pk"])
    assert reservation_unit.pricings.count() == 0


def test_reservation_unit__create__pricing__must_have_one_active_pricing_if_not_draft__empty(graphql):
    graphql.login_with_superuser()

    input_data = get_create_non_draft_input_data(pricings=[])

    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is True, response
    assert response.error_message(0) == "At least one active pricing is required for non-draft reservation units."

    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__pricing__must_have_one_active_pricing_if_not_draft__not_active(graphql):
    tomorrow = local_date() + datetime.timedelta(days=1)
    pricing = get_pricing_data(begins=tomorrow.isoformat())

    input_data = get_create_non_draft_input_data(pricings=[pricing])

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is True, response
    assert response.error_message(0) == "At least one active pricing is required for non-draft reservation units."

    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__pricing__free_pricing_doesnt_require_price_information(graphql):
    pricing = get_pricing_data()
    del pricing["lowestPrice"]
    del pricing["highestPrice"]

    input_data = get_create_draft_input_data(pricings=[pricing])

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.results["pk"])
    assert reservation_unit.pricings.count() == 1

    pricing = reservation_unit.pricings.first()
    assert pricing.begins == datetime.date(2022, 9, 11)
    assert pricing.lowest_price == 0
    assert pricing.highest_price == 0
    assert pricing.lowest_price_net == 0
    assert pricing.highest_price_net == 0
    assert pricing.tax_percentage.value == Decimal(10)
    assert pricing.payment_type == PaymentType.ONLINE_OR_INVOICE


def test_reservation_unit__create__pricing__begins_is_required(graphql):
    pricing_data = get_pricing_data(begins=None)
    input_data = get_create_draft_input_data(pricings=pricing_data)

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is True, response

    del pricing_data["begins"]
    input_data = get_create_draft_input_data(pricings=pricing_data)

    response = graphql(CREATE_MUTATION, variables={"input": input_data})
    assert response.has_errors is True, response


def test_reservation_unit__create__pricing__lowest_price_is_higher_than_highest(graphql):
    pricing = get_pricing_data(lowestPrice=20, highestPrice=10)
    input_data = get_create_draft_input_data(pricings=[pricing])

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is True, response
    assert response.error_message(0) == "Highest price cannot be less than lowest price."

    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__pricing__missing_lowest_price(graphql):
    pricing_data = get_pricing_data()

    # Lowest price is assumed to be zero if missing
    del pricing_data["lowestPrice"]

    input_data = get_create_draft_input_data(pricings=[pricing_data])

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is False, response.errors


def test_reservation_unit__create__pricing__missing_highest_price(graphql):
    pricing_data = get_pricing_data()

    # Lowest price is assumed to be zero if missing
    del pricing_data["highestPrice"]

    input_data = get_create_draft_input_data(pricings=[pricing_data])

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "Highest price cannot be less than lowest price."

    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__pricing__payment_type_field_is_required(graphql):
    graphql.login_with_superuser()

    pricing_data = get_pricing_data()
    del pricing_data["paymentType"]

    input_data = get_create_draft_input_data(pricings=[pricing_data])

    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is True, response
    assert "Field 'paymentType' of required type 'PaymentType!' was not provided." in response.error_message(0)

    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__pricing__allow_only_one_pricing_per_date(graphql):
    input_data = get_create_draft_input_data(pricings=[get_pricing_data(), get_pricing_data()])

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is True, response
    assert response.error_message(0) == "Reservation unit can have only one pricing per date."

    assert ReservationUnit.objects.count() == 0


# Update


def test_reservation_unit__update__pricing__active_pricing_can_be_created_on_update(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])
    ReservationUnitAccessTypeFactory.create(reservation_unit=reservation_unit)

    assert reservation_unit.pricings.count() == 0

    # Update the reservation unit with active pricing
    update_data = {
        "pk": reservation_unit.pk,
        "isDraft": False,
        "pricings": [get_pricing_data()],
    }

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, variables={"input": update_data})

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 1


def test_reservation_unit__update__pricing__future_pricing_can_be_created_on_update(graphql):
    today = local_date()

    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])
    ReservationUnitAccessTypeFactory.create(reservation_unit=reservation_unit)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit, begins=today.isoformat())

    # Reservation unit already has an active pricing, add a future pricing
    tomorrow = local_date() + datetime.timedelta(days=1)

    update_data = {
        "pk": reservation_unit.pk,
        "isDraft": False,
        "pricings": [get_pricing_data(begins=tomorrow.isoformat())],
    }

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, variables={"input": update_data})

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 2


def test_reservation_unit__update__pricing__add_another_active_pricing(graphql):
    graphql.login_with_superuser()

    create_data = get_create_draft_input_data(pricings=[get_pricing_data(begins="2022-09-01")])

    response = graphql(CREATE_MUTATION, variables={"input": create_data})

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.results["pk"])

    pricings = list(reservation_unit.pricings.all())
    assert len(pricings) == 1

    update_data = get_update_draft_input_data(reservation_unit)
    update_data["pricings"] = [
        {"pk": pricings[0].pk},
        get_pricing_data(begins="2022-09-02"),  # Becomes the new active pricing
    ]

    response = graphql(UPDATE_MUTATION, variables={"input": update_data})

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 2


def test_reservation_unit__update__pricing__add_another_future_pricing(graphql):
    graphql.login_with_superuser()
    tomorrow = local_date() + datetime.timedelta(days=1)

    create_data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(),
            get_pricing_data(begins=tomorrow.isoformat()),
        ],
    )

    response = graphql(CREATE_MUTATION, variables={"input": create_data})

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.results["pk"])

    pricings = list(reservation_unit.pricings.all())
    assert len(pricings) == 2

    day_after_tomorrow = tomorrow + datetime.timedelta(days=1)

    update_data = get_update_draft_input_data(reservation_unit)
    update_data["pricings"] = [
        {"pk": pricings[0].pk},
        {"pk": pricings[1].pk},
        get_pricing_data(begins=day_after_tomorrow.isoformat()),  # Future pricing
    ]

    response = graphql(UPDATE_MUTATION, variables={"input": update_data})

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 3


def test_reservation_unit__update__pricing__remove_pricings(graphql):
    graphql.login_with_superuser()

    today = local_date()
    past_pricing_date = (today - datetime.timedelta(days=2)).isoformat()
    future_pricing_date = (today + datetime.timedelta(days=2)).isoformat()

    create_data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(begins=past_pricing_date),
            get_pricing_data(begins=today.isoformat()),
            get_pricing_data(begins=future_pricing_date),
        ],
    )

    response = graphql(CREATE_MUTATION, variables={"input": create_data})

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.results["pk"])

    pricings = list(reservation_unit.pricings.all())
    assert len(pricings) == 3

    active_pricing = reservation_unit.pricings.get(begins=today)

    # Remove past and future pricing
    update_data = get_update_draft_input_data(reservation_unit)
    update_data["pricings"] = [
        {"pk": active_pricing.pk},
    ]

    response = graphql(UPDATE_MUTATION, variables={"input": update_data})

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 2  # Past and active pricing
    assert reservation_unit.pricings.order_by("begins").last().pk == active_pricing.pk

    # Try to remove all pricings, which fails silently, as only future pricings can be removed (not past or active ones)
    update_data["pricings"] = []

    response = graphql(UPDATE_MUTATION, variables={"input": update_data})

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 2  # Past and active pricing
    assert reservation_unit.pricings.order_by("begins").last().pk == active_pricing.pk


def test_reservation_unit__update__pricing__not_including_active_pricing_while_future_exists(graphql):
    graphql.login_with_superuser()

    future_pricing_date = local_date() + datetime.timedelta(days=2)
    create_data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(),
            get_pricing_data(begins=future_pricing_date.isoformat()),
        ],
    )
    response = graphql(CREATE_MUTATION, variables={"input": create_data})

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.results["pk"])

    pricings = list(reservation_unit.pricings.all())
    assert len(pricings) == 2

    future_pricing = reservation_unit.pricings.get(begins=future_pricing_date)

    # Updating without including the active pricing does not remove it
    update_data = get_update_draft_input_data(reservation_unit)
    update_data["pricings"] = [
        {"pk": future_pricing.pk},
    ]

    response = graphql(UPDATE_MUTATION, variables={"input": update_data})

    assert response.has_errors is False, response.errors

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 2


def test_reservation_unit__update__pricing__pricings_not_sent_for_non_draft_reservation_unit(graphql):
    graphql.login_with_superuser()

    create_data = get_create_non_draft_input_data(pricings=[get_pricing_data()])
    response = graphql(CREATE_MUTATION, variables={"input": create_data})

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.results["pk"])

    pricings = list(reservation_unit.pricings.all())
    assert len(pricings) == 1

    update_data = get_update_draft_input_data(reservation_unit)
    update_data["isDraft"] = False
    update_data["accessTypes"] = []

    response = graphql(UPDATE_MUTATION, variables={"input": update_data})

    assert response.has_errors is False, response
