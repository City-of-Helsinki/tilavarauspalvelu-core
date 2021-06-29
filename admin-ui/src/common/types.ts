export type LocalizationLanguages = "fi" | "sv" | "en";

export type TranslationObject = {
  [key: string]: string;
};

export type ApplicationRoundStatus =
  | "draft"
  | "in_review"
  | "review_done"
  | "allocated"
  | "handled"
  | "validated"
  | "approved";

export type NormalizedApplicationRoundStatus =
  | ApplicationRoundStatus
  | "incoming"
  | "handling"
  | "sent";

export type ApplicationRoundBasket = any; // eslint-disable-line

export type ApplicationRoundAggregatedData = {
  totalHourCapacity: number;
  totalReservationDuration: number;
  allocationDurationTotal: number;
  allocationResultEventsCount: number;
};

export type ApplicationRound = {
  id: number;
  name: string;
  aggregatedData: ApplicationRoundAggregatedData;
  reservationUnitIds: number[];
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
  publicDisplayBegin: string;
  publicDisplayEnd: string;
  purposesIds: number[];
  serviceSectorId: number;
  applicationRoundBaskets: ApplicationRoundBasket[];
  status: ApplicationRoundStatus;
  statusTimestamp: string;
  allocating: boolean;
  isAdmin: boolean;
  approvedBy: string;
  applicationsSent: boolean;
};

export type Space = {
  id: number;
  locationType: "fixed";
  name: TranslationObject;
  parent: number;
  building: number;
  surfaceArea: null;
};

export type Resource = {
  id: number;
  name: TranslationObject;
  locationType: "fixed";
  space: number;
  bufferTimeBefore: string;
  bufferTimeAfter: string;
};

export type Service = {
  id: number;
  name: TranslationObject;
  serviceType: "introduction";
  bufferTimeBefore: string;
  bufferTimeAfter: string;
};

export type Location = {
  id: number;
  addressStreet: string;
  addressZip: string;
  addressCity: string;
};

export type Image = {
  imageUrl: string;
  smallUrl: string;
  mediumUrl: string;
  imageType: "main" | "map" | "ground_plan" | "other";
};

type ReservationUnitBuilding = {
  id: number;
  district: number | null;
  name: string | null;
  realEstate: string | null;
  surfaceArea: string | null;
};

export type ReservationUnit = {
  id: number;
  name: TranslationObject;
  maxPersons: number;
  requireIntroduction: boolean;
  spaces: Space[];
  resources: Resource[];
  services: Service[];
  images: Image[];
  location: Location;
  reservationUnitType: Parameter;
  building: ReservationUnitBuilding;
  purposes: Parameter[];
};

export type Parameter = {
  id: number;
  name?: string;
  minimum?: number;
  maximum?: number;
};

export type ApplicationStatus =
  | "draft"
  | "in_review"
  | "review_done"
  | "declined"
  | "cancelled"
  | "approved"
  | "sent";

export type ApplicationAggregatedData = {
  appliedMinDurationTotal?: number;
  appliedReservationsTotal?: number;
  createdReservationsTotal?: number;
  reservationsDurationTotal?: number;
};

export type ApplicantType =
  | "individual"
  | "association"
  | "community"
  | "company";

export type Application = {
  id: number;
  status: ApplicationStatus;
  applicationRoundId: number;
  applicantType: ApplicantType | null;
  applicantId: number | null;
  applicantName: string | null;
  applicantEmail: string | null;
  homeCityId: number | null;
  organisation: Organisation | null;
  contactPerson: ContactPerson | null;
  billingAddress: Address | null;
  applicationEvents: ApplicationEvent[];
  aggregatedData: ApplicationAggregatedData;
  createdDate: string | null;
  lastModifiedDate: string | null;
};

export type Organisation = {
  id?: number;
  name: string | null;
  identifier: string | null;
  yearEstablished: number | null;
  activeMembers: number | null;
  coreBusiness: string | null;
  address: Address | null;
  email: string | null;
};

export type ContactPerson = {
  id?: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
};

export type Address = {
  id: number;
  streetAddress: string | null;
  postCode: string | null;
  city: string | null;
};

export type ApplicationEventAggregatedData = {
  durationTotal: number;
  reservationsTotal: number;
  allocationResultsDurationTotal: number;
  allocationResultsReservationsTotal: number;
};

export type ApplicationEvent = {
  id: number;
  name: string | null;
  numPersons: number | null;
  ageGroupId: number | null;
  ageGroupDisplay: AgeGroupDisplay;
  abilityGroupId: number | null;
  purposeId: number | null;
  purpose: string | null;
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
  declinedReservationUnitIds: number[];
  aggregatedData: ApplicationEventAggregatedData;
};

