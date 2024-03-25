import pytest

from reservation_units.models import Equipment
from tests.factories import EquipmentCategoryFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment__create(graphql):
    category = EquipmentCategoryFactory.create()
    data = {"name": "foo", "category": category.pk}

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    equipment = Equipment.objects.get(pk=response.first_query_object["pk"])
    assert equipment.name_fi == "foo"
    assert equipment.category.pk == category.pk
