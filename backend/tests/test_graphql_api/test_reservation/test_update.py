from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import CustomerTypeChoice, ReservationTypeChoice
from utils.date_utils import local_datetime

from tests.factories import (
    AgeGroupFactory,
    CityFactory,
    ReservationFactory,
    ReservationMetadataSetFactory,
    ReservationPurposeFactory,
)

from .helpers import UPDATE_MUTATION, get_update_data, mock_profile_reader

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__update(graphql):
    reservation = ReservationFactory.create_for_update()

    graphql.login_with_superuser()
    data = get_update_data(reservation)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.name == "foo"


def test_reservation__update__with_additional_data(graphql):
    reservation = ReservationFactory.create_for_update()

    age_group = AgeGroupFactory.create(minimum=18, maximum=30)
    city = CityFactory.create(name="Helsinki")
    purpose = ReservationPurposeFactory.create(name="Test purpose")

    additional_data = {
        "ageGroup": age_group.pk,
        "applyingForFreeOfCharge": True,
        "billingAddressCity": "Turku",
        "billingAddressStreet": "Auratie 12B",
        "billingAddressZip": "20100",
        "billingEmail": "jane.doe@example.com",
        "billingFirstName": "Jane",
        "billingLastName": "Doe",
        "billingPhone": "+358234567890",
        "description": "Test description",
        "freeOfChargeReason": "Free of charge reason",
        "homeCity": city.pk,
        "name": "Test reservation",
        "numPersons": 1,
        "purpose": purpose.pk,
        "reserveeAddressCity": "Helsinki",
        "reserveeAddressStreet": "Mannerheimintie 2",
        "reserveeAddressZip": "00100",
        "reserveeEmail": "john.doe@example.com",
        "reserveeFirstName": "John",
        "reserveeId": "2882333-2",
        "reserveeIsUnregisteredAssociation": False,
        "reserveeLastName": "Doe",
        "reserveeOrganisationName": "Test Organisation ry",
        "reserveePhone": "+358123456789",
        "reserveeType": CustomerTypeChoice.INDIVIDUAL.value,
    }

    graphql.login_with_superuser()
    data = get_update_data(reservation, **additional_data)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()

    assert reservation.age_group.maximum == 30
    assert reservation.age_group.minimum == 18
    assert reservation.applying_for_free_of_charge is True
    assert reservation.billing_address_city == "Turku"
    assert reservation.billing_address_street == "Auratie 12B"
    assert reservation.billing_address_zip == "20100"
    assert reservation.billing_email == "jane.doe@example.com"
    assert reservation.billing_first_name == "Jane"
    assert reservation.billing_last_name == "Doe"
    assert reservation.billing_phone == "+358234567890"
    assert reservation.buffer_time_after == datetime.timedelta()
    assert reservation.buffer_time_before == datetime.timedelta()
    assert reservation.description == "Test description"
    assert reservation.free_of_charge_reason == "Free of charge reason"
    assert reservation.home_city.name == "Helsinki"
    assert reservation.name == "Test reservation"
    assert reservation.num_persons == 1
    assert reservation.purpose.name == "Test purpose"
    assert reservation.reservee_address_city == "Helsinki"
    assert reservation.reservee_address_street == "Mannerheimintie 2"
    assert reservation.reservee_address_zip == "00100"
    assert reservation.reservee_email == "john.doe@example.com"
    assert reservation.reservee_first_name == "John"
    assert reservation.reservee_id == "2882333-2"
    assert reservation.reservee_is_unregistered_association is False
    assert reservation.reservee_last_name == "Doe"
    assert reservation.reservee_organisation_name == "Test Organisation ry"
    assert reservation.reservee_phone == "+358123456789"
    assert reservation.reservee_type == "INDIVIDUAL"
    assert reservation.type == ReservationTypeChoice.NORMAL


def test_reservation__update__cannot_update_price(graphql):
    reservation = ReservationFactory.create_for_update()

    graphql.login_with_superuser()
    data = get_update_data(reservation, price=0)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # Actual error doesn't matter too much, as long as price can't be updated.
    assert response.has_schema_errors


def test_reservation__update__cannot_update_time(graphql):
    reservation = ReservationFactory.create_for_update()

    graphql.login_with_superuser()
    data = get_update_data(reservation, beginsAt=local_datetime().isoformat())
    response = graphql(UPDATE_MUTATION, input_data=data)

    # Actual error doesn't matter too much, as long as price can't be updated.
    assert response.has_schema_errors


def test_reservation__update__regular_user(graphql):
    reservation = ReservationFactory.create_for_update()

    graphql.login_with_regular_user()
    input_data = get_update_data(reservation)
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."


