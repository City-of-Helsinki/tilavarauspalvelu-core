# NOTE: Do not use factories here. factory-boy is not installed on the test environment.

from __future__ import annotations

import datetime
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.contrib.gis.geos import Point
from django.db import transaction
from django.db.models import Subquery
from django.utils import translation

from tilavarauspalvelu.enums import (
    AccessType,
    ApplicationFormType,
    AuthenticationType,
    MunicipalityChoice,
    PaymentType,
    PriceComponentKind,
    PriceUnit,
    Priority,
    ReservationFormType,
    ReservationKind,
    ReservationStartInterval,
    ReservationStateChoice,
    ReservationTypeChoice,
    ReserveeType,
    ResourceLocationType,
    TermsOfUseTypeChoices,
    Weekday,
)
from tilavarauspalvelu.management.commands.data_creation.create_pricing_groups import OwnPrice, create_own_prices
from tilavarauspalvelu.management.commands.data_creation.utils import turn_off_signal_updates
from tilavarauspalvelu.models import (
    AffectingTimeSpan,
    AgeGroup,
    AllocatedTimeSlot,
    Application,
    ApplicationRound,
    ApplicationRoundTimeSlot,
    ApplicationSection,
    Equipment,
    EquipmentCategory,
    IntendedUse,
    PriceComponent,
    PriceOption,
    PricingGroup,
    Reservation,
    ReservationPurpose,
    ReservationSeries,
    ReservationUnit,
    ReservationUnitAccessType,
    ReservationUnitCancellationRule,
    ReservationUnitHierarchy,
    ReservationUnitOption,
    ReservationUnitPricingGroup,
    ReservationUnitType,
    Resource,
    Space,
    SuitableTimeRange,
    TaxLevel,
    TaxLevelRate,
    TermsOfUse,
    Unit,
    UnitGroup,
    User,
)
from tilavarauspalvelu.typing import TimeSlotDB
from utils.date_utils import (
    local_add_days,
    local_combine,
    local_date,
    local_date_of,
    local_datetime,
    next_date_matching_weekday,
)

# Each round's unit has the same name as the round. So does the unit group of each paid round.
MANUAL_TEST_OPEN_ROUND_NAME = "Kausivaraus manuaalitestaukseen (AVOINNA)"
MANUAL_TEST_ROUND_IN_ALLOCATION_NAME = "Kausivaraus manuaalitestaukseen (KÄSITTELYSSÄ)"
MANUAL_TEST_OPEN_PAID_ROUND_NAME = "Kausivaraus manuaalitestaukseen (MAKSULLINEN, AVOINNA)"
MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME = "Kausivaraus manuaalitestaukseen (MAKSULLINEN, KÄSITTELYSSÄ)"


@transaction.atomic()
def create_open_manual_test_round() -> ApplicationRound:
    """
    Delete the open manual test round with all its data, and make it again without applications.
    Its unit stays.
    """
    # Lookups by 'name' use the active language, and the caller can run in any language.
    with translation.override("fi"), turn_off_signal_updates():
        _remove_manual_test_round(name=MANUAL_TEST_OPEN_ROUND_NAME)
        application_round = _make_open_manual_test_round()

    # The updates that the signals did not run. Each space is a tree of its own, so the trees need no rebuild.
    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    reservation_units = ReservationUnit.objects.filter(unit__name_fi=MANUAL_TEST_OPEN_ROUND_NAME)
    reservation_units.update_search_vectors()

    return application_round


@transaction.atomic()
def remove_open_manual_test_round() -> None:
    """Delete the open manual test round with its applications, reservation units and unit."""
    with turn_off_signal_updates():
        _remove_manual_test_round(name=MANUAL_TEST_OPEN_ROUND_NAME)
        Unit.objects.filter(name_fi=MANUAL_TEST_OPEN_ROUND_NAME).delete()

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()


@transaction.atomic()
def create_manual_test_round_in_allocation() -> ApplicationRound:
    """
    Delete the manual test round in allocation with all its data, including the reservations made from its
    allocations, and make it again with its three sent applications. Its unit and applicants stay.
    """
    with translation.override("fi"), turn_off_signal_updates():
        _remove_manual_test_round(name=MANUAL_TEST_ROUND_IN_ALLOCATION_NAME)
        application_round = _make_manual_test_round_in_allocation()

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    reservation_units = ReservationUnit.objects.filter(unit__name_fi=MANUAL_TEST_ROUND_IN_ALLOCATION_NAME)
    reservation_units.update_search_vectors()

    return application_round


@transaction.atomic()
def remove_manual_test_round_in_allocation() -> None:
    """
    Delete the manual test round in allocation with its applications, reservations, reservation units and unit.
    Its applicants stay.
    """
    with turn_off_signal_updates():
        _remove_manual_test_round(name=MANUAL_TEST_ROUND_IN_ALLOCATION_NAME)
        Unit.objects.filter(name_fi=MANUAL_TEST_ROUND_IN_ALLOCATION_NAME).delete()

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()


@transaction.atomic()
def create_open_paid_manual_test_round() -> ApplicationRound:
    """
    Delete the open paid manual test round with all its data, and make it again without applications.
    Its unit and unit group stay.
    """
    with translation.override("fi"), turn_off_signal_updates():
        _remove_manual_test_round(name=MANUAL_TEST_OPEN_PAID_ROUND_NAME)
        application_round = _make_open_paid_manual_test_round()

    # The updates that the signals did not run. The halves of the hall are spaces inside it,
    # so the space trees are rebuilt too.
    Space.objects.rebuild()
    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    reservation_units = ReservationUnit.objects.filter(unit__name_fi=MANUAL_TEST_OPEN_PAID_ROUND_NAME)
    reservation_units.update_search_vectors()

    return application_round


@transaction.atomic()
def remove_open_paid_manual_test_round() -> None:
    """Delete the open paid manual test round with its applications, reservation units, unit and unit group."""
    with turn_off_signal_updates():
        _remove_manual_test_round(name=MANUAL_TEST_OPEN_PAID_ROUND_NAME)
        Unit.objects.filter(name_fi=MANUAL_TEST_OPEN_PAID_ROUND_NAME).delete()
        UnitGroup.objects.filter(name_fi=MANUAL_TEST_OPEN_PAID_ROUND_NAME).delete()

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()


@transaction.atomic()
def create_paid_manual_test_round_in_allocation() -> ApplicationRound:
    """
    Delete the paid manual test round in allocation with all its data, including the reservations made from its
    allocations, and make it again with its three sent applications and two closed times.
    Its unit, unit group, applicants and handler stay.
    """
    with translation.override("fi"), turn_off_signal_updates():
        _remove_manual_test_round(name=MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME)
        application_round = _make_paid_manual_test_round_in_allocation()

    Space.objects.rebuild()
    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    reservation_units = ReservationUnit.objects.filter(unit__name_fi=MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME)
    reservation_units.update_search_vectors()

    return application_round


@transaction.atomic()
def remove_paid_manual_test_round_in_allocation() -> None:
    """
    Delete the paid manual test round in allocation with its applications, reservations, reservation units,
    unit and unit group. Its applicants and handler stay.
    """
    with turn_off_signal_updates():
        _remove_manual_test_round(name=MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME)
        Unit.objects.filter(name_fi=MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME).delete()
        UnitGroup.objects.filter(name_fi=MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME).delete()

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()


# Internals


def _remove_manual_test_round(*, name: str) -> None:
    reservation_units = ReservationUnit.objects.filter(unit__name_fi=name)
    reservation_unit_id_values = reservation_units.values("id")
    reservation_unit_ids = Subquery(reservation_unit_id_values)

    application_round = ApplicationRound.objects.filter(name_fi=name)
    resources = Resource.objects.filter(space__unit__name_fi=name)
    spaces = Space.objects.filter(unit__name_fi=name)
    reservations = Reservation.objects.filter(reservation_unit__in=reservation_unit_ids)
    series = ReservationSeries.objects.filter(reservation_unit__in=reservation_unit_ids)
    allocations = AllocatedTimeSlot.objects.filter(reservation_unit_option__reservation_unit__in=reservation_unit_ids)
    options = ReservationUnitOption.objects.filter(reservation_unit__in=reservation_unit_ids)
    applications = Application.objects.filter(application_round__name_fi=name)

    own_pricing_groups = PricingGroup.objects.filter(
        unit_group__isnull=True,
        reservation_unit_pricing_groups__reservation_unit__in=reservation_unit_ids,
    )
    own_pricing_group_ids = list(own_pricing_groups.values_list("id", flat=True))

    # A paid round's pricing groups and customer groups belong to its unit group.
    unit_group_pricing_groups = PricingGroup.objects.filter(unit_group__name_fi=name)
    price_options = PriceOption.objects.filter(unit_group__name_fi=name)

    # The resources are found through their space, so they are deleted before the spaces.
    resources.delete()
    spaces.delete()
    reservations.delete()
    series.delete()
    allocations.delete()
    options.delete()
    applications.delete()
    application_round.delete()
    reservation_units.delete()
    PricingGroup.objects.filter(id__in=own_pricing_group_ids).delete()
    unit_group_pricing_groups.delete()
    price_options.delete()


