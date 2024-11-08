import datetime
import itertools
import random
from decimal import Decimal
from inspect import cleandoc
from typing import TYPE_CHECKING

from django.conf import settings

from tests.factories import (
    PaymentProductFactory,
    ReservationUnitPricingFactory,
    ReservationUnitTypeFactory,
    ResourceFactory,
    SpaceFactory,
    UnitFactory,
)
from tests.factories.reservation_unit import ReservationUnitBuilder
from tests.factories.reservation_unit_pricing import ReservationUnitPricingBuilder
from tilavarauspalvelu.enums import (
    AuthenticationType,
    PaymentType,
    PriceUnit,
    ReservationKind,
    ReservationStartInterval,
    ResourceLocationType,
    TermsOfUseTypeChoices,
)
from tilavarauspalvelu.models import (
    OriginHaukiResource,
    PaymentAccounting,
    PaymentMerchant,
    PaymentProduct,
    ReservationMetadataSet,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitImage,
    ReservationUnitPaymentType,
    ReservationUnitPricing,
    ReservationUnitType,
    Resource,
    Space,
    TaxPercentage,
    TermsOfUse,
    Unit,
)
from tilavarauspalvelu.tasks import create_reservation_unit_thumbnails_and_urls
from utils.date_utils import DEFAULT_TIMEZONE

from .create_reservation_related_things import (
    _create_cancellation_rules,
    _create_equipments,
    _create_hauki_resources,
    _create_payment_accountings,
    _create_payment_merchants,
    _create_purposes,
    _create_qualifiers,
    _create_reservation_metadata_sets,
    _create_reservation_unit_payment_types,
    _create_services,
    _create_specific_terms_of_use,
    _create_tax_percentages,
    _fetch_and_build_reservation_unit_image,
)
from .create_seasonal_booking import _create_application_round_time_slots
from .utils import (
    BufferInfo,
    CancelInfo,
    DurationInfo,
    FreeReservationUnitData,
    HandlingInfo,
    PaidReservationUnitData,
    PaymentTypeInfo,
    PriceInfo,
    ReservableWindowInfo,
    ReservationKindInfo,
    SeasonalReservationUnitData,
    SetName,
    StartIntervalInfo,
    TaxPercentageInfo,
    get_combinations,
    random_subset,
    with_logs,
)

if TYPE_CHECKING:
    from django.db import models


@with_logs
def _create_reservation_units() -> list[ReservationUnit]:
    # --- Create dependencies for the reservation units  ------------------------------------------------------------

    hauki_resources = _create_hauki_resources()
    terms_of_use = _create_specific_terms_of_use()
    metadata_sets = _create_reservation_metadata_sets()
    cancellation_rules = _create_cancellation_rules()
    tax_percentages = _create_tax_percentages()
    payment_types = _create_reservation_unit_payment_types()
    merchants = _create_payment_merchants()
    accountings = _create_payment_accountings()

    # --- Create reservation units ----------------------------------------------------------------------------------

    _create_free_reservation_units(
        cancellation_rules,
        hauki_resources,
        metadata_sets,
        terms_of_use,
        tax_percentages,
    )

    _create_paid_reservation_units(
        cancellation_rules,
        hauki_resources,
        metadata_sets,
        terms_of_use,
        tax_percentages,
        payment_types,
        merchants,
        accountings,
    )

    _create_seasonal_bookable_reservation_units(
        cancellation_rules,
        hauki_resources,
        metadata_sets,
        terms_of_use,
        tax_percentages,
    )

    _create_empty_reservation_units(
        cancellation_rules,
        metadata_sets,
        terms_of_use,
        tax_percentages,
    )

    _create_archived_reservation_units(
        cancellation_rules,
        metadata_sets,
        terms_of_use,
        hauki_resources,
        tax_percentages,
    )

    _create_single_reservation_per_user_reservation_units(
        cancellation_rules,
        metadata_sets,
        terms_of_use,
        hauki_resources,
        tax_percentages,
    )

    _create_full_day_reservation_units(
        cancellation_rules,
        metadata_sets,
        terms_of_use,
        hauki_resources,
        tax_percentages,
    )

    _create_reservation_units_in_space_hierarchies(
        cancellation_rules,
        metadata_sets,
        terms_of_use,
        hauki_resources,
        tax_percentages,
    )

    _create_reservation_units_in_resource_hierarchies(
        cancellation_rules,
        metadata_sets,
        terms_of_use,
        hauki_resources,
        tax_percentages,
    )

    if settings.UPDATE_RESERVATION_UNIT_THUMBNAILS:
        create_reservation_unit_thumbnails_and_urls()

    # --- Add reservables ------------------------------------------------------------------------------------------

    equipments = _create_equipments()
    purposes = _create_purposes()
    qualifiers = _create_qualifiers()
    services = _create_services()

    reservation_units = list(ReservationUnit.objects.all())
    for reservation_unit in reservation_units:
        reservation_unit.equipments.add(*random_subset(equipments))
        reservation_unit.purposes.add(*random_subset(purposes))
        reservation_unit.qualifiers.add(*random_subset(qualifiers))
        reservation_unit.services.add(*random_subset(services))

    return reservation_units


