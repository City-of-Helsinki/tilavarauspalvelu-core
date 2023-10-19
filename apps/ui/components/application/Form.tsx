import { filterNonNullable } from "common/src/helpers";
import type {
  Application,
  ApplicationEventSchedule,
  EventReservationUnit,
} from "common/types/common";
import {
  type ApplicationEventType,
  ApplicationEventStatus,
  OrganisationType,
  AddressType,
  PersonType,
} from "common/types/gql-types";
// TODO replace these with form types
import type { Address, ContactPerson, Organisation } from "common/types/common";
import { Maybe } from "graphql/jsutils/Maybe";
import { apiDateToUIDate } from "@/modules/util";

// TODO move to application level and reuse the form type
export type ApplicationEventFormValue = {
  // TODO change to pk: 0 for new events, 0 > for existing events
  id?: number;
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
  // TODO replace with form type (don't reuse the REST type)
  reservationUnits: EventReservationUnit[];
  applicationEventSchedules: ApplicationEventSchedule[];
  status: ApplicationEventStatus;
};

// TODO write the conversion other way around also
export const transformApplicationEventToForm = (
  applicationEvent: ApplicationEventType
): ApplicationEventFormValue => ({
  id: applicationEvent.pk ?? undefined,
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
    id: aes.pk ?? undefined,
    day: (aes.day ?? 0) as Day,
    begin: aes.begin ?? "",
    end: aes.end ?? "",
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

type OrganisationFormValues = Omit<Organisation, "description">;
type AddressFormValue = Address;

export const convertPerson = (p: Maybe<PersonType>): ContactPerson => ({
  id: p?.pk ?? 0,
  firstName: p?.firstName ?? "",
  lastName: p?.lastName ?? "",
  email: p?.email ?? "",
  phoneNumber: p?.phoneNumber ?? "",
});

export const convertAddress = (a: Maybe<AddressType>): AddressFormValue => ({
  id: a?.pk ?? 0,
  streetAddress: a?.streetAddress ?? "",
  city: a?.city ?? "",
  postCode: a?.postCode ?? "",
});

export const convertOrganisation = (
  o: Maybe<OrganisationType>
): OrganisationFormValues => ({
  id: o?.pk ?? 0,
  name: o?.name ?? "",
  identifier: o?.identifier ?? null,
  yearEstablished: o?.yearEstablished ?? 0,
  coreBusiness: o?.coreBusiness ?? "",
  address: convertAddress(o?.address),
});

export type ApplicationFormValues = Omit<Application, "applicationEvents"> & {
  applicationEvents: ApplicationEventFormValue[];
  organisation: Organisation;
  contactPerson: ContactPerson;
  billingAddress: Address;
  additionalInformation: string;
  // TODO
  homeCityId: number;
};
