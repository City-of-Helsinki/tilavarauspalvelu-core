from copy import copy

from common.utils import with_indices
from opening_hours.utils.time_span_element import TimeSpanElement


def merge_overlapping_time_span_elements(time_span_elements: list[TimeSpanElement]) -> list[TimeSpanElement]:
    """
    Merge overlapping time spans into a single time span.

    The time spans must be in chronological order.
    """
    if not time_span_elements:
        return []

    merged_time_span_elements: list[TimeSpanElement] = []
    for current_time_span in time_span_elements:
        # If the selected_list is empty, simply append the current time span
        if not merged_time_span_elements:
            merged_time_span_elements.append(current_time_span)
            continue

        # If the selected_list contains a time span that overlaps with the current time span, combine them.
        # The only time span that can overlap with the current time span is the last time span in the list.
        # ┌────────────────────────┐
        # │ LEGEND                 │
        # │ █ = Reservation        │
        # │ ▄ = Reservation Buffer │
        # │ ▁ = Reservable         │
        # ├────────────────────────┼──────────────────────────────────────────┐
        # │  ████     ->  ███████  │ Overlapping                              │
        # │    █████  ->           │ The last time span is extended           │
        # ├────────────────────────┼──────────────────────────────────────────┤
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
        # │    ███    ->           │                                          │
        # │                        │ The buffered start/end times are kept    │
        # │   █████   ->  ▄█████▄  │                                          │
        # │  ▄▄███▄▄  ->           │                                          │
        # └────────────────────────┴──────────────────────────────────────────┘
        last_time_span = merged_time_span_elements[-1]

        # Last time span overlaps with the current time span, combine them.
        if last_time_span.end_datetime >= current_time_span.start_datetime:
            # This time span is fully inside the last one.
            if last_time_span.end_datetime > current_time_span.end_datetime:
                # Even with after buffers, this time span is fully inside the last one, so it can be skipped.
                if last_time_span.buffered_end_datetime > current_time_span.buffered_end_datetime:
                    continue

                # Current time span's buffer ends after the last's buffer ends, so we can extend the last's buffer.
                buffer_delta = last_time_span.buffered_end_datetime - current_time_span.buffered_end_datetime
                last_time_span.buffer_time_after += buffer_delta
                continue

            # Extend the last time span's before buffer.
            min_buffered_dt = min(last_time_span.buffered_start_datetime, current_time_span.buffered_start_datetime)
            last_time_span.buffer_time_before = last_time_span.start_datetime - min_buffered_dt

            # Extend the last time span and it's after buffer.
            # The buffered end datetime should stay the same.
            max_buffered_dt = max(last_time_span.buffered_end_datetime, current_time_span.buffered_end_datetime)
            last_time_span.end_datetime = current_time_span.end_datetime
            last_time_span.buffer_time_after = max_buffered_dt - last_time_span.end_datetime
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
        if last_time_span.end_datetime > current_time_span.buffered_start_datetime >= last_time_span.start_datetime:
            current_time_span.buffer_time_before = current_time_span.start_datetime - last_time_span.end_datetime

        # Current time span shortens last time span's buffer
        if current_time_span.start_datetime < last_time_span.buffered_end_datetime <= current_time_span.end_datetime:
            last_time_span.buffer_time_after = current_time_span.start_datetime - last_time_span.end_datetime

        merged_time_span_elements.append(current_time_span)

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
