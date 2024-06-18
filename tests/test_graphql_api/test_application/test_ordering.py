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


@pytest.mark.parametrize(
    ("lang", "order"),
    [
        ("fi", [0, 1, 2, 3]),
        ("sv", [0, 1, 2, 3]),
        ("en", [1, 0, 2, 3]),
    ],
)
@pytest.mark.parametrize("direction", ["asc", "desc"])
def test_application__order__by_preferred_unit_name(graphql, lang, order, direction):
    order = list(reversed(order)) if direction == "desc" else order

    applications = {
        0: ApplicationFactory.create_in_status_draft_no_sections(),
        1: ApplicationFactory.create_in_status_draft_no_sections(),
        2: ApplicationFactory.create_in_status_draft_no_sections(),
        3: ApplicationFactory.create_in_status_draft_no_sections(),
    }

    section_1 = ApplicationSectionFactory.create(application=applications[0])
    section_2 = ApplicationSectionFactory.create(application=applications[1])
    section_3 = ApplicationSectionFactory.create(application=applications[2])

    ReservationUnitOptionFactory.create(
        application_section=section_1,
        preferred_order=0,
        reservation_unit__unit__name="A",
        reservation_unit__unit__name_fi="A",
        reservation_unit__unit__name_sv="A",
        reservation_unit__unit__name_en="B",
    )
    ReservationUnitOptionFactory.create(
        application_section=section_2,
        preferred_order=0,
        reservation_unit__unit__name="B",
        reservation_unit__unit__name_fi="B",
        reservation_unit__unit__name_sv="B",
        reservation_unit__unit__name_en="A",
    )
    # Not counted since preferred order not 0
    ReservationUnitOptionFactory.create(
        application_section=section_3,
        preferred_order=1,
        reservation_unit__unit__name="A",
        reservation_unit__unit__name_fi="A",
        reservation_unit__unit__name_sv="A",
        reservation_unit__unit__name_en="A",
    )

    graphql.login_with_superuser()

    query = applications_query(
        order_by=[
            f"preferredUnitName{lang.capitalize()}{direction.capitalize()}",
            f"pk{direction.capitalize()}",
        ]
    )
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 4

    assert response.node(0) == {"pk": applications[order[0]].pk}
    assert response.node(1) == {"pk": applications[order[1]].pk}
    assert response.node(2) == {"pk": applications[order[2]].pk}
    assert response.node(3) == {"pk": applications[order[3]].pk}
