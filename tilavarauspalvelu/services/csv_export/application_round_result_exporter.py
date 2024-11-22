from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from django.db.models import Prefetch
from lookup_property import L

from tilavarauspalvelu.enums import ApplicationStatusChoice
from tilavarauspalvelu.models import AllocatedTimeSlot, ApplicationSection, ReservationUnitOption
from utils.date_utils import local_date, local_date_string, local_time_string, local_timedelta_string

from ._base_exporter import BaseCSVExporter, BaseExportRow

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.models.application_section.queryset import ApplicationSectionQuerySet

__all__ = [
    "ApplicationRoundResultCSVExporter",
]


@dataclasses.dataclass
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
    """Exports a CSV file containing application section data from an application round."""

    def __init__(self, application_round_id: int) -> None:
        self.application_round_id = application_round_id

    @property
    def queryset(self) -> ApplicationSectionQuerySet:
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

    @property
    def default_filename(self) -> str:
        today = local_date().isoformat()
        return f"application_round_results_{self.application_round_id}_{today}"

    def get_header_rows(self) -> Iterable[ApplicationSectionExportRow]:
        return [
            ApplicationSectionExportRow(
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
            ),
        ]

    def get_data_rows(self, instance: ApplicationSection) -> Iterable[ApplicationSectionExportRow]:
        section_row = ApplicationSectionExportRow(
            application_id=str(instance.application.id),
            application_status=instance.application_status,  # type: ignore[attr-defined]
            section_id=str(instance.id),
            section_status=instance.status,  # type: ignore[attr-defined]
            section_name=instance.name,
            reservations_begin_date=local_date_string(instance.reservations_begin_date),
            reservations_end_date=local_date_string(instance.reservations_end_date),
            applied_reservations_per_week=str(instance.applied_reservations_per_week),
            reservation_min_duration=local_timedelta_string(instance.reservation_min_duration),
            reservation_max_duration=local_timedelta_string(instance.reservation_max_duration),
        )

        # Applicant
        if instance.application.organisation is not None:
            section_row.applicant = instance.application.organisation.name
        elif (contact_person := instance.application.contact_person) is not None:
            section_row.applicant = f"{contact_person.first_name} {contact_person.last_name}"

        rows: list[ApplicationSectionExportRow] = []
        # Reservation Unit Options
        for option in instance.reservation_unit_options.all():
            option_row = section_row.copy()  # Copy to prevent modifying the original
            option_row.reservation_unit_name = option.reservation_unit.name
            option_row.unit_name = option.reservation_unit.unit.name

            # One row per Allocated Time Slot
            for allocated_time_slot in option.allocated_time_slots.all():
                slot_row = option_row.copy()  # Copy to prevent modifying the original
                slot_row.day_of_the_week = allocated_time_slot.day_of_the_week
                slot_row.begin_time = local_time_string(allocated_time_slot.begin_time)
                slot_row.end_time = local_time_string(allocated_time_slot.end_time)
                rows.append(slot_row)

        if not rows:
            # A section without any allocated time slots must still be exported
            rows.append(section_row)

        return rows
