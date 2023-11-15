import datetime
from csv import QUOTE_ALL, writer
from functools import reduce
from pathlib import Path

from django.conf import settings
from django.db.models import Count, Max, Prefetch
from django.utils import timezone

from applications.choices import ApplicationStatusChoice, PriorityChoice
from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    EventReservationUnit,
)
from applications.querysets.application_event import ApplicationEventQuerySet


def get_header_rows(spaces_count: int) -> tuple[list[str], list[str], list[str]]:
    return (
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
        ],
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
        ],
        [
            "hakemuksen numero",
            "hakemuksen tila",
            "hakija",
            "y-tunnus",
            "yhteyshenkilö etunimi",
            "yhteyshenkilö sukunimi",
            "sähköpostiosoite",
            "yhteyshenkilön puh",
            "hakemusosan numero",
            "hakemusosan tila",
            "varauksen nimi",
            "hakijan ilmoittaman kauden alkupäivä",
            "hakijan ilmoittaman kauden loppupäivä",
            "kotikunta",
            "vuoronkäyttötarkoitus",
            "ikäryhmä",
            "osallistujamäärä",
            "hakijan tyyppi",
            "vuoroja, kpl / vko",
            "minimi aika",
            "maksimi aika",
        ]
        + [f"tilatoive {i}" for i in range(1, spaces_count + 1)]
        + [
            "ma",
            "ti",
            "ke",
            "to",
            "pe",
            "la",
            "su",
            "ma",
            "ti",
            "ke",
            "to",
            "pe",
            "la",
            "su",
            "ma",
            "ti",
            "ke",
            "to",
            "pe",
            "la",
            "su",
        ],
    )


