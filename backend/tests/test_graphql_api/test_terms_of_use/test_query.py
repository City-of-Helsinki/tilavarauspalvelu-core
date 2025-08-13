from __future__ import annotations

import pytest

from tests.factories import TermsOfUseFactory
from tests.query_builder import build_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_terms_of_use__query(graphql):
    terms_of_use = TermsOfUseFactory.create()
    graphql.login_with_superuser()

    fields = """
        pk
        nameFi
        nameSv
        nameEn
        textFi
        textSv
        textEn
        termsType
    """
    query = build_query("allTermsOfUse", fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors

    assert response.results == [
        {
            "pk": terms_of_use.pk,
            "nameFi": terms_of_use.name_fi,
            "nameSv": terms_of_use.name_sv,
            "nameEn": terms_of_use.name_en,
            "textFi": terms_of_use.text_fi,
            "textSv": terms_of_use.text_sv,
            "textEn": terms_of_use.text_en,
            "termsType": terms_of_use.terms_type,
        },
    ]
