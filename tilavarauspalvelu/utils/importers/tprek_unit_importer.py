import logging
from dataclasses import asdict
from typing import TYPE_CHECKING

from django.db.models import QuerySet
from django.db.transaction import atomic

from tilavarauspalvelu.models import Location, OriginHaukiResource, Unit
from tilavarauspalvelu.utils.importers.tprek_api_client import TprekAPIClient, TprekLocationData, TprekUnitData
from tilavarauspalvelu.utils.opening_hours.hauki_api_client import HaukiAPIClient
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    from tilavarauspalvelu.utils.opening_hours import HaukiAPIResource

logger = logging.getLogger(__name__)


class TprekUnitImporter:
    def __init__(self) -> None:
        self.updated_units_count = 0
        self.units_for_hauki_import = []

    def update_unit_from_tprek(self, units: list[Unit] | QuerySet[Unit], force_update: bool = False) -> None:
        """
        Get the data for each unit from TPREK API, and update the corresponding unit in the database

        Note:
        - We need to fetch the data for each unit, because the TPREK API does not support filtering by time_modified.
        - This method could be optimized for less API requests by first fetching all units with a department_id
          in batches, and then fetching all units without a department_id individually.
        """
        logger.info(f"Started importing TPREK info for {len(units)} units...")

        for unit in units:
            if unit.tprek_id is None:
                raise ValueError(f"Unit TPREK ID is None: {unit.pk}")

            tprek_unit_data, tprek_location_data = TprekAPIClient.get_unit(unit_tprek_id=unit.tprek_id)

            if tprek_unit_data is None:
                SentryLogger.log_message(message=f"Unit {unit.pk=} {unit.tprek_id=} not found in TPREK API.")
                continue

            if (
                force_update
                or unit.tprek_last_modified is None
                or unit.tprek_last_modified < tprek_unit_data.tprek_last_modified
            ):
                self._update_unit(unit, tprek_unit_data, tprek_location_data)

        logger.info(f"Updated {self.updated_units_count} from TPREK.")

        if self.units_for_hauki_import:
            tprek_hauki_resource_importer = TprekUnitHaukiResourceIdImporter()
            tprek_hauki_resource_importer.import_hauki_resources_for_units(self.units_for_hauki_import)

    @atomic
    def _update_unit(self, unit: Unit, tprek_unit_data: TprekUnitData, tprek_location_data: TprekLocationData) -> None:
        """Updates a Unit and its location from the given TPREK data."""
        for field, value in asdict(tprek_unit_data).items():
            setattr(unit, field, value)
        unit.save()

        Location.objects.update_or_create(unit=unit, defaults=asdict(tprek_location_data))

        self.updated_units_count += 1
        if unit.origin_hauki_resource is None:
            self.units_for_hauki_import.append(unit)


class TprekUnitHaukiResourceIdImporter:
    @classmethod
    def import_hauki_resources_for_units(cls, units: list[Unit]) -> None:
        hauki_resource_id_map = cls._fetch_hauki_resource_ids(units)

        logger.info(f"Importing Hauki resources for {len(units)} units...")

        updated_units_count = 0
        created_resources_count = 0
        for unit in units:
            hauki_resource_id = hauki_resource_id_map.get(str(unit.tprek_id))
            if hauki_resource_id:
                origin_hauki_resource, created = OriginHaukiResource.objects.get_or_create(id=hauki_resource_id)
                unit.origin_hauki_resource = origin_hauki_resource
                unit.save()
                updated_units_count += 1
                if created:
                    created_resources_count += 1

        logger.info(
            f"Saved Hauki resources for {updated_units_count}/{len(units)} units. "
            f"Created {created_resources_count} new OriginHaukiResources."
        )

    @classmethod
    def _fetch_hauki_resource_ids(cls, units: list[Unit]) -> dict[str, str]:
        # Fetch only units that don't have a Hauki resource yet
        tprek_ids: list[str] = [f"tprek:{unit.tprek_id}" for unit in units if unit.origin_hauki_resource is None]

        if not tprek_ids:
            return {}

        hauki_resources: list[HaukiAPIResource] = HaukiAPIClient.get_resources_all_pages(
            hauki_resource_ids=tprek_ids,
            data_source="tprek",
            origin_id_exists=True,
            page_size=50000,
        )

        hauki_resource_id_map: dict[str, str | int] = {}

        # For each Hauki resource, find the origin with data_source=tprek and add the origin id to the map
        for hauki_resource in hauki_resources:
            for resource_origin in hauki_resource["origins"]:
                if resource_origin["data_source"]["id"] == "tprek":
                    hauki_resource_id_map[resource_origin["origin_id"]] = str(hauki_resource["id"])
                    break

        return hauki_resource_id_map
