import datetime
from decimal import Decimal
from typing import Any

from django.conf import settings
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError
from undine.utils.model_utils import get_instance_or_raise

from tilavarauspalvelu.api.graphql.types.reservation_unit.mutations.validators import (
    validate_for_publish,
    validate_reservation_duration,
    validate_translations,
)
from tilavarauspalvelu.enums import AccessType, PriceUnit, Weekday
from tilavarauspalvelu.models import (
    ApplicationRoundTimeSlot,
    ReservationUnit,
    ReservationUnitAccessType,
    ReservationUnitImage,
    ReservationUnitPricing,
    Unit,
    User,
)
from tilavarauspalvelu.typing import ReservationUnitCreateData, TimeSlot, error_codes
from tilavarauspalvelu.validators import validate_reservable_times_begin_end, validate_reservable_times_overlap
from utils.date_utils import local_date
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationUnitCreateMutation",
]


class ReservationUnitImageCreateInput(MutationType[ReservationUnitImage], kind="related"):
    image = Input(required=True)
    image_type = Input(required=True)


class ReservationUnitPricingCreateInput(MutationType[ReservationUnitPricing], kind="related"):
    begins = Input(required=True)
    is_activated_on_begins = Input(required=True, default_value=False)
    payment_type = Input(default_value=None)
    price_unit = Input(required=True, default_value=PriceUnit.PER_HOUR)
    lowest_price = Input(required=True, default_value=0)
    highest_price = Input(required=True, default_value=0)
    tax_percentage = Input(required=True)


class ReservationUnitAccessTypeCreateInput(MutationType[ReservationUnitAccessType], kind="related"):
    access_type = Input(required=True, default_value=AccessType.UNRESTRICTED)
    begin_date = Input(required=True)


class ApplicationRoundTimeSlotCreateInput(MutationType[ApplicationRoundTimeSlot], kind="related"):
    weekday = Input(required=True)
    is_closed = Input(required=True, default_value=False)
    reservable_times = Input(list[TimeSlot], default_value=[])

    @reservable_times.validate
    def validate_reservable_times(self, info: GQLInfo[User], *, value: list[TimeSlot]) -> None:
        validate_reservable_times_begin_end(value)
        validate_reservable_times_overlap(value)