@with_logs
def _create_free_reservation_units(
    cancellation_rules: list[ReservationUnitCancellationRule],
    hauki_resources: list[OriginHaukiResource],
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    tax_percentages: dict[str, TaxPercentage],
) -> None:
    """
    Create reservation units that:
     - Are free of charge
     - Are only DIRECT bookable
     - Only require WEAK authentication

    Create combinations with:
     - Different buffer times
     - Different min/max reservation times
     - Different min/max days before reservation can be made
     - Different start intervals
     - Different cancellation rules
     - Handling requirements
    """
    buffer_time_choices: list[BufferInfo] = [
        BufferInfo(name="(-0, +0)", before=datetime.timedelta(minutes=0), after=datetime.timedelta(minutes=0)),
        BufferInfo(name="(-30, +30)", before=datetime.timedelta(minutes=30), after=datetime.timedelta(minutes=30)),
        BufferInfo(name="(-15, +60)", before=datetime.timedelta(minutes=15), after=datetime.timedelta(minutes=60)),
    ]
    reservation_time_choices: list[DurationInfo] = [
        DurationInfo(name="short", minimum=datetime.timedelta(minutes=15), maximum=datetime.timedelta(minutes=60)),
        DurationInfo(name="long", minimum=datetime.timedelta(hours=2), maximum=datetime.timedelta(hours=5)),
    ]
    min_max_days_before_choices: list[ReservableWindowInfo] = [
        ReservableWindowInfo(name="now", minimum=0, maximum=14),
        ReservableWindowInfo(name="later", minimum=3, maximum=30),
    ]
    start_interval_choices: list[StartIntervalInfo] = [
        StartIntervalInfo(name="15", value=ReservationStartInterval.INTERVAL_15_MINUTES),
        StartIntervalInfo(name="30", value=ReservationStartInterval.INTERVAL_30_MINUTES),
        StartIntervalInfo(name="90", value=ReservationStartInterval.INTERVAL_90_MINUTES),
    ]
    cancellation_rule_choices: list[CancelInfo] = [
        CancelInfo(name="cannot", value=[None]),
        CancelInfo(name="allowed", value=cancellation_rules),
    ]
    handling_info_choices: list[HandlingInfo] = [
        HandlingInfo(name="no", handling_required=False),
        HandlingInfo(name="yes", handling_required=True),
    ]

    ReservationUnitSpacesThoughModel: type[models.Model] = ReservationUnit.spaces.through  # noqa: N806

    spaces: list[Space] = []
    reservation_units: list[ReservationUnit] = []
    reservation_unit_spaces: list[models.Model] = []
    pricings: list[ReservationUnitPricing] = []
    images: list[ReservationUnitImage] = []

    reservation_unit_type = ReservationUnitTypeFactory.create(
        name="Ilmainen",
        name_fi="Ilmainen",
        name_en="Free",
        name_sv="Gratis",
    )

    # One shared unit for all free reservation units
    unit = UnitFactory.create(
        name="Keskustoimisto",
        name_fi="Keskustoimisto",
        name_en="Central office",
        name_sv="Centrala kontoret",
        tprek_id=None,
        tprek_department_id=None,
    )

    unit_counter = itertools.count(start=1)

    for data in get_combinations(
        iterables=[
            buffer_time_choices,
            reservation_time_choices,
            min_max_days_before_choices,
            start_interval_choices,
            cancellation_rule_choices,
            handling_info_choices,
        ],
        output_type=FreeReservationUnitData,
    ):
        set_name: SetName = random.choice(SetName.non_free_of_charge_applying())
        reservation_kind = ReservationKind.DIRECT
        authentication = AuthenticationType.WEAK
        number = next(unit_counter)

        space = SpaceFactory.build_for_bulk_create(
            name=f"Toimistokoppi #{number}",
            name_fi=f"Toimistokoppi #{number}",
            name_en=f"Office cubicle #{number}",
            name_sv=f"Kontorsbås #{number}",
            unit=unit,
        )
        spaces.append(space)

        reservation_unit = (
            ReservationUnitBuilder()
            .set(
                name=f"Ankea toimistokoppi #{number}",
                name_fi=f"Ankea toimistokoppi #{number}",
                name_en=f"Drab office cubicle #{number}",
                name_sv=f"Dyster kontorsbås #{number}",
                unit=unit,
                origin_hauki_resource=random.choice(hauki_resources),
                allow_reservations_without_opening_hours=True,
                reservations_min_days_before=data.reservable_window_info.minimum,
                reservations_max_days_before=data.reservable_window_info.maximum,
                min_reservation_duration=data.duration_info.minimum,
                max_reservation_duration=data.duration_info.maximum,
                buffer_time_before=data.buffer_info.before,
                buffer_time_after=data.buffer_info.after,
                reservation_start_interval=data.start_interval_info.value,
                authentication=authentication,
                can_apply_free_of_charge=False,
                max_reservations_per_user=None,
                reservation_unit_type=reservation_unit_type,
                reservation_kind=reservation_kind,
                cancellation_rule=random.choice(data.cancellation_rule_info.value),
                require_reservation_handling=data.handling_info.handling_required,
                metadata_set=metadata_sets[set_name],
                reservation_begins=datetime.datetime(2021, 1, 1, tzinfo=DEFAULT_TIMEZONE),
                cancellation_terms=terms_of_use[TermsOfUseTypeChoices.CANCELLATION],
                payment_terms=terms_of_use[TermsOfUseTypeChoices.PAYMENT],
                pricing_terms=terms_of_use[TermsOfUseTypeChoices.PRICING],
                service_specific_terms=terms_of_use[TermsOfUseTypeChoices.SERVICE],
            )
            .set_description_info(
                buffer_time=data.buffer_info.name,
                reservation_time=data.duration_info.name,
                reservable_window=data.reservable_window_info.name,
                max_reservations="unlimited",
                reservation_kind=reservation_kind.value,
                start_interval=data.start_interval_info.name,
                authentication=authentication.value,
                cancellation_rule=data.cancellation_rule_info.name,
                handling_required=data.handling_info.name,
                pricing="free",
                payment_type="none",
                tax_percentage="0%",
                metadata_set=set_name.value,
                can_apply_free_of_charge="no need",
            )
            .build()
        )
        reservation_units.append(reservation_unit)

        reservation_unit_spaces.append(
            ReservationUnitSpacesThoughModel(
                reservationunit=reservation_unit,
                space=space,
            )
        )

        pricing = ReservationUnitPricingFactory.build(
            begins=datetime.date(2021, 1, 1),
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=Decimal("0"),
            highest_price=Decimal("0"),
            reservation_unit=reservation_unit,
            tax_percentage=tax_percentages["0"],
        )
        pricings.append(pricing)

        image = _fetch_and_build_reservation_unit_image(
            reservation_unit=reservation_unit,
            image_url="https://images.unsplash.com/photo-1577412647305-991150c7d163",
            filename="toimistokoppi",
        )
        if image is not None:
            images.append(image)

    Space.objects.bulk_create(spaces)
    ReservationUnit.objects.bulk_create(reservation_units)
    ReservationUnitSpacesThoughModel.objects.bulk_create(reservation_unit_spaces)
    ReservationUnitPricing.objects.bulk_create(pricings)
    ReservationUnitImage.objects.bulk_create(images)


