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
  Application: {
    Page1: {
      heading: ['1. Vakiovuoron luominen'],
      basicInformationSubHeading: ['Perustiedot'],
      name: ['Vakiovuoron nimi'],
      groupSize: ['Ryhmän koko'],
      ageGroup: ['Ikäryhmä'],
      abilityGroup: ['Tasoryhmä'],
      purpose: ['Vuoron käyttötarkoitus / toiminnan sisältö'],
      spacesSubHeading: ['Toivotut tilat'],
      applicationPeriodSubHeading: ['Vakiovuoron kausi'],
      periodStartDate: ['Kauden aloituspäivä'],
      periodEndDate: ['Kauden päätöspäivä'],
      minDuration: ['Vuoron minimikesto'],
      maxDuration: ['Vuoron maksimikesto'],
      eventsPerWeek: ['Vuorojen määrä/viikko'],
      biweekly: ['Vuoro vain joka toinen viikko'],
      createNew: ['Luo uusi vakiovuoro'],
    },
    Page2: {
      heading: ['2. Vakiovuoron ajankohta'],
      text: ['Anna toivomasi ajankohta jokaiselle luomallesi vakiovuorolle.'],
      copyTimes: ['Kopioi valinnat kaikille vakiovuoroille'],
      summary: ['Yhteenveto'],
    },
    Page3: {
      heading: ['3. Varaajan perustiedot'],
      text: ['Varaavan yhteisön ja yhteyshenkilön perustiedot.'],
      asPrivatePersonSubHeading: ['Varaan yksityishenkilönä'],
      firstName: ['Etunimi'],
      lastName: ['Sukunimi'],
      email: ['Hakemukselle liitettävä sähköpostiosoite'],
    },
    preview: {
      heading: ['4. Hakemuksen lähettäminen'],
      text: ['Ohessa yhteenveto hakemuksestasi.'],
      basicInfoSubHeading: ['Varaajan perustiedot'],
      firstName: ['Yhteyshenkilön etunimi'],
      lastName: ['Yhteyshenkilön sukunimi'],
      email: ['Sähköpostiosoite'],
      'applicationEvent.name': ['Vakiovuoron nimi'],
      'applicationEvent.numPersons': ['Ryhmän koko'],
      'applicationEvent.ageGroup': ['Ikäryhmä'],
      'applicationEvent.abilityGroup': ['Tasoryhmä'],
      'applicationEvent.purpose': ['Vuoron käyttötarkoitus'],
      'applicationEvent.additionalInfo': ['Lisätietoja vuoroon liittyen'],
      'applicationEvent.begin': ['Kauden aloituspäivä'],
      'applicationEvent.end': ['Kauden päätöspäivä'],
      'applicationEvent.eventsPerWeek': ['Vuorojen määrä viikossa'],
      'applicationEvent.biweekly': ['Vakiovuorot vain joka toinen viikko'],
      'applicationEvent.reservationUnit': ['Vaihtoehto {{order}}.'],
      applicationEventSchedules: ['Toivotut ajat'],
      noData: {
        heading: ['Lomakkeen tietoja ei ole vielä olemassa'],
        text: ['Täytä ensin lomake.'],
      },
      notification: {
        processing: ['Käsittely'],
        body: [
          'Hakemusten käsittely aloitetaan kun hakuaika on päättynyt. Ilmoitamme sinulle, sekä järjestöllesi tai yrityksellesi hakemuksen eri vaiheista sähköpostitse.',
        ],
      },
      userAcceptsTerms: ['Hyväksyn palvelun käyttöehdot'],
    },
  },
  ApplicationPage: {
    navigation: {
      page1: ['1. Vakiovuoron perustiedot'],
      page2: ['2. Vakiovuoron ajankohta'],
      page3: ['3. Varaajan perustiedot'],
      preview: ['4. Lähetä käsiteltäväksi'],
    },
  },
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
    application: ['Vakiovuorohakemus'],
  },
  calendar: {
    monday: ['Maanantai'],
    tuesday: ['Tiistai'],
    wednesday: ['Keskiviikko'],
    thursday: ['Torstai'],
    friday: ['Perjantai'],
    saturday: ['Lauantai'],
    sunday: ['Sunnuntai'],
  },
  common: {
    applicationName: ['Varaamo', 'Varaamo', 'Varaamo'],
    selectReservationUnit: ['Valitse tila'],
    favourite: ['Suosikki', 'Favourite', 'Favorit'],
    next: ['Seuraava', 'Next', 'Nästa'],
    prev: ['Takaisin'],
    submit: ['Lähetä'],
    false: ['ei'],
    true: ['kyllä'],
    close: ['Sulje'],
    search: ['Hae'],
    noResults: ['Ei tuloksia'],
    select: ['Valitse'],
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
        'Vakiovuoroja haetaan yleisen haun kautta. Voit selata tiloja valmiiksi, mutta hakemuksen voi ainoastaan jättää silloin kun hakuaika on käynnissä.',
      ],
    },
    browseAllButton: ['Selaa kaikkia tiloja'],
    infoButton: ['Lue lisää hakuprosessista'],
    applicationTimes: {
      heading: ['Vakiovuorojen hakuajat'],
      text: [
        'Vakiovuoroihin on hakuaika kaksi kertaa vuodessa. Ajankohta vaihtelee palvelusta ja toimialasta riippuen. Voit tilata sähköpostimuistutuksen tuleviin hakuihin.',
      ],
    },
  },
  ReservationUnitList: {
    option: ['Vaihtoehto'],
    buttonRemove: ['Poista'],
    add: ['Lisää tila'],
  },
  ReservationUnitModal: {
    selectReservationUnit: ['Lisää hakemukselle'],
    okButton: ['Lisää valitut'],
    heading: ['Hae tiloja hakemukselle'],
    searchTermLabel: ['Sanahaku'],
    searchPurposeLabel: ['Käyttötarkoitus'],
    searchReservationUnitTypeLabel: ['Tilan tyyppi'],
  },
  ReservationUnit: {
    backToSearch: ['Takaisin hakutuloksiin'],
    maxPersons: ['{{maxPersons}} henkilöä'],
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
  shoppingCart: {
    next: ['Jatka seuraavaan'],
    count_plural: ['{{count}} tilaa valittuna'],
    count: ['{{count}} tila valittuna'],
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
