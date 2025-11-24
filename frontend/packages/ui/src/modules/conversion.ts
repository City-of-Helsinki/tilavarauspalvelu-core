import {
  AccessCodeState,
  AccessType,
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
  MunicipalityChoice,
  OrderStatusWithFree,
  ReservationStartInterval,
  ReservationStateChoice,
  ReservationTypeChoice,
  ReservationUnitPublishingState,
  ReserveeType,
  Weekday,
} from "../../gql/gql-types";
import type { DayT } from "./const";

export function transformWeekday(d: DayT): Weekday {
  switch (d) {
    case 0:
      return Weekday.Monday;
    case 1:
      return Weekday.Tuesday;
    case 2:
      return Weekday.Wednesday;
    case 3:
      return Weekday.Thursday;
    case 4:
      return Weekday.Friday;
    case 5:
      return Weekday.Saturday;
    case 6:
      return Weekday.Sunday;
  }
}

export function convertWeekday(d: Weekday): DayT {
  switch (d) {
    case Weekday.Monday:
      return 0;
    case Weekday.Tuesday:
      return 1;
    case Weekday.Wednesday:
      return 2;
    case Weekday.Thursday:
      return 3;
    case Weekday.Friday:
      return 4;
    case Weekday.Saturday:
      return 5;
    case Weekday.Sunday:
      return 6;
  }
}

// safe coercion for day
export function numberToDayT(day: number): DayT | null {
  if (day === 0 || day === 1 || day === 2 || day === 3 || day === 4 || day === 5 || day === 6) {
    return day;
  }
  return null;
}

export function transformReservationType(d: string): ReservationTypeChoice | null {
  switch (d) {
    case ReservationTypeChoice.Staff:
      return ReservationTypeChoice.Staff;
    case ReservationTypeChoice.Behalf:
      return ReservationTypeChoice.Behalf;
    case ReservationTypeChoice.Blocked:
      return ReservationTypeChoice.Blocked;
    case ReservationTypeChoice.Normal:
      return ReservationTypeChoice.Normal;
    case ReservationTypeChoice.Seasonal:
      return ReservationTypeChoice.Seasonal;
    default:
      return null;
  }
}

export function transformReservationTypeUnsafe(type: string): ReservationTypeChoice {
  const t = transformReservationType(type);
  if (t == null) {
    throw new Error(`Unknown reservation type: ${type}`);
  }
  return t;
}

export function transformReserveeType(reserveeType: string): ReserveeType | null {
  switch (reserveeType) {
    case ReserveeType.Company:
      return ReserveeType.Company;
    case ReserveeType.Nonprofit:
      return ReserveeType.Nonprofit;
    case ReserveeType.Individual:
      return ReserveeType.Individual;
    default:
      return null;
  }
}
export function transformReserveeTypeUnsafe(reserveeType: string): ReserveeType {
  const transformed = transformReserveeType(reserveeType);
  if (transformed == null) {
    throw new Error(`Unknown reservee type: ${reserveeType}`);
  }
  return transformed;
}

export function getIntervalMinutes(reservationStartInterval: ReservationStartInterval): number {
  switch (reservationStartInterval) {
    case ReservationStartInterval.Interval_15Minutes:
      return 15;
    case ReservationStartInterval.Interval_30Minutes:
      return 30;
    case ReservationStartInterval.Interval_60Minutes:
      return 60;
    case ReservationStartInterval.Interval_90Minutes:
      return 90;
    case ReservationStartInterval.Interval_120Minutes:
      return 120;
    case ReservationStartInterval.Interval_180Minutes:
      return 180;
    case ReservationStartInterval.Interval_240Minutes:
      return 240;
    case ReservationStartInterval.Interval_300Minutes:
      return 300;
    case ReservationStartInterval.Interval_360Minutes:
      return 360;
    case ReservationStartInterval.Interval_420Minutes:
      return 420;
  }
}

export function transformAccessTypeSafe(t: string): AccessType | null {
  switch (t) {
    case AccessType.AccessCode:
      return AccessType.AccessCode;
    case AccessType.PhysicalKey:
      return AccessType.PhysicalKey;
    case AccessType.OpenedByStaff:
      return AccessType.OpenedByStaff;
    case AccessType.Unrestricted:
      return AccessType.Unrestricted;
    default:
      return null;
  }
}

export function transformReservationUnitState(state: string): ReservationUnitPublishingState | null {
  switch (state) {
    case ReservationUnitPublishingState.Archived:
      return ReservationUnitPublishingState.Archived;
    case ReservationUnitPublishingState.Draft:
      return ReservationUnitPublishingState.Draft;
    case ReservationUnitPublishingState.Hidden:
      return ReservationUnitPublishingState.Hidden;
    case ReservationUnitPublishingState.Published:
      return ReservationUnitPublishingState.Published;
    case ReservationUnitPublishingState.ScheduledHiding:
      return ReservationUnitPublishingState.ScheduledHiding;
    case ReservationUnitPublishingState.ScheduledPeriod:
      return ReservationUnitPublishingState.ScheduledPeriod;
    case ReservationUnitPublishingState.ScheduledPublishing:
      return ReservationUnitPublishingState.ScheduledPublishing;
    default:
      return null;
  }
}
export function transformReservationUnitStateUnsafe(state: string): ReservationUnitPublishingState {
  const transformed = transformReservationUnitState(state);
  if (transformed == null) {
    throw new Error(`Unknown reservation unit state: ${state}`);
  }
  return transformed;
}

