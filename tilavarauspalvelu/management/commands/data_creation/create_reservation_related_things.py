import datetime
import itertools
import random
from decimal import Decimal
from itertools import cycle
from pathlib import Path

import requests
from django.conf import settings
from django.contrib.gis.geos import Point

from tests.factories import (
    AgeGroupFactory,
    CityFactory,
    EquipmentCategoryFactory,
    EquipmentFactory,
    LocationFactory,
    OriginHaukiResourceFactory,
    PaymentAccountingFactory,
    PaymentMerchantFactory,
    PurposeFactory,
    QualifierFactory,
    ReservableTimeSpanFactory,
    ReservationCancelReasonFactory,
    ReservationDenyReasonFactory,
    ReservationMetadataFieldFactory,
    ReservationMetadataSetFactory,
    ReservationPurposeFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitImageFactory,
    ReservationUnitPaymentTypeFactory,
    ServiceFactory,
    TaxPercentageFactory,
    TermsOfUseFactory,
)
from tilavarauspalvelu.constants import COORDINATE_SYSTEM_ID
from tilavarauspalvelu.enums import PaymentType, ReservationUnitImageType, ServiceTypeChoices, TermsOfUseTypeChoices
from tilavarauspalvelu.models import (
    AgeGroup,
    City,
    Equipment,
    EquipmentCategory,
    Location,
    OriginHaukiResource,
    PaymentAccounting,
    PaymentMerchant,
    Purpose,
    Qualifier,
    ReservableTimeSpan,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationMetadataField,
    ReservationMetadataSet,
    ReservationPurpose,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitImage,
    ReservationUnitPaymentType,
    Service,
    Space,
    TaxPercentage,
    TermsOfUse,
    Unit,
)
from utils.date_utils import DEFAULT_TIMEZONE, combine, local_start_of_day

from .utils import FieldCombination, Percentage, PurposeData, SetName, with_logs


@with_logs
def _create_equipments() -> list[Equipment]:
    equipment_categories = [EquipmentCategoryFactory.build() for _ in range(10)]
    equipment_categories = EquipmentCategory.objects.bulk_create(equipment_categories)
    equipments = [EquipmentFactory.build(category=random.choice(equipment_categories)) for _ in range(30)]
    return Equipment.objects.bulk_create(equipments)


@with_logs
def _create_qualifiers() -> list[Qualifier]:
    qualifiers = [QualifierFactory.build() for _ in range(3)]
    return Qualifier.objects.bulk_create(qualifiers)


