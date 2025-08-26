from __future__ import annotations

import datetime
import os
import uuid
from contextlib import contextmanager
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Literal

from django.contrib.auth.hashers import make_password
from django.contrib.gis.geos import Point
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist, ValidationError
from django.core.management import BaseCommand
from django.db import models, transaction
from django.db.models import Subquery

from tilavarauspalvelu.enums import (
    AccessType,
    AuthenticationType,
    PaymentType,
    PriceUnit,
    ReservationFormType,
    ReservationKind,
    ReservationNotification,
    ReservationStartInterval,
    ReservationStateChoice,
    ReservationTypeChoice,
    Weekday,
)
from tilavarauspalvelu.models import (
    Application,
    ApplicationRound,
    Equipment,
    OriginHaukiResource,
    PaymentAccounting,
    Purpose,
    Reservation,
    ReservationMetadataSet,
    ReservationPurpose,
    ReservationSeries,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitType,
    Space,
    TaxPercentage,
    TermsOfUse,
    Unit,
    User,
)
from tilavarauspalvelu.typing import TimeSlotDB
from utils.date_utils import local_date, local_datetime

from tests.factories import (
    ApplicationRoundFactory,
    ApplicationRoundTimeSlotFactory,
    ReservationFactory,
    ReservationUnitFactory,
    UnitFactory,
)

if TYPE_CHECKING:
    from collections.abc import Generator

__all__ = [
    "create_robot_test_data",
]


class Command(BaseCommand):
    help = "Creates test data for robotframework tests."

    def handle(self, *args: Any, **options: Any) -> None:
        create_robot_test_data()


@contextmanager
def handle_model_object_errors() -> Generator[None]:
    try:
        yield

    except ObjectDoesNotExist as error:
        msg = f"Object does not exist: {error}"
        raise ValidationError(msg, code="object_does_not_exist") from error

    except MultipleObjectsReturned as error:
        msg = f"Multiple objects returned: {error}"
        raise ValidationError(msg, code="multiple_objects_returned") from error


@transaction.atomic()
@handle_model_object_errors()
def create_robot_test_data() -> None:
    if os.getenv("DJANGO_SETTINGS_ENVIRONMENT") == "Production":
        msg = "Hey! This is the production environment! Don't just try to generate test data! >:("
        raise ValidationError(msg, code="production_environment")

    remove_existing_data()
    create_users()
    create_reservation_units()
    create_application_rounds()
    create_past_reservations()


def remove_existing_data() -> None:
    try:
        harakka = Unit.objects.get(tprek_id="71677")

    # If Harakka doesn't exist, then none of the other entities should exist either.
    except Unit.DoesNotExist:
        return

    application_round = ApplicationRound.objects.filter(name="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA)")

    reservation_units = ReservationUnit.objects.filter(unit=harakka)
    spaces = Space.objects.filter(unit=harakka)

    sq = Subquery(reservation_units.values("id"))
    reservations = Reservation.objects.filter(reservation_unit__in=sq)
    series = ReservationSeries.objects.filter(reservation_unit__in=sq)
    applications = Application.objects.filter(
        models.Q(application_round__reservation_units__in=sq)
        | models.Q(application_round__name="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA)")
    )

    spaces.delete()
    reservations.delete()
    series.delete()
    applications.delete()
    application_round.delete()
    reservation_units.delete()
    harakka.delete()