export function transformReservationState(state: string): ReservationStateChoice | null {
  switch (state) {
    case ReservationStateChoice.Created:
      return ReservationStateChoice.Created;
    case ReservationStateChoice.Cancelled:
      return ReservationStateChoice.Cancelled;
    case ReservationStateChoice.Denied:
      return ReservationStateChoice.Denied;
    case ReservationStateChoice.Confirmed:
      return ReservationStateChoice.Confirmed;
    case ReservationStateChoice.RequiresHandling:
      return ReservationStateChoice.RequiresHandling;
    case ReservationStateChoice.WaitingForPayment:
      return ReservationStateChoice.WaitingForPayment;
    default:
      return null;
  }
}
export function transformReservationStateUnsafe(state: string): ReservationStateChoice {
  const transformed = transformReservationState(state);
  if (transformed == null) {
    throw new Error(`Unknown reservation state: ${state}`);
  }
  return transformed;
}

export function transformPaymentStatus(t: string): OrderStatusWithFree | null {
  switch (t) {
    case OrderStatusWithFree.Paid:
      return OrderStatusWithFree.Paid;
    case OrderStatusWithFree.PaidManually:
      return OrderStatusWithFree.PaidManually;
    case OrderStatusWithFree.PaidByInvoice:
      return OrderStatusWithFree.PaidByInvoice;
    case OrderStatusWithFree.Pending:
      return OrderStatusWithFree.Pending;
    case OrderStatusWithFree.Draft:
      return OrderStatusWithFree.Draft;
    case OrderStatusWithFree.Expired:
      return OrderStatusWithFree.Expired;
    case OrderStatusWithFree.Refunded:
      return OrderStatusWithFree.Refunded;
    case OrderStatusWithFree.Cancelled:
      return OrderStatusWithFree.Cancelled;
    case OrderStatusWithFree.Free:
      return OrderStatusWithFree.Free;
    default:
      return null;
  }
}
export function transformPaymentStatusUnsafe(t: string): OrderStatusWithFree {
  const transformed = transformPaymentStatus(t);
  if (transformed == null) {
    throw new Error(`Unknown payment status: ${t}`);
  }
  return transformed;
}

export function transformAccessCodeState(t: string): AccessCodeState | null {
  switch (t) {
    case AccessCodeState.AccessCodeCreated:
      return AccessCodeState.AccessCodeCreated;
    case AccessCodeState.AccessCodePending:
      return AccessCodeState.AccessCodePending;
    case AccessCodeState.AccessCodeNotRequired:
      return AccessCodeState.AccessCodeNotRequired;
    default:
      return null;
  }
}
export function transformAccessCodeStateUnsafe(t: string): AccessCodeState {
  const transformed = transformAccessCodeState(t);
  if (transformed == null) {
    throw new Error(`Unknown access code state: ${t}`);
  }
  return transformed;
}

export function transformApplicationSectionStatus(t: string): ApplicationSectionStatusChoice | null {
  switch (t) {
    case ApplicationSectionStatusChoice.Handled:
      return ApplicationSectionStatusChoice.Handled;
    case ApplicationSectionStatusChoice.Unallocated:
      return ApplicationSectionStatusChoice.Unallocated;
    case ApplicationSectionStatusChoice.InAllocation:
      return ApplicationSectionStatusChoice.InAllocation;
    case ApplicationSectionStatusChoice.Rejected:
      return ApplicationSectionStatusChoice.Rejected;
    default:
      return null;
  }
}
export function transformApplicationSectionStatusUnsafe(t: string): ApplicationSectionStatusChoice {
  const transformed = transformApplicationSectionStatus(t);
  if (transformed == null) {
    throw new Error(`Unknown application section status: ${t}`);
  }
  return transformed;
}
export function transformApplicationStatus(t: string): ApplicationStatusChoice | null {
  switch (t) {
    case ApplicationStatusChoice.Received:
      return ApplicationStatusChoice.Received;
    case ApplicationStatusChoice.Handled:
      return ApplicationStatusChoice.Handled;
    case ApplicationStatusChoice.ResultsSent:
      return ApplicationStatusChoice.ResultsSent;
    case ApplicationStatusChoice.InAllocation:
      return ApplicationStatusChoice.InAllocation;
    default:
      return null;
  }
}
export function transformApplicationStatusUnsafe(t: string): ApplicationStatusChoice {
  const transformed = transformApplicationStatus(t);
  if (transformed == null) {
    throw new Error(`Unknown application status: ${t}`);
  }
  return transformed;
}

export function transformMunicipality(value: string): MunicipalityChoice | null {
  switch (value) {
    case MunicipalityChoice.Helsinki:
      return MunicipalityChoice.Helsinki;
    case MunicipalityChoice.Other:
      return MunicipalityChoice.Other;
  }
  return null;
}
export function transformMunicipalityUnsafe(value: string): MunicipalityChoice {
  const transformed = transformMunicipality(value);
  if (transformed == null) {
    throw new Error(`Unknown municipality: ${value}`);
  }
  return transformed;
}
