import i18n from 'i18next';
import { format } from 'date-fns';
import { initReactI18next } from 'react-i18next';
import messages from './messages';

i18n.use(initReactI18next).init({
  resources: messages,
  lng: 'fi',
  keySeparator: false,
  interpolation: {
    format: (value, fmt) => {
      if (value instanceof Date) return format(value, fmt || 'dd.MM.YY');
      return value;
    },
    escapeValue: false,
  },
});

export default i18n;
