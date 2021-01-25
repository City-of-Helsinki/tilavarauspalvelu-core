export const weekdays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const reservationUnitPrefix = '/reservation-unit';

export const reservationUnitPath = (id: number): string =>
  `${reservationUnitPrefix}/${id}`;
