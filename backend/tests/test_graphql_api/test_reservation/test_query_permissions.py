from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import MunicipalityChoice, ReservationStateChoice, ReservationTypeChoice, ReserveeType

from tests.factories import (
    AgeGroupFactory,
    PaymentOrderFactory,
    ReservationFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
    UnitFactory,
    UserFactory,
)

from .helpers import reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__query__regular_user_cannot_see_working_memo_for_other_users_reservation(graphql):
    user = UserFactory.create()
    reservation = ReservationFactory.create(working_memo="foo")

    graphql.force_login(user)
    query = reservations_query(fields="pk workingMemo")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "workingMemo": None}


def test_reservation__query__staff_user_can_see_working_memo_for_own_reservation(graphql):
    user = UserFactory.create_with_general_role()
    reservation = ReservationFactory.create(working_memo="foo", user=user)

    graphql.force_login(user)
    query = reservations_query(fields="pk workingMemo")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "workingMemo": "foo"}


def test_reservation__query__general_admin_can_see_working_memo_for_any_reservation(graphql):
    reservation = ReservationFactory.create(working_memo="foo")
    admin = UserFactory.create_with_general_role()

    graphql.force_login(admin)
    query = reservations_query(fields="pk workingMemo")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "workingMemo": "foo"}


def test_reservation__query__unit_admin_can_see_working_memo_for_reservations_in_their_units(graphql):
    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    admin = UserFactory.create_with_unit_role(units=[unit])
    reservation = ReservationFactory.create(working_memo="foo", reservation_unit=reservation_unit)

    graphql.force_login(admin)
    query = reservations_query(fields="pk workingMemo")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "workingMemo": "foo"}


def test_reservation__query__unit_admin_cannot_see_working_memo_for_reservations_other_units(graphql):
    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.create()
    admin = UserFactory.create_with_unit_role(units=[unit])
    reservation = ReservationFactory.create(working_memo="foo", reservation_unit=reservation_unit)

    graphql.force_login(admin)
    query = reservations_query(fields="pk workingMemo")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "workingMemo": None}


def test_reservation__query__regular_user_cannot_see_personal_information_from_other_reservations(graphql):
    reservation = ReservationFactory.create()
    graphql.login_with_regular_user()

    fields = """
        pk
        name
        user { email }
        reserveeFirstName
        reserveeLastName
        reserveePhone
        reserveeEmail
        reserveeAddressZip
        reserveeOrganisationName
        reserveeName
        freeOfChargeReason
        description
        reserveeIdentifier
        cancelDetails
        municipality
        reserveeType
        applyingForFreeOfCharge
        numPersons
        ageGroup { minimum, maximum }
        purpose { nameFi }
        unitPrice
        price
        priceNet
        taxPercentageValue
        isHandled
        accessType
        accessCodeGeneratedAt
        accessCodeIsActive
        accessCodeShouldBeActive
        isAccessCodeIsActiveCorrect
    """

    query = reservations_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation.pk,
        "ageGroup": None,
        "applyingForFreeOfCharge": None,
        "cancelDetails": None,
        "description": None,
        "freeOfChargeReason": None,
        "municipality": None,
        "isHandled": None,
        "name": None,
        "numPersons": None,
        "price": None,
        "priceNet": None,
        "purpose": None,
        "reserveeAddressZip": None,
        "reserveeEmail": None,
        "reserveeFirstName": None,
        "reserveeIdentifier": None,
        "reserveeLastName": None,
        "reserveeName": None,
        "reserveeOrganisationName": None,
        "reserveePhone": None,
        "reserveeType": None,
        "taxPercentageValue": None,
        "unitPrice": None,
        "user": None,
        "accessCodeShouldBeActive": None,
        "isAccessCodeIsActiveCorrect": None,
        "accessType": None,
        "accessCodeGeneratedAt": None,
        "accessCodeIsActive": None,
    }


def test_reservation__query__fields_requiring_staff_permissions__superuser(graphql):
    reservation = ReservationFactory.create(
        type=ReservationTypeChoice.STAFF,
        working_memo="foo",
        handling_details="bar",
        handled_at=datetime.datetime(2022, 1, 1, 12, tzinfo=datetime.UTC),
    )

    fields = """
        pk
        type
        workingMemo
        handlingDetails
        handledAt
    """
    graphql.login_with_superuser()
    query = reservations_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation.pk,
        "type": ReservationTypeChoice.STAFF.value,
        "workingMemo": reservation.working_memo,
        "handlingDetails": reservation.handling_details,
        "handledAt": reservation.handled_at.isoformat(),
    }


