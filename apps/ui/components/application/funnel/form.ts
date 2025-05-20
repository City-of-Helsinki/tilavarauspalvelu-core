import { startOfDay } from "date-fns";
import {
  filterNonNullable,
  formatApiTimeInterval,
  type ReadonlyDeep,
  timeToMinutes,
} from "common/src/helpers";
import {
  ApplicantTypeChoice,
  type PersonNode,
  type ApplicationUpdateMutationInput,
  Weekday,
  Priority,
  type UpdateApplicationSectionForApplicationSerializerInput,
  type ApplicantFragment,
  type ApplicationPage2Query,
  type ApplicationFormFragment,
  type Maybe,
} from "@gql/gql-types";
import { z } from "zod";
import { toApiDate, toUIDate } from "common/src/common/util";
import { fromUIDate } from "@/modules/util";
import {
  checkValidDateOnly,
  lessThanMaybeDate,
} from "common/src/schemas/schemaCommon";
import { convertWeekday } from "common/src/conversion";

export const CELL_TYPES = [
  "open",
  "unavailable",
  "secondary",
  "primary",
] as const;
export type CellType = (typeof CELL_TYPES)[number];

type Organisation = ApplicationFormFragment["organisation"];
type Address = NonNullable<Organisation>["address"];
type SectionType = NonNullable<
  ApplicationFormFragment["applicationSections"]
>[0];

type NodePage2 = NonNullable<ApplicationPage2Query["application"]>;
type SectionTypePage2 = NonNullable<NodePage2["applicationSections"]>[0];

const SuitableTimeRangeFormTypeSchema = z.object({
  pk: z.number().optional(),
  priority: z.nativeEnum(Priority),
  // TODO validate Time input string
  beginTime: z.string(),
  endTime: z.string(),
  dayOfTheWeek: z.nativeEnum(Weekday),
});
export type SuitableTimeRangeFormValues = z.infer<
  typeof SuitableTimeRangeFormTypeSchema
>;

const ApplicationSectionPage1Schema = z
  .object({
    pk: z.number().optional(),
    name: z.string().min(1, { message: "Required" }).max(100),
    numPersons: z
      .number()
      .min(1)
      // don't preselect a value for the user
      .optional()
      .refine((s) => s, {
        path: [""],
        message: "Required",
      }),
    ageGroup: z.number().refine((s) => s, { path: [""], message: "Required" }),
    purpose: z.number().refine((s) => s, { path: [""], message: "Required" }),
    minDuration: z.number().min(1, { message: "Required" }),
    maxDuration: z.number().min(1, { message: "Required" }),
    appliedReservationsPerWeek: z
      .number()
      .min(1)
      .max(7)
      .nullable()
      .refine((s) => s, { path: [""], message: "Required" }),
    begin: z.string().min(1, { message: "Required" }),
    end: z.string().min(1, { message: "Required" }),
    // TODO do we want to keep the pk of the options? so we can update them when the order changes and not recreate the whole list on save?
    reservationUnits: z.array(z.number()).min(1, { message: "Required" }),
    // frontend only props
    accordionOpen: z.boolean(),
    // form specific: new events don't have pks and we need a unique identifier
    formKey: z.string(),
  })
  .refine((s) => s.maxDuration >= s.minDuration, {
    path: ["maxDuration"],
    message: "Maximum duration must be greater than minimum duration",
  })
  .superRefine((val, ctx) => {
    checkValidDateOnly(fromUIDate(val.begin ?? ""), ctx, `begin`);
  })
  .superRefine((val, ctx) => {
    checkValidDateOnly(fromUIDate(val.end ?? ""), ctx, `end`);
  })
  .superRefine((val, ctx) => {
    if (lessThanMaybeDate(val.end, val.begin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end"],
        message: "End date must be after begin date",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["begin"],
        message: "Begin date must be before end date",
      });
    }
  });

export type ApplicationSectionPage1FormValues = z.infer<
  typeof ApplicationSectionPage1Schema
>;

