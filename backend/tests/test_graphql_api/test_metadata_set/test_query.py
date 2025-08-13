from __future__ import annotations

import pytest

from tests.factories import ReservationMetadataFieldFactory, ReservationMetadataSetFactory
from tests.query_builder import build_query

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

    graphql.login_with_superuser()
    fields = "name supportedFields { fieldName } requiredFields { fieldName }"
    query = build_query("allMetadataSets", fields=fields)
    response = graphql(query)

    assert response.has_errors is False
    assert response.results == [
        {
            "name": field_set.name,
            "requiredFields": [
                {"fieldName": "reservee_first_name"},
                {"fieldName": "reservee_last_name"},
            ],
            "supportedFields": [
                {"fieldName": "reservee_first_name"},
                {"fieldName": "reservee_last_name"},
                {"fieldName": "reservee_phone"},
            ],
        }
    ]
