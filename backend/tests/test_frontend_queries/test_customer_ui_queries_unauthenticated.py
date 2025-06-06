from __future__ import annotations

import datetime
import uuid
from copy import deepcopy
from inspect import isfunction
from typing import TYPE_CHECKING

import pytest
from graphql import OperationType
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import BannerNotificationTarget
from tilavarauspalvelu.models import ReservationUnitHierarchy
from utils.date_utils import local_date, local_datetime, local_time, next_hour

from tests.factories import ReservationFactory, ReservationUnitFactory

from .helpers import assert_no_undefined_variables, get_customer_query_info

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application, BannerNotification, Reservation, ReservationUnit, TermsOfUse

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.frontend_query,
]


# NOTE: Test names need to include the name of the operation for this to work.
def test_frontend_queries__customer_ui__unauthenticated__tests_exist_for_all_queries():
    queries = get_customer_query_info()
    operations = {name for name, info in queries.items() if info[0].operation == OperationType.QUERY}

    test_names = {name for name, value in globals().items() if isfunction(value) and name.startswith("test_")}

    missing: set[str] = set()

    for operation in operations:
        for test_name in test_names:
            if test_name.endswith(f"__{operation}__unauthenticated"):
                break
        else:
            missing.add(operation)

    sorted_missing = sorted(missing)

    assert not sorted_missing, "Some queries not tested"


# Unauthenticated - Has permissions


