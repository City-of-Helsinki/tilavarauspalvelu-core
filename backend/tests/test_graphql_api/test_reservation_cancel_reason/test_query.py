from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tests.helpers import TranslationsFromPOFiles

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


QUERY = build_query("reservationCancelReasons", fields="value reasonFi reasonEn reasonSv")

DATA = [
    {
        "value": "CHANGE_OF_PLANS",
        "reasonFi": "Suunnitelmiini tuli muutos",
        "reasonEn": "My plans have changed",
        "reasonSv": "Mina planer har ändrats",
    },
    {
        "value": "FOUND_ANOTHER_SPACE_ELSEWHERE",
        "reasonFi": "Löysin toisen tilan muualta",
        "reasonEn": "I found another space somewhere else",
        "reasonSv": "Jag hittade en annan lokal någon annanstans",
    },
    {
        "value": "FOUND_ANOTHER_SPACE_VARAAMO",
        "reasonFi": "Löysin toisen tilan Varaamosta",
        "reasonEn": "I found another space through Varaamo",
        "reasonSv": "Jag hittade en annan lokal på Varaamo",
    },
    {
        "value": "OTHER",
        "reasonFi": "Muu syy",
        "reasonEn": "Other reason",
        "reasonSv": "Annan orsak",
    },
    {
        "value": "PROCESSING_TIME_TOO_LONG",
        "reasonFi": "Varauksen käsittelyaika on liian pitkä",
        "reasonEn": "The booking processing time is too long",
        "reasonSv": "Bokningens handläggningstid är för lång",
    },
    {
        "value": "UNSUITABLE_SPACE",
        "reasonFi": "Tila ei sovellu käyttötarkoitukseeni",
        "reasonEn": "The space is not suitable for my purpose",
        "reasonSv": "Lokalen är inte lämplig för ändamålet",
    },
]


def test_reservation_cancel_reasons__query(graphql):
    graphql.login_with_superuser()

    with TranslationsFromPOFiles():
        response = graphql(QUERY)

    assert response.has_errors is False

    assert response.first_query_object == DATA


def test_reservation_cancel_reasons__query__anonymous_user(graphql):
    with TranslationsFromPOFiles():
        response = graphql(QUERY)

    assert response.has_errors is False

    assert response.first_query_object == DATA
