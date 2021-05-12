import { parse } from 'date-fns';

export const API_DATE_FORMAT = 'yyyy-MM-dd';
export const UI_DATE_FORMAT = 'dd.MM.yyyy';

export const before = (reference: string, value: string): boolean => {
  const ref = parse(reference, API_DATE_FORMAT, 0);
  const val = parse(value, API_DATE_FORMAT, 0);

  return val.getTime() < ref.getTime();
};

export const after = (reference: string, value: string): boolean => {
  const ref = parse(reference, API_DATE_FORMAT, 0);
  const val = parse(value, API_DATE_FORMAT, 0);

  return val.getTime() > ref.getTime();
};