@with_logs
def _create_paid_reservation_units(
    cancellation_rules: list[ReservationUnitCancellationRule],
    hauki_resources: list[OriginHaukiResource],
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    tax_percentages: dict[str, TaxPercentage],
    payment_types: dict[str, ReservationUnitPaymentType],
    merchants: list[PaymentMerchant],
    accountings: list[PaymentAccounting],
) -> None:
    """
    Create reservation units that:
     - Are paid
     - Are only DIRECT bookable
     - Require STRONG authentication

    Create combinations with:
     - Different min/max reservation times
     - Different cancellation rules
     - Different pricings
     - Handling requirements
     - Different payment types
     - Different tax percentages
    """
    reservation_time_choices: list[DurationInfo] = [
        DurationInfo(name="short", minimum=datetime.timedelta(minutes=15), maximum=datetime.timedelta(minutes=60)),
        DurationInfo(name="long", minimum=datetime.timedelta(hours=2), maximum=datetime.timedelta(hours=5)),
    ]
    cancellation_rule_choices: list[CancelInfo] = [
        CancelInfo(name="cannot", value=[None]),
        CancelInfo(name="allowed", value=cancellation_rules),
    ]
    price_choices: list[PriceInfo] = [
        PriceInfo(
            name="fixed price",
            highest_price=Decimal("10"),
            lowest_price=Decimal("10"),
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            can_apply_free_of_charge=False,
        ),
        PriceInfo(
            name="hourly price",
            highest_price=Decimal("10"),
            lowest_price=Decimal("10"),
            price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
            can_apply_free_of_charge=False,
        ),
        PriceInfo(
            name="can ask for subvention",
            highest_price=Decimal("15"),
            lowest_price=Decimal("10"),
            price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
            can_apply_free_of_charge=True,
        ),
    ]
    handling_info_choices: list[HandlingInfo] = [
        HandlingInfo(name="no", handling_required=False),
        HandlingInfo(name="yes", handling_required=True),
    ]
    payment_type_choices: list[PaymentTypeInfo] = [
        PaymentTypeInfo(name="invoice", payment_type=PaymentType.INVOICE),
        PaymentTypeInfo(name="online", payment_type=PaymentType.ONLINE),
        PaymentTypeInfo(name="on site", payment_type=PaymentType.ON_SITE),
    ]
    tax_percentage_choices: list[TaxPercentageInfo] = [
        TaxPercentageInfo(name="14%", value="14"),
        TaxPercentageInfo(name="25.5%", value="25.5"),
    ]

    ReservationUnitPaymentTypesThoughModel: type[models.Model] = ReservationUnit.payment_types.through  # noqa: N806
    ReservationUnitSpacesThoughModel: type[models.Model] = ReservationUnit.spaces.through  # noqa: N806

    units: list[Unit] = []
    reservation_units: list[ReservationUnit] = []
    spaces: list[Space] = []
    reservation_unit_spaces: list[models.Model] = []
    reservation_unit_payment_types: list[models.Model] = []
    pricings: list[ReservationUnitPricing] = []
    payment_products: list[PaymentProduct] = []
    images: list[ReservationUnitImage] = []

    unit_counter = itertools.count(start=1)

    reservation_unit_type = ReservationUnitTypeFactory.create(
        name="Maksullinen",
        name_fi="Maksullinen",
        name_en="Paid",
        name_sv="Betald",
    )

    for data in get_combinations(
        iterables=[
            reservation_time_choices,
            cancellation_rule_choices,
            price_choices,
            handling_info_choices,
            payment_type_choices,
            tax_percentage_choices,
        ],
        output_type=PaidReservationUnitData,
    ):
        merchant = random.choice(merchants)
        accounting = random.choice(accountings)

        set_name: SetName = random.choice(SetName.applying_free_of_charge())
        reservation_kind = ReservationKind.DIRECT
        authentication = AuthenticationType.STRONG
        reservation_start_interval = ReservationStartInterval.INTERVAL_30_MINUTES
        number = next(unit_counter)

        unit = UnitFactory.build(
            name=f"Vessapaikka #{number}",
            name_fi=f"Vessapaikka #{number}",
            name_en=f"Toilet location #{number}",
            name_sv=f"Toalett plats #{number}",
            tprek_id=None,
            tprek_department_id=None,
            payment_merchant=merchant,
            payment_accounting=accounting,
        )
        units.append(unit)

        space = SpaceFactory.build_for_bulk_create(
            name=f"Vessa koppi #{number}",
            name_fi=f"Vessa koppi #{number}",
            name_en=f"Toilet stall #{number}",
            name_sv=f"Toalett kopp #{number}",
            unit=unit,
        )
        spaces.append(space)

        payment_product = PaymentProductFactory.build(merchant=merchant)
        payment_products.append(payment_product)

        reservation_unit = (
            ReservationUnitBuilder()
            .set(
                name=f"Maksullinen vessa #{number}",
                name_fi=f"Maksullinen vessa #{number}",
                name_en=f"Paid toilet #{number}",
                name_sv=f"Betalad toalett #{number}",
                unit=unit,
                payment_product=payment_product,
                payment_merchant=merchant,
                payment_accounting=accounting,
                origin_hauki_resource=random.choice(hauki_resources),
                allow_reservations_without_opening_hours=True,
                reservations_min_days_before=0,
                reservations_max_days_before=14,
                min_reservation_duration=data.duration_info.minimum,
                max_reservation_duration=data.duration_info.maximum,
                buffer_time_before=datetime.timedelta(),
                buffer_time_after=datetime.timedelta(),
                reservation_start_interval=reservation_start_interval,
                authentication=authentication,
                can_apply_free_of_charge=data.price_info.can_apply_free_of_charge,
                max_reservations_per_user=None,
                reservation_unit_type=reservation_unit_type,
                reservation_kind=reservation_kind,
                cancellation_rule=random.choice(data.cancellation_rule_info.value),
                require_reservation_handling=data.handling_info.handling_required,
                metadata_set=metadata_sets[set_name],
                reservation_begins=datetime.datetime(2021, 1, 1, tzinfo=DEFAULT_TIMEZONE),
                cancellation_terms=terms_of_use[TermsOfUseTypeChoices.CANCELLATION],
                payment_terms=terms_of_use[TermsOfUseTypeChoices.PAYMENT],
                pricing_terms=terms_of_use[TermsOfUseTypeChoices.PRICING],
                service_specific_terms=terms_of_use[TermsOfUseTypeChoices.SERVICE],
            )
            .set_description_info(
                buffer_time="(-0, +0)",
                reservation_time=data.duration_info.name,
                reservable_window="now",
                max_reservations="unlimited",
                reservation_kind=reservation_kind.value,
                start_interval=reservation_start_interval.value,
                authentication=authentication.value,
                cancellation_rule=data.cancellation_rule_info.name,
                handling_required=data.handling_info.name,
                pricing=data.price_info.name,
                payment_type=data.payment_type_info.payment_type.name,
                tax_percentage=data.tax_percentage_info.name,
                metadata_set=set_name.value,
            )
            .build()
        )
        reservation_units.append(reservation_unit)

        reservation_unit_spaces.append(
            ReservationUnitSpacesThoughModel(
                reservationunit=reservation_unit,
                space=space,
            )
        )

        reservation_unit_payment_types.append(
            ReservationUnitPaymentTypesThoughModel(
                reservationunit=reservation_unit,
                reservationunitpaymenttype=payment_types[data.payment_type_info.payment_type],
            ),
        )

        pricing = ReservationUnitPricingFactory.build(
            begins=datetime.date(2021, 1, 1),
            price_unit=data.price_info.price_unit,
            lowest_price=data.price_info.lowest_price,
            highest_price=data.price_info.highest_price,
            reservation_unit=reservation_unit,
            tax_percentage=tax_percentages[data.tax_percentage_info.value],
        )
        pricings.append(pricing)

        image = _fetch_and_build_reservation_unit_image(
            reservation_unit=reservation_unit,
            image_url="https://images.unsplash.com/photo-1414452110837-9dab484a417d",
            filename="vessa",
        )
        images.append(image)

    Unit.objects.bulk_create(units)
    Space.objects.bulk_create(spaces)
    PaymentProduct.objects.bulk_create(payment_products)
    ReservationUnit.objects.bulk_create(reservation_units)
    ReservationUnitSpacesThoughModel.objects.bulk_create(reservation_unit_spaces)
    ReservationUnitPaymentTypesThoughModel.objects.bulk_create(reservation_unit_payment_types)
    ReservationUnitPricing.objects.bulk_create(pricings)
    ReservationUnitImage.objects.bulk_create(images)


