import { filterNonNullable } from "common/src/helpers";
import {
  Applicant_Type,
  type ApplicationEventNode,
  type AddressNode,
  type PersonNode,
  type OrganisationNode,
  ApplicationsApplicationApplicantTypeChoices,
  type UpdateEventReservationUnitSerializerInput,
  type UpdateApplicationEventScheduleInEventSerializerInput,
  type ApplicationNode,
  type ApplicationUpdateMutationInput,
} from "common/types/gql-types";
import { type Maybe } from "graphql/jsutils/Maybe";
import { z } from "zod";
import type {
  ApplicationEventSchedulePriority,
  ReservationUnitNode,
} from "common";
import { toApiDate } from "common/src/common/util";
import { apiDateToUIDate, fromUIDate } from "@/modules/util";

// NOTE the zod schemas have a lot of undefineds because the form is split into four pages
// so you can't trust some of the zod validation (e.g. mandatory fields)
// real solution is to split the forms per page so we have four schemas
// the new mutation interface allows only updating the fields that are present
// also then all manual validations and setErrors should be removed

export const ApplicationEventScheduleFormTypeSchema = z.object({
  day: z.number().min(0).max(6),
  begin: z.string(),
  end: z.string(),
  priority: z.number(),
});

export type ApplicationEventScheduleFormType = z.infer<
  typeof ApplicationEventScheduleFormTypeSchema
>;

const ApplicationEventFormValueSchema = z
  .object({
    pk: z.number().optional(),
    name: z.string().min(1, { message: "Required" }),
    numPersons: z.number().min(1),
    ageGroup: z.number().refine((s) => s, { path: [""], message: "Required" }),
    abilityGroup: z.number().optional(),
    purpose: z.number().refine((s) => s, { path: [""], message: "Required" }),
    minDuration: z.number().min(1, { message: "Required" }),
    maxDuration: z.number().min(1, { message: "Required" }),
    eventsPerWeek: z.number().min(1),
    biweekly: z.boolean(),
    begin: z
      .string()
      .optional()
      .refine((s) => s, { path: [""], message: "Required" }),
    end: z
      .string()
      .optional()
      .refine((s) => s, { path: [""], message: "Required" }),
    applicationEventSchedules: z.array(ApplicationEventScheduleFormTypeSchema),
    reservationUnits: z.array(z.number()).min(1, { message: "Required" }),
    // extra page prop, not saved to backend
    accordionOpen: z.boolean(),
    // form specific: new events don't have pks and we need a unique identifier
    formKey: z.string(),
  })
  .refine((s) => s.maxDuration >= s.minDuration, {
    path: ["maxDuration"],
    message: "Maximum duration must be greater than minimum duration",
  })
  .refine((s) => s.begin && s.end && fromUIDate(s.begin) < fromUIDate(s.end), {
    path: ["end"],
    message: "End date must be after begin date",
  });

export type ApplicationEventFormValue = z.infer<
  typeof ApplicationEventFormValueSchema
>;

export const transformApplicationEventToForm = (
  applicationEvent: ApplicationEventNode
): ApplicationEventFormValue => ({
  pk: applicationEvent.pk ?? undefined,
  formKey: applicationEvent.pk ? `event-${applicationEvent.pk}` : "event-NEW",
  name: applicationEvent.name,
  numPersons: applicationEvent.numPersons ?? 0,
  ageGroup: applicationEvent.ageGroup?.pk ?? 0,
  // TODO not present in the form?
  abilityGroup: applicationEvent.abilityGroup?.pk ?? undefined,
  purpose: applicationEvent.purpose?.pk ?? 0,
  minDuration: applicationEvent.minDuration ?? 0,
  maxDuration: applicationEvent.maxDuration ?? 0,
  eventsPerWeek: applicationEvent.eventsPerWeek ?? 0,
  biweekly: applicationEvent.biweekly ?? false,
  reservationUnits: filterNonNullable(applicationEvent.eventReservationUnits)
    .sort((a, b) =>
      a.preferredOrder && b.preferredOrder
        ? a.preferredOrder - b.preferredOrder
        : 0
    )
    .map((eru) => eru.reservationUnit?.pk ?? 0)
    .filter((pk) => pk > 0),
  // schedules are only used for page2 form
  applicationEventSchedules: filterNonNullable(
    applicationEvent.applicationEventSchedules
  ).map((aes) => ({
    pk: aes.pk ?? undefined,
    day: aes.day ?? 0,
    begin: aes.begin ?? "",
    end: aes.end ?? "",
    priority: aes.priority ?? 50,
  })),
  // TODO remove the format hacks
  begin:
    applicationEvent.begin != null && applicationEvent.begin.includes("-")
      ? apiDateToUIDate(applicationEvent.begin)
      : applicationEvent?.begin ?? undefined,
  end:
    applicationEvent.end != null && applicationEvent.end.includes("-")
      ? apiDateToUIDate(applicationEvent.end)
      : applicationEvent.end ?? undefined,
  accordionOpen: false,
});

