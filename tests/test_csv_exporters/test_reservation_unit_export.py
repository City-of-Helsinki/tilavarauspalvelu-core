from __future__ import annotations

import datetime
import itertools
from decimal import Decimal

import pytest
from django.utils import timezone
from graphene_django_extensions.testing.utils import parametrize_helper

from tilavarauspalvelu.enums import AuthenticationType, ReservationKind, ReservationStartInterval
from tilavarauspalvelu.models import ReservationUnit
from tilavarauspalvelu.services.csv_export import ReservationUnitExporter
from utils.date_utils import local_datetime_string, local_timedelta_string

from tests.factories import ReservationUnitFactory

from .helpers import Missing, MissingParams, mock_csv_writer

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_export_multiple():
    # given:
    # - There are two "complete"/"full" reservation units in the system
    reservation_units = ReservationUnitFactory.create_batch(
        2,
        reservation_begins=datetime.datetime(2022, 1, 1, tzinfo=timezone.get_default_timezone()),
        reservation_ends=datetime.datetime(2022, 2, 1, tzinfo=timezone.get_default_timezone()),
        spaces__name="Space",
        resources__name="Resource",
        qualifiers__name="Qualifier",
        purposes__name="Purpose",
        equipments__name="Equipment",
        payment_terms__name="Payment terms",
        cancellation_terms__name="Cancellation terms",
        service_specific_terms__name="Service specific terms",
        pricing_terms__name="Pricing terms",
        cancellation_rule__name="Cancellation rule",
        metadata_set__name="Metadata set",
        payment_types__code="Payment type",
        reservation_unit_type__name="Normal",
        pricings__highest_price=Decimal(20),
    )

    # when:
    # - The exporter is run for all reservation units
    exporter = ReservationUnitExporter()
    with mock_csv_writer() as mock_writer:
        exporter.write()

    # then:
    # - the writes contain the expected data
    writes = mock_writer.get_writes()

    assert len(writes) == 3, writes

    headers = [list(row.as_row()) for row in exporter.get_header_rows()]
    assert writes[0] == headers[0]

    index = itertools.count()
    row_2 = writes[1]
    reservation_unit_1: ReservationUnit = reservation_units[0]

    # asserts on individual lines since it's easier to debug
    assert row_2[next(index)] == reservation_unit_1.id
    assert row_2[next(index)] == reservation_unit_1.name
    assert row_2[next(index)] == reservation_unit_1.name_fi
    assert row_2[next(index)] == reservation_unit_1.name_en
    assert row_2[next(index)] == reservation_unit_1.name_sv
    assert row_2[next(index)] == reservation_unit_1.description
    assert row_2[next(index)] == reservation_unit_1.description_fi
    assert row_2[next(index)] == reservation_unit_1.description_en
    assert row_2[next(index)] == reservation_unit_1.description_sv
    assert row_2[next(index)] == reservation_unit_1.reservation_unit_type.name
    assert row_2[next(index)] == reservation_unit_1.terms_of_use
    assert row_2[next(index)] == reservation_unit_1.terms_of_use_fi
    assert row_2[next(index)] == reservation_unit_1.terms_of_use_en
    assert row_2[next(index)] == reservation_unit_1.terms_of_use_sv
    assert row_2[next(index)] == reservation_unit_1.service_specific_terms.name
    assert row_2[next(index)] == reservation_unit_1.unit.tprek_id
    assert row_2[next(index)] == reservation_unit_1.unit.name
    assert row_2[next(index)] == reservation_unit_1.contact_information
    assert row_2[next(index)] == reservation_unit_1.is_draft
    assert row_2[next(index)] == reservation_unit_1.publish_begins
    assert row_2[next(index)] == reservation_unit_1.publish_ends
    assert row_2[next(index)] == reservation_unit_1.spaces.first().name_fi
    assert row_2[next(index)] == reservation_unit_1.resources.first().name_fi
    assert row_2[next(index)] == reservation_unit_1.qualifiers.first().name_fi
    assert row_2[next(index)] == reservation_unit_1.payment_terms.name
    assert row_2[next(index)] == reservation_unit_1.cancellation_terms.name
    assert row_2[next(index)] == reservation_unit_1.pricing_terms.name
    assert row_2[next(index)] == reservation_unit_1.cancellation_rule.name
    assert row_2[next(index)] == reservation_unit_1.pricings.first().price_unit
    assert row_2[next(index)] == reservation_unit_1.pricings.first().lowest_price
    assert row_2[next(index)] == reservation_unit_1.pricings.first().highest_price
    assert row_2[next(index)] == reservation_unit_1.pricings.first().tax_percentage
    assert row_2[next(index)] == local_datetime_string(reservation_unit_1.reservation_begins)
    assert row_2[next(index)] == local_datetime_string(reservation_unit_1.reservation_ends)
    assert row_2[next(index)] == reservation_unit_1.metadata_set.name
    assert row_2[next(index)] == reservation_unit_1.require_reservation_handling
    assert row_2[next(index)] == AuthenticationType(reservation_unit_1.authentication).label
    assert row_2[next(index)] == ReservationKind(reservation_unit_1.reservation_kind).label
    assert row_2[next(index)] == reservation_unit_1.payment_types.first().code
    assert row_2[next(index)] == reservation_unit_1.can_apply_free_of_charge
    assert row_2[next(index)] == reservation_unit_1.reservation_pending_instructions_fi
    assert row_2[next(index)] == reservation_unit_1.reservation_pending_instructions_sv
    assert row_2[next(index)] == reservation_unit_1.reservation_pending_instructions_en
    assert row_2[next(index)] == reservation_unit_1.reservation_confirmed_instructions_fi
    assert row_2[next(index)] == reservation_unit_1.reservation_confirmed_instructions_sv
    assert row_2[next(index)] == reservation_unit_1.reservation_confirmed_instructions_en
    assert row_2[next(index)] == reservation_unit_1.reservation_cancelled_instructions_fi
    assert row_2[next(index)] == reservation_unit_1.reservation_cancelled_instructions_sv
    assert row_2[next(index)] == reservation_unit_1.reservation_cancelled_instructions_en
    assert row_2[next(index)] == reservation_unit_1.max_reservation_duration
    assert row_2[next(index)] == reservation_unit_1.min_reservation_duration
    assert row_2[next(index)] == reservation_unit_1.max_persons
    assert row_2[next(index)] == reservation_unit_1.min_persons
    assert row_2[next(index)] == reservation_unit_1.surface_area
    assert row_2[next(index)] == (local_timedelta_string(reservation_unit_1.buffer_time_before) or None)
    assert row_2[next(index)] == (local_timedelta_string(reservation_unit_1.buffer_time_after) or None)
    assert row_2[next(index)] == reservation_unit_1.origin_hauki_resource_id
    assert row_2[next(index)] == ReservationStartInterval(reservation_unit_1.reservation_start_interval).label
    assert row_2[next(index)] == reservation_unit_1.reservations_max_days_before
    assert row_2[next(index)] == reservation_unit_1.reservations_min_days_before
    assert row_2[next(index)] == reservation_unit_1.max_reservations_per_user
    assert row_2[next(index)] == reservation_unit_1.allow_reservations_without_opening_hours
    assert row_2[next(index)] == reservation_unit_1.is_archived
    assert row_2[next(index)] == reservation_unit_1.purposes.first().name_fi
    assert row_2[next(index)] == reservation_unit_1.require_introduction
    assert row_2[next(index)] == reservation_unit_1.equipments.first().name_fi
    assert row_2[next(index)] == reservation_unit_1.publishing_state
    assert row_2[next(index)] == reservation_unit_1.reservation_state

    # No need to test the second item so thoroughly
    assert writes[2][0] == reservation_units[1].id


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Missing Spaces": MissingParams(
                missing=Missing(deleted=["spaces__name"]),
                column_value_mapping={"Spaces": ""},
            ),
            "Missing Resources": MissingParams(
                missing=Missing(deleted=["resources__name"]),
                column_value_mapping={"Resources": ""},
            ),
            "Missing Qualifiers": MissingParams(
                missing=Missing(deleted=["qualifiers__name"]),
                column_value_mapping={"Qualifiers": ""},
            ),
            "Missing Purposes": MissingParams(
                missing=Missing(deleted=["purposes__name"]),
                column_value_mapping={"Purposes": ""},
            ),
            "Missing Equipments": MissingParams(
                missing=Missing(deleted=["equipments__name"]),
                column_value_mapping={"Equipments": ""},
            ),
            "Missing Payment terms": MissingParams(
                missing=Missing(deleted=["payment_terms__name"]),
                column_value_mapping={"Payment terms": ""},
            ),
            "Missing Cancellation terms": MissingParams(
                missing=Missing(deleted=["cancellation_terms__name"]),
                column_value_mapping={"Cancellation terms": ""},
            ),
            "Missing Service-specific terms": MissingParams(
                missing=Missing(deleted=["service_specific_terms__name"]),
                column_value_mapping={"Service-specific terms": ""},
            ),
            "Missing Pricing terms": MissingParams(
                missing=Missing(deleted=["pricing_terms__name"]),
                column_value_mapping={"Pricing terms": ""},
            ),
            "Missing Cancellation rule": MissingParams(
                missing=Missing(deleted=["cancellation_rule__name"]),
                column_value_mapping={"Cancellation rule": ""},
            ),
            "Missing Reservation metadata set": MissingParams(
                missing=Missing(deleted=["metadata_set__name"]),
                column_value_mapping={"Reservation metadata set": ""},
            ),
            "Missing Payment type": MissingParams(
                missing=Missing(deleted=["payment_types__code"]),
                column_value_mapping={"Payment type": ""},
            ),
            "Missing Pricing": MissingParams(
                missing=Missing(deleted=["pricings__highest_price"]),
                column_value_mapping={
                    "Price unit": "",
                    "Lowest price": "",
                    "Highest price": "",
                    "Tax percentage": "",
                },
            ),
            "Missing Reservation begins": MissingParams(
                missing=Missing(deleted=["reservation_begins"]),
                column_value_mapping={"Reservation begins": None},
            ),
            "Missing Reservation ends": MissingParams(
                missing=Missing(deleted=["reservation_ends"]),
                column_value_mapping={"Reservation ends": None},
            ),
            "Missing Reservation unit type": MissingParams(
                missing=Missing(null=["reservation_unit_type"]),
                column_value_mapping={"Type": ""},
            ),
            "Missing Unit": MissingParams(
                missing=Missing(null=["unit"]),
                column_value_mapping={
                    "TPRek ID": "",
                    "Unit": "",
                },
            ),
        },
    ),
)
def test_reservation_unit_export_missing_relations(column_value_mapping, missing):
    # given:
    # - There is one reservation unit with the given missing data in the system
    data = {
        "reservation_begins": datetime.datetime(2022, 1, 1, tzinfo=timezone.get_default_timezone()),
        "reservation_ends": datetime.datetime(2022, 2, 1, tzinfo=timezone.get_default_timezone()),
        "spaces__name": "Space",
        "resources__name": "Resource",
        "qualifiers__name": "Qualifier",
        "purposes__name": "Purpose",
        "equipments__name": "Equipment",
        "payment_terms__name": "Payment terms",
        "cancellation_terms__name": "Cancellation terms",
        "service_specific_terms__name": "Service specific terms",
        "pricing_terms__name": "Pricing terms",
        "cancellation_rule__name": "Cancellation rule",
        "metadata_set__name": "Metadata set",
        "payment_types__code": "Payment type",
        "pricings__highest_price": Decimal(20),
    }
    missing.remove_from_data(data)
    ReservationUnitFactory.create(**data)

    # when:
    # - The exporter is run for all reservation units
    exporter = ReservationUnitExporter()
    with mock_csv_writer() as mock_writer:
        exporter.write()

    # then:
    # - the writes contain the expected data
    writes = mock_writer.get_writes()

    assert len(writes) == 2, writes
    for column, expected_value in column_value_mapping.items():
        index = writes[0].index(column)
        assert writes[1][index] == expected_value


def test_reservation_unit_export_subset():
    # given:
    # - There are 5 reservation units in the system
    ReservationUnitFactory.create_batch(5)

    # when:
    # - The exporter is run for the first 3 reservation units
    exporter = ReservationUnitExporter(queryset=ReservationUnit.objects.all()[:3])
    with mock_csv_writer() as mock_writer:
        exporter.write()

    # then:
    # - the writes contain only 3 rows (+header)
    writes = mock_writer.get_writes()
    assert len(writes) == 4, writes
