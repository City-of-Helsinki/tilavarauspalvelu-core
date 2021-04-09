export type TranslationObject = {
  fi?: string;
  en?: string;
  sv?: string;
};

export type ApplicationRound = {
  id: number;
  name: string;
  reservationUnitIds: number[];
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
  purposeIds: number[];
  criteria: string;
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

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Location = {
  id: number;
  addressStreet: string;
  addressZip: string;
  addressCity: string;
  coordinates?: Coordinates;
};

export type Image = {
  imageUrl: string;
  mediumUrl: string;
  smallUrl: string;
  imageType: 'main' | 'map' | 'ground_plan' | 'other';
};

export type Building = {
  name: string;
};

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
  termsOfUse: string;
  building: Building;
  unitId: number;
};

export type Parameter = {
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

export type ApplicantType =
  | null
  | 'individual'
  | 'association'
  | 'community'
  | 'company';

export type Application = {
  id?: number;
  applicantType: ApplicantType;
  status:
    | 'draft'
    | 'in_review'
    | 'review_done'
    | 'allocating'
    | 'allocated'
    | 'validated'
    | 'handled'
    | 'declined'
    | 'cancelled';
  applicationRoundId: number;
  organisation: Organisation | null;
  contactPerson: ContactPerson | null;
  applicationEvents: ApplicationEvent[];
  billingAddress: Address | null;
  homeCityId: number | null;
};

export type Organisation = {
  id?: number;
  name: string | null;
  description: string;
  identifier: string | null;
  yearEstablished: number | null;
  coreBusiness: string;
  address: Address;
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
  minDuration: string | null;
  maxDuration: string | null;
  eventsPerWeek: number;
  biweekly: boolean;
  begin: string | null;
  end: string | null;
  applicationId: number;
  eventReservationUnits: EventReservationUnit[];
  applicationEventSchedules: ApplicationEventSchedule[];
  status:
    | 'created'
    | 'allocating'
    | 'allocated'
    | 'validated'
    | 'approved'
    | 'declined'
    | 'cancelled';
};

export type EventReservationUnit = {
  priority: number;
  reservationUnitId: number;
};

export type DAY = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ApplicationEventSchedule = {
  id?: number;
  day: DAY;
  begin: string;
  end: string;
};

// for ui:

export type OptionType = {
  label: string;
  value?: number | string;
};

export type Action = {
  type:
    | 'load'
    | 'addNewApplicationEvent'
    | 'save'
    | 'toggleAccordionState'
    | 'removeApplicationEvent';
  application?: Application;
  savedEventId?: number;
  eventId?: number;
  params?: { [key: string]: string };
};

export type ApplicationEditor = {
  application: Application;
  reservationUnits: ReservationUnit[];
};

export type FormType = undefined | 'individual' | 'organisation' | 'company';

export type LocalizationLanguages = 'fi' | 'sv' | 'en';

export type EditorState = {
  loading: boolean;
  application: Application;
  savedEventId?: number;
  accordionStates: AccordionState[];
};

export type AccordionState = {
  applicationEventId: number | null; // null is used for non saved event
  open: boolean;
};

export type Cell = {
  hour: number;
  label: string;
  state: boolean;
  key: string;
};
