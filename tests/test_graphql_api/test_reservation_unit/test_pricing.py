import datetime

import pytest

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.models import ReservationUnit
from utils.date_utils import local_date

from .helpers import CREATE_MUTATION, UPDATE_MUTATION, get_create_draft_input_data, get_pricing_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


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
    graphql.login_with_superuser()
    data = get_create_draft_input_data(
        pricings=[
            {
                "begins": local_date().isoformat(),
            }
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


def test_reservation_unit__update__pricing__active_pricing_can_be_created_on_update(graphql):
    graphql.login_with_superuser()
    data = get_create_draft_input_data()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 0

    # Update the reservation unit with active pricing
    data["pk"] = reservation_unit.pk
    data["isDraft"] = False
    data["pricings"] = [get_pricing_data()]
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

    future_pricing_date = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(),
            get_pricing_data(begins=future_pricing_date),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 2

    # Remove future pricing
    data["pk"] = reservation_unit.pk
    data["pricings"][0]["pk"] = reservation_unit.pricings.first().pk
    data["pricings"].pop(1)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 1
    assert reservation_unit.pricings.first().pk == data["pricings"][0]["pk"]

    # Remove all pricings
    data["pricings"] = []
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 0


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

    data = get_create_draft_input_data(pricings=[get_pricing_data()])
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.pricings.count() == 1

    data["pk"] = reservation_unit.pk
    data["isDraft"] = False
    del data["pricings"]
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response
