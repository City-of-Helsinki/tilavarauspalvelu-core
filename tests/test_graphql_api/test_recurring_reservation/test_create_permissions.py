import pytest

from reservation_units.models import ReservationUnit
from spaces.models import ServiceSector, Unit
from tests.factories import ReservationUnitFactory, ServiceSectorFactory, UnitFactory, UserFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


@pytest.mark.parametrize("user_type", [UserType.REGULAR, UserType.ANONYMOUS])
def test_recurring_reservation__create__regular_or_anonymous_user_cannot_create(graphql, user_type):
    # given:
    # - There is a reservation unit
    # - A regular or anonymous user is using the system
    reservation_unit: ReservationUnit = ReservationUnitFactory.create()
    graphql.login_user_based_on_type(user_type)

    # when:
    # - The user creates a recurring reservation
    input_data = {"reservationUnit": reservation_unit.pk}
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_recurring_reservation__create__general_admin_can_create(graphql):
    # given:
    # - There is a reservation unit with a unit
    # - A general admin is using the system
    reservation_unit: ReservationUnit = ReservationUnitFactory.create()
    admin = UserFactory.create_with_general_permissions(perms=["can_create_staff_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user creates a recurring reservation for that reservation unit
    input_data = {"reservationUnit": reservation_unit.pk}
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains has no errors
    assert response.has_errors is False, response


def test_recurring_reservation__create__unit_admin_can_create_for_own_unit(graphql):
    # given:
    # - There is a reservation unit with a unit
    # - A unit admin for the reservation unit's unit is using the system
    reservation_unit: ReservationUnit = ReservationUnitFactory.create()
    admin = UserFactory.create_with_unit_permissions(reservation_unit.unit, perms=["can_create_staff_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user creates a recurring reservation for that reservation unit
    input_data = {"reservationUnit": reservation_unit.pk}
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains has no errors
    assert response.has_errors is False, response


def test_recurring_reservation__create__unit_admin_cannot_create_for_other_unit(graphql):
    # given:
    # - There is a reservation unit with a unit
    # - A unit admin for some other unit is using the system
    unit: Unit = UnitFactory.create()
    reservation_unit: ReservationUnit = ReservationUnitFactory.create()
    admin = UserFactory.create_with_unit_permissions(unit, perms=["can_create_staff_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user creates a recurring reservation for the other reservation unit
    input_data = {"reservationUnit": reservation_unit.pk}
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_recurring_reservation__create__service_sector_admin_can_create_for_own_service_sector(graphql):
    # given:
    # - There is a reservation unit in a service sector
    # - A service sector admin for the reservation unit's unit's service sector is using the system
    sector: ServiceSector = ServiceSectorFactory.create()
    reservation_unit: ReservationUnit = ReservationUnitFactory.create(unit__service_sectors=[sector])
    admin = UserFactory.create_with_service_sector_permissions(sector, perms=["can_create_staff_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user creates a recurring reservation for that reservation unit
    input_data = {"reservationUnit": reservation_unit.pk}
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains has no errors
    assert response.has_errors is False, response


def test_recurring_reservation__create__service_sector_admin_cannot_create_for_other_service_sector(graphql):
    # given:
    # - There is a reservation unit in a service sector
    # - A service sector admin for some other service sector is using the system
    sector_1: ServiceSector = ServiceSectorFactory.create()
    sector_2: ServiceSector = ServiceSectorFactory.create()
    reservation_unit: ReservationUnit = ReservationUnitFactory.create(unit__service_sectors=[sector_1])
    admin = UserFactory.create_with_service_sector_permissions(sector_2, perms=["can_create_staff_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user creates a recurring reservation for the other reservation unit
    input_data = {"reservationUnit": reservation_unit.pk}
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]
