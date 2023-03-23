import { Reservation } from "common/src/reservation-form/types";

export enum ReservationType {
  STAFF = "STAFF",
  NORMAL = "BEHALF",
  BLOCKED = "BLOCKED",
}

export type ReservationFormType = Reservation & {
  date: string;
  startTime: string;
  endTime?: string;
  comments?: string;
  type?: ReservationType;
  bufferTimeAfter: boolean;
  bufferTimeBefore: boolean;
};
