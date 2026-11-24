from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from django.db.models import Sum
from freezegun import freeze_time

from tilavarauspalvelu.enums import (
    ApplicationFormType,
    ApplicationRoundStatusChoice,
    ApplicationStatusChoice,
    RejectionReadinessChoice,
    ReservationTypeChoice,
    Weekday,
)
from tilavarauspalvelu.management.commands.data_creation.create_manual_test_data import (
    create_manual_test_round_in_allocation,
    create_open_manual_test_round,
    create_open_paid_manual_test_round,
    create_paid_manual_test_round_in_allocation,
    remove_manual_test_round_in_allocation,
    remove_open_manual_test_round,
    remove_open_paid_manual_test_round,
    remove_paid_manual_test_round_in_allocation,
)
from tilavarauspalvelu.models import (
    AgeGroup,
    AllocatedTimeSlot,
    Application,
    ApplicationRound,
    ApplicationRoundTimeSlot,
    ApplicationSection,
    PriceComponent,
    PriceOption,
    PricingGroup,
    RejectedOccurrence,
    Reservation,
    ReservationPriceLine,
    ReservationPurpose,
    ReservationSeries,
    ReservationUnit,
    ReservationUnitAccessType,
    ReservationUnitHierarchy,
    ReservationUnitOption,
    ReservationUnitPricingGroup,
    Resource,
    Space,
    SuitableTimeRange,
    TaxLevel,
    TermsOfUse,
    Unit,
    UnitGroup,
    User,
)
from tilavarauspalvelu.services.pricing.application_round_options import (
    application_round_price_options,
    check_application_round_change,
)
from tilavarauspalvelu.tasks import create_robot_test_data_task
from utils.date_utils import local_date, local_datetime

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationFactory,
    ApplicationRoundFactory,
    ReservationFactory,
    ReservationSeriesFactory,
)
from tests.test_graphql_api.test_allocated_time_slot.helpers import CREATE_ALLOCATION, allocation_create_data
from tests.test_graphql_api.test_application_round.helpers import SET_HANDLED_MUTATION, SET_RESULTS_SENT_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


# Every section of the manual test round in allocation in full, with the two sections that want
# Liikuntasali on Monday and Thursday evenings fitted without overlap.
FULL_ALLOCATION: list[tuple[str, str, Weekday, datetime.time, datetime.time]] = [
    ("Bändiharjoitukset", "Bänditila", Weekday.MONDAY, datetime.time(17), datetime.time(19)),
    ("Bändiharjoitukset", "Bänditila", Weekday.WEDNESDAY, datetime.time(18), datetime.time(20)),
    ("Junioreiden harjoitukset", "Liikuntasali", Weekday.MONDAY, datetime.time(17), datetime.time(18, 30)),
    ("Junioreiden harjoitukset", "Liikuntasali", Weekday.WEDNESDAY, datetime.time(17), datetime.time(18, 30)),
    ("Junioreiden harjoitukset", "Liikuntasali", Weekday.THURSDAY, datetime.time(17), datetime.time(18, 30)),
    ("Aikuisten sählyvuorot", "Liikuntasali", Weekday.MONDAY, datetime.time(18, 30), datetime.time(19, 30)),
    ("Aikuisten sählyvuorot", "Liikuntasali", Weekday.THURSDAY, datetime.time(19), datetime.time(20)),
    ("Aikuisten sählyvuorot", "Liikuntasali", Weekday.FRIDAY, datetime.time(18), datetime.time(19)),
    ("Aikuisten sählyvuorot", "Liikuntasali", Weekday.SUNDAY, datetime.time(10), datetime.time(11)),
    ("Henkilöstön virkistysvuorot", "Kerhohuone", Weekday.MONDAY, datetime.time(11), datetime.time(12)),
    ("Henkilöstön virkistysvuorot", "Kerhohuone", Weekday.TUESDAY, datetime.time(11), datetime.time(12)),
    ("Henkilöstön virkistysvuorot", "Kerhohuone", Weekday.WEDNESDAY, datetime.time(11), datetime.time(12)),
    ("Henkilöstön virkistysvuorot", "Kerhohuone", Weekday.THURSDAY, datetime.time(11), datetime.time(12)),
    ("Henkilöstön virkistysvuorot", "Kerhohuone", Weekday.FRIDAY, datetime.time(11), datetime.time(12)),
]

# Every section of the paid manual test round in allocation in full. The sections that want linked
# reservation units at the same times get slots that don't block each other.
FULL_PAID_ALLOCATION: list[tuple[str, str, Weekday, datetime.time, datetime.time]] = [
    ("Salibandy, aikuiset", "Liikuntahalli, koko", Weekday.MONDAY, datetime.time(18), datetime.time(20)),
    ("Salibandy, aikuiset", "Liikuntahalli, koko", Weekday.WEDNESDAY, datetime.time(18), datetime.time(20)),
    ("Salibandy, juniorit", "Liikuntahalli, A-osa", Weekday.THURSDAY, datetime.time(17), datetime.time(19)),
    ("Salibandy, juniorit", "Liikuntahalli, A-osa", Weekday.FRIDAY, datetime.time(17), datetime.time(19)),
    ("Henkilöstön sählyvuoro", "Liikuntahalli, B-osa", Weekday.TUESDAY, datetime.time(17), datetime.time(18)),
    ("Lasten kuoro", "Studio", Weekday.TUESDAY, datetime.time(18), datetime.time(20)),
    ("Tiimipalaverit", "Ryhmätila", Weekday.TUESDAY, datetime.time(18), datetime.time(19, 30)),
    ("Henkilöstön virkistysilta", "Tapahtumapaketti", Weekday.TUESDAY, datetime.time(18), datetime.time(20)),
]


