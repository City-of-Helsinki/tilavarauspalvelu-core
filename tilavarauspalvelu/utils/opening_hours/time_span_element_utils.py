from __future__ import annotations

from copy import copy
from itertools import chain
from typing import TYPE_CHECKING

from utils.utils import with_indices

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.utils.opening_hours.time_span_element import TimeSpanElement


def merge_overlapping_time_span_elements(*time_span_lists: Iterable[TimeSpanElement]) -> list[TimeSpanElement]:
    """Merge overlapping time spans into a single time span."""
    # Sort the time spans chronologically, without accounting for buffers.
    time_span_elements: list[TimeSpanElement] = sorted(chain(*time_span_lists), key=lambda t: t.start_datetime)
    if not time_span_elements:
        return []

    # Go thought the list of timespans, merging any timespans whose
    # unbuffered times overlap with each other.
    merged_time_span_elements: list[TimeSpanElement] = [copy(ts) for ts in time_span_elements[:1]]
    for current in time_span_elements[1:]:
        # Must make copies of all timespans since this algorithm modifies the timespans.
        current = copy(current)
        # Current time span's unbuffered time can overlap only with the previous timespan,
        # since all previous overlapping time spans will have been merged.
        previous = merged_time_span_elements[-1]

        # ┌────────────────────────────┐
        # │ LEGEND                     │
        # │ █ = Reservation            │
        # │ ▄ = Reservation Buffer     │
        # │ ▁ = Reservable             │
        # ├────────────────────────────┼──────────────────────────────────────────┐
        # │ 1)   ████     ->  ███████  │ Overlapping.                             │
        # │         ████  ->           │ The previous time span is extended.      │
        # │                            │                                          │
        # │ 2)   ████     ->  ███████  │ Right next to each other.                │
        # │          ███  ->           │ The previous time span is extended       │
        # │                            │                                          │
        # │ 3)   ████     ->  ███████  │ Buffered start time not before previous  │
        # │       ▄▄████  ->           │ start time. Buffer discarded.            │
        # ├────────────────────────────┼──────────────────────────────────────────┤
        # │ 4)   ▄▄██▄    ->  ▄▄███▄▄  │ Buffered start and end times are the     │
        # │        ▄▄██▄  ->           │ maxima of compared time spans.           │
        # │                            │                                          │
        # │ 5)    ▄██▄▄   ->  ▄▄███▄▄  │ Current's buffers can be bigger than     │
        # │      ▄▄▄██▄▄  ->           │ the previous' on both sides.             │
        # │                            │                                          │
        # │ 6)   ▄▄██▄▄▄  ->  ▄▄███▄▄  │ Or vice versa.                           │
        # │       ▄▄██▄   ->           │                                          │
        # ├────────────────────────────┼──────────────────────────────────────────┤
        # │ 7)   ███████  ->  ███████  │ Current is fully inside the              │
        # │        ███    ->           │ previous one -> skipped.                 │
        # │                            │                                          │
        # │ 8)    █████   ->  ▄█████▄  │ Fully inside but buffers extend outside. │
        # │      ▄▄███▄▄  ->           │ Add any overlapping buffers.             │
        # └────────────────────────────┴──────────────────────────────────────────┘

        # Previous time span overlaps with (or is next to) the current time span (without buffers)
        # -> they can be merged.
        if previous.end_datetime >= current.start_datetime:
            # If the current time span has a before buffer, it might extend to
            # before the previous time span's buffered begin time (see examples 5 & 8).
            if current.buffer_time_before:
                min_buffered_start_datetime = min(previous.buffered_start_datetime, current.buffered_start_datetime)
                previous.buffer_time_before = previous.start_datetime - min_buffered_start_datetime

            # Adjust the end time and after buffer of the previous time span
            # to the maxima of the previous and current time spans' values.
            max_buffered_end_datetime = max(previous.buffered_end_datetime, current.buffered_end_datetime)
            previous.end_datetime = max(previous.end_datetime, current.end_datetime)
            previous.buffer_time_after = max_buffered_end_datetime - previous.end_datetime

            # The current time span is discarded, since it has been merged with the previous time span.
            continue

        # No unbuffered overlap, check for overlapping buffers and add the current time span to the merged list.
        # ┌────────────────────────────┬──────────────────────────────────────────┐
        # │ 1)   ████     ->  ████     │ Not overlapping                          │
        # │           ██  ->       ██  │ Current time span is added to list       │
        # ├────────────────────────────┼──────────────────────────────────────────┤
        # │ 2)   ██▄▄     ->  ██▄▄     │ Don't combine                            │
        # │        ▄▄███  ->    ▄▄███  │                                          │
        # ├────────────────────────────┼──────────────────────────────────────────┤
        # │ 3)    ██      ->   ██      │ Don't combine                            │
        # │      ▄▄▄▄▄██  ->  ▄▄▄▄▄██  │                                          │
        # ├────────────────────────────┼──────────────────────────────────────────┤
        # │ 4)   ██       ->  ██       │ Reservation shortens later buffer        │
        # │       ▄▄▄███  ->    ▄▄███  │                                          │
        # │                            │                                          │
        # │ 5)   ██▄▄▄    ->  ██▄▄     │ Reservation shortens earlier buffer      │
        # │          ███  ->      ███  │                                          │
        # └────────────────────────────┴──────────────────────────────────────────┘

        # Previous time span shortens current time span's buffer (see example 4)
        if previous.end_datetime > current.buffered_start_datetime >= previous.start_datetime:
            current.buffer_time_before = current.start_datetime - previous.end_datetime

        # Current time span shortens previous time span's buffer (see example 5)
        if current.start_datetime < previous.buffered_end_datetime <= current.end_datetime:
            previous.buffer_time_after = current.start_datetime - previous.end_datetime

        merged_time_span_elements.append(current)

    return merged_time_span_elements


