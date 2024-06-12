import datetime

import pytest

from reservations.choices import CustomerTypeChoice, ReservationStateChoice, ReservationTypeChoice
from tests.factories import (
    AgeGroupFactory,
    CityFactory,
    PaymentOrderFactory,
    ReservationFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
    UnitFactory,
    UserFactory,
)
from tests.helpers import UserType

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
    # 'Staff user' here is any user with permission, but not the specific permission for this endpoint
    staff_user = UserFactory.create_with_general_permissions(perms=["can_manage_general_roles"])
    reservation = ReservationFactory.create(working_memo="foo", user=staff_user)

    graphql.force_login(staff_user)
    query = reservations_query(fields="pk workingMemo")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "workingMemo": "foo"}


def test_reservation__query__general_admin_can_see_working_memo_for_any_reservation(graphql):
    reservation = ReservationFactory.create(working_memo="foo")
    admin = UserFactory.create_with_general_permissions(perms=["can_view_reservations"])

    graphql.force_login(admin)
    query = reservations_query(fields="pk workingMemo")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "workingMemo": "foo"}


def test_reservation__query__unit_admin_can_see_working_memo_for_reservations_in_their_units(graphql):
    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    admin = UserFactory.create_with_unit_permissions(unit=unit, perms=["can_view_reservations"])
    reservation = ReservationFactory.create(working_memo="foo", reservation_unit=[reservation_unit])

    graphql.force_login(admin)
    query = reservations_query(fields="pk workingMemo")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "workingMemo": "foo"}


def test_reservation__query__unit_admin_cannot_see_working_memo_for_reservations_other_units(graphql):
    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.create()
    admin = UserFactory.create_with_unit_permissions(unit=unit, perms=["can_view_reservations"])
    reservation = ReservationFactory.create(working_memo="foo", reservation_unit=[reservation_unit])

    graphql.force_login(admin)
    query = reservations_query(fields="pk workingMemo")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "workingMemo": None}


def test_reservation__query__regular_user_cannot_see_personal_information_from_other_reservations(graphql):
    reservation = ReservationFactory.create()
    graphql.login_user_based_on_type(UserType.REGULAR)

    fields = """
        pk
        name
        user { email }
        reserveeFirstName
        reserveeLastName
        reserveePhone
        reserveeEmail
        reserveeAddressStreet
        reserveeAddressCity
        reserveeAddressZip
        reserveeOrganisationName
        reserveeName
        freeOfChargeReason
        billingFirstName
        billingLastName
        billingAddressStreet
        billingAddressCity
        billingAddressZip
        billingPhone
        billingEmail
        description
        reserveeId
        cancelDetails
        order { orderUuid status paymentType receiptUrl checkoutUrl reservationPk refundUuid expiresInMinutes }
        homeCity { nameFi }
        reserveeType
        reserveeIsUnregisteredAssociation
        applyingForFreeOfCharge
        numPersons
        ageGroup { minimum, maximum }
        purpose { nameFi }
        unitPrice
        price
        priceNet
        taxPercentageValue
        isHandled
    """

    query = reservations_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation.pk,
        "ageGroup": None,
        "applyingForFreeOfCharge": None,
        "billingAddressCity": None,
        "billingAddressStreet": None,
        "billingAddressZip": None,
        "billingEmail": None,
        "billingFirstName": None,
        "billingLastName": None,
        "billingPhone": None,
        "cancelDetails": None,
        "description": None,
        "freeOfChargeReason": None,
        "homeCity": None,
        "isHandled": None,
        "name": None,
        "numPersons": None,
        "order": None,
        "price": None,
        "priceNet": None,
        "purpose": None,
        "reserveeAddressCity": None,
        "reserveeAddressStreet": None,
        "reserveeAddressZip": None,
        "reserveeEmail": None,
        "reserveeFirstName": None,
        "reserveeId": None,
        "reserveeIsUnregisteredAssociation": None,
        "reserveeLastName": None,
        "reserveeName": None,
        "reserveeOrganisationName": None,
        "reserveePhone": None,
        "reserveeType": None,
        "taxPercentageValue": None,
        "unitPrice": None,
        "user": None,
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
        staffEvent
        type
        workingMemo
        handlingDetails
        handledAt
    """
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation.pk,
        "staffEvent": True,
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
        staffEvent
        type
        workingMemo
        handlingDetails
        handledAt
    """
    graphql.login_user_based_on_type(UserType.REGULAR)
    query = reservations_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation.pk,
        "staffEvent": None,
        "type": None,
        "workingMemo": None,
        "handlingDetails": None,
        "handledAt": None,
    }


