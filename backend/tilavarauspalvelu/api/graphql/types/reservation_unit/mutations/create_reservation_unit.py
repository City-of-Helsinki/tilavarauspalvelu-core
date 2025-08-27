import datetime
import json
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError
from undine.utils.model_utils import use_save_signals

from tilavarauspalvelu.api.graphql.types.reservation_unit.mutations.validators import (
    validate_for_publish,
    validate_reservation_duration,
    validate_translations,
)
from tilavarauspalvelu.enums import (
    AccessType,
    AuthenticationType,
    PriceUnit,
    ReservationFormType,
    ReservationKind,
    ReservationStartInterval,
    Weekday,
)
from tilavarauspalvelu.models import (
    ApplicationRoundTimeSlot,
    Equipment,
    Purpose,
    ReservationMetadataSet,
    ReservationUnit,
    ReservationUnitAccessType,
    ReservationUnitCancellationRule,
    ReservationUnitImage,
    ReservationUnitPricing,
    ReservationUnitType,
    Resource,
    Space,
    TaxPercentage,
    TermsOfUse,
    Unit,
)
from tilavarauspalvelu.typing import (
    ApplicationRoundTimeSlotCreateData,
    ReservationUnitAccessTypeCreateData,
    ReservationUnitCreateData,
    ReservationUnitImageCreateData,
    ReservationUnitPricingCreateData,
    TimeSlot,
    error_codes,
)
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
    payment_type = Input(required=True)
    price_unit = Input(required=True, default_value=PriceUnit.PER_HOUR)
    lowest_price = Input(required=True, default_value=0)
    highest_price = Input(required=True, default_value=0)
    tax_percentage = Input(TaxPercentage, required=True)


class ReservationUnitAccessTypeCreateInput(MutationType[ReservationUnitAccessType], kind="related"):
    access_type = Input(required=True, default_value=AccessType.UNRESTRICTED)
    begin_date = Input(required=True)


