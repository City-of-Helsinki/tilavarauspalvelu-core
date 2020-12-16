import { isAfter, parseISO, isBefore, format } from 'date-fns';

// eslint-disable-next-line import/prefer-default-export
export const isActive = (startDate: string, endDate: string): boolean => {
  const now = new Date();
  return isAfter(parseISO(startDate), now) && isBefore(parseISO(endDate), now);
};

export const formatDate = (date: string): string => {
  if (!date) {
    return 'undefined || null';
  }
  return format(parseISO(date), 'd. M. yyyy');
};
