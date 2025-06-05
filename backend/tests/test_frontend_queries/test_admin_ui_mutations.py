from __future__ import annotations

import datetime
import uuid
from copy import deepcopy
from inspect import isfunction
from typing import Any
from unittest.mock import MagicMock

import pytest
from graphql import OperationType

from tilavarauspalvelu.enums import (
    AccessType,
    BannerNotificationLevel,
    BannerNotificationTarget,
    ReservationStateChoice,
    ReservationTypeChoice,
    ReservationTypeStaffChoice,
    ReservationUnitImageType,
    ResourceLocationType,
    Weekday,
)
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraAccessCodeModifyResponse
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_datetime, next_hour

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationFactory,
    ApplicationRoundFactory,
    ApplicationSectionFactory,
    BannerNotificationFactory,
    ReservationDenyReasonFactory,
    ReservationFactory,
    ReservationSeriesFactory,
    ReservationUnitFactory,
    ReservationUnitImageFactory,
    ReservationUnitOptionFactory,
    ResourceFactory,
    SpaceFactory,
    SuitableTimeRangeFactory,
    UnitFactory,
    UserFactory,
)
from tests.helpers import patch_method

from .helpers import assert_no_undefined_variables, get_admin_query_info

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.frontend_query,
]


# NOTE: Test names need to include the name of the operation for this to work.
def test_frontend_queries__admin_ui__tests_exist_for_all_mutations():
    queries = get_admin_query_info()
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


