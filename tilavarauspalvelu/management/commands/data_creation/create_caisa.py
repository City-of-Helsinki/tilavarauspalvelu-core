import datetime
from datetime import date, timedelta

from tests.factories import (
    EquipmentCategoryFactory,
    EquipmentFactory,
    OriginHaukiResourceFactory,
    PaymentAccountingFactory,
    PaymentMerchantFactory,
    PaymentProductFactory,
    QualifierFactory,
    ReservableTimeSpanFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitFactory,
    ReservationUnitPaymentTypeFactory,
    ReservationUnitPricingFactory,
    ReservationUnitTypeFactory,
    SpaceFactory,
    TaxPercentageFactory,
    TermsOfUseFactory,
    UnitFactory,
)
from tilavarauspalvelu.enums import (
    AuthenticationType,
    PriceUnit,
    ReservationKind,
    ReservationStartInterval,
    ReservationUnitImageType,
    TermsOfUseTypeChoices,
)
from tilavarauspalvelu.models import ReservableTimeSpan, ReservationMetadataSet
from utils.date_utils import DEFAULT_TIMEZONE, combine, local_date

from .create_reservation_related_things import _fetch_and_build_reservation_unit_image
from .utils import SetName, with_logs


@with_logs
def _create_caisa() -> None:
    """Create the caisa unit from testing server"""
    caisa = UnitFactory.create(
        tprek_id="7256",
        tprek_department_id="cc14b994-89b2-4ace-84ba-c5bb0bdffda7",
        name="Caisa",
        name_fi="Caisa",
        name_sv="Caisa",
        name_en="Cultural Centre Caisa",
        description="",
        short_description=(
            "Vuonna 1996 perustettu kulttuurikeskus, joka edistää taiteen ja "
            "kulttuurin keinoin Helsingin kehittymistä monimuotoiseksi kaupungiksi."
        ),
        web_page="http://www.caisa.fi/",  # NOSONAR
        phone="+358 9 310 37500",
    )

    ###########################################################################################################
    # Get metadata sets
    ###########################################################################################################

    metadata_sets: dict[SetName, ReservationMetadataSet] = {
        SetName(meta.name): meta for meta in ReservationMetadataSet.objects.all()
    }

    ###########################################################################################################
    # Create tax percentages and payment types
    ###########################################################################################################

    tax_percentage_0 = TaxPercentageFactory.create(value=0.0)
    tax_percentage_255 = TaxPercentageFactory.create(value=25.5)
    payment_type_online = ReservationUnitPaymentTypeFactory.create(code="ONLINE")

    ###########################################################################################################
    # Create payment terms
    ###########################################################################################################

    payment_terms_free_of_charge = TermsOfUseFactory.create(
        id="pay0",
        name="Maksuehto - maksuton",
        name_fi="Maksuehto - maksuton",
        name_en="Payment terms - free of charge",
        name_sv="Betalningsvillkor - kostnadsfritt",
        text="",
        terms_type=TermsOfUseTypeChoices.PAYMENT,
    )
    payment_terms_1 = TermsOfUseFactory.create(
        id="pay1",
        name="Maksuehto 1 - vain verkkomaksaminen",
        name_fi="Maksuehto 1 - vain verkkomaksaminen",
        name_en="Term of payment 1: online payment only",
        name_sv="Betalningsvillkor 1 - endast onlinebetalning",
        text=(
            "Varaus maksetaan kokonaisuudessaan etukäteen varauksenteon yhteydessä. "
            "Palvelussa ilmoitetut hinnat sisältävät arvolisäveron. "
            "Mahdolliset lisäpalvelut eivät sisälly hintaan.",
        ),
        terms_type=TermsOfUseTypeChoices.PAYMENT,
    )
    payment_terms_3 = TermsOfUseFactory.create(
        id="pay3",
        name="Maksuehto 3 - verkkomaksu + lasku, alennus",
        name_fi="Maksuehto 3 - verkkomaksu + lasku, alennus",
        name_en="Term of payment 3: online payment + invoice, discount",
        name_sv="Betalningsvillkor 3 - onlinebetalning + faktura, rabatt",
        text=(
            "Varaus maksetaan kokonaisuudessaan etukäteen varauksenteon yhteydessä. "
            "Maksutonta käyttöä tai alennusta on haettava varaamisen yhteydessä. "
            "Jälkikäteen tehtyjä alennus- tai maksuttomuuspyyntöjä ei käsitellä. "
            "Jos haet maksutonta tai alennettua käyttöä, varauksesi siirtyy käsittelyyn. "
            "Käsittelyn jälkeen maksuttomana hyväksytty varaus ei vaadi toimenpiteitä. "
            "Alennettu hinta laskutetaan. Jos valitset maksutavaksi laskun, "
            "varaus tulee maksaa eräpäivään mennessä. Lasku maksutapana edellyttää "
            "vähintään 18 vuoden ikää. Palvelussa ilmoitetut hinnat sisältävät arvolisäveron. "
            "Mahdolliset lisäpalvelut eivät sisälly hintaan.",
        ),
        terms_type=TermsOfUseTypeChoices.PAYMENT,
    )
    payment_terms_4 = TermsOfUseFactory.create(
        id="pay4",
        name="Maksuehto 4 - verkkomaksu + lasku, käsittely",
        name_fi="Maksuehto 4 - verkkomaksu + lasku, käsittely",
        name_en="Term of payment 4: online payment + invoice, processing",
        name_sv="Betalningsvillkor 4 - onlinebetalning + faktura, handläggning",
        text=(
            "Varauksesi siirtyy käsittelyyn. Varaus maksetaan kokonaisuudessaan "
            "varauksen vahvistamisen jälkeen. Maksutonta käyttöä tai alennusta "
            "on haettava varaamisen yhteydessä. Jälkikäteen tehtyjä alennus- "
            "tai maksuttomuuspyyntöjä ei käsitellä. Käsittelyn jälkeen maksuttomana "
            "hyväksytty varaus ei vaadi toimenpiteitä. Alennettu hinta laskutetaan. "
            "Jos valitset maksutavaksi laskun, varaus tulee maksaa eräpäivään mennessä. "
            "Lasku maksutapana edellyttää vähintään 18 vuoden ikää. Palvelussa "
            "ilmoitetut hinnat sisältävät arvolisäveron. Mahdolliset lisäpalvelut "
            "eivät sisälly hintaan."
        ),
        terms_type=TermsOfUseTypeChoices.PAYMENT,
    )

    ###########################################################################################################
    # Create service terms
    ###########################################################################################################

    service_terms_oodi = TermsOfUseFactory.create(
        id="KUVA_oodi",
        name="KUVA - Oodi, maksulliset",
        name_fi="KUVA - Oodi, maksulliset",
        name_en="KUVA - Oodi, maksulliset",
        name_sv="KUVA - Oodi, maksulliset",
        text=(
            "Varaajan tulee olla täysi-ikäinen. Tilassa järjestettävä tilaisuus "
            "ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä."
        ),
        terms_type=TermsOfUseTypeChoices.SERVICE,
    )
    service_terms_library = TermsOfUseFactory.create(
        id="KUVA_aluekirjasto",
        name="KUVA - Aluekirjasto",
        name_fi="KUVA - Aluekirjasto",
        name_en="KUVA - Aluekirjasto",
        name_sv="KUVA - Aluekirjasto",
        text=("Tähän varaukseen sovelletaan Helsingin kaupungin tilojen ja laitteiden varaamisen sopimusehtoja."),
        terms_type=TermsOfUseTypeChoices.SERVICE,
    )
    service_terms_gadgets = TermsOfUseFactory.create(
        id="KUVAlaite",
        name="Laitteet ja soittimet",
        name_fi="Laitteet ja soittimet",
        name_en="Devices and musical instruments",
        name_sv="Utrustning och instrument",
        text=(
            "Mikäli työsi ei valmistu varaamasi ajan sisällä, "
            "työ keskeytetään seuraavan varauksen alkaessa. "
            "Laite tai soitin on tarkoitettu omaan luovaan toimintaan. "
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen "
            "tulonhankinta ei ole sallittua."
        ),
        terms_type=TermsOfUseTypeChoices.SERVICE,
    )
    service_terms_youth = TermsOfUseFactory.create(
        id="KUVA_nupa",
        name="KUVA - Nuorisopalvelut",
        name_fi="KUVA - Nuorisopalvelut",
        name_en="KUVA - Youth services",
        name_sv="KUVA - Ungdomstjänster",
        text=(
            "TÄYDENTÄVÄT SOPIMUSEHDOT Nuorisotilat ovat päihteettömiä. "
            "Nuorisotiloja ei luovuteta yksittäisen puolueen, ehdokkaan "
            "tai valitsijayhdistyksen vaalitilaisuuksia varten. "
            "Yöpyminen on sallittu vain nuorisopalveluiden leirikeskuksissa "
            "tai vastaavissa tiloissa, jotka on tarkoitettu yöpymiseen."
        ),
        terms_type=TermsOfUseTypeChoices.SERVICE,
    )

    ###########################################################################################################
    # Create cancel terms
    ###########################################################################################################

    cancel_terms_cannot_cancel = TermsOfUseFactory.create(
        id="cancelnotallowed",
        name="Ei peruutus- tai muutosoikeutta",
        name_fi="Ei peruutus- tai muutosoikeutta",
        name_en="Ei peruutus- tai muutosoikeutta",
        name_sv="Ei peruutus- tai muutosoikeutta",
        text=(
            "Varaus on sitova. Varauksen peruminen tai ajankohdan muuttaminen "
            "ei ole mahdollista. Jos varaus on maksullinen, käyttämättä "
            "jääneen vuoron maksua ei palauteta."
        ),
        terms_type=TermsOfUseTypeChoices.CANCELLATION,
    )
    cancel_terms_zero_days = TermsOfUseFactory.create(
        id="cancel0days",
        name="Peruttavissa alkamiseen asti",
        name_fi="Peruttavissa alkamiseen asti",
        name_en="Cancellable until reservation starts",
        name_sv="Kan avbokas fram till bokningens starttid",
        text=(
            "Varauksen voi perua Varaamossa veloituksetta ennen varauksen alkamista. "
            "Myöhästyessäsi yli 15 minuuttia varaus vapautetaan muiden käyttöön."
        ),
        terms_type=TermsOfUseTypeChoices.CANCELLATION,
    )
    cancel_terms_14_days = TermsOfUseFactory.create(
        id="cancel2weeks",
        name="Peruutusehto - 2 vko (14vrk)",
        name_fi="Peruutusehto - 2 vko (14vrk)",
        name_en="Cancellation policy - Two-weeks",
        name_sv="Avbokningsvillkor - 2 veckor",
        text=(
            "Varauksen voi perua veloituksetta kaksi viikkoa (14 vrk) ennen varauksen alkamista. "
            "Myöhemmin tehdyistä peruutuksista peritään täysi hinta."
        ),
        terms_type=TermsOfUseTypeChoices.CANCELLATION,
    )

    ###########################################################################################################
    # Create pricing terms
    ###########################################################################################################

    pricing_terms_youth = TermsOfUseFactory.create(
        id="pricing_nupa",
        name="KUVA - Nuorisopalveluiden alennusperusteet",
        name_fi="KUVA - Nuorisopalveluiden alennusperusteet",
        name_en="KUVA - Nuorisopalveluiden alennusperusteet",
        name_sv="KUVA - Nuorisopalveluiden alennusperusteet",
        text=(
            "NUORISOPALVELUIDEN TILOJEN KÄYTÖN JA PALVELUIDEN MAKSUPERUSTEET "
            "Nuorisopalveluiden tilojen käyttö ja palvelut jakautuvat "
            "maksuttomaan ja maksulliseen käyttöön. MAKSUTON KÄYTTÖ - "
            "Rekisteröityneiden helsinkiläisten järjestöjen ja yhdistysten "
            "toiminta. - Helsinkiläisten asukkaiden ja yhteisöjen omaehtoinen "
            "ryhmätoiminta ja kansalaistoiminta. - Perusopetuslain mukainen "
            "koululaisten iltapäivätoiminta, taiteen perusopetuksen ryhmä- "
            "ja yksilöopetus sekä kotouttamista edistävä ryhmätoiminta. "
            "Alle 29-vuotialle suunnattu oppilaitosten toiminta on aina "
            "maksutonta. - Helsingin kaupungin toimialojen ja kaupunginkanslian "
            "oma toiminta. MAKSULLINEN KÄYTTÖ - Yritysten ja uskonnollisten "
            "yhdyskuntien toiminta. - Muiden kuntien asukkaiden ja yhteisöjen "
            "järjestämä toiminta. - Muiden toimijoiden järjestämä toiminta. "
            "- Yksityistilaisuudet MUUTOKSENHAKU HINNOITTELUUN Aluepäällikkö "
            "on oikeutettu soveltamaan hinnastossa määriteltyä hintaa, kun "
            "muutos liittyy hinnoittelun tarkoituksenmukaiseen kohtuullistamiseen, "
            "varauksen tekijän sitä kirjallisesti hakiessa."
        ),
        terms_type=TermsOfUseTypeChoices.PAYMENT,
    )

    ###########################################################################################################
    # Create cancel rules
    ###########################################################################################################

    cancel_rule_until_begin = ReservationUnitCancellationRuleFactory.create(
        name="Varauksen alkuun asti",
        name_fi="Varauksen alkuun asti",
        name_en="Varauksen alkuun asti",
        name_sv="Varauksen alkuun asti",
        can_be_cancelled_time_before=timedelta(seconds=1),
        needs_handling=False,
    )
    cancel_rule_14_days = ReservationUnitCancellationRuleFactory.create(
        name="14 vrk ennen alkamista",
        name_fi="14 vrk ennen alkamista",
        name_en="14 days before start",
        name_sv="14 dagar innan start",
        can_be_cancelled_time_before=timedelta(days=14),
        needs_handling=False,
    )

    ###########################################################################################################
    # Create reservation unit types
    ###########################################################################################################

    reservation_unit_type_gadget = ReservationUnitTypeFactory.create(
        name="Laitteet ja välineet",
        name_fi="Laitteet ja välineet",
        name_en="Devices and tools",
        name_sv="Varor och verktyg",
    )
    reservation_unit_type_multipurpose = ReservationUnitTypeFactory.create(
        name="Monitoimitila",
        name_fi="Monitoimitila",
        name_en="Multi-purpose space",
        name_sv="Allaktivitetslokal",
    )
    reservation_unit_type_exercise = ReservationUnitTypeFactory.create(
        name="Sisäliikuntatila",
        name_fi="Sisäliikuntatila",
        name_en="Indoor exercise facility",
        name_sv="Inomhusidrottslokal",
    )
    reservation_unit_type_teaching = ReservationUnitTypeFactory.create(
        name="Opetustila",
        name_fi="Opetustila",
        name_en="Teaching facility",
        name_sv="Undervisningslokal",
    )
    reservation_unit_type_work = ReservationUnitTypeFactory.create(
        name="Työpiste",
        name_fi="Työpiste",
        name_en="Workstation",
        name_sv="Arbetsstation",
    )

    ###########################################################################################################
    # Create qualifiers
    ###########################################################################################################

    qualifier_under_15 = QualifierFactory.create(
        name="varattavissa alle 15-vuotiaille",
        name_fi="varattavissa alle 15-vuotiaille",
        name_en="Available for below 15 years of age",
        name_sv="kan bokas för under 15 år",
    )

    ###########################################################################################################
    # Create payment merchants
    ###########################################################################################################

    payment_merchant_library_ita = PaymentMerchantFactory.create(
        id="418a4349-a561-4e0f-aee7-57947a77de6e",
        name="Itäkeskuksen kirjasto",
    )
    payment_merchant_library_pih = PaymentMerchantFactory.create(
        id="c9acaa73-b582-471c-b002-b038a8c00fb1",
        name="Pihlajasaarten testikirjasto",
    )

    ###########################################################################################################
    # Create payment accounting
    ###########################################################################################################

    payment_accounting_library_ita = PaymentAccountingFactory.create(
        name="Itäkeskuksen kirjasto",
        company_code="2900",
        main_ledger_account="340025",
        vat_code="44",
        internal_order="2941505900",
        profit_center="2941505",
        operation_area="290010",
    )
    payment_accounting_library_pih = PaymentAccountingFactory.create(
        name="Pihlajasaarten testikirjasto",
        company_code="2900",
        main_ledger_account="340025",
        vat_code="44",
        internal_order="2941505900",
        profit_center="2941505",
    )

    ###########################################################################################################
    # Create equipment categories
    ###########################################################################################################

    equipment_category_furniture = EquipmentCategoryFactory.create(
        name="Huonekalut",
        name_fi="Huonekalut",
        name_en="Furniture",
        name_sv="Möbel",
    )
    equipment_category_electronics = EquipmentCategoryFactory.create(
        name="Tekniikka",
        name_fi="Tekniikka",
        name_en="Electronics",
        name_sv="Elektronik",
    )
    equipment_category_connectors = EquipmentCategoryFactory.create(
        name="Liittimet",
        name_fi="Liittimet",
        name_en="Connectors",
        name_sv="Kontakter",
    )
    equipment_category_kitchen = EquipmentCategoryFactory.create(
        name="Keittiö",
        name_fi="Keittiö",
        name_en="Kitchen",
        name_sv="Kök",
    )
    equipment_category_other = EquipmentCategoryFactory.create(
        name="Muu",
        name_fi="Muu",
        name_en="Other",
        name_sv="Övrig",
    )
    equipment_category_exercise = EquipmentCategoryFactory.create(
        name="Liikunta- ja pelivälineet",
        name_fi="Liikunta- ja pelivälineet",
        name_en="Exercise and game equipment",
        name_sv="Tränings- och spelutrustning",
    )
    equipment_category_console = EquipmentCategoryFactory.create(
        name="Pelikonsoli",
        name_fi="Pelikonsoli",
        name_en="Pelikonsoli",
        name_sv="Pelikonsoli",
    )

    ###########################################################################################################
    # Create equipments
    ###########################################################################################################

    equipment_couches = EquipmentFactory.create(
        name="Sohvaryhmä",
        name_fi="Sohvaryhmä",
        name_en="Sofa set",
        name_sv="Soffgrupp",
        category=equipment_category_furniture,
    )
    equipment_chair = EquipmentFactory.create(
        name="Pöytä tai pöytiä",
        name_fi="Pöytä tai pöytiä",
        name_en="Table or tables",
        name_sv="Ett eller flera bord",
        category=equipment_category_furniture,
    )
    equipment_seats = EquipmentFactory.create(
        name="Istumapaikkoja",
        name_fi="Istumapaikkoja",
        name_en="Seats",
        name_sv="Sittplatser",
        category=equipment_category_furniture,
    )
    equipment_sound = EquipmentFactory.create(
        name="Äänitekniikka",
        name_fi="Äänitekniikka",
        name_en="Sound system",
        name_sv="Sittplatser",
        category=equipment_category_electronics,
    )
    equipment_hdmi = EquipmentFactory.create(
        name="HDMI",
        name_fi="HDMI",
        name_en="HDMI",
        name_sv="HDMI",
        category=equipment_category_connectors,
    )
    equipment_fridge = EquipmentFactory.create(
        name="Jääkaappi",
        name_fi="Jääkaappi",
        name_en="Fridge",
        name_sv="Kylskåp",
        category=equipment_category_kitchen,
    )
    equipment_display = EquipmentFactory.create(
        name="Näyttö",
        name_fi="Näyttö",
        name_en="Display",
        name_sv="Skärm",
        category=equipment_category_electronics,
    )
    equipment_extension_cord = EquipmentFactory.create(
        name="Jatkojohto",
        name_fi="Jatkojohto",
        name_en="Extension cord",
        name_sv="Kkarvsladd",
        category=equipment_category_connectors,
    )
    equipment_click_share = EquipmentFactory.create(
        name="ClickShare",
        name_fi="ClickShare",
        name_en="ClickShare",
        name_sv="ClickShare",
        category=equipment_category_electronics,
    )
    equipment_stove = EquipmentFactory.create(
        name="Liesi",
        name_fi="Liesi",
        name_en="Stove",
        name_sv="Spis",
        category=equipment_category_kitchen,
    )
    equipment_coffee_machine = EquipmentFactory.create(
        name="Kahvinkeitin",
        name_fi="Kahvinkeitin",
        name_en="Coffee maker",
        name_sv="Kaffekokare",
        category=equipment_category_kitchen,
    )
    equipment_billiard_table = EquipmentFactory.create(
        name="Biljardipöytä",
        name_fi="Biljardipöytä",
        name_en="Billiard",
        name_sv="Biljard",
        category=equipment_category_exercise,
    )
    equipment_exercise_equipment = EquipmentFactory.create(
        name="Liikuntavälineitä",
        name_fi="Liikuntavälineitä",
        name_en="Exercise equipment",
        name_sv="Motionsredskap",
        category=equipment_category_exercise,
    )
    equipment_scart = EquipmentFactory.create(
        name="SCART",
        name_fi="SCART",
        name_en="SCART",
        name_sv="SCART",
        category=equipment_category_connectors,
    )
    equipment_studio_equipment = EquipmentFactory.create(
        name="Studiolaitteisto",
        name_fi="Studiolaitteisto",
        name_en="Studio equipment",
        name_sv="Studioutrustning",
        category=equipment_category_electronics,
    )
    equipment_freezer = EquipmentFactory.create(
        name="Pakastin",
        name_fi="Pakastin",
        name_en="Freezer",
        name_sv="Frys",
        category=equipment_category_kitchen,
    )
    equipment_mirror_wall = EquipmentFactory.create(
        name="Peiliseinä",
        name_fi="Peiliseinä",
        name_en="Mirror wall",
        name_sv="Spegelvägg",
        category=equipment_category_other,
    )
    equipment_internet_other = EquipmentFactory.create(
        name="Muu internet-yhteys",
        name_fi="Muu internet-yhteys",
        name_en="Other internet connection",
        name_sv="Annan internetuppkoppling",
        category=equipment_category_electronics,
    )
    equipment_nintendo_ds = EquipmentFactory.create(
        name="Nintendo DS",
        name_fi="Nintendo DS",
        name_en="Nintendo DS",
        name_sv="Nintendo DS",
        category=equipment_category_console,
    )
    equipment_nintendo_wii = EquipmentFactory.create(
        name="Nintendo Wii",
        name_fi="Nintendo Wii",
        name_en="Nintendo Wii",
        name_sv="Nintendo Wii",
        category=equipment_category_console,
    )
    equipment_nintendo_switch = EquipmentFactory.create(
        name="Nintendo Switch",
        name_fi="Nintendo Switch",
        name_en="Nintendo Switch",
        name_sv="Nintendo Switch",
        category=equipment_category_console,
    )
    equipment_nintendo_switch_lite = EquipmentFactory.create(
        name="Nintendo Switch Lite",
        name_fi="Nintendo Switch Lite",
        name_en="Nintendo Switch Lite",
        name_sv="Nintendo Switch Lite",
        category=equipment_category_console,
    )
    equipment_microwave = EquipmentFactory.create(
        name="Mikroaaltouuni",
        name_fi="Mikroaaltouuni",
        name_en="Microwave oven",
        name_sv="Mikrovågsugn",
        category=equipment_category_kitchen,
    )
    equipment_dvi = EquipmentFactory.create(
        name="DVI",
        name_fi="DVI",
        name_en="DVI",
        name_sv="DVI",
        category=equipment_category_connectors,
    )
    equipment_display_port = EquipmentFactory.create(
        name="DisplayPort (DP)",
        name_fi="DisplayPort (DP)",
        name_en="DisplayPort (DP)",
        name_sv="DisplayPort (DP)",
        category=equipment_category_connectors,
    )
    equipment_stage = EquipmentFactory.create(
        name="Esiintymislava",
        name_fi="Esiintymislava",
        name_en="Stage",
        name_sv="Scen",
        category=equipment_category_other,
    )
    equipment_dishwasher = EquipmentFactory.create(
        name="Astianpesukone",
        name_fi="Astianpesukone",
        name_en="Dishwasher",
        name_sv="Diskmaskin",
        category=equipment_category_kitchen,
    )
    equipment_whiteboard = EquipmentFactory.create(
        name="Valkokangas",
        name_fi="Valkokangas",
        name_en="Screen",
        name_sv="Filmduk",
        category=equipment_category_other,
    )

    ###########################################################################################################
    # Create hauki resources
    ###########################################################################################################

    aina_kasiteltava_kellarikerros_hauki = OriginHaukiResourceFactory.create(id=2955417)
    maksuton_mankeli_hauki = OriginHaukiResourceFactory.create(id=2955387)
    aina_maksullinen_aitio_hauki = OriginHaukiResourceFactory.create(id=2956357)
    alennuskelpoinen_aula_hauki = OriginHaukiResourceFactory.create(id=2956356)
    perumiskelvoton_parveke_hauki = OriginHaukiResourceFactory.create(id=2956355)
    perumiskelvoton_patio_hauki = OriginHaukiResourceFactory.create(id=2955391)
    toistuvien_varausten_toimisto_hauki = OriginHaukiResourceFactory.create(id=2955392)
    tauotettu_takkahuone_hauki = OriginHaukiResourceFactory.create(id=2956352)
    aina_kasiteltava_kammio_hauki = OriginHaukiResourceFactory.create(id=2956549)

    today = local_date()
    reservable_times = [
        ReservableTimeSpanFactory.build(
            resource=hauki_resource,
            start_datetime=combine(
                date=today + datetime.timedelta(days=day),
                time=datetime.time(10, tzinfo=DEFAULT_TIMEZONE),
            ),
            end_datetime=combine(
                date=today + datetime.timedelta(days=day),
                time=datetime.time(20, tzinfo=DEFAULT_TIMEZONE),
            ),
        )
        for hauki_resource in [
            aina_kasiteltava_kellarikerros_hauki,
            maksuton_mankeli_hauki,
            aina_maksullinen_aitio_hauki,
            alennuskelpoinen_aula_hauki,
            perumiskelvoton_parveke_hauki,
            perumiskelvoton_patio_hauki,
            toistuvien_varausten_toimisto_hauki,
            tauotettu_takkahuone_hauki,
            aina_kasiteltava_kammio_hauki,
        ]
        for day in range(721)
    ]
    ReservableTimeSpan.objects.bulk_create(reservable_times)

    ###########################################################################################################
    # Create reservation unit: Aina käsiteltävä kellarikerros
    ###########################################################################################################

    aina_kasiteltava_kellarikerros = ReservationUnitFactory.create(
        uuid="293d595f-738d-4e21-91fd-9c68d5a83dc5",
        name="Aina käsiteltävä kellarikerros",
        name_fi="Aina käsiteltävä kellarikerros FI",
        name_en="Aina käsiteltävä kellarikerros EN",
        name_sv="Aina käsiteltävä kellarikerros SV",
        description=(
            "<p>Käytä tätä varausyksikköä, kun haluan varata varausyksikön, "
            "jonka kaikki varaukset siirtyvät käsittelyyn. Varaus tulee hyväksyä "
            "tai hyläytä käsittelijän puolelta. Varauksen voi tehdä 30 min välein, "
            "aikaslotti 3vrk-3kk. Peruutusaika on 14 vrk, tämän jälkeen varausta "
            "ei voi perua. Käytössä lomake 3 maksuttomuuspyyntösallittu. "
            "Tämä varausyksikkö vastaa nuorisopalvelun tiloja.</p>"
            "<p><br></p>"
            "<p>Tämä on esimerkkitekstiä eikä liity varaukseen. Mankeli Bernina 1008 "
            "sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa.</p>"
            "<p><br></p>"
            "<p>Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia ja "
            "muita perusompelutarvikkeita. Koneella ei voi ommella parkkinahkaa tai "
            "hyvin paksuja kankaita. Ilmoittaudu henkilökunnalle ennen varausaikasi "
            "alkamista. Ennen kuin saat laitteen käyttöösi, sinun on esitettävä "
            "kirjastokortti, jossa on voimassa oleva lainausoikeus.</p>"
            "<p><br></p>"
            "<p>Laitetta voi käyttää omaan luovaan toimintaan. Tilaustöiden tekeminen "
            "korvausta vastaan tai ammattimainen tulonhankinta esimerkiksi myymällä "
            "kirjastossa tuotettuja tuotteita ei ole sallittua.</p>"
        ),
        description_en="English description goes here.",
        description_sv="Svensk beskrivning går här.",
        terms_of_use=(
            "<p>Tässä varausyksikössä kaikki varaukset siirtyvät käsittelyyn. "
            "Varaus tulee hyväksyä tai hylätä käsittelijän puolelta.</p>"
        ),
        terms_of_use_en="English terms of use goes here.",
        terms_of_use_sv="Svenska användarvillkor finns här.",
        min_reservation_duration=timedelta(hours=1),
        max_reservation_duration=timedelta(hours=6),
        min_persons=1,
        max_persons=50,
        surface_area=100,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservations_min_days_before=3,
        reservations_max_days_before=90,
        require_reservation_handling=True,
        reservation_kind=ReservationKind.DIRECT,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        unit=caisa,
        reservation_unit_type=reservation_unit_type_multipurpose,
        payment_terms=payment_terms_4,
        cancellation_terms=cancel_terms_14_days,
        service_specific_terms=service_terms_youth,
        pricing_terms=pricing_terms_youth,
        cancellation_rule=cancel_rule_14_days,
        metadata_set=metadata_sets[SetName.set_4],
        payment_merchant=payment_merchant_library_pih,
        payment_accounting=payment_accounting_library_pih,
        origin_hauki_resource=aina_kasiteltava_kellarikerros_hauki,
        payment_product=PaymentProductFactory.create(
            id="31382206-6783-3868-aa1b-85545823edd8",
            merchant=payment_merchant_library_pih,
        ),
    )
    aina_kasiteltava_kellarikerros.spaces.add(
        SpaceFactory.create(
            name="Aina käsiteltävä kellarikerros",
            name_fi="Aina käsiteltävä kellarikerros FI",
            name_en="Aina käsiteltävä kellarikerros EN",
            name_sv="Aina käsiteltävä kellarikerros SV",
            surface_area=100,
            max_persons=50,
            unit=caisa,
        ),
    )
    aina_kasiteltava_kellarikerros.equipments.add(
        equipment_couches,
        equipment_chair,
        equipment_seats,
        equipment_sound,
        equipment_hdmi,
        equipment_fridge,
        equipment_display,
        equipment_extension_cord,
    )
    aina_kasiteltava_kellarikerros.payment_types.add(payment_type_online)
    ReservationUnitPricingFactory.create(
        reservation_unit=aina_kasiteltava_kellarikerros,
        begins=date(2023, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
        lowest_price=0.0,
        highest_price=40.0,
        tax_percentage=tax_percentage_255,
    )

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=aina_kasiteltava_kellarikerros,
        image_url=(
            "https://tilavaraus.test.hel.ninja/"
            "media/reservation_unit_images/JPG-1_varaamo_oodi_20112023_kuva_maija_astikainen-1274-Edit_oMzGYv0.jpg"
        ),
        filename="JPG-1_varaamo_oodi_20112023_kuva_maija_astikainen-1274-Edit_oMzGYv0",
    )
    if image is not None:
        image.save()

    ###########################################################################################################
    # Create reservation unit: Maksuton mankeli
    ###########################################################################################################

    maksuton_mankeli = ReservationUnitFactory.create(
        uuid="2160b0cf-518a-482f-bd6c-2676e5682045",
        name="Maksuton mankeli",
        name_fi="Maksuton mankeli FI",
        name_en="Maksuton mankeli EN",
        name_sv="Maksuton mankeli SV",
        description=(
            "<p>Käytä tätä varausyksikköä, kun haluan varata suorimman ja "
            "yksinkertaisimman prosessin mukaan. Varaaminen on maksutonta "
            "ja kaikki varaukset hyväksytään. Varauksen voi tehdä 30 min "
            "välein, aikaslotti 0vrk-3kk. Peruutusaikaa ei ole, joten "
            "varauksen voi perua sen alkuun asti. Käytössä yksinkertaisin lomake 1. "
            "Tämä varausyksikkö vastaa kirjaston laitteita.</p>"
            "<p><br></p>"
            "<p>Tämä on esimerkkitekstiä eikä liity varaukseen. "
            "Mankeli Bernina 1008 sijaitsee kirjaston kaupunkiverstaalla "
            "sisääntulokerroksessa.</p>"
            "<p><br></p>"
            "<p>Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, "
            "saksia ja muita perusompelutarvikkeita. Koneella ei voi "
            "ommella parkkinahkaa tai hyvin paksuja kankaita. Ilmoittaudu "
            "henkilökunnalle ennen varausaikasi alkamista. Ennen "
            "kuin saat laitteen käyttöösi, sinun on esitettävä kirjastokortti, "
            "jossa on voimassa oleva lainausoikeus.</p>"
            "<p><br></p>"
            "<p>Laitetta voi käyttää omaan luovaan toimintaan. "
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen "
            "tulonhankinta esimerkiksi myymällä kirjastossa tuotettuja "
            "tuotteita ei ole sallittua.</p>"
        ),
        description_en="English description goes here.",
        description_sv="Svensk beskrivning går här.",
        terms_of_use="",
        min_reservation_duration=timedelta(minutes=30),
        max_reservation_duration=timedelta(hours=3),
        min_persons=None,
        max_persons=1,
        surface_area=100,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        require_reservation_handling=False,
        reservation_kind=ReservationKind.DIRECT,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        unit=caisa,
        reservation_unit_type=reservation_unit_type_gadget,
        payment_terms=payment_terms_free_of_charge,
        cancellation_terms=cancel_terms_zero_days,
        service_specific_terms=service_terms_gadgets,
        cancellation_rule=cancel_rule_until_begin,
        metadata_set=metadata_sets[SetName.set_1],
        origin_hauki_resource=maksuton_mankeli_hauki,
    )
    maksuton_mankeli.spaces.add(
        SpaceFactory.create(
            name="Maksuton mankeli",
            name_fi="Maksuton mankeli FI",
            name_en="Maksuton mankeli EN",
            name_sv="Maksuton mankeli SV",
            surface_area=100,
            max_persons=1,
            unit=caisa,
        ),
    )
    maksuton_mankeli.equipments.add(equipment_click_share)
    maksuton_mankeli.qualifiers.add(qualifier_under_15)
    ReservationUnitPricingFactory.create(
        reservation_unit=maksuton_mankeli,
        begins=date(2023, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
        lowest_price=0.0,
        highest_price=0.0,
        tax_percentage=tax_percentage_0,
    )

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=maksuton_mankeli,
        image_url="https://tilavaraus.test.hel.ninja/media/reservation_unit_images/Kuva1.png",
        filename="Kuva1",
        extension=".png",
    )
    if image is not None:
        image.save()

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=maksuton_mankeli,
        image_url="https://tilavaraus.test.hel.ninja/media/reservation_unit_images/Kuva2.png",
        filename="Kuva2",
        extension=".png",
        image_type=ReservationUnitImageType.OTHER,
    )
    if image is not None:
        image.save()

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=maksuton_mankeli,
        image_url="https://tilavaraus.test.hel.ninja/media/reservation_unit_images/Kuva3.png",
        filename="Kuva3",
        extension=".png",
        image_type=ReservationUnitImageType.OTHER,
    )
    if image is not None:
        image.save()

    ###########################################################################################################
    # Create reservation unit: Aina maksullinen Aitio
    ###########################################################################################################

    aina_maksullinen_aitio = ReservationUnitFactory.create(
        uuid="349b8fb8-105d-40ee-a1a1-a515cd1a7c12",
        name="Aina maksullinen Aitio",
        name_fi="Aina maksullinen Aitio FI",
        name_en="Aina maksullinen Aitio EN",
        name_sv="Aina maksullinen Aitio SV",
        description=(
            "<p>Käytä tätä varausyksikköä, kun haluan varata maksullisen "
            "tilan suorimman prosessin mukaan. Varaaja voi olla yhdistys, "
            "yritys tai yksityishenkilö. Varaaminen on maksullista ja "
            "varaus tulee maksaa verkkokaupassa. Kaikki maksetut varaukset "
            "hyväksytään. Varauksen voi tehdä 30 min välein, aikaslotti "
            "0vrk-3kk. Peruutusaika on varauksen alkuun asti. Kun perut "
            "varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 3. Tämä varausyksikkö vastaa asetuksiltaan "
            "esim. Oodin keittiötä, mutta peruutusaika on joustavampi.</p>"
            "<p><br></p>"
            "<p>Tämä on esimerkkitekstiä eikä liity varaukseen. Mankeli "
            "Bernina 1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa.</p>"
            "<p><br></p>"
            "<p>Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, "
            "saksia ja muita perusompelutarvikkeita. Koneella ei voi ommella "
            "parkkinahkaa tai hyvin paksuja kankaita. Ilmoittaudu henkilökunnalle "
            "ennen varausaikasi alkamista.&nbsp;Ennen kuin saat laitteen "
            "käyttöösi, sinun on esitettävä kirjastokortti, jossa on voimassa "
            "oleva lainausoikeus.</p>"
            "<p><br></p>"
            "<p>Laitetta voi käyttää omaan luovaan toimintaan. "
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen "
            "tulonhankinta esimerkiksi myymällä kirjastossa tuotettuja "
            "tuotteita ei ole sallittua.</p>"
        ),
        description_en="English description goes here.",
        description_sv="Svensk beskrivning går här.",
        terms_of_use='<p><span style="color: rgb(0, 0, 0);">Varaus tulee maksaa verkkokaupassa.</span></p>',
        terms_of_use_en="English terms of use goes here.",
        terms_of_use_sv="Svenska användarvillkor finns här.",
        min_reservation_duration=timedelta(hours=1),
        max_reservation_duration=timedelta(hours=6),
        min_persons=4,
        max_persons=6,
        surface_area=50,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        require_reservation_handling=False,
        reservation_kind=ReservationKind.DIRECT,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        unit=caisa,
        reservation_unit_type=reservation_unit_type_exercise,
        payment_terms=payment_terms_1,
        cancellation_terms=cancel_terms_14_days,
        service_specific_terms=service_terms_oodi,
        cancellation_rule=cancel_rule_until_begin,
        metadata_set=metadata_sets[SetName.set_3],
        payment_merchant=payment_merchant_library_ita,
        payment_accounting=payment_accounting_library_ita,
        origin_hauki_resource=aina_maksullinen_aitio_hauki,
        payment_product=PaymentProductFactory.create(
            id="2d01d6ec-a235-32cd-91a5-850d6f22c821",
            merchant=payment_merchant_library_ita,
        ),
    )
    aina_maksullinen_aitio.spaces.add(
        SpaceFactory.create(
            name="Aina maksullinen Aitio",
            name_fi="Aina maksullinen Aitio FI",
            name_en="Aina maksullinen Aitio EN",
            name_sv="Aina maksullinen Aitio SV",
            surface_area=50,
            max_persons=5,
            unit=caisa,
        ),
    )
    aina_maksullinen_aitio.equipments.add(
        equipment_stove,
        equipment_coffee_machine,
        equipment_billiard_table,
        equipment_exercise_equipment,
    )
    aina_maksullinen_aitio.payment_types.add(payment_type_online)
    ReservationUnitPricingFactory.create(
        reservation_unit=aina_maksullinen_aitio,
        begins=date(2023, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
        lowest_price=40.0,
        highest_price=40.0,
        tax_percentage=tax_percentage_255,
    )

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=aina_maksullinen_aitio,
        image_url="https://tilavaraus.test.hel.ninja/media/reservation_unit_images/generoitukuva1_3CLHzHt.png",
        filename="generoitukuva1_3CLHzHt",
        extension=".png",
    )
    if image is not None:
        image.save()

    ###########################################################################################################
    # Create reservation unit: Alennuskelpoinen aula
    ###########################################################################################################

    alennuskelpoinen_aula = ReservationUnitFactory.create(
        uuid="0f022f59-4b21-44d7-83fb-5bb9a9e1759a",
        name="Alennuskelpoinen aula",
        name_fi="Alennuskelpoinen aula FI",
        name_en="Alennuskelpoinen aula EN",
        name_sv="Alennuskelpoinen aula SV",
        description=(
            "<p>Käytä tätä varausyksikköä, kun haluan varata joko "
            "maksullisen tilan tai hakea hinnan alennusta. "
            "Alennusta haettaessa varaus siirtyy aina käsittelyyn. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Jos et hae alennusta, varaaminen on maksullista ja "
            "varaus tulee maksaa verkkokaupassa. Kaikki maksetut "
            "varaukset hyväksytään. Varauksen voi tehdä 30 min välein, "
            "aikaslotti 0vrk-3kk. Peruutusaika on 14 vrk ennen varausta. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää "
            "automaattisesti. Käytössä lomake 4 maksullisuuspyyntö sallittu. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. nuorisopalvelun tiloja.</p>"
            "<p><br></p>"
            "<p>Tämä on esimerkkitekstiä eikä liity varaukseen. "
            "Mankeli Bernina 1008 sijaitsee kirjaston kaupunkiverstaalla "
            "sisääntulokerroksessa.</p>"
            "<p><br></p>"
            "<p>Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, "
            "saksia ja muita perusompelutarvikkeita. Koneella ei voi "
            "ommella parkkinahkaa tai hyvin paksuja kankaita. "
            "Ilmoittaudu henkilökunnalle ennen varausaikasi alkamista. "
            "Ennen kuin saat laitteen käyttöösi, sinun on esitettävä kirjastokortti, "
            "jossa on voimassa oleva lainausoikeus.</p>"
            "<p><br></p>"
            "<p>Laitetta voi käyttää omaan luovaan toimintaan. "
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen "
            "tulonhankinta esimerkiksi myymällä kirjastossa tuotettuja "
            "tuotteita ei ole sallittua.</p>"
        ),
        description_en="English description goes here.",
        description_sv="Svensk beskrivning går här.",
        terms_of_use="",
        min_reservation_duration=timedelta(minutes=30),
        max_reservation_duration=timedelta(hours=5),
        min_persons=None,
        max_persons=5,
        surface_area=10,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        require_reservation_handling=False,
        reservation_kind=ReservationKind.DIRECT_AND_SEASON,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        unit=caisa,
        reservation_unit_type=reservation_unit_type_teaching,
        payment_terms=payment_terms_3,
        cancellation_terms=cancel_terms_zero_days,
        service_specific_terms=service_terms_youth,
        pricing_terms=pricing_terms_youth,
        cancellation_rule=cancel_rule_14_days,
        metadata_set=metadata_sets[SetName.set_6],
        payment_merchant=payment_merchant_library_pih,
        payment_accounting=payment_accounting_library_pih,
        origin_hauki_resource=alennuskelpoinen_aula_hauki,
        payment_product=PaymentProductFactory.create(
            id="e32855cc-13a8-32a9-8e80-8f67b8286698",
            merchant=payment_merchant_library_pih,
        ),
    )
    alennuskelpoinen_aula.spaces.add(
        SpaceFactory.create(
            name="Alennuskelpoinen aula",
            name_fi="Alennuskelpoinen aula FI",
            name_en="Alennuskelpoinen aula EN",
            name_sv="Alennuskelpoinen aula SV",
            surface_area=10,
            max_persons=5,
            unit=caisa,
        ),
    )
    alennuskelpoinen_aula.equipments.add(
        equipment_couches,
        equipment_scart,
        equipment_studio_equipment,
        equipment_freezer,
        equipment_mirror_wall,
    )
    alennuskelpoinen_aula.payment_types.add(payment_type_online)
    ReservationUnitPricingFactory.create(
        reservation_unit=alennuskelpoinen_aula,
        begins=date(2023, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
        lowest_price=0.0,
        highest_price=30.0,
        tax_percentage=tax_percentage_255,
    )

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=alennuskelpoinen_aula,
        image_url="https://tilavaraus.test.hel.ninja/media/reservation_unit_images/123456_wwOt8W0.png",
        filename="123456_wwOt8W0",
        extension=".png",
    )
    if image is not None:
        image.save()

    ###########################################################################################################
    # Create reservation unit: Perumiskelvoton parveke
    ###########################################################################################################

    perumiskelvoton_parveke = ReservationUnitFactory.create(
        uuid="67dd01ea-1115-442e-86ed-79c144cd281c",
        name="Perumiskelvoton parveke, maksuton",
        name_fi="Perumiskelvoton parveke, maksuton FI",
        name_en="Perumiskelvoton parveke, maksuton EN",
        name_sv="Perumiskelvoton parveke, maksuton SV",
        description=(
            "<p>Käytä tätä varausyksikköä, kun haluan varata suorimman ja yksinkertaisimman "
            "prosessin mukaan. Käytössä on varauslomake 2. Varaaminen on maksutonta ja "
            "kaikki varaukset hyväksytään. Varaus on sitova ja sitä ei voi perua. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. Tämä varausyksikkö "
            "vastaa tenniskenttiä, mutta ei sisällä maksuominaisuutta.</p>"
            "<p><br></p>"
            "<p>Tämä on esimerkkitekstiä eikä liity varaukseen. Mankeli Bernina "
            "1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa.</p>"
            "<p><br></p>"
            "<p>Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia ja "
            "muita perusompelutarvikkeita. Koneella ei voi ommella parkkinahkaa tai "
            "hyvin paksuja kankaita. Ilmoittaudu henkilökunnalle ennen varausaikasi "
            "alkamista. Ennen kuin saat laitteen käyttöösi, sinun on esitettävä "
            "kirjastokortti, jossa on voimassa oleva lainausoikeus.</p>"
            "<p><br></p>"
            "<p>Laitetta voi käyttää omaan luovaan toimintaan. Tilaustöiden tekeminen "
            "korvausta vastaan tai ammattimainen tulonhankinta esimerkiksi myymällä "
            "kirjastossa tuotettuja tuotteita ei ole sallittua.</p>"
        ),
        description_en="English description goes here.",
        description_sv="Svensk beskrivning går här.",
        terms_of_use="",
        min_reservation_duration=timedelta(minutes=30),
        max_reservation_duration=timedelta(hours=5),
        min_persons=5,
        max_persons=15,
        surface_area=5,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        require_reservation_handling=False,
        reservation_kind=ReservationKind.DIRECT_AND_SEASON,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        unit=caisa,
        reservation_unit_type=reservation_unit_type_work,
        payment_terms=payment_terms_free_of_charge,
        cancellation_terms=cancel_terms_cannot_cancel,
        service_specific_terms=service_terms_library,
        metadata_set=metadata_sets[SetName.set_2],
        origin_hauki_resource=perumiskelvoton_parveke_hauki,
    )
    perumiskelvoton_parveke.spaces.add(
        SpaceFactory.create(
            name="Perumiskelvoton parveke, maksuton",
            name_fi="Perumiskelvoton parveke, maksuton FI",
            name_en="Perumiskelvoton parveke, maksuton EN",
            name_sv="Perumiskelvoton parveke, maksuton SV",
            surface_area=5,
            max_persons=15,
            unit=caisa,
        ),
    )
    perumiskelvoton_parveke.equipments.add(equipment_billiard_table)
    ReservationUnitPricingFactory.create(
        reservation_unit=perumiskelvoton_parveke,
        begins=date(2023, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
        lowest_price=0.0,
        highest_price=0.0,
        tax_percentage=tax_percentage_0,
    )

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=perumiskelvoton_parveke,
        image_url="https://tilavaraus.test.hel.ninja/media/reservation_unit_images/123456.png",
        filename="123456",
        extension=".png",
    )
    if image is not None:
        image.save()

    ###########################################################################################################
    # Create reservation unit: Perumiskelvoton patio
    ###########################################################################################################

    perumiskelvoton_patio = ReservationUnitFactory.create(
        uuid="9a09d859-62eb-4d8d-ae2b-1823d1e7644b",
        name="Perumiskelvoton patio, maksullinen",
        name_fi="Perumiskelvoton patio, maksullinen FI",
        name_en="Perumiskelvoton patio, maksullinen EN",
        name_sv="Perumiskelvoton patio, maksullinen SV",
        description=(
            "<p>Tämä on esimerkkitekstiä eikä liity varaukseen. Mankeli Bernina "
            "1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa.</p>"
            "<p><br></p>"
            "<p>Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia "
            "ja muita perusompelutarvikkeita. Koneella ei voi ommella parkkinahkaa "
            "tai hyvin paksuja kankaita. Ilmoittaudu henkilökunnalle ennen "
            "varausaikasi alkamista.&nbsp;Ennen kuin saat laitteen käyttöösi, "
            "sinun on esitettävä kirjastokortti, jossa on voimassa oleva "
            "lainausoikeus.</p>"
            "<p><br></p>"
            "<p>Laitetta voi käyttää omaan luovaan toimintaan. Tilaustöiden "
            "tekeminen korvausta vastaan tai ammattimainen tulonhankinta "
            "esimerkiksi myymällä kirjastossa tuotettuja tuotteita ei ole sallittua.</p>"
        ),
        description_en="English description goes here.",
        description_sv="Svensk beskrivning går här.",
        terms_of_use="",
        min_reservation_duration=timedelta(minutes=30),
        max_reservation_duration=timedelta(hours=1),
        min_persons=None,
        max_persons=30,
        surface_area=15,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        require_reservation_handling=False,
        reservation_kind=ReservationKind.DIRECT_AND_SEASON,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        unit=caisa,
        reservation_unit_type=reservation_unit_type_multipurpose,
        payment_terms=payment_terms_1,
        cancellation_terms=cancel_terms_cannot_cancel,
        service_specific_terms=service_terms_library,
        metadata_set=metadata_sets[SetName.set_3],
        payment_merchant=payment_merchant_library_pih,
        origin_hauki_resource=perumiskelvoton_patio_hauki,
        payment_product=PaymentProductFactory.create(
            id="459a183b-a55d-39f3-80d0-23f3e458b93d",
            merchant=payment_merchant_library_pih,
        ),
    )
    perumiskelvoton_patio.spaces.add(
        SpaceFactory.create(
            name="Perumiskelvoton patio, maksullinen",
            name_fi="Perumiskelvoton patio, maksullinen FI",
            name_en="Perumiskelvoton patio, maksullinen EN",
            name_sv="Perumiskelvoton patio, maksullinen SV",
            surface_area=15,
            max_persons=30,
            unit=caisa,
        ),
    )
    perumiskelvoton_patio.equipments.add(
        equipment_internet_other,
        equipment_nintendo_ds,
        equipment_nintendo_wii,
        equipment_nintendo_switch,
        equipment_nintendo_switch_lite,
        equipment_fridge,
        equipment_microwave,
        equipment_coffee_machine,
        equipment_extension_cord,
    )
    perumiskelvoton_patio.payment_types.add(payment_type_online)
    ReservationUnitPricingFactory.create(
        reservation_unit=perumiskelvoton_patio,
        begins=date(2023, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
        lowest_price=0.0,
        highest_price=30.0,
        tax_percentage=tax_percentage_255,
    )

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=perumiskelvoton_patio,
        image_url=(
            "https://tilavaraus.test.hel.ninja/"
            "media/reservation_unit_images/JPG-2_varaamo_jakomaki_2811202_maija_astikainen-3487-Edit.jpg"
        ),
        filename="JPG-2_varaamo_jakomaki_2811202_maija_astikainen-3487-Edit",
    )
    if image is not None:
        image.save()

    ###########################################################################################################
    # Create reservation unit: Toistuvien varausten Toimisto
    ###########################################################################################################

    toistuvien_varausten_toimisto = ReservationUnitFactory.create(
        uuid="4310564b-2c03-48d2-9d31-ea4d244471ef",
        name="Toistuvien varausten Toimisto",
        name_fi="Toistuvien varausten Toimisto FI",
        name_en="Toistuvien varausten Toimisto EN",
        name_sv="Toistuvien varausten Toimisto SV",
        description=(
            "<p>Käytä ensisijaisesti tätä varausyksikköä, kun haluat tehdä toistuvia"
            " varauksia käsittelijänpuolella tai varata asiakkaan puolesta."
            " Käytössä on varauslomake 2. Varaaminen on maksutonta ja kaikki"
            " varaukset hyväksytään. Peruutusaika on 14 vrk ennen varausta."
            " Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk</p>"
            "<p><br></p>"
            "<p>Tämä on esimerkkitekstiä eikä liity varaukseen. Mankeli Bernina "
            "1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa.</p>"
            "<p><br></p>"
            "<p>Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia "
            "ja muita perusompelutarvikkeita. Koneella ei voi ommella parkkinahkaa "
            "tai hyvin paksuja kankaita. Ilmoittaudu henkilökunnalle ennen "
            "varausaikasi alkamista. Ennen kuin saat laitteen käyttöösi, "
            "sinun on esitettävä kirjastokortti, jossa on voimassa oleva "
            "lainausoikeus.</p>"
            "<p><br></p>"
            "<p>Laitetta voi käyttää omaan luovaan toimintaan. Tilaustöiden "
            "tekeminen korvausta vastaan tai ammattimainen tulonhankinta "
            "esimerkiksi myymällä kirjastossa tuotettuja tuotteita ei ole sallittua.</p>"
        ),
        description_en="English description goes here.",
        description_sv="Svensk beskrivning går här.",
        terms_of_use="",
        min_reservation_duration=timedelta(minutes=30),
        max_reservation_duration=timedelta(hours=11),
        min_persons=None,
        max_persons=14,
        surface_area=37,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        require_reservation_handling=False,
        reservation_kind=ReservationKind.DIRECT_AND_SEASON,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        unit=caisa,
        reservation_unit_type=reservation_unit_type_multipurpose,
        payment_terms=payment_terms_free_of_charge,
        cancellation_terms=cancel_terms_14_days,
        service_specific_terms=service_terms_library,
        cancellation_rule=cancel_rule_14_days,
        metadata_set=metadata_sets[SetName.set_2],
        origin_hauki_resource=toistuvien_varausten_toimisto_hauki,
    )
    toistuvien_varausten_toimisto.spaces.add(
        SpaceFactory.create(
            name="Toistuvien varausten Toimisto",
            name_fi="Toistuvien varausten Toimisto FI",
            name_en="Toistuvien varausten Toimisto EN",
            name_sv="Toistuvien varausten Toimisto SV",
            surface_area=37,
            max_persons=14,
            unit=caisa,
        ),
    )
    toistuvien_varausten_toimisto.equipments.add(
        equipment_seats,
        equipment_dvi,
        equipment_hdmi,
        equipment_display_port,
        equipment_click_share,
        equipment_stove,
        equipment_fridge,
        equipment_coffee_machine,
        equipment_stage,
        equipment_billiard_table,
        equipment_dishwasher,
        equipment_extension_cord,
    )
    ReservationUnitPricingFactory.create(
        reservation_unit=toistuvien_varausten_toimisto,
        begins=date(2023, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
        lowest_price=0.0,
        highest_price=0.0,
        tax_percentage=tax_percentage_0,
    )

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=toistuvien_varausten_toimisto,
        image_url=(
            "https://tilavaraus.test.hel.ninja/"
            "media/reservation_unit_images/JPG-1_varaamo_oodi_20112023_kuva_maija_astikainen-9585-Edit_u0yheVh.jpg"
        ),
        filename="JPG-1_varaamo_oodi_20112023_kuva_maija_astikainen-9585-Edit_u0yheVh",
    )
    if image is not None:
        image.save()

    ###########################################################################################################
    # Create reservation unit: Tauotettu Takkahuone
    ###########################################################################################################

    tauotettu_takkahuone = ReservationUnitFactory.create(
        uuid="e8611183-86e0-4730-aae6-eeaa75b9211f",
        name="Tauotettu Takkahuone",
        name_fi="Tauotettu Takkahuone FI",
        name_en="Tauotettu Takkahuone EN",
        name_sv="Tauotettu Takkahuone SV",
        description=(
            "<p>Tämä on esimerkkitekstiä eikä liity varaukseen. Mankeli Bernina 1008 "
            "sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa.</p>"
            "<p><br></p>"
            "<p>Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia "
            "ja muita perusompelutarvikkeita. Koneella ei voi ommella parkkinahkaa "
            "tai hyvin paksuja kankaita. Ilmoittaudu henkilökunnalle ennen "
            "varausaikasi alkamista.&nbsp;Ennen kuin saat laitteen käyttöösi, "
            "sinun on esitettävä kirjastokortti, jossa on voimassa oleva "
            "lainausoikeus.</p>"
            "<p><br></p>"
            "<p>Laitetta voi käyttää omaan luovaan toimintaan. Tilaustöiden "
            "tekeminen korvausta vastaan tai ammattimainen tulonhankinta "
            "esimerkiksi myymällä kirjastossa tuotettuja tuotteita ei ole sallittua.</p>"
        ),
        description_en="English description goes here.",
        description_sv="Svensk beskrivning går här.",
        terms_of_use="",
        min_reservation_duration=timedelta(minutes=30),
        max_reservation_duration=timedelta(hours=3),
        min_persons=None,
        max_persons=47,
        surface_area=103,
        buffer_time_before=timedelta(minutes=30),
        buffer_time_after=timedelta(minutes=30),
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        require_reservation_handling=False,
        reservation_kind=ReservationKind.DIRECT_AND_SEASON,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        unit=caisa,
        reservation_unit_type=reservation_unit_type_multipurpose,
        payment_terms=payment_terms_free_of_charge,
        cancellation_terms=cancel_terms_zero_days,
        service_specific_terms=service_terms_library,
        cancellation_rule=cancel_rule_until_begin,
        metadata_set=metadata_sets[SetName.set_2],
        origin_hauki_resource=tauotettu_takkahuone_hauki,
    )
    tauotettu_takkahuone.spaces.add(
        SpaceFactory.create(
            name="Tauotettu Takkahuone",
            name_fi="Tauotettu Takkahuone FI",
            name_en="Tauotettu Takkahuone EN",
            name_sv="Tauotettu Takkahuone SV",
            surface_area=103,
            max_persons=47,
            unit=caisa,
        ),
    )
    tauotettu_takkahuone.equipments.add(
        equipment_click_share,
        equipment_billiard_table,
        equipment_dishwasher,
    )
    ReservationUnitPricingFactory.create(
        reservation_unit=tauotettu_takkahuone,
        begins=date(2023, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
        lowest_price=0.0,
        highest_price=0.0,
        tax_percentage=tax_percentage_0,
    )

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=tauotettu_takkahuone,
        image_url=(
            "https://tilavaraus.test.hel.ninja/"
            "media/reservation_unit_images/JPG-2_varaamo_jakomaki_2811202_maija_astikainen-3487-Edit_BarUEdV.jpg"
        ),
        filename="JPG-2_varaamo_jakomaki_2811202_maija_astikainen-3487-Edit_BarUEdV",
    )
    if image is not None:
        image.save()

    ###########################################################################################################
    # Create reservation unit: Aina käsiteltävä Kammio
    ###########################################################################################################

    aina_kasiteltava_kammio = ReservationUnitFactory.create(
        uuid="8488f2a7-8476-43ad-a51d-a0995dd21b18",
        name="Aina käsiteltävä Kammio, maksuton",
        name_fi="Aina käsiteltävä Kammio, maksuton FI",
        name_en="Aina käsiteltävä Kammio, maksuton EN",
        name_sv="Aina käsiteltävä Kammio, maksuton SV",
        description=(
            "<p>Käytä tätä varausyksikköä, kun haluan varata varausyksikön, "
            "jonka kaikki varaukset siirtyvät käsittelyyn. Varaus tulee hyväksyä "
            "tai hyläytä käsittelijän puolelta. Varauksen voi tehdä 60 min välein, "
            "aikaslotti 2vk-3kk. Peruutusaika on varauksen alkuun saakka. "
            "Käytössä on lomake 3. Tämä varausyksikkö vastaa aluekirjastojen "
            "maksuttomia tapahtumatiloja.</p>"
            "<p><br></p>"
            '<p><span style="background-color: rgba(255, 255, 255, 0.7); color: rgb(17, 17, 17);">'
            "Tämä on esimerkkitekstiä eikä liity varaukseen. Tämä on kellarikerroksessa "
            "sijaitseva 40 neliömetrin tapahtumatila, joka on jaettu oleskelu- ja "
            "ruokailualueeseen. Tila on sisustettu lämpimillä väreillä ja valaistu "
            "kynttilöillä ja valosarjoilla. </span></p>"
            "<p><br></p>"
            '<p><span style="background-color: rgba(255, 255, 255, 0.7); color: rgb(17, 17, 17);">'
            "Tila on varustettu äänentoistojärjestelmällä, ilmastoinnilla ja omalla wc:llä. "
            "Tilaan pääsee portaita pitkin tai hissillä. Tila on viihtyisä ja tunnelmallinen "
            "paikka, joka sopii erilaisiin tilaisuuksiin. Tila on täysin maksuton"
            "ja hyvin hoidettu, ja siinä on kaikki tarvittavat mukavuudet ja palvelut.</span></p>"
        ),
        description_en="English description goes here.",
        description_sv="Svensk beskrivning går här.",
        terms_of_use=(
            "Tilan voi varata vain yleisölle avoimiin ja maksuttomiin tilaisuuksiin, "
            "joiden sisältö on kaikenikäisille sopivaa."
        ),
        terms_of_use_en="English terms of use goes here.",
        terms_of_use_sv="Svenska användarvillkor finns här.",
        min_reservation_duration=timedelta(hours=1),
        max_reservation_duration=timedelta(hours=4),
        min_persons=0,
        max_persons=15,
        surface_area=40,
        reservation_start_interval=ReservationStartInterval.INTERVAL_60_MINUTES,
        reservations_min_days_before=14,
        reservations_max_days_before=90,
        max_reservations_per_user=2,
        require_reservation_handling=True,
        authentication=AuthenticationType.WEAK,
        reservation_kind=ReservationKind.DIRECT_AND_SEASON,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        unit=caisa,
        reservation_unit_type=reservation_unit_type_multipurpose,
        payment_terms=payment_terms_free_of_charge,
        cancellation_terms=cancel_terms_zero_days,
        service_specific_terms=service_terms_library,
        cancellation_rule=cancel_rule_until_begin,
        metadata_set=metadata_sets[SetName.set_3],
        origin_hauki_resource=aina_kasiteltava_kammio_hauki,
    )
    aina_kasiteltava_kammio.spaces.add(
        SpaceFactory.create(
            name="Aina käsiteltävä Kammio, maksuton",
            name_fi="Aina käsiteltävä Kammio, maksuton FI",
            name_en="Aina käsiteltävä Kammio, maksuton EN",
            name_sv="Aina käsiteltävä Kammio, maksuton SV",
            surface_area=40,
            max_persons=15,
            unit=caisa,
        ),
    )
    aina_kasiteltava_kammio.equipments.add(
        equipment_chair,
        equipment_couches,
        equipment_seats,
        equipment_sound,
        equipment_whiteboard,
    )
    ReservationUnitPricingFactory.create(
        reservation_unit=aina_kasiteltava_kammio,
        begins=date(2023, 1, 1),
        price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
        lowest_price=0.0,
        highest_price=0.0,
        tax_percentage=tax_percentage_0,
    )

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=aina_kasiteltava_kammio,
        image_url="https://tilavaraus.test.hel.ninja/media/reservation_unit_images/saunabaari.jpg",
        filename="saunabaari",
    )
    if image is not None:
        image.save()

    image = _fetch_and_build_reservation_unit_image(
        reservation_unit=aina_kasiteltava_kammio,
        image_url="https://tilavaraus.test.hel.ninja/media/reservation_unit_images/generoitukuva.png",
        filename="generoitukuva",
        extension=".png",
        image_type=ReservationUnitImageType.OTHER,
    )
    if image is not None:
        image.save()
