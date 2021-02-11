// format:
// label1: [<fi_translation>, <en_translation>, <sv translation>]
// label1: [<fi_translation>, <en_translation>, <sv translation>]

// labels can be nested:

// component: {
//  button: ['fi', 'en', 'sv'];
// }
// will generate key: component.button

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
    close: ["Sulje"],
    search: ["Hae"],
    noResults: ["Ei tuloksia"],
    select: ["Valitse"],
    filter: ["Suodata"],
    closeModal: ["Sulje modaali-ikkuna"],
    today: ["Tänään"],
  },
  errors: {
    applicationRoundNotFound: ["Haettua hakukierrosta ei löydy"],
    errorFetchingData: ["Virhe haettaessa tietoja"],
    errorFetchingApplications: ["Virhe haettaessa hakemuksia"],
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
    profile: ["Profiili", "Profile", "Profil"],
    languageSelection: ["Kielen valinta", "Language selection", "Språkval"],
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
    showAllApplications: ["Näytä kaikki hakemukset"],
    settingsAndQuotas: ["Asetukset ja kiintiöt"],
    recommendedStage: ["Suositeltu vaihe"],
    gotoSplitPreparation: ["Siirry valmistelemaan jakoa"],
    iHaveCheckedApplications: ["Olen tarkistanut hakemukset"],
    timeframeCurrent: ["Haku on käynnissä"],
    timeframeFuture: ["Haku käynnistyy {{date}}"],
    timeframePast: ["Haku umpeutunut {{date}}"],
    headings: {
      customer: ["Asiakas"],
      participants: ["Harrastajat"],
      customerType: ["Asiakastyyppi"],
      coreActivity: ["Ydintoiminta"],
      applicationCount: ["Hakumäärä"],
      applicationStatus: ["Hakemuksen tila"],
    },
    statuses: {
      draft: ["Luonnos"],
      in_review: ["Tarkastuksessa"],
      review_done: ["Tarkastettu"],
      allocating: ["Varauksessa"],
      allocated: ["Varattu"],
      validated: ["Hyvaksytty"],
      handled: ["Käsitelty"],
      declined: ["Hylätty"],
      cancelled: ["Peruutettu"],
    },
  },
  ApplicationRound: {
    pastRounds: ["Menneet"],
    roundsInProcessing: ["Käsittelyssä"],
    roundsOpenForApplication: ["Haku avoinna"],
    futureRounds: ["Tulevat"],
    expandSearch: ["Laajenna hakujen koontinäkymä"],
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