@with_logs
def _create_purposes() -> list[Purpose]:
    purpose_data: list[PurposeData] = [
        PurposeData(
            name_fi="Pidä kokous",
            name_en="Hold a meeting",
            name_sv="Håll möte",
            image_url=(
                "https://tilavaraus.test.hel.ninja/"
                "media/reservation_unit_purpose_images/Varaamo_Pida_kokous_Maija_Astikainen.jpg"
            ),
            image_filename="Varaamo_Pida_kokous_Maija_Astikainen",
        ),
        PurposeData(
            name_fi="Löydä juhlatila",
            name_en="Find a party venue",
            name_sv="Hitta festlokal",
            image_url=(
                "https://tilavaraus.test.hel.ninja/"
                "media/reservation_unit_purpose_images/Varaamo_Loyda_juhlatila_Maija_Astikainen.jpg"
            ),
            image_filename="Varaamo_Loyda_juhlatila_Maija_Astikainen",
        ),
        PurposeData(
            name_fi="Järjestä tapahtuma",
            name_en="Organise an event",
            name_sv="Arrangera evenemang",
            image_url=(
                "https://tilavaraus.test.hel.ninja/"
                "media/reservation_unit_purpose_images/Varaamo_Jarjesta_tapahtuma_Vesa_Laitinen.jpg"
            ),
            image_filename="Varaamo_Jarjesta_tapahtuma_Vesa_Laitinen",
        ),
        PurposeData(
            name_fi="Harrasta yhdessä",
            name_en="Engage in hobbies together",
            name_sv="Utöva hobbyer tillsammans",
            image_url=(
                "https://tilavaraus.test.hel.ninja/"
                "media/reservation_unit_purpose_images/Varaamo_Harrasta_yhdessa_Maija_Astikainen.jpg"
            ),
            image_filename="Varaamo_Harrasta_yhdessa_Maija_Astikainen",
        ),
        PurposeData(
            name_fi="Liiku ja rentoudu",
            name_en="Exercise and relax",
            name_sv="Motionera och koppla av",
            image_url=(
                "https://tilavaraus.test.hel.ninja/"
                "media/reservation_unit_purpose_images/Varaamo_Liiku_Maija_Astikainen.jpg"
            ),
            image_filename="Varaamo_Liiku_Maija_Astikainen",
        ),
        PurposeData(
            name_fi="Pelaa digitaalisesti",
            name_en="Exercise and relax",
            name_sv="Motionera och koppla av",
            image_url=(
                "https://tilavaraus.test.hel.ninja/"
                "media/reservation_unit_purpose_images/Varaamo_Pelaa_digitaalisesti_Maija_Astikainen_FmzBTxt.jpg"
            ),
            image_filename="Varaamo_Pelaa_digitaalisesti_Maija_Astikainen_FmzBTxt",
        ),
        PurposeData(
            name_fi="Työskentele yksin tai ryhmässä",
            name_en="Work alone or in a group",
            name_sv="Arbeta enskilt eller i grupp",
            image_url=(
                "https://tilavaraus.test.hel.ninja/"
                "media/reservation_unit_purpose_images/Varaamo_Tyoskentele_yksin_tai_ryhmassa_Maija_Astikainen.jpg"
            ),
            image_filename="Varaamo_Tyoskentele_yksin_tai_ryhmassa_Maija_Astikainen",
        ),
        PurposeData(
            name_fi="Tee musiikkia tai äänitä",
            name_en="Make music or record",
            name_sv="Gör musik eller spela in",
            image_url=(
                "https://tilavaraus.test.hel.ninja/"
                "media/reservation_unit_purpose_images/Varaamo_Tee_musiikkia_ja_aanita_Maija_Astikainen.jpg"
            ),
            image_filename="Varaamo_Tee_musiikkia_ja_aanita_Maija_Astikainen",
        ),
        PurposeData(
            name_fi="Käytä laitteita",
            name_en="Use equipment",
            name_sv="Använd utrustning",
            image_url=(
                "https://tilavaraus.test.hel.ninja/"
                "media/reservation_unit_purpose_images/Varaamo_Kayta_laitteita2_Maija_Astikainen.jpg"
            ),
            image_filename="Varaamo_Kayta_laitteita2_Maija_Astikainen",
        ),
        PurposeData(
            name_fi="Sauno tai mökkeile",
            name_en="Take a sauna or stay in a cabin",
            name_sv="Bada bastu eller bo i stuga",
            image_url=(
                "https://tilavaraus.test.hel.ninja/"
                "media/reservation_unit_purpose_images/Varaamo_sauna_maarit_hohteri.png"
            ),
            image_filename="Varaamo_sauna_maarit_hohteri",
            extension=".png",
        ),
        PurposeData(
            name_fi="Järjestä näyttely",
            name_en="Organize an exhibition",
            name_sv="Organisera en utställning",
            image_url=(
                "https://tilavaraus.test.hel.ninja/"
                "media/reservation_unit_purpose_images/JPG-1_varaamo_jakomaki_2811202_maija_astikainen-3202-Edit.jpg"
            ),
            image_filename="JPG-1_varaamo_jakomaki_2811202_maija_astikainen-3202-Edit",
        ),
    ]

    purposes: list[Purpose] = []

    add_images = settings.MEDIA_ROOT and settings.DOWNLOAD_IMAGES_FOR_TEST_DATA

    for data in purpose_data:
        image: str | None = None
        if add_images:
            path = Path(settings.MEDIA_ROOT) / settings.RESERVATION_UNIT_PURPOSE_IMAGES_ROOT / data.image_filename
            path = path.with_suffix(data.extension)
            if not path.exists():
                _fetch_image(data.image_url, path)

            image = f"{settings.RESERVATION_UNIT_PURPOSE_IMAGES_ROOT}/{data.image_filename}{data.extension}"

        purpose = PurposeFactory.build(
            name=data.name_fi,
            name_fi=data.name_fi,
            name_en=data.name_en,
            name_sv=data.name_sv,
            image=image,
        )
        purposes.append(purpose)

    return Purpose.objects.bulk_create(purposes)


