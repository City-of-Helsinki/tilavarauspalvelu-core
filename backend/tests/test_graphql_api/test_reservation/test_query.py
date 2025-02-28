from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING

import freezegun
import pytest
from freezegun import freeze_time
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import AccessType, CustomerTypeChoice, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.integrations.keyless_entry.typing import (
    PindoraReservationResponse,
    PindoraReservationSeriesAccessCodeValidity,
    PindoraReservationSeriesResponse,
    PindoraSeasonalBookingAccessCodeValidity,
    PindoraSeasonalBookingResponse,
)
from tilavarauspalvelu.models import PersonalInfoViewLog
from utils.date_utils import local_datetime

from tests.factories import (
    ApplicationSectionFactory,
    PaymentOrderFactory,
    RecurringReservationFactory,
    ReservationFactory,
    ReservationUnitFactory,
    UnitFactory,
    UnitGroupFactory,
    UserFactory,
)
from tests.helpers import patch_method

from .helpers import reservation_query, reservations_query

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__query__all_fields(graphql):
    # given:
    # - There is a reservation in the system
    # - A superuser is using the system
    reservation: Reservation = ReservationFactory.create(name="")
    graphql.login_with_superuser()

    # when:
    # - User queries for reservations with all fields
    fields = """
        accessCodeGeneratedAt
        accessCodeIsActive
        accessCodeShouldBeActive
        accessType
        ageGroup { minimum maximum }
        applyingForFreeOfCharge
        begin
        billingAddressCity
        billingAddressStreet
        billingAddressZip
        billingEmail
        billingFirstName
        billingLastName
        billingPhone
        bufferTimeAfter
        bufferTimeBefore
        cancelDetails
        cancelReason { reason }
        denyReason { reason }
        description
        end
        extUuid
        freeOfChargeReason
        handledAt
        handlingDetails
        homeCity { nameFi }
        isBlocked
        isHandled
        name
        numPersons
        order { orderUuid status paymentType receiptUrl checkoutUrl reservationPk refundUuid expiresInMinutes }
        price
        priceNet
        purpose { nameFi }
        recurringReservation { user { email } }
        reservationUnits { nameFi }
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
        staffEvent
        state
        taxPercentageValue
        type
        unitPrice
        user { email }
        workingMemo
    """
    query = reservations_query(fields=fields)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the reservation with all fields
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "accessCodeGeneratedAt": None,
        "accessCodeIsActive": False,
        "accessCodeShouldBeActive": False,
        "accessType": AccessType.UNRESTRICTED.value,
        "ageGroup": None,
        "applyingForFreeOfCharge": reservation.applying_for_free_of_charge,
        "begin": reservation.begin.isoformat(),
        "billingAddressCity": reservation.billing_address_city,
        "billingAddressStreet": reservation.billing_address_street,
        "billingAddressZip": reservation.billing_address_zip,
        "billingEmail": reservation.billing_email,
        "billingFirstName": reservation.billing_first_name,
        "billingLastName": reservation.billing_last_name,
        "billingPhone": reservation.billing_phone,
        "bufferTimeAfter": int(reservation.buffer_time_after.total_seconds()),
        "bufferTimeBefore": int(reservation.buffer_time_before.total_seconds()),
        "cancelDetails": reservation.cancel_details,
        "cancelReason": None,
        "denyReason": None,
        "description": reservation.description,
        "end": reservation.end.isoformat(),
        "extUuid": str(reservation.ext_uuid),
        "freeOfChargeReason": reservation.free_of_charge_reason,
        "handledAt": reservation.handled_at,
        "handlingDetails": reservation.handling_details,
        "homeCity": None,
        "isBlocked": False,
        "isHandled": False,
        "name": reservation.name,
        "numPersons": reservation.num_persons,
        "order": None,
        "price": f"{reservation.price:.2f}",
        "priceNet": f"{reservation.price_net:.2f}",
        "purpose": None,
        "recurringReservation": None,
        "reservationUnits": [],
        "reserveeAddressCity": reservation.reservee_address_city,
        "reserveeAddressStreet": reservation.reservee_address_street,
        "reserveeAddressZip": reservation.reservee_address_zip,
        "reserveeEmail": reservation.reservee_email,
        "reserveeFirstName": reservation.reservee_first_name,
        "reserveeId": reservation.reservee_id,
        "reserveeIsUnregisteredAssociation": reservation.reservee_is_unregistered_association,
        "reserveeLastName": reservation.reservee_last_name,
        "reserveeName": f"{reservation.reservee_first_name} {reservation.reservee_last_name}",
        "reserveeOrganisationName": reservation.reservee_organisation_name,
        "reserveePhone": reservation.reservee_phone,
        "reserveeType": reservation.reservee_type,
        "staffEvent": False,
        "state": reservation.state,
        "taxPercentageValue": f"{reservation.tax_percentage_value:.2f}",
        "type": reservation.type,
        "unitPrice": f"{reservation.unit_price:.2f}",
        "user": {"email": reservation.user.email},
        "workingMemo": reservation.working_memo,
    }