@with_logs
def _create_seasonal_bookable_reservation_units(
    cancellation_rules: list[ReservationUnitCancellationRule],
    hauki_resources: list[OriginHaukiResource],
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    tax_percentages: dict[str, TaxPercentage],
) -> None:
    """
    Create reservation units that:
     - Are only SEASONAL bookable
     - Only require WEAK authentication

    Create combinations with:
     - Different min/max reservation times
     - Different cancellation rules
     - Seasonal and direct / seasonal only
    """
    reservation_time_choices: list[DurationInfo] = [
        DurationInfo(name="short", minimum=datetime.timedelta(minutes=15), maximum=datetime.timedelta(minutes=60)),
        DurationInfo(name="long", minimum=datetime.timedelta(hours=2), maximum=datetime.timedelta(hours=5)),
    ]
    cancellation_rule_choices: list[CancelInfo] = [
        CancelInfo(name="cannot", value=[None]),
        CancelInfo(name="allowed", value=cancellation_rules),
    ]
    reservation_kind_choices: list[ReservationKindInfo] = [
        ReservationKindInfo(name="seasonal", value=ReservationKind.SEASON),
        ReservationKindInfo(name="direct and seasonal", value=ReservationKind.DIRECT_AND_SEASON),
    ]

    ReservationUnitSpacesThoughModel: type[models.Model] = ReservationUnit.spaces.through  # noqa: N806

    units: list[Unit] = []
    reservation_units: list[ReservationUnit] = []
    spaces: list[Space] = []
    reservation_unit_spaces: list[models.Model] = []
    pricings: list[ReservationUnitPricing] = []
    images: list[ReservationUnitImage] = []

    unit_counter = itertools.count(start=1)

    reservation_unit_type = ReservationUnitTypeFactory.create(
        name="Kausikäyttöinen",
        name_fi="Kausikäyttöinen",
        name_en="Seasonal use",
        name_sv="Säsongsanvänd",
    )

    for data in get_combinations(
        iterables=[
            reservation_time_choices,
            cancellation_rule_choices,
            reservation_kind_choices,
        ],
        output_type=SeasonalReservationUnitData,
        multiplier=3,
    ):
        set_name: SetName = random.choice(SetName.non_free_of_charge_applying())
        authentication = AuthenticationType.WEAK
        reservation_start_interval = ReservationStartInterval.INTERVAL_30_MINUTES
        number = next(unit_counter)

        unit = UnitFactory.build(
            name=f"Harrastushalli #{number}",
            name_fi=f"Harrastushalli #{number}",
            name_en=f"Hobbyhall #{number}",
            name_sv=f"Hobbyhall #{number}",
            tprek_id=None,
            tprek_department_id=None,
        )
        units.append(unit)

        space = SpaceFactory.build_for_bulk_create(
            name=f"Kerhohuone #{number}",
            name_fi=f"Kerhohuone #{number}",
            name_en=f"Club room #{number}",
            name_sv=f"Klubbrum #{number}",
            unit=unit,
        )
        spaces.append(space)

        reservation_unit = (
            ReservationUnitBuilder()
            .set(
                name=f"Kausivarattava kerhohuone #{number}",
                name_fi=f"Kausivarattava kerhohuone #{number}",
                name_en=f"Seasonal club room #{number}",
                name_sv=f"Säsongsöppet klubbrum #{number}",
                unit=unit,
                origin_hauki_resource=random.choice(hauki_resources),
                allow_reservations_without_opening_hours=True,
                reservations_min_days_before=0,
                reservations_max_days_before=14,
                min_reservation_duration=data.duration_info.minimum,
                max_reservation_duration=data.duration_info.maximum,
                buffer_time_before=datetime.timedelta(),
                buffer_time_after=datetime.timedelta(),
                reservation_start_interval=reservation_start_interval,
                authentication=authentication,
                can_apply_free_of_charge=False,
                max_reservations_per_user=None,
                reservation_unit_type=reservation_unit_type,
                reservation_kind=data.reservation_kind_info.value,
                cancellation_rule=random.choice(data.cancellation_rule_info.value),
                require_reservation_handling=False,
                metadata_set=metadata_sets[set_name],
                reservation_begins=datetime.datetime(2021, 1, 1, tzinfo=DEFAULT_TIMEZONE),
                cancellation_terms=terms_of_use[TermsOfUseTypeChoices.CANCELLATION],
                payment_terms=terms_of_use[TermsOfUseTypeChoices.PAYMENT],
                pricing_terms=terms_of_use[TermsOfUseTypeChoices.PRICING],
                service_specific_terms=terms_of_use[TermsOfUseTypeChoices.SERVICE],
            )
            .set_description_info(
                buffer_time="(-0, +0)",
                reservation_time=data.duration_info.name,
                reservable_window="now",
                max_reservations="unlimited",
                reservation_kind=data.reservation_kind_info.name,
                start_interval=str(reservation_start_interval.as_number),
                authentication=authentication.value,
                cancellation_rule=data.cancellation_rule_info.name,
                handling_required="no",
                pricing="free",
                payment_type="none",
                tax_percentage="0%",
                metadata_set=set_name.value,
            )
            .build()
        )
        reservation_units.append(reservation_unit)

        reservation_unit_spaces.append(
            ReservationUnitSpacesThoughModel(
                reservationunit=reservation_unit,
                space=space,
            )
        )

        pricing = ReservationUnitPricingFactory.build(
            begins=datetime.date(2021, 1, 1),
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=Decimal("0"),
            highest_price=Decimal("0"),
            reservation_unit=reservation_unit,
            tax_percentage=tax_percentages["0"],
        )
        pricings.append(pricing)

    Unit.objects.bulk_create(units)
    Space.objects.bulk_create(spaces)
    ReservationUnit.objects.bulk_create(reservation_units)
    ReservationUnitSpacesThoughModel.objects.bulk_create(reservation_unit_spaces)
    ReservationUnitPricing.objects.bulk_create(pricings)
    ReservationUnitImage.objects.bulk_create(images)

    _create_application_round_time_slots(reservation_units)


