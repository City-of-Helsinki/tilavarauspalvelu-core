from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from django.db.models import Max, OuterRef, Prefetch
from django.db.models.functions import Coalesce
from lookup_property import L

from tilavarauspalvelu.enums import ApplicationStatusChoice
from tilavarauspalvelu.exceptions import ApplicationRoundExporterError
from tilavarauspalvelu.models import ApplicationSection, ReservationUnitOption, SuitableTimeRange
from utils.date_utils import local_date, local_date_string, local_time_string, local_timedelta_string
from utils.db import SubqueryCount

from ._base_exporter import BaseCSVExporter, BaseExportRow

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.models.application_section.queryset import ApplicationSectionQuerySet

__all__ = [
    "ApplicationRoundApplicationsCSVExporter",
]


@dataclasses.dataclass
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
            msg = f"Key {key} not found in {self.__class__.__name__}"
            raise ApplicationRoundExporterError(msg)
        # If the value is already set, append the new time range to the end of the string.
        # Time ranges should be in chronological order.
        if current_value:
            setattr(self, key, f"{current_value}, {new_value}")
        else:
            setattr(self, key, new_value)


class ApplicationRoundApplicationsCSVExporter(BaseCSVExporter):
    """Exports a CSV file containing application data for a single application round."""

    def __init__(self, application_round_id: int) -> None:
        self.application_round_id = application_round_id
        self.max_options: int = self.queryset.aggregate(max_options=Coalesce(Max("option_count"), 0))["max_options"]
        self.options_part_template: list[str] = [""] * self.max_options

    @property
    def queryset(self) -> ApplicationSectionQuerySet:
        return (
            ApplicationSection.objects.annotate(
                # Annotate statuses for performance
                application_status=L("application__status"),
                status=L("status"),
                option_count=SubqueryCount(
                    ReservationUnitOption.objects.filter(application_section=OuterRef("pk")).values("id"),
                ),
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

    @property
    def default_filename(self) -> str:
        today = local_date().isoformat()
        return f"application_round_applications_{self.application_round_id}_{today}"

    def get_header_rows(self) -> Iterable[ApplicationExportRow]:
        return [
            ApplicationExportRow(
                primary_monday="Ensisijaiset aikatoiveet",
                secondary_monday="Toissijaiset aikatoiveet",
            ),
            ApplicationExportRow(
                primary_monday="KAIKKI TILAT",
                secondary_monday="KAIKKI TILAT",
            ),
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
            ).with_extra(
                extra=[f"tilatoive {i}" for i in range(1, self.max_options + 1)],
            ),
        ]

    def get_data_rows(self, instance: ApplicationSection) -> Iterable[ApplicationExportRow]:
        row = ApplicationExportRow(
            application_id=str(instance.application.id),
            application_status=instance.application_status,  # type: ignore[attr-defined]
            section_id=str(instance.id),
            section_status=instance.status,  # type: ignore[attr-defined]
            section_name=instance.name,
            home_city_name="muu",
            num_persons=str(instance.num_persons),
            applicant_type=instance.application.applicant_type,
            applied_reservations_per_week=str(instance.applied_reservations_per_week),
        )

        row.reservation_min_duration = local_timedelta_string(instance.reservation_min_duration)
        row.reservation_max_duration = local_timedelta_string(instance.reservation_max_duration)
        row.reservations_begin_date = local_date_string(instance.reservations_begin_date)
        row.reservations_end_date = local_date_string(instance.reservations_end_date)

        if instance.application.organisation is not None:
            row.applicant = instance.application.organisation.name
            row.organisation_id = instance.application.organisation.identifier

        if instance.application.contact_person is not None:
            row.contact_person_first_name = instance.application.contact_person.first_name
            row.contact_person_last_name = instance.application.contact_person.last_name
            row.contact_person_email = instance.application.contact_person.email
            row.contact_person_phone = instance.application.contact_person.phone_number

            if not row.applicant:
                contact = instance.application.contact_person
                row.applicant = f"{contact.first_name} {contact.last_name}"

        if instance.application.home_city is not None:
            row.home_city_name = instance.application.home_city.name

        if instance.purpose is not None:
            row.purpose_name = instance.purpose.name

        if instance.age_group is not None:
            row.age_group_str = str(instance.age_group)

        for time_range in instance.suitable_time_ranges.all():
            row.add_time_range(time_range.priority, time_range.day_of_the_week, time_range)

        # Add reservation unit options to the end.
        options_part: list[str] = self.options_part_template.copy()
        for i, option in enumerate(instance.reservation_unit_options.all()):
            options_part[i] = f"{option.reservation_unit.name}, {option.reservation_unit.unit.name}"

        row.extra = options_part
        return [row]
