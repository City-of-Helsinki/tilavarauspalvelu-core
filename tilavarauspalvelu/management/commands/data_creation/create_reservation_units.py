# ruff: noqa: S311

import random
import uuid
import zoneinfo
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from itertools import cycle

from tilavarauspalvelu.enums import (
    AuthenticationType,
    PriceUnit,
    ReservationKind,
    ReservationStartInterval,
    TermsOfUseTypeChoices,
)
from tilavarauspalvelu.models import (
    Equipment,
    OriginHaukiResource,
    Purpose,
    Qualifier,
    ReservableTimeSpan,
    ReservationMetadataSet,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitPaymentType,
    ReservationUnitPricing,
    ReservationUnitType,
    Resource,
    Service,
    TaxPercentage,
    TermsOfUse,
    Unit,
)

from .create_seasonal_booking import _create_application_round_time_slots
from .utils import (
    Paragraphs,
    SetName,
    faker_en,
    faker_fi,
    faker_sv,
    get_paragraphs,
    random_subset,
    weighted_choice,
    with_logs,
)


@with_logs()
def _create_reservation_units(
    units: list[Unit],
    reservation_unit_types: list[ReservationUnitType],
    terms_of_use: dict[str, TermsOfUse],
    cancellation_rules: list[ReservationUnitCancellationRule],
    metadata_sets: dict[SetName, ReservationMetadataSet],
    equipments: list[Equipment],
    purposes: list[Purpose],
    qualifiers: list[Qualifier],
    resources: list[Resource],
    services: list[Service],
    hauki_resources: list[OriginHaukiResource],
) -> list[ReservationUnit]:
    reservation_unit_types_loop = cycle(reservation_unit_types)
    cancellation_rules_loop = cycle(cancellation_rules)
    metadata_set_loop = cycle(metadata_sets.items())

    hauki_ids = {
        # Oodin nuorisotila - Oodin nuorisotila
        0: "15cf9b75-30f4-4f8e-9c0e-32dc126bf640",
        # Arabian nuorisotalo - Sali
        1: "861de2ef-5524-416d-9845-6c7a85ff181d",
        # Ungdomsgården Sandels - Bändihuone
        2: "333c8668-faf1-4754-bb53-e1c6c46cedc9",
    }

    reservation_units: list[ReservationUnit] = []
    for i, unit in enumerate(units):
        description = get_paragraphs()
        terms = get_paragraphs()
        pending = get_paragraphs()
        confirmed = get_paragraphs()
        cancelled = get_paragraphs()

        min_duration = random.randint(1, 4)
        max_duration = random.randint(min_duration + 1, 8)

        min_persons = random.randint(1, 40)
        max_persons = random.randint(min_persons + 1, 100)

        min_before = weighted_choice(list(range(10)), weights=[10, 5] + [1] * 8)
        max_before = random.randint(min_before + 1, 90)

        hauki_id = hauki_ids.get(i, str(uuid.uuid4()))

        can_apply_free_of_charge = weighted_choice([True, False], weights=[1, 10])
        if can_apply_free_of_charge:
            set_name: SetName = random.choice(SetName.applying_free_of_charge())
            metadata_set = metadata_sets[set_name]
        else:
            set_name, metadata_set = next(metadata_set_loop)
            while set_name.for_applying_free_of_charge:
                set_name, metadata_set = next(metadata_set_loop)

        reservation_kind = weighted_choice(ReservationKind.values, weights=[1, 1, 10])

        name = f"Reservation Unit {i}"
        if reservation_kind == ReservationKind.SEASON:
            name += ", vain kausivarattava"
        if unit.spaces.first().parent is not None:
            name += ", alitila"
        if unit.spaces.first().children.exists():
            name += ", ylitila"

        reservation_unit = ReservationUnit(
            allow_reservations_without_opening_hours=True,
            authentication=weighted_choice(AuthenticationType.values, weights=[2, 1]),
            can_apply_free_of_charge=can_apply_free_of_charge,
            cancellation_rule=next(cancellation_rules_loop),
            cancellation_terms=terms_of_use[TermsOfUseTypeChoices.CANCELLATION.value],
            contact_information=faker_fi.text(),
            description=description.fi,
            description_en=description.en,
            description_fi=description.fi,
            description_sv=description.sv,
            max_persons=max_persons,
            max_reservation_duration=timedelta(hours=max_duration),
            max_reservations_per_user=weighted_choice(
                [None, 2, 5, 10],
                weights=[10, 1, 1, 1],
            ),
            metadata_set=metadata_set,
            min_persons=min_persons,
            min_reservation_duration=timedelta(hours=min_duration),
            name=name,
            name_en=f"{name} EN",
            name_fi=f"{name} FI",
            name_sv=f"{name} SV",
            origin_hauki_resource=random.choice(hauki_resources),
            payment_terms=terms_of_use[TermsOfUseTypeChoices.PAYMENT.value],
            pricing_terms=terms_of_use[TermsOfUseTypeChoices.PRICING.value],
            rank=i,
            reservation_begins=datetime(2021, 1, 1, tzinfo=UTC),
            reservation_cancelled_instructions=cancelled.fi,
            reservation_cancelled_instructions_en=cancelled.en,
            reservation_cancelled_instructions_fi=cancelled.fi,
            reservation_cancelled_instructions_sv=cancelled.sv,
            reservation_confirmed_instructions=confirmed.fi,
            reservation_confirmed_instructions_en=confirmed.en,
            reservation_confirmed_instructions_fi=confirmed.fi,
            reservation_confirmed_instructions_sv=confirmed.sv,
            reservation_kind=reservation_kind,
            reservation_pending_instructions=pending.fi,
            reservation_pending_instructions_en=pending.en,
            reservation_pending_instructions_fi=pending.fi,
            reservation_pending_instructions_sv=pending.sv,
            reservation_start_interval=random.choice(ReservationStartInterval.values),
            reservation_unit_type=next(reservation_unit_types_loop),
            reservations_max_days_before=max_before,
            reservations_min_days_before=min_before,
            service_specific_terms=terms_of_use[TermsOfUseTypeChoices.SERVICE.value],
            surface_area=random.randint(10, 1000),
            terms_of_use=terms.fi,
            terms_of_use_en=terms.en,
            terms_of_use_fi=terms.fi,
            terms_of_use_sv=terms.sv,
            unit=unit,
            uuid=hauki_id,
        )
        reservation_units.append(reservation_unit)

    reservation_units = ReservationUnit.objects.bulk_create(reservation_units)

    payment_types = _create_reservation_payment_types()

    is_empty_created: bool = False
    for reservation_unit in reservation_units:
        reservation_unit.equipments.add(*random_subset(equipments))
        reservation_unit.purposes.add(*random_subset(purposes))
        reservation_unit.qualifiers.add(*random_subset(qualifiers))
        reservation_unit.services.add(*random_subset(services))
        reservation_unit.payment_types.add(*random_subset(payment_types))

        if not is_empty_created:
            reservation_unit.name = f"Empty {reservation_unit.name}"
            reservation_unit.name_fi = reservation_unit.name
            reservation_unit.name_en = f"Empty {reservation_unit.name_en}"
            reservation_unit.name_sv = f"Empty {reservation_unit.name_sv}"
            is_empty_created = True
            continue

        reservation_unit.resources.add(*random_subset(resources))
        reservation_unit.spaces.add(*list(reservation_unit.unit.spaces.all()))

    _create_application_round_time_slots(reservation_units)

    return reservation_units