def _make_open_manual_test_round() -> ApplicationRound:
    now = local_datetime()
    today = local_date_of(now)

    # ------------------------------------------------------------------------------------------------------------
    # Fetch existing objects
    # ------------------------------------------------------------------------------------------------------------

    kokoustila, _ = ReservationUnitType.objects.get_or_create(
        name="Kokoustila",
        defaults={
            "name_fi": "Kokoustila",
            "name_en": "Meeting room",
            "name_sv": "Möteslokal",
        },
    )
    peruutus_alkuun_asti, _ = ReservationUnitCancellationRule.objects.get_or_create(
        name="Varauksen alkuun asti",
        defaults={
            "name_fi": "Varauksen alkuun asti",
            "name_en": "Varauksen alkuun asti",
            "name_sv": "Varauksen alkuun asti",
            "can_be_cancelled_time_before": datetime.timedelta(seconds=1),
        },
    )
    nupa_kausivarausehto, _ = TermsOfUse.objects.get_or_create(
        id="KUVAnupa",
        defaults={
            "name_fi": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "name_en": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "name_sv": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "text_fi": "",
            "text_en": "",
            "text_sv": "",
            "terms_type": TermsOfUseTypeChoices.RECURRING,
        },
    )

    harrasta_yhdessa_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Harrasta yhdessä",
        defaults={
            "name_fi": "Harrasta yhdessä",
            "name_en": "Engage in hobbies together",
            "name_sv": "Utöva hobbyer tillsammans",
        },
    )
    kayta_laitteita_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Käytä laitteita",
        defaults={
            "name_fi": "Käytä laitteita",
            "name_en": "Use equipment",
            "name_sv": "Använd utrustning",
        },
    )
    liiku_ja_rentoudu_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Liiku ja rentoudu",
        defaults={
            "name_fi": "Liiku ja rentoudu",
            "name_en": "Exercise and relax",
            "name_sv": "Motionera och koppla av",
        },
    )
    pida_kokous_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Pidä kokous",
        defaults={
            "name_fi": "Pidä kokous",
            "name_en": "Hold a meeting",
            "name_sv": "Håll möte",
        },
    )
    tee_musiikkia_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Tee musiikkia tai äänitä",
        defaults={
            "name_fi": "Tee musiikkia tai äänitä",
            "name_en": "Make music or record",
            "name_sv": "Gör musik eller spela in",
        },
    )
    yksin_tai_ryhma_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Työskentele yksin tai ryhmässä",
        defaults={
            "name_fi": "Työskentele yksin tai ryhmässä",
            "name_en": "Work alone or in a group",
            "name_sv": "Arbeta enskilt eller i grupp",
        },
    )

    kaluesteet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Kalusteet",
        defaults={
            "name_fi": "Kalusteet",
            "name_en": "",
            "name_sv": "",
        },
    )
    soittimet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Soittimet",
        defaults={
            "name_fi": "Soittimet",
            "name_en": "",
            "name_sv": "",
        },
    )
    istumapaikka_laite, _ = Equipment.objects.get_or_create(
        name="Istumapaikkoja",
        defaults={
            "name_fi": "Istumapaikkoja",
            "name_en": "Seats",
            "name_sv": "Sittplatser",
            "category": kaluesteet_category,
        },
    )
    piano_laite, _ = Equipment.objects.get_or_create(
        name="Piano",
        defaults={
            "name_fi": "Piano",
            "name_en": "Piano",
            "name_sv": "Piano",
            "category": soittimet_category,
        },
    )
    rummut_laite, _ = Equipment.objects.get_or_create(
        name="Sähkörummut",
        defaults={
            "name_fi": "Sähkörummut",
            "name_en": "Electric drums",
            "name_sv": "e-trummor",
            "category": soittimet_category,
        },
    )

    veroton_verotaso, _ = TaxLevel.objects.get_or_create(
        name="Veroton",
        defaults={
            "name_fi": "Veroton",
            "name_en": "Tax free",
            "name_sv": "Skattefri",
        },
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=veroton_verotaso,
        begins=local_date(2000, 1, 1),
        defaults={"percentage": Decimal("0.0"), "vat_code": "4U"},
    )

    harrastustoiminta_muu, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, muu",
        defaults={
            "name_fi": "Harrastustoiminta, muu",
            "name_en": "Hobby or leisure activities, other",
            "name_sv": "Hobby, annat",
        },
    )
    harrastustoiminta_liikunta, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, tanssi ja liikunta",
        defaults={
            "name_fi": "Harrastustoiminta, tanssi ja liikunta",
            "name_en": "Hobby / leisure activities, dance or sports",
            "name_sv": "Hobby, dans eller träning",
        },
    )
    harrastustoiminta_musiikki, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, bändi ja musiikki",
        defaults={
            "name_fi": "Harrastustoiminta, bändi ja musiikki",
            "name_en": "Hobby or leisure activities, band activities or music",
            "name_sv": "Hobby, band eller musik",
        },
    )

    # ------------------------------------------------------------------------------------------------------------
    # Unit
    # ------------------------------------------------------------------------------------------------------------

    # A reset keeps the unit, so the unit roles and unit groups that include it don't lose it.
    # No TPREK id, so that the nightly TPREK update leaves it alone. The address is Harakka's.
    unit, _ = Unit.objects.update_or_create(
        name=MANUAL_TEST_OPEN_ROUND_NAME,
        defaults={
            "description": "Kausivarausten manuaalitestaukseen. Haku auki ja hakemuksia voi tehdä",
            "tprek_id": None,
            "tprek_department_id": None,
            "address_street": "Harakka",
            "address_zip": "00140",
            "address_city": "Helsinki",
            "allow_permissions_from_ad_groups": False,
            "coordinates": Point(x=2778530.371378948912024, y=8433140.38941946811974),
            "origin_hauki_resource": None,
            "payment_merchant": None,
            "payment_accounting": None,
        },
    )

    # ------------------------------------------------------------------------------------------------------------
    # Reservation units
    # ------------------------------------------------------------------------------------------------------------

    liikuntasali = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="2b86ba30-3604-4f88-b6da-150805520272",
        #
        # Strings
        name="KAUSIVARAUS yksikkö Liikuntasali (MANUAALITESTAUS)",
        name_en="KAUSIVARAUS yksikkö Liikuntasali (MANUAALITESTAUS) EN",
        name_sv="KAUSIVARAUS yksikkö Liikuntasali (MANUAALITESTAUS) SV",
        description="Varattavissa joka päivä klo 9-21.",
        description_en="Varattavissa joka päivä klo 9-21. EN",
        description_sv="Varattavissa joka päivä klo 9-21. SV",
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=50,
        min_persons=1,
        max_persons=60,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=None,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    liikuntasali_space = Space.objects.create(
        name="KAUSIVARAUS yksikkö Liikuntasali (MANUAALITESTAUS)",
        name_en="KAUSIVARAUS yksikkö Liikuntasali (MANUAALITESTAUS) EN",
        name_sv="KAUSIVARAUS yksikkö Liikuntasali (MANUAALITESTAUS) SV",
        surface_area=100,
        max_persons=60,
        unit=unit,
    )
    liikuntasali.spaces.set([
        liikuntasali_space,
    ])
    liikuntasali.intended_uses.set([
        liiku_ja_rentoudu_tarkoitus,
        harrasta_yhdessa_tarkoitus,
    ])
    liikuntasali.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    create_own_prices([
        OwnPrice(
            reservation_unit=liikuntasali,
            begins=local_date(2025, 6, 12),
            price_unit=PriceUnit.PER_HOUR,
            amount=Decimal(0),
            tax_level=veroton_verotaso,
            can_apply_for_discount=False,
        ),
    ])
    ReservationUnitAccessType.objects.create(
        reservation_unit=liikuntasali,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    kerhohuone = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="b8b7dbb7-47b5-4705-a10d-9adb2d79af2f",
        #
        # Strings
        name="KAUSIVARAUS yksikkö Kerhohuone (MANUAALITESTAUS)",
        name_en="KAUSIVARAUS yksikkö Kerhohuone (MANUAALITESTAUS) EN",
        name_sv="KAUSIVARAUS yksikkö Kerhohuone (MANUAALITESTAUS) SV",
        description="Varattavissa ma-pe klo 8-12 ja 13-20. Suljettu la-su.",
        description_en="Varattavissa ma-pe klo 8-12 ja 13-20. Suljettu la-su. EN",
        description_sv="Varattavissa ma-pe klo 8-12 ja 13-20. Suljettu la-su. SV",
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=50,
        min_persons=1,
        max_persons=15,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=None,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    kerhohuone_space = Space.objects.create(
        name="KAUSIVARAUS yksikkö Kerhohuone (MANUAALITESTAUS)",
        name_en="KAUSIVARAUS yksikkö Kerhohuone (MANUAALITESTAUS) EN",
        name_sv="KAUSIVARAUS yksikkö Kerhohuone (MANUAALITESTAUS) SV",
        surface_area=100,
        max_persons=15,
        unit=unit,
    )
    kerhohuone.spaces.set([
        kerhohuone_space,
    ])
    kerhohuone.intended_uses.set([
        pida_kokous_tarkoitus,
        yksin_tai_ryhma_tarkoitus,
    ])
    kerhohuone.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    create_own_prices([
        OwnPrice(
            reservation_unit=kerhohuone,
            begins=local_date(2025, 6, 12),
            price_unit=PriceUnit.PER_HOUR,
            amount=Decimal(0),
            tax_level=veroton_verotaso,
            can_apply_for_discount=False,
        ),
    ])
    ReservationUnitAccessType.objects.create(
        reservation_unit=kerhohuone,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    banditila = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="a6752e5f-3593-4f51-a9e2-21f2b909dcef",
        #
        # Strings
        name="KAUSIVARAUS yksikkö Bänditila (MANUAALITESTAUS)",
        name_en="KAUSIVARAUS yksikkö Bänditila (MANUAALITESTAUS) EN",
        name_sv="KAUSIVARAUS yksikkö Bänditila (MANUAALITESTAUS) SV",
        description=(
            "Varattavissa ma klo 16.30-21.30, ke 17.30-22, to 7-9.30 ja 16-20, pe 15.30-23, "
            "la 10-13.30 ja 15-18 sekä su 12-16. Suljettu ti."
        ),
        description_en=(
            "Varattavissa ma klo 16.30-21.30, ke 17.30-22, to 7-9.30 ja 16-20, pe 15.30-23, "
            "la 10-13.30 ja 15-18 sekä su 12-16. Suljettu ti. EN"
        ),
        description_sv=(
            "Varattavissa ma klo 16.30-21.30, ke 17.30-22, to 7-9.30 ja 16-20, pe 15.30-23, "
            "la 10-13.30 ja 15-18 sekä su 12-16. Suljettu ti. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=50,
        min_persons=1,
        max_persons=6,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=None,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    banditila_space = Space.objects.create(
        name="KAUSIVARAUS yksikkö Bänditila (MANUAALITESTAUS)",
        name_en="KAUSIVARAUS yksikkö Bänditila (MANUAALITESTAUS) EN",
        name_sv="KAUSIVARAUS yksikkö Bänditila (MANUAALITESTAUS) SV",
        surface_area=100,
        max_persons=6,
        unit=unit,
    )
    banditila.spaces.set([
        banditila_space,
    ])
    banditila.intended_uses.set([
        tee_musiikkia_tarkoitus,
        kayta_laitteita_tarkoitus,
    ])
    banditila.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    create_own_prices([
        OwnPrice(
            reservation_unit=banditila,
            begins=local_date(2025, 6, 12),
            price_unit=PriceUnit.PER_HOUR,
            amount=Decimal(0),
            tax_level=veroton_verotaso,
            can_apply_for_discount=False,
        ),
    ])
    ReservationUnitAccessType.objects.create(
        reservation_unit=banditila,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    # ------------------------------------------------------------------------------------------------------------
    # Reservable times of the reservation units in application rounds
    # ------------------------------------------------------------------------------------------------------------

    liikuntasali_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=liikuntasali,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="09:00:00", end="21:00:00")],
        )
        for weekday in Weekday  # type: ignore[attr-defined]
    ]
    kerhohuone_weekday_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=kerhohuone,
            weekday=weekday,
            is_closed=False,
            reservable_times=[
                TimeSlotDB(begin="08:00:00", end="12:00:00"),
                TimeSlotDB(begin="13:00:00", end="20:00:00"),
            ],
        )
        for weekday in [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY]
    ]
    ApplicationRoundTimeSlot.objects.bulk_create([
        *liikuntasali_time_slots,
        *kerhohuone_weekday_time_slots,
        ApplicationRoundTimeSlot(
            reservation_unit=kerhohuone,
            weekday=Weekday.SATURDAY,
            is_closed=True,
            reservable_times=[],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=kerhohuone,
            weekday=Weekday.SUNDAY,
            is_closed=True,
            reservable_times=[],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.MONDAY,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="16:30:00", end="21:30:00")],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.TUESDAY,
            is_closed=True,
            reservable_times=[],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.WEDNESDAY,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="17:30:00", end="22:00:00")],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.THURSDAY,
            is_closed=False,
            reservable_times=[
                TimeSlotDB(begin="07:00:00", end="09:30:00"),
                TimeSlotDB(begin="16:00:00", end="20:00:00"),
            ],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.FRIDAY,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="15:30:00", end="23:00:00")],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.SATURDAY,
            is_closed=False,
            reservable_times=[
                TimeSlotDB(begin="10:00:00", end="13:30:00"),
                TimeSlotDB(begin="15:00:00", end="18:00:00"),
            ],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.SUNDAY,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="12:00:00", end="16:00:00")],
        ),
    ])

    # ------------------------------------------------------------------------------------------------------------
    # Application round
    # ------------------------------------------------------------------------------------------------------------

    # Open for two years from the moment the data is made.
    application_round = ApplicationRound.objects.create(
        name=MANUAL_TEST_OPEN_ROUND_NAME,
        name_en=f"{MANUAL_TEST_OPEN_ROUND_NAME} EN",
        name_sv=f"{MANUAL_TEST_OPEN_ROUND_NAME} SV",
        criteria="Hakukriteerit (suomeksi)",
        criteria_en="Hakukriteerit (englanniksi)",
        criteria_sv="Hakukriteerit (ruotsiksi)",
        notes_when_applying="Huomioi hakiessa (Suomeksi)",
        notes_when_applying_en="Huomioi hakiessa (Englanniksi)",
        notes_when_applying_sv="Huomioi hakiessa (Ruotsiksi)",
        application_period_begins_at=local_add_days(now, days=-1),
        application_period_ends_at=local_add_days(now, days=730),
        reservation_period_begin_date=today + datetime.timedelta(days=731),
        reservation_period_end_date=today + datetime.timedelta(days=1826),
        public_display_begins_at=local_add_days(now, days=-1),
        public_display_ends_at=local_add_days(now, days=1827),
        handled_at=None,
        sent_at=None,
        application_form=ApplicationFormType.DEFAULT_FORM,
        terms_of_use=nupa_kausivarausehto,
    )
    application_round.purposes.set([
        harrastustoiminta_muu,
        harrastustoiminta_liikunta,
        harrastustoiminta_musiikki,
    ])
    application_round.reservation_units.set([
        liikuntasali,
        kerhohuone,
        banditila,
    ])

    return application_round


