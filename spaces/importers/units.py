import logging

from django.db import transaction

from opening_hours.models import OriginHaukiResource
from opening_hours.utils.hauki_api_client import HaukiAPIClient
from opening_hours.utils.hauki_api_types import HaukiAPIResourceListResponse
from spaces.models import Unit

logger = logging.getLogger(__name__)


class UnitHaukiResourceIdImporter:
    resource_id_map: dict[str, str]
    response_page_counter: int

    def __init__(self):
        self.resource_id_map = {}
        self.response_page_counter = 0

    def read_response(self, data):
        self.response_page_counter += 1
        logger.info(f"Fetching from hauki. Page number: {self.response_page_counter}")
        for resource in data["results"]:
            for origin in resource["origins"]:
                if origin["data_source"]["id"] == "tprek":
                    self.resource_id_map[origin["origin_id"]] = resource["id"]

    @transaction.atomic
    def import_hauki_resource_ids_for_units(
        self,
        unit_ids: list[int] | None = None,
        tprek_ids: list[str] | None = None,
    ):
        if not unit_ids and not tprek_ids:
            raise ValueError("Either unit_ids or tprek_ids is required.")

        # Use `unit_ids` if given, otherwise use `tprek_ids`.
        units = Unit.objects.filter(id__in=unit_ids) if unit_ids else Unit.objects.filter(tprek_id__in=tprek_ids)

        logger.info(f"Importing units {units} resource ids from Hauki...")

        response: HaukiAPIResourceListResponse = HaukiAPIClient.get_resources(
            hauki_resource_ids=[],
            data_source="tprek",
            origin_id_exists=True,
            page_size=50000,
        )
        self.read_response(response)

        # Keep fetching results until there are no more pages.
        next_url = response.get("next", None)
        while next_url:
            response_json: HaukiAPIResourceListResponse = HaukiAPIClient.response_json(HaukiAPIClient.get(url=next_url))
            self.read_response(response_json)
            next_url = response_json.get("next", None)

        resource_ids_updated = []
        for unit in units:
            resource_id = self.resource_id_map.get(unit.tprek_id)
            if resource_id:
                origin_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id=resource_id)
                unit.origin_hauki_resource = origin_hauki_resource
                unit.save()
                resource_ids_updated.append(unit.tprek_id)

        logger.info(f"Updated resource ids for {len(resource_ids_updated)} units.")
