import { filterNonNullable } from "common/src/helpers";
import type {
  EventReservationUnit,
  ApplicationEventSchedulePriority,
} from "common/types/common";
import {
  type ApplicationEventType,
  ApplicationEventStatus,
  type OrganisationType,
  type AddressType,
  type PersonType,
  type ApplicationStatus,
  type ApplicationsApplicationApplicantTypeChoices,
} from "common/types/gql-types";
// TODO replace these with form types
import { type Maybe } from "graphql/jsutils/Maybe";
import { apiDateToUIDate } from "@/modules/util";

// export type ApplicationEventScheduleFormType = Omit<ApplicationEventScheduleType, 'id'>[];
export type ApplicationEventScheduleFormType = {
  day: Day;
  begin: string;
  end: string;
  priority: ApplicationEventSchedulePriority;
};

// TODO move to application level and reuse the form type
export type ApplicationEventFormValue = {
  // TODO change to pk: 0 for new events, 0 > for existing events
  pk?: number;
  name: string | null;
  numPersons: number | null;
  // TODO remove ids from parameters
  ageGroup: number | null;
  abilityGroup: number | null;
  purpose: number | null;
  minDuration: number;
  maxDuration: number;
  eventsPerWeek: number;
  biweekly: boolean;
  // TODO date?
  begin: string | null;
  end: string | null;
  // TODO this should not be needed anymore
  applicationId: number;
  applicationEventSchedules: ApplicationEventScheduleFormType[];
  status: ApplicationEventStatus;
  // TODO replace with form type (don't reuse the REST type)
  reservationUnits: EventReservationUnit[];
};

// TODO write the conversion other way around also
export const transformApplicationEventToForm = (
  applicationEvent: ApplicationEventType
): ApplicationEventFormValue => ({
  pk: applicationEvent.pk ?? undefined,
  name: applicationEvent.name,
  numPersons: applicationEvent.numPersons ?? null,
  ageGroup: applicationEvent.ageGroup?.pk ?? null,
  abilityGroup: applicationEvent.abilityGroup?.pk ?? null,
  purpose: applicationEvent.purpose?.pk ?? null,
  minDuration: applicationEvent.minDuration ?? 0,
  maxDuration: applicationEvent.maxDuration ?? 0,
  eventsPerWeek: applicationEvent.eventsPerWeek ?? 0,
  biweekly: applicationEvent.biweekly ?? false,
  applicationId: applicationEvent.application?.pk ?? 0,
  reservationUnits: filterNonNullable(
    applicationEvent.eventReservationUnits
  ).map((eru) => ({
    // TODO remove ids
    id: eru.pk ?? undefined,
    priority: eru.priority ?? 0,
    reservationUnitId: eru.reservationUnit?.pk ?? 0,
    // TODO what is needed here? where is this used, and what of it? narrow the type
    reservationUnit: eru.reservationUnit ?? null,
  })),
  applicationEventSchedules: filterNonNullable(
    applicationEvent.applicationEventSchedules
  ).map((aes) => ({
    pk: aes.pk ?? undefined,
    day: (aes.day ?? 0) as Day,
    begin: aes.begin ?? "",
    end: aes.end ?? "",
    priority: aes.priority === 200 || aes.priority === 300 ? aes.priority : 100,
  })),
  status: applicationEvent.status ?? ApplicationEventStatus.Created,
  // TODO remove the format hacks
  begin:
    applicationEvent?.begin != null && applicationEvent?.begin?.includes("-")
      ? apiDateToUIDate(applicationEvent.begin)
      : applicationEvent?.begin ?? null,
  end:
    applicationEvent?.end != null && applicationEvent?.end?.includes("-")
      ? apiDateToUIDate(applicationEvent.end)
      : applicationEvent?.end ?? null,
});

type AddressFormValue = {
  pk: number | undefined;
  streetAddress: string;
  city: string;
  postCode: string;
};
export type OrganisationFormValues = {
  pk: number | null;
  name: string;
  identifier: string | null;
  yearEstablished: number | null;
  coreBusiness: string;
  address: AddressFormValue;
};
type PersonFormValues = {
  pk: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

export const convertPerson = (p: Maybe<PersonType>): PersonFormValues => ({
  pk: p?.pk ?? null,
  firstName: p?.firstName ?? "",
  lastName: p?.lastName ?? "",
  email: p?.email ?? "",
  phoneNumber: p?.phoneNumber ?? "",
});

export const convertAddress = (a: Maybe<AddressType>): AddressFormValue => ({
  pk: a?.pk ?? undefined,
  streetAddress: a?.streetAddress ?? "",
  city: a?.city ?? "",
  postCode: a?.postCode ?? "",
});

export const convertOrganisation = (
  o: Maybe<OrganisationType>
): OrganisationFormValues => ({
  pk: o?.pk ?? null,
  name: o?.name ?? "",
  identifier: o?.identifier ?? null,
  yearEstablished: o?.yearEstablished ?? 0,
  coreBusiness: o?.coreBusiness ?? "",
  address: convertAddress(o?.address),
});

export type ApplicationFormValues = {
  pk?: number;
  applicantType: ApplicationsApplicationApplicantTypeChoices;
  // TODO these (status and round) needs to be hidden fields
  // status is changed on the final page
  status: ApplicationStatus;
  // TODO remove id (also does this need to be sent?)
  applicationRoundId: number;
  applicationEvents: ApplicationEventFormValue[];
  organisation: OrganisationFormValues;
  contactPerson: PersonFormValues;
  billingAddress: AddressFormValue;
  // this is not submitted, we can use it to remove the billing address from submit without losing the frontend state
  hasBillingAddress: boolean;
  additionalInformation: string;
  // TODO remove id
  homeCityId: number;
  // TODO are these needed?
  createdDate?: string;
  lastModifiedDate?: string;
};