def _make_manual_test_round_in_allocation() -> ApplicationRound:
    now = local_datetime()
    today = local_date_of(now)

    # ------------------------------------------------------------------------------------------------------------
    # Fetch existing objects
    # ------------------------------------------------------------------------------------------------------------

    kokoustila, _ = ReservationUnitType.objects.get_or_create(
        name="Kokoustila",
        defaults={
            "name_fi": "Kokoustila",
            "name_en": "Meeting room",
            "name_sv": "Möteslokal",
        },
    )
    peruutus_alkuun_asti, _ = ReservationUnitCancellationRule.objects.get_or_create(
        name="Varauksen alkuun asti",
        defaults={
            "name_fi": "Varauksen alkuun asti",
            "name_en": "Varauksen alkuun asti",
            "name_sv": "Varauksen alkuun asti",
            "can_be_cancelled_time_before": datetime.timedelta(seconds=1),
        },
    )
    nupa_kausivarausehto, _ = TermsOfUse.objects.get_or_create(
        id="KUVAnupa",
        defaults={
            "name_fi": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "name_en": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "name_sv": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "text_fi": "",
            "text_en": "",
            "text_sv": "",
            "terms_type": TermsOfUseTypeChoices.RECURRING,
        },
    )

    harrasta_yhdessa_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Harrasta yhdessä",
        defaults={
            "name_fi": "Harrasta yhdessä",
            "name_en": "Engage in hobbies together",
            "name_sv": "Utöva hobbyer tillsammans",
        },
    )
    kayta_laitteita_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Käytä laitteita",
        defaults={
            "name_fi": "Käytä laitteita",
            "name_en": "Use equipment",
            "name_sv": "Använd utrustning",
        },
    )
    liiku_ja_rentoudu_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Liiku ja rentoudu",
        defaults={
            "name_fi": "Liiku ja rentoudu",
            "name_en": "Exercise and relax",
            "name_sv": "Motionera och koppla av",
        },
    )
    pida_kokous_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Pidä kokous",
        defaults={
            "name_fi": "Pidä kokous",
            "name_en": "Hold a meeting",
            "name_sv": "Håll möte",
        },
    )
    tee_musiikkia_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Tee musiikkia tai äänitä",
        defaults={
            "name_fi": "Tee musiikkia tai äänitä",
            "name_en": "Make music or record",
            "name_sv": "Gör musik eller spela in",
        },
    )
    yksin_tai_ryhma_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Työskentele yksin tai ryhmässä",
        defaults={
            "name_fi": "Työskentele yksin tai ryhmässä",
            "name_en": "Work alone or in a group",
            "name_sv": "Arbeta enskilt eller i grupp",
        },
    )

    kaluesteet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Kalusteet",
        defaults={
            "name_fi": "Kalusteet",
            "name_en": "",
            "name_sv": "",
        },
    )
    soittimet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Soittimet",
        defaults={
            "name_fi": "Soittimet",
            "name_en": "",
            "name_sv": "",
        },
    )
    istumapaikka_laite, _ = Equipment.objects.get_or_create(
        name="Istumapaikkoja",
        defaults={
            "name_fi": "Istumapaikkoja",
            "name_en": "Seats",
            "name_sv": "Sittplatser",
            "category": kaluesteet_category,
        },
    )
    piano_laite, _ = Equipment.objects.get_or_create(
        name="Piano",
        defaults={
            "name_fi": "Piano",
            "name_en": "Piano",
            "name_sv": "Piano",
            "category": soittimet_category,
        },
    )
    rummut_laite, _ = Equipment.objects.get_or_create(
        name="Sähkörummut",
        defaults={
            "name_fi": "Sähkörummut",
            "name_en": "Electric drums",
            "name_sv": "e-trummor",
            "category": soittimet_category,
        },
    )

    veroton_verotaso, _ = TaxLevel.objects.get_or_create(
        name="Veroton",
        defaults={
            "name_fi": "Veroton",
            "name_en": "Tax free",
            "name_sv": "Skattefri",
        },
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=veroton_verotaso,
        begins=local_date(2000, 1, 1),
        defaults={"percentage": Decimal("0.0"), "vat_code": "4U"},
    )

    harrastustoiminta_muu, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, muu",
        defaults={
            "name_fi": "Harrastustoiminta, muu",
            "name_en": "Hobby or leisure activities, other",
            "name_sv": "Hobby, annat",
        },
    )
    harrastustoiminta_liikunta, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, tanssi ja liikunta",
        defaults={
            "name_fi": "Harrastustoiminta, tanssi ja liikunta",
            "name_en": "Hobby / leisure activities, dance or sports",
            "name_sv": "Hobby, dans eller träning",
        },
    )
    harrastustoiminta_musiikki, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, bändi ja musiikki",
        defaults={
            "name_fi": "Harrastustoiminta, bändi ja musiikki",
            "name_en": "Hobby or leisure activities, band activities or music",
            "name_sv": "Hobby, band eller musik",
        },
    )

    ikaryhma_9_12, _ = AgeGroup.objects.get_or_create(minimum=9, maximum=12)
    ikaryhma_29_64, _ = AgeGroup.objects.get_or_create(minimum=29, maximum=64)
    ikaryhma_1_99, _ = AgeGroup.objects.get_or_create(minimum=1, maximum=99)

    # ------------------------------------------------------------------------------------------------------------
    # Unit
    # ------------------------------------------------------------------------------------------------------------

    unit, _ = Unit.objects.update_or_create(
        name=MANUAL_TEST_ROUND_IN_ALLOCATION_NAME,
        defaults={
            "description": "Kausivarausten manuaalitestaukseen. Haku päättynyt, hakemukset odottavat käsittelyä",
            "tprek_id": None,
            "tprek_department_id": None,
            "address_street": "Harakka",
            "address_zip": "00140",
            "address_city": "Helsinki",
            "allow_permissions_from_ad_groups": False,
            "coordinates": Point(x=2778530.371378948912024, y=8433140.38941946811974),
            "origin_hauki_resource": None,
            "payment_merchant": None,
            "payment_accounting": None,
        },
    )

    # ------------------------------------------------------------------------------------------------------------
    # Reservation units
    # ------------------------------------------------------------------------------------------------------------

    liikuntasali = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="cedd3018-8ff7-49e0-9851-ab4d89493e66",
        #
        # Strings
        name="KÄSITTELY yksikkö Liikuntasali (MANUAALITESTAUS)",
        name_en="KÄSITTELY yksikkö Liikuntasali (MANUAALITESTAUS) EN",
        name_sv="KÄSITTELY yksikkö Liikuntasali (MANUAALITESTAUS) SV",
        description="Varattavissa joka päivä klo 9-21.",
        description_en="Varattavissa joka päivä klo 9-21. EN",
        description_sv="Varattavissa joka päivä klo 9-21. SV",
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=50,
        min_persons=1,
        max_persons=60,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=None,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    liikuntasali_space = Space.objects.create(
        name="KÄSITTELY yksikkö Liikuntasali (MANUAALITESTAUS)",
        name_en="KÄSITTELY yksikkö Liikuntasali (MANUAALITESTAUS) EN",
        name_sv="KÄSITTELY yksikkö Liikuntasali (MANUAALITESTAUS) SV",
        surface_area=100,
        max_persons=60,
        unit=unit,
    )
    liikuntasali.spaces.set([
        liikuntasali_space,
    ])
    liikuntasali.intended_uses.set([
        liiku_ja_rentoudu_tarkoitus,
        harrasta_yhdessa_tarkoitus,
    ])
    liikuntasali.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    create_own_prices([
        OwnPrice(
            reservation_unit=liikuntasali,
            begins=local_date(2025, 6, 12),
            price_unit=PriceUnit.PER_HOUR,
            amount=Decimal(0),
            tax_level=veroton_verotaso,
            can_apply_for_discount=False,
        ),
    ])
    ReservationUnitAccessType.objects.create(
        reservation_unit=liikuntasali,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    kerhohuone = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="f2395044-885a-4af9-94b9-6daeb7bb5cff",
        #
        # Strings
        name="KÄSITTELY yksikkö Kerhohuone (MANUAALITESTAUS)",
        name_en="KÄSITTELY yksikkö Kerhohuone (MANUAALITESTAUS) EN",
        name_sv="KÄSITTELY yksikkö Kerhohuone (MANUAALITESTAUS) SV",
        description="Varattavissa ma-pe klo 8-12 ja 13-20. Suljettu la-su.",
        description_en="Varattavissa ma-pe klo 8-12 ja 13-20. Suljettu la-su. EN",
        description_sv="Varattavissa ma-pe klo 8-12 ja 13-20. Suljettu la-su. SV",
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=50,
        min_persons=1,
        max_persons=15,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=None,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    kerhohuone_space = Space.objects.create(
        name="KÄSITTELY yksikkö Kerhohuone (MANUAALITESTAUS)",
        name_en="KÄSITTELY yksikkö Kerhohuone (MANUAALITESTAUS) EN",
        name_sv="KÄSITTELY yksikkö Kerhohuone (MANUAALITESTAUS) SV",
        surface_area=100,
        max_persons=15,
        unit=unit,
    )
    kerhohuone.spaces.set([
        kerhohuone_space,
    ])
    kerhohuone.intended_uses.set([
        pida_kokous_tarkoitus,
        yksin_tai_ryhma_tarkoitus,
    ])
    kerhohuone.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    create_own_prices([
        OwnPrice(
            reservation_unit=kerhohuone,
            begins=local_date(2025, 6, 12),
            price_unit=PriceUnit.PER_HOUR,
            amount=Decimal(0),
            tax_level=veroton_verotaso,
            can_apply_for_discount=False,
        ),
    ])
    ReservationUnitAccessType.objects.create(
        reservation_unit=kerhohuone,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    banditila = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="c0c40a2a-f960-4216-9e71-e78d6a4c5f63",
        #
        # Strings
        name="KÄSITTELY yksikkö Bänditila (MANUAALITESTAUS)",
        name_en="KÄSITTELY yksikkö Bänditila (MANUAALITESTAUS) EN",
        name_sv="KÄSITTELY yksikkö Bänditila (MANUAALITESTAUS) SV",
        description=(
            "Varattavissa ma klo 16.30-21.30, ke 17.30-22, to 7-9.30 ja 16-20, pe 15.30-23, "
            "la 10-13.30 ja 15-18 sekä su 12-16. Suljettu ti."
        ),
        description_en=(
            "Varattavissa ma klo 16.30-21.30, ke 17.30-22, to 7-9.30 ja 16-20, pe 15.30-23, "
            "la 10-13.30 ja 15-18 sekä su 12-16. Suljettu ti. EN"
        ),
        description_sv=(
            "Varattavissa ma klo 16.30-21.30, ke 17.30-22, to 7-9.30 ja 16-20, pe 15.30-23, "
            "la 10-13.30 ja 15-18 sekä su 12-16. Suljettu ti. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=50,
        min_persons=1,
        max_persons=6,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=None,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    banditila_space = Space.objects.create(
        name="KÄSITTELY yksikkö Bänditila (MANUAALITESTAUS)",
        name_en="KÄSITTELY yksikkö Bänditila (MANUAALITESTAUS) EN",
        name_sv="KÄSITTELY yksikkö Bänditila (MANUAALITESTAUS) SV",
        surface_area=100,
        max_persons=6,
        unit=unit,
    )
    banditila.spaces.set([
        banditila_space,
    ])
    banditila.intended_uses.set([
        tee_musiikkia_tarkoitus,
        kayta_laitteita_tarkoitus,
    ])
    banditila.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    create_own_prices([
        OwnPrice(
            reservation_unit=banditila,
            begins=local_date(2025, 6, 12),
            price_unit=PriceUnit.PER_HOUR,
            amount=Decimal(0),
            tax_level=veroton_verotaso,
            can_apply_for_discount=False,
        ),
    ])
    ReservationUnitAccessType.objects.create(
        reservation_unit=banditila,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    # ------------------------------------------------------------------------------------------------------------
    # Reservable times of the reservation units in application rounds
    # ------------------------------------------------------------------------------------------------------------

    liikuntasali_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=liikuntasali,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="09:00:00", end="21:00:00")],
        )
        for weekday in Weekday  # type: ignore[attr-defined]
    ]
    kerhohuone_weekday_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=kerhohuone,
            weekday=weekday,
            is_closed=False,
            reservable_times=[
                TimeSlotDB(begin="08:00:00", end="12:00:00"),
                TimeSlotDB(begin="13:00:00", end="20:00:00"),
            ],
        )
        for weekday in [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY]
    ]
    ApplicationRoundTimeSlot.objects.bulk_create([
        *liikuntasali_time_slots,
        *kerhohuone_weekday_time_slots,
        ApplicationRoundTimeSlot(
            reservation_unit=kerhohuone,
            weekday=Weekday.SATURDAY,
            is_closed=True,
            reservable_times=[],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=kerhohuone,
            weekday=Weekday.SUNDAY,
            is_closed=True,
            reservable_times=[],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.MONDAY,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="16:30:00", end="21:30:00")],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.TUESDAY,
            is_closed=True,
            reservable_times=[],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.WEDNESDAY,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="17:30:00", end="22:00:00")],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.THURSDAY,
            is_closed=False,
            reservable_times=[
                TimeSlotDB(begin="07:00:00", end="09:30:00"),
                TimeSlotDB(begin="16:00:00", end="20:00:00"),
            ],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.FRIDAY,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="15:30:00", end="23:00:00")],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.SATURDAY,
            is_closed=False,
            reservable_times=[
                TimeSlotDB(begin="10:00:00", end="13:30:00"),
                TimeSlotDB(begin="15:00:00", end="18:00:00"),
            ],
        ),
        ApplicationRoundTimeSlot(
            reservation_unit=banditila,
            weekday=Weekday.SUNDAY,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="12:00:00", end="16:00:00")],
        ),
    ])

    # ------------------------------------------------------------------------------------------------------------
    # Application round
    # ------------------------------------------------------------------------------------------------------------

    # The application period ended yesterday, so the round waits for allocation.
    # The reservations begin a month after the data is made, so staff have a month to handle the round first.
    reservation_period_begin_date = today + datetime.timedelta(days=30)
    reservation_period_end_date = today + datetime.timedelta(days=120)

    application_round = ApplicationRound.objects.create(
        name=MANUAL_TEST_ROUND_IN_ALLOCATION_NAME,
        name_en=f"{MANUAL_TEST_ROUND_IN_ALLOCATION_NAME} EN",
        name_sv=f"{MANUAL_TEST_ROUND_IN_ALLOCATION_NAME} SV",
        criteria="Hakukriteerit (suomeksi)",
        criteria_en="Hakukriteerit (englanniksi)",
        criteria_sv="Hakukriteerit (ruotsiksi)",
        notes_when_applying="Huomioi hakiessa (Suomeksi)",
        notes_when_applying_en="Huomioi hakiessa (Englanniksi)",
        notes_when_applying_sv="Huomioi hakiessa (Ruotsiksi)",
        application_period_begins_at=local_add_days(now, days=-30),
        application_period_ends_at=local_add_days(now, days=-1),
        reservation_period_begin_date=reservation_period_begin_date,
        reservation_period_end_date=reservation_period_end_date,
        public_display_begins_at=local_add_days(now, days=-30),
        public_display_ends_at=local_add_days(now, days=1827),
        handled_at=None,
        sent_at=None,
        application_form=ApplicationFormType.DEFAULT_FORM,
        terms_of_use=nupa_kausivarausehto,
    )
    application_round.purposes.set([
        harrastustoiminta_muu,
        harrastustoiminta_liikunta,
        harrastustoiminta_musiikki,
    ])
    application_round.reservation_units.set([
        liikuntasali,
        kerhohuone,
        banditila,
    ])

    # ------------------------------------------------------------------------------------------------------------
    # Applicants
    # ------------------------------------------------------------------------------------------------------------

    # Made-up people, with an unusable password and no Helsinki profile.
    # Their addresses are in the 'example.com' domain, so no email reaches a real person.
    unusable_password = make_password(password=None)

    iiris, _ = User.objects.update_or_create(
        username="manuaalitestaus-hakija-1",
        defaults={
            "first_name": "Iiris",
            "last_name": "Manuaalitestaaja",
            "email": "iiris.manuaalitestaaja@example.com",
            "password": unusable_password,
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "date_of_birth": local_date(1985, 3, 1),
        },
    )
    pirkko, _ = User.objects.update_or_create(
        username="manuaalitestaus-hakija-2",
        defaults={
            "first_name": "Pirkko",
            "last_name": "Manuaalitestaaja",
            "email": "pirkko.manuaalitestaaja@example.com",
            "password": unusable_password,
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "date_of_birth": local_date(1975, 6, 1),
        },
    )
    tuomas, _ = User.objects.update_or_create(
        username="manuaalitestaus-hakija-3",
        defaults={
            "first_name": "Tuomas",
            "last_name": "Manuaalitestaaja",
            "email": "tuomas.manuaalitestaaja@example.com",
            "password": unusable_password,
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "date_of_birth": local_date(1990, 9, 1),
        },
    )

    # ------------------------------------------------------------------------------------------------------------
    # Applications
    # ------------------------------------------------------------------------------------------------------------

    # Sent during the application period. The "in allocation" email is marked as sent,
    # so that the daily email task does not send it.
    sent_at = local_add_days(now, days=-10)

    individual_application = Application.objects.create(
        application_round=application_round,
        user=iiris,
        applicant_type=ReserveeType.INDIVIDUAL,
        sent_at=sent_at,
        in_allocation_notification_sent_at=now,
        contact_person_first_name="Iiris",
        contact_person_last_name="Manuaalitestaaja",
        contact_person_email="iiris.manuaalitestaaja@example.com",
        contact_person_phone_number="+358 40 0000001",
        billing_street_address="Testikatu 1",
        billing_post_code="00100",
        billing_city="Helsinki",
        municipality=MunicipalityChoice.HELSINKI,
    )
    nonprofit_application = Application.objects.create(
        application_round=application_round,
        user=pirkko,
        applicant_type=ReserveeType.NONPROFIT,
        additional_information="Toivomme samoja vuoroja koko kaudeksi.",
        sent_at=sent_at,
        in_allocation_notification_sent_at=now,
        contact_person_first_name="Pirkko",
        contact_person_last_name="Manuaalitestaaja",
        contact_person_email="pirkko.manuaalitestaaja@example.com",
        contact_person_phone_number="+358 40 0000002",
        organisation_name="Manuaalitestauksen urheiluseura ry",
        organisation_core_business="Juniori- ja aikuisliikunta",
        organisation_year_established=1985,
        organisation_street_address="Testikatu 2",
        organisation_post_code="00100",
        organisation_city="Helsinki",
        municipality=MunicipalityChoice.HELSINKI,
    )
    company_application = Application.objects.create(
        application_round=application_round,
        user=tuomas,
        applicant_type=ReserveeType.COMPANY,
        sent_at=sent_at,
        in_allocation_notification_sent_at=now,
        contact_person_first_name="Tuomas",
        contact_person_last_name="Manuaalitestaaja",
        contact_person_email="tuomas.manuaalitestaaja@example.com",
        contact_person_phone_number="+358 40 0000003",
        organisation_name="Manuaalitestaus Oy",
        organisation_core_business="Ohjelmistotestaus",
        organisation_identifier="0000000-0",
        organisation_street_address="Testikatu 3",
        organisation_post_code="00100",
        organisation_city="Helsinki",
    )

    # ------------------------------------------------------------------------------------------------------------
    # Application sections
    # ------------------------------------------------------------------------------------------------------------

    bandiharjoitukset = ApplicationSection.objects.create(
        application=individual_application,
        name="Bändiharjoitukset",
        num_persons=5,
        reservations_begin_date=reservation_period_begin_date,
        reservations_end_date=reservation_period_end_date,
        reservation_min_duration=datetime.timedelta(hours=2),
        reservation_max_duration=datetime.timedelta(hours=3),
        applied_reservations_per_week=2,
        purpose=harrastustoiminta_musiikki,
        age_group=ikaryhma_29_64,
    )
    junioreiden_harjoitukset = ApplicationSection.objects.create(
        application=nonprofit_application,
        name="Junioreiden harjoitukset",
        num_persons=25,
        reservations_begin_date=reservation_period_begin_date,
        reservations_end_date=reservation_period_end_date,
        reservation_min_duration=datetime.timedelta(hours=1, minutes=30),
        reservation_max_duration=datetime.timedelta(hours=2),
        applied_reservations_per_week=3,
        purpose=harrastustoiminta_liikunta,
        age_group=ikaryhma_9_12,
    )
    aikuisten_vuorot = ApplicationSection.objects.create(
        application=nonprofit_application,
        name="Aikuisten sählyvuorot",
        num_persons=12,
        reservations_begin_date=reservation_period_begin_date + datetime.timedelta(days=21),
        reservations_end_date=reservation_period_end_date - datetime.timedelta(days=14),
        reservation_min_duration=datetime.timedelta(hours=1),
        reservation_max_duration=datetime.timedelta(hours=1, minutes=30),
        applied_reservations_per_week=4,
        purpose=harrastustoiminta_liikunta,
        age_group=ikaryhma_29_64,
    )
    virkistysvuorot = ApplicationSection.objects.create(
        application=company_application,
        name="Henkilöstön virkistysvuorot",
        num_persons=6,
        reservations_begin_date=reservation_period_begin_date,
        reservations_end_date=reservation_period_end_date,
        reservation_min_duration=datetime.timedelta(hours=1),
        reservation_max_duration=datetime.timedelta(hours=1),
        applied_reservations_per_week=5,
        purpose=harrastustoiminta_muu,
        age_group=ikaryhma_1_99,
    )

    ReservationUnitOption.objects.bulk_create([
        ReservationUnitOption(application_section=bandiharjoitukset, reservation_unit=banditila, preferred_order=0),
        ReservationUnitOption(
            application_section=junioreiden_harjoitukset,
            reservation_unit=liikuntasali,
            preferred_order=0,
        ),
        ReservationUnitOption(
            application_section=junioreiden_harjoitukset,
            reservation_unit=kerhohuone,
            preferred_order=1,
        ),
        ReservationUnitOption(application_section=aikuisten_vuorot, reservation_unit=liikuntasali, preferred_order=0),
        ReservationUnitOption(application_section=virkistysvuorot, reservation_unit=kerhohuone, preferred_order=0),
        ReservationUnitOption(application_section=virkistysvuorot, reservation_unit=liikuntasali, preferred_order=1),
        ReservationUnitOption(application_section=virkistysvuorot, reservation_unit=banditila, preferred_order=2),
    ])

    # Each time range fits inside the reservable times of the section's reservation units,
    # like the ranges of an application that is sent in the customer UI.
    virkistysvuorot_primary_ranges = [
        SuitableTimeRange(
            application_section=virkistysvuorot,
            priority=Priority.PRIMARY,
            day_of_the_week=weekday,
            begin_time=datetime.time(11, 0),
            end_time=datetime.time(13, 0),
        )
        for weekday in [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY]
    ]
    virkistysvuorot_secondary_ranges = [
        SuitableTimeRange(
            application_section=virkistysvuorot,
            priority=Priority.SECONDARY,
            day_of_the_week=weekday,
            begin_time=datetime.time(15, 0),
            end_time=datetime.time(17, 0),
        )
        for weekday in [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY]
    ]
    junioreiden_primary_ranges = [
        SuitableTimeRange(
            application_section=junioreiden_harjoitukset,
            priority=Priority.PRIMARY,
            day_of_the_week=weekday,
            begin_time=datetime.time(17, 0),
            end_time=datetime.time(20, 0),
        )
        for weekday in [Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.THURSDAY]
    ]
    SuitableTimeRange.objects.bulk_create([
        SuitableTimeRange(
            application_section=bandiharjoitukset,
            priority=Priority.PRIMARY,
            day_of_the_week=Weekday.MONDAY,
            begin_time=datetime.time(17, 0),
            end_time=datetime.time(21, 0),
        ),
        SuitableTimeRange(
            application_section=bandiharjoitukset,
            priority=Priority.PRIMARY,
            day_of_the_week=Weekday.WEDNESDAY,
            begin_time=datetime.time(18, 0),
            end_time=datetime.time(22, 0),
        ),
        SuitableTimeRange(
            application_section=bandiharjoitukset,
            priority=Priority.SECONDARY,
            day_of_the_week=Weekday.FRIDAY,
            begin_time=datetime.time(16, 0),
            end_time=datetime.time(20, 0),
        ),
        SuitableTimeRange(
            application_section=bandiharjoitukset,
            priority=Priority.SECONDARY,
            day_of_the_week=Weekday.SATURDAY,
            begin_time=datetime.time(15, 0),
            end_time=datetime.time(18, 0),
        ),
        *junioreiden_primary_ranges,
        SuitableTimeRange(
            application_section=junioreiden_harjoitukset,
            priority=Priority.SECONDARY,
            day_of_the_week=Weekday.TUESDAY,
            begin_time=datetime.time(16, 0),
            end_time=datetime.time(19, 0),
        ),
        SuitableTimeRange(
            application_section=aikuisten_vuorot,
            priority=Priority.PRIMARY,
            day_of_the_week=Weekday.MONDAY,
            begin_time=datetime.time(18, 0),
            end_time=datetime.time(20, 0),
        ),
        SuitableTimeRange(
            application_section=aikuisten_vuorot,
            priority=Priority.PRIMARY,
            day_of_the_week=Weekday.THURSDAY,
            begin_time=datetime.time(19, 0),
            end_time=datetime.time(21, 0),
        ),
        SuitableTimeRange(
            application_section=aikuisten_vuorot,
            priority=Priority.SECONDARY,
            day_of_the_week=Weekday.FRIDAY,
            begin_time=datetime.time(18, 0),
            end_time=datetime.time(21, 0),
        ),
        SuitableTimeRange(
            application_section=aikuisten_vuorot,
            priority=Priority.SECONDARY,
            day_of_the_week=Weekday.SUNDAY,
            begin_time=datetime.time(10, 0),
            end_time=datetime.time(12, 0),
        ),
        *virkistysvuorot_primary_ranges,
        *virkistysvuorot_secondary_ranges,
    ])

    return application_round


