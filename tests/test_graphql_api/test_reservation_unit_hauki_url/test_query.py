import urllib.parse

import freezegun
import pytest

from tests.factories import ReservationUnitFactory, UserFactory
from tests.helpers import UserType

from .helpers import reservation_unit_hauki_url_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_setup_hauki"),
]


@freezegun.freeze_time("2023-01-01T12:00:00+02:00")
def test_reservation_unit_hauki_url__query(graphql, settings):
    reservation_unit = ReservationUnitFactory.create(
        unit__tprek_department_id="12345",
        uuid="3774af34-9916-40f2-acc7-68db5a627710",
    )

    user = UserFactory.create_superuser(email="admin@tvp.com")
    graphql.force_login(user)
    query = reservation_unit_hauki_url_query(pk=reservation_unit.pk, reservation_units=[reservation_unit.pk])
    response = graphql(query)

    assert response.has_errors is False

    url = settings.HAUKI_ADMIN_UI_URL + urllib.parse.quote(
        string=(
            f"/resource/{settings.HAUKI_ORIGIN_ID}:{reservation_unit.uuid}/"
            f"?hsa_source={settings.HAUKI_ORIGIN_ID}"
            f"&hsa_username={user.email}"
            f"&hsa_organization={reservation_unit.unit.hauki_department_id}"
            f"&hsa_created_at=2023-01-01T12:00:00+02:00"
            f"&hsa_valid_until=2023-01-01T12:30:00+02:00"
            f"&hsa_resource={settings.HAUKI_ORIGIN_ID}:{reservation_unit.uuid}"
            f"&hsa_has_organization_rights=true"
            # See: `opening_hours.utils.hauki_link_generator.generate_hauki_link`
            f"&hsa_signature=56b453b4d6ab22d3df671d846e99efce34536b5b3b5d87f4ed71ebc4a32c344e"
            f"&target_resources={settings.HAUKI_ORIGIN_ID}:{reservation_unit.uuid}"
        ),
        safe="/&?=",
    )

    assert response.first_query_object == {"url": url}


def test_reservation_unit_hauki_url__query__target_not_in_same_unit(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = reservation_unit_hauki_url_query(
        pk=reservation_unit_1.pk,
        reservation_units=[reservation_unit_2.pk],
    )
    response = graphql(query)

    assert response.has_errors is False
    assert "target_resources" not in response.first_query_object["url"]


def test_reservation_unit_hauki_url__query__two_targets__in_same_unit(graphql, settings):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create(unit=reservation_unit_1.unit)

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = reservation_unit_hauki_url_query(
        pk=reservation_unit_1.pk,
        reservation_units=[reservation_unit_1.pk, reservation_unit_2.pk],
    )
    response = graphql(query)

    assert response.has_errors is False

    target_resources = response.first_query_object["url"].split("target_resources=")[1]
    assert target_resources == urllib.parse.quote(
        f"{settings.HAUKI_ORIGIN_ID}:{reservation_unit_1.uuid},{settings.HAUKI_ORIGIN_ID}:{reservation_unit_2.uuid}",
    )


def test_reservation_unit_hauki_url__query__two_targets__not_in_same_unit(graphql, settings):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = reservation_unit_hauki_url_query(
        pk=reservation_unit_1.pk,
        reservation_units=[reservation_unit_1.pk, reservation_unit_2.pk],
    )
    response = graphql(query)

    assert response.has_errors is False

    target_resources = response.first_query_object["url"].split("target_resources=")[1]
    assert target_resources == urllib.parse.quote(f"{settings.HAUKI_ORIGIN_ID}:{reservation_unit_1.uuid}")


def test_reservation_unit_hauki_url__query__reservation_unit_does_not_exist(graphql):
    reservation_unit = ReservationUnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = reservation_unit_hauki_url_query(pk=0, reservation_units=[reservation_unit.pk])
    response = graphql(query)

    assert response.error_message() == "No ReservationUnit matches the given query."


def test_reservation_unit_hauki_url__query__target_reservation_unit_does_not_exist(graphql):
    reservation_unit = ReservationUnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = reservation_unit_hauki_url_query(pk=reservation_unit.pk, reservation_units=[0])
    response = graphql(query)

    assert response.error_message() == "Wrong identifier for reservation unit in url generation."
