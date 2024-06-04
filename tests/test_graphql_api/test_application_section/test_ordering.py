import pytest

from tests.factories import ApplicationFactory, ApplicationSectionFactory, ReservationUnitOptionFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_section.helpers import sections_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_section__order__by_pk__asc(graphql):
    # given:
    # - There are two application sections
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application sections by the primary key ascending
    query = sections_query(order_by="pkAsc")
    response = graphql(query)

    # then:
    # - The response contains the application section in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__order__by_pk__desc(graphql):
    # given:
    # - There are two application sections
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application sections by the primary key descending
    query = sections_query(order_by="pkDesc")
    response = graphql(query)

    # then:
    # - The response contains the application section in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_2.pk}
    assert response.node(1) == {"pk": section_1.pk}


def test_application_section__order__by_application_id__asc(graphql):
    # given:
    # - There are two application sections
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application sections by application id ascending
    query = sections_query(order_by="applicationPkAsc")
    response = graphql(query)

    # then:
    # - The response contains the application section in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__order__by_application_id__desc(graphql):
    # given:
    # - There are two application sections
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application sections by application id descending
    query = sections_query(order_by="applicationPkDesc")
    response = graphql(query)

    # then:
    # - The response contains the application section in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_2.pk}
    assert response.node(1) == {"pk": section_1.pk}


def test_application_section__order__by_name__asc(graphql):
    # given:
    # - There are two application sections
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(name="A")
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(name="B")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application sections by name, ascending
    query = sections_query(order_by="nameAsc")
    response = graphql(query)

    # then:
    # - The response contains the application section in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__order__by_name__asc__case_insensitive(graphql):
    # given:
    # - There are two application sections
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(name="B")
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(name="a")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application sections by name, ascending
    query = sections_query(order_by="nameAsc")
    response = graphql(query)

    # then:
    # - The response contains the application section in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_2.pk}
    assert response.node(1) == {"pk": section_1.pk}


def test_application_section__order__by_name__desc(graphql):
    # given:
    # - There are two application sections
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(name="A")
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(name="B")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application sections by name, descending
    query = sections_query(order_by="nameDesc")
    response = graphql(query)

    # then:
    # - The response contains the application section in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_2.pk}
    assert response.node(1) == {"pk": section_1.pk}


def test_application_section__order__by_applicant__asc(graphql):
    # given:
    # - There are two application sections
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application__organisation__name="A")
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(application__organisation__name="B")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application sections by applicant ascending
    query = sections_query(order_by="applicantAsc")
    response = graphql(query)

    # then:
    # - The response contains the application section in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__order__by_applicant__desc(graphql):
    # given:
    # - There are two application sections
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application__organisation__name="A")
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(application__organisation__name="B")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application sections by applicant descending
    query = sections_query(order_by="applicantDesc")
    response = graphql(query)

    # then:
    # - The response contains the application section in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_2.pk}
    assert response.node(1) == {"pk": section_1.pk}


def test_application_section__order__by_application_status__asc(graphql):
    # given:
    # - There are application sections in the system with different statuses
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_cancelled(application_sections__name="A")
    application_2 = ApplicationFactory.create_in_status_draft(application_sections__name="B")
    application_3 = ApplicationFactory.create_in_status_received(application_sections__name="C")
    application_4 = ApplicationFactory.create_in_status_result_sent(application_sections__name="D")
    application_5 = ApplicationFactory.create_in_status_expired(application_sections__name="E")
    application_6 = ApplicationFactory.create_in_status_handled(application_sections__name="F")
    application_7 = ApplicationFactory.create_in_status_in_allocation(application_sections__name="G")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    pk_cancelled = application_1.application_sections.first().pk
    pk_draft = application_2.application_sections.first().pk
    pk_received = application_3.application_sections.first().pk
    pk_result_sent = application_4.application_sections.first().pk
    pk_expired = application_5.application_sections.first().pk
    pk_handled = application_6.application_sections.first().pk
    pk_in_allocation = application_7.application_sections.first().pk

    # when:
    # - User tries to search for application sections ordered by application statuses ascending
    query = sections_query(order_by="applicationStatusAsc")
    response = graphql(query)

    # then:
    # - The response contains the application sections in the wanted order
    assert len(response.edges) == 7
    assert response.node(0) == {"pk": pk_draft}
    assert response.node(1) == {"pk": pk_cancelled}
    assert response.node(2) == {"pk": pk_expired}
    assert response.node(3) == {"pk": pk_received}
    assert response.node(4) == {"pk": pk_in_allocation}
    assert response.node(5) == {"pk": pk_handled}
    assert response.node(6) == {"pk": pk_result_sent}