export type ApplicationSectionPage2FormValues = z.infer<
  typeof ApplicationSectionPage2Schema
>;

// seconds
function lengthOfTimeRange(timeRange: SuitableTimeRangeFormValues): number {
  const begin = timeToMinutes(timeRange.beginTime);
  const end = timeToMinutes(timeRange.endTime);
  const endChecked = end === 0 ? 24 * 60 : end;

  return (endChecked - begin) * 60;
}

const ApplicationSectionPage2Schema = z
  .object({
    pk: z.number(),
    suitableTimeRanges: z
      .array(SuitableTimeRangeFormTypeSchema)
      .min(1, { message: "Required" }),
    minDuration: z.number().min(1, { message: "Required" }),
    name: z.string().min(1, { message: "Required" }).max(100),
    reservationUnitPk: z.number(),
    priority: z.enum(CELL_TYPES),
    // NOTE: not sent or modified here, but required for validation
    appliedReservationsPerWeek: z.number().min(1).max(7),
  })
  .superRefine((s, ctx) => {
    const isValid =
      s.minDuration > 0 &&
      // No too short time ranges allowed
      s.suitableTimeRanges.filter((tr) => lengthOfTimeRange(tr) < s.minDuration)
        .length === 0;
    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["suitableTimeRanges"],
        message:
          "Suitable time range must be at least as long as the minimum duration",
      });
    }
  })
  .superRefine((s, ctx) => {
    const rangesPerWeek = s.suitableTimeRanges.reduce<
      typeof s.suitableTimeRanges
    >((acc, tr) => {
      if (acc.find((x) => x.dayOfTheWeek === tr.dayOfTheWeek)) {
        return acc;
      }
      return [...acc, tr];
    }, []);

    const isValid = rangesPerWeek.length >= s.appliedReservationsPerWeek;

    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["suitableTimeRanges"],
        message:
          "At least as many suitable time ranges as applied reservations per week",
      });
    }
  });

function transformApplicationSectionPage2(
  values: ApplicationSectionPage2FormValues
): UpdateApplicationSectionForApplicationSerializerInput {
  // NOTE: there is a type issue somewhere that causes this to be a string for some cases
  return {
    pk: Number(values.pk),
    suitableTimeRanges: values.suitableTimeRanges.map(
      transformSuitableTimeRange
    ),
  };
}

function convertApplicationSectionPage2(
  section: ReadonlyDeep<SectionTypePage2>
): ApplicationSectionPage2FormValues {
  const reservationUnitPk =
    section.reservationUnitOptions.find(() => true)?.reservationUnit.pk ?? 0;
  const { name, appliedReservationsPerWeek } = section;
  return {
    // NOTE: there is a type issue somewhere that causes the mutation output to be a string for some cases
    pk: Number(section.pk ?? 0),
    name,
    suitableTimeRanges: filterNonNullable(section.suitableTimeRanges).map(
      (timeRanges) => convertTimeRange(timeRanges)
    ),
    minDuration: section.reservationMinDuration,
    appliedReservationsPerWeek,
    reservationUnitPk,
    priority: "primary",
  };
}
export const ApplicationPage2Schema = z.object({
  pk: z.number(),
  applicationSections: z.array(ApplicationSectionPage2Schema),
});

export type ApplicationPage2FormValues = z.infer<typeof ApplicationPage2Schema>;

function convertApplicationSectionPage1(
  section: SectionType
): ApplicationSectionPage1FormValues {
  const reservationUnits = filterNonNullable(
    section.reservationUnitOptions?.map(
      ({ reservationUnit, preferredOrder }) => ({
        pk: reservationUnit?.pk,
        preferredOrder,
      })
    )
  )
    .sort((a, b) =>
      a.preferredOrder && b.preferredOrder
        ? a.preferredOrder - b.preferredOrder
        : 0
    )
    .map((eru) => eru.pk ?? 0)
    .filter((pk) => pk > 0);

  return {
    pk: section.pk ?? undefined,
    formKey: section.pk ? `event-${section.pk}` : "event-NEW",
    name: section.name,
    numPersons: section.numPersons,
    ageGroup: section.ageGroup?.pk ?? 0,
    purpose: section.purpose?.pk ?? 0,
    minDuration: section.reservationMinDuration ?? 0,
    maxDuration: section.reservationMaxDuration ?? 0,
    appliedReservationsPerWeek: section.appliedReservationsPerWeek,
    reservationUnits,
    // TODO why do these default to undefined instead of empty string?
    begin: convertDate(section.reservationsBeginDate) ?? "",
    end: convertDate(section.reservationsEndDate) ?? "",
    accordionOpen: false,
  };
}

