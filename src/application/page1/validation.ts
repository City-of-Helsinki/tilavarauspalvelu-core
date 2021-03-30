import { parse } from 'date-fns';

const DATE_FORMAT = 'yyyy-MM-dd';

export const before = (reference: string, value: string): boolean => {
  const ref = parse(reference, DATE_FORMAT, 0);
  const val = parse(value, DATE_FORMAT, 0);

  return val.getTime() < ref.getTime();
};

export const after = (reference: string, value: string): boolean => {
  const ref = parse(reference, DATE_FORMAT, 0);
  const val = parse(value, DATE_FORMAT, 0);

  return val.getTime() > ref.getTime();
};
