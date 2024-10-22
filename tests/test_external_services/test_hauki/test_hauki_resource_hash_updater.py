import datetime
from typing import TYPE_CHECKING

import freezegun
import pytest

from tests.factories import ReservableTimeSpanFactory
from tests.factories.origin_hauki_resource import OriginHaukiResourceFactory
from tests.helpers import patch_method
from tests.mocks import MockResponse
from tilavarauspalvelu.constants import NEVER_ANY_OPENING_HOURS_HASH
from tilavarauspalvelu.models import ReservableTimeSpan
from tilavarauspalvelu.utils.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.utils.opening_hours.hauki_resource_hash_updater import HaukiResourceHashUpdater
from tilavarauspalvelu.utils.opening_hours.reservable_time_span_client import ReservableTimeSpanClient
from utils.date_utils import DEFAULT_TIMEZONE

if TYPE_CHECKING:
    from tilavarauspalvelu.models import OriginHaukiResource

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

############
# __init__ #
############


def test__HaukiResourceHashUpdater__init__no_params(reservation_unit):
    updater = HaukiResourceHashUpdater()

    assert list(updater.hauki_resource_ids) == [
        reservation_unit.unit.origin_hauki_resource_id,
        reservation_unit.origin_hauki_resource_id,
    ]


def test__HaukiResourceHashUpdater__init__pass_resource_ids(reservation_unit):
    updater = HaukiResourceHashUpdater([1, 2, 3])

    assert updater.hauki_resource_ids == [1, 2, 3]


def test__HaukiResourceHashUpdater__init__pass_empty_list(reservation_unit):
    updater = HaukiResourceHashUpdater([])

    assert updater.hauki_resource_ids == []


##########################
# _fetch_hauki_resources #
##########################


@patch_method(HaukiAPIClient.get_resources, return_value={"results": ["foo"]})
def test__HaukiResourceHashUpdater__fetch_hauki_resources__single_page(reservation_unit):
    updater = HaukiResourceHashUpdater()
    updater._fetch_hauki_resources()

    assert HaukiAPIClient.get_resources.call_count == 1
    assert updater.fetched_hauki_resources == ["foo"]


@patch_method(
    HaukiAPIClient.get,
    side_effect=[
        MockResponse(status_code=200, json={"results": ["foo"], "next": "page2"}),
        MockResponse(status_code=200, json={"results": ["bar"], "next": None}),
    ],
)
def test__HaukiResourceHashUpdater__fetch_hauki_resources__multiple_pages(reservation_unit):
    updater = HaukiResourceHashUpdater()
    updater._fetch_hauki_resources()

    assert HaukiAPIClient.get.call_count == 2
    assert updater.fetched_hauki_resources == ["foo", "bar"]


@patch_method(HaukiAPIClient.get_resources, return_value={"results": []})
def test__HaukiResourceHashUpdater__fetch_hauki_resources__nothing_returned(reservation_unit):
    updater = HaukiResourceHashUpdater()
    updater._fetch_hauki_resources()

    assert HaukiAPIClient.get_resources.call_count == 1
    assert updater.fetched_hauki_resources == []


####################################
# _update_reservation_units_hashes #
####################################


def test__HaukiResourceHashUpdater__update_reservation_units_hashes__no_initial_hash():
    origin_hauki_resource: OriginHaukiResource = OriginHaukiResourceFactory.create(
        id=999,
        opening_hours_hash="",
        latest_fetched_date=None,
    )

    updater = HaukiResourceHashUpdater()
    updater.fetched_hauki_resources = [{"id": origin_hauki_resource.id, "date_periods_hash": "foo"}]
    updater._update_origin_hauki_resource_hashes()

    origin_hauki_resource.refresh_from_db()
    assert origin_hauki_resource.opening_hours_hash == "foo"
    assert origin_hauki_resource.latest_fetched_date is None


