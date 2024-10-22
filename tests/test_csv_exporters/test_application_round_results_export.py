import datetime
from typing import TYPE_CHECKING
from unittest import mock

import pytest

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationFactory,
    ApplicationRoundFactory,
    ApplicationSectionFactory,
    ReservationUnitOptionFactory,
)
from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.utils.exporter.application_round_result_exporter import (
    ApplicationRoundResultCSVExporter,
    ApplicationSectionExportRow,
)
from utils.date_utils import local_date_string, local_timedelta_string

from .helpers import get_writes

if TYPE_CHECKING:
    from tilavarauspalvelu.models import AllocatedTimeSlot, ApplicationSection

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

CSV_WRITER_MOCK_PATH = "tilavarauspalvelu.utils.exporter.application_round_result_exporter.csv.writer"


def test_application_round_results_export__single_application__all_fields(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled()
    application = ApplicationFactory.create_in_status_in_allocation(
        application_round=application_round,
        organisation__name="aaa",
        application_sections__suitable_time_ranges__day_of_the_week=Weekday.TUESDAY,
        application_sections__reservation_unit_options__reservation_unit__name="foo",
        application_sections__reservation_unit_options__reservation_unit__unit__name="fizz",
        application_sections__reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.TUESDAY,
        application_sections__reservation_unit_options__allocated_time_slots__begin_time=datetime.time(12, 0),
        application_sections__reservation_unit_options__allocated_time_slots__end_time=datetime.time(14, 0),
    )
    section: ApplicationSection = application.application_sections.first()
    allocation: AllocatedTimeSlot = section.reservation_unit_options.first().allocated_time_slots.first()

    exporter = ApplicationRoundResultCSVExporter(application_round_id=application_round.id)
    with mock.patch(CSV_WRITER_MOCK_PATH) as mock_writer:
        exporter.export()

    writes = get_writes(mock_writer)
    assert len(writes) == 2

    header_rows = exporter._get_header_rows()
    assert writes[0] == header_rows
    assert writes[1] == ApplicationSectionExportRow(
        application_id=str(application.id),
        application_status=application.status.value,
        applicant=application.organisation.name,
        section_id=str(section.id),
        section_status=section.status.value,
        section_name=section.name,
        reservations_begin_date=local_date_string(section.reservations_begin_date),
        reservations_end_date=local_date_string(section.reservations_end_date),
        applied_reservations_per_week=str(section.applied_reservations_per_week),
        reservation_min_duration=local_timedelta_string(section.reservation_min_duration),
        reservation_max_duration=local_timedelta_string(section.reservation_max_duration),
        reservation_unit_name="foo",
        unit_name="fizz",
        day_of_the_week=allocation.day_of_the_week,
        begin_time="12:00",
        end_time="14:00",
        price="",
    )


def test_application_round_results_export__no_suitable_time_ranges(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled()
    ApplicationFactory.create_in_status_in_allocation(
        application_round=application_round,
    )

    exporter = ApplicationRoundResultCSVExporter(application_round_id=application_round)
    assert exporter.export() is None


def test_application_round_results_export__application_status_is_expired(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled()
    ApplicationFactory.create_in_status_expired(
        application_round=application_round,
        application_sections__suitable_time_ranges__day_of_the_week=Weekday.TUESDAY,
    )

    exporter = ApplicationRoundResultCSVExporter(application_round_id=application_round)
    assert exporter.export() is None


def test_application_round_results_export__application_status_is_draft(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled()
    ApplicationFactory.create_in_status_draft(
        application_round=application_round,
        application_sections__suitable_time_ranges__day_of_the_week=Weekday.TUESDAY,
    )

    exporter = ApplicationRoundResultCSVExporter(application_round_id=application_round.id)
    assert exporter.export() is None


def test_application_round_results_export__section_has_no_allocated_time_slots(graphql):
    """Section which has no allocated time slots should still be exported."""
    application_round = ApplicationRoundFactory.create_in_status_handled()
    application = ApplicationFactory.create_in_status_in_allocation(application_round=application_round)
    section = ApplicationSectionFactory.create_in_status_handled(
        application=application,
        suitable_time_ranges__day_of_the_week=Weekday.WEDNESDAY,
        reservation_unit_options__reservation_unit__name="foo",
    )

    exporter = ApplicationRoundResultCSVExporter(application_round_id=application_round.id)
    with mock.patch(CSV_WRITER_MOCK_PATH) as mock_writer:
        exporter.export()
    writes = get_writes(mock_writer)
    assert len(writes) == 2

    section_row: ApplicationSectionExportRow = writes[1]  # type: ignore
    assert section_row.section_id == str(section.id)
    assert section_row.reservation_unit_name == ""
    assert section_row.day_of_the_week == ""
    assert section_row.begin_time == ""
    assert section_row.end_time == ""


def test_application_round_results_export__reservation_unit_option_ordering(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled()
    application = ApplicationFactory.create_in_status_in_allocation(application_round=application_round)
    section = ApplicationSectionFactory.create(
        application=application,
        suitable_time_ranges__day_of_the_week=Weekday.TUESDAY,
    )

    ReservationUnitOptionFactory.create(
        application_section=section,
        preferred_order=3,
        reservation_unit__name="three",
        allocated_time_slots__day_of_the_week=Weekday.TUESDAY,
    )
    ReservationUnitOptionFactory.create(
        application_section=section,
        preferred_order=1,
        reservation_unit__name="one",
        allocated_time_slots__day_of_the_week=Weekday.TUESDAY,
    )
    ReservationUnitOptionFactory.create(
        application_section=section,
        preferred_order=2,
        reservation_unit__name="two",
        allocated_time_slots__day_of_the_week=Weekday.TUESDAY,
    )

    exporter = ApplicationRoundResultCSVExporter(application_round_id=application_round.id)
    with mock.patch(CSV_WRITER_MOCK_PATH) as mock_writer:
        exporter.export()
    writes = get_writes(mock_writer)
    assert len(writes) == 4

    assert writes[1].reservation_unit_name == "one"  # type: ignore
    assert writes[2].reservation_unit_name == "two"  # type: ignore
    assert writes[3].reservation_unit_name == "three"  # type: ignore


def test_application_round_results_export__allocated_slot_ordering(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled()
    application = ApplicationFactory.create_in_status_in_allocation(application_round=application_round)
    section = ApplicationSectionFactory.create(
        application=application,
        suitable_time_ranges__day_of_the_week=Weekday.TUESDAY,
    )

    # Not included, since it has no allocated time slots
    ReservationUnitOptionFactory.create(application_section=section, reservation_unit__name="bar", preferred_order=1)

    option_2 = ReservationUnitOptionFactory.create(
        application_section=section, reservation_unit__name="foo", preferred_order=2
    )

    AllocatedTimeSlotFactory.create(
        reservation_unit_option=option_2,
        day_of_the_week=Weekday.FRIDAY,
        begin_time=datetime.time(10, 0),
        end_time=datetime.time(12, 0),
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option=option_2,
        day_of_the_week=Weekday.WEDNESDAY,
        begin_time=datetime.time(12, 0),
        end_time=datetime.time(14, 0),
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option=option_2,
        day_of_the_week=Weekday.WEDNESDAY,
        begin_time=datetime.time(18, 0),
        end_time=datetime.time(20, 0),
    )

    exporter = ApplicationRoundResultCSVExporter(application_round_id=application_round.id)
    with mock.patch(CSV_WRITER_MOCK_PATH) as mock_writer:
        exporter.export()
    writes = get_writes(mock_writer)
    assert len(writes) == 4

    section_row: ApplicationSectionExportRow = writes[1]  # type: ignore
    assert section_row.section_id == str(section.id)
    assert section_row.reservation_unit_name == "foo"
    assert section_row.day_of_the_week == Weekday.WEDNESDAY
    assert section_row.begin_time == "12:00"
    assert section_row.end_time == "14:00"

    section_row: ApplicationSectionExportRow = writes[2]  # type: ignore
    assert section_row.section_id == str(section.id)
    assert section_row.reservation_unit_name == "foo"
    assert section_row.day_of_the_week == Weekday.WEDNESDAY
    assert section_row.begin_time == "18:00"
    assert section_row.end_time == "20:00"

    section_row: ApplicationSectionExportRow = writes[3]  # type: ignore
    assert section_row.section_id == str(section.id)
    assert section_row.reservation_unit_name == "foo"
    assert section_row.day_of_the_week == Weekday.FRIDAY
    assert section_row.begin_time == "10:00"
    assert section_row.end_time == "12:00"
