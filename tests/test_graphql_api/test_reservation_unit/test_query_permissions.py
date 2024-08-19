import datetime

import pytest

from tests.factories import (
    PaymentMerchantFactory,
    PaymentProductFactory,
    ReservationCancelReasonFactory,
    ReservationDenyReasonFactory,
    ReservationFactory,
    ReservationUnitFactory,
    UserFactory,
)
from tests.factories.application_round_time_slot import ApplicationRoundTimeSlotFactory
from users.models import PersonalInfoViewLog

from .helpers import reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__query__anonymous_user(graphql):
    reservation_unit = ReservationUnitFactory.create()
    ApplicationRoundTimeSlotFactory.create(reservation_unit=reservation_unit)

    fields = "applicationRoundTimeSlots { weekday closed reservableTimes { begin end } }"
    query = reservation_units_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1


def test_reservation_unit__query__regular_user(graphql):
    reservation_unit = ReservationUnitFactory.create()
    ApplicationRoundTimeSlotFactory.create(reservation_unit=reservation_unit)
    graphql.login_with_regular_user()

    fields = "applicationRoundTimeSlots { weekday closed reservableTimes { begin end } }"
    query = reservation_units_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1


SENSITIVE_FIELDS = """
    reservationSet {
        user {
            email
            dateOfBirth
        }
        reserveeLastName
        reserveeFirstName
        reserveePhone
        workingMemo
        handlingDetails
        reserveeEmail
        reserveeAddressStreet
        reserveeAddressCity
        reserveeAddressZip
        reserveeOrganisationName
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
        cancelReason {
            reason
        }
        denyReason {
            reason
        }
    }
"""


def test_reservation_unit__query__sensitive_information__regular_user(graphql):
    reservation_unit = ReservationUnitFactory.create()
    user = UserFactory.create(date_of_birth=datetime.date(2020, 1, 1))

    ReservationFactory.create(
        billing_address_city="Billing City",
        billing_address_street="Billing Street",
        billing_address_zip="Billing Zip",
        billing_email="billing@localhost",
        billing_first_name="Billing General",
        billing_last_name="Billing Admin",
        billing_phone="67890",
        cancel_details="Cancel Details",
        cancel_reason=ReservationCancelReasonFactory(reason="Cancel Reason"),
        deny_reason=ReservationDenyReasonFactory(reason="Deny Reason"),
        description="Description",
        free_of_charge_reason="Free of Charge Reason",
        handling_details="Handling Details",
        reservation_unit=[reservation_unit],
        reservee_address_city="City",
        reservee_address_street="Address",
        reservee_address_zip="Zip",
        reservee_email="admin@localhost",
        reservee_first_name="General",
        reservee_id="Reservee ID",
        reservee_last_name="Admin",
        reservee_organisation_name="Organisation",
        reservee_phone="123435",
        user=user,
        working_memo="Working Memo",
    )

    graphql.login_with_regular_user()
    query = reservation_units_query(fields=SENSITIVE_FIELDS)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {
        "reservationSet": [
            {
                "billingAddressCity": None,
                "billingAddressStreet": None,
                "billingAddressZip": None,
                "billingEmail": None,
                "billingFirstName": None,
                "billingLastName": None,
                "billingPhone": None,
                "cancelDetails": None,
                "cancelReason": None,
                "denyReason": None,
                "description": None,
                "freeOfChargeReason": None,
                "handlingDetails": None,
                "reserveeAddressCity": None,
                "reserveeAddressStreet": None,
                "reserveeAddressZip": None,
                "reserveeEmail": None,
                "reserveeFirstName": None,
                "reserveeId": None,
                "reserveeLastName": None,
                "reserveeOrganisationName": None,
                "reserveePhone": None,
                "user": None,
                "workingMemo": None,
            }
        ]
    }


def test_reservation_unit__query__sensitive_information__general_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()
    user = UserFactory.create(date_of_birth=datetime.date(2020, 1, 1))

    ReservationFactory.create(
        billing_address_city="Billing City",
        billing_address_street="Billing Street",
        billing_address_zip="Billing Zip",
        billing_email="billing@localhost",
        billing_first_name="Billing General",
        billing_last_name="Billing Admin",
        billing_phone="67890",
        cancel_details="Cancel Details",
        cancel_reason=ReservationCancelReasonFactory(reason="Cancel Reason"),
        deny_reason=ReservationDenyReasonFactory(reason="Deny Reason"),
        description="Description",
        free_of_charge_reason="Free of Charge Reason",
        handling_details="Handling Details",
        reservation_unit=[reservation_unit],
        reservee_address_city="City",
        reservee_address_street="Address",
        reservee_address_zip="Zip",
        reservee_email="admin@localhost",
        reservee_first_name="General",
        reservee_id="Reservee ID",
        reservee_last_name="Admin",
        reservee_organisation_name="Organisation",
        reservee_phone="123435",
        user=user,
        working_memo="Working Memo",
    )

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    query = reservation_units_query(fields=SENSITIVE_FIELDS)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {
        "reservationSet": [
            {
                "billingAddressCity": "Billing City",
                "billingAddressStreet": "Billing Street",
                "billingAddressZip": "Billing Zip",
                "billingEmail": "billing@localhost",
                "billingFirstName": "Billing General",
                "billingLastName": "Billing Admin",
                "billingPhone": "67890",
                "cancelDetails": "Cancel Details",
                "cancelReason": {
                    "reason": "Cancel Reason",
                },
                "denyReason": {
                    "reason": "Deny Reason",
                },
                "description": "Description",
                "freeOfChargeReason": "Free of Charge Reason",
                "handlingDetails": "Handling Details",
                "reserveeAddressCity": "City",
                "reserveeAddressStreet": "Address",
                "reserveeAddressZip": "Zip",
                "reserveeEmail": "admin@localhost",
                "reserveeFirstName": "General",
                "reserveeId": "Reservee ID",
                "reserveeLastName": "Admin",
                "reserveeOrganisationName": "Organisation",
                "reserveePhone": "123435",
                "user": {
                    "dateOfBirth": user.date_of_birth.isoformat(),
                    "email": user.email,
                },
                "workingMemo": "Working Memo",
            }
        ]
    }

    assert PersonalInfoViewLog.objects.count() == 1


def test_reservation_unit__query__payment_merchant__without_permissions(graphql):
    merchant = PaymentMerchantFactory.create()
    ReservationUnitFactory.create(payment_merchant=merchant)

    graphql.login_with_regular_user()
    query = reservation_units_query(fields="paymentMerchant { name }")
    response = graphql(query)

    assert response.error_message("paymentMerchant") == "No permission to access field."


def test_reservation_unit__query__payment_product__without_permissions(graphql):
    merchant = PaymentMerchantFactory.create()
    product = PaymentProductFactory.create(merchant=merchant)
    ReservationUnitFactory.create(payment_merchant=merchant, payment_product=product)

    graphql.login_with_regular_user()
    query = reservation_units_query(fields="paymentProduct { pk merchant { pk } }")
    response = graphql(query)

    assert response.error_message("paymentProduct") == "No permission to access field."
