from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING, Literal, TypedDict

from django.db import models
from lookup_property import L

from tilavarauspalvelu.enums import (
    AccessType,
    AuthenticationType,
    PaymentType,
    PriceComponentKind,
    ReservationKind,
    ReservationStartInterval,
)
from tilavarauspalvelu.models import PriceComponent, ReservationUnit, ReservationUnitPricingGroup
from utils.date_utils import local_date

from ._base_exporter import BaseCSVExporter, BaseExportRow

if TYPE_CHECKING:
    from collections.abc import Iterable
    from decimal import Decimal

    from django_stubs_ext import WithAnnotations

    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet

    class ExportedReservationUnitAnnotations(TypedDict):
        past_pricing_group_rows: list[ReservationUnitPricingGroup]
        annotated_publishing_state: str
        annotated_reservation_state: str
        annotated_access_type: str | None

    class ExportedPriceComponentAnnotations(TypedDict):
        tax_percentage: Decimal | None

    type ExportedReservationUnit = WithAnnotations[ReservationUnit, ExportedReservationUnitAnnotations]
    type ExportedPriceComponent = WithAnnotations[PriceComponent, ExportedPriceComponentAnnotations]

__all__ = [
    "ReservationUnitExporter",
]


@dataclasses.dataclass
class ReservationUnitExportRow(BaseExportRow):
    reservation_unit_id: str | int = ""
    name: str = ""
    name_fi: str | None = ""
    name_en: str | None = ""
    name_sv: str | None = ""
    description: str = ""
    description_fi: str = ""
    description_en: str = ""
    description_sv: str = ""
    type: str = ""
    notes_when_applying: str | None = ""
    notes_when_applying_fi: str | None = ""
    notes_when_applying_en: str | None = ""
    notes_when_applying_sv: str | None = ""
    service_specific_terms: str = ""
    tprek_id: str = ""
    unit: str = ""
    contact_information: str = ""
    is_this_in_draft_state: str | bool = ""
    publish_begins_at: str | None = ""
    publish_ends_at: str | None = ""
    spaces: str = ""
    resources: str = ""
    payment_terms: str = ""
    cancellation_terms: str = ""
    pricing_terms: str = ""
    cancellation_rule: str = ""
    price_unit: str = ""
    lowest_price: str = ""
    highest_price: str = ""
    tax_percentage: str = ""
    material_price_description: str = ""
    reservation_begins_at: str | None = ""
    reservation_ends_at: str | None = ""
    reservation_form: str = ""
    require_a_handling: str | bool = ""
    authentication: str = ""
    reservation_kind: str = ""
    access_type: str = ""
    payment_type: str = ""
    can_apply_free_of_charge: str | bool = ""
    additional_instructions_for_pending_reservation_fi: str | None = ""
    additional_instructions_for_pending_reservation_sv: str | None = ""
    additional_instructions_for_pending_reservation_en: str | None = ""
    additional_instructions_for_confirmed_reservation_fi: str | None = ""
    additional_instructions_for_confirmed_reservation_sv: str | None = ""
    additional_instructions_for_confirmed_reservation_en: str | None = ""
    additional_instructions_for_cancelled_reservations_fi: str | None = ""
    additional_instructions_for_cancelled_reservations_sv: str | None = ""
    additional_instructions_for_cancelled_reservations_en: str | None = ""
    maximum_reservation_duration: str | int | None = ""
    minimum_reservation_duration: str | int | None = ""
    maximum_number_of_persons: str | int | None = ""
    minimum_number_of_persons: str | int | None = ""
    surface_area: str | int | None = ""
    buffer_time_before_reservation: str | int | None = ""
    buffer_time_after_reservation: str | int | None = ""
    hauki_resource_id: str | int | None = ""
    reservation_start_interval: str | int | None = ""
    maximum_number_of_days_before_reservations_can_be_made: str | int | None = ""
    minimum_days_before_reservations_can_be_made: str | int | None = ""
    maximum_number_of_active_reservations_per_user: str | int | None = ""
    is_reservation_unit_archived: str | bool = ""
    intended_uses: str = ""
    equipments: str = ""
    state: str = ""
    reservation_state: str = ""
    updated_at: str | None = ""


