import { isAfter, parseISO, isBefore, format } from 'date-fns';
import { stringify } from 'query-string';
import { ReservationUnitsParameters } from './api';
import { searchPrefix, emptyOption } from './const';
import {
  LocalizationLanguages,
  OptionType,
  Parameter,
  TranslationObject,
} from './types';

export const isActive = (startDate: string, endDate: string): boolean => {
  const now = new Date();
  return isAfter(now, parseISO(startDate)) && isBefore(now, parseISO(endDate));
};

const isPast = (endDate: string): boolean => {
  const now = new Date();
  return isAfter(now, parseISO(endDate));
};

export const applicationPeriodState = (
  startDate: string,
  endDate: string
): 'pending' | 'active' | 'past' => {
  if (isPast(endDate)) {
    return 'past';
  }
  if (isActive(startDate, endDate)) {
    return 'active';
  }

  return 'pending';
};

export const formatDate = (date: string): string => {
  if (!date) {
    return 'undefined || null';
  }
  return format(parseISO(date), 'd. M. yyyy');
};

export const formatApiDate = (date: string): string => {
  if (!date) {
    return 'undefined || null';
  }
  return format(parseISO(date), 'yyyy-MM-dd');
};

export const localizedValue = (
  name: string | TranslationObject | undefined,
  lang: string
): string => {
  if (!name) {
    return '???';
  }
  // needed until api stabilizes
  if (typeof name === 'string') {
    return name;
  }
  return (
    name[lang as LocalizationLanguages] ||
    name.fi ||
    name.en ||
    name.sv ||
    '???'
  );
};

const getLabel = (
  parameter: Parameter,
  lang: LocalizationLanguages = 'fi'
): string => {
  if (parameter.name) {
    return localizedValue(parameter.name, lang);
  }
  if (parameter.minimum && parameter.maximum) {
    return `${parameter.minimum} - ${parameter.maximum}`;
  }
  return 'no label';
};

export const mapOptions = (
  src: Parameter[],
  emptyOptionLabel?: string,
  lang = 'fi'
): OptionType[] => {
  const r = (<OptionType[]>[])
    .concat(emptyOptionLabel ? [emptyOption(emptyOptionLabel)] : [])
    .concat(
      src.map((v) => ({
        label: getLabel(v, lang as LocalizationLanguages),
        value: v.id,
      }))
    );
  return r;
};

export const getSelectedOption = (
  selectedId: number | null,
  options: OptionType[]
): OptionType | undefined => {
  const selected = Number(selectedId);
  const option = options.find((o) => o.value === selected);
  return option;
};

export const searchUrl = (params: ReservationUnitsParameters): string =>
  `${searchPrefix}/?${stringify(params)}`;
