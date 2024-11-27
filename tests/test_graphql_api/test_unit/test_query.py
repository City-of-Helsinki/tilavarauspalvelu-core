from __future__ import annotations

from enum import Enum

import pytest

from tests.factories import ReservationFactory, ReservationUnitFactory, UnitFactory, UnitGroupFactory

from .helpers import units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_units__query(graphql):
    unit = UnitFactory.create()
    graphql.login_with_superuser()

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
        unitGroups {
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
        "unitGroups": [],
        "spaces": [],
    }


def test_units__query__unit_groups_alphabetical_order(graphql):
    unit = UnitFactory.create()
    unit_group_1 = UnitGroupFactory.create(units=[unit], name="AAA")
    unit_group_2 = UnitGroupFactory.create(units=[unit], name="XXX")
    unit_group_3 = UnitGroupFactory.create(units=[unit], name="ABC")

    graphql.login_with_superuser()
    fields = """
        pk
        unitGroups {
            nameFi
        }
    """
    response = graphql(units_query(fields=fields))

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": unit.pk,
        "unitGroups": [
            {"nameFi": unit_group_1.name_fi},
            {"nameFi": unit_group_3.name_fi},
            {"nameFi": unit_group_2.name_fi},
        ],
    }


def test_units__query__unit_groups__no_permissions(graphql):
    unit = UnitFactory.create()
    UnitGroupFactory.create(units=[unit], name="AAA")

    graphql.login_with_regular_user()
    fields = """
        pk
        unitGroups {
            nameFi
        }
    """
    response = graphql(units_query(fields=fields))

    assert response.has_errors is True
    assert response.error_message() == "No permission to access node."


def test_units__query__check_duplication_is_prevented(graphql):
    user = graphql.login_with_superuser()

    unit_1 = UnitFactory.create(name="A1")
    unit_2 = UnitFactory.create(name="A2")
    unit_3 = UnitFactory.create(name="A3")
    unit_4 = UnitFactory.create(name="A4")

    reservation_unit_1 = ReservationUnitFactory.create(name="A1", unit=unit_1)
    reservation_unit_2 = ReservationUnitFactory.create(name="A2", unit=unit_1)
    reservation_unit_3 = ReservationUnitFactory.create(name="A3", unit=unit_2)
    reservation_unit_4 = ReservationUnitFactory.create(name="A4", unit=unit_2)
    reservation_unit_5 = ReservationUnitFactory.create(name="A5", unit=unit_3)
    reservation_unit_6 = ReservationUnitFactory.create(name="A6", unit=unit_3)
    reservation_unit_7 = ReservationUnitFactory.create(name="A7", unit=unit_4)
    reservation_unit_8 = ReservationUnitFactory.create(name="A8", unit=unit_4)

    reservation_01 = ReservationFactory.create(name="A01", reservation_units=[reservation_unit_1], user=user)
    reservation_02 = ReservationFactory.create(name="A02", reservation_units=[reservation_unit_1])
    reservation_03 = ReservationFactory.create(name="A03", reservation_units=[reservation_unit_2], user=user)
    reservation_04 = ReservationFactory.create(name="A04", reservation_units=[reservation_unit_2])
    reservation_05 = ReservationFactory.create(name="A05", reservation_units=[reservation_unit_3], user=user)
    reservation_06 = ReservationFactory.create(name="A06", reservation_units=[reservation_unit_3])
    reservation_07 = ReservationFactory.create(name="A07", reservation_units=[reservation_unit_4], user=user)
    reservation_08 = ReservationFactory.create(name="A08", reservation_units=[reservation_unit_4])
    reservation_09 = ReservationFactory.create(name="A09", reservation_units=[reservation_unit_5], user=user)
    reservation_10 = ReservationFactory.create(name="A10", reservation_units=[reservation_unit_5])
    reservation_11 = ReservationFactory.create(name="A11", reservation_units=[reservation_unit_6], user=user)
    reservation_12 = ReservationFactory.create(name="A12", reservation_units=[reservation_unit_6])
    reservation_13 = ReservationFactory.create(name="A13", reservation_units=[reservation_unit_7], user=user)
    reservation_14 = ReservationFactory.create(name="A14", reservation_units=[reservation_unit_7])
    reservation_15 = ReservationFactory.create(name="A15", reservation_units=[reservation_unit_8], user=user)
    reservation_16 = ReservationFactory.create(name="A16", reservation_units=[reservation_unit_8])

    group_1 = UnitGroupFactory.create(name="A1", units=[unit_1, unit_2])
    group_2 = UnitGroupFactory.create(name="A2", units=[unit_2, unit_3])
    group_3 = UnitGroupFactory.create(name="A3", units=[unit_3, unit_4])
    group_4 = UnitGroupFactory.create(name="A4", units=[unit_4, unit_1])

    # Create testing enum since test client doesn't correctly handle
    # ordering enums from strings in sub-entities (e.g. 'reservation_units__order_by').
    class TestEnum(Enum):
        pkAsc = "pkAsc"

    query = units_query(
        fields="pk unitGroups { pk } reservationUnits { pk reservations { pk } }",
        name_fi="A",
        published_reservation_units=True,
        own_reservations=True,
        only_direct_bookable=True,
        order_by=["unitGroupNameFiAsc", "pkAsc"],
        reservationUnits__order_by=TestEnum.pkAsc,
        reservationUnits__reservations__order_by=TestEnum.pkAsc,
    )
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 4

    assert response.node(0) == {
        "pk": unit_1.pk,
        "unitGroups": [
            {"pk": group_1.pk},
            {"pk": group_4.pk},
        ],
        "reservationUnits": [
            {
                "pk": reservation_unit_1.pk,
                "reservations": [
                    {"pk": reservation_01.pk},
                    {"pk": reservation_02.pk},
                ],
            },
            {
                "pk": reservation_unit_2.pk,
                "reservations": [
                    {"pk": reservation_03.pk},
                    {"pk": reservation_04.pk},
                ],
            },
        ],
    }
    assert response.node(1) == {
        "pk": unit_2.pk,
        "unitGroups": [
            {"pk": group_1.pk},
            {"pk": group_2.pk},
        ],
        "reservationUnits": [
            {
                "pk": reservation_unit_3.pk,
                "reservations": [
                    {"pk": reservation_05.pk},
                    {"pk": reservation_06.pk},
                ],
            },
            {
                "pk": reservation_unit_4.pk,
                "reservations": [
                    {"pk": reservation_07.pk},
                    {"pk": reservation_08.pk},
                ],
            },
        ],
    }
    assert response.node(2) == {
        "pk": unit_3.pk,
        "unitGroups": [
            {"pk": group_2.pk},
            {"pk": group_3.pk},
        ],
        "reservationUnits": [
            {
                "pk": reservation_unit_5.pk,
                "reservations": [
                    {"pk": reservation_09.pk},
                    {"pk": reservation_10.pk},
                ],
            },
            {
                "pk": reservation_unit_6.pk,
                "reservations": [
                    {"pk": reservation_11.pk},
                    {"pk": reservation_12.pk},
                ],
            },
        ],
    }
    assert response.node(3) == {
        "pk": unit_4.pk,
        "unitGroups": [
            {"pk": group_3.pk},
            {"pk": group_4.pk},
        ],
        "reservationUnits": [
            {
                "pk": reservation_unit_7.pk,
                "reservations": [
                    {"pk": reservation_13.pk},
                    {"pk": reservation_14.pk},
                ],
            },
            {
                "pk": reservation_unit_8.pk,
                "reservations": [
                    {"pk": reservation_15.pk},
                    {"pk": reservation_16.pk},
                ],
            },
        ],
    }