# ── Open manual test round ──


def test_create_open_manual_test_round():
    create_open_manual_test_round()

    assert Unit.objects.count() == 1
    assert ReservationUnit.objects.count() == 3
    assert Space.objects.count() == 3
    assert ReservationUnitPricingGroup.objects.count() == 3
    assert PricingGroup.objects.count() == 3
    assert PriceComponent.objects.count() == 3
    assert ReservationUnitAccessType.objects.count() == 3
    assert ApplicationRoundTimeSlot.objects.count() == 21
    assert ApplicationRound.objects.count() == 1
    assert Application.objects.count() == 0


@freeze_time(local_datetime(2030, 1, 1, 1, 30))
def test_create_open_manual_test_round__round_is_open():
    create_open_manual_test_round()

    application_round = ApplicationRound.objects.get(name="Kausivaraus manuaalitestaukseen (AVOINNA)")

    assert application_round.status == ApplicationRoundStatusChoice.OPEN
    assert application_round.application_period_begins_at == local_datetime(2029, 12, 31, 1, 30)
    assert application_round.application_period_ends_at == local_datetime(2032, 1, 1, 1, 30)
    assert application_round.reservation_period_begin_date == local_date(2032, 1, 2)
    assert application_round.reservation_period_end_date == local_date(2035, 1, 1)
    assert application_round.public_display_begins_at == local_datetime(2029, 12, 31, 1, 30)
    assert application_round.public_display_ends_at == local_datetime(2035, 1, 2, 1, 30)

    assert application_round.application_form == ApplicationFormType.DEFAULT_FORM
    assert application_round.terms_of_use_id == "KUVAnupa"

    reservation_unit_names = sorted(application_round.reservation_units.values_list("name_fi", flat=True))
    assert reservation_unit_names == [
        "KAUSIVARAUS yksikkö Bänditila (MANUAALITESTAUS)",
        "KAUSIVARAUS yksikkö Kerhohuone (MANUAALITESTAUS)",
        "KAUSIVARAUS yksikkö Liikuntasali (MANUAALITESTAUS)",
    ]

    purpose_names = sorted(application_round.purposes.values_list("name_fi", flat=True))
    assert purpose_names == [
        "Harrastustoiminta, bändi ja musiikki",
        "Harrastustoiminta, muu",
        "Harrastustoiminta, tanssi ja liikunta",
    ]


def test_create_open_manual_test_round__makes_the_round_again():
    first_round = create_open_manual_test_round()
    first_unit = Unit.objects.get()
    application = ApplicationFactory.create(application_round=first_round)

    second_round = create_open_manual_test_round()

    assert Application.objects.filter(pk=application.pk).exists() is False
    assert ApplicationRound.objects.count() == 1
    assert ReservationUnit.objects.count() == 3
    assert second_round.pk != first_round.pk
    assert Unit.objects.get().pk == first_unit.pk


# ── Manual test round in allocation ──


def test_create_manual_test_round_in_allocation():
    create_manual_test_round_in_allocation()

    assert Unit.objects.count() == 1
    assert ReservationUnit.objects.count() == 3
    assert Space.objects.count() == 3
    assert ReservationUnitPricingGroup.objects.count() == 3
    assert PricingGroup.objects.count() == 3
    assert PriceComponent.objects.count() == 3
    assert ReservationUnitAccessType.objects.count() == 3
    assert ApplicationRoundTimeSlot.objects.count() == 21
    assert ApplicationRound.objects.count() == 1
    assert User.objects.count() == 3
    assert Application.objects.count() == 3
    assert ApplicationSection.objects.count() == 4
    assert ReservationUnitOption.objects.count() == 7
    assert SuitableTimeRange.objects.count() == 21
    assert AllocatedTimeSlot.objects.count() == 0
    assert Reservation.objects.count() == 0


@freeze_time(local_datetime(2030, 1, 1, 1, 30))
def test_create_manual_test_round_in_allocation__round_waits_for_handling():
    create_manual_test_round_in_allocation()

    application_round = ApplicationRound.objects.get(name="Kausivaraus manuaalitestaukseen (KÄSITTELYSSÄ)")

    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION
    assert application_round.application_period_begins_at == local_datetime(2029, 12, 2, 1, 30)
    assert application_round.application_period_ends_at == local_datetime(2029, 12, 31, 1, 30)
    assert application_round.reservation_period_begin_date == local_date(2030, 1, 31)
    assert application_round.reservation_period_end_date == local_date(2030, 5, 1)
    assert application_round.public_display_begins_at == local_datetime(2029, 12, 2, 1, 30)
    assert application_round.public_display_ends_at == local_datetime(2035, 1, 2, 1, 30)

    applications = list(Application.objects.filter(application_round=application_round).order_by("pk"))
    statuses = [application.status for application in applications]
    notification_times = [application.in_allocation_notification_sent_at for application in applications]

    assert statuses == [ApplicationStatusChoice.IN_ALLOCATION] * 3
    assert notification_times == [local_datetime(2030, 1, 1, 1, 30)] * 3