@with_logs()
def _create_reservation_unit_types(*, number: int = 3) -> list[ReservationUnitType]:
    reservation_unit_types: list[ReservationUnitType] = []
    for i in range(number):
        reservation_unit_type = ReservationUnitType(
            name=f"Reservation Unit Type {i}",
            name_fi=f"Reservation Unit Type {i}",
            name_sv=f"Reservation Unit Type {i}",
            name_en=f"Reservation Unit Type {i}",
            rank=i,
        )
        reservation_unit_types.append(reservation_unit_type)

    return ReservationUnitType.objects.bulk_create(reservation_unit_types)


@with_logs()
def _create_reservation_payment_types() -> list[ReservationUnitPaymentType]:
    payment_types: list[ReservationUnitPaymentType] = []
    codes = ["ONLINE", "INVOICE", "ON_SITE"]
    for code in codes:
        # Creation is done one-by-one since 'code' is a primary key
        # and 'bulk_create' doesn't support 'update_conflicts' with primary keys:
        # https://docs.djangoproject.com/en/4.2/ref/models/querysets/#bulk-create
        payment_type, _ = ReservationUnitPaymentType.objects.get_or_create(code=code)
        payment_types.append(payment_type)

    return payment_types


@with_logs()
def _create_pricings(reservation_units: list[ReservationUnit]) -> list[ReservationUnitPricing]:
    tax_percentages: dict[int, TaxPercentage] = {int(tax.value): tax for tax in _create_tax_percentages()}
    zero_tax: TaxPercentage = tax_percentages.pop(0)

    pricing_options: list[int] = [0, 10, 49, 77]

    pricings: list[ReservationUnitPricing] = []
    for reservation_unit in reservation_units:
        highest_price = weighted_choice(pricing_options, weights=[5, 1, 1, 3])
        tax = zero_tax if highest_price == 0 else random.choice(list(tax_percentages.values()))

        lowest_price: int = 0
        if highest_price > 0:
            lowest_price = random.randint(1, highest_price - 1)

        pricing = ReservationUnitPricing(
            begins=date(2021, 1, 1),
            price_unit=random.choice(PriceUnit.values),
            lowest_price=lowest_price,
            highest_price=highest_price,
            reservation_unit=reservation_unit,
            tax_percentage=tax,
        )
        pricings.append(pricing)
        addendum = "maksuton" if highest_price == 0 else "maksullinen"

        reservation_unit.name = f"{reservation_unit.name}, {addendum}"
        reservation_unit.name_fi = reservation_unit.name
        reservation_unit.name_en = f"{reservation_unit.name_en}, {addendum}"
        reservation_unit.name_sv = f"{reservation_unit.name_sv}, {addendum}"

    ReservationUnit.objects.bulk_update(reservation_units, fields=["name", "name_fi", "name_en", "name_sv"])
    return ReservationUnitPricing.objects.bulk_create(pricings)