def test_reservation__query__single(graphql):
    reservation = ReservationFactory.create()

    graphql.login_with_superuser()
    global_id = to_global_id("ReservationNode", reservation.pk)
    query = reservation_query(id=global_id)

    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object["pk"] == reservation.pk


def test_reservation__query__reservee_name_for_individual_reservee(graphql):
    reservation = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        reservee_first_name="First",
        reservee_last_name="Last",
    )

    graphql.login_with_superuser()
    global_id = to_global_id("ReservationNode", reservation.pk)
    query = reservation_query(id=global_id, fields="pk reserveeName")

    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object["pk"] == reservation.pk
    assert response.first_query_object["reserveeName"] == "First Last"


def test_reservation__query__reservee_name_for_business_reservee(graphql):
    reservation = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.BUSINESS,
        reservee_organisation_name="Business Oy",
    )

    graphql.login_with_superuser()
    global_id = to_global_id("ReservationNode", reservation.pk)
    query = reservation_query(id=global_id, fields="pk reserveeName")

    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object["pk"] == reservation.pk
    assert response.first_query_object["reserveeName"] == "Business Oy"


def test_reservation__query__reservee_name_for_nonprofit_reservee(graphql):
    reservation = ReservationFactory(
        reservee_type=CustomerTypeChoice.NONPROFIT,
        reservee_organisation_name="Nonprofit Ry",
    )

    graphql.login_with_superuser()
    global_id = to_global_id("ReservationNode", reservation.pk)
    query = reservation_query(id=global_id, fields="pk reserveeName")

    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object["pk"] == reservation.pk
    assert response.first_query_object["reserveeName"] == "Nonprofit Ry"


def test_reservation__query__reservee_date_of_birth_is_not_shown_to_regular_user(graphql):
    reservation = ReservationFactory.create()

    graphql.login_with_regular_user()
    query = reservations_query(fields="pk user { dateOfBirth }")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "user": None}

    assert PersonalInfoViewLog.objects.first() is None


def test_reservation__query__reservee_date_of_birth_is_show_but_logged__general_admin(graphql):
    reservation = ReservationFactory.create()
    admin = UserFactory.create_with_general_role()

    graphql.force_login(admin)
    query = reservations_query(fields="pk user { dateOfBirth }")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation.pk,
        "user": {
            "dateOfBirth": reservation.user.date_of_birth.isoformat(),
        },
    }

    view_log: PersonalInfoViewLog | None = PersonalInfoViewLog.objects.first()
    assert view_log is not None
    assert view_log.user == reservation.user
    assert view_log.viewer_user == admin
    assert view_log.viewer_username == admin.username
    assert view_log.field == "User.date_of_birth"


def test_reservation__query__reservee_date_of_birth_is_show_but_logged__unit_admin(graphql):
    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])
    admin = UserFactory.create_with_unit_role(units=[unit])

    graphql.force_login(admin)
    query = reservations_query(fields="pk user { dateOfBirth }")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation.pk,
        "user": {
            "dateOfBirth": reservation.user.date_of_birth.isoformat(),
        },
    }

    view_log: PersonalInfoViewLog | None = PersonalInfoViewLog.objects.first()
    assert view_log is not None
    assert view_log.user == reservation.user
    assert view_log.viewer_user == admin
    assert view_log.viewer_username == admin.username
    assert view_log.field == "User.date_of_birth"


