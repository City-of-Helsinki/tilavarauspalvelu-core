from __future__ import annotations

from typing import NamedTuple

import pytest
from graphene_django_extensions.testing.utils import parametrize_helper

from tilavarauspalvelu.models import ReservationUnit

from tests.factories import ReservationUnitFactory, SpaceFactory

from .helpers import reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


class Params(NamedTuple):
    text_search: str
    fields: str
    expected: dict | None


@pytest.mark.parametrize(
    **parametrize_helper({
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
    })
)
def test_reservation_unit__filter__by_text_search(graphql, text_search, fields, expected):
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

    ReservationUnit.objects.update_search_vectors()

    query = reservation_units_query(text_search=text_search, fields="pk " + fields)
    response = graphql(query)

    assert response.has_errors is False, response
    expect_results = expected is not None
    if expect_results:
        assert len(response.edges) == 1, response
        assert response.node(0) == {"pk": reservation_unit.pk, **expected}
    else:
        assert len(response.edges) == 0, response


def test_reservation_unit__filter__by_text_search__and_other_filters(graphql):
    reservation_unit = ReservationUnitFactory.create(name="foo")
    ReservationUnitFactory.create(name="foo bar")

    ReservationUnit.objects.update_search_vectors()

    query = reservation_units_query(text_search="foo", unit=reservation_unit.unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation_unit.pk}


# TODO: Add more tests for special cases.