@freeze_time(local_datetime(2030, 4, 15, 1, 30))
def test_create_manual_test_round_in_allocation__dates_across_daylight_saving_time_change():
    create_manual_test_round_in_allocation()

    application_round = ApplicationRound.objects.get(name="Kausivaraus manuaalitestaukseen (KÄSITTELYSSÄ)")

    # The clocks go forward on 2030-03-31, between the beginning and the end of the application period.
    assert application_round.application_period_begins_at == local_datetime(2030, 3, 16, 1, 30)
    assert application_round.application_period_ends_at == local_datetime(2030, 4, 14, 1, 30)
    assert application_round.reservation_period_begin_date == local_date(2030, 5, 15)
    assert application_round.reservation_period_end_date == local_date(2030, 8, 13)
    assert application_round.public_display_begins_at == local_datetime(2030, 3, 16, 1, 30)
    assert application_round.public_display_ends_at == local_datetime(2035, 4, 16, 1, 30)


@freeze_time(local_datetime(2030, 1, 1, 12))
def test_create_manual_test_round_in_allocation__round_can_be_handled(graphql, outbox, settings):
    settings.SEND_EMAILS = True

    application_round = create_manual_test_round_in_allocation()

    graphql.login_with_superuser()

    for section_name, reservation_unit_name, weekday, begin_time, end_time in FULL_ALLOCATION:
        option = ReservationUnitOption.objects.get(
            application_section__name=section_name,
            reservation_unit__name_fi=f"KÄSITTELY yksikkö {reservation_unit_name} (MANUAALITESTAUS)",
        )
        data = allocation_create_data(option, day_of_the_week=weekday, begin_time=begin_time, end_time=end_time)
        response = graphql(CREATE_ALLOCATION, input_data=data)
        assert response.has_errors is False, response.errors

    response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})
    assert response.has_errors is False, response.errors

    response = graphql(SET_RESULTS_SENT_MUTATION, input_data={"pk": application_round.pk})
    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.RESULTS_SENT

    # The round's reservation period has 13 weeks, and the period of "Aikuisten sählyvuorot" 8 weeks.
    assert ReservationSeries.objects.count() == 14
    assert Reservation.objects.count() == 2 * 13 + 3 * 13 + 4 * 8 + 5 * 13

    price_line_amounts = set(ReservationPriceLine.objects.values_list("amount", flat=True))
    assert price_line_amounts == {Decimal(0)}

    assert len(outbox) == 1
    assert sorted(outbox[0].bcc) == [
        "iiris.manuaalitestaaja@example.com",
        "pirkko.manuaalitestaaja@example.com",
        "tuomas.manuaalitestaaja@example.com",
    ]


def test_create_manual_test_round_in_allocation__makes_the_round_again():
    first_round = create_manual_test_round_in_allocation()
    first_unit = Unit.objects.get()
    applicants = User.objects.filter(username__startswith="manuaalitestaus-hakija-")
    applicant_pks = sorted(applicants.values_list("pk", flat=True))

    option = ReservationUnitOption.objects.filter(application_section__application__application_round=first_round)[0]
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    series = ReservationSeriesFactory.create(
        allocated_time_slot=allocation,
        reservation_unit=option.reservation_unit,
    )
    reservation = ReservationFactory.create(reservation_unit=option.reservation_unit, reservation_series=series)

    second_round = create_manual_test_round_in_allocation()

    assert Reservation.objects.filter(pk=reservation.pk).exists() is False
    assert ReservationSeries.objects.filter(pk=series.pk).exists() is False
    assert AllocatedTimeSlot.objects.filter(pk=allocation.pk).exists() is False

    assert ApplicationRound.objects.count() == 1
    assert second_round.pk != first_round.pk
    assert Unit.objects.get().pk == first_unit.pk
    assert second_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION
    assert Application.objects.filter(application_round=second_round).count() == 3
    assert sorted(applicants.values_list("pk", flat=True)) == applicant_pks


# ── Open paid manual test round ──


def test_create_open_paid_manual_test_round():
    create_open_paid_manual_test_round()

    assert Unit.objects.count() == 1
    assert UnitGroup.objects.count() == 1
    assert ReservationUnit.objects.count() == 7
    assert Space.objects.count() == 6
    assert Resource.objects.count() == 1
    assert PriceOption.objects.count() == 2
    assert PricingGroup.objects.count() == 4
    assert PriceComponent.objects.count() == 9
    assert ReservationUnitPricingGroup.objects.count() == 7
    assert ReservationUnitAccessType.objects.count() == 7
    assert ApplicationRoundTimeSlot.objects.count() == 49
    assert ApplicationRound.objects.count() == 1
    assert Application.objects.count() == 0


@freeze_time(local_datetime(2030, 1, 1, 1, 30))
def test_create_open_paid_manual_test_round__round_is_open():
    create_open_paid_manual_test_round()

    application_round = ApplicationRound.objects.get(name="Kausivaraus manuaalitestaukseen (MAKSULLINEN, AVOINNA)")

    assert application_round.status == ApplicationRoundStatusChoice.OPEN
    assert application_round.application_period_begins_at == local_datetime(2029, 12, 31, 1, 30)
    assert application_round.application_period_ends_at == local_datetime(2032, 1, 1, 1, 30)
    assert application_round.reservation_period_begin_date == local_date(2032, 1, 2)
    assert application_round.reservation_period_end_date == local_date(2035, 1, 1)
    assert application_round.public_display_begins_at == local_datetime(2029, 12, 31, 1, 30)
    assert application_round.public_display_ends_at == local_datetime(2035, 1, 2, 1, 30)

    reservation_unit_names = sorted(application_round.reservation_units.values_list("name_fi", flat=True))
    assert reservation_unit_names == [
        "MAKSULLINEN yksikkö Kokoushuone (MANUAALITESTAUS)",
        "MAKSULLINEN yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS)",
        "MAKSULLINEN yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS)",
        "MAKSULLINEN yksikkö Liikuntahalli, koko (MANUAALITESTAUS)",
        "MAKSULLINEN yksikkö Ryhmätila (MANUAALITESTAUS)",
        "MAKSULLINEN yksikkö Studio (MANUAALITESTAUS)",
        "MAKSULLINEN yksikkö Tapahtumapaketti (MANUAALITESTAUS)",
    ]


