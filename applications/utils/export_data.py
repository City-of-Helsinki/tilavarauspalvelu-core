from csv import writer
from pathlib import Path
from typing import List

from django.conf import settings
from django.utils import timezone

from ..models import ApplicationEvent, ApplicationEventSchedule, EventReservationUnit


class ApplicationDataExporter:
    @classmethod
    def export_application_data(cls, application_round: int) -> None:
        now = timezone.now()
        root = Path(settings.BASE_DIR)
        file_name = (
            f"application_data_round_{application_round}_{now.strftime('%d-%m-%Y')}.csv"
        )
        path = root / "exports"
        path.mkdir(parents=True, exist_ok=True)

        application_events: List[ApplicationEvent] = list(
            ApplicationEvent.objects.filter(
                application__application_round=application_round
            )
            .select_related(
                "application",
                "application__organisation",
            )
            .order_by("application__organisation__name")
        )

        if len(application_events):
            with open(path / file_name, "w", newline="") as applications_file:
                applications_writer = writer(applications_file)

                # Write header rows
                applications_writer.writerow(["", "", "", "", "", "", "haetut ajat"])
                applications_writer.writerow(["", "", "", "", "", "", "KAIKKI TILAT"])
                applications_writer.writerow(
                    [
                        "hakija",
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

                for event in application_events:
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

                    # Loop through requested schedules and update
                    # the correct time range string depending on day integer
                    schedule: ApplicationEventSchedule
                    for schedule in (
                        event.application_event_schedules.all()
                        .order_by("begin")
                        .only("begin", "end", "day")
                    ):
                        time_range_string = cls._get_time_range_string(
                            schedule.begin.strftime("%H:%M"),
                            schedule.end.strftime("%H:%M"),
                        )

                        # For multiple schedules on the same day, separate them by comma
                        if event_schedules[schedule.day]:
                            time_range_string = (
                                f"{event_schedules[schedule.day]}, {time_range_string}"
                            )

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
                            event.application.organisation.name,
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
