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

type Space = {
  id: number;
  locationType: "fixed";
  name: TranslationObject;
  parentId: number;
  surfaceArea: null;
  termsOfUse: string;
};

type Resource = {
  id: number;
  name: TranslationObject;
  locationType: "fixed";
  spaceId: number;
  bufferTimeBefore: string;
  bufferTimeAfter: string;
};

type Service = {
  id: number;
  name: TranslationObject;
  serviceType: "introduction";
  bufferTimeBefore: string;
  bufferTimeAfter: string;
};

type Location = {
  id: number;
  addressStreet: string;
  addressZip: string;
  addressCity: string;
  latitude?: string;
  longitude?: string;
};

export type Image = {
  imageUrl: string;
  mediumUrl: string;
  smallUrl: string;
  imageType: "main" | "map" | "ground_plan" | "other";
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
  spaces: Space[];
  resources: Resource[];
  services: Service[];
  images: Image[];
  location?: Location;
  reservationUnitType?: Parameter;
  termsOfUse?: string;
  building: Building;
  contactInformation?: string;
  unitId: number;
  minReservationDuration?: string;
  maxReservationDuration?: string;
  reservations?: Reservation[];
};

type Parameter = {
  id: number;
  name?: TranslationObject | string;
  minimum?: number;
  maximum?: number;
};

export type Address = {
  id?: number;
  streetAddress: string;
  postCode: string;
  city: string;
};

type ApplicantType =
  | null
  | "individual"
  | "association"
  | "community"
  | "company";

type ApplicationStatus =
  // TODO approved is an extra status that should be removed from admin-ui
  | "approved"
  | "draft"
  | "in_review"
  | "review_done"
  | "allocating"
  | "allocated"
  | "validated"
  | "handled"
  | "declined"
  | "cancelled"
  | "sent";

// @deprecated required by pdf export
export type ReducedApplicationStatus = "draft" | "processing" | "sent";

// @deprecated required by pdf export
export type Application = {
  id?: number;
  applicantType: ApplicantType;
  status: ApplicationStatus;
  applicationRoundId: number;
  organisation: Organisation | null;
  contactPerson: ContactPerson | null;
  applicationEvents: ApplicationEvent[];
  billingAddress: Address | null;
  homeCityId: number | null;
  createdDate?: string;
  lastModifiedDate?: string;
  additionalInformation?: string;
};

type Organisation = {
  id?: number;
  name: string | null;
  description: string;
  identifier: string | null;
  yearEstablished: number | null;
  coreBusiness: string;
  address: Address;
};

type ContactPerson = {
  id?: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
};

type ApplicationEventStatus =
  // TODO ignored is extra status added somewhere in admin-ui
  | "ignored"
  | "created"
  | "allocating"
  | "allocated"
  | "validated"
  | "approved"
  | "declined"
  | "cancelled";

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
  eventReservationUnits: EventReservationUnit[];
  applicationEventSchedules: ApplicationEventSchedule[];
  status: ApplicationEventStatus;
};

type EventReservationUnit = {
  priority: number;
  reservationUnitId: number;
  reservationUnitDetails?: ReservationUnit;
};

export type DAY = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ApplicationEventSchedulePriority = 100 | 200 | 300;

type ApplicationEventSchedule = {
  id?: number;
  day: DAY;
  begin: string;
  end: string;
  priority?: ApplicationEventSchedulePriority;
};

// @deprecated required by pdf export
export type ReservationState =
  | "initial"
  | "created"
  | "cancelled"
  | "confirmed"
  | "denied"
  | "requested"
  | "waiting for payment";

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

// @deprecated required by ui/reservation
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

export type LocalizationLanguages = "fi" | "sv" | "en";
export type Language = "fi" | "en" | "sv";

export type Cell = {
  hour: number;
  label: string;
  state: ApplicationEventSchedulePriority | boolean;
  key: string;
};

export interface HMS {
  h: number;
  m: number;
  s: number;
}