def test_reservation__query__reservee_date_of_birth_is_show_but_logged__unit_group_admin(graphql):
    unit_group = UnitGroupFactory.create()
    unit = UnitFactory.create(unit_groups=[unit_group])
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])
    admin = UserFactory.create_with_unit_role(unit_groups=[unit_group])

    graphql.force_login(admin)
    query = reservations_query(fields="pk user { dateOfBirth }")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation.pk,
        "user": {
            "dateOfBirth": reservation.user.date_of_birth.isoformat(),
        },
    }

    view_log: PersonalInfoViewLog | None = PersonalInfoViewLog.objects.first()
    assert view_log is not None
    assert view_log.user == reservation.user
    assert view_log.viewer_user == admin
    assert view_log.viewer_username == admin.username
    assert view_log.field == "User.date_of_birth"


def test_reservation__query__is_handled(graphql):
    reservation = ReservationFactory.create(handled_at=None)

    graphql.login_with_superuser()
    query = reservations_query(fields="pk isHandled")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "isHandled": False}

    reservation.handled_at = datetime.datetime(2022, 1, 1, 12)
    reservation.save()

    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "isHandled": True}


def test_reservation__query__is_blocked(graphql):
    reservation = ReservationFactory.create(type=ReservationTypeChoice.STAFF)

    graphql.login_with_superuser()
    query = reservations_query(fields="pk isBlocked")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "isBlocked": False}

    reservation.type = ReservationTypeChoice.BLOCKED
    reservation.save()

    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "isBlocked": True}


@freezegun.freeze_time()  # Freeze time for consistent 'expiresInMinutes' result
def test_reservation__query__order__all_fields(graphql):
    reservation = ReservationFactory.create()
    PaymentOrderFactory.create(
        reservation=reservation,
        remote_id="b3fef99e-6c18-422e-943d-cf00702af53e",
    )

    fields = "order { orderUuid status paymentType receiptUrl checkoutUrl reservationPk refundUuid expiresInMinutes }"
    query = reservations_query(fields=fields)

    graphql.login_with_superuser()
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.node(0) == {
        "order": {
            "reservationPk": str(reservation.pk),
            "checkoutUrl": None,
            "orderUuid": "b3fef99e-6c18-422e-943d-cf00702af53e",
            "paymentType": "INVOICE",
            "receiptUrl": None,
            "refundUuid": None,
            "status": "DRAFT",
            "expiresInMinutes": 5,
        }
    }


def test_reservation__query__reservation_unit_is_archived_but_data_is_still_returned_through_relation(graphql):
    reservation = ReservationFactory.create(reservation_units__is_archived=True)
    reservation_unit = reservation.reservation_units.first()

    graphql.login_with_superuser()
    global_id = to_global_id("ReservationNode", reservation.pk)

    fields = "pk reservationUnits { pk isArchived }"
    expected_response = {
        "pk": reservation.pk,
        "reservationUnits": [{"pk": reservation_unit.pk, "isArchived": True}],
    }

    # Single
    query = reservation_query(id=global_id, fields=fields)
    response = graphql(query)
    assert response.has_errors is False, response.errors
    assert response.first_query_object == expected_response

    # All
    query = reservations_query(fields=fields)
    response = graphql(query)
    assert response.has_errors is False, response.errors
    assert response.node(0) == expected_response


# Pindora responses


def pindora_response() -> PindoraReservationResponse:
    return PindoraReservationResponse(
        reservation_unit_id=uuid.uuid4(),
        access_code="12345",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a12345",
        access_code_valid_minutes_before=10,
        access_code_valid_minutes_after=5,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
    )


