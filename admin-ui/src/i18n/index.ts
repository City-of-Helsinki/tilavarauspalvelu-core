import i18n from "i18next";
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
});
i18n.addResourceBundle("en", "common", {
  day: "Day",
  week: "Week",
  month: "Month",
  today: "Today",
});
i18n.addResourceBundle("fi", "logout", {
  message: "Olet kirjautunut ulos Varaamosta",
  signOutFromOtherServices: "Kirjaudu ulos myös muista Helsingin palveluista",
});
i18n.addResourceBundle("en", "logout", {
  message: "You have signed out from Varaamo",
  signOutFromOtherServices: "Sign out from other Helsinki services also",
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

i18n.addResourceBundle("fi", "forms", {
  prefix: {
    text: "Syötä",
    select: "Valitse",
    approve: "Hyväksy",
  },
});

export default i18n;
