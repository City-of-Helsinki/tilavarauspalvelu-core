from typing import TYPE_CHECKING

import pytest
from django.utils.timezone import get_default_timezone

from common.utils import get_attr_by_language
from tests.factories import (
    LocationFactory,
    ReservationCancelReasonFactory,
    ReservationDenyReasonFactory,
    ReservationFactory,
    ReservationUnitFactory,
    UserFactory,
)
from tilavarauspalvelu.enums import CustomerTypeChoice
from tilavarauspalvelu.models import Location, Reservation
from tilavarauspalvelu.utils.email.email_builder_reservation import ReservationEmailContext

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit

pytestmark = [
    pytest.mark.django_db,
]


@pytest.fixture
def reservation() -> Reservation:
    reservation_unit = ReservationUnitFactory.create(
        name_fi="ReservationUnit Name FI",
        name_sv="ReservationUnit Name SV",
        name_en="ReservationUnit Name EN",
        unit__name="Test unit",
        unit__name_sv="Svensk test namn",
        unit__name_en="English test name",
    )
    LocationFactory.create(
        unit=reservation_unit.unit,
        address_street="Street",
        address_zip="0100",
        address_city="Rovaniemi",
    )
    deny_reason = ReservationDenyReasonFactory.create(
        reason_fi="Reason FI",
        reason_sv="Reason SV",
        reason_en=None,  # None should use fi as fallback
    )
    cancel_reason = ReservationCancelReasonFactory.create(
        reason_fi="Reason FI",
        reason_sv="Reason SV",
        reason_en="",  # empty string should use fi as fallback
    )
    return ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        name="Test reservation",
        deny_reason=deny_reason,
        cancel_reason=cancel_reason,
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
    )


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_context__from_reservation(language, reservation):
    reservation.reservee_language = language

    reservation_unit: ReservationUnit = reservation.reservation_unit.first()

    context = ReservationEmailContext.from_reservation(reservation)
    assert context.language == language

    assert context.reservee_name == f"{reservation.reservee_first_name} {reservation.reservee_last_name}"
    assert context.name == reservation.name
    assert context.reservation_number == reservation.id
    assert context.reservation_unit == get_attr_by_language(reservation_unit, "name", language)
    assert context.unit_name == get_attr_by_language(reservation_unit.unit, "name", language)
    assert context.unit_location == str(reservation_unit.unit.location)

    reservation_begin_datetime = reservation.begin.astimezone(get_default_timezone())
    reservation_end_datetime = reservation.end.astimezone(get_default_timezone())
    assert context.begin_date == reservation_begin_datetime.strftime("%-d.%-m.%Y")
    assert context.begin_time == reservation_begin_datetime.strftime("%H:%M")
    assert context.end_date == reservation_end_datetime.strftime("%-d.%-m.%Y")
    assert context.end_time == reservation_end_datetime.strftime("%H:%M")

    assert context.price == reservation.price
    assert context.non_subsidised_price == reservation.non_subsidised_price
    assert context.subsidised_price == reservation.price
    assert context.tax_percentage == reservation.tax_percentage_value

    assert context.confirmed_instructions == getattr(reservation_unit, f"reservation_confirmed_instructions_{language}")
    assert context.pending_instructions == getattr(reservation_unit, f"reservation_pending_instructions_{language}")
    assert context.cancelled_instructions == getattr(reservation_unit, f"reservation_cancelled_instructions_{language}")

    assert reservation.deny_reason.reason_en is None
    assert context.deny_reason == get_attr_by_language(reservation.deny_reason, "reason", language)

    assert reservation.cancel_reason.reason_en == ""
    assert context.cancel_reason == get_attr_by_language(reservation.cancel_reason, "reason", language)


def test_email_context__from_reservation__organisation_name(reservation):
    reservation.reservee_type = CustomerTypeChoice.BUSINESS
    reservation.reservee_organisation_name = "Business"
    reservation.save()

    context = ReservationEmailContext.from_reservation(reservation)
    assert context.reservee_name == reservation.reservee_organisation_name


def test_email_context__from_reservation__no_location(reservation):
    Location.objects.all().delete()
    context = ReservationEmailContext.from_reservation(reservation)
    assert context.unit_location == ""


def test_email_context__from_reservation_unit__name_uses_reservation_user_preferred_language(reservation):
    user = UserFactory.create(
        username="test",
        first_name="test",
        last_name="user",
        email="test.user@localhost",
        preferred_language="sv",
    )
    reservation.user = user
    reservation.save()

    context = ReservationEmailContext.from_reservation(reservation)
    assert context.unit_name == reservation.reservation_unit.first().unit.name_sv
