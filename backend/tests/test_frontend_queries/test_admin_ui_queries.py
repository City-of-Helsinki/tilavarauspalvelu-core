from __future__ import annotations

import datetime
from copy import deepcopy
from inspect import isfunction
from typing import TYPE_CHECKING

import pytest
from graphql import OperationType
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import BannerNotificationTarget, ProfileLoginAMR, UserPermissionChoice
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from utils.date_utils import local_date, local_datetime, local_time, next_hour

from tests.factories import ApplicationRoundFactory, ReservationFactory, ReservationUnitFactory, UserFactory
from tests.factories.helsinki_profile import MyProfileDataFactory
from tests.helpers import ResponseMock, patch_method

from .helpers import assert_no_undefined_variables, get_admin_query_info

if TYPE_CHECKING:
    from tilavarauspalvelu.models import (
        Application,
        ApplicationSection,
        Reservation,
        ReservationUnit,
        Resource,
        TermsOfUse,
        Unit,
        User,
    )

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.frontend_query,
]


# NOTE: Test names need to include the name of the operation for this to work.
def test_frontend_queries__admin_ui__tests_exist_for_all_queries():
    queries = get_admin_query_info()
    operations = {name for name, info in queries.items() if info[0].operation == OperationType.QUERY}

    test_names = {name for name, value in globals().items() if isfunction(value) and name.startswith("test_")}

    missing: set[str] = set()

    for operation in operations:
        for test_name in test_names:
            if test_name.endswith(f"__{operation}"):
                break
        else:
            missing.add(operation)

    sorted_missing = sorted(missing)

    assert not sorted_missing, "Some queries not tested"