@with_logs
def _create_services() -> list[Service]:
    service_types = cycle(ServiceTypeChoices.values)

    services = [
        ServiceFactory.build(
            service_type=next(service_types),
        )
        for _ in range(10)
    ]

    return Service.objects.bulk_create(services)


@with_logs
def _create_reservation_unit_payment_types() -> dict[PaymentType.INVOICE, ReservationUnitPaymentType]:
    payment_types = [ReservationUnitPaymentTypeFactory.build(code=payment_type) for payment_type in PaymentType.values]
    payment_types = ReservationUnitPaymentType.objects.bulk_create(payment_types)
    return {PaymentType(payment_type.code): payment_type for payment_type in payment_types}


@with_logs
def _create_tax_percentages() -> dict[Percentage, TaxPercentage]:
    tax_percentages: list[TaxPercentage] = [
        TaxPercentageFactory.build(value=Decimal(percentage))  #
        for percentage in ("0", "10", "14", "24", "25.5")
    ]
    tax_percentages = TaxPercentage.objects.bulk_create(tax_percentages)
    return {str(tax.value): tax for tax in tax_percentages}  # type: ignore[return-value]


@with_logs
def _create_hauki_resources() -> list[OriginHaukiResource]:
    start_of_day = local_start_of_day()
    today = start_of_day.date()

    resource_id_generator = itertools.count(start=1)

    # Open 24 hours a day
    ReservableTimeSpanFactory.create(
        resource__id=next(resource_id_generator),
        start_datetime=start_of_day,
        end_datetime=start_of_day + datetime.timedelta(days=721),
    )

    time_options: list[list[dict[str, datetime.time]]] = [
        # One reservable segment
        [
            {
                "start_time": datetime.time(10, tzinfo=DEFAULT_TIMEZONE),
                "end_time": datetime.time(20, tzinfo=DEFAULT_TIMEZONE),
            },
        ],
        # Two reservable segments
        [
            {
                "start_time": datetime.time(8, tzinfo=DEFAULT_TIMEZONE),
                "end_time": datetime.time(11, tzinfo=DEFAULT_TIMEZONE),
            },
            {
                "start_time": datetime.time(14, tzinfo=DEFAULT_TIMEZONE),
                "end_time": datetime.time(22, tzinfo=DEFAULT_TIMEZONE),
            },
        ],
    ]

    hauki_resources: list[OriginHaukiResource] = []
    timespans: list[ReservableTimeSpan] = []

    for option in time_options:
        hauki_resource = OriginHaukiResourceFactory.build(id=next(resource_id_generator))
        hauki_resources.append(hauki_resource)

        for time_span in option:
            additional_day = 1 if time_span["start_time"] > time_span["end_time"] else 0

            timespans += [
                ReservableTimeSpanFactory.build(
                    resource=hauki_resource,
                    start_datetime=combine(
                        date=today + datetime.timedelta(days=day),
                        time=time_span["start_time"],
                    ),
                    end_datetime=combine(
                        date=today + datetime.timedelta(days=day + additional_day),
                        time=time_span["end_time"],
                    ),
                )
                for day in range(721)
            ]

    hauki_resources = OriginHaukiResource.objects.bulk_create(hauki_resources)
    ReservableTimeSpan.objects.bulk_create(timespans)
    return hauki_resources


@with_logs
def _create_specific_terms_of_use() -> dict[TermsOfUseTypeChoices, TermsOfUse]:
    terms_of_use: list[TermsOfUse] = []

    for term_type in TermsOfUseTypeChoices.specific_terms():
        name = term_type.value.replace("_", " ").title()
        terms = TermsOfUseFactory.build(
            id=f"{term_type}_1",
            name=name,
            name_fi=name,
            name_sv=name,
            name_en=name,
            terms_type=term_type,
        )
        terms_of_use.append(terms)

    return {term.terms_type: term for term in TermsOfUse.objects.bulk_create(terms_of_use)}


@with_logs
def _create_cancellation_rules() -> list[ReservationUnitCancellationRule]:
    non_handling_rules = [
        ReservationUnitCancellationRuleFactory.build(
            can_be_cancelled_time_before=datetime.timedelta(days=i),
            needs_handling=False,
        )
        for i in range(2)
    ]
    return ReservationUnitCancellationRule.objects.bulk_create(non_handling_rules)


