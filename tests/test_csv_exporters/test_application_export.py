import datetime
import itertools
from unittest import mock

import pytest
from django.utils import timezone

from applications.choices import ApplicantTypeChoice, PriorityChoice, WeekdayChoice
from applications.exporter import ApplicationDataExporter, get_header_rows
from applications.models import ApplicationEvent
from tests.factories import ApplicationFactory, ApplicationRoundFactory
from tests.helpers import parametrize_helper

from .helpers import Missing, MissingParams, get_writes

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_application_export_multiple(graphql):
    # given:
    # - There are two application rounds in the system
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    application_1 = ApplicationFactory.create_in_status_in_allocation(
        application_round=application_round,
        organisation__name="aaa",
        application_events__application_event_schedules__day=WeekdayChoice.TUESDAY,
        application_events__application_event_schedules__priority=PriorityChoice.HIGH,
        application_events__event_reservation_units__reservation_unit__name="foo",
        application_events__event_reservation_units__reservation_unit__unit__name="fizz",
    )
    application_2 = ApplicationFactory.create_in_status_in_allocation(
        application_round=application_round,
        organisation__name="bbb",
        application_events__application_event_schedules__day=WeekdayChoice.FRIDAY,
        application_events__application_event_schedules__priority=PriorityChoice.LOW,
        application_events__event_reservation_units__reservation_unit__name="bar",
        application_events__event_reservation_units__reservation_unit__unit__name="buzz",
    )
    event_1: ApplicationEvent = application_1.application_events.first()
    event_2: ApplicationEvent = application_2.application_events.first()

    # when:
    # - The exporter is run
    open_mock = mock.patch("applications.exporter.open", new=mock.mock_open())
    csv_writer_mock = mock.patch("applications.exporter.writer")
    with open_mock, csv_writer_mock as mock_file:
        ApplicationDataExporter.export_application_data(application_round_id=application_round.id)

    # then:
    # - The writes to the csv file are correct
    writes = get_writes(mock_file)
    header_rows = get_header_rows(spaces_count=1)
    assert writes[0] == header_rows[0]
    assert writes[1] == header_rows[1]
    assert writes[2] == header_rows[2]

    index = itertools.count()
    row = writes[3]

    # asserts on individual lines since it's easier to debug
    assert row[next(index)] == application_1.id
    assert row[next(index)] == application_1.status.value
    assert row[next(index)] == application_1.organisation.name
    assert row[next(index)] == application_1.organisation.identifier
    assert row[next(index)] == application_1.contact_person.first_name
    assert row[next(index)] == application_1.contact_person.last_name
    assert row[next(index)] == application_1.contact_person.email
    assert row[next(index)] == application_1.contact_person.phone_number
    assert row[next(index)] == event_1.id
    assert row[next(index)] == event_1.status.value
    assert row[next(index)] == event_1.name
    assert row[next(index)] == f"{event_1.begin.day}.{event_1.begin.month}.{event_1.begin.year}"
    assert row[next(index)] == f"{event_1.end.day}.{event_1.end.month}.{event_1.end.year}"
    assert row[next(index)] == application_1.home_city.name
    assert row[next(index)] == event_1.purpose.name
    assert row[next(index)] == str(event_1.age_group)
    assert row[next(index)] == event_1.num_persons
    assert row[next(index)] == application_1.applicant_type
    assert row[next(index)] == event_1.events_per_week
    assert row[next(index)] == "1 h"
    assert row[next(index)] == "2 h"
    assert row[next(index)] == "foo, fizz"
    assert row[next(index)] == ""  # Monday, Priority: HIGH
    assert row[next(index)] == "12:00 - 14:00"  # Tuesday, Priority: HIGH
    assert row[next(index)] == ""  # Wednesday, Priority: HIGH
    assert row[next(index)] == ""  # Thursday, Priority: HIGH
    assert row[next(index)] == ""  # Friday, Priority: HIGH
    assert row[next(index)] == ""  # Saturday, Priority: HIGH
    assert row[next(index)] == ""  # Sunday, Priority: HIGH
    assert row[next(index)] == ""  # Monday, Priority: MEDIUM
    assert row[next(index)] == ""  # Tuesday, Priority: MEDIUM
    assert row[next(index)] == ""  # Wednesday, Priority: MEDIUM
    assert row[next(index)] == ""  # Thursday, Priority: MEDIUM
    assert row[next(index)] == ""  # Friday, Priority: MEDIUM
    assert row[next(index)] == ""  # Saturday, Priority: MEDIUM
    assert row[next(index)] == ""  # Sunday, Priority: MEDIUM
    assert row[next(index)] == ""  # Monday, Priority: LOW
    assert row[next(index)] == ""  # Tuesday, Priority: LOW
    assert row[next(index)] == ""  # Wednesday, Priority: LOW
    assert row[next(index)] == ""  # Thursday, Priority: LOW
    assert row[next(index)] == ""  # Friday, Priority: LOW
    assert row[next(index)] == ""  # Saturday, Priority: LOW
    assert row[next(index)] == ""  # Sunday, Priority: LOW

    index = itertools.count()
    row = writes[4]

    # asserts on individual lines since it's easier to debug
    assert row[next(index)] == application_2.id
    assert row[next(index)] == application_2.status.value
    assert row[next(index)] == application_2.organisation.name
    assert row[next(index)] == application_2.organisation.identifier
    assert row[next(index)] == application_2.contact_person.first_name
    assert row[next(index)] == application_2.contact_person.last_name
    assert row[next(index)] == application_2.contact_person.email
    assert row[next(index)] == application_2.contact_person.phone_number
    assert row[next(index)] == event_2.id
    assert row[next(index)] == event_2.status.value
    assert row[next(index)] == event_2.name
    assert row[next(index)] == f"{event_2.begin.day}.{event_2.begin.month}.{event_2.begin.year}"
    assert row[next(index)] == f"{event_2.end.day}.{event_2.end.month}.{event_2.end.year}"
    assert row[next(index)] == application_2.home_city.name
    assert row[next(index)] == event_2.purpose.name
    assert row[next(index)] == str(event_2.age_group)
    assert row[next(index)] == event_2.num_persons
    assert row[next(index)] == application_2.applicant_type
    assert row[next(index)] == event_2.events_per_week
    assert row[next(index)] == "1 h"
    assert row[next(index)] == "2 h"
    assert row[next(index)] == "bar, buzz"
    assert row[next(index)] == ""  # Monday, Priority: HIGH
    assert row[next(index)] == ""  # Tuesday, Priority: HIGH
    assert row[next(index)] == ""  # Wednesday, Priority: HIGH
    assert row[next(index)] == ""  # Thursday, Priority: HIGH
    assert row[next(index)] == ""  # Friday, Priority: HIGH
    assert row[next(index)] == ""  # Saturday, Priority: HIGH
    assert row[next(index)] == ""  # Sunday, Priority: HIGH
    assert row[next(index)] == ""  # Monday, Priority: MEDIUM
    assert row[next(index)] == ""  # Tuesday, Priority: MEDIUM
    assert row[next(index)] == ""  # Wednesday, Priority: MEDIUM
    assert row[next(index)] == ""  # Thursday, Priority: MEDIUM
    assert row[next(index)] == ""  # Friday, Priority: MEDIUM
    assert row[next(index)] == ""  # Saturday, Priority: MEDIUM
    assert row[next(index)] == ""  # Sunday, Priority: MEDIUM
    assert row[next(index)] == ""  # Monday, Priority: LOW
    assert row[next(index)] == ""  # Tuesday, Priority: LOW
    assert row[next(index)] == ""  # Wednesday, Priority: LOW
    assert row[next(index)] == ""  # Thursday, Priority: LOW
    assert row[next(index)] == "12:00 - 14:00"  # Friday, Priority: LOW
    assert row[next(index)] == ""  # Saturday, Priority: LOW
    assert row[next(index)] == ""  # Sunday, Priority: LOW


