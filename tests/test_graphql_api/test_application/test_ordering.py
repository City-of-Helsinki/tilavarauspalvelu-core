import pytest

from applications.choices import ApplicantTypeChoice
from tests.factories import ApplicationFactory, ApplicationSectionFactory, ReservationUnitOptionFactory
from tests.helpers import UserType

from .helpers import applications_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application__order__by_pk(graphql):
    # given:
    # - There are two applications in the system
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft()
    application_2 = ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications ordered by pk ascending
    response = graphql(applications_query(order_by="pkAsc"))

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": application_1.pk}
    assert response.node(1) == {"pk": application_2.pk}

    # when:
    # - User tries to search for applications ordered by pk descending
    response = graphql(applications_query(order_by="pkDesc"))

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": application_2.pk}
    assert response.node(1) == {"pk": application_1.pk}


def test_application__order__by_applicant(graphql):
    # given:
    # - There are two applications in the system with different applicants
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft(organisation__name="aaa")
    application_2 = ApplicationFactory.create_in_status_draft(organisation__name="bbb")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications ordered by applicant pk ascending
    response = graphql(applications_query(order_by="applicantAsc"))

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": application_1.pk}
    assert response.node(1) == {"pk": application_2.pk}

    # when:
    # - User tries to search for applications ordered by applicant pk ascending
    response = graphql(applications_query(order_by="applicantDesc"))

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": application_2.pk}
    assert response.node(1) == {"pk": application_1.pk}


def test_application__order__by_applicant_type(graphql):
    # given:
    # - There are four applications in the system with different applicant types
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.ASSOCIATION)
    application_2 = ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.INDIVIDUAL)
    application_3 = ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.COMMUNITY)
    application_4 = ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.COMPANY)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications ordered by applicant types ascending
    response = graphql(applications_query(order_by="applicantTypeAsc"))

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 4
    assert response.node(0) == {"pk": application_1.pk}
    assert response.node(1) == {"pk": application_3.pk}
    assert response.node(2) == {"pk": application_2.pk}
    assert response.node(3) == {"pk": application_4.pk}

    # when:
    # - User tries to search for applications ordered by applicant type descending
    response = graphql(applications_query(order_by="applicantTypeDesc"))

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 4
    assert response.node(0) == {"pk": application_4.pk}
    assert response.node(1) == {"pk": application_2.pk}
    assert response.node(2) == {"pk": application_3.pk}
    assert response.node(3) == {"pk": application_1.pk}


def test_application__order__by_status(graphql):
    # given:
    # - There are applications in the system with different statuses
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_cancelled()
    application_2 = ApplicationFactory.create_in_status_draft()
    application_3 = ApplicationFactory.create_in_status_received()
    application_4 = ApplicationFactory.create_in_status_result_sent()
    application_5 = ApplicationFactory.create_in_status_expired()
    application_6 = ApplicationFactory.create_in_status_handled()
    application_7 = ApplicationFactory.create_in_status_in_allocation()

    graphql.login_with_superuser()

    # when:
    # - User tries to search for applications ordered by application statuses ascending
    response = graphql(applications_query(order_by="statusAsc"))

    # then:
    # - The response contains the applications in the wanted order
    assert len(response.edges) == 7
    assert response.node(0) == {"pk": application_2.pk}
    assert response.node(1) == {"pk": application_1.pk}
    assert response.node(2) == {"pk": application_5.pk}
    assert response.node(3) == {"pk": application_3.pk}
    assert response.node(4) == {"pk": application_7.pk}
    assert response.node(5) == {"pk": application_6.pk}
    assert response.node(6) == {"pk": application_4.pk}

    # when:
    # - User tries to search for applications ordered by application statuses descending
    response = graphql(applications_query(order_by="statusDesc"))

    # then:
    # - The response contains the applications in the wanted order
    assert len(response.edges) == 7
    assert response.node(0) == {"pk": application_4.pk}
    assert response.node(1) == {"pk": application_6.pk}
    assert response.node(2) == {"pk": application_7.pk}
    assert response.node(3) == {"pk": application_3.pk}
    assert response.node(4) == {"pk": application_5.pk}
    assert response.node(5) == {"pk": application_1.pk}
    assert response.node(6) == {"pk": application_2.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application__order__by_preferred_unit_name(graphql, lang):
    # given:
    # - There are two applications in the system
    # - The applications have a variety of application sections and reservation units options
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft_no_sections()
    ReservationUnitOptionFactory.create(
        application_section__application=application_1,
        preferred_order=0,
        **{f"reservation_unit__unit__name_{lang}": "C unit"},
    )
    # Not counted since not on the first application section of the application
    ReservationUnitOptionFactory.create(
        application_section__application=application_1,
        preferred_order=0,
        **{f"reservation_unit__unit__name_{lang}": "A unit"},
    )

    application_2 = ApplicationFactory.create_in_status_draft_no_sections()
    section = ApplicationSectionFactory.create(application=application_2)
    ReservationUnitOptionFactory.create(
        application_section=section,
        preferred_order=0,
        **{f"reservation_unit__unit__name_{lang}": "B unit"},
    )
    # Not counted since preferred order not 0
    ReservationUnitOptionFactory.create(
        application_section=section,
        preferred_order=1,
        **{f"reservation_unit__unit__name_{lang}": "A unit"},
    )

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications ordered by preferred unit name in the given language ascending
    response = graphql(applications_query(order_by=f"preferredUnitName{lang.capitalize()}Asc"))

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": application_2.pk}
    assert response.node(1) == {"pk": application_1.pk}

    # when:
    # - User tries to search for applications ordered by preferred unit name in the given language descending
    response = graphql(applications_query(order_by=f"preferredUnitName{lang.capitalize()}Desc"))

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": application_1.pk}
    assert response.node(1) == {"pk": application_2.pk}
