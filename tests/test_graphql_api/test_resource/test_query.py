import datetime

import pytest

from tests.factories import ResourceFactory
from tests.helpers import UserType

from .helpers import resource_by_pk_query, resources_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resources__query__all_fields(graphql):
    resource = ResourceFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        pk
        nameFi
        nameSv
        nameEn
        locationType
        bufferTimeBefore
        bufferTimeAfter
        space {
            pk
        }
    """

    query = resources_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": resource.pk,
        "nameFi": resource.name_fi,
        "nameSv": resource.name_sv,
        "nameEn": resource.name_en,
        "locationType": resource.location_type.upper(),
        "bufferTimeBefore": resource.buffer_time_before,
        "bufferTimeAfter": resource.buffer_time_after,
        "space": {
            "pk": resource.space.pk,
        },
    }


def test_resource_by_pk__buffer_times(graphql):
    resource = ResourceFactory.create(
        buffer_time_before=datetime.timedelta(minutes=15),
        buffer_time_after=datetime.timedelta(minutes=30),
    )

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        pk
        bufferTimeBefore
        bufferTimeAfter
    """

    query = resource_by_pk_query(fields=fields, pk=resource.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert response.first_query_object == {
        "pk": resource.pk,
        "bufferTimeBefore": resource.buffer_time_before.total_seconds(),
        "bufferTimeAfter": resource.buffer_time_after.total_seconds(),
    }


def test_resource_by_pk__not_found(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = resource_by_pk_query(pk=1)
    response = graphql(query)

    assert response.error_message() == "No Resource matches the given query."
