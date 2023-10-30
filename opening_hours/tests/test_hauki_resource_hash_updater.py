import datetime
from unittest import mock

import freezegun
import pytest

from opening_hours.models import OriginHaukiResource, ReservableTimeSpan
from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater
from opening_hours.utils.reservable_time_span_client import NEVER_ANY_OPENING_HOURS_HASH
from tests.factories.opening_hours import OriginHaukiResourceFactory, ReservableTimeSpanFactory

############
# __init__ #
############


@pytest.mark.django_db()
def test__HaukiResourceHashUpdater__init__no_params(reservation_unit):
    updater = HaukiResourceHashUpdater()

    assert list(updater.hauki_resource_ids) == [
        reservation_unit.origin_hauki_resource_id,
        reservation_unit.unit.origin_hauki_resource_id,
    ]


@pytest.mark.django_db()
def test__HaukiResourceHashUpdater__init__pass_resource_ids(reservation_unit):
    updater = HaukiResourceHashUpdater([1, 2, 3])

    assert updater.hauki_resource_ids == [1, 2, 3]


@pytest.mark.django_db()
def test__HaukiResourceHashUpdater__init__pass_empty_list(reservation_unit):
    updater = HaukiResourceHashUpdater([])

    assert updater.hauki_resource_ids == []


##########################
# _fetch_hauki_resources #
##########################


@mock.patch("opening_hours.utils.hauki_api_client.HaukiAPIClient.get_resources", return_value={"results": ["foo"]})
@pytest.mark.django_db()
def test__HaukiResourceHashUpdater__fetch_hauki_resources__single_page(mocked_get_resources, reservation_unit):
    updater = HaukiResourceHashUpdater()
    updater._fetch_hauki_resources()

    assert mocked_get_resources.call_count == 1
    assert updater.fetched_hauki_resources == ["foo"]


# First request uses `get_resources`
@mock.patch(
    "opening_hours.utils.hauki_api_client.HaukiAPIClient.get_resources",
    return_value={"results": ["foo"], "next": "page2"},
)
# Later requests use `get`
@mock.patch(
    "opening_hours.utils.hauki_api_client.HaukiAPIClient.get",
    return_value={"results": ["bar"], "next": None},
)
@pytest.mark.django_db()
def test__HaukiResourceHashUpdater__fetch_hauki_resources__multiple_pages(
    mocked_get, mocked_get_resources, reservation_unit
):
    updater = HaukiResourceHashUpdater()
    updater._fetch_hauki_resources()

    assert mocked_get_resources.call_count == 1
    assert mocked_get.call_count == 1
    assert updater.fetched_hauki_resources == ["foo", "bar"]


@mock.patch("opening_hours.utils.hauki_api_client.HaukiAPIClient.get_resources", return_value={"results": []})
@pytest.mark.django_db()
def test__HaukiResourceHashUpdater__fetch_hauki_resources__nothing_returned(mocked_get_resources, reservation_unit):
    updater = HaukiResourceHashUpdater()
    updater._fetch_hauki_resources()

    assert mocked_get_resources.call_count == 1
    assert updater.fetched_hauki_resources == []


####################################
# _update_reservation_units_hashes #
####################################


@pytest.mark.django_db()
def test__HaukiResourceHashUpdater__update_reservation_units_hashes__no_initial_hash():
    origin_hauki_resource: OriginHaukiResource = OriginHaukiResourceFactory(
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
@pytest.mark.django_db()
def test__HaukiResourceHashUpdater__update_reservation_units_hashes__hash_updated():
    origin_hauki_resource: OriginHaukiResource = OriginHaukiResourceFactory(
        id=999,
        opening_hours_hash="foo",
        latest_fetched_date=datetime.date(2019, 12, 31),
    )

    rts1 = ReservableTimeSpanFactory(
        resource=origin_hauki_resource,
        start_datetime=datetime.datetime(2019, 12, 1),
        end_datetime=datetime.datetime(2019, 12, 31),
    )
    rts2 = ReservableTimeSpanFactory(
        resource=origin_hauki_resource,
        start_datetime=datetime.datetime(2019, 12, 31),
        end_datetime=datetime.datetime(2020, 1, 1),
    )
    rts3 = ReservableTimeSpanFactory(
        resource=origin_hauki_resource,
        start_datetime=datetime.datetime(2020, 1, 1),
        end_datetime=datetime.datetime(2020, 2, 1),
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
    assert rts2.id not in existing_ids
    assert rts3.id not in existing_ids

    assert updater.resources_updated == [origin_hauki_resource]


#######################################################
# _create_reservable_time_spans_for_reservation_units #
#######################################################


@freezegun.freeze_time("2020-01-01")
@pytest.mark.django_db()
@mock.patch("opening_hours.utils.reservable_time_span_client.ReservableTimeSpanClient.run", return_value=[1, 2, 3])
def test__HaukiResourceHashUpdater__create_reservable_time_spans_for_reservation_units(mocked_run):
    updater = HaukiResourceHashUpdater()
    updater.resources_updated = [
        OriginHaukiResourceFactory(
            id=999,
            opening_hours_hash="foo",
            latest_fetched_date=datetime.date(2019, 12, 31),
        ),
        OriginHaukiResourceFactory(
            id=888,
            opening_hours_hash="bar",
            latest_fetched_date=None,
        ),
        OriginHaukiResourceFactory(
            id=777,
            opening_hours_hash=NEVER_ANY_OPENING_HOURS_HASH,
            latest_fetched_date=None,
        ),
        OriginHaukiResourceFactory(
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
@pytest.mark.django_db()
@mock.patch("opening_hours.utils.hauki_api_client.HaukiAPIClient.get_resources")
@mock.patch("opening_hours.utils.reservable_time_span_client.ReservableTimeSpanClient.run", return_value=[4, 5, 6])
def test__HaukiResourceHashUpdater__run(mocked_run, mocked_get_resources, reservation_unit):
    mocked_get_resources.return_value = {
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
    assert mocked_run.call_count == 1