import { startOfDay } from "date-fns";
import { filterNonNullable, type ReadonlyDeep, timeToMinutes } from "common/src/helpers";
import {
  type ApplicantFieldsFragment,
  type ApplicationFormFragment,
  type ApplicationUpdateMutation,
  type ApplicationPage2Fragment,
  type Maybe,
  MunicipalityChoice,
  Priority,
  ReserveeType,
  type SuitableTimeRangeCreateInput,
  type ApplicationSectionUpdateInput,
  Weekday,
} from "@gql/gql-types";
import { z } from "zod";
import { toApiDate, toUIDate } from "common/src/common/util";
import { fromUIDate } from "@/modules/util";
import { checkValidDateOnly, lessThanMaybeDate } from "common/src/schemas/schemaCommon";
import { CELL_STATES } from "common/src/components/ApplicationTimeSelector";

type SectionType = NonNullable<ApplicationFormFragment["applicationSections"]>[0];

const SuitableTimeRangeFormTypeSchema = z.object({
  pk: z.number().optional(),
  priority: z.nativeEnum(Priority),
  // TODO validate Time input string
  beginTime: z.string(),
  endTime: z.string(),
  dayOfTheWeek: z.nativeEnum(Weekday),
});
export type SuitableTimeRangeFormValues = z.infer<typeof SuitableTimeRangeFormTypeSchema>;

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
    isAccordionOpen: z.boolean(),
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

export type ApplicationSectionPage1FormValues = z.infer<typeof ApplicationSectionPage1Schema>;

export type ApplicationSectionPage2FormValues = z.infer<typeof ApplicationSectionPage2Schema>;

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
    suitableTimeRanges: z.array(SuitableTimeRangeFormTypeSchema).min(1, { message: "Required" }),
    minDuration: z.number().min(1, { message: "Required" }),
    name: z.string().min(1, { message: "Required" }).max(100),
    reservationUnitPk: z.number(),
    priority: z.enum(CELL_STATES),
    // NOTE: not sent or modified here, but required for validation
    appliedReservationsPerWeek: z.number().min(1).max(7),
  })
  .superRefine((s, ctx) => {
    const isValid =
      s.minDuration > 0 &&
      // No too short time ranges allowed
      s.suitableTimeRanges.filter((tr) => lengthOfTimeRange(tr) < s.minDuration).length === 0;
    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["suitableTimeRanges"],
        message: "Suitable time range must be at least as long as the minimum duration",
      });
    }
  })
  .superRefine((s, ctx) => {
    const rangesPerWeek = s.suitableTimeRanges.reduce<typeof s.suitableTimeRanges>((acc, tr) => {
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
        message: "At least as many suitable time ranges as applied reservations per week",
      });
    }
  });

function transformApplicationSectionPage2(values: ApplicationSectionPage2FormValues): ApplicationSectionUpdateInput {
  // NOTE: there is a type issue somewhere that causes this to be a string for some cases
  return {
    pk: Number(values.pk),
    suitableTimeRanges: values.suitableTimeRanges.map(transformSuitableTimeRange),
  };
}

