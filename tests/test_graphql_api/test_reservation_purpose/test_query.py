import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import ReservationPurposeFactory
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_purpose__query(graphql):
    res_purpose = ReservationPurposeFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        pk
        nameFi
        nameSv
        nameEn
    """
    query = build_query("reservationPurposes", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node() == {
        "pk": res_purpose.pk,
        "nameFi": res_purpose.name_fi,
        "nameSv": res_purpose.name_en,
        "nameEn": res_purpose.name_sv,
    }
