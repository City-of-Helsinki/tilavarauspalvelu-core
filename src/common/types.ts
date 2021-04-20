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
  | "handling";

export type ApplicationRoundBasket = any; // eslint-disable-line

export type ApplicationRound = {
  id: number;
  name: TranslationObject;
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
  allocating: boolean;
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
  | "allocating"
  | "allocated"
  | "validated"
  | "handled"
  | "declined"
  | "cancelled";

export type AggregatedData = {
  reservationsTotal?: number;
  minDurationTotal?: number;
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
  organisation: Organisation | null;
  contactPerson: ContactPerson | null;
  billingAddress: Address | null;
  applicationEvents: ApplicationEvent[];
  aggregatedData: AggregatedData;
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

export type ApplicationEvent = {
  id?: number;
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
};

export type ApplicationEventStatus =
  | "created"
  | "allocating"
  | "allocated"
  | "validated"
  | "approved"
  | "declined"
  | "cancelled";

interface AgeGroupDisplay {
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
  data: any;
}

export interface AllocationResult {
  applicationEvent: ApplicationEvent;
  applicationId: number | null;
  applicantName: string | null;
  applicantId: number | null;
  organisationName: string | null;
  unitName: string | null;
  allocatedReservationUnitId: number | null;
  allocatedReservationUnitName: string | null;
  applicationEventScheduleId: number | null;
  allocatedDuration: string | null;
  allocatedDay: string | null;
  allocatedBegin: string | null;
  allocatedEnd: string | null;
  applicationAggregatedData: AggregatedData;
  basketName: string | null;
  basketOrderNumber: string | null;
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

export type RecommendationStatus =
  | "created"
  | "allocating"
  | "allocated"
  | "validated"
  | "approved"
  | "declined"
  | "cancelled";

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
  minumum: number;
  maximum: number;
}

export interface ParameterDefault {
  id: number;
  name: string;
}
