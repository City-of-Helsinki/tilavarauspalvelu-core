import pytest

from applications.choices import ApplicantTypeChoice
from tests.factories import ApplicationEventFactory, ApplicationFactory
from tests.helpers import UserType

from .helpers import applications_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_application__filter__by_pk__single(graphql):
    # given:
    # - There are two applications in the system
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications by a single primary key
    response = graphql(applications_query(pk=application.pk))

    # then:
    # - The response contains the application with the given primary key
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_pk__multiple(graphql):
    # given:
    # - There are two applications in the system
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft()
    application_2 = ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications by multiple primary keys
    response = graphql(applications_query(pk=[application_1.pk, application_2.pk]))

    # then:
    # - The response contains the applications with the given primary keys
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": application_1.pk}
    assert response.node(1) == {"pk": application_2.pk}


def test_application__filter__by_application_round(graphql):
    # given:
    # - There are two applications in the system
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications in an application round
    response = graphql(applications_query(application_round=application.application_round.pk))

    # then:
    # - The response contains the application with the given application round
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_applicant_type__single(graphql):
    # given:
    # - There are two applications in the system with different applicant types
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.COMPANY)
    ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.INDIVIDUAL)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications by a single applicant type
    response = graphql(applications_query(applicant_type=application.applicant_type))

    # then:
    # - The response contains the application with the given applicant type
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_applicant_type__multiple(graphql):
    # given:
    # - There are two applications in the system with different applicant types
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.COMPANY)
    application_2 = ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.INDIVIDUAL)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications by a multiple applicant types
    response = graphql(
        applications_query(
            applicant_type=[
                application_1.applicant_type,
                application_2.applicant_type,
            ],
        ),
    )

    # then:
    # - The response contains the application with the given applicant types
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": application_1.pk}
    assert response.node(1) == {"pk": application_2.pk}


def test_application__filter__by_status__single(graphql):
    # given:
    # - There are two applications in the system with different statuses
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    ApplicationFactory.create_in_status_received()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications with a specific status
    response = graphql(applications_query(status=application.status))

    # then:
    # - The response contains the application with the given applicant type
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_status__multiple(graphql):
    # given:
    # - There are two applications in the system with different statuses
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft()
    application_2 = ApplicationFactory.create_in_status_received()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications with a specific statuses
    response = graphql(applications_query(status=[application_1.status, application_2.status]))

    # then:
    # - The response contains the applications in the specific statuses
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": application_1.pk}
    assert response.node(1) == {"pk": application_2.pk}