@with_logs
def _create_empty_reservation_units(
    cancellation_rules: list[ReservationUnitCancellationRule],
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    tax_percentages: dict[str, TaxPercentage],
) -> None:
    """Creates reservation units that have no spaces, resources, or hauki resource, making it "un-bookable"."""
    unit = UnitFactory.create(
        name="Tyhjä toimipiste",
        name_fi="Tyhjä toimipiste",
        name_en="Empty unit",
        name_sv="Tomt unit",
        tprek_id=None,
        tprek_department_id=None,
    )

    reservation_unit_type = ReservationUnitTypeFactory.create(
        name="Tyhjä",
        name_fi="Tyhjä",
        name_en="Empty",
        name_sv="Tomt",
    )

    reservation_unit = _get_base_reservation_unit_builder(
        reservation_unit_type=reservation_unit_type,
        metadata_sets=metadata_sets,
        terms_of_use=terms_of_use,
        cancellation_rules=cancellation_rules,
    ).create(
        name="Tyhjä varausyksikkö",
        name_fi="Tyhjä varausyksikkö",
        name_en="Empty reservation unit",
        name_sv="Tomt reservation unit",
        unit=unit,
        origin_hauki_resource=None,
    )

    ReservationUnitPricingFactory.create(
        begins=datetime.date(2021, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        lowest_price=Decimal("0"),
        highest_price=Decimal("0"),
        reservation_unit=reservation_unit,
        tax_percentage=tax_percentages["0"],
    )

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=reservation_unit,
        image_url="https://images.unsplash.com/photo-1515511856280-7b23f68d2996",
        filename="tyhjä",
    )
    if image is not None:
        image.save()


