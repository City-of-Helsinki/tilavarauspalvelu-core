from __future__ import annotations

import pytest

from tests.factories import ApplicationFactory, UserFactory

from .helpers import WORKING_MEMO_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application__update_working_memo__regular_user(graphql):
    application = ApplicationFactory.create_in_status_draft(working_memo="foo")

    graphql.force_login(application.user)

    input_data = {
        "pk": application.id,
        "workingMemo": "123",
    }
    response = graphql(WORKING_MEMO_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."


def test_application__update_working_memo__general_admin(graphql):
    application = ApplicationFactory.create_in_status_draft(working_memo="foo")

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    input_data = {
        "pk": application.id,
        "workingMemo": "123",
    }
    response = graphql(WORKING_MEMO_MUTATION, input_data=input_data)

    assert response.has_errors is False, response

    application.refresh_from_db()
    assert application.working_memo == "123"


def test_application__update_working_memo__blank(graphql):
    application = ApplicationFactory.create_in_status_draft(working_memo="foo")

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    input_data = {
        "pk": application.id,
        "workingMemo": "",
    }
    response = graphql(WORKING_MEMO_MUTATION, input_data=input_data)

    assert response.has_errors is False, response

    application.refresh_from_db()
    assert application.working_memo == ""