class ApplicationRoundTimeSlotCreateInput(MutationType[ApplicationRoundTimeSlot], kind="related"):
    weekday = Input(required=True)
    is_closed = Input(required=True, default_value=False)
    reservable_times = Input(list[TimeSlot], default_value=[])


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
    contact_information = Input(required=True, default_value="")

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
    is_draft = Input(required=True, default_value=False)
    require_adult_reservee = Input(required=True, default_value=False)
    require_reservation_handling = Input(required=True, default_value=False)
    reservation_block_whole_day = Input(required=True, default_value=False)
    can_apply_free_of_charge = Input(required=True, default_value=False)
    allow_reservations_without_opening_hours = Input(required=True, default_value=False)

    # Enums
    authentication = Input(required=True, default_value=AuthenticationType.WEAK)
    reservation_start_interval = Input(required=True, default_value=ReservationStartInterval.INTERVAL_15_MINUTES)
    reservation_kind = Input(required=True, default_value=ReservationKind.DIRECT_AND_SEASON)
    reservation_form = Input(required=True, default_value=ReservationFormType.CONTACT_INFO_FORM)

    # List Inputs
    search_terms = Input(required=True, default_value=[])

    # Forward many-to-one related
    unit = Input(Unit, required=True)
    reservation_unit_type = Input(ReservationUnitType)
    cancellation_rule = Input(ReservationUnitCancellationRule)
    metadata_set = Input(ReservationMetadataSet)
    cancellation_terms = Input(TermsOfUse)
    service_specific_terms = Input(TermsOfUse)
    pricing_terms = Input(TermsOfUse)
    payment_terms = Input(TermsOfUse)

    # Forward many-to-many related
    spaces = Input(Space)
    resources = Input(Resource)
    purposes = Input(Purpose)
    equipments = Input(Equipment)

    # Reverse one-to-many related
    images = Input(ReservationUnitImageCreateInput)
    pricings = Input(ReservationUnitPricingCreateInput)
    access_types = Input(ReservationUnitAccessTypeCreateInput)
    application_round_time_slots = Input(ApplicationRoundTimeSlotCreateInput)

    @classmethod
    def __mutate__(  # noqa: PLR0915
        cls,
        instance: ReservationUnit,
        info: GQLInfo,
        input_data: ReservationUnitCreateData,
    ) -> ReservationUnit:
        user = info.context.user
        unit = input_data["unit"]

        if not user.permissions.can_manage_unit(unit):
            msg = "No permission to create a reservation unit"
            raise GraphQLPermissionError(msg)

        if not input_data["name_fi"].strip():
            msg = "This field cannot be blank."
            raise GraphQLValidationError(msg)

        is_draft = input_data["is_draft"]
        min_reservation_duration = input_data.get("min_reservation_duration")
        max_reservation_duration = input_data.get("max_reservation_duration")
        reservation_start_interval = input_data.get("reservation_start_interval")

        has_spaces = "spaces" in input_data
        has_resources = "resources" in input_data
        has_purposes = "purposes" in input_data
        has_equipments = "equipments" in input_data

        spaces = input_data.get("spaces") or []
        resources = input_data.get("resources") or []
        purposes = input_data.get("purposes") or []
        equipments = input_data.get("equipments") or []

        has_images = "images" in input_data
        has_pricings = "pricings" in input_data
        has_access_types = "access_types" in input_data
        has_application_round_time_slots = "application_round_time_slots" in input_data

        images = input_data.get("images") or []
        pricings = input_data.get("pricings") or []
        access_types = input_data.get("access_types") or []
        application_round_time_slots = input_data.get("application_round_time_slots") or []

        validate_reservation_duration(
            min_reservation_duration=min_reservation_duration,
            max_reservation_duration=max_reservation_duration,
            reservation_start_interval=reservation_start_interval,
        )

        cls._validate_pricings(input_data)
        cls._validate_access_types(input_data)
        cls._validate_application_round_time_slots(input_data)

        if not is_draft:
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

        cls._remove_to_many_fields(input_data)

        with transaction.atomic():
            instance = ReservationUnit()

            for key, value in input_data.items():
                setattr(instance, key, value)

            instance.save()

            if has_spaces:
                instance.spaces.set(spaces)
            if has_resources:
                instance.resources.set(resources)
            if has_purposes:
                instance.purposes.set(purposes)
            if has_equipments:
                instance.equipments.set(equipments)

            if has_images:
                cls.create_images(instance, images)
            if has_pricings:
                cls.create_pricings(instance, pricings)
            if has_access_types:
                cls.create_access_types(instance, access_types)
            if has_application_round_time_slots:
                cls.create_application_round_time_slots(instance, application_round_time_slots)

        cls.update_hauki(instance)

        return instance

    @classmethod
    def _remove_to_many_fields(cls, input_data: ReservationUnitCreateData) -> None:
        to_many_fields = [
            "spaces",
            "resources",
            "purposes",
            "equipments",
            "images",
            "pricings",
            "access_types",
            "application_round_time_slots",
        ]
        for key in to_many_fields:
            input_data.pop(key, None)

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

            validate_reservable_times_begin_end(reservable_times)
            validate_reservable_times_overlap(reservable_times)

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

            # Serialize timeslots to `dict[str, str]` be compatible with HStoreField
            timeslot["reservable_times"] = json.loads(json.dumps(reservable_times, default=str))

    @classmethod
    def create_images(cls, instance: ReservationUnit, images_data: list[ReservationUnitImageCreateData]) -> None:
        images = [ReservationUnitImage(reservation_unit=instance, **image) for image in images_data]

        with use_save_signals(ReservationUnitImage, instances=images, update_fields=None):
            ReservationUnitImage.objects.bulk_create(images)

    @classmethod
    def create_pricings(cls, instance: ReservationUnit, pricings_data: list[ReservationUnitPricingCreateData]) -> None:
        pricings = [ReservationUnitPricing(reservation_unit=instance, **pricing) for pricing in pricings_data]

        with use_save_signals(ReservationUnitPricing, instances=pricings, update_fields=None):
            ReservationUnitPricing.objects.bulk_create(pricings)

    @classmethod
    def create_access_types(
        cls,
        instance: ReservationUnit,
        access_types_data: list[ReservationUnitAccessTypeCreateData],
    ) -> None:
        access_types = [
            ReservationUnitAccessType(reservation_unit=instance, **access_type) for access_type in access_types_data
        ]

        with use_save_signals(ReservationUnitAccessType, instances=access_types, update_fields=None):
            ReservationUnitAccessType.objects.bulk_create(access_types)

    @classmethod
    def create_application_round_time_slots(
        cls,
        instance: ReservationUnit,
        application_round_time_slots_data: list[ApplicationRoundTimeSlotCreateData],
    ) -> None:
        time_slots = [
            ApplicationRoundTimeSlot(reservation_unit=instance, **time_slot)
            for time_slot in application_round_time_slots_data
        ]

        with use_save_signals(ReservationUnitAccessType, instances=time_slots, update_fields=None):
            ApplicationRoundTimeSlot.objects.bulk_create(time_slots)

    @classmethod
    def update_hauki(cls, instance: ReservationUnit) -> None:
        if settings.HAUKI_EXPORTS_ENABLED:
            try:
                instance.actions.send_reservation_unit_to_hauki()
            except ExternalServiceError as err:
                msg = "Sending reservation unit as resource to aukiolosovellus failed"
                raise GraphQLValidationError(msg, code=error_codes.HAUKI_EXPORTS_ERROR) from err
