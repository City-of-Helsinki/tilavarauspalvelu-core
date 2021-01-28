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
  },
  MainMenu: {
    applications: ["Hakemukset"],
    clients: ["Asiakkaat"],
    archive: ["Arkisto"],
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
    shrinkMenu: ['Pienennä valikko "{{title}}"', 'Shrik menu "{{title}}"'],
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
