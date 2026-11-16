from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import ParticipantGenderFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_participant_gender__query(graphql):
    participant_gender = ParticipantGenderFactory.create()

    fields = """
        pk
        nameFi
        nameSv
        nameEn
        rank
    """
    query = build_query("participantGenders", fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == [
        {
            "pk": participant_gender.pk,
            "nameFi": participant_gender.name_fi,
            "nameSv": participant_gender.name_sv,
            "nameEn": participant_gender.name_en,
            "rank": participant_gender.rank,
        },
    ]


def test_participant_gender__order__by_rank(graphql):
    participant_gender_1 = ParticipantGenderFactory.create(rank=2)
    participant_gender_2 = ParticipantGenderFactory.create(rank=0)
    participant_gender_3 = ParticipantGenderFactory.create(rank=1)

    query = build_query("participantGenders", order_by="rankAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == [
        {"pk": participant_gender_2.pk},
        {"pk": participant_gender_3.pk},
        {"pk": participant_gender_1.pk},
    ]
