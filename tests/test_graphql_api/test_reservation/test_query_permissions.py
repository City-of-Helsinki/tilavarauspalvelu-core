import datetime

import pytest

from reservations.choices import ReservationTypeChoice
from tests.factories import ReservationFactory, ReservationUnitFactory, UnitFactory, UserFactory
from tests.helpers import UserType

from .helpers import reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
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
    staff_user = UserFactory.create_staff_user()
    reservation = ReservationFactory.create(working_memo="foo", user=staff_user)

    graphql.force_login(staff_user)
    query = reservations_query(fields="pk workingMemo")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "workingMemo": "foo"}


def test_reservation__query__staff_user_can_see_working_memo_for_other_users_reservation(graphql):
    staff_user = UserFactory.create_staff_user()
    reservation = ReservationFactory.create(working_memo="foo")

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
        homeCity { name }
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
        "type": ReservationTypeChoice.STAFF.value.upper(),
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
        "handlingDetails": "",
        "handledAt": None,
    }
