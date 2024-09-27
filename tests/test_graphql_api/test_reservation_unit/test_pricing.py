import datetime
from decimal import Decimal

import pytest

from tests.factories import TaxPercentageFactory
from tilavarauspalvelu.enums import PricingStatus, PricingType
from tilavarauspalvelu.models import ReservationUnit

from .helpers import CREATE_MUTATION, UPDATE_MUTATION, get_create_draft_input_data, get_pricing_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__create__pricing_is_not_required_for_drafts(graphql):
    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=get_create_draft_input_data())

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.filter(pk=response.first_query_object["pk"]).first()
    assert reservation_unit is not None
    assert reservation_unit.pricings.count() == 0


def test_reservation_unit__create__pricing_is_required_for_non_drafts(graphql):
    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=get_create_draft_input_data(isDraft=False))

    assert response.error_message() == "pricings is required and must have one ACTIVE and one optional FUTURE pricing"
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__allow_only_one_active_pricing(graphql):
    graphql.login_with_superuser()
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(begins="2022-09-10"),
            get_pricing_data(),
        ],
    )

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "reservation unit must have exactly one ACTIVE pricing"
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__allow_only_one_future_pricing(graphql):
    graphql.login_with_superuser()
    future_pricing_date = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()

    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(),
            get_pricing_data(begins=future_pricing_date, status=PricingStatus.PRICING_STATUS_FUTURE.value.upper()),
            get_pricing_data(begins=future_pricing_date, status=PricingStatus.PRICING_STATUS_FUTURE.value.upper()),
        ],
    )

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "reservation unit can have only one FUTURE pricing"
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__mutating_past_pricings_is_not_allowed(graphql):
    graphql.login_with_superuser()
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(),
            get_pricing_data(begins="2022-01-01", status=PricingStatus.PRICING_STATUS_PAST.value.upper()),
        ],
    )

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "only ACTIVE and FUTURE pricings can be mutated"
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__active_pricing_must_be_today_or_in_the_past(graphql):
    graphql.login_with_superuser()
    pricing_date = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()

    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(begins=pricing_date),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "ACTIVE pricing must be in the past or today"
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__future_pricing_must_be_in_the_future(graphql):
    graphql.login_with_superuser()
    pricing_date = datetime.date.today().isoformat()

    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(begins=pricing_date, status=PricingStatus.PRICING_STATUS_FUTURE.value.upper()),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "FUTURE pricing must be in the future"
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__free_pricing_doesnt_require_price_information(graphql):
    TaxPercentageFactory.create(value=Decimal("10.0"))
    TaxPercentageFactory.create(value=Decimal("0.0"))

    graphql.login_with_superuser()

    data = get_create_draft_input_data(
        pricings=[
            {
                "begins": datetime.date.today().strftime("%Y-%m-%d"),
                "pricingType": PricingType.FREE.value.upper(),
                "status": PricingStatus.PRICING_STATUS_ACTIVE.value.upper(),
            }
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.filter(pk=response.first_query_object["pk"]).first()
    assert reservation_unit is not None
    assert reservation_unit.pricings.count() == 1

    pricing = reservation_unit.pricings.first()
    assert pricing.begins == datetime.date.today()
    assert pricing.pricing_type == PricingType.FREE
    assert pricing.status == PricingStatus.PRICING_STATUS_ACTIVE
    assert pricing.lowest_price == 0
    assert pricing.highest_price == 0
    assert pricing.lowest_price_net == 0
    assert pricing.highest_price_net == 0
    assert pricing.tax_percentage.value == 0


def test_reservation_unit__update__active_pricing_can_be_created_on_update(graphql):
    graphql.login_with_superuser()

    data = get_create_draft_input_data()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.filter(pk=response.first_query_object["pk"]).first()
    assert reservation_unit is not None
    assert reservation_unit.pricings.count() == 0

    data["pk"] = reservation_unit.pk
    data["isDraft"] = False
    data["pricings"] = [
        get_pricing_data(begins="2022-09-16", lowestPrice="20.2", highestPrice="31.5"),
    ]

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 1


def test_reservation_unit__update__future_pricing_can_be_created_on_update(graphql):
    graphql.login_with_superuser()

    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(begins="2022-09-16"),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.filter(pk=response.first_query_object["pk"]).first()
    assert reservation_unit is not None
    assert reservation_unit.pricings.count() == 1

    future_pricing_date = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()

    data["pk"] = reservation_unit.pk
    data["pricings"][0]["pk"] = reservation_unit.pricings.first().pk
    data["pricings"].append(
        get_pricing_data(begins=future_pricing_date, status=PricingStatus.PRICING_STATUS_FUTURE.value.upper()),
    )

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 2


def test_reservation_unit__update__add_another_active_pricing(graphql):
    graphql.login_with_superuser()

    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(begins="2022-09-16"),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.filter(pk=response.first_query_object["pk"]).first()
    assert reservation_unit is not None
    assert reservation_unit.pricings.count() == 1

    data["pk"] = reservation_unit.pk
    data["pricings"] = [get_pricing_data()]

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "ACTIVE pricing is already defined. Only one ACTIVE pricing is allowed"

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 1


def test_reservation_unit__update__add_another_future_pricing(graphql):
    graphql.login_with_superuser()

    future_pricing_date = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(begins=future_pricing_date, status=PricingStatus.PRICING_STATUS_FUTURE.value.upper()),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.filter(pk=response.first_query_object["pk"]).first()
    assert reservation_unit is not None
    assert reservation_unit.pricings.count() == 1

    data["pk"] = reservation_unit.pk
    data["pricings"] = [
        get_pricing_data(begins=future_pricing_date, status=PricingStatus.PRICING_STATUS_FUTURE.value.upper()),
    ]

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "FUTURE pricing is already defined. Only one FUTURE pricing is allowed"

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 1


def test_reservation_unit__update__remove_pricings(graphql):
    graphql.login_with_superuser()

    future_pricing_date = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()
    data = get_create_draft_input_data(
        pricings=[
            get_pricing_data(),
            get_pricing_data(begins=future_pricing_date, status=PricingStatus.PRICING_STATUS_FUTURE.value.upper()),
        ],
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.filter(pk=response.first_query_object["pk"]).first()
    assert reservation_unit is not None
    assert reservation_unit.pricings.count() == 2

    data["pk"] = reservation_unit.pk
    data["pricings"] = []

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricings.count() == 0
