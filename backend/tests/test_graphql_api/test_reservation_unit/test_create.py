from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import ReservationKind, Weekday
from tilavarauspalvelu.exceptions import HaukiAPIError
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.integrations.opening_hours.hauki_api_types import HaukiAPIResource, HaukiTranslatedField
from tilavarauspalvelu.models import ReservationUnit

from tests.factories import UnitFactory
from tests.helpers import patch_method

from .helpers import CREATE_MUTATION, get_create_non_draft_input_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__create(graphql):
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
    }

    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.has_errors is False

    reservation_unit = ReservationUnit.objects.get(pk=response.results["pk"])
    assert reservation_unit.is_draft is True
    assert reservation_unit.unit == unit


@patch_method(HaukiAPIClient.get_resource, return_value=HaukiAPIResource(id=123))
@patch_method(
    HaukiAPIClient.create_resource,
    return_value=HaukiAPIResource(
        id=123,
        name=HaukiTranslatedField(fi="nameFi", sv="nameSv", en="nameEn"),
        description=HaukiTranslatedField(fi="descFi", sv="descSv", en="descEn"),
        address=HaukiTranslatedField(fi="addressFi", sv="addressSv", en="addressEn"),
        resource_type="unit",
        children=[],
        parents=[],
        organization="org",
        origins=[],
        last_modified_by=None,
        created="2021-01-01T00:00:00Z",
        modified="2021-01-01T00:00:00Z",
        extra_data={},
        is_public=True,
        timezone="Europe/Helsinki",
        date_periods_hash="hash",
        date_periods_as_text="text",
    ),
)
def test_reservation_unit__create__send_to_hauki__succeeded(graphql, settings):
    settings.HAUKI_EXPORTS_ENABLED = True

    unit = UnitFactory.create(tprek_id="123", tprek_department_id="org")
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
    }

    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert HaukiAPIClient.get_resource.call_count == 1
    assert HaukiAPIClient.create_resource.call_count == 1

    assert response.has_errors is False

    reservation_unit = ReservationUnit.objects.get(pk=response.results["pk"])
    assert reservation_unit.is_draft is True
    assert reservation_unit.unit == unit
    assert reservation_unit.origin_hauki_resource.id == 123


@patch_method(HaukiAPIClient.get_resource, return_value=HaukiAPIResource(id=123))
@patch_method(HaukiAPIClient.create_resource, side_effect=HaukiAPIError("foo"))
def test_reservation_unit__create__send_to_hauki__failed(graphql, settings):
    settings.HAUKI_EXPORTS_ENABLED = True

    unit = UnitFactory.create(tprek_id="123", tprek_department_id="org")
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
    }

    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert HaukiAPIClient.get_resource.call_count == 1
    assert HaukiAPIClient.create_resource.call_count == 1

    assert response.error_message(0) == "Sending reservation unit as resource to aukiolosovellus failed"

    # Unit is still created
    reservation_unit: ReservationUnit | None = ReservationUnit.objects.first()
    assert reservation_unit is not None
    assert reservation_unit.is_draft is True
    assert reservation_unit.unit == unit
    assert reservation_unit.origin_hauki_resource is None  # Unit doesn't have origin hauki resource


def test_reservation_unit__create__empty_name(graphql):
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "",
        "unit": unit.pk,
    }

    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "This field cannot be blank."


def test_reservation_unit__create__instructions(graphql):
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
        "reservationPendingInstructionsFi": "Pending instructions fi",
        "reservationPendingInstructionsSv": "Pending instructions sv",
        "reservationPendingInstructionsEn": "Pending instructions en",
        "reservationConfirmedInstructionsFi": "Confirmed instructions fi",
        "reservationConfirmedInstructionsSv": "Confirmed instructions sv",
        "reservationConfirmedInstructionsEn": "Confirmed instructions en",
        "reservationCancelledInstructionsFi": "Cancelled instructions fi",
        "reservationCancelledInstructionsSv": "Cancelled instructions sv",
        "reservationCancelledInstructionsEn": "Cancelled instructions en",
    }

    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.has_errors is False

    reservation_unit: ReservationUnit = ReservationUnit.objects.get(pk=response.results["pk"])
    assert reservation_unit.reservation_pending_instructions_fi == "Pending instructions fi"
    assert reservation_unit.reservation_pending_instructions_sv == "Pending instructions sv"
    assert reservation_unit.reservation_pending_instructions_en == "Pending instructions en"
    assert reservation_unit.reservation_confirmed_instructions_fi == "Confirmed instructions fi"
    assert reservation_unit.reservation_confirmed_instructions_sv == "Confirmed instructions sv"
    assert reservation_unit.reservation_confirmed_instructions_en == "Confirmed instructions en"
    assert reservation_unit.reservation_cancelled_instructions_fi == "Cancelled instructions fi"
    assert reservation_unit.reservation_cancelled_instructions_sv == "Cancelled instructions sv"
    assert reservation_unit.reservation_cancelled_instructions_en == "Cancelled instructions en"


