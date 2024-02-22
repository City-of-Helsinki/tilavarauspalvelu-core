import datetime
from functools import partial

import freezegun
import pytest
from django.utils.timezone import get_default_timezone

from tests.factories import ReservationFactory, ReservationUnitFactory, ServiceSectorFactory, UnitFactory, UserFactory
from tests.gql_builders import build_query
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

units_query = partial(build_query, "units", connection=True, order_by="nameFi")


def test_units__query(graphql):
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        pk
        nameFi
        nameEn
        nameSv
        descriptionFi
        descriptionEn
        descriptionSv
        shortDescriptionFi
        shortDescriptionEn
        shortDescriptionSv
        webPage
        email
        phone
        reservationUnits {
            nameFi
        }
        spaces {
            nameFi
        }
        location {
            addressStreetFi
        }
        serviceSectors {
            nameFi
        }
        paymentMerchant {
            name
        }
    """
    response = graphql(units_query(fields=fields))

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": unit.pk,
        "nameFi": unit.name_fi,
        "nameEn": unit.name_en,
        "nameSv": unit.name_sv,
        "descriptionFi": unit.description_fi,
        "descriptionEn": unit.description_en,
        "descriptionSv": unit.description_sv,
        "shortDescriptionFi": unit.short_description_fi,
        "shortDescriptionEn": unit.short_description_en,
        "shortDescriptionSv": unit.short_description_sv,
        "webPage": unit.web_page,
        "email": unit.email,
        "phone": unit.phone,
        "location": None,
        "paymentMerchant": None,
        "reservationUnits": [],
        "serviceSectors": [],
        "spaces": [],
    }


def test_units__filter__by_name(graphql):
    unit = UnitFactory.create(name_fi="1111")
    UnitFactory.create(name_fi="2222")
    UnitFactory.create(name_fi="3333")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(units_query(nameFi="111"))

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": unit.pk}


def test_units__filter__by_service_sector(graphql):
    unit = UnitFactory.create()
    UnitFactory.create()
    UnitFactory.create()
    sector = ServiceSectorFactory.create(units=[unit])

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(units_query(service_sector=sector.pk))

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": unit.pk}


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_units__filter__by_published_reservation_units(graphql):
    unit_1 = UnitFactory.create(name="1")
    unit_2 = UnitFactory.create(name="2")
    unit_3 = UnitFactory.create(name="3")

    publish_date = datetime.datetime.now(tz=get_default_timezone())

    ReservationUnitFactory.create(unit=unit_1)
    ReservationUnitFactory.create(publish_begins=publish_date, unit=unit_2)
    ReservationUnitFactory.create(is_archived=True, unit=unit_3)
    ReservationUnitFactory.create(publish_begins=publish_date + datetime.timedelta(days=30), unit=unit_3)

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = build_query("units", connection=True, published_reservation_units=True, order_by="name_fi")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": unit_1.pk}
    assert response.node(1) == {"pk": unit_2.pk}


def test_units__filter__by_own_reservations(graphql):
    unit_1 = UnitFactory.create(name="1")
    unit_2 = UnitFactory.create(name="2")
    unit_3 = UnitFactory.create(name="3")

    res_unit_1 = ReservationUnitFactory.create(unit=unit_1)
    res_unit_2 = ReservationUnitFactory.create(unit=unit_2)
    res_unit_3 = ReservationUnitFactory.create(unit=unit_3)
    res_unit_4 = ReservationUnitFactory.create(unit=unit_3)

    user_1 = UserFactory.create()
    user_2 = UserFactory.create()

    ReservationFactory.create(reservation_unit=[res_unit_1], user=user_1)
    ReservationFactory.create(reservation_unit=[res_unit_2], user=user_1)
    ReservationFactory.create(reservation_unit=[res_unit_3], user=user_2)
    ReservationFactory.create(reservation_unit=[res_unit_4], user=user_2)

    graphql.force_login(user_1)

    # Own reservations = True
    response = graphql(units_query(own_reservations=True))
    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": unit_1.pk}
    assert response.node(1) == {"pk": unit_2.pk}

    # Own reservations = False
    response = graphql(units_query(own_reservations=False))
    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": unit_3.pk}


def test_units__order_by__name_fi(graphql):
    unit_1 = UnitFactory.create(name_fi="Unit 1")
    unit_2 = UnitFactory.create(name_fi="Unit 2")
    unit_3 = UnitFactory.create(name_fi="Unit 3")

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # Ascending
    response = graphql(units_query(order_by="nameFi"))

    assert response.has_errors is False
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": unit_1.pk}
    assert response.node(1) == {"pk": unit_2.pk}
    assert response.node(2) == {"pk": unit_3.pk}

    # Descending
    response = graphql(units_query(order_by="-nameFi"))

    assert response.has_errors is False
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": unit_3.pk}
    assert response.node(1) == {"pk": unit_2.pk}
    assert response.node(2) == {"pk": unit_1.pk}


def test_units__order__by_own_reservations_count(graphql):
    unit_1 = UnitFactory.create(name="1")
    unit_2 = UnitFactory.create(name="2")
    unit_3 = UnitFactory.create(name="3")
    unit_4 = UnitFactory.create(name="4")

    res_unit_1 = ReservationUnitFactory.create(unit=unit_1)
    res_unit_2 = ReservationUnitFactory.create(unit=unit_2)
    res_unit_3 = ReservationUnitFactory.create(unit=unit_3)
    res_unit_4 = ReservationUnitFactory.create(unit=unit_4)

    user_1 = UserFactory.create()
    user_2 = UserFactory.create()

    ReservationFactory.create_batch(4, reservation_unit=[res_unit_1], user=user_1)
    ReservationFactory.create(reservation_unit=[res_unit_2], user=user_1)
    ReservationFactory.create_batch(3, reservation_unit=[res_unit_3], user=user_1)
    ReservationFactory.create(reservation_unit=[res_unit_4], user=user_2)

    graphql.force_login(user_1)
    response = graphql(units_query(own_reservations=True, order_by="-reservationCount"))

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": unit_1.pk}
    assert response.node(1) == {"pk": unit_3.pk}
    assert response.node(2) == {"pk": unit_2.pk}