function convertTimeRange(
  timeRange: NonNullable<SectionType["suitableTimeRanges"][0]>
): SuitableTimeRangeFormValues {
  return {
    pk: timeRange.pk ?? undefined,
    // TODO pk should be sent if updating (otherwise it always creates new)
    beginTime: timeRange.beginTime ?? "",
    dayOfTheWeek: timeRange.dayOfTheWeek ?? 0,
    endTime: timeRange.endTime ?? "",
    priority: timeRange.priority ?? 50,
  };
}

function convertDate(date: string | null | undefined): string | undefined {
  if (date == null) {
    return undefined;
  }
  return toUIDate(new Date(date)) || undefined;
}

const AddressSchema = z.object({
  pk: z.number().optional(),
  streetAddress: z.string().min(1).max(80),
  city: z.string().min(1).max(80),
  postCode: z.string().min(1).max(32),
});
type AddressFormValues = z.infer<typeof AddressSchema>;

// TODO identifier is only optional for Associations (not for Companies / Communities)
const OrganisationsSchema = z.object({
  pk: z.number().optional(),
  name: z.string().min(1).max(255),
  identifier: z.string().max(255).optional(),
  coreBusiness: z.string().min(1).max(255),
  address: AddressSchema,
});
type OrganisationFormValues = z.infer<typeof OrganisationsSchema>;

const PersonsSchema = z.object({
  pk: z.number().optional(),
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  email: z.string().min(1).max(254).email(),
  phoneNumber: z.string().min(1).max(255),
});
type PersonFormValues = z.infer<typeof PersonsSchema>;

const convertPerson = (p: Maybe<PersonNode> | undefined): PersonFormValues => ({
  pk: p?.pk ?? undefined,
  firstName: p?.firstName ?? "",
  lastName: p?.lastName ?? "",
  email: p?.email ?? "",
  phoneNumber: p?.phoneNumber ?? "",
});

// TODO are these converters the wrong way around? (not input, but output)
const convertAddress = (a: Address): AddressFormValues => ({
  pk: a?.pk ?? undefined,
  streetAddress: a?.streetAddressFi ?? "",
  city: a?.cityFi ?? "",
  postCode: a?.postCode ?? "",
});

const convertOrganisation = (o: Organisation): OrganisationFormValues => ({
  pk: o?.pk ?? undefined,
  name: o?.nameFi ?? "",
  identifier: o?.identifier ?? "",
  coreBusiness: o?.coreBusinessFi ?? "",
  address: convertAddress(o?.address ?? null),
});

const ApplicantTypeSchema = z.enum([
  ApplicantTypeChoice.Individual,
  ApplicantTypeChoice.Company,
  ApplicantTypeChoice.Association,
  ApplicantTypeChoice.Community,
]);
const ApplicationPage1Schema = z.object({
  pk: z.number(),
  applicantType: ApplicantTypeSchema.optional(),
  applicationSections: z
    .array(ApplicationSectionPage1Schema.optional())
    .optional(),
});

export type ApplicationPage1FormValues = z.infer<typeof ApplicationPage1Schema>;

function checkDateRange(props: {
  date: Date;
  pathRoot: string;
  part: "begin" | "end";
  range: { begin: Date; end: Date };
  ctx: z.RefinementCtx;
}) {
  const { date, pathRoot, part, range, ctx } = props;

  const path = `${pathRoot}.${part}`;
  if (startOfDay(date).getTime() < startOfDay(range.begin).getTime()) {
    const message = `${part} date must be after application round begin date`;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message,
    });
  }
  if (startOfDay(date).getTime() > startOfDay(range.end).getTime()) {
    const message = `${part} date must be before application round end date`;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message,
    });
  }
}

