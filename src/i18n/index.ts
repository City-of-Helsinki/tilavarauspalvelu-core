import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fi from './messages/fi';
import sv from './messages/sv';
import en from './messages/en';

const resources = { en, fi, sv };

i18n.use(initReactI18next).init({
  resources,
  lng: 'fi',
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