def test_reservation__query__reservation_owner_can_see_personal_information_from_own_reservation(graphql):
    reservation = ReservationFactory.create(
        age_group=AgeGroupFactory.create(),
        applying_for_free_of_charge=True,
        billing_address_city="billing city",
        billing_address_street="billing street",
        billing_address_zip="billing zip",
        billing_email="billing email",
        billing_first_name="billing first",
        billing_last_name="billing last",
        billing_phone="billing phone",
        cancel_details="cancel details",
        description="desc",
        free_of_charge_reason="reason",
        home_city=CityFactory.create(),
        name="foo",
        num_persons=1,
        price=123,
        price_net=100,
        purpose=ReservationPurposeFactory.create(),
        reservee_address_city="city",
        reservee_address_street="street",
        reservee_address_zip="123",
        reservee_email="foo@email.com",
        reservee_first_name="John",
        reservee_id="reservee id",
        reservee_is_unregistered_association=True,
        reservee_last_name="Doe",
        reservee_organisation_name="org",
        reservee_phone="123",
        reservee_type=CustomerTypeChoice.BUSINESS,
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
        billingAddressCity
        billingAddressStreet
        billingAddressZip
        billingEmail
        billingFirstName
        billingLastName
        billingPhone
        cancelDetails
        description
        freeOfChargeReason
        homeCity { nameFi }
        isHandled
        name
        numPersons
        order { orderUuid status paymentType receiptUrl checkoutUrl reservationPk refundUuid expiresInMinutes }
        price
        priceNet
        purpose { nameFi }
        reserveeAddressCity
        reserveeAddressStreet
        reserveeAddressZip
        reserveeEmail
        reserveeFirstName
        reserveeId
        reserveeIsUnregisteredAssociation
        reserveeLastName
        reserveeName
        reserveeOrganisationName
        reserveePhone
        reserveeType
        taxPercentageValue
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
    assert response.node(0)["billingAddressCity"] is not None, "field not found"
    assert response.node(0)["billingAddressStreet"] is not None, "field not found"
    assert response.node(0)["billingAddressZip"] is not None, "field not found"
    assert response.node(0)["billingEmail"] is not None, "field not found"
    assert response.node(0)["billingFirstName"] is not None, "field not found"
    assert response.node(0)["billingLastName"] is not None, "field not found"
    assert response.node(0)["billingPhone"] is not None, "field not found"
    assert response.node(0)["cancelDetails"] is not None, "field not found"
    assert response.node(0)["description"] is not None, "field not found"
    assert response.node(0)["freeOfChargeReason"] is not None, "field not found"
    assert response.node(0)["homeCity"] is not None, "field not found"
    assert response.node(0)["isHandled"] is not None, "field not found"
    assert response.node(0)["name"] is not None, "field not found"
    assert response.node(0)["numPersons"] is not None, "field not found"
    assert response.node(0)["order"] is not None, "field not found"
    assert response.node(0)["price"] is not None, "field not found"
    assert response.node(0)["priceNet"] is not None, "field not found"
    assert response.node(0)["purpose"] is not None, "field not found"
    assert response.node(0)["reserveeAddressCity"] is not None, "field not found"
    assert response.node(0)["reserveeAddressStreet"] is not None, "field not found"
    assert response.node(0)["reserveeAddressZip"] is not None, "field not found"
    assert response.node(0)["reserveeEmail"] is not None, "field not found"
    assert response.node(0)["reserveeFirstName"] is not None, "field not found"
    assert response.node(0)["reserveeId"] is not None, "field not found"
    assert response.node(0)["reserveeIsUnregisteredAssociation"] is not None, "field not found"
    assert response.node(0)["reserveeLastName"] is not None, "field not found"
    assert response.node(0)["reserveeName"] is not None, "field not found"
    assert response.node(0)["reserveeOrganisationName"] is not None, "field not found"
    assert response.node(0)["reserveePhone"] is not None, "field not found"
    assert response.node(0)["reserveeType"] is not None, "field not found"
    assert response.node(0)["taxPercentageValue"] is not None, "field not found"
    assert response.node(0)["unitPrice"] is not None, "field not found"
    assert response.node(0)["user"] is not None, "field not found"
