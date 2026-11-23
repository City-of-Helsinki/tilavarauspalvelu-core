from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import ApplicationFormType, ApplicationRoundStatusChoice, ApplicationStatusChoice, Weekday
from tilavarauspalvelu.management.commands.data_creation.create_manual_test_data import (
    create_manual_test_round_in_allocation,
    create_open_manual_test_round,
    remove_manual_test_round_in_allocation,
    remove_open_manual_test_round,
)
from tilavarauspalvelu.models import (
    AgeGroup,
    AllocatedTimeSlot,
    Application,
    ApplicationRound,
    ApplicationRoundTimeSlot,
    ApplicationSection,
    PriceComponent,
    PricingGroup,
    Reservation,
    ReservationPriceLine,
    ReservationPurpose,
    ReservationSeries,
    ReservationUnit,
    ReservationUnitAccessType,
    ReservationUnitOption,
    ReservationUnitPricingGroup,
    Space,
    SuitableTimeRange,
    TermsOfUse,
    Unit,
    User,
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


# ── Independence from the e2e test data ──


@pytest.mark.slow
def test_e2e_test_data__leaves_the_manual_test_rounds_alone():
    # The e2e test data removes its earlier data only when that data exists,
    # so it is made both before and after the manual test data.
    create_robot_test_data_task.delay()
    first_e2e_unit = Unit.objects.get(tprek_id="71677")

    manual_open_round = create_open_manual_test_round()
    manual_round_in_allocation = create_manual_test_round_in_allocation()
    manual_tester_application = ApplicationFactory.create(application_round=manual_open_round)

    manual_round_pks = [manual_open_round.pk, manual_round_in_allocation.pk]
    manual_units = Unit.objects.exclude(pk=first_e2e_unit.pk)
    manual_reservation_units = ReservationUnit.objects.filter(unit__in=manual_units)
    manual_applications = Application.objects.filter(application_round__in=manual_round_pks)

    manual_unit_pks = sorted(manual_units.values_list("pk", flat=True))
    manual_reservation_unit_pks = sorted(manual_reservation_units.values_list("pk", flat=True))
    manual_application_pks = sorted(manual_applications.values_list("pk", flat=True))

    create_robot_test_data_task.delay()

    remaining_unit_pks = Unit.objects.filter(pk__in=manual_unit_pks).values_list("pk", flat=True)
    remaining_reservation_unit_pks = ReservationUnit.objects.filter(
        pk__in=manual_reservation_unit_pks,
    ).values_list("pk", flat=True)
    remaining_application_pks = Application.objects.filter(pk__in=manual_application_pks).values_list("pk", flat=True)

    assert Unit.objects.filter(pk=first_e2e_unit.pk).exists() is False
    assert sorted(remaining_unit_pks) == manual_unit_pks
    assert sorted(remaining_reservation_unit_pks) == manual_reservation_unit_pks
    assert sorted(remaining_application_pks) == manual_application_pks
    assert ApplicationRound.objects.filter(pk__in=manual_round_pks).count() == 2
    assert Application.objects.filter(pk=manual_tester_application.pk).exists() is True


@pytest.mark.parametrize(
    ("remove_round", "removed_unit_name", "kept_round_name"),
    [
        pytest.param(
            remove_open_manual_test_round,
            "Kausivaraus manuaalitestaukseen (AVOINNA)",
            "Kausivaraus manuaalitestaukseen (KÄSITTELYSSÄ)",
            id="open round",
        ),
        pytest.param(
            remove_manual_test_round_in_allocation,
            "Kausivaraus manuaalitestaukseen (KÄSITTELYSSÄ)",
            "Kausivaraus manuaalitestaukseen (AVOINNA)",
            id="round in allocation",
        ),
    ],
)
def test_remove_manual_test_round__leaves_the_rest_alone(remove_round, removed_unit_name, kept_round_name):
    create_open_manual_test_round()
    create_manual_test_round_in_allocation()
    other_round = ApplicationRoundFactory.create()
    other_application = ApplicationFactory.create(application_round=other_round)

    remove_round()

    assert Unit.objects.filter(name_fi=removed_unit_name).exists() is False
    assert Unit.objects.count() == 1

    kept_round = ApplicationRound.objects.get(name=kept_round_name)
    assert kept_round.reservation_units.count() == 3
    assert ApplicationRound.objects.count() == 2

    assert Application.objects.filter(pk=other_application.pk).exists() is True
    assert User.objects.filter(username__startswith="manuaalitestaus-hakija-").count() == 3

    assert TermsOfUse.objects.filter(id="KUVAnupa").exists() is True
    assert ReservationPurpose.objects.count() == 3
    assert AgeGroup.objects.count() == 3


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

    assert len(reservation_units) == 6
    assert reservation_units_without_search_vectors == []
