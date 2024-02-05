import freezegun
import pytest

from tests.factories import ReservationUnitFactory, ServiceSectorFactory, UserFactory
from tests.helpers import UserType

from .helpers import reservation_unit_hauki_url_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_setup_hauki"),
]


def test_reservation_unit_hauki_url__query__regular_user(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.REGULAR)

    query = reservation_unit_hauki_url_query(pk=reservation_unit.pk, reservation_units=[reservation_unit.pk])
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object["url"] is None


def test_reservation_unit_hauki_url__query__general_admin(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    reservation_unit = ReservationUnitFactory.create()

    user = UserFactory.create_with_general_permissions(perms=["can_manage_units"])

    graphql.force_login(user)
    query = reservation_unit_hauki_url_query(pk=reservation_unit.pk, reservation_units=[reservation_unit.pk])
    response = graphql(query)

    assert response.has_errors is False
    assert isinstance(response.first_query_object["url"], str)


@freezegun.freeze_time("2023-01-01T12:00:00+02:00")
def test_reservation_unit_hauki_url__query__unit_admin(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    reservation_unit = ReservationUnitFactory.create()

    user = UserFactory.create_with_unit_permissions(unit=reservation_unit.unit, perms=["can_manage_units"])

    graphql.force_login(user)
    query = reservation_unit_hauki_url_query(pk=reservation_unit.pk, reservation_units=[reservation_unit.pk])
    response = graphql(query)

    assert response.has_errors is False
    assert isinstance(response.first_query_object["url"], str)


@freezegun.freeze_time("2023-01-01T12:00:00+02:00")
def test_reservation_unit_hauki_url__query__service_sector_admin(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    reservation_unit = ReservationUnitFactory.create()
    sector = ServiceSectorFactory.create(units=[reservation_unit.unit])

    user = UserFactory.create_with_service_sector_permissions(service_sector=sector, perms=["can_manage_units"])

    graphql.force_login(user)
    query = reservation_unit_hauki_url_query(pk=reservation_unit.pk, reservation_units=[reservation_unit.pk])
    response = graphql(query)

    assert response.has_errors is False
    assert isinstance(response.first_query_object["url"], str)
