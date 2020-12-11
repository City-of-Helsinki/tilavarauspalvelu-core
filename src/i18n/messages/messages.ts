// format:
// label1: [<fi_translation>, <en_translation>, <sv translation>]
// label1: [<fi_translation>, <en_translation>, <sv translation>]

// labels can be nested:

// component: {
//  button: ['fi', 'en', 'sv'];
// }
// will generate key: component.button

import { Resource } from 'i18next';

interface Translations {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [index: string]: any;
}

const translations: Translations = {
  ApplicationPeriodCard: {
    reminderButton: ['Tilaa muistutus'],
    applyButton: ['Hae Tilaa'],
    criteria: ['Hakukriteerit'],
    closed: ['Haku avautuu {{openingDateTime}}'],
    open: ['Haku auki {{until}} saakka'],
  },
  breadcrumb: {
    home: ['Vakiovuorot'],
    search: ['Haku'],
  },
  common: {
    applicationName: ['Varaamo'],
    selectReservationUnit: ['Valitse tila'],
  },
  Navigation: {
    Item: {
      spaceReservation: ['Vakiovuorot'],
    },
    skipToMainContent: [
      'Siirry sivun pääsisältöön',
      'Skip to main content',
      'Hoppa till huvudnavigeringen',
    ],
  },
  home: {
    head: {
      heading: ['Vakiovuoron hakeminen'],
      text: ['Hae säännöllisiä vuoroja'],
    },
    info: {
      heading: ['Hakeminen'],
      text: [
        'Vakiovuoroja haetaan yleisen haun kautta. Voit selata tiloja, mutta hakemuksen voi ainoastaan jättää silloin kun hakuaika on käynnissä.',
      ],
    },
    browseAllButton: ['Selaa kaikkia tiloja'],
    infoButton: ['Lue lisää hakuprosessista'],
    applicationTimes: {
      heading: ['Hakuajat'],
      text: [
        'Vakiovuoroihin on hakuaika kaksi kertaa vuodessa. Ajankohta vaihtelee palvelusta ja toimialasta riippuen. Voit tilata sähköpostimuistutuksen tuleviin hakuihin.',
      ],
    },
  },
  search: {
    heading: ['Vakiovuorojen tilat'],
    text: ['Valitse tilat joihin haluat hakea vakiovuoroja.'],
  },
  SearchForm: {
    searchTermPlaceholder: ['Hae sanalla'],
    searchButton: ['Hae tilaa'],
  },
  SearchResultList: {
    count_plural: ['{{count}} Hakutulosta'],
    count: ['{{count}} Hakutulos'],
    listButton: ['Näytä listassa'],
    mapButton: ['Näytä kartalla'],
    sortButtonLabel: ['Järjestä'],
    sortButtonPlaceholder: ['Sijainnin mukaan'],
  },
  Footer: {
    Navigation: {
      recurringShift: {
        label: ['Säännölliset vuorot'],
        href: ['#'],
      },
      reservation: {
        label: ['Varaus'],
        href: ['#'],
      },
      infoAboutService: {
        label: ['Tietoa palvelusta'],
        href: ['#'],
      },
    },
    Base: {
      Item: {
        privacyStatement: {
          label: ['Tietosuojaseloste'],
          href: ['#'],
        },
        accessibilityStatement: {
          label: ['Saavutettavuus'],
          href: ['#'],
        },
      },
      copyrightHolder: ['Helsingin kaupunki'],
      copyrightText: ['Kaikki oikeudet pidätetään'],
    },
  },
};

// transform to i18n format

const traverse = (
  obj: Translations,
  prefix = '',
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