def test_reservation_unit__create__non_draft(graphql):
    data = get_create_non_draft_input_data()

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.has_errors is False

    assert ReservationUnit.objects.filter(pk=response.results["pk"]).exists()


def test_reservation_unit__create__non_draft__empty_name_translation(graphql):
    data = get_create_non_draft_input_data()
    data["nameEn"] = ""

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Not-draft reservation unit must have a name in english."
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__missing_name_translation(graphql):
    data = get_create_non_draft_input_data()
    del data["nameEn"]

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Not-draft reservation unit must have a name in english."
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__empty_description_translation(graphql):
    data = get_create_non_draft_input_data()
    data["descriptionEn"] = ""

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Not-draft reservation unit must have a description in english."
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__missing_description_translation(graphql):
    data = get_create_non_draft_input_data()
    del data["descriptionEn"]

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Not-draft reservation unit must have a description in english."
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__empty_spaces_and_missing_resources(graphql):
    data = get_create_non_draft_input_data()
    data["resources"] = []
    data["spaces"] = []

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == (
        "Not-draft state reservation unit must have one or more space or resource defined"
    )
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__missing_spaces_and_missing_resources(graphql):
    data = get_create_non_draft_input_data()
    del data["resources"]
    del data["spaces"]

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == (
        "Not-draft state reservation unit must have one or more space or resource defined"
    )
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__missing_reservation_unit_type(graphql):
    data = get_create_non_draft_input_data()
    del data["reservationUnitType"]

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Not-draft reservation unit must have a reservation unit type"
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__min_persons_over_max_persons(graphql):
    data = get_create_non_draft_input_data()
    data["minPersons"] = 11

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "'minPersons' can't be more than 'maxPersons'"
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__reservation_kind_defaults_to_direct_and_season(graphql):
    data = get_create_non_draft_input_data()
    del data["reservationKind"]

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.has_errors is False

    reservation_unit = ReservationUnit.objects.get(pk=response.results["pk"])
    assert reservation_unit.reservation_kind == ReservationKind.DIRECT_AND_SEASON


# Min/Max Reservation Duration #########################################################################################


def test_reservation_unit__create__min_max_reservation_duration__valid(graphql):
    data = get_create_non_draft_input_data()
    data["minReservationDuration"] = int(datetime.timedelta(hours=2).total_seconds())
    data["maxReservationDuration"] = int(datetime.timedelta(hours=3).total_seconds())

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.has_errors is False
    assert ReservationUnit.objects.filter(pk=response.results["pk"]).exists()


def test_reservation_unit__create__min_reservation_duration_greater_than_max_reservation_duration(graphql):
    data = get_create_non_draft_input_data()
    data["minReservationDuration"] = int(datetime.timedelta(hours=2).total_seconds())
    data["maxReservationDuration"] = int(datetime.timedelta(hours=1).total_seconds())

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "'minReservationDuration' can't be greater than 'maxReservationDuration'"
    assert ReservationUnit.objects.count() == 0


@pytest.mark.parametrize("field_name", ["minReservationDuration", "maxReservationDuration"])
def test_reservation_unit__create__min_max_reservation_duration__shorter_than_start_interval(graphql, field_name):
    data = get_create_non_draft_input_data()
    assert "60" in data["reservationStartInterval"]
    data[field_name] = int(datetime.timedelta(minutes=30).total_seconds())

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == f"'{field_name}' must be at least the 'reservationStartInterval'"
    assert ReservationUnit.objects.count() == 0