def _make_open_paid_manual_test_round() -> ApplicationRound:
    now = local_datetime()
    today = local_date_of(now)

    # Open for two years from the moment the data is made, like the open manual test round.
    reservation_period_begin_date = today + datetime.timedelta(days=731)
    reservation_period_end_date = today + datetime.timedelta(days=1826)

    # ------------------------------------------------------------------------------------------------------------
    # Fetch existing objects
    # ------------------------------------------------------------------------------------------------------------

    kokoustila, _ = ReservationUnitType.objects.get_or_create(
        name="Kokoustila",
        defaults={
            "name_fi": "Kokoustila",
            "name_en": "Meeting room",
            "name_sv": "Möteslokal",
        },
    )
    peruutus_alkuun_asti, _ = ReservationUnitCancellationRule.objects.get_or_create(
        name="Varauksen alkuun asti",
        defaults={
            "name_fi": "Varauksen alkuun asti",
            "name_en": "Varauksen alkuun asti",
            "name_sv": "Varauksen alkuun asti",
            "can_be_cancelled_time_before": datetime.timedelta(seconds=1),
        },
    )
    nupa_kausivarausehto, _ = TermsOfUse.objects.get_or_create(
        id="KUVAnupa",
        defaults={
            "name_fi": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "name_en": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "name_sv": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "text_fi": "",
            "text_en": "",
            "text_sv": "",
            "terms_type": TermsOfUseTypeChoices.RECURRING,
        },
    )

    harrasta_yhdessa_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Harrasta yhdessä",
        defaults={
            "name_fi": "Harrasta yhdessä",
            "name_en": "Engage in hobbies together",
            "name_sv": "Utöva hobbyer tillsammans",
        },
    )
    kayta_laitteita_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Käytä laitteita",
        defaults={
            "name_fi": "Käytä laitteita",
            "name_en": "Use equipment",
            "name_sv": "Använd utrustning",
        },
    )
    liiku_ja_rentoudu_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Liiku ja rentoudu",
        defaults={
            "name_fi": "Liiku ja rentoudu",
            "name_en": "Exercise and relax",
            "name_sv": "Motionera och koppla av",
        },
    )
    pida_kokous_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Pidä kokous",
        defaults={
            "name_fi": "Pidä kokous",
            "name_en": "Hold a meeting",
            "name_sv": "Håll möte",
        },
    )
    tee_musiikkia_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Tee musiikkia tai äänitä",
        defaults={
            "name_fi": "Tee musiikkia tai äänitä",
            "name_en": "Make music or record",
            "name_sv": "Gör musik eller spela in",
        },
    )
    yksin_tai_ryhma_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Työskentele yksin tai ryhmässä",
        defaults={
            "name_fi": "Työskentele yksin tai ryhmässä",
            "name_en": "Work alone or in a group",
            "name_sv": "Arbeta enskilt eller i grupp",
        },
    )

    kaluesteet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Kalusteet",
        defaults={
            "name_fi": "Kalusteet",
            "name_en": "",
            "name_sv": "",
        },
    )
    soittimet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Soittimet",
        defaults={
            "name_fi": "Soittimet",
            "name_en": "",
            "name_sv": "",
        },
    )
    istumapaikka_laite, _ = Equipment.objects.get_or_create(
        name="Istumapaikkoja",
        defaults={
            "name_fi": "Istumapaikkoja",
            "name_en": "Seats",
            "name_sv": "Sittplatser",
            "category": kaluesteet_category,
        },
    )
    piano_laite, _ = Equipment.objects.get_or_create(
        name="Piano",
        defaults={
            "name_fi": "Piano",
            "name_en": "Piano",
            "name_sv": "Piano",
            "category": soittimet_category,
        },
    )
    rummut_laite, _ = Equipment.objects.get_or_create(
        name="Sähkörummut",
        defaults={
            "name_fi": "Sähkörummut",
            "name_en": "Electric drums",
            "name_sv": "e-trummor",
            "category": soittimet_category,
        },
    )

    yleinen_verotaso, _ = TaxLevel.objects.get_or_create(
        name="Yleinen",
        defaults={
            "name_fi": "Yleinen",
            "name_en": "General",
            "name_sv": "Allmän",
        },
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=yleinen_verotaso,
        begins=local_date(2000, 1, 1),
        defaults={"percentage": Decimal("24.0")},
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=yleinen_verotaso,
        begins=local_date(2024, 9, 1),
        defaults={"percentage": Decimal("25.5"), "vat_code": "48"},
    )

    alennettu_verotaso, _ = TaxLevel.objects.get_or_create(
        name="Alennettu",
        defaults={
            "name_fi": "Alennettu",
            "name_en": "Reduced",
            "name_sv": "Reducerad",
        },
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=alennettu_verotaso,
        begins=local_date(2000, 1, 1),
        defaults={"percentage": Decimal("10.0")},
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=alennettu_verotaso,
        begins=local_date(2025, 1, 1),
        defaults={"percentage": Decimal("14.0")},
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=alennettu_verotaso,
        begins=local_date(2026, 1, 1),
        defaults={"percentage": Decimal("13.5"), "vat_code": "47"},
    )

    harrastustoiminta_muu, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, muu",
        defaults={
            "name_fi": "Harrastustoiminta, muu",
            "name_en": "Hobby or leisure activities, other",
            "name_sv": "Hobby, annat",
        },
    )
    harrastustoiminta_liikunta, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, tanssi ja liikunta",
        defaults={
            "name_fi": "Harrastustoiminta, tanssi ja liikunta",
            "name_en": "Hobby / leisure activities, dance or sports",
            "name_sv": "Hobby, dans eller träning",
        },
    )
    harrastustoiminta_musiikki, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, bändi ja musiikki",
        defaults={
            "name_fi": "Harrastustoiminta, bändi ja musiikki",
            "name_en": "Hobby or leisure activities, band activities or music",
            "name_sv": "Hobby, band eller musik",
        },
    )

    # ------------------------------------------------------------------------------------------------------------
    # Unit and unit group
    # ------------------------------------------------------------------------------------------------------------

    # A reset keeps the unit, so the unit roles and unit groups that include it don't lose it.
    # No TPREK id, so that the nightly TPREK update leaves it alone. The address is Harakka's.
    unit, _ = Unit.objects.update_or_create(
        name=MANUAL_TEST_OPEN_PAID_ROUND_NAME,
        defaults={
            "description": (
                "Maksullisten kausivarausten ja tilahierarkian manuaalitestaukseen. Haku auki ja hakemuksia voi tehdä"
            ),
            "tprek_id": None,
            "tprek_department_id": None,
            "address_street": "Harakka",
            "address_zip": "00140",
            "address_city": "Helsinki",
            "allow_permissions_from_ad_groups": False,
            "coordinates": Point(x=2778530.371378948912024, y=8433140.38941946811974),
            "origin_hauki_resource": None,
            "payment_merchant": None,
            "payment_accounting": None,
        },
    )

    # The customer groups and the shared pricing groups belong to the unit group.
    # A reset keeps it too, so the unit roles that include it don't lose it.
    unit_group, _ = UnitGroup.objects.update_or_create(
        name=MANUAL_TEST_OPEN_PAID_ROUND_NAME,
        defaults={
            "name_en": f"{MANUAL_TEST_OPEN_PAID_ROUND_NAME} EN",
            "name_sv": f"{MANUAL_TEST_OPEN_PAID_ROUND_NAME} SV",
        },
    )
    unit_group.units.add(unit)

    # ------------------------------------------------------------------------------------------------------------
    # Prices
    # ------------------------------------------------------------------------------------------------------------

    aikuiset = PriceOption.objects.create(
        name="Aikuiset",
        name_fi="Aikuiset",
        name_en="Adults",
        name_sv="Vuxna",
        description="Yli 20-vuotiaat",
        description_fi="Yli 20-vuotiaat",
        description_en="Over 20 years old",
        description_sv="Över 20 år",
        unit_group=unit_group,
    )
    juniorit = PriceOption.objects.create(
        name="Juniorit",
        name_fi="Juniorit",
        name_en="Juniors",
        name_sv="Juniorer",
        description="Alle 20-vuotiaat",
        description_fi="Alle 20-vuotiaat",
        description_en="Under 20 years old",
        description_sv="Under 20 år",
        unit_group=unit_group,
    )

    # Shared by the whole hall and the event package.
    liikuntahalli_hintaryhma = PricingGroup.objects.create(
        name="MAKSULLINEN hintaryhmä Liikuntahalli, koko (MANUAALITESTAUS)",
        name_en="MAKSULLINEN hintaryhmä Liikuntahalli, koko (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN hintaryhmä Liikuntahalli, koko (MANUAALITESTAUS) SV",
        unit_group=unit_group,
    )
    PriceComponent.objects.create(
        pricing_group=liikuntahalli_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=None,
        price_option=aikuiset,
        amount=Decimal(40),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=alennettu_verotaso,
        sales_item=None,
    )
    PriceComponent.objects.create(
        pricing_group=liikuntahalli_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=None,
        price_option=juniorit,
        amount=Decimal(20),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=alennettu_verotaso,
        sales_item=None,
    )

    # Shared by the two halves of the hall. Free for juniors, so one application can have free and paid sections.
    osa_hintaryhma = PricingGroup.objects.create(
        name="MAKSULLINEN hintaryhmä Liikuntahalli, osa (MANUAALITESTAUS)",
        name_en="MAKSULLINEN hintaryhmä Liikuntahalli, osa (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN hintaryhmä Liikuntahalli, osa (MANUAALITESTAUS) SV",
        unit_group=unit_group,
    )
    PriceComponent.objects.create(
        pricing_group=osa_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=None,
        price_option=aikuiset,
        amount=Decimal(20),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=alennettu_verotaso,
        sales_item=None,
    )
    PriceComponent.objects.create(
        pricing_group=osa_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=None,
        price_option=juniorit,
        amount=Decimal(0),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=alennettu_verotaso,
        sales_item=None,
    )

    # One price without a customer group, so both customer groups of the unit group pay it.
    kokoustilat_hintaryhma = PricingGroup.objects.create(
        name="MAKSULLINEN hintaryhmä Kokous- ja ryhmätilat (MANUAALITESTAUS)",
        name_en="MAKSULLINEN hintaryhmä Kokous- ja ryhmätilat (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN hintaryhmä Kokous- ja ryhmätilat (MANUAALITESTAUS) SV",
        unit_group=unit_group,
    )
    PriceComponent.objects.create(
        pricing_group=kokoustilat_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=None,
        price_option=None,
        amount=Decimal(8),
        price_unit=PriceUnit.PER_30_MINS,
        can_apply_for_discount=False,
        tax_level=yleinen_verotaso,
        sales_item=None,
    )

    # The prices change during the reservation period, so the reservations before and after the change differ.
    studio_price_change_date = reservation_period_begin_date + datetime.timedelta(days=45)
    studio_hintaryhma = PricingGroup.objects.create(
        name="MAKSULLINEN hintaryhmä Studio (MANUAALITESTAUS)",
        name_en="MAKSULLINEN hintaryhmä Studio (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN hintaryhmä Studio (MANUAALITESTAUS) SV",
        unit_group=unit_group,
    )
    PriceComponent.objects.create(
        pricing_group=studio_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=studio_price_change_date,
        price_option=aikuiset,
        amount=Decimal(25),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=yleinen_verotaso,
        sales_item=None,
    )
    PriceComponent.objects.create(
        pricing_group=studio_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=studio_price_change_date,
        valid_until=None,
        price_option=aikuiset,
        amount=Decimal(30),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=yleinen_verotaso,
        sales_item=None,
    )
    PriceComponent.objects.create(
        pricing_group=studio_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=studio_price_change_date,
        price_option=juniorit,
        amount=Decimal(12),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=yleinen_verotaso,
        sales_item=None,
    )
    PriceComponent.objects.create(
        pricing_group=studio_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=studio_price_change_date,
        valid_until=None,
        price_option=juniorit,
        amount=Decimal(15),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=yleinen_verotaso,
        sales_item=None,
    )

    # ------------------------------------------------------------------------------------------------------------
    # Reservation units
    # ------------------------------------------------------------------------------------------------------------

    liikuntahalli = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="df14aaca-cf9f-4721-bba0-bdc087f858bc",
        #
        # Strings
        name="MAKSULLINEN yksikkö Liikuntahalli, koko (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Liikuntahalli, koko (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Liikuntahalli, koko (MANUAALITESTAUS) SV",
        description=(
            "Koko liikuntahalli. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "A-osan, B-osan tai tapahtumapaketin varaus estää koko hallin samaan aikaan."
        ),
        description_en=(
            "Koko liikuntahalli. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "A-osan, B-osan tai tapahtumapaketin varaus estää koko hallin samaan aikaan. EN"
        ),
        description_sv=(
            "Koko liikuntahalli. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "A-osan, B-osan tai tapahtumapaketin varaus estää koko hallin samaan aikaan. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=800,
        min_persons=1,
        max_persons=120,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    liikuntahalli_space = Space.objects.create(
        name="MAKSULLINEN yksikkö Liikuntahalli, koko (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Liikuntahalli, koko (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Liikuntahalli, koko (MANUAALITESTAUS) SV",
        surface_area=800,
        max_persons=120,
        unit=unit,
    )
    liikuntahalli.spaces.set([
        liikuntahalli_space,
    ])
    liikuntahalli.intended_uses.set([
        liiku_ja_rentoudu_tarkoitus,
        harrasta_yhdessa_tarkoitus,
    ])
    liikuntahalli.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=liikuntahalli,
        pricing_group=liikuntahalli_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=liikuntahalli,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    liikuntahalli_a_osa = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="df587435-38b2-4085-8b6e-1f33b795336b",
        #
        # Strings
        name="MAKSULLINEN yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS) SV",
        description=(
            "Liikuntahallin A-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. B-osan varaus ei estä."
        ),
        description_en=(
            "Liikuntahallin A-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. B-osan varaus ei estä. EN"
        ),
        description_sv=(
            "Liikuntahallin A-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. B-osan varaus ei estä. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=400,
        min_persons=1,
        max_persons=60,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    # The halves are spaces inside the hall, so a reservation of either half blocks the hall, and the other way round.
    liikuntahalli_a_osa_space = Space.objects.create(
        name="MAKSULLINEN yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS) SV",
        surface_area=400,
        max_persons=60,
        parent=liikuntahalli_space,
        unit=unit,
    )
    liikuntahalli_a_osa.spaces.set([
        liikuntahalli_a_osa_space,
    ])
    liikuntahalli_a_osa.intended_uses.set([
        liiku_ja_rentoudu_tarkoitus,
        harrasta_yhdessa_tarkoitus,
    ])
    liikuntahalli_a_osa.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=liikuntahalli_a_osa,
        pricing_group=osa_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=liikuntahalli_a_osa,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    liikuntahalli_b_osa = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="7714e5e7-30c7-44ae-9e65-443fb6a1312a",
        #
        # Strings
        name="MAKSULLINEN yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS) SV",
        description=(
            "Liikuntahallin B-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. A-osan varaus ei estä."
        ),
        description_en=(
            "Liikuntahallin B-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. A-osan varaus ei estä. EN"
        ),
        description_sv=(
            "Liikuntahallin B-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. A-osan varaus ei estä. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=400,
        min_persons=1,
        max_persons=60,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    liikuntahalli_b_osa_space = Space.objects.create(
        name="MAKSULLINEN yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS) SV",
        surface_area=400,
        max_persons=60,
        parent=liikuntahalli_space,
        unit=unit,
    )
    liikuntahalli_b_osa.spaces.set([
        liikuntahalli_b_osa_space,
    ])
    liikuntahalli_b_osa.intended_uses.set([
        liiku_ja_rentoudu_tarkoitus,
        harrasta_yhdessa_tarkoitus,
    ])
    liikuntahalli_b_osa.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=liikuntahalli_b_osa,
        pricing_group=osa_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=liikuntahalli_b_osa,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    kokoushuone = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="4fe9b08b-8c61-4264-8495-9bf4977e3c06",
        #
        # Strings
        name="MAKSULLINEN yksikkö Kokoushuone (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Kokoushuone (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Kokoushuone (MANUAALITESTAUS) SV",
        description=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen ryhmätilan kanssa, "
            "joten ryhmätilan varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus estää myös."
        ),
        description_en=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen ryhmätilan kanssa, "
            "joten ryhmätilan varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus estää myös. EN"
        ),
        description_sv=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen ryhmätilan kanssa, "
            "joten ryhmätilan varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus estää myös. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=40,
        min_persons=1,
        max_persons=20,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    kokoushuone_space = Space.objects.create(
        name="MAKSULLINEN yksikkö Kokoushuone (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Kokoushuone (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Kokoushuone (MANUAALITESTAUS) SV",
        surface_area=40,
        max_persons=20,
        unit=unit,
    )
    # Kept in the meeting room and used in the group room too, so a reservation of either room blocks the other.
    videotykki = Resource.objects.create(
        name="MAKSULLINEN videotykki (MANUAALITESTAUS)",
        name_en="MAKSULLINEN videotykki (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN videotykki (MANUAALITESTAUS) SV",
        location_type=ResourceLocationType.MOVABLE,
        space=kokoushuone_space,
    )
    kokoushuone.spaces.set([
        kokoushuone_space,
    ])
    kokoushuone.resources.set([
        videotykki,
    ])
    kokoushuone.intended_uses.set([
        pida_kokous_tarkoitus,
        yksin_tai_ryhma_tarkoitus,
    ])
    kokoushuone.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=kokoushuone,
        pricing_group=kokoustilat_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=kokoushuone,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    ryhmatila = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="9741813b-5d9e-4179-b5e9-d0cf047607e3",
        #
        # Strings
        name="MAKSULLINEN yksikkö Ryhmätila (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Ryhmätila (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Ryhmätila (MANUAALITESTAUS) SV",
        description=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen kokoushuoneen kanssa, "
            "joten kokoushuoneen varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus ei estä."
        ),
        description_en=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen kokoushuoneen kanssa, "
            "joten kokoushuoneen varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus ei estä. EN"
        ),
        description_sv=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen kokoushuoneen kanssa, "
            "joten kokoushuoneen varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus ei estä. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=25,
        min_persons=1,
        max_persons=12,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    ryhmatila_space = Space.objects.create(
        name="MAKSULLINEN yksikkö Ryhmätila (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Ryhmätila (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Ryhmätila (MANUAALITESTAUS) SV",
        surface_area=25,
        max_persons=12,
        unit=unit,
    )
    ryhmatila.spaces.set([
        ryhmatila_space,
    ])
    ryhmatila.resources.set([
        videotykki,
    ])
    ryhmatila.intended_uses.set([
        pida_kokous_tarkoitus,
        yksin_tai_ryhma_tarkoitus,
    ])
    ryhmatila.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=ryhmatila,
        pricing_group=kokoustilat_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=ryhmatila,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    studio = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="c310729f-58f3-4fef-96f2-1e5bb3f63c71",
        #
        # Strings
        name="MAKSULLINEN yksikkö Studio (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Studio (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Studio (MANUAALITESTAUS) SV",
        description="Varattavissa joka päivä klo 12-22. Muiden tilojen varaukset eivät estä tätä tilaa.",
        description_en="Varattavissa joka päivä klo 12-22. Muiden tilojen varaukset eivät estä tätä tilaa. EN",
        description_sv="Varattavissa joka päivä klo 12-22. Muiden tilojen varaukset eivät estä tätä tilaa. SV",
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=20,
        min_persons=1,
        max_persons=8,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    studio_space = Space.objects.create(
        name="MAKSULLINEN yksikkö Studio (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Studio (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Studio (MANUAALITESTAUS) SV",
        surface_area=20,
        max_persons=8,
        unit=unit,
    )
    studio.spaces.set([
        studio_space,
    ])
    studio.intended_uses.set([
        tee_musiikkia_tarkoitus,
        kayta_laitteita_tarkoitus,
    ])
    studio.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=studio,
        pricing_group=studio_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=studio,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    tapahtumapaketti = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="2ee3c758-3d60-42ee-a19b-02d0d499786a",
        #
        # Strings
        name="MAKSULLINEN yksikkö Tapahtumapaketti (MANUAALITESTAUS)",
        name_en="MAKSULLINEN yksikkö Tapahtumapaketti (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN yksikkö Tapahtumapaketti (MANUAALITESTAUS) SV",
        description=(
            "Koko liikuntahalli ja kokoushuone samalla varauksella. Varattavissa ma-pe klo 8-20. Suljettu la-su. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "Koko hallin, A-osan, B-osan tai kokoushuoneen varaus estää tämän samaan aikaan. "
            "Ryhmätilan varaus ei estä."
        ),
        description_en=(
            "Koko liikuntahalli ja kokoushuone samalla varauksella. Varattavissa ma-pe klo 8-20. Suljettu la-su. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "Koko hallin, A-osan, B-osan tai kokoushuoneen varaus estää tämän samaan aikaan. "
            "Ryhmätilan varaus ei estä. EN"
        ),
        description_sv=(
            "Koko liikuntahalli ja kokoushuone samalla varauksella. Varattavissa ma-pe klo 8-20. Suljettu la-su. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "Koko hallin, A-osan, B-osan tai kokoushuoneen varaus estää tämän samaan aikaan. "
            "Ryhmätilan varaus ei estä. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=840,
        min_persons=1,
        max_persons=140,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    # Uses the spaces of the whole hall and the meeting room, so a reservation of the hall, either half or the
    # meeting room blocks the package, and the other way round. The package has no projector, so the group room
    # doesn't block it.
    tapahtumapaketti.spaces.set([
        liikuntahalli_space,
        kokoushuone_space,
    ])
    tapahtumapaketti.intended_uses.set([
        liiku_ja_rentoudu_tarkoitus,
        harrasta_yhdessa_tarkoitus,
        pida_kokous_tarkoitus,
    ])
    tapahtumapaketti.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=tapahtumapaketti,
        pricing_group=liikuntahalli_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=tapahtumapaketti,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    # ------------------------------------------------------------------------------------------------------------
    # Reservable times of the reservation units in application rounds
    # ------------------------------------------------------------------------------------------------------------

    hall_weekday_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=reservation_unit,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="08:00:00", end="22:00:00")],
        )
        for reservation_unit in [liikuntahalli, liikuntahalli_a_osa, liikuntahalli_b_osa]
        for weekday in [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY]
    ]
    hall_weekend_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=reservation_unit,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="09:00:00", end="18:00:00")],
        )
        for reservation_unit in [liikuntahalli, liikuntahalli_a_osa, liikuntahalli_b_osa]
        for weekday in [Weekday.SATURDAY, Weekday.SUNDAY]
    ]
    # The event package needs the meeting room too, so it has the rooms' times.
    room_weekday_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=reservation_unit,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="08:00:00", end="20:00:00")],
        )
        for reservation_unit in [kokoushuone, ryhmatila, tapahtumapaketti]
        for weekday in [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY]
    ]
    room_weekend_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=reservation_unit,
            weekday=weekday,
            is_closed=True,
            reservable_times=[],
        )
        for reservation_unit in [kokoushuone, ryhmatila, tapahtumapaketti]
        for weekday in [Weekday.SATURDAY, Weekday.SUNDAY]
    ]
    studio_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=studio,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="12:00:00", end="22:00:00")],
        )
        for weekday in Weekday  # type: ignore[attr-defined]
    ]
    ApplicationRoundTimeSlot.objects.bulk_create([
        *hall_weekday_time_slots,
        *hall_weekend_time_slots,
        *room_weekday_time_slots,
        *room_weekend_time_slots,
        *studio_time_slots,
    ])

    # ------------------------------------------------------------------------------------------------------------
    # Application round
    # ------------------------------------------------------------------------------------------------------------

    application_round = ApplicationRound.objects.create(
        name=MANUAL_TEST_OPEN_PAID_ROUND_NAME,
        name_en=f"{MANUAL_TEST_OPEN_PAID_ROUND_NAME} EN",
        name_sv=f"{MANUAL_TEST_OPEN_PAID_ROUND_NAME} SV",
        criteria="Hakukriteerit (suomeksi)",
        criteria_en="Hakukriteerit (englanniksi)",
        criteria_sv="Hakukriteerit (ruotsiksi)",
        notes_when_applying=(
            "Junioreiden vuorot liikuntahallin A- ja B-osassa ovat maksuttomia. "
            "Maksuttoman kausivuoron voi perua itse, maksullista ei."
        ),
        notes_when_applying_en=(
            "Junioreiden vuorot liikuntahallin A- ja B-osassa ovat maksuttomia. "
            "Maksuttoman kausivuoron voi perua itse, maksullista ei. EN"
        ),
        notes_when_applying_sv=(
            "Junioreiden vuorot liikuntahallin A- ja B-osassa ovat maksuttomia. "
            "Maksuttoman kausivuoron voi perua itse, maksullista ei. SV"
        ),
        application_period_begins_at=local_add_days(now, days=-1),
        application_period_ends_at=local_add_days(now, days=730),
        reservation_period_begin_date=reservation_period_begin_date,
        reservation_period_end_date=reservation_period_end_date,
        public_display_begins_at=local_add_days(now, days=-1),
        public_display_ends_at=local_add_days(now, days=1827),
        handled_at=None,
        sent_at=None,
        application_form=ApplicationFormType.DEFAULT_FORM,
        terms_of_use=nupa_kausivarausehto,
    )
    application_round.purposes.set([
        harrastustoiminta_muu,
        harrastustoiminta_liikunta,
        harrastustoiminta_musiikki,
    ])
    application_round.reservation_units.set([
        liikuntahalli,
        liikuntahalli_a_osa,
        liikuntahalli_b_osa,
        kokoushuone,
        ryhmatila,
        studio,
        tapahtumapaketti,
    ])

    return application_round


