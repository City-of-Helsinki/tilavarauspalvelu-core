from __future__ import annotations

import pytest

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient

from tests.factories import UserFactory
from tests.helpers import patch_method

from .helpers import REFRESH_MUTATION, get_order

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_refresh_order__anonymous_user(graphql):
    order = get_order()

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert response.error_message() == "No permission to mutate."


def test_refresh_order__regular_user(graphql):
    order = get_order()

    graphql.login_with_regular_user()

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert response.error_message() == "No permission to mutate."


@patch_method(VerkkokauppaAPIClient.get_payment, return_value=None)
@patch_method(SentryLogger.log_message)
def test_refresh_order__order_owner(graphql):
    user = graphql.login_with_regular_user()
    order = get_order(user=user)

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.call_count == 1

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Unable to check order payment"]

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_payment, return_value=None)
@patch_method(SentryLogger.log_message)
def test_refresh_order__general_admin__can_manage_reservations(graphql):
    order = get_order()

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.call_count == 1

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Unable to check order payment"]

    assert SentryLogger.log_message.call_count == 1
