from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import freezegun
import pytest
from django.conf import settings

from tilavarauspalvelu.constants import NEVER_ANY_OPENING_HOURS_HASH
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.integrations.opening_hours.hauki_resource_hash_updater import HaukiResourceHashUpdater
from tilavarauspalvelu.integrations.opening_hours.reservable_time_span_client import ReservableTimeSpanClient
from tilavarauspalvelu.models import ReservableTimeSpan
from utils.date_utils import local_date, local_datetime

from tests.factories import OriginHaukiResourceFactory, ReservableTimeSpanFactory
from tests.helpers import patch_method

if TYPE_CHECKING:
    from tilavarauspalvelu.models import OriginHaukiResource

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test__HaukiResourceHashUpdater__init__no_params(reservation_unit):
    hash_updater = HaukiResourceHashUpdater()

    assert list(hash_updater.hauki_resource_ids) == [
        reservation_unit.unit.origin_hauki_resource_id,
        reservation_unit.origin_hauki_resource_id,
    ]


def test__HaukiResourceHashUpdater__init__pass_resource_ids():
    hash_updater = HaukiResourceHashUpdater([1, 2, 3])

    assert hash_updater.hauki_resource_ids == [1, 2, 3]


def test__HaukiResourceHashUpdater__init__pass_empty_list():
    hash_updater = HaukiResourceHashUpdater([])

    assert hash_updater.hauki_resource_ids == []


@patch_method(HaukiAPIClient.get_resources)
@patch_method(ReservableTimeSpanClient.run, return_value=[])
def test__HaukiResourceHashUpdater__no_initial_hash():
    origin_hauki_resource: OriginHaukiResource = OriginHaukiResourceFactory.create(
        id=999,
        opening_hours_hash="",
        latest_fetched_date=None,
    )

    HaukiAPIClient.get_resources.return_value = {"results": [{"id": 999, "date_periods_hash": "OLD"}]}

    hash_updater = HaukiResourceHashUpdater()
    hash_updater.run()

    origin_hauki_resource.refresh_from_db()
    assert origin_hauki_resource.opening_hours_hash == "OLD"  # Hash is updated to a new one
    assert origin_hauki_resource.latest_fetched_date is None  # Not set, as ReservableTimeSpanClient.run is mocked
    assert ReservableTimeSpanClient.run.call_count == 1


@freezegun.freeze_time("2020-01-01 08:00:00")
@patch_method(HaukiAPIClient.get_resources)
@patch_method(ReservableTimeSpanClient.run, return_value=[])
def test__HaukiResourceHashUpdater__handle_existing_reservable_time_spans():
    origin_hauki_resource: OriginHaukiResource = OriginHaukiResourceFactory.create(
        id=999,
        opening_hours_hash="OLD",
        latest_fetched_date=datetime.date(2019, 12, 31),  # in the past
    )

    HaukiAPIClient.get_resources.return_value = {"results": [{"id": 999, "date_periods_hash": "UPDATED"}]}

    # In the past: Should be kept as is
    rts1 = ReservableTimeSpanFactory.create(
        resource=origin_hauki_resource,
        start_datetime=local_datetime(2019, 12, 1, 10),
        end_datetime=local_datetime(2019, 12, 31, 20),
    )
    # Overlaps with the cutoff date: should be shortened to cutoff date
    rts2 = ReservableTimeSpanFactory.create(
        resource=origin_hauki_resource,
        start_datetime=local_datetime(2019, 12, 31, 10),
        end_datetime=local_datetime(2020, 1, 1, 20),
    )
    # In the future: should be deleted
    rts3 = ReservableTimeSpanFactory.create(
        resource=origin_hauki_resource,
        start_datetime=local_datetime(2020, 1, 1, 10),
        end_datetime=local_datetime(2020, 2, 1, 20),
    )

    hash_updater = HaukiResourceHashUpdater()
    hash_updater.run()

    # Hash is updated
    origin_hauki_resource.refresh_from_db()
    assert origin_hauki_resource.opening_hours_hash == "UPDATED"
    assert origin_hauki_resource.latest_fetched_date is None  # Not set, as ReservableTimeSpanClient.run is mocked

    # All future reservable time spans are deleted
    existing_ids = ReservableTimeSpan.objects.values_list("id", flat=True)
    assert rts1.id in existing_ids
    assert rts2.id in existing_ids
    assert rts3.id not in existing_ids

    # The existing reservable time span is shortened to the cutoff DATE (not time)
    rts2.refresh_from_db()
    assert rts2.start_datetime == local_datetime(2019, 12, 31, 10)
    assert rts2.end_datetime == local_datetime(2020, 1, 1, 0)

    assert hash_updater.resources_updated == [origin_hauki_resource]
    assert ReservableTimeSpanClient.run.call_count == 1  # Tried to create time spans for the resource from Hauki API


