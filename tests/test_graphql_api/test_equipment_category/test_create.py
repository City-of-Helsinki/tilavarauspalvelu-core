import pytest

from reservation_units.models import EquipmentCategory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment_category__create(graphql):
    data = {"nameFi": "foo"}

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    category = EquipmentCategory.objects.get(pk=response.first_query_object["pk"])
    assert category.name_fi == "foo"


def test_equipment_category__create__empty_name(graphql):
    data = {"nameFi": ""}

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "nameFi is required."
    assert EquipmentCategory.objects.count() == 0