def test_frontend_queries__customer_ui__AffectingReservations__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["AffectingReservations"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation_unit = ReservationUnitFactory.create_reservable_now()

    factory_args = query_info.factory_args
    factory_args["reservation_units"] = [reservation_unit]
    factory_args["begins_at"] = local_datetime(2024, 1, 1, 12, 0)
    factory_args["ends_at"] = local_datetime(2024, 1, 1, 15, 0)
    query_info.factory.create(**factory_args)

    ReservationUnitHierarchy.refresh()

    variables = query_info.variables
    variables["pk"] = reservation_unit.pk
    variables["beginDate"] = local_date(2024, 1, 1).isoformat()
    variables["endDate"] = local_date(2024, 1, 2).isoformat()
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors

    assert isinstance(response.first_query_object, list)
    assert len(response.first_query_object) != 0


def test_frontend_queries__customer_ui__ApplicationRound__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationRound"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    factory_args["application_period_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_period_ends_at"] = local_datetime(2024, 2, 1)
    factory_args["reservation_period_begin_date"] = local_date(2024, 2, 2)
    factory_args["reservation_period_end_date"] = local_date(2024, 3, 1)
    factory_args["public_display_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["public_display_ends_at"] = local_datetime(2024, 2, 2)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__ApplicationRoundCriteria__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationRoundCriteria"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    factory_args["application_period_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_period_ends_at"] = local_datetime(2024, 2, 1)
    factory_args["reservation_period_begin_date"] = local_date(2024, 2, 2)
    factory_args["reservation_period_end_date"] = local_date(2024, 3, 1)
    factory_args["public_display_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["public_display_ends_at"] = local_datetime(2024, 2, 2)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__ApplicationRoundsUi__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationRoundsUi"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    factory_args["application_period_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_period_ends_at"] = local_datetime(2024, 2, 1)
    factory_args["reservation_period_begin_date"] = local_date(2024, 2, 2)
    factory_args["reservation_period_end_date"] = local_date(2024, 3, 1)
    factory_args["public_display_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["public_display_ends_at"] = local_datetime(2024, 2, 2)
    query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__BannerNotificationsList__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["BannerNotificationsList"]

    assert len(factories) == 1
    query_info = factories[0]

    now = local_datetime()

    factory_args = deepcopy(query_info.factory_args)
    factory_args["message"] = "foo"
    factory_args["message_en"] = "foo"
    factory_args["message_fi"] = "foo"
    factory_args["message_sv"] = "foo"
    factory_args["draft"] = False
    factory_args["active_from"] = now - datetime.timedelta(days=1)
    factory_args["active_until"] = now + datetime.timedelta(days=1)
    factory_args["target"] = BannerNotificationTarget.ALL
    obj: BannerNotification = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["target"] = obj.target
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__customer_ui__BannerNotificationsListAll__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["BannerNotificationsListAll"]

    assert len(factories) == 1
    query_info = factories[0]

    now = local_datetime()

    factory_args = deepcopy(query_info.factory_args)
    factory_args["message"] = "foo"
    factory_args["message_en"] = "foo"
    factory_args["message_fi"] = "foo"
    factory_args["message_sv"] = "foo"
    factory_args["draft"] = False
    factory_args["active_from"] = now - datetime.timedelta(days=1)
    factory_args["active_until"] = now + datetime.timedelta(days=1)
    factory_args["target"] = BannerNotificationTarget.ALL
    query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__customer_ui__CurrentUser__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["CurrentUser"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert response.first_query_object is None


def test_frontend_queries__customer_ui__FrontPage__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["FrontPage"]

    assert len(factories) == 2
    query_info_1 = factories[0]
    query_info_2 = factories[1]

    factory_args_1 = deepcopy(query_info_1.factory_args)
    query_info_1.factory.create(**factory_args_1)

    factory_args_2 = deepcopy(query_info_2.factory_args)
    query_info_2.factory.create(**factory_args_2)

    variables = query_info_1.variables
    assert_no_undefined_variables(variables)

    query = query_info_1.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__ListInProgressReservations__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ListInProgressReservations"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj: Reservation = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["user"] = [obj.pk]
    variables["beginDate"] = obj.begins_at.date().isoformat()
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__Options__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["Options"]

    assert len(factories) == 7

    for query_info in factories:
        factory_args = deepcopy(query_info.factory_args)
        query_info.factory.create(**factory_args)

    variables = factories[0].variables
    assert_no_undefined_variables(variables)

    query = factories[0].query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__RelatedReservationUnits__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["RelatedReservationUnits"]

    now = local_datetime()

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    factory_args["publish_begins"] = now - datetime.timedelta(days=1)
    factory_args["publish_ends"] = now + datetime.timedelta(days=1)
    obj: ReservationUnit = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["unit"] = [obj.unit.pk]
    variables["isDraft"] = False
    variables["isVisible"] = True
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__customer_ui__ReservationQuotaReached__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ReservationQuotaReached"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = query_info.factory_args
    obj = query_info.factory.create(**factory_args)

    variables = query_info.variables
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__ReservationState__unauthenticated(graphql):
    #
    # This one is not meant for unauthenticated users, but our permissions allow them to query it.
    # This is fine, since it doesn't reveal any critical information about the reservation.
    #
    customer_factories = get_customer_query_info()
    factories = customer_factories["ReservationState"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__ReservationUnitPage__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ReservationUnitPage"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    factory_args["application_rounds__application_period_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_rounds__application_period_ends_at"] = local_datetime(2024, 2, 1)
    factory_args["application_rounds__reservation_period_begin_date"] = local_date(2024, 2, 2)
    factory_args["application_rounds__reservation_period_end_date"] = local_date(2024, 3, 1)
    factory_args["application_rounds__public_display_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_rounds__public_display_ends_at"] = local_datetime(2024, 2, 2)
    factory_args["application_round_time_slots__is_closed"] = False
    obj: ReservationUnit = query_info.factory.create(**factory_args)

    ReservationFactory.create_for_reservation_unit(obj)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    variables["pk"] = obj.pk
    variables["beginDate"] = local_date().isoformat()
    variables["endDate"] = local_date().isoformat()
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__SearchReservationUnits__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["SearchReservationUnits"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__TermsOfUse__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["TermsOfUse"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj: TermsOfUse = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["termsType"] = obj.terms_type.upper()
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


# Unauthenticated - No permissions


def test_frontend_queries__customer_ui__AccessCode__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["AccessCode"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == {"id": variables["id"], "pindoraInfo": None}


def test_frontend_queries__customer_ui__ApplicationPage1__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationPage1"]

    assert len(factories) == 1
    query_info_1 = factories[0]

    arts_key = "application_sections__reservation_unit_options__reservation_unit__application_round_time_slots"

    factory_args_1 = deepcopy(query_info_1.factory_args)
    factory_args_1["application_round__application_period_begins_at"] = local_datetime(2024, 1, 1)
    factory_args_1["application_round__application_period_ends_at"] = local_datetime(2024, 2, 1)
    factory_args_1["application_round__reservation_period_begin_date"] = local_date(2024, 2, 2)
    factory_args_1["application_round__reservation_period_end_date"] = local_date(2024, 3, 1)
    factory_args_1["application_round__public_display_begins_at"] = local_datetime(2024, 1, 1)
    factory_args_1["application_round__public_display_ends_at"] = local_datetime(2024, 2, 2)
    factory_args_1[f"{arts_key}__is_closed"] = False
    factory_args_1["application_sections__applied_reservations_per_week"] = 1
    factory_args_1["application_sections__reservation_min_duration"] = datetime.timedelta(minutes=30)
    factory_args_1["application_sections__reservation_max_duration"] = datetime.timedelta(minutes=60)
    factory_args_1["application_sections__suitable_time_ranges__begin_time"] = local_time(8, 0)
    factory_args_1["application_sections__suitable_time_ranges__end_time"] = local_time(10, 0)
    obj = query_info_1.factory.create(**factory_args_1)

    variables = query_info_1.variables
    variables["id"] = to_global_id(query_info_1.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info_1.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ApplicationPage2__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationPage2"]

    assert len(factories) == 1
    query_info = factories[0]

    arts_key = "application_sections__reservation_unit_options__reservation_unit__application_round_time_slots"

    factory_args = deepcopy(query_info.factory_args)
    factory_args["application_round__application_period_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_round__application_period_ends_at"] = local_datetime(2024, 2, 1)
    factory_args["application_round__reservation_period_begin_date"] = local_date(2024, 2, 2)
    factory_args["application_round__reservation_period_end_date"] = local_date(2024, 3, 1)
    factory_args["application_round__public_display_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_round__public_display_ends_at"] = local_datetime(2024, 2, 2)
    factory_args[f"{arts_key}__is_closed"] = False
    factory_args["application_sections__applied_reservations_per_week"] = 1
    factory_args["application_sections__reservation_min_duration"] = datetime.timedelta(minutes=30)
    factory_args["application_sections__reservation_max_duration"] = datetime.timedelta(minutes=60)
    factory_args["application_sections__suitable_time_ranges__begin_time"] = local_time(8, 0)
    factory_args["application_sections__suitable_time_ranges__end_time"] = local_time(10, 0)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ApplicationPage3__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationPage3"]

    assert len(factories) == 1
    query_info = factories[0]

    arts_key = "application_sections__reservation_unit_options__reservation_unit__application_round_time_slots"

    factory_args = deepcopy(query_info.factory_args)
    factory_args["application_round__application_period_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_round__application_period_ends_at"] = local_datetime(2024, 2, 1)
    factory_args["application_round__reservation_period_begin_date"] = local_date(2024, 2, 2)
    factory_args["application_round__reservation_period_end_date"] = local_date(2024, 3, 1)
    factory_args["application_round__public_display_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_round__public_display_ends_at"] = local_datetime(2024, 2, 2)
    factory_args[f"{arts_key}__is_closed"] = False
    factory_args["application_sections__applied_reservations_per_week"] = 1
    factory_args["application_sections__reservation_min_duration"] = datetime.timedelta(minutes=30)
    factory_args["application_sections__reservation_max_duration"] = datetime.timedelta(minutes=60)
    factory_args["application_sections__suitable_time_ranges__begin_time"] = local_time(8, 0)
    factory_args["application_sections__suitable_time_ranges__end_time"] = local_time(10, 0)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ApplicationPage4__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationPage4"]

    assert len(factories) == 1
    query_info = factories[0]

    arts_key = "application_sections__reservation_unit_options__reservation_unit__application_round_time_slots"

    factory_args = deepcopy(query_info.factory_args)
    factory_args["application_round__application_period_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_round__application_period_ends_at"] = local_datetime(2024, 2, 1)
    factory_args["application_round__reservation_period_begin_date"] = local_date(2024, 2, 2)
    factory_args["application_round__reservation_period_end_date"] = local_date(2024, 3, 1)
    factory_args["application_round__public_display_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_round__public_display_ends_at"] = local_datetime(2024, 2, 2)
    factory_args[f"{arts_key}__is_closed"] = False
    factory_args["application_sections__applied_reservations_per_week"] = 1
    factory_args["application_sections__reservation_min_duration"] = datetime.timedelta(minutes=30)
    factory_args["application_sections__reservation_max_duration"] = datetime.timedelta(minutes=60)
    factory_args["application_sections__suitable_time_ranges__begin_time"] = local_time(8, 0)
    factory_args["application_sections__suitable_time_ranges__end_time"] = local_time(10, 0)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ApplicationRecurringReservation__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationRecurringReservation"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert response.first_query_object is None


def test_frontend_queries__customer_ui__ApplicationReservations__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationReservations"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    variables["beginDate"] = local_date(2021, 1, 1).isoformat()
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ApplicationSectionCancel__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationSectionCancel"]

    assert len(factories) == 2
    query_info_1 = factories[0]
    query_info_2 = factories[1]

    factory_args_1 = deepcopy(query_info_1.factory_args)
    obj = query_info_1.factory.create(**factory_args_1)

    assert query_info_2.factory is None  # ReservationCancelReason is an enum, no factory is needed.

    variables = query_info_1.variables
    variables["id"] = to_global_id(query_info_1.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info_1.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ApplicationSectionView__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationSectionView"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["pk"] = obj.pk
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ApplicationSentPage__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationSentPage"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert response.first_query_object is None


def test_frontend_queries__customer_ui__ApplicationView__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ApplicationView"]

    assert len(factories) == 1
    query_info = factories[0]

    arts_key = "application_sections__reservation_unit_options__reservation_unit__application_round_time_slots"

    factory_args = deepcopy(query_info.factory_args)
    factory_args["application_round__application_period_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_round__application_period_ends_at"] = local_datetime(2024, 2, 1)
    factory_args["application_round__reservation_period_begin_date"] = local_date(2024, 2, 2)
    factory_args["application_round__reservation_period_end_date"] = local_date(2024, 3, 1)
    factory_args["application_round__public_display_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["application_round__public_display_ends_at"] = local_datetime(2024, 2, 2)
    factory_args[f"{arts_key}__is_closed"] = False
    factory_args["application_sections__applied_reservations_per_week"] = 1
    factory_args["application_sections__reservation_min_duration"] = datetime.timedelta(minutes=30)
    factory_args["application_sections__reservation_max_duration"] = datetime.timedelta(minutes=60)
    factory_args["application_sections__suitable_time_ranges__begin_time"] = local_time(8, 0)
    factory_args["application_sections__suitable_time_ranges__end_time"] = local_time(10, 0)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__Applications__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["Applications"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj: Application = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["user"] = obj.user.pk
    variables["status"] = [obj.status.value]
    variables["orderBy"] = ["pkAsc"]
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ListReservations__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ListReservations"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj: Reservation = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["reservationType"] = [obj.type]
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__Order__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["Order"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    factory_args["remote_id"] = uuid.uuid4()
    factory_args["reservation__pk"] = 1
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["orderUuid"] = str(obj.remote_id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert response.first_query_object is None


def test_frontend_queries__customer_ui__Reservation__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["Reservation"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ReservationCancelPage__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ReservationCancelPage"]

    assert len(factories) == 2
    query_info_1 = factories[0]
    query_info_2 = factories[1]

    factory_args_1 = deepcopy(query_info_1.factory_args)
    obj = query_info_1.factory.create(**factory_args_1)

    assert query_info_2.factory is None  # ReservationCancelReason is an enum, no factory is needed.

    variables = query_info_1.variables
    variables["id"] = to_global_id(query_info_1.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info_1.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ReservationConfirmationPage__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ReservationConfirmationPage"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ReservationEditPage__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ReservationEditPage"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    factory_args["reservation_units__application_rounds__application_period_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["reservation_units__application_rounds__application_period_ends_at"] = local_datetime(2024, 2, 1)
    factory_args["reservation_units__application_rounds__reservation_period_begin_date"] = local_date(2024, 2, 2)
    factory_args["reservation_units__application_rounds__reservation_period_end_date"] = local_date(2024, 3, 1)
    factory_args["reservation_units__application_rounds__public_display_begins_at"] = local_datetime(2024, 1, 1)
    factory_args["reservation_units__application_rounds__public_display_ends_at"] = local_datetime(2024, 2, 2)
    obj = query_info.factory.create(**factory_args)

    begin = next_hour()
    end = begin + datetime.timedelta(hours=1)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    variables["beginDate"] = begin.date().isoformat()
    variables["endDate"] = end.date().isoformat()
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response


def test_frontend_queries__customer_ui__ReservationPage__unauthenticated(graphql):
    customer_factories = get_customer_query_info()
    factories = customer_factories["ReservationPage"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query

    response = graphql(query, variables=variables)

    assert response.has_errors is True, response