def pindora_query(reservation: Reservation) -> str:
    fields = """
        pindoraInfo {
            accessCode
            accessCodeGeneratedAt
            accessCodeIsActive
            accessCodeKeypadUrl
            accessCodePhoneNumber
            accessCodeSmsNumber
            accessCodeSmsMessage
            accessCodeBeginsAt
            accessCodeEndsAt
        }
    """
    global_id = to_global_id("ReservationNode", reservation.pk)
    return reservation_query(fields=fields, id=global_id)


@freeze_time(local_datetime(2022, 1, 1))
def test_reservation__query__pindora_info(graphql):
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
    )

    query = pindora_query(reservation)

    graphql.force_login(reservation.user)

    with patch_method(PindoraClient.get_reservation, return_value=pindora_response()):
        response = graphql(query)

    assert response.has_errors is False, response

    assert response.first_query_object["pindoraInfo"] == {
        "accessCode": "12345",
        "accessCodeIsActive": True,
        "accessCodeGeneratedAt": "2022-01-01T00:00:00+02:00",
        "accessCodeKeypadUrl": "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        "accessCodePhoneNumber": "+358407089833",
        "accessCodeSmsMessage": "a12345",
        "accessCodeSmsNumber": "+358407089834",
        "accessCodeBeginsAt": "2022-01-01T11:50:00+02:00",
        "accessCodeEndsAt": "2022-01-01T13:05:00+02:00",
    }


@freeze_time(local_datetime(2022, 1, 1))
@pytest.mark.parametrize("as_reservee", [True, False])
def test_reservation__query__pindora_info__access_code_not_active(graphql, as_reservee):
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
    )

    query = pindora_query(reservation)

    if as_reservee:
        graphql.force_login(reservation.user)
    else:
        graphql.login_with_superuser()

    response = pindora_response()
    response["access_code_is_active"] = False

    with patch_method(PindoraClient.get_reservation, return_value=response):
        response = graphql(query)

    assert response.has_errors is False, response

    if as_reservee:
        assert response.first_query_object["pindoraInfo"] is None
    else:
        assert response.first_query_object["pindoraInfo"] is not None


@freeze_time(local_datetime(2022, 1, 1))
@pytest.mark.parametrize("as_reservee", [True, False])
def test_reservation__query__pindora_info__not_confirmed(graphql, as_reservee):
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
    )

    query = pindora_query(reservation)

    if as_reservee:
        graphql.force_login(reservation.user)
    else:
        graphql.login_with_superuser()

    with patch_method(PindoraClient.get_reservation, return_value=pindora_response()):
        response = graphql(query)

    assert response.has_errors is False, response

    if as_reservee:
        assert response.first_query_object["pindoraInfo"] is None
    else:
        assert response.first_query_object["pindoraInfo"] is not None


@freeze_time(local_datetime(2022, 1, 1))
def test_reservation__query__pindora_info__access_type_not_access_code(graphql):
    reservation = ReservationFactory.create(
        access_type=AccessType.UNRESTRICTED,
        state=ReservationStateChoice.CONFIRMED,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
    )

    query = pindora_query(reservation)

    graphql.force_login(reservation.user)

    with patch_method(PindoraClient.get_reservation, return_value=pindora_response()):
        response = graphql(query)

    assert response.has_errors is False, response

    assert response.first_query_object["pindoraInfo"] is None


@freeze_time(local_datetime(2022, 1, 1))
def test_reservation__query__pindora_info__pindora_call_fails(graphql):
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
    )

    query = pindora_query(reservation)

    graphql.force_login(reservation.user)

    with patch_method(PindoraClient.get_reservation, side_effect=PindoraAPIError("Error")):
        response = graphql(query)

    assert response.has_errors is False, response

    assert response.first_query_object["pindoraInfo"] is None