def test_reservation__query__fields_requiring_staff_permissions__regular_user(graphql):
    reservation = ReservationFactory.create(
        type=ReservationTypeChoice.STAFF,
        working_memo="foo",
        handling_details="bar",
        handled_at=datetime.datetime(2022, 1, 1, 12),
    )

    fields = """
        pk
        type
        workingMemo
        handlingDetails
        handledAt
    """
    graphql.login_with_regular_user()
    query = reservations_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation.pk,
        "type": None,
        "workingMemo": None,
        "handlingDetails": None,
        "handledAt": None,
    }


def test_reservation__query__reservation_owner_can_see_personal_information_from_own_reservation(graphql):
    reservation = ReservationFactory.create(
        age_group=AgeGroupFactory.create(),
        applying_for_free_of_charge=True,
        cancel_details="cancel details",
        description="desc",
        free_of_charge_reason="reason",
        municipality=MunicipalityChoice.HELSINKI,
        name="foo",
        num_persons=1,
        price=123,
        purpose=ReservationPurposeFactory.create(),
        reservee_address_zip="123",
        reservee_email="foo@email.com",
        reservee_first_name="John",
        reservee_identifier="reservee id",
        reservee_last_name="Doe",
        reservee_organisation_name="org",
        reservee_phone="123",
        reservee_type=ReserveeType.COMPANY,
        state=ReservationStateChoice.CREATED,
        tax_percentage_value=24,
        type=ReservationTypeChoice.STAFF,
        unit_price=100,
        user=UserFactory.create(),
    )

    PaymentOrderFactory.create(reservation=reservation)

    graphql.force_login(reservation.user)

    fields = """
        pk
        ageGroup { minimum, maximum }
        applyingForFreeOfCharge
        cancelDetails
        description
        freeOfChargeReason
        municipality
        isHandled
        name
        numPersons
        paymentOrder { orderUuid status paymentType receiptUrl checkoutUrl refundUuid expiresInMinutes reservation {pk}}
        price
        priceNet
        purpose { nameFi }
        reserveeAddressZip
        reserveeEmail
        reserveeFirstName
        reserveeIdentifier
        reserveeLastName
        reserveeName
        reserveeOrganisationName
        reserveePhone
        reserveeType
        taxPercentageValue
        type
        unitPrice
        user { email }
    """

    query = reservations_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0)["pk"] == reservation.pk
    assert response.node(0)["ageGroup"] is not None, "field not found"
    assert response.node(0)["applyingForFreeOfCharge"] is not None, "field not found"
    assert response.node(0)["cancelDetails"] is not None, "field not found"
    assert response.node(0)["description"] is not None, "field not found"
    assert response.node(0)["freeOfChargeReason"] is not None, "field not found"
    assert response.node(0)["municipality"] is not None, "field not found"
    assert response.node(0)["isHandled"] is not None, "field not found"
    assert response.node(0)["name"] is not None, "field not found"
    assert response.node(0)["numPersons"] is not None, "field not found"
    assert response.node(0)["paymentOrder"] is not None, "field not found"
    assert response.node(0)["price"] is not None, "field not found"
    assert response.node(0)["priceNet"] is not None, "field not found"
    assert response.node(0)["purpose"] is not None, "field not found"
    assert response.node(0)["reserveeAddressZip"] is not None, "field not found"
    assert response.node(0)["reserveeEmail"] is not None, "field not found"
    assert response.node(0)["reserveeFirstName"] is not None, "field not found"
    assert response.node(0)["reserveeIdentifier"] is not None, "field not found"
    assert response.node(0)["reserveeLastName"] is not None, "field not found"
    assert response.node(0)["reserveeName"] is not None, "field not found"
    assert response.node(0)["reserveeOrganisationName"] is not None, "field not found"
    assert response.node(0)["reserveePhone"] is not None, "field not found"
    assert response.node(0)["reserveeType"] is not None, "field not found"
    assert response.node(0)["taxPercentageValue"] is not None, "field not found"
    assert response.node(0)["type"] is not None, "field not found"
    assert response.node(0)["unitPrice"] is not None, "field not found"
    assert response.node(0)["user"] is not None, "field not found"
