import logging
from datetime import datetime, time

from django.utils import timezone

from common.date_utils import DEFAULT_TIMEZONE
from tilavarauspalvelu.exceptions import ReservableTimeSpanClientNothingToDoError, ReservableTimeSpanClientValueError
from tilavarauspalvelu.models import OriginHaukiResource
from tilavarauspalvelu.utils.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.utils.opening_hours.hauki_api_types import HaukiAPIResource
from tilavarauspalvelu.utils.opening_hours.reservable_time_span_client import ReservableTimeSpanClient

logger = logging.getLogger(__name__)


class HaukiResourceHashUpdater:
    # List of resource ids that should be updated
    hauki_resource_ids: list[int]

    # List of resources fetched from Hauki API
    fetched_hauki_resources: list[HaukiAPIResource]

    # Resources that have had their opening hours (hash) changed
    resources_updated: list[OriginHaukiResource]

    def __init__(self, hauki_resource_ids: list[int] | None = None) -> None:
        self.hauki_resource_ids = hauki_resource_ids

        if self.hauki_resource_ids is None:
            self.hauki_resource_ids = OriginHaukiResource.objects.values_list("id", flat=True)

        if not self.hauki_resource_ids:
            logger.info("No resources to update.")

        self.fetched_hauki_resources = []
        self.resources_updated = []

    def run(self, *, force_refetch: bool = False) -> None:
        self._fetch_hauki_resources()

        if not self.fetched_hauki_resources:
            logger.info("No resources returned from the Hauki API.")
            return

        self._update_origin_hauki_resource_hashes(force_refetch=force_refetch)

        if not self.resources_updated:
            logger.info("There was no need to update any OriginHaukiResource hashes.")
            return

        self._create_reservable_time_spans_for_reservation_units()

        logger.info(f"Updated hashes for {len(self.resources_updated)} origin hauki resources.")
        logger.info("Done!")

    def _fetch_hauki_resources(self) -> None:
        """Fetch resources from Hauki API based on the given resource ids."""
        self.fetched_hauki_resources = HaukiAPIClient.get_resources_all_pages(
            hauki_resource_ids=self.hauki_resource_ids
        )
        logger.info(f"Fetched {len(self.fetched_hauki_resources)} hauki resources in total.")

    def _update_origin_hauki_resource_hashes(self, force_refetch: bool = False) -> None:
        """Update hashes for OriginHaukiResources that have had their opening hours changed."""
        cutoff_date = timezone.now().date()

        for resource in self.fetched_hauki_resources:
            # Check if the resources hash has changed
            origin_hauki_resource = OriginHaukiResource.objects.filter(id=resource["id"]).first()

            if origin_hauki_resource is None:
                logger.info(f"OriginHaukiResource with ID '{resource['id']}' was not found.")
                continue

            if origin_hauki_resource.opening_hours_hash == resource["date_periods_hash"]:
                if not force_refetch:
                    logger.info(f"OriginHaukiResource '{resource['id']}' date periods hash is unchanged, skipping.")
                    continue
            else:
                logger.info(f"Updating 'Opening Hours Hash' for resource '{resource['id']}'.")

            # Update the hash and set the latest fetched date to None
            origin_hauki_resource.opening_hours_hash = resource["date_periods_hash"]
            origin_hauki_resource.latest_fetched_date = None
            origin_hauki_resource.save()

            # Delete all new reservable time spans for the resource.
            # Old time spans are not deleted, as they are kept for archival purposes.
            origin_hauki_resource.reservable_time_spans.filter(start_datetime__gte=cutoff_date).delete()

            # If there are any ReservableTimeSpans that overlap with the cutoff date, have them end at the cutoff date.
            # This way we can keep all past data, and have the new data start from the cutoff date.
            origin_hauki_resource.reservable_time_spans.filter(end_datetime__gte=cutoff_date).update(
                end_datetime=datetime.combine(cutoff_date, time.min, tzinfo=DEFAULT_TIMEZONE)
            )

            self.resources_updated.append(origin_hauki_resource)

    def _create_reservable_time_spans_for_reservation_units(self) -> int:
        """Create reservable time spans for all updated OriginHaukiResources."""
        total_reservable_time_spans_created = 0

        for resource in self.resources_updated:
            try:
                client = ReservableTimeSpanClient(resource)
            except (ReservableTimeSpanClientValueError, ReservableTimeSpanClientNothingToDoError):
                continue
            num_created_time_spans = len(client.run())
            total_reservable_time_spans_created += num_created_time_spans
            logger.info(f"Created {num_created_time_spans} reservable time spans for resource '{resource}'.")

        if total_reservable_time_spans_created:
            logger.info(f"Created {total_reservable_time_spans_created} new reservable time spans in total.")
        else:
            logger.info("No reservable time spans created.")
        return total_reservable_time_spans_created
