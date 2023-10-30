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

export type Language = "fi" | "en" | "sv";

type ApplicationRoundStatus =
  | "draft"
  | "in_review"
  | "review_done"
  | "allocated"
  | "handled"
  | "validated"
  | "approved";

type CustomerType = "business" | "nonprofit" | "individual";

type ApplicationRoundBasket = {
  id: number;
  name: string;
  purposeIds: number[];
  mustBeMainPurposeOfApplicant: boolean;
  customerType: CustomerType[] | null;
  ageGroupIds: number[];
  allocationPercentage: number;
  orderNumber: number;
  homeCityId: number | null;
};

type ApplicationRoundAggregatedData = {
  totalHourCapacity: number;
  totalReservationDuration: number;
  allocationDurationTotal: number;
  allocationResultEventsCount: number;
};

type ApplicationRound = {
  id: number;
  name: string;
  // aggregatedData: ApplicationRoundAggregatedData;
  reservationUnitIds: number[];
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
  publicDisplayBegin: string;
  publicDisplayEnd: string;
  purposeIds: number[];
  serviceSectorId: number;
  // applicationRoundBaskets: ApplicationRoundBasket[];
  status: ApplicationRoundStatus;
  statusTimestamp: string;
  allocating: boolean;
  isAdmin: boolean;
  approvedBy: string;
  applicationsSent: boolean;
  criteria: string;
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
  openingHours?: OpeningHours;
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

export type Cell = {
  hour: number;
  label: string;
  state: ApplicationEventSchedulePriority | boolean;
  key: string;
};

type TimeSpan = {
  startTime: string;
  endTime: string;
  weekdays: number[];
  resourceState: string;
  endTimeOnNextDay: boolean;
  name: TranslationObject;
  description: TranslationObject;
};

type OpeningTime = {
  date: string;
  startTime: string;
  endTime: string;
  state: string;
  periods: number[] | null;
};

type OpeningTimePeriod = {
  periodId: number;
  startDate: string;
  endDate: string;
  resourceState: string;
  timeSpans: TimeSpan[];
  name: TranslationObject;
  description: TranslationObject;
};

type OpeningHours = {
  openingTimes?: OpeningTime[];
  openingTimePeriods?: OpeningTimePeriod[];
};

export interface HMS {
  h: number;
  m: number;
  s: number;
}

export const paymentTypes = ["INVOICE", "ONLINE", "ON_SITE"];
