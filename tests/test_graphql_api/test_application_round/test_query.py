import datetime

import pytest

from applications.enums import (
    ApplicationRoundReservationCreationStatusChoice,
    ApplicationRoundStatusChoice,
    ApplicationStatusChoice,
)
from common.date_utils import local_datetime
from tests.factories import ApplicationFactory, ApplicationRoundFactory, ReservationFactory, ReservationUnitFactory
from tests.test_graphql_api.test_application_round.helpers import rounds_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_round_query__all_fields(graphql):
    # given:
    # - There are two application rounds
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_open()
    ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser()

    fields = """
        nameFi
        nameEn
        nameSv
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
        termsOfUse {
            nameFi
        }
        status
        statusTimestamp
        applicationsCount
        reservationUnitCount
        isSettingHandledAllowed
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
        "termsOfUse": {"nameFi": application_round.terms_of_use.name_fi},
        "status": application_round.status,
        "statusTimestamp": application_round.status_timestamp.isoformat(),
        "applicationsCount": 0,
        "reservationUnitCount": 0,
        "isSettingHandledAllowed": False,
    }


def test_application_round_query__applications_count_does_not_include_draft_applications(graphql):
    # given:
    # - There is a single application round with two applications, one of which is a draft
    application_round = ApplicationRoundFactory.create_in_status_open()
    ApplicationFactory.create_in_status_draft(application_round=application_round)
    ApplicationFactory.create_in_status_received(application_round=application_round)
    graphql.login_with_superuser()

    # when:
    # - The user queries for application rounds' applications count
    response = graphql(rounds_query(fields="applicationsCount"))

    # then:
    # - The applications count does not include the draft application
    assert len(response.edges) == 1, response
    assert response.node(0) == {"applicationsCount": 1}


def test_application_round_query__applications_count_does_not_include_expired_applications(graphql):
    # given:
    # - There is a single application round with two applications, one of which is expired
    application_round = ApplicationRoundFactory.create_in_status_handled()
    ApplicationFactory.create_in_status_expired(application_round=application_round)
    ApplicationFactory.create_in_status_handled(application_round=application_round)
    graphql.login_with_superuser()

    # when:
    # - The user queries for application rounds' applications count
    response = graphql(rounds_query(fields="applicationsCount"))

    # then:
    # - The applications count does not include the expired application
    assert len(response.edges) == 1, response
    assert response.node(0) == {"applicationsCount": 1}


def test_application_round_query__applications_count_does_not_include_cancelled_applications(graphql):
    # given:
    # - There is a single application round with two applications, one of which is cancelled
    application_round = ApplicationRoundFactory.create_in_status_handled()
    ApplicationFactory.create_in_status_cancelled(application_round=application_round)
    ApplicationFactory.create_in_status_handled(application_round=application_round)
    graphql.login_with_superuser()

    # when:
    # - The user queries for application rounds' applications count
    response = graphql(rounds_query(fields="applicationsCount"))

    # then:
    # - The applications count does not include the cancelled application
    assert len(response.edges) == 1, response
    assert response.node(0) == {"applicationsCount": 1}


def test_application_round_query__is_setting_handled_allowed__no_permissions__false(graphql):
    reservation_unit = ReservationUnitFactory.create()
    application_round = ApplicationRoundFactory.create_in_status_in_allocation(reservation_units=[reservation_unit])
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    ApplicationFactory.create_in_status_handled(application_round=application_round)

    graphql.login_with_regular_user()
    response = graphql(rounds_query(fields="isSettingHandledAllowed"))

    assert application_round.is_setting_handled_allowed is True  # lookup_property does not check for permissions
    assert response.node() == {"isSettingHandledAllowed": False}


def test_application_round_query__is_setting_handled_allowed__application_in_allocation__false(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    ApplicationFactory.create_in_status_in_allocation(application_round=application_round)
    ApplicationFactory.create_in_status_handled(application_round=application_round)

    graphql.login_with_superuser()
    response = graphql(rounds_query(fields="isSettingHandledAllowed"))

    assert application_round.is_setting_handled_allowed is False
    assert response.node() == {"isSettingHandledAllowed": False}


@pytest.mark.parametrize(
    "application_status",
    [
        ApplicationStatusChoice.DRAFT,
        ApplicationStatusChoice.HANDLED,
        ApplicationStatusChoice.EXPIRED,
        ApplicationStatusChoice.CANCELLED,
    ],
)
def test_application_round_query__is_setting_handled_allowed__application_status__true(graphql, application_status):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    ApplicationFactory.create_in_status(status=application_status, application_round=application_round)

    graphql.login_with_superuser()
    response = graphql(rounds_query(fields="isSettingHandledAllowed"))

    assert application_round.is_setting_handled_allowed is True
    assert response.node() == {"isSettingHandledAllowed": True}


def test_application_round_query__reservation_creation_status__NOT_COMPLETED__not_set_as_handled(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled(handled_date=None)
    ApplicationFactory.create_in_status_handled(application_round=application_round)

    graphql.login_with_superuser()
    response = graphql(rounds_query(fields="reservationCreationStatus"))

    state = ApplicationRoundReservationCreationStatusChoice.NOT_COMPLETED
    assert application_round.reservation_creation_status == state
    assert response.node() == {"reservationCreationStatus": state}


def test_application_round_query__reservation_creation_status__NOT_COMPLETED__before_timeout(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled(
        handled_date=local_datetime() - datetime.timedelta(minutes=9)
    )
    ApplicationFactory.create_in_status_handled(application_round=application_round)

    graphql.login_with_superuser()
    response = graphql(rounds_query(fields="reservationCreationStatus"))

    state = ApplicationRoundReservationCreationStatusChoice.NOT_COMPLETED
    assert application_round.reservation_creation_status == state
    assert response.node() == {"reservationCreationStatus": state}


def test_application_round_query__reservation_creation_status__FAILED__after_timeout(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled(
        handled_date=local_datetime() - datetime.timedelta(minutes=11)
    )
    ApplicationFactory.create_in_status_handled(application_round=application_round)

    graphql.login_with_superuser()
    response = graphql(rounds_query(fields="reservationCreationStatus"))

    state = ApplicationRoundReservationCreationStatusChoice.FAILED
    assert application_round.reservation_creation_status == state
    assert response.node() == {"reservationCreationStatus": state}


def test_application_round_query__reservation_creation_status__COMPLETED__before_timeout(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled(
        handled_date=local_datetime() - datetime.timedelta(minutes=9)
    )
    application = ApplicationFactory.create_in_status_handled(application_round=application_round)
    ReservationFactory(
        recurring_reservation__allocated_time_slot__reservation_unit_option__application_section__application=application
    )

    graphql.login_with_superuser()
    response = graphql(rounds_query(fields="reservationCreationStatus"))

    state = ApplicationRoundReservationCreationStatusChoice.COMPLETED
    assert application_round.reservation_creation_status == state
    assert response.node() == {"reservationCreationStatus": state}


def test_application_round_query__reservation_creation_status__COMPLETED__after_timeout(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled(
        handled_date=local_datetime() - datetime.timedelta(minutes=11)
    )
    application = ApplicationFactory.create_in_status_handled(application_round=application_round)
    ReservationFactory(
        recurring_reservation__allocated_time_slot__reservation_unit_option__application_section__application=application
    )

    graphql.login_with_superuser()
    response = graphql(rounds_query(fields="reservationCreationStatus"))

    state = ApplicationRoundReservationCreationStatusChoice.COMPLETED
    assert application_round.reservation_creation_status == state
    assert response.node() == {"reservationCreationStatus": state}