@with_logs
def _create_archived_reservation_units(
    cancellation_rules: list[ReservationUnitCancellationRule],
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    hauki_resources: list[OriginHaukiResource],
    tax_percentages: dict[str, TaxPercentage],
) -> None:
    """Creates reservation units that are archived, meaning it has been "soft-removed" from the system."""
    unit = UnitFactory.create(
        name="Arkistoitu",
        name_fi="Arkistoitu",
        name_en="Archived",
        name_sv="Arkiverat",
        tprek_id=None,
        tprek_department_id=None,
    )

    reservation_unit_type = ReservationUnitTypeFactory.create(
        name="Arkistoitu",
        name_fi="Arkistoitu",
        name_en="Archived",
        name_sv="Arkiverat",
    )

    space = SpaceFactory.create(
        name="Vanhanaikainen disko",
        name_fi="Vanhanaikainen disko",
        name_en="Old fashioned disco",
        name_sv="Gammaldags disco",
        unit=unit,
    )

    reservation_unit = (
        _get_base_reservation_unit_builder(
            reservation_unit_type=reservation_unit_type,
            metadata_sets=metadata_sets,
            terms_of_use=terms_of_use,
            cancellation_rules=cancellation_rules,
            hauki_resources=hauki_resources,
        )
        .for_space(space)
        .create(
            is_archived=True,
        )
    )

    reservation_unit.spaces.add(space)

    ReservationUnitPricingFactory.create(
        begins=datetime.date(2021, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        lowest_price=Decimal("0"),
        highest_price=Decimal("0"),
        reservation_unit=reservation_unit,
        tax_percentage=tax_percentages["0"],
    )


@with_logs
def _create_single_reservation_per_user_reservation_units(
    cancellation_rules: list[ReservationUnitCancellationRule],
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    hauki_resources: list[OriginHaukiResource],
    tax_percentages: dict[str, TaxPercentage],
) -> None:
    """Creates reservation units where one user can only have a single reservation at a time."""
    unit = UnitFactory.create(
        name="Yksi varaus per käyttäjä",
        name_fi="Yksi varaus per käyttäjä",
        name_en="Single reservation per user",
        name_sv="Enkel bokning per användare",
        tprek_id=None,
        tprek_department_id=None,
    )

    reservation_unit_type = ReservationUnitTypeFactory.create(
        name="Yksi varaus",
        name_fi="Yksi varaus",
        name_en="Single reservation",
        name_sv="Enkel bokning",
    )

    space = SpaceFactory.create(
        name="Ainutkertainen pakohuone",
        name_fi="Ainutkertainen pakohuone",
        name_en="Once-in-a-lifetime escape room",
        name_sv="En gång i livet utrymningsrum",
        unit=unit,
    )

    reservation_unit = (
        _get_base_reservation_unit_builder(
            reservation_unit_type=reservation_unit_type,
            metadata_sets=metadata_sets,
            terms_of_use=terms_of_use,
            cancellation_rules=cancellation_rules,
            hauki_resources=hauki_resources,
        )
        .for_space(space)
        .create(
            max_reservations_per_user=1,
        )
    )

    reservation_unit.spaces.add(space)

    ReservationUnitPricingFactory.create(
        begins=datetime.date(2021, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        lowest_price=Decimal("0"),
        highest_price=Decimal("0"),
        reservation_unit=reservation_unit,
        tax_percentage=tax_percentages["0"],
    )

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=reservation_unit,
        image_url="https://images.unsplash.com/photo-1543359032-4fd9e3b0b32a",
        filename="ainutkertainen",
    )
    if image is not None:
        image.save()


@with_logs
def _create_full_day_reservation_units(
    cancellation_rules: list[ReservationUnitCancellationRule],
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    hauki_resources: list[OriginHaukiResource],
    tax_percentages: dict[str, TaxPercentage],
) -> None:
    """Creates reservation units where a single booking blocks all other reservations for the same day."""
    unit = UnitFactory.create(
        name="Koko päivän varattava",
        name_fi="Koko päivän varattava",
        name_en="Full day bookable",
        name_sv="Hela dagen bokbart",
        tprek_id=None,
        tprek_department_id=None,
    )

    reservation_unit_type = ReservationUnitTypeFactory.create(
        name="Koko päivän",
        name_fi="Koko päivän",
        name_en="Full day",
        name_sv="Hela dagen",
    )

    ReservationUnitSpacesThoughModel: type[models.Model] = ReservationUnit.spaces.through  # noqa: N806

    reservation_units: list[ReservationUnit] = []
    spaces: list[Space] = []
    reservation_unit_spaces: list[models.Model] = []
    pricings: list[ReservationUnitPricing] = []
    images: list[ReservationUnitImage] = []

    for i in range(1, 11):
        space = SpaceFactory.build_for_bulk_create(
            name=f"Koko päivän leikkipuisto {i}",
            name_fi=f"Koko päivän leikkipuisto {i}",
            name_en=f"All day playground {i}",
            name_sv=f"Lekplats hela dagen {i}",
            unit=unit,
        )
        spaces.append(space)

        reservation_unit = (
            _get_base_reservation_unit_builder(
                reservation_unit_type=reservation_unit_type,
                metadata_sets=metadata_sets,
                terms_of_use=terms_of_use,
                cancellation_rules=cancellation_rules,
                hauki_resources=hauki_resources,
            )
            .for_space(space)
            .build(
                reservation_block_whole_day=True,
            )
        )
        reservation_units.append(reservation_unit)

        reservation_unit_spaces.append(
            ReservationUnitSpacesThoughModel(
                reservationunit=reservation_unit,
                space=space,
            ),
        )

        pricing = ReservationUnitPricingFactory.build(
            begins=datetime.date(2021, 1, 1),
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=Decimal("0"),
            highest_price=Decimal("0"),
            reservation_unit=reservation_unit,
            tax_percentage=tax_percentages["0"],
        )
        pricings.append(pricing)

        image = _fetch_and_build_reservation_unit_image(
            reservation_unit=reservation_unit,
            image_url="https://images.unsplash.com/photo-1707760457564-4a5bc08be1cc",
            filename="kokopaiva",
        )
        if image is not None:
            images.append(image)

    Space.objects.bulk_create(spaces)
    ReservationUnit.objects.bulk_create(reservation_units)
    ReservationUnitSpacesThoughModel.objects.bulk_create(reservation_unit_spaces)
    ReservationUnitPricing.objects.bulk_create(pricings)
    ReservationUnitImage.objects.bulk_create(images)


@with_logs
def _create_reservation_units_in_space_hierarchies(
    cancellation_rules: list[ReservationUnitCancellationRule],
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    hauki_resources: list[OriginHaukiResource],
    tax_percentages: dict[str, TaxPercentage],
) -> None:
    """
    Create reservation units which different parts of the same physical location.
    Reserving some part of the location also prevents reserving any other parts that
    either contain it or are subdivisions of it.

    Here is the example that is created:

    Exhibition center
    ├─ Exhibition center event venue
    │  ├─ Exhibition center grand hall
    │  ├─ Exhibition center auditorium
    │  ├─ Exhibition center dining hall
    ├─ Exhibition center private premises
    │  ├─ Exhibition center lecture hall
    │  ├─ Exhibition center meeting room
    │  ├─ Exhibition center penthouse
    │  │  ├─ Exhibition center penthouse karaoke room
    │  │  ├─ Exhibition center rooftop terrace
    │  │  ├─ Exhibition center private spa
    """
    # --- Setup  ---------------------------------------------------------------------------------------------------

    SpacesThoughModel: type[models.Model] = ReservationUnit.spaces.through  # noqa: N806

    reservation_units: list[ReservationUnit] = []
    reservation_unit_spaces: list[models.Model] = []
    pricings: list[ReservationUnitPricing] = []
    images: list[ReservationUnitImage] = []

    reservation_unit_type = ReservationUnitTypeFactory.create(
        name="Tilahierarkia",
        name_fi="Tilahierarkia",
        name_en="Space hierarchy",
        name_sv="Rumstavshierarki",
    )

    reservation_unit_base = _get_base_reservation_unit_builder(
        reservation_unit_type=reservation_unit_type,
        metadata_sets=metadata_sets,
        terms_of_use=terms_of_use,
        cancellation_rules=cancellation_rules,
        hauki_resources=hauki_resources,
    ).set(
        description=cleandoc(
            """
            Messukeskus EXP
            ├─ EXP Päätapahtumapaikka
            │  ├─ EXP Suuri sali
            │  ├─ EXP Auditorio
            │  ├─ EXP Ruokasali
            ├─ EXP Yksityiset tilat
            │  ├─ EXP Luentosali
            │  ├─ EXP Kokoushuone
            │  ├─ EXP Kattohuoneisto
            │  │  ├─ EXP Karaoke huone
            │  │  ├─ EXP Kattoterassi
            │  │  ├─ EXP Yksityinen kylpylä
            """
        ),
    )

    pricing_base = ReservationUnitPricingBuilder().set(
        begins=datetime.date(2021, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        lowest_price=Decimal("0"),
        highest_price=Decimal("0"),
        tax_percentage=tax_percentages["0"],
    )

    # --- Create common unit ---------------------------------------------------------------------------------------

    unit = UnitFactory.create(
        name="Messukeskus",
        name_fi="Messukeskus",
        name_en="Exhibition center",
        name_sv="Utställningscenter",
        tprek_id=None,
        tprek_department_id=None,
    )

    # --- Create spaces --------------------------------------------------------------------------------------------

    # Can't use 'bulk_create' to create these due to how MPTT works.
    exhibition_center = SpaceFactory.create(
        name="Messukeskus EXP",
        name_fi="Messukeskus EXP",
        name_en="Exhibition center EXP",
        name_sv="Utställningscenter EXP",
        unit=unit,
    )
    main_venue = SpaceFactory.create(
        parent=exhibition_center,
        name="EXP Päätapahtumapaikka",
        name_fi="EXP Päätapahtumapaikka",
        name_en="EXP Main Venue",
        name_sv="EXP Huvudplats",
        unit=unit,
    )
    grand_hall = SpaceFactory.create(
        parent=main_venue,
        name="EXP Suuri sali",
        name_fi="EXP Suuri sali",
        name_en="EXP Grand Hall",
        name_sv="EXP Stora salen",
        unit=unit,
    )
    auditorium = SpaceFactory.create(
        parent=main_venue,
        name="EXP Auditorio",
        name_fi="EXP Auditorio",
        name_en="EXP Auditorium",
        name_sv="EXP Hörsal",
        unit=unit,
    )
    dining_hall = SpaceFactory.create(
        parent=main_venue,
        name="EXP Ruokasali",
        name_fi="EXP Ruokasali",
        name_en="EXP Dining Hall",
        name_sv="EXP Matsal",
        unit=unit,
    )
    private_premises = SpaceFactory.create(
        parent=exhibition_center,
        name="EXP Yksityiset tilat",
        name_fi="EXP Yksityiset tilat",
        name_en="EXP Private Premises",
        name_sv="EXP Privata lokaler",
        unit=unit,
    )
    lecture_hall = SpaceFactory.create(
        parent=private_premises,
        name="EXP Luentosali",
        name_fi="EXP Luentosali",
        name_en="EXP Lecture Hall",
        name_sv="EXP Föreläsningssal",
        unit=unit,
    )
    meeting_room = SpaceFactory.create(
        parent=private_premises,
        name="EXP Kokoushuone",
        name_fi="EXP Kokoushuone",
        name_en="EXP Meeting Room",
        name_sv="EXP Mötesrum",
        unit=unit,
    )
    penthouse = SpaceFactory.create(
        parent=private_premises,
        name="EXP Kattohuoneisto",
        name_fi="EXP Kattohuoneisto",
        name_en="EXP Penthouse",
        name_sv="EXP Takvåning",
        unit=unit,
    )
    karaoke_room = SpaceFactory.create(
        parent=penthouse,
        name="EXP Karaoke huone",
        name_fi="EXP Karaoke huone",
        name_en="EXP Karaokerum",
        name_sv="EXP Karaoke Room",
        unit=unit,
    )
    rooftop_terrace = SpaceFactory.create(
        parent=penthouse,
        name="EXP Kattoterassi",
        name_fi="EXP Kattoterassi",
        name_en="EXP Rooftop Terrace",
        name_sv="EXP Takterrass",
        unit=unit,
    )
    spa = SpaceFactory.create(
        parent=penthouse,
        name="EXP Yksityinen kylpylä",
        name_fi="EXP Yksityinen kylpylä",
        name_en="EXP Private Spa",
        name_sv="EXP Privat spa",
        unit=unit,
    )

    Space.objects.rebuild()

    # --- Create reservation units ---------------------------------------------------------------------------------

    exhibition_center_unit = reservation_unit_base.for_space(exhibition_center).build()
    reservation_units.append(exhibition_center_unit)
    pricings.append(pricing_base.build(reservation_unit=exhibition_center_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=exhibition_center_unit, space=exhibition_center))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=exhibition_center_unit,
        image_url="https://images.unsplash.com/photo-1559171667-74fe3499b5ba",
        filename="messukeskus",
    )
    if image is not None:
        images.append(image)

    main_venue_unit = reservation_unit_base.for_space(main_venue).build()
    reservation_units.append(main_venue_unit)
    pricings.append(pricing_base.build(reservation_unit=main_venue_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=main_venue_unit, space=main_venue))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=main_venue_unit,
        image_url="https://images.unsplash.com/photo-1592899940510-1240e12e70db",
        filename="messukeskus_tilat",
    )
    if image is not None:
        images.append(image)

    grand_hall_unit = reservation_unit_base.for_space(grand_hall).build()
    reservation_units.append(grand_hall_unit)
    pricings.append(pricing_base.build(reservation_unit=grand_hall_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=grand_hall_unit, space=grand_hall))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=grand_hall_unit,
        image_url="https://images.unsplash.com/photo-1698070415992-3a8f8dc61e55",
        filename="messukeskus_suurisali",
    )
    if image is not None:
        images.append(image)

    auditorium_unit = reservation_unit_base.for_space(auditorium).build()
    reservation_units.append(auditorium_unit)
    pricings.append(pricing_base.build(reservation_unit=auditorium_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=auditorium_unit, space=auditorium))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=auditorium_unit,
        image_url="https://images.unsplash.com/photo-1675327161957-929e3faa37cc",
        filename="messukeskus_auditorio",
    )
    if image is not None:
        images.append(image)

    dining_hall_unit = reservation_unit_base.for_space(dining_hall).build()
    reservation_units.append(dining_hall_unit)
    pricings.append(pricing_base.build(reservation_unit=dining_hall_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=dining_hall_unit, space=dining_hall))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=dining_hall_unit,
        image_url="https://images.unsplash.com/photo-1524824267900-2fa9cbf7a506",
        filename="messukeskus_ruokasali",
    )
    if image is not None:
        images.append(image)

    private_premises_unit = reservation_unit_base.for_space(private_premises).build()
    reservation_units.append(private_premises_unit)
    pricings.append(pricing_base.build(reservation_unit=private_premises_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=private_premises_unit, space=private_premises))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=private_premises_unit,
        image_url="https://images.unsplash.com/photo-1529579018789-28bb8d323ae0",
        filename="messukeskus_yksityistilat",
    )
    if image is not None:
        images.append(image)

    lecture_hall_unit = reservation_unit_base.for_space(lecture_hall).build()
    reservation_units.append(lecture_hall_unit)
    pricings.append(pricing_base.build(reservation_unit=lecture_hall_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=lecture_hall_unit, space=lecture_hall))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=lecture_hall_unit,
        image_url="https://images.unsplash.com/photo-1702763529935-f4f7b4df3380",
        filename="messukeskus_luoentosali",
    )
    if image is not None:
        images.append(image)

    meeting_room_unit = reservation_unit_base.for_space(meeting_room).build()
    reservation_units.append(meeting_room_unit)
    pricings.append(pricing_base.build(reservation_unit=meeting_room_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=meeting_room_unit, space=meeting_room))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=meeting_room_unit,
        image_url="https://images.unsplash.com/photo-1505624198937-c704aff72608",
        filename="messukeskus_kokoushuone",
    )
    if image is not None:
        images.append(image)

    penthouse_unit = reservation_unit_base.for_space(penthouse).build()
    reservation_units.append(penthouse_unit)
    pricings.append(pricing_base.build(reservation_unit=penthouse_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=penthouse_unit, space=penthouse))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=penthouse_unit,
        image_url="https://images.unsplash.com/photo-1565623833408-d77e39b88af6",
        filename="messukeskus_kattohuoneisto",
    )
    if image is not None:
        images.append(image)

    karaoke_room_unit = reservation_unit_base.for_space(karaoke_room).build()
    reservation_units.append(karaoke_room_unit)
    pricings.append(pricing_base.build(reservation_unit=karaoke_room_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=karaoke_room_unit, space=karaoke_room))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=karaoke_room_unit,
        image_url="https://images.unsplash.com/photo-1632499356678-e407ca5ac1b8",
        filename="messukeskus_karaoke",
    )
    if image is not None:
        images.append(image)

    rooftop_terrace_unit = reservation_unit_base.for_space(rooftop_terrace).build()
    reservation_units.append(rooftop_terrace_unit)
    pricings.append(pricing_base.build(reservation_unit=rooftop_terrace_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=rooftop_terrace_unit, space=rooftop_terrace))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=rooftop_terrace_unit,
        image_url="https://images.unsplash.com/photo-1657639753220-8d59b05958d1",
        filename="messukeskus_karaoke",
    )
    if image is not None:
        images.append(image)

    spa_unit = reservation_unit_base.for_space(spa).build()
    reservation_units.append(spa_unit)
    pricings.append(pricing_base.build(reservation_unit=spa_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=spa_unit, space=spa))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=spa_unit,
        image_url="https://images.unsplash.com/photo-1507652313519-d4e9174996dd",
        filename="messukeskus_spa",
    )
    if image is not None:
        images.append(image)

    ReservationUnit.objects.bulk_create(reservation_units)
    SpacesThoughModel.objects.bulk_create(reservation_unit_spaces)
    ReservationUnitPricing.objects.bulk_create(pricings)
    ReservationUnitImage.objects.bulk_create(images)