type SectionTypePage2 = NonNullable<ApplicationPage2Fragment["applicationSections"]>[0];
function convertApplicationSectionPage2(section: ReadonlyDeep<SectionTypePage2>): ApplicationSectionPage2FormValues {
  const reservationUnitPk = section.reservationUnitOptions.find(() => true)?.reservationUnit.pk ?? 0;
  const { name, appliedReservationsPerWeek } = section;
  return {
    // NOTE: there is a type issue somewhere that causes the mutation output to be a string for some cases
    pk: Number(section.pk ?? 0),
    name,
    suitableTimeRanges: filterNonNullable(section.suitableTimeRanges).map((timeRanges) => convertTimeRange(timeRanges)),
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

function convertApplicationSectionPage1(section: SectionType): ApplicationSectionPage1FormValues {
  const reservationUnits = filterNonNullable(
    section.reservationUnitOptions?.map(({ reservationUnit, preferredOrder }) => ({
      pk: reservationUnit.pk,
      preferredOrder,
    }))
  )
    .sort((a, b) => (a.preferredOrder && b.preferredOrder ? a.preferredOrder - b.preferredOrder : 0))
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
    isAccordionOpen: false,
  };
}

function convertTimeRange(timeRange: NonNullable<SectionType["suitableTimeRanges"][0]>): SuitableTimeRangeFormValues {
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

const ApplicantTypeSchema = z.enum([ReserveeType.Individual, ReserveeType.Company, ReserveeType.Nonprofit]);
const ApplicationPage1Schema = z.object({
  pk: z.number(),
  applicantType: ApplicantTypeSchema.optional(),
  applicationSections: z.array(ApplicationSectionPage1Schema.optional()).optional(),
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

export function ApplicationPage1SchemaRefined(round: { begin: Date; end: Date }) {
  return ApplicationPage1Schema.superRefine((val, ctx) => {
    if (val.applicationSections == null || val.applicationSections.length === 0) {
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

    // TODO identifier is only optional for Associations (not for Companies / Communities)
    organisationName: z.string().min(1).max(255).optional(),
    organisationIdentifier: z.string().max(255).optional(),
    organisationCoreBusiness: z.string().min(1).max(255).optional(),
    organisationStreetAddress: z.string().min(1).max(80).optional(),
    organisationCity: z.string().min(1).max(80).optional(),
    organisationPostCode: z.string().min(1).max(32).optional(),

    contactPersonFirstName: z.string().min(1).max(255),
    contactPersonLastName: z.string().min(1).max(255),
    contactPersonEmail: z.string().min(1).max(254).email(),
    contactPersonPhoneNumber: z.string().min(1).max(255),

    billingStreetAddress: z.string().min(1).max(80).optional(),
    billingCity: z.string().min(1).max(80).optional(),
    billingPostCode: z.string().min(1).max(32).optional(),
    // not submitted, we use it to remove the billing address from submit without losing the frontend state
    hasBillingAddress: z.boolean(),
    // not submitted
    isRegisteredAssociation: z.boolean(),
    additionalInformation: z.string().max(255).optional(),
    // municipality is only for Organisations
    municipality: z.enum([MunicipalityChoice.Helsinki, MunicipalityChoice.Other]).optional(),
  })
  // have to check at form level otherwise it forbids undefined initialization
  .refine((val) => val.applicantType != null, {
    message: "Required",
    path: ["applicantType"],
  })
  .superRefine((val, ctx) => {
    if (val.applicantType === ReserveeType.Company || val.applicantType === ReserveeType.Nonprofit) {
      const requiredToHaveId = val.applicantType !== ReserveeType.Nonprofit;
      const { isRegisteredAssociation } = val;
      const hasId = val.organisationIdentifier != null && val.organisationIdentifier !== "";
      if ((requiredToHaveId || isRegisteredAssociation) && !hasId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["organisationIdentifier"],
          message: "Required",
        });
      }
    }
    if (val.applicantType === ReserveeType.Nonprofit) {
      if (!val.municipality) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["municipality"],
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

function transformSuitableTimeRange(timeRange: SuitableTimeRangeFormValues): SuitableTimeRangeCreateInput {
  return timeRange;
}

// NOTE this works only for subsections of an application mutation
// if needed without an application mutation needs to use a different SerializerInput
function transformApplicationSection(ae: ApplicationSectionPage1FormValues): ApplicationSectionUpdateInput {
  const begin = transformDateString(ae.begin);
  const end = transformDateString(ae.end);

  const commonData: ApplicationSectionUpdateInput = {
    ...(begin != null ? { reservationsBeginDate: begin } : {}),
    ...(end != null ? { reservationsEndDate: end } : {}),
    name: ae.name,
    numPersons: ae.numPersons ?? 0,
    ageGroup: ae.ageGroup,
    purpose: ae.purpose,
    reservationMinDuration: ae.minDuration ?? 0, // "3600" == 1h
    reservationMaxDuration: ae.maxDuration ?? 0, // "7200" == 2h
    appliedReservationsPerWeek: ae.appliedReservationsPerWeek ?? 0,
    // TODO should validate that the units are on the application round
    reservationUnitOptions: ae.reservationUnits.map((ruo, ruoIndex) => transformEventReservationUnit(ruo, ruoIndex)),
  };
  if (ae.pk != null) {
    return {
      ...commonData,
      pk: ae.pk,
    };
  }

  return commonData;
}

export function transformApplicationPage2(values: ApplicationPage2FormValues): ApplicationUpdateMutation {
  const { pk } = values;
  const appEvents = values.applicationSections;
  return {
    pk,
    applicationSections: appEvents.map((ae) => transformApplicationSectionPage2(ae)),
  };
}

// For page 1
export function transformApplicationPage1(values: ApplicationPage1FormValues): ApplicationUpdateMutation {
  const { pk, applicantType } = values;
  const appEvents = filterNonNullable(values.applicationSections);
  return {
    pk,
    ...(applicantType != null ? { applicantType } : {}),
    applicationSections: appEvents.map((ae) => transformApplicationSection(ae)),
  };
}

export function convertApplicationPage2(
  app: ReadonlyDeep<Pick<ApplicationPage2Fragment, "pk" | "applicationSections">>
): ApplicationPage2FormValues {
  return {
    pk: app?.pk ?? 0,
    applicationSections: app.applicationSections?.map(convertApplicationSectionPage2) ?? [],
  };
}

export function convertApplicationPage1(
  app: ReadonlyDeep<ApplicationFormFragment>,
  // We pass reservationUnits here so we have a default selection for a new application section
  reservationUnits: number[]
): ApplicationPage1FormValues {
  const formAes = filterNonNullable(app?.applicationSections).map((ae) => convertApplicationSectionPage1(ae));
  const defaultAes = createDefaultPage1Section(reservationUnits);
  return {
    pk: app?.pk ?? 0,
    applicantType: app?.applicantType ?? undefined,
    applicationSections: formAes.length > 0 ? formAes : [defaultAes],
  };
}

export function createDefaultPage1Section(
  reservationUnits: number[]
): NonNullable<ApplicationPage1FormValues["applicationSections"]>[0] {
  // TODO do we need to set default values?
  return {
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
    appliedReservationsPerWeek: 1,
    reservationUnits,
    isAccordionOpen: true,
  };
}

function isAnyOrganisationField(app: ApplicantFieldsFragment): boolean {
  return (
    app.organisationName !== "" ||
    app.organisationIdentifier !== "" ||
    app.organisationCoreBusiness !== "" ||
    app.organisationStreetAddress !== "" ||
    app.organisationCity !== "" ||
    app.organisationPostCode !== ""
  );
}

export function convertApplicationPage3(app: Maybe<ApplicantFieldsFragment>): ApplicationPage3FormValues {
  const isOrganisation = app?.applicantType !== ReserveeType.Individual;

  const hasBillingAddress =
    app?.applicantType === ReserveeType.Individual ||
    (app?.billingStreetAddress != null && app?.billingStreetAddress !== "");

  // complex due to we want to default this to false even for Nonprofits unless the user
  // is editing an existing application (they have once set this explicitly to true)
  const isUnregisteredAssociation =
    app != null &&
    app.applicantType === ReserveeType.Nonprofit &&
    isAnyOrganisationField(app) &&
    app.organisationIdentifier === "";

  return {
    pk: app?.pk ?? 0,
    applicantType: app?.applicantType ?? undefined,

    organisationName: isOrganisation ? app?.organisationName : undefined,
    organisationIdentifier: isOrganisation ? app?.organisationIdentifier : undefined,
    organisationCoreBusiness: isOrganisation ? app?.organisationCoreBusiness : undefined,
    organisationStreetAddress: isOrganisation ? app?.organisationStreetAddress : undefined,
    organisationCity: isOrganisation ? app?.organisationCity : undefined,
    organisationPostCode: isOrganisation ? app?.organisationPostCode : undefined,

    contactPersonFirstName: app?.contactPersonFirstName ?? "",
    contactPersonLastName: app?.contactPersonLastName ?? "",
    contactPersonEmail: app?.contactPersonEmail ?? "",
    contactPersonPhoneNumber: app?.contactPersonPhoneNumber ?? "",

    hasBillingAddress,
    isRegisteredAssociation: !isUnregisteredAssociation,

    billingStreetAddress: hasBillingAddress ? app?.billingStreetAddress : undefined,
    billingCity: hasBillingAddress ? app?.billingCity : undefined,
    billingPostCode: hasBillingAddress ? app?.billingPostCode : undefined,

    additionalInformation: app?.additionalInformation ?? "",
    municipality: app?.municipality ?? undefined,
  };
}

function isAddressValid(streetAddress?: string, postCode?: string, city?: string): boolean {
  return (
    streetAddress != null && streetAddress !== "" && postCode != null && postCode !== "" && city != null && city !== ""
  );
}

export function transformPage3Application(values: ApplicationPage3FormValues): ApplicationUpdateMutation {
  const shouldSaveBillingAddress = values.applicantType === ReserveeType.Individual || values.hasBillingAddress;

  const isOrganisation = values.organisationName != null && values.applicantType !== ReserveeType.Individual;
  const isOrganisationAddressValid = isAddressValid(
    values.organisationStreetAddress,
    values.organisationPostCode,
    values.organisationCity
  );

  const isBillingAddressValid = isAddressValid(values.billingStreetAddress, values.billingPostCode, values.billingCity);
  const shouldSaveIdentifier = values.isRegisteredAssociation || values.applicantType !== ReserveeType.Nonprofit;

  return {
    pk: values.pk,
    applicantType: values.applicantType,

    contactPersonFirstName: values?.contactPersonFirstName || undefined,
    contactPersonLastName: values?.contactPersonLastName || undefined,
    contactPersonEmail: values?.contactPersonEmail || undefined,
    contactPersonPhoneNumber: values?.contactPersonPhoneNumber || undefined,

    ...(isOrganisation
      ? {
          organisationName: values.organisationName || undefined,
          // force update to empty
          organisationIdentifier: shouldSaveIdentifier ? (values.organisationIdentifier ?? "") : "",
          organisationCoreBusiness: values.organisationCoreBusiness || undefined,
          organisationStreetAddress: isOrganisationAddressValid ? values.organisationStreetAddress : undefined,
          organisationPostCode: isOrganisationAddressValid ? values.organisationPostCode : undefined,
          organisationCity: isOrganisationAddressValid ? values.organisationCity : undefined,
        }
      : {
          organisationName: "",
          organisationIdentifier: "",
          organisationCoreBusiness: "",
          organisationStreetAddress: "",
          organisationPostCode: "",
          organisationCity: "",
        }),

    ...(shouldSaveBillingAddress
      ? {
          billingStreetAddress: isBillingAddressValid ? values.billingStreetAddress : undefined,
          billingPostCode: isBillingAddressValid ? values.billingPostCode : undefined,
          billingCity: isBillingAddressValid ? values.billingCity : undefined,
        }
      : {
          billingStreetAddress: "",
          billingPostCode: "",
          billingCity: "",
        }),

    ...(values.additionalInformation != null ? { additionalInformation: values.additionalInformation } : {}),
    ...(values.municipality != null ? { municipality: values.municipality } : {}),
  };
}

export function validateApplication(
  application: ApplicationFormFragment
): { valid: true } | { valid: false; page: 1 | 2 | 3 } {
  const { applicationRound } = application;
  const begin = new Date(applicationRound.reservationPeriodBeginDate);
  const end = new Date(applicationRound.reservationPeriodEndDate);
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
  const page3 = ApplicationPage3Schema.safeParse(convertApplicationPage3(application));
  if (!page3.success) {
    return { valid: false, page: 3 };
  }
  return { valid: true };
}
