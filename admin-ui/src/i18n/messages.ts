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
  common: {
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
    cancel: ["Kumoa"],
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
    agesSuffix: ["{{range}}-vuotiaat"],
    resetFilters: ["Tyhjennä suodattimet"],
    apply: ["Käytä"],
    volumeUnit: [" kpl", " ", " "],
    personUnit: ["{{count}} henkilö"],
    personUnit_plural: ["{{count}} henkeä"],
    hoursUnit: ["{{count}} h", "{{count}} h", "{{count}} h"],
    hoursUnitLong: ["{{count}} tunti", "{{count}} hour", "{{count}} timme"],
    hoursUnitLong_plural: [
      "{{count}} tuntia",
      "{{count}} hours",
      "{{count}} timmar",
    ],
    minutesUnit: ["{{count}} min", "{{count}} min", "{{count}} min"],
    minutesUnitLong: [
      "{{count}} minuutti",
      "{{count}} minute",
      "{{count}} minut",
    ],
    minutesUnitLong_plural: [
      "{{count}} minuuttia",
      "{{count}} minutes",
      "{{count}} minuter",
    ],
    streetAddress: ["Katuosoite"],
    postalNumber: ["Postinumero"],
    postalDistrict: ["Postitoimipaikka"],
    emailAddress: ["Sähköpostiosoite"],
    billingAddress: ["Laskutusosoite"],
    homeCity: ["Kotipaikkakunta"],
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
  },
  MainLander: {
    ingress: [
      "Voit käsitellä palvelussa vastuualueellesi osoitettuja Helsingin kaupungin tilavaraushakemuksia tai hallita varattaviksi asetettavien tilojen tai resurssien tietoja.",
    ],
    body: [
      "Palvelua pilotoidaan nuorison vakiovuorovarauksilla vuoden 2021 aikana. Palveluun voivat toistaiseksi kirjautua vain ne Helsingin kaupungin työntekijät, jotka edustavat pilottikohdetta.",
    ],
  },
  User: {
    welcome: ["Tervetuloa"],
  },
  MainMenu: {
    applications: ["Hakemukset"],
    handling: ["Käsittely"],
    approvals: ["Hyväksynnät"],
    clients: ["Asiakkaat"],
    archive: ["Arkisto"],
    premisesAndSettings: ["Tilat ja asetukset"],
    userManagement: ["Käyttajähallinta"],
    services: ["Palvelut ja luokat"],
    spaceAndHobbyTypes: ["Tila- ja harrastetyypit"],
    applicationRounds: ["Hakukierrokset"],
    conditionsAndAttachments: ["Ehdot ja liitteet"],
    units: ["Toimipisteet"],
  },
  HeadingMenu: {
    recurringReservations: ["Vakiovuorot"],
    singleReservations: ["Yksittäisvuorot"],
  },
  Navigation: {
    login: ["Kirjaudu sisään", "Login", "Logga in"],
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
  },
  Application: {
    application: ["Hakemus", "Application"],
    application_plural: ["Hakemusta", "Applications"],
    applicantType: ["Asiakastyyppi"],
    showAllApplications: ["Näytä kaikki hakemukset"],
    showResolutions: ["Näytä päätöslauselma"],
    recommendedStage: ["Suositeltu vaihe"],
    gotoSplitPreparation: ["Siirry valmistelemaan jakoa"],
    iHaveCheckedApplications: ["Olen tarkistanut hakemukset"],
    timeframeCurrent: ["Haku on käynnissä"],
    timeframeFuture: ["Haku käynnistyy {{date}}"],
    timeframePast: ["Haku umpeutunut {{date}}"],
    approvalPendingDate: ["Hyväksyntää pyydetty {{date}}"],
    applicationReceivedTime: ["Hakemus vastaanotettu"],
    applicationDetails: ["Hakemuksen tiedot"],
    organisationName: ["Yhdistyksen nimi"],
    contactPersonEmailAddress: ["Yhteyshenkilön sähköpostiosoite"],
    contactPersonPhone: ["Yhteyshenkilön puhelinnumero"],
    authenticatedUser: ["Tunnistautunut käyttäjä"],
    headings: {
      customer: ["Asiakas"],
      participants: ["Harrastajat"],
      applicantType: ["Asiakastyyppi"],
      coreActivity: ["Ydintoiminta"],
      applicationCount: ["Hakumäärä"],
      applicationStatus: ["Hakemuksen status"],
      reviewStatus: ["Esitarkastuksen tulos"],
      resolutionStatus: ["Päätöksen status"],
      resolution: ["Päätös"],
      applicantName: ["Hakijan nimi"],
      purpose: ["Käyttötarkoitus"],
      ageGroup: ["Ikäluokka"],
      recommendations: ["Ehdotukset"],
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
    members: ["Jäsenet"],
    contactForename: ["Yhteyshenkilön etunimi"],
    contactSurname: ["Yhteyshenkilön sukunimi"],
    organisationCoreActivity: ["Yhdistyksen tai seuran ydintoiminta"],
    applicantTypes: {
      individual: ["Yksityishenkilö"],
      company: ["Yritys"],
      unregisteredAssociation: ["Rekisteröimätön yhdistys"],
      nonprofit: ["Voittoa tavoittelematon yhdistys"],
      community: ["Rekisteröimätön yhdistys"],
      association: ["Rekisteröity yhdistys"],
    },
    contactPerson: ["Yhteyshenkilö"],
    identificationNumber: ["Rekisterinumero"],
    applicationsSelected: ["{{count}} hakemus valittu"],
    applicationsSelected_plural: ["{{count}} hakemusta valittu"],
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
  ApplicationRound: {
    titleAllRecurringApplicationRounds: ["Kaikki vakiovuorojen hakukierrokset"],
    browseAllApplicationRounds: ["Selaa kaikkia"],
    statuses: {
      incoming: ["Tulossa"],
      draft: ["Haku avoinna"],
      handling: ["Käsittelyssä"],
      validated: ["Odottaa esihenkilöhyväksyntää"],
      approved: ["Päätökset tehty"],
      sent: ["Päätökset lähetetty"],
    },
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
      approval: [
        "Odota esihenkilösi hyväksyntää tai mahdollisia muutospyyntöjä.",
      ],
      supervisorApproval: [
        "Tarkasta vuorojakopäätös (esim. toimipisteitä suodattamalla) ja toimita päätökset asiakkaille.",
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
    listHandlingIngress: [
      "Vastuullasi on tällä hetkellä {{count}} tuleva tai käsittelyvaiheessa oleva hakukierros.",
    ],
    listHandlingIngress_plural: [
      "Vastuullasi on tällä hetkellä {{count}} tulevaa tai käsittelyvaiheessa olevaa hakukierrosta.",
    ],
    listHandlingPlaceholder: [
      "Ei vielä tulevia tai käsittelyvaiheessa olevia hakukierroksia.",
    ],
    listApprovalIngress: [
      "Hyväksyntääsi odottaa tällä hetkellä {{count}} päätöslauselma.",
    ],
    listApprovalIngress_plural: [
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
    startDate: ["Kauden aloituspäivä"],
    endDate: ["Kauden päätöspäivä"],
    eventsPerWeek: ["Vuorojen määrä per viikko"],
    biweekly: ["Vakiovuorot vain joka toinen viikko"],
    requestedTimes: ["Toivotut ajat"],
    gotoLink: ["Tarkastele vuoroehdotusta"],
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
    recommendationCount: ["{{count}} ehdotus tehty"],
    recommendationCount_plural: ["{{count}} ehdotusta tehty"],
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
  },
  ReservationUnit: {
    reservationStatus: ["Varaustilanne"],
    purposeCount: ["{{count}} käyttötarkoitus"],
    purposeCount_plural: ["{{count}} käyttötarkoitusta"],
    downloadSpaceCalendar: ["Lataa tilan kalenterimerkinnät (.ics)"],
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
  Unit: {
    headings: {
      service: ["Palvelut"],
      area: ["Alue"],
    },
    reservationUnits: ["{{count}} varausyksikkö"],
    reservationUnits_plural: ["{{count}} varausyksikköä"],
    noReservationUnits: ["Ei varausyksiköitä"],
    noArea: ["Alue puuttuu"],
    noService: ["Palvelu puuttuu"],
    unitCount: ["{{count}} toimipiste"],
    unitCount_plural: ["{{count}} toimipistettä"],
    noUnits: ["Ei toimipisteitä"],
    showOnMap: ["Näytä kartalla"],
    showOpeningHours: ["Aukioloajat"],
    showSpacesAndResources: ["Tilat ja resurssit"],
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
      "Siirry päivittämään aukiolot Toimipisterekisterin kautta.",
    ],
    noOpeningHours: [
      "Toimipisteellä täytyy olla aukioloajat, jotka ohjaavat käytön suunnittelua.",
    ],
    reservationUnitTitle: ["Varausyksiköt"],
    reservationUnitReadMore: ["Lue lisää varausyksiköistä"],
    reservationUnitCreate: ["Luo uusi varausyksikkö"],
    noReservationUnitsTitle: ["Ei vielä luotuja varausyksiköitä."],
    noReservationUnitsInfo: [
      "Tarkista ennen varausyksiköiden luontia, että olet luonut toimipisteelle aukioloajat sekä tarvittavat tilat ja resurssit.",
    ],
    address: ["Osoite"],
    location: ["Toimipisteen sijainti"],
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
