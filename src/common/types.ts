export type TranslationObject = {
  [key: string]: string;
};

export type ApplicationRoundStatus = "draft";

export type ApplicationRound = {
  id: number;
  name: string;
  reservationUnitIds: number[];
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
  publicDisplayBegin: string;
  publicDisplayEnd: string;
  purposesIds: number[];
  serviceSectorId: number;
  status: ApplicationRoundStatus;
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
  imageType: "main" | "map" | "ground_plan" | "other";
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
  | "allocating"
  | "allocated"
  | "validated"
  | "handled"
  | "declined"
  | "cancelled";

export type AggregatedData = {
  [name: string]: string | number;
};

export type ProcessedData = {
  reservationsTotal?: number;
  minDurationTotal?: number;
};

export type Application = {
  [key: string]: any;
  id: number;
  status: ApplicationStatus;
  applicationRoundId: number;
  organisation: Organisation | null;
  contactPerson: ContactPerson | null;
  applicationEvents: ApplicationEvent[];
  aggregatedData: AggregatedData[];
  processedData: ProcessedData;
};

export type Organisation = {
  id?: number;
  name: string | null;
  identifier: string | null;
  yearEstablished: number | null;
  activeMembers?: null;
};

export type ContactPerson = {
  id?: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
};

export type ApplicationEvent = {
  id?: number;
  name: string | null;
  numPersons: number | null;
  ageGroupId: number | null;
  abilityGroupId: number | null;
  purposeId: number | null;
  minDuration: number | null;
  maxDuration: number | null;
  eventsPerWeek: number;
  biweekly: boolean;
  begin: string | null;
  end: string | null;
  applicationId: number;
  eventReservationUnits: EventReservationUnit[];
  applicationEventSchedules: ApplicationEventSchedule[];
  status:
    | "created"
    | "allocating"
    | "allocated"
    | "validated"
    | "approved"
    | "declined"
    | "cancelled";
};

export type EventReservationUnit = {
  priority: number;
  reservationUnit: number;
};

type DAY = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ApplicationEventSchedule = {
  id?: number;
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
  title: string;
}
export interface DataFilterConfig {
  title: string;
  filters?: DataFilterOption[];
}