@with_logs
def _create_reservation_metadata_sets() -> dict[SetName, ReservationMetadataSet]:
    metadata_fields = {field.field_name: field for field in _create_metadata_fields()}

    field_combinations: dict[SetName, FieldCombination] = {
        SetName.set_1: FieldCombination(
            supported=[
                "reservee_first_name",
                "reservee_last_name",
                "reservee_email",
                "reservee_phone",
            ],
            required=[
                "reservee_first_name",
                "reservee_last_name",
                "reservee_email",
                "reservee_phone",
            ],
        ),
        SetName.set_2: FieldCombination(
            supported=[
                "description",
                "num_persons",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[
                "description",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
        ),
        SetName.set_3: FieldCombination(
            supported=[
                "description",
                "home_city",
                "name",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[
                "description",
                "home_city",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
        ),
        SetName.set_4: FieldCombination(
            supported=[
                "age_group",
                "description",
                "home_city",
                "name",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[
                "age_group",
                "description",
                "home_city",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
        ),
        SetName.set_5: FieldCombination(
            supported=[
                "applying_for_free_of_charge",
                "description",
                "home_city",
                "name",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[
                "description",
                "home_city",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
        ),
        SetName.set_6: FieldCombination(
            supported=[
                "age_group",
                "applying_for_free_of_charge",
                "description",
                "home_city",
                "name",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[
                "age_group",
                "description",
                "home_city",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
        ),
        SetName.set_all: FieldCombination(
            supported=[
                "age_group",
                "applying_for_free_of_charge",
                "billing_address_city",
                "billing_address_street",
                "billing_address_zip",
                "billing_email",
                "billing_first_name",
                "billing_last_name",
                "billing_phone",
                "description",
                "free_of_charge_reason",
                "home_city",
                "name",
                "num_persons",
                "purpose",
                "reservee_address_city",
                "reservee_address_street",
                "reservee_address_zip",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[],
        ),
    }

    metadata_sets = [
        ReservationMetadataSetFactory.build(name=name.value)  #
        for name in field_combinations
    ]
    metadata_sets = ReservationMetadataSet.objects.bulk_create(metadata_sets)

    for metadata_set in metadata_sets:
        fields = field_combinations[SetName(metadata_set.name)]
        supported = [metadata_fields[field] for field in fields.supported]
        required = [metadata_fields[field] for field in fields.required]
        metadata_set.supported_fields.add(*supported)
        metadata_set.required_fields.add(*required)

    return {SetName(metadata_set.name): metadata_set for metadata_set in metadata_sets}


@with_logs
def _create_metadata_fields() -> list[ReservationMetadataField]:
    form_fields: list[str] = [
        "reservee_type",
        "reservee_first_name",
        "reservee_last_name",
        "reservee_organisation_name",
        "reservee_phone",
        "reservee_email",
        "reservee_id",
        "reservee_is_unregistered_association",
        "reservee_address_street",
        "reservee_address_city",
        "reservee_address_zip",
        "billing_first_name",
        "billing_last_name",
        "billing_phone",
        "billing_email",
        "billing_address_street",
        "billing_address_city",
        "billing_address_zip",
        "home_city",
        "age_group",
        "applying_for_free_of_charge",
        "free_of_charge_reason",
        "name",
        "description",
        "num_persons",
        "purpose",
    ]
    metadata_fields = [
        ReservationMetadataFieldFactory.build(field_name=field_name)  #
        for field_name in form_fields
    ]
    return ReservationMetadataField.objects.bulk_create(metadata_fields)


@with_logs
def _create_reservation_purposes() -> list[ReservationPurpose]:
    reservation_purposes = [
        ReservationPurposeFactory.build()  #
        for _ in range(10)
    ]
    return ReservationPurpose.objects.bulk_create(reservation_purposes)


@with_logs
def _create_cancel_reasons() -> list[ReservationCancelReason]:
    cancel_reasons = [
        ReservationCancelReasonFactory.build()  #
        for _ in range(10)
    ]
    return ReservationCancelReason.objects.bulk_create(cancel_reasons)


@with_logs
def _create_deny_reasons() -> list[ReservationDenyReason]:
    deny_reasons = [
        ReservationDenyReasonFactory.build()  #
        for _ in range(10)
    ]
    return ReservationDenyReason.objects.bulk_create(deny_reasons)


@with_logs
def _create_age_groups() -> list[AgeGroup]:
    combinations = [
        (1, 8),
        (9, 12),
        (13, 17),
        (18, 24),
        (25, 28),
        (29, 64),
        (65, None),
    ]

    age_groups = [
        AgeGroupFactory.build(
            minimum=minimum,
            maximum=maximum,
        )
        for minimum, maximum in combinations
    ]

    return AgeGroup.objects.bulk_create(age_groups)


@with_logs
def _create_cities() -> list[City]:
    cities = [
        CityFactory.build()  #
        for _ in range(10)
    ]
    return City.objects.bulk_create(cities)


@with_logs
def _create_locations() -> list[Location]:
    unit_locations = [
        LocationFactory.build(
            unit=unit,
            coordinates=Point(
                x=random.randint(-180, 180),  # latitude
                y=random.randint(-90, 90),  # longitude
                srid=COORDINATE_SYSTEM_ID,
            ),
        )
        for unit in Unit.objects.all()
    ]
    space_locations = [
        LocationFactory.build(
            space=space,
            coordinates=Point(
                x=random.randint(-180, 180),  # latitude
                y=random.randint(-90, 90),  # longitude
                srid=COORDINATE_SYSTEM_ID,
            ),
        )
        for space in Space.objects.all()
    ]
    return Location.objects.bulk_create(unit_locations + space_locations)


@with_logs
def _create_payment_merchants() -> list[PaymentMerchant]:
    merchants = [
        PaymentMerchantFactory.build()  #
        for _ in range(10)
    ]
    return PaymentMerchant.objects.bulk_create(merchants)


@with_logs
def _create_payment_accountings() -> list[PaymentAccounting]:
    accountings = [
        PaymentAccountingFactory.build()  #
        for _ in range(10)
    ]
    return PaymentAccounting.objects.bulk_create(accountings)


def _fetch_and_build_reservation_unit_image(
    reservation_unit: ReservationUnit,
    image_url: str,
    filename: str,
    extension: str = ".jpg",
    image_type: ReservationUnitImageType = ReservationUnitImageType.MAIN,
) -> ReservationUnitImage | None:
    """
    Build a new reservation unit image using the image from the given URL.
    Save image using the given filename and extension. If this function is called later for the same filename,
    and that file already exists, use the existing file instead of downloading the image again.
    """
    # Don't create images during tests, since it's slow.
    if not settings.DOWNLOAD_IMAGES_FOR_TEST_DATA:
        return None

    if not settings.MEDIA_ROOT:
        msg = f"Media root not set. Cannot save image from '{image_url}'."
        print(msg)  # noqa: T201, RUF100
        return None

    path = Path(settings.MEDIA_ROOT) / settings.RESERVATION_UNIT_IMAGES_ROOT / filename
    path = path.with_suffix(extension)

    if not path.exists():
        _fetch_image(image_url, path)

    return ReservationUnitImageFactory.build(
        image=f"{settings.RESERVATION_UNIT_IMAGES_ROOT}/{filename}{extension}",
        image_type=image_type,
        reservation_unit=reservation_unit,
    )


def _fetch_image(image_url: str, path: Path) -> None:
    """
    Fetch image from the internet and save it to the given path (including filename).
    Validate that the downloaded image is a known image format, and that it matches file extension
    in the given path.
    """
    if not path.suffix:
        msg = "Path must be a path to a file, not a directory."
        raise RuntimeError(msg)

    try:
        response = requests.get(image_url, timeout=8)
        response.raise_for_status()
    except Exception as e:
        msg = f"Could not download image from '{image_url}': {e}"
        print(msg)  # noqa: T201, RUF100
        return

    content_type = response.headers.get("Content-Type")
    if content_type == "image/jpeg":
        assert path.suffix == ".jpg", f"Mismatching file extension '{path.suffix}' and content type '{content_type}'"

    elif content_type == "image/png":
        assert path.suffix == ".png", f"Mismatching file extension '{path.suffix}' and content type '{content_type}'"

    else:
        msg = f"Unknown content type: {content_type}"
        print(msg)  # noqa: T201, RUF100
        return

    path.parent.mkdir(parents=True, exist_ok=True)
    with Path(file=path).open(mode="wb") as handler:
        handler.write(response.content)
