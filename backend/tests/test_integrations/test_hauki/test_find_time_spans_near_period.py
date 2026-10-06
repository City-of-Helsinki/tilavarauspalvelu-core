from __future__ import annotations

import datetime

from tilavarauspalvelu.integrations.opening_hours.time_span_element import TimeSpanElement
from tilavarauspalvelu.integrations.opening_hours.time_span_element_utils import (
    find_time_spans_near_period,
    merge_overlapping_time_span_elements,
)

from tests.test_integrations.test_hauki.test_reservable_time_spans_client import _get_date


def test__find_time_spans_near_period__touching_time_spans_are_skipped():
    ends_at_period_start = TimeSpanElement(
        start_datetime=_get_date(day=1, hour=8),
        end_datetime=_get_date(day=1, hour=10),
        is_reservable=False,
    )
    inside_period = TimeSpanElement(
        start_datetime=_get_date(day=1, hour=11),
        end_datetime=_get_date(day=1, hour=12),
        is_reservable=False,
    )
    starts_at_period_end = TimeSpanElement(
        start_datetime=_get_date(day=1, hour=14),
        end_datetime=_get_date(day=1, hour=16),
        is_reservable=False,
    )
    time_spans = merge_overlapping_time_span_elements(
        [ends_at_period_start, inside_period, starts_at_period_end],
    )

    nearby_time_spans = find_time_spans_near_period(
        time_spans,
        start_datetime=_get_date(day=1, hour=10),
        end_datetime=_get_date(day=1, hour=14),
        longest_buffer=datetime.timedelta(),
    )

    assert nearby_time_spans == [inside_period]


def test__find_time_spans_near_period__long_buffer_reaches_past_a_later_time_span():
    earlier_day = TimeSpanElement(
        start_datetime=_get_date(day=1, hour=8),
        end_datetime=_get_date(day=1, hour=9),
        is_reservable=False,
    )
    long_buffer_after = TimeSpanElement(
        start_datetime=_get_date(day=2, hour=8),
        end_datetime=_get_date(day=2, hour=9),
        is_reservable=False,
        buffer_time_after=datetime.timedelta(hours=6),
    )
    short_without_buffer = TimeSpanElement(
        start_datetime=_get_date(day=2, hour=10),
        end_datetime=_get_date(day=2, hour=10, minute=30),
        is_reservable=False,
    )
    later_day = TimeSpanElement(
        start_datetime=_get_date(day=3, hour=10),
        end_datetime=_get_date(day=3, hour=11),
        is_reservable=False,
    )
    time_spans = merge_overlapping_time_span_elements(
        [earlier_day, long_buffer_after, short_without_buffer, later_day],
    )

    nearby_time_spans = find_time_spans_near_period(
        time_spans,
        start_datetime=_get_date(day=2, hour=14),
        end_datetime=_get_date(day=2, hour=16),
        longest_buffer=datetime.timedelta(hours=6),
    )

    assert nearby_time_spans == [long_buffer_after, short_without_buffer]
