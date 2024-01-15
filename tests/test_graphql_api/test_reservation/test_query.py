import datetime

import pytest

from reservations.choices import ReservationTypeChoice
from tests.factories import (
    ReservationFactory,
    ReservationUnitFactory,
    ServiceSectorFactory,
    UnitFactory,
    UnitGroupFactory,
    UserFactory,
)
from tests.helpers import UserType
from users.models import PersonalInfoViewLog

from .helpers import reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_reservation__query__all_fields(graphql):
    # given:
    # - There is a reservation in the system
    # - A superuser is using the system
    reservation = ReservationFactory.create(name="")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User queries for reservations with all fields
    fields = """
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
        freeOfChargeReason
        handledAt
        handlingDetails
        homeCity { name }
        isBlocked
        isHandled
        name
        numPersons
        orderStatus
        orderUuid
        price
        priceNet
        priority
        purpose { nameFi }
        recurringReservation { user }
        refundUuid
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
        "bufferTimeAfter": reservation.buffer_time_after,
        "bufferTimeBefore": reservation.buffer_time_before,
        "cancelDetails": reservation.cancel_details,
        "cancelReason": None,
        "denyReason": None,
        "description": reservation.description,
        "end": reservation.end.isoformat(),
        "freeOfChargeReason": reservation.free_of_charge_reason,
        "handledAt": reservation.handled_at,
        "handlingDetails": reservation.handling_details,
        "homeCity": None,
        "isBlocked": False,
        "isHandled": False,
        "name": reservation.name,
        "numPersons": reservation.num_persons,
        "orderStatus": None,
        "orderUuid": None,
        "price": float(reservation.price),
        "priceNet": "0.000000",
        "priority": f"A_{reservation.priority}",
        "purpose": None,
        "recurringReservation": None,
        "refundUuid": None,
        "reservationUnits": [],
        "reserveeAddressCity": reservation.reservee_address_city,
        "reserveeAddressStreet": reservation.reservee_address_street,
        "reserveeAddressZip": reservation.reservee_address_zip,
        "reserveeEmail": reservation.reservee_email,
        "reserveeFirstName": reservation.reservee_first_name,
        "reserveeId": reservation.reservee_id,
        "reserveeIsUnregisteredAssociation": reservation.reservee_is_unregistered_association,
        "reserveeLastName": reservation.reservee_last_name,
        "reserveeName": f"{reservation.user.first_name} {reservation.user.last_name}",
        "reserveeOrganisationName": reservation.reservee_organisation_name,
        "reserveePhone": reservation.reservee_phone,
        "reserveeType": reservation.reservee_type,
        "staffEvent": False,
        "state": reservation.state.value.upper(),
        "taxPercentageValue": "0.00",
        "type": reservation.type.value.upper(),
        "unitPrice": float(reservation.unit_price),
        "user": {"email": reservation.user.email},
        "workingMemo": reservation.working_memo,
    }


def test_reservation__query__reservee_date_of_birth_is_not_shown_to_regular_user(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    reservation = ReservationFactory.create()

    graphql.login_user_based_on_type(UserType.REGULAR)
    query = reservations_query(fields="pk user { dateOfBirth }")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk, "user": None}

    view_log: PersonalInfoViewLog | None = PersonalInfoViewLog.objects.first()
    assert view_log is None


def test_reservation__query__reservee_date_of_birth_is_show_but_logged__general_admin(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    reservation = ReservationFactory.create()
    admin = UserFactory.create_with_general_permissions(perms=["can_view_reservations"])

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


def test_reservation__query__reservee_date_of_birth_is_show_but_logged__unit_admin(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])
    admin = UserFactory.create_with_unit_permissions(unit=unit, perms=["can_view_reservations"])

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


def test_reservation__query__reservee_date_of_birth_is_show_but_logged__unit_group_admin(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    unit_group = UnitGroupFactory.create()
    unit = UnitFactory.create(unit_groups=[unit_group])
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])
    admin = UserFactory.create_with_unit_group_permissions(unit_group=unit_group, perms=["can_view_reservations"])

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


def test_reservation__query__reservee_date_of_birth_is_show_but_logged__service_sector_admin(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    sector = ServiceSectorFactory.create()
    unit = UnitFactory.create(service_sectors=[sector])
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])
    admin = UserFactory.create_with_service_sector_permissions(service_sector=sector, perms=["can_view_reservations"])

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

    graphql.login_user_based_on_type(UserType.SUPERUSER)
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

    graphql.login_user_based_on_type(UserType.SUPERUSER)
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
