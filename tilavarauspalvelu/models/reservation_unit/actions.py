from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

from lookup_property import L

from tilavarauspalvelu.enums import AccessType, ApplicationRoundStatusChoice, PaymentType, ReservationStartInterval
from tilavarauspalvelu.exceptions import HaukiAPIError
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.integrations.opening_hours.hauki_api_types import HaukiTranslatedField
from tilavarauspalvelu.models import OriginHaukiResource
from utils.date_utils import (
    DEFAULT_TIMEZONE,
    local_date,
    local_datetime_max,
    local_datetime_min,
    local_end_of_day,
    local_start_of_day,
    time_as_timedelta,
)
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from collections.abc import Collection

    from django.db import models

    from tilavarauspalvelu.integrations.opening_hours.hauki_api_types import HaukiAPIResource
    from tilavarauspalvelu.models import (
        Location,
        PaymentAccounting,
        PaymentMerchant,
        Reservation,
        ReservationUnit,
        ReservationUnitPricing,
    )
    from tilavarauspalvelu.typing import TimeSpan


class ReservationUnitHaukiExporter:
    """
    Contains methods for sending ReservationUnit data to Hauki API.

    Kept separate from ReservationUnitActions to keep the class smaller and easier to read.
    """

    reservation_unit: ReservationUnit

    def send_reservation_unit_to_hauki(self) -> None:
        # Initialise data for the Hauki API
        hauki_resource_data = self._convert_reservation_unit_to_hauki_resource_data()

        # Send the data to Hauki API
        if self.reservation_unit.origin_hauki_resource is None:
            self._create_hauki_resource(hauki_resource_data)
        else:
            self._update_hauki_resource(hauki_resource_data)

    def _convert_reservation_unit_to_hauki_resource_data(self) -> dict[str, Any]:
        parent_unit_resource_id = self._get_parent_resource_id()
        if not parent_unit_resource_id:
            msg = "Parent Unit does have 'Hauki Resource' set and could not get it from Hauki API."
            raise HaukiAPIError(msg)

        if not self.reservation_unit.unit.tprek_department_id:
            msg = "Parent Unit does not have a department id."
            raise HaukiAPIError(msg)

        return {
            "name": HaukiTranslatedField(
                fi=self.reservation_unit.name_fi,
                sv=self.reservation_unit.name_sv,
                en=self.reservation_unit.name_en,
            ),
            "description": HaukiTranslatedField(
                fi=self.reservation_unit.description,
                sv=self.reservation_unit.description,
                en=self.reservation_unit.description,
            ),
            "resource_type": "reservable",
            "origins": [
                {
                    "data_source": {
                        "id": "tvp",
                        "name": "Tilavarauspalvelu",
                    },
                    "origin_id": str(self.reservation_unit.uuid),
                }
            ],
            "parents": [parent_unit_resource_id],
            "organization": f"tprek:{self.reservation_unit.unit.tprek_department_id}",
            "address": None,
            "children": [],
            "extra_data": {},
            "is_public": True,
            "timezone": "Europe/Helsinki",
        }

    def _get_parent_resource_id(self) -> int | None:
        """Get the parent units hauki resource id, so that the reservation unit can be added as a child in Hauki API."""
        parent_unit = self.reservation_unit.unit

        # No parent, no way to get the id
        if parent_unit is None:
            return None

        # If the parent has an origin_hauki_resource_id, use that
        if parent_unit.origin_hauki_resource is not None:
            return parent_unit.origin_hauki_resource.id

        # Unit doesn't have a hauki resource set, so try to get it from Hauki API
        # If the unit doesn't have a tprek_id, we can't get it from hauki
        if parent_unit.tprek_id is None:
            return None

        unit_origin_resource_id = f"tprek:{parent_unit.tprek_id}"
        try:
            resource_data = HaukiAPIClient.get_resource(hauki_resource_id=unit_origin_resource_id)
            return resource_data["id"]
        except (ExternalServiceError, KeyError, IndexError, TypeError):
            return None

    def _create_hauki_resource(self, hauki_resource_data: dict[str, Any]) -> None:
        """Create a new HaukiResource in Hauki API for the ReservationUnit."""
        # New Hauki Resource, create it in Hauki API and update the reservation unit
        response_data: HaukiAPIResource = HaukiAPIClient.create_resource(data=hauki_resource_data)

        # Save the returned Hauki Resource to the database as OriginHaukiResource
        origin_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id=response_data["id"])

        self.reservation_unit.origin_hauki_resource = origin_hauki_resource
        self.reservation_unit.save()

    def _update_hauki_resource(self, hauki_resource_data: dict[str, Any]) -> None:
        """Update the Hauki Resource in Hauki API with ReservationUnits data."""
        hauki_resource_data["id"] = self.reservation_unit.origin_hauki_resource.id

        # Existing Hauki Resource, update it in Hauki API
        HaukiAPIClient.update_resource(data=hauki_resource_data)


