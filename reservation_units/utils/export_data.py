from csv import QUOTE_ALL, writer
from pathlib import Path
from typing import List, Optional

from django.conf import settings
from django.utils import timezone
from django.utils.timezone import get_default_timezone

from ..models import ReservationUnit


class ReservationUnitExporter:
    @classmethod
    def export_reservation_unit_data(cls, queryset=None) -> Optional[Path]:
        now = timezone.now()
        root = settings.BASE_DIR
        path = root / "exports" / "reservation_unit_exports"
        path.mkdir(parents=True, exist_ok=True)
        reservation_units: List[ReservationUnit] = list(queryset) if queryset else list(ReservationUnit.objects.all())

        if reservation_units:
            file_name = f"reservation_units__{now.strftime('%d-%m-%Y')}.csv"

            with open(path / file_name, "w", newline="") as reservations_file:
                reservations_writer = writer(reservations_file, "excel", quoting=QUOTE_ALL)

                cls._write_header_row(reservations_writer)

                for reservation_unit in reservation_units:
                    pricing = reservation_unit.pricings.active()
                    reservations_writer.writerow(
                        [
                            reservation_unit.id,
                            reservation_unit.name,
                            reservation_unit.name_fi,
                            reservation_unit.name_en,
                            reservation_unit.name_sv,
                            reservation_unit.description,
                            reservation_unit.description_fi,
                            reservation_unit.description_en,
                            reservation_unit.description_sv,
                            getattr(reservation_unit.reservation_unit_type, "name", ""),
                            reservation_unit.terms_of_use,
                            reservation_unit.terms_of_use_fi,
                            reservation_unit.terms_of_use_en,
                            reservation_unit.terms_of_use_sv,
                            reservation_unit.service_specific_terms,
                            getattr(reservation_unit.unit, "tprek_id", ""),
                            getattr(reservation_unit.unit, "name", ""),
                            reservation_unit.contact_information,
                            reservation_unit.is_draft,
                            reservation_unit.publish_begins,
                            reservation_unit.publish_ends,
                            ", ".join(reservation_unit.spaces.values_list("name_fi", flat=True)),
                            ", ".join(reservation_unit.resources.values_list("name_fi", flat=True)),
                            ", ".join(reservation_unit.qualifiers.all().values_list("name_fi", flat=True)),
                            getattr(reservation_unit.payment_terms, "name", ""),
                            getattr(reservation_unit.cancellation_terms, "name", ""),
                            getattr(reservation_unit.pricing_terms, "name", ""),
                            getattr(reservation_unit.cancellation_rule, "name", ""),
                            pricing.price_unit,
                            pricing.lowest_price,
                            pricing.highest_price,
                            pricing.tax_percentage,
                            reservation_unit.reservation_begins.astimezone(get_default_timezone()).strftime(
                                "%d:%m:%Y %H:%M"
                            )
                            if reservation_unit.reservation_begins
                            else "",
                            reservation_unit.reservation_ends.astimezone(get_default_timezone()).strftime(
                                "%d:%m:%Y %H:%M"
                            )
                            if reservation_unit.reservation_ends
                            else "",
                            getattr(reservation_unit.metadata_set, "name", ""),
                            reservation_unit.require_reservation_handling,
                            reservation_unit.authentication,
                            reservation_unit.reservation_kind,
                            pricing.pricing_type,
                            ", ".join(reservation_unit.payment_types.values_list("code", flat=True)),
                            reservation_unit.can_apply_free_of_charge,
                            reservation_unit.reservation_pending_instructions_fi,
                            reservation_unit.reservation_pending_instructions_sv,
                            reservation_unit.reservation_pending_instructions_en,
                            reservation_unit.reservation_confirmed_instructions_fi,
                            reservation_unit.reservation_confirmed_instructions_sv,
                            reservation_unit.reservation_confirmed_instructions_en,
                            reservation_unit.reservation_cancelled_instructions_fi,
                            reservation_unit.reservation_cancelled_instructions_sv,
                            reservation_unit.reservation_cancelled_instructions_en,
                            reservation_unit.max_reservation_duration,
                            reservation_unit.min_reservation_duration,
                            reservation_unit.max_persons,
                            reservation_unit.min_persons,
                            reservation_unit.surface_area,
                            reservation_unit.buffer_time_before,
                            reservation_unit.buffer_time_after,
                            reservation_unit.hauki_resource_id,
                            reservation_unit.reservation_start_interval,
                            reservation_unit.reservations_max_days_before,
                            reservation_unit.reservations_min_days_before,
                            reservation_unit.max_reservations_per_user,
                            reservation_unit.allow_reservations_without_opening_hours,
                            reservation_unit.is_archived,
                            ", ".join(reservation_unit.services.all().values_list("name_fi", flat=True)),
                            ", ".join(reservation_unit.purposes.all().values_list("name_fi", flat=True)),
                            reservation_unit.require_introduction,
                            ", ".join(reservation_unit.equipments.all().values_list("name_fi", flat=True)),
                            reservation_unit.state.value,
                            reservation_unit.reservation_state.value,
                        ]
                    )
            return path / file_name

    @staticmethod
    def _write_header_row(writer):
        # Write header rows
        writer.writerow(
            [
                "Reservation unit ID",
                "Name",
                "Name [fi]",
                "Name [en]",
                "Name [sv]",
                "Description",
                "Description [fi]",
                "Description [en]",
                "Description [sv]",
                "Type",
                "Terms of use",
                "Terms of use [fi]",
                "Terms of use [en]",
                "Terms of use [sv]",
                "Service-specific terms",
                "TPRek ID",
                "Unit",
                "Contact information",
                "Is this in draft state",
                "Publish begins",
                "Publish ends",
                "Spaces",
                "Resources",
                "Qualifiers",
                "Payment terms",
                "Cancellation terms",
                "Pricing terms",
                "Cancellation rule",
                "Price unit",
                "Lowest price",
                "Highest price",
                "Tax percentage",
                "Reservation begins",
                "Reservation ends",
                "Reservation metadata set",
                "Require a handling",
                "Authentication",
                "Reservation kind",
                "Pricing types",
                "Payment type",
                "Can apply free of charge",
                "Additional instructions for pending reservation [fi]",
                "Additional instructions for pending reservation [sv]",
                "Additional instructions for pending reservation [en]",
                "Additional instructions for confirmed reservation [fi]",
                "Additional instructions for confirmed reservation [sv]",
                "Additional instructions for confirmed reservation [en]",
                "Additional instructions for cancelled reservations [fi]",
                "Additional instructions for cancelled reservations [sv]",
                "Additional instructions for cancelled reservations [en]",
                "Maximum reservation duration",
                "Minimum reservation duration",
                "Maximum number of persons",
                "Minimum number of persons",
                "Surface area",
                "Buffer time before reservation",
                "Buffer time after reservation",
                "Hauki resource id",
                "Reservation start interval",
                "Maximum number of days before reservations can be made",
                "Minimum days before reservations can be made",
                "Maximum number of active reservations per user",
                "Allow reservations without opening hours",
                "Is reservation unit archived",
                "Services",
                "Purposes",
                "Require introduction",
                "Equipments",
                "State",
                "Reservation state",
            ]
        )
