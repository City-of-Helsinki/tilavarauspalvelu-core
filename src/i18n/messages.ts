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
    false: ["ei"],
    true: ["kyllä"],
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
    hoursUnit: [" h", " h", " h"],
    minutesUnit: [" min", " min", " min"],
    streetAddress: ["Katuosoite"],
    postalNumber: ["Postinumero"],
    postalDistrict: ["Postitoimipaikka"],
    emailAddress: ["Sähköpostiosoite"],
    billingAddress: ["Laskutusosoite"],
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
  },
  errors: {
    applicationRoundNotFound: ["Haettua hakukierrosta ei löydy"],
    errorFetchingData: ["Virhe haettaessa tietoja"],
    functionFailed: ["Toiminto epäonnistui"],
    errorFetchingApplication: ["Virhe haettaessa hakemusta"],
    errorFetchingApplications: ["Virhe haettaessa hakemuksia"],
    errorFetchingReservationUnit: ["Virhe haettaessa tilan tietoja"],
    errorSavingApplication: ["Virhe tallennettaessa hakemusta"],
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
      "Palvelua pilotoidaan nuorison vakiovuorovarauksilla vuoden 2021 aikana. Palveluun voivat toistaiseksi kirjautua vain ne Helsingin kaupungin työntekijät, joteka edustavat pilottikohdetta.",
    ],
  },
  User: {
    welcomeUser: ["Tervetuloa, {{firstName}}!"],
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
    recommendedStage: ["Suositeltu vaihe"],
    gotoSplitPreparation: ["Siirry valmistelemaan jakoa"],
    iHaveCheckedApplications: ["Olen tarkistanut hakemukset"],
    timeframeCurrent: ["Haku on käynnissä"],
    timeframeFuture: ["Haku käynnistyy {{date}}"],
    timeframePast: ["Haku umpeutunut {{date}}"],
    applicationReceivedTime: ["Hakemus vastaanotettu"],
    applicationDetails: ["Hakemuksen tiedot"],
    organisationName: ["Yhdistyksen nimi"],
    headings: {
      customer: ["Asiakas"],
      participants: ["Harrastajat"],
      applicantType: ["Asiakastyyppi"],
      coreActivity: ["Ydintoiminta"],
      applicationCount: ["Hakumäärä"],
      applicationStatus: ["Hakemuksen status"],
      reviewStatus: ["Esitarkastuksen tulos"],
      resolution: ["Päätös"],
      applicantName: ["Hakijan nimi"],
      purpose: ["Käyttötarkoitus"],
      ageGroup: ["Ikäluokka"],
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
      association: ["Yhdistys"],
      community: ["Seura"],
      company: ["Yritys"],
      unregisteredAssociation: ["Rekisteröimätön yhdistys"],
    },
    contactPerson: ["Yhteyshenkilö"],
    identificationNumber: ["Rekisterinumero"],
    applicationsSelected: ["{{count}} hakemus valittu"],
    applicationsSelected_plural: ["{{count}} hakemusta valittu"],
    allApplications: ["Kaikki hakemukset"],
  },
  ApplicationRound: {
    titleAllRecurringApplicationRounds: ["Kaikki vakiovuorojen hakukierrokset"],
    browseAllApplicationRounds: ["Selaa kaikkia"],
    statuses: {
      incoming: ["Tulossa"],
      draft: ["Haku avoinna"],
      handling: ["Käsittelyssä"],
      validated: ["Odottaa esihenkilöhyväksyntää"],
      approved: ["Valmis"],
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
    appliedSpace: ["Haettu tila"],
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
        "Tarkasta vuorojakopäätös (esim. suodattamalla) ja toimita päätökset asiakkaille.",
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
    schedulesToBeGranted: ["Myönnettäviä vuoroja"],
    attachedReservationUnits: ["Liitettyä varausyksikköä"],
    orphanApplications: ["Ehdotuksitta jääneet"],
    handledApplications: ["Käsitellyt ehdotukset"],
    amountReserved: ["Kapasiteetista varattu"],
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
    actionDecline: ["Hylkää ehdotettu vuoro"],
    actionApprove: ["Hyväksy ehdotettu vuoro"],
    actionIgnoreSpace: ["Hylkää ehdotettu vuoro tästä tilasta"],
    actionMassDecline: ["Hylkää ehdotetut vuorot"],
    actionMassApprove: ["Hyväksy ehdotetut vuorot"],
    actionMassIgnoreSpace: ["Hylkää ehdotetut vuorot tästä tilasta"],
    actionHelperText: [
      "Jos hylkäät ehdotetun vuoron, vuoron osuutta ei myönnetä asiakkaalle mihinkään tilaan. Jos hylkäät ehdotetun vuoron tästä tilasta, sille pyritään löytämään korvaava tila asiakkaan toiveista. Hylkäyksen ja kiellon tarjota tätä tilaa voi purkaa tarvittaessa myöhemmin. Hyväksyminen ei lähetä myöntöpäätöstä välittömästi asiakkaalle, vaan vasta esihenkilön hyväksyessä kaikki myöntöpäätökset kerralla.",
    ],
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
    },
    statuses: {
      created: ["Käsittelemättä"],
      validated: ["Hyväksytty"],
      declined: ["Hylätty"],
    },
    approveSuccessHeading: ["Ehdotus hyväksytty onnistuneesti"],
    approveSuccessBody: [
      "Hyväksytyt ehdotukset siirtyvät esihenkilölle hyväksyttäväksi.",
    ],
    declineSuccessHeading: ["Ehdotus hylätty"],
    declineSuccessBody: [
      "Valitsemasi vuoro hylättiin. Voit tarvittaessa purkaa hylkäyksen.",
    ],
    banSuccessHeading: ["Tilakielto asetettu"],
    banSuccessBody: [
      "Valitsemaasi vuoroa ei tarjota enää tähän tilaan. Voit tarvittaessa purkaa tilaan kohdistuvan kiellon.",
    ],
  },
  ReservationUnit: {
    reservationStatus: ["Varaustilanne"],
    purposeCount: ["{{count}} käyttötarkoitus"],
    purposeCount_plural: ["{{count}} käyttötarkoitusta"],
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
