from tilavarauspalvelu.utils.opening_hours.time_span_element import TimeSpanElement
from tilavarauspalvelu.utils.opening_hours.time_span_element_utils import override_reservable_with_closed_time_spans

from tests.test_external_services.test_hauki.test_reservable_time_spans_client import (
    _get_date,
    _get_normalised_time_spans,
    _get_reservable_and_closed_time_spans,
)


def test__override_reservable_with_closed_time_spans():
    reservable_time_spans, closed_time_spans = _get_reservable_and_closed_time_spans()

    normalised_time_spans = override_reservable_with_closed_time_spans(reservable_time_spans, closed_time_spans)

    assert normalised_time_spans == _get_normalised_time_spans()


def test__override_reservable_with_closed_time_spans__not_overlapping():
    reservable_time_spans = [
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=12),
            is_reservable=True,
        ),
    ]

    closed_time_spans = [
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=12),
            end_datetime=_get_date(day=1, hour=14),
            is_reservable=False,
        ),
    ]

    normalised_time_spans = override_reservable_with_closed_time_spans(reservable_time_spans, closed_time_spans)

    assert normalised_time_spans == [
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=12),
            is_reservable=True,
        ),
    ]


def test__override_reservable_with_closed_time_spans__partial_overlap_same_start_or_end():
    reservable_time_spans = [
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=12),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=10),
            end_datetime=_get_date(day=2, hour=12),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=3, hour=10),
            end_datetime=_get_date(day=3, hour=12),
            is_reservable=True,
        ),
    ]

    closed_time_spans = [
        # Both start and end are the same
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=12),
            is_reservable=False,
        ),
        # Only same start
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=10),
            end_datetime=_get_date(day=2, hour=11),
            is_reservable=False,
        ),
        # Only same end
        TimeSpanElement(
            start_datetime=_get_date(day=3, hour=11),
            end_datetime=_get_date(day=3, hour=12),
            is_reservable=False,
        ),
    ]

    normalised_time_spans = override_reservable_with_closed_time_spans(reservable_time_spans, closed_time_spans)

    assert normalised_time_spans == [
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=11),
            end_datetime=_get_date(day=2, hour=12),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=3, hour=10),
            end_datetime=_get_date(day=3, hour=11),
            is_reservable=True,
        ),
    ]


def test__override_reservable_with_closed_time_spans__full_overlap_same_start_or_end():
    reservable_time_spans = [
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=12),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=10),
            end_datetime=_get_date(day=2, hour=12),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=3, hour=10),
            end_datetime=_get_date(day=3, hour=12),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=4, hour=21),
            end_datetime=_get_date(day=4, hour=22),
            is_reservable=True,
        ),
    ]

    closed_time_spans = [
        # Both start and end are inside the closed time span
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=8),
            end_datetime=_get_date(day=1, hour=14),
            is_reservable=False,
        ),
        # Only same start
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=10),
            end_datetime=_get_date(day=2, hour=14),
            is_reservable=False,
        ),
        # Only same end
        TimeSpanElement(
            start_datetime=_get_date(day=3, hour=8),
            end_datetime=_get_date(day=3, hour=12),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=4, hour=0),
            end_datetime=_get_date(day=5, hour=0),
            is_reservable=False,
        ),
    ]

    normalised_time_spans = override_reservable_with_closed_time_spans(reservable_time_spans, closed_time_spans)

    assert normalised_time_spans == []


def test__override_reservable_with_closed_time_spans__reservable_split_into_many_parts():
    reservable_time_spans = [
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=2, hour=0),
            is_reservable=True,
        ),
    ]

    closed_time_spans = [
        # Shorten from the beginning
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=12),
            is_reservable=False,
        ),
        # Split into two
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=14),
            end_datetime=_get_date(day=1, hour=16),
            is_reservable=False,
        ),
        # Shorten the split reservable time span from the start
        # (This could never happen in real life, as it would be combined with the previous closed time span)
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=16),
            end_datetime=_get_date(day=1, hour=18),
            is_reservable=False,
        ),
        # Split (now three parts)
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=20),
            end_datetime=_get_date(day=1, hour=22),
            is_reservable=False,
        ),
    ]

    normalised_time_spans = override_reservable_with_closed_time_spans(reservable_time_spans, closed_time_spans)

    assert normalised_time_spans == [
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=12),
            end_datetime=_get_date(day=1, hour=14),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=18),
            end_datetime=_get_date(day=1, hour=20),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=22),
            end_datetime=_get_date(day=2, hour=0),
            is_reservable=True,
        ),
    ]