def test_create_open_paid_manual_test_round__makes_the_round_again():
    first_round = create_open_paid_manual_test_round()
    first_unit = Unit.objects.get()
    first_unit_group = UnitGroup.objects.get()
    first_price_option_pks = set(PriceOption.objects.values_list("pk", flat=True))
    application = ApplicationFactory.create(application_round=first_round)
    PriceOption.objects.filter(name_fi="Juniorit").update(is_active=False)

    second_round = create_open_paid_manual_test_round()

    assert Application.objects.filter(pk=application.pk).exists() is False
    assert ApplicationRound.objects.count() == 1
    assert ReservationUnit.objects.count() == 7
    assert second_round.pk != first_round.pk
    assert Unit.objects.get().pk == first_unit.pk
    assert UnitGroup.objects.get().pk == first_unit_group.pk

    price_options = list(PriceOption.objects.order_by("name"))
    assert [option.name_fi for option in price_options] == ["Aikuiset", "Juniorit"]
    assert [option.is_active for option in price_options] == [True, True]
    assert {option.pk for option in price_options}.isdisjoint(first_price_option_pks)


# ── Paid manual test round in allocation ──


def test_create_paid_manual_test_round_in_allocation():
    create_paid_manual_test_round_in_allocation()

    assert Unit.objects.count() == 1
    assert UnitGroup.objects.count() == 1
    assert ReservationUnit.objects.count() == 7
    assert Space.objects.count() == 6
    assert Resource.objects.count() == 1
    assert PriceOption.objects.count() == 2
    assert PricingGroup.objects.count() == 4
    assert PriceComponent.objects.count() == 9
    assert ReservationUnitPricingGroup.objects.count() == 7
    assert ReservationUnitAccessType.objects.count() == 7
    assert ApplicationRoundTimeSlot.objects.count() == 49
    assert ApplicationRound.objects.count() == 1
    assert User.objects.count() == 4
    assert Application.objects.count() == 3
    assert ApplicationSection.objects.count() == 6
    assert ReservationUnitOption.objects.count() == 8
    assert SuitableTimeRange.objects.count() == 15
    assert AllocatedTimeSlot.objects.count() == 0
    assert Reservation.objects.count() == 2


@freeze_time(local_datetime(2030, 1, 1, 1, 30))
def test_create_paid_manual_test_round_in_allocation__round_waits_for_handling():
    create_paid_manual_test_round_in_allocation()

    application_round = ApplicationRound.objects.get(name="Kausivaraus manuaalitestaukseen (MAKSULLINEN, KÄSITTELYSSÄ)")

    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION
    assert application_round.application_period_begins_at == local_datetime(2029, 12, 2, 1, 30)
    assert application_round.application_period_ends_at == local_datetime(2029, 12, 31, 1, 30)
    assert application_round.reservation_period_begin_date == local_date(2030, 1, 31)
    assert application_round.reservation_period_end_date == local_date(2030, 5, 1)
    assert application_round.public_display_begins_at == local_datetime(2029, 12, 2, 1, 30)
    assert application_round.public_display_ends_at == local_datetime(2035, 1, 2, 1, 30)

    applications = list(Application.objects.filter(application_round=application_round).order_by("pk"))
    statuses = [application.status for application in applications]
    notification_times = [application.in_allocation_notification_sent_at for application in applications]

    assert statuses == [ApplicationStatusChoice.IN_ALLOCATION] * 3
    assert notification_times == [local_datetime(2030, 1, 1, 1, 30)] * 3

    sections = ApplicationSection.objects.select_related("price_option")
    customer_groups = {section.name: section.price_option.name_fi for section in sections}
    assert customer_groups == {
        "Henkilöstön sählyvuoro": "Aikuiset",
        "Henkilöstön virkistysilta": "Aikuiset",
        "Lasten kuoro": "Juniorit",
        "Salibandy, aikuiset": "Aikuiset",
        "Salibandy, juniorit": "Juniorit",
        "Tiimipalaverit": "Aikuiset",
    }

    # The first Monday at least two weeks into the reservation period, and the day after.
    closed_times = sorted(
        (reservation.reservation_unit.name_fi, reservation.begins_at, reservation.ends_at)
        for reservation in Reservation.objects.filter(type=ReservationTypeChoice.BLOCKED).select_related(
            "reservation_unit"
        )
    )
    assert closed_times == [
        (
            "MAKSULLINEN KÄSITTELY yksikkö Kokoushuone (MANUAALITESTAUS)",
            local_datetime(2030, 2, 19, 18),
            local_datetime(2030, 2, 19, 19),
        ),
        (
            "MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS)",
            local_datetime(2030, 2, 18, 18),
            local_datetime(2030, 2, 18, 20),
        ),
    ]