export const AddressFormValueSchema = z.object({
  pk: z.number().optional(),
  streetAddress: z.string(),
  city: z.string(),
  postCode: z.string(),
});
export type AddressFormValues = z.infer<typeof AddressFormValueSchema>;

// TODO identifier is only optional for Associations (not for Companies / Communities)
export const OrganisationFormValuesSchema = z.object({
  pk: z.number().optional(),
  name: z.string().min(1).max(255),
  identifier: z.string().optional(),
  yearEstablished: z.number().optional(),
  coreBusiness: z.string().min(1).max(255),
  address: AddressFormValueSchema,
});
export type OrganisationFormValues = z.infer<
  typeof OrganisationFormValuesSchema
>;

export const PersonFormValuesSchema = z.object({
  pk: z.number().optional(),
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  email: z.string().min(1).max(255).email(),
  phoneNumber: z.string().min(1).max(255),
});
export type PersonFormValues = z.infer<typeof PersonFormValuesSchema>;

export const convertPerson = (p: Maybe<PersonNode>): PersonFormValues => ({
  pk: p?.pk ?? undefined,
  firstName: p?.firstName ?? "",
  lastName: p?.lastName ?? "",
  email: p?.email ?? "",
  phoneNumber: p?.phoneNumber ?? "",
});

// TODO are these converters the wrong way around? (not input, but output)
export const convertAddress = (a: Maybe<AddressNode>): AddressFormValues => ({
  pk: a?.pk ?? undefined,
  streetAddress: a?.streetAddress ?? "",
  city: a?.city ?? "",
  postCode: a?.postCode ?? "",
});

export const convertOrganisation = (
  o: Maybe<OrganisationNode>
): OrganisationFormValues => ({
  pk: o?.pk ?? undefined,
  name: o?.name ?? "",
  identifier: o?.identifier ?? "",
  yearEstablished: o?.yearEstablished ?? 0,
  coreBusiness: o?.coreBusiness ?? "",
  address: convertAddress(o?.address),
});

// There is an issue with the type of the data returned by the query (double enums with same values)
export const convertApplicantType = (
  type: Maybe<ApplicationsApplicationApplicantTypeChoices> | undefined
): Applicant_Type => {
  switch (type) {
    case ApplicationsApplicationApplicantTypeChoices.Individual:
      return Applicant_Type.Individual;
    case ApplicationsApplicationApplicantTypeChoices.Company:
      return Applicant_Type.Company;
    case ApplicationsApplicationApplicantTypeChoices.Association:
      return Applicant_Type.Association;
    case ApplicationsApplicationApplicantTypeChoices.Community:
      return Applicant_Type.Community;
    default:
      return Applicant_Type.Individual;
  }
};

const ApplicantTypeSchema = z.enum([
  Applicant_Type.Individual,
  Applicant_Type.Company,
  Applicant_Type.Association,
  Applicant_Type.Community,
]);
export const ApplicationFormSchema = z.object({
  pk: z.number(),
  applicantType: ApplicantTypeSchema,
  // TODO remove id (also does this need to be sent?)
  applicationEvents: z
    .array(ApplicationEventFormValueSchema.optional())
    .optional(),
});

// TODO refine the form (different applicant types require different fields)
// if applicantType === Organisation | Company => organisation.identifier is required
// if hasBillingAddress | applicantType === Individual => billingAddress is required
export const ApplicationFormPage3Schema = z.object({
  pk: z.number(),
  applicantType: ApplicantTypeSchema,
  organisation: OrganisationFormValuesSchema.optional(),
  contactPerson: PersonFormValuesSchema.optional(),
  billingAddress: AddressFormValueSchema.optional(),
  // this is not submitted, we can use it to remove the billing address from submit without losing the frontend state
  hasBillingAddress: z.boolean().optional(),
  additionalInformation: z.string().optional(),
  homeCity: z.number().optional(),
});
export type ApplicationFormPage3Values = z.infer<
  typeof ApplicationFormPage3Schema
>;

export type ApplicationFormValues = z.infer<typeof ApplicationFormSchema>;

