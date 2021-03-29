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
  },
  errors: {
    applicationRoundNotFound: ["Haettua hakukierrosta ei löydy"],
    errorFetchingData: ["Virhe haettaessa tietoja"],
    functionFailed: ["Toiminto epäonnistui"],
    errorFetchingApplication: ["Virhe haettaessa hakemusta"],
    errorFetchingApplications: ["Virhe haettaessa hakemuksia"],
    errorSavingApplication: ["Virhe tallennettaessa hakemusta"],
    loginNeeded: ["Kirjautuminen vaaditaan"],
    authorizationNeeded: ["Oikeudet vaaditaan"],
  },
  MainMenu: {
    applications: ["Hakemukset"],
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
    login: ["Kirjaudu", "Login", "Logga in"],
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
    applicationId: ["Hakemustunnus"],
    applicationReceivedTime: ["Hakemus vastaanotettu"],
    applicationDetails: ["Hakemuksen tiedot"],
    organisationName: ["Yhdistyksen nimi"],
    headings: {
      customer: ["Asiakas"],
      participants: ["Aktiiviharrastajat"],
      applicantType: ["Asiakastyyppi"],
      coreActivity: ["Ydintoiminta"],
      applicationCount: ["Hakumäärä"],
      applicationStatus: ["Hakemuksen status"],
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
      validated: ["Hyvaksytty"],
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
    contactEmailOnApplication: ["Käytetään hakemuksella"],
    recurringReservationsForOrganisation: ["Vakiovuorot yhdistykselle"],
    organisationCoreActivity: ["Yhdistyksen tai seuran ydintoiminta"],
    applicantTypes: {
      individual: ["Yksityishenkilö"],
      association: ["Yhdistys"],
      community: ["Seura"],
      company: ["Yritys"],
    },
    contactPerson: ["Yhteyshenkilö"],
  },
  ApplicationRound: {
    pastRounds: ["Menneet"],
    roundsInProcessing: ["Käsittelyssä"],
    roundsOpenForApplication: ["Haku avoinna"],
    futureRounds: ["Tulevat"],
    showClientApplication: ["Näytä asiakkaan koko hakemus"],
    infoGivenByCustomer: ["Asiakkaan ilmoittamat tiedot"],
    recommendedAid: ["Suositeltu tila-avustus"],
    appliedReservations: ["Haetut vuorot"],
    appliedSpace: ["Haettu tila"],
    totalReservationTime: ["Kokonaiskesto"],
    recommendedSpaceAid: ["Tilankäyttönä suositeltava avustus"],
    recommendations: {
      draft: [
        "Tarkasta lista ja neuvottele esihenkilösi kanssa mahdollisista hylkäyksistä",
      ],
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
    },
    roundCriteria: ["Kierroksen kriteerit"],
    allocatedBasket: ["Jaettava kori"],
    allocatedBasketHelper: [
      "Korit ja niiden järjestys on ennalta määritetty. Korin jakaminen tuottaa ehdotuksen, jonka voit hakemus kerrallaan tarkistaa. Jos olet tehnyt hylkäyksiä, käynnistä kori uudelleen ennen seuraavaan koriin siirtymistä.",
    ],
    navigateBackToReview: ["Palaa esitarkistusvaiheeseen"],
    navigateToApprovalPreparation: [
      "Siirry esihenkilöhyväksynnän valmisteluun",
    ],
    navigateBackToHandling: ["Palaa ehdotusten käsittelyyn"],
    allocateAction: ["Jaa"],
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
    orphanApplications: ["Vaille tilaa jääneet"],
    handledApplications: ["Käsitellyt päätökset"],
    amountReserved: ["Kapasiteetista varattu"],
  },
  ApplicationEvent: {
    name: ["Vakiovuoron nimi"],
    groupSize: ["Ryhmän koko"],
    ageGroup: ["Ikäryhmä"],
    eventDuration: ["Vuoron kesto"],
    purpose: ["Vuoron käyttötarkoitus"],
    additionalEventInfo: ["Lisätietoja vakiovuoroon liittyen"],
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
    actionDecline: ["Hylkää ehdotuksen vuoro"],
    actionApprove: ["Hyväksy ehdotuksen vuoro"],
    actionIgnoreSpace: ["Älä ehdota tätä tilaa vuorolle"],
    actionHelperText: [
      "Hylkäyksen ja kiellon tarjota tätä tilaa voi purkaa tarvittaessa myöhemmin. Hyväksyminen ei lähetä myöntöpäätöstä välittömästi asiakkaalle. Esihenkilö hyväksyy kaikkien hakemusten myöntöpäätökset kerralla kierroksen käsittelyn valmistuttua.",
    ],
    recommendationCount: ["{{count}} ehdotus tehty"],
    recommendationCount_plural: ["{{count}} ehdotusta tehty"],
    showOriginalApplication: ["Näytä alkuperäinen hakemus"],
    headings: {
      part: ["Osa"],
      recommendationCount: ["Vuoroja (kpl/h)"],
      spaceName: ["Tilan nimi"],
    },
  },
  ReservationUnit: {
    reservationStatus: ["Varaustilanne"],
    purposeCount: ["{{count}} käyttötarkoitus"],
    purposeCount_plural: ["{{count}} käyttötarkoitusta"],
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