@with_logs
def _create_reservation_units_in_resource_hierarchies(
    cancellation_rules: list[ReservationUnitCancellationRule],
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    hauki_resources: list[OriginHaukiResource],
    tax_percentages: dict[str, TaxPercentage],
) -> None:
    """
    Create reservation units that share some common resources but different locations.
    Reserving the resource for one location prevents reserving the other locations,
    since the resource is no longer available.

    Here is the example that is created:

    Resources:
    - Coffee machine
    - Printer

    Spaces:
    - Kitchen
    - Open office space
    - Meeting room
    - Break room

    Reservation units:
    - Open office space
        - Resources:
            - Printer
    - Meeting room
        - Resources:
            - Printer
            - Coffee machine
    - Break room
        - Resources:
            - Printer
            - Coffee machine
    """
    # --- Setup  ---------------------------------------------------------------------------------------------------

    SpacesThoughModel: type[models.Model] = ReservationUnit.spaces.through  # noqa: N806
    ResourceThoughModel: type[models.Model] = ReservationUnit.resources.through  # noqa: N806

    reservation_unit_type = ReservationUnitTypeFactory.create(
        name="Resurssihierarkia",
        name_fi="Resurssihierarkia",
        name_en="Resource hierarchy",
        name_sv="Resursshierarki",
    )

    reservation_units: list[ReservationUnit] = []
    reservation_unit_spaces: list[models.Model] = []
    reservation_unit_resources: list[models.Model] = []
    pricings: list[ReservationUnitPricing] = []
    images: list[ReservationUnitImage] = []

    reservation_unit_base = _get_base_reservation_unit_builder(
        reservation_unit_type=reservation_unit_type,
        metadata_sets=metadata_sets,
        terms_of_use=terms_of_use,
        cancellation_rules=cancellation_rules,
        hauki_resources=hauki_resources,
    ).set(
        description=cleandoc(
            """
            - Konttorin avoimet työskentelytilat
                - Resurssit:
                    - Konttorin ainoa tulostin
            - Konttorin kokoushuone
                - Resurssit:
                    - Konttorin ainoa tulostin
                    - Konttorin ainoa kahvikone
            - Konttorin taukohuone
                - Resurssit:
                    - Konttorin ainoa tulostin
                    - Konttorin ainoa kahvikone
            """
        ),
    )

    pricing_base = ReservationUnitPricingBuilder().set(
        begins=datetime.date(2021, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        lowest_price=Decimal("0"),
        highest_price=Decimal("0"),
        tax_percentage=tax_percentages["0"],
    )

    # --- Create unit ---------------------------------------------------------------------------------------------

    unit = UnitFactory.create(
        name="Niukkaresurssinen konttori",
        name_fi="Niukkaresurssinen konttori",
        name_en="Office of scarce resources",
        name_sv="Kontoret för knappa resurser",
        tprek_id=None,
        tprek_department_id=None,
    )

    # --- Create spaces --------------------------------------------------------------------------------------------

    kitchen = SpaceFactory.build_for_bulk_create(
        name="Konttorin keittiö",
        name_fi="Konttorin keittiö",
        name_en="Office kichen",
        name_sv="Kontors kök",
        unit=unit,
    )
    open_office_space = SpaceFactory.build_for_bulk_create(
        name="Konttorin avoimet työskentelytilat",
        name_fi="Konttorin avoimet työskentelytilat",
        name_en="Open office space",
        name_sv="Kontorets öppna arbetsytor",
        unit=unit,
    )
    meeting_room = SpaceFactory.build_for_bulk_create(
        name="Konttorin kokoushuone",
        name_fi="Konttorin kokoushuone",
        name_en="Office meeting room",
        name_sv="Kontors mötesrum",
        unit=unit,
    )
    break_room = SpaceFactory.build_for_bulk_create(
        name="Konttorin taukohuone",
        name_fi="Konttorin taukohuone",
        name_en="Office breakroom",
        name_sv="Kontorspausrum",
        unit=unit,
    )
    Space.objects.bulk_create([kitchen, open_office_space, meeting_room, break_room])

    # --- Add resources --------------------------------------------------------------------------------------------

    coffee_machine = ResourceFactory.build(
        name="Konttorin ainoa kahvikone",
        name_fi="Konttorin ainoa kahvikone",
        name_en="The only coffee machine in the office",
        name_sv="Den enda kaffemaskinen på kontoret",
        space=kitchen,
        location_type=ResourceLocationType.MOVABLE,
    )
    printer = ResourceFactory.build(
        name="Konttorin ainoa tulostin",
        name_fi="Konttorin ainoa tulostin",
        name_en="The only printer in the office",
        name_sv="Den enda skrivaren på kontoret",
        space=open_office_space,
        location_type=ResourceLocationType.FIXED,
    )

    Resource.objects.bulk_create([coffee_machine, printer])

    # --- Create reservation units ---------------------------------------------------------------------------------

    meeting_room_unit = reservation_unit_base.for_space(meeting_room).build()
    reservation_units.append(meeting_room_unit)
    pricings.append(pricing_base.build(reservation_unit=meeting_room_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=meeting_room_unit, space=meeting_room))
    reservation_unit_resources.append(ResourceThoughModel(reservationunit=meeting_room_unit, resource=coffee_machine))
    reservation_unit_resources.append(ResourceThoughModel(reservationunit=meeting_room_unit, resource=printer))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=meeting_room_unit,
        image_url="https://images.unsplash.com/photo-1462826303086-329426d1aef5",
        filename="toimisto_kokoushuone",
    )
    if image is not None:
        images.append(image)

    break_room_unit = reservation_unit_base.for_space(break_room).build()
    reservation_units.append(break_room_unit)
    pricings.append(pricing_base.build(reservation_unit=break_room_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=break_room_unit, space=break_room))
    reservation_unit_resources.append(ResourceThoughModel(reservationunit=break_room_unit, resource=coffee_machine))
    reservation_unit_resources.append(ResourceThoughModel(reservationunit=break_room_unit, resource=printer))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=break_room_unit,
        image_url="https://images.unsplash.com/photo-1568992687947-868a62a9f521",
        filename="toimisto_taukohuone",
    )
    if image is not None:
        images.append(image)

    open_office_unit = reservation_unit_base.for_space(open_office_space).build()
    reservation_units.append(open_office_unit)
    pricings.append(pricing_base.build(reservation_unit=open_office_unit))
    reservation_unit_spaces.append(SpacesThoughModel(reservationunit=open_office_unit, space=open_office_space))
    reservation_unit_resources.append(ResourceThoughModel(reservationunit=open_office_unit, resource=printer))

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=open_office_unit,
        image_url="https://images.unsplash.com/photo-1531973576160-7125cd663d86",
        filename="toimisto_avokonttori",
    )
    if image is not None:
        images.append(image)

    ReservationUnit.objects.bulk_create(reservation_units)
    SpacesThoughModel.objects.bulk_create(reservation_unit_spaces)
    ResourceThoughModel.objects.bulk_create(reservation_unit_resources)
    ReservationUnitPricing.objects.bulk_create(pricings)
    ReservationUnitImage.objects.bulk_create(images)


