from __future__ import annotations

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import AccessType, ReservationStartInterval, ReservationStateChoice, TermsOfUseTypeChoices
from utils.date_utils import local_date, local_datetime, next_hour

from tests.factories import (
    ReservationFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitFactory,
    TermsOfUseFactory,
)

from .helpers import UPDATE_MUTATION, get_non_draft_update_input_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__update__name(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(reservation_unit, nameFi="foo")

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.name_fi == "foo"


def test_reservation_unit__update__surface_area(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(reservation_unit, surfaceArea=150)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.surface_area == 150


def test_reservation_unit__update__reservation_confirmed_instructions(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(
        reservation_unit,
        reservationConfirmedInstructionsFi="foo",
        reservationConfirmedInstructionsSv="bar",
        reservationConfirmedInstructionsEn="baz",
    )

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.reservation_confirmed_instructions_fi == "foo"
    assert reservation_unit.reservation_confirmed_instructions_sv == "bar"
    assert reservation_unit.reservation_confirmed_instructions_en == "baz"


def test_reservation_unit__update__max_reservations_per_user(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(reservation_unit, maxReservationsPerUser=10)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.max_reservations_per_user == 10


def test_reservation_unit__update__cancellation_rule(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    rule = ReservationUnitCancellationRuleFactory.create()
    data = get_non_draft_update_input_data(reservation_unit, cancellationRule=rule.pk)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.cancellation_rule == rule


def test_reservation_unit__update__cancellation_rule__to_null(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(
        is_draft=False,
        cancellation_rule=ReservationUnitCancellationRuleFactory.create(),
    )
    data = get_non_draft_update_input_data(reservation_unit, cancellationRule=None)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.cancellation_rule is None


def test_reservation_unit__update__reservation_start_interval_invalid(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(reservation_unit, reservationStartInterval="invalid")

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message().startswith("Variable '$input' got invalid value 'invalid'")

    reservation_unit.refresh_from_db()
    assert reservation_unit.reservation_start_interval != "invalid"


def test_reservation_unit__update__empty_name_translation(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(reservation_unit, nameEn="")

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Not draft state reservation units must have a translations. Missing translation for nameEn.",
    ]


def test_reservation_unit__update__empty_description_translation(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(reservation_unit, descriptionEn="")

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Not draft state reservation units must have a translations. Missing translation for descriptionEn."
    ]


def test_reservation_unit__update__empty_spaces_and_resources(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(reservation_unit, spaces=[], resources=[])

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Not draft state reservation unit must have one or more space or resource defined"
    ]


def test_reservation_unit__update__empty_type(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(reservation_unit, reservationUnitType=None)

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Not draft reservation unit must have a reservation unit type."]


def test_reservation_unit__update__reservation_start_interval(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(
        reservation_unit, reservationStartInterval=ReservationStartInterval.INTERVAL_60_MINUTES.value.upper()
    )

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.reservation_start_interval == ReservationStartInterval.INTERVAL_60_MINUTES.value


def test_reservation_unit__update__min_persons_over_max_persons_errors(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(reservation_unit, minPersons=11, maxPersons=10)

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["minPersons can't be more than maxPersons"]


def test_reservation_unit__update__min_persons(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(reservation_unit, minPersons=1, maxPersons=10)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.min_persons == 1


def test_reservation_unit__update__pricing_terms(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    pricing_terms = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING)
    data = get_non_draft_update_input_data(reservation_unit, pricingTerms=pricing_terms.pk)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.pricing_terms == pricing_terms


def test_reservation_unit__update__instructions(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(
        reservation_unit,
        reservationPendingInstructionsFi="Pending instructions fi",
        reservationPendingInstructionsSv="Pending instructions sv",
        reservationPendingInstructionsEn="Pending instructions en",
        reservationConfirmedInstructionsFi="Confirmed instructions fi",
        reservationConfirmedInstructionsSv="Confirmed instructions sv",
        reservationConfirmedInstructionsEn="Confirmed instructions en",
        reservationCancelledInstructionsFi="Cancelled instructions fi",
        reservationCancelledInstructionsSv="Cancelled instructions sv",
        reservationCancelledInstructionsEn="Cancelled instructions en",
    )

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.reservation_pending_instructions_fi == "Pending instructions fi"
    assert reservation_unit.reservation_pending_instructions_sv == "Pending instructions sv"
    assert reservation_unit.reservation_pending_instructions_en == "Pending instructions en"
    assert reservation_unit.reservation_confirmed_instructions_fi == "Confirmed instructions fi"
    assert reservation_unit.reservation_confirmed_instructions_sv == "Confirmed instructions sv"
    assert reservation_unit.reservation_confirmed_instructions_en == "Confirmed instructions en"
    assert reservation_unit.reservation_cancelled_instructions_fi == "Cancelled instructions fi"
    assert reservation_unit.reservation_cancelled_instructions_sv == "Cancelled instructions sv"
    assert reservation_unit.reservation_cancelled_instructions_en == "Cancelled instructions en"


def test_reservation_unit__update__archiving_also_sets_as_draft(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    data = get_non_draft_update_input_data(
        reservation_unit,
        isDraft=True,  # This should be ignored
        isArchived=True,
    )

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_archived is True
    assert reservation_unit.is_draft is True


def test_reservation_unit__update__archiving_is_blocked_if_reservation_unit_has_future_reservations(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit,
        begins_at=next_hour(plus_days=1),
        ends_at=next_hour(plus_days=1, plus_hours=1),
    )
    data = get_non_draft_update_input_data(
        reservation_unit,
        isArchived=True,
    )

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is True, response
    assert response.field_error_codes()[0] == error_codes.RESERVATION_UNIT_HAS_FUTURE_RESERVATIONS

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_archived is False
    assert reservation_unit.is_draft is False


def test_reservation_unit__update__archiving_not_blocked_if_reservation_unit_has_future_inactive_reservations(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit,
        state=ReservationStateChoice.CANCELLED,
        begins_at=next_hour(plus_days=1),
        ends_at=next_hour(plus_days=1, plus_hours=1),
    )
    data = get_non_draft_update_input_data(
        reservation_unit,
        isArchived=True,
    )

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_archived is True
    assert reservation_unit.is_draft is True


@freeze_time(local_datetime(2024, 1, 1))
def test_reservation_unit__update__access_type__change_future_reservations(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(
        is_draft=False,
        access_types__access_type=AccessType.UNRESTRICTED,
    )

    past_reservation = ReservationFactory.create(
        reservation_units=[reservation_unit],
        access_type=AccessType.UNRESTRICTED,
        begins_at=local_datetime(2023, 12, 1, 12),
        ends_at=local_datetime(2023, 12, 1, 13),
    )
    future_reservation = ReservationFactory.create(
        reservation_units=[reservation_unit],
        access_type=AccessType.UNRESTRICTED,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
    )

    access_type_data = {
        "accessType": AccessType.PHYSICAL_KEY,
        "beginDate": local_date(2024, 1, 1).isoformat(),
    }
    data = get_non_draft_update_input_data(reservation_unit, accessTypes=access_type_data)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    past_reservation.refresh_from_db()
    assert past_reservation.access_type == AccessType.UNRESTRICTED

    future_reservation.refresh_from_db()
    assert future_reservation.access_type == AccessType.PHYSICAL_KEY


@freeze_time(local_datetime(2024, 1, 1))
def test_reservation_unit__update__access_type__change_period(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(
        is_draft=False,
        access_types__access_type=AccessType.UNRESTRICTED,
    )

    before_period_reservation = ReservationFactory.create(
        reservation_units=[reservation_unit],
        access_type=AccessType.PHYSICAL_KEY,
        begins_at=local_datetime(2023, 12, 31, 12),
        ends_at=local_datetime(2023, 12, 31, 13),
    )
    on_period_reservation = ReservationFactory.create(
        reservation_units=[reservation_unit],
        access_type=AccessType.UNRESTRICTED,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
    )
    after_period_reservation = ReservationFactory.create(
        reservation_units=[reservation_unit],
        access_type=AccessType.PHYSICAL_KEY,
        begins_at=local_datetime(2024, 1, 3, 12),
        ends_at=local_datetime(2024, 1, 3, 13),
    )

    data = get_non_draft_update_input_data(
        reservation_unit,
        accessTypes=[
            {
                "accessType": AccessType.OPENED_BY_STAFF,
                "beginDate": "2024-01-01",
            },
            {
                "accessType": AccessType.UNRESTRICTED,
                "beginDate": "2024-01-03",
            },
        ],
    )

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    assert len(reservation_unit.access_types.all()) == 3

    before_period_reservation.refresh_from_db()
    assert before_period_reservation.access_type == AccessType.PHYSICAL_KEY

    on_period_reservation.refresh_from_db()
    assert on_period_reservation.access_type == AccessType.OPENED_BY_STAFF

    after_period_reservation.refresh_from_db()
    assert after_period_reservation.access_type == AccessType.UNRESTRICTED
