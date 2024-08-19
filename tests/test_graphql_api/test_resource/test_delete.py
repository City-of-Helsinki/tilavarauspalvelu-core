import pytest

from resources.models import Resource
from tests.factories import ResourceFactory

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
