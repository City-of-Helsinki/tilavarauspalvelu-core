from __future__ import annotations

import pytest

from tilavarauspalvelu.models import Resource

from tests.factories import ReservationUnitFactory, ResourceFactory

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__delete(graphql):
    resource = ResourceFactory.create()
    graphql.login_with_superuser()

    response = graphql(DELETE_MUTATION, input_data={"pk": resource.pk})

    assert response.has_errors is False

    assert Resource.objects.count() == 0


def test_resource__delete__in_use(graphql):
    resource = ResourceFactory.create()
    ReservationUnitFactory.create(resources=[resource])
    graphql.login_with_superuser()

    response = graphql(DELETE_MUTATION, input_data={"pk": resource.pk})

    assert response.has_errors is True

    assert Resource.objects.count() == 1
