from __future__ import annotations

import pytest

from tests.factories import ApplicationFactory, ApplicationSectionFactory, UnitFactory, UnitGroupFactory, UserFactory

from .helpers import applications_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application__anonymous_user(graphql):
    # given:
    # - There is an application in the system
    # - An anonymous user is using the system
    ApplicationFactory.create_in_status_draft()

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response complains about permissions
    assert response.error_message() == "No permission to access node."


def test_application__regular_user__other_users_applications(graphql):
    # given:
    # - There is an application in the system
    # - A regular user is using the system
    ApplicationFactory.create_in_status_draft()
    graphql.login_with_regular_user()

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, but is empty
    assert response.has_errors is False, response
    assert response.edges == []


def test_application__regular_user__own_applications(graphql):
    # given:
    # - There is an application in the system
    # - The application owner is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.force_login(application.user)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, and contains the application
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": application.pk}


def test_application__unit_admin(graphql):
    # given:
    # - There is an application section in an application with an event reservation unit
    # - A unit admin for that unit is using the system
    section = ApplicationSectionFactory.create_in_status_unallocated(
        reservation_unit_options__reservation_unit__unit__name="foo",
    )
    unit = section.reservation_unit_options.first().reservation_unit.unit
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, and contains the application
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": section.application.pk}


def test_application__unit_admin__other_units(graphql):
    unit = UnitFactory.create(name="foo")
    ApplicationSectionFactory.create_in_status_unallocated(
        reservation_unit_options__reservation_unit__unit__name="bar",
    )
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    response = graphql(applications_query())

    assert response.has_errors is False, response
    assert response.edges == []


def test_application__unit_group_admin(graphql):
    # given:
    # - There is an application section in an application with a reservation unit option
    # - A unit group admin for that unit's group is using the system
    event = ApplicationSectionFactory.create_in_status_unallocated(
        reservation_unit_options__reservation_unit__unit__unit_groups__name="foo",
    )
    unit_group = event.reservation_unit_options.first().reservation_unit.unit.unit_groups.first()
    admin = UserFactory.create_with_unit_role(unit_groups=[unit_group])
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, and contains the application
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": event.application.pk}


def test_application__unit_group_admin__other_unit_groups(graphql):
    # given:
    # - There is an application section in an application with a reservation unit option
    # - A unit group admin for some other unit group is using the system
    ApplicationSectionFactory.create_in_status_unallocated(
        reservation_unit_options__reservation_unit__unit__unit_groups__name="foo",
    )
    unit_group = UnitGroupFactory.create(name="bar")
    admin = UserFactory.create_with_unit_role(unit_groups=[unit_group])
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, but is empty
    assert response.has_errors is False, response
    assert response.edges == []


def test_application__general_admin(graphql):
    # given:
    # - There is an application in the system
    # - The general admin is using the system
    application = ApplicationFactory.create_in_status_draft()
    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, and contains the application
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": application.pk}


def test_application__regular_user__working_memo(graphql):
    # given:
    # - There is an application in the system
    # - The application user is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.force_login(application.user)

    # when:
    # - User tries to search for applications working memo
    response = graphql(applications_query(fields="workingMemo"))

    # then:
    # - The response complains about permissions to working memo.
    assert response.error_message("workingMemo") == "No permission to access field."


def test_application__unit_admin__working_memo(graphql):
    # given:
    # - There is an application section in an application with a reservation unit option
    # - A unit admin for that unit is using the system
    section = ApplicationSectionFactory.create_in_status_unallocated(
        reservation_unit_options__reservation_unit__unit__name="foo",
    )
    option = section.reservation_unit_options.first()
    admin = UserFactory.create_with_unit_role(units=[option.reservation_unit.unit])
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications working memo
    response = graphql(applications_query(fields="workingMemo"))

    # then:
    # - The response has no errors
    assert response.has_errors is False, response


def test_application__unit_admin__user(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated(
        reservation_unit_options__reservation_unit__unit__name="foo",
    )
    user = section.application.user
    unit = section.reservation_unit_options.first().reservation_unit.unit
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    response = graphql(applications_query(fields="user { firstName lastName }"))

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"user": {"firstName": user.first_name, "lastName": user.last_name}}
