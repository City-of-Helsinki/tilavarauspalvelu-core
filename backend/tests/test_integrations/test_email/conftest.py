from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.enums import PriceUnit, ReservationStateChoice, WeekdayChoice
from utils.date_utils import local_datetime

from tests.factories import (
    ApplicationSectionFactory,
    RecurringReservationFactory,
    ReservationFactory,
    ReservationUnitFactory,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation


@pytest.fixture
def email_reservation() -> Reservation:
    reservation_unit = ReservationUnitFactory.create(
        name_en="[VARAUSYKSIKÖN NIMI]",
        unit__name_en="[TOIMIPISTEEN NIMI]",
        unit__location__address_street_en="[TOIMIPISTEEN OSOITE]",
        unit__location__address_zip="",
        unit__location__address_city_en="[KAUPUNKI]",
        reservation_confirmed_instructions_en="[HYVÄKSYTYN VARAUKSEN OHJEET]",
        reservation_cancelled_instructions_en="[PERUUTETUN VARAUKSEN OHJEET]",
        reservation_pending_instructions_en="[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
        pricings__lowest_price=Decimal("10.00"),
        pricings__highest_price=Decimal("12.30"),
        pricings__price_unit=PriceUnit.PRICE_UNIT_FIXED,
    )
    application_section = ApplicationSectionFactory.create(
        name="[HAKEMUKSEN OSAN NIMI]",
        application__application_round__name_en="[KAUSIVARAUSKIERROKSEN NIMI]",
        application__organisation__name_en="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
    )
    recurring_reservation = RecurringReservationFactory.create(
        reservation_unit=reservation_unit,
        weekdays=f"{WeekdayChoice.MONDAY}",
        begin_date=datetime.date(2024, 1, 1),
        begin_time=datetime.time(13),
        end_time=datetime.time(15),
        allocated_time_slot__reservation_unit_option__reservation_unit=reservation_unit,
        allocated_time_slot__reservation_unit_option__application_section=application_section,
    )
    reservation = ReservationFactory.create_for_reservation_unit(
        name="[VARAUKSEN NIMI]",
        reservation_unit=reservation_unit,
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
        reservee_first_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        reservee_last_name="",
        cancel_reason__reason_en="[PERUUTUKSEN SYY]",
        deny_reason__reason_en="[HYLKÄYKSEN SYY]",
        begin=local_datetime(2024, 1, 1, 12, 0),
        end=local_datetime(2024, 1, 1, 15, 0),
        recurring_reservation=recurring_reservation,
        price=Decimal("12.30"),
        non_subsidised_price=Decimal("12.30"),
        tax_percentage_value=Decimal("25.5"),
    )

    recurring_reservation_2 = RecurringReservationFactory.create(
        reservation_unit=reservation_unit,
        weekdays=f"{WeekdayChoice.TUESDAY}",
        begin_date=datetime.date(2024, 1, 2),
        begin_time=datetime.time(21),
        end_time=datetime.time(22),
        allocated_time_slot__reservation_unit_option__reservation_unit=reservation_unit,
        allocated_time_slot__reservation_unit_option__application_section=application_section,
    )
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
        reservee_first_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        reservee_last_name="",
        cancel_reason__reason_en="[PERUUTUKSEN SYY]",
        deny_reason__reason_en="[HYLKÄYKSEN SYY]",
        begin=local_datetime(2024, 1, 2, 12, 0),
        end=local_datetime(2024, 1, 2, 15, 0),
        recurring_reservation=recurring_reservation_2,
    )

    return reservation