/// check that the given time is inside a DateRange
/// Assumes that date validity has already been checked (adds a range error if the date is invalid)
/// but that's implementation specific and could change in the future (depending on the fromUIDate implementation)
function checkApplicationRoundDates(
  round: {
    begin: Date;
    end: Date;
  },
  val: ApplicationSectionPage1FormValues,
  pathRoot: string,
  ctx: z.RefinementCtx
) {
  const { begin, end } = val;
  if (begin == null || end == null) {
    return;
  }
  const b = fromUIDate(begin);
  const e = fromUIDate(end);

  if (b != null) {
    checkDateRange({
      date: b,
      pathRoot,
      part: "begin",
      range: { begin: round.begin, end: round.end },
      ctx,
    });
  }

  if (e != null) {
    checkDateRange({
      date: e,
      pathRoot,
      part: "end",
      range: { begin: round.begin, end: round.end },
      ctx,
    });
  }
}

export function ApplicationPage1SchemaRefined(round: {
  begin: Date;
  end: Date;
}) {
  return ApplicationPage1Schema.superRefine((val, ctx) => {
    if (
      val.applicationSections == null ||
      val.applicationSections.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["applicationSections"],
        message: "Required",
      });
      return;
    }
    for (let i = 0; i < val.applicationSections.length; i++) {
      const section = val.applicationSections[i];
      if (section == null) {
        continue;
      }
      const pathRoot = `applicationSections.${i}`;
      checkApplicationRoundDates(round, section, pathRoot, ctx);
    }
  });
}

// if applicantType === Organisation | Company => organisation.identifier is required
// if hasBillingAddress || applicantType === Individual => billingAddress is required
export const ApplicationPage3Schema = z
  .object({
    pk: z.number(),
    applicantType: ApplicantTypeSchema.optional(),
    organisation: OrganisationsSchema.optional(),
    contactPerson: PersonsSchema,
    billingAddress: AddressSchema.optional(),
    // this is not submitted, we can use it to remove the billing address from submit without losing the frontend state
    hasBillingAddress: z.boolean(),
    additionalInformation: z.string().max(255).optional(),
    // homeCity is only for Organisations
    homeCity: z.number().min(1, { message: "Required" }).optional(),
  })
  // have to check at form level otherwise it forbids undefined initialization
  .refine((val) => val.applicantType != null, {
    message: "Required",
    path: ["applicantType"],
  })
  .superRefine((val, ctx) => {
    switch (val.applicantType) {
      case ApplicantTypeChoice.Association:
      case ApplicantTypeChoice.Company:
        if (!val.organisation?.identifier) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["organisation", "identifier"],
            message: "Required",
          });
        }
        break;
      default:
        break;
    }
    if (
      val.applicantType === ApplicantTypeChoice.Community ||
      val.applicantType === ApplicantTypeChoice.Association
    ) {
      if (!val.homeCity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["homeCity"],
          message: "Required",
        });
      }
    }
  });

export type ApplicationPage3FormValues = z.infer<typeof ApplicationPage3Schema>;

/// form -> API transformers, enforce return types so API changes cause type errors

function transformDateString(date?: string | null): string | null {
  if (date == null) {
    return null;
  }
  const d = fromUIDate(date);
  if (d != null) {
    return toApiDate(d);
  }
  return null;
}

// On purpose not return typed create / update compatible objects
const transformEventReservationUnit = (pk: number, priority: number) => ({
  preferredOrder: priority,
  reservationUnit: pk,
});

function transformSuitableTimeRange(timeRange: SuitableTimeRangeFormValues) {
  return {
    ...(timeRange.pk != null ? { pk: timeRange.pk } : {}),
    beginTime: timeRange.beginTime ?? "",
    endTime: timeRange.endTime ?? "",
    priority: timeRange.priority ?? 50,
    dayOfTheWeek: timeRange.dayOfTheWeek,
  };
}

