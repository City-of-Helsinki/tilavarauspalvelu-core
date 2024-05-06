from typing import NamedTuple

import pytest
from elasticsearch_django.settings import get_client
from graphene_django_extensions.testing.utils import parametrize_helper

from reservation_units.models import ReservationUnit
from tests.factories import ReservationUnitFactory, SpaceFactory

from .helpers import reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.enable_elasticsearch,
]


els_client = get_client()


def _force_elastic_update(reservation_unit: ReservationUnit) -> None:
    els_client.update(
        index=reservation_unit.search_indexes[0],
        id=reservation_unit.pk,
        refresh="wait_for",
        doc={"session": "state"},
    )


def test_reservation_unit__filter__by_text_search_and_other_filters(graphql):
    # given:
    # - There are two reservation units with different equipments
    reservation_unit = ReservationUnitFactory.create(name="foo")
    ReservationUnitFactory.create(name="foo bar")

    _force_elastic_update(reservation_unit)

    # when:
    # - The user requests reservation units with a specific equipment
    response = graphql(reservation_units_query(text_search="foo", unit=reservation_unit.unit.pk))

    # then:
    # - The response contains only the expected reservation unit
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation_unit.pk}


class Params(NamedTuple):
    text_search: str
    fields: str
    expected: dict | None


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "No results": Params(
                text_search="foo",
                fields="nameFi",
                expected=None,
            ),
            "Name FI": Params(
                text_search="Test name fi",
                fields="nameFi",
                expected={"nameFi": "test name fi"},
            ),
            "Name EN": Params(
                text_search="Test name en",
                fields="nameEn",
                expected={"nameEn": "test name en"},
            ),
            "Name SV": Params(
                text_search="Test name sv",
                fields="nameSv",
                expected={"nameSv": "test name sv"},
            ),
            "Type FI": Params(
                text_search="Test type fi",
                fields="nameFi reservationUnitType{nameFi}",
                expected={"nameFi": "test name fi", "reservationUnitType": {"nameFi": "test type fi"}},
            ),
            "Type EN": Params(
                text_search="Test type en",
                fields="nameEn reservationUnitType{nameEn}",
                expected={"nameEn": "test name en", "reservationUnitType": {"nameEn": "test type en"}},
            ),
            "Type SV": Params(
                text_search="Test type sv",
                fields="nameSv reservationUnitType{nameSv}",
                expected={"nameSv": "test name sv", "reservationUnitType": {"nameSv": "test type sv"}},
            ),
            "Description FI": Params(
                text_search="Lorem ipsum fi",
                fields="nameFi descriptionFi",
                expected={"nameFi": "test name fi", "descriptionFi": "Lorem ipsum fi"},
            ),
            "Description EN": Params(
                text_search="Lorem ipsum en",
                fields="nameEn descriptionEn",
                expected={"nameEn": "test name en", "descriptionEn": "Lorem ipsum en"},
            ),
            "Description SV": Params(
                text_search="Lorem ipsum sv",
                fields="nameSv descriptionSv",
                expected={"nameSv": "test name sv", "descriptionSv": "Lorem ipsum sv"},
            ),
            "Space name FI": Params(
                text_search="space name fi",
                fields="nameFi spaces{nameFi}",
                expected={"nameFi": "test name fi", "spaces": [{"nameFi": "space name fi"}]},
            ),
            "Space name EN": Params(
                text_search="space name en",
                fields="nameEn spaces{nameEn}",
                expected={"nameEn": "test name en", "spaces": [{"nameEn": "space name en"}]},
            ),
            "Space name SV": Params(
                text_search="space name sv",
                fields="nameSv spaces{nameSv}",
                expected={"nameSv": "test name sv", "spaces": [{"nameSv": "space name sv"}]},
            ),
        }
    )
)
def test_reservation_unit__filter__by_text_search__type_fi(graphql, text_search, fields, expected):
    space = SpaceFactory.create(
        name_fi="space name fi",
        name_en="space name en",
        name_sv="space name sv",
    )
    reservation_unit = ReservationUnitFactory.create(
        name="test name fi",
        name_fi="test name fi",
        name_en="test name en",
        name_sv="test name sv",
        description_fi="Lorem ipsum fi",
        description_sv="Lorem ipsum sv",
        description_en="Lorem ipsum en",
        reservation_unit_type__name="test type fi",
        reservation_unit_type__name_fi="test type fi",
        reservation_unit_type__name_en="test type en",
        reservation_unit_type__name_sv="test type sv",
        spaces=[space],
    )

    _force_elastic_update(reservation_unit)

    response = graphql(reservation_units_query(text_search=text_search, fields="pk " + fields))

    assert response.has_errors is False, response
    expect_results = expected is not None
    if expect_results:
        assert len(response.edges) == 1, response
        assert response.node(0) == {"pk": reservation_unit.pk, **expected}
    else:
        assert len(response.edges) == 0, response