def test_frontend_queries__admin_ui__AllApplicationEvents(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["AllApplicationEvents"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation_unit = ReservationUnitFactory.create_reservable_now()
    application_round = ApplicationRoundFactory.create_in_status_in_allocation(reservation_units=[reservation_unit])

    factory_args = deepcopy(query_info.factory_args)
    factory_args["application__application_round"] = application_round
    factory_args["reservation_unit_options__reservation_unit"] = reservation_unit
    obj: ApplicationSection = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["applicationRound"] = application_round.pk
    variables["applicationStatus"] = [obj.application.status.value]
    variables["unit"] = [reservation_unit.unit.pk]
    variables["reservationUnit"] = [reservation_unit.pk]
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__admin_ui__AllocatedTimeSlots(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["AllocatedTimeSlots"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation_unit = ReservationUnitFactory.create_reservable_now()
    application_round = ApplicationRoundFactory.create_in_status_in_allocation(reservation_units=[reservation_unit])

    section_key = "reservation_unit_option__application_section"

    factory_args = deepcopy(query_info.factory_args)
    factory_args[f"{section_key}__application__application_round"] = application_round
    factory_args[f"{section_key}__reservation_min_duration"] = datetime.timedelta(minutes=30)
    factory_args[f"{section_key}__reservation_max_duration"] = datetime.timedelta(minutes=60)
    factory_args["begin_time"] = local_time(hour=10, minute=0)
    factory_args["end_time"] = local_time(hour=12, minute=0)
    query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["applicationRound"] = application_round.pk
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__admin_ui__ApplicationAdmin(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ApplicationAdmin"]

    assert len(factories) == 1
    query_info = factories[0]

    arts_key = "application_sections__reservation_unit_options__reservation_unit__application_round_time_slots"

    factory_args = deepcopy(query_info.factory_args)
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
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ApplicationDateOfBirth(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ApplicationDateOfBirth"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ApplicationRoundList(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ApplicationRoundList"]

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
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ApplicationRoundCriteria(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ApplicationRoundCriteria"]

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
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ApplicationRound(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ApplicationRound"]

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
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ApplicationRoundFilter(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ApplicationRoundFilter"]

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
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ApplicationSectionAllocations(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ApplicationSectionAllocations"]

    assert len(factories) == 2  # also 'affectingAllocatedTimeSlots', not really tested here
    query_info = factories[0]

    reservation_unit = ReservationUnitFactory.create_reservable_now()
    application_round = ApplicationRoundFactory.create_in_status_open(reservation_units=[reservation_unit])

    factory_args = deepcopy(query_info.factory_args)
    factory_args["applied_reservations_per_week"] = 1
    factory_args["reservation_min_duration"] = datetime.timedelta(minutes=30)
    factory_args["reservation_max_duration"] = datetime.timedelta(minutes=60)
    factory_args["suitable_time_ranges__begin_time"] = local_time(8, 0)
    factory_args["suitable_time_ranges__end_time"] = local_time(10, 0)
    factory_args["application__application_round"] = application_round
    factory_args["reservation_unit_options__reservation_unit"] = reservation_unit
    obj: ApplicationSection = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["applicationRound"] = application_round.pk
    variables["applicationStatus"] = [obj.application.status.value]
    variables["reservationUnit"] = reservation_unit.pk
    variables["beginDate"] = application_round.application_period_begins_at.date().isoformat()
    variables["endDate"] = application_round.application_period_ends_at.date().isoformat()
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__admin_ui__ApplicationSections(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ApplicationSections"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation_unit = ReservationUnitFactory.create_reservable_now()
    application_round = ApplicationRoundFactory.create_in_status_open(reservation_units=[reservation_unit])

    factory_args = deepcopy(query_info.factory_args)
    factory_args["applied_reservations_per_week"] = 1
    factory_args["reservation_min_duration"] = datetime.timedelta(minutes=30)
    factory_args["reservation_max_duration"] = datetime.timedelta(minutes=60)
    factory_args["application__application_round"] = application_round
    obj: ApplicationSection = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["applicationRound"] = application_round.pk
    variables["applicationStatus"] = [obj.application.status.value]
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__admin_ui__Applications(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["Applications"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation_unit = ReservationUnitFactory.create_reservable_now()
    application_round = ApplicationRoundFactory.create_in_status_open(reservation_units=[reservation_unit])

    factory_args = deepcopy(query_info.factory_args)
    factory_args["application_sections__applied_reservations_per_week"] = 1
    factory_args["application_sections__reservation_min_duration"] = datetime.timedelta(minutes=30)
    factory_args["application_sections__reservation_max_duration"] = datetime.timedelta(minutes=60)
    factory_args["application_round"] = application_round
    obj: Application = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["applicationRound"] = application_round.pk
    variables["status"] = [obj.status.value]
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__admin_ui__BannerNotificationPage(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["BannerNotificationPage"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ShowNotificationsList(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ShowNotificationsList"]

    assert len(factories) == 2
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
    variables["target"] = BannerNotificationTarget.ALL
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__admin_ui__BannerNotificationsList(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["BannerNotificationsList"]

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
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__admin_ui__CheckPermissions(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["CheckPermissions"]

    assert len(factories) == 1
    query_info = factories[0]

    variables = deepcopy(query_info.variables)
    variables["permission"] = UserPermissionChoice.CAN_VIEW_APPLICATIONS.value
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__CurrentUser(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["CurrentUser"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj: User = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.force_login(obj)

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__HandlingData(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["HandlingData"]

    assert len(factories) == 2
    query_info_1 = factories[0]
    query_info_2 = factories[1]

    begin = next_hour()
    end = begin + datetime.timedelta(hours=1)

    factory_args_1 = deepcopy(query_info_1.factory_args)
    factory_args_1["begins_at"] = begin
    factory_args_1["ends_at"] = end
    obj: Reservation = query_info_1.factory.create(**factory_args_1)

    factory_args_2 = deepcopy(query_info_2.factory_args)
    query_info_2.factory.create(**factory_args_2)

    variables = query_info_1.variables
    variables["beginDate"] = begin.date().isoformat()
    variables["state"] = [obj.state]
    assert_no_undefined_variables(variables)

    query = query_info_1.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__admin_ui__FilterOptions(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["FilterOptions"]

    assert len(factories) == 6
    query_info_1 = factories[0]
    query_info_2 = factories[1]
    query_info_3 = factories[2]
    query_info_4 = factories[3]
    query_info_5 = factories[4]
    query_info_6 = factories[5]

    factory_args_1 = deepcopy(query_info_1.factory_args)
    query_info_1.factory.create(**factory_args_1)

    factory_args_2 = deepcopy(query_info_2.factory_args)
    query_info_2.factory.create(**factory_args_2)

    factory_args_3 = deepcopy(query_info_3.factory_args)
    query_info_3.factory.create(**factory_args_3)

    factory_args_4 = deepcopy(query_info_4.factory_args)
    query_info_4.factory.create(**factory_args_4)

    factory_args_5 = deepcopy(query_info_5.factory_args)
    query_info_5.factory.create(**factory_args_5)

    factory_args_6 = deepcopy(query_info_6.factory_args)
    query_info_6.factory.create(**factory_args_6)

    variables = query_info_1.variables
    assert_no_undefined_variables(variables)

    query = query_info_1.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationSeries(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationSeries"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__SeriesReservationUnit(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["SeriesReservationUnit"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__RejectedOccurrences(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["RejectedOccurrences"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__admin_ui__ReservationPage(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationPage"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationEditPage(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationEditPage"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationApplicationLink(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationApplicationLink"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationDateOfBirth(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationDateOfBirth"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationDenyReasons(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationDenyReasons"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__admin_ui__ReservationPermissions(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationPermissions"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationUnit(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationUnit"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationUnitCalendar(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationUnitCalendar"]

    assert len(factories) == 2  # also 'affectingReservations', not really tested here
    query_info_1 = factories[0]
    query_info_2 = factories[1]

    factory_args_1 = deepcopy(query_info_1.factory_args)
    obj: ReservationUnit = query_info_1.factory.create(**factory_args_1)

    factory_args_2 = deepcopy(query_info_2.factory_args)
    factory_args_2["reservation_unit"] = obj
    query_info_2.factory.create(**factory_args_2)

    variables = query_info_1.variables
    variables["id"] = to_global_id(query_info_1.typename, obj.id)
    variables["pk"] = obj.pk
    variables["beginDate"] = local_date().isoformat()
    variables["endDate"] = (local_date() + datetime.timedelta(days=1)).isoformat()
    assert_no_undefined_variables(variables)

    query = query_info_1.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationUnitEdit(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationUnitEdit"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationUnitEditorParameters(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationUnitEditorParameters"]

    assert len(factories) == 6

    for query_info in factories:
        factory_args = deepcopy(query_info.factory_args)
        query_info.factory.create(**factory_args)

    variables = factories[0].variables
    assert_no_undefined_variables(variables)

    query = factories[0].query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationUnitsByUnit(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationUnitsByUnit"]

    assert len(factories) == 2  # also 'affectingReservations', not really tested here
    query_info_1 = factories[0]
    query_info_2 = factories[1]

    factory_args_1 = deepcopy(query_info_1.factory_args)
    obj: Unit = query_info_1.factory.create(**factory_args_1)

    factory_args_2 = deepcopy(query_info_2.factory_args)
    factory_args_2["reservation_unit__unit"] = obj
    query_info_2.factory.create(**factory_args_2)

    variables = query_info_1.variables
    variables["id"] = to_global_id(query_info_1.typename, obj.id)
    variables["pk"] = obj.pk
    variables["beginDate"] = local_date().isoformat()
    variables["endDate"] = (local_date() + datetime.timedelta(days=7)).isoformat()
    assert_no_undefined_variables(variables)

    query = query_info_1.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationList(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationList"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationsByReservationUnit(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationsByReservationUnit"]

    assert len(factories) == 2  # also 'affectingReservations', not really tested here
    query_info_1 = factories[0]
    query_info_2 = factories[1]

    factory_args_1 = deepcopy(query_info_1.factory_args)
    obj: ReservationUnit = query_info_1.factory.create(**factory_args_1)

    factory_args_2 = deepcopy(query_info_2.factory_args)
    factory_args_2["reservation_unit"] = obj
    query_info_2.factory.create(**factory_args_2)

    variables = query_info_1.variables
    variables["id"] = to_global_id(query_info_1.typename, obj.id)
    variables["pk"] = obj.pk
    assert_no_undefined_variables(variables)

    query = query_info_1.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__Resource(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["Resource"]

    assert len(factories) == 2
    query_info_1 = factories[0]
    query_info_2 = factories[1]

    factory_args_1 = deepcopy(query_info_1.factory_args)
    resource: Resource = query_info_1.factory.create(**factory_args_1)

    factory_args_2 = deepcopy(query_info_2.factory_args)
    unit: Unit = query_info_2.factory.create(**factory_args_2)

    variables = query_info_1.variables
    variables["id"] = to_global_id(query_info_1.typename, resource.id)
    variables["unitId"] = to_global_id(query_info_2.typename, unit.id)
    assert_no_undefined_variables(variables)

    query = query_info_1.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__SearchReservationUnits(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["SearchReservationUnits"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


def test_frontend_queries__admin_ui__SeriesPage(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["SeriesPage"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__Space(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["Space"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__TermsOfUse(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["TermsOfUse"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj: TermsOfUse = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["pk"] = obj.pk
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__UnitPage(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UnitPage"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__ReservationUnitCreateUnit(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationUnitCreateUnit"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = query_info.factory_args
    obj = query_info.factory.create(**factory_args)

    variables = query_info.variables
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__UnitSpaces(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UnitSpaces"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__UnitView(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UnitView"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__SpacesResources(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["SpacesResources"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    obj = query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["id"] = to_global_id(query_info.typename, obj.id)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__admin_ui__UnitList(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UnitList"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    query_info.factory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
def test_frontend_queries__admin_ui__ReservationProfileDataContactInfo(graphql):
    user = UserFactory.create(profile_id="foo", social_auth__extra_data__amr=ProfileLoginAMR.SUOMI_FI)
    reservation = ReservationFactory.create(user=user)
    profile_data = MyProfileDataFactory.create_basic(
        verifiedPersonalInformation__nationalIdentificationNumber="181106A830T",
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationProfileDataContactInfo"]

    assert len(factories) == 1
    query_info = factories[0]
    assert query_info.factory is None

    variables = query_info.variables
    variables["reservationPk"] = reservation.pk
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
def test_frontend_queries__admin_ui__ReservationProfileDataSSN(graphql):
    user = UserFactory.create(profile_id="foo", social_auth__extra_data__amr=ProfileLoginAMR.SUOMI_FI)
    reservation = ReservationFactory.create(user=user)
    profile_data = MyProfileDataFactory.create_basic(
        verifiedPersonalInformation__nationalIdentificationNumber="181106A830T",
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    admin_factories = get_admin_query_info()
    factories = admin_factories["ReservationProfileDataSSN"]

    assert len(factories) == 1
    query_info = factories[0]
    assert query_info.factory is None

    variables = query_info.variables
    variables["reservationPk"] = reservation.pk
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
