import { isAfter, parseISO, isBefore } from 'date-fns';

// eslint-disable-next-line import/prefer-default-export
export const isActive = (startDate: string, endDate: string): boolean => {
  const now = new Date();
  return isAfter(parseISO(startDate), now) && isBefore(parseISO(endDate), now);
};
