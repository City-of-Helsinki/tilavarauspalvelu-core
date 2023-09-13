import {
  Address,
  ApplicantType,
  ApplicationEventSchedule,
  ApplicationEventStatus,
  ApplicationStatus,
  ContactPerson,
  Organisation,
} from "common/types/common";

type ApplicationForm = {
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

export type EventReservationUnit = {
  priority: number;
  reservationUnitId: number;
};

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

export default ApplicationForm;
