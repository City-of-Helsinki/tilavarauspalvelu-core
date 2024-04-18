from collections.abc import Iterator
from csv import writer
from dataclasses import asdict, dataclass
from pathlib import Path

from django.conf import settings
from django.db.models import Prefetch
from lookup_property import L

from applications.choices import ApplicationStatusChoice
from applications.models import ApplicationSection, ReservationUnitOption, SuitableTimeRange
from common.date_utils import local_date, local_date_string, local_time_string, local_timedelta_string

__all__ = [
    "export_application_data",
    "get_header_rows",
]


@dataclass
class ApplicationExportRow:
    application_id: str = ""
    application_status: str = ""
    applicant: str = ""
    organisation_id: str = ""
    contact_person_first_name: str = ""
    contact_person_last_name: str = ""
    contact_person_email: str = ""
    contact_person_phone: str = ""
    section_id: str = ""
    section_status: str = ""
    section_name: str = ""
    reservations_begin_date: str = ""
    reservations_end_date: str = ""
    home_city_name: str = ""
    purpose_name: str = ""
    age_group_str: str = ""
    num_persons: str = ""
    applicant_type: str = ""
    applied_reservations_per_week: str = ""
    reservation_min_duration: str = ""
    reservation_max_duration: str = ""

    primary_monday: str = ""
    primary_tuesday: str = ""
    primary_wednesday: str = ""
    primary_thursday: str = ""
    primary_friday: str = ""
    primary_saturday: str = ""
    primary_sunday: str = ""
    secondary_monday: str = ""
    secondary_tuesday: str = ""
    secondary_wednesday: str = ""
    secondary_thursday: str = ""
    secondary_friday: str = ""
    secondary_saturday: str = ""
    secondary_sunday: str = ""

    def add_time_range(self, priority: str, day_of_the_week: str, time_range: SuitableTimeRange) -> None:
        """Add suitable time range to the correct position in the row."""
        key = f"{priority.lower()}_{day_of_the_week.lower()}"
        current_value: str | None = getattr(self, key, None)
        new_value = f"{local_time_string(time_range.begin_time)}-{local_time_string(time_range.end_time)}"
        if current_value is None:
            raise ValueError(f"Key {key} not found in {self.__class__.__name__}")
        # If the value is already set, append the new time range to the end of the string.
        # Time ranges should be in chronological order.
        elif current_value:
            setattr(self, key, f"{current_value}, {new_value}")
        else:
            setattr(self, key, new_value)

    def __iter__(self) -> Iterator[str]:
        """Iterate over the values of the dataclass in the order they were defined."""
        return iter(asdict(self).values())


def get_header_rows(max_options: int) -> tuple[list[str], list[str], list[str]]:
    return (
        list(
            ApplicationExportRow(
                primary_monday="Ensisijaiset aikatoiveet",
                secondary_monday="Toissijaiset aikatoiveet",
            )
        ),
        list(
            ApplicationExportRow(
                primary_monday="KAIKKI TILAT",
                secondary_monday="KAIKKI TILAT",
            )
        ),
        list(
            ApplicationExportRow(
                application_id="hakemuksen numero",
                application_status="hakemuksen tila",
                applicant="hakija",
                organisation_id="y-tunnus",
                contact_person_first_name="yhteyshenkilö etunimi",
                contact_person_last_name="yhteyshenkilö sukunimi",
                contact_person_email="sähköpostiosoite",
                contact_person_phone="yhteyshenkilön puh",
                section_id="hakemusosan numero",
                section_status="hakemusosan tila",
                section_name="varauksen nimi",
                reservations_begin_date="hakijan ilmoittaman kauden alkupäivä",
                reservations_end_date="hakijan ilmoittaman kauden loppupäivä",
                home_city_name="kotikunta",
                purpose_name="vuoronkäyttötarkoitus",
                age_group_str="ikäryhmä",
                num_persons="osallistujamäärä",
                applicant_type="hakijan tyyppi",
                applied_reservations_per_week="vuoroja, kpl / vko",
                reservation_min_duration="minimi aika",
                reservation_max_duration="maksimi aika",
                primary_monday="ma",
                primary_tuesday="ti",
                primary_wednesday="ke",
                primary_thursday="to",
                primary_friday="pe",
                primary_saturday="la",
                primary_sunday="su",
                secondary_monday="ma",
                secondary_tuesday="ti",
                secondary_wednesday="ke",
                secondary_thursday="to",
                secondary_friday="pe",
                secondary_saturday="la",
                secondary_sunday="su",
            )
        )
        + [f"tilatoive {i}" for i in range(1, max_options + 1)],
    )