@freezegun.freeze_time("2020-01-01")
def test__HaukiResourceHashUpdater__update_reservation_units_hashes__hash_updated():
    origin_hauki_resource: OriginHaukiResource = OriginHaukiResourceFactory.create(
        id=999,
        opening_hours_hash="foo",
        latest_fetched_date=datetime.date(2019, 12, 31),
    )

    # In the past: Should be kept as is
    rts1 = ReservableTimeSpanFactory.create(
        resource=origin_hauki_resource,
        start_datetime=datetime.datetime(2019, 12, 1, 10, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2019, 12, 31, 20, tzinfo=DEFAULT_TIMEZONE),
    )
    # Overlaps with the cutoff date: should be shortened to cutoff date
    rts2 = ReservableTimeSpanFactory.create(
        resource=origin_hauki_resource,
        start_datetime=datetime.datetime(2019, 12, 31, 10, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2020, 1, 1, 20, tzinfo=DEFAULT_TIMEZONE),
    )
    # In the future: should be deleted
    rts3 = ReservableTimeSpanFactory.create(
        resource=origin_hauki_resource,
        start_datetime=datetime.datetime(2020, 1, 1, 10, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2020, 2, 1, 20, tzinfo=DEFAULT_TIMEZONE),
    )

    updater = HaukiResourceHashUpdater()
    updater.fetched_hauki_resources = [{"id": origin_hauki_resource.id, "date_periods_hash": "bar"}]
    updater._update_origin_hauki_resource_hashes()

    # Hash is updated
    origin_hauki_resource.refresh_from_db()
    assert origin_hauki_resource.opening_hours_hash == "bar"
    assert origin_hauki_resource.latest_fetched_date is None

    # All future reservable time spans are deleted
    existing_ids = ReservableTimeSpan.objects.values_list("id", flat=True)
    assert rts1.id in existing_ids
    assert rts2.id in existing_ids
    assert rts3.id not in existing_ids

    # The existing reservable time span is shortened to the cutoff date
    rts2.refresh_from_db()
    assert rts2.start_datetime == datetime.datetime(2019, 12, 31, 10, tzinfo=DEFAULT_TIMEZONE)
    assert rts2.end_datetime == datetime.datetime(2020, 1, 1, 0, tzinfo=DEFAULT_TIMEZONE)

    assert updater.resources_updated == [origin_hauki_resource]


#######################################################
# _create_reservable_time_spans_for_reservation_units #
#######################################################


@freezegun.freeze_time("2020-01-01")
@patch_method(ReservableTimeSpanClient.run, return_value=[1, 2, 3])
def test__HaukiResourceHashUpdater__create_reservable_time_spans_for_reservation_units():
    updater = HaukiResourceHashUpdater()
    updater.resources_updated = [
        OriginHaukiResourceFactory.create(
            id=999,
            opening_hours_hash="foo",
            latest_fetched_date=datetime.date(2019, 12, 31),
        ),
        OriginHaukiResourceFactory.create(
            id=888,
            opening_hours_hash="bar",
            latest_fetched_date=None,
        ),
        OriginHaukiResourceFactory.create(
            id=777,
            opening_hours_hash=NEVER_ANY_OPENING_HOURS_HASH,
            latest_fetched_date=None,
        ),
        OriginHaukiResourceFactory.create(
            id=666,
            opening_hours_hash="",
            latest_fetched_date=None,
        ),
    ]

    # ReservableTimeSpanClient.run() returns length of 3 (reservable time spans) for every resource,
    # so the total return value should be: 3 timespans * 2 valid resources = 6
    assert updater._create_reservable_time_spans_for_reservation_units() == 6


#######
# run #
#######


@freezegun.freeze_time("2020-01-01")
@patch_method(HaukiAPIClient.get_resources)
@patch_method(ReservableTimeSpanClient.run, return_value=[4, 5, 6])
def test__HaukiResourceHashUpdater__run(reservation_unit):
    HaukiAPIClient.get_resources.return_value = {
        "results": [
            {"id": reservation_unit.origin_hauki_resource.id, "date_periods_hash": "bar"},
        ]
    }

    updater = HaukiResourceHashUpdater()
    updater.run()

    assert updater.fetched_hauki_resources == [
        {"id": reservation_unit.origin_hauki_resource.id, "date_periods_hash": "bar"},
    ]
    assert updater.resources_updated == [reservation_unit.origin_hauki_resource]
    assert ReservableTimeSpanClient.run.call_count == 1
