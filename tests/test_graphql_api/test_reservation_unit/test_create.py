import pytest

from applications.choices import WeekdayChoice
from opening_hours.errors import HaukiAPIError
from opening_hours.utils.hauki_api_client import HaukiAPIClient
from opening_hours.utils.hauki_api_types import HaukiAPIResource, HaukiTranslatedField
from reservation_units.enums import ReservationKind
from reservation_units.models import ReservationUnit
from tests.factories import (
    UnitFactory,
)
from tests.helpers import UserType, patch_method

from .helpers import CREATE_MUTATION, get_create_non_draft_input_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_hauki_export"),
]


def test_reservation_unit__create(graphql):
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "unitPk": unit.pk,
    }

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
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
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "unitPk": unit.pk,
    }

    response = graphql(CREATE_MUTATION, input_data=data)

    assert HaukiAPIClient.get_resource.call_count == 1
    assert HaukiAPIClient.create_resource.call_count == 1

    assert response.has_errors is False

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.is_draft is True
    assert reservation_unit.unit == unit
    assert reservation_unit.origin_hauki_resource.id == 123


@patch_method(HaukiAPIClient.get_resource, return_value=HaukiAPIResource(id=123))
@patch_method(HaukiAPIClient.create_resource, side_effect=HaukiAPIError())
def test_reservation_unit__create__send_to_hauki__failed(graphql, settings):
    settings.HAUKI_EXPORTS_ENABLED = True

    unit = UnitFactory.create(tprek_id="123", tprek_department_id="org")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "unitPk": unit.pk,
    }

    response = graphql(CREATE_MUTATION, input_data=data)

    assert HaukiAPIClient.get_resource.call_count == 1
    assert HaukiAPIClient.create_resource.call_count == 1

    assert response.error_message() == "Sending reservation unit as resource to HAUKI failed."

    # Unit is still created
    reservation_unit: ReservationUnit | None = ReservationUnit.objects.first()
    assert reservation_unit is not None
    assert reservation_unit.is_draft is True
    assert reservation_unit.unit == unit
    assert reservation_unit.origin_hauki_resource is None  # Unit doesn't have origin hauki resource


def test_reservation_unit__create__empty_name(graphql):
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "",
        "unitPk": unit.pk,
    }

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "nameFi is required for draft reservation units."


def test_reservation_unit__create__payment_types(graphql):
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "unitPk": unit.pk,
        "paymentTypes": ["ON_SITE", "INVOICE"],
    }

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    payment_types = list(reservation_unit.payment_types.order_by("code").values_list("code", flat=True))
    assert payment_types == ["INVOICE", "ON_SITE"]


def test_reservation_unit__create__instructions(graphql):
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "unitPk": unit.pk,
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

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    reservation_unit: ReservationUnit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
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

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    assert ReservationUnit.objects.filter(pk=response.first_query_object["pk"]).exists()


def test_reservation_unit__create__non_draft__empty_name_translations(graphql):
    data = get_create_non_draft_input_data()
    data["nameEn"] = ""
    data["nameSv"] = ""

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message().startswith("Not draft state reservation units must have a translations.")
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__missing_name_translations(graphql):
    data = get_create_non_draft_input_data()
    del data["nameEn"]
    del data["nameSv"]

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message().startswith("Not draft state reservation units must have a translations.")
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__empty_description_translations(graphql):
    data = get_create_non_draft_input_data()
    data["descriptionEn"] = ""
    data["descriptionSv"] = ""

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message().startswith("Not draft state reservation units must have a translations.")
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__missing_description_translations(graphql):
    data = get_create_non_draft_input_data()
    del data["descriptionEn"]
    del data["descriptionSv"]

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message().startswith("Not draft state reservation units must have a translations.")
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__empty_spaces_and_missing_resources(graphql):
    data = get_create_non_draft_input_data()
    data["resourcePks"] = []
    data["spacePks"] = []

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == (
        "Not draft state reservation unit must have one or more space or resource defined"
    )
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__missing_spaces_and_missing_resources(graphql):
    data = get_create_non_draft_input_data()
    del data["resourcePks"]
    del data["spacePks"]

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == (
        "Not draft state reservation unit must have one or more space or resource defined"
    )
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__missing_reservation_unit_type(graphql):
    data = get_create_non_draft_input_data()
    del data["reservationUnitTypePk"]

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Not draft reservation unit must have a reservation unit type."
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__min_persons_over_max_persons(graphql):
    data = get_create_non_draft_input_data()
    data["minPersons"] = 11

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "minPersons can't be more than maxPersons"
    assert ReservationUnit.objects.count() == 0


def test_reservation_unit__create__non_draft__reservation_kind_defaults_to_direct_and_season(graphql):
    data = get_create_non_draft_input_data()
    del data["reservationKind"]

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    assert reservation_unit.reservation_kind == ReservationKind.DIRECT_AND_SEASON


def test_reservation_unit__create__with_timeslots(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
            {
                "weekday": WeekdayChoice.TUESDAY.value,
                "closed": True,
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    response = graphql(CREATE_MUTATION, input_data=data)

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
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
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
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about requiring weekday
    assert response.has_errors is True, response
    assert "Field 'weekday' of required" in response.error_message()


def test_reservation_unit__create__with_timeslots__begin_before_end(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "12:00", "end": "10:00"},
                ],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - Timeslot reservable times overlap
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about end time being before begin time
    assert response.has_errors is True, response
    assert response.error_message() == "Timeslot 1 begin time must be before end time."


def test_reservation_unit__create__with_timeslots__overlapping_reservable_times(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
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
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about overlapping reservable times
    assert response.has_errors is True, response
    assert response.error_message() == (
        "Timeslot 1 (10:00:00 - 12:00:00) overlaps with timeslot 2 (11:00:00 - 15:00:00)."
    )


def test_reservation_unit__create__with_timeslots__two_for_same_day(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "closed": True,
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - There are two timeslots for the same day
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about multiple timeslots for the same day
    assert response.has_errors is True, response
    assert response.error_message() == "Got multiple timeslots for Monday."


def test_reservation_unit__create__with_timeslots__open_has_no_reservable_times(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - There are two timeslots for the same day
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about no reservable times
    assert response.has_errors is True, response
    assert response.error_message() == "Open timeslots must have reservable times."


def test_reservation_unit__create__with_timeslots__closed_has_reservable_times(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "closed": True,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - There are two timeslots for the same day
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about closed timeslot having reservable times
    assert response.has_errors is True, response
    assert response.error_message() == "Closed timeslots cannot have reservable times."


def test_reservation_unit__create__reservation_block_whole_day(graphql):
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "reservationBlockWholeDay": True,
    }

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit: ReservationUnit = ReservationUnit.objects.get(name="foo")
    assert reservation_unit.reservation_block_whole_day is True
