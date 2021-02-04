export type TranslationObject = {
  [key: string]: string;
};

export type ApplicationPeriod = {
  id: number;
  name: string;
  reservationUnitsIds: number[];
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
  purposeIds: number[];
};

export type Space = {
  id: number;
  locationType: 'fixed';
  name: TranslationObject;
  parentId: number;
  buildingId: number;
  surfaceArea: null;
  districtId: number;
};

export type Resource = {
  id: number;
  name: TranslationObject;
  locationType: 'fixed';
  spaceId: number;
  bufferTimeBefore: string;
  bufferTimeAfter: string;
};

export type Service = {
  id: number;
  name: TranslationObject;
  serviceType: 'introduction';
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
  imageType: 'main' | 'map' | 'ground_plan' | 'other';
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
  name?: TranslationObject | string;
  minimum?: number;
  maximum?: number;
};

export type Application = {
  id?: number;
  status: 'draft' | 'review';
  applicationPeriodId: number;
  organisation: Organisation | null;
  contactPerson: ContactPerson | null;
  applicationEvents: ApplicationEvent[];
};

export type Organisation = {
  id?: number;
  name: string | null;
  identifier: string | null;
  yearEstablished: number | null;
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
};

export type EventReservationUnit = {
  priority: number;
  reservationUnitId: number;
};

type DAY = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ApplicationEventSchedule = {
  id?: number;
  day: DAY;
  begin: string;
  end: string;
};

// editor context

export type Action = {
  type: 'load' | 'ensureContactPersonExists' | 'addNewApplicationEvent';
  data?: Application;
  params?: { [key: string]: string };
};

export type ApplicationEditor = {
  application: Application;
  reservationUnits: ReservationUnit[];
};

// /editor context