// NOTE this works only for subsections of an application mutation
// if needed without an application mutation needs to use a different SerializerInput
function transformApplicationSection(
  ae: ApplicationSectionPage1FormValues
): UpdateApplicationSectionForApplicationSerializerInput {
  const begin = transformDateString(ae.begin);
  const end = transformDateString(ae.end);

  const commonData: UpdateApplicationSectionForApplicationSerializerInput = {
    ...(begin != null ? { reservationsBeginDate: begin } : {}),
    ...(end != null ? { reservationsEndDate: end } : {}),
    name: ae.name,
    numPersons: ae.numPersons,
    ageGroup: ae.ageGroup,
    purpose: ae.purpose,
    reservationMinDuration: ae.minDuration ?? 0, // "3600" == 1h
    reservationMaxDuration: ae.maxDuration ?? 0, // "7200" == 2h
    appliedReservationsPerWeek: ae.appliedReservationsPerWeek,
    // TODO should validate that the units are on the application round
    reservationUnitOptions: ae.reservationUnits.map((ruo, ruoIndex) =>
      transformEventReservationUnit(ruo, ruoIndex)
    ),
  };
  if (ae.pk != null) {
    return {
      ...commonData,
      pk: ae.pk,
    };
  }

  return commonData;
}

export function transformApplicationPage2(
  values: ApplicationPage2FormValues
): ApplicationUpdateMutationInput {
  const { pk } = values;
  const appEvents = values.applicationSections;
  return {
    pk,
    applicationSections: appEvents.map((ae) =>
      transformApplicationSectionPage2(ae)
    ),
  };
}
// For page 1
export function transformApplicationPage1(
  values: ApplicationPage1FormValues
): ApplicationUpdateMutationInput {
  const { pk, applicantType } = values;
  const appEvents = filterNonNullable(values.applicationSections);
  return {
    pk,
    ...(applicantType != null ? { applicantType } : {}),
    applicationSections: appEvents.map((ae) => transformApplicationSection(ae)),
  };
}

export function convertApplicationPage2(
  app: ReadonlyDeep<Pick<NodePage2, "pk" | "applicationSections">>
): ApplicationPage2FormValues {
  return {
    pk: app?.pk ?? 0,
    applicationSections:
      app.applicationSections?.map(convertApplicationSectionPage2) ?? [],
  };
}
export function convertApplicationPage1(
  app: ReadonlyDeep<ApplicationFormFragment>,
  // We pass reservationUnits here so we have a default selection for a new application section
  reservationUnits: number[]
): ApplicationPage1FormValues {
  const formAes = filterNonNullable(app?.applicationSections).map((ae) =>
    convertApplicationSectionPage1(ae)
  );
  // TODO do we need to set default values?
  const defaultAes: (typeof formAes)[0] = {
    pk: undefined,
    name: "",
    // TODO this is not unique if the user adds multiple new sections
    // it doesn't matter as long as any newly added sections have different keys
    // would be better if this returned empty array and the form added single section on mount
    formKey: "event-NEW",
    numPersons: undefined,
    ageGroup: 0,
    purpose: 0,
    minDuration: 0,
    maxDuration: 0,
    begin: "",
    end: "",
    appliedReservationsPerWeek: null,
    reservationUnits,
    accordionOpen: true,
  };
  return {
    pk: app?.pk ?? 0,
    applicantType: app?.applicantType ?? undefined,
    applicationSections: formAes.length > 0 ? formAes : [defaultAes],
  };
}

// Filter out any empty strings from the object (otherwise the mutation fails)
function transformPerson(person?: PersonFormValues) {
  return {
    firstName: person?.firstName || undefined,
    lastName: person?.lastName || undefined,
    email: person?.email || undefined,
    phoneNumber: person?.phoneNumber || undefined,
  };
}