def _get_base_reservation_unit_builder(
    *,
    reservation_unit_type: ReservationUnitType,
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    cancellation_rules: list[ReservationUnitCancellationRule] = (None,),
    hauki_resources: list[OriginHaukiResource] = (None,),
) -> ReservationUnitBuilder:
    return ReservationUnitBuilder().set(
        origin_hauki_resource=random.choice(hauki_resources),
        allow_reservations_without_opening_hours=True,
        reservations_min_days_before=0,
        reservations_max_days_before=14,
        min_reservation_duration=datetime.timedelta(hours=1),
        max_reservation_duration=datetime.timedelta(hours=4),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        authentication=AuthenticationType.WEAK,
        can_apply_free_of_charge=False,
        max_reservations_per_user=None,
        reservation_unit_type=reservation_unit_type,
        reservation_kind=ReservationKind.DIRECT,
        cancellation_rule=random.choice(cancellation_rules),
        require_reservation_handling=False,
        metadata_set=metadata_sets[SetName.set_1],
        reservation_begins=datetime.datetime(2021, 1, 1, tzinfo=DEFAULT_TIMEZONE),
        cancellation_terms=terms_of_use[TermsOfUseTypeChoices.CANCELLATION],
        payment_terms=terms_of_use[TermsOfUseTypeChoices.PAYMENT],
        pricing_terms=terms_of_use[TermsOfUseTypeChoices.PRICING],
        service_specific_terms=terms_of_use[TermsOfUseTypeChoices.SERVICE],
    )