@pytest.mark.parametrize("field_name", ["minReservationDuration", "maxReservationDuration"])
def test_reservation_unit__create__min_max_reservation_duration__not_multiple_of_start_interval(graphql, field_name):
    data = get_create_non_draft_input_data()
    assert "60" in data["reservationStartInterval"]
    data[field_name] = int(datetime.timedelta(minutes=90).total_seconds())

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == f"'{field_name}' must be a multiple of the 'reservationStartInterval'"
    assert ReservationUnit.objects.count() == 0


# Timeslots ############################################################################################################


def test_reservation_unit__create__with_timeslots(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": Weekday.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
            {
                "weekday": Weekday.TUESDAY.value,
                "isClosed": True,
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    response = graphql(CREATE_MUTATION, variables={"input": data})

    # then:
    # - The response contains no errors
    # - The reservation unit is created
    # - The reservation unit has two timeslots
    assert response.has_errors is False, response
    reservation_units = list(ReservationUnit.objects.all())
    assert len(reservation_units) == 1
    assert reservation_units[0].application_round_time_slots.count() == 2


def test_reservation_unit__create__with_timeslots__weekday_required(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - Timeslot is missing weekday
    response = graphql(CREATE_MUTATION, variables={"input": data})

    # then:
    # - The response contains no errors about requiring weekday
    assert response.has_errors is True, response
    assert "Field 'weekday' of required" in response.error_message(0)


def test_reservation_unit__create__with_timeslots__begin_before_end(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": Weekday.MONDAY.value,
                "reservableTimes": [
                    {"begin": "12:00", "end": "10:00"},
                ],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - Timeslot reservable times overlap
    response = graphql(CREATE_MUTATION, variables={"input": data})

    # then:
    # - The response contains no errors about end time being before begin time
    assert response.has_errors is True, response

    assert response.error_message(0) == "Timeslot 1 begin time must be before end time."


def test_reservation_unit__create__with_timeslots__overlapping_reservable_times(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": Weekday.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                    {"begin": "11:00", "end": "15:00"},
                ],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - Timeslot reservable times overlap
    response = graphql(CREATE_MUTATION, variables={"input": data})

    # then:
    # - The response contains no errors about overlapping reservable times
    assert response.has_errors is True, response

    assert response.error_message(0) == (
        "Timeslot 1 (10:00:00 - 12:00:00) overlaps with timeslot 2 (11:00:00 - 15:00:00)."
    )


def test_reservation_unit__create__with_timeslots__two_for_same_day(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": Weekday.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
            {
                "weekday": Weekday.MONDAY.value,
                "isClosed": True,
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - There are two timeslots for the same day
    response = graphql(CREATE_MUTATION, variables={"input": data})

    # then:
    # - The response contains no errors about multiple timeslots for the same day
    assert response.has_errors is True, response

    assert response.error_message(0) == "Got multiple timeslots for Monday."


def test_reservation_unit__create__with_timeslots__open_has_no_reservable_times(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": Weekday.MONDAY.value,
                "reservableTimes": [],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - There are two timeslots for the same day
    response = graphql(CREATE_MUTATION, variables={"input": data})

    # then:
    # - The response contains no errors about no reservable times
    assert response.has_errors is True, response

    assert response.error_message(0) == "Open timeslots must have reservable times."


def test_reservation_unit__create__with_timeslots__closed_has_reservable_times(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": Weekday.MONDAY.value,
                "isClosed": True,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - There are two timeslots for the same day
    response = graphql(CREATE_MUTATION, variables={"input": data})

    # then:
    # - The response contains no errors about closed timeslot having reservable times
    assert response.has_errors is True, response

    assert response.error_message(0) == "Closed timeslots cannot have reservable times."


def test_reservation_unit__create__reservation_block_whole_day(graphql):
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unit": unit.pk,
        "reservationBlockWholeDay": True,
    }

    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.has_errors is False, response

    reservation_unit: ReservationUnit = ReservationUnit.objects.get(name="foo")
    assert reservation_unit.reservation_block_whole_day is True
