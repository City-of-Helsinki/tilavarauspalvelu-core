export type TranslationObject = {
  [key: string]: string;
};

export type ApplicationPeriod = {
  id: number;
  name: string;
  reservationUnits: number[];
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
  purposes: number[];
};

export type Space = {
  id: number;
  locationType: 'fixed';
  name: TranslationObject;
  parent: number;
  building: number;
  surfaceArea: null;
};

export type Resource = {
  id: number;
  name: TranslationObject;
  locationType: 'fixed';
  space: number;
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

/*
{
  "id": 45,
  "organisation": {
    "id": null,
    "name": "123",
    "identifier": "123",
    "year_established": null
  },
  "application_period_id": 1,
  "contact_person": {
    "id": null,
    "first_name": "123",
    "last_name": "333",
    "email": "",
    "phone_number": ""
  },
  "application_events": [
    {
      "name": "sss433",
      "application_event_schedules": [
        {
          "id": 38,
          "day": 1,
          "begin": "10:40",
          "end": "16:30"
        },
        {
          "day": 1,
          "begin": "10:40",
          "end": "16:30"
        }
      ],
      "num_persons": null,
      "age_group_id": 1,
      "ability_group_id": 1,
      "min_duration": 123,
      "max_duration": 4444,
      "application_id": 1,
      "events_per_week": 1,
      "biweekly": false,
      "begin": "2015-01-1",
      "end": "2020-01-01",
      "purpose_id": 1,
      "event_reservation_units": [
        {
          "priority": 22,
          "reservation_unit": 1
        }
      ]
    }
  ]
}
*/

export type Application = {
  id?: number;
  status:
    | 'draft'
    | 'in_review'
    | 'review done'
    | 'allocating'
    | 'allocated'
    | 'validated'
    | 'approved'
    | 'declined'
    | 'cancelled';
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
  status:
    | 'created'
    | 'allocating'
    | 'allocated'
    | 'validated'
    | 'approved'
    | 'declined'
    | 'cacelled';
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
