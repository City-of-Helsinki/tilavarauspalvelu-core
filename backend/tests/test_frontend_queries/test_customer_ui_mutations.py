from __future__ import annotations

import datetime
from copy import deepcopy
from inspect import isfunction

import pytest
from graphql import OperationType

from tilavarauspalvelu.enums import ApplicantTypeChoice, ReservationCancelReasonChoice
from utils.date_utils import next_hour

from tests.factories import (
    ApplicationFactory,
    ApplicationRoundFactory,
    ApplicationSectionFactory,
    ReservationFactory,
    ReservationUnitFactory,
)

from .helpers import assert_no_undefined_variables, get_customer_query_info

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.frontend_query,
]


# NOTE: Test names need to include the name of the operation for this to work.
def test_frontend_queries__customer_ui__tests_exist_for_all_mutations():
    queries = get_customer_query_info()
    operations = {name for name, info in queries.items() if info[0].operation == OperationType.MUTATION}

    test_names = {name for name, value in globals().items() if isfunction(value) and name.startswith("test_")}

    missing: set[str] = set()

    for operation in operations:
        for test_name in test_names:
            if test_name.endswith(f"__{operation}"):
                break
        else:
            missing.add(operation)

    sorted_missing = sorted(missing)

    assert not sorted_missing, "Some mutations not tested"


def test_frontend_queries__customer_ui__AdjustReservationTime(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["AdjustReservationTime"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    factory_args.pop("state")  # set by the factory
    factory_args.pop("begin")  # set by the factory
    factory_args.pop("end")  # set by the factory
    reservation = ReservationFactory.create_for_time_adjustment(**factory_args)

    new_begin = reservation.begin + datetime.timedelta(days=1)
    new_end = reservation.end + datetime.timedelta(days=1)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
        "begin": new_begin.isoformat(),
        "end": new_end.isoformat(),
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CancelApplication(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["CancelApplication"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    application = ApplicationFactory.create_in_status_received(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": application.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CancelApplicationSection(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["CancelApplicationSection"]

    assert len(factories) == 1
    query_info = factories[0]

    application_round = ApplicationRoundFactory.create_in_status_results_sent()

    factory_args = deepcopy(query_info.factory_args)
    factory_args["application__application_round"] = application_round
    section = ApplicationSectionFactory.create_in_status_handled(**factory_args)

    user = section.application.user

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancel details",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.force_login(user)

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CancelReservation(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["CancelReservation"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    reservation = ReservationFactory.create_for_cancellation(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancel details",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__ConfirmReservation(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ConfirmReservation"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    reservation = ReservationFactory.create_for_confirmation(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CreateApplication(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["CreateApplication"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation_unit = ReservationUnitFactory.create(
        min_persons=1,
        max_persons=10,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=5),
    )
    application_round = ApplicationRoundFactory.create_in_status_open(reservation_units=[reservation_unit])

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "additionalInformation": "Additional information",
        "applicantType": ApplicantTypeChoice.INDIVIDUAL.value,
        "applicationRound": application_round.pk,
        "applicationSections": [
            {
                "name": "Application section",
                "numPersons": 1,
                "appliedReservationsPerWeek": 1,
                "reservationMinDuration": int(datetime.timedelta(minutes=30).total_seconds()),
                "reservationMaxDuration": int(datetime.timedelta(minutes=60).total_seconds()),
                "reservationUnitOptions": [
                    {
                        "preferredOrder": 0,
                        "reservationUnit": reservation_unit.pk,
                    },
                ],
                "reservationsBeginDate": application_round.reservation_period_begin_date.isoformat(),
                "reservationsEndDate": application_round.reservation_period_end_date.isoformat(),
                "suitableTimeRanges": [],
            },
        ],
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser(date_of_birth=datetime.datetime(2000, 1, 1))

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CreateReservation(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["CreateReservation"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation_unit = ReservationUnitFactory.create_reservable_now()

    begin = next_hour()
    end = begin + datetime.timedelta(hours=1)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "reservationUnit": reservation_unit.pk,
        "begin": begin.isoformat(),
        "end": end.isoformat(),
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__DeleteReservation(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["DeleteReservation"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation = ReservationFactory.create_for_delete()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__SendApplication(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["SendApplication"]

    assert len(factories) == 1
    query_info = factories[0]

    application = ApplicationFactory.create_application_ready_for_sending()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": application.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__UpdateApplication(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["UpdateApplication"]

    assert len(factories) == 1
    query_info = factories[0]

    application = ApplicationFactory.create_application_ready_for_sending()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": application.pk,
        "additionalInformation": "Additional information",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__UpdateReservation(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["UpdateReservation"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation = ReservationFactory.create_for_update()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
        "name": "Reservation name",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
