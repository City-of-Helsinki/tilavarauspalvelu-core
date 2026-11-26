from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.models import Resource

from tests.factories import ReservationUnitFactory, ResourceFactory

from .helpers import DELETE_MUTATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__delete(graphql: GraphQLClient) -> None:
    resource = ResourceFactory.create()
    graphql.login_with_superuser()

    response = graphql(DELETE_MUTATION, input_data={"pk": resource.pk})

    assert response.has_errors is False

    assert Resource.objects.count() == 0


def test_resource__delete__in_use(graphql: GraphQLClient) -> None:
    resource = ResourceFactory.create()
    ReservationUnitFactory.create(resources=[resource])
    graphql.login_with_superuser()

    response = graphql(DELETE_MUTATION, input_data={"pk": resource.pk})

    assert response.field_error_messages() == ["Cannot delete resource which has associated reservation units"]

    assert Resource.objects.count() == 1
