from csv import writer
from pathlib import Path
from typing import List

from django.conf import settings
from django.db.models import OuterRef, Subquery
from django.utils import timezone

from ..models import (
    PRIORITIES,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    EventReservationUnit,
)


class ApplicationDataExporter:
    @classmethod
    def export_application_data(cls, application_round: int) -> None:
        now = timezone.now()
        root = Path(settings.BASE_DIR)
        path = root / "exports" / "applications" / f"{now.strftime('%d-%m-%Y')}"
        path.mkdir(parents=True, exist_ok=True)

        application_events_base_query = (
            ApplicationEvent.objects.filter(
                application__application_round=application_round
            )
            .select_related(
                "application",
                "application__organisation",
                "application__contact_person",
                "application__application_round",
                "purpose",
                "age_group",
            )
            .order_by("application__organisation__name")
        )

        # Loop through all priorities to write one file for each of the priority level
        for priority_constant, _ in PRIORITIES.PRIORITY_CHOICES:
            application_events: List[ApplicationEvent] = list(
                application_events_base_query.alias(
                    first_schedule_id=Subquery(
                        ApplicationEventSchedule.objects.filter(
                            application_event=OuterRef("id"), priority=priority_constant
                        ).values("id")[:1]
                    )
                ).filter(first_schedule_id__isnull=False)
            )

            if len(application_events):
                priority_name = PRIORITIES.get_priority_name_from_constant(
                    priority_constant
                ).upper()
                file_name = (
                    "application_data"
                    f"_round_{application_round}"
                    f"_priority_{priority_name}"
                    ".csv"
                )

                with open(path / file_name, "w", newline="") as applications_file:
                    applications_writer = writer(applications_file)

                    cls._write_header_row(applications_writer, priority_name)

                    for event in application_events:
                        application: Application = event.application
                        min_duration_string = (
                            cls._get_duration_string(event.min_duration.seconds)
                            if event.min_duration
                            else ""
                        )
                        max_duration_string = (
                            cls._get_duration_string(event.max_duration.seconds)
                            if event.max_duration
                            else ""
                        )
                        duration_range_string = cls._get_time_range_string(
                            min_duration_string, max_duration_string
                        )
                        event_schedules = {
                            0: "",
                            1: "",
                            2: "",
                            3: "",
                            4: "",
                            5: "",
                            6: "",
                        }
                        reservation_units = {
                            0: "",
                            1: "",
                            2: "",
                        }
                        contact_person_first_name = ""
                        contact_person_last_name = ""
                        contact_person_email = ""
                        event_begin = (
                            f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                            if event.begin
                            else ""
                        )
                        event_end = (
                            f"{event.end.day}.{event.end.month}.{event.end.year}"
                            if event.end
                            else ""
                        )

                        if application.contact_person:
                            contact_person_first_name = (
                                application.contact_person.first_name
                            )
                            contact_person_last_name = (
                                application.contact_person.last_name
                            )
                            contact_person_email = getattr(
                                application.contact_person, "email", ""
                            )

                        # Loop through requested schedules and update
                        # the correct time range string depending on day integer
                        schedule: ApplicationEventSchedule
                        for schedule in (
                            event.application_event_schedules.filter(
                                priority=priority_constant
                            )
                            .order_by("begin")
                            .only("begin", "end", "day")
                        ):
                            time_range_string = cls._get_time_range_string(
                                schedule.begin.strftime("%H:%M"),
                                schedule.end.strftime("%H:%M"),
                            )

                            # For multiple schedules on the same day, separate them by comma
                            if event_schedules[schedule.day]:
                                time_range_string = f"{event_schedules[schedule.day]}, {time_range_string}"

                            event_schedules.update({schedule.day: time_range_string})

                        # Loop through event reservation units and update strings
                        # by priority.
                        # Limit reservation units to three first units.
                        event_reservation_unit: EventReservationUnit
                        for i, event_reservation_unit in enumerate(
                            event.event_reservation_units.all()
                            .select_related("reservation_unit")
                            .order_by("priority")
                            .only("reservation_unit__name")[:3]
                        ):
                            reservation_units[
                                i
                            ] = event_reservation_unit.reservation_unit.name

                        # Write application event to CSV file
                        applications_writer.writerow(
                            [
                                application.id,
                                getattr(application.organisation, "name", ""),
                                contact_person_first_name,
                                contact_person_last_name,
                                contact_person_email,
                                event.name,
                                cls._get_time_range_string(event_begin, event_end),
                                getattr(application.home_city, "name", ""),
                                getattr(event.purpose, "name", ""),
                                event.age_group,
                                application.applicant_type,
                                event.events_per_week,
                                duration_range_string,
                                reservation_units[0],
                                reservation_units[1],
                                reservation_units[2],
                                event_schedules[0],
                                event_schedules[1],
                                event_schedules[2],
                                event_schedules[3],
                                event_schedules[4],
                                event_schedules[5],
                                event_schedules[6],
                            ]
                        )

    @staticmethod
    def _write_header_row(writer, priority: str):
        # Write header rows
        writer.writerow(
            [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                f"haetut ajat prioriteetilla: {priority}",
            ]
        )
        writer.writerow(
            [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "KAIKKI TILAT",
            ]
        )
        writer.writerow(
            [
                "hakemuksen numero",
                "hakija",
                "yhteyshenkilö etunimi",
                "yhteyshenkilö sukunimi",
                "sähköpostiosoite",
                "varauksen nimi",
                "hakijan ilmoittama kausi",
                "kotikunta",
                "vuoronkäyttötarkoitus",
                "ikäryhmä",
                "hakijan tyyppi",
                "vuoroja, kpl / vko",
                "aika",
                "tilatoive 1",
                "tilatoive 2",
                "tilatoive 3",
                "ma",
                "ti",
                "ke",
                "to",
                "pe",
                "la",
                "su",
            ]
        )

    @staticmethod
    def _get_duration_string(total_seconds: int) -> str:
        duration_hours: int = 0
        seconds: int = 0
        duration_hours, seconds = divmod(total_seconds, 3600)
        duration_minutes: int = seconds // 60
        duration_string = ""

        if duration_hours:
            duration_string += f"{duration_hours} h"

        if duration_minutes:
            duration_string += (
                f" {duration_minutes} min"
                if duration_string
                else f"{duration_minutes} min"
            )

        return duration_string

    @staticmethod
    def _get_time_range_string(begin: str, end: str) -> str:
        result: str = begin

        if not result:
            result = end

        elif result != end and end:
            result += f" - {end}"

        return result
