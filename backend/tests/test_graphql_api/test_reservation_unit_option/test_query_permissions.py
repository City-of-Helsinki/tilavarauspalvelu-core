from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import ApplicationFactory, UserFactory

from .helpers import section_options_query

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_option__query__perms__superuser(graphql):
    application = ApplicationFactory.create_in_status_handled()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()

    assert option is not None

    graphql.login_with_superuser()

    query = section_options_query()
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1

    assert response.node(0) == {"reservationUnitOptions": [{"pk": option.pk}]}


def test_reservation_unit_option__query__perms__general_admin(graphql):
    application = ApplicationFactory.create_in_status_handled()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()

    assert option is not None

    user = UserFactory.create_with_general_role(role=UserRoleChoice.ADMIN)
    graphql.force_login(user)

    query = section_options_query()
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1

    assert response.node(0) == {"reservationUnitOptions": [{"pk": option.pk}]}


def test_reservation_unit_option__query__perms__application_owner(graphql):
    application = ApplicationFactory.create_in_status_handled()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()

    assert option is not None

    graphql.force_login(application.user)

    query = section_options_query()
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1

    assert response.node(0) == {"reservationUnitOptions": [{"pk": option.pk}]}


@pytest.mark.parametrize("field", ["isLocked", "isRejected"])
def test_reservation_unit_option__query__perms__application_owner__cant_see_restricted_info(graphql, field):
    application = ApplicationFactory.create_in_status_handled()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()

    assert option is not None

    graphql.force_login(application.user)

    fields = f"""
        reservationUnitOptions {{
            pk
            {field}
        }}
    """

    query = section_options_query(fields=fields)
    response = graphql(query)

    assert response.error_message(0) == "No permission to access this field"


def test_reservation_unit_option__query__perms__regular_user(graphql):
    application = ApplicationFactory.create_in_status_handled()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()

    assert option is not None

    graphql.login_with_regular_user()

    query = section_options_query()
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 0
