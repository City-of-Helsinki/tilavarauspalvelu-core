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
        name {
            fi
            sv
            en
        }
        text {
            fi
            sv
            en
        }
        termsType
    """
    query = build_query("allTermsOfUse", fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors

    assert response.results == [
        {
            "pk": terms_of_use.pk,
            "name": {
                "fi": terms_of_use.name_fi,
                "sv": terms_of_use.name_sv,
                "en": terms_of_use.name_en,
            },
            "text": {
                "fi": terms_of_use.text_fi,
                "sv": terms_of_use.text_sv,
                "en": terms_of_use.text_en,
            },
            "termsType": terms_of_use.terms_type,
        },
    ]