def override_reservable_with_closed_time_spans(
    reservable_time_spans: list[TimeSpanElement],
    closed_time_spans: list[TimeSpanElement],
) -> list[TimeSpanElement]:
    """
    Normalize the given reservable timespans by shortening/splitting/removing them depending on if and how they
    overlap with any of the given closed time spans.

    We have no way to know if this is actually the correct way to handle conflicts, but it's our best assumption.
    e.g. Normally open every weekday, but closed on friday due to a public holiday.

    The reservable and closed time spans are not required to be chronological order.
    The reservable time spans should not have any overlapping timespans at this stage.

    Returned reservable timespans are in chronological order.
    """
    for closed_time_span in closed_time_spans:
        for reservable_index, reservable_time_span in (gen := with_indices(reservable_time_spans)):
            if reservable_time_span is None:
                continue

            # Skip the closed time spans that are fully outside the reservable time span.
            if not reservable_time_span.overlaps_with(closed_time_span):
                continue

            # The reservable time span is fully inside the closed time span, remove it.
            if reservable_time_span.fully_inside_of(closed_time_span):
                gen.delete_item(reservable_index)
                continue

            # Closed time span is fully inside the reservable time span, split the reservable time span
            # ┌────────────────────────────────────────────────────────────────────┐
            # │ █ = Closed Time Span                                               │
            # │ ▁ = Reservable Time Span                                           │
            # ├────────────────────┬───────────────────────────────────────────────┤
            # │ ▁▁▁▁▁▁▁ -> ▁▁   ▁▁ │ Closed time span inside reservable time span. │
            # │   ███   ->   ███   │ Reservable time span is split in two          │
            # ├────────────────────┼───────────────────────────────────────────────┤
            # │ ▁▁▁▁▁▁▁ -> ▁  ▁  ▁ │ Multiple closed time spans overlap            │
            # │  ██     ->  ██     │ reservable time span is split in three.       │
            # │     ██  ->     ██  │ (in different loops)                          │
            # └────────────────────┴───────────────────────────────────────────────┘
            if closed_time_span.fully_inside_of(reservable_time_span):
                new_reservable_time_span = copy(reservable_time_span)
                reservable_time_spans.append(new_reservable_time_span)
                # Split the reservable time span in two
                reservable_time_span.end_datetime = closed_time_span.buffered_start_datetime
                new_reservable_time_span.start_datetime = closed_time_span.buffered_end_datetime

            # Reservable time span starts inside the closed time span.
            # Shorten the reservable time span from the beginning
            # ┌──────────────────────────┬───────────────────────────────────┐
            # │     ▁▁▁▁   ->       ▁▁   │                                   │
            # │   ████     ->   ████     │ Reservable time span is shortened │
            # ├──────────────────────────┼───────────────────────────────────┤
            # │     ▁▁▁▁   ->     ▁▁▁▁   │ Not overlapping (or start == end) │
            # │ ████       -> ████       │ Untouched                         │
            # ├──────────────────────────┼───────────────────────────────────┤
            # │     ▁▁▁▁   ->     ▁▁▁▁   │ Overlapping from the beginning    │
            # │       ████ ->       ████ │ Handled later in the next step    │
            # └──────────────────────────┴───────────────────────────────────┘
            elif reservable_time_span.starts_inside_of(closed_time_span):
                reservable_time_span.start_datetime = closed_time_span.buffered_end_datetime

            # Reservable time span ends inside the closed time span.
            # Shorten the reservable time span from the end
            # ┌──────────────────────────┬───────────────────────────────────┐
            # │   ▁▁▁▁     ->   ▁▁       │                                   │
            # │     ████   ->     ████   │ Reservable time span is shortened │
            # ├──────────────────────────┼───────────────────────────────────┤
            # │   ▁▁▁▁     ->   ▁▁▁▁     │ Not overlapping (or end == start) │
            # │       ████ ->       ████ │ Untouched                         │
            # ├──────────────────────────┼───────────────────────────────────┤
            # │   ▁▁▁▁     ->   ▁▁▁▁     │ Overlapping from the beginning    │
            # │ ████       -> ████       │ Already handled in last step      │
            # └──────────────────────────┴───────────────────────────────────┘
            elif reservable_time_span.ends_inside_of(closed_time_span):
                reservable_time_span.end_datetime = closed_time_span.buffered_start_datetime

            # If the duration of the reservable time span is negative or zero after adjustments
            # (buffered time is ignored here), remove it.
            if reservable_time_span.start_datetime >= reservable_time_span.end_datetime:
                gen.delete_item(reservable_index)
                continue

    # Sort the time spans once more to ensure they are in chronological order.
    # Remove any timespans that have a duration of zero (or less).
    reservable_time_spans[:] = sorted(
        (ts for ts in reservable_time_spans if ts.start_datetime < ts.end_datetime),
        key=lambda ts: ts.start_datetime,
    )

    return reservable_time_spans
