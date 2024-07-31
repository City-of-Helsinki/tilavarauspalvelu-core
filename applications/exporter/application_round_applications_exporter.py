import csv
from dataclasses import dataclass
from io import StringIO

from django.db.models import Prefetch
from django.http import FileResponse
from lookup_property import L

from applications.enums import ApplicationStatusChoice
from applications.exporter.base_exporter import BaseCSVExporter, BaseExportRow
from applications.models import ApplicationSection, ReservationUnitOption, SuitableTimeRange
from applications.querysets.application_section import ApplicationSectionQuerySet
from common.date_utils import local_date, local_date_string, local_time_string, local_timedelta_string


@dataclass
class ApplicationExportRow(BaseExportRow):
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
        if current_value:
            setattr(self, key, f"{current_value}, {new_value}")
        else:
            setattr(self, key, new_value)


class ApplicationRoundApplicationsCSVExporter(BaseCSVExporter):
    """
    Exports a CSV file containing application data for a single application round.

    Usage:
    >>> exporter = ApplicationRoundApplicationsCSVExporter(application_round_id=1)
    >>> csv_export = exporter.export()
    >>> print(csv_export.getvalue())
    """

    application_round_id: int
    max_options: int
    options_part_template: list[str]

    def __init__(self, application_round_id: int) -> None:
        self.application_round_id = application_round_id
        self.max_options = 0
        self.options_part_template = []

    def export(self) -> StringIO | None:
        application_sections = self._get_queryset()
        if not application_sections:
            return None

        self.max_options: int = max(len(section.reservation_unit_options.all()) for section in application_sections)
        self.options_part_template = [""] * self.max_options

        csv_file = StringIO()
        csv_writer = csv.writer(csv_file)

        # Write header rows
        for header_row in self._get_header_rows():
            csv_writer.writerow(header_row)

        # Write data rows
        for section in application_sections:
            csv_writer.writerow(self._get_single_row_data(section))

        return csv_file

    def export_as_file_response(self, file_name: str | None = None) -> FileResponse | None:
        if file_name is None:
            today = local_date()
            file_name = f"application_round_applications_{self.application_round_id}_{today.isoformat()}.csv"

        return super().export_as_file_response(file_name)

    def _get_header_rows(self) -> tuple[list[str], list[str], list[str]]:
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
            + [f"tilatoive {i}" for i in range(1, self.max_options + 1)],
        )

    def _get_queryset(self) -> ApplicationSectionQuerySet:
        return (
            ApplicationSection.objects.annotate(
                # Annotate statuses for performance
                application_status=L("application__status"),
                status=L("status"),
            )
            .filter(
                application__application_round=self.application_round_id,
                suitable_time_ranges__isnull=False,
            )
            .exclude(
                application_status__in=[
                    ApplicationStatusChoice.DRAFT.value,
                    ApplicationStatusChoice.EXPIRED.value,
                ],
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

    def _get_single_row_data(self, section: ApplicationSection) -> list[str]:
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
        options_part: list[str] = self.options_part_template.copy()
        for i, option in enumerate(section.reservation_unit_options.all()):
            options_part[i] = f"{option.reservation_unit.name}, {option.reservation_unit.unit.name}"

        return list(row) + options_part