@freeze_time(local_datetime(2022, 1, 1))
def test_reservation__query__pindora_info__pindora_data_cached(graphql):
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
    )

    query = pindora_query(reservation)

    graphql.force_login(reservation.user)

    data = pindora_response()
    PindoraClient._cache_reservation_response(data=data, ext_uuid=reservation.ext_uuid)

    with patch_method(PindoraClient.get) as pindora_api:
        response = graphql(query)

    # cache was used, no API call was made
    assert pindora_api.called is False

    assert response.has_errors is False, response

    assert response.first_query_object["pindoraInfo"] == {
        "accessCode": "12345",
        "accessCodeIsActive": True,
        "accessCodeGeneratedAt": "2022-01-01T00:00:00+02:00",
        "accessCodeKeypadUrl": "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        "accessCodePhoneNumber": "+358407089833",
        "accessCodeSmsMessage": "a12345",
        "accessCodeSmsNumber": "+358407089834",
        "accessCodeBeginsAt": "2022-01-01T11:50:00+02:00",
        "accessCodeEndsAt": "2022-01-01T13:05:00+02:00",
    }


@freeze_time(local_datetime(2022, 1, 3))
def test_reservation__query__pindora_info__reservation_past(graphql):
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
    )

    query = pindora_query(reservation)

    graphql.force_login(reservation.user)

    with patch_method(PindoraClient.get_reservation, return_value=pindora_response()):
        response = graphql(query)

    assert response.has_errors is False, response

    assert response.first_query_object["pindoraInfo"] is None


@freeze_time(local_datetime(2022, 1, 1))
def test_reservation__query__pindora_info__in_recurring_reservation(graphql):
    series = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
        recurring_reservation=series,
    )

    query = pindora_query(reservation)

    graphql.force_login(reservation.user)

    response = PindoraReservationSeriesResponse(
        reservation_unit_id=uuid.uuid4(),
        access_code="12345",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a12345",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
                begin=local_datetime(2022, 1, 1, 12),
                end=local_datetime(2022, 1, 1, 13),
            ),
        ],
    )

    with patch_method(PindoraClient.get_reservation_series, return_value=response):
        response = graphql(query)

    assert response.has_errors is False, response

    assert response.first_query_object["pindoraInfo"] == {
        "accessCode": "12345",
        "accessCodeIsActive": True,
        "accessCodeGeneratedAt": "2022-01-01T00:00:00+02:00",
        "accessCodeKeypadUrl": "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        "accessCodePhoneNumber": "+358407089833",
        "accessCodeSmsMessage": "a12345",
        "accessCodeSmsNumber": "+358407089834",
        "accessCodeBeginsAt": "2022-01-01T11:50:00+02:00",
        "accessCodeEndsAt": "2022-01-01T13:05:00+02:00",
    }


@freeze_time(local_datetime(2022, 1, 1))
def test_reservation__query__pindora_info__in_application_section(graphql):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
        application__application_round__sent_date=local_datetime(2022, 1, 1),
    )
    series = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
    )

    query = pindora_query(reservation)

    graphql.force_login(reservation.user)

    response = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a12345",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=series.reservation_unit.uuid,
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
                begin=reservation.begin,
                end=reservation.end,
            ),
        ],
    )

    with patch_method(PindoraClient.get_seasonal_booking, return_value=response):
        response = graphql(query)

    assert response.has_errors is False, response

    assert response.first_query_object["pindoraInfo"] == {
        "accessCode": "12345",
        "accessCodeIsActive": True,
        "accessCodeGeneratedAt": "2022-01-01T00:00:00+02:00",
        "accessCodeKeypadUrl": "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        "accessCodePhoneNumber": "+358407089833",
        "accessCodeSmsMessage": "a12345",
        "accessCodeSmsNumber": "+358407089834",
        "accessCodeBeginsAt": "2022-01-01T11:50:00+02:00",
        "accessCodeEndsAt": "2022-01-01T13:05:00+02:00",
    }


@freeze_time(local_datetime(2022, 1, 1))
def test_reservation__query__pindora_info__in_application_section__not_sent(graphql):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
        application__application_round__sent_date=None,
    )
    series = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
    )

    query = pindora_query(reservation)

    graphql.force_login(reservation.user)

    response = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a12345",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=uuid.uuid4(),
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
                begin=local_datetime(2022, 1, 1, 12),
                end=local_datetime(2022, 1, 1, 13),
            ),
        ],
    )

    with patch_method(PindoraClient.get_seasonal_booking, return_value=response):
        response = graphql(query)

    assert response.has_errors is False, response

    assert response.first_query_object["pindoraInfo"] is None