def test_frontend_queries__customer_ui__AddReservationToSeries(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["AddReservationToSeries"]

    assert len(factories) == 1
    query_info = factories[0]

    now = next_hour()

    factory_args = deepcopy(query_info.factory_args)
    factory_args["begin"] = now
    series = ReservationSeriesFactory.create_with_matching_reservations(**factory_args)

    last_reservation = series.reservations.last()

    new_begin = last_reservation.begin + datetime.timedelta(days=1)
    new_end = last_reservation.end + datetime.timedelta(days=1)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": series.pk,
        "begin": new_begin.isoformat(),
        "end": new_end.isoformat(),
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__ApproveReservation(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ApproveReservation"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    factory_args.pop("state")  # set by the factory
    reservation = ReservationFactory.create_for_approve(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
        "price": str(reservation.price),
        "handlingDetails": "Handling details",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__BannerNotificationCreate(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["BannerNotificationCreate"]

    assert len(factories) == 1
    query_info = factories[0]

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "name": "Test notification",
        "level": BannerNotificationLevel.NORMAL,
        "target": BannerNotificationTarget.ALL,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__BannerNotificationDelete(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["BannerNotificationDelete"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    notification = BannerNotificationFactory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": notification.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__BannerNotificationUpdate(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["BannerNotificationUpdate"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    notification = BannerNotificationFactory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": notification.pk,
        "level": BannerNotificationLevel.EXCEPTION.value,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


@patch_method(
    PindoraService.change_access_code,
    return_value=PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
    ),
)
def test_frontend_queries__customer_ui__ChangeReservationAccessCodeSeries(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ChangeReservationAccessCodeSeries"]

    assert len(factories) == 1
    query_info = factories[0]

    now = next_hour()

    factory_args = deepcopy(query_info.factory_args)
    factory_args["begin"] = now
    factory_args["reservations__access_type"] = AccessType.ACCESS_CODE
    series = ReservationSeriesFactory.create_with_matching_reservations(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": series.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


@patch_method(
    PindoraService.change_access_code,
    return_value=PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
    ),
)
@patch_method(EmailService.send_reservation_access_code_changed_email)
def test_frontend_queries__customer_ui__ChangeReservationAccessCodeSingle(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["ChangeReservationAccessCodeSingle"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args = deepcopy(query_info.factory_args)
    factory_args["begin"] = next_hour()
    factory_args["access_type"] = AccessType.ACCESS_CODE
    reservation = ReservationFactory.create_for_staff_update(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CreateAllocatedTimeSlot(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["CreateAllocatedTimeSlot"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args: dict[str, Any] = {}
    section = ApplicationSectionFactory.create_in_status_in_allocation(**factory_args)
    suitable = SuitableTimeRangeFactory.create(application_section=section)
    option = section.reservation_unit_options.first()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "beginTime": suitable.begin_time.isoformat(),
        "endTime": suitable.end_time.isoformat(),
        "dayOfTheWeek": suitable.day_of_the_week,
        "reservationUnitOption": option.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CreateImage(graphql, mock_png):
    admin_factories = get_admin_query_info()
    factories = admin_factories["CreateImage"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation_unit = ReservationUnitFactory.create()

    variables = deepcopy(query_info.variables)
    variables["image"] = mock_png
    variables["reservationUnit"] = reservation_unit.pk
    variables["imageType"] = ReservationUnitImageType.MAIN.value.upper()
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CreateReservationSeries(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["CreateReservationSeries"]

    assert len(factories) == 1
    query_info = factories[0]

    user = UserFactory.create()
    reservation_unit = ReservationUnitFactory.create()

    begin = next_hour()
    end = begin + datetime.timedelta(days=20)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "beginDate": begin.date().isoformat(),
        "beginTime": begin.time().isoformat(),
        "endDate": end.date().isoformat(),
        "endTime": end.time().isoformat(),
        "recurrenceInDays": 7,
        "reservationUnit": reservation_unit.pk,
        "weekdays": [Weekday.MONDAY.as_weekday_number],
        "reservationDetails": {
            "type": ReservationTypeStaffChoice.STAFF.value,
            "user": user.pk,
        },
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CreateReservationUnit(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["CreateReservationUnit"]

    assert len(factories) == 1
    query_info = factories[0]

    unit = UnitFactory.create()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "name": "Reservation unit",
        "unit": unit.pk,
        "isDraft": True,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CreateResource(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["CreateResource"]

    assert len(factories) == 1
    query_info = factories[0]

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "name": "Resource",
        "locationType": ResourceLocationType.MOVABLE.value.upper(),
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CreateSpace(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["CreateSpace"]

    assert len(factories) == 1
    query_info = factories[0]

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "name": "Resource",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__CreateStaffReservation(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["CreateStaffReservation"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation_unit = ReservationUnitFactory.create()

    begin = next_hour()
    end = begin + datetime.timedelta(hours=1)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "begin": begin.isoformat(),
        "end": end.isoformat(),
        "reservationUnit": reservation_unit.pk,
        "type": ReservationTypeChoice.STAFF.value,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__DeleteAllocatedTimeSlot(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["DeleteAllocatedTimeSlot"]

    assert len(factories) == 1
    query_info = factories[0]

    application_round = ApplicationRoundFactory.create_in_status_in_allocation()

    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__application_round=application_round,
    )

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": allocation.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__DeleteImage(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["DeleteImage"]

    assert len(factories) == 1
    query_info = factories[0]

    image = ReservationUnitImageFactory.create()

    variables = deepcopy(query_info.variables)
    variables["pk"] = image.pk
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__DeleteResource(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["DeleteResource"]

    assert len(factories) == 1
    query_info = factories[0]

    resource = ResourceFactory.create()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": resource.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__DeleteSpace(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["DeleteSpace"]

    assert len(factories) == 1
    query_info = factories[0]

    space = SpaceFactory.create()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": space.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__DenyReservation(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["DenyReservation"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation = ReservationFactory.create_for_deny()
    deny_reason = ReservationDenyReasonFactory.create()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
        "denyReason": deny_reason.pk,
        "handlingDetails": "Handling details",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__DenyReservationSeries(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["DenyReservationSeries"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args: dict[str, Any] = {}
    factory_args["reservations__state"] = ReservationStateChoice.REQUIRES_HANDLING
    series = ReservationSeriesFactory.create_with_matching_reservations(**factory_args)

    deny_reason = ReservationDenyReasonFactory.create()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": series.pk,
        "denyReason": deny_reason.pk,
        "handlingDetails": "Handling details",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__EndAllocation(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["EndAllocation"]

    assert len(factories) == 1
    query_info = factories[0]

    application_round = ApplicationRoundFactory.create_in_status_in_allocation()

    variables = deepcopy(query_info.variables)
    variables["pk"] = application_round.pk
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=MagicMock(refund_id=uuid.uuid4()))
def test_frontend_queries__customer_ui__RefundReservation(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["RefundReservation"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation = ReservationFactory.create_for_refund()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__RejectAllApplicationOptions(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["RejectAllApplicationOptions"]

    assert len(factories) == 1
    query_info = factories[0]

    application = ApplicationFactory.create_in_status_in_allocation()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": application.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__RejectAllSectionOptions(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["RejectAllSectionOptions"]

    assert len(factories) == 1
    query_info = factories[0]

    section = ApplicationSectionFactory.create_in_status_in_allocation()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": section.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__RejectRest(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["RejectRest"]

    assert len(factories) == 1
    query_info = factories[0]

    option = ReservationUnitOptionFactory.create()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": option.pk,
        "isLocked": True,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


@patch_method(PindoraService.sync_access_code)
def test_frontend_queries__customer_ui__RepairReservationAccessCodeSeries(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["RepairReservationAccessCodeSeries"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args: dict[str, Any] = {}
    factory_args["reservations__access_type"] = AccessType.ACCESS_CODE
    factory_args["begin"] = next_hour()

    series = ReservationSeriesFactory.create_with_matching_reservations(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": series.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


@patch_method(PindoraService.sync_access_code)
def test_frontend_queries__customer_ui__RepairReservationAccessCodeSingle(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["RepairReservationAccessCodeSingle"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args: dict[str, Any] = {}
    factory_args["access_type"] = AccessType.ACCESS_CODE
    factory_args["begin"] = next_hour()

    reservation = ReservationFactory.create(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__RequireHandling(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["RequireHandling"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation = ReservationFactory.create_for_requires_handling()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__RescheduleReservationSeries(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["RescheduleReservationSeries"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args: dict[str, Any] = {}
    factory_args["begin"] = next_hour()
    factory_args["weekdays"] = f"{Weekday.MONDAY.as_weekday_number}"

    series = ReservationSeriesFactory.create_with_matching_reservations(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": series.pk,
        "weekdays": [Weekday.TUESDAY.as_weekday_number],
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__RestoreAllApplicationOptions(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["RestoreAllApplicationOptions"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args: dict[str, Any] = {}
    factory_args["application_sections__reservation_unit_options__is_rejected"] = True

    application = ApplicationFactory.create_in_status_in_allocation(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": application.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__RestoreAllSectionOptions(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["RestoreAllSectionOptions"]

    assert len(factories) == 1
    query_info = factories[0]

    factory_args: dict[str, Any] = {}
    factory_args["reservation_unit_options__is_rejected"] = True

    section = ApplicationSectionFactory.create_in_status_in_allocation(**factory_args)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": section.pk,
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__SendResults(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["SendResults"]

    assert len(factories) == 1
    query_info = factories[0]

    application_round = ApplicationRoundFactory.create_in_status_handled()

    variables = deepcopy(query_info.variables)
    variables["pk"] = application_round.pk
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__StaffAdjustReservationTime(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["StaffAdjustReservationTime"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation = ReservationFactory.create_for_time_adjustment()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation.pk,
        "begin": (reservation.begin + datetime.timedelta(hours=1)).isoformat(),
        "end": (reservation.end + datetime.timedelta(hours=1)).isoformat(),
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__UpdateApplicationWorkingMemo(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UpdateApplicationWorkingMemo"]

    assert len(factories) == 1
    query_info = factories[0]

    application = ApplicationFactory.create_in_status_in_allocation()

    variables = deepcopy(query_info.variables)
    variables["pk"] = application.pk
    variables["workingMemo"] = "New working memo"
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__UpdateImage(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UpdateImage"]

    assert len(factories) == 1
    query_info = factories[0]

    image = ReservationUnitImageFactory.create()

    variables = deepcopy(query_info.variables)
    variables["pk"] = image.pk
    variables["imageType"] = ReservationUnitImageType.OTHER.value.upper()
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__UpdateRecurringReservation(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UpdateRecurringReservation"]

    assert len(factories) == 1
    query_info = factories[0]

    series = ReservationSeriesFactory.create()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": series.pk,
        "name": "New name",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__UpdateReservationUnit(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UpdateReservationUnit"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation_unit = ReservationUnitFactory.create(is_draft=True)

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": reservation_unit.pk,
        "name": "New name",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__UpdateReservationWorkingMemo(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UpdateReservationWorkingMemo"]

    assert len(factories) == 1
    query_info = factories[0]

    reservation = ReservationFactory.create()

    variables = deepcopy(query_info.variables)
    variables["pk"] = reservation.pk
    variables["workingMemo"] = "New working memo"
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__UpdateResource(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UpdateResource"]

    assert len(factories) == 1
    query_info = factories[0]

    resource = ResourceFactory.create()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": resource.pk,
        "name": "New name",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__UpdateSpace(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UpdateSpace"]

    assert len(factories) == 1
    query_info = factories[0]

    space = SpaceFactory.create()

    variables = deepcopy(query_info.variables)
    variables["input"] = {
        "pk": space.pk,
        "name": "New name",
    }
    assert_no_undefined_variables(variables)

    query = query_info.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors


def test_frontend_queries__customer_ui__UpdateStaffReservation(graphql):
    admin_factories = get_admin_query_info()
    factories = admin_factories["UpdateStaffReservation"]

    assert len(factories) == 2
    query_info_1 = factories[0]

    reservation = ReservationFactory.create_for_staff_update()

    variables = query_info_1.variables
    variables["input"] = {
        "pk": reservation.pk,
        "name": "New name",
    }
    variables["workingMemo"] = {
        "pk": reservation.pk,
        "workingMemo": "New working memo",
    }
    assert_no_undefined_variables(variables)

    query = query_info_1.query
    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