class ReservationUnitExporter(BaseCSVExporter["ExportedReservationUnit"]):
    """Exports reservation units to a CSV file."""

    def __init__(
        self,
        queryset: ReservationUnitQuerySet | None = None,
        *,
        datetime_format: Literal["ISO", "local"] = "local",
    ) -> None:
        self._queryset: ReservationUnitQuerySet = queryset if queryset is not None else ReservationUnit.objects.all()
        super().__init__(datetime_format=datetime_format)

    @property
    def queryset(self) -> ReservationUnitQuerySet[ExportedReservationUnit, ExportedReservationUnit]:
        today = local_date()
        components_today = (
            PriceComponent.objects
            .filter(
                models.Q(valid_until__isnull=True) | models.Q(valid_until__gt=today),
                kind=PriceComponentKind.BASE,
                valid_from__lte=today,
            )
            .annotate(tax_percentage=L("tax_level__current_percentage"))
            .order_by("amount")
        )
        pricing_group_rows = (
            ReservationUnitPricingGroup.objects
            .filter(begins__lte=today)
            .order_by("-begins")
            .prefetch_related(
                models.Prefetch("pricing_group__components", components_today, to_attr="components_today"),
            )
        )

        return (
            self._queryset
            .select_related(
                "unit",
                "origin_hauki_resource",
                "reservation_unit_type",
                "cancellation_rule",
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
                "intended_uses",
                "equipments",
                models.Prefetch(
                    "reservation_unit_pricing_groups", pricing_group_rows, to_attr="past_pricing_group_rows"
                ),
            )
            .annotate(
                annotated_publishing_state=L("publishing_state"),
                annotated_reservation_state=L("reservation_state"),
                annotated_access_type=L("current_access_type"),
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
                notes_when_applying="Notes when applying",
                notes_when_applying_fi="Notes when applying fi",
                notes_when_applying_en="Notes when applying en",
                notes_when_applying_sv="Notes when applying sv",
                service_specific_terms="Service-specific terms",
                tprek_id="TPRek ID",
                unit="Unit",
                contact_information="Contact information",
                is_this_in_draft_state="Is this in draft state",
                publish_begins_at="Publish begins",
                publish_ends_at="Publish ends",
                spaces="Spaces",
                resources="Resources",
                payment_terms="Payment terms",
                cancellation_terms="Cancellation terms",
                pricing_terms="Pricing terms",
                cancellation_rule="Cancellation rule",
                price_unit="Price unit",
                lowest_price="Lowest price",
                highest_price="Highest price",
                tax_percentage="Tax percentage",
                material_price_description="Material price description",
                reservation_begins_at="Reservation begins",
                reservation_ends_at="Reservation ends",
                reservation_form="Reservation form",
                require_a_handling="Require a handling",
                authentication="Authentication",
                reservation_kind="Reservation kind",
                access_type="Access type",
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
                is_reservation_unit_archived="Is reservation unit archived",
                intended_uses="Intended Uses",
                equipments="Equipments",
                state="State",
                reservation_state="Reservation state",
                updated_at="Updated at",
            ),
        ]

    def get_data_rows(self, instance: ExportedReservationUnit) -> Iterable[ReservationUnitExportRow]:
        # The base prices in effect today, from the lowest to the highest. There are many with price options.
        pricing_group_rows: list[ReservationUnitPricingGroup] = instance.past_pricing_group_rows
        components: list[ExportedPriceComponent] = (
            pricing_group_rows[0].pricing_group.components_today if pricing_group_rows else []
        )
        lowest_component = components[0] if components else None
        highest_component = components[-1] if components else None

        start_interval = ReservationStartInterval(instance.reservation_start_interval)
        payment_type = instance.payment_type
        tax_percentage = highest_component.tax_percentage if highest_component is not None else None
        access_type = instance.annotated_access_type

        space_names = (space.name_fi or space.name_en or space.name_sv for space in instance.spaces.all())
        resource_names = (
            resource.name_fi or resource.name_en or resource.name_sv for resource in instance.resources.all()
        )
        intended_use_names = (
            intended_use.name_fi or intended_use.name_en or intended_use.name_sv
            for intended_use in instance.intended_uses.all()
        )
        equipment_names = (
            equipment.name_fi or equipment.name_en or equipment.name_sv for equipment in instance.equipments.all()
        )

        return [
            ReservationUnitExportRow(
                reservation_unit_id=instance.id,
                name=instance.name,
                name_fi=instance.name_fi,
                name_en=instance.name_en,
                name_sv=instance.name_sv,
                description=instance.description.replace("\n", " "),
                description_fi=(instance.description_fi or "").replace("\n", " "),
                description_en=(instance.description_en or "").replace("\n", " "),
                description_sv=(instance.description_sv or "").replace("\n", " "),
                type=getattr(instance.reservation_unit_type, "name", ""),
                notes_when_applying=instance.notes_when_applying,
                notes_when_applying_fi=instance.notes_when_applying_fi,
                notes_when_applying_en=instance.notes_when_applying_en,
                notes_when_applying_sv=instance.notes_when_applying_sv,
                service_specific_terms=getattr(instance.service_specific_terms, "name", ""),
                tprek_id=instance.unit.tprek_id or "",
                unit=instance.unit.name or "",
                contact_information=instance.contact_information,
                is_this_in_draft_state=instance.is_draft,
                publish_begins_at=self.format_datetime(instance.publish_begins_at),
                publish_ends_at=self.format_datetime(instance.publish_ends_at),
                spaces=", ".join(name for name in space_names if name),
                resources=", ".join(name for name in resource_names if name),
                payment_terms=getattr(instance.payment_terms, "name", ""),
                cancellation_terms=getattr(instance.cancellation_terms, "name", ""),
                pricing_terms=getattr(instance.pricing_terms, "name", ""),
                cancellation_rule=getattr(instance.cancellation_rule, "name", ""),
                price_unit=getattr(highest_component, "price_unit", ""),
                lowest_price=getattr(lowest_component, "amount", ""),
                highest_price=getattr(highest_component, "amount", ""),
                tax_percentage=f"{tax_percentage}%" if tax_percentage is not None else "",
                # Includes any HTML tags
                material_price_description=getattr(highest_component, "material_price_description", ""),
                reservation_begins_at=self.format_datetime(instance.reservation_begins_at),
                reservation_ends_at=self.format_datetime(instance.reservation_ends_at),
                reservation_form=getattr(instance, "reservation_form", ""),
                require_a_handling=instance.require_reservation_handling,
                authentication=str(AuthenticationType(instance.authentication).label),
                reservation_kind=str(ReservationKind(instance.reservation_kind).label),
                access_type=str(AccessType(access_type).label) if access_type is not None else "",
                payment_type=str(PaymentType(payment_type).label) if payment_type else "",
                can_apply_free_of_charge=any(component.can_apply_for_discount for component in components),
                additional_instructions_for_pending_reservation_fi=instance.reservation_pending_instructions_fi,
                additional_instructions_for_pending_reservation_sv=instance.reservation_pending_instructions_sv,
                additional_instructions_for_pending_reservation_en=instance.reservation_pending_instructions_en,
                additional_instructions_for_confirmed_reservation_fi=instance.reservation_confirmed_instructions_fi,
                additional_instructions_for_confirmed_reservation_sv=instance.reservation_confirmed_instructions_sv,
                additional_instructions_for_confirmed_reservation_en=instance.reservation_confirmed_instructions_en,
                additional_instructions_for_cancelled_reservations_fi=instance.reservation_cancelled_instructions_fi,
                additional_instructions_for_cancelled_reservations_sv=instance.reservation_cancelled_instructions_sv,
                additional_instructions_for_cancelled_reservations_en=instance.reservation_cancelled_instructions_en,
                maximum_reservation_duration=self.format_timedelta(instance.max_reservation_duration),
                minimum_reservation_duration=self.format_timedelta(instance.min_reservation_duration),
                maximum_number_of_persons=instance.max_persons,
                minimum_number_of_persons=instance.min_persons,
                surface_area=instance.surface_area,
                buffer_time_before_reservation=self.format_timedelta(instance.buffer_time_before),
                buffer_time_after_reservation=self.format_timedelta(instance.buffer_time_after),
                hauki_resource_id=getattr(instance.origin_hauki_resource, "id", None),
                reservation_start_interval=self.format_timedelta(start_interval.as_timedelta),
                maximum_number_of_days_before_reservations_can_be_made=instance.reservations_max_days_before,
                minimum_days_before_reservations_can_be_made=instance.reservations_min_days_before,
                maximum_number_of_active_reservations_per_user=instance.max_reservations_per_user,
                is_reservation_unit_archived=instance.is_archived,
                intended_uses=", ".join(name for name in intended_use_names if name),
                equipments=", ".join(name for name in equipment_names if name),
                state=instance.annotated_publishing_state,
                reservation_state=instance.annotated_reservation_state,
                updated_at=self.format_datetime(instance.updated_at),
            )
        ]