@freeze_time(local_datetime(2030, 1, 1, 12))
def test_create_paid_manual_test_round_in_allocation__round_can_be_handled(graphql, outbox, settings):
    settings.SEND_EMAILS = True

    application_round = create_paid_manual_test_round_in_allocation()

    graphql.login_with_superuser()

    for section_name, reservation_unit_name, weekday, begin_time, end_time in FULL_PAID_ALLOCATION:
        option = ReservationUnitOption.objects.get(
            application_section__name=section_name,
            reservation_unit__name_fi=f"MAKSULLINEN KÄSITTELY yksikkö {reservation_unit_name} (MANUAALITESTAUS)",
        )
        data = allocation_create_data(option, day_of_the_week=weekday, begin_time=begin_time, end_time=end_time)
        response = graphql(CREATE_ALLOCATION, input_data=data)
        assert response.has_errors is False, response.errors

    response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})
    assert response.has_errors is False, response.errors

    response = graphql(SET_RESULTS_SENT_MUTATION, input_data={"pk": application_round.pk})
    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.RESULTS_SENT

    # 8 weekly slots in a reservation period of 13 weeks. The two closed times are on dates
    # that three of the series skip.
    assert ReservationSeries.objects.count() == 8
    assert Reservation.objects.filter(type=ReservationTypeChoice.SEASONAL).count() == 8 * 13 - 3

    rejected_occurrences = sorted(
        (occurrence.reservation_series.reservation_unit.name_fi, occurrence.begin_datetime, occurrence.rejection_reason)
        for occurrence in RejectedOccurrence.objects.select_related("reservation_series__reservation_unit")
    )
    assert rejected_occurrences == [
        (
            "MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, koko (MANUAALITESTAUS)",
            local_datetime(2030, 2, 18, 18),
            RejectionReadinessChoice.OVERLAPPING_RESERVATIONS,
        ),
        (
            "MAKSULLINEN KÄSITTELY yksikkö Ryhmätila (MANUAALITESTAUS)",
            local_datetime(2030, 2, 19, 18),
            RejectionReadinessChoice.OVERLAPPING_RESERVATIONS,
        ),
        (
            "MAKSULLINEN KÄSITTELY yksikkö Tapahtumapaketti (MANUAALITESTAUS)",
            local_datetime(2030, 2, 19, 18),
            RejectionReadinessChoice.OVERLAPPING_RESERVATIONS,
        ),
    ]

    # The juniors' A-osa is free, so the club's application has a free section and a paid one.
    price_lines = ReservationPriceLine.objects.order_by().values("reservation__reservation_unit__name_fi")
    totals = {
        row["reservation__reservation_unit__name_fi"]: row["total"] for row in price_lines.annotate(total=Sum("amount"))
    }
    assert totals == {
        "MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, koko (MANUAALITESTAUS)": Decimal("2000.00"),
        "MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS)": Decimal("0.00"),
        "MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS)": Decimal("260.00"),
        "MAKSULLINEN KÄSITTELY yksikkö Studio (MANUAALITESTAUS)": Decimal("354.00"),
        "MAKSULLINEN KÄSITTELY yksikkö Ryhmätila (MANUAALITESTAUS)": Decimal("288.00"),
        "MAKSULLINEN KÄSITTELY yksikkö Tapahtumapaketti (MANUAALITESTAUS)": Decimal("960.00"),
    }

    # The Studio's prices change 45 days after the reservation period begins, on 2030-03-17.
    studio_amounts = list(
        ReservationPriceLine.objects
        .filter(reservation__reservation_unit__name_fi="MAKSULLINEN KÄSITTELY yksikkö Studio (MANUAALITESTAUS)")
        .order_by("reservation__begins_at")
        .values_list("amount", flat=True)
    )
    assert studio_amounts == [Decimal("24.00")] * 6 + [Decimal("30.00")] * 7

    assert len(outbox) == 1
    assert sorted(outbox[0].bcc) == [
        "iiris.manuaalitestaaja@example.com",
        "pirkko.manuaalitestaaja@example.com",
        "tuomas.manuaalitestaaja@example.com",
    ]


def test_create_paid_manual_test_round_in_allocation__hall_and_its_halves_block_each_other(graphql):
    create_paid_manual_test_round_in_allocation()

    juniors_in_a_osa = ReservationUnitOption.objects.get(
        application_section__name="Salibandy, juniorit",
        reservation_unit__name_fi="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS)",
    )
    adults_in_whole_hall = ReservationUnitOption.objects.get(
        application_section__name="Salibandy, aikuiset",
        reservation_unit__name_fi="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, koko (MANUAALITESTAUS)",
    )
    staff_in_b_osa = ReservationUnitOption.objects.get(
        application_section__name="Henkilöstön sählyvuoro",
        reservation_unit__name_fi="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS)",
    )

    graphql.login_with_superuser()

    data = allocation_create_data(
        juniors_in_a_osa,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(17),
        end_time=datetime.time(19),
    )
    response = graphql(CREATE_ALLOCATION, input_data=data)
    assert response.has_errors is False, response.errors

    # The whole hall overlaps A-osa from 18 to 19.
    data = allocation_create_data(
        adults_in_whole_hall,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(18),
        end_time=datetime.time(20),
    )
    response = graphql(CREATE_ALLOCATION, input_data=data)
    assert response.field_error_messages() == [
        (
            "Given time slot has already been allocated for another application section "
            "with a related reservation unit or resource."
        ),
    ]

    # B-osa is not linked to A-osa, so the same hour is free there.
    data = allocation_create_data(
        staff_in_b_osa,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(18),
        end_time=datetime.time(19),
    )
    response = graphql(CREATE_ALLOCATION, input_data=data)
    assert response.has_errors is False, response.errors


