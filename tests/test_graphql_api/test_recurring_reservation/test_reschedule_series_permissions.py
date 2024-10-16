import pytest
from freezegun import freeze_time

from tests.factories import UserFactory
from tilavarauspalvelu.enums import UserRoleChoice
from utils.date_utils import local_datetime

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
        (UserRoleChoice.RESERVER, True),
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


@pytest.mark.parametrize(
    ("role", "has_permission"),
    [
        (UserRoleChoice.ADMIN, True),
        (UserRoleChoice.HANDLER, True),
        (UserRoleChoice.VIEWER, False),
        (UserRoleChoice.RESERVER, True),
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
