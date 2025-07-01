from __future__ import annotations

import datetime
from decimal import Decimal

import freezegun
import pytest
from django.test import override_settings

from tilavarauspalvelu.enums import AccessType, ReservationStartInterval, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from tilavarauspalvelu.models import Reservation, ReservationUnitHierarchy
from tilavarauspalvelu.models.reservation.actions import ReservationActions
from utils.date_utils import DEFAULT_TIMEZONE, local_date, local_datetime, local_start_of_day

from tests.factories import (
    ApplicationRoundFactory,
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    SpaceFactory,
    UserFactory,
)
from tests.helpers import patch_method

from .helpers import ADJUST_MUTATION, get_adjust_data

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_reservation_rescheduled_email)
def test_reservation__adjust_time__success(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()
    reservation_begin = reservation.begin
    reservation_end = reservation.end

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.begin != reservation_begin
    assert reservation.end != reservation_end

    assert EmailService.send_reservation_rescheduled_email.called is True


def test_reservation__adjust_time__wrong_state(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(state=ReservationStateChoice.CANCELLED)

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be rescheduled based on its state"]


def test_reservation__adjust_time__new_reservation_begin_in_past(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    graphql.login_with_superuser()
    data = get_adjust_data(
        reservation,
        begin=(last_hour - datetime.timedelta(hours=1)).isoformat(),
    )
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot begin in the past."]


def test_reservation__adjust_time__reservation__adjust_time__reservation_begin_in_past(graphql):
    now = local_datetime()
    reservation = ReservationFactory.create_for_time_adjustment(
        begin=now - datetime.timedelta(hours=1),
        end=now + datetime.timedelta(hours=1),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Past or ongoing reservations cannot be modified"]


def test_reservation__adjust_time__reservation_unit_missing_cancellation_rule(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(reservation_units__cancellation_rule=None)

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be changed because it has no cancellation rule."]


def test_reservation__adjust_time__cancellation_rule_time_limit_exceed(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_units__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(hours=24),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation time cannot be changed because the cancellation period has expired."
    ]


def test_reservation__adjust_time__reservation_is_already_handled(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(handled_at=local_datetime())

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be modified since it has been handled"]


def test_reservation__adjust_time__reservation_has_price_to_be_paid(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(price=Decimal(1))

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Paid reservations cannot be modified"]


def test_reservation__adjust_time__change_would_make_unit_reservation_unit_paid(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()
    ReservationUnitPricingFactory.create(
        begins=local_date(),
        reservation_unit=reservation.reservation_units.first(),
    )

    data = get_adjust_data(reservation)

    graphql.login_with_superuser()
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation cannot be rescheduled to a point where it would become paid.",
    ]


def test_reservation__adjust_time__reservation_unit_not_reservable_in_new_time(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_units__reservation_begins=local_datetime() + datetime.timedelta(days=1),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation unit is not reservable at the time of the reservation."]


def test_reservation__adjust_time__new_time_overlaps_another_reservation(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    overlapping = ReservationFactory.create(
        reservation_units=[reservation.reservation_units.first()],
        begin=reservation.begin + datetime.timedelta(hours=1),
        end=reservation.end + datetime.timedelta(hours=1),
        state=ReservationStateChoice.CONFIRMED,
    )

    graphql.login_with_superuser()
    data = get_adjust_data(
        reservation,
        begin=overlapping.begin.isoformat(),
        end=overlapping.end.isoformat(),
    )

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]


def test_reservation__adjust_time__new_time_duration_under_min_duration(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_units__min_reservation_duration=datetime.timedelta(hours=3),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation duration is less than the reservation unit's minimum allowed duration."
    ]


def test_reservation__adjust_time__new_time_duration_over_max_duration(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_units__max_reservation_duration=datetime.timedelta(minutes=30),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation duration exceeds reservation unit's maximum allowed duration."
    ]


def test_reservation__adjust_time__overlaps_with_buffer_time(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    ReservationFactory.create(
        reservation_units=[reservation.reservation_units.first()],
        begin=reservation.begin + datetime.timedelta(hours=3),
        end=reservation.end + datetime.timedelta(hours=3),
        buffer_time_before=datetime.timedelta(minutes=1),
        state=ReservationStateChoice.CONFIRMED,
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]


def test_reservation__adjust_time__max_days_before_exceeded(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_units__reservations_max_days_before=1,
    )

    data = get_adjust_data(
        reservation,
        begin=(reservation.begin + datetime.timedelta(days=2)).isoformat(),
        end=(reservation.end + datetime.timedelta(days=2)).isoformat(),
    )

    graphql.login_with_superuser()
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation start time is earlier than 1 days before."]


def test_reservation__adjust_time__min_days_before_subceeded(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_units__reservations_min_days_before=7,
    )

    graphql.login_with_superuser()
    data = get_adjust_data(
        reservation,
        begin=(reservation.begin + datetime.timedelta(days=5)).isoformat(),
        end=(reservation.end + datetime.timedelta(days=5)).isoformat(),
    )
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation start time is later than 7 days before."]


def test_reservation__adjust_time__reservation_unit_not_open_in_new_time(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    graphql.login_with_superuser()
    data = get_adjust_data(
        reservation,
        begin=(reservation.begin + datetime.timedelta(days=3)).isoformat(),
        end=(reservation.end + datetime.timedelta(days=3)).isoformat(),
    )
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation unit is not open within desired reservation time."]


def test_reservation__adjust_time__reservation_unit_in_open_application_round(graphql):
    space = SpaceFactory.create()

    reservation_unit = ReservationUnitFactory.create_reservable_now(
        origin_hauki_resource__id="987",
        spaces=[space],
        unit=space.unit,
        pricings__lowest_price=0,
        pricings__highest_price=0,
        pricings__tax_percentage__value=0,
        cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(),
    )

    application_round = ApplicationRoundFactory.create_in_status_open(reservation_units=[reservation_unit])

    begin = local_start_of_day(application_round.reservation_period_begin_date) + datetime.timedelta(days=1)
    end = begin + datetime.timedelta(hours=1)

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=begin - datetime.timedelta(days=1),
        end_datetime=end + datetime.timedelta(days=4),
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        begin=begin,
        end=end,
        reservation_units=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation unit is in an open application round."]


def test_reservation__adjust_time__reservation_start_time_not_within_the_interval(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_units__reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES.value,
    )

    data = get_adjust_data(
        reservation,
        begin=(reservation.begin + datetime.timedelta(hours=1, minutes=10)).isoformat(),
    )

    graphql.login_with_superuser()
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation duration is not a multiple of the start interval of 15 minutes."
    ]


def test_reservation__adjust_time__reservee_can_adjust(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()
    reservation_begin = reservation.begin
    reservation_end = reservation.end

    graphql.force_login(reservation.user)

    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.begin != reservation_begin
    assert reservation.end != reservation_end


def test_reservation__adjust_time__adjust_not_allowed_for_another_user(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    graphql.login_with_regular_user()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_reservation__adjust_time__unit_admin_can_adjust_user_reservation(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()
    reservation_begin = reservation.begin
    reservation_end = reservation.end

    unit = reservation.reservation_units.first().unit
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.begin != reservation_begin
    assert reservation.end != reservation_end


def test_reservation__adjust_time__non_internal_ad_user(graphql):
    user = UserFactory.create_ad_user(email="test@example.com")
    reservation = ReservationFactory.create_for_time_adjustment(user=user)

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["AD user is not an internal user."]


def test_reservation__adjust_time__non_internal_ad_user__is_superuser(graphql):
    user = UserFactory.create_ad_user(is_superuser=True, email="test@example.com")
    reservation = ReservationFactory.create_for_time_adjustment(user=user)

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


@override_settings(SEND_EMAILS=True)
def test_reservation__adjust_time__needs_handling_after_time_change(graphql, outbox):
    reservation = ReservationFactory.create_for_time_adjustment(reservation_units__require_reservation_handling=True)
    reservation_begin = reservation.begin
    reservation_end = reservation.end

    # Staff user will receive email about the reservation requiring handling
    unit = reservation.reservation_units.first().unit
    UserFactory.create_with_unit_role(units=[unit])

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING
    assert reservation.begin != reservation_begin
    assert reservation.end != reservation_end

    assert len(outbox) == 2
    assert outbox[0].subject == "Your booking has been updated"
    unit_name = reservation.reservation_units.first().unit.name
    assert outbox[1].subject == f"New booking {reservation.id} requires handling at unit {unit_name}"


@freezegun.freeze_time("2021-01-01")
def test_reservation__adjust_time__reservation_block_whole_day__ignore_given_buffers(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999),
        pricings__lowest_price=0,
        pricings__highest_price=0,
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
        cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(hours=0),
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime.datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )
    reservation = ReservationFactory.create_for_reservation_unit(
        name="foo",
        reservation_unit=reservation_unit,
        begin=datetime.datetime(2023, 1, 1, 8, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 1, 9, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.CONFIRMED.value,
        handled_at=None,
    )

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    input_data = {
        "pk": reservation.pk,
        "begin": datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    }

    response = graphql(ADJUST_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == datetime.timedelta(hours=12)
    assert reservation.buffer_time_after == datetime.timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_reservation__adjust_time__update_reservation_buffer_on_adjust(graphql):
    reservation_unit = ReservationUnitFactory.create(
        pricings__lowest_price=0,
        pricings__highest_price=0,
        buffer_time_before=datetime.timedelta(hours=1),
        buffer_time_after=datetime.timedelta(hours=1),
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999),
        spaces=[SpaceFactory.create()],
        cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(hours=0),
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime.datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )
    reservation = ReservationFactory.create_for_reservation_unit(
        name="foo",
        reservation_unit=reservation_unit,
        begin=datetime.datetime(2023, 1, 1, 8, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 1, 9, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.CONFIRMED.value,
        handled_at=None,
    )

    # Changing the reservation unit buffers. These should be applied to the reservation when it is adjusted.
    reservation_unit.buffer_time_before = datetime.timedelta(hours=2)
    reservation_unit.buffer_time_after = datetime.timedelta(hours=2)
    reservation_unit.save()

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    input_data = {
        "pk": reservation.pk,
        "begin": datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    }

    response = graphql(ADJUST_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE)
    # New reservation unit buffers are applied automatically on adjust.
    assert reservation.buffer_time_before == datetime.timedelta(hours=2)
    assert reservation.buffer_time_after == datetime.timedelta(hours=2)


@patch_method(PindoraClient.get_reservation, side_effect=PindoraNotFoundError("Not found"))  # Called by email sending
@patch_method(PindoraService.sync_access_code)
def test_reservation__adjust_time__same_access_type(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        access_type=AccessType.ACCESS_CODE,
        reservation_units__access_types__access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.call_count == 1

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True


@patch_method(PindoraService.sync_access_code)
def test_reservation__adjust_time__same_access_type__requires_handling(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        access_type=AccessType.ACCESS_CODE,
        reservation_units__access_types__access_type=AccessType.ACCESS_CODE,
        reservation_units__require_reservation_handling=True,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.call_count == 1


@patch_method(PindoraClient.get_reservation, side_effect=PindoraNotFoundError("Not found"))  # Called by email sending
@patch_method(PindoraService.sync_access_code)
def test_reservation__adjust_time__change_to_access_code(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        access_type=AccessType.UNRESTRICTED,
        reservation_units__access_types__access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.call_count == 1


@patch_method(PindoraService.sync_access_code)
def test_reservation__adjust_time__change_to_access_code__requires_handling(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        access_type=AccessType.UNRESTRICTED,
        reservation_units__access_types__access_type=AccessType.ACCESS_CODE,
        reservation_units__require_reservation_handling=True,
        access_code_is_active=False,
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.call_count == 1


@patch_method(PindoraService.sync_access_code)
def test_reservation__adjust_time__change_from_access_code(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        access_type=AccessType.ACCESS_CODE,
        reservation_units__access_types__access_type=AccessType.UNRESTRICTED,
        access_code_generated_at=datetime.datetime(2025, 1, 1, tzinfo=DEFAULT_TIMEZONE),
        access_code_is_active=True,
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.call_count == 1


@patch_method(PindoraService.sync_access_code, side_effect=PindoraAPIError("Pindora Error"))
def test_reservation__adjust_time__pindora_call_fails(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        access_type=AccessType.ACCESS_CODE,
        reservation_units__access_types__access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=datetime.datetime(2025, 1, 1, tzinfo=DEFAULT_TIMEZONE),
        access_code_is_active=True,
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Pindora Error"]

    assert PindoraService.sync_access_code.call_count == 1


def test_reservation__adjust_time__overlapping_reservation_created_at_the_same_time(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()
    reservation_begin = reservation.begin
    reservation_end = reservation.end
    reservation_unit = reservation.reservation_units.first()

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)

    def callback(*args, **kwargs):
        res = ReservationFactory.create_for_reservation_unit(
            reservation_unit=reservation_unit,
            begin=reservation_begin,
            end=reservation_end,
        )
        return Reservation.objects.filter(pk=res.pk)

    with patch_method(ReservationActions.overlapping_reservations, side_effect=callback):
        response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Overlapping reservations were created at the same time."]

    # Reservation is not changed
    reservation.refresh_from_db()
    assert reservation.begin == reservation_begin
    assert reservation.end == reservation_end