class ApplicationDataExporter:
    @staticmethod
    def get_base_queryset(application_round_id: int) -> ApplicationEventQuerySet:
        return (
            ApplicationEvent.objects.with_application_status()
            .exclude(application_status__in=[ApplicationStatusChoice.DRAFT, ApplicationStatusChoice.EXPIRED])
            .filter(
                application__application_round=application_round_id,
                application_event_schedules__isnull=False,
            )
            .order_by("pk")
        )

    @classmethod
    def export_application_data(cls, application_round_id: int) -> Path | None:
        now = timezone.now()
        root = settings.BASE_DIR
        path = root / "exports" / "application"
        path.mkdir(parents=True, exist_ok=True)

        application_events: list[ApplicationEvent] = list(
            cls.get_base_queryset(application_round_id)
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
                    queryset=ApplicationEventSchedule.objects.all().order_by("begin"),
                ),
            )
            .order_by("application__organisation__name")
        )

        spaces_max_count = (
            ApplicationEvent.objects.filter(application__application_round=application_round_id)
            .annotate(spaces_count=Count("event_reservation_units"))
            .aggregate(spaces_max_count=Max("spaces_count"))
        ).get("spaces_max_count", 0)

        if len(application_events):
            file_name = f"application_data_round_{application_round_id}_{now.strftime('%d-%m-%Y')}.csv"

            with open(path / file_name, "w", newline="") as applications_file:
                applications_writer = writer(applications_file)

                for header_row in get_header_rows(spaces_max_count):
                    applications_writer.writerow(header_row)

                for event in application_events:
                    application: Application = event.application
                    min_duration_string = cls._get_duration_string(event.min_duration)
                    max_duration_string = cls._get_duration_string(event.max_duration)
                    event_schedules_prio_high = {0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: ""}
                    event_schedules_prio_medium = {0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: ""}
                    event_schedules_prio_low = {0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: ""}
                    reservation_units = []
                    contact_person_first_name = ""
                    contact_person_last_name = ""
                    contact_person_email = ""
                    contact_person_phone = ""
                    applicant = getattr(application.organisation, "name", "")
                    organisation_id = getattr(application.organisation, "identifier", "")
                    event_begin = f"{event.begin.day}.{event.begin.month}.{event.begin.year}" if event.begin else ""
                    event_end = f"{event.end.day}.{event.end.month}.{event.end.year}" if event.end else ""

                    if application.contact_person:
                        contact_person_first_name = application.contact_person.first_name
                        contact_person_last_name = application.contact_person.last_name
                        contact_person_email = getattr(application.contact_person, "email", "")
                        contact_person_phone = getattr(application.contact_person, "phone_number", "")

                        if not applicant:
                            applicant = f"{contact_person_first_name} {contact_person_last_name}"

                    # Loop through requested schedules and update
                    # the correct time range string depending on day integer
                    schedule: ApplicationEventSchedule
                    for schedule in event.application_event_schedules.all():
                        event_schedules = None

                        if schedule.priority == PriorityChoice.HIGH:
                            event_schedules = event_schedules_prio_high

                        if schedule.priority == PriorityChoice.MEDIUM:
                            event_schedules = event_schedules_prio_medium

                        if schedule.priority == PriorityChoice.LOW:
                            event_schedules = event_schedules_prio_low

                        cls._update_event_schedule_string(event_schedules, schedule)

                    # Loop through event reservation units and update strings by preferred_order.
                    event_reservation_unit: EventReservationUnit
                    for event_reservation_unit in (
                        event.event_reservation_units.all()
                        .select_related("reservation_unit")
                        .order_by("preferred_order", "pk")
                    ):
                        reservation_units.append(
                            f"{event_reservation_unit.reservation_unit.name}, "
                            f"{event_reservation_unit.reservation_unit.unit.name}"
                        )

                    # Write application event to CSV file
                    row = [
                        application.id,
                        application.status.value,
                        applicant,
                        organisation_id,
                        contact_person_first_name,
                        contact_person_last_name,
                        contact_person_email,
                        contact_person_phone,
                        event.id,
                        event.status.value,
                        event.name,
                        event_begin,
                        event_end,
                        getattr(application.home_city, "name", "muu"),
                        getattr(event.purpose, "name", ""),
                        str(event.age_group) if event.age_group else "",
                        getattr(event, "num_persons", ""),
                        application.applicant_type,
                        event.events_per_week or 0,
                        min_duration_string,
                        max_duration_string,
                    ]
                    row.extend(reservation_units)
                    row.extend(["" for _ in range(spaces_max_count - len(reservation_units))])
                    row.extend(
                        [
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
                    applications_writer.writerow(row)

                return path / file_name
        return None

    @staticmethod
    def _get_duration_string(duration: datetime.timedelta | None) -> str:
        if duration is None:
            return ""

        total_seconds = int(duration.total_seconds())
        duration_hours, seconds = divmod(total_seconds, 3600)
        duration_minutes = int(seconds // 60)
        duration_string = ""

        if duration_hours:
            duration_string += f"{duration_hours} h"

        if duration_minutes:
            duration_string += f" {duration_minutes} min" if duration_string else f"{duration_minutes} min"

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
        event_schedules: dict[int, str],
        new_schedule: ApplicationEventSchedule,
    ) -> None:
        time_range_string = cls._get_time_range_string(
            new_schedule.begin.strftime("%H:%M"),
            new_schedule.end.strftime("%H:%M"),
        )

        # For multiple schedules on the same day, separate them by comma
        if event_schedules[new_schedule.day]:
            time_range_string = f"{event_schedules[new_schedule.day]}, {time_range_string}"

        event_schedules.update({new_schedule.day: time_range_string})

    @classmethod
    def export_application_round_statistics_for_reservation_units(cls, application_round: int) -> None:
        root = settings.BASE_DIR
        path = root / "exports"
        path.mkdir(parents=True, exist_ok=True)

        with open(path / "reservation_units.csv", "w", newline="") as export_file:
            export_writer = writer(export_file, dialect="excel", quoting=QUOTE_ALL)

            export_writer.writerow(["Application ID", "Event name", "Status", "Reservation unit names"])

            for event_id, application_id, event_name, event_status in (
                cls.get_base_queryset(application_round)
                .with_event_status()
                .values_list("id", "application__id", "name", "event_status")
                .order_by("application__organisation__name", "application__id")
            ):
                event_reservation_unit_names = (
                    EventReservationUnit.objects.filter(application_event__id=event_id)
                    .order_by("priority")
                    .values_list("reservation_unit__name", flat=True)
                )

                reservation_units_string = reduce(
                    (
                        lambda current_string, unit_name: (
                            unit_name if not current_string else f"{current_string}; {unit_name}"
                        )
                    ),
                    event_reservation_unit_names,
                    "",
                )

                export_writer.writerow(
                    [
                        application_id,
                        event_name,
                        event_status,
                        reservation_units_string,
                    ]
                )
