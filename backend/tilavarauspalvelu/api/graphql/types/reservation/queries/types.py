import datetime
from decimal import Decimal
from typing import Any, TypedDict

from django.db import models
from django.db.models import OuterRef
from django.db.models.functions import JSONObject
from lookup_property import L
from rest_framework.reverse import reverse
from undine import Field, GQLInfo, QueryType
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import NullablePermissions
from tilavarauspalvelu.enums import AccessType, PriceUnit, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Reservation, ReservationUnit, ReservationUnitPricing, User
from tilavarauspalvelu.typing import PindoraReservationInfoData
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.db import SubqueryArray
from utils.utils import ical_hmac_signature

from .filtersets import ReservationFilterSet
from .orderset import ReservationOrderSet

__all__ = [
    "ReservationNode",
]


class AppliedPricingInfo(TypedDict):
    begins: datetime.date
    price_unit: PriceUnit
    lowest_price: Decimal
    highest_price: Decimal
    tax_percentage: Decimal
    material_price_description_fi: str
    material_price_description_en: str
    material_price_description_sv: str


def can_view_private_info(reservation: Reservation, info: GQLInfo[User]) -> bool:
    return info.context.user.permissions.can_view_reservation(reservation)


def can_view_staff_info(reservation: Reservation, info: GQLInfo[User]) -> bool:
    return info.context.user.permissions.can_view_reservation(reservation, reserver_needs_role=True)


private = NullablePermissions(permission_check=can_view_private_info)
staff = NullablePermissions(permission_check=can_view_staff_info)


