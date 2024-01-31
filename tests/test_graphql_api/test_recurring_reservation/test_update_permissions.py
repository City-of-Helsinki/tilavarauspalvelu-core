import pytest

from reservations.models import RecurringReservation
from spaces.models import ServiceSector, Unit
from tests.factories import RecurringReservationFactory, ServiceSectorFactory, UnitFactory, UserFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


@pytest.mark.parametrize("user_type", [UserType.REGULAR, UserType.ANONYMOUS])
def test_recurring_reservation__update__regular_or_anonymous_user_cannot_update(graphql, user_type):
    # given:
    # - There is a recurring reservation in the system
    # - A regular or anonymous user is using the system
    recurring: RecurringReservation = RecurringReservationFactory.create()
    graphql.login_user_based_on_type(user_type)

    # when:
    # - The user tries to update a recurring reservation
    input_data = {"pk": recurring.pk, "name": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_recurring_reservation__update__general_admin_can_update(graphql):
    # given:
    # - There is a recurring reservation in the system
    # - A general admin is using the system
    recurring: RecurringReservation = RecurringReservationFactory.create()
    admin = UserFactory.create_with_general_permissions(perms=["can_create_staff_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user tries to update a recurring reservation
    input_data = {"pk": recurring.pk, "name": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response has no errors
    assert response.has_errors is False, response


def test_recurring_reservation__update__unit_admin_can_update_own_unit(graphql):
    # given:
    # - There is a recurring reservation in the system
    # - A unit admin for that reservation unit's unit is using the system
    recurring: RecurringReservation = RecurringReservationFactory.create()
    admin = UserFactory.create_with_unit_permissions(
        recurring.reservation_unit.unit,
        perms=["can_create_staff_reservations"],
    )
    graphql.force_login(admin)

    # when:
    # - The user tries to update a recurring reservation
    input_data = {"pk": recurring.pk, "name": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response has no errors
    assert response.has_errors is False, response


def test_recurring_reservation__update__unit_admin_cannot_update_other_unit(graphql):
    # given:
    # - There is a recurring reservation in the system
    # - A unit admin for some other unit is using the system
    unit: Unit = UnitFactory.create()
    recurring: RecurringReservation = RecurringReservationFactory.create()
    admin = UserFactory.create_with_unit_permissions(unit, perms=["can_create_staff_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user tries to update a recurring reservation
    input_data = {"pk": recurring.pk, "name": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_recurring_reservation__update__service_sector_admin_can_update_own_service_sector(graphql):
    # given:
    # - There is a recurring reservation in the system
    # - A unit admin for that reservation unit's unit is using the system
    sector: ServiceSector = ServiceSectorFactory.create()
    recurring: RecurringReservation = RecurringReservationFactory.create(
        reservation_unit__unit__service_sectors=[sector],
    )
    admin = UserFactory.create_with_service_sector_permissions(sector, perms=["can_create_staff_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user tries to update a recurring reservation
    input_data = {"pk": recurring.pk, "name": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response has no errors
    assert response.has_errors is False, response


def test_recurring_reservation__update__service_sector_admin_cannot_update_other_service_sector(graphql):
    # given:
    # - There is a recurring reservation in the system
    # - A unit admin for some other unit is using the system
    sector_1: ServiceSector = ServiceSectorFactory.create()
    sector_2: ServiceSector = ServiceSectorFactory.create()
    recurring: RecurringReservation = RecurringReservationFactory.create(
        reservation_unit__unit__service_sectors=[sector_1],
    )
    admin = UserFactory.create_with_service_sector_permissions(sector_2, perms=["can_create_staff_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user tries to update a recurring reservation
    input_data = {"pk": recurring.pk, "name": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]
