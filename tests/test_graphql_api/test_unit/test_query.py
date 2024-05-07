import pytest

from tests.factories import UnitFactory, UnitGroupFactory
from tests.helpers import UserType

from .helpers import units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


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
        reservationunitSet {
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
        "reservationunitSet": [],
        "serviceSectors": [],
        "unitGroups": [],
        "spaces": [],
    }


def test_units__query__unit_groups_alphabetical_order(graphql):
    unit = UnitFactory.create()
    unit_group_1 = UnitGroupFactory.create(units=[unit], name="AAA")
    unit_group_2 = UnitGroupFactory.create(units=[unit], name="XXX")
    unit_group_3 = UnitGroupFactory.create(units=[unit], name="ABC")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
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

    graphql.login_user_based_on_type(UserType.REGULAR)
    fields = """
        pk
        unitGroups {
            nameFi
        }
    """
    response = graphql(units_query(fields=fields))

    assert response.has_errors is True
    assert response.error_message() == "No permission to access node."
