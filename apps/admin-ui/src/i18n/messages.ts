// format:
// label1: [<fi_translation>, <en_translation>, <sv translation>]
// label1: [<fi_translation>, <en_translation>, <sv translation>]

// labels can be nested:

// component: {
//  button: ['fi', 'en', 'sv'];
// }
// will generate key: component.button

/* eslint @typescript-eslint/naming-convention: 0 */

import { Resource } from "i18next";

interface ITranslations {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [index: string]: any;
}

const translations: ITranslations = {
  // @deprecated (use dayShort and dayLong)
  calendar: {
    monday: ["Maanantai"],
    tuesday: ["Tiistai"],
    wednesday: ["Keskiviikko"],
    thursday: ["Torstai"],
    friday: ["Perjantai"],
    saturday: ["Lauantai"],
    sunday: ["Sunnuntai"],
  },
  dayShort: {
    0: ["Ma"],
    1: ["Ti"],
    2: ["Ke"],
    3: ["To"],
    4: ["Pe"],
    5: ["La"],
    6: ["Su"],
  },
  dayLong: {
    0: ["Maanantai"],
    1: ["Tiistai"],
    2: ["Keskiviikko"],
    3: ["Torstai"],
    4: ["Perjantai"],
    5: ["Lauantai"],
    6: ["Sunnuntai"],
  },
  authentication: {
    WEAK: ["Heikko tunnistautuminen"],
    STRONG: ["Vahva tunnistautuminen"],
  },
  CustomerTypeChoice: {
    INDIVIDUAL: ["yksityishenkilö"],
    BUSINESS: ["yritys"],
    NONPROFIT: {
      REGISTERED: ["yhdistys, rekisteröity"],
      UNREGISTERED: ["yhdistys, rekisteröimätön"],
    },
  },
  ReservationType: {
    NORMAL: [""],
    BLOCKED: ["Suljettu"],
    BEHALF: ["Asiakkaan puolesta"],
    STAFF: ["Sisäinen varaus"],
    SEASONAL: ["Kausivaraus"],
  },
  paymentType: {
    INVOICE: ["Laskutus"],
    ONLINE: ["Verkkomaksu"],
    ON_SITE: ["Maksu paikan päällä"],
  },
  language: {
    fi: ["suomeksi"],
    sv: ["ruotsiksi"],
    en: ["englanniksi"],
  },
  paging: {
    numResults: ["{{count}} tulosta {{totalCount}} tuloksesta näytetty"],
    allResults: ["Kaikki {{totalCount}} tulosta näytetty"],
  },
  common: {
    week: ["Viikko"],
    showMore: ["Näytä lisää"],
    view: ["Näytä"],
    clearAllSelections: ["Tyhjennä valinnat"],
    clear: ["Tyhjennä"],
    returnDefaults: ["Palauta oletukset"],
    removeValue: ["Poista arvo"],
    toggleMenu: ["Vaihda valikon tila"],
    hoursLabel: ["Tunnit"],
    minutesLabel: ["Minuutit"],
    applicationName: ["Tilavarauskäsittely"],
    next: ["Seuraava"],
    prev: ["Takaisin"],
    submit: ["Lähetä"],
    false: ["Ei"],
    true: ["Kyllä"],
    open: ["Avaa"],
    close: ["Sulje"],
    approve: ["Hyväksy"],
    deny: ["Hylkää"],
    cancel: ["Peruuta"],
    reserve: ["Varaa"],
    accordion: ["sisältö"],
    search: ["Hae"],
    noResults: ["Ei tuloksia"],
    loading: ["Ladataan..."],
    error: ["Virhe"],
    select: ["Valitse"],
    filter: ["Suodata"],
    filtered: ["Suodatettu"],
    // TODO these are only used in DataTable, they are uncommon
    filterHideHandled: ["Piilota jo käsitellyt"],
    filterShowHandled: ["Näytä myös käsitellyt"],
    activateSelection: ["Siirry valintatilaan"],
    disableSelection: ["Poistu valintatilasta"],
    closeAll: ["Sulje kaikki"],
    openAll: ["Avaa kaikki"],
    selectAllRows: ["Valitse kaikki rivit"],
    deselectAllRows: ["Poista kaikkien rivien valinta"],
    selectRowX: ["Valitse rivi {{row}}"],
    deselectRowX: ["Posta rivin {{row}} valinta"],
    // --- end of DataTable specific translations
    closeModal: ["Sulje modaali-ikkuna"],
    today: ["Tänään"],
    agesSuffix: ["{{range}} -vuotiaat"],
    // TODO this is only used in FilterControls
    resetFilters: ["Tyhjennä suodattimet"],
    resetSearch: ["Tyhjennä hakukenttä"],
    apply: ["Käytä"],
    areaUnitSquareMeter: [" m²"],
    volumeUnit: [" kpl", " ", " "],
    personUnit_one: ["{{count}} henkilö"],
    personUnit_other: ["{{count}} henkeä"],
    hoursUnit: ["{{count}} t"],
    hoursUnitLong_one: ["{{count}} tunti"],
    hoursUnitLong_other: ["{{count}} tuntia"],
    minutesUnit: ["{{count}} min"],
    minutesUnitLong_one: ["{{count}} minuutti"],
    minutesUnitLong_other: ["{{count}} minuuttia"],
    streetAddress: ["Katuosoite"],
    postalNumber: ["Postinumero"],
    postalDistrict: ["Postitoimipaikka"],
    emailAddress: ["Sähköpostiosoite"],
    billingAddress: ["Laskutusosoite"],
    homeCity: ["Kotipaikka"],
    // TODO this is silly use count (with zero, one, other)
    membersSuffix: [" jäsentä"],
    minAmount: ["Vähintään"],
    maxAmount: ["Enintään"],
    option: ["Vaihtoehto"],
    same: ["Sama"],
    day: ["Päivä"],
    month: ["Kuukausi"],
    year: ["Vuosi"],
    begins: ["Alkaa"],
    ends: ["Päättyy"],
    weekly: ["Viikoittain"],
    biweekly: ["Vuoroviikoittain"],
    timeOfDay: ["Kellonaika"],
    unhandledCount: ["{{count}} käsittelemättä"],
    inspect: ["Tarkastele"],
    cityOfHelsinki: ["Helsingin kaupunki"],
    chooseAction: ["valitse toiminto"],
    weekday: ["Viikonpäivä"],
    date: ["Päivämäärä"],
    time: ["Kellonaika"],
    and: ["ja"],
    peopleSuffixShort: ["hlö"],
    // TODO AriaLabel is not needed in the key value
    increaseByOneAriaLabel: ["Lisää yhdellä"],
    decreaseByOneAriaLabel: ["Vähennä yhdellä"],
    openToNewTab: ["Avaa uuteen välilehteen"],
    reservationUnit: ["Varausyksikkö"],
    remove: ["Poista"],
    restore: ["Palauta"],
    selectPlaceholder: ["Valitse"],
    textSearchPlaceHolder: ["Hae"],
    // TODO there should be key for not common words but common to multiple pages
    noFilteredResults: [
      "Valitsemillasi suodattimilla ei löytynyt yhtään {{name}}. Muuta rajausta tai tyhjennä kaikki suodattimet.",
    ],
  },
  errors: {
    router: {
      invalidApplicationNumber: ["Virheellinen hakemusnumero"],
      invalidApplicationRoundNumber: ["Virheellinen hakukierroksen numero"],
      unitPkMismatch: ["Varausyksikkö ei kuulu osoitteen yksikköön"],
      unitNotFound: ["Yksikköä ei löytynyt"],
    },
    applicationRoundNotFound: ["Haettua hakukierrosta ei löydy"],
    errorFetchingData: ["Virhe haettaessa tietoja"],
    errorFetchingApplication: ["Virhe haettaessa hakemusta"],
    errorFetchingApplications: ["Virhe haettaessa hakemuksia"],
    errorRejectingApplication: ["Virhe hylätessä hakemusta"],
    // TODO describe what failed if you don't know why it failed
    functionFailedTitle: ["Toiminto epäonnistui"],
    unexpectedError: ["Odottamaton virhe"],
    missingReservationType: ["Varaustyyppi puuttuu"],
    errorRecurringReservationsDoneDisplay: [
      "Virhe. Varaus tehty, mutta sen näyttäminen epäonnistui.",
    ],
    mutationFailed: ["Muutos epäonnistui"],
    noPermission: ["Sinulla ei ole käyttöoikeutta."],
    mutationNoDataReturned: ["Odottamaton vastaus."],
    cantRejectAlreadyAllocated: ["Jo jaettua vuoroa ei voi hylätä."],
    errorEndingAllocation: ["Virhe käsittelyn päättämisessä"],
    errorEndingAllocationUnhandledApplications: [
      "Käsittelyssä on vielä käsittelemättömiä hakemuksia.",
    ],
    errorEndingAllocationNotInAllocation: [
      "Käsittelyä ei ole aloitettu tai se on jo päättynyt.",
    ],
    formValidationError: ["Lomakkeessa on virheitä. {{ message }}"],
    backendValidation: {
      RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL: [
        "Aloitusaika ei ole sallittu",
      ],
      RESERVATION_END_DATE_TOO_FAR: [
        "Ei pystytty luomaan varauksia yli 2 vuoden päähän",
      ],
      RESERVATION_SERIES_ALREADY_STARTED: ["Toistuva varaus on jo alkanut"],
      RESERVATION_UNIT_PRICINGS_MISSING: [
        "Varausyksiköllä ei ole hinnoittelua",
      ],
      RESERVATION_UNIT_PRICINGS_NO_ACTIVE_PRICINGS: [
        "Varausyksiköllä ei ole aktiivisia hinnoitteluita",
      ],
      RESERVATION_UNIT_PRICINGS_DUPLICATE_DATE: ["Päivämäärä on jo käytössä"],
      RESERVATION_UNIT_PRICINGS_INVALID_PRICES: [
        "Hinnoittelussa on virheellisiä hintoja",
      ],
    },
    descriptive: {
      "Reservation overlaps with reservation before due to buffer time.": [
        "Varaus menee päällekkäin edellisen varauksen kanssa tauon takia.",
      ],
      "Reservation overlaps with reservation after due to buffer time.": [
        "Varaus menee päällekkäin seuraavan varauksen kanssa tauon takia.",
      ],
      collision: [
        "Valitsemasi aika ei ole enää vapaana. Ole hyvä ja valitse uusi aika.",
      ],
      "Overlapping reservations are not allowed.": [
        "Ajankohdalle on jo varaus toisen varausyksikön kautta.",
      ],
      unknown: ["Tuntematon virhe"],
      genericError: [""],
      "Only reservations with states DENIED and CONFIRMED can be reverted to requires handling.":
        [
          "Vain hylätyt ja vahvistetut varaukset voidaan palauttaa käsiteltäväksi.",
        ],
    },
  },
  breadcrumb: {
    frontpage: ["Etusivu"],
    "recurring-reservations": ["Kausivaraaminen"],
    "application-rounds": ["Hakukierrokset"],
    criteria: ["Kriteerit"],
    recommendation: ["Ehdotus"],
    "spaces-n-settings": ["Tilat ja asetukset"],
    "reservation-units": ["Varausyksiköt"],
    spaces: ["Tilat"],
    resources: ["Resurssit"],
    reservations: ["Varaukset"],
    "requested-reservations": ["Varaustoiveet"],
    "all-reservations": ["Kaikki varaukset"],
    units: ["Toimipisteet"],
    "my-units": ["Omat toimipisteet"],
    notifications: ["Ilmoitukset"],
    newNotification: ["Luo ilmoitus"],
    editNotification: ["Muokkaa ilmoitusta"],
    messaging: ["Viestintä"],
  },
  tos: {
    paymentTermsTitle: ["Maksuehdot"],
    priceTermsTitle: ["Alennusryhmä"],
    cancelTermsTitle: ["Peruutusehdot"],
    serviceTermsTitle: ["Täydentävät ehdot"],
    generalTermsTitle: [
      "Helsingin kaupungin tilojen ja laitteiden varaamisen sopimusehdot",
    ],
  },
  errorPages: {
    accessForbidden: {
      title: ["Sinulla ei ole käyttöoikeuksia tälle sivulle"],
      description: [
        "Sivu on nähtävillä vain kirjautuneille käyttäjille. Voit nähdä sivun sisällön, jos kirjaudut sisään ja sinulla on riittävän laajat käyttöoikeudet.",
      ],
    },
    generalError: {
      title: ["Jokin meni vikaan"],
      description: [
        "Pahoittelut, emme valitettavasti pysty näyttämään sivua juuri nyt. Yritä myöhemmin uudelleen!",
      ],
    },
    linkToVaraamo: ["Siirry Varaamon etusivulle"],
    giveFeedback: ["Ota yhteyttä"],
  },
  // TODO used inside the ReservationUnitEditor
  ArchiveReservationUnitDialog: {
    title: ["Oletko varma että haluat arkistoida varausyksikön {{name}}?"],
    description: [
      "Arkistoimisen jälkeen varausyksikkö ei ole enää näkyvissä Varaamon käsittelypuolella. Mikäli haluat palauttaa varausyksikön, ota yhteyttä järjestelmän pääkäyttäjään.",
    ],
    archive: ["Arkistoi"],
    success: ["Varausyksikkö arkistoitu."],
  },
  // TODO used inside the ReservationUnitEditor
  DiscardReservationUnitChangesDialog: {
    title: [
      "Oletko varma että haluat palata takaisin tallentamatta varausyksikön tietoja?",
    ],
    description: ["Varausyksikön tiedot katoavat, eikä niitä voi palauttaa."],
    discard: ["Palaa tallentamatta"],
  },
  MainLander: {
    ingress: [
      "Tässä palvelussa voit käsitellä Helsingin kaupungin tilavaraushakemuksia sekä asettaa tiloja ja laitteita varattaviksi.",
    ],
  },
  User: {
    welcome: ["Tervetuloa"],
  },
  MainMenu: {
    home: ["Etusivu"],
    myUnits: ["Omat toimipisteet"],
    reservations: ["Varaukset"],
    requestedReservations: ["Varaustoiveet"],
    allReservations: ["Kaikki varaukset"],
    recurringReservations: ["Kausivaraaminen"],
    applicatioNROunds: ["Hakukierrokset"],
    clients: ["Asiakkaat"],
    archive: ["Arkisto"],
    premisesAndSettings: ["Tilat ja asetukset"],
    userManagement: ["Käyttajähallinta"],
    services: ["Palvelut ja luokat"],
    spaceAndHobbyTypes: ["Tila- ja harrastetyypit"],
    applicationRounds: ["Hakukierrokset"],
    conditionsAndAttachments: ["Ehdot ja liitteet"],
    reservationUnits: ["Varausyksiköt"],
    spaces: ["Tilat"],
    resources: ["Resurssit"],
    units: ["Toimipisteet"],
    notifications: ["Ilmoitukset"],
  },
  Navigation: {
    login: ["Kirjaudu sisään"],
    logging: ["Odota..."],
    logout: ["Kirjaudu ulos"],
    goBack: ["Palaa takaisin"],
    skipToMainContent: ["Siirry sivun pääsisältöön"],
    expandMenu: ['Laajenna valikko "{{title}}"'],
    shrinkMenu: ['Pienennä valikko "{{title}}"'],
    noName: ["Ei nimeä"],
  },
  MyUnits: {
    heading: ["Omat toimipisteet"],
    description: [
      "Alla näet kaikki toimipisteet, joihin sinulla on käyttöoikeus. Voit tarkastella varauskalentereita ja tehdä varauksia toimipisteen sivulla.",
    ],
    Calendar: {
      Tabs: {
        byUnit: ["Varausyksiköittäin"],
        byReservationUnit: ["Kaikki varaukset"],
      },
      header: {
        recurringReservation: ["Tee toistuva varaus"],
      },
      legend: {
        confirmed: ["Hyväksytty varaus"],
        unconfirmed: ["Varaustoive"],
        intersecting: ["Toisen varausyksikön varaus"],
        pause: ["Tauko"],
        closed: ["Suljettu"],
        waitingPayment: ["Hyväksytty varaus, Odottaa maksua"],
        staffReservation: ["Sisäinen varaus"],
        reservationUnitReleased: ["Varausyksikkö julkaistu"],
        reservationUnitDraft: ["Varausyksikkö luonnostilassa"],
      },
    },
    RecurringReservation: {
      error: {
        invalidUnitId: ["Virheellinen yksikön numero."],
        notPossibleForThisUnit: [
          "Tälle yksikölle ei ole mahdollista tehdä toistuvaa varausta.",
        ],
      },
      pageTitle: ["Tee toistuva varaus"],
      addNewReservation: ["Lisää uusi varaus"],
      Confirmation: {
        removed: ["Poistettu"],
        overlapping: ["Ei saatavilla"],
        title: ["Toistuva varaus tehty"],
        allFailedTitle: ["Toistuvaa varausta ei voitu tehdä"],
        failedSubtitle: ["Epäonnistuneet varaukset"],
        successSubtitle: ["Varaukset"],
        successInfo: ["Kaikki varaukset tehtiin onnistuneesti."],
        failureInfo: [
          "{{conflicts}} / {{total}} epäonnistui päällekkäisyyksien takia.",
        ],
        holidayInfo: [
          "{{holidays}} / {{total}} varaus osuu pyhäpäivälle, mutta varaus päivälle on silti tehty.",
        ],
        failureInfoSecondParagraph: [
          "Voit halutessasi etsiä näille toistoille uuden ajan varauksen sivulta.",
        ],
        // TODO these should be in the common translations (enum)
        RejectionReadinessChoice: {
          INTERVAL_NOT_ALLOWED: ["Aloitusaika ei sallittu"],
          OVERLAPPING_RESERVATIONS: ["Päivämäärä ei saatavilla"],
          RESERVATION_UNIT_CLOSED: ["Suljettu"],
        },
        failureMessages: {
          reservationInPast: ["Aika menneisyydessä"],
          overlap: ["Päällekkäinen varaus"],
          interval: ["Ei sallittu varauksen aloitus aika"],
          default: ["Aika ei saatavilla"],
        },
        buttonToUnit: ["Palaa toimipisteen sivulle"],
        buttonToReservation: ["Siirry varauksen sivulle"],
      },
    },
    ReservationForm: {
      showReserver: ["Näytä varaajan tiedot ja ehdot"],
    },
    RecurringReservationForm: {
      // these are unique form elements only for this form
      reservationUnit: ["Varausyksikkö"],
      repeatPattern: ["Varauksen toisto"],
      repeatOnDays: ["Toistoviikonpäivät"],
      reservationsList_zero: ["Ei yhtään varausta aikavälille"],
      reservationsList_one: ["Olet tekemässä yhden varauksen"],
      reservationsList_other: ["Olet tekemässä {{count}} varausta"],
      name: ["Varaussarjan nimi"],
      newOverlapError: [
        "Varausta ei pystytty tekemään, koska siinä on uusia päällekkäistä varauksia ({{ count }}). Tarkista lista ja yritä uudelleen.",
      ],
    },
  },
  ReservationEditSeries: {
    heading: ["Muokkaa varaussarjaa"],
    submit: ["Luo varaukset"],
  },
  Application: {
    id: ["Hakemustunnus"],
    application_one: ["Hakemus", "Application"],
    application_other: ["Hakemusta", "Applications"],
    applicantType: ["Asiakastyyppi"],
    timeframeCurrent: ["Sulkeutuu {{date}}"],
    timeframeFuture: ["Haku aukeaa {{date}}"],
    timeframePast: ["Sulkeutunut {{date}}"],
    approvalPendingDate: ["Hyväksyntää pyydetty {{date}}"],
    applicationReceivedTime: ["Lähetetty"],
    applicationDetails: ["Hakemuksen tiedot"],
    organisationName: ["Yhdistyksen nimi"],
    coreActivity: ["Ydintoiminta"],
    numHours: ["Vuorojen kokonaiskesto"],
    numTurns: ["Vuorojen määrä"],
    authenticatedUser: ["Tunnistautunut käyttäjä"],
    emptyFilterPageName: ["hakemusta"],
    rejected: ["Hylätty"],
    btnRestore: ["Palauta koko hakemus"],
    btnReject: ["Hylkää koko hakemus"],
    section: {
      btnReject: ["Hylkää"],
      btnRestore: ["Palauta"],
      btnRejectAll: ["Hylkää kaikki"],
      btnRestoreAll: ["Palauta kaikki"],
    },
    headings: {
      id: ["id"],
      customer: ["Hakija"],
      unit: ["Toimipiste"],
      phase: ["Vaihe"],
      name: ["Vuoro"],
      participants: ["Harrastajat"],
      applicantType: ["Hakijatyyppi"],
      applicationCount: ["Haettu"],
      applicationStatus: ["Hakemuksen status"],
      reviewStatus: ["Esitarkastuksen tulos"],
      resolutionStatus: ["Päätöksen status"],
      resolution: ["Päätös"],
      applicantName: ["Hakijan nimi"],
      purpose: ["Käyttötarkoitus"],
      ageGroup: ["Ikäluokka"],
      additionalInformation: ["Lisätiedot (yksityishenkilö)"],
      userBirthDate: ["Syntymäaika"],
    },
    // TODO move the enum under key: {EnumName}.{key}
    statuses: {
      RECEIVED: ["Vastaanotettu"],
      HANDLED: ["Käsitelty"],
      DRAFT: ["Luonnos"],
      CANCELLED: ["Peruutettu"],
      EXPIRED: ["Vanhentunut"],
      IN_ALLOCATION: ["Käsittelyssä"],
      RESULTS_SENT: ["Lähetetty"],
      // a ui error (missing query or a null check)
      undefined: ["Ei määritelty"],
    },
    // TODO these are in ApplicationDetaiils
    customerBasicInfo: ["Varaajan perustiedot"],
    contactPersonInformation: ["Yhteyshenkilön tiedot"],
    members: ["Jäsenet"],
    contactPersonFirstName: ["Etunimi"],
    contactPersonLastName: ["Sukunimi"],
    contactPersonEmail: ["Sähköpostiosoite"],
    contactPersonPhoneNumber: ["Puhelinnumero"],
    contactInformation: ["Yhteystiedot"],
    // TODO move enum under key: {EnumName}.{key}
    applicantTypes: {
      INDIVIDUAL: ["Yksityishenkilö"],
      COMPANY: ["Yritys"],
      COMMUNITY: ["Yhdistys, rekisteröimätön"],
      ASSOCIATION: ["Yhdistys, rekisteröity"],
    },
    contactPerson: ["Yhteyshenkilö"],
    identificationNumber: ["Y-tunnus"],
    applicationsSelected_one: ["{{count}} hakemus valittu"],
    applicationsSelected_other: ["{{count}} hakemusta valittu"],
    allApplications: ["Kaikki hakemukset"],
    gotoLink: ["Tarkastele hakemusta"],
  },
  TimeSelector: {
    primary: ["Ensisijainen toive"],
    secondary: ["Muu toive"],
  },
  ApplicationRound: {
    noUpcoming: ["Ei tulossa olevia hakukierroksia."],
    statuses: {
      UPCOMING: ["Tulossa"],
      OPEN: ["Haku avoinna"],
      IN_ALLOCATION: ["Käsittelyssä"],
      RESULTS_SENT: ["Lähetetty"],
      HANDLED: ["Käsitelty"],
    },
    groupLabel: {
      handling: ["Odottaa jakoa"],
      notSent: ["Päätökset lähettämättä"],
      open: ["Haku avoinna"],
      opening: ["Tulossa"],
      previousRounds: ["Edelliset hakukierrokset"],
    },
    headings: {
      name: ["Nimi"],
      service: ["Palvelu"],
      reservationUnitCount: ["Varausyksiköt"],
      applicationCount: ["Hakemukset"],
      sent: ["Lähetetty"],
    },
    errors: {
      noApplicationRound: ["Hakukierrosta ei löytynyt"],
    },
    info: {
      loadingText: ["Varauksia luodaan..."],
      allocatedBody: [
        "Kausivaraukset on jaettu, mutta varauksia ei ole tehty eikä vahvistettu asiakkaille.",
      ],
      handledBody: [
        "Kausivaraukset on tarkistettu ja varausvahvistukset lähetetään asiakkaille.",
      ],
      resultsSentBody: [
        "Kausivaraukset on tarkistettu ja varausvahvistukset on lähetetty asiakkaille.",
      ],
      createBtn: ["Päätä käsittely"],
      sendResultsBtn: ["Lähetä varausvahvistukset"],
      failedBtn: ["Varausten luonti epäonnistui"],
    },
    confirmation: {
      endAllocationTitle: ["Oletko varma, että haluat päättää käsittelyn"],
      endAllocationMessage: [
        "Kun kierros on päätetty, jattuihin vuoroihin ei voida tehdä muutoksia. Huomaathan, että jaetuista vuoroista tehdään samalla toistuvat varaukset.",
      ],
      endAllocationAccept: ["Päätä käsittely ja luo varaukset"],
      endAllocationCancel: ["Peruuta"],
      sendResultsTitle: ["Lähetä varausvahvistukset"],
      sendResultsMessage: [
        "Sähköpostiviesti käsittelyn valmistumisesta lähtee heti tiedoksi asiakkaalle, kun painat Lähetä varausvahvistukset -painiketta. Varausvahvistukset näkyvät asiakkaalle Omat hakemukset -sivulla ja tehdyt varaukset Omat kausivaraukset- sivulla.",
      ],
      sendResultsAccept: ["Lähetä varausvahvistukset"],
    },
    description: [
      "Alla näet kaikki hakukierrokset, joihin sinulla on käsittelyoikeus. Noudata kausivarausten käsittelyssä palvelukohtaisia käsittelyperiaatteita ja -aikatauluja.",
    ],
    allocate: ["Jaa vuoroja"],
    applicationCount: ["hakemusta"],
    applicationEventCount: ["vuoroa"],
    reservationUnitCount: ["varausyksikköä"],
    applicants: ["Hakukierroksen hakijat"],
    listHandlingTitle: ["Käsittely"],
    appliedReservations: ["Haetut vuorot"],
    madeReservations: ["Varatut vuorot"],
    allocatedReservations: ["Jaetut vuorot"],
    rejectedOccurrences: ["Hylätyt ajankohdat"],
    applications: ["Hakemukset"],
    roundCriteria: ["Kierroksen kriteerit"],
    // TODO this is used in Criteria page
    attachedReservationUnits: ["Liitettyä varausyksikköä"],
    listHandlingIngress_one: [
      "Vastuullasi on tällä hetkellä {{count}} tuleva tai käsittelyvaiheessa oleva hakukierros.",
    ],
    listHandlingIngress_other: [
      "Vastuullasi on tällä hetkellä {{count}} tulevaa tai käsittelyvaiheessa olevaa hakukierrosta.",
    ],
    listHandlingPlaceholder: [
      "Ei vielä tulevia tai käsittelyvaiheessa olevia hakukierroksia.",
    ],
    listApprovalIngress_one: [
      "Hyväksyntääsi odottaa tällä hetkellä {{count}} päätöslauselma.",
    ],
    listApprovalIngress_other: [
      "Hyväksyntääsi odottaa tällä hetkellä {{count}} päätöslauselmaa",
    ],
    // TODO this is used in Criteria page
    searchAndUsageTimeRanges: ["Haku- ja käyttöajanjaksot"],
    // TODO this is used in Criteria page
    applicationPeriodTitle: [
      "Hakukauden alkamis- ja päätymisajankohta asiakkaille",
    ],
    // TODO this is used in Criteria page
    reservationPeriodTitle: [
      "Hakuun kuuluvien varausyksiköiden varsinainen käyttöajanjakso",
    ],
    // TODO this is used in Criteria page
    usedReservationUnits: ["Kierrokselle liitetyt varausyksiköt"],
    // TODO used in TimerFrameStatus.tsx instead
    resolutionDate: ["Päätös tehty {{date}}"],
  },
  ApplicationEventSchedules: {
    headings: {
      reservationUnit: ["Varausyksikkö"],
      eventName: ["Varauksen nimi"],
      time: ["Vuoro"],
      occurrenceTime: ["Aika"],
      reason: ["Syy"],
    },
  },
  ApplicationSectionStatusChoice: {
    HANDLED: ["Hyväksytty"],
    IN_ALLOCATION: ["Käsittelyssä"],
    UNALLOCATED: ["Vastaanotettu"],
    REJECTED: ["Hylätty"],
  },
  TimeSlotStatusCell: {
    declined: ["Hylätty"],
    approved: ["Hyväksytty"],
  },
  // TODO ApplicationEvent has been renamed to ApplicationSection, rename these keys
  ApplicationEvent: {
    name: ["Vakiovuoron nimi"],
    emptyFilterPageName: ["haettua vuoroa"],
    allocated: {
      emptyFilterPageName: ["jaettua vuoroa"],
    },
    groupSize: ["Ryhmän koko"],
    ageGroup: ["Ikäryhmä"],
    eventDuration: ["Vuoron kesto"],
    purpose: ["Vuoron käyttötarkoitus"],
    dates: ["Kausi"],
    eventsPerWeek: ["Vuorojen määrä / viikko"],
    biweekly: ["Vakiovuorot vain joka toinen viikko"],
    requestedTimes: ["Toivotut ajat"],
    requestedReservationUnits: ["Toivotut varausyksiköt"],
    gotoLink: ["Tarkastele vuoroehdotusta"],
    primarySchedules: ["Ensisijaiset aikatoiveet"],
    secondarySchedules: ["Muut aikatoiveet"],
    noSchedule: ["ei aikatoiveita"],
    statuses: {
      APPROVED: ["Hyväksytty"],
      DECLINED: ["Hylätty"],
      UNALLOCATED: ["Käsittelyssä"],
      FAILED: ["Epäonnistunut"],
      RESERVED: ["Varattu"],
    },
    priority: {
      300: ["Ensisijaiset aikatoiveet"],
      200: ["Muut aikatoiveet"],
      all: ["Kaikki"],
    },
    headings: {
      id: ["Id"],
      customer: ["Hakija"],
      name: ["Varauksen nimi"],
      unit: ["Toimipiste"],
      reason: ["Syy"],
      stats: ["Haettu"],
      phase: ["Vaihe"],
    },
  },
  Recommendation: {
    // TODO this is used in SelectionActionBar.tsx
    actionMassActionSubmit: ["Massakäsittele valitut"],
  },
  Reservation: {
    headings: {
      applicant: ["Hakija"],
      schedule: ["Vuoro"],
    },
    noReservations: ["Ei varauksia"],
    NewReservationModal: {
      acceptBtn: ["Lisää varaus"],
      title: ["Luo uusi varaus"],
      successToast: ["Uusi aika tallennettu"],
    },
    CommonModal: {
      form: {
        startTime: ["Aloitusaika"],
        length: ["Kesto"],
      },
      newTime: ["Uusi aika"],
      error: {
        reservationCollides: ["Toivomasi aika ei ole saatavilla"],
      },
    },
    EditTimeModal: {
      title: ["Muuta varauksen aikaa"],
      originalTime: ["Muutettava aika"],
      recurringInfoLabel: ["Toistuva varaus aikavälillä"],
      recurringInfoTimes: ["{{ weekdays }} {{begin}} - {{end}}"],
      acceptBtn: ["Muuta aikaa"],
      successToast: ["Uusi aika tallennettu"],
      error: {
        mutation: ["Ajan muutos epäonnistui."],
      },
    },
    EditPage: {
      title: ["Muokkaa varauksen tietoja"],
      "Reservation failed to load": ["Varausta {{ pk }} ei pystytty latamaan"],
      "Reservation unit failed to load": ["Varausyksikköä ei löytynyt"],
      save: ["Tallenna"],
      saveSuccess: ["Varauksen muutokset tallennettu"],
      saveSuccessRecurring: ["Muutokset tallennettu tuleviin varauksiin!"],
      saveError: ["Varauksen muutos epäonnistui"],
      pageThrewError: ["Virhe: varausta ei voi muokata"],
    },
  },
  ReservationUnit: {
    isDraft: {
      true: ["Luonnos"],
      false: ["Julkaistu"],
    },
  },
  Spaces: {
    spaceListHeading: ["Kaikki tilat"],
    spaceListDescription: [
      "Täällä näet koosteen kaikista tiloista, joita on liitetty järjestelmään ja jotka sinulla on oikeus nähdä.",
    ],
    searchPlaceholder: ["Hae tiloja"],
    headings: {
      name: ["Nimi"],
      unit: ["Toimipiste"],
      district: ["Kaupunginosa"],
      volume: ["Vetoisuus"],
      size: ["Koko"],
    },
  },
  Resources: {
    resourceListHeading: ["Kaikki resurssit"],
    resourceListDescription: [
      "Täällä näet koosteen kaikista resursseista, joita on liitetty järjestelmään ja jotka sinulla on oikeus nähdä.",
    ],
    searchPlaceholder: ["Hae resursseja"],
    headings: {
      name: ["Nimi"],
      unit: ["Toimipiste"],
      district: ["Kaupunginosa"],
      resourceType: ["Resurssityyppi"],
    },
  },
  ResourceEditor: {
    defaultHeading: ["(nimetön resurssi)"],
    resourceUpdated: ["Tiedot tallennettu."],
    saveFailed: ["Tallennus epäonnistui"],
    resourceUpdatedNotification: ["Resurssin tiedot tallennettu."],
    label: {
      spacePk: ["Tila"],
      nameFi: ["Resurssin nimi suomeksi"],
      nameSv: ["Resurssin nimi ruotsiksi"],
      nameEn: ["Resurssin nimi englanniksi"],
    },
  },
  ResourceEditorView: {
    illegalResource: ["Virheellinen resurssin tunniste"],
    illegalUnit: ["Virheellinen toimipisteen tunniste"],
  },
  Notifications: {
    pageTitle: ["Ilmoitukset"],
    pageDescription: [
      "Alla näet yhteenvedon aiemmin luoduista ilmoituksista. Voit luoda uusia ilmoituksia Varaamon yläreunaan Luo ilmoitus -painikkeesta.",
    ],
    isLoading: ["Ladataan ilmoitusta"],
    loadMore: ["Lataa lisää"],
    noNotifications: ["Ei ilmoituksia"],
    newNotification: ["Luo ilmoitus"],
    noName: ["(ei nimeä)"],
    deleteButton: ["Poista"],
    error: {
      notFound: ["Ilmoitusta ei löytynyt"],
      submit: {
        generic: ["Ilmoituksen tallennus epäonnistui"],
        alreadyExists: ["Ilmoitus on jo olemassa"],
        missingMessage: ["Ilmoituksen viesti puuttuu"],
        // TODO this is based on the ERROR_CODES which are common to all mutations,
        // we could pass the object type as a variable so we can reuse the same error message.
        NOT_FOUND: ["Ilmoitusta ei löytynyt"],
        noMutationPermission: ["Ei oikeutta muokata ilmoitusta"],
      },
      deleteFailed: {
        generic: ["Ilmoituksen poisto epäonnistui"],
      },
    },
    success: {
      removed: ["Ilmoitus poistettu"],
    },
    form: {
      namePlaceholder: ["Nimi näkyy vain ilmoitusten yhteenvetosivulla"],
      selectionWhen: ["Ilmoituksen voimassaolo"],
      selectPlaceholder: ["Valitse"],
      now: ["Voimassa heti"],
      inFuture: ["Voimassa valittuna ajankohtana"],
      activeFromDate: ["Alkamispäivä"],
      activeFromTime: ["Alkamisaika"],
      activeUntilDate: ["Päättymispäivä"],
      activeUntilTime: ["Päättymisaika"],
      level: ["Ilmoituksen tyyppi"],
      messageFi: ["Viesti fi"],
      messageEn: ["Viesti en"],
      messageSv: ["Viesti sv"],
      cancel: ["Peruuta"],
      saveDraft: ["Tallenna luonnos"],
      save: ["Julkaise"],
      created: ["luotu"],
      updated: ["päivitetty"],
      saveSuccessToast: ["Ilmoitus {{ name }} {{ state }}"],
      levelEnum: {
        noLevel: ["(ei tasoa)"],
        EXCEPTION: ["Poikkeus (punainen)"],
        WARNING: ["Varoitus (keltainen)"],
        NORMAL: ["Normaali (sininen)"],
      },
      // NOTE reusing this validation translations for ReservationUnitEditor
      // TODO move them under a common key
      errors: {
        Required: ["Pakollinen"],
        "Invalid date": ["Virheellinen päivämäärä"],
        "String must contain at least 1 character(s)": ["Pakollinen"],
        "Target group cannot be empty": ["Pakollinen"],
        "Level cannot be empty": ["Pakollinen"],
        "Date can't be in the past": ["Päivämäärä ei voi olla menneisyydessä"],
        "activeFromTime is not in time format.": ["Alkamisaika ei ole aika"],
        "activeUntilTime is not in time format.": ["Päättymisaika ei ole aika"],
        "activeFromTime can't be more than 24 hours.": [
          "Alkamisaika ei voi olla yli 24 tuntia",
        ],
        "activeUntilTime can't be more than 24 hours.": [
          "Päättymisaika ei voi olla yli 24 tuntia",
        ],
        "End time needs to be after start time.": [
          "Päättymisajan tulee olla alkamisajan jälkeen",
        ],
        "Date needs to be within three years.": [
          "Päivämäärän tulee olla kolmen vuoden sisällä",
        ],
        "Message cannot be shorter than 1 characters": [
          "Viesti ei saa olla tyhjä",
        ],
        "Message cannot be longer than 500 characters": [
          "Viesti ei saa olla yli 500 merkkiä",
        ],
        "String must contain at most 1000 character(s)": [
          "Viesti ei saa olla yli 1000 merkkiä",
        ],
        "String must contain at most 80 character(s)": [
          "Nimi ei saa olla yli 80 merkkiä",
        ],
        "String must contain at most 2000 character(s)": [
          "Viesti ei saa olla yli 2000 merkkiä",
        ],
        "String must contain at most 4000 character(s)": [
          "Viesti ei saa olla yli 4000 merkkiä",
        ],
        "must be a number": ["Pitää olla numero"],
        "lowestPrice must be lower than highestPrice": [
          "Alin hinta pitää olla pienempi kuin ylin hinta",
        ],
        "taxPercentage must be selected": ["Vero prosentti pitää valita"],
        "Begin needs to be in the future": [
          "Alkamisajan tulee olla tulevaisuudessa",
        ],
        "Number must be greater than or equal to 1": ["Pitää olla vähintään 1"],
        "Expected number, received null": ["Pakollinen"],
        "Max persons must be greater than min persons": [
          "Maksimi henkilömäärä pitää olla suurempi kuin minimi henkilömäärä",
        ],
        "Number must be greater than or equal to 0": ["Pitää olla vähintään 0"],
        "Min reservation duration must be less than max duration": [
          "Minimikesto pitää olla pienempi kuin maksimikesto",
        ],
        "time is not in time format.": ["Aika on ilmoitettava muodossa tt:mm"],
        "Begin must be before end": ["Valitse myöhäisempi päättymisaika."],
        "Previous end must be before next begin": [
          "Aikajakso ei voi alkaa ennen kuin edellinen aikajakso on päättynyt.",
        ],
        "time must be at 30 minute intervals": [
          "Aikajakson tulee alkaa tasalta tai puolelta.",
        ],
        "time can't be more than 24 hours.": [
          "Aika on ilmoitettava muodossa tt:mm",
        ],
        "Previous end can't be the same as next begin": [
          "Aikajakson päättymisaika ei voi olla sama kuin toisen aikajakson alkamisaika.",
        ],
        "Not allowed to add a second time without first": [
          "Aikajakso ei voi alkaa ennen kuin edellinen aikajakso on päättynyt.",
        ],
        "description cannot be shorter than 1 characters": ["Pakollinen"],
        "publishBeginsDate must be before end": [
          "Julkaisuajan tulee alkaa ennen kuin se päättyy.",
        ],
        "reservationBeginsDate must be before end": [
          "Varausajan tulee alkaa ennen kuin se päättyy.",
        ],
        "duration can't be less than reservation start interval": [
          "Kesto ei voi olla pienempi kuin varauksen alkamisväli.",
        ],
        "duration must be a multiple of the reservation start interval": [
          "Keston on oltava varauksen alkamisvälin kerrannainen",
        ],
      },
    },
    level: {
      noLevel: ["(ei tasoa)"],
      EXCEPTION: ["Poikkeus"],
      WARNING: ["Varoitus"],
      NORMAL: ["Normaali"],
    },
    state: {
      noState: ["(ei tilaa)"],
      ACTIVE: ["Julkaistu"],
      DRAFT: ["Luonnos"],
      SCHEDULED: ["Ajastettu"],
    },
    target: {
      noTarget: ["(ei kohderyhmää)"],
      ALL: ["Kaikki"],
      STAFF: ["Henkilökunta"],
      USER: ["Asiakkaat"],
    },
    headings: {
      state: ["Tila"],
      name: ["Nimi"],
      activeFrom: ["Voimassa alk."],
      activeUntil: ["Voimassa asti"],
      targetGroup: ["Kohderyhmä"],
      level: ["Tyyppi"],
    },
  },
  StageInfo: {
    stagesOfHandling: ["Käsittelyn vaiheet"],
    stage1: {
      title: ["Odota haun umpeutumista"],
      body: ["Haku on avoinna {{data}} asti."],
    },
    stage2: {
      title: [
        "Tarkasta lista ja neuvottele esihenkilösi kanssa mahdollisista hylkäyksistä",
      ],
      body: [
        "Hakemukset tulee esitarkastaa ja poistaa listalta aiheettomat hakemukset (esim. tuplahakemukset tai leikillään jätetyt hakemukset). Sovi esihenkilösi kanssa, saatko hylkäysehdotuksillesi myös esihenkilön hyväksynnän. Tämän jälkeen voit edetä jaon käynnistämiseen.",
      ],
    },
    stage3: {
      title: ["Käynnistä ehdotusten luominen"],
      body: [
        "Käynnistä ehdotusten luominen Jaa-painikkeesta. Kone tuottaa ehdotuksia ennalta määritetyille ryhmille sovitussa tärkeysjärjestyksessä.",
      ],
    },
    stage4: {
      title: [
        "Hyväksy tai hylkää ehdotukset ja uudelleenkäynnistä jako, kunnes kaikki ehdotukset on käsitelty",
      ],
      body: [
        "Käsittele jaon tuottamat vuoroehdotukset. Voit käynnistää jaon aina uudelleen niin monta kertaa kuin haluat. Jaon uudelleenkäynnistys on järkevää erityisesti silloin, kun ehdotuksia on hylätty ja tilaa on vapautunut. Voit edetä esihenkilöhyväksynnän valmisteluun, kun kaikki ehdotukset on käsitelty.",
      ],
    },
    stage5: {
      title: ["Lähetä koko käsittelyn lopputulos esihenkilösi hyväksyttäväksi"],
      body: [
        "Varmista esikatselunäkymästä, että päätöskokonaisuus vaikuttaa valmiilta, ja siirrä kokonaisuus esihenkilötarkistukseen. Esihenkilösi päättää, voidaanko päätökset toimittaa asiakkaille vai täytyykö niihin vielä tehdä muutoksia.",
      ],
    },
    stage6: {
      title: ["Odota esihenkilösi hyväksyntää tai mahdollisia muutospyyntöjä"],
      body: [
        "Et pysty siirron jälkeen enää tekemään käsittelyä, joten odota esihenkilöpäätöstä. Asiakkaat saavat päätökset, jos esihenkilö hyväksyy vuoroajan.",
      ],
    },
  },
  Units: {
    description: [
      "Alla näet kaikki toimipisteet, joihin sinulla on käyttöoikeus. Voit luoda ja hallita tiloja, resursseja sekä varausyksiköitä toimipisteen sivulta. Toimipisteen tietoja hallitaan",
    ],
    descriptionLinkLabel: ["toimipisterekisterin kautta"],
    descriptionLinkHref: ["https://asiointi.hel.fi/tprperhe/etusivu/"],
    filters: {
      nameLabel: ["Toimipisteen nimi"],
      unitGroup: ["Toimipisteryhmä"],
      unitGroupTag: ["Toimipisteryhmä: {{value}}"],
    },
    headings: {
      name: ["Toimipisteen nimi"],
      unitGroup: ["Toimipisteryhmä"],
      reservationUnitCount: ["Varausyksiköitä"],
    },
  },
  Unit: {
    headings: {
      name: ["Nimi"],
      code: ["Tilan numero"],
      service: ["Palvelut"],
      numSubSpaces: ["Alitilojen määrä"],
      surfaceArea: ["Koko"],
      maxPersons: ["Henkilömäärä"],
      area: ["Alue"],
    },
    emptyFilterPageName: ["toimipistettä"],
    reservationUnits_one: ["{{count}} varausyksikkö"],
    reservationUnits_other: ["{{count}} varausyksikköä"],
    noReservationUnits: ["Ei varausyksiköitä"],
    noArea: ["Alue puuttuu"],
    noService: ["Palvelu puuttuu"],
    unitCount_one: ["{{count}} toimipiste"],
    unitCount_other: ["{{count}} toimipistettä"],
    noUnits: ["Ei toimipisteitä"],
    showOnMap: ["Näytä kartalla"],
    showOpeningHours: ["Aukioloajat"],
    showSpacesAndResources: ["Tilat ja resurssit"],
    spacesAndResources: ["Tilojen ja resurssien hallinta"],
    showConfiguration: ["Asetukset"],
    noSpacesResourcesTitle: [
      "Toimipisteelle ei ole määritetty tiloja eikä resursseja",
    ],
    noSpacesResources: [
      "Toimipisteellä täytyy olla vähintään yksi tila, jotta voit luoda ensimmäisen varausyksikön.",
    ],
    createSpaces: ["Luo tiloja."],
    maintainOpeningHours: [
      "Siirry päivittämään toimipisteesi tiedot Toimipisterekisterin kautta.",
    ],
    reservationUnitTitle: ["Varausyksiköt"],
    reservationUnitReadMore: ["Lue lisää varausyksiköistä"],
    reservationUnitCreate: ["Luo uusi varausyksikkö"],
    noReservationUnitsTitle: ["Ei luotuja varausyksiköitä."],
    address: ["Osoite"],
    noAddress: ["Osoite puuttuu"],
    location: ["Toimipisteen sijainti"],
    spaces: ["Tilat"],
    addSpace: ["Uusi tila"],
    noSpaces: ["Ei vielä tiloja"],
    resources: ["Resurssit"],
    addResource: ["Uusi resurssi"],
    noResources: ["Ei vielä resursseja"],
    noResourcesSpaces: [
      "Lisää ensin tila ja sen jälkeen voit luoda resursseja",
    ],
    newSpacesCreatedTitle: ["Uudet tilat luotu onnistuneesti"],
    newSpacesCreatedNotification: [
      "Voit luoda tiloille alitiloja niin pitkälle kuin on tarpeellista.",
    ],
    spaceDeletedTitle: ["Tila poistettu"],
    spaceDeletedNotification: ["Tila poistettu onnistuneesti"],
    resourceDeletedTitle: ["Resurssi poistettu"],
    resourceDeletedNotification: ["Resurssi poistettu onnistuneesti"],
  },
  SpaceEditorView: {
    illegalSpace: ["Virheellinen tilan tunniste"],
    illegalUnit: ["Virheellinen toimipisteen tunniste"],
  },
  SpaceEditor: {
    // TODO this is weird translation key (it's the default value if there is no name for the parent)
    noParent: ["Päätason tila"],
    noUnit: ["Tilaa ei ole liitetty toimipisteeseen"],
    noAddress: ["Toimipisteellä ei ole osoitetta"],
    noSurfaceArea: ["Pinta-alaa ei ole asetettu"],
    details: ["Tilan tiedot"],
    hierarchy: ["Tilapuurakenne"],
    parent: ["Ylitila"],
    other: ["Muut tiedot"],
    cancel: ["Palaa tallentamatta tietoja"],
    save: ["Tallenna tiedot"],
    saveFailed: ["Tallennus ei onnistunut"],
    label: {
      nameFi: ["Tilan nimi suomeksi"],
      nameEn: ["Tilan nimi englanniksi"],
      nameSv: ["Tilan nimi ruotsiksi"],
      surfaceArea: ["Pinta-ala"],
      maxPersons: ["Henkilömäärä enintään"],
    },
    touLabel: ["Tilan ohjeet {{lang}}"],
    noMaxPersons: ["Henkilömäärää ei asetettu"],
    spaceUpdated: ["Tiedot tallennettu"],
    spaceUpdatedNotification: ["Tilan tiedot tallennettu"],
    area: ["{{surfaceArea}} m²"],
  },
  FormErrorSummary: {
    label: ["Korjaa ensin lomakkeen virheet"],
    errorLabel: ["Virhe {{index}}"],
  },
  SpaceModal: {
    phase: ["Vaihe"],
    namePlaceholder: ["Tilan nimi {{language}}"],
    nameLabel: ["Tilan nimi {{lang}}"],
    page1: {
      modalTitle: ["Luo uusi tila toimipisteelle"],
      subSpaceModalTitle: ["Luo alitila tilalle"],
      info: [
        "Voit luoda yhden tai kerralla useita samaan tasoon liittyviä tiloja, joiden nimet ja tiedot voivat vaihdella.",
      ],
      title: ["Valitse tilojen määrä ja ylitila"],
      numSpacesLabel: ["Uusien tilojen määrä"],
      numSpacesHelperText: ["Valitse alustava määrä."],
      parentLabel: ["Ylitila"],
      parentPlaceholder: ["Valitse ylitila tai uusi itsenäinen tila."],
      parentHelperText: [
        "Ylitila tarkoittaa tilaa, jonka osaksi nyt luomasi tila kuuluu. Jos tila on uusi itsenäinen tila, valitse itsenäinen tila. Voit vaihtaa ylitilan myöhemminkin.",
      ],
      buttonCancel: ["Palaa tallentamatta tiloja"],
      buttonNext: ["Seuraava"],
    },
    page2: {
      modalTitle: ["Määritä tilojen pohjatiedot"],
      subSpaceModalTitle: ["Määritä alitilatiedot"],
      info: [
        "Voit muokata tiloja milloin tahansa myöhemmin. Huomioi paloturvallisuusmääräykset maksimihenkilömäärissä.",
      ],
      subSpaceInfo: [
        "Voit luoda yhden tai kerralla useita alitiloja, joiden nimet ja tiedot voivat vaihdella.",
      ],
      newRootSpace: ["Uusi itsenäinen tila"],
      addRowButton: ["Lisää rivi"],
      prevButton: ["Edellinen"],
      createButton: ["Luo tilatieto"],
      nameLabel: ["Tilan nimi"],
      surfaceAreaLabel: ["Pinta-ala"],
      surfaceAreaHelperText: ["m²"],
      maxPersonsLabel: ["Henkilömäärä enintään"],
      maxPersonsHelperText: ["henkilöä"],
      codeLabel: ["Tilan numero"],
      codePlaceholder: ["Numero tai koodi"],
      saving: ["Luodaan tilatietoja..."],
      saveFailed: ["Tallennus ei onnistunut"],
    },
  },
  SpaceTable: {
    subSpaceCount_one: ["alitila"],
    subSpaceCount_other: ["alitilaa"],
    menuAddSubSpace: ["Lisää alitiloja"],
    menuEditSpace: ["Muokkaa tilatietoja"],
    menuRemoveSpace: ["Poista tila"],
    removeConflictTitle: ["Tilaa ei voi poistaa"],
    removeConflictMessage: [
      "Et voi poistaa tilaa. Siirrä tai poista ensin resurssi",
    ],
    removeConfirmationTitle: ["Haluatko varmasti poistaa tilan {{name}}?"],
    removeConfirmationMessage: [
      "Tila poistetaan kaikista varausyksiköistä, joihin se on liitetty. Et voi perua toimintoa.",
    ],
    removeConfirmationAccept: ["Poista"],
    removeConfirmationCancel: ["Kumoa"],
    removeFailed: ["Tilan poistaminen ei onnistunut."],
  },
  ReservationDialog: {
    // field names (for input controls) => should be moved (not dialog specific)
    date: ["Päivämäärä"],
    startingDate: ["Aloituspäivä"],
    endingDate: ["Päättymispäivä"],
    startTime: ["Aloitusaika"],
    endTime: ["Päättymisaika"],
    // dialog specific
    title: ["Varaa {{reservationUnit}}"],
    accept: ["Varaa"],
    saveFailedWithError: ["Tallennus ei onnistunut. {{error}}"],
    saveFailed: ["Tallennus ei onnistunut."],
    saveSuccess: ["Varaus tehty kohteeseen {{reservationUnit}}"],
  },
  ReservationUnits: {
    reservationUnitListHeading: ["Varausyksiköt"],
    reservationUnitListDescription: [
      "Alla näet kaikki luodut varausyksiköt, joihin sinulla on käyttöoikeus. Voit luoda uuden varausyksikön toimipisteen sivulta.",
    ],
    emptyFilterPageName: ["varausyksikköä"],
    state: {
      ARCHIVED: ["Arkistoitu"],
      DRAFT: ["Luonnos"],
      HIDDEN: ["Piilotettu"],
      PUBLISHED: ["Julkaistu"],
      SCHEDULED_HIDING: ["Piilotus ajastettu"],
      SCHEDULED_PERIOD: ["Julkaisuväli ajastettu"],
      SCHEDULED_PUBLISHING: ["Julkaisu ajastettu"],
    },
    reservationState: {
      RESERVABLE: ["Varattavissa"],
      SCHEDULED_RESERVATION: ["Varaus ajastettu"],
      SCHEDULED_PERIOD: ["Varausväli ajastettu"],
      SCHEDULED_CLOSING: ["Sulku ajastettu"],
      RESERVATION_CLOSED: ["Suljettu"],
    },
    headings: {
      name: ["Nimi"],
      unitName: ["Toimipiste"],
      district: ["Kaupunginosa"],
      reservationUnitType: ["Tilatyyppi"],
      maxPersons: ["Hlömäärä (max)"],
      surfaceArea: ["Pinta-ala"],
      state: ["Tila"],
      reservationState: ["Varauskalenteri"],
    },
  },
  ReservationUnitsSearch: {
    resultCount_one: ["{{count}} hakutulos"],
    resultCount_other: ["{{count}} hakutulosta"],
    typeLabel: ["Tilan tyyppi"],
    typePlaceHolder: ["Suodata"],
    unitLabel: ["Toimipiste"],
    unitPlaceHolder: ["Suodata"],
    maxPersonsLabel: ["Henkilömäärä"],
    surfaceAreaLabel: ["Pinta-ala (m²)"],
    stateLabel: ["Tila"],
    notANumber: ["Ei ole numero"],
    clear: ["Tyhjennä"],
    moreFilters: ["Näytä lisää suodattimia"],
    lessFilters: ["Näytä vähemmän suodattimia"],
    filters: {
      maxPersonsGteTag: ["Vähintään {{value}} hlö"],
      maxPersonsLteTag: ["Enintään {{value}} hlö"],
      surfaceAreaGteTag: ["Vähintään {{value}} m²"],
      surfaceAreaLteTag: ["Enintään {{value}} m²"],
    },
  },
  ReservationUnitsFilter: {
    label: ["Varausyksikkö"],
  },
  ReservationUnitCard: {
    spaceOnly: ["Tila"],
    spaceAndResource: ["Tila ja resurssi"],
    noArea: ["pinta-ala puuttuu"],
    noMaxPersons: ["Maksimihenkilömäärä puuttuu"],
    noReservationUnitType: ["Varausyksikön tyyppi puuttuu"],
    noPurpose: ["Käyttötarkoitus puuttuu"],
    purpose_one: ["{{count}} käyttötarkoitus"],
    purpose_other: ["{{count}} käyttötarkoitusta"],
    statePublished: ["Julkaistu"],
    stateDraft: ["Luonnos"],
    stateArchived: ["Arkistoitu"],
  },
  ReservationUnitList: {
    typeFilter: ["Tyyppi"],
    statusFilter: ["Tila"],
  },
  ReservationUnitEditor: {
    // NOTE the labels are used in a dynamic error summary (even if the key can't be found)
    label: {
      reservationKind: ["Varaustyyppi"],
      nameFi: ["Varausyksikön nimi fi"],
      nameSv: ["Varausyksikön nimi sv"],
      nameEn: ["Varausyksikön nimi en"],
      spaces: ["Tilat"],
      resources: ["Resurssit"],
      surfaceArea: ["Pinta-ala (m2)"],
      maxPersons: ["Henkilömäärä enintään"],
      minPersons: ["Henkilömäärä vähintään"],
      reservationUnitType: ["Tilatyyppi"],
      descriptionFi: ["Kuvaus fi"],
      descriptionSv: ["Kuvaus sv"],
      descriptionEn: ["Kuvaus en"],
      minReservationDuration: ["Varauksen kesto vähintään"],
      maxReservationDuration: ["Varauksen kesto enintään"],
      publishBeginsDate: ["Julkaisu alkaa"],
      publishEndsDate: ["Julkaisu päättyy"],
      publishBeginsTime: ["Julkaisu alkaa"],
      publishEndsTime: ["Julkaisu päättyy"],
      reservationBeginsDate: ["Varauksen alkamispäivä"],
      reservationBeginsTime: ["Varauksen alkamisaika"],
      reservationEndsDate: ["Varauksen päättymispäivä"],
      reservationEndsTime: ["Varauksen päättymisaika"],
      reservationStartInterval: ["Varauksen aloitukset"],
      reservationsMinDaysBefore: ["Varattavissa viimeistään (vrk ennen)"],
      reservationsMaxDaysBefore: ["Varattavissa alkaen"],
      maxReservationsPerUser: ["Varauksia enintään per käyttäjä"],
      lowestPrice: ["Alin hinta (sis. alv)"],
      lowestPriceNet: ["Alin hinta (alviton)"],
      highestPrice: ["Ylin hinta (sis. alv)"],
      highestPriceNet: ["Ylin hinta (alviton)"],
      canApplyFreeOfCharge: [
        "Asiakas voi pyytää hinnan alennusta tai maksuttomuutta",
      ],
      pricings: ["Hinnoittelu"],
      metadataSet: ["Varauslomake"],
      termsOfUseFi: ["Varausyksikkökohtaiset lisätiedot fi"],
      termsOfUseSv: ["Varausyksikkökohtaiset lisätiedot sv"],
      termsOfUseEn: ["Varausyksikkökohtaiset lisätiedot en"],
      serviceSpecificTerms: ["Palvelukohtaiset täydentävät ehdot"],
      cancellationTerms: ["Peruutusehdot"],
      paymentTerms: ["Maksuehdot"],
      paymentTypes: ["Maksutapa"],
      priceUnit: ["Hinnan yksikkö"],
      taxPercentage: ["Hinnan alv%"],
      reservationPendingInstructionsEn: [
        "Varausvahvistuksen lisäohjeteksti englanniksi",
      ],
      reservationPendingInstructionsFi: [
        "Varausvahvistuksen lisäohjeteksti suomeksi",
      ],
      reservationPendingInstructionsSv: [
        "Varausvahvistuksen lisäohjeteksti ruotsiksi",
      ],
      // TODO
      reservationConfirmedInstructionsEn: [
        "Varausvahvistuksen lisäohjeteksti englanniksi",
      ],
      reservationConfirmedInstructionsFi: [
        "Varausvahvistuksen lisäohjeteksti suomeksi",
      ],
      reservationConfirmedInstructionsSv: [
        "Varausvahvistuksen lisäohjeteksti ruotsiksi",
      ],
      reservationCancelledInstructionsEn: [
        "Varausvahvistuksen lisäohjeteksti englanniksi",
      ],
      reservationCancelledInstructionsFi: [
        "Varausvahvistuksen lisäohjeteksti suomeksi",
      ],
      reservationCancelledInstructionsSv: [
        "Varausvahvistuksen lisäohjeteksti ruotsiksi",
      ],
      reservationKinds: {
        DIRECT_AND_SEASON: ["Yksittäis- ja kausivaraus"],
        DIRECT: ["Vain yksittäisvaraus"],
        SEASON: ["Vain kausivaraus"],
      },
      pricingType: ["Varausyksikön maksullisuus"],
      pricingTerms: ["Hinnoitteluperiaate"],
      pricingTypes: {
        paid: ["Maksullinen"],
        free: ["Maksuton"],
      },
      hasFuturePrice: ["Hintaan on tulossa muutos"],
      begins: ["Alkaa"],
      openingTime: ["Alkamisaika"],
      closingTime: ["Päättymisaika"],
    },
    tooltip: {
      reservationKind: [
        `Valitse miten varausyksikköä annetaan varattavaksi.
        "Vain kausivarattavat" tilat eivät näy yksittäisvarauspuolella.`,
      ],
      nameFi: [
        `Nimi kirjoitetaan ilman toimipisteen nimeä muodossa
      TILAT:
      -Tilan nimi
      -Tilan nimi nro
      -Tilan nimi, toisen tilan nimi ja kolmannen tilan nimi
      -Tilan nimi nro ja nro
      LAITTEET:
      - Laitteentyyppi nro (malli suluissa)
      esim. Ompelukone 2 (Bernina 1008)
      Kirjoitusasusta:
      -Nimen ensimmäinen kirjain isolla
      -Nimen tulee olla yksilöllinen ja kuvaava, jos mahdollista
      esim. Työhuone Klarinetti
      -jos samassa varausyksikössä on useampi tila, tilat erotetaan toisistaan pilkulla tai ja-sanalla.
      -Tilan nimi käännetään, jos kyseessä ei ole erisnimi, esim.
      Aalto-sauna / Aalto-bastu / Aalto-sauna
      -Tilan numero tilan nimen jälkeen. Jos tiloilla on sama ”kantanimi”, nimi laitetaan vain kerran
      esim. Tähtihuone 1 ja 2 / Stjärnrummet 1 och 2 / Star Room 1 and 2
      - Jos toimipisteen opasteet ovat vain suomeksi, tilan suomenkielinen nimi tulee näkyä joko tilan nimessä tai kuvauksessa
      esim. ruotsiksi Rantasauna [Strandbastu]`,
      ],
      spaces: [
        `Varausyksikkö voi koostua yhdestä tai useammasta tilasta. Jokainen resurssi tai laite tarvitsee oman tilansa.
      Huomioi tilahierarkia ja että tila ei voi koskaan olla samanaikaisesti varattuna kuin kerran.
      Tilahierarkiaa pääset muokkaamaan toimipisteen sivulla.`,
      ],
      resources: [
        "Valitse tilaan liitettävät resurssit ja laitteet. Luo laitteille tarvittaessa uusi alitila toimipisteen sivulla.",
      ],
      surfaceArea: [
        "Pinta-ala lasketaan automaattisesti  varausyksikköön kuuluvien tilojen lattiapinta-alan perusteella.",
      ],
      maxPersons: [
        "Enimmäishenkilömäärä lasketaan automaattisesti  varausyksikköön kuuluvien tilojen  henkilömäärien perusteella. Ilmoitetut henkilömäärät perustuvat paloturvallisuusmääräyksiin. Pienennä varausyksikön henkilömäärää tarvittaessa.",
      ],
      minPersons: [
        "Minimihenkilömäärä voidaan ilmoittaa, jos tilan käyttöä halutaan ohjata riittävän suuriin varauksiin. Esimerkki: 100hlö sali  halutaan tarjota vähintään 30hlön tilaisuuksiin tai yksin työskentelyä halutaan välttää ryhmätiloissa (min 2 hlö). Suositus: jätetään tyhjäksi",
      ],
      reservationUnitType: [
        `Valitse varausyksikköä parhaiten kuvaava tilatyyppi. Valinnalla on vaikutusta hakutulokseen.
        TILAT:
        Valitse “MONITOIMITILA”, jos et löydä listalta sopivaa tyyppiä.
        LAITTEET:
        valitse “Laitteet ja välineet”
        SOITTIMET:
        valitse “soittimet”`,
      ],
      purposes: [
        `Valitse käyttötarkoitukset, joihin varausyksikkö aidosti sopii. Voit valita useita. Valinta vaikuttaa hakutuloksiin.
      LAITTEET:
      valitse “Laitteiden käyttö”`,
      ],
      equipments: [
        `Valitse varusteet, jotka ovat kaikkien käyttäjien saatavilla. Jos tiettyä varustusta voi käyttää vain erikseen kysymällä, sitä ei tule listata.
        Täydennyksiä varustelistaan voi pyytää ylläpidolta. `,
      ],
      qualifiers: [
        `Lisää tarvittaessa tilan ikärajoja tai sisäänpääsyä kuvaavat tarkenteet.
      Sopimusehtojen mukaisesti alle 15-vuotiaat eivät voi varta tiloja ellei sitä ole erikseen sallittu.
      Lasten ja nuorten (peli)tilat:
      valitse “varattavissa alle 15-vuotiaille”`,
      ],
      description: [
        `Kuvaus kirjoitetaan standardointipohjan mukaisesti.
      Lisää linkkejä ulkoisille verkkosivuille kuten käyttöohjeisiin vain tarvittaessa. Tarkista linkkien toimivuus ja saavutettavuus säännöllisesti. Käytäthän muotoiluja harkiten. `,
      ],
      publishingSettings: [
        `Voit ajastaa varausyksikön julkaistavaksi tai piilotettavaksi asiakkailta tiettynä ajankohtana.`,
      ],
      reservationSettings: [
        `Voit ajastaa varauskalenterin avattaksi tai suljettavaksi tiettynä ajankohtana. Kalenterin ollessa suljettu, asiakkaat eivät voi varata varausyksikköä käyttöönsä.`,
      ],
      minReservationDuration: [
        `Suosituksia:
      Kokoustilat, työpisteet: 30min tai 60min
      Itsenäisen käytön tilat: 60min tai 90min
      pelitilat, liikuntapaikat: 30min
      studiot: 60min
      saunavuorot ja muut kiinteäkestoiset vuorot: keston mukaan, jolloin min=max
      tapahtumatilat, kokopäiväksi varattavat: 60min tai harkinnan mukaan
      soittimet, laitteet: 30min tai harkinnan mukaan`,
      ],
      maxReservationDuration: [
        `Jos käyttöaste on matala, mahdollista pitkät varaukset.
      Suosituksia:
      ruuhkaiset kokoustilat, työpisteet: 2-4tuntia tai harkinnan mukaan.
      itsenäisen käytön tilat: harkinnan mukaan
      Kokopäiväksi varattavat tilat: maksimi aukioloajan mukaan, esim. klo 8-20=12tuntia tai 7-22=15tuntia
      pelitilat, tenniskentät: 2tuntia
      saunavuorot ja muut kiinteäkestoiset vuorot: keston mukaan, jolloin min=max
      laitteet: arvioidun työskentelykeston tai harkinnan mukaan
      soittimet: 2tuntia`,
      ],
      reservationsMaxDaysBefore: [
        `Valitse, kuinka paljon etukäteen varausyksikön voi varata.
      Esimerkki: Jos valitset “6kk”, varauskalenteri on auki tästä hetkestä puolenvuoden päähän.
      Suosituksia:
      Yleinen suositus: 3 kk
      tenniskentät: 2 vko
      (ulko)tapahtumatilat, kesätilat: 6 kk
      taideseinät: 12kk tai harkinnan mukaan `,
      ],
      reservationsMinDaysBefore: [
        `Valitse, kuinka paljon etukäteen varausyksikkö pitää viimeistään varata.
        Suosituksia:
        0, jos varuksen voi tehdä samalle päivälle (kaikki kirjastojen suoravarattavat tilat)
        1, jos varaus tulee tehdä viim. edellisenä päivänä. Huomio vuorokausiraja on keskiyöllä klo 23.59.
        3 / 5 vrk, jos varaus edellyttää käsittelyä
        7 / 14 vrk, jos itsenäinen käyttö ja varaus tulee sekä käsitellä ja asiakas maksaa ja noutaa avaimet
        tapahtumatilat: harkinnan mukaan`,
      ],
      reservationStartInterval: [
        `Voit määrittää, minkä ajan välein varaukset voivat alkaa.
      Esimerkki:
      Jos varauksen aloitukset ovat 30min välein, varaukset voivat alkaa vain tasa- ja puolitunnein.
      suositus:
      30min
      15min välein - jos käytät 15min taukoja tai olet asettanut tilan aukioloajat 15min tarkkuudella`,
      ],
      bufferSettings: [
        `Voit asettaa automaattiset tauot varauksen alkuun tai loppuun, mikäli haluat esim. tuulettaa tai tarkistaa tilan varausten välissä. Tauko lisätään jokaiseen varaukseen ja seuraava varaus voi alkaa vasta tauon päätyttyä.
      Esimerkki:
      Varaus tehdään 12.00-13.00 ja vuoron jälkeen on asetettu 30min tauko. Seuraava varaus voi alkaa vasta 13.30.
      Vain yksi varaus vuorokaudessa: varaukselle asetetaan tauot automaattisesti siten, että jos varaus tehdään esim. 8.00-16.00, niin sitä ennen muodostuu tauko 0.00-8.00 ja sen jälkeen 16.00-24.00, joilloin samalle vuorokaudelle ei voi tehdä enempää varauksia.
      Suositus:
      tauotusta ei käytetä`,
      ],
      cancellationSettings: [
        `Valitse asetus, jos varauksen voi peruuttaa ja määritä aika, jota ennen asiakas voi perua varauksensa järjestelmässä.
      Asiakkaalle näkyvä kirjallinen peruutusehto valitaan erikseen kohdassa “Ehdot ja ohjeet”.
      Huomioi maksullisten tilojen hallinnollinen päätös.
      Suositukset:
      ei peruutusmahdollisuutta – asiakkaan sitouttavat maksulliset varaukset, mm. tenniskentät
      varauksen alkuun asti – yleinen suositus mm. kirjaston maksuttomille tiloille ja laitteille
      14vrk – tyypillisesti maksulliset tilat
      1kk (30 vrk) – tapahtumatilat
      8vko (55 vrk) – leirikeskukset
      Jos peruutukset on käsiteltävä, ota yhteyttä ylläpitoon.`,
      ],
      metadataSet: [
        `Lomake määrittää varauksessa asiakkaalta kysyttävät kentät.
      Jos et löydä tarvitsemaasi lomaketta, ota yhteyttä palvelusi Varaamo-tuoteomistajaan tai ylläpitoon.`,
      ],
      authentication: [
        `Voit määrittää, vaatiiko varauksen tekeminen varausyksikölle vahvan vai heikon tunnistautumisen. Vahva tunnistautuminen vaatii, että asiakkaan profiili on varmennettu esimerkiksi pankkitunnuksin.
      Heikko tunnistautuminen kysyy ainoastaan sähköpostia ja salasanaa.
      Suositukset:
      HEIKKO – toimipisteen aukioloaikana tapahtuva käyttö, edulliset maksulliset tilat, työpisteet, laitteet, ensisijaisesti alaikäisten käyttöön tarkoitetut (peli)tilat
      VAHVA – kaikki itsenäinen käyttö, tapahtumatilat, kalliimmat maksulliset tilat, tilat tai laitteet, joiden käytössä on merkittävä taloudellinen riski`,
      ],
      maxReservationsPerUser: [
        `Voit määrittää, kuinka monta  voimassaolevaa varausta käyttäjällä voi samanaikaisesti olla tähän varausyksikköön.
      Älä rajoita määrää tarpeettomasti. Väärinkäytösten ehkäisemiseksi suositus max 30/varausyksikkö. `,
      ],
      introductionSettings: [
        `Toiminnallisuus ei ole vielä käytössä.
      Suositus:
      jätä tyhjäksi`,
      ],
      handlingSettings: [
        `Voit valita kaikki varaukset käsiteltäviksi ennen hyväksymistä.
      Varaukset, joissa anotaan maksuttomuutta tai alennusta, tulevat automaattisesti käsittelyyn.`,
      ],
      pricingType: [
        `Maksuton varausyksikkö on aina maksuton kaikille.
      Jos varausyksikkö on maksullinen, siihen on mahdollista hakea maksutonta käyttöä tai hinnan alennusta. ks. subventio`,
      ],
      lowestPrice: [
        `Alimman hinnan tulisi olla joko maksuttoman käytön (0) tai mahdollisen alennetun hinnan määrä.
      Jos tilalla on kiinteä hinta esim 30e, ilmoita alin=ylin hinta`,
      ],
      highestPrice: [
        `Varausyksikön normaali hinta, kun maksutonta käyttöä tai hinnan alennusta ei haeta.
      Jos tilalla on kiinteä hinta esim 30e, ilmoita alin=ylin hinta`,
      ],
      priceUnit: [
        `Suositus:
      Per tunti`,
      ],
      paymentTypes: [
        `Kertoo asiakkaalle käytössä olevat maksutavat.
      suositukset
      TILAT:
      verkkomaksu
      LAITTEET:
      maksu paikan päällä – silloin, kun laitteista peritään maksu`,
      ],
      canApplyFreeOfCharge: [
        `Valitse, jos asiakas voi anoa maksutonta käyttöä tai hinnan alennusta.
      Alennuspyynnöt tulevat automaattisesti käsiteltäväksi.
      Jos et ole valinnut käsittelyä kohdassa “Haluan käsitellä kaikki varausanomukset”, normaalihintaisia varauksia ei käsitellä.`,
      ],
      pricingTerms: [
        `Valitse listalta palvelussasi noudatettavat hinnoittelu- ja maksuttomuusperiaateet.
      Asiakkaan hinnanalennuspyyntö perustuu näihin periaatteisiin.
      Ota tarvittaessa yhteys ylläpitoon.`,
      ],
      serviceSpecificTerms: [
        `Helsingin kaupungin tilojen ja laitteiden varausehdot liitetään kaikkiin varausyksiköihin automaattisesti.
      Täydennä ehtoja tarvittaessa palvelusi ehdoilla.`,
      ],
      paymentTerms: [`Jos varausyksikkösi on maksullinen valitse maksuehdot.`],
      cancellationTerms: [
        `Valitse kirjallinen peruutusehto.
      Varmista, että peruutusasetukset kohdassa “Varauksen peruutus > Peruutus mahdollista” vastaa tässä valittua ehtoa.`,
      ],
      termsOfUseFi: [
        `Voit antaa asiakkaalle varuksen teon kannalta oleellisia lisätietoja. Tiedot näkyvät Huomioi varattaessa -otsikon alla varauslomaketta täytettäessä.
      Suositus:
      käytä vain tarvittaessa.
      Korkeintaan kolme varaajan kannalta oleellista asiaa.
      Esimerkki:
      Varmista tarvittaessa yhteysaluksen liikennöinti ennen varauksen tekoa. Jos teet varauksen samalla päivälle, ilmoitathan siitä aina myös puhelimitse henkilökunnalle [puh nro].
      tai
      Käsittelemme varauksia vain arkipäivisin. Tilan avaimen voit noutaa arkisin klo 7.30-8.30 välillä. Varaudu esittämään henkilöllisyystodistus.`,
      ],
      reservationPendingInstructionsFi: [
        `Tämä varausvahvistus lähetetään asiakkaalle sähköpostilla, kun varaus on lähetetty  käsittelyyn.
      Voit täydentää automaattista varausvahvistusta toimipisteen tiedoilla.`,
      ],
      reservationConfirmedInstructionsFi: [
        `Tämä varausvahvistus lähetetään asiakkaalle sähköpostilla, kun varaus on hyväksytty.
      Voit täydentää automaattista varausvahvistusta toimipisteen tiedoilla.`,
      ],
      reservationCancelledInstructionsFi: [
        `Tämä varausvahvistus lähetetään asiakkaalle sähköpostilla, kun varaus on hylätty tai peruutettu.
      Voit täydentää automaattista varausvahvistusta toimipisteen tiedoilla.`,
      ],
      contactInformation: [
        `Lisää nimesi ja yhteystietosi, jotta palvelusi tuoteomistaja tai Varaamon ylläpito tietää kehen tarvittaessa yhteyttä.`,
      ],
    },
    closed: ["Suljettu"],
    seasonalTimesTitle: ["Kausivarattavat ajat"],
    seasonalTimesDescription: [
      "Kausivarattavat ajat näkyvät hakuaikana varausyksikön sivulla. Tässä syötetyt ajat ohjaavat vain hakulomakkeen aikatoiveita ja vuorojenjakotyökalua. Anna ajat 30 min tarkkuudella, esim. 9:00 tai 9:30. Lopulliset varattavissaoloajat täytetään aukiolosovelluksessa.",
    ],
    clearSeasonalTimes: ["Tyhjennä ajat"],
    addSeasonalTime: ["Lisää aikaväli"],
    removeSeasonalTime: ["Poista aikaväli"],
    cancelledSubAccordion: ["Täydennä peruutusviestiä"],
    pendingExpandLink: ["Täydennä alustavan varauksen viestiä"],
    authenticationLabel: ["Tunnistautuminen"],
    defaultHeading: ["Uusi varausyksikkö"],
    basicInformation: ["Perustiedot"],
    typesProperties: ["Varustelu ja kuvaus"],
    termsInstructions: ["Ehdot ja ohjeet"],
    pendingInstructions: ["Alustava varaus"],
    confirmedInstructions: ["Hyväksytty varaus"],
    cancelledInstructions: ["Peruttu varaus"],
    nameHelper: ["Vinkki: hyvä nimi erottaa sen muista."],
    spacesPlaceholder: ["Liitä tarvittavat tilat"],
    equipmentsLabel: ["Varustelu"],
    equipmentsPlaceholder: ["Valitse varusteet"],
    reservationUnitTypePlaceholder: ["Valitse tilatyyppi"],
    reservationUnitTypeHelperText: ["Valitse tilaa parhaiten kuvaava tyyppi"],
    maxReservationsPerUserHelperText: [""],
    purposesLabel: ["Käyttötarkoitus"],
    purposesPlaceholder: ["Valitse mitä tarkoitusta tuetaan"],
    qualifiersLabel: ["Tarkenne"],
    qualifiersPlaceholder: ["Valitse"],
    resourcesPlaceholder: ["Liitä tarvittavat resurssit"],
    requireReservationHandling: [
      "Haluan käsitellä kaikki varaukset. Varaukset tulee aina käsitellä - hyväksyä tai hylätä -luvatussa ajassa, usein kolmen arkipäivän kuluessa.",
    ],
    requireIntroductionLabel: ["Varausyksikkö vaatii pakollisen perehdytyksen"],
    surfaceAreaHelperText: ["Tilojen yhteenlaskettua alaa ei voi pienentää"],
    maxPersonsHelperText: [
      "Tilojen yhteenlaskettua enimmäishenkilömäärää ei voi ylittää",
    ],
    minPersonsHelperText: [""],
    reservationsMinDaysBeforeHelperText: [""],
    errorNoSpaces: ["Toimipisteeseen ei ole liitetty yhtään tilaa"],
    errorDataHeading: ["Datavirhe"],
    errorParamsNotAvailable: [
      "Parametridataa puuttuu, osa lomakkeesta voi olla epäkunnossa",
    ],
    durationHours: ["{{hours}} tuntia"],
    tosPlaceholder: ["Ohjeteksti {{language}}"],
    termsPlaceholder: ["Valitse"],
    paymentTermsPlaceholder: ["Valitse"],
    cancellationTermsPlaceholder: ["Valitse"],
    serviceSpecificTermsPlaceholder: ["Valitse"],
    openingHours: ["Aukioloajat"],
    openingHoursHelperTextHasLink: [
      'Varausyksikön aukioloajat määritellään aukiolosovelluksessa. Huom. Käytä aukioloaikatyyppeinä ainoastaan "varauksella" ja "suljettu".',
    ],
    openingHoursHelperTextNoLink: [
      "Varausyksikön aukioloajat määritellään aukiolosovelluksessa. Pääset muokkaamaan aukioloaikoja kun varausyksikkö on tallennettu.",
    ],
    openingTimesExternalLink: ["Siirry aukiolosovellukseen"],
    previewCalendarLink: ["Siirry varaamon kalenterinäkymään"],
    cancel: ["Palaa tallentamatta muutoksia"],
    archive: ["Arkistoi varausyksikkö"],
    save: ["Tallenna tiedot"],
    preview: ["Esikatsele"],
    saving: ["Tallennetaan..."],
    saved: ["Tiedot tallennettu."],
    saveAsDraft: ["Tallenna luonnos"],
    reservationUnitCreatedNotification: ["Varausyksikkö {{name}} luotu"],
    reservationUnitUpdatedNotification: [
      "Varausyksikön muutokset tallennettu.",
    ],
    saveSuccess: ["Tiedot tallennettu."],
    saveFailed: [
      "Valitettavasti varausyksikön tallennus / julkaisu ei juuri nyt onnistu, kokeile myöhemmin uudelleen. ({{error}})",
    ],
    imageSaveFailed: [
      "Varausyksikön tallennus onnistui, mutta kuvien tallennus epäonnistui.",
    ],
    saveAndPublish: ["Julkaise"],
    settings: ["Varausasetukset"],
    cancellationIsPossible: ["Peruutus mahdollista"],
    cancellationGroupLabel: ["Peruutuksen tiedot"],
    communication: ["Viestintä"],
    additionalInstructionsPlaceholder: ["Lisäohjeteksti {{language}}"],
    contactInformationLabel: ["Vastuuhenkilön yhteystiedot"],
    contactInformationHelperText: [
      "Vain sisäiseen käyttöön, tiedot eivät näy varaajalle",
    ],
    contactInformationPlaceholder: ["Vastuuhenkilön yhteystiedot"],
    noPreviewUnsavedChangesTooltip: ["Tallenna ensin muutokset"],
    previewTooltip: ["Varausyksikön esikatselu"],
    noBuffer: ["Tauotusta ei käytetä"],
    blocksWholeDay: ["Vain yksi varaus vuorokaudessa"],
    setBufferTime: ["Aseta varaukselle tauot"],
    bufferTimeBefore: ["Aseta tauko ennen vuoroa"],
    bufferTimeBeforeDuration: ["Tauon kesto"],
    bufferTimeAfter: ["Aseta tauko vuoron jälkeen"],
    bufferTimeAfterDuration: ["Tauon kesto"],
    scheduledPublishing: ["Ajasta varausyksikön julkaisu tai piilotus"],
    publishingSettings: ["Julkaisun ajastus"],
    publishBegins: ["Julkaise alkaen"],
    publishEnds: ["Piilota alkaen"],
    scheduledReservation: [
      "Ajasta varauskalenterin aukiolo tai sulkeminen asiakkaille",
    ],
    reservationSettings: ["Varauskalenterin ajastus"],
    handlingSettings: ["Käsittely"],
    introductionSettings: ["Perehdytys"],
    bufferSettings: ["Varauksen tauko"],
    cancellationSettings: ["Varauksen peruutus"],
    reservationBegins: ["Avaa varauskalenteri alkaen"],
    reservationEnds: ["Sulje varauskalenteri alkaen"],
  },
  ImageEditor: {
    imageType: ["Kuvan tyyppi"],
    label: ["Varausyksikön kuvat"],
    buttonLabel: ["Valitse ja lataa kuva"],
    deleteImage: ["Poista"],
    mainImage: ["Pääkuva"],
    useAsMainImage: ["Käytä pääkuvana"],
    tooltip: [
      `Liitä vähintään kolme kuvaa. Kuvien tulisi olla todenmukaisia ja hyvälaatuisia.
      Suositus:
      lisää ensisijaisesti vaakatasossa kuvattuja kuvia, ei kuitenkaan panoramoja. jpeg/jpg ja png, max 1 M
      Kuvissa näkyviltä ihmisiltä tulee olla kuvauslupa. Kuvissa ei saa näkyä turvakameroita.`,
    ],
  },
  priceUnit: {
    FIXED: ["Per kerta"],
    PER_15_MINS: ["Per 15 min"],
    PER_30_MINS: ["Per 30 min"],
    PER_DAY: ["Per päivä"],
    PER_HALF_DAY: ["Per puoli päivää"],
    PER_HOUR: ["Per tunti"],
    PER_WEEK: ["Per viikko"],
  },
  orderStatus: {
    ALL: ["Maksuton"],
    PAID: ["Maksettu"],
    PAID_MANUALLY: ["Maksetaan paikan päällä"],
    DRAFT: ["Odottaa maksua"],
    REFUNDED: ["Hyvitetty"],
    CANCELLED: ["Peruutettu"],
    FREE: ["Maksuton"],
  },
  reservationStartInterval: {
    INTERVAL_15_MINS: ["15 min välein"],
    INTERVAL_30_MINS: ["30 min välein"],
    INTERVAL_60_MINS: ["1 tunnin välein"],
    INTERVAL_90_MINS: ["1,5 tunnin välein"],
    INTERVAL_120_MINS: ["2 tunnin välein"],
    INTERVAL_180_MINS: ["3 tunnin välein"],
    INTERVAL_240_MINS: ["4 tunnin välein"],
    INTERVAL_300_MINS: ["5 tunnin välein"],
    INTERVAL_360_MINS: ["6 tunnin välein"],
    INTERVAL_420_MINS: ["7 tunnin välein"],
  },
  ReservationStateFilter: {
    label: ["Käsittelytila"],
    state: {
      CANCELLED: "",
    },
  },
  ResourceModal: {
    modalTitle: ["Luo uusi resurssi tilalle"],
    info: [
      "Voit luoda kerralla yhden tilan resurssin. Niitä voivat olla esim. laitteet tai tarvikkeet.",
    ],
    selectSpace: ["Valitse tila"],
    namePlaceholder: ["Resurssin nimi  {{language}}"],
    cancel: ["Palaa tallentamatta tietoja"],
    save: ["Tallenna"],
    saveError: ["Tietojen tallennus epäonnistui."],
  },
  ResourceTable: {
    headings: {
      name: ["Nimi"],
      unitName: ["Toimipiste"],
    },
    menuEditResource: ["Muokkaa resurssia"],
    menuRemoveResource: ["Poista resurssi"],
    removeConfirmationTitle: ["Haluatko varmasti poistaa resurssin {{name}}?"],
    removeConfirmationMessage: [
      "Resurssi poistetaan toimipisteestä. Et voi perua toimintoa.",
    ],
    removeConfirmationAccept: ["Poista"],
    removeConfirmationCancel: ["Kumoa"],
    removeFailed: ["Resurssin poistaminen ei onnistunut."],
    removeSuccess: ["Resurssi poistettu."],
  },
  RecurringReservationsView: {
    Heading: ["Ajankohta"],
  },
  Payment: {
    status: {
      DRAFT: ["Odottaa"],
      EXPIRED: ["Rauennut"],
      CANCELLED: ["Peruutettu"],
      PAID: ["Maksettu"],
      PAID_MANUALLY: ["Paikan päällä"],
      REFUNDED: ["Hyvitetty"],
    },
  },
  Calendar: {
    legend: {
      confirmed: ["Hyväksytty varaus"],
      unconfirmed: ["Varaustoive"],
      otherRequiedHandling: ["Muun varaajan toive"],
      rest: ["Varattu"],
    },
  },
  // TODO this is in RequestedReservations.tsx
  Reservations: {
    reservationListHeading: ["Varaustoiveet"],
    emptyFilterPageName: ["varausta"],
    reservationListDescription: [
      "Alla näet kaikki käsittelemättömät varaustoiveet. Klikkaamalla varaajan nimeä pääset käsittelemään varauksen.",
    ],
    allReservationListHeading: ["Kaikki varaukset"],
    allReservationListDescription: [
      "Alla näet kaikki tulevat varaukset ja käsittelemättömät varaustoiveet. Voit tarkastella varauksia tarkemmin klikkaamalla varaajan nimeä.",
    ],
    headings: {
      id: ["id"],
      reserveeName: ["Varaajan nimi"],
      reservationUnit: ["Varausyksikkö"],
      unit: ["Toimipiste"],
      datetime: ["Aika"],
      createdAt: ["Tehty"],
      paymentStatus: ["Maksutila"],
      state: ["Käsittelytila"],
    },
    prefixes: {
      behalf: ["Puolesta| "],
      staff: ["Sis.| "],
    },
  },
  ReservationsListButton: {
    changeTime: ["Muuta aikaa"],
    showInCalendar: ["Näytä kalenterissa"],
  },
  ApprovalButtons: {
    edit: ["Muokkaa tietoja"],
    editSeriesTime: ["Muokkaa ajankohtaa"],
    editTime: ["Muuta aikaa"],
    recurring: {
      rejectAllButton: ["Hylkää kaikki"],
      DenyDialog: {
        title: ["Hylkää kaikki"],
      },
    },
  },
  // common terms used in filters (reused in multiple places)
  // TODO key prefix is questionable (it's not only filters)
  filters: {
    // TODO move to label
    homeCity: ["Kotipaikka"],
    purpose: ["Käyttötarkoitus"],
    ageGroup: ["Ikäryhmä"],
    label: {
      unit: ["Toimipiste"],
      reservationUnit: ["Varausyksikkö"],
      applicant: ["Asiakastyyppi"],
      status: ["Käsittelyn vaihe"],
      eventStatus: ["Käsittelyn vaihe"],
      weekday: ["Viikonpäivä"],
      selectUnits: ["Valitse toimipisteet"],
      priority: ["Aikatoive"],
      search: ["Hae hakemusta"],
      searchReservation: ["Hae varausta"],
      ageGroup: ["Ikäryhmä"],
      purpose: ["Käyttötarkoitus"],
      homeCity: ["Kotikunta"],
      applicantType: ["Asiakastyyppi"],
      order: ["Varausyksiköiden toivejärjestys"],
      state: ["Käsittelyn tilanne"],
      reservationUnitType: ["Tilan tyyppi"],
      reservationUnitState: ["Varausyksikön tila"],
      orderStatus: ["Maksutila"],
      price: ["Hinta"],
      minPrice: ["Hinta vähintään"],
      maxPrice: ["Hinta enintään"],
      dateGte: ["Päivämäärä"],
      dateLte: [" "],
      paymentStatus: ["Maksutila"],
      createdAtGte: ["Tehty alkaen"],
      createdAtLte: [" "],
      freeOfCharge: ["Hakee maksutonta käyttöä"],
      reservationType: ["Varauksen tyyppi"],
      recurring: ["Toistuva varaus"],
      onlyRecurring: ["Vain toistuvat"],
      onlyNotRecurring: ["Vain yksittäiset"],
    },
    placeholder: {
      unit: ["Valitse toimipiste"],
      reservationUnit: ["Valitse varausyksikkö"],
      applicant: ["Valitse asiakastyyppi"],
      // NOTE on purpose duplicating the translation, the filter is separate but we want same labels
      status: ["Valitse käsittelyn vaihe"],
      eventStatus: ["Valitse käsittelyn vaihe"],
      weekday: ["Valitse viikonpäivä"],
      priority: ["Valitse aikatoive"],
      order: ["Valitse toivejärjestys"],
      search: ["Hae nimellä tai ID:llä"],
      applicantType: ["Valitse asiakastyyppi"],
      ageGroup: ["Valitse ikäryhmä"],
      purpose: ["Valitse käyttötarkoitus"],
      homeCity: ["Valitse kotikunta"],
      reservationUnitType: ["Valitse"],
      reservationUnitState: ["Valitse varausyksikön tila"],
      paymentStatus: ["Valitse"],
      state: ["Valitse"],
      orderStatus: ["Valitse"],
      minPrice: ["Vähintään"],
      maxPrice: ["Enintään"],
      dateGte: ["Alkaen"],
      dateLte: ["Asti"],
      createdAtGte: ["Alkaen"],
      createdAtLte: ["Asti"],
      reservationType: ["Valitse varauksen tyyppi"],
      maxPersonsGte: ["Vähintään"],
      maxPersonsLte: ["Enintään"],
      surfaceAreaLte: ["Enintään"],
      surfaceAreaGte: ["Vähintään"],
    },
    tag: {
      minPrice: ["Vähintään {{price}} €"],
      maxPrice: ["Enintään {{price}} €"],
      dateGte: ["Alkaen {{date}}"],
      dateLte: ["{{date}} asti"],
      createdAtGte: ["Tehty alkaen {{date}}"],
      createdAtLte: ["Tehty viimeistään {{date}}"],
      state: ["Tilanne: {{state}}"],
      reservationUnitType: ["Tila: {{type}}"],
      orderStatus: ["Maksutila: {{status}}"],
      reservationType: ["Tyyppi: {{type}}"],
      search: [`Haku: "{{search}}"`],
    },
    // weird values that don't fit under placeholder or label (custom options in this case)
    reservationUnitApplication: ["Tilatoive"],
    reservationUnitApplicationOthers: ["Muut tilatoiveet"],
    noPaymentStatus: ["Maksuton"],
    reservationTypeChoice: {
      BEHALF: ["Asiakkaan puolesta"],
      BLOCKED: ["Suljettu"],
      NORMAL: ["Asiakasvaraus"],
      STAFF: ["Sisäinen varaus"],
      SEASONAL: ["Kausivaraus"],
    },
  },
  RequestedReservation: {
    heading: ["Varauksen tarkastelu"],
    calendar: ["Varauskalenteri"],
    summary: ["Varauksen yhteenveto"],
    recurring: ["Toistokerrat"],
    state: {
      REQUIRES_HANDLING: ["Käsittelemättä"],
      CONFIRMED: ["Hyväksytty"],
      DENIED: ["Hylätty"],
      CANCELLED: ["Peruutettu"],
      CREATED: ["Luonnos"],
      WAITING_FOR_PAYMENT: ["Odottaa maksua"],
    },
    applicationLink: ["Avaa hakemus"],
    approve: ["Hyväksy"],
    reject: ["Hylkää"],
    returnToHandling: ["Palauta käsiteltäväksi"],
    cancel: ["Takaisin"],
    pricingDetails: ["Hintatiedot"],
    noPrice: ["maksuton"],
    price: ["Hinta"],
    createdAt: ["Lähetetty"],
    applicantType: ["Asiakastyyppi"],
    reservationDetails: ["Varauksen tiedot"],
    name: ["Varauksen nimi"],
    description: ["Kuvaus"],
    numPersons: ["Osallistujamäärä"],
    id: ["Varaustunnus"],
    ageGroupSuffix: ["vuotiaat"],
    reserveeDetails: ["Varauksen tekijä"],
    reserveeFirstName: ["Etunimi"],
    reserveeLastName: ["Sukunimi"],
    addressStreet: ["Lähiosoite"],
    addressCity: ["Kotikunta"],
    reserveeEmail: ["Sähköpostiosoite"],
    reserveePhone: ["Puhelin"],
    reserveeType: ["Asiakastyyppi"],
    reserveeOrganisationName: ["Yhdistyksen nimi"],
    reserveeBusinessName: ["Yrityksen nimi"],
    billingFirstName: ["Etunimi"],
    billingLastName: ["Sukunimi"],
    billingAddressStreet: ["Laskutusosoite"],
    billingAddressZip: ["Postinumero"],
    billingAddressCity: ["Postitoimipaikka"],
    billingEmail: ["Sähköpostiosoite (Laskutus)"],
    billingPhone: ["Puhelin (Laskutus)"],
    reservationUser: ["Tilan käyttäjän tiedot"],
    reserveeId: ["Y-tunnus"],
    noReserveeId: ["Ei y-tunnusta"],
    save: ["Tallenna"],
    appliesSubvention: ["hakee subventiota"],
    denyReason: ["Hylkäyksen syy"],
    cancelReason: ["Peruutuksen syy"],
    applyingForFreeOfCharge: ["Hakee subventiota"],
    freeOfChargeReason: ["Subvention perustelu"],
    paymentState: ["Maksutila"],
    handlingDetails: ["Ratkaisun kommentti"],
    workingMemo: ["Kommentit"],
    workingMemoLabel: ["Kirjoita kommentti"],
    workingMemoHelperText: ["Kommentit näkyvät vain henkilökunnalle"],
    savedWorkingMemo: ["Kommentti tallennettu"],
    errorSavingWorkingMemo: ["Kommentin tallennus ei onnistunut"],
    user: ["Varauksen tekijä"],
    email: ["Sähköposti"],
    birthDate: ["Syntymäaika"],
    hideBirthDate: ["Piilota"],
    showBirthDate: ["Näytä"],
    alreadyEnded: ["Päättynyt"],
    DenyDialog: {
      reject: ["Hylkää varaus"],
      denyReason: ["Hylkäyksen syy"],
      denyReasonHelper: [
        "Ilmoitus hylkäyksestä ja syy lähetetään tiedoksi varaajalle",
      ],
      successNotify: ["Varaus hylätty"],
      title: ["Vahvista varauksen hylkäys"],
      handlingDetailsHelper: ["Näytetään vain henkilökunnalle"],
      errorSaving: ["Hylkäys epäonnistui"],
      refund: {
        notAllowed: ["Palautus ei mahdollinen"],
        alreadyRefunded: ["Jo palautettu"],
        radioLabel: ["Palauta rahat"],
        returnChoice: ["Palauta maksu {{ price }} €"],
        noReturnChoice: ["Ei palautusta"],
        mutationSuccess: ["Varaus hylätty ja rahat palautetaan."],
        mutationFailure: [
          "Varaus hylätty, mutta rahojen palautus epäonnistui.",
        ],
      },
    },
    ApproveDialog: {
      title: ["Hyväksy varaus ja määritä subventoitu hinta"],
      titleWithoutSubvention: ["Hyväksy varaus"],
      subventionReason: ["Varaajan antamat subvention perusteet"],
      accept: ["Hyväksy varaus"],
      errorSaving: ["Hyväksyminen ei onnistunut. {{error}}"],
      approved: ["Varaus hyväksytty."],
      price: ["Varauksen hinta"],
      clearPrice: ["Aseta varaus maksuttomaksi"],
      missingPrice: ["Varauksen hinta puuttuu tai on virheellinen"],
      priceBreakdown: [
        "Alkuperäinen hinta = {{volume}} {{units}} * {{unitPrice}} / {{unit}} sis. alv {{vatPercent}}% = {{price}}",
      ],
      priceUnit: {
        PER_15_MINS: ["15 min"],
        PER_30_MINS: ["30 min"],
        PER_DAY: ["päivä"],
        PER_HALF_DAY: ["puoli päivää"],
        PER_HOUR: ["tunti"],
        PER_WEEK: ["viikko"],
      },
      priceUnits: {
        PER_15_MINS: [""],
        PER_30_MINS: [""],
        PER_DAY: ["päivää"],
        PER_HALF_DAY: ["puolta päivää"],
        PER_HOUR: ["tuntia"],
        PER_WEEK: ["viikkoa"],
      },
    },
    ReturnToRequiresHandlingDialog: {
      title: ["Palauta käsiteltäväksi"],
      accept: ["Palauta käsiteltäväksi"],
      returned: ["Varaus palautettu käsiteltäväksi"],
      errorSaving: ["Palauttaminen ei onnistunut {{error}}"],
    },
    noName: ["-"],
  },
  Allocation: {
    allocationTitle: ["Vuorojen jako"],
    applicants: ["Hakijat"],
    // TODO this is deeper in the tree (ApplicationEvents)
    selectApplicant: [
      "Valitse hakija nähdäksesi hakijan toivomat ajat kalenterissa.",
    ],
    schedulesWithoutAllocation: ["Toiveita jakamatta"],
    otherApplicants: ["Muut hakijat"],
    inAllocationHeader: ["Käsittelyssä"],
    partiallyAllocatedHeader: ["Vuorotoiveita täyttämättä"],
    allocatedHeader: ["Käsitelty"],
    allocatedApplicants: ["Vuoron saaneet"],
    declinedApplicants: ["Hylätyt"],
    openApplication: ["Avaa hakemus"],
    ageGroup: ["Ikäryhmä"],
    desiredReservationUnit: ["Tilatoive"],
    changeTime: ["Muuta aikaa"],
    startingTime: ["Aloitusaika"],
    endingTime: ["Päättymisaika"],
    primaryItems: ["Ensisijaiset"],
    noPrimaryItems: ["Ei ensisijaisia aikatoiveita."],
    secondaryItems: ["Muut"],
    noRequestedTimes: ["Ei vuorotoiveita tälle ajankohdalle."],
    applicationsWeek: ["Vuorotoive / vko"],
    primaryTimes: ["Ensisijaisesti"],
    secondaryTimes: ["Muut ajat"],
    showTimeRequests: ["Näytä vuorotoiveet"],
    allocatedTime: ["Myonnetty aika"],
    removeAllocation: ["Poista"],
    changeSlot: ["Muuta aikaa"],
    rejectSlot: ["Hylkää vuoro"],
    acceptSlot: ["Jaa {{duration}} vuoro"],
    acceptingSlot: ["Jaetaan vuoroa..."],
    acceptingSuccess: ['Vuoroa varaukselle "{{name}}" jaetaan.'],
    resetSuccess: ['Vuoro "{{name}}" poistettu'],
    countResultsPostfix: ["tuloksesta näytetty"],
    countAllResults: ["Kaikki {{ count }}  tulosta näytetty"],
    clearFiltersButton: ["Tyhjennä suodattimet"],
    lockOptions: ["Hylkää kaikki"],
    lockPartialOptions: ["Hylkää loput"],
    unlockOptions: ["Palauta käsittelyyn"],
    errors: {
      accepting: {
        alreadyDeclined: ['Varaukselle "{{name}}" on jo tehty hylkäys.'],
        // TODO this should only happen if the it's already allocated for that day
        // there should be no blocks to allocate for another day (unless it's completely fullfilled?)
        alreadyAllocated: ['Varaukselle "{{name}}" on jo jaettu vuoro.'],
        statusHandled: ['Varaus "{{name}}" on jo kokonaan jaettu.'],
        maxAllocations: [
          'Varaukselle "{{name}}" on jo jaettu maksimi määrä vuoroja.',
        ],
        statusCancelled: ['Varaus "{{name}}" on peruutettu.'],
        title: ["Vuoron jakaminen epäonnistui"],
        generic: [
          "Varmista, että hakukierros on käsittelyssä ja että valittu ajankohta on vapaana.",
        ],
        receivedCantAllocate: [
          "Hakukierrokselle ei voi jakaa vuoroja, koska se on vielä avoinna.",
        ],
        alreadyAllocatedWithSpaceHierrarchy: [
          'Vuoroa "{{name}}" ei voi jakaa, koska se on jo jaettu toiselle varausyksikölle.',
        ],
      },
      remove: {
        title: ["Vuoron poistaminen epäonnistui"],
        generic: ['Vuoron poistaminen varaukselta "{{name}}" epäonnistui.'],
        alreadyDeleted: ['Vuoro varaukselle "{{name}}" on jo poistettu.'],
      },
      noPermission: ["Sinulla ei ole riittäviä oikeuksia jakaa vuoroa."],
      allocatedDurationIsIncorrect: [
        "Jaettu vuoro ei vastaa hakijan toiveita.",
      ],
      requestedDurationIsIncorrect: [
        "Valittu kesto ei vastaa hakijan toiveita.",
      ],
      allocatedOutsideOfRequestedTimes: [
        "Jaettu vuoro on toiveen ulkopuolella.",
      ],
      selectionOutsideOfRequestedTimes: [
        "Valittu aika on toiveiden ulkopuolella.",
      ],
    },
  },
  validation: {
    string: {
      max: ["Kenttään {{fieldName}} voi lisätä korkeintaan {{limit}} merkkiä."],
      empty: ["{{fieldName}} on pakollinen tieto"],
      base: ["{{fieldName}} on pakollinen tieto"],
    },
    object: {
      unknown: ["{{fieldName}} tuntematon"],
    },
    number: {
      empty: ["{{fieldName}} on pakollinen tieto"],
      base: ["{{fieldName}} on pakollinen tieto"],
      min: ["{{fieldName}} pitää olla vähintään {{limit}}"],
      max: ["{{fieldName}} pitää olla pienempi kuin {{limit}}"],
      precision: ["{{fieldName}} {{limit}} desimaalia sallitaan"],
    },
    array: {
      min: ["{{fieldName}} on pakollinen tieto"],
    },

    any: {
      required: ["{{fieldName}} on pakollinen tieto"],
    },
  },
};

// transform to i18n format
const traverse = (
  obj: ITranslations,
  prefix = "",
  target = {
    fi: { translation: {} as { [index: string]: string } },
    en: { translation: {} as { [index: string]: string } },
    sv: { translation: {} as { [index: string]: string } },
  }
): Resource => {
  Object.keys(obj).forEach((k) => {
    if (obj[k] && !Array.isArray(obj[k])) {
      traverse(
        obj[k],
        `${prefix.length === 0 ? prefix : `${prefix}.`}${k}`,
        target
      );
    }
    if (Array.isArray(obj[k])) {
      const key = `${prefix}.${k}`;
      const values = <string[]>obj[k];
      const [valFi, valEn, valSv] = values;
      target.fi.translation[key] = valFi;
      target.en.translation[key] = valEn || `${valFi} en`;
      target.sv.translation[key] = valSv || `${valFi} sv`;
    }
  });
  return target;
};

export default traverse(translations);