def export_application_data(application_round_id: int) -> Path | None:
    application_sections: list[ApplicationSection] = list(
        ApplicationSection.objects.annotate(
            # Annotate statuses for performance
            application_status=L("application__status"),
            status=L("status"),
        )
        .filter(
            application__application_round=application_round_id,
            suitable_time_ranges__isnull=False,
        )
        .exclude(
            application_status__in=[ApplicationStatusChoice.DRAFT.value, ApplicationStatusChoice.EXPIRED.value],
        )
        .select_related(
            "application",
            "application__organisation",
            "application__contact_person",
            "application__application_round",
            "purpose",
            "age_group",
        )
        .prefetch_related(
            # All suitable time ranges ordered by begin time
            Prefetch(
                "suitable_time_ranges",
                SuitableTimeRange.objects.all().order_by("begin_time"),
            ),
            # All reservation unit options ordered by preferred order
            Prefetch(
                "reservation_unit_options",
                ReservationUnitOption.objects.select_related(
                    "reservation_unit",
                    "reservation_unit__unit",
                ).order_by("preferred_order"),
            ),
        )
        .order_by("application__organisation__name")
    )
    if not application_sections:
        return None

    today = local_date()
    root = settings.BASE_DIR
    path = root / "exports" / "application"
    path.mkdir(parents=True, exist_ok=True)

    file_name: str = f"application_data_round_{application_round_id}_{today.isoformat()}.csv"
    max_options: int = max(len(section.reservation_unit_options.all()) for section in application_sections)
    options_part_template = [""] * max_options

    with open(path / file_name, "w", newline="") as applications_file:
        applications_writer = writer(applications_file)

        # Write header rows
        for header_row in get_header_rows(max_options):
            applications_writer.writerow(header_row)

        # Write data rows
        for section in application_sections:
            row = ApplicationExportRow(
                application_id=str(section.application.id),
                application_status=section.application_status,  # type: ignore[attr-defined]
                section_id=str(section.id),
                section_status=section.status,
                section_name=section.name,
                home_city_name="muu",
                num_persons=str(section.num_persons),
                applicant_type=section.application.applicant_type,
                applied_reservations_per_week=str(section.applied_reservations_per_week),
            )

            row.reservation_min_duration = local_timedelta_string(section.reservation_min_duration)
            row.reservation_max_duration = local_timedelta_string(section.reservation_max_duration)
            row.reservations_begin_date = local_date_string(section.reservations_begin_date)
            row.reservations_end_date = local_date_string(section.reservations_end_date)

            if section.application.organisation is not None:
                row.applicant = section.application.organisation.name
                row.organisation_id = section.application.organisation.identifier

            if section.application.contact_person is not None:
                row.contact_person_first_name = section.application.contact_person.first_name
                row.contact_person_last_name = section.application.contact_person.last_name
                row.contact_person_email = section.application.contact_person.email
                row.contact_person_phone = section.application.contact_person.phone_number

                if not row.applicant:
                    row.applicant = (
                        f"{section.application.contact_person.first_name} "
                        f"{section.application.contact_person.last_name}"
                    )

            if section.application.home_city is not None:
                row.home_city_name = section.application.home_city.name

            if section.purpose is not None:
                row.purpose_name = section.purpose.name

            if section.age_group is not None:
                row.age_group_str = str(section.age_group)

            for time_range in section.suitable_time_ranges.all():
                row.add_time_range(time_range.priority, time_range.day_of_the_week, time_range)

            # Add reservation unit options to the end.
            options_part: list[str] = options_part_template.copy()
            for i, option in enumerate(section.reservation_unit_options.all()):
                options_part[i] = f"{option.reservation_unit.name}, {option.reservation_unit.unit.name}"

            applications_writer.writerow(list(row) + options_part)

        return path / file_name