function isAddressValid(address?: AddressFormValues) {
  const { streetAddress, postCode, city } = address || {};
  return (
    streetAddress != null &&
    streetAddress !== "" &&
    postCode != null &&
    postCode !== "" &&
    city != null &&
    city !== ""
  );
}

function transformAddress(address?: AddressFormValues) {
  return {
    pk: address?.pk || undefined,
    streetAddress: address?.streetAddress || undefined,
    postCode: address?.postCode || undefined,
    city: address?.city || undefined,
  };
}

// Filter out any empty strings from the object (otherwise the mutation fails)
// remove the identifier if it's empty (otherwise the mutation fails)
function transformOrganisation(org: OrganisationFormValues) {
  return {
    name: org.name || undefined,
    identifier: org.identifier || undefined,
    address: isAddressValid(org.address)
      ? transformAddress(org.address)
      : undefined,
    coreBusiness: org.coreBusiness || undefined,
  };
}

export function convertApplicationPage3(
  app?: Maybe<ApplicantFragment>
): ApplicationPage3FormValues {
  const hasBillingAddress =
    app?.applicantType === ApplicantTypeChoice.Individual ||
    (app?.billingAddress?.streetAddressFi != null &&
      app?.billingAddress?.streetAddressFi !== "");
  return {
    pk: app?.pk ?? 0,
    applicantType: app?.applicantType ?? undefined,
    organisation: app?.organisation
      ? convertOrganisation(app.organisation)
      : undefined,
    contactPerson: convertPerson(app?.contactPerson),
    billingAddress: hasBillingAddress
      ? convertAddress(app.billingAddress)
      : undefined,
    hasBillingAddress,
    additionalInformation: app?.additionalInformation ?? "",
    homeCity: app?.homeCity?.pk ?? undefined,
  };
}

export function transformPage3Application(
  values: ApplicationPage3FormValues
): ApplicationUpdateMutationInput {
  const shouldSaveBillingAddress =
    values.applicantType === ApplicantTypeChoice.Individual ||
    values.hasBillingAddress;
  return {
    pk: values.pk,
    applicantType: values.applicantType,
    ...(values.billingAddress != null && shouldSaveBillingAddress
      ? { billingAddress: transformAddress(values.billingAddress) }
      : {}),
    ...(values.contactPerson != null
      ? { contactPerson: transformPerson(values.contactPerson) }
      : {}),
    ...(values.organisation != null &&
    values.applicantType !== ApplicantTypeChoice.Individual
      ? { organisation: transformOrganisation(values.organisation) }
      : {}),
    ...(values.additionalInformation != null
      ? { additionalInformation: values.additionalInformation }
      : {}),
    ...(values.homeCity != null && values.homeCity !== 0
      ? { homeCity: values.homeCity }
      : {}),
  };
}

export function validateApplication(
  application: ApplicationFormFragment
): { valid: true } | { valid: false; page: 1 | 2 | 3 } {
  const { applicationRound } = application;
  const begin = new Date(applicationRound.reservationPeriodBegin);
  const end = new Date(applicationRound.reservationPeriodEnd);
  const schema = ApplicationPage1SchemaRefined({ begin, end });
  const page1 = schema.safeParse(convertApplicationPage1(application, []));
  if (!page1.success) {
    return { valid: false, page: 1 };
  }
  // @ts-expect-error -- don't need to use convertApplicationPage2 here (we don't need the reservationUnitOptions for validation)
  const form2 = convertApplicationPage2(application);
  const page2 = ApplicationPage2Schema.safeParse(form2);
  if (!page2.success) {
    return { valid: false, page: 2 };
  }
  const page3 = ApplicationPage3Schema.safeParse(
    convertApplicationPage3(application)
  );
  if (!page3.success) {
    return { valid: false, page: 3 };
  }
  return { valid: true };
}

export function formatDayTimes(
  schedule: Omit<SuitableTimeRangeFormValues, "pk" | "priority">[],
  day: number
): string {
  return schedule
    .filter((s) => convertWeekday(s.dayOfTheWeek) === day)
    .map((s) => formatApiTimeInterval(s))
    .join(", ");
}
