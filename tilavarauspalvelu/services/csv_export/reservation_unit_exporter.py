from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from django.db import models
from lookup_property import L

from tilavarauspalvelu.enums import AuthenticationType, ReservationKind, ReservationStartInterval
from tilavarauspalvelu.models import ReservationUnit, ReservationUnitPricing
from utils.date_utils import local_date, local_datetime_string, local_timedelta_string

from ._base_exporter import BaseCSVExporter, BaseExportRow

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet

__all__ = [
    "ReservationUnitExporter",
]


@dataclasses.dataclass
class ReservationUnitExportRow(BaseExportRow):
    reservation_unit_id: str | int = ""
    name: str = ""
    name_fi: str = ""
    name_en: str = ""
    name_sv: str = ""
    description: str = ""
    description_fi: str = ""
    description_en: str = ""
    description_sv: str = ""
    type: str = ""
    terms_of_use: str = ""
    terms_of_use_fi: str = ""
    terms_of_use_en: str = ""
    terms_of_use_sv: str = ""
    service_specific_terms: str = ""
    tprek_id: str = ""
    unit: str = ""
    contact_information: str = ""
    is_this_in_draft_state: str | bool = ""
    publish_begins: str = ""
    publish_ends: str = ""
    spaces: str = ""
    resources: str = ""
    qualifiers: str = ""
    payment_terms: str = ""
    cancellation_terms: str = ""
    pricing_terms: str = ""
    cancellation_rule: str = ""
    price_unit: str = ""
    lowest_price: str = ""
    highest_price: str = ""
    tax_percentage: str = ""
    reservation_begins: str = ""
    reservation_ends: str = ""
    reservation_metadata_set: str = ""
    require_a_handling: str | bool = ""
    authentication: str = ""
    reservation_kind: str = ""
    payment_type: str = ""
    can_apply_free_of_charge: str | bool = ""
    additional_instructions_for_pending_reservation_fi: str = ""
    additional_instructions_for_pending_reservation_sv: str = ""
    additional_instructions_for_pending_reservation_en: str = ""
    additional_instructions_for_confirmed_reservation_fi: str = ""
    additional_instructions_for_confirmed_reservation_sv: str = ""
    additional_instructions_for_confirmed_reservation_en: str = ""
    additional_instructions_for_cancelled_reservations_fi: str = ""
    additional_instructions_for_cancelled_reservations_sv: str = ""
    additional_instructions_for_cancelled_reservations_en: str = ""
    maximum_reservation_duration: str = ""
    minimum_reservation_duration: str = ""
    maximum_number_of_persons: str | int = ""
    minimum_number_of_persons: str | int = ""
    surface_area: str | int = ""
    buffer_time_before_reservation: str = ""
    buffer_time_after_reservation: str = ""
    hauki_resource_id: str | int = ""
    reservation_start_interval: str = ""
    maximum_number_of_days_before_reservations_can_be_made: str | int = ""
    minimum_days_before_reservations_can_be_made: str | int = ""
    maximum_number_of_active_reservations_per_user: str | int = ""
    allow_reservations_without_opening_hours: str | bool = ""
    is_reservation_unit_archived: str | bool = ""
    services: str = ""
    purposes: str = ""
    require_introduction: str | bool = ""
    equipments: str = ""
    state: str = ""
    reservation_state: str = ""