def test_create_paid_manual_test_round_in_allocation__rooms_with_a_shared_resource_block_each_other(graphql):
    create_paid_manual_test_round_in_allocation()

    choir_in_kokoushuone = ReservationUnitOption.objects.get(
        application_section__name="Lasten kuoro",
        reservation_unit__name_fi="MAKSULLINEN KÄSITTELY yksikkö Kokoushuone (MANUAALITESTAUS)",
    )
    meetings_in_ryhmatila = ReservationUnitOption.objects.get(
        application_section__name="Tiimipalaverit",
        reservation_unit__name_fi="MAKSULLINEN KÄSITTELY yksikkö Ryhmätila (MANUAALITESTAUS)",
    )

    graphql.login_with_superuser()

    data = allocation_create_data(
        choir_in_kokoushuone,
        day_of_the_week=Weekday.TUESDAY,
        begin_time=datetime.time(18),
        end_time=datetime.time(20),
    )
    response = graphql(CREATE_ALLOCATION, input_data=data)
    assert response.has_errors is False, response.errors

    data = allocation_create_data(
        meetings_in_ryhmatila,
        day_of_the_week=Weekday.TUESDAY,
        begin_time=datetime.time(18),
        end_time=datetime.time(19, 30),
    )
    response = graphql(CREATE_ALLOCATION, input_data=data)
    assert response.field_error_messages() == [
        (
            "Given time slot has already been allocated for another application section "
            "with a related reservation unit or resource."
        ),
    ]


def test_create_paid_manual_test_round_in_allocation__event_package_blocks_the_hall_and_the_meeting_room(graphql):
    create_paid_manual_test_round_in_allocation()

    choir_in_kokoushuone = ReservationUnitOption.objects.get(
        application_section__name="Lasten kuoro",
        reservation_unit__name_fi="MAKSULLINEN KÄSITTELY yksikkö Kokoushuone (MANUAALITESTAUS)",
    )
    juniors_in_a_osa = ReservationUnitOption.objects.get(
        application_section__name="Salibandy, juniorit",
        reservation_unit__name_fi="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS)",
    )
    staff_in_b_osa = ReservationUnitOption.objects.get(
        application_section__name="Henkilöstön sählyvuoro",
        reservation_unit__name_fi="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS)",
    )
    evening_in_package = ReservationUnitOption.objects.get(
        application_section__name="Henkilöstön virkistysilta",
        reservation_unit__name_fi="MAKSULLINEN KÄSITTELY yksikkö Tapahtumapaketti (MANUAALITESTAUS)",
    )
    graphql.login_with_superuser()

    data = allocation_create_data(
        choir_in_kokoushuone,
        day_of_the_week=Weekday.TUESDAY,
        begin_time=datetime.time(18),
        end_time=datetime.time(20),
    )
    response = graphql(CREATE_ALLOCATION, input_data=data)
    assert response.has_errors is False, response.errors

    # The package includes the meeting room.
    data = allocation_create_data(
        evening_in_package,
        day_of_the_week=Weekday.TUESDAY,
        begin_time=datetime.time(18),
        end_time=datetime.time(20),
    )
    response = graphql(CREATE_ALLOCATION, input_data=data)
    assert response.field_error_messages() == [
        (
            "Given time slot has already been allocated for another application section "
            "with a related reservation unit or resource."
        ),
    ]

    data = allocation_create_data(
        juniors_in_a_osa,
        day_of_the_week=Weekday.THURSDAY,
        begin_time=datetime.time(17),
        end_time=datetime.time(19),
    )
    response = graphql(CREATE_ALLOCATION, input_data=data)
    assert response.has_errors is False, response.errors

    # The package includes the whole hall, so A-osa blocks it too.
    data = allocation_create_data(
        evening_in_package,
        day_of_the_week=Weekday.THURSDAY,
        begin_time=datetime.time(18),
        end_time=datetime.time(20),
    )
    response = graphql(CREATE_ALLOCATION, input_data=data)
    assert response.field_error_messages() == [
        (
            "Given time slot has already been allocated for another application section "
            "with a related reservation unit or resource."
        ),
    ]

    # Only the package links the hall to the meeting room, so B-osa is free at the choir's time.
    data = allocation_create_data(
        staff_in_b_osa,
        day_of_the_week=Weekday.TUESDAY,
        begin_time=datetime.time(18),
        end_time=datetime.time(19),
    )
    response = graphql(CREATE_ALLOCATION, input_data=data)
    assert response.has_errors is False, response.errors


def test_create_paid_manual_test_round_in_allocation__makes_the_round_again():
    first_round = create_paid_manual_test_round_in_allocation()
    first_unit = Unit.objects.get()
    first_unit_group = UnitGroup.objects.get()
    first_closed_time_pks = set(Reservation.objects.values_list("pk", flat=True))
    made_up_users = User.objects.filter(username__startswith="manuaalitestaus-")
    made_up_user_pks = sorted(made_up_users.values_list("pk", flat=True))

    option = ReservationUnitOption.objects.filter(application_section__application__application_round=first_round)[0]
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    series = ReservationSeriesFactory.create(
        allocated_time_slot=allocation,
        reservation_unit=option.reservation_unit,
    )
    # The customer group of the reservation protects it from being deleted before the reservation.
    reservation = ReservationFactory.create(
        reservation_unit=option.reservation_unit,
        reservation_series=series,
        price_option=option.application_section.price_option,
    )

    second_round = create_paid_manual_test_round_in_allocation()

    assert Reservation.objects.filter(pk=reservation.pk).exists() is False
    assert ReservationSeries.objects.filter(pk=series.pk).exists() is False
    assert AllocatedTimeSlot.objects.filter(pk=allocation.pk).exists() is False

    assert ApplicationRound.objects.count() == 1
    assert second_round.pk != first_round.pk
    assert Unit.objects.get().pk == first_unit.pk
    assert UnitGroup.objects.get().pk == first_unit_group.pk
    assert second_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION
    assert Application.objects.filter(application_round=second_round).count() == 3
    assert sorted(made_up_users.values_list("pk", flat=True)) == made_up_user_pks

    closed_time_pks = set(Reservation.objects.filter(type=ReservationTypeChoice.BLOCKED).values_list("pk", flat=True))
    assert len(closed_time_pks) == 2
    assert closed_time_pks.isdisjoint(first_closed_time_pks)