export type ApplicationEventStatus =
  | "created"
  | "allocated"
  | "validated"
  | "approved"
  | "declined"
  | "ignored";

interface AgeGroupDisplay {
  id?: number;
  minimum: number;
  maximum: number;
}

export type EventReservationUnit = {
  id: number;
  priority: number;
  reservationUnitId: number;
  reservationUnitDetails: ReservationUnit;
};

type DAY = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ApplicationEventSchedule = {
  id: number;
  day: DAY;
  begin: string;
  end: string;
};

export interface ReservationUnitsParameters {
  applicationRound?: number;
  search?: string;
  purpose?: number;
  reservationUnitType?: number;
}

export interface DataFilterOption {
  key: string;
  value?: string | number;
  title: string | null;
}
export interface DataFilterConfig {
  title: string;
  filters: DataFilterOption[] | null;
}

export type OptionType = {
  label: string;
  value: string | number | null;
};

export interface DataGroup {
  id: number;
  space?: AllocatedSpace;
  reservationUnit?: AllocatedReservationUnit;
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface AllocationResult {
  id: number;
  applicationEvent: ApplicationEvent;
  applicationId: number | null;
  applicantName: string | null;
  applicantId: number | null;
  applicantType: string | null;
  aggregatedData: AllocationResultAggregatedData;
  organisationId: number | null;
  organisationName: string | null;
  unitName: string | null;
  allocatedReservationUnitId: number | null;
  allocatedReservationUnitName: string | null;
  applicationEventScheduleId: number | null;
  allocatedDuration: string | null;
  allocatedDay: number | null;
  allocatedBegin: string | null;
  allocatedEnd: string | null;
  applicationAggregatedData: ApplicationAggregatedData;
  basketName: string | null;
  basketOrderNumber: string | null;
  accepted: boolean;
  declined: boolean;
}

export interface AllocationResultAggregatedData {
  durationTotal: number;
  reservationsTotal: number;
}

export interface AllocationRequest {
  id: number;
  applicationRoundBasketIds: number[];
  applicationRoundId: number;
  completed: boolean;
  startDate: string | null;
  endDate: string | null;
}

export interface AllocatedSpace {
  id: number | null;
  name: string | null;
}

export interface AllocatedReservationUnit {
  id?: number;
  name: string | null;
}

export interface GroupedAllocationResult {
  id: number;
  space: AllocatedSpace;
  reservationUnit: AllocatedReservationUnit;
  data: AllocationResult[];
}

export type ParameterTypes =
  | "ageGroup"
  | "purpose"
  | "abilityGroup"
  | "reservationUnitType"
  | "equipmentCategory"
  | "equipment"
  | "city";

export interface ParameterAgeGroup {
  id: number;
  minimum: number;
  maximum: number;
}

export interface ParameterDefault {
  id: number;
  name: string;
}

export interface ApplicationEventsDeclinedReservationUnits {
  id: number;
  declinedReservationUnitIds: number[];
}

export interface RecurringReservation {
  id: number;
  applicationId: number;
  applicationEventId: number;
  ageGroup: AgeGroupDisplay;
  purposeName: string | null;
  groupSize: number | null;
  abilityGroupId: number | null;
  biweekly: boolean;
  beginWeekday: number | null;
  firstReservationBegin: string | null;
  lastReservationEnd: string | null;
  reservations: Reservation[];
  deniedReservations: Reservation[];
}

export interface Reservation {
  id: number;
  state: ReservationStatus;
  priority: ReservationPriority;
  userId: number | null;
  beginWeekday: number | null;
  begin: string;
  end: string;
  bufferTimeBefore: string | null;
  bufferTimeAfter: string | null;
  applicationEventName: string | null;
  reservationUser: string | null;
  reservationUnit: ReservationUnit[];
  recurringReservation: number | null;
}

export interface ReservationModified extends Reservation {
  applicationEventId: number;
}

export type ReservationStatus =
  | "created"
  | "cancelled"
  | "confirmed"
  | "denied"
  | "requested"
  | "waiting_for_payment";

export type ReservationPriority = 100 | 200 | 300;

export interface ReservationUnitCapacity {
  id: number;
  hourCapacity: number;
  reservationDurationTotal: number;
  periodStart: string;
  periodEnd: string;
}

export interface ReservationUnitCalendarUrl {
  calendarUrl: string;
}