@with_logs()
def _create_tax_percentages() -> list[TaxPercentage]:
    tax_percentages: list[TaxPercentage] = []
    percentages = (0, 10, 14, 24, Decimal("25.5"))
    for percentage in percentages:
        # Creation is done one-by-one since 'value' is a not defined as unique
        # and 'bulk_create' doesn't support 'update_conflicts' without a unique constraint:
        # https://docs.djangoproject.com/en/4.2/ref/models/querysets/#bulk-create
        tax_percentage, _ = TaxPercentage.objects.get_or_create(value=percentage)
        tax_percentages.append(tax_percentage)

    return tax_percentages


@with_logs()
def _create_hauki_resources() -> list[OriginHaukiResource]:
    hauki_resources: list[OriginHaukiResource] = []
    time_options: list[list[dict[str, str]]] = [
        [
            {
                "start_time": "09:00:00",
                "end_time": "11:00:00",
            },
            {
                "start_time": "12:00:00",
                "end_time": "20:00:00",
            },
        ],
        [
            {
                "overnight": True,
                "start_time": "19:00:00",
                "end_time": "08:00:00",
            },
        ],
        [
            {
                "full_day": True,
            },
        ],
        [
            {
                "start_time": "10:00:00",
                "end_time": "20:00:00",
            },
        ],
    ]

    for i in range(len(time_options)):
        hauki_resource = OriginHaukiResource(
            id=i,
            opening_hours_hash="",
            latest_fetched_date=None,
        )
        hauki_resources.append(hauki_resource)

    hauki_resources = OriginHaukiResource.objects.bulk_create(hauki_resources)

    local_timezone = zoneinfo.ZoneInfo("Europe/Helsinki")
    today = datetime.now(tz=local_timezone).date()

    timespans: list[ReservableTimeSpan] = []
    for i, hauki_resource in enumerate(hauki_resources):
        for option in time_options[i]:
            if option.get("full_day"):
                timespans.append(
                    ReservableTimeSpan(
                        resource=hauki_resource,
                        start_datetime=datetime.combine(
                            date=today,
                            time=time.fromisoformat("00:00:00"),
                            tzinfo=local_timezone,
                        ),
                        end_datetime=datetime.combine(
                            date=today + timedelta(days=721),
                            time=time.fromisoformat("00:00:00"),
                            tzinfo=local_timezone,
                        ),
                    ),
                )
                continue

            timespans += [
                ReservableTimeSpan(
                    resource=hauki_resource,
                    start_datetime=datetime.combine(
                        date=today + timedelta(days=day),
                        time=time.fromisoformat(option["start_time"]),
                        tzinfo=local_timezone,
                    ),
                    end_datetime=datetime.combine(
                        date=today + timedelta(days=day + (1 if option.get("overnight") else 0)),
                        time=time.fromisoformat(option["end_time"]),
                        tzinfo=local_timezone,
                    ),
                )
                for day in range(721)
            ]

    ReservableTimeSpan.objects.bulk_create(timespans)
    return hauki_resources


