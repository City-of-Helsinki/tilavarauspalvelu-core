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
    PriceUnit,
    Priority,
    ReservationFormType,
    ReservationKind,
    ReservationStartInterval,
    ReserveeType,
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
    PricingGroup,
    Reservation,
    ReservationPurpose,
    ReservationSeries,
    ReservationUnit,
    ReservationUnitAccessType,
    ReservationUnitCancellationRule,
    ReservationUnitHierarchy,
    ReservationUnitOption,
    ReservationUnitType,
    Space,
    SuitableTimeRange,
    TaxLevel,
    TaxLevelRate,
    TermsOfUse,
    Unit,
    User,
)
from tilavarauspalvelu.typing import TimeSlotDB
from utils.date_utils import local_add_days, local_date, local_date_of, local_datetime

# Each round's unit has the same name as the round.
MANUAL_TEST_OPEN_ROUND_NAME = "Kausivaraus manuaalitestaukseen (AVOINNA)"
MANUAL_TEST_ROUND_IN_ALLOCATION_NAME = "Kausivaraus manuaalitestaukseen (KÄSITTELYSSÄ)"


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


# Internals


def _remove_manual_test_round(*, name: str) -> None:
    reservation_units = ReservationUnit.objects.filter(unit__name_fi=name)
    reservation_unit_id_values = reservation_units.values("id")
    reservation_unit_ids = Subquery(reservation_unit_id_values)

    application_round = ApplicationRound.objects.filter(name_fi=name)
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

    spaces.delete()
    reservations.delete()
    series.delete()
    allocations.delete()
    options.delete()
    applications.delete()
    application_round.delete()
    reservation_units.delete()
    PricingGroup.objects.filter(id__in=own_pricing_group_ids).delete()


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
            "name_sv": "Meeting room",
            "name_en": "Möteslokal",
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
            "name_sv": "Meeting room",
            "name_en": "Möteslokal",
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