@pytest.mark.parametrize(
    **parametrize_helper(
        {
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
            "Missing event begin": MissingParams(
                missing=Missing(null=["application_events__begin"]),
                column_value_mapping={"hakijan ilmoittaman kauden alkupäivä": ""},
            ),
            "Missing event end": MissingParams(
                missing=Missing(null=["application_events__end"]),
                column_value_mapping={"hakijan ilmoittaman kauden loppupäivä": ""},
            ),
            "Missing home city": MissingParams(
                missing=Missing(null=["home_city"]),
                column_value_mapping={"kotikunta": "muu"},
            ),
            "Missing purpose": MissingParams(
                missing=Missing(null=["application_events__purpose"]),
                column_value_mapping={"vuoronkäyttötarkoitus": ""},
            ),
            "Missing age group": MissingParams(
                missing=Missing(null=["application_events__age_group"]),
                column_value_mapping={"ikäryhmä": ""},
            ),
            "Missing events per week": MissingParams(
                missing=Missing(null=["application_events__events_per_week"]),
                column_value_mapping={"vuoroja, kpl / vko": 0},
            ),
            "Missing event min duration": MissingParams(
                missing=Missing(null=["application_events__min_duration"]),
                column_value_mapping={"minimi aika": ""},
            ),
            "Missing event max duration": MissingParams(
                missing=Missing(null=["application_events__max_duration"]),
                column_value_mapping={"maksimi aika": ""},
            ),
        }
    )
)
def test_application_export_missing_data(graphql, column_value_mapping, missing):
    # given:
    # - There is one non-draft application with the given missing data in the system
    application_round = ApplicationRoundFactory.create_in_status_in_allocation(
        reservation_period_begin=datetime.datetime(2023, 2, 7),
        reservation_period_end=datetime.datetime(2023, 2, 8),
    )
    data = {
        "sent_date": timezone.now(),
        "application_round": application_round,
        "applicant_type": ApplicantTypeChoice.COMPANY.value,
        "home_city__name": "Helsinki",
        "organisation__name": "aaa",
        "organisation__identifier": "123456-7",
        "contact_person__first_name": "first",
        "contact_person__last_name": "last",
        "contact_person__email": "email@example.com",
        "contact_person__phone_number": "123467890",
        "application_events__min_duration": datetime.timedelta(hours=1),
        "application_events__max_duration": datetime.timedelta(hours=2),
        "application_events__events_per_week": 1,
        "application_events__begin": application_round.reservation_period_begin,
        "application_events__end": application_round.reservation_period_end,
        "application_events__purpose__name": "free",
        "application_events__age_group__minimum": 1,
        "application_events__age_group__maximum": 10,
        "application_events__application_event_schedules__declined": False,
        "application_events__application_event_schedules__day": WeekdayChoice.TUESDAY,
        "application_events__application_event_schedules__priority": PriorityChoice.HIGH,
        "application_events__event_reservation_units__reservation_unit__name": "foo",
        "application_events__event_reservation_units__reservation_unit__unit__name": "fizz",
    }
    missing.remove_from_data(data)
    ApplicationFactory.create(**data)

    # when:
    # - The exporter is run
    open_mock = mock.patch("applications.exporter.open", new=mock.mock_open())
    csv_writer_mock = mock.patch("applications.exporter.writer")
    with open_mock, csv_writer_mock as mock_file:
        ApplicationDataExporter.export_application_data(application_round_id=application_round.id)

    # then:
    # - The writes to the csv file are correct
    writes = get_writes(mock_file)

    header_row = writes[2]
    data_row = writes[3]

    for column, expected_value in column_value_mapping.items():
        index = header_row.index(column)
        assert data_row[index] == expected_value


def test_application_export__no_event_reservation_units(graphql):
    # given:
    # - There is a single application with no event reservation units
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    application_1 = ApplicationFactory.create_in_status_in_allocation(
        application_round=application_round,
        organisation__name="aaa",
        application_events__application_event_schedules__day=WeekdayChoice.TUESDAY,
        application_events__application_event_schedules__priority=PriorityChoice.HIGH,
    )
    application_1.application_events.first()

    # when:
    # - The exporter is run
    open_mock = mock.patch("applications.exporter.open", new=mock.mock_open())
    csv_writer_mock = mock.patch("applications.exporter.writer")
    with open_mock, csv_writer_mock as mock_file:
        ApplicationDataExporter.export_application_data(application_round_id=application_round.id)

    # then:
    # - The csv doesn't contain the event reservation unit column
    writes = get_writes(mock_file)

    header_row = writes[2]
    assert "tilatoive 1" not in header_row
