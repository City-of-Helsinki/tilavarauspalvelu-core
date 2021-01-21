import { isAfter, parseISO, isBefore, format } from 'date-fns';
import { Parameter } from './types';

// eslint-disable-next-line import/prefer-default-export
export const isActive = (startDate: string, endDate: string): boolean => {
  const now = new Date();
  return isAfter(now, parseISO(startDate)) && isBefore(now, parseISO(endDate));
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

// for Selector
export type OptionType = {
  label: string;
  value?: number;
};

export const getLabel = (parameter: Parameter): string => {
  if (parameter.name) {
    return parameter.name;
  }
  if (parameter.minimum && parameter.maximum) {
    return `${parameter.minimum} - ${parameter.maximum}`;
  }
  return 'no label';
};

export const mapOptions = (src: Parameter[]): OptionType[] =>
  src.map((v) => ({
    label: getLabel(v),
    value: v.id,
  }));

export const getSelectedOption = (
  selectedId: number | null,
  options: OptionType[]
): OptionType | undefined => {
  const option = options.find((o) => o.value === selectedId);
  return option;
};

export const weekdays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