class ReservationUnitExporter(BaseCSVExporter):
    """Exports reservation units to a CSV file."""

    def __init__(self, queryset: ReservationUnitQuerySet | None = None) -> None:
        self._queryset: ReservationUnitQuerySet = queryset or ReservationUnit.objects.all()

    @property
    def queryset(self) -> models.QuerySet:
        return (
            self._queryset.select_related(
                "unit",
                "origin_hauki_resource",
                "reservation_unit_type",
                "cancellation_rule",
                "metadata_set",
                "cancellation_terms",
                "service_specific_terms",
                "pricing_terms",
                "payment_terms",
                "payment_product",
                "payment_merchant",
                "payment_accounting",
            )
            .prefetch_related(
                "spaces",
                "resources",
                "purposes",
                "equipments",
                "services",
                "payment_types",
                "qualifiers",
                models.Prefetch("pricings", ReservationUnitPricing.objects.active()),
            )
            .annotate(
                publishing_state=L("publishing_state"),
                reservation_state=L("reservation_state"),
            )
        )

    @property
    def default_filename(self) -> str:
        today = local_date().isoformat()
        return f"reservation_units_{today}"

    def get_header_rows(self) -> Iterable[ReservationUnitExportRow]:
        return [
            ReservationUnitExportRow(
                reservation_unit_id="Reservation unit ID",
                name="Name",
                name_fi="Name_fi",
                name_en="Name_en",
                name_sv="Name_sv",
                description="Description",
                description_fi="Description_fi",
                description_en="Description_en",
                description_sv="Description_sv",
                type="Type",
                terms_of_use="Terms of use",
                terms_of_use_fi="Terms of use_fi",
                terms_of_use_en="Terms of use_en",
                terms_of_use_sv="Terms of use_sv",
                service_specific_terms="Service-specific terms",
                tprek_id="TPRek ID",
                unit="Unit",
                contact_information="Contact information",
                is_this_in_draft_state="Is this in draft state",
                publish_begins="Publish begins",
                publish_ends="Publish ends",
                spaces="Spaces",
                resources="Resources",
                qualifiers="Qualifiers",
                payment_terms="Payment terms",
                cancellation_terms="Cancellation terms",
                pricing_terms="Pricing terms",
                cancellation_rule="Cancellation rule",
                price_unit="Price unit",
                lowest_price="Lowest price",
                highest_price="Highest price",
                tax_percentage="Tax percentage",
                reservation_begins="Reservation begins",
                reservation_ends="Reservation ends",
                reservation_metadata_set="Reservation metadata set",
                require_a_handling="Require a handling",
                authentication="Authentication",
                reservation_kind="Reservation kind",
                payment_type="Payment type",
                can_apply_free_of_charge="Can apply free of charge",
                additional_instructions_for_pending_reservation_fi=(
                    "Additional instructions for pending reservation_fi"
                ),
                additional_instructions_for_pending_reservation_sv=(
                    "Additional instructions for pending reservation_sv"
                ),
                additional_instructions_for_pending_reservation_en=(
                    "Additional instructions for pending reservation_en"
                ),
                additional_instructions_for_confirmed_reservation_fi=(
                    "Additional instructions for confirmed reservation_fi"
                ),
                additional_instructions_for_confirmed_reservation_sv=(
                    "Additional instructions for confirmed reservation_sv"
                ),
                additional_instructions_for_confirmed_reservation_en=(
                    "Additional instructions for confirmed reservation_en"
                ),
                additional_instructions_for_cancelled_reservations_fi=(
                    "Additional instructions for cancelled reservations_fi"
                ),
                additional_instructions_for_cancelled_reservations_sv=(
                    "Additional instructions for cancelled reservations_sv"
                ),
                additional_instructions_for_cancelled_reservations_en=(
                    "Additional instructions for cancelled reservations_en"
                ),
                maximum_reservation_duration="Maximum reservation duration",
                minimum_reservation_duration="Minimum reservation duration",
                maximum_number_of_persons="Maximum number of persons",
                minimum_number_of_persons="Minimum number of persons",
                surface_area="Surface area",
                buffer_time_before_reservation="Buffer time before reservation",
                buffer_time_after_reservation="Buffer time after reservation",
                hauki_resource_id="Hauki resource id",
                reservation_start_interval="Reservation start interval",
                maximum_number_of_days_before_reservations_can_be_made=(
                    "Maximum number of days before reservations can be made"
                ),
                minimum_days_before_reservations_can_be_made="Minimum days before reservations can be made",
                maximum_number_of_active_reservations_per_user="Maximum number of active reservations per user",
                allow_reservations_without_opening_hours="Allow reservations without opening hours",
                is_reservation_unit_archived="Is reservation unit archived",
                services="Services",
                purposes="Purposes",
                require_introduction="Require introduction",
                equipments="Equipments",
                state="State",
                reservation_state="Reservation state",
            ),
        ]

    def get_data_rows(self, instance: ReservationUnit) -> Iterable[ReservationUnitExportRow]:
        pricing: ReservationUnitPricing = next(iter(instance.pricings.all()), None)
        return [
            ReservationUnitExportRow(
                reservation_unit_id=instance.id,
                name=instance.name,
                name_fi=instance.name_fi,
                name_en=instance.name_en,
                name_sv=instance.name_sv,
                description=instance.description.replace("\n", " "),
                description_fi=instance.description_fi.replace("\n", " "),
                description_en=instance.description_en.replace("\n", " "),
                description_sv=instance.description_sv.replace("\n", " "),
                type=getattr(instance.reservation_unit_type, "name", ""),
                terms_of_use=instance.terms_of_use,
                terms_of_use_fi=instance.terms_of_use_fi,
                terms_of_use_en=instance.terms_of_use_en,
                terms_of_use_sv=instance.terms_of_use_sv,
                service_specific_terms=getattr(instance.service_specific_terms, "name", ""),
                tprek_id=getattr(instance.unit, "tprek_id", ""),
                unit=getattr(instance.unit, "name", ""),
                contact_information=instance.contact_information,
                is_this_in_draft_state=instance.is_draft,
                publish_begins=(
                    local_datetime_string(instance.publish_begins)  #
                    if instance.publish_begins is not None
                    else None
                ),
                publish_ends=(
                    local_datetime_string(instance.publish_ends)  #
                    if instance.publish_ends is not None
                    else None
                ),
                spaces=", ".join(space.name_fi for space in instance.spaces.all()),
                resources=", ".join(resource.name_fi for resource in instance.resources.all()),
                qualifiers=", ".join(qualifier.name_fi for qualifier in instance.qualifiers.all()),
                payment_terms=getattr(instance.payment_terms, "name", ""),
                cancellation_terms=getattr(instance.cancellation_terms, "name", ""),
                pricing_terms=getattr(instance.pricing_terms, "name", ""),
                cancellation_rule=getattr(instance.cancellation_rule, "name", ""),
                price_unit=getattr(pricing, "price_unit", ""),
                lowest_price=getattr(pricing, "lowest_price", ""),
                highest_price=getattr(pricing, "highest_price", ""),
                tax_percentage=getattr(pricing, "tax_percentage", ""),
                reservation_begins=(
                    local_datetime_string(instance.reservation_begins)  #
                    if instance.reservation_begins
                    else None
                ),
                reservation_ends=(
                    local_datetime_string(instance.reservation_ends)  #
                    if instance.reservation_ends
                    else None
                ),
                reservation_metadata_set=getattr(instance.metadata_set, "name", ""),
                require_a_handling=instance.require_reservation_handling,
                authentication=AuthenticationType(instance.authentication).label,
                reservation_kind=ReservationKind(instance.reservation_kind).label,
                payment_type=", ".join(payment_type.code for payment_type in instance.payment_types.all()),
                can_apply_free_of_charge=instance.can_apply_free_of_charge,
                additional_instructions_for_pending_reservation_fi=instance.reservation_pending_instructions_fi,
                additional_instructions_for_pending_reservation_sv=instance.reservation_pending_instructions_sv,
                additional_instructions_for_pending_reservation_en=instance.reservation_pending_instructions_en,
                additional_instructions_for_confirmed_reservation_fi=instance.reservation_confirmed_instructions_fi,
                additional_instructions_for_confirmed_reservation_sv=instance.reservation_confirmed_instructions_sv,
                additional_instructions_for_confirmed_reservation_en=instance.reservation_confirmed_instructions_en,
                additional_instructions_for_cancelled_reservations_fi=instance.reservation_cancelled_instructions_fi,
                additional_instructions_for_cancelled_reservations_sv=instance.reservation_cancelled_instructions_sv,
                additional_instructions_for_cancelled_reservations_en=instance.reservation_cancelled_instructions_en,
                maximum_reservation_duration=(
                    local_timedelta_string(instance.max_reservation_duration)  #
                    if instance.max_reservation_duration is not None
                    else None
                ),
                minimum_reservation_duration=(
                    local_timedelta_string(instance.min_reservation_duration)  #
                    if instance.min_reservation_duration is not None
                    else None
                ),
                maximum_number_of_persons=instance.max_persons,
                minimum_number_of_persons=instance.min_persons,
                surface_area=instance.surface_area,
                buffer_time_before_reservation=(
                    local_timedelta_string(instance.buffer_time_before)  #
                    if instance.buffer_time_before
                    else None
                ),
                buffer_time_after_reservation=(
                    local_timedelta_string(instance.buffer_time_after)  #
                    if instance.buffer_time_after
                    else None
                ),
                hauki_resource_id=getattr(instance.origin_hauki_resource, "id", None),
                reservation_start_interval=ReservationStartInterval(instance.reservation_start_interval).label,
                maximum_number_of_days_before_reservations_can_be_made=instance.reservations_max_days_before,
                minimum_days_before_reservations_can_be_made=instance.reservations_min_days_before,
                maximum_number_of_active_reservations_per_user=instance.max_reservations_per_user,
                allow_reservations_without_opening_hours=instance.allow_reservations_without_opening_hours,
                is_reservation_unit_archived=instance.is_archived,
                services=", ".join(service.name_fi for service in instance.services.all()),
                purposes=", ".join(purpose.name_fi for purpose in instance.purposes.all()),
                require_introduction=instance.require_introduction,
                equipments=", ".join(equipment.name_fi for equipment in instance.equipments.all()),
                state=instance.publishing_state,
                reservation_state=instance.reservation_state,
            )
        ]
