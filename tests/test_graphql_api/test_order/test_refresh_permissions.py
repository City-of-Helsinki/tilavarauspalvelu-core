import pytest

from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tests.factories import UserFactory
from tests.helpers import UserType, patch_method

from .helpers import REFRESH_MUTATION, get_order

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_refresh_order__anonymous_user(graphql):
    order = get_order()
    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert response.error_message() == "No permission to refresh the order"


def test_refresh_order__regular_user(graphql):
    order = get_order()
    graphql.login_user_based_on_type(UserType.REGULAR)

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert response.error_message() == "No permission to refresh the order"


@patch_method(VerkkokauppaAPIClient.get_payment, return_value=None)
def test_refresh_order__order_owner(graphql):
    user = graphql.login_user_based_on_type(UserType.REGULAR)
    order = get_order(user=user)

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.call_count == 1
    assert response.error_message() == "Unable to check order payment"


@patch_method(VerkkokauppaAPIClient.get_payment, return_value=None)
def test_refresh_order__general_admin__can_manage_reservations(graphql):
    order = get_order()

    user = UserFactory.create_with_general_permissions(perms=["can_manage_reservations"])
    graphql.force_login(user)

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.call_count == 1
    assert response.error_message() == "Unable to check order payment"
