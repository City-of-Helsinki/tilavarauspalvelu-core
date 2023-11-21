export type CalendarBufferEvent = {
  state: "BUFFER";
};

export type CalendarEventBuffer = {
  start: Date;
  end: Date;
  event: CalendarBufferEvent;
};

export type SlotProps = {
  className?: string;
  style?: React.CSSProperties;
};

type TranslationObject = {
  fi?: string;
  en?: string;
  sv?: string;
};

type Building = {
  id: number;
  name: string;
};

// @deprecated required by pdf export
export type ReservationUnit = {
  id: number;
  name: TranslationObject;
  description: string;
  maxPersons: number;
  requireIntroduction: boolean;
  // spaces: Space[];
  // resources: Resource[];
  // services: Service[];
  // images: Image[];
  // location?: Location;
  // reservationUnitType?: Parameter;
  termsOfUse?: string;
  building: Building;
  contactInformation?: string;
  unitId: number;
  minReservationDuration?: string;
  maxReservationDuration?: string;
  reservations?: Reservation[];
};

type ApplicantType =
  | null
  | "individual"
  | "association"
  | "community"
  | "company";

// @deprecated required by pdf export
export type ReducedApplicationStatus = "draft" | "processing" | "sent";

// @deprecated required by pdf export
export type Application = {
  id?: number;
  applicantType: ApplicantType;
  // status: ApplicationStatus;
  applicationRoundId: number;
  // organisation: Organisation | null;
  contactPerson: ContactPerson | null;
  applicationEvents: ApplicationEvent[];
  // billingAddress: Address | null;
  homeCityId: number | null;
  createdDate?: string;
  lastModifiedDate?: string;
  additionalInformation?: string;
};

type ContactPerson = {
  id?: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
};

// @deprecated required by pdf export
export type ApplicationEvent = {
  id?: number;
  name: string | null;
  uuid?: string;
  numPersons: number | null;
  ageGroupId: number | null;
  abilityGroupId: number | null;
  purposeId: number | null;
  minDuration: string | null;
  maxDuration: string | null;
  eventsPerWeek: number;
  biweekly: boolean;
  begin: string | null;
  end: string | null;
  applicationId: number;
  // eventReservationUnits: EventReservationUnit[];
  // applicationEventSchedules: ApplicationEventSchedule[];
  // status: ApplicationEventStatus;
};

export type DAY = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ApplicationEventSchedulePriority = number;

// @deprecated required by pdf export
export type ReservationState =
  | "initial"
  | "created"
  | "cancelled"
  | "confirmed"
  | "denied"
  | "requested"
  | "waiting for payment";

// @deprecated required by pdf export
export type Reservation = {
  id: number;
  applicationId?: number | null;
  applicationEventId?: number | null;
  state: ReservationState;
  priority: string;
  begin: string;
  end: string;
  reservationUnit?: ReservationUnit[];
  numPersons?: number;
  calendarUrl?: string;
};

// @deprecated required by ui/reservation
export type PendingReservation = {
  begin: string;
  end: string;
  pk?: number;
  price?: string;
  reservationUnitPk?: number | null;
  bufferTimeBefore?: string;
  bufferTimeAfter?: string;
  state?: string;
};

// @deprecated required by pdf export
export type RecurringReservation = {
  applicationId: number;
  applicationEventId: number;
  ageGroupId: number;
  abilityGroupId: number;
  reservations: Reservation[];
};

// for ui:

export type OptionType = {
  label: string;
  value?: number | string;
};

export interface HMS {
  h: number;
  m: number;
  s: number;
}
