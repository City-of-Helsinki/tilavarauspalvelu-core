import itertools
from datetime import datetime
from typing import Any, NamedTuple
from unittest import mock

import pytest
from django.utils import timezone

from reservation_units.models import PricingStatus, ReservationUnit
from reservation_units.utils.export_data import HEADER_ROW, ReservationUnitExporter
from tests.factories import ReservationUnitFactory
from tests.helpers import parametrize_helper

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("disable_elasticsearch"),
]


class MissingParams(NamedTuple):
    column_value_mapping: dict[str, Any]
    missing: str = ""
    set_none: str = ""


def get_writes(mock_file: mock.MagicMock) -> list[list[str]]:
    return [call[1][0] for call in mock_file.mock_calls if call[0] == "().writerow"]


def test_reservation_unit_export_multiple():
    # given:
    # - There are two "complete"/"full" reservation units in the system
    reservation_units = ReservationUnitFactory.create_batch(
        2,
        reservation_begins=datetime(2022, 1, 1, tzinfo=timezone.get_default_timezone()),
        reservation_ends=datetime(2022, 2, 1, tzinfo=timezone.get_default_timezone()),
        spaces__name="Space",
        resources__name="Resource",
        qualifiers__name="Qualifier",
        services__name="Service",
        purposes__name="Purpose",
        equipments__name="Equipment",
        payment_terms__name="Payment terms",
        cancellation_terms__name="Cancellation terms",
        service_specific_terms__name="Service specific terms",
        pricing_terms__name="Pricing terms",
        cancellation_rule__name="Cancellation rule",
        metadata_set__name="Metadata set",
        payment_types__code="Payment type",
        pricings__status=PricingStatus.PRICING_STATUS_ACTIVE,
    )

    # when:
    # - The exporter is run for all reservation units
    open_mock = mock.patch("reservation_units.utils.export_data.open", new=mock.mock_open())
    csv_writer_mock = mock.patch("reservation_units.utils.export_data.writer")
    with open_mock, csv_writer_mock as mock_file:
        ReservationUnitExporter.export_reservation_unit_data()

    # then:
    # - the writes contain the expected data
    writes = get_writes(mock_file)

    assert len(writes) == 3, writes
    assert writes[0] == HEADER_ROW

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
    assert row_2[next(index)] == reservation_unit_1.pricings.active().price_unit
    assert row_2[next(index)] == reservation_unit_1.pricings.active().lowest_price
    assert row_2[next(index)] == reservation_unit_1.pricings.active().highest_price
    assert row_2[next(index)] == reservation_unit_1.pricings.active().tax_percentage
    assert row_2[next(index)] == reservation_unit_1.reservation_begins.strftime("%d:%m:%Y %H:%M")
    assert row_2[next(index)] == reservation_unit_1.reservation_ends.strftime("%d:%m:%Y %H:%M")
    assert row_2[next(index)] == reservation_unit_1.metadata_set.name
    assert row_2[next(index)] == reservation_unit_1.require_reservation_handling
    assert row_2[next(index)] == reservation_unit_1.authentication
    assert row_2[next(index)] == reservation_unit_1.reservation_kind
    assert row_2[next(index)] == reservation_unit_1.pricings.active().pricing_type
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
    assert row_2[next(index)] == reservation_unit_1.buffer_time_before
    assert row_2[next(index)] == reservation_unit_1.buffer_time_after
    assert row_2[next(index)] == reservation_unit_1.hauki_resource_id
    assert row_2[next(index)] == reservation_unit_1.reservation_start_interval
    assert row_2[next(index)] == reservation_unit_1.reservations_max_days_before
    assert row_2[next(index)] == reservation_unit_1.reservations_min_days_before
    assert row_2[next(index)] == reservation_unit_1.max_reservations_per_user
    assert row_2[next(index)] == reservation_unit_1.allow_reservations_without_opening_hours
    assert row_2[next(index)] == reservation_unit_1.is_archived
    assert row_2[next(index)] == reservation_unit_1.services.first().name_fi
    assert row_2[next(index)] == reservation_unit_1.purposes.first().name_fi
    assert row_2[next(index)] == reservation_unit_1.require_introduction
    assert row_2[next(index)] == reservation_unit_1.equipments.first().name_fi
    assert row_2[next(index)] == reservation_unit_1.state.value
    assert row_2[next(index)] == reservation_unit_1.reservation_state.value

    # No need to test the second item so thoroughly
    assert writes[2][0] == reservation_units[1].id


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Missing Spaces": MissingParams(
                missing="spaces__name",
                column_value_mapping={"Spaces": ""},
            ),
            "Missing Resources": MissingParams(
                missing="resources__name",
                column_value_mapping={"Resources": ""},
            ),
            "Missing Qualifiers": MissingParams(
                missing="qualifiers__name",
                column_value_mapping={"Qualifiers": ""},
            ),
            "Missing Services": MissingParams(
                missing="services__name",
                column_value_mapping={"Services": ""},
            ),
            "Missing Purposes": MissingParams(
                missing="purposes__name",
                column_value_mapping={"Purposes": ""},
            ),
            "Missing Equipments": MissingParams(
                missing="equipments__name",
                column_value_mapping={"Equipments": ""},
            ),
            "Missing Payment terms": MissingParams(
                missing="payment_terms__name",
                column_value_mapping={"Payment terms": ""},
            ),
            "Missing Cancellation terms": MissingParams(
                missing="cancellation_terms__name",
                column_value_mapping={"Cancellation terms": ""},
            ),
            "Missing Service-specific terms": MissingParams(
                missing="service_specific_terms__name",
                column_value_mapping={"Service-specific terms": ""},
            ),
            "Missing Pricing terms": MissingParams(
                missing="pricing_terms__name",
                column_value_mapping={"Pricing terms": ""},
            ),
            "Missing Cancellation rule": MissingParams(
                missing="cancellation_rule__name",
                column_value_mapping={"Cancellation rule": ""},
            ),
            "Missing Reservation metadata set": MissingParams(
                missing="metadata_set__name",
                column_value_mapping={"Reservation metadata set": ""},
            ),
            "Missing Payment type": MissingParams(
                missing="payment_types__code",
                column_value_mapping={"Payment type": ""},
            ),
            "Missing Pricing": MissingParams(
                missing="pricings__status",
                column_value_mapping={
                    "Price unit": "",
                    "Lowest price": "",
                    "Highest price": "",
                    "Tax percentage": "",
                    "Pricing types": "",
                },
            ),
            "Missing Reservation begins": MissingParams(
                missing="reservation_begins",
                column_value_mapping={"Reservation begins": ""},
            ),
            "Missing Reservation ends": MissingParams(
                missing="reservation_ends",
                column_value_mapping={"Reservation ends": ""},
            ),
            "Missing Reservation unit type": MissingParams(
                set_none="reservation_unit_type",
                column_value_mapping={"Type": ""},
            ),
            "Missing Unit": MissingParams(
                set_none="unit",
                column_value_mapping={
                    "TPRek ID": "",
                    "Unit": "",
                },
            ),
        },
    ),
)
def test_reservation_unit_export_missing_relations(column_value_mapping, missing, set_none):
    # given:
    # - There is one reservation unit with the given missing data in the system
    data = {
        "reservation_begins": datetime(2022, 1, 1, tzinfo=timezone.get_default_timezone()),
        "reservation_ends": datetime(2022, 2, 1, tzinfo=timezone.get_default_timezone()),
        "spaces__name": "Space",
        "resources__name": "Resource",
        "qualifiers__name": "Qualifier",
        "services__name": "Service",
        "purposes__name": "Purpose",
        "equipments__name": "Equipment",
        "payment_terms__name": "Payment terms",
        "cancellation_terms__name": "Cancellation terms",
        "service_specific_terms__name": "Service specific terms",
        "pricing_terms__name": "Pricing terms",
        "cancellation_rule__name": "Cancellation rule",
        "metadata_set__name": "Metadata set",
        "payment_types__code": "Payment type",
        "pricings__status": PricingStatus.PRICING_STATUS_ACTIVE,
    }

    if missing:
        del data[missing]
    # Some fields are created automatically by the factory
    # and must be set None to not create them
    if set_none:
        data[set_none] = None

    ReservationUnitFactory.create(**data)

    # when:
    # - The exporter is run for all reservation units
    open_mock = mock.patch("reservation_units.utils.export_data.open", new=mock.mock_open())
    csv_writer_mock = mock.patch("reservation_units.utils.export_data.writer")
    with open_mock, csv_writer_mock as mock_file:
        ReservationUnitExporter.export_reservation_unit_data()

    # then:
    # - the writes contain the expected data
    writes = get_writes(mock_file)

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
    open_mock = mock.patch("reservation_units.utils.export_data.open", new=mock.mock_open())
    csv_writer_mock = mock.patch("reservation_units.utils.export_data.writer")
    with open_mock, csv_writer_mock as mock_file:
        ReservationUnitExporter.export_reservation_unit_data(queryset=ReservationUnit.objects.all()[:3])

    # then:
    # - the writes contain only 3 rows (+header)
    writes = get_writes(mock_file)
    assert len(writes) == 4, writes
