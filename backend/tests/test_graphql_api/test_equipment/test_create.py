import pytest

from tilavarauspalvelu.models import Equipment

from tests.factories import EquipmentCategoryFactory

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment__create(graphql):
    category = EquipmentCategoryFactory.create()
    data = {"name": "foo", "category": category.pk}

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    equipment = Equipment.objects.get(pk=response.first_query_object["pk"])
    assert equipment.name_fi == "foo"
    assert equipment.category.pk == category.pk
