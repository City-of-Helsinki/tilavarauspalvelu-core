from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import pytest
from graphene_django_extensions.testing.utils import parametrize_helper

from tilavarauspalvelu.enums import ApplicantTypeChoice, Priority, Weekday
from tilavarauspalvelu.services.csv_export import ApplicationRoundApplicationsCSVExporter
from tilavarauspalvelu.services.csv_export.application_round_applications_exporter import ApplicationExportRow
from utils.date_utils import local_date_string, local_datetime, local_timedelta_string

from tests.factories import ApplicationFactory, ApplicationRoundFactory
from tests.factories.application import ApplicationBuilder

from .helpers import Missing, MissingParams, mock_csv_writer

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_round_applications_export__multiple_applications(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    application_1 = ApplicationFactory.create_in_status_in_allocation(
        application_round=application_round,
        organisation__name="aaa",
        contact_person__first_name="foo",
        home_city__name="Helsinki",
        application_sections__purpose__name="purpose",
        application_sections__age_group__minimum=18,
        application_sections__age_group__maximum=100,
        application_sections__suitable_time_ranges__priority=Priority.PRIMARY,
        application_sections__suitable_time_ranges__day_of_the_week=Weekday.TUESDAY,
        application_sections__reservation_unit_options__reservation_unit__name="foo",
        application_sections__reservation_unit_options__reservation_unit__unit__name="fizz",
    )
    application_2 = ApplicationFactory.create_in_status_in_allocation(
        application_round=application_round,
        organisation__name="bbb",
        contact_person__first_name="bar",
        home_city__name="Helsinki",
        application_sections__purpose__name="free",
        application_sections__age_group__minimum=18,
        application_sections__age_group__maximum=100,
        application_sections__suitable_time_ranges__priority=Priority.SECONDARY,
        application_sections__suitable_time_ranges__day_of_the_week=Weekday.FRIDAY,
        application_sections__reservation_unit_options__reservation_unit__name="bar",
        application_sections__reservation_unit_options__reservation_unit__unit__name="buzz",
    )
    section_1: ApplicationSection = application_1.application_sections.first()
    section_2: ApplicationSection = application_2.application_sections.first()

    exporter = ApplicationRoundApplicationsCSVExporter(application_round_id=application_round.id)
    with mock_csv_writer() as mock_writer:
        exporter.write()

    writes = mock_writer.get_writes()

    assert exporter.max_options == 1
    header_rows = [list(row.as_row()) for row in exporter.get_header_rows()]
    assert writes[0] == header_rows[0]
    assert writes[1] == header_rows[1]
    assert writes[2] == header_rows[2]

    assert writes[3] == [
        *ApplicationExportRow(
            application_id=str(application_1.id),
            application_status=application_1.status.value,
            applicant=application_1.organisation.name,
            organisation_id=application_1.organisation.identifier,
            contact_person_first_name=application_1.contact_person.first_name,
            contact_person_last_name=application_1.contact_person.last_name,
            contact_person_email=application_1.contact_person.email,
            contact_person_phone=application_1.contact_person.phone_number,
            section_id=str(section_1.id),
            section_status=section_1.status.value,
            section_name=section_1.name,
            reservations_begin_date=local_date_string(section_1.reservations_begin_date),
            reservations_end_date=local_date_string(section_1.reservations_end_date),
            home_city_name=application_1.home_city.name,
            purpose_name=section_1.purpose.name,
            age_group_str=str(section_1.age_group),
            num_persons=str(section_1.num_persons),
            applicant_type=application_1.applicant_type,
            applied_reservations_per_week=str(section_1.applied_reservations_per_week),
            reservation_min_duration=local_timedelta_string(section_1.reservation_min_duration),
            reservation_max_duration=local_timedelta_string(section_1.reservation_max_duration),
            primary_monday="",
            primary_tuesday="12:00-14:00",
            primary_wednesday="",
            primary_thursday="",
            primary_friday="",
            primary_saturday="",
            primary_sunday="",
            secondary_monday="",
            secondary_tuesday="",
            secondary_wednesday="",
            secondary_thursday="",
            secondary_friday="",
            secondary_saturday="",
            secondary_sunday="",
        ).as_row(),
        "foo, fizz",  # reservation unit option
    ]

    assert writes[4] == [
        *ApplicationExportRow(
            application_id=str(application_2.id),
            application_status=application_2.status.value,
            applicant=application_2.organisation.name,
            organisation_id=application_2.organisation.identifier,
            contact_person_first_name=application_2.contact_person.first_name,
            contact_person_last_name=application_2.contact_person.last_name,
            contact_person_email=application_2.contact_person.email,
            contact_person_phone=application_2.contact_person.phone_number,
            section_id=str(section_2.id),
            section_status=section_2.status.value,
            section_name=section_2.name,
            reservations_begin_date=local_date_string(section_2.reservations_begin_date),
            reservations_end_date=local_date_string(section_2.reservations_end_date),
            home_city_name=application_2.home_city.name,
            purpose_name=section_2.purpose.name,
            age_group_str=str(section_2.age_group),
            num_persons=str(section_2.num_persons),
            applicant_type=application_2.applicant_type,
            applied_reservations_per_week=str(section_2.applied_reservations_per_week),
            reservation_min_duration=local_timedelta_string(section_2.reservation_min_duration),
            reservation_max_duration=local_timedelta_string(section_2.reservation_max_duration),
            primary_monday="",
            primary_tuesday="",
            primary_wednesday="",
            primary_thursday="",
            primary_friday="",
            primary_saturday="",
            primary_sunday="",
            secondary_monday="",
            secondary_tuesday="",
            secondary_wednesday="",
            secondary_thursday="",
            secondary_friday="12:00-14:00",
            secondary_saturday="",
            secondary_sunday="",
        ).as_row(),
        "bar, buzz",  # reservation unit option
    ]


@pytest.mark.parametrize(
    **parametrize_helper({
        "Missing organisation name": MissingParams(
            missing=Missing(empty=["organisation__name"]),
            column_value_mapping={"hakija": "first last"},
        ),
        "Missing organisation name and contact person": MissingParams(
            missing=Missing(empty=["organisation__name"], null=["contact_person"]),
            column_value_mapping={"hakija": ""},
        ),
        "Missing organisation identifier": MissingParams(
            missing=Missing(empty=["organisation__identifier"]),
            column_value_mapping={"y-tunnus": ""},
        ),
        "Missing contact person": MissingParams(
            missing=Missing(null=["contact_person"]),
            column_value_mapping={
                "yhteyshenkilö etunimi": "",
                "yhteyshenkilö sukunimi": "",
                "sähköpostiosoite": "",
                "yhteyshenkilön puh": "",
            },
        ),
        "Missing home city": MissingParams(
            missing=Missing(null=["home_city"]),
            column_value_mapping={"kotikunta": "muu"},
        ),
        "Missing purpose": MissingParams(
            missing=Missing(null=["application_sections__purpose"]),
            column_value_mapping={"vuoronkäyttötarkoitus": ""},
        ),
        "Missing age group": MissingParams(
            missing=Missing(null=["application_sections__age_group"]),
            column_value_mapping={"ikäryhmä": ""},
        ),
    })
)
def test_application_round_applications_export__missing_data(graphql, column_value_mapping, missing):
    # given:
    # - There is one non-draft application with the given missing data in the system
    application_round = ApplicationRoundFactory.create_in_status_in_allocation(
        reservation_period_begin=datetime.datetime(2023, 2, 7),
        reservation_period_end=datetime.datetime(2023, 2, 8),
    )
    data = {
        "sent_date": local_datetime(),
        "application_round": application_round,
        "applicant_type": ApplicantTypeChoice.COMPANY.value,
        "home_city__name": "Helsinki",
        "organisation__name": "aaa",
        "organisation__identifier": "123456-7",
        "contact_person__first_name": "first",
        "contact_person__last_name": "last",
        "contact_person__email": "email@example.com",
        "contact_person__phone_number": "123467890",
        "application_sections__reservation_min_duration": datetime.timedelta(hours=1),
        "application_sections__reservation_max_duration": datetime.timedelta(hours=2),
        "application_sections__applied_reservations_per_week": 1,
        "application_sections__reservations_begin_date": application_round.reservation_period_begin,
        "application_sections__reservations_end_date": application_round.reservation_period_end,
        "application_sections__purpose__name": "free",
        "application_sections__age_group__minimum": 1,
        "application_sections__age_group__maximum": 10,
        "application_sections__suitable_time_ranges__day_of_the_week": Weekday.TUESDAY,
        "application_sections__suitable_time_ranges__priority": Priority.PRIMARY,
        "application_sections__reservation_unit_options__reservation_unit__name": "foo",
        "application_sections__reservation_unit_options__reservation_unit__unit__name": "fizz",
    }
    missing.remove_from_data(data)
    ApplicationFactory.create(**data)

    exporter = ApplicationRoundApplicationsCSVExporter(application_round_id=application_round.id)

    # when:
    # - The exporter is run
    with mock_csv_writer() as mock_writer:
        exporter.write()

    # then:
    # - The writes to the csv file are correct
    writes = mock_writer.get_writes()

    header_row = writes[2]
    data_row = writes[3]

    for column, expected_value in column_value_mapping.items():
        index = header_row.index(column)
        assert data_row[index] == expected_value


def test_application_round_applications_export__no_reservation_unit_options(graphql):
    # given:
    # - There is a single application with no reservation unit options
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    application_1 = (
        ApplicationBuilder()
        .in_allocation(sections=False)
        .in_application_round(application_round)
        .create(
            application_sections__suitable_time_ranges__day_of_the_week=Weekday.MONDAY,
            application_sections__reservation_unit_options=[],
        )
    )
    application_1.application_sections.first()

    exporter = ApplicationRoundApplicationsCSVExporter(application_round_id=application_round.id)

    # when:
    # - The exporter is run
    with mock_csv_writer() as mock_writer:
        exporter.write()

    # then:
    # - The csv doesn't contain the reservation unit options column
    writes = mock_writer.get_writes()

    header_row = writes[2]
    assert "tilatoive 1" not in header_row