def _make_paid_manual_test_round_in_allocation() -> ApplicationRound:
    now = local_datetime()
    today = local_date_of(now)

    # The application period ended yesterday, so the round waits for allocation.
    # The reservations begin a month after the data is made, so staff have a month to handle the round first.
    reservation_period_begin_date = today + datetime.timedelta(days=30)
    reservation_period_end_date = today + datetime.timedelta(days=120)

    # ------------------------------------------------------------------------------------------------------------
    # Fetch existing objects
    # ------------------------------------------------------------------------------------------------------------

    kokoustila, _ = ReservationUnitType.objects.get_or_create(
        name="Kokoustila",
        defaults={
            "name_fi": "Kokoustila",
            "name_en": "Meeting room",
            "name_sv": "Möteslokal",
        },
    )
    peruutus_alkuun_asti, _ = ReservationUnitCancellationRule.objects.get_or_create(
        name="Varauksen alkuun asti",
        defaults={
            "name_fi": "Varauksen alkuun asti",
            "name_en": "Varauksen alkuun asti",
            "name_sv": "Varauksen alkuun asti",
            "can_be_cancelled_time_before": datetime.timedelta(seconds=1),
        },
    )
    nupa_kausivarausehto, _ = TermsOfUse.objects.get_or_create(
        id="KUVAnupa",
        defaults={
            "name_fi": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "name_en": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "name_sv": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "text_fi": "",
            "text_en": "",
            "text_sv": "",
            "terms_type": TermsOfUseTypeChoices.RECURRING,
        },
    )

    harrasta_yhdessa_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Harrasta yhdessä",
        defaults={
            "name_fi": "Harrasta yhdessä",
            "name_en": "Engage in hobbies together",
            "name_sv": "Utöva hobbyer tillsammans",
        },
    )
    kayta_laitteita_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Käytä laitteita",
        defaults={
            "name_fi": "Käytä laitteita",
            "name_en": "Use equipment",
            "name_sv": "Använd utrustning",
        },
    )
    liiku_ja_rentoudu_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Liiku ja rentoudu",
        defaults={
            "name_fi": "Liiku ja rentoudu",
            "name_en": "Exercise and relax",
            "name_sv": "Motionera och koppla av",
        },
    )
    pida_kokous_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Pidä kokous",
        defaults={
            "name_fi": "Pidä kokous",
            "name_en": "Hold a meeting",
            "name_sv": "Håll möte",
        },
    )
    tee_musiikkia_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Tee musiikkia tai äänitä",
        defaults={
            "name_fi": "Tee musiikkia tai äänitä",
            "name_en": "Make music or record",
            "name_sv": "Gör musik eller spela in",
        },
    )
    yksin_tai_ryhma_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Työskentele yksin tai ryhmässä",
        defaults={
            "name_fi": "Työskentele yksin tai ryhmässä",
            "name_en": "Work alone or in a group",
            "name_sv": "Arbeta enskilt eller i grupp",
        },
    )

    kaluesteet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Kalusteet",
        defaults={
            "name_fi": "Kalusteet",
            "name_en": "",
            "name_sv": "",
        },
    )
    soittimet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Soittimet",
        defaults={
            "name_fi": "Soittimet",
            "name_en": "",
            "name_sv": "",
        },
    )
    istumapaikka_laite, _ = Equipment.objects.get_or_create(
        name="Istumapaikkoja",
        defaults={
            "name_fi": "Istumapaikkoja",
            "name_en": "Seats",
            "name_sv": "Sittplatser",
            "category": kaluesteet_category,
        },
    )
    piano_laite, _ = Equipment.objects.get_or_create(
        name="Piano",
        defaults={
            "name_fi": "Piano",
            "name_en": "Piano",
            "name_sv": "Piano",
            "category": soittimet_category,
        },
    )
    rummut_laite, _ = Equipment.objects.get_or_create(
        name="Sähkörummut",
        defaults={
            "name_fi": "Sähkörummut",
            "name_en": "Electric drums",
            "name_sv": "e-trummor",
            "category": soittimet_category,
        },
    )

    yleinen_verotaso, _ = TaxLevel.objects.get_or_create(
        name="Yleinen",
        defaults={
            "name_fi": "Yleinen",
            "name_en": "General",
            "name_sv": "Allmän",
        },
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=yleinen_verotaso,
        begins=local_date(2000, 1, 1),
        defaults={"percentage": Decimal("24.0")},
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=yleinen_verotaso,
        begins=local_date(2024, 9, 1),
        defaults={"percentage": Decimal("25.5"), "vat_code": "48"},
    )

    alennettu_verotaso, _ = TaxLevel.objects.get_or_create(
        name="Alennettu",
        defaults={
            "name_fi": "Alennettu",
            "name_en": "Reduced",
            "name_sv": "Reducerad",
        },
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=alennettu_verotaso,
        begins=local_date(2000, 1, 1),
        defaults={"percentage": Decimal("10.0")},
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=alennettu_verotaso,
        begins=local_date(2025, 1, 1),
        defaults={"percentage": Decimal("14.0")},
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=alennettu_verotaso,
        begins=local_date(2026, 1, 1),
        defaults={"percentage": Decimal("13.5"), "vat_code": "47"},
    )

    harrastustoiminta_muu, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, muu",
        defaults={
            "name_fi": "Harrastustoiminta, muu",
            "name_en": "Hobby or leisure activities, other",
            "name_sv": "Hobby, annat",
        },
    )
    harrastustoiminta_liikunta, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, tanssi ja liikunta",
        defaults={
            "name_fi": "Harrastustoiminta, tanssi ja liikunta",
            "name_en": "Hobby / leisure activities, dance or sports",
            "name_sv": "Hobby, dans eller träning",
        },
    )
    harrastustoiminta_musiikki, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, bändi ja musiikki",
        defaults={
            "name_fi": "Harrastustoiminta, bändi ja musiikki",
            "name_en": "Hobby or leisure activities, band activities or music",
            "name_sv": "Hobby, band eller musik",
        },
    )

    ikaryhma_9_12, _ = AgeGroup.objects.get_or_create(minimum=9, maximum=12)
    ikaryhma_29_64, _ = AgeGroup.objects.get_or_create(minimum=29, maximum=64)

    # ------------------------------------------------------------------------------------------------------------
    # Unit and unit group
    # ------------------------------------------------------------------------------------------------------------

    # A reset keeps the unit, so the unit roles and unit groups that include it don't lose it.
    # No TPREK id, so that the nightly TPREK update leaves it alone. The address is Harakka's.
    unit, _ = Unit.objects.update_or_create(
        name=MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME,
        defaults={
            "description": (
                "Maksullisten kausivarausten ja tilahierarkian manuaalitestaukseen. "
                "Haku päättynyt, hakemukset odottavat käsittelyä"
            ),
            "tprek_id": None,
            "tprek_department_id": None,
            "address_street": "Harakka",
            "address_zip": "00140",
            "address_city": "Helsinki",
            "allow_permissions_from_ad_groups": False,
            "coordinates": Point(x=2778530.371378948912024, y=8433140.38941946811974),
            "origin_hauki_resource": None,
            "payment_merchant": None,
            "payment_accounting": None,
        },
    )

    # The customer groups and the shared pricing groups belong to the unit group.
    # A reset keeps it too, so the unit roles that include it don't lose it.
    unit_group, _ = UnitGroup.objects.update_or_create(
        name=MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME,
        defaults={
            "name_en": f"{MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME} EN",
            "name_sv": f"{MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME} SV",
        },
    )
    unit_group.units.add(unit)

    # ------------------------------------------------------------------------------------------------------------
    # Prices
    # ------------------------------------------------------------------------------------------------------------

    aikuiset = PriceOption.objects.create(
        name="Aikuiset",
        name_fi="Aikuiset",
        name_en="Adults",
        name_sv="Vuxna",
        description="Yli 20-vuotiaat",
        description_fi="Yli 20-vuotiaat",
        description_en="Over 20 years old",
        description_sv="Över 20 år",
        unit_group=unit_group,
    )
    juniorit = PriceOption.objects.create(
        name="Juniorit",
        name_fi="Juniorit",
        name_en="Juniors",
        name_sv="Juniorer",
        description="Alle 20-vuotiaat",
        description_fi="Alle 20-vuotiaat",
        description_en="Under 20 years old",
        description_sv="Under 20 år",
        unit_group=unit_group,
    )

    # Shared by the whole hall and the event package.
    liikuntahalli_hintaryhma = PricingGroup.objects.create(
        name="MAKSULLINEN KÄSITTELY hintaryhmä Liikuntahalli, koko (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY hintaryhmä Liikuntahalli, koko (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY hintaryhmä Liikuntahalli, koko (MANUAALITESTAUS) SV",
        unit_group=unit_group,
    )
    PriceComponent.objects.create(
        pricing_group=liikuntahalli_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=None,
        price_option=aikuiset,
        amount=Decimal(40),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=alennettu_verotaso,
        sales_item=None,
    )
    PriceComponent.objects.create(
        pricing_group=liikuntahalli_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=None,
        price_option=juniorit,
        amount=Decimal(20),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=alennettu_verotaso,
        sales_item=None,
    )

    # Shared by the two halves of the hall. Free for juniors, so one application can have free and paid sections.
    osa_hintaryhma = PricingGroup.objects.create(
        name="MAKSULLINEN KÄSITTELY hintaryhmä Liikuntahalli, osa (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY hintaryhmä Liikuntahalli, osa (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY hintaryhmä Liikuntahalli, osa (MANUAALITESTAUS) SV",
        unit_group=unit_group,
    )
    PriceComponent.objects.create(
        pricing_group=osa_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=None,
        price_option=aikuiset,
        amount=Decimal(20),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=alennettu_verotaso,
        sales_item=None,
    )
    PriceComponent.objects.create(
        pricing_group=osa_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=None,
        price_option=juniorit,
        amount=Decimal(0),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=alennettu_verotaso,
        sales_item=None,
    )

    # One price without a customer group, so both customer groups of the unit group pay it.
    kokoustilat_hintaryhma = PricingGroup.objects.create(
        name="MAKSULLINEN KÄSITTELY hintaryhmä Kokous- ja ryhmätilat (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY hintaryhmä Kokous- ja ryhmätilat (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY hintaryhmä Kokous- ja ryhmätilat (MANUAALITESTAUS) SV",
        unit_group=unit_group,
    )
    PriceComponent.objects.create(
        pricing_group=kokoustilat_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=None,
        price_option=None,
        amount=Decimal(8),
        price_unit=PriceUnit.PER_30_MINS,
        can_apply_for_discount=False,
        tax_level=yleinen_verotaso,
        sales_item=None,
    )

    # The prices change during the reservation period, so the reservations before and after the change differ.
    studio_price_change_date = reservation_period_begin_date + datetime.timedelta(days=45)
    studio_hintaryhma = PricingGroup.objects.create(
        name="MAKSULLINEN KÄSITTELY hintaryhmä Studio (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY hintaryhmä Studio (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY hintaryhmä Studio (MANUAALITESTAUS) SV",
        unit_group=unit_group,
    )
    PriceComponent.objects.create(
        pricing_group=studio_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=studio_price_change_date,
        price_option=aikuiset,
        amount=Decimal(25),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=yleinen_verotaso,
        sales_item=None,
    )
    PriceComponent.objects.create(
        pricing_group=studio_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=studio_price_change_date,
        valid_until=None,
        price_option=aikuiset,
        amount=Decimal(30),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=yleinen_verotaso,
        sales_item=None,
    )
    PriceComponent.objects.create(
        pricing_group=studio_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=local_date(2025, 6, 12),
        valid_until=studio_price_change_date,
        price_option=juniorit,
        amount=Decimal(12),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=yleinen_verotaso,
        sales_item=None,
    )
    PriceComponent.objects.create(
        pricing_group=studio_hintaryhma,
        kind=PriceComponentKind.BASE,
        valid_from=studio_price_change_date,
        valid_until=None,
        price_option=juniorit,
        amount=Decimal(15),
        price_unit=PriceUnit.PER_HOUR,
        can_apply_for_discount=False,
        tax_level=yleinen_verotaso,
        sales_item=None,
    )

    # ------------------------------------------------------------------------------------------------------------
    # Reservation units
    # ------------------------------------------------------------------------------------------------------------

    liikuntahalli = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="9346523b-548f-4467-84fd-e861e59f6090",
        #
        # Strings
        name="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, koko (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, koko (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, koko (MANUAALITESTAUS) SV",
        description=(
            "Koko liikuntahalli. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "A-osan, B-osan tai tapahtumapaketin varaus estää koko hallin samaan aikaan."
        ),
        description_en=(
            "Koko liikuntahalli. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "A-osan, B-osan tai tapahtumapaketin varaus estää koko hallin samaan aikaan. EN"
        ),
        description_sv=(
            "Koko liikuntahalli. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "A-osan, B-osan tai tapahtumapaketin varaus estää koko hallin samaan aikaan. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=800,
        min_persons=1,
        max_persons=120,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    liikuntahalli_space = Space.objects.create(
        name="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, koko (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, koko (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, koko (MANUAALITESTAUS) SV",
        surface_area=800,
        max_persons=120,
        unit=unit,
    )
    liikuntahalli.spaces.set([
        liikuntahalli_space,
    ])
    liikuntahalli.intended_uses.set([
        liiku_ja_rentoudu_tarkoitus,
        harrasta_yhdessa_tarkoitus,
    ])
    liikuntahalli.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=liikuntahalli,
        pricing_group=liikuntahalli_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=liikuntahalli,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    liikuntahalli_a_osa = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="17ed4125-88e0-48b2-8b19-8b972f23975d",
        #
        # Strings
        name="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS) SV",
        description=(
            "Liikuntahallin A-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. B-osan varaus ei estä."
        ),
        description_en=(
            "Liikuntahallin A-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. B-osan varaus ei estä. EN"
        ),
        description_sv=(
            "Liikuntahallin A-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. B-osan varaus ei estä. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=400,
        min_persons=1,
        max_persons=60,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    # The halves are spaces inside the hall, so a reservation of either half blocks the hall, and the other way round.
    liikuntahalli_a_osa_space = Space.objects.create(
        name="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, A-osa (MANUAALITESTAUS) SV",
        surface_area=400,
        max_persons=60,
        parent=liikuntahalli_space,
        unit=unit,
    )
    liikuntahalli_a_osa.spaces.set([
        liikuntahalli_a_osa_space,
    ])
    liikuntahalli_a_osa.intended_uses.set([
        liiku_ja_rentoudu_tarkoitus,
        harrasta_yhdessa_tarkoitus,
    ])
    liikuntahalli_a_osa.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=liikuntahalli_a_osa,
        pricing_group=osa_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=liikuntahalli_a_osa,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    liikuntahalli_b_osa = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="bcbdcf70-3f65-40a5-bfcf-52337ef33260",
        #
        # Strings
        name="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS) SV",
        description=(
            "Liikuntahallin B-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. A-osan varaus ei estä."
        ),
        description_en=(
            "Liikuntahallin B-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. A-osan varaus ei estä. EN"
        ),
        description_sv=(
            "Liikuntahallin B-osa. Varattavissa ma-pe klo 8-22 ja la-su klo 9-18. "
            "Aikuiset 20 €/h, juniorit maksutta. "
            "Koko hallin tai tapahtumapaketin varaus estää tämän osan. A-osan varaus ei estä. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=400,
        min_persons=1,
        max_persons=60,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    liikuntahalli_b_osa_space = Space.objects.create(
        name="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Liikuntahalli, B-osa (MANUAALITESTAUS) SV",
        surface_area=400,
        max_persons=60,
        parent=liikuntahalli_space,
        unit=unit,
    )
    liikuntahalli_b_osa.spaces.set([
        liikuntahalli_b_osa_space,
    ])
    liikuntahalli_b_osa.intended_uses.set([
        liiku_ja_rentoudu_tarkoitus,
        harrasta_yhdessa_tarkoitus,
    ])
    liikuntahalli_b_osa.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=liikuntahalli_b_osa,
        pricing_group=osa_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=liikuntahalli_b_osa,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    kokoushuone = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="e0b28b9a-df6a-46fd-b579-ad7d5a231b8d",
        #
        # Strings
        name="MAKSULLINEN KÄSITTELY yksikkö Kokoushuone (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Kokoushuone (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Kokoushuone (MANUAALITESTAUS) SV",
        description=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen ryhmätilan kanssa, "
            "joten ryhmätilan varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus estää myös."
        ),
        description_en=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen ryhmätilan kanssa, "
            "joten ryhmätilan varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus estää myös. EN"
        ),
        description_sv=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen ryhmätilan kanssa, "
            "joten ryhmätilan varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus estää myös. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=40,
        min_persons=1,
        max_persons=20,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    kokoushuone_space = Space.objects.create(
        name="MAKSULLINEN KÄSITTELY yksikkö Kokoushuone (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Kokoushuone (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Kokoushuone (MANUAALITESTAUS) SV",
        surface_area=40,
        max_persons=20,
        unit=unit,
    )
    # Kept in the meeting room and used in the group room too, so a reservation of either room blocks the other.
    videotykki = Resource.objects.create(
        name="MAKSULLINEN KÄSITTELY videotykki (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY videotykki (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY videotykki (MANUAALITESTAUS) SV",
        location_type=ResourceLocationType.MOVABLE,
        space=kokoushuone_space,
    )
    kokoushuone.spaces.set([
        kokoushuone_space,
    ])
    kokoushuone.resources.set([
        videotykki,
    ])
    kokoushuone.intended_uses.set([
        pida_kokous_tarkoitus,
        yksin_tai_ryhma_tarkoitus,
    ])
    kokoushuone.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=kokoushuone,
        pricing_group=kokoustilat_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=kokoushuone,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    ryhmatila = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="7477bd10-d6f3-41d5-b316-9f65ae2db0f7",
        #
        # Strings
        name="MAKSULLINEN KÄSITTELY yksikkö Ryhmätila (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Ryhmätila (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Ryhmätila (MANUAALITESTAUS) SV",
        description=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen kokoushuoneen kanssa, "
            "joten kokoushuoneen varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus ei estä."
        ),
        description_en=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen kokoushuoneen kanssa, "
            "joten kokoushuoneen varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus ei estä. EN"
        ),
        description_sv=(
            "Varattavissa ma-pe klo 8-20. Suljettu la-su. Videotykki on yhteinen kokoushuoneen kanssa, "
            "joten kokoushuoneen varaus estää tämän tilan samaan aikaan. Tapahtumapaketin varaus ei estä. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=25,
        min_persons=1,
        max_persons=12,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    ryhmatila_space = Space.objects.create(
        name="MAKSULLINEN KÄSITTELY yksikkö Ryhmätila (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Ryhmätila (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Ryhmätila (MANUAALITESTAUS) SV",
        surface_area=25,
        max_persons=12,
        unit=unit,
    )
    ryhmatila.spaces.set([
        ryhmatila_space,
    ])
    ryhmatila.resources.set([
        videotykki,
    ])
    ryhmatila.intended_uses.set([
        pida_kokous_tarkoitus,
        yksin_tai_ryhma_tarkoitus,
    ])
    ryhmatila.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=ryhmatila,
        pricing_group=kokoustilat_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=ryhmatila,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    studio = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="1c65091a-454d-4326-bd41-c14d64c7a24c",
        #
        # Strings
        name="MAKSULLINEN KÄSITTELY yksikkö Studio (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Studio (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Studio (MANUAALITESTAUS) SV",
        description="Varattavissa joka päivä klo 12-22. Muiden tilojen varaukset eivät estä tätä tilaa.",
        description_en="Varattavissa joka päivä klo 12-22. Muiden tilojen varaukset eivät estä tätä tilaa. EN",
        description_sv="Varattavissa joka päivä klo 12-22. Muiden tilojen varaukset eivät estä tätä tilaa. SV",
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=20,
        min_persons=1,
        max_persons=8,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    studio_space = Space.objects.create(
        name="MAKSULLINEN KÄSITTELY yksikkö Studio (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Studio (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Studio (MANUAALITESTAUS) SV",
        surface_area=20,
        max_persons=8,
        unit=unit,
    )
    studio.spaces.set([
        studio_space,
    ])
    studio.intended_uses.set([
        tee_musiikkia_tarkoitus,
        kayta_laitteita_tarkoitus,
    ])
    studio.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=studio,
        pricing_group=studio_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=studio,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    tapahtumapaketti = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="b6af18b9-66e6-475f-95ac-5a569b050dd4",
        #
        # Strings
        name="MAKSULLINEN KÄSITTELY yksikkö Tapahtumapaketti (MANUAALITESTAUS)",
        name_en="MAKSULLINEN KÄSITTELY yksikkö Tapahtumapaketti (MANUAALITESTAUS) EN",
        name_sv="MAKSULLINEN KÄSITTELY yksikkö Tapahtumapaketti (MANUAALITESTAUS) SV",
        description=(
            "Koko liikuntahalli ja kokoushuone samalla varauksella. Varattavissa ma-pe klo 8-20. Suljettu la-su. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "Koko hallin, A-osan, B-osan tai kokoushuoneen varaus estää tämän samaan aikaan. "
            "Ryhmätilan varaus ei estä."
        ),
        description_en=(
            "Koko liikuntahalli ja kokoushuone samalla varauksella. Varattavissa ma-pe klo 8-20. Suljettu la-su. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "Koko hallin, A-osan, B-osan tai kokoushuoneen varaus estää tämän samaan aikaan. "
            "Ryhmätilan varaus ei estä. EN"
        ),
        description_sv=(
            "Koko liikuntahalli ja kokoushuone samalla varauksella. Varattavissa ma-pe klo 8-20. Suljettu la-su. "
            "Aikuiset 40 €/h, juniorit 20 €/h. "
            "Koko hallin, A-osan, B-osan tai kokoushuoneen varaus estää tämän samaan aikaan. "
            "Ryhmätilan varaus ei estä. SV"
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=840,
        min_persons=1,
        max_persons=140,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        payment_type=PaymentType.ON_SITE,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=unit,
        origin_hauki_resource=None,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    # Uses the spaces of the whole hall and the meeting room, so a reservation of the hall, either half or the
    # meeting room blocks the package, and the other way round. The package has no projector, so the group room
    # doesn't block it.
    tapahtumapaketti.spaces.set([
        liikuntahalli_space,
        kokoushuone_space,
    ])
    tapahtumapaketti.intended_uses.set([
        liiku_ja_rentoudu_tarkoitus,
        harrasta_yhdessa_tarkoitus,
        pida_kokous_tarkoitus,
    ])
    tapahtumapaketti.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    ReservationUnitPricingGroup.objects.create(
        reservation_unit=tapahtumapaketti,
        pricing_group=liikuntahalli_hintaryhma,
        begins=local_date(2025, 6, 12),
    )
    ReservationUnitAccessType.objects.create(
        reservation_unit=tapahtumapaketti,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )

    # ------------------------------------------------------------------------------------------------------------
    # Reservable times of the reservation units in application rounds
    # ------------------------------------------------------------------------------------------------------------

    hall_weekday_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=reservation_unit,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="08:00:00", end="22:00:00")],
        )
        for reservation_unit in [liikuntahalli, liikuntahalli_a_osa, liikuntahalli_b_osa]
        for weekday in [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY]
    ]
    hall_weekend_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=reservation_unit,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="09:00:00", end="18:00:00")],
        )
        for reservation_unit in [liikuntahalli, liikuntahalli_a_osa, liikuntahalli_b_osa]
        for weekday in [Weekday.SATURDAY, Weekday.SUNDAY]
    ]
    # The event package needs the meeting room too, so it has the rooms' times.
    room_weekday_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=reservation_unit,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="08:00:00", end="20:00:00")],
        )
        for reservation_unit in [kokoushuone, ryhmatila, tapahtumapaketti]
        for weekday in [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY]
    ]
    room_weekend_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=reservation_unit,
            weekday=weekday,
            is_closed=True,
            reservable_times=[],
        )
        for reservation_unit in [kokoushuone, ryhmatila, tapahtumapaketti]
        for weekday in [Weekday.SATURDAY, Weekday.SUNDAY]
    ]
    studio_time_slots = [
        ApplicationRoundTimeSlot(
            reservation_unit=studio,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="12:00:00", end="22:00:00")],
        )
        for weekday in Weekday  # type: ignore[attr-defined]
    ]
    ApplicationRoundTimeSlot.objects.bulk_create([
        *hall_weekday_time_slots,
        *hall_weekend_time_slots,
        *room_weekday_time_slots,
        *room_weekend_time_slots,
        *studio_time_slots,
    ])

    # ------------------------------------------------------------------------------------------------------------
    # Application round
    # ------------------------------------------------------------------------------------------------------------

    application_round = ApplicationRound.objects.create(
        name=MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME,
        name_en=f"{MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME} EN",
        name_sv=f"{MANUAL_TEST_PAID_ROUND_IN_ALLOCATION_NAME} SV",
        criteria="Hakukriteerit (suomeksi)",
        criteria_en="Hakukriteerit (englanniksi)",
        criteria_sv="Hakukriteerit (ruotsiksi)",
        notes_when_applying="Huomioi hakiessa (Suomeksi)",
        notes_when_applying_en="Huomioi hakiessa (Englanniksi)",
        notes_when_applying_sv="Huomioi hakiessa (Ruotsiksi)",
        application_period_begins_at=local_add_days(now, days=-30),
        application_period_ends_at=local_add_days(now, days=-1),
        reservation_period_begin_date=reservation_period_begin_date,
        reservation_period_end_date=reservation_period_end_date,
        public_display_begins_at=local_add_days(now, days=-30),
        public_display_ends_at=local_add_days(now, days=1827),
        handled_at=None,
        sent_at=None,
        application_form=ApplicationFormType.DEFAULT_FORM,
        terms_of_use=nupa_kausivarausehto,
    )
    application_round.purposes.set([
        harrastustoiminta_muu,
        harrastustoiminta_liikunta,
        harrastustoiminta_musiikki,
    ])
    application_round.reservation_units.set([
        liikuntahalli,
        liikuntahalli_a_osa,
        liikuntahalli_b_osa,
        kokoushuone,
        ryhmatila,
        studio,
        tapahtumapaketti,
    ])

    # ------------------------------------------------------------------------------------------------------------
    # Applicants
    # ------------------------------------------------------------------------------------------------------------

    # Made-up people, with an unusable password and no Helsinki profile.
    # Their addresses are in the 'example.com' domain, so no email reaches a real person.
    unusable_password = make_password(password=None)

    iiris, _ = User.objects.update_or_create(
        username="manuaalitestaus-hakija-1",
        defaults={
            "first_name": "Iiris",
            "last_name": "Manuaalitestaaja",
            "email": "iiris.manuaalitestaaja@example.com",
            "password": unusable_password,
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "date_of_birth": local_date(1985, 3, 1),
        },
    )
    pirkko, _ = User.objects.update_or_create(
        username="manuaalitestaus-hakija-2",
        defaults={
            "first_name": "Pirkko",
            "last_name": "Manuaalitestaaja",
            "email": "pirkko.manuaalitestaaja@example.com",
            "password": unusable_password,
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "date_of_birth": local_date(1975, 6, 1),
        },
    )
    tuomas, _ = User.objects.update_or_create(
        username="manuaalitestaus-hakija-3",
        defaults={
            "first_name": "Tuomas",
            "last_name": "Manuaalitestaaja",
            "email": "tuomas.manuaalitestaaja@example.com",
            "password": unusable_password,
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "date_of_birth": local_date(1990, 9, 1),
        },
    )

    # ------------------------------------------------------------------------------------------------------------
    # Applications
    # ------------------------------------------------------------------------------------------------------------

    # Sent during the application period. The "in allocation" email is marked as sent,
    # so that the daily email task does not send it.
    sent_at = local_add_days(now, days=-10)

    individual_application = Application.objects.create(
        application_round=application_round,
        user=iiris,
        applicant_type=ReserveeType.INDIVIDUAL,
        sent_at=sent_at,
        in_allocation_notification_sent_at=now,
        contact_person_first_name="Iiris",
        contact_person_last_name="Manuaalitestaaja",
        contact_person_email="iiris.manuaalitestaaja@example.com",
        contact_person_phone_number="+358 40 0000001",
        billing_street_address="Testikatu 1",
        billing_post_code="00100",
        billing_city="Helsinki",
        municipality=MunicipalityChoice.HELSINKI,
    )
    nonprofit_application = Application.objects.create(
        application_round=application_round,
        user=pirkko,
        applicant_type=ReserveeType.NONPROFIT,
        additional_information="Toivomme samoja vuoroja koko kaudeksi.",
        sent_at=sent_at,
        in_allocation_notification_sent_at=now,
        contact_person_first_name="Pirkko",
        contact_person_last_name="Manuaalitestaaja",
        contact_person_email="pirkko.manuaalitestaaja@example.com",
        contact_person_phone_number="+358 40 0000002",
        organisation_name="Manuaalitestauksen urheiluseura ry",
        organisation_core_business="Juniori- ja aikuisliikunta",
        organisation_year_established=1985,
        organisation_street_address="Testikatu 2",
        organisation_post_code="00100",
        organisation_city="Helsinki",
        municipality=MunicipalityChoice.HELSINKI,
    )
    company_application = Application.objects.create(
        application_round=application_round,
        user=tuomas,
        applicant_type=ReserveeType.COMPANY,
        sent_at=sent_at,
        in_allocation_notification_sent_at=now,
        contact_person_first_name="Tuomas",
        contact_person_last_name="Manuaalitestaaja",
        contact_person_email="tuomas.manuaalitestaaja@example.com",
        contact_person_phone_number="+358 40 0000003",
        organisation_name="Manuaalitestaus Oy",
        organisation_core_business="Ohjelmistotestaus",
        organisation_identifier="0000000-0",
        organisation_street_address="Testikatu 3",
        organisation_post_code="00100",
        organisation_city="Helsinki",
    )

    # ------------------------------------------------------------------------------------------------------------
    # Application sections
    # ------------------------------------------------------------------------------------------------------------

    # The sections want linked reservation units at overlapping times, so an allocation of one can block another.
    salibandy_aikuiset = ApplicationSection.objects.create(
        application=nonprofit_application,
        name="Salibandy, aikuiset",
        num_persons=16,
        reservations_begin_date=reservation_period_begin_date,
        reservations_end_date=reservation_period_end_date,
        reservation_min_duration=datetime.timedelta(hours=2),
        reservation_max_duration=datetime.timedelta(hours=2),
        applied_reservations_per_week=2,
        purpose=harrastustoiminta_liikunta,
        age_group=ikaryhma_29_64,
        price_option=aikuiset,
    )
    salibandy_juniorit = ApplicationSection.objects.create(
        application=nonprofit_application,
        name="Salibandy, juniorit",
        num_persons=14,
        reservations_begin_date=reservation_period_begin_date,
        reservations_end_date=reservation_period_end_date,
        reservation_min_duration=datetime.timedelta(hours=1, minutes=30),
        reservation_max_duration=datetime.timedelta(hours=2),
        applied_reservations_per_week=2,
        purpose=harrastustoiminta_liikunta,
        age_group=ikaryhma_9_12,
        price_option=juniorit,
    )
    sahlyvuoro = ApplicationSection.objects.create(
        application=company_application,
        name="Henkilöstön sählyvuoro",
        num_persons=10,
        reservations_begin_date=reservation_period_begin_date,
        reservations_end_date=reservation_period_end_date,
        reservation_min_duration=datetime.timedelta(hours=1),
        reservation_max_duration=datetime.timedelta(hours=1),
        applied_reservations_per_week=1,
        purpose=harrastustoiminta_liikunta,
        age_group=ikaryhma_29_64,
        price_option=aikuiset,
    )
    lasten_kuoro = ApplicationSection.objects.create(
        application=individual_application,
        name="Lasten kuoro",
        num_persons=8,
        reservations_begin_date=reservation_period_begin_date,
        reservations_end_date=reservation_period_end_date,
        reservation_min_duration=datetime.timedelta(hours=2),
        reservation_max_duration=datetime.timedelta(hours=2),
        applied_reservations_per_week=1,
        purpose=harrastustoiminta_musiikki,
        age_group=ikaryhma_9_12,
        price_option=juniorit,
    )
    tiimipalaverit = ApplicationSection.objects.create(
        application=company_application,
        name="Tiimipalaverit",
        num_persons=6,
        reservations_begin_date=reservation_period_begin_date,
        reservations_end_date=reservation_period_end_date,
        reservation_min_duration=datetime.timedelta(hours=1, minutes=30),
        reservation_max_duration=datetime.timedelta(hours=1, minutes=30),
        applied_reservations_per_week=1,
        purpose=harrastustoiminta_muu,
        age_group=ikaryhma_29_64,
        price_option=aikuiset,
    )
    virkistysilta = ApplicationSection.objects.create(
        application=company_application,
        name="Henkilöstön virkistysilta",
        num_persons=40,
        reservations_begin_date=reservation_period_begin_date,
        reservations_end_date=reservation_period_end_date,
        reservation_min_duration=datetime.timedelta(hours=2),
        reservation_max_duration=datetime.timedelta(hours=2),
        applied_reservations_per_week=1,
        purpose=harrastustoiminta_muu,
        age_group=ikaryhma_29_64,
        price_option=aikuiset,
    )

    ReservationUnitOption.objects.bulk_create([
        ReservationUnitOption(
            application_section=salibandy_aikuiset,
            reservation_unit=liikuntahalli,
            preferred_order=0,
        ),
        ReservationUnitOption(
            application_section=salibandy_juniorit,
            reservation_unit=liikuntahalli_a_osa,
            preferred_order=0,
        ),
        ReservationUnitOption(
            application_section=salibandy_juniorit,
            reservation_unit=liikuntahalli_b_osa,
            preferred_order=1,
        ),
        ReservationUnitOption(application_section=sahlyvuoro, reservation_unit=liikuntahalli_b_osa, preferred_order=0),
        ReservationUnitOption(application_section=lasten_kuoro, reservation_unit=kokoushuone, preferred_order=0),
        ReservationUnitOption(application_section=lasten_kuoro, reservation_unit=studio, preferred_order=1),
        ReservationUnitOption(application_section=tiimipalaverit, reservation_unit=ryhmatila, preferred_order=0),
        ReservationUnitOption(
            application_section=virkistysilta,
            reservation_unit=tapahtumapaketti,
            preferred_order=0,
        ),
    ])

    # Each time range fits inside the reservable times of the section's reservation units,
    # like the ranges of an application that is sent in the customer UI.
    salibandy_aikuiset_primary_ranges = [
        SuitableTimeRange(
            application_section=salibandy_aikuiset,
            priority=Priority.PRIMARY,
            day_of_the_week=weekday,
            begin_time=datetime.time(18, 0),
            end_time=datetime.time(20, 0),
        )
        for weekday in [Weekday.MONDAY, Weekday.WEDNESDAY]
    ]
    salibandy_juniorit_primary_ranges = [
        SuitableTimeRange(
            application_section=salibandy_juniorit,
            priority=Priority.PRIMARY,
            day_of_the_week=weekday,
            begin_time=datetime.time(17, 0),
            end_time=datetime.time(19, 0),
        )
        for weekday in [Weekday.MONDAY, Weekday.WEDNESDAY]
    ]
    salibandy_juniorit_secondary_ranges = [
        SuitableTimeRange(
            application_section=salibandy_juniorit,
            priority=Priority.SECONDARY,
            day_of_the_week=weekday,
            begin_time=datetime.time(17, 0),
            end_time=datetime.time(19, 0),
        )
        for weekday in [Weekday.THURSDAY, Weekday.FRIDAY]
    ]
    SuitableTimeRange.objects.bulk_create([
        *salibandy_aikuiset_primary_ranges,
        SuitableTimeRange(
            application_section=salibandy_aikuiset,
            priority=Priority.SECONDARY,
            day_of_the_week=Weekday.THURSDAY,
            begin_time=datetime.time(19, 0),
            end_time=datetime.time(21, 0),
        ),
        *salibandy_juniorit_primary_ranges,
        *salibandy_juniorit_secondary_ranges,
        SuitableTimeRange(
            application_section=sahlyvuoro,
            priority=Priority.PRIMARY,
            day_of_the_week=Weekday.MONDAY,
            begin_time=datetime.time(18, 0),
            end_time=datetime.time(20, 0),
        ),
        SuitableTimeRange(
            application_section=sahlyvuoro,
            priority=Priority.SECONDARY,
            day_of_the_week=Weekday.TUESDAY,
            begin_time=datetime.time(17, 0),
            end_time=datetime.time(19, 0),
        ),
        SuitableTimeRange(
            application_section=lasten_kuoro,
            priority=Priority.PRIMARY,
            day_of_the_week=Weekday.TUESDAY,
            begin_time=datetime.time(18, 0),
            end_time=datetime.time(20, 0),
        ),
        SuitableTimeRange(
            application_section=lasten_kuoro,
            priority=Priority.SECONDARY,
            day_of_the_week=Weekday.THURSDAY,
            begin_time=datetime.time(18, 0),
            end_time=datetime.time(20, 0),
        ),
        SuitableTimeRange(
            application_section=tiimipalaverit,
            priority=Priority.PRIMARY,
            day_of_the_week=Weekday.TUESDAY,
            begin_time=datetime.time(18, 0),
            end_time=datetime.time(20, 0),
        ),
        SuitableTimeRange(
            application_section=tiimipalaverit,
            priority=Priority.SECONDARY,
            day_of_the_week=Weekday.THURSDAY,
            begin_time=datetime.time(9, 0),
            end_time=datetime.time(12, 0),
        ),
        SuitableTimeRange(
            application_section=virkistysilta,
            priority=Priority.PRIMARY,
            day_of_the_week=Weekday.THURSDAY,
            begin_time=datetime.time(18, 0),
            end_time=datetime.time(20, 0),
        ),
        SuitableTimeRange(
            application_section=virkistysilta,
            priority=Priority.SECONDARY,
            day_of_the_week=Weekday.TUESDAY,
            begin_time=datetime.time(18, 0),
            end_time=datetime.time(20, 0),
        ),
    ])

    # ------------------------------------------------------------------------------------------------------------
    # Closed times
    # ------------------------------------------------------------------------------------------------------------

    # Closed by a made-up handler on the first Monday at least two weeks into the reservation period, and on the day
    # after. When the round is marked handled, the series in the linked reservation units get no reservation then.
    handler, _ = User.objects.update_or_create(
        username="manuaalitestaus-kasittelija",
        defaults={
            "first_name": "Kaisa",
            "last_name": "Käsittelijä",
            "email": "kaisa.kasittelija@example.com",
            "password": unusable_password,
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
        },
    )
    closed_monday = next_date_matching_weekday(
        reservation_period_begin_date + datetime.timedelta(days=14), Weekday.MONDAY
    )
    closed_tuesday = closed_monday + datetime.timedelta(days=1)

    Reservation.objects.create(
        user=handler,
        reservation_unit=liikuntahalli_a_osa,
        begins_at=local_combine(closed_monday, datetime.time(18, 0)),
        ends_at=local_combine(closed_monday, datetime.time(20, 0)),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        working_memo="Tähän aikaan ei tehdä kausivarauksia A-osaan, koko halliin eikä tapahtumapakettiin.",
        handled_at=now,
        confirmed_at=now,
    )
    Reservation.objects.create(
        user=handler,
        reservation_unit=kokoushuone,
        begins_at=local_combine(closed_tuesday, datetime.time(18, 0)),
        ends_at=local_combine(closed_tuesday, datetime.time(19, 0)),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        working_memo="Tähän aikaan ei tehdä kausivarauksia kokoushuoneeseen, ryhmätilaan eikä tapahtumapakettiin.",
        handled_at=now,
        confirmed_at=now,
    )

    return application_round
