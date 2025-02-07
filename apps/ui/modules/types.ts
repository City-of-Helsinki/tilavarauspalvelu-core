export type ReservationStep = {
  label: string;
  state: 0 | 1 | 2;
};

// used for new reservations
// TODO make the type more strict
// TODO replace begin / end with Date objects because this is created on the client side
// string is used for graphql only
export type PendingReservation = {
  begin: string;
  end: string;
  pk?: number;
  price?: string;
  reservationUnitPk?: number | null;
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
  state?: string;
};
