import { default as i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import messages from "./messages";

import * as reservationApplicationFi from "./locales/fi/reservationApplication.json";
import * as reservationFormFi from "./locales/fi/reservationForm.json";
import * as errors from "./locales/fi/errors.json";
import * as accessTypeFi from "./locales/fi/accessType.json";

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

i18n.addResourceBundle(
  "fi",
  "reservationApplication",
  reservationApplicationFi
);
i18n.addResourceBundle("fi", "reservationForm", reservationFormFi);
i18n.addResourceBundle("fi", "accessType", accessTypeFi);

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
  helsinkiCity: "Helsingin kaupunki",
  "weekDayLong.0": "Sunnuntai",
  "weekDayLong.1": "Maanantai",
  "weekDayLong.2": "Tiistai",
  "weekDayLong.3": "Keskiviikko",
  "weekDayLong.4": "Torstai",
  "weekDayLong.5": "Perjantai",
  "weekDayLong.6": "Lauantai",
  "weekDay.0": "Su",
  "weekDay.1": "Ma",
  "weekDay.2": "Ti",
  "weekDay.3": "Ke",
  "weekDay.4": "To",
  "weekDay.5": "Pe",
  "weekDay.6": "La",
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
  primarySchedules: "Ensisijaiset aikatoiveet",
  secondarySchedules: "Muut aikatoiveet",
  TimeSelector: {
    calendarLabel: "Toivotut ajat",
    legend: {
      unavailable: "Ei varattavissa",
      primary: "Ensisijainen toive",
      secondary: "Muu toive",
      open: "Varattavissa",
    },
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
  mandatoryFieldsText: "* Tähdellä merkityt syötekentät ovat pakollisia.",
});

i18n.addResourceBundle("fi", "errors", errors);

export default i18n;
