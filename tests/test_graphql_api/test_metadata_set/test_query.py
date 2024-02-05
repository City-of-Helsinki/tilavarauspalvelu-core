import pytest

from tests.factories import ReservationMetadataFieldFactory, ReservationMetadataSetFactory
from tests.gql_builders import build_query
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_metadata_sets__query(graphql):
    field_1 = ReservationMetadataFieldFactory.create(field_name="reservee_first_name")
    field_2 = ReservationMetadataFieldFactory.create(field_name="reservee_last_name")
    field_3 = ReservationMetadataFieldFactory.create(field_name="reservee_phone")

    field_set = ReservationMetadataSetFactory.create(
        name="Test form",
        supported_fields=[field_1, field_2, field_3],
        required_fields=[field_1, field_2],
    )

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = build_query("metadataSets", fields="name supportedFields requiredFields", connection=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1

    assert response.node() == {
        "name": field_set.name,
        "requiredFields": ["reservee_first_name", "reservee_last_name"],
        "supportedFields": ["reservee_first_name", "reservee_last_name", "reservee_phone"],
    }