def create_reservation_units() -> None:  # noqa: PLR0915
    # ------------------------------------------------------------------------------------------------------------
    # Fetch existing objects
    # ------------------------------------------------------------------------------------------------------------

    kokoustila = ReservationUnitType.objects.get(name="Kokoustila")

    lomake_1 = ReservationMetadataSet.objects.get(name="Lomake 1")
    lomake_2 = ReservationMetadataSet.objects.get(name="Lomake 2")
    lomake_3 = ReservationMetadataSet.objects.get(name="Lomake 3")
    lomake_3_maksuttomuus = ReservationMetadataSet.objects.get(name="Lomake 3 - maksuttomuuspyyntö sallittu")
    lomake_4_maksuttomuus = ReservationMetadataSet.objects.get(name="Lomake 4 - maksuttomuuspyyntö sallittu")

    peruutus_alkuun_asti = ReservationUnitCancellationRule.objects.get(name="Varauksen alkuun asti")
    peruutus_kaksi_viikkoa = ReservationUnitCancellationRule.objects.get(name="14 vrk ennen alkamista")

    maksuton_maksuehto = TermsOfUse.objects.get(id="pay0")
    verkkokauppa_vain_maksuehto = TermsOfUse.objects.get(id="pay1")
    verkkokauppa_alennus_maksuehto = TermsOfUse.objects.get(id="pay3")
    verkkokauppa_kasittely_maksuehto = TermsOfUse.objects.get(id="pay4")
    varauksen_alkuun_asti_peruutusehto = TermsOfUse.objects.get(id="cancel0days")
    alkuun_asti_ei_peruutusta_peruutusehto = TermsOfUse.objects.get(id="cancel0days_delayok")
    kaksi_viikkoa_peruutusehto = TermsOfUse.objects.get(id="cancel2weeks")
    laitteet_palveluehto = TermsOfUse.objects.get(id="KUVAlaite")
    maksulliset_palveluehto = TermsOfUse.objects.get(id="KUVA_oodi")
    nupa_palveluehto = TermsOfUse.objects.get(id="KUVA_nupa")
    maksuton_palveluehto = TermsOfUse.objects.get(id="KUVA_oodi_maksuton")
    kausi_palveluehto = TermsOfUse.objects.get(id="KUVA_nupakausi")
    nupa_hinnoitteluehto = TermsOfUse.objects.get(id="pricing_nupa")

    harrasta_yhdessa_tarkoitus = Purpose.objects.get(name="Harrasta yhdessä")
    jarjesta_tapahtuma_tarkoitus = Purpose.objects.get(name="Järjestä tapahtuma")
    kauta_laitteita_tarkoitus = Purpose.objects.get(name="Käytä laitteita")
    liiku_ja_rentoudu_tarkoitus = Purpose.objects.get(name="Liiku ja rentoudu")
    loyda_juhlatila_tarkoitus = Purpose.objects.get(name="Löydä juhlatila")
    pida_kokous_tarkoitus = Purpose.objects.get(name="Pidä kokous")
    tee_musiikkia_tarkoitus = Purpose.objects.get(name="Tee musiikkia tai äänitä")
    yksin_tai_ryhma_tarkoitus = Purpose.objects.get(name="Työskentele yksin tai ryhmässä")

    aani_laite = Equipment.objects.get(name="Äänitekniikka")
    astianpesukone_laite = Equipment.objects.get(name="Astianpesukone")
    astiasto_laite = Equipment.objects.get(name="Perusastiasto ja -keittiövälineet")
    biljardi_laite = Equipment.objects.get(name="Biljardipöytä")
    click_share_laite = Equipment.objects.get(name="ClickShare")
    esiintymislava_laite = Equipment.objects.get(name="Esiintymislava")
    hdmi_laite = Equipment.objects.get(name="HDMI")
    internet_laite = Equipment.objects.get(name="Muu internet-yhteys")
    istumapaikka_laite = Equipment.objects.get(name="Istumapaikkoja")
    jaakaappi_laite = Equipment.objects.get(name="Jääkaappi")
    jatkojohto_laite = Equipment.objects.get(name="Jatkojohto")
    kahvinkeitin_laite = Equipment.objects.get(name="Kahvinkeitin")
    liesi_laite = Equipment.objects.get(name="Liesi")
    liikuntavaline_laite = Equipment.objects.get(name="Liikuntavälineitä")
    mikro_laite = Equipment.objects.get(name="Mikroaaltouuni")
    naytto_laite = Equipment.objects.get(name="Näyttö")
    pakastin_laite = Equipment.objects.get(name="Pakastin")
    peiliseina_laite = Equipment.objects.get(name="Peiliseinä")
    piano_laite = Equipment.objects.get(name="Piano")
    poyta_laite = Equipment.objects.get(name="Pöytä tai pöytiä")
    rummut_laite = Equipment.objects.get(name="Sähkörummut")
    scart_laite = Equipment.objects.get(name="SCART")
    sohva_laite = Equipment.objects.get(name="Sohvaryhmä")
    studio_laite = Equipment.objects.get(name="Studiolaitteisto")
    tietokone_laite = Equipment.objects.get(name="Tietokone")
    uuni_laite = Equipment.objects.get(name="Uuni")
    valkotaulu_laite = Equipment.objects.get(name="Valkotaulu, tussitaulu")
    vedenkeitin_laite = Equipment.objects.get(name="Vedenkeitin")
    vesipiste_laite = Equipment.objects.get(name="Vesipiste")

    nolla_veroprosentti = TaxPercentage.objects.get(value=Decimal("0.0"))
    uusi_veroprosentti = TaxPercentage.objects.get(value=Decimal("25.5"))

    mankeli_hauki_resource = OriginHaukiResource.objects.get(id="2956668")
    aitio_hauki_resource = OriginHaukiResource.objects.get(id="2958620")
    kellarikerros_hauki_resource = OriginHaukiResource.objects.get(id="2956344")
    aula_hauki_resource = OriginHaukiResource.objects.get(id="2959295")
    parveke_hauki_resource = OriginHaukiResource.objects.get(id="2959623")
    malmi_hauki_resource = OriginHaukiResource.objects.get(id="2964786")
    keskusta_hauki_resource = OriginHaukiResource.objects.get(id="2964787")
    yrjo_hauki_resource = OriginHaukiResource.objects.get(id="2959579")
    kalevi_hauki_resource = OriginHaukiResource.objects.get(id="2959580")
    piitu_hauki_resource = OriginHaukiResource.objects.get(id="2959581")

    pihlajasarten_accounting = PaymentAccounting.objects.get(name="Pihlajasaarten testikirjasto")

    # ------------------------------------------------------------------------------------------------------------
    # HARAKKA
    # ------------------------------------------------------------------------------------------------------------

    harakka = UnitFactory.create(
        name="Harakka, piilokoju",
        description=(
            "Luonnonsuojelualueen laidalla sijaitsevassa piilokojussa on lintuopasteita ja istuinpenkkejä. "
            "Kojusta voi tarkkailla saaren pesimälinnustoa lähietäisyydeltä. Piilokoju ei ole esteetön."
        ),
        tprek_id="71677",
        tprek_department_id="db5dbae8-93bb-4248-bfe6-e237b59eec12",
        address_street="Harakka",
        address_zip="00140",
        address_city="Helsinki",
        allow_permissions_from_ad_groups=False,
        coordinates=Point(x=2778530.371378948912024, y=8433140.38941946811974),
        origin_hauki_resource__id="2952865",
        payment_merchant__id="c9acaa73-b582-471c-b002-b038a8c00fb1",
        payment_accounting=pihlajasarten_accounting,
    )

    # ------------------------------------------------------------------------------------------------------------
    # DESKTOP
    # ------------------------------------------------------------------------------------------------------------

    _maksuton_mankeli = ReservationUnitFactory.create(
        #
        # IDs
        ext_uuid="7bbd9b47-ad06-495a-a530-b094574208d6",
        #
        # Strings
        name="Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Maksuton Mankeli ENG (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_sv="Maksuton Mankeli SW (AUTOMAATIOTESTI ÄLÄ POISTA)",
        description=(
            "Käytä tätä varausyksikköä, kun haluan varata suorimman ja yksinkertaisimman prosessin mukaan. "
            "Varaaminen on maksutonta ja kaikki varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaikaa ei ole, joten varauksen voi perua sen alkuun asti. "
            "Käytössä yksinkertaisin lomake 1. "
            "Tämä varausyksikkö vastaa kirjaston laitteita."
            "\n"
            "Tämä on esimerkkitekstiä eikä liity varaukseen. "
            "Mankeli Bernina 1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa."
            "\n"
            "Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia ja muita perusompelutarvikkeita. "
            "Koneella ei voi ommella parkkinahkaa tai hyvin paksuja kankaita. "
            "Ilmoittaudu henkilökunnalle ennen varausaikasi alkamista. "
            "Ennen kuin saat laitteen käyttöösi, sinun on esitettävä kirjastokortti, "
            "jossa on voimassa oleva lainausoikeus."
            "\n"
            "Laitetta voi käyttää omaan luovaan toimintaan. "
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen tulonhankinta esimerkiksi "
            "myymällä kirjastossa tuotettuja tuotteita ei ole sallittua."
        ),
        description_sv=(
            "Käytä tätä varausyksikköä, kun haluan varata suorimman ja yksinkertaisimman prosessin mukaan. "
            "Varaaminen on maksutonta ja kaikki varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaikaa ei ole, joten varauksen voi perua sen alkuun asti. "
            "Käytössä yksinkertaisin lomake 1. "
            "Tämä varausyksikkö vastaa kirjaston laitteita."
            "\n"
            "Detta är en exempeltext och är inte relaterad till reservationen. "
            "Mankeli Bernina 1008 ligger i bibliotekets stadsverkstad på entréplan."
            "\n"
            "Biblioteket har svartvit tråd, knappnålar, saxar och andra grundläggande sömnadstillbehör. "
            "Maskinen kan inte sy läder eller mycket tjocka tyger. "
            "Rapportera till personalen innan din bokningstid börjar. "
            "Innan du kan använda enheten måste du visa upp ett lånekort med giltig lånerätt."
            "\n"
            "Du kan använda enheten för dina egna kreativa aktiviteter. "
            "Att göra beställningsverk mot ersättning eller yrkesmässig inkomstgenerering, "
            "till exempel genom att sälja produkter producerade i biblioteket, är inte tillåtet."
        ),
        description_en=(
            "Käytä tätä varausyksikköä, kun haluan varata suorimman ja yksinkertaisimman prosessin mukaan. "
            "Varaaminen on maksutonta ja kaikki varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaikaa ei ole, joten varauksen voi perua sen alkuun asti. "
            "Käytössä yksinkertaisin lomake 1. "
            "Tämä varausyksikkö vastaa kirjaston laitteita."
            "\n"
            "This is an example text and is not related to the reservation. "
            "Mankeli Bernina 1008 is located in the library's urban workshop on the entrance floor."
            "\n"
            "The library has black and white thread, button needles, scissors and other basic sewing supplies. "
            "The machine cannot sew leather or very thick fabrics. "
            "Report to the staff before the start of your reservation time. "
            "Before you can use the device, you must present a library card with a valid borrowing right."
            "\n"
            "You can use the device for your own creative activities. "
            "Making commissioned works for compensation or professional income generation, "
            "for example by selling products produced in the library, is not allowed."
        ),
        contact_information="",
        notes_when_applying="lisätiedot fi 123",
        notes_when_applying_en="lisätiedot eng 789",
        notes_when_applying_sv="lisätiedot sv 456",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi 123",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi 789",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi 456",
        reservation_confirmed_instructions="Hyväksytty varausvahvistuksen lisäohjeteksti suomeksi 123",
        reservation_confirmed_instructions_en="Hyväksytty varausvahvistuksen lisäohjeteksti englanniksi 789",
        reservation_confirmed_instructions_sv="Hyväksytty varausvahvistuksen lisäohjeteksti ruotsiksi 456",
        reservation_cancelled_instructions="Peruttu varausvahvistuksen lisäohjeteksti suomeksi 123",
        reservation_cancelled_instructions_en="Peruttu varausvahvistuksen lisäohjeteksti englanniksi 789",
        reservation_cancelled_instructions_sv="Peruttu varausvahvistuksen lisäohjeteksti ruotsiksi 456",
        #
        # Integers
        surface_area=100,
        min_persons=0,
        max_persons=1,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=2),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=mankeli_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_1,
        cancellation_terms=varauksen_alkuun_asti_peruutusehto,
        service_specific_terms=laitteet_palveluehto,
        pricing_terms=None,
        payment_terms=maksuton_maksuehto,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
        #
        # Many-to-Many related
        spaces__name="Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_en="Maksuton Mankeli ENG (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_sv="Maksuton Mankeli SW (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__surface_area=100,
        spaces__max_persons=1,
        spaces__unit=harakka,
        resources=[],
        purposes=[
            kauta_laitteita_tarkoitus,
        ],
        equipments=[
            click_share_laite,
        ],
        #
        # One-to-Many related
        pricings__begins=local_date(2023, 9, 25),
        pricings__price_unit=PriceUnit.PER_15_MINS,
        pricings__payment_type=None,
        pricings__is_activated_on_begins=False,
        pricings__lowest_price=0,
        pricings__highest_price=0,
        pricings__tax_percentage=nolla_veroprosentti,
        access_types__begin_date=local_date(2025, 6, 6),
        access_types__access_type=AccessType.UNRESTRICTED,
    )
    _aina_maksullinen_aitio = ReservationUnitFactory.create(
        #
        # IDs
        ext_uuid="f34b4c81-5b1b-4311-9f03-1c45e67ab45a",
        #
        # Strings
        name="Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA)EN",
        name_sv="Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA)SV",
        description=(
            "Käytä tätä varausyksikköä, kun haluan varata maksullisen tilan suorimman prosessin mukaan. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on varauksen alkuun asti. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 3. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. Oodin keittiötä, mutta peruutusaika on joustavampi."
            "\n"
            "Tämä on esimerkkitekstiä eikä liity varaukseen."
            "Mankeli Bernina 1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa."
            "\n"
            "Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia ja muita perusompelutarvikkeita."
            "Koneella ei voi ommella parkkinahkaa tai hyvin paksuja kankaita."
            "Ilmoittaudu henkilökunnalle ennen varausaikasi alkamista."
            "Ennen kuin saat laitteen käyttöösi, sinun on esitettävä kirjastokortti,"
            "jossa on voimassa oleva lainausoikeus."
            "\n"
            "Laitetta voi käyttää omaan luovaan toimintaan."
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen tulonhankinta esimerkiksi"
            "myymällä kirjastossa tuotettuja tuotteita ei ole sallittua."
        ),
        description_sv=(
            "Käytä tätä varausyksikköä, kun haluan varata maksullisen tilan suorimman prosessin mukaan. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on varauksen alkuun asti. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 3. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. Oodin keittiötä, mutta peruutusaika on joustavampi."
            "\n"
            "Detta är en exempeltext och är inte relaterad till reservationen."
            "Mankeli Bernina 1008 ligger i bibliotekets stadsverkstad på entréplan."
            "\n"
            "Biblioteket har svartvit tråd, knappnålar, saxar och andra grundläggande sömnadstillbehör."
            "Maskinen kan inte sy läder eller mycket tjocka tyger."
            "Rapportera till personalen innan din bokningstid börjar."
            "Innan du kan använda enheten måste du visa upp ett lånekort med giltig lånerätt."
            "\n"
            "Du kan använda enheten för dina egna kreativa aktiviteter."
            "Att göra beställningsverk mot ersättning eller yrkesmässig inkomstgenerering,"
            "till exempel genom att sälja produkter producerade i biblioteket, är inte tillåtet."
        ),
        description_en=(
            "Käytä tätä varausyksikköä, kun haluan varata maksullisen tilan suorimman prosessin mukaan. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on varauksen alkuun asti. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 3. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. Oodin keittiötä, mutta peruutusaika on joustavampi."
            "\n"
            "This is an example text and is not related to the reservation."
            "Mankeli Bernina 1008 is located in the library's urban workshop on the entrance floor."
            "\n"
            "The library has black and white thread, button needles, scissors and other basic sewing supplies."
            "The machine cannot sew leather or very thick fabrics."
            "Report to the staff before the start of your reservation time."
            "Before you can use the device, you must present a library card with a valid borrowing right."
            "\n"
            "You can use the device for your own creative activities."
            "Making commissioned works for compensation or professional income generation,"
            "for example by selling products produced in the library, is not allowed."
        ),
        contact_information="",
        notes_when_applying="Varaus tulee maksaa verkkokaupassa.",
        notes_when_applying_en="The reservation must be paid for in the online store.",
        notes_when_applying_sv="Bokningen måste betalas i webbutiken.",
        reservation_pending_instructions="",
        reservation_pending_instructions_en="",
        reservation_pending_instructions_sv="",
        reservation_confirmed_instructions="",
        reservation_confirmed_instructions_en="",
        reservation_confirmed_instructions_sv="",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=50,
        min_persons=0,
        max_persons=6,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=2),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.PURPOSE_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=aitio_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_3,
        cancellation_terms=varauksen_alkuun_asti_peruutusehto,
        service_specific_terms=maksulliset_palveluehto,
        pricing_terms=None,
        payment_terms=verkkokauppa_vain_maksuehto,
        payment_product__id="eee7a1a4-b309-3919-aa7b-6d7eb675f9f4",
        payment_merchant=None,
        payment_accounting=None,
        #
        # Many-to-Many related
        spaces__name="Aina maksullinen aitio (AUTOMAATIO TESTI ÄLÄ POISTA)",
        spaces__name_en="Aina maksullinen aitio (AUTOMAATIO TESTI ÄLÄ POISTA) ENG",
        spaces__name_sv="Aina maksullinen aitio (AUTOMAATIO TESTI ÄLÄ POISTA) SV",
        spaces__surface_area=50,
        spaces__max_persons=6,
        spaces__unit=harakka,
        resources=[],
        purposes=[
            pida_kokous_tarkoitus,
            loyda_juhlatila_tarkoitus,
            yksin_tai_ryhma_tarkoitus,
            kauta_laitteita_tarkoitus,
        ],
        equipments=[
            liesi_laite,
            kahvinkeitin_laite,
            biljardi_laite,
            liikuntavaline_laite,
        ],
        #
        # One-to-Many related
        pricings__begins=local_date(2024, 9, 1),
        pricings__price_unit=PriceUnit.PER_HOUR,
        pricings__payment_type=PaymentType.ONLINE,
        pricings__is_activated_on_begins=False,
        pricings__lowest_price=0,
        pricings__highest_price=40,
        pricings__tax_percentage=uusi_veroprosentti,
        access_types__begin_date=local_date(2025, 6, 6),
        access_types__access_type=AccessType.UNRESTRICTED,
    )
    _aina_kasiteltava_kellarikerros = ReservationUnitFactory.create(
        #
        # IDs
        ext_uuid="2b6ed117-b53d-45b7-b931-94ac0a617743",
        #
        # Strings
        name="Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA) en",
        name_sv="Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA) sv",
        description=(
            "Käytä tätä varausyksikköä, kun haluan varata varausyksikön, "
            "jonka kaikki varaukset siirtyvät käsittelyyn. "
            "Varaus tulee hyväksyä tai hyläytä käsittelijän puolelta. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 3vrk-3kk. "
            "Peruutusaika on 14 vrk, tämän jälkeen varausta ei voi perua. "
            "Käytössä lomake 3 maksuttomuuspyyntösallittu. "
            "Tämä varausyksikkö vastaa nuorisopalvelun tiloja."
            "\n"
            "Tämä on esimerkkitekstiä eikä liity varaukseen."
            "Mankeli Bernina 1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa."
            "\n"
            "Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia ja muita perusompelutarvikkeita."
            "Koneella ei voi ommella parkkinahkaa tai hyvin paksuja kankaita."
            "Ilmoittaudu henkilökunnalle ennen varausaikasi alkamista."
            "Ennen kuin saat laitteen käyttöösi, sinun on esitettävä kirjastokortti,"
            "jossa on voimassa oleva lainausoikeus."
            "\n"
            "Laitetta voi käyttää omaan luovaan toimintaan."
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen tulonhankinta esimerkiksi"
            "myymällä kirjastossa tuotettuja tuotteita ei ole sallittua."
        ),
        description_sv=(
            "Käytä tätä varausyksikköä, kun haluan varata varausyksikön, "
            "jonka kaikki varaukset siirtyvät käsittelyyn. "
            "Varaus tulee hyväksyä tai hyläytä käsittelijän puolelta. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 3vrk-3kk. "
            "Peruutusaika on 14 vrk, tämän jälkeen varausta ei voi perua. "
            "Käytössä lomake 3 maksuttomuuspyyntösallittu. "
            "Tämä varausyksikkö vastaa nuorisopalvelun tiloja."
            "\n"
            "Detta är en exempeltext och är inte relaterad till reservationen."
            "Mankeli Bernina 1008 ligger i bibliotekets stadsverkstad på entréplan."
            "\n"
            "Biblioteket har svartvit tråd, knappnålar, saxar och andra grundläggande sömnadstillbehör."
            "Maskinen kan inte sy läder eller mycket tjocka tyger."
            "Rapportera till personalen innan din bokningstid börjar."
            "Innan du kan använda enheten måste du visa upp ett lånekort med giltig lånerätt."
            "\n"
            "Du kan använda enheten för dina egna kreativa aktiviteter."
            "Att göra beställningsverk mot ersättning eller yrkesmässig inkomstgenerering,"
            "till exempel genom att sälja produkter producerade i biblioteket, är inte tillåtet."
        ),
        description_en=(
            "Käytä tätä varausyksikköä, kun haluan varata varausyksikön, "
            "jonka kaikki varaukset siirtyvät käsittelyyn. "
            "Varaus tulee hyväksyä tai hyläytä käsittelijän puolelta. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 3vrk-3kk. "
            "Peruutusaika on 14 vrk, tämän jälkeen varausta ei voi perua. "
            "Käytössä lomake 3 maksuttomuuspyyntösallittu. "
            "Tämä varausyksikkö vastaa nuorisopalvelun tiloja."
            "\n"
            "This is an example text and is not related to the reservation."
            "Mankeli Bernina 1008 is located in the library's urban workshop on the entrance floor."
            "\n"
            "The library has black and white thread, button needles, scissors and other basic sewing supplies."
            "The machine cannot sew leather or very thick fabrics."
            "Report to the staff before the start of your reservation time."
            "Before you can use the device, you must present a library card with a valid borrowing right."
            "\n"
            "You can use the device for your own creative activities."
            "Making commissioned works for compensation or professional income generation,"
            "for example by selling products produced in the library, is not allowed."
        ),
        contact_information="",
        notes_when_applying=(
            "Tässä varausyksikössä kaikki varaukset siirtyvät käsittelyyn. "
            "Varaus tulee hyväksyä tai hylätä käsittelijän puolelta."
        ),
        notes_when_applying_en=(
            "In this reservation unit, all reservations are transferred to processing. "
            "The reservation must be accepted or rejected by the handler."
        ),
        notes_when_applying_sv=(
            "I denna reservationsenhet överförs alla reservationer till behandling. "
            "Reservationen måste accepteras eller avvisas av hanteraren."
        ),
        reservation_pending_instructions="",
        reservation_pending_instructions_en="",
        reservation_pending_instructions_sv="",
        reservation_confirmed_instructions="Hyväksytty varaus",
        reservation_confirmed_instructions_en="Hyväksytty varaus ENG",
        reservation_confirmed_instructions_sv="Hyväksytty varaus SV",
        reservation_cancelled_instructions="Peruttu varaus",
        reservation_cancelled_instructions_en="Peruttu varaus ENG",
        reservation_cancelled_instructions_sv="Peruttu varaus SV",
        #
        # Integers
        surface_area=100,
        min_persons=0,
        max_persons=50,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=30),
        max_reservation_duration=datetime.timedelta(hours=6),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=True,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.PURPOSE_SUBVENTION_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=kellarikerros_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_3_maksuttomuus,
        cancellation_terms=kaksi_viikkoa_peruutusehto,
        service_specific_terms=nupa_palveluehto,
        pricing_terms=nupa_hinnoitteluehto,
        payment_terms=verkkokauppa_kasittely_maksuehto,
        payment_product__id="630dcc27-1ff1-3e12-b1ea-9df2571a36bc",
        payment_merchant__id="9be158db-8e3a-4560-8e68-f3214b207d6c",
        payment_accounting=pihlajasarten_accounting,
        #
        # Many-to-Many related
        spaces__name="Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_en="Aina käsiteltävä kellarikerrosEN (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_sv="Aina käsiteltävä kellarikerrosSV (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__surface_area=100,
        spaces__max_persons=50,
        spaces__unit=harakka,
        resources=[],
        purposes=[
            loyda_juhlatila_tarkoitus,
            jarjesta_tapahtuma_tarkoitus,
            harrasta_yhdessa_tarkoitus,
        ],
        equipments=[
            poyta_laite,
            sohva_laite,
            istumapaikka_laite,
            aani_laite,
            hdmi_laite,
            jaakaappi_laite,
            naytto_laite,
            jatkojohto_laite,
        ],
        #
        # One-to-Many related
        pricings__begins=local_date(2024, 8, 23),
        pricings__price_unit=PriceUnit.PER_HOUR,
        pricings__payment_type=PaymentType.ONLINE_OR_INVOICE,
        pricings__is_activated_on_begins=False,
        pricings__lowest_price=0,
        pricings__highest_price=40,
        pricings__tax_percentage=uusi_veroprosentti,
        access_types__begin_date=local_date(2025, 5, 28),
        access_types__access_type=AccessType.UNRESTRICTED,
    )
    _alennuskelpoinen_aula = ReservationUnitFactory.create(
        #
        # IDs
        ext_uuid="d2c6c5c3-6024-4ff1-9275-73a4025501e9",
        #
        # Strings
        name="Alennuskelpoinen aula (AUTOMAATIOTESTI  ÄLÄ POISTA)",
        name_en="Alennuskelpoinen aula (AUTOMAATIOTESTI  ÄLÄ POISTA) en",
        name_sv="Alennuskelpoinen aula (AUTOMAATIOTESTI  ÄLÄ POISTA) sv",
        description=(
            "Käytä tätä varausyksikköä, kun haluan varata joko maksullisen tilan tai hakea hinnan alennusta. "
            "Alennusta haettaessa varaus siirtyy aina käsittelyyn. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Jos et hae alennusta, varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on 14 vrk ennen varausta. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 4 maksullisuuspyyntö sallittu. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. nuorisopalvelun tiloja."
            "\n"
            "Tämä on esimerkkitekstiä eikä liity varaukseen."
            "Mankeli Bernina 1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa."
            "\n"
            "Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia ja muita perusompelutarvikkeita."
            "Koneella ei voi ommella parkkinahkaa tai hyvin paksuja kankaita."
            "Ilmoittaudu henkilökunnalle ennen varausaikasi alkamista."
            "Ennen kuin saat laitteen käyttöösi, sinun on esitettävä kirjastokortti,"
            "jossa on voimassa oleva lainausoikeus."
            "\n"
            "Laitetta voi käyttää omaan luovaan toimintaan."
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen tulonhankinta esimerkiksi"
            "myymällä kirjastossa tuotettuja tuotteita ei ole sallittua."
        ),
        description_sv=(
            "Käytä tätä varausyksikköä, kun haluan varata joko maksullisen tilan tai hakea hinnan alennusta. "
            "Alennusta haettaessa varaus siirtyy aina käsittelyyn. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Jos et hae alennusta, varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on 14 vrk ennen varausta. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 4 maksullisuuspyyntö sallittu. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. nuorisopalvelun tiloja."
            "\n"
            "Detta är en exempeltext och är inte relaterad till reservationen."
            "Mankeli Bernina 1008 ligger i bibliotekets stadsverkstad på entréplan."
            "\n"
            "Biblioteket har svartvit tråd, knappnålar, saxar och andra grundläggande sömnadstillbehör."
            "Maskinen kan inte sy läder eller mycket tjocka tyger."
            "Rapportera till personalen innan din bokningstid börjar."
            "Innan du kan använda enheten måste du visa upp ett lånekort med giltig lånerätt."
            "\n"
            "Du kan använda enheten för dina egna kreativa aktiviteter."
            "Att göra beställningsverk mot ersättning eller yrkesmässig inkomstgenerering,"
            "till exempel genom att sälja produkter producerade i biblioteket, är inte tillåtet."
        ),
        description_en=(
            "Käytä tätä varausyksikköä, kun haluan varata joko maksullisen tilan tai hakea hinnan alennusta. "
            "Alennusta haettaessa varaus siirtyy aina käsittelyyn. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Jos et hae alennusta, varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on 14 vrk ennen varausta. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 4 maksullisuuspyyntö sallittu. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. nuorisopalvelun tiloja."
            "\n"
            "This is an example text and is not related to the reservation."
            "Mankeli Bernina 1008 is located in the library's urban workshop on the entrance floor."
            "\n"
            "The library has black and white thread, button needles, scissors and other basic sewing supplies."
            "The machine cannot sew leather or very thick fabrics."
            "Report to the staff before the start of your reservation time."
            "Before you can use the device, you must present a library card with a valid borrowing right."
            "\n"
            "You can use the device for your own creative activities."
            "Making commissioned works for compensation or professional income generation,"
            "for example by selling products produced in the library, is not allowed."
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="",
        reservation_pending_instructions_en="",
        reservation_pending_instructions_sv="",
        reservation_confirmed_instructions="",
        reservation_confirmed_instructions_en="",
        reservation_confirmed_instructions_sv="",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=10,
        min_persons=0,
        max_persons=182,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=30),
        max_reservation_duration=datetime.timedelta(hours=4),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.AGE_GROUP_SUBVENTION_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=aula_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_kaksi_viikkoa,
        metadata_set=lomake_4_maksuttomuus,
        cancellation_terms=kaksi_viikkoa_peruutusehto,
        service_specific_terms=nupa_palveluehto,
        pricing_terms=nupa_hinnoitteluehto,
        payment_terms=verkkokauppa_alennus_maksuehto,
        payment_product__id="19161df6-9f1c-3a0f-a953-d013ca2e3c0c",
        payment_merchant=None,
        payment_accounting=None,
        #
        # Many-to-Many related
        spaces__name="Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_en="Alennuskelpoinen aulaEN (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_sv="Alennuskelpoinen aulaSV (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__surface_area=10,
        spaces__max_persons=5,
        spaces__unit=harakka,
        resources=[],
        purposes=[
            jarjesta_tapahtuma_tarkoitus,
            harrasta_yhdessa_tarkoitus,
            yksin_tai_ryhma_tarkoitus,
        ],
        equipments=[
            sohva_laite,
            scart_laite,
            studio_laite,
        ],
        #
        # One-to-Many related
        pricings__begins=local_date(2024, 9, 1),
        pricings__price_unit=PriceUnit.PER_HOUR,
        pricings__payment_type=PaymentType.ONLINE,
        pricings__is_activated_on_begins=False,
        pricings__lowest_price=0,
        pricings__highest_price=30,
        pricings__tax_percentage=uusi_veroprosentti,
        access_types__begin_date=local_date(2025, 7, 15),
        access_types__access_type=AccessType.UNRESTRICTED,
    )
    _perumiskelvoton_parveke = ReservationUnitFactory.create(
        #
        # IDs
        ext_uuid="e645a464-af29-41ee-a483-3163b7c9867a",
        #
        # Strings
        name="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA) en",
        name_sv="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA) sv",
        description="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA)",
        description_sv="Perumiskelvoton parveke, maksuton EN (AUTOMAATIOTESTI ÄLÄ POISTA)",
        description_en="Perumiskelvoton parveke, maksuton SV (AUTOMAATIOTESTI ÄLÄ POISTA)",
        contact_information="",
        notes_when_applying="Varausyksikkökohtaiset lisätiedot fi",
        notes_when_applying_en="Varausyksikkökohtaiset lisätiedot en",
        notes_when_applying_sv="Varausyksikkökohtaiset lisätiedot sv",
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
        surface_area=35,
        min_persons=None,
        max_persons=4,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=365,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=30),
        max_reservation_duration=datetime.timedelta(hours=3),
        buffer_time_before=datetime.timedelta(minutes=30),
        buffer_time_after=datetime.timedelta(minutes=30),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.RESERVEE_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=parveke_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=None,
        metadata_set=lomake_2,
        cancellation_terms=varauksen_alkuun_asti_peruutusehto,
        service_specific_terms=nupa_palveluehto,
        pricing_terms=None,
        payment_terms=maksuton_maksuehto,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
        #
        # Many-to-Many related
        spaces__name="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_en="Perumiskelvoton parveke, maksuton EN (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_sv="Perumiskelvoton parveke, maksuton SV (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__surface_area=35,
        spaces__max_persons=4,
        spaces__unit=harakka,
        resources=[],
        purposes=[
            pida_kokous_tarkoitus,
        ],
        equipments=[],
        #
        # One-to-Many related
        pricings__begins=local_date(2024, 3, 1),
        pricings__price_unit=PriceUnit.PER_HOUR,
        pricings__payment_type=None,
        pricings__is_activated_on_begins=False,
        pricings__lowest_price=0,
        pricings__highest_price=0,
        pricings__tax_percentage=nolla_veroprosentti,
        access_types__begin_date=local_date(2025, 7, 15),
        access_types__access_type=AccessType.UNRESTRICTED,
    )

    # ------------------------------------------------------------------------------------------------------------
    # DESKTOP / KAUSIVARAUS
    # ------------------------------------------------------------------------------------------------------------

    _kausivarausyksikko_malmi = ReservationUnitFactory.create(
        #
        # IDs
        ext_uuid="52f16e97-4986-4c4e-8fc5-8fab4ab66933",
        #
        # Strings
        name="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA) en",
        name_sv="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA) sv",
        description="Kuvaus fi",
        description_sv="Kuvaus en",
        description_en="Kuvaus sv",
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
        max_persons=10,
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
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
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
        unit=harakka,
        origin_hauki_resource=malmi_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_1,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
        #
        # Many-to-Many related
        spaces__name="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_en="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA) en",
        spaces__name_sv="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA) sv",
        spaces__surface_area=100,
        spaces__max_persons=1,
        spaces__unit=harakka,
        resources=[],
        purposes=[
            jarjesta_tapahtuma_tarkoitus,
            harrasta_yhdessa_tarkoitus,
            liiku_ja_rentoudu_tarkoitus,
        ],
        equipments=[
            istumapaikka_laite,
            piano_laite,
            rummut_laite,
        ],
        #
        # One-to-Many related
        pricings__begins=local_date(2025, 6, 12),
        pricings__price_unit=PriceUnit.PER_HOUR,
        pricings__payment_type=None,
        pricings__is_activated_on_begins=False,
        pricings__lowest_price=0,
        pricings__highest_price=0,
        pricings__tax_percentage=nolla_veroprosentti,
        access_types__begin_date=local_date(2025, 6, 12),
        access_types__access_type=AccessType.UNRESTRICTED,
    )
    for weekday in Weekday:
        ApplicationRoundTimeSlotFactory.create(
            reservation_unit=_kausivarausyksikko_malmi,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="09:00:00", end="21:00:00")],
        )

    _kausivarausyksikko_keskusta = ReservationUnitFactory.create(
        #
        # IDs
        ext_uuid="99c2f30e-40ad-4aca-aa78-01ac92a0b1ff",
        #
        # Strings
        name="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA) en",
        name_sv="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA) sv",
        description="Kuvaus fi",
        description_sv="Kuvaus en",
        description_en="Kuvaus sv",
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
        surface_area=100,
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
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
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
        unit=harakka,
        origin_hauki_resource=keskusta_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_1,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
        #
        # Many-to-Many related
        spaces__name="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_en="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA) en",
        spaces__name_sv="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA) sv",
        spaces__surface_area=100,
        spaces__max_persons=1,
        spaces__unit=harakka,
        resources=[],
        purposes=[
            loyda_juhlatila_tarkoitus,
            jarjesta_tapahtuma_tarkoitus,
            harrasta_yhdessa_tarkoitus,
        ],
        equipments=[
            sohva_laite,
            istumapaikka_laite,
            piano_laite,
            rummut_laite,
        ],
        #
        # One-to-Many related
        pricings__begins=local_date(2025, 6, 12),
        pricings__price_unit=PriceUnit.PER_HOUR,
        pricings__payment_type=None,
        pricings__is_activated_on_begins=False,
        pricings__lowest_price=0,
        pricings__highest_price=0,
        pricings__tax_percentage=nolla_veroprosentti,
        access_types__begin_date=local_date(2025, 6, 12),
        access_types__access_type=AccessType.UNRESTRICTED,
    )
    for weekday in Weekday:
        ApplicationRoundTimeSlotFactory.create(
            reservation_unit=_kausivarausyksikko_keskusta,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="09:00:00", end="21:00:00")],
        )

    _kausivarausyksikko_yrjo = ReservationUnitFactory.create(
        #
        # IDs
        ext_uuid="1ba828f9-620f-4dea-ba60-c86ea5487648",
        #
        # Strings
        name="KAUSIVARAUS yksikkö OVIKOODI Yrjö (Manuaalitestaus)",
        name_en="KAUSIVARAUS yksikkö OVIKOODI Yrjö en (Manuaalitestaus)",
        name_sv="KAUSIVARAUS yksikkö OVIKOODI Yrjö sv (Manuaalitestaus)",
        description="Kausivaraus yksikkö Yrjö \nAukiolo \nMa - pe 10:00-22:00 Varauksella \n12:00-13:00 Suljettu",
        description_sv="Kuvaus en",
        description_en="Kuvaus sv",
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
        min_persons=5,
        max_persons=10,
        max_reservations_per_user=10,
        reservations_min_days_before=0,
        reservations_max_days_before=182,
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
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.AGE_GROUP_SUBVENTION_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=yrjo_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_4_maksuttomuus,
        cancellation_terms=varauksen_alkuun_asti_peruutusehto,
        service_specific_terms=maksuton_palveluehto,
        pricing_terms=nupa_hinnoitteluehto,
        payment_terms=verkkokauppa_vain_maksuehto,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
        #
        # Many-to-Many related
        spaces__name="KAUSIVARAUS yksikkö Yrjö (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_en="KAUSIVARAUS yksikkö Yrjö (AUTOMAATIOTESTI ÄLÄ POISTA) E",
        spaces__name_sv="KAUSIVARAUS yksikkö Yrjö (AUTOMAATIOTESTI ÄLÄ POISTA) S",
        spaces__surface_area=50,
        spaces__max_persons=10,
        spaces__unit=harakka,
        resources=[],
        purposes=[
            harrasta_yhdessa_tarkoitus,
            liiku_ja_rentoudu_tarkoitus,
        ],
        equipments=[
            poyta_laite,
            sohva_laite,
            esiintymislava_laite,
            peiliseina_laite,
            liikuntavaline_laite,
        ],
        #
        # One-to-Many related
        pricings__begins=local_date(2024, 8, 27),
        pricings__price_unit=PriceUnit.FIXED,
        pricings__payment_type=PaymentType.ONLINE,
        pricings__is_activated_on_begins=False,
        pricings__lowest_price=Decimal("12.40"),
        pricings__highest_price=Decimal("50.00"),
        pricings__tax_percentage=nolla_veroprosentti,
        access_types__begin_date=local_date(2025, 8, 1),
        access_types__access_type=AccessType.ACCESS_CODE,
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.MONDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="10:00:00", end="19:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.TUESDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="11:00:00", end="18:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.WEDNESDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="09:00:00", end="21:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.THURSDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="12:00:00", end="18:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.FRIDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="10:00:00", end="18:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.SATURDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="09:00:00", end="12:00:00"), TimeSlotDB(begin="15:00:00", end="23:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.SUNDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="12:00:00", end="14:00:00")],
    )

    _kausivarausyksikko_kalevi = ReservationUnitFactory.create(
        #
        # IDs
        ext_uuid="b0dc03b7-19ef-4130-b0a2-b6f5827b0eb3",
        #
        # Strings
        name="KAUSIVARAUS yksikkö Kalevi (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Kalevi en (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_sv="KAUSIVARAUS yksikkö Kalevi sv (AUTOMAATIOTESTI ÄLÄ POISTA)",
        description="Kuvaus fi\nAukioloaika\nMa - pe 10:00-22:00 Varauksella\n13:00 - 14:00 Suljettu",
        description_sv="Kuvaus en",
        description_en="Kuvaus sv",
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
        surface_area=60,
        min_persons=3,
        max_persons=20,
        max_reservations_per_user=20,
        reservations_min_days_before=0,
        reservations_max_days_before=182,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=5),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.PURPOSE_SUBVENTION_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=kalevi_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_3_maksuttomuus,
        cancellation_terms=alkuun_asti_ei_peruutusta_peruutusehto,
        service_specific_terms=kausi_palveluehto,
        pricing_terms=nupa_hinnoitteluehto,
        payment_terms=verkkokauppa_vain_maksuehto,
        payment_product__id="3cc8c05f-78cc-391c-b442-4f1b251697d3",
        payment_merchant=None,
        payment_accounting=None,
        #
        # Many-to-Many related
        spaces__name="KAUSIVARAUS yksikkö Kalevi (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_en="KAUSIVARAUS yksikkö Kalevi en (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_sv="KAUSIVARAUS yksikkö Kalevi sv (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__surface_area=60,
        spaces__max_persons=20,
        spaces__unit=harakka,
        resources=[],
        purposes=[
            pida_kokous_tarkoitus,
            jarjesta_tapahtuma_tarkoitus,
            harrasta_yhdessa_tarkoitus,
            tee_musiikkia_tarkoitus,
            kauta_laitteita_tarkoitus,
        ],
        equipments=[
            poyta_laite,
            sohva_laite,
            internet_laite,
            aani_laite,
            tietokone_laite,
            studio_laite,
            naytto_laite,
        ],
        #
        # One-to-Many related
        pricings__begins=local_date(2024, 8, 27),
        pricings__price_unit=PriceUnit.PER_15_MINS,
        pricings__payment_type=PaymentType.ONLINE,
        pricings__is_activated_on_begins=False,
        pricings__lowest_price=Decimal("24.80"),
        pricings__highest_price=Decimal("60.00"),
        pricings__tax_percentage=nolla_veroprosentti,
        access_types__begin_date=local_date(2025, 8, 1),
        access_types__access_type=AccessType.UNRESTRICTED,
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.MONDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="14:00:00", end="18:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.TUESDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="10:00:00", end="22:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.WEDNESDAY,
        is_closed=True,
        reservable_times=[],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.THURSDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="07:00:00", end="23:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.FRIDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="03:00:00", end="20:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.SUNDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="12:00:00", end="23:00:00")],
    )

    _kausivarausyksikko_piitu = ReservationUnitFactory.create(
        #
        # IDs
        ext_uuid="d9085bea-4998-4b9b-a8b1-72c8069c6f63",
        #
        # Strings
        name="KAUSIVARAUS yksikkö Piitu (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Piitu en (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_sv="KAUSIVARAUS yksikkö Piitu sv (AUTOMAATIOTESTI ÄLÄ POISTA)",
        description="Kuvaus fi\nAukioloaika\nMa - pe 10:00-22:00 Varauksella\n14:00 - 15:00 Suljettu",
        description_sv="Kuvaus en",
        description_en="Kuvaus sv",
        contact_information="Vastuuhenkilön yhteystiedot",
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
        surface_area=70,
        min_persons=0,
        max_persons=30,
        max_reservations_per_user=20,
        reservations_min_days_before=0,
        reservations_max_days_before=182,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=7),
        buffer_time_before=datetime.timedelta(minutes=30),
        buffer_time_after=datetime.timedelta(hours=1),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.AGE_GROUP_SUBVENTION_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=piitu_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_4_maksuttomuus,
        cancellation_terms=alkuun_asti_ei_peruutusta_peruutusehto,
        service_specific_terms=kausi_palveluehto,
        pricing_terms=nupa_hinnoitteluehto,
        payment_terms=verkkokauppa_vain_maksuehto,
        payment_product__id="db9cb2d4-0a72-3e5e-a5b6-9479ef59e256",
        payment_merchant=None,
        payment_accounting=None,
        #
        # Many-to-Many related
        spaces__name="KAUSIVARAUS yksikkö Piitu (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_en="KAUSIVARAUS yksikkö Piitu en (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__name_sv="KAUSIVARAUS yksikkö Piitu sv (AUTOMAATIOTESTI ÄLÄ POISTA)",
        spaces__surface_area=60,
        spaces__max_persons=20,
        spaces__unit=harakka,
        resources=[],
        purposes=[
            pida_kokous_tarkoitus,
            yksin_tai_ryhma_tarkoitus,
        ],
        equipments=[
            poyta_laite,
            valkotaulu_laite,
            vesipiste_laite,
            astiasto_laite,
            liesi_laite,
            uuni_laite,
            jaakaappi_laite,
            pakastin_laite,
            mikro_laite,
            kahvinkeitin_laite,
            vedenkeitin_laite,
            astianpesukone_laite,
        ],
        #
        # One-to-Many related
        pricings__begins=local_date(2024, 2, 23),
        pricings__price_unit=PriceUnit.PER_HOUR,
        pricings__payment_type=PaymentType.ONLINE,
        pricings__is_activated_on_begins=False,
        pricings__lowest_price=Decimal("30.00"),
        pricings__highest_price=Decimal("80.00"),
        pricings__tax_percentage=nolla_veroprosentti,
        access_types__begin_date=local_date(2025, 8, 1),
        access_types__access_type=AccessType.UNRESTRICTED,
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.MONDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="12:00:00", end="18:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.TUESDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="10:00:00", end="20:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.WEDNESDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="11:00:00", end="22:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.THURSDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="15:00:00", end="19:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.FRIDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="07:00:00", end="23:00:00")],
    )
    ApplicationRoundTimeSlotFactory.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.SATURDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="16:00:00", end="18:00:00")],
    )

    # ------------------------------------------------------------------------------------------------------------
    # ANDROID
    # ------------------------------------------------------------------------------------------------------------

    copy_reservation_unit(_maksuton_mankeli, kind="android")
    copy_reservation_unit(_aina_maksullinen_aitio, kind="android")
    copy_reservation_unit(_aina_kasiteltava_kellarikerros, kind="android")
    copy_reservation_unit(_alennuskelpoinen_aula, kind="android")
    copy_reservation_unit(_perumiskelvoton_parveke, kind="android")

    # ------------------------------------------------------------------------------------------------------------
    # IPHONE
    # ------------------------------------------------------------------------------------------------------------

    copy_reservation_unit(_maksuton_mankeli, kind="iphone")
    copy_reservation_unit(_aina_maksullinen_aitio, kind="iphone")
    copy_reservation_unit(_aina_kasiteltava_kellarikerros, kind="iphone")
    copy_reservation_unit(_alennuskelpoinen_aula, kind="iphone")
    copy_reservation_unit(_perumiskelvoton_parveke, kind="iphone")


