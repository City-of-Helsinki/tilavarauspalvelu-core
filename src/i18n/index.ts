import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import fi from './messages/fi';
// import sv from './messages/sv';
// import en from './messages/en';
import messages from './messages/messages';

console.log(JSON.stringify(messages, null, 2));

// const resources = { en, fi, sv };
i18n.use(initReactI18next).init({
  resources: messages,
  lng: 'fi',
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