def test_application__filter__by_unit__single(graphql):
    # given:
    # - There are two applications in the system with different application event units
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        application_events__event_reservation_units__reservation_unit__unit__name="Unit 1",
    )
    ApplicationFactory.create_in_status_draft(
        application_events__event_reservation_units__reservation_unit__unit__name="Unit 2",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    unit = application.application_events.first().event_reservation_units.first().reservation_unit.unit

    # when:
    # - User tries to search for applications with a specific unit
    response = graphql(applications_query(unit=unit.pk))

    # then:
    # - The response contains the application with the given unit
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_unit__multiple(graphql):
    # given:
    # - There are two applications in the system with different application event units
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft(
        application_events__event_reservation_units__reservation_unit__unit__name="Unit 1",
    )
    application_2 = ApplicationFactory.create_in_status_draft(
        application_events__event_reservation_units__reservation_unit__unit__name="Unit 2",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    unit_1 = application_1.application_events.first().event_reservation_units.first().reservation_unit.unit
    unit_2 = application_2.application_events.first().event_reservation_units.first().reservation_unit.unit

    # when:
    # - User tries to search for applications with a specific units
    response = graphql(applications_query(unit=[unit_1.pk, unit_2.pk]))

    # then:
    # - The response contains the application with the given units
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": application_1.pk}
    assert response.node(1) == {"pk": application_2.pk}


def test_application__filter__by_applicant(graphql):
    # given:
    # - There are two applications in the system with different applicants
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(user__first_name="foo")
    ApplicationFactory.create_in_status_draft(user__first_name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for applications by an applicant
    response = graphql(applications_query(applicant=application.user.pk))

    # then:
    # - The response contains the application with the given applicant
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_text_search__event_name(graphql):
    # given:
    # - There are two applications with one application events each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft(organisation=None, contact_person=None, user=None)
    application_2 = ApplicationFactory.create_in_status_draft(organisation=None, contact_person=None, user=None)
    ApplicationEventFactory.create_in_status_unallocated(application=application_1, name="foo")
    ApplicationEventFactory.create_in_status_unallocated(application=application_2, name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications with a text search
    query = applications_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application_1.pk}


def test_application__filter__by_text_search__event_name__prefix(graphql):
    # given:
    # - There are two applications with one application events each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft(organisation=None, contact_person=None, user=None)
    application_2 = ApplicationFactory.create_in_status_draft(organisation=None, contact_person=None, user=None)
    ApplicationEventFactory.create_in_status_unallocated(application=application_1, name="foo")
    ApplicationEventFactory.create_in_status_unallocated(application=application_2, name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications with a text search, which is only a prefix match
    query = applications_query(text_search="fo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application_1.pk}


def test_application__filter__by_text_search__event_name__has_quotes(graphql):
    # given:
    # - There are two applications with one application events each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft(organisation=None, contact_person=None, user=None)
    application_2 = ApplicationFactory.create_in_status_draft(organisation=None, contact_person=None, user=None)
    ApplicationEventFactory.create_in_status_unallocated(application=application_1, name="Moe's Bar")
    ApplicationEventFactory.create_in_status_unallocated(application=application_2, name="Bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications with a text search, which is only a partial match
    query = applications_query(text_search="Moe's")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application_1.pk}


def test_application__filter__by_text_search__applicant__organisation_name(graphql):
    # given:
    # - There are two applications
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(organisation__name="foo", contact_person=None, user=None)
    ApplicationFactory.create_in_status_draft(organisation__name="bar", contact_person=None, user=None)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications with a text search
    query = applications_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_text_search__applicant__contact_person_first_name(graphql):
    # given:
    # - There are two applications
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person__first_name="foo",
        contact_person__last_name="none",
        user=None,
    )
    ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person__first_name="bar",
        contact_person__last_name="none",
        user=None,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications with a text search
    query = applications_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_text_search__applicant__contact_person_last_name(graphql):
    # given:
    # - There are two applications
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person__first_name="none",
        contact_person__last_name="foo",
        user=None,
    )
    ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person__first_name="none",
        contact_person__last_name="bar",
        user=None,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications with a text search
    query = applications_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_text_search__applicant__user_first_name(graphql):
    # given:
    # - There are two applications
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person=None,
        user__first_name="foo",
        user__last_name="none",
    )
    ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person=None,
        user__first_name="bar",
        user__last_name="none",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications with a text search
    query = applications_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_text_search__applicant__user_last_name(graphql):
    # given:
    # - There are two applications
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person=None,
        user__first_name="none",
        user__last_name="foo",
    )
    ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person=None,
        user__first_name="none",
        user__last_name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications with a text search
    query = applications_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_text_search__event_id(graphql):
    # given:
    # - There are two applications with one application events each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft(organisation=None, contact_person=None, user=None)
    application_2 = ApplicationFactory.create_in_status_draft(organisation=None, contact_person=None, user=None)
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application_1, name="foo")
    ApplicationEventFactory.create_in_status_unallocated(application=application_2, name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications with a text search
    query = applications_query(text_search=f"{event_1.pk}")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application_1.pk}


def test_application__filter__by_text_search__application_id(graphql):
    # given:
    # - There are two applications
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(organisation=None, contact_person=None, user=None)
    ApplicationFactory.create_in_status_draft(organisation=None, contact_person=None, user=None)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications with a text search
    query = applications_query(text_search=f"{application.pk}")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application.pk}


def test_application__filter__by_text_search__not_found(graphql):
    # given:
    # - There is an application with an application event
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        organisation__name="org",
        contact_person__first_name="fizz",
        contact_person__last_name="buzz",
        user__first_name="person",
        user__last_name="one",
    )
    ApplicationEventFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a text search
    query = applications_query(text_search="not found")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains no application events
    assert response.has_errors is False, response
    assert len(response.edges) == 0, response
