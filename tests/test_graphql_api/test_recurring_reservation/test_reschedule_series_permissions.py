import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import UserRoleChoice
from utils.date_utils import local_datetime

from tests.factories import GeneralRoleFactory, UnitRoleFactory, UserFactory

from .helpers import RESCHEDULE_SERIES_MUTATION, create_reservation_series, get_minimal_reschedule_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    ("role", "has_permission"),
    [
        (UserRoleChoice.ADMIN, True),
        (UserRoleChoice.HANDLER, True),
        (UserRoleChoice.VIEWER, False),
        (UserRoleChoice.RESERVER, False),
        (UserRoleChoice.NOTIFICATION_MANAGER, False),
    ],
)
@freeze_time(local_datetime(year=2023, month=12, day=1))
def test_recurring_reservations__reschedule_series__general_role(graphql, role, has_permission):
    series = create_reservation_series()
    graphql.login_user_with_role(role=role)

    data = get_minimal_reschedule_data(series)
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is not has_permission


@freeze_time(local_datetime(year=2023, month=12, day=1))
def test_recurring_reservations__reschedule_series__general_reserver__own_reservation(graphql):
    user = UserFactory.create()
    series = create_reservation_series(user=user)
    GeneralRoleFactory.create(user=user, role=UserRoleChoice.RESERVER)

    graphql.force_login(user)
    data = get_minimal_reschedule_data(series)
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False


@pytest.mark.parametrize(
    ("role", "has_permission"),
    [
        (UserRoleChoice.ADMIN, True),
        (UserRoleChoice.HANDLER, True),
        (UserRoleChoice.VIEWER, False),
        (UserRoleChoice.RESERVER, False),
        (UserRoleChoice.NOTIFICATION_MANAGER, False),
    ],
)
@freeze_time(local_datetime(year=2023, month=12, day=1))
def test_recurring_reservations__reschedule_series__unit_role(graphql, role, has_permission):
    series = create_reservation_series()
    user = UserFactory.create_with_unit_role(role=role, units=[series.reservation_unit.unit])

    graphql.force_login(user)
    data = get_minimal_reschedule_data(series)
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is not has_permission


@freeze_time(local_datetime(year=2023, month=12, day=1))
def test_recurring_reservations__reschedule_series__unit_reserver__own_reservation(graphql):
    user = UserFactory.create()
    series = create_reservation_series(user=user)
    UnitRoleFactory.create(user=user, role=UserRoleChoice.RESERVER, units=[series.reservation_unit.unit])

    graphql.force_login(user)
    data = get_minimal_reschedule_data(series)
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False
