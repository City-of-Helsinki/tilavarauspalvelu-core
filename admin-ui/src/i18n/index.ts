import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import messages from "./messages";

i18n.use(initReactI18next).init({
  resources: messages,
  partialBundledLanguages: true,
  debug: process.env.NODE_ENV && process.env.NODE_ENV === "development",
  lng: "fi",
  fallbackLng: "fi",
  keySeparator: false,
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
});

export default i18n;
