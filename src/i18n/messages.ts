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
  DeleteEvent: {
    heading: ['Poista vakiovuoro hakemukselta?'],
    text: ['Olet poistamassa vakiovuoroa {{name}}.'],
    confirmation: ['Oletko varma?'],
  },
  ApplicationEventSummary: {
    message: [
      'Olet hakemassa vakiovuorolle {{name}} kaudella {{startDate}} - {{endDate}} vähintään yhteensä {{hours}} tuntia vakiovuoroaikaa.',
    ],
    numPersons: ['Ryhmän koko on <1>{{numPersons}} henkilöä<1>'],
    minDuration: ['Yhden vuoron kesto minimissään {{minDuration}}'],
    eventsPerWeek: ['<0>{{eventsPerWeek}}</0> vuoro viikossa'],
    eventsPerWeek_plural: ['<0>{{eventsPerWeek}}</0> vuoroa viikossa'],
  },
  Applications: {
    heading: ['Omat hakemukset'],
    group: {
      draft: ['Luonnokset'],
      sent: ['Lähetetyt'],
    },
  },
  ApplicationCard: {
    edit: ['Muokkaa hakemusta'],
    cancel: ['Peruuta hakemus'],
    status: {
      draft: ['Kesken'],
      in_review: ['Käsittelyssä'],
    },
    person: ['Hakemus luotu: yksityishenkilönä'],
    organisation: ['Hakemus luotu: {{type}} {{name}}'],
    applicantType: {
      community: ['yhdistykselle'],
      company: ['yritykselle'],
    },
  },
  Application: {
    error: {
      required: ['Pakollinen', 'Required', 'Obligatorisk'],

      numPersonsMin: ['Ryhmän koko virheellinen'],
      minDurationBiggerThanMaxDuration: [
        'Minimikesto on suurempi kuin maksimikesto',
      ],
      maxDurationSmallerThanMinDuration: [
        'Maksimikesto on pienempi kuin minimikesto',
      ],
      eventsPerWeekMin: ['Minimissään yksi vuoro viikossa'],
      beginAfterEnd: ['Kauden aloituspäivä myöhempi kuin lopetuspäivä'],
      beginBeforePeriodBegin: ['Kauden aloituspäivä on liian aikainen'],
      beginAfterPeriodEnd: ['Kauden aloituspäivä on liian myöhäinen'],
      endAfterPeriodEnd: ['Kauden lopetuspäivä on liian myöhäinen'],
      endBeforeBegin: ['Kauden lopetuspäivä on aikaisempi kuin aloituspäivä'],
      endBeforePeriodBegin: ['Kauden lopetuspäivä on liian aikainen'],
      missingSchedule: ['Lisää kaikille vakiovuoroille vähintään yksi aika'],
      reservationUnitTooSmall: ['Tila on liian pieni ryhmän käyttöön'],
      otherEventsHaveErrors: ['Korjaa ensin validaatiovirheet'],
    },
    Intro: {
      startNewApplication: ['Aloita hakemuksen täyttäminen'],
      heading: ['Vakiovuorohakemus'],
      faq1: {
        question: [
          'Edustan yhdistystä tai rekisteröitymätöntä ryhmää, kuinka toimin?',
        ],
      },
      faq2: {
        question: ['Kuinka hakemusten käsittely tapahtuu?'],
      },

      faq3: {
        question: ['Kuinka täytän vakiovuorohakemuksen yksityishenkilönä?'],
      },
    },
    applicationEventSaved: ['Vakiovuoro tallennettu hakemukselle'],
    Page1: {
      heading: ['1. Vakiovuoron luominen'],
      text: ['Perustiedot'],
      basicInformationSubHeading: ['Perustiedot'],
      name: ['Vakiovuoron nimi'],
      groupSize: ['Ryhmän koko'],
      ageGroup: ['Ikäryhmä'],
      abilityGroup: ['Tasoryhmä'],
      purpose: ['Vuoron käyttötarkoitus / toiminnan sisältö'],
      spacesSubHeading: ['Toivotut tilat'],
      applicationRoundSubHeading: ['Vakiovuoron kausi'],
      periodStartDate: ['Kauden aloituspäivä'],
      periodEndDate: ['Kauden päätöspäivä'],
      minDuration: ['Vuoron minimikesto'],
      maxDuration: ['Vuoron maksimikesto'],
      eventsPerWeek: ['Vuorojen määrä viikossa'],
      biweekly: ['Vuoro vain joka toinen viikko'],
      defaultDurationLabel: ['1 tunti'],
      createNew: ['Lisää uusi vakiovuoro hakemukselle'],
      applicationEventName: ['Nimetön vakiovuoro'],
      applicationEventSummary: ['Yhteenveto'],
      applicationEventSaved: ['Vakiovuoro tallennettu hakemukselle'],
      saveEvent: ['Hyväksy ja tallenna vakiovuoro'],
      deleteEvent: ['Poista vakiovuoro'],
    },
    Page2: {
      heading: ['2. Vakiovuoron ajankohta'],
      text: ['Anna toivomasi ajankohta jokaiselle luomallesi vakiovuorolle.'],
      copyTimes: ['Kopioi ajat kaikille vakiovuoroille'],
      summary: ['Yhteenveto'],
    },
    Page3: {
      heading: ['3. Varaajan perustiedot'],
      text: ['Varaavan yhteisön ja yhteyshenkilön perustiedot'],
      asPrivatePersonSubHeading: ['Varaan yksityishenkilönä'],
      firstName: ['Etunimi', 'First name', 'Förnamn'],
      lastName: ['Sukunimi', 'Last name', 'Efternamn'],
      phoneNumber: ['Puhelinumero', 'Phone number', 'Telefonnummer'],
      email: [
        'Hakemukselle liitettävä sähköpostiosoite',
        'Email address',
        'E-postadress',
      ],
      emailNotification: [
        'Kaikki hakemukseen liittyvät viestit lähetetään alla olevaan sähköpostiin',
      ],
      as: {
        type: {
          organisation: [
            'Luon hakemuksen yhdistyksen, järjestön, ryhmän tai yhteisön puolesta',
            'Create Application for association',
            'Skapa ansökan om associering',
          ],
          company: [
            'Luon hakemuksen yrityksen puolesta',
            'Create application for company',
            'Skapa applikation för företag',
          ],
          individual: [
            'Luon hakemuksen yksityishenkilönä',
            'Create Application as private person',
            'Skapa ansökan som privatperson',
          ],
        },
      },

      contactPerson: {
        firstName: ['Yhteyshenkilön etunimi', 'Firt name', 'Förnamn'],
        lastName: ['Yhteyshenkilön sukunimi', 'Last name', 'Efternamn'],
        phoneNumber: [
          'Yhteyshenkilön puhelinnumero',
          'Phone number',
          'Telefonnummer',
        ],
      },
      billingAddress: {
        streetAddress: ['Katuosoite', 'Street address', 'Adress'],
        postCode: ['Postinumero', 'ZIP code', ' Postnummer'],
        city: ['Postitoimipaikka', 'City', 'Postdistrikt'],
      },
      company: {
        name: [
          'Yrityksen virallinen nimi',
          'The official name of the company',
          'företagets officiella namn',
        ],
        coreBusiness: [
          'Yrityksen ydintoiminta',
          'The core business of the company',
          'Företagets kärnverksamhet',
        ],
        registrationNumber: ['Y-tunnus', 'Business ID', 'FO-nummer'],
      },
      organisation: {
        name: ['Yhdistyksen, järjestön, ryhmän tai yhteisön virallinen nimi'],
        coreBusiness: ['Yhdistyksen tai seuran ydintoiminta'],
        registrationNumber: [
          'Rekisterinumero',
          'Registration number',
          'Registreringsnummer',
        ],
        streetAddress: ['Katuosoite', 'Street address', 'Adress'],
        postCode: ['Postinumero', 'ZIP code', ' Postnummer'],
        city: ['Postitoimipaikka', 'City', 'Postdistrikt'],
        notRegistered: [
          'Yhdistystä ei ole rekisteröity',
          'Organisation is not registered',
          'Organisationen är inte registrerad',
        ],
        separateInvoicingAddress: [
          'Laskutusosoite on eri kuin tämä',
          'Has additional invoicing address',
          'Har ytterligare faktureringsadress',
        ],
      },
    },
    preview: {
      applicantType: {
        community: [
          'Rekisteröimätön yhdistys',
          'Unregistered association',
          'Oregistrerad förening',
        ],
        company: ['Yritys', 'Company', 'Företag'],
        individual: ['Yksityishenkilö', 'Private person', 'Privatperson'],
        association: [
          'Rekisteröity yhdistys',
          'Registered association',
          'Registrerad förening',
        ],
      },
      heading: ['4. Hakemuksen lähettäminen'],
      text: ['Yhteenveto hakemuksestasi'],
      basicInfoSubHeading: ['Varaajan perustiedot'],
      firstName: ['Yhteyshenkilön etunimi'],
      lastName: ['Yhteyshenkilön sukunimi'],
      applicantTypeLabel: [
        'Hakijan tyyppi',
        'Applicant type',
        'Typ av sökande',
      ],
      email: ['Sähköpostiosoite', 'Email address', ''],
      phoneNumber: ['Puhelinumero', 'Phone number', 'Telefonnummer'],
      organisation: {
        name: ['Hakijan nimi', 'Name of the applicant', 'Sökandens namn'],
        coreBusiness: ['Ydintoiminta', 'Core business', 'Kärnverksamhet'],
      },
      'applicationEvent.name': ['Vakiovuoron nimi'],
      'applicationEvent.numPersons': ['Ryhmän koko'],
      'applicationEvent.ageGroup': ['Ikäryhmä'],
      'applicationEvent.abilityGroup': ['Tasoryhmä'],
      'applicationEvent.purpose': ['Vuoron käyttötarkoitus'],
      'applicationEvent.additionalInfo': ['Lisätietoja vuoroon liittyen'],
      'applicationEvent.begin': ['Kauden aloituspäivä'],
      'applicationEvent.end': ['Kauden päätöspäivä'],
      'applicationEvent.minDuration': ['Minimikesto'],
      'applicationEvent.maxDuration': ['Maksimikesto'],
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
          'Hakemusten käsittely aloitetaan, kun hakuaika on päättynyt. Ilmoitamme antamaasi sähköpostiosoitteeseen eri vaiheista.',
        ],
      },
      userAcceptsTerms: ['Hyväksyn palvelun käyttöehdot'],
    },
    sent: {
      heading: ['Hakemuksesi on lähetetty käsiteltäväksi'],
      faq1Question: ['Kuinka hakemuiksen käsittely etenee?'],
      faq2Question: ['Kuinka hakemuksen käsittely tapahtuu?'],
      faq3Question: ['Kuinka valitan päätöksestä?'],
    },
  },
  ApplicationPage: {
    navigation: {
      page1: ['Vakiovuoron perustiedot'],
      page2: ['Vakiovuoron ajankohta'],
      page3: ['Varaajan perustiedot'],
      preview: ['Tarkista ja lähetä käsiteltäväksi'],
    },
  },
  ApplicationRoundCard: {
    reminderButton: ['Tilaa muistutus'],
    applyButton: ['Hae Tilaa'],
    displayPastButton: ['Näytä tilat'],
    criteria: ['Hakukriteerit'],
    pending: ['Haku avautuu {{openingDateTime}}'],
    open: ['Haku auki {{until}} saakka'],
    past: ['Haku sulkeutui {{closingDate}}'],
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
    applicationNavigationName: ['Hakemus', 'Application', 'Ansökan'],
    applicationName: ['Varaamo', 'Varaamo', 'Varaamo'],
    selectReservationUnit: ['Valitse tila'],
    removeReservationUnit: ['Lisätty hakemukselle'],
    reservationUnitSelected: ['Lisätty hakemukselle'],
    next: ['Seuraava', 'Next', 'Nästa'],
    prev: ['Takaisin'],
    submit: ['Lähetä'],
    false: ['ei'],
    true: ['kyllä'],
    close: ['Sulje'],
    search: ['Hae', 'Search', 'Sök'],
    noResults: ['Ei tuloksia', 'No results', 'Inga resultat'],
    select: ['Valitse', 'Choose', 'Välja'],
    hour: ['Tunti'],
    abbreviations: {
      hour: ['t', 'h', 'h'],
      minute: ['min', 'min', 'min'],
    },
    login: ['Kirjaudu', 'Login', 'Logga in'],
    logout: ['Kirjaudu ulos', 'Logout', 'Logga ut'],
    cancel: ['Peruuta', 'Cancel'],
    imgAltForSpace: ['Kuva tilasta {{name}}'],
    address: {
      streetAddress: ['Katuosoite', 'Street address', 'Adress'],
      postCode: ['Postinumero', 'ZIP code', ' Postnummer'],
      city: ['Postitoimipaikka', 'City', 'Postdistrikt'],
    },
    billingAddress: {
      streetAddress: ['Laskutusosoite', 'Street address', 'Adress'],
      postCode: ['Postinumero', 'ZIP code', ' Postnummer'],
      city: ['Postitoimipaikka', 'City', 'Postdistrikt'],
    },
  },
  reservationUnit: {
    type: ['Tyyppi', 'Type', 'Typ'],
    maxPersons: ['Suurin sallittu henkilömäärä', 'Max persons', 'Max personer'],
    address: ['Osoite', 'Address', 'Adress'],
    maxDuration: ['Varauksen kesto', 'Duration of reservation', 'Bokningstid'],
    price: ['Hinta', 'Price', 'Pris'],
    billableHours: ['Maksulliset tunnit', 'Billable hours', 'Betalda timmar'],
    linkMap: [
      'Avaa kartta uuteen ikkunaan',
      'Open map in a new window ',
      'Öppna kartan i ett nytt fönster',
    ],
    linkHSL: ['HSL Reittiopas', 'HSL Journey Planner', 'HSL Reseplaneraren'],
    linkGoogle: [
      'Google reittiohjeet',
      'Google Directions',
      'Google Vägbeskrivning',
    ],
    images: ['Kuvat', 'Images', 'Bilder'],
    description: ['Kuvaus', 'Description', 'Beskrivning'],
    termsOfUse: ['Käyttöehdot ja säännöt', 'Terms of use', 'Villkor'],
  },

  Navigation: {
    Item: {
      spaceReservation: ['Vakiovuorot'],
      reservationUnitSearch: ['Tilahaku'],
      applications: ['Omat hakemukset'],
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
        'Vakiovuoroja haetaan yleisen haun kautta. Voit selata tiloja valmiiksi, mutta hakemuksen voi jättää vain hakuajan puitteissa.',
      ],
    },
    browseAllButton: ['Selaa kaikkia tiloja'],
    applicationTimes: {
      heading: ['Vakiovuorojen hakuajat'],
      text: [
        'Vakiovuoroihin on hakuaika kaksi kertaa vuodessa. Ajankohta vaihtelee palvelusta ja toimialasta riippuen.',
      ],
    },
  },
  ReservationUnitList: {
    option: ['Vaihtoehto'],
    buttonRemove: ['Poista'],
    buttonUp: ['Siirrä ylös'],
    buttonDown: ['Siirrä alas'],
    add: ['Lisää tila'],
    infoReservationUnits: [
      'Järjestä tilat haluamasi järjestykseen nuolilla. Ensisijaisin tila ylimmäiseksi. Voit lisätä tilatoiveita Lisää tila painikkeella.',
    ],
  },
  ReservationUnitModal: {
    selectReservationUnit: ['Lisää hakemukselle', 'Add to application'],
    unSelectReservationUnit: [
      'Poista hakemukselta',
      'Remove from application',
      'Ta bort från applikationen',
    ],
    heading: ['Lisää sopivia tiloja hakemukselle'],
    searchTermLabel: ['Sanahaku'],
    searchPurposeLabel: ['Käyttötarkoitus'],
    searchReservationUnitTypeLabel: ['Tilan tyyppi'],
    openLinkToNewTab: [
      'Avaa välilehdellä',
      'Open in new tab',
      'Öppna i ny flik',
    ],
    returnToApplication: ['Palaa hakemukselle'],
  },
  ReservationUnit: {
    backToSearch: ['Takaisin hakutuloksiin'],
    maxPersons: ['{{maxPersons}} henkilöä'],
    RelatedUnits: {
      heading: ['Toimipisteen muut tilat'],
    },
  },
  search: {
    heading: ['Vakiovuorojen tilat'],
    text: ['Valitse tilat, joihin haluat hakea vakiovuoroja'],
  },
  SearchForm: {
    searchTermPlaceholder: ['Hae sanalla', 'Search with words', 'Sök med ord'],
    searchButton: ['Hae tilaa'],
    purposeLabel: [
      'Tilan käyttötarkoitus',
      'Purpose of use',
      'Utrymmets användningsändamål',
    ],
    roundLabel: ['Hakukierros', 'Search round', 'Sökrunda'],
    districtLabel: ['Kaupunginosa', 'District', 'Grannskap'],
    priceLabel: ['Hinta', 'Price', 'Pris'],
    participantCountLabel: [
      'Henkilömäärä vähintään',
      'Minimum number of people permitted',
      'Minsta personantal i utrymmet',
    ],
    typeLabel: ['Tilan tyyppi', 'Type', 'Typ'],
    showMoreFilters: [
      'Tarkennettu haku',
      'Advanced Search',
      'Avancerad sökning',
    ],
    showLessFilters: [
      'Näytä vähemmän vaihtoehtoja',
      'Show fewer filters',
      'Visa färre filter',
    ],
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
  auth: {
    lostSession: {
      heading: ['Sinut on kirjattu ulos'],
      text: ['Olet kirjautunut ulos'],
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
