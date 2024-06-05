from datetime import timedelta

from opening_hours.utils.time_span_element import TimeSpanElement
from opening_hours.utils.time_span_element_utils import merge_overlapping_time_span_elements
from tests.test_external_services.test_hauki.test_reservable_time_spans_client import _get_date

# No buffers


def test__merge_overlapping_time_span_elements__no_buffers__ends_and_starts_at_the_same_time():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=14),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=14),
            end_datetime=_get_date(hour=16),
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=16),
            is_reservable=False,
        )
    ]


def test__merge_overlapping_time_span_elements__no_buffers__overlapping():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=15),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=13),
            end_datetime=_get_date(hour=16),
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=16),
            is_reservable=False,
        )
    ]


def test__merge_overlapping_time_span_elements__no_buffers__fully_inside():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=10),
            end_datetime=_get_date(hour=20),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=14),
            end_datetime=_get_date(hour=16),
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == [
        TimeSpanElement(
            start_datetime=_get_date(hour=10),
            end_datetime=_get_date(hour=20),
            is_reservable=False,
        )
    ]


def test__merge_overlapping_time_span_elements__no_buffers__not_combined():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=14),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=15),
            end_datetime=_get_date(hour=16),
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == time_span_elements


# With buffers


def test__merge_overlapping_time_span_elements__buffers__start_and_end_at_the_same_time():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=14),
            buffer_time_before=timedelta(hours=1),
            buffer_time_after=timedelta(hours=1),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=14),
            end_datetime=_get_date(hour=16),
            buffer_time_before=timedelta(hours=1),
            buffer_time_after=timedelta(hours=1),
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=16),
            buffer_time_before=timedelta(hours=1),
            buffer_time_after=timedelta(hours=1),
            is_reservable=False,
        )
    ]


def test__merge_overlapping_time_span_elements__buffers__start_and_end_at_the_same_time__before_buffer_shortened():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=14),
            buffer_time_before=timedelta(hours=1),  # 11:00
            buffer_time_after=timedelta(hours=1),  # 15:00
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=14),
            end_datetime=_get_date(hour=16),
            buffer_time_before=timedelta(hours=4),  # 10:00
            buffer_time_after=timedelta(hours=4),  # 20:00
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=16),
            buffer_time_before=timedelta(hours=2),  # 10:00
            buffer_time_after=timedelta(hours=4),  # 20:00
            is_reservable=False,
        )
    ]


def test__merge_overlapping_time_span_elements__buffers__start_and_end_at_the_same_time__after_buffer_shortened():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=14),
            buffer_time_before=timedelta(hours=4),  # 08:00
            buffer_time_after=timedelta(hours=4),  # 18:00
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=14),
            end_datetime=_get_date(hour=16),
            buffer_time_before=timedelta(hours=1),  # 13:00
            buffer_time_after=timedelta(hours=1),  # 17:00
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=16),
            buffer_time_before=timedelta(hours=4),  # 08:00
            buffer_time_after=timedelta(hours=2),  # 18:00
            is_reservable=False,
        )
    ]


def test__merge_overlapping_time_span_elements__buffers__overlapping():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=15),
            buffer_time_before=timedelta(hours=1),
            buffer_time_after=timedelta(hours=1),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=13),
            end_datetime=_get_date(hour=16),
            buffer_time_before=timedelta(hours=1),
            buffer_time_after=timedelta(hours=1),
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=16),
            buffer_time_before=timedelta(hours=1),
            buffer_time_after=timedelta(hours=1),
            is_reservable=False,
        )
    ]


def test__merge_overlapping_time_span_elements__buffers__not_overlapping__reservation_in_before_buffer__no_changes():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=13),
            buffer_time_before=timedelta(),
            buffer_time_after=timedelta(),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=14),
            end_datetime=_get_date(hour=15),
            buffer_time_before=timedelta(hours=4),
            buffer_time_after=timedelta(),
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == time_span_elements


def test__merge_overlapping_time_span_elements__buffers__not_overlapping__reservation_in_after_buffer__no_changes():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=13),
            buffer_time_before=timedelta(),
            buffer_time_after=timedelta(hours=4),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=14),
            end_datetime=_get_date(hour=15),
            buffer_time_before=timedelta(),
            buffer_time_after=timedelta(),
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == time_span_elements


def test__merge_overlapping_time_span_elements__buffers__not_overlapping__reservation_in_before_buffer__shortened():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=13),
            buffer_time_before=timedelta(),
            buffer_time_after=timedelta(),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=14),
            end_datetime=_get_date(hour=15),
            buffer_time_before=timedelta(hours=2),  # 12:00
            buffer_time_after=timedelta(),
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=13),
            buffer_time_before=timedelta(),
            buffer_time_after=timedelta(),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=14),
            end_datetime=_get_date(hour=15),
            buffer_time_before=timedelta(hours=1),  # 13:00
            buffer_time_after=timedelta(),
            is_reservable=False,
        ),
    ]


def test__merge_overlapping_time_span_elements__buffers__not_overlapping__reservation_in_after_buffer__shortened():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=13),
            buffer_time_before=timedelta(),
            buffer_time_after=timedelta(hours=2),  # 15:00
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=14),
            end_datetime=_get_date(hour=15),
            buffer_time_before=timedelta(),
            buffer_time_after=timedelta(),
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == [
        TimeSpanElement(
            start_datetime=_get_date(hour=12),
            end_datetime=_get_date(hour=13),
            buffer_time_before=timedelta(),
            buffer_time_after=timedelta(hours=1),  # 14:00
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=14),
            end_datetime=_get_date(hour=15),
            buffer_time_before=timedelta(),
            buffer_time_after=timedelta(),
            is_reservable=False,
        ),
    ]


def test__merge_overlapping_time_span_elements__buffers__fully_inside__buffers_are_preserved():
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=10),
            end_datetime=_get_date(hour=20),
            buffer_time_before=timedelta(),
            buffer_time_after=timedelta(),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=11),
            end_datetime=_get_date(hour=19),
            buffer_time_before=timedelta(hours=2),  # 09:00
            buffer_time_after=timedelta(hours=2),  # 21:00
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == [
        TimeSpanElement(
            start_datetime=_get_date(hour=10),
            end_datetime=_get_date(hour=20),
            buffer_time_before=timedelta(hours=1),  # 09:00
            buffer_time_after=timedelta(hours=1),  # 21:00
            is_reservable=False,
        ),
    ]


def test__merge_overlapping_time_span_elements__buffers__fully_inside__buffer_are_adjusted():
    # TODO: Add images to tests
    time_span_elements = [
        TimeSpanElement(
            start_datetime=_get_date(hour=10),
            end_datetime=_get_date(hour=20),
            buffer_time_before=timedelta(hours=2),
            buffer_time_after=timedelta(hours=2),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(hour=11),
            end_datetime=_get_date(hour=21),
            buffer_time_before=timedelta(),
            buffer_time_after=timedelta(),
            is_reservable=False,
        ),
    ]

    assert merge_overlapping_time_span_elements(time_span_elements) == [
        TimeSpanElement(
            start_datetime=_get_date(hour=10),
            end_datetime=_get_date(hour=21),
            buffer_time_before=timedelta(hours=2),  # 08:00
            buffer_time_after=timedelta(hours=1),  # 22:00
            is_reservable=False,
        ),
    ]