# ── Prices and links of the paid manual test rounds ──


@pytest.mark.parametrize(
    "create_round",
    [
        pytest.param(create_open_paid_manual_test_round, id="open round"),
        pytest.param(create_paid_manual_test_round_in_allocation, id="round in allocation"),
    ],
)
def test_create_paid_manual_test_round__offers_both_customer_groups(create_round):
    application_round = create_round()

    price_options = application_round_price_options(application_round)
    errors = check_application_round_change(
        application_round_pk=application_round.pk,
        reservation_unit_pks=list(application_round.reservation_units.values_list("pk", flat=True)),
        period_begin=application_round.reservation_period_begin_date,
        period_end=application_round.reservation_period_end_date,
    )

    assert [option.name_fi for option in price_options] == ["Aikuiset", "Juniorit"]
    assert errors == []


@pytest.mark.parametrize(
    ("create_round", "unit_prefix"),
    [
        pytest.param(create_open_paid_manual_test_round, "MAKSULLINEN yksikkö", id="open round"),
        pytest.param(create_paid_manual_test_round_in_allocation, "MAKSULLINEN KÄSITTELY yksikkö", id="in allocation"),
    ],
)
def test_create_paid_manual_test_round__links_the_reservation_units(create_round, unit_prefix):
    create_round()

    whole_hall = ReservationUnit.objects.get(name_fi=f"{unit_prefix} Liikuntahalli, koko (MANUAALITESTAUS)")
    a_osa = ReservationUnit.objects.get(name_fi=f"{unit_prefix} Liikuntahalli, A-osa (MANUAALITESTAUS)")
    b_osa = ReservationUnit.objects.get(name_fi=f"{unit_prefix} Liikuntahalli, B-osa (MANUAALITESTAUS)")
    kokoushuone = ReservationUnit.objects.get(name_fi=f"{unit_prefix} Kokoushuone (MANUAALITESTAUS)")
    ryhmatila = ReservationUnit.objects.get(name_fi=f"{unit_prefix} Ryhmätila (MANUAALITESTAUS)")
    studio = ReservationUnit.objects.get(name_fi=f"{unit_prefix} Studio (MANUAALITESTAUS)")
    event_package = ReservationUnit.objects.get(name_fi=f"{unit_prefix} Tapahtumapaketti (MANUAALITESTAUS)")

    hall_space = whole_hall.spaces.get()
    half_spaces = [a_osa.spaces.get(), b_osa.spaces.get()]

    assert [space.parent for space in half_spaces] == [hall_space, hall_space]
    assert sorted(hall_space.get_descendants().values_list("pk", flat=True)) == sorted(
        space.pk for space in half_spaces
    )
    assert sorted(event_package.spaces.values_list("pk", flat=True)) == sorted([
        hall_space.pk,
        kokoushuone.spaces.get().pk,
    ])

    related_reservation_unit_ids = {
        hierarchy.reservation_unit_id: sorted(hierarchy.related_reservation_unit_ids)
        for hierarchy in ReservationUnitHierarchy.objects.all()
    }
    assert related_reservation_unit_ids == {
        whole_hall.pk: sorted([whole_hall.pk, a_osa.pk, b_osa.pk, event_package.pk]),
        a_osa.pk: sorted([whole_hall.pk, a_osa.pk, event_package.pk]),
        b_osa.pk: sorted([whole_hall.pk, b_osa.pk, event_package.pk]),
        kokoushuone.pk: sorted([kokoushuone.pk, ryhmatila.pk, event_package.pk]),
        ryhmatila.pk: sorted([kokoushuone.pk, ryhmatila.pk]),
        studio.pk: [studio.pk],
        event_package.pk: sorted([whole_hall.pk, a_osa.pk, b_osa.pk, kokoushuone.pk, event_package.pk]),
    }


# ── Independence from the e2e test data ──


@pytest.mark.slow
def test_e2e_test_data__leaves_the_manual_test_rounds_alone():
    # The e2e test data removes its earlier data only when that data exists,
    # so it is made both before and after the manual test data.
    create_robot_test_data_task.delay()
    first_e2e_unit = Unit.objects.get(tprek_id="71677")

    manual_open_round = create_open_manual_test_round()
    manual_round_in_allocation = create_manual_test_round_in_allocation()
    manual_open_paid_round = create_open_paid_manual_test_round()
    manual_paid_round_in_allocation = create_paid_manual_test_round_in_allocation()
    manual_tester_application = ApplicationFactory.create(application_round=manual_open_round)

    manual_round_pks = [
        manual_open_round.pk,
        manual_round_in_allocation.pk,
        manual_open_paid_round.pk,
        manual_paid_round_in_allocation.pk,
    ]
    manual_units = Unit.objects.exclude(pk=first_e2e_unit.pk)
    manual_reservation_units = ReservationUnit.objects.filter(unit__in=manual_units)
    manual_applications = Application.objects.filter(application_round__in=manual_round_pks)
    manual_unit_groups = UnitGroup.objects.filter(name_fi__startswith="Kausivaraus manuaalitestaukseen")

    manual_unit_pks = sorted(manual_units.values_list("pk", flat=True))
    manual_reservation_unit_pks = sorted(manual_reservation_units.values_list("pk", flat=True))
    manual_application_pks = sorted(manual_applications.values_list("pk", flat=True))
    manual_unit_group_pks = sorted(manual_unit_groups.values_list("pk", flat=True))

    create_robot_test_data_task.delay()

    remaining_unit_pks = Unit.objects.filter(pk__in=manual_unit_pks).values_list("pk", flat=True)
    remaining_reservation_unit_pks = ReservationUnit.objects.filter(
        pk__in=manual_reservation_unit_pks,
    ).values_list("pk", flat=True)
    remaining_application_pks = Application.objects.filter(pk__in=manual_application_pks).values_list("pk", flat=True)
    remaining_unit_group_pks = UnitGroup.objects.filter(pk__in=manual_unit_group_pks).values_list("pk", flat=True)

    assert Unit.objects.filter(pk=first_e2e_unit.pk).exists() is False
    assert sorted(remaining_unit_pks) == manual_unit_pks
    assert sorted(remaining_reservation_unit_pks) == manual_reservation_unit_pks
    assert sorted(remaining_application_pks) == manual_application_pks
    assert sorted(remaining_unit_group_pks) == manual_unit_group_pks
    assert len(manual_unit_group_pks) == 2
    assert ApplicationRound.objects.filter(pk__in=manual_round_pks).count() == 4
    assert Application.objects.filter(pk=manual_tester_application.pk).exists() is True