class ReservationUnitActions(ReservationUnitHaukiExporter):
    def __init__(self, reservation_unit: ReservationUnit) -> None:
        self.reservation_unit = reservation_unit

    def get_actual_before_buffer(
        self,
        reservation_begin: datetime.datetime | datetime.time,
        override: datetime.timedelta | None = None,
    ) -> datetime.timedelta:
        """
        Helper for finding actual buffer time before for a reservation unit to be used for its reservation.

        For reservation units where only one reservation is possible per day,
        the buffer is dependent on the reservation begin time (last until beginning of day).

        In some cases, an override can be provided that will be used instead of the reservation unit's value,
        but the override can not be used for reservation units that block the whole day.
        """
        if self.reservation_unit.reservation_block_whole_day:
            return time_as_timedelta(reservation_begin)
        if override is not None:
            return override
        return self.reservation_unit.buffer_time_before

    def get_actual_after_buffer(
        self,
        reservation_end: datetime.datetime | datetime.time,
        override: datetime.timedelta | None = None,
    ) -> datetime.timedelta:
        """
        Helper for finding actual buffer time after for a reservation unit to be used for its reservation.

        For reservation units where only one reservation is possible per day,
        the buffer is dependent on the reservation end time (last until end of day).
        For reservations ending at midnight the next day, the buffer should be 0.

        In some cases, an override can be provided that will be used instead of the reservation unit's value,
        but the override can not be used for reservation units that block the whole day.
        """
        if self.reservation_unit.reservation_block_whole_day:
            delta = time_as_timedelta(reservation_end)
            if delta == datetime.timedelta():  # midnight
                return delta
            return datetime.timedelta(hours=24) - delta
        if override is not None:
            return override
        return self.reservation_unit.buffer_time_after

    def get_location(self) -> Location:
        # For now, we assume that if reservation has multiple spaces they all have same location
        spaces = self.reservation_unit.spaces.all()
        return next((space.location for space in spaces if hasattr(space, "location")), None)

    def get_address(self) -> str:
        location = getattr(self.reservation_unit.unit, "location", None)
        if location is None:
            return ""
        return location.address

    def get_max_persons(self) -> int | None:
        # Sum of max persons for all spaces because group can be divided to different spaces
        return sum(space.max_persons or 0 for space in self.reservation_unit.spaces.all()) or None

    def has_overlapping_reservations(
        self,
        start_datetime: datetime.datetime,
        end_datetime: datetime.datetime,
        *,
        buffer_time_before: datetime.timedelta | None = None,
        buffer_time_after: datetime.timedelta | None = None,
        ignore_ids: Collection[int] = (),
    ) -> bool:
        from tilavarauspalvelu.models import Reservation

        qs = Reservation.objects.overlapping_reservations(
            reservation_unit=self.reservation_unit,
            begin=start_datetime,
            end=end_datetime,
            buffer_time_before=buffer_time_before,
            buffer_time_after=buffer_time_after,
        )

        if ignore_ids:
            qs = qs.exclude(pk__in=ignore_ids)

        return qs.exists()

    def get_next_reservation(
        self,
        *,
        end_time: datetime.datetime,
        reservation: Reservation | None = None,
        exclude_blocked: bool = False,
    ) -> Reservation | None:
        from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
        from tilavarauspalvelu.models import Reservation

        qs = Reservation.objects.filter(
            reservation_units__in=self.reservation_units_with_common_hierarchy,
            begin__gte=end_time,
        ).exclude(state__in=[ReservationStateChoice.CANCELLED, ReservationStateChoice.DENIED])

        if reservation:
            qs = qs.exclude(id=reservation.id)

        if exclude_blocked:
            qs = qs.exclude(type=ReservationTypeChoice.BLOCKED)

        return qs.order_by("begin").first()

    def get_previous_reservation(
        self,
        *,
        start_time: datetime.datetime,
        reservation: Reservation | None = None,
        exclude_blocked: bool = False,
    ) -> Reservation | None:
        from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
        from tilavarauspalvelu.models import Reservation

        qs = Reservation.objects.filter(
            reservation_units__in=self.reservation_units_with_common_hierarchy,
            end__lte=start_time,
        ).exclude(state__in=[ReservationStateChoice.CANCELLED, ReservationStateChoice.DENIED])

        if reservation:
            qs = qs.exclude(id=reservation.id)

        if exclude_blocked:
            qs = qs.exclude(type=ReservationTypeChoice.BLOCKED)

        return qs.order_by("-end").first()

    @property
    def reservation_units_with_common_hierarchy(self) -> models.QuerySet:
        """
        Find all "related" ReservationUnits where any one of these is true:
        1) There are common resources
        2) There are spaces belonging to the same "family"/hierarchy
           (see. `spaces.querysets.space.SpaceQuerySet.all_space_ids_though_hierarchy`)

        This method is used for finding all ReservationUnits that influence the availability of this ReservationUnit.

        Before making a new reservation, we need to ensure there are no overlapping reservations on any
        "related" ReservationUnits. For a new reservation to be allowed on a ReservationUnit, all its spaces and
        resources must be available during the reservation's time. If any "related" ReservationUnits already have
        reservations overlapping with the new one, the new reservation can not be made.
        """
        from tilavarauspalvelu.models import ReservationUnit

        return ReservationUnit.objects.filter(pk=self.reservation_unit.pk).reservation_units_with_common_hierarchy()

    def get_possible_start_times(self, on_date: datetime.date) -> set[datetime.time]:
        if self.reservation_unit.origin_hauki_resource is None:
            return set()

        time_spans: list[TimeSpan] = list(
            self.reservation_unit.origin_hauki_resource.reservable_time_spans.filter(
                start_datetime__date__lte=on_date,
                end_datetime__date__gte=on_date,
            )
            .order_by("start_datetime")
            .values("start_datetime", "end_datetime")
        )

        interval_minutes = self.reservation_unit.actions.start_interval_minutes
        interval_timedelta = datetime.timedelta(minutes=interval_minutes)

        possible_start_times: set[datetime.time] = set()

        for time_span in time_spans:
            start_datetime = time_span["start_datetime"].astimezone(DEFAULT_TIMEZONE)
            end_datetime = time_span["end_datetime"].astimezone(DEFAULT_TIMEZONE)

            if end_datetime.date() < on_date or on_date < start_datetime.date():
                continue

            if start_datetime.date() < on_date:
                start_datetime = local_start_of_day(on_date)

            if end_datetime.date() > on_date:
                end_datetime = local_end_of_day(on_date)

            while start_datetime < end_datetime:
                # Don't include times at the end timespans that are too small
                if end_datetime - start_datetime >= interval_timedelta:  # TODO: Should be `min_duration`?
                    possible_start_times.add(start_datetime.time())

                start_datetime += interval_timedelta

        return possible_start_times

    def get_possible_start_times_staff(self, on_date: datetime.date) -> set[datetime.time]:
        # Staff reservations ignore start intervals longer than 30 minutes
        interval_minutes = min(self.reservation_unit.actions.start_interval_minutes, 30)
        interval_timedelta = datetime.timedelta(minutes=interval_minutes)

        start_datetime = local_start_of_day(on_date)
        end_datetime = local_end_of_day(on_date)

        possible_start_times: set[datetime.time] = set()
        while start_datetime < end_datetime:
            possible_start_times.add(start_datetime.time())  # TODO: Validate `min_duration`?
            start_datetime += interval_timedelta

        return possible_start_times

    def is_open(self, start_datetime: datetime.datetime, end_datetime: datetime.datetime) -> bool:
        if self.reservation_unit.allow_reservations_without_opening_hours:
            return True

        origin_hauki_resource = self.reservation_unit.origin_hauki_resource
        if not origin_hauki_resource:
            return False
        return origin_hauki_resource.actions.is_reservable(start_datetime, end_datetime)

    def is_in_open_application_round(self, start_date: datetime.date, end_date: datetime.date) -> bool:
        from tilavarauspalvelu.models import ApplicationRound

        return (
            ApplicationRound.objects.filter(
                reservation_units=self.reservation_unit,
                reservation_period_end__gte=start_date,
                reservation_period_begin__lte=end_date,
            )
            .exclude(
                L(status=ApplicationRoundStatusChoice.RESULTS_SENT),
            )
            .exists()
        )

    def is_valid_staff_start_interval(self, begin_time: datetime.time) -> bool:
        interval_minutes = self.reservation_unit.actions.start_interval_minutes

        # Staff reservations ignore start intervals longer than 30 minutes
        interval_minutes = min(interval_minutes, 30)

        # For staff reservations, we don't need to care about opening hours,
        # so we can just check start interval from the beginning of the day.
        return begin_time.second == 0 and begin_time.microsecond == 0 and begin_time.minute % interval_minutes == 0

    def get_active_pricing(self, by_date: datetime.date | None = None) -> ReservationUnitPricing | None:
        return self.reservation_unit.pricings.active(from_date=by_date).first()

    def get_merchant(self) -> PaymentMerchant | None:
        if self.reservation_unit.payment_merchant is not None:
            return self.reservation_unit.payment_merchant
        if self.reservation_unit.unit and self.reservation_unit.unit.payment_merchant is not None:
            return self.reservation_unit.unit.payment_merchant

        return None

    def requires_product_mapping_update(self) -> bool:
        payment_merchant = self.get_merchant()
        if payment_merchant is None:
            return False
        if self.reservation_unit.payment_product is not None:
            return True
        if self.reservation_unit.is_draft:
            return False

        # Has PAID active or future pricings
        active_pricing = self.reservation_unit.actions.get_active_pricing()
        if active_pricing.highest_price > 0:
            return True
        return self.reservation_unit.pricings.filter(highest_price__gt=0, begins__gt=local_date()).exists()

    def get_accounting(self) -> PaymentAccounting | None:
        if self.reservation_unit.payment_accounting is not None:
            return self.reservation_unit.payment_accounting
        if self.reservation_unit.unit:
            return self.reservation_unit.unit.payment_accounting
        return None

    def get_access_type_at(self, moment: datetime.datetime) -> AccessType:
        moment = moment.astimezone(DEFAULT_TIMEZONE)

        begin = self.reservation_unit.perceived_access_type_start_date
        end = self.reservation_unit.perceived_access_type_end_date

        if begin <= moment.date() <= end:
            return AccessType(self.reservation_unit.access_type)

        return AccessType.UNRESTRICTED

    @property
    def start_interval_minutes(self) -> int:
        return ReservationStartInterval(self.reservation_unit.reservation_start_interval).as_number

    def get_default_payment_type(self) -> PaymentType | None:
        payment_types: set[str] = set(self.reservation_unit.payment_types.values_list("code", flat=True))
        if not payment_types:
            return None

        # If only one payment type is defined, use that
        if len(payment_types) == 1:
            return PaymentType(payment_types.pop())

        # If only 'INVOICE' and 'ON_SITE' are defined, use 'INVOICE'
        if payment_types == {PaymentType.INVOICE, PaymentType.ON_SITE}:
            return PaymentType.INVOICE

        # Otherwise, use 'ONLINE'
        return PaymentType.ONLINE

    def is_reservable_at(self, moment: datetime.datetime) -> bool:
        moment = moment.astimezone(DEFAULT_TIMEZONE)

        reservation_begins = self.reservation_unit.reservation_begins or local_datetime_min()
        reservation_begins = reservation_begins.astimezone(DEFAULT_TIMEZONE)

        reservation_ends = self.reservation_unit.reservation_ends or local_datetime_max()
        reservation_ends = reservation_ends.astimezone(DEFAULT_TIMEZONE)

        if reservation_begins == reservation_ends:
            return False

        if reservation_begins < reservation_ends:
            return reservation_begins <= moment < reservation_ends

        return moment < reservation_ends or reservation_begins <= moment