@freezegun.freeze_time("2020-01-01")
@patch_method(HaukiAPIClient.get_resources)
@patch_method(ReservableTimeSpanClient.run, return_value=[])
def test__HaukiResourceHashUpdater__process_single_hauki_resource__hash_changed():
    hauki_resource = OriginHaukiResourceFactory.create(id=999, opening_hours_hash="OLD", latest_fetched_date=None)

    # Hash is changed so it should be updated
    HaukiAPIClient.get_resources.return_value = {"results": [{"id": 999, "date_periods_hash": "UPDATED"}]}

    hash_updater = HaukiResourceHashUpdater()
    hash_updater.run()

    assert hash_updater.resources_updated == [hauki_resource]
    assert ReservableTimeSpanClient.run.call_count == 1


@freezegun.freeze_time("2020-01-01")
@patch_method(HaukiAPIClient.get_resources)
@patch_method(ReservableTimeSpanClient.run, return_value=[])
def test__HaukiResourceHashUpdater__process_single_hauki_resource__hash_unchanged__no_latest_fetched_date():
    hauki_resource = OriginHaukiResourceFactory.create(id=999, opening_hours_hash="OLD", latest_fetched_date=None)

    # Hash not changed, but has no latest_fetched_date so it should be updated
    HaukiAPIClient.get_resources.return_value = {"results": [{"id": 999, "date_periods_hash": "OLD"}]}

    hash_updater = HaukiResourceHashUpdater()
    hash_updater.run()

    assert hash_updater.resources_updated == [hauki_resource]
    assert ReservableTimeSpanClient.run.call_count == 1


@freezegun.freeze_time("2020-01-01")
@patch_method(HaukiAPIClient.get_resources)
@patch_method(ReservableTimeSpanClient.run, return_value=[])
def test__HaukiResourceHashUpdater__process_single_hauki_resource__hash_unchanged__latest_fetched_date_is_stale():
    hauki_resource = OriginHaukiResourceFactory.create(
        id=999, opening_hours_hash="OLD", latest_fetched_date=local_date()
    )

    # Hash not changed, but latest_fetched_date is early enough to warrant an update
    HaukiAPIClient.get_resources.return_value = {"results": [{"id": 999, "date_periods_hash": "OLD"}]}

    hash_updater = HaukiResourceHashUpdater()
    hash_updater.run()

    assert hash_updater.resources_updated == [hauki_resource]
    assert ReservableTimeSpanClient.run.call_count == 1


@freezegun.freeze_time("2020-01-01")
@patch_method(HaukiAPIClient.get_resources)
@patch_method(ReservableTimeSpanClient.run, return_value=[])
def test__HaukiResourceHashUpdater__process_single_hauki_resource__hash_unchanged__latest_fetched_date_is_up_to_date():
    cutoff_date = local_date() + datetime.timedelta(days=settings.HAUKI_DAYS_TO_FETCH + 1)  # Late enough to not update

    OriginHaukiResourceFactory.create(id=999, opening_hours_hash="OLD", latest_fetched_date=cutoff_date)

    # Hash not changed and latest_fetched_date late enough to not warrant an update
    HaukiAPIClient.get_resources.return_value = {"results": [{"id": 999, "date_periods_hash": "OLD"}]}

    hash_updater = HaukiResourceHashUpdater()
    hash_updater.run()

    assert hash_updater.resources_updated == []
    assert ReservableTimeSpanClient.run.call_count == 0


@freezegun.freeze_time("2020-01-01")
@patch_method(HaukiAPIClient.get_resources)
@patch_method(ReservableTimeSpanClient.run, return_value=[])
def test__HaukiResourceHashUpdater__process_single_hauki_resource__hash_updated__never_any_opening_hours_hash():
    hauki_resource = OriginHaukiResourceFactory.create(id=999, opening_hours_hash="OLD", latest_fetched_date=None)

    # Hash is updated, but is known to not have hours
    HaukiAPIClient.get_resources.return_value = {
        "results": [{"id": 999, "date_periods_hash": NEVER_ANY_OPENING_HOURS_HASH}]
    }

    hash_updater = HaukiResourceHashUpdater()
    hash_updater.run()

    assert hash_updater.resources_updated == [hauki_resource]
    assert ReservableTimeSpanClient.run.call_count == 0  # Not called, due to hash being known to not have hours