@pytest.mark.parametrize(
    ("remove_round", "removed_round_name"),
    [
        pytest.param(
            remove_open_manual_test_round,
            "Kausivaraus manuaalitestaukseen (AVOINNA)",
            id="open round",
        ),
        pytest.param(
            remove_manual_test_round_in_allocation,
            "Kausivaraus manuaalitestaukseen (KÄSITTELYSSÄ)",
            id="round in allocation",
        ),
        pytest.param(
            remove_open_paid_manual_test_round,
            "Kausivaraus manuaalitestaukseen (MAKSULLINEN, AVOINNA)",
            id="open paid round",
        ),
        pytest.param(
            remove_paid_manual_test_round_in_allocation,
            "Kausivaraus manuaalitestaukseen (MAKSULLINEN, KÄSITTELYSSÄ)",
            id="paid round in allocation",
        ),
    ],
)
def test_remove_manual_test_round__leaves_the_rest_alone(remove_round, removed_round_name):
    create_open_manual_test_round()
    create_manual_test_round_in_allocation()
    create_open_paid_manual_test_round()
    create_paid_manual_test_round_in_allocation()
    other_round = ApplicationRoundFactory.create()
    other_application = ApplicationFactory.create(application_round=other_round)

    remove_round()

    assert Unit.objects.filter(name_fi=removed_round_name).exists() is False
    assert UnitGroup.objects.filter(name_fi=removed_round_name).exists() is False
    assert Unit.objects.count() == 3

    reservation_unit_counts = {
        "Kausivaraus manuaalitestaukseen (AVOINNA)": 3,
        "Kausivaraus manuaalitestaukseen (KÄSITTELYSSÄ)": 3,
        "Kausivaraus manuaalitestaukseen (MAKSULLINEN, AVOINNA)": 7,
        "Kausivaraus manuaalitestaukseen (MAKSULLINEN, KÄSITTELYSSÄ)": 7,
    }
    kept_rounds = ApplicationRound.objects.exclude(pk=other_round.pk)
    assert {
        application_round.name_fi: application_round.reservation_units.count() for application_round in kept_rounds
    } == {name: count for name, count in reservation_unit_counts.items() if name != removed_round_name}

    customer_group_counts = {
        unit_group.name_fi: unit_group.price_options.count() for unit_group in UnitGroup.objects.all()
    }
    assert customer_group_counts == {
        name: 2
        for name in [
            "Kausivaraus manuaalitestaukseen (MAKSULLINEN, AVOINNA)",
            "Kausivaraus manuaalitestaukseen (MAKSULLINEN, KÄSITTELYSSÄ)",
        ]
        if name != removed_round_name
    }

    assert Application.objects.filter(pk=other_application.pk).exists() is True
    assert User.objects.filter(username__startswith="manuaalitestaus-hakija-").count() == 3
    assert User.objects.filter(username="manuaalitestaus-kasittelija").exists() is True

    assert TermsOfUse.objects.filter(id="KUVAnupa").exists() is True
    assert ReservationPurpose.objects.count() == 3
    assert AgeGroup.objects.count() == 3
    assert TaxLevel.objects.count() == 3


# ── Usable reservation units ──


def test_create_manual_test_rounds__each_space_is_its_own_tree():
    create_open_manual_test_round()
    create_manual_test_round_in_allocation()

    tree_fields = list(Space.objects.values_list("parent", "lft", "rght", "level"))
    tree_ids = set(Space.objects.values_list("tree_id", flat=True))

    assert tree_fields == [(None, 1, 2, 0)] * 6
    assert len(tree_ids) == 6


def test_create_manual_test_rounds__reservation_units_have_search_vectors():
    create_open_manual_test_round()
    create_manual_test_round_in_allocation()
    create_open_paid_manual_test_round()
    create_paid_manual_test_round_in_allocation()

    reservation_units = list(ReservationUnit.objects.all())
    reservation_units_without_search_vectors = [
        reservation_unit.name
        for reservation_unit in reservation_units
        if not (
            reservation_unit.search_vector_fi
            and reservation_unit.search_vector_en
            and reservation_unit.search_vector_sv
        )
    ]

    assert len(reservation_units) == 20
    assert reservation_units_without_search_vectors == []