def copy_reservation_unit(original: ReservationUnit, *, kind: Literal["android", "iphone"]) -> ReservationUnit:
    # Fetch again so that the original is not modified
    android_version = ReservationUnit.objects.get(pk=original.pk)

    # See: https://docs.djangoproject.com/en/dev/topics/db/queries/#copying-model-instances
    android_version._state.adding = True  # noqa: SLF001
    android_version.id = None

    android_version.ext_uuid = uuid.uuid4()
    android_version.name += f" ({kind})"
    android_version.name_en += f" ({kind})"
    android_version.name_sv += f" ({kind})"

    android_version.save()

    android_version.resources.set(original.resources.all())
    android_version.purposes.set(original.purposes.all())
    android_version.equipments.set(original.equipments.all())

    new_spaces: list[Space] = []
    for space in original.spaces.all():
        space._state.adding = True  # noqa: SLF001
        space.id = None

        space.name += f" ({kind})"
        space.name_en += f" ({kind})"
        space.name_sv += f" ({kind})"

        space.save()
        new_spaces.append(space)

    android_version.spaces.set(new_spaces)

    for pricing in original.pricings.all():
        pricing._state.adding = True  # noqa: SLF001
        pricing.id = None

        pricing.reservation_unit = android_version
        pricing.save()

    for access_type in original.access_types.all():
        access_type._state.adding = True  # noqa: SLF001
        access_type.id = None

        access_type.reservation_unit = android_version
        access_type.save()

    return android_version