class ReservationUnitCreateMutation(MutationType[ReservationUnit], kind="create"):
    """Create a new ReservationUnit."""

    # Strings
    name_fi = Input(str, required=True)
    name_sv = Input(str, required=False)
    name_en = Input(str, required=False)
    description_fi = Input(str, required=False)
    description_sv = Input(str, required=False)
    description_en = Input(str, required=False)
    notes_when_applying_fi = Input(str, required=False)
    notes_when_applying_sv = Input(str, required=False)
    notes_when_applying_en = Input(str, required=False)
    reservation_pending_instructions_fi = Input(str, required=False)
    reservation_pending_instructions_sv = Input(str, required=False)
    reservation_pending_instructions_en = Input(str, required=False)
    reservation_confirmed_instructions_fi = Input(str, required=False)
    reservation_confirmed_instructions_sv = Input(str, required=False)
    reservation_confirmed_instructions_en = Input(str, required=False)
    reservation_cancelled_instructions_fi = Input(str, required=False)
    reservation_cancelled_instructions_sv = Input(str, required=False)
    reservation_cancelled_instructions_en = Input(str, required=False)
    contact_information = Input()

    # Integers
    surface_area = Input()
    min_persons = Input()
    max_persons = Input()
    max_reservations_per_user = Input()
    reservations_min_days_before = Input()
    reservations_max_days_before = Input()

    # Datetime
    reservation_begins_at = Input()
    reservation_ends_at = Input()
    publish_begins_at = Input()
    publish_ends_at = Input()
    min_reservation_duration = Input()
    max_reservation_duration = Input()
    buffer_time_before = Input()
    buffer_time_after = Input()

    # Booleans
    is_draft = Input()
    require_adult_reservee = Input()
    require_reservation_handling = Input()
    reservation_block_whole_day = Input()
    can_apply_free_of_charge = Input()
    allow_reservations_without_opening_hours = Input()

    # Enums
    authentication = Input()
    reservation_start_interval = Input()
    reservation_kind = Input()
    reservation_form = Input()

    # List Inputs
    search_terms = Input(default_value=[])

    # Forward many-to-one related
    unit = Input(required=True)
    reservation_unit_type = Input()
    cancellation_rule = Input()
    metadata_set = Input()
    cancellation_terms = Input()
    service_specific_terms = Input()
    pricing_terms = Input()
    payment_terms = Input()

    # Forward many-to-many related
    spaces = Input()
    resources = Input()
    purposes = Input()
    equipments = Input()

    # Reverse one-to-many related
    images = Input(ReservationUnitImageCreateInput)
    pricings = Input(ReservationUnitPricingCreateInput)
    access_types = Input(ReservationUnitAccessTypeCreateInput)
    application_round_time_slots = Input(ApplicationRoundTimeSlotCreateInput)

    @classmethod
    def __permissions__(
        cls,
        instance: ReservationUnit,
        info: GQLInfo[User],
        input_data: ReservationUnitCreateData,
    ) -> None:
        user = info.context.user
        unit = get_instance_or_raise(model=Unit, pk=input_data["unit"])
        if not user.permissions.can_manage_unit(unit):
            msg = "No permission to create a reservation unit"
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(
        cls,
        instance: ReservationUnit,
        info: GQLInfo[User],
        input_data: ReservationUnitCreateData,
    ) -> None:
        is_draft = input_data["is_draft"]
        is_archived = input_data["is_archived"]
        min_reservation_duration = input_data.get("min_reservation_duration")
        max_reservation_duration = input_data.get("max_reservation_duration")
        reservation_start_interval = input_data.get("reservation_start_interval")

        validate_reservation_duration(
            min_reservation_duration=min_reservation_duration,
            max_reservation_duration=max_reservation_duration,
            reservation_start_interval=reservation_start_interval,
        )

        cls._validate_pricings(input_data)
        cls._validate_access_types(input_data)
        cls._validate_application_round_time_slots(input_data)

        if not is_draft and not is_archived:
            name_fi = input_data.get("name_fi")
            name_sv = input_data.get("name_sv")
            name_en = input_data.get("name_en")
            description_fi = input_data.get("description_fi")
            description_sv = input_data.get("description_sv")
            description_en = input_data.get("description_en")

            validate_translations(
                name_fi=name_fi,
                name_sv=name_sv,
                name_en=name_en,
                description_fi=description_fi,
                description_sv=description_sv,
                description_en=description_en,
            )

            spaces = input_data.get("spaces")
            resources = input_data.get("resources")
            reservation_unit_type = input_data.get("reservation_unit_type")
            min_persons = input_data.get("min_persons")
            max_persons = input_data.get("max_persons")

            validate_for_publish(
                spaces=spaces,
                resources=resources,
                reservation_unit_type=reservation_unit_type,
                min_persons=min_persons,
                max_persons=max_persons,
            )

    @classmethod
    def _validate_pricings(cls, input_data: ReservationUnitCreateData) -> None:
        is_draft = input_data["is_draft"]
        pricings = input_data.get("pricings", [])

        today = local_date()
        has_active_pricing: bool = False
        dates_seen: set[datetime.date] = set()

        for pricing_data in pricings:
            begins = pricing_data["begins"]
            highest_price = pricing_data.get("highest_price", Decimal(0))
            lowest_price = pricing_data.get("lowest_price", Decimal(0))

            if highest_price < lowest_price:
                msg = "Highest price cannot be less than lowest price."
                raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_INVALID_PRICES)

            if begins in dates_seen:
                msg = "Reservation unit can have only one pricing per date."
                raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_DUPLICATE_DATE)

            dates_seen.add(begins)

            if not has_active_pricing:
                has_active_pricing = begins <= today

        if not has_active_pricing:
            if is_draft:
                return

            msg = "At least one active pricing is required for non-draft reservation units."
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_NO_ACTIVE_PRICING)

    @classmethod
    def _validate_access_types(cls, input_data: ReservationUnitCreateData) -> None:
        is_draft = input_data["is_draft"]
        access_types = input_data.get("access_types", [])

        today = local_date()
        has_active: bool = False

        for access_type_data in access_types:
            access_type = access_type_data["access_type"]
            begin_date = access_type_data["begin_date"]

            ReservationUnitAccessType.validators.validate_not_access_code(access_type)
            ReservationUnitAccessType.validators.validate_new_not_in_past(begin_date)

            if not has_active:
                has_active = begin_date <= today

        if not has_active:
            if is_draft:
                return

            msg = "At least one active access type is required for non-draft reservation units."
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_ACCESS_TYPE_MISSING)

    @classmethod
    def _validate_application_round_time_slots(cls, input_data: ReservationUnitCreateData) -> None:
        time_slots = input_data.get("application_round_time_slots", [])

        weekdays_seen: set[Weekday] = set()

        for timeslot in time_slots:
            weekday = timeslot["weekday"]
            closed = timeslot.get("is_closed", False)
            reservable_times = timeslot.get("reservable_times", [])

            if closed and len(reservable_times) > 0:
                msg = "Closed timeslots cannot have reservable times."
                raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_TIME_SLOTS_INVALID_DATA)

            if not closed and len(reservable_times) == 0:
                msg = "Open timeslots must have reservable times."
                raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_TIME_SLOTS_INVALID_DATA)

            if weekday in weekdays_seen:
                msg = f"Got multiple timeslots for {weekday.name.capitalize()}."
                raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_TIME_SLOTS_MULTIPLE_WEEKDAYS)

            weekdays_seen.add(weekday)

    @classmethod
    def __after__(cls, instance: ReservationUnit, info: GQLInfo[User], previous_data: dict[str, Any]) -> None:
        cls.update_hauki(instance)

    @classmethod
    def update_hauki(cls, instance: ReservationUnit) -> None:
        if settings.HAUKI_EXPORTS_ENABLED:
            try:
                instance.actions.send_reservation_unit_to_hauki()
            except ExternalServiceError as err:
                msg = "Sending reservation unit as resource to aukiolosovellus failed"
                raise GraphQLValidationError(msg, code=error_codes.HAUKI_EXPORTS_ERROR) from err


# TODO: Reservation Unit needs to be updated last, due to post_save signals.
#  Verkkokauppa payment product update is triggered by the post_save signal of the ReservationUnit,
#  and requires a paid pricing to already be present in the database.
