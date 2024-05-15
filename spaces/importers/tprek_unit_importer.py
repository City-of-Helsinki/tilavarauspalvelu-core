import logging
from dataclasses import asdict

from django.db.models import QuerySet
from django.db.transaction import atomic

from spaces.importers.tprek_api_client import TprekAPIClient, TprekLocationData, TprekUnitData
from spaces.models import Location, Unit
from utils.sentry import SentryLogger

logger = logging.getLogger(__name__)


class TprekUnitImporter:
    def __init__(self) -> None:
        self.updated_units_count = 0

    @atomic
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

    def _update_unit(self, unit: Unit, tprek_unit_data: TprekUnitData, tprek_location_data: TprekLocationData) -> None:
        """Updates a Unit and its location from the given TPREK data."""
        for field, value in asdict(tprek_unit_data).items():
            setattr(unit, field, value)
        unit.save()

        Location.objects.update_or_create(unit=unit, defaults=asdict(tprek_location_data))

        self.updated_units_count += 1
