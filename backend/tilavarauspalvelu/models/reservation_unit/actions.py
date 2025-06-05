from __future__ import annotations

import dataclasses
import datetime
import itertools
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.db import models
from lookup_property import L

from tilavarauspalvelu.enums import AccessType, ApplicationRoundStatusChoice, ReservationStartInterval
from tilavarauspalvelu.exceptions import HaukiAPIError
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.integrations.opening_hours.hauki_api_types import HaukiTranslatedField
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError
from tilavarauspalvelu.integrations.verkkokauppa.product.types import (
    CreateOrUpdateAccountingParams,
    CreateProductParams,
    ProductInvoicingParams,
)
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import OriginHaukiResource, PaymentProduct, Reservation, ReservationUnit
from tilavarauspalvelu.tasks import refresh_reservation_unit_accounting_task
from utils.date_utils import (
    DEFAULT_TIMEZONE,
    local_date,
    local_datetime,
    local_datetime_max,
    local_datetime_min,
    local_end_of_day,
    local_start_of_day,
    time_as_timedelta,
)
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from collections.abc import Collection

    from tilavarauspalvelu.integrations.opening_hours.hauki_api_types import HaukiAPIResource
    from tilavarauspalvelu.models import (
        Location,
        PaymentAccounting,
        PaymentMerchant,
        ReservationUnitAccessType,
        ReservationUnitPricing,
    )
    from tilavarauspalvelu.typing import TimeSpan


__all__ = [
    "ReservationUnitActions",
]


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


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitActions(ReservationUnitHaukiExporter):
    reservation_unit: ReservationUnit

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

        min_duration = self.reservation_unit.min_reservation_duration or datetime.timedelta()
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
                if end_datetime - start_datetime >= min_duration:
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
            possible_start_times.add(start_datetime.time())
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
                reservation_period_end_date__gte=start_date,
                reservation_period_begin_date__lte=end_date,
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
        if self.reservation_unit.is_draft or self.reservation_unit.is_archived:
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

    def get_access_type_at(self, moment: datetime.datetime, *, default: AccessType | None = None) -> AccessType | None:
        on_date = moment.astimezone(DEFAULT_TIMEZONE).date()
        qs = self.reservation_unit.access_types.active(on_date=on_date)
        return qs.values_list("access_type", flat=True).first() or default

    def get_access_types_on_period(
        self,
        begin_date: datetime.date,
        end_date: datetime.date,
    ) -> dict[datetime.date, AccessType]:
        """
        Get a dict that maps all dates on the given period to the access type that is active on that date.
        A value from the period might be missing if no access type is active on that date.
        An empty dict is returned if there are no access types found from the given period.
        """
        access_types_by_date: dict[datetime.date, AccessType] = {}

        access_types: list[ReservationUnitAccessType] = list(
            self.reservation_unit.access_types.all()
            .on_period(begin_date=begin_date, end_date=end_date)
            .order_by("begin_date")
        )
        if not access_types:
            return access_types_by_date

        # Note: 'itertools.pairwise' will be empty if there is only one access type
        for current_one, next_one in itertools.pairwise(access_types):
            date = max(current_one.begin_date, begin_date)
            access_type = AccessType(current_one.access_type)

            while date < next_one.begin_date:
                access_types_by_date[date] = access_type
                date += datetime.timedelta(days=1)

        # Handle last/only access type separately.
        # If there is only one access type, this is needed since 'pairwise' will return an empty iterator.
        # For last access type, this is needed to fill dict until 'end_date' since 'end_date' can be
        # after the last access type's 'begin_date'
        access_type = AccessType(access_types[-1].access_type)
        date = access_types[-1].begin_date

        while date <= end_date:
            access_types_by_date[date] = access_type
            date += datetime.timedelta(days=1)

        return access_types_by_date

    @property
    def start_interval_minutes(self) -> int:
        return ReservationStartInterval(self.reservation_unit.reservation_start_interval).as_number

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

    def update_access_types_for_reservations(self) -> None:
        """
        Update access types for future reservations in the reservation unit
        based on currently defined access types.
        """
        now = local_datetime()

        access_types = list(
            self.reservation_unit.access_types.filter(L(end_date__gt=now.date())).order_by("-begin_date")
        )
        # If there are no access types, we don't know that to update the reservation to
        if not access_types:
            return

        # Build a list or 'when' expressions that set the access type from its begin date starting from
        # the one most in the future and moving backwards until the current active one is reached.
        # This way reservations will get the correct access type given the currently defined ones.
        whens: list[models.When] = [
            models.When(
                models.Q(begin__date__gte=access_type.begin_date),
                then=models.Value(access_type.access_type),
            )
            for access_type in access_types
        ]

        # Update all future or ongoing reservations in the reservation unit to their current access types
        Reservation.objects.filter(reservation_units=self.reservation_unit, end__gt=now).update(
            access_type=models.Case(
                *whens,
                # Use the active access type as the default (even though we should never reach this)
                default=models.Value(access_types[-1].access_type),
                output_field=models.CharField(),
            )
        )

    def refresh_reservation_unit_product_mapping(self) -> None:
        payment_merchant = self.get_merchant()

        if self.requires_product_mapping_update():
            params = CreateProductParams(
                namespace=settings.VERKKOKAUPPA_NAMESPACE,
                namespace_entity_id=self.reservation_unit.pk,
                merchant_id=str(payment_merchant.id),
            )
            api_product = VerkkokauppaAPIClient.create_product(params=params)
            payment_product, _ = PaymentProduct.objects.update_or_create(
                id=api_product.product_id,
                defaults={"merchant": payment_merchant},
            )

            # Use 'qs.update()' instead of 'model.save()' to avoid triggering signals and creating an infinite loop.
            ReservationUnit.objects.filter(pk=self.reservation_unit.pk).update(payment_product=payment_product)

            refresh_reservation_unit_accounting_task.delay(self.reservation_unit.pk)

        # Remove product mapping if merchant is removed
        if self.reservation_unit.payment_product and not payment_merchant:
            # Use 'qs.update()' instead of 'model.save()' to avoid triggering signals and creating an infinite loop.
            ReservationUnit.objects.filter(pk=self.reservation_unit.pk).update(payment_product=None)

    def refresh_reservation_unit_accounting(self) -> None:
        if not self.reservation_unit.payment_product:
            return

        accounting = self.get_accounting()
        if not accounting:
            return

        params = CreateOrUpdateAccountingParams(
            vat_code=accounting.vat_code,
            internal_order=accounting.internal_order,
            profit_center=accounting.profit_center,
            project=accounting.project,
            operation_area=accounting.operation_area,
            company_code=accounting.company_code,
            main_ledger_account=accounting.main_ledger_account,
            balance_profit_center=accounting.balance_profit_center,
            product_invoicing=ProductInvoicingParams(
                sales_org=accounting.product_invoicing_sales_org,
                sales_office=accounting.product_invoicing_sales_office,
                material=accounting.product_invoicing_material,
                order_type=accounting.product_invoicing_order_type,
            ),
        )

        try:
            VerkkokauppaAPIClient.create_or_update_accounting(
                product_uuid=self.reservation_unit.payment_product.id,
                params=params,
            )
        except CreateOrUpdateAccountingError as err:
            SentryLogger.log_exception(
                err,
                details="Unable to refresh reservation unit accounting data",
                reservation_unit_id=self.reservation_unit.pk,
            )