@with_logs()
def _create_terms_of_use() -> dict[str, TermsOfUse]:
    #
    # Create general terms
    #
    generic_terms = ["accessibility", "booking", "privacy", "service"]
    term_names = [
        Paragraphs(fi="Saavutettavuusseloste", en="Accessibility Statement", sv="Tillgänglighet"),
        Paragraphs(fi="Yleiset sopimusehdot", en="General Terms and Conditions", sv="Allmänna villkor"),
        Paragraphs(fi="Tietosuojaseloste", en="Privacy Statement", sv="Dataskyddspolicy"),
        Paragraphs(fi="Palvelun yleiset käyttöehdot", en="General Terms of Service", sv="Allmänna användarvillkor"),
    ]

    for term_id, names in zip(generic_terms, term_names, strict=True):
        text_fi = faker_fi.text()
        text_sv = faker_sv.text()
        text_en = faker_en.text()

        TermsOfUse.objects.create(
            id=term_id,
            name=names.fi,
            name_fi=names.fi,
            name_sv=names.en,
            name_en=names.sv,
            text=text_fi,
            text_fi=text_fi,
            text_sv=text_sv,
            text_en=text_en,
            terms_type=TermsOfUseTypeChoices.GENERIC,
        )

    #
    # Create other kinds of terms
    #
    terms_of_use: list[TermsOfUse] = []
    term_types: list[str] = [
        TermsOfUseTypeChoices.PAYMENT.value,
        TermsOfUseTypeChoices.CANCELLATION.value,
        TermsOfUseTypeChoices.RECURRING.value,
        TermsOfUseTypeChoices.SERVICE.value,
        TermsOfUseTypeChoices.PRICING.value,
    ]
    for term_type in term_types:
        name = term_type.replace("_", " ").title()

        text_fi = faker_fi.text()
        text_sv = faker_sv.text()
        text_en = faker_en.text()

        terms = TermsOfUse(
            id=f"{term_type}_1",
            name=name,
            name_fi=name,
            name_sv=name,
            name_en=name,
            text=text_fi,
            text_fi=text_fi,
            text_sv=text_sv,
            text_en=text_en,
            terms_type=term_type,
        )
        terms_of_use.append(terms)

    return {term.terms_type: term for term in TermsOfUse.objects.bulk_create(terms_of_use)}


@with_logs()
def _create_cancellation_rules(*, number: int = 1) -> list[ReservationUnitCancellationRule]:
    cancellation_rules: list[ReservationUnitCancellationRule] = []
    for i in range(number):
        cancellation_rule = ReservationUnitCancellationRule(
            name=f"Cancellation Rule {i}",
            name_fi=f"Cancellation Rule {i}",
            name_sv=f"Cancellation Rule {i}",
            name_en=f"Cancellation Rule {i}",
            can_be_cancelled_time_before=timedelta(days=i),
        )
        cancellation_rules.append(cancellation_rule)

    return ReservationUnitCancellationRule.objects.bulk_create(cancellation_rules)