/// form -> API transformers, enforce return types so API changes cause type errors

const transformDateString = (date?: string | null): string | undefined =>
  date != null && toApiDate(fromUIDate(date)) != null
    ? toApiDate(fromUIDate(date))
    : undefined;

type ApplicationEventScheduleFormValues = Omit<
  NonNullable<
    NonNullable<ApplicationFormValues["applicationEvents"]>[0]
  >["applicationEventSchedules"][0],
  "priority"
> & {
  priority: ApplicationEventSchedulePriority;
};

const transformApplicationEventSchedule = (
  aes: ApplicationEventScheduleFormValues
): UpdateApplicationEventScheduleInEventSerializerInput => {
  return {
    day: aes.day,
    // Time format (HH:MM)
    begin: aes.begin,
    end: aes.end,
    priority: aes.priority,
  };
};

const transformEventReservationUnit = (
  pk: number,
  priority: number
): UpdateEventReservationUnitSerializerInput => ({
  preferredOrder: priority,
  reservationUnit: pk,
});

const transformApplicationEvent = (
  ae: NonNullable<NonNullable<ApplicationFormValues["applicationEvents"]>[0]>
) => {
  return {
    ...(transformDateString(ae.begin) != null
      ? { begin: transformDateString(ae.begin) }
      : {}),
    ...(transformDateString(ae.end) != null
      ? { end: transformDateString(ae.end) }
      : {}),
    pk: ae.pk,
    name: ae.name,
    numPersons: ae.numPersons ?? 0,
    // these (pks) can never be zero or null in the current version
    // even if there are no abilityGroups in the database...
    // so for now default them to 1 and have another look after the backend change is merged
    ...(ae.abilityGroup != null ? { abilityGroup: ae.abilityGroup } : {}),
    ...(ae.ageGroup != null ? { ageGroup: ae.ageGroup } : {}),
    ...(ae.purpose != null ? { purpose: ae.purpose } : {}),
    // min / max duration is a weird string format in the API
    minDuration: String(ae.minDuration ?? 0), // "3600" == 1h
    maxDuration: String(ae.maxDuration ?? 0), // "7200" == 2h
    // API Date format (YYYY-MM-DD)
    // not mandatory in the input but what is the default value?
    ...(transformDateString(ae.begin) != null
      ? { begin: transformDateString(ae.begin) }
      : {}),
    ...(transformDateString(ae.end) != null
      ? { end: transformDateString(ae.end) }
      : {}),
    biweekly: ae.biweekly,
    eventsPerWeek: ae.eventsPerWeek,
    applicationEventSchedules: ae.applicationEventSchedules
      ?.filter(
        (aes): aes is ApplicationEventScheduleFormValues => aes.priority != null
      )
      .map((aes) => transformApplicationEventSchedule(aes)),
    eventReservationUnits: ae.reservationUnits?.map((eruPk, eruIndex) =>
      transformEventReservationUnit(eruPk, eruIndex)
    ),
  };
};

// For pages 1 and 2
export const transformApplication = (
  values: ApplicationFormValues
): ApplicationUpdateMutationInput => {
  const appEvents = filterNonNullable(values.applicationEvents);
  return {
    pk: values.pk,
    applicantType: values.applicantType,
    applicationEvents: appEvents.map((ae) => transformApplicationEvent(ae)),
  };
};

export const convertApplicationToForm = (
  app: Maybe<ApplicationNode> | undefined,
  reservationUnits: ReservationUnitNode[]
): ApplicationFormValues => {
  const formAes = filterNonNullable(app?.applicationEvents).map((ae) =>
    transformApplicationEventToForm(ae)
  );
  // TODO do we need to set default values?
  const defaultAes: (typeof formAes)[0] = {
    pk: undefined,
    name: "",
    formKey: "event-NEW",
    numPersons: 0,
    abilityGroup: undefined,
    ageGroup: 0,
    purpose: 0,
    minDuration: 0,
    maxDuration: 0,
    begin: undefined,
    end: undefined,
    biweekly: false,
    eventsPerWeek: 1,
    applicationEventSchedules: [],
    reservationUnits: reservationUnits
      .map((ru) => ru.pk)
      .filter((pk): pk is number => pk != null),
    accordionOpen: true,
  };
  return {
    pk: app?.pk ?? 0,
    applicantType: convertApplicantType(app?.applicantType),
    applicationEvents: formAes.length > 0 ? formAes : [defaultAes],
  };
};
/* eslint-disabled @typescript-eslint/explicit-function-return-type */
