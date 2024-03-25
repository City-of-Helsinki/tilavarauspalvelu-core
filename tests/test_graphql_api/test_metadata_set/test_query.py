import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import ReservationMetadataFieldFactory, ReservationMetadataSetFactory
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
    fields = "name supportedFields { fieldName } requiredFields { fieldName }"
    query = build_query("metadataSets", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1

    assert response.node() == {
        "name": field_set.name,
        "requiredFields": [
            {
                "fieldName": "reservee_first_name",
            },
            {
                "fieldName": "reservee_last_name",
            },
        ],
        "supportedFields": [
            {
                "fieldName": "reservee_first_name",
            },
            {
                "fieldName": "reservee_last_name",
            },
            {
                "fieldName": "reservee_phone",
            },
        ],
    }
