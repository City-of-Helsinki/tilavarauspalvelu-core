from csv import QUOTE_ALL, writer
from pathlib import Path
from typing import List

from django.conf import settings
from django.utils import timezone

from ..models import ReservationUnit


class ReservationUnitExporter:
    @classmethod
    def export_reservation_unit_data(cls):
        now = timezone.now()
        root = Path(settings.BASE_DIR)
        path = root / "exports" / "reservation_unit_exports"
        path.mkdir(parents=True, exist_ok=True)
        reservation_units: List[ReservationUnit] = list(ReservationUnit.objects.all())

        if reservation_units:
            file_name = f"reservation_units__{now.strftime('%d-%m-%Y')}.csv"

            with open(path / file_name, "w", newline="") as reservations_file:
                reservations_writer = writer(
                    reservations_file, "excel", quoting=QUOTE_ALL
                )

                cls._write_header_row(reservations_writer)

                for reservation_unit in reservation_units:
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
                            getattr(reservation_unit.unit, "name", ""),
                            reservation_unit.contact_information,
                            reservation_unit.is_draft,
                            reservation_unit.publish_begins,
                            reservation_unit.publish_ends,
                        ]
                    )

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
                "Unit",
                "Contact information",
                "Is this in draft state",
                "Publish begins",
                "Publish ends",
            ]
        )
