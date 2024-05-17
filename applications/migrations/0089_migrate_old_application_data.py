from __future__ import annotations

import datetime
import logging
from typing import TYPE_CHECKING

from django.db import migrations

from common.date_utils import time_as_timedelta

if TYPE_CHECKING:
    from applications import models


logger = logging.getLogger(__name__)


def migrate_application_data(apps, schema_editor):
    # Migrate application events

    ApplicationEvent: type[models.ApplicationEvent]
    ApplicationEvent = apps.get_model("applications", "ApplicationEvent")
    ApplicationSection: type[models.ApplicationSection]
    ApplicationSection = apps.get_model("applications", "ApplicationSection")

    application_sections: dict[int, models.ApplicationSection] = {}

    def coerce_duration(duration: datetime.timedelta | None) -> datetime.timedelta:
        if duration is None:
            return datetime.timedelta()

        # If the duration is not a multiple of 30 minutes,
        # round it up to the nearest multiple of 30 minutes
        whole_30_mins, remainder_seconds = divmod(duration.total_seconds(), 30 * 60)
        minutes = (int(whole_30_mins) + (1 if remainder_seconds > 0 else 0)) * 30
        return datetime.timedelta(minutes=minutes)

    for application_event in ApplicationEvent.objects.all():
        min_duration = coerce_duration(application_event.min_duration)
        max_duration = coerce_duration(application_event.max_duration)

        application_sections[application_event.id] = ApplicationSection(
            name=application_event.name,
            num_persons=application_event.num_persons or 0,
            reservation_min_duration=min_duration,
            reservation_max_duration=max_duration,
            reservations_begin_date=application_event.begin,
            reservations_end_date=application_event.end,
            applied_reservations_per_week=max(min(application_event.events_per_week, 7), 1),
            application=application_event.application,
            purpose=application_event.purpose,
            age_group=application_event.age_group,
        )

    # Bulk create will populate ids to the objects in `application_sections` as well
    ApplicationSection.objects.bulk_create(application_sections.values())

    # Migrate event reservation units

    EventReservationUnit: type[models.EventReservationUnit]
    EventReservationUnit = apps.get_model("applications", "EventReservationUnit")
    ReservationUnitOption: type[models.ReservationUnitOption]
    ReservationUnitOption = apps.get_model("applications", "ReservationUnitOption")

    reservation_unit_options: dict[tuple[int, int], models.ReservationUnitOption] = {}

    for event_reservation_unit in EventReservationUnit.objects.all():
        # (reservation_unit_id, application_event_id)
        key = (event_reservation_unit.reservation_unit.id, event_reservation_unit.application_event.id)

        section = application_sections.get(event_reservation_unit.application_event.id)
        if section is None:
            msg = (
                f"Application section not found for "
                f"application event id {event_reservation_unit.application_event.id}."
            )
            logger.critical(msg)
            continue

        reservation_unit_options[key] = ReservationUnitOption(
            preferred_order=event_reservation_unit.preferred_order,
            application_section=section,
            reservation_unit=event_reservation_unit.reservation_unit,
        )

    # Bulk create will populate ids to the objects in `reservation_unit_options` as well
    ReservationUnitOption.objects.bulk_create(reservation_unit_options.values())

    # Migrate application event schedules

    ApplicationEventSchedule: type[models.ApplicationEventSchedule]
    ApplicationEventSchedule = apps.get_model("applications", "ApplicationEventSchedule")
    AllocatedTimeSlot: type[models.AllocatedTimeSlot]
    AllocatedTimeSlot = apps.get_model("applications", "AllocatedTimeSlot")
    SuitableTimeRange: type[models.SuitableTimeRange]
    SuitableTimeRange = apps.get_model("applications", "SuitableTimeRange")

    allocated_time_slots: list[models.AllocatedTimeSlot] = []
    suitable_time_ranges: list[models.SuitableTimeRange] = []

    for schedule in ApplicationEventSchedule.objects.all():
        section = application_sections.get(schedule.application_event.id)
        if section is None:
            msg = f"Application section not found for application event id {schedule.application_event.id}."
            logger.critical(msg)
            continue

        begin_time: datetime.time = schedule.begin
        end_time: datetime.time = schedule.end

        # If times are not a multiple of 60 minutes, convert them to the last multiple of 60 minutes
        if time_as_timedelta(begin_time).total_seconds() % 3600 != 0:
            msg = (
                f"Begin time {begin_time.isoformat()} for schedule {schedule.id} is not exactly at the hour mark. "
                f"Converting it to the last hour mark..."
            )
            logger.warning(msg)
            begin_time = begin_time.replace(minute=0, second=0, microsecond=0)

        if time_as_timedelta(end_time).total_seconds() % 3600 != 0:
            msg = (
                f"End time {end_time.isoformat()} for schedule {schedule.id} is not exactly at the hour mark. "
                f"Converting it to the last hour mark..."
            )
            logger.warning(msg)
            end_time = end_time.replace(minute=0, second=0, microsecond=0)

        # Handle cases where end is at 00:00 and begin is not -> interpret start as previous day.
        # Still, both can't be at 00:00, or any other time, at the same time.
        if (end_time != datetime.time() and begin_time >= end_time) or begin_time == end_time:
            msg = (
                f"Suitable begin time {begin_time.isoformat()} for schedule {schedule.id} "
                f"is at or after suitable end time {end_time.isoformat()}."
            )
            logger.critical(msg)
            continue

        suitable_time_ranges.append(
            SuitableTimeRange(
                priority="PRIMARY" if schedule.priority == 300 else "SECONDARY",
                day_of_the_week=(
                    "MONDAY"
                    if schedule.day == 0
                    else "TUESDAY"
                    if schedule.day == 1
                    else "WEDNESDAY"
                    if schedule.day == 2
                    else "THURSDAY"
                    if schedule.day == 3
                    else "FRIDAY"
                    if schedule.day == 4
                    else "SATURDAY"
                    if schedule.day == 5
                    else "SUNDAY"
                ),
                begin_time=begin_time,
                end_time=end_time,
                application_section=section,
            )
        )

        if (
            schedule.allocated_day is not None
            and schedule.allocated_begin is not None
            and schedule.allocated_end is not None
            and schedule.allocated_reservation_unit is not None
        ):
            # (reservation_unit_id, application_event_id)
            key = (schedule.allocated_reservation_unit.id, schedule.application_event.id)
            option = reservation_unit_options.get(key)
            if option is None:
                msg = (
                    f"Reservation unit option not found for "
                    f"reservation unit id {schedule.allocated_reservation_unit.id} and "
                    f"application event id {schedule.application_event.id}"
                )
                logger.critical(msg)
                continue

            allocated_begin_time: datetime.time = schedule.begin
            allocated_end_time: datetime.time = schedule.end

            # Handle cases where end is at 00:00 and begin is not -> interpret start as previous day.
            # Still, both can't be at 00:00, or any other time, at the same time.
            if (allocated_end_time != datetime.time() and allocated_begin_time >= allocated_end_time) or (
                allocated_begin_time == allocated_end_time
            ):
                msg = (
                    f"Allocated begin time {allocated_begin_time.isoformat()} is "
                    f"at or after allocated end time {allocated_end_time.isoformat()}."
                )
                logger.critical(msg)
                continue

            allocated_time_slots.append(
                AllocatedTimeSlot(
                    day_of_the_week=(
                        "MONDAY"
                        if schedule.allocated_day == 0
                        else "TUESDAY"
                        if schedule.allocated_day == 1
                        else "WEDNESDAY"
                        if schedule.allocated_day == 2
                        else "THURSDAY"
                        if schedule.allocated_day == 3
                        else "FRIDAY"
                        if schedule.allocated_day == 4
                        else "SATURDAY"
                        if schedule.allocated_day == 5
                        else "SUNDAY"
                    ),
                    begin_time=allocated_begin_time,
                    end_time=allocated_end_time,
                    reservation_unit_option=option,
                )
            )

    AllocatedTimeSlot.objects.bulk_create(allocated_time_slots)
    SuitableTimeRange.objects.bulk_create(suitable_time_ranges)


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0088_applicationround_notes_when_applying_and_more"),
    ]

    operations = [
        migrations.RunPython(migrate_application_data, migrations.RunPython.noop),
    ]
