import pytest

from tests.factories import ApplicationSectionFactory, UnitFactory, UnitGroupFactory, UserFactory
from tests.test_graphql_api.test_application_section.helpers import sections_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_sections__query__perms__anonymous_user(graphql):
    # given:
    # - There is an application section
    # - An anonymous user is using the system
    ApplicationSectionFactory.create_in_status_unallocated()

    # when:
    # - The user queries for application sections
    response = graphql(sections_query())

    # then:
    # - The response contains an error about permissions
    assert response.error_message() == "No permission to access node."


def test_application_sections__query__perms__superuser(graphql):
    # given:
    # - There are two application sections
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_with_superuser()

    # when:
    # - The user queries for application sections
    response = graphql(sections_query())

    # then:
    # - The response contains all sections
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_sections__query__perms__regular_user(graphql):
    # given:
    # - There are two application sections
    # - The owner of one of those application sections is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    ApplicationSectionFactory.create_in_status_unallocated()
    graphql.force_login(section_1.application.user)

    # when:
    # - The user queries for application sections
    response = graphql(sections_query())

    # then:
    # - The response contains only the application section belonging to the user
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": section_1.pk}


def test_application_sections__query__perms__general_admin(graphql):
    # given:
    # - There are two application sections in different service sectors
    # - A general service sector admin is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_unallocated()
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - The user queries for application sections
    response = graphql(sections_query())

    # then:
    # - The response contains sections from both sectors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_sections__query__perms__test_unit_admin(graphql):
    # given:
    # - There are two application sections with different units
    # - A unit admin for one of those units is using the system
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        reservation_unit_options__reservation_unit__unit=unit_1,
    )
    ApplicationSectionFactory.create_in_status_unallocated(
        reservation_unit_options__reservation_unit__unit=unit_2,
    )
    user = UserFactory.create_with_unit_role(units=[unit_1])
    graphql.force_login(user)

    # when:
    # - The user queries for application sections
    response = graphql(sections_query())

    # then:
    # - The response contains only the application section belonging to the user's administered unit
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": section_1.pk}


def test_application_sections__query__perms__unit_group_admin(graphql):
    # given:
    # - There are two application sections with different unit groups
    # - A unit admin for one of those unit groups is using the system
    group_1 = UnitGroupFactory.create()
    group_2 = UnitGroupFactory.create()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        reservation_unit_options__reservation_unit__unit__unit_groups=[group_1],
    )
    ApplicationSectionFactory.create_in_status_unallocated(
        reservation_unit_options__reservation_unit__unit__unit_groups=[group_2],
    )
    user = UserFactory.create_with_unit_role(unit_groups=[group_1])
    graphql.force_login(user)

    # when:
    # - The user queries for application sections
    response = graphql(sections_query())

    # then:
    # - The response contains only the application section belonging to the user's administered unit group
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": section_1.pk}
