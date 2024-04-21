import pytest

from tests.factories import ApplicationFactory, ApplicationRoundFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_round.helpers import rounds_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_can_query_application_rounds__all_fields(graphql):
    # given:
    # - There are two application rounds
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_open()
    ApplicationRoundFactory.create_in_status_open()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        nameFi
        nameEn
        nameSv
        targetGroup
        criteriaFi
        criteriaEn
        criteriaSv
        notesWhenApplyingFi
        notesWhenApplyingEn
        notesWhenApplyingSv
        applicationPeriodBegin
        applicationPeriodEnd
        reservationPeriodBegin
        reservationPeriodEnd
        publicDisplayBegin
        publicDisplayEnd
        handledDate
        sentDate
        reservationUnits {
            nameFi
        }
        purposes {
            nameFi
        }
        serviceSector {
            nameFi
        }
        termsOfUse {
            nameFi
        }
        status
        statusTimestamp
        applicationsCount
        reservationUnitCount
    """

    # when:
    # - The user queries application rounds with all fields
    response = graphql(rounds_query(fields=fields))

    # then:
    # - The response contains the selected fields from both application rounds
    assert len(response.edges) == 2, response
    assert response.node(0) == {
        "nameFi": application_round.name_fi,
        "nameEn": application_round.name_en,
        "nameSv": application_round.name_sv,
        "targetGroup": application_round.target_group,
        "criteriaFi": application_round.criteria_fi,
        "criteriaEn": application_round.criteria_en,
        "criteriaSv": application_round.criteria_sv,
        "notesWhenApplyingFi": application_round.notes_when_applying_fi,
        "notesWhenApplyingEn": application_round.notes_when_applying_en,
        "notesWhenApplyingSv": application_round.notes_when_applying_sv,
        "applicationPeriodBegin": application_round.application_period_begin.isoformat(),
        "applicationPeriodEnd": application_round.application_period_end.isoformat(),
        "reservationPeriodBegin": application_round.reservation_period_begin.isoformat(),
        "reservationPeriodEnd": application_round.reservation_period_end.isoformat(),
        "publicDisplayBegin": application_round.public_display_begin.isoformat(),
        "publicDisplayEnd": application_round.public_display_end.isoformat(),
        "handledDate": None,
        "sentDate": None,
        "reservationUnits": [],
        "purposes": [],
        "serviceSector": {"nameFi": application_round.service_sector.name_fi},
        "termsOfUse": {"nameFi": application_round.terms_of_use.name_fi},
        "status": application_round.status,
        "statusTimestamp": application_round.status_timestamp.isoformat(),
        "applicationsCount": 0,
        "reservationUnitCount": 0,
    }


def test_applications_count_does_not_include_draft_applications(graphql):
    # given:
    # - There is a single application round with two applications, one of which is a draft
    application_round = ApplicationRoundFactory.create_in_status_open()
    ApplicationFactory.create_in_status_draft(application_round=application_round)
    ApplicationFactory.create_in_status_received(application_round=application_round)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user queries for application rounds' applications count
    response = graphql(rounds_query(fields="applicationsCount"))

    # then:
    # - The applications count does not include the draft application
    assert len(response.edges) == 1, response
    assert response.node(0) == {"applicationsCount": 1}


def test_applications_count_does_not_include_expired_applications(graphql):
    # given:
    # - There is a single application round with two applications, one of which is expired
    application_round = ApplicationRoundFactory.create_in_status_handled()
    ApplicationFactory.create_in_status_expired(application_round=application_round)
    ApplicationFactory.create_in_status_handled(application_round=application_round)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user queries for application rounds' applications count
    response = graphql(rounds_query(fields="applicationsCount"))

    # then:
    # - The applications count does not include the expired application
    assert len(response.edges) == 1, response
    assert response.node(0) == {"applicationsCount": 1}


def test_applications_count_does_not_include_cancelled_applications(graphql):
    # given:
    # - There is a single application round with two applications, one of which is cancelled
    application_round = ApplicationRoundFactory.create_in_status_handled()
    ApplicationFactory.create_in_status_cancelled(application_round=application_round)
    ApplicationFactory.create_in_status_handled(application_round=application_round)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user queries for application rounds' applications count
    response = graphql(rounds_query(fields="applicationsCount"))

    # then:
    # - The applications count does not include the cancelled application
    assert len(response.edges) == 1, response
    assert response.node(0) == {"applicationsCount": 1}
