import csv
from dataclasses import asdict, dataclass
from io import StringIO

from django.db.models import Prefetch
from django.http import FileResponse
from lookup_property import L

from applications.choices import ApplicationStatusChoice
from applications.exporter.base_exporter import BaseCSVExporter, BaseExportRow
from applications.models import AllocatedTimeSlot, ApplicationSection, ReservationUnitOption
from applications.querysets.application_section import ApplicationSectionQuerySet
from common.date_utils import local_date, local_date_string, local_time_string, local_timedelta_string


@dataclass
class ApplicationSectionExportRow(BaseExportRow):
    # Application
    application_id: str = ""
    application_status: str = ""
    applicant: str = ""

    # Application Section
    section_id: str = ""
    section_status: str = ""
    section_name: str = ""
    reservations_begin_date: str = ""
    reservations_end_date: str = ""
    applied_reservations_per_week: str = ""
    reservation_min_duration: str = ""
    reservation_max_duration: str = ""

    # Reservation Unit
    reservation_unit_name: str = ""
    unit_name: str = ""
    day_of_the_week: str = ""
    begin_time: str = ""
    end_time: str = ""

    # Price
    price: str = ""  # empty by design, the column will be manually filled after export


class ApplicationRoundResultCSVExporter(BaseCSVExporter):
    """
    Usage:
    >>> exporter = ApplicationRoundResultCSVExporter(application_round_id=1)
    >>> csv_export = exporter.export()
    >>> print(csv_export.getvalue())
    """

    application_round_id: int

    def __init__(self, application_round_id: int):
        self.application_round_id = application_round_id
        self.max_options = 0
        self.options_part_template = []

    def export(self) -> StringIO | None:
        sections: ApplicationSectionQuerySet = self._get_queryset()
        if not sections:
            return None

        csv_file = StringIO()
        csv_writer = csv.writer(csv_file)

        # Write header rows
        csv_writer.writerow(self._get_header_rows())

        # Write data rows
        for section in sections:
            section_data = self._get_single_row_data(section)
            for row in section_data:
                csv_writer.writerow(row)

        return csv_file

    def export_as_file_response(self, file_name: str | None = None) -> FileResponse | None:
        if file_name is None:
            today = local_date()
            file_name = f"application_round_results_{self.application_round_id}_{today.isoformat()}.csv"

        return super().export_as_file_response(file_name)

    def _get_header_rows(self) -> ApplicationSectionExportRow:
        return ApplicationSectionExportRow(
            application_id="hakemuksen numero",
            application_status="hakemuksen tila",
            applicant="hakija",
            section_id="hakemusosan numero",
            section_status="hakemusosan tila",
            section_name="varauksen nimi",
            reservations_begin_date="hakijan ilmoittaman kauden alkupäivä",
            reservations_end_date="hakijan ilmoittaman kauden loppupäivä",
            applied_reservations_per_week="vuoroja, kpl / vko",
            reservation_min_duration="minimi aika",
            reservation_max_duration="maksimi aika",
            reservation_unit_name="varausyksikkö",
            unit_name="toimipiste",
            day_of_the_week="toistoviikonpäivä",
            begin_time="aloitusaika",
            end_time="päättymisaika",
            price="hinta",
        )

    def _get_queryset(self, **kwargs) -> ApplicationSectionQuerySet:
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
            )
            .prefetch_related(
                # All reservation unit options ordered by preferred order
                Prefetch(
                    "reservation_unit_options",
                    ReservationUnitOption.objects.select_related(
                        "reservation_unit",
                        "reservation_unit__unit",
                    ).order_by("preferred_order"),
                ),
                Prefetch(
                    "reservation_unit_options__allocated_time_slots",
                    AllocatedTimeSlot.objects.alias(
                        day_of_the_week_number=L("day_of_the_week_number"),
                    ).order_by(
                        "day_of_the_week_number",
                        "begin_time",
                        "end_time",
                    ),
                ),
            )
            .order_by("application_id", "id")
            .distinct()  # Avoid duplicate rows due to implicit joins
        )

    def _get_single_row_data(self, section: ApplicationSection) -> list[ApplicationSectionExportRow]:
        section_row = ApplicationSectionExportRow(
            application_id=str(section.application.id),
            application_status=section.application_status,  # type: ignore[attr-defined]
            section_id=str(section.id),
            section_status=section.status,
            section_name=section.name,
            reservations_begin_date=local_date_string(section.reservations_begin_date),
            reservations_end_date=local_date_string(section.reservations_end_date),
            applied_reservations_per_week=str(section.applied_reservations_per_week),
            reservation_min_duration=local_timedelta_string(section.reservation_min_duration),
            reservation_max_duration=local_timedelta_string(section.reservation_max_duration),
        )

        # Applicant
        if section.application.organisation is not None:
            section_row.applicant = section.application.organisation.name
        elif (contact_person := section.application.contact_person) is not None:
            section_row.applicant = f"{contact_person.first_name} {contact_person.last_name}"

        ret_val = []
        # Reservation Unit Options
        for option in section.reservation_unit_options.all():
            option_row = ApplicationSectionExportRow(**asdict(section_row))  # Copy to prevent modifying the original
            option_row.reservation_unit_name = option.reservation_unit.name
            option_row.unit_name = option.reservation_unit.unit.name

            # One row per Allocated Time Slot
            for allocated_time_slot in option.allocated_time_slots.all():
                slot_row = ApplicationSectionExportRow(**asdict(option_row))  # Copy to prevent modifying the original
                slot_row.day_of_the_week = allocated_time_slot.day_of_the_week
                slot_row.begin_time = local_time_string(allocated_time_slot.begin_time)
                slot_row.end_time = local_time_string(allocated_time_slot.end_time)
                ret_val.append(slot_row)

        if not ret_val:
            # A section without any allocated time slots must still be exported
            ret_val.append(section_row)

        return ret_val
