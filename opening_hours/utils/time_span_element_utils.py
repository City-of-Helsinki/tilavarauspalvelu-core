from collections.abc import Iterable
from copy import copy
from itertools import chain

from common.utils import with_indices
from opening_hours.utils.time_span_element import TimeSpanElement


def merge_overlapping_time_span_elements(*time_spans: Iterable[TimeSpanElement]) -> list[TimeSpanElement]:
    """Merge overlapping time spans into a single time span."""
    # Sort the time spans in chronological order.
    time_span_elements = sorted(chain(*time_spans), key=lambda ts: ts.start_datetime)
    if not time_span_elements:
        return []

    merged_time_span_elements: list[TimeSpanElement] = [copy(ts) for ts in time_span_elements[:1]]
    for current in time_span_elements[1:]:
        # Must make copies of all timespans since this algorithm modifies the timespans.
        current = copy(current)
        # The only time span that can overlap with the current time span is the last time span in the list.
        previous = merged_time_span_elements[-1]

        # ┌────────────────────────┐
        # │ LEGEND                 │
        # │ █ = Reservation        │
        # │ ▄ = Reservation Buffer │
        # │ ▁ = Reservable         │
        # ├────────────────────────┼──────────────────────────────────────────┐
        # │  ████     ->  ███████  │ Overlapping                              │
        # │    █████  ->           │ The last time span is extended           │
        # │                        │                                          │
        # │  ████     ->  ███████  │ Current time span ends at the same time  │
        # │      ███  ->           │ as the last last time span ends.         │
        # │                        │ The last time span is extended           │
        # │  ▄▄██▄▄   ->  ▄▄████▄  │                                          │
        # │    ▄▄██▄  ->           │ Time span will override any buffer times │
        # │                        │                                          │
        # │  ▄▄██▄▄▄  ->  ▄▄████▄  │ The 'before buffer' start time and       │
        # │  ▄▄▄███   ->           │ the 'after buffer' end time              │
        # │                        │ should not be changed                    │
        # │   ▄██▄▄▄  ->  ▄▄███▄▄  │                                          │
        # │  ▄▄▄██▄▄  ->           │                                          │
        # ├────────────────────────┼──────────────────────────────────────────┤
        # │  ███████  ->  ███████  │ Time span is fully inside the last one   │
        # │    ███    ->           │ Later can be skipped                     │
        # │                        │                                          │
        # │   █████   ->  ▄█████▄  │ Buffers extend outside earlier time span │
        # │  ▄▄███▄▄  ->           │ The buffered start/end times are kept    │
        # └────────────────────────┴──────────────────────────────────────────┘
        # Last time span overlaps with the current time span, so they can be merged.
        if previous.end_datetime >= current.start_datetime:
            # Adjust the before buffer of the last time span
            if current.buffer_time_before:
                min_buffered_dt = min(previous.buffered_start_datetime, current.buffered_start_datetime)
                previous.buffer_time_before = previous.start_datetime - min_buffered_dt

            # Adjust the after buffer of the last time span
            # If the current time span ends after the last time span ends, extend the last time span's end datetime.
            max_buffered_dt = max(previous.buffered_end_datetime, current.buffered_end_datetime)
            previous.end_datetime = max(previous.end_datetime, current.end_datetime)
            previous.buffer_time_after = max_buffered_dt - previous.end_datetime

            # The current time span is discarded after the above adjustments.
            continue

        # No overlapping time spans, check for overlapping buffers and add the current time span to the merged list.
        # ┌────────────────────────┬──────────────────────────────────────────┐
        # │  ████     ->  ████     │ Not overlapping                          │
        # │       ██  ->       ██  │ Current time span is added to list       │
        # ├────────────────────────┼──────────────────────────────────────────┤
        # │  ██▄▄     ->  ██▄▄     │ Don't combine                            │
        # │    ▄▄███  ->    ▄▄███  │                                          │
        # ├────────────────────────┼──────────────────────────────────────────┤
        # │   ██      ->   ██      │ Don't combine                            │
        # │  ▄▄▄▄▄██  ->  ▄▄▄▄▄██  │                                          │
        # ├────────────────────────┼──────────────────────────────────────────┤
        # │  ██       ->  ██       │ Reservation shortens later buffer        │
        # │   ▄▄▄███  ->    ▄▄███  │                                          │
        # │                        │                                          │
        # │  ██▄▄▄    ->  ██▄▄     │ Reservation shortens earlier buffer      │
        # │      ███  ->      ███  │                                          │
        # └────────────────────────┴──────────────────────────────────────────┘

        # Last time span shortens current time span's buffer
        if previous.end_datetime > current.buffered_start_datetime >= previous.start_datetime:
            current.buffer_time_before = current.start_datetime - previous.end_datetime

        # Current time span shortens last time span's buffer
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
