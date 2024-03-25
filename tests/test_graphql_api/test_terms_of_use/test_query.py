import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import TermsOfUseFactory
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_terms_of_use__query(graphql):
    terms_of_use = TermsOfUseFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

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
    query = build_query("termsOfUse", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": terms_of_use.pk,
        "nameFi": terms_of_use.name_fi,
        "nameSv": terms_of_use.name_sv,
        "nameEn": terms_of_use.name_en,
        "textFi": terms_of_use.text_fi,
        "textSv": terms_of_use.text_sv,
        "textEn": terms_of_use.text_en,
        "termsType": terms_of_use.terms_type.upper(),
    }
