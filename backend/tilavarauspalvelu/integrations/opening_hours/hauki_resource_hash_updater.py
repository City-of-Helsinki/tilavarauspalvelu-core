from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.db import transaction

from tilavarauspalvelu.exceptions import ReservableTimeSpanClientNothingToDoError, ReservableTimeSpanClientValueError
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.integrations.opening_hours.reservable_time_span_client import ReservableTimeSpanClient
from tilavarauspalvelu.models import OriginHaukiResource

if TYPE_CHECKING:
    from tilavarauspalvelu.integrations.opening_hours.hauki_api_types import HaukiAPIResource

logger = logging.getLogger(__name__)


class HaukiResourceHashUpdater:
    # List of resource ids that should be updated
    hauki_resource_ids: list[int]

    # Resources that have had their opening hours (hash) changed
    resources_updated: list[OriginHaukiResource]
    total_time_spans_created: int

    def __init__(self, hauki_resource_ids: list[int] | None = None) -> None:
        # Initialise the list of resource ids if it is not provided
        if hauki_resource_ids is None:
            hauki_resource_ids = list(OriginHaukiResource.objects.values_list("id", flat=True))

        self.hauki_resource_ids = hauki_resource_ids
        self.resources_updated = []
        self.total_time_spans_created = 0

    def run(self, *, force_refetch: bool = False) -> None:
        fetched_hauki_resources = HaukiAPIClient.get_resources_all_pages(hauki_resource_ids=self.hauki_resource_ids)

        logger.info("Fetched %s hauki resources for hash update.", len(fetched_hauki_resources))
        if not fetched_hauki_resources:
            return

        for resource in fetched_hauki_resources:
            self._process_single_hauki_resource(resource, force_refetch=force_refetch)

        self._log_results()

    def _log_results(self) -> None:
        if not self.resources_updated:
            logger.info("There was no need to update any OriginHaukiResource hashes.")
            return
        logger.info("Updated hashes for %s origin hauki resources.", len(self.resources_updated))

        if self.total_time_spans_created:
            logger.info("Created %s new reservable time spans in total.", self.total_time_spans_created)
        else:
            logger.info("No reservable time spans created.")

    def _process_single_hauki_resource(self, resource: HaukiAPIResource, *, force_refetch: bool = False) -> None:
        origin_hauki_resource = OriginHaukiResource.objects.filter(id=resource["id"]).first()
        if origin_hauki_resource is None:
            logger.warning("OriginHaukiResource with ID '%s' was not found.", resource["id"])
            return

        should_update_resource = (
            force_refetch  #
            or origin_hauki_resource.actions.should_update_opening_hours(resource["date_periods_hash"])
        )
        if not should_update_resource:
            return

        logger.debug("Updating 'Opening Hours Hash' for resource '%s'.", resource["id"])

        with transaction.atomic():
            if origin_hauki_resource.opening_hours_hash != resource["date_periods_hash"]:
                origin_hauki_resource.actions.update_opening_hours_hash(resource["date_periods_hash"])

            self._create_reservable_time_spans(origin_hauki_resource)

        self.resources_updated.append(origin_hauki_resource)

    def _create_reservable_time_spans(self, origin_hauki_resource: OriginHaukiResource) -> None:
        try:
            client = ReservableTimeSpanClient(origin_hauki_resource)
            num_created_time_spans = len(client.run())
        except (ReservableTimeSpanClientValueError, ReservableTimeSpanClientNothingToDoError):
            return

        logger.info(
            "Created %s reservable time spans for resource %s.",
            num_created_time_spans,
            origin_hauki_resource.id,
        )

        self.total_time_spans_created += num_created_time_spans