def create_users() -> None:
    User.objects.update_or_create(
        username="u-5ubvcxgrxzdf5nj7y4sbjnvyeq",
        defaults={
            "first_name": "Ande",
            "last_name": "AutomaatioTesteri",
            "email": "qfaksi+ande@gmail.com",
            "password": make_password("AutomaatioTesteri"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "ed03515c-d1be-465e-b53f-c72414b6b824",  # GDPR UUID
            "tvp_uuid": "e5c391e8-8a6b-49ba-8b91-7c7a50b15b33",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1974, 6, 18),
            "profile_id": "UHJvZmlsZU5vZGU6YmUyMGNmYTQtNTQ3MS00ZjM1LWEwYzctODg5YmQ4MTgzNzA5",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-os5gt6upb5echkmmocu6g2ujr4",
        defaults={
            "first_name": "Mikael",
            "last_name": "Virtanen",
            "email": "qfaksi+mikael@gmail.com",
            "password": make_password("Virtanen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "74ba69fa-8f0f-4823-a98c-70a9e36a898f",  # GDPR UUID
            "tvp_uuid": "0e8fe48b-ee20-4694-bbdc-9bce3d23ea26",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1982, 3, 15),
            "profile_id": "UHJvZmlsZU5vZGU6NGVkNzU2MWItZTJhMy00NTMwLTgwOWYtMjJiYzNlOTU3NDUz",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-3fvnhmmwe5hg7alebt4caji7zi",
        defaults={
            "first_name": "Jukka",
            "last_name": "Korhonen",
            "email": "qfaksi+jukka@gmail.com",
            "password": make_password("Korhonen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "d96ad3b1-9627-4e6f-8164-0cf820251fca",  # GDPR UUID
            "tvp_uuid": "060e2aa4-bbf3-41e5-b0c7-a9b0ef843940",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1990, 10, 22),
            "profile_id": "UHJvZmlsZU5vZGU6OTQ3NWI0ZDctYmMyMi00ZjcwLWFmNGUtNTQyOWI0ZDZmYjg2",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-754c5vvdzzbk5jgsjfh5hcfzc4",
        defaults={
            "first_name": "Petri",
            "last_name": "Makinen",
            "email": "qfaksi+petri@gmail.com",
            "password": make_password("Makinen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "ff782ed6-a3ce-42ae-a4d2-494fd388b917",  # GDPR UUID
            "tvp_uuid": "bce3ecb8-41bd-4372-affb-8bf4fa929c35",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1985, 7, 7),
            "profile_id": "UHJvZmlsZU5vZGU6NTRhNWE1NDctMzRmOS00NjliLWE0NjktNjdmOWExMDdhMDk4",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-4ghz53zzivd4bnpo6x7ef57q4q",
        defaults={
            "first_name": "Antti",
            "last_name": "Nieminen",
            "email": "qfaksi+antti@gmail.com",
            "password": make_password("Nieminen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "e18f9eef-3945-47c0-b5ee-f5fe42f7f0e4",  # GDPR UUID
            "tvp_uuid": "344a7685-c346-4e94-851a-6520c6776d20",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1976, 12, 11),
            "profile_id": "UHJvZmlsZU5vZGU6M2FmODg4NWYtOTkzMy00MjM1LTkyNDktMGU3MTI5ODViMDcx",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-crag6mljcfgtthi4y2eflvmk4i",
        defaults={
            "first_name": "Matti",
            "last_name": "Mäkelä",
            "email": "qfaksi+matti@gmail.com",
            "password": make_password("Mäkelä"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "14406f31-6911-4d39-9d1c-c68855d58ae2",  # GDPR UUID
            "tvp_uuid": "bcc347a2-a1f1-4686-bb46-03c840f2de48",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1989, 6, 4),
            "profile_id": "UHJvZmlsZU5vZGU6Y2VlYzZkOTItYjdkNi00NTZhLWI5M2UtYzc4MjI5YjAwMTli",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-ie2b7oqmcvdhjd456rcm7x7tuy",
        defaults={
            "first_name": "Anna",
            "last_name": "Korhonen",
            "email": "qfaksi+anna@gmail.com",
            "password": make_password("Korhonen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "41341fba-0c15-4674-8f9d-f444cfdff3a6",  # GDPR UUID
            "tvp_uuid": "71a34673-620f-41d1-b653-a9e326a490e7",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1976, 5, 5),
            "profile_id": "UHJvZmlsZU5vZGU6YWMxODIyNDMtZWFjOS00YzdkLWFjYTAtZDAzZTllYjJhMzIz",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-ggoljyfcwbf27i53qwzjq55rya",
        defaults={
            "first_name": "Mari",
            "last_name": "Leppänen",
            "email": "qfaksi+mari@gmail.com",
            "password": make_password("Leppänen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "319cb4e0-a2b0-4baf-a3bb-85b29877b1c0",  # GDPR UUID
            "tvp_uuid": "51771b83-b81a-4948-92ff-a03a2e8fb0d2",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1989, 1, 24),
            "profile_id": "UHJvZmlsZU5vZGU6YTNiOGRkMjItMzcyYS00MDUwLTg4NTUtYzUzM2FkODhhNDY5",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-uslsa3ewcvcmbcfyub5b26lfmu",
        defaults={
            "first_name": "Päivi",
            "last_name": "Mustonen",
            "email": "qfaksi+paivi@gmail.com",
            "password": make_password("Mustonen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "a497206c-9615-44c0-88b8-a07a1d796565",  # GDPR UUID
            "tvp_uuid": "e090178e-2b9a-4986-bd90-dacd3cf279f6",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1991, 5, 16),
            "profile_id": "UHJvZmlsZU5vZGU6M2IyZjgzM2YtNTU0ZS00N2NjLWE5NWQtMGVmM2IyZmYyMjA3",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-xabra2s6gbgf5nh7ss46gbsblq",
        defaults={
            "first_name": "Kaisa",
            "last_name": "Rantanen",
            "email": "qfaksi+kaisa@gmail.com",
            "password": make_password("Rantanen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "b803106a-5e30-4c5e-b4ff-94b9e306415c",  # GDPR UUID
            "tvp_uuid": "a8497405-b2e2-4022-8d6e-8b9675fd4883",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1987, 12, 12),
            "profile_id": "UHJvZmlsZU5vZGU6YTkyNTlhMTctZTcxMi00ZWNiLWI0ZWYtZTczODIzNmZkNmY1",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-fxwut2vtubfuxpnmbqdjpqmwou",
        defaults={
            "first_name": "Ulla",
            "last_name": "Hakala",
            "email": "qfaksi+ulla@gmail.com",
            "password": make_password("Hakala"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "2ded49ea-b3a0-4b4b-bdac-0c0697c19675",  # GDPR UUID
            "tvp_uuid": "bf954d1f-be58-41bf-b581-b75b94feba70",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1988, 8, 3),
            "profile_id": "UHJvZmlsZU5vZGU6NTAyNzE3MTEtMjA2Ny00YTcxLThmYzQtNWU4ZTA0YTNmY2Q3",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-lj6ejffcxbcn3j6lnpjjz2x5oe",
        defaults={
            "first_name": "Riitta",
            "last_name": "Lindström",
            "email": "qfaksi+riitta@gmail.com",
            "password": make_password("Lindström"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "5a7c4494-a2b8-44dd-a7cb-6bd29ceafd71",  # GDPR UUID
            "tvp_uuid": "2766ef5c-124d-48aa-9d22-50df0b0749b1",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1974, 4, 30),
            "profile_id": "UHJvZmlsZU5vZGU6MzdkNGEwMzEtY2RhYy00ZTkzLWI5Y2MtM2JmMjY0YjZmNDE0",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-j7tps34mlvhzhkr4zgq5hltxhu",
        defaults={
            "first_name": "Tirehtoori",
            "last_name": "Tötterstrom",
            "email": "qfaksi+tirehtoori@gmail.com",
            "password": make_password("Tötterstrom"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "4fe6f96f-8c5d-4f93-aa3c-c9a1d3ae773d",  # GDPR UUID
            "tvp_uuid": "1d5cd73a-06aa-4562-9099-2ceb1afc0268",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1969, 8, 12),
            "profile_id": "UHJvZmlsZU5vZGU6NWFhMDAyODEtNmQzMS00YTgwLWI4YjktYWYzN2JmZWI0NWQ1",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-smv3dohm6jhf5dt2fpvpqvsitu",
        defaults={
            "first_name": "Pekka",
            "last_name": "Virtanen",
            "email": "qfaksi+pekka@gmail.com",
            "password": make_password("Virtanen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "932bb1b8-ecf2-4e5e-8e7a-2beaf856489d",  # GDPR UUID
            "tvp_uuid": "e7b60ed1-fb55-4603-9834-3d4324fd5da9",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1985, 6, 22),
            "profile_id": "UHJvZmlsZU5vZGU6MmVmMTQxYTQtNjIzMy00MTAyLWE2YTQtZGM2Mzk0ZWNmMmFm",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-ueeszbvcujh6tehct5qobqdv44",
        defaults={
            "first_name": "Hannu",
            "last_name": "Rantala",
            "email": "qfaksi+hannu@gmail.com",
            "password": make_password("Rantala"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "a1092c86-a2a2-4fe9-90e2-9f60e0c075e7",  # GDPR UUID
            "tvp_uuid": "06bf3918-b7bc-4174-8cc8-6c1d59544613",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1981, 12, 10),
            "profile_id": "UHJvZmlsZU5vZGU6ZjJlNDhjNTEtZmExOS00N2I5LTg0NmItM2FlYjU0N2I4YTky",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-k36o5lcn5rg6db23hqlb6jhxn4",
        defaults={
            "first_name": "Seppo",
            "last_name": "Korhonen",
            "email": "qfaksi+seppo@gmail.com",
            "password": make_password("Korhonen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "56fceeac-4dec-4de1-875b-3c161f24f76f",  # GDPR UUID
            "tvp_uuid": "3cc77909-ed84-45eb-b619-175ea6da3ff5",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1977, 6, 28),
            "profile_id": "UHJvZmlsZU5vZGU6MmFkZTBmYzktMDFlOS00ZGM4LWFjNjAtNDNhOTk5ZjJmNzY2",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-sdgkcz427jgyxg2gawa7qcy74q",
        defaults={
            "first_name": "Risto",
            "last_name": "Hakkarainen",
            "email": "qfaksi+risto@gmail.com",
            "password": make_password("Hakkarainen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "90cca167-9afa-4d8b-9b46-0581f80b1fe4",  # GDPR UUID
            "tvp_uuid": "861923fe-d931-4a81-b03b-0490e1c8b66c",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1993, 10, 5),
            "profile_id": "UHJvZmlsZU5vZGU6ODIwMWRlZmQtMDJlYi00ZjU3LTgxYTMtYTJkOTU1MTA0ZGI1",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-khucobukjjh67huofgq4xmcopi",
        defaults={
            "first_name": "Erkki",
            "last_name": "Nieminen",
            "email": "qfaksi+erkki@gmail.com",
            "password": make_password("Nieminen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "51e82706-8a4a-4fef-9e8e-29a1cbb04e7a",  # GDPR UUID
            "tvp_uuid": "20489318-7a6f-4650-9d10-b8da675ee31e",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1982, 10, 14),
            "profile_id": "UHJvZmlsZU5vZGU6MjhjZTdhZWMtNTBjYS00MWFiLTkxZTctYjdiOTllYjE5ZjIw",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-6gyudis5vrex7eoyoofsyg7e7m",
        defaults={
            "first_name": "Ari",
            "last_name": "Laine",
            "email": "qfaksi+ari@gmail.com",
            "password": make_password("Laine"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "f1b141a2-5dac-497f-91d8-738b2c1be4fb",  # GDPR UUID
            "tvp_uuid": "6a8fd873-9f35-4afe-9dde-092047c4995b",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1984, 6, 19),
            "profile_id": "UHJvZmlsZU5vZGU6MGE4NmY5YjItYjU4ZC00YzE0LTgwYjItYTE0ZGQ2MTgyM2Ji",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-synoynteknhu5f4oky5komlxz4",
        defaults={
            "first_name": "Kari",
            "last_name": "Kekkonen",
            "email": "qfaksi+kari@gmail.com",
            "password": make_password("Kekkonen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "961aec36-6453-4f4e-978e-563aa73177cf",  # GDPR UUID
            "tvp_uuid": "061ba9cb-4206-484c-8cbd-fd8533d01741",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1975, 8, 15),
            "profile_id": "UHJvZmlsZU5vZGU6MDQ4ZmRmN2MtMjlhMS00M2U3LTk2MjQtYWNkYTNkNWRkYWNh",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-hrxnhfdeurbglo2vcxrqbsa73e",
        defaults={
            "first_name": "Esa",
            "last_name": "Mattila",
            "email": "qfaksi+esa@gmail.com",
            "password": make_password("Mattila"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "3c6ed394-64a4-4265-bb55-15e300c81fd9",  # GDPR UUID
            "tvp_uuid": "8ad333ad-021d-47e9-a8bc-803c0d6e28fa",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1983, 6, 7),
            "profile_id": "UHJvZmlsZU5vZGU6MGI0NDc4ZjEtNDQ3Ny00YmEwLTg5NjctNDM4MjZmZjI0ZGMx",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-j7q3jatunrf2rdria5cjgpcv4u",
        defaults={
            "first_name": "Pertti",
            "last_name": "Kallio",
            "email": "qfaksi+pertti@gmail.com",
            "password": make_password("Kallio"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "4fe1b482-746c-4ba8-8e28-0744933c55e5",  # GDPR UUID
            "tvp_uuid": "835e2f31-bd26-46c2-a4ac-292218bf654a",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1985, 8, 12),
            "profile_id": "UHJvZmlsZU5vZGU6M2Q1NTczZmMtYTUzMC00ZTgwLWI5MjAtODk0ODNmNmFhOTIy",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-5l6cnmgeandejout7uktzsqgim",
        defaults={
            "first_name": "Antero",
            "last_name": "Salonen",
            "email": "qfaksi+antero@gmail.com",
            "password": make_password("Salonen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "eafc26b0-c403-4644-ba93-fd153cca0643",  # GDPR UUID
            "tvp_uuid": "0ac0c309-8ebe-4326-94c1-f98b0dba7824",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1975, 11, 22),
            "profile_id": "UHJvZmlsZU5vZGU6Mjk3OGYxZDQtOGYxOS00ZjRlLTk4OGYtMmNkZWI1MTViMzY0",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-buahccmtg5dedcvalbogbmiktq",
        defaults={
            "first_name": "Tuula",
            "last_name": "Aaltonen",
            "email": "qfaksi+tuula@gmail.com",
            "password": make_password("Aaltonen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "0d007109-9337-4641-8aa0-585c60b10a9c",  # GDPR UUID
            "tvp_uuid": "e9c3a265-9f0b-460f-a95a-8a637c31e181",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1985, 6, 18),
            "profile_id": "UHJvZmlsZU5vZGU6MmU0ZTkxMTEtMjMzYS00MWE4LTgxZGMtZWRhM2Q5YjczNmIx",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-d7wshr3wqrfsdjcyprfvklq3lu",
        defaults={
            "first_name": "Helena",
            "last_name": "Hiltunen",
            "email": "qfaksi+merja@gmail.com",
            "password": make_password("Hiltunen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "1fed23c7-7684-4b21-a458-7c4b552e1b5d",  # GDPR UUID
            "tvp_uuid": "ccf8c3fa-15ed-493c-9723-197bc7b86107",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1992, 7, 25),
            "profile_id": "UHJvZmlsZU5vZGU6MDhmZmMyOTctOTU4Zi00YjkyLTliMTYtOTgzNDc1YmJlODQ2",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-b6phfq5wmbcjljuqoveb3mqsni",
        defaults={
            "first_name": "Helena",
            "last_name": "Hiltunen",
            "email": "qfaksi+helena@gmail.com",
            "password": make_password("Hiltunen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "0f9e72c3-b660-4495-a690-75481db2126a",  # GDPR UUID
            "tvp_uuid": "4cd5de1d-0e7a-42e9-a496-87d3c83ee129",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1984, 11, 8),
            "profile_id": "UHJvZmlsZU5vZGU6ZTNlN2I5ZTItMjMwNC00MmIzLWE4Y2UtYTRhMzcyYzIyMjc1",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-a73qe2rmajavvmpb2kvwdcjajq",
        defaults={
            "first_name": "Seija",
            "last_name": "Mäenpää",
            "email": "qfaksi+seija@gmail.com",
            "password": make_password("Mäenpää"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "07f7026a-2c02-415a-b1e1-d2ab6189204c",  # GDPR UUID
            "tvp_uuid": "7bf6a12d-11fd-451d-85ef-466d3990f0b6",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1979, 12, 14),
            "profile_id": "UHJvZmlsZU5vZGU6ZDhhYjlmZmItZTg3NC00NTM1LTlmOGUtYmUwZjQ4ZjE1YzVh",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-bqawevrs2vbhniuprp3wdfv2gu",
        defaults={
            "first_name": "Maija",
            "last_name": "Peltonen",
            "email": "qfaksi+maija@gmail.com",
            "password": make_password("Peltonen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "0c016256-32d5-4276-a28f-8bf76196ba35",  # GDPR UUID
            "tvp_uuid": "6a1087f7-cc9a-4ebb-8149-4c1727e19c53",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1986, 10, 23),
            "profile_id": "UHJvZmlsZU5vZGU6ZDRjNGExNzctZjExNy00ZDg3LTlhMTAtNDJjZDEyNWI1MzZm",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )
    User.objects.update_or_create(
        username="u-jtvjms5shnhpbplyknv7jcac4q",
        defaults={
            "first_name": "Liisa",
            "last_name": "Koivisto",
            "email": "qfaksi+liisa@gmail.com",
            "password": make_password("Koivisto"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "4cea964b-b23b-4ef0-bd78-536bf48802e4",  # GDPR UUID
            "tvp_uuid": "f7259555-96b3-4ebe-b5d7-3b7ef4ab2895",  # Statistics UUID
            "department_name": None,
            "preferred_language": "fi",
            "date_of_birth": local_datetime(1991, 5, 7),
            "profile_id": "UHJvZmlsZU5vZGU6NDEwZjA1ZDgtNzU3MC00NTFmLWIwMmItYjc2ZjIzMTA5ODdi",
            "reservation_notification": ReservationNotification.ONLY_HANDLING_REQUIRED,
            "sent_email_about_deactivating_permissions": False,
            "sent_email_about_anonymization": False,
        },
    )


def create_application_rounds() -> None:
    nupa_kausivarausehto = TermsOfUse.objects.get(id="KUVAnupa")

    harrastustoiminta = ReservationPurpose.objects.get(name="Harrastustoiminta, muu")

    kausivarausyksikko_malmi = ReservationUnit.objects.get(ext_uuid="52f16e97-4986-4c4e-8fc5-8fab4ab66933")
    kausivarausyksikko_keskusta = ReservationUnit.objects.get(ext_uuid="99c2f30e-40ad-4aca-aa78-01ac92a0b1ff")

    ApplicationRoundFactory.create(
        name="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA)",
        name_en="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA) eng",
        name_sv="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA) sv",
        criteria="Hakukriteerit (suomeksi)",
        criteria_en="Hakukriteerit (englanniksi)",
        criteria_sv="Hakukriteerit (ruotsiksi)",
        notes_when_applying="Huomioi hakiessa (Suomeksi)",
        notes_when_applying_en="Huomioi hakiessa (Englanniksi)",
        notes_when_applying_sv="Huomioi hakiessa (Ruotsiksi)",
        application_period_begins_at=local_datetime(2025, 6, 12),
        application_period_ends_at=local_datetime(2026, 6, 13),
        reservation_period_begin_date=local_date(2026, 6, 14),
        reservation_period_end_date=local_date(2029, 6, 10),
        public_display_begins_at=local_datetime(2025, 6, 12),
        public_display_ends_at=local_datetime(2029, 6, 11),
        handled_at=None,
        sent_at=None,
        reservation_units=[kausivarausyksikko_malmi, kausivarausyksikko_keskusta],
        purposes=[harrastustoiminta],
        terms_of_use=nupa_kausivarausehto,
    )


def create_past_reservations() -> None:
    user = User.objects.get(email="qfaksi+paivi@gmail.com")

    maksuton_mankeli = ReservationUnit.objects.get(ext_uuid="7bbd9b47-ad06-495a-a530-b094574208d6")

    ReservationFactory.create(
        user=user,
        reservation_unit=maksuton_mankeli,
        begins_at=local_datetime(2025, 6, 12, 10),
        ends_at=local_datetime(2025, 6, 12, 12),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )
