from csv import writer
from pathlib import Path
from typing import Dict, List

from django.conf import settings
from django.db.models import OuterRef, Prefetch, Subquery
from django.utils import timezone

from ..models import (
    PRIORITIES,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationStatus,
    EventReservationUnit,
)


class ApplicationDataExporter:
    @classmethod
    def export_application_data(cls, application_round: int) -> None:
        now = timezone.now()
        root = Path(settings.BASE_DIR)
        path = root / "exports" / "applications"
        path.mkdir(parents=True, exist_ok=True)

        application_events: List[ApplicationEvent] = list(
            ApplicationEvent.objects.annotate(
                current_status=Subquery(
                    Application.objects.filter(id=OuterRef("application__id")).values(
                        "latest_status"
                    )
                )
            )
            .alias(
                first_schedule_id=Subquery(
                    ApplicationEventSchedule.objects.filter(
                        application_event=OuterRef("id")
                    ).values("id")[:1]
                )
            )
            .filter(
                application__application_round=application_round,
                first_schedule_id__isnull=False,
            )
            .exclude(current_status=ApplicationStatus.DRAFT)
            .select_related(
                "application",
                "application__organisation",
                "application__contact_person",
                "application__application_round",
                "purpose",
                "age_group",
            )
            .prefetch_related(
                Prefetch(
                    "application_event_schedules",
                    queryset=(
                        ApplicationEventSchedule.objects.all()
                        .order_by("begin")
                        .only("begin", "end", "day")
                    ),
                ),
            )
            .order_by(
                "application__organisation__name",
            )
        )

        if len(application_events):
            file_name = f"application_data_round_{application_round}_{now.strftime('%d-%m-%Y')}.csv"

            with open(path / file_name, "w", newline="") as applications_file:
                applications_writer = writer(applications_file)

                cls._write_header_row(applications_writer)

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
                    event_schedules_prio_high = {
                        0: "",
                        1: "",
                        2: "",
                        3: "",
                        4: "",
                        5: "",
                        6: "",
                    }
                    event_schedules_prio_medium = {
                        0: "",
                        1: "",
                        2: "",
                        3: "",
                        4: "",
                        5: "",
                        6: "",
                    }
                    event_schedules_prio_low = {
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
                    applicant = getattr(application.organisation, "name", "")
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
                        contact_person_last_name = application.contact_person.last_name
                        contact_person_email = getattr(
                            application.contact_person, "email", ""
                        )

                    if not applicant and application.contact_person:
                        applicant = (
                            f"{contact_person_first_name} {contact_person_last_name}"
                        )

                    # Loop through requested schedules and update
                    # the correct time range string depending on day integer
                    schedule: ApplicationEventSchedule
                    for schedule in event.application_event_schedules.all():
                        event_schedules = None

                        if schedule.priority == PRIORITIES.PRIORITY_HIGH:
                            event_schedules = event_schedules_prio_high

                        if schedule.priority == PRIORITIES.PRIORITY_MEDIUM:
                            event_schedules = event_schedules_prio_medium

                        if schedule.priority == PRIORITIES.PRIORITY_LOW:
                            event_schedules = event_schedules_prio_low

                        cls._update_event_schedule_string(event_schedules, schedule)

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
                            ApplicationStatus.get_verbose_status(event.current_status),
                            applicant,
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
                            event_schedules_prio_high[0],
                            event_schedules_prio_high[1],
                            event_schedules_prio_high[2],
                            event_schedules_prio_high[3],
                            event_schedules_prio_high[4],
                            event_schedules_prio_high[5],
                            event_schedules_prio_high[6],
                            event_schedules_prio_medium[0],
                            event_schedules_prio_medium[1],
                            event_schedules_prio_medium[2],
                            event_schedules_prio_medium[3],
                            event_schedules_prio_medium[4],
                            event_schedules_prio_medium[5],
                            event_schedules_prio_medium[6],
                            event_schedules_prio_low[0],
                            event_schedules_prio_low[1],
                            event_schedules_prio_low[2],
                            event_schedules_prio_low[3],
                            event_schedules_prio_low[4],
                            event_schedules_prio_low[5],
                            event_schedules_prio_low[6],
                        ]
                    )

    @staticmethod
    def _write_header_row(writer):
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
                "",
                "haetut ajat prioriteetilla HIGH",
                "",
                "",
                "",
                "",
                "",
                "",
                "haetut ajat prioriteetilla MEDIUM",
                "",
                "",
                "",
                "",
                "",
                "",
                "haetut ajat prioriteetilla LOW",
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
                "",
                "KAIKKI TILAT",
                "",
                "",
                "",
                "",
                "",
                "",
                "KAIKKI TILAT",
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
                "hakemuksen tila",
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

    @classmethod
    def _update_event_schedule_string(
        cls,
        event_schedules: List[Dict[int, str]],
        new_schedule: ApplicationEventSchedule,
    ) -> List[Dict[int, str]]:
        time_range_string = cls._get_time_range_string(
            new_schedule.begin.strftime("%H:%M"),
            new_schedule.end.strftime("%H:%M"),
        )

        # For multiple schedules on the same day, separate them by comma
        if event_schedules[new_schedule.day]:
            time_range_string = (
                f"{event_schedules[new_schedule.day]}, {time_range_string}"
            )

        event_schedules.update({new_schedule.day: time_range_string})