def test_application_section__order__by_application_status__desc(graphql):
    # given:
    # - There are application sections in the system with different statuses
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_cancelled(application_sections__name="A")
    application_2 = ApplicationFactory.create_in_status_draft(application_sections__name="B")
    application_3 = ApplicationFactory.create_in_status_received(application_sections__name="C")
    application_4 = ApplicationFactory.create_in_status_result_sent(application_sections__name="D")
    application_5 = ApplicationFactory.create_in_status_expired(application_sections__name="E")
    application_6 = ApplicationFactory.create_in_status_handled(application_sections__name="F")
    application_7 = ApplicationFactory.create_in_status_in_allocation(application_sections__name="G")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    pk_cancelled = application_1.application_sections.first().pk
    pk_draft = application_2.application_sections.first().pk
    pk_received = application_3.application_sections.first().pk
    pk_result_sent = application_4.application_sections.first().pk
    pk_expired = application_5.application_sections.first().pk
    pk_handled = application_6.application_sections.first().pk
    pk_in_allocation = application_7.application_sections.first().pk

    # when:
    # - User tries to search for application sections ordered by application statuses descending
    query = sections_query(order_by="applicationStatusDesc")
    response = graphql(query)

    # then:
    # - The response contains the application sections in the wanted order
    assert len(response.edges) == 7
    assert response.node(0) == {"pk": pk_result_sent}
    assert response.node(1) == {"pk": pk_handled}
    assert response.node(2) == {"pk": pk_in_allocation}
    assert response.node(3) == {"pk": pk_received}
    assert response.node(4) == {"pk": pk_expired}
    assert response.node(5) == {"pk": pk_cancelled}
    assert response.node(6) == {"pk": pk_draft}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application_section__order__by_preferred_unit_name__asc(graphql, lang):
    # given:
    # - There are two application sections in the system
    # - The application sections have a variety of reservation unit options
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    ReservationUnitOptionFactory.create(
        application_section=section_1,
        preferred_order=0,
        **{f"reservation_unit__unit__name_{lang}": "C unit"},
    )

    section_2 = ApplicationSectionFactory.create_in_status_unallocated()
    ReservationUnitOptionFactory.create(
        application_section=section_2,
        preferred_order=0,
        **{f"reservation_unit__unit__name_{lang}": "B unit"},
    )
    # Not counted since not preferred order not 0
    ReservationUnitOptionFactory.create(
        application_section=section_2,
        preferred_order=1,
        **{f"reservation_unit__unit__name_{lang}": "A unit"},
    )

    # Section doesn't have reservation unit options with preferred order 0
    # -> preferred_unit_name is None -> ordered last
    section_3 = ApplicationSectionFactory.create_in_status_unallocated()
    ReservationUnitOptionFactory.create(
        application_section=section_3,
        preferred_order=1,
        **{f"reservation_unit__unit__name_{lang}": "A unit"},
    )

    # Section doesn't have reservation unit options at all
    # -> preferred_unit_name is None -> ordered last
    section_4 = ApplicationSectionFactory.create_in_status_unallocated()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for application sections ordered
    #   by preferred unit name in the given language, ascending
    query = sections_query(order_by=f"preferredUnitName{lang.capitalize()}Asc")
    response = graphql(query)

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 4
    assert response.node(0) == {"pk": section_2.pk}
    assert response.node(1) == {"pk": section_1.pk}
    assert response.node(2) == {"pk": section_3.pk}
    assert response.node(3) == {"pk": section_4.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application_section__order__by_preferred_unit_name__desc(graphql, lang):
    # given:
    # - There are two application sections in the system
    # - The application sections have a variety of reservation unit options
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(reservation_unit_options=None)
    ReservationUnitOptionFactory.create(
        application_section=section_1,
        preferred_order=0,
        **{f"reservation_unit__unit__name_{lang}": "C unit"},
    )

    section_2 = ApplicationSectionFactory.create_in_status_unallocated(reservation_unit_options=None)
    ReservationUnitOptionFactory.create(
        application_section=section_2,
        preferred_order=0,
        **{f"reservation_unit__unit__name_{lang}": "B unit"},
    )
    # Not counted since not preferred order not 0
    ReservationUnitOptionFactory.create(
        application_section=section_2,
        preferred_order=1,
        **{f"reservation_unit__unit__name_{lang}": "A unit"},
    )

    # Section doesn't have reservation unit options with preferred order 0
    # -> preferred_unit_name is None -> ordered first
    section_3 = ApplicationSectionFactory.create_in_status_unallocated(reservation_unit_options=None)
    ReservationUnitOptionFactory.create(
        application_section=section_3,
        preferred_order=1,
        **{f"reservation_unit__unit__name_{lang}": "A unit"},
    )

    # Section doesn't have reservation unit options at all
    # -> preferred_unit_name is None -> ordered first
    section_4 = ApplicationSectionFactory.create_in_status_unallocated(reservation_unit_options=None)

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for application sections ordered
    #   by preferred unit name in the given language, descending
    query = sections_query(order_by=f"preferredUnitName{lang.capitalize()}Desc")
    response = graphql(query)

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 4
    assert response.node(0) == {"pk": section_3.pk}
    assert response.node(1) == {"pk": section_4.pk}
    assert response.node(2) == {"pk": section_1.pk}
    assert response.node(3) == {"pk": section_2.pk}


def test_application_section__order__by_has_allocations__asc(graphql):
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_handled()

    assert section_1.allocations == 0
    assert section_2.allocations == 1

    graphql.login_with_superuser()
    query = sections_query(order_by="hasAllocationsAsc")
    response = graphql(query)

    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__order__by_has_allocations__desc(graphql):
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_handled()

    assert section_1.allocations == 0
    assert section_2.allocations == 1

    graphql.login_with_superuser()
    query = sections_query(order_by="hasAllocationsDesc")
    response = graphql(query)

    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_2.pk}
    assert response.node(1) == {"pk": section_1.pk}


def test_application_section__order__by_allocations__asc(graphql):
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_handled()

    assert section_1.allocations == 0
    assert section_2.allocations == 1

    graphql.login_with_superuser()
    query = sections_query(order_by="allocationsAsc")
    response = graphql(query)

    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__order__by_allocations__desc(graphql):
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_handled()

    assert section_1.allocations == 0
    assert section_2.allocations == 1

    graphql.login_with_superuser()
    query = sections_query(order_by="allocationsDesc")
    response = graphql(query)

    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_2.pk}
    assert response.node(1) == {"pk": section_1.pk}