def test_reservation__update__all_required_fields_are_filled(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic()
    reservation = ReservationFactory.create_for_update(
        reservation_units__metadata_set=metadata_set,
    )

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    data["reserveeEmail"] = "john.doe@example.com"
    data["reserveePhone"] = "+358123456789"

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == data["reserveeFirstName"]
    assert reservation.reservee_last_name == data["reserveeLastName"]
    assert reservation.reservee_email == data["reserveeEmail"]
    assert reservation.reservee_phone == data["reserveePhone"]


def test_reservation__update__missing_reservee_id_for_unregistered_organisation(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic(
        supported_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_is_unregistered_association",
            "reservee_id",
        ],
        required_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_is_unregistered_association",
            "reservee_id",
        ],
    )
    reservation = ReservationFactory.create_for_update(
        reservation_units__metadata_set=metadata_set,
        reservee_id="",
    )

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    # Note: Reservee ID is missing!
    data["reserveeIsUnregisteredAssociation"] = True

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == data["reserveeFirstName"]
    assert reservation.reservee_last_name == data["reserveeLastName"]
    assert reservation.reservee_is_unregistered_association is True
    assert reservation.reservee_id == ""


def test_reservation__update__missing_home_city_for_individual(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic(
        supported_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "home_city",
        ],
        required_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "home_city",
        ],
    )
    reservation = ReservationFactory.create_for_update(reservation_units__metadata_set=metadata_set)
    CityFactory.create(name="Helsinki")  # Create some city, but it should not be used

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    data["reserveeType"] = CustomerTypeChoice.INDIVIDUAL.value

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == data["reserveeFirstName"]
    assert reservation.reservee_last_name == data["reserveeLastName"]
    assert reservation.reservee_type == CustomerTypeChoice.INDIVIDUAL.value
    assert reservation.home_city is None


def test_reservation__update__missing_reservee_id_for_individual(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic(
        supported_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "reservee_id",
        ],
        required_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "reservee_id",
        ],
    )
    reservation = ReservationFactory.create_for_update(
        reservation_units__metadata_set=metadata_set,
        reservee_id="",
    )
    CityFactory.create(name="Helsinki")  # Create some city, but it should not be used

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    data["reserveeType"] = CustomerTypeChoice.INDIVIDUAL.value

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == data["reserveeFirstName"]
    assert reservation.reservee_last_name == data["reserveeLastName"]
    assert reservation.reservee_type == CustomerTypeChoice.INDIVIDUAL.value
    assert reservation.reservee_id == ""


def test_reservation__update__missing_reservee_organisation_name_for_individual(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic(
        supported_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "reservee_organisation_name",
        ],
        required_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "reservee_organisation_name",
        ],
    )
    reservation = ReservationFactory.create_for_update(
        reservation_units__metadata_set=metadata_set,
        reservee_organisation_name="",
    )
    CityFactory.create(name="Helsinki")  # Create some city, but it should not be used

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    data["reserveeType"] = CustomerTypeChoice.INDIVIDUAL.value

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == data["reserveeFirstName"]
    assert reservation.reservee_last_name == data["reserveeLastName"]
    assert reservation.reservee_type == CustomerTypeChoice.INDIVIDUAL.value
    assert reservation.reservee_organisation_name == ""


def test_reservation__update__some_required_fields_are_missing(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic()
    reservation = ReservationFactory.create_for_update(reservation_units__metadata_set=metadata_set, reservee_phone="")

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    data["reserveeEmail"] = "john.doe@example.com"

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Value for required field 'reservee_phone' is missing."]


def test_reservation__update__already_has_max_reservations_per_user(graphql):
    reservation = ReservationFactory.create_for_update(reservation_units__max_reservations_per_user=1)

    graphql.login_with_superuser()
    update_data = get_update_data(reservation)
    response = graphql(UPDATE_MUTATION, input_data=update_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.name == "foo"


def test_reservation__update__require_free_of_charge_reason_if_applying_for_free_of_charge(graphql):
    reservation = ReservationFactory.create_for_update()

    graphql.login_with_superuser()
    data = get_update_data(reservation, applyingForFreeOfCharge=True)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Free of charge reason is mandatory when applying for free of charge."]


def test_reservation__update__reservation_details_does_not_get_overridden_with_profile_data(graphql, settings):
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True

    reservation = ReservationFactory.create_for_update(
        reservee_first_name="Jane",
        reservee_last_name="Doe",
    )

    graphql.login_with_superuser()
    data = get_update_data(reservation)
    with mock_profile_reader():
        response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == "Jane"
