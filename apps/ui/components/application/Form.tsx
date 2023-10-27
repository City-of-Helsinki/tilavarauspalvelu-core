import { filterNonNullable } from "common/src/helpers";
import {
  Applicant_Type,
  type ApplicationEventNode,
  type AddressNode,
  type PersonNode,
  type OrganisationNode,
} from "common/types/gql-types";
import { type Maybe } from "graphql/jsutils/Maybe";
import { z } from "zod";
import { apiDateToUIDate } from "@/modules/util";

// NOTE the zod schemas have a lot of undefineds because the form is split into four pages
// so you can't trust some of the zod validation (e.g. mandatory fields)
// real solution is to split the forms per page so we have four schemas
// the new mutation interface allows only updating the fields that are present
// also then all manual validations and setErrors should be removed

export const ApplicationEventScheduleFormTypeSchema = z.object({
  day: z.number().min(0).max(6),
  begin: z.string(),
  end: z.string(),
  priority: z.union([z.literal(100), z.literal(200), z.literal(300)]),
});

export type ApplicationEventScheduleFormType = z.infer<
  typeof ApplicationEventScheduleFormTypeSchema
>;

const ApplicationEventFormValueSchema = z.object({
  pk: z.number().optional(),
  name: z.string().min(1),
  numPersons: z
    .number()
    .min(1)
    .optional()
    .refine((s) => s, { path: [""], message: "Required" }),
  ageGroup: z
    .number()
    .optional()
    .refine((s) => s, { path: [""], message: "Required" }),
  abilityGroup: z.number().optional(),
  purpose: z
    .number()
    .optional()
    .refine((s) => s, { path: [""], message: "Required" }),
  minDuration: z.number().min(1),
  maxDuration: z.number().min(1),
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
  reservationUnits: z.array(z.number()).min(1),
});

export type ApplicationEventFormValue = z.infer<
  typeof ApplicationEventFormValueSchema
>;

export const transformApplicationEventToForm = (
  applicationEvent: ApplicationEventNode
): ApplicationEventFormValue => ({
  pk: applicationEvent.pk ?? undefined,
  name: applicationEvent.name,
  numPersons: applicationEvent.numPersons ?? undefined,
  ageGroup: applicationEvent.ageGroup?.pk ?? undefined,
  abilityGroup: applicationEvent.abilityGroup?.pk ?? undefined,
  purpose: applicationEvent.purpose?.pk ?? undefined,
  minDuration: applicationEvent.minDuration ?? 0,
  maxDuration: applicationEvent.maxDuration ?? 0,
  eventsPerWeek: applicationEvent.eventsPerWeek ?? 0,
  biweekly: applicationEvent.biweekly ?? false,
  reservationUnits: filterNonNullable(applicationEvent.eventReservationUnits)
    .sort((a, b) => (a.priority && b.priority ? a.priority - b.priority : 0))
    .map((eru) => eru.reservationUnit?.pk ?? 0)
    .filter((pk) => pk > 0),
  applicationEventSchedules: filterNonNullable(
    applicationEvent.applicationEventSchedules
  ).map((aes) => ({
    pk: aes.pk ?? undefined,
    day: (aes.day ?? 0) as Day,
    begin: aes.begin ?? "",
    end: aes.end ?? "",
    priority: aes.priority === 200 || aes.priority === 300 ? aes.priority : 100,
  })),
  // TODO remove the format hacks
  begin:
    applicationEvent?.begin != null && applicationEvent?.begin?.includes("-")
      ? apiDateToUIDate(applicationEvent.begin)
      : applicationEvent?.begin ?? undefined,
  end:
    applicationEvent?.end != null && applicationEvent?.end?.includes("-")
      ? apiDateToUIDate(applicationEvent.end)
      : applicationEvent?.end ?? undefined,
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
  name: z.string(),
  identifier: z.string().optional(),
  yearEstablished: z.number().optional(),
  coreBusiness: z.string(),
  address: AddressFormValueSchema,
});
export type OrganisationFormValues = z.infer<
  typeof OrganisationFormValuesSchema
>;

export const PersonFormValuesSchema = z.object({
  pk: z.number().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
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

export const ApplicationFormSchema = z.object({
  pk: z.number().optional(),
  applicantType: z.enum([
    Applicant_Type.Individual,
    Applicant_Type.Company,
    Applicant_Type.Association,
    Applicant_Type.Community,
  ]),
  // TODO remove id (also does this need to be sent?)
  applicationRoundId: z.number(),
  applicationEvents: z
    .array(ApplicationEventFormValueSchema.optional())
    .optional(),
  organisation: OrganisationFormValuesSchema.optional(),
  contactPerson: PersonFormValuesSchema.optional(),
  billingAddress: AddressFormValueSchema.optional(),
  // this is not submitted, we can use it to remove the billing address from submit without losing the frontend state
  hasBillingAddress: z.boolean().optional(),
  additionalInformation: z.string().optional(),
  // TODO remove id
  homeCityId: z.number().optional(),
  // TODO are these needed?
  createdDate: z.string().optional(),
  lastModifiedDate: z.string().optional(),
});
export const ApplicationFormSchemaRefined = ApplicationFormSchema;

export type ApplicationFormValues = z.infer<typeof ApplicationFormSchema>;
