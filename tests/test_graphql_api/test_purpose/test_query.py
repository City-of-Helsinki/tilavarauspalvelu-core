import pytest

from tests.factories import PurposeFactory

from .helpers import purposes_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_purpose__query(graphql):
    purpose = PurposeFactory.create()

    graphql.login_with_superuser()

    fields = """
        pk
        nameFi
        nameEn
        nameSv
        imageUrl
        smallUrl
        rank
    """
    query = purposes_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node() == {
        "pk": purpose.pk,
        "nameFi": purpose.name_fi,
        "nameEn": purpose.name_en,
        "nameSv": purpose.name_sv,
        "imageUrl": None,
        "smallUrl": None,
        "rank": purpose.rank,
    }


def test_purpose__order__by_rank(graphql):
    purpose_1 = PurposeFactory.create(rank=1)
    purpose_2 = PurposeFactory.create(rank=3)
    purpose_3 = PurposeFactory.create(rank=2)

    graphql.login_with_superuser()

    query = purposes_query(order_by="rankDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": purpose_2.pk}
    assert response.node(1) == {"pk": purpose_3.pk}
    assert response.node(2) == {"pk": purpose_1.pk}
