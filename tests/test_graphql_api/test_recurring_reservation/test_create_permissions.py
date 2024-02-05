import datetime

import pytest

from reservations.models import RecurringReservation
from tests.factories import ReservationUnitFactory, ServiceSectorFactory, UserFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION, get_minimal_create_date

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__create__regular_user(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.REGULAR)

    data = get_minimal_create_date(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to mutate"


def test_recurring_reservations__create__general_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()

    admin = UserFactory.create_with_general_permissions(perms=["can_create_staff_reservations"])
    graphql.force_login(admin)

    data = get_minimal_create_date(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False
    assert RecurringReservation.objects.filter(pk=response.first_query_object["pk"]).exists()


def test_recurring_reservations__create__unit_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()

    admin = UserFactory.create_with_unit_permissions(
        unit=reservation_unit.unit,
        perms=["can_create_staff_reservations"],
    )
    graphql.force_login(admin)

    data = get_minimal_create_date(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False
    assert RecurringReservation.objects.filter(pk=response.first_query_object["pk"]).exists()


def test_recurring_reservations__create__service_sector_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()
    sector = ServiceSectorFactory.create(units=[reservation_unit.unit])

    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=sector,
        perms=["can_create_staff_reservations"],
    )
    graphql.force_login(admin)

    data = {
        "weekdays": [0],
        "beginDate": datetime.date(2023, 1, 1).isoformat(),
        "endDate": datetime.date(2023, 1, 2).isoformat(),
        "beginTime": datetime.time(10, 0, 0).isoformat(),
        "endTime": datetime.time(12, 0, 0).isoformat(),
        "recurrenceInDays": 7,
        "reservationUnitPk": reservation_unit.pk,
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False
    assert RecurringReservation.objects.filter(pk=response.first_query_object["pk"]).exists()
