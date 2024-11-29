from __future__ import annotations

import dataclasses
from typing import Literal, NamedTuple

import pytest
from graphene_django_extensions.testing.utils import parametrize_helper

from tilavarauspalvelu.models import ReservationUnit

from tests.factories import ReservationUnitFactory

from .helpers import reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@dataclasses.dataclass
class SearchableData:
    name: str = "-"
    name_en: str = "-"
    name_sv: str = "-"
    description: str = "-"
    description_en: str = "-"
    description_sv: str = "-"
    unit__name: str = "-"
    unit__name_en: str = "-"
    unit__name_sv: str = "-"
    reservation_unit_type__name: str = "-"
    reservation_unit_type__name_en: str = "-"
    reservation_unit_type__name_sv: str = "-"
    spaces__name: str = "-"
    spaces__name_en: str = "-"
    spaces__name_sv: str = "-"
    resources__name: str = "-"
    resources__name_en: str = "-"
    resources__name_sv: str = "-"
    purposes__name: str = "-"
    purposes__name_en: str = "-"
    purposes__name_sv: str = "-"
    equipments__name: str = "-"
    equipments__name_en: str = "-"
    equipments__name_sv: str = "-"
    search_terms: list[str] = dataclasses.field(default_factory=list)


class Params(NamedTuple):
    text_search: str
    reservation_unit_data: SearchableData
    has_results: bool = True
    language: Literal["fi", "sv", "en"] = "fi"


@pytest.mark.parametrize(
    **parametrize_helper({
        "no results": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(),
            has_results=False,
        ),
        "match name fi": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(name="foo"),
        ),
        "match name en": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(name_en="foo"),
            language="en",
        ),
        "match name sv": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(name_sv="foo"),
            language="sv",
        ),
        "dont match different language name": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(name="foo"),
            language="sv",
            has_results=False,
        ),
        "match name prefix": Params(
            text_search="post",
            reservation_unit_data=SearchableData(name="postal"),
        ),
        "match name postfix": Params(
            text_search="room",
            reservation_unit_data=SearchableData(name="workroom"),
        ),
        "match description fi": Params(
            text_search="kuvaus",
            reservation_unit_data=SearchableData(description="Tässä on kuvaus minun yksikkööni"),
        ),
        "match description en": Params(
            text_search="description",
            reservation_unit_data=SearchableData(description_en="Here is a description of my unit"),
            language="en",
        ),
        "match description ev": Params(
            text_search="beskrivning",
            reservation_unit_data=SearchableData(description_sv="Här är en beskrivning av min enhet"),
            language="sv",
        ),
        "match description p-tags": Params(
            text_search="kuvaus",
            reservation_unit_data=SearchableData(description="<p>Tässä on kuvaus minun yksikkööni</p>"),
        ),
        "match description p-tags split": Params(
            text_search="kuvaus",
            reservation_unit_data=SearchableData(description="<p>Tässä on</p><p>kuvaus minun yksikkööni</p>"),
        ),
        "match unit name fi": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(unit__name="foo"),
        ),
        "match unit name en": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(unit__name_en="foo"),
            language="en",
        ),
        "match unit name sv": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(unit__name_sv="foo"),
            language="sv",
        ),
        "match reservation unit type name fi": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(reservation_unit_type__name="foo"),
        ),
        "match reservation unit type name en": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(reservation_unit_type__name_en="foo"),
            language="en",
        ),
        "match reservation unit type name sv": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(reservation_unit_type__name_sv="foo"),
            language="sv",
        ),
        "match space name fi": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(spaces__name="foo"),
        ),
        "match space name en": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(spaces__name_en="foo"),
            language="en",
        ),
        "match space name sv": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(spaces__name_sv="foo"),
            language="sv",
        ),
        "match resource name fi": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(resources__name="foo"),
        ),
        "match resource name en": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(resources__name_en="foo"),
            language="en",
        ),
        "match resource name sv": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(resources__name_sv="foo"),
            language="sv",
        ),
        "match purpose name fi": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(purposes__name="foo"),
        ),
        "match purpose name en": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(purposes__name_en="foo"),
            language="en",
        ),
        "match purpose name sv": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(purposes__name_sv="foo"),
            language="sv",
        ),
        "match equipment name fi": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(equipments__name="foo"),
        ),
        "match equipment name en": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(equipments__name_en="foo"),
            language="en",
        ),
        "match equipment name sv": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(equipments__name_sv="foo"),
            language="sv",
        ),
        "match search terms fi": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(search_terms=["foo"]),
        ),
        "match search terms en": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(search_terms=["foo"]),
            language="en",
        ),
        "match search terms sv": Params(
            text_search="foo",
            reservation_unit_data=SearchableData(search_terms=["foo"]),
            language="sv",
        ),
        "match different grammatical case": Params(
            text_search="tila pukinmäessä",
            reservation_unit_data=SearchableData(description="sijaitsee pukinmäen kirjaston vieressä"),
        ),
    })
)
def test_reservation_unit__filter__by_text_search(graphql, text_search, reservation_unit_data, has_results, language):
    ReservationUnitFactory.create(**dataclasses.asdict(reservation_unit_data))
    ReservationUnit.objects.update_search_vectors()

    graphql.login_with_superuser(preferred_language=language)

    query = reservation_units_query(text_search=text_search)
    response = graphql(query)

    assert response.has_errors is False, response

    assert len(response.edges) == (1 if has_results else 0)


def test_reservation_unit__filter__by_text_search__and_other_filters(graphql):
    reservation_unit = ReservationUnitFactory.create(name="foo")
    ReservationUnitFactory.create(name="foo bar")

    ReservationUnit.objects.update_search_vectors()

    query = reservation_units_query(text_search="foo", unit=reservation_unit.unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation_unit.pk}