class ReservationNode(
    QueryType[Reservation],
    filterset=ReservationFilterSet,
    orderset=ReservationOrderSet,
    interfaces=[Node],
):
    # Basic information
    pk = Field()
    ext_uuid = Field()
    name = Field() | private
    description = Field() | private
    num_persons = Field() | private
    state = Field()
    type = Field() | staff
    municipality = Field() | private
    cancel_details = Field() | private
    handling_details = Field() | staff
    working_memo = Field() | staff

    # Time information
    begins_at = Field()
    ends_at = Field()
    buffer_time_before = Field()
    buffer_time_after = Field()
    handled_at = Field() | staff
    created_at = Field() | private

    # Pricing information
    price = Field() | private
    unit_price = Field() | private
    tax_percentage_value = Field() | private

    @Field
    def price_net(root: Reservation, info: GQLInfo[User]) -> Decimal | None:
        if not can_view_private_info(root, info):
            return None
        return root.price_net

    @price_net.optimize
    def optimize_price_net(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields |= {"price", "tax_percentage_value"}

    # Access information
    access_type = Field() | private
    access_code_generated_at = Field() | private
    access_code_is_active = Field() | private
    access_code_should_be_active = Field(L("access_code_should_be_active")) | private
    is_access_code_is_active_correct = Field(L("is_access_code_is_active_correct")) | private

    # Free of charge information
    applying_for_free_of_charge = Field() | private
    free_of_charge_reason = Field() | private

    # Reservee information
    reservee_identifier = Field() | private
    reservee_name = Field(L("reservee_name")) | private
    reservee_first_name = Field() | private
    reservee_last_name = Field() | private
    reservee_email = Field() | private
    reservee_phone = Field() | private
    reservee_address_street = Field() | private
    reservee_address_city = Field() | private
    reservee_address_zip = Field() | private
    reservee_organisation_name = Field() | private
    reservee_type = Field() | private

    # Relations
    reservation_unit = Field()

    @reservation_unit.optimize
    def optimize_reservation_unit(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        ru_data = data.add_select_related("reservation_unit")
        ru_data.pre_filter_callback = lambda qs, _: qs  # Allow returning archived reservation units

    user = Field() | private
    reservation_series = Field() | private
    deny_reason = Field() | private
    cancel_reason = Field() | private
    purpose = Field() | private
    age_group = Field() | private
    payment_order = Field() | private

    # Custom fields
    is_blocked = Field(models.Q(type=ReservationTypeChoice.BLOCKED))
    is_handled = Field(models.Q(handled_at__isnull=False)) | private

    @Field
    def affected_reservation_units(root: Reservation, info: GQLInfo[User]) -> list[int]:
        """Which reservation units' reserveability is affected by this reservation?"""
        user = info.context.user
        if not user.permissions.can_view_reservation(root):
            return []

        # Annotated using 'optimize_affected_reservation_units'
        return root.affected_reservation_units  # type: ignore[attr-defined]

    @affected_reservation_units.optimize
    def optimize_affected_reservation_units(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.annotations["affected_reservation_units"] = SubqueryArray(
            queryset=ReservationUnit.objects.filter(reservations=OuterRef("id")).affected_reservation_unit_ids,
            agg_field="ids",
            distinct=True,
        )

    @Field
    def calendar_url(root: Reservation, info: GQLInfo[User]) -> str | None:
        user = info.context.user
        if not user.permissions.can_view_reservation(root):
            return None

        scheme = info.context.scheme
        host = info.context.get_host()
        calendar_url = reverse("reservation_calendar", kwargs={"pk": root.pk})
        signature = ical_hmac_signature(f"reservation-{root.pk}")
        return f"{scheme}://{host}{calendar_url}?hash={signature}"

    @Field
    def pindora_info(root: Reservation, info: GQLInfo[User]) -> PindoraReservationInfoData | None:
        """
        Info fetched from Pindora API. Cached per reservation for 30s.
        Please don't use this when filtering multiple reservations, queries to Pindora are not optimized.
        """
        user = info.context.user
        if not user.permissions.can_view_reservation(root):
            return None

        # No Pindora info if access type is not 'ACCESS_CODE'
        if root.access_type != AccessType.ACCESS_CODE:
            return None

        # No need to show Pindora info after 24 hours have passed since it ended
        now = local_datetime()
        cutoff = root.ends_at.astimezone(DEFAULT_TIMEZONE) + datetime.timedelta(hours=24)
        if now > cutoff:
            return None

        has_perms = user.permissions.can_view_reservation(root, reserver_needs_role=True)

        # Don't allow reserver to view Pindora info without view permissions if the reservation is not confirmed
        if not has_perms and root.state != ReservationStateChoice.CONFIRMED:
            return None

        if root.reservation_series is not None and root.reservation_series.allocated_time_slot is not None:
            section = root.reservation_series.allocated_time_slot.reservation_unit_option.application_section
            application_round = section.application.application_round

            # Don't show Pindora info without permissions if the application round results haven't been sent yet
            if not has_perms and application_round.sent_at is None:
                return None

        try:
            response = PindoraService.get_access_code(obj=root)
        except Exception:  # noqa: BLE001
            return None

        # Don't allow reserver to view Pindora info without permissions if the access code is not active
        if not has_perms and not response.access_code_is_active:
            return None

        return response

    @pindora_info.optimize
    def optimize_pindora_info(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("ends_at")
        data.only_fields.add("access_type")
        data.only_fields.add("state")
        data.only_fields.add("ext_uuid")

        series_data = data.add_select_related("reservation_series")
        series_data.only_fields.add("ext_uuid")

        time_slots_data = series_data.add_select_related("allocated_time_slot")
        option_data = time_slots_data.add_select_related("reservation_unit_option")

        section_data = option_data.add_select_related("application_section")
        section_data.only_fields.add("ext_uuid")

        application_data = section_data.add_select_related("application")
        application_round_data = application_data.add_select_related("application_round")
        application_round_data.only_fields.add("sent_at")

    @Field
    def applied_pricing(root: Reservation, info: GQLInfo[User]) -> AppliedPricingInfo | None:
        """Details on the pricing that should be currently applied to this reservation."""
        user = info.context.user
        if not user.permissions.can_view_reservation(root):
            return None

        # Info is annotated in builtin types (int, str, etc) using 'optimize_applied_pricing'
        applied_pricing: dict[str, Any] = root.applied_pricing  # type: ignore[attr-defined]

        return AppliedPricingInfo(
            begins=datetime.date.fromisoformat(applied_pricing["begins"]),
            price_unit=PriceUnit(applied_pricing["price_unit"]),
            lowest_price=Decimal(str(applied_pricing["lowest_price"])),
            highest_price=Decimal(str(applied_pricing["highest_price"])),
            tax_percentage=Decimal(str(applied_pricing["tax_percentage"])),
            material_price_description_fi=applied_pricing["material_price_description_fi"] or "",
            material_price_description_en=applied_pricing["material_price_description_en"] or "",
            material_price_description_sv=applied_pricing["material_price_description_sv"] or "",
        )

    @applied_pricing.optimize
    def optimize_applied_pricing(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.annotations["applied_pricing"] = models.Subquery(
            queryset=(
                ReservationUnitPricing.objects.filter(
                    reservation_unit=models.OuterRef("reservation_unit"),
                )
                .active(from_date=models.OuterRef("begins_at__date"))
                .annotate(
                    data=JSONObject(
                        begins=models.F("begins"),
                        price_unit=models.F("price_unit"),
                        lowest_price=models.F("lowest_price"),
                        highest_price=models.F("highest_price"),
                        tax_percentage=models.F("tax_percentage__value"),
                        material_price_description_fi=models.F("material_price_description_fi"),
                        material_price_description_en=models.F("material_price_description_en"),
                        material_price_description_sv=models.F("material_price_description_sv"),
                    ),
                )
                .values("data")[:1]
            ),
            output_field=models.JSONField(),
        )

    @classmethod
    def __optimizations__(cls, data: OptimizationData, info: GQLInfo) -> None:
        # This node doesn't actually require any overall optimizations, but most of the fields
        # need the same ones, so we can optimize them together.
        #
        # See 'tilavarauspalvelu.models.reservation.queryset.ReservationQuerySet.with_permissions'
        data.aliases["FETCH_UNITS_FOR_PERMISSIONS_FLAG"] = models.Value("")

        data.add_select_related("user")
