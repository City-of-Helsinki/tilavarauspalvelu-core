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
  AuthState: { initializing: ["Alustetaan..."] },
  ReserveeType: {
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
    clearAllSelections: ["Tyhjennä valinnat"],
    clear: ["Tyhjennä"],
    removeValue: ["Poista arvo"],
    toggleMenu: ["Vaihda valikon tila"],
    hoursLabel: ["Tunnit"],
    minutesLabel: ["Minuutit"],
    applicationName: ["Tilavarauskäsittely"],
    selectReservationUnit: ["Valitse tila"],
    favourite: ["Suosikki", "Favourite", "Favorit"],
    next: ["Seuraava", "Next", "Nästa"],
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
    select: ["Valitse"],
    filter: ["Suodata"],
    filtered: ["Suodatettu"],
    filterHideHandled: ["Piilota jo käsitellyt"],
    filterShowHandled: ["Näytä myös käsitellyt"],
    activateSelection: ["Siirry valintatilaan"],
    disableSelection: ["Poistu valintatilasta"],
    closeAll: ["Sulje kaikki"],
    openAll: ["Avaa kaikki"],
    closeModal: ["Sulje modaali-ikkuna"],
    today: ["Tänään"],
    agesSuffix: ["{{range}} -vuotiaat"],
    resetFilters: ["Tyhjennä suodattimet"],
    resetSearch: ["Tyhjennä hakukenttä"],
    apply: ["Käytä"],
    areaUnitSquareMeter: [" m²"],
    volumeUnit: [" kpl", " ", " "],
    personUnit_one: ["{{count}} henkilö"],
    personUnit_other: ["{{count}} henkeä"],
    hoursUnit: ["{{count}} h", "{{count}} h", "{{count}} h"],
    hoursUnitLong_one: ["{{count}} tunti", "{{count}} hour", "{{count}} timme"],
    hoursUnitLong_other: [
      "{{count}} tuntia",
      "{{count}} hours",
      "{{count}} timmar",
    ],
    minutesUnit: ["{{count}} min", "{{count}} min", "{{count}} min"],
    minutesUnitLong_one: [
      "{{count}} minuutti",
      "{{count}} minute",
      "{{count}} minut",
    ],
    minutesUnitLong_other: [
      "{{count}} minuuttia",
      "{{count}} minutes",
      "{{count}} minuter",
    ],
    streetAddress: ["Katuosoite"],
    postalNumber: ["Postinumero"],
    postalDistrict: ["Postitoimipaikka"],
    emailAddress: ["Sähköpostiosoite"],
    billingAddress: ["Laskutusosoite"],
    homeCity: ["Kotipaikka"],
    membersSuffix: [" jäsentä"],
    minAmount: ["Vähintään"],
    maxAmount: ["Enintään"],
    option: ["Vaihtoehto"],
    same: ["Sama"],
    loginWithTunnistamo: ["Kirjaudu palveluun Tunnistamon avulla, kiitos."],
    noAuthorization: ["Tunnuksellasi ei ole oikeuksia kyseiseen sisältöön."],
    youthServices: ["Nuorisopalvelut"],
    selectAllRows: ["Valitse kaikki rivit"],
    deselectAllRows: ["Poista kaikkien rivien valinta"],
    selectRowX: ["Valitse rivi {{row}}"],
    deselectRowX: ["Posta rivin {{row}} valinta"],
    selectGroupX: ["Valitse ryhmän {{group}} rivit"],
    deselectGroupX: ["Poista ryhmän {{group}} rivien valinta"],
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
    increaseByOneAriaLabel: ["Lisää yhdellä"],
    decreaseByOneAriaLabel: ["Vähennä yhdellä"],
    openToNewTab: ["Avaa uuteen välilehteen"],
    reservationUnit: ["Varausyksikkö"],
    remove: ["Poista"],
    restore: ["Palauta"],
  },
  errors: {
    applicationRoundNotFound: ["Haettua hakukierrosta ei löydy"],
    errorFetchingData: ["Virhe haettaessa tietoja"],
    functionFailed: ["Toiminto epäonnistui"],
    errorFetchingApplication: ["Virhe haettaessa hakemusta"],
    errorFetchingApplications: ["Virhe haettaessa hakemuksia"],
    errorFetchingRecommendations: ["Virhe haettaessa ehdotuksia"],
    errorFetchingReservationUnit: ["Virhe haettaessa tilan tietoja"],
    errorFetchingReservations: ["Virhe haettaessa varauksia"],
    errorFetchingCapacity: ["Virhe haettaessa varaustilannetta"],
    errorSavingApplication: ["Virhe tallennettaessa hakemusta"],
    errorSavingRecommendation: ["Virhe tallennettaessa ehdotusta"],
    errorSavingRecommendations: ["Virhe tallennettaessa ehdotuksia"],
    loginNeeded: ["Kirjautuminen vaaditaan"],
    authorizationNeeded: ["Oikeudet vaaditaan"],
    errorStartingAllocation: ["Allokoinnin käynnistys epäonnistui"],
    errorSavingData: ["Virhe tallennettaessa tietoja"],
    descriptive: {
      "Overlapping reservations are not allowed.": [
        "Ajankohdalle on jo varaus toisen varausyksikön kautta.",
      ],
      genericError: [""],
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

  ArchiveReservationUnitDialog: {
    title: ["Oletko varma että haluat arkistoida varausyksikön {{name}}?"],
    description: [
      "Arkistoimisen jälkeen varausyksikkö ei ole enää näkyvissä Varaamon käsittelypuolella. Mikäli haluat palauttaa varausyksikön, ota yhteyttä järjestelmän pääkäyttäjään.",
    ],
    archive: ["Arkistoi"],
    success: ["Varausyksikkö arkistoitu."],
  },
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
  },
  HeadingMenu: {
    recurringReservations: ["Vakiovuorot"],
    singleReservations: ["Yksittäisvuorot"],
  },
  Navigation: {
    login: ["Kirjaudu sisään", "Login", "Logga in"],
    logging: ["Odota...", "Please hold", "Please hold"],
    logout: ["Kirjaudu ulos", "Logout", "Logga ut"],
    profile: ["Profiili", "Profile", "Profil"],
    languageSelection: ["Kielen valinta", "Language selection", "Språkval"],
    goBack: ["Palaa takaisin"],
    skipToMainContent: [
      "Siirry sivun pääsisältöön",
      "Skip to main content",
      "Hoppa till huvudnavigeringen",
    ],
    expandMenu: ['Laajenna valikko "{{title}}"', 'Expand menu "{{title}}"'],
    shrinkMenu: ['Pienennä valikko "{{title}}"', 'Shrink menu "{{title}}"'],
    noName: ["Ei nimeä"],
  },
  MyUnits: {
    heading: ["Omat toimipisteet"],
    description: [
      "Alla näet kaikki toimipisteet, joihin sinulla on käyttöoikeudet.",
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
      Confirmation: {
        removed: ["Poistettu"],
        overlapping: ["Ei saatavilla"],
        title: ["Toistuva varaus tehty"],
        failedTitle: ["Epäonnistuneet varaukset"],
        successTitle: ["Varaukset"],
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
        failureMessages: {
          "ApolloError: Reservation new begin cannot be in the past": [
            "Aika menneisyydessä",
          ],
          "ApolloError: Overlapping reservations are not allowed.": [
            "Aika ei saatavilla",
          ],
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
    },
  },
  Application: {
    id: ["Hakemustunnus"],
    application_one: ["Hakemus", "Application"],
    application_other: ["Hakemusta", "Applications"],
    applicantType: ["Asiakastyyppi"],
    showAllApplications: ["Näytä kaikki hakemukset"],
    showResolutions: ["Näytä päätöslauselma"],
    recommendedStage: ["Suositeltu vaihe"],
    gotoSplitPreparation: ["Siirry valmistelemaan jakoa"],
    iHaveCheckedApplications: ["Olen tarkistanut hakemukset"],
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
    basket: ["Kori"],
    authenticatedUser: ["Tunnistautunut käyttäjä"],
    unhandledApplications: ["{{count}} hakemusta"],
    unhandledApplicationEvents: ["{{count}} haettua vuoroa"],
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
      basket: ["Kori"],
      resolution: ["Päätös"],
      applicantName: ["Hakijan nimi"],
      purpose: ["Käyttötarkoitus"],
      ageGroup: ["Ikäluokka"],
      recommendations: ["Ehdotukset"],
      additionalInformation: ["Lisätiedot (yksityishenkilö)"],
      userBirthDate: ["Syntymäaika"],
    },
    statuses: {
      draft: ["Luonnos"],
      in_review: ["Tarkastuksessa"],
      review_done: ["Etenee jakoon"],
      allocating: ["Varauksessa"],
      allocated: ["Käsittelemättä"],
      validated: ["Hyväksytty"],
      handled: ["Käsitelty"],
      declined: ["Hylätty"],
      cancelled: ["Peruutettu"],
      approved: ["Päatös tehty"],
      sent: ["Päatös lähetetty"],
    },
    actions: {
      returnAsPartOfAllocation: ["Palauta hakemus osaksi jakoa"],
      declineApplication: ["Hylkää hakemus"],
    },
    saveNotification: {
      in_review: {
        heading: ["Hakemus on merkitty jakoon eteneväksi"],
        body: ["Hakemus on mukana tulevassa tilanjaossa."],
      },
      declined: {
        heading: ["Hakemus on merkitty hylätyksi"],
        body: ["Hakemus ei ole mukana tulevassa tilanjaossa."],
      },
    },
    customerBasicInfo: ["Varaajan perustiedot"],
    contactPersonInformation: ["Yhteyshenkilön tiedot"],
    members: ["Jäsenet"],
    contactPersonFirstName: ["Etunimi"],
    contactPersonLastName: ["Sukunimi"],
    contactPersonEmail: ["Sähköpostiosoite"],
    contactPersonPhoneNumber: ["Puhelinnumero"],
    organisationCoreActivity: ["Yhdistyksen tai seuran ydintoiminta"],

    contactInformation: ["Yhteystiedot"],

    applicantTypes: {
      individual: ["Yksityishenkilö"],
      company: ["Yritys"],
      community: ["Yhdistys, rekisteröimäton"],
      association: ["Yhdistys, rekisteröity"],
    },
    contactPerson: ["Yhteyshenkilö"],
    identificationNumber: ["Y-tunnus"],
    applicationsSelected_one: ["{{count}} hakemus valittu"],
    applicationsSelected_other: ["{{count}} hakemusta valittu"],
    allApplications: ["Kaikki hakemukset"],
    resolution: ["Päätös"],
    graduatedToAllocation: ["Edennyt jakoon esitarkastuksessa"],
    declinedFromAllocation: ["Hylätty esitarkastuksessa"],
    allocatedReservations: ["Myönnetyt vuorot"],
    noAllocatedReservations: ["Ei myönnettyjä vuoroja"],
    downloadResolution: ["Lataa päätös"],
    downloadResolutionHelper: [
      "Toimita päätös asiakkaalle ja merkitse se toimitetuksi alhaalta.",
    ],
    summaryOfAllocatedApplicationEvents: ["Erittely myönnetyistä vuoroista"],
    showAllocationResultsOfApplicant: ["Näytä asiakkaalle tehdyt ehdotukset"],
    markAsResolutionSent: ["Merkitse päätös toimitetuksi"],
    markAsResolutionNotSent: ["Merkitse päätös toimittamattomaksi"],
    showDetailedResultList: ["Näytä yksityiskohtainen vuorolista"],
    space: ["Tila"],
    allocatedForGroupX: ["Myönnetty ryhmälle {{group}}"],
    declinedReservations: [
      "Poikkeukset, jolloin vakiovuoro ei ole käytettävissä",
    ],
    gotoLink: ["Tarkastele hakemusta"],
  },
  TimeSelector: {
    primary: ["Ensisijainen toive"],
    secondary: ["Muu toive"],
  },
  ApplicationRound: {
    titleAllRecurringApplicationRounds: ["Kaikki vakiovuorojen hakukierrokset"],
    browseAllApplicationRounds: ["Selaa kaikkia"],
    noUpcoming: ["Ei tulossa olevia hakukierroksia."],
    statuses: {
      upcoming: ["Tulossa"],
      open: ["Haku avoinna"],
      review: ["Tarkastettavana"],
      handling: ["Käsittelyssä"],
      handled: ["Käsitelty"],
      sent: ["Lähetetty"],
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
    allocate: ["Jaa vuoroja"],
    applicationCount: ["hakemusta"],
    reservationUnitCount: ["varausyksikköä"],
    applicants: ["Hakukierroksen hakijat"],
    listApprovalTitle: ["Hyväksynnät"],
    listHandlingTitle: ["Käsittely"],
    pastRounds: ["Menneet"],
    roundsInProcessing: ["Käsittelyssä"],
    roundsOpenForApplication: ["Haku avoinna"],
    futureRounds: ["Tulevat"],
    showClientApplication: ["Näytä asiakkaan koko hakemus"],
    infoGivenByCustomer: ["Asiakkaan ilmoittamat tiedot"],
    recommendedAid: ["Haetut vuorot"],
    appliedReservations: ["Haetut vuorot"],
    applications: ["Hakemukset"],
    appliedReservationUnit: ["Tarjottu tila"],
    totalReservationTime: ["Kokonaiskesto"],
    recommendedSpaceAid: ["Tilankäyttönä suositeltava avustus"],
    recommendations: {
      in_review: [
        "Tarkasta lista ja neuvottele esihenkilösi kanssa mahdollisista hylkäyksistä",
      ],
      review_done: ["Käynnistä ehdotusten luominen"],
      allocated: [
        "Hyväksy tai hylkää ehdotukset ja uudelleenkäynnistä jako, kunnes kaikki ehdotukset on käsitelty.",
      ],
      approvalPreparation: [
        "Lähetä koko käsittelyn lopputulos esihenkilöllesi hyväksyttäväksi.",
      ],
    },
    roundCriteria: ["Kierroksen kriteerit"],
    basket: ["Kori"],
    allocatedBasket: ["Jaettava kori"],
    allocatedBasketHelper: [
      "Korit ja niiden järjestys on ennalta määritetty. Korin jakaminen tuottaa ehdotuksen, jonka voit hakemus kerrallaan tarkistaa. Jos olet tehnyt hylkäyksiä, käynnistä kori uudelleen ennen seuraavaan koriin siirtymistä.",
    ],
    navigateBackToReview: ["Palaa esitarkistusvaiheeseen"],
    navigateToApprovalPreparation: [
      "Siirry esihenkilöhyväksynnän valmisteluun",
    ],
    navigateBackToHandling: ["Palaa ehdotusten käsittelyyn"],
    allocateAction: ["Käynnistä jako"],
    deliverAction: ["Toimita"],
    sendForApproval: ["Toimita esihenkilölle"],
    allocationNotificationHeading: [
      "Näet käsitelävät ehdotukset täällä, kun olet käynnistänyt jaon Jaa-painikkeesta.",
    ],
    allocationNotificationBody: [
      "Kone tekee ehdotukset ennalta määritellyille ryhmille priorisointijärjestyksessä.\nNäet kierroksen kriteerit näkymän ylälaidasta.",
    ],
    allocateLabel: [
      "Huomaathan, että et voi enää palata esitarkistusvaiheeseen, jos olet käynnistänyt ehdotusten jakamisen.",
    ],
    allocationDialogHeading: ["Laaditaan ehdotuksia"],
    allocationDialogBody: [
      "Odotathan hetken, tämä voi viedä joitakin kymmeniä sekunteja tai minuutteja.",
    ],
    suffixUnhandledSuggestions: ["käsittelemätöntä ehdotusta"],
    sentForApprovalDialogHeader: [
      "Toimitetaanko alustava tilanjakoehdotus hyväksyttäväksi?",
    ],
    sentForApprovalDialogBody: [
      "Esihenkilö saa listan hyväksyttäväkseen, jonka jälkeen tarjoukset tai päätökset toimitetaan asiakkaalle.",
    ],
    sentForApprovalNotificationHeader: [
      "Vuorojakopaatös on toimitettu tarkistettavaksi",
    ],
    sentForApprovalNotificationBody: [
      "Voit katsella alta hyväksyntää odottavaa päätöslauselmaa.",
    ],
    approvedNotificationHeader: ["Olet hyväskynyt vuorojakopäätöksen"],
    approvalCancelledNotificationHeader: [
      "Olet palauttanut listan käsittelyyn",
    ],
    approvalCancelledNotificationBody: ["Muutos näkyy käsittelijöille."],
    unallocatedApplications: [
      "Hakemuksia, joille ei voitu tehdä lainkaan ehdotuksia",
    ],
    schedulesToBeGranted: ["Myönnettäviä vuoroja"],
    attachedReservationUnits: ["Liitettyä varausyksikköä"],
    inUniqueReservationUnits: ["Eri varausyksikössä"],
    orphanApplications: ["Ehdotuksitta jääneet"],
    handledApplications: ["Käsitellyt ehdotukset"],
    amountReserved: ["Kapasiteetista varattu"],
    amountReservedOfSpace: ["Tilan kapasiteetista varattu"],
    amountReservedOfSpaceSubtext: ["Kierrokselle osoitetusta tilan maksimista"],
    percentageOfCapacity: ["{{percentage}} % kapasiteetista"],
    cancelSupervisorApproval: ["Palauta lista hyväksymättä käsittelijälle"],
    approveAndSendToCustomers: ["Hyväksy ja toimita päätökset asiakkaille"],
    cancelSupervisorApprovalDialogHeader: [
      "Oletko varma, että haluat palauttaa listan käsittelyyn?",
    ],
    cancelSupervisorApprovalDialogBody: [
      "Lista poistuu tällöin näkymästäsi, etkä voi nähdä tai hyväksyä listaa ennen kuin käsittelijät ovat pyytäneet hyväksyntää sinulta uudelleen.",
    ],
    approveRecommendationsDialogHeader: [
      "Hyväksytäänkö ehdotus kierroksen vuorojaosta?",
    ],
    approveRecommendationsDialogBody: [
      "Kaikkien toimipisteiden asiakkaat saavat myöntöpäätökset heti, kun hyväksyntä on tehty.",
    ],
    returnListToHandling: ["Palauta lista käsittelyyn"],
    listHandlingIngressEmpty: [
      "Vastuullasi ei ole tällä hetkellä ole lainkaan tulevia tai käsittelyvaiheessa olevia hakukierroksia.",
    ],
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
    allRecurringApplicationRounds: ["Vakiovuorojen kaikki hakukierrokset"],
    searchAndUsageTimeRanges: ["Haku- ja käyttöajanjaksot"],
    applicationPeriodTitle: [
      "Hakukauden alkamis- ja päätymisajankohta asiakkaille",
    ],
    reservationPeriodTitle: [
      "Hakuun kuuluvien varausyksiköiden varsinainen käyttöajanjakso",
    ],
    summaryOfCriteriaAndBaskets: ["Kriteerien ja korien yhteenveto"],
    preferredAllocationGroups: ["Tilan saajina suositut ryhmät"],
    usedReservationUnits: ["Kierrokselle liitetyt varausyksiköt"],
    approvalListTitle: ["Hyväksyntäjonosi"],
    approvalListSubtitle: [
      "Näet täällä hyväksyntääsi odottavat ja hyväksytyt ehdotukset hakukierrosten tarjous- tai myöntöpäätöksistä.",
    ],
    noApprovalRights: [
      "Sinulla ei ole riittäviä oikeuksia hakukierrosten hyväksyntään.",
    ],
    waitingForApproval: ["Odottaa hyväksyntää"],
    noPendingApprovals: ["Ei hyväksyntää odottavia hakukierroksia."],
    approvalDoneListTitle: ["Hyväksytyt"],
    noPendingDoneApprovals: ["Ei hyväksyttyjä hakukierroksia."],
    resolutionNumber: ["Päätösnumero #{{no}}"],
    resolutionDate: ["Päätös tehty {{date}}"],
    notificationResolutionDoneHeading: ["Esihenkilöhyväksyntä ja päätös tehty"],
    notificationResolutionDoneBody: [
      "Voit hallita asiakkaille lähetettäviä päätöksiä täältä.",
    ],
    noApplications: ["Hakukierroksella ei ole vielä hakemuksia."],
    noApplicationEvents: ["Hakukierroksella ei ole vielä haettuja vuoroja."],
    noFilteredApplications: [
      "Valituilla suodattimilla ei löytynyt yhtään hakemusta. Valitse suodattimia uudelleen tai tyhjennä kaikki suodattimet.",
    ],
    noFilteredApplicationEvents: [
      "Valituilla suodattimilla ei löytynyt yhtään haettua vuoroa. Valitse suodattimia uudelleen tai tyhjennä kaikki suodattimet.",
    ],
  },
  Basket: {
    purpose: ["Tuettava toiminta"],
    customerType: ["Asiakastyypin täytyy olla"],
    ageGroup: ["Vuoron käyttäjätyypin täytyy olla"],
    homeCity: ["Organisaation kotipaikkakunnan täytyy olla"],
  },
  ApplicationEvent: {
    name: ["Vakiovuoron nimi"],
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
    priority: {
      300: ["Ensisijaiset aikatoiveet"],
      200: ["Muut aikatoiveet"],
      all: ["Kaikki"],
    },
    headings: {
      id: ["Id"],
      customer: ["Hakija"],
      name: ["Vuoro"],
      unit: ["Toimipiste"],
      stats: ["Haettu"],
      phase: ["Vaihe"],
    },
  },
  Organisation: {
    activeParticipants: ["Aktiiviharrastajat"],
    extraInformation: ["Lisätiedot toiminnasta"],
  },
  Recommendation: {
    linkToOtherRecommendations: ["Näytä asiakkaan muut ehdotukset"],
    summary: ["Ehdotuksen tiivistelmä"],
    recommendedSlot: ["Asiakkaalle ehdotettava jakso"],
    thisPartsTerms: ["Tämän osan käyttöehdot"],
    actionDecline: ["Hylkää vuoro ja rajoita viikkomäärää"],
    actionApprove: ["Hyväksy ehdotettu vuoro"],
    actionIgnoreReservationUnit: ["Hylkää tilaehdotus"],
    actionMassDecline: ["Hylkää vuorot ja rajoita viikkomäärää"],
    actionMassApprove: ["Hyväksy ehdotetut vuorot"],
    actionMassIgnoreReservationUnit: ["Hylkää ehdotetut vuorot tästä tilasta"],
    actionHelperText: [
      "Jos hylkäät tämän vuoron, ryhmältä vähennetään yksi viikkovuorotoive. Muille vuorotoiveille, joita ei ole käsitelty, pyritään löytämään vuoro. Jos hylkäät ryhmän tästä tilasta, pyritään ryhmälle löytämään korvaava tila. Uutta tilaa tarjotaan vain, jos hakijan toiveiden mukaisia vapaita aikoja on valituista tiloista jakamatta. Vuoron hylkäyksen ja kiellon tarjota tätä tilaa voi purkaa tarvittaessa myöhemmin. Hyväksyminen ei lähetä myöntöpäätöstä välittömästi asiakkaalle, vaan vasta esihenkilön hyväksyessä kaikki myöntöpäätökset kerralla.",
    ],
    actionReturnAsPartOfAllocation: [
      "Palauta viikkovuorotoive osaksi käsittelyä",
    ],
    actionReturnAsPartOfAllocationHelper: [
      "Palautus ei tarkoita, että ryhmälle on mahdollista enää myöntää juuri tätä vuoroa. Viikkovuorotoive otetaan kuitenkin huomioon seuraavan uudelleenkäynnistyksen aikana.",
    ],
    actionRevertIgnoreReservationUnit: [
      "Pura vuoroltatilakielto, joka kohdistuu tähän tilaan",
    ],
    actionRevertIgnoreReservationUnitAbrv: ["Pura tilakielto"],
    actionRevertIgnoreReservationUnitHelper: [
      "Purkaminen ei tarkoita, että ryhmälle on mahdollista enää myöntää juuri tätä vuoroa tähän tilaan. Vuoron tilatoive otetaan kuitenkin huomioon seuraavan uudelleenkäynnistyksen aikana.",
    ],
    confirmationRevertIgnoreReservationUnitHeader: [
      "Puretaanko vuoron tilakielto tämän tilan osalta?",
    ],
    confirmationRevertIgnoreReservationUnitBody: [
      "Et näe tätä ehdotusta enää palauttamisen jälkeen. Purkaminen ei tarkoita, että vuorolle on mahdollista enää myöntää juuri tätä vuoroa tähän tilaan. Vuoron tilatoive otetaan kuitenkin huomioon seuraavan uudelleenkäynnistyksen aikana.",
    ],
    actionRevertToUnhandled: ["Palauta ehdotus käsittelemättömäksi"],
    labelAgeGroup: ["Käyttäjien ikäryhmä"],
    labelAppliedReservations: ["Vuoroja"],
    labelReservationUnitRank: ["Tarjottu tila toivesijalla {{rank}}"],
    actionMassActionSubmit: ["Massakäsittele valitut"],
    recommendationCount_one: ["{{count}} ehdotus tehty"],
    recommendationCount_other: ["{{count}} ehdotusta tehty"],
    showOriginalApplication: ["Näytä alkuperäinen hakemus"],
    headings: {
      applicationEventName: ["Ryhmä"],
      status: ["Ehdotuksen status"],
      part: ["Osa"],
      recommendationCount: ["Vuoroja (kpl/h)"],
      spaceName: ["Tilan nimi"],
      resolution: ["Päätös"],
      reservationUnit: ["Toimipiste"],
      basket: ["Kori"],
      purpose: ["Toimintatyyppi"],
    },
    statuses: {
      approved: ["Päätös tehty"],
      created: ["Käsittelemättä"],
      validated: ["Ehdotus hyväksytty"],
      declined: ["Ehdotus hylätty"],
      ignored: ["Tilakielto asetettu"],
    },
    applicantStatuses: {
      handling: ["Käsittely kesken"],
      validated: ["Odottaa esihenkilöhyväksyntää"],
      approved: ["Päätös tehty"],
      sent: ["Päätös lähetetty"],
    },
    approveSuccessHeading: ["Ehdotus hyväksytty onnistuneesti"],
    approveSuccessBody: [
      "Hyväksytyt ehdotukset siirtyvät esihenkilölle hyväksyttäväksi.",
    ],
    revertToUnhandledSuccessHeading: ["Ehdotus palautettu käsittelemättömäksi"],
    revertToUnhandledSuccessBody: [
      "Voit käsitellä ehdotuksen tavalliseen tapaan.",
    ],
    declineSuccessHeading: ["Vuoro hylätty"],
    declineSuccessBody: [
      "Hakijalta on vähennetty yksi viikkovuorotoive. Voit tarvittaessa purkaa hylkäyksen.",
    ],
    confirmationRevertDeclineRecomendationHeader: [
      "Palautetaanko hylätty vuoro-osuus takaisin osaksi käsittelyä?",
    ],
    confirmationRevertDeclineRecomendationBody: [
      "Et näe tätä ehdotusta enää palauttamisen jälkeen. Palautus ei tarkoita, että osuudelle on mahdollista enää myöntää juuri tätä vuoroa.  Palautettu viikkovuorotoive otetaan kuitenkin huomioon seuraavan uudelleenkäynnistyksen aikana.",
    ],
    actionRevertRejectionAbrv: ["Palauta osuus"],
    banSuccessHeading: ["Tilakielto asetettu"],
    banSuccessBody: [
      "Valittua vuoroa ja ryhmän tulevia vuoroja ei tarjota enää tähän tilaan. Voit tarvittaessa purkaa tähän tilaan kohdistuvan kiellon.",
    ],
    scheduleDuration: ["Vuoron kesto {{duration}}"],
    noRecommendations: ["Ei ehdotuksia"],
  },
  Reservation: {
    showSummaryOfReservationsByReservationUnit: [
      "Näytä kooste tilaan myönnetyistä vuoroista",
    ],
    showSummaryOfReservations: ["Näytä tiivistelmä vuoroista"],
    showReservations: ["Näytä tilan täydellinen vuoroista"],
    allocatedReservationsForReservationUnit: ["Myönnetyt käyttövuorot tilaan"],
    headings: {
      applicant: ["Hakija"],
      schedule: ["Vuoro"],
    },
    noReservations: ["Ei varauksia"],
    generatingDocument: ["Dokumenttia luodaan"],
    errorGeneratingDocument: ["Dokumenttia ei pystytty luomaan"],
    EditTime: {
      title: ["Muokkaa varauksen aikaa"],
    },
    EditPage: {
      title: ["Muokkaa varauksen tietoja"],
      "Reservation failed to load": ["Varausta {{ pk }} ei pystytty latamaan"],
      "Reservation unit failed to load": ["Varausyksikköä ei löytynyt"],
      save: ["Tallenna"],
      saveSuccess: ["Varauksen muutokset tallennettu"],
      saveError: ["Varauksen muutos epäonnistui"],
      pageThrewError: ["Virhe: varausta ei voi muokata"],
    },
  },
  ReservationUnit: {
    reservationStatus: ["Varaustilanne"],
    purposeCount_one: ["{{count}} käyttötarkoitus"],
    purposeCount_other: ["{{count}} käyttötarkoitusta"],
    downloadSpaceCalendar: ["Lataa tilan kalenterimerkinnät (.ics)"],
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
  Applicant: {
    inAllocation: ["Mukana jaossa"],
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
    description: ["Toimipisteen tietoja hallitaan"],
    descriptionLinkLabel: ["toimipisterekisterin kautta"],
    descriptionLinkHref: ["https://asiointi.hel.fi/tprperhe/etusivu/"],
    filters: {
      nameLabel: ["Toimipisteen nimi"],
      serviceSector: ["Palvelu"],
      serviceSectorTag: ["Palvelu: {{value}}"],
    },
    headings: {
      name: ["Toimipisteen nimi"],
      serviceSector: ["Palvelu"],
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
    noOpeningHoursTitle: ["Toimipisteelle ei ole määritetty aukioloaikoja"],
    maintainOpeningHours: [
      "Siirry päivittämään toimipisteesi tiedot Toimipisterekisterin kautta.",
    ],
    noOpeningHours: [
      "Toimipisteellä täytyy olla aukioloajat, jotka ohjaavat käytön suunnittelua.",
    ],
    reservationUnitTitle: ["Varausyksiköt"],
    reservationUnitReadMore: ["Lue lisää varausyksiköistä"],
    hierarchyReadMore: ["Lue lisää tilojen hierarkiasta"],
    reservationUnitCreate: ["Luo uusi varausyksikkö"],
    noReservationUnitsTitle: ["Ei vielä luotuja varausyksiköitä."],
    noReservationUnitsInfo: [
      "Tarkista ennen varausyksiköiden luontia, että olet luonut toimipisteelle aukioloajat sekä tarvittavat tilat ja resurssit.",
    ],
    address: ["Osoite"],
    noAddress: ["Osoite puuttuu"],
    location: ["Toimipisteen sijainti"],
    linkToUnitPage: ["Siirry"],
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
    namePlaceholder: ["Tilan nimi {{language}}"],
    touLabel: ["Tilan ohjeet {{lang}}"],
    termsOfUseHelperText: ["Tilan käyttöehdot..."],
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
    endTime: ["Lopetusaika"],
    // dialog specific
    title: ["Varaa {{reservationUnit}}"],
    accept: ["Varaa"],
    saveFailed: ["Tallennus ei onnistunut. {{error}}"],
    saveSuccess: ["Varaus tehty kohteeseen {{reservationUnit}}"],
  },
  ReservationUnits: {
    reservationUnitListHeading: ["Varausyksiköt"],
    reservationUnitListDescription: [
      "Alla näet kaikki luodut varausyksiköt, jotka sinulla on oikeus nähdä. Uusia varausyksiköitä luodaan toimipisteisiin tai alueisiin liittyen.",
    ],
    noFilteredReservationUnits: [
      "Valituilla suodattimilla ei löytynyt yhtään varausyksikköä. Valitse suodattimia uudelleen tai tyhjennä kaikki suodattimet.",
    ],
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
    textSearchLabel: ["Varausyksikön nimi"],
    textSearchPlaceHolder: ["Hae"],
    typeLabel: ["Tilan tyyppi"],
    typePlaceHolder: ["Suodata"],
    unitLabel: ["Toimipiste"],
    unitPlaceHolder: ["Suodata"],
    maxPersonsLabel: ["Henkilömäärä"],
    maxPersonsGtePlaceHolder: ["Vähintään"],
    maxPersonsLtePlaceHolder: ["Enintään"],
    surfaceAreaLabel: ["Pinta-ala (m²)"],
    stateLabel: ["Tila"],
    surfaceAreaLtePlaceHolder: ["Enintään"],
    surfaceAreaGtePlaceHolder: ["Vähintään"],
    notANumber: ["Ei ole numero"],
    clear: ["Tyhjennä"],
    moreFilters: ["Näytä lisää suodattimia"],
    lessFilters: ["Näytä vähemmän suodattimia"],
    filters: {
      maxPersonsGteTag: ["Vähintään {{value}} hlö."],
      maxPersonsLteTag: ["Enintään {{value}} hlö."],
      surfaceAreaGteTag: ["Vähintään {{value}} m²."],
      surfaceAreaLteTag: ["Enintään {{value}} m²."],
    },
  },
  ReservationStateFilter: {
    label: ["Käsittelytila"],
    state: {
      CANCELLED: "",
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
  },
  ReservationUnitList: {
    typeFilter: ["Tyyppi"],
    statusFilter: ["Tila"],
  },
  ReservationUnitEditor: {
    label: {
      reservationKind: ["Varaustyyppi"],
      nameFi: ["Varausyksikön nimi fi"],
      nameSv: ["Varausyksikön nimi sv"],
      nameEn: ["Varausyksikön nimi en"],
      spacePks: ["Tilat"],
      resourcePks: ["Resurssit"],
      surfaceArea: ["Pinta-ala (m2)"],
      maxPersons: ["Henkilömäärä enintään"],
      minPersons: ["Henkilömäärä vähintään"],
      reservationUnitTypePk: ["Tilatyyppi"],
      descriptionFi: ["Kuvaus fi"],
      descriptionSv: ["Kuvaus sv"],
      descriptionEn: ["Kuvaus en"],
      minReservationDuration: ["Varauksen kesto vähintään"],
      maxReservationDuration: ["Varauksen kesto enintään"],
      reservationStartInterval: ["Varauksen aloitukset"],
      reservationsMinDaysBefore: ["Varattavissa viimeistään (vrk ennen)"],
      reservationsMaxDaysBefore: ["Varattavissa alkaen"],
      lowestPrice: ["Alin hinta (sis. alv)"],
      lowestPriceNet: ["Alin hinta (alviton)"],
      highestPrice: ["Ylin hinta (sis. alv)"],
      highestPriceNet: ["Ylin hinta (alviton)"],
      canApplyFreeOfCharge: [
        "Asiakas voi pyytää hinnan alennusta tai maksuttomuutta",
      ],
      pricings: ["Hinnoittelu"],
      metadataSetPk: ["Varauslomake"],
      termsOfUseFi: ["Varausyksikkökohtaiset lisätiedot fi"],
      termsOfUseSv: ["Varausyksikkökohtaiset lisätiedot sv"],
      termsOfUseEn: ["Varausyksikkökohtaiset lisätiedot en"],
      serviceSpecificTermsPk: ["Palvelukohtaiset täydentävät ehdot"],
      cancellationTermsPk: ["Peruutusehdot"],
      paymentTermsPk: ["Maksuehdot"],
      paymentTypes: ["Maksutapa"],
      priceUnit: ["Hinnan yksikkö"],
      taxPercentagePk: ["Hinnan alv%"],
      instructionsFi: ["Varausvahvistuksen lisäohjeteksti suomeksi"],
      instructionsSv: ["Varausvahvistuksen lisäohjeteksti ruotsiksi"],
      instructionsEn: ["Varausvahvistuksen lisäohjeteksti englanniksi"],
      reservationKinds: {
        DIRECT_AND_SEASON: ["Yksittäis- ja kausivaraus"],
        DIRECT: ["Vain yksittäisvaraus"],
        SEASON: ["Vain kausivaraus"],
      },
      pricingType: ["Varausyksikön maksullisuus"],
      pricingTermsPk: ["Hinnoitteluperiaate"],
      pricingTypes: {
        PAID: ["Maksullinen"],
        FREE: ["Maksuton"],
      },
      priceChange: ["Hintaan on tulossa muutos"],
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
      spacePks: [
        `Varausyksikkö voi koostua yhdestä tai useammasta tilasta. Jokainen resurssi tai laite tarvitsee oman tilansa.
      Huomioi tilahierarkia ja että tila ei voi koskaan olla samanaikaisesti varattuna kuin kerran.
      Tilahierarkiaa pääset muokkaamaan toimipisteen sivulla.`,
      ],
      resourcePks: [
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
      reservationUnitTypePk: [
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
      images: [
        `Liitä vähintään kolme kuvaa. Kuvien tulisi olla todenmukaisia ja hyvälaatuisia.
      Suositus:
      lisää ensisijaisesti vaakatasossa kuvattuja kuvia, ei kuitenkaan panoramoja. jpeg/jpg ja png, max 1 M
      Kuvissa näkyviltä ihmisiltä tulee olla kuvauslupa. Kuvissa ei saa näkyä turvakameroita.`,
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
      suositus:
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
      metadataSetPk: [
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
      pricingTermsPk: [
        `Valitse listalta palvelussasi noudatettavat hinnoittelu- ja maksuttomuusperiaateet.
      Asiakkaan hinnanalennuspyyntö perustuu näihin periaatteisiin.
      Ota tarvittaessa yhteys ylläpitoon.`,
      ],
      serviceSpecificTermsPk: [
        `Helsingin kaupungin tilojen ja laitteiden varausehdot liitetään kaikkiin varausyksiköihin automaattisesti.
      Täydennä ehtoja tarvittaessa palvelusi ehdoilla.`,
      ],
      paymentTermsPk: [
        `Jos varausyksikkösi on maksullinen valitse maksuehdot.`,
      ],
      cancellationTermsPk: [
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
    cancelledExpandLink: ["Täydennä peruutusviestiä"],
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
    descriptionPlaceholder: ["Kuvaus {{language}}"],
    spacesPlaceholder: ["Liitä tarvittavat tilat"],
    equipmentsLabel: ["Varustelu"],
    equipmentsPlaceholder: ["Valitse varusteet"],
    reservationUnitTypePlaceholder: ["Valitse tilatyyppi"],
    reservationUnitTypeHelperText: ["Valitse tilaa parhaiten kuvaava tyyppi"],
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
    errorNoResources: ["Toimipisteeseen ei ole liitetty yhtään resurssia"],
    errorNoSpaces: ["Toimipisteeseen ei ole liitetty yhtään tilaa"],
    errorDataHeading: ["Datavirhe"],
    errorParamsNotAvailable: [
      "Parametridataa puuttuu, osa lomakkeesta voi olla epäkunnossa",
    ],
    durationHours: ["{{hours}} tuntia"],
    tosPlaceholder: ["Ohjeteksti {{language}}"],
    paymentTermsPlaceholder: ["Valitse"],
    paymentTermsHelperText: ["Valitse tästä"],
    cancellationTermsPlaceholder: ["Valitse"],
    cancellationTermsHelperText: ["Valitse tästä"],
    serviceSpecificTermsPlaceholder: ["Valitse"],
    serviceSpecificTermsHelperText: ["Valitse tästä"],
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
    archive: ["Arkistoi"],
    save: ["Tallenna tiedot"],
    preview: ["Esikatsele"],
    saving: ["Tallennetaan..."],
    saved: ["Tiedot tallennettu."],
    saveAsDraft: ["Tallenna luonnos"],
    reservationUnitCreatedNotification: ["Varausyksikkö {{name}} luotu"],
    reservationUnitUpdatedNotification: [
      "Varausyksikön muutokset tallennettu.",
    ],
    saveFailed: [
      "Valitettavasti varausyksikön tallennus / julkaisu ei juuri nyt onnistu, kokeile myöhemmin uudelleen. ({{error}})",
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
    bufferTimeBefore: ["Aseta ennen vuoroa tauko"],
    bufferTimeBeforeDuration: ["Tauon kesto"],
    bufferTimeAfter: ["Aseta vuoron jälkeen tauko"],
    bufferTimeAfterDuration: ["Tauon kesto"],
    scheduledPublishing: ["Ajastettu julkaisu"],
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
    maxReservationsPerUser: ["Varauksia enintään per käyttäjä"],
  },
  ImageEditor: {
    imageType: ["Kuvan tyyppi"],
    label: ["Varausyksikön kuvat"],
    buttonLabel: ["Valitse ja lataa kuva"],
    errorTitle: ["Tapahtui virhe"],
    errorLoadingImages: ["Kuvia ei saatu haettua"],
    addImage: ["Lisää kuva"],
    deleteImage: ["poista"],
    mainImage: ["Pääkuva"],
    useAsMainImage: ["Käytä pääkuvana"],
    imageDeletedTitle: ["Kuva poistettiin"],
    imageDeleted: [""],
    errorDeletingImage: ["Kuvan poistaminen ei onnistunut"],
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
  reservationStartInterval: {
    INTERVAL_15_MINS: ["15 min välein"],
    INTERVAL_30_MINS: ["30 min välein"],
    INTERVAL_60_MINS: ["1 tunnin välein"],
    INTERVAL_90_MINS: ["1,5 tunnin välein"],
  },
  ResourceModal: {
    modalTitle: ["Luo uusi resurssi tilalle"],
    info: [
      "Voit luoda kerralla yhden tilan resurssin. Niitä voivat olla esim. laitteet tai tarvikkeet.",
    ],
    selectSpace: ["Valitse tila"],
    namePlaceholder: ["Resurssin nimi  {{language}}"],
    descriptionLabel: ["Resurssin kuvaus {{lang}}"],
    descriptionPlaceholder: ["Kuvaile resurssia {{language}}"],
    cancel: ["Palaa tallentamatta tietoja"],
    save: ["Tallenna"],
    saveError: ["Tietojen tallennus epäonnistui."],
  },
  ResourceTable: {
    headings: {
      name: ["Nimi"],
      unitName: ["Toimipiste"],
    },
    noDistrict: ["(Ei aluetta)"],
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
  RequestedReservations: {
    heading: {
      unit: ["Toimipiste"],
      applicant: ["Tilan käyttäjä"],
      name: ["Varauksen nimi"],
      price: ["Hinta"],
      paymentStatus: ["Maksutila"],
      state: ["Varauksen tila"],
    },
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
  Reservations: {
    reservationListHeading: ["Varaustoiveet"],
    noFilteredReservations: [
      "Valituilla suodattimilla ei löytynyt yhtään varausta. Valitse suodattimia uudelleen tai tyhjennä kaikki suodattimet.",
    ],
    reservationListDescription: [
      "Alla näet kaikki käsiteltävät varaustoiveet.",
    ],
    allReservationListHeading: ["Kaikki varaukset"],
    allReservationListDescription: [
      "Alla näet kaikki tulevat varaukset ja käsittelemättömät varaustoiveet. Voit hakea tai suodattaa varauksia. Klikkaa varauksen nimeä nähdäksesi tarkemmat tiedot varauksesta.",
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
  },
  ReservationsListButton: {
    changeTime: ["Muuta aikaa"],
    showInCalendar: ["Näytä kalenterissa"],
  },

  ReservationsSearch: {
    textSearch: ["Hae varausta"],
    textSearchPlaceholder: ["Hae nimellä tai idllä"],
    minPrice: ["Hinta vähintään"],
    maxPrice: ["Hinta enintään"],
    begin: ["Alkaen"],
    end: ["Asti"],
    paymentStatus: ["Maksutila"],
    filters: {
      minPriceTag: ["Hinta vähintään: {{value}}"],
      maxPriceTag: ["Hinta enintään: {{value}}"],
      beginTag: ["Alkaen: {{value}}"],
      endTag: ["Asti: {{value}}"],
    },
  },

  ApprovalButtons: {
    edit: ["Muuta tietoja"],
    editTime: ["Muuta aikaa"],
    recurring: {
      rejectAllButton: ["Hylkää kaikki"],
      DenyDialog: {
        title: ["Hylkää kaikki"],
      },
    },
  },
  RequestedReservation: {
    errorFetchingData: ["Tietoja ei saatu haettua"],
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
    purpose: ["Käyttötarkoitus"],
    numPersons: ["Osallistujamäärä"],
    ageGroup: ["Ikäryhmä"],
    id: ["Varaustunnus"],
    homeCity: ["Kotipaikka"],
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
    applyingForFreeOfCharge: ["Hakee subventiota"],
    freeOfChargeReason: ["Subvention perustelu"],
    paymentState: ["Maksutila"],
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
      handlingDetails: ["Kommentti"],
      handlingDetailsHelper: ["Näytetään vain henkilökunnalle"],
      errorSaving: ["Hylkäys epäonnistui"],
      refund: {
        notAllowed: ["Palautus ei mahdollinen"],
        alreadyRefunded: ["Jo palautettu"],
        radioLabel: ["Palauta rahat"],
        returnChoice: ["Palauta maksu {{ price }} €"],
        noReturnChoice: ["Ei palautusta"],
        mutationSuccess: ["Varaus peruttu ja rahat palautettu."],
        mutationFailure: [
          "Varaus peruttu, mutta rahojen palautus epäonnistui.",
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
      handlingDetails: ["Henkilökunnan kommentti"],
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
      errorSaving: ["Palauttaminen ei onnistunut"],
    },
    noName: ["-"],
  },
  Allocation: {
    allocationTitle: ["Vuorojen jako"],
    applicants: ["Hakijat"],
    selectApplicant: [
      "Valitse hakija nähdäksesi hakijan toivomat ajat kalenterissa.",
    ],
    otherApplicants: ["Muut hakijat"],
    allocatedApplicants: ["Vuoron saaneet"],
    declinedApplicants: ["Hylätyt"],
    openApplication: ["Avaa hakemus"],
    ageGroup: ["Ikäryhmä"],
    otherReservationUnits: ["Muut toivotut tilat"],
    changeTime: ["Muuta aikaa"],
    startingTime: ["Aloitusaika"],
    endindTime: ["Päättymisaika"],
    primaryItems: ["Ensisijaiset"],
    noPrimaryItems: ["Ei ensisijaisia aikatoiveita."],
    secondaryItems: ["Muut"],
    noRequestedTimes: ["Ei aikatoiveita."],
    applicationsWeek: ["Vuorotoive / viikko"],
    primaryTimes: ["Ensisijaiset ajat"],
    secondaryTimes: ["Muut ajat"],
    acceptSlot: ["Jaa {{duration}} vuoro"],
    acceptingSlot: ["Jaetaan vuoroa.."],
    acceptingSuccess: ['Vuoro varaukselle "{{applicationEvent}}" jaettu.'],
    filters: {
      unit: ["Toimipiste"],
      selectUnits: ["Valitse toimipisteet"],
      schedules: ["Aikatoive"],
      selectSchedules: ["Valitse aikatoive"],
      reservationUnitApplication: ["Tilatoive"],
      reservationUnitOrder: ["Tilatoivejärjestys"],
      selectReservationUnitOrder: ["Valitse tilatoivejärjestys"],
    },
    errors: {
      acceptingFailed: [
        'Vuoron jakaminen varaukselle "{{applicationEvent}}" epäonnistui. Tarkista, ettei kyseiselle ajalle ole jo jaettu vuoroa, tai kokeile myöhemmin uudelleen.',
      ],
      noPermission: ["Sinulla ei ole riittäviä oikeuksia jakaa vuoroa."],
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
      // eslint-disable-next-line no-param-reassign
      target.fi.translation[key] = valFi;
      // eslint-disable-next-line no-param-reassign
      target.en.translation[key] = valEn || `${valFi} en`;
      // eslint-disable-next-line no-param-reassign
      target.sv.translation[key] = valSv || `${valFi} sv`;
    }
  });
  return target;
};

export default traverse(translations);
