import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import messages from "./messages";

i18n.use(initReactI18next).init({
  resources: messages,
  debug: process.env.NODE_ENV && process.env.NODE_ENV === "development",
  lng: "fi",
  keySeparator: false,
  returnNull: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
