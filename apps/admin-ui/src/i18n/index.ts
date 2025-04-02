import { default as i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import messages from "./messages";

import * as reservationApplicationFi from "./locales/fi/reservationApplication.json";
import * as reservationFormFi from "./locales/fi/reservationForm.json";

i18n.use(initReactI18next).init({
  resources: messages,
  partialBundledLanguages: true,
  debug: process.env.NODE_ENV && process.env.NODE_ENV === "development",
  lng: "fi",
  fallbackLng: "fi",
  returnNull: false,
  interpolation: {
    escapeValue: false,
  },
});

// manually add namespaces here so we can share components with the Next frontend
i18n.addResourceBundle("fi", "common", {
  day: "Päivä",
  week: "Viikko",
  month: "Kuukausi",
  today: "Tänään",
  increase: "Lisää",
  decrease: "Vähennä",
  applicationName: "Tilavarauskäsittely",
  abbreviations: {
    hour: "{{count}} t",
    minute: "{{count}} min",
  },
  hours: "Tunnit",
  minutes: "Minuutit",
  gotoFrontpage: "Palaa Tilavarauskäsittelyn etusivulle",
  subtract: "Vähennä",
  add: "Lisää",
  select: "Valitse",
  clear: "Tyhjennä",
  close: "Sulje",
  show: "Näytä",
  cancel: "Peruuta",
  remove: "Poista",
  scrollToTop: "Siirry ylös",
});
i18n.addResourceBundle("en", "common", {
  day: "Day",
  week: "Week",
  month: "Month",
  today: "Today",
});
i18n.addResourceBundle("fi", "reservationCalendar", {
  showCurrentDay: "Näytä tämä päivä",
  showPrevious: "Naytä edellinen {{view}}",
  showNext: "Naytä seuraava {{view}}",
  showView: "Näytä {{view}}näkymä",
  // TODO weird namespaces in UI (should be in application not calendar) leaving as a comment so it can
  // be fixed separately (bump the common fields into their own namespace if needed).
  reserverInfo: "Varaajan tiedot",
  reservationInfo: "Varauksen tiedot",
});
i18n.addResourceBundle(
  "fi",
  "reservationApplication",
  reservationApplicationFi
);
i18n.addResourceBundle("fi", "reservationForm", reservationFormFi);
i18n.addResourceBundle("fi", "application", {
  // NOTE these differ between customer and admin application
  status: {
    CANCELLED: "Peruttu",
    DRAFT: "Luonnos",
    EXPIRED: "Vanhentunut",
    HANDLED: "Käsitelty",
    IN_ALLOCATION: "Käsittelyssä",
    RECEIVED: "Vastaanotettu",
    RESULTS_SENT: "Lähetetty",
  },
});

i18n.addResourceBundle("fi", "forms", {
  prefix: {
    text: "Syötä",
    select: "Valitse",
    approve: "Hyväksy",
  },
  // duplicated in reservationForm.json (translation system is borked and cant be shared)
  invalidEmail: "Sähköpostin tulee olla oikeassa muodossa (sisältäen @-merkin)",
});

i18n.addResourceBundle("fi", "errors", {
  generic: {
    heading: "Jokin meni vikaan",
    body: "Pahoittelut, emme valitettavasti pysty näyttämään sivua juuri nyt.",
    body2: "Yritä myöhemmin uudelleen!",
  },
  403: {
    heading: "Ei käyttöoikeuksia sivulle",
    body: "Voit nähdä sivun sisällön, jos kirjaudut sisään ja sinulla on riittävät käyttö-oikeudet.",
    body2:
      "Esihenkilö tai toimipisteesi pääkäyttäjä voi pyytää sinulle käyttöoikeudet Varaamon asiakaspalvelusta.",
  },
  404: {
    heading: "Sivua ei valitettavasti löytynyt",
    body: "Tarkista, että sivun osoite on kirjoitettu oikein. Olemme myös saattaneet poistaa tai siirtää sivun.",
  },
  500: {
    heading: "Jotain meni pieleen",
    body: "Pahoittelut, emme valitettavasti pysty näyttämään sivua juuri nyt.",
  },
  503: {
    heading: "Palaamme pian!",
    body: "Päivitämme Varaamo-palvelua. Kiitos kärsivällisyydestä!",
  },
  buttons: {
    backToHome: "Siirry Varaamon etusivulle",
    giveFeedback: "Anna palautetta",
  },
  deactivatedAccount: {
    heading: "Käyttäjätunnuksesi ei ole voimassa.",
    subHeadingA: "Ota yhteyttä asiakaspalveluun sähköpostitse",
    subHeadingB: "tai Ota yhteyttä-lomakkeella.",
    email: "varaamo@hel.fi",
    button: "Ota yhteyttä",
  },
});

export default i18n;
