import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Date: { input: string; output: string };
  DateTime: { input: string; output: string };
  Decimal: { input: string; output: string };
  Duration: { input: number; output: number };
  Time: { input: string; output: string };
  UUID: { input: string; output: string };
  Upload: { input: unknown; output: unknown };
};

export type AbilityGroupNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

/** The state of the access code. */
export enum AccessCodeState {
  AccessCodeCreated = "ACCESS_CODE_CREATED",
  AccessCodeNotRequired = "ACCESS_CODE_NOT_REQUIRED",
  AccessCodePending = "ACCESS_CODE_PENDING",
}

/** How is the reservee able to enter the space in their reservation unit? */
export enum AccessType {
  AccessCode = "ACCESS_CODE",
  OpenedByStaff = "OPENED_BY_STAFF",
  PhysicalKey = "PHYSICAL_KEY",
  Unrestricted = "UNRESTRICTED",
}

/**
 *
 * Same as AccessType, but includes the 'MULTIVALUED' option
 * for series and seasonal bookings where access type between reservations varies.
 *
 */
export enum AccessTypeWithMultivalued {
  AccessCode = "ACCESS_CODE",
  Multivalued = "MULTIVALUED",
  OpenedByStaff = "OPENED_BY_STAFF",
  PhysicalKey = "PHYSICAL_KEY",
  Unrestricted = "UNRESTRICTED",
}

export type AddressNode = Node & {
  readonly cityEn: Maybe<Scalars["String"]["output"]>;
  readonly cityFi: Maybe<Scalars["String"]["output"]>;
  readonly citySv: Maybe<Scalars["String"]["output"]>;
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly postCode: Scalars["String"]["output"];
  readonly streetAddressEn: Maybe<Scalars["String"]["output"]>;
  readonly streetAddressFi: Maybe<Scalars["String"]["output"]>;
  readonly streetAddressSv: Maybe<Scalars["String"]["output"]>;
};

export type AddressSerializerInput = {
  readonly city: Scalars["String"]["input"];
  readonly cityEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly cityFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly citySv?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly postCode: Scalars["String"]["input"];
  readonly streetAddress: Scalars["String"]["input"];
  readonly streetAddressEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly streetAddressFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly streetAddressSv?: InputMaybe<Scalars["String"]["input"]>;
};

export type AgeGroupNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly maximum: Maybe<Scalars["Int"]["output"]>;
  readonly minimum: Scalars["Int"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type AgeGroupNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<AgeGroupNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `AgeGroupNode` and its cursor. */
export type AgeGroupNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<AgeGroupNode>;
};

export type AllocatedTimeSlotCreateMutationInput = {
  readonly beginTime: Scalars["Time"]["input"];
  readonly dayOfTheWeek: Weekday;
  readonly endTime: Scalars["Time"]["input"];
  readonly force?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationUnitOption: Scalars["Int"]["input"];
};

export type AllocatedTimeSlotCreateMutationPayload = {
  readonly beginTime: Maybe<Scalars["Time"]["output"]>;
  readonly dayOfTheWeek: Maybe<Weekday>;
  readonly endTime: Maybe<Scalars["Time"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly reservationUnitOption: Maybe<Scalars["Int"]["output"]>;
};

export type AllocatedTimeSlotDeleteMutationInput = {
  readonly pk: Scalars["ID"]["input"];
};

export type AllocatedTimeSlotDeleteMutationPayload = {
  readonly deleted: Maybe<Scalars["Boolean"]["output"]>;
};

export type AllocatedTimeSlotNode = Node & {
  readonly beginTime: Scalars["Time"]["output"];
  readonly dayOfTheWeek: Weekday;
  readonly endTime: Scalars["Time"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly recurringReservation: Maybe<RecurringReservationNode>;
  readonly reservationUnitOption: ReservationUnitOptionNode;
};

export type AllocatedTimeSlotNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<AllocatedTimeSlotNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `AllocatedTimeSlotNode` and its cursor. */
export type AllocatedTimeSlotNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<AllocatedTimeSlotNode>;
};

/** Ordering fields for the 'AllocatedTimeSlot' model. */
export enum AllocatedTimeSlotOrderingChoices {
  AllocatedReservationUnitNameEnAsc = "allocatedReservationUnitNameEnAsc",
  AllocatedReservationUnitNameEnDesc = "allocatedReservationUnitNameEnDesc",
  AllocatedReservationUnitNameFiAsc = "allocatedReservationUnitNameFiAsc",
  AllocatedReservationUnitNameFiDesc = "allocatedReservationUnitNameFiDesc",
  AllocatedReservationUnitNameSvAsc = "allocatedReservationUnitNameSvAsc",
  AllocatedReservationUnitNameSvDesc = "allocatedReservationUnitNameSvDesc",
  AllocatedTimeOfWeekAsc = "allocatedTimeOfWeekAsc",
  AllocatedTimeOfWeekDesc = "allocatedTimeOfWeekDesc",
  AllocatedUnitNameEnAsc = "allocatedUnitNameEnAsc",
  AllocatedUnitNameEnDesc = "allocatedUnitNameEnDesc",
  AllocatedUnitNameFiAsc = "allocatedUnitNameFiAsc",
  AllocatedUnitNameFiDesc = "allocatedUnitNameFiDesc",
  AllocatedUnitNameSvAsc = "allocatedUnitNameSvAsc",
  AllocatedUnitNameSvDesc = "allocatedUnitNameSvDesc",
  ApplicantAsc = "applicantAsc",
  ApplicantDesc = "applicantDesc",
  ApplicationPkAsc = "applicationPkAsc",
  ApplicationPkDesc = "applicationPkDesc",
  ApplicationSectionNameAsc = "applicationSectionNameAsc",
  ApplicationSectionNameDesc = "applicationSectionNameDesc",
  ApplicationSectionPkAsc = "applicationSectionPkAsc",
  ApplicationSectionPkDesc = "applicationSectionPkDesc",
  ApplicationSectionStatusAsc = "applicationSectionStatusAsc",
  ApplicationSectionStatusDesc = "applicationSectionStatusDesc",
  ApplicationStatusAsc = "applicationStatusAsc",
  ApplicationStatusDesc = "applicationStatusDesc",
  DayOfTheWeekAsc = "dayOfTheWeekAsc",
  DayOfTheWeekDesc = "dayOfTheWeekDesc",
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type ApplicantNode = Node & {
  readonly dateOfBirth: Maybe<Scalars["Date"]["output"]>;
  readonly email: Scalars["String"]["output"];
  readonly firstName: Scalars["String"]["output"];
  readonly generalRoles: ReadonlyArray<GeneralRoleNode>;
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly isAdAuthenticated: Scalars["Boolean"]["output"];
  readonly isStronglyAuthenticated: Scalars["Boolean"]["output"];
  /** Antaa käyttäjälle kaikki oikeudet ilman, että niitä täytyy erikseen luetella. */
  readonly isSuperuser: Scalars["Boolean"]["output"];
  readonly lastName: Scalars["String"]["output"];
  readonly name: Scalars["String"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly reservationNotification: Maybe<ReservationNotification>;
  readonly unitRoles: ReadonlyArray<UnitRoleNode>;
  /** Vaaditaan. Enintään 150 merkkiä. Vain kirjaimet, numerot ja @/./+/-/_ ovat sallittuja. */
  readonly username: Scalars["String"]["output"];
  readonly uuid: Scalars["UUID"]["output"];
};

/** An enumeration. */
export enum ApplicantTypeChoice {
  Association = "ASSOCIATION",
  Community = "COMMUNITY",
  Company = "COMPANY",
  Individual = "INDIVIDUAL",
}

export type ApplicationCancelMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type ApplicationCancelMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ApplicationCreateMutationInput = {
  readonly additionalInformation?: InputMaybe<Scalars["String"]["input"]>;
  readonly applicantType?: InputMaybe<ApplicantTypeChoice>;
  readonly applicationRound: Scalars["Int"]["input"];
  readonly applicationSections?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationSectionForApplicationSerializerInput>>
  >;
  readonly billingAddress?: InputMaybe<AddressSerializerInput>;
  readonly contactPerson?: InputMaybe<PersonSerializerInput>;
  readonly homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  readonly organisation?: InputMaybe<OrganisationSerializerInput>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ApplicationCreateMutationPayload = {
  readonly additionalInformation: Maybe<Scalars["String"]["output"]>;
  readonly applicantType: Maybe<ApplicantTypeChoice>;
  readonly applicationRound: Maybe<Scalars["Int"]["output"]>;
  readonly applicationSections: Maybe<
    ReadonlyArray<Maybe<ApplicationSectionNode>>
  >;
  readonly billingAddress: Maybe<AddressNode>;
  readonly cancelledDate: Maybe<Scalars["DateTime"]["output"]>;
  readonly contactPerson: Maybe<PersonNode>;
  readonly createdDate: Maybe<Scalars["DateTime"]["output"]>;
  readonly homeCity: Maybe<Scalars["Int"]["output"]>;
  readonly lastModifiedDate: Maybe<Scalars["DateTime"]["output"]>;
  readonly organisation: Maybe<OrganisationNode>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly sentDate: Maybe<Scalars["DateTime"]["output"]>;
  readonly status: Maybe<Status>;
};

export type ApplicationNode = Node & {
  readonly additionalInformation: Maybe<Scalars["String"]["output"]>;
  readonly applicantType: Maybe<ApplicantTypeChoice>;
  readonly applicationRound: ApplicationRoundNode;
  readonly applicationSections: Maybe<ReadonlyArray<ApplicationSectionNode>>;
  readonly billingAddress: Maybe<AddressNode>;
  readonly cancelledDate: Maybe<Scalars["DateTime"]["output"]>;
  readonly contactPerson: Maybe<PersonNode>;
  readonly createdDate: Scalars["DateTime"]["output"];
  readonly homeCity: Maybe<CityNode>;
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly lastModifiedDate: Scalars["DateTime"]["output"];
  readonly organisation: Maybe<OrganisationNode>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly sentDate: Maybe<Scalars["DateTime"]["output"]>;
  readonly status: ApplicationStatusChoice;
  readonly user: Maybe<ApplicantNode>;
  readonly workingMemo: Scalars["String"]["output"];
};

export type ApplicationNodeApplicationSectionsArgs = {
  ageGroup?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  applicantType?: InputMaybe<ReadonlyArray<InputMaybe<ApplicantTypeChoice>>>;
  application?: InputMaybe<Scalars["Int"]["input"]>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  applicationStatus?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationStatusChoice>>
  >;
  extUuid?: InputMaybe<Scalars["UUID"]["input"]>;
  hasAllocations?: InputMaybe<Scalars["Boolean"]["input"]>;
  homeCity?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  includePreferredOrder10OrHigher?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationSectionOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  preferredOrder?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  priority?: InputMaybe<ReadonlyArray<InputMaybe<Priority>>>;
  purpose?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnit?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  status?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationSectionStatusChoice>>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ApplicationNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ApplicationNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ApplicationNode` and its cursor. */
export type ApplicationNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ApplicationNode>;
};

/** Ordering fields for the 'Application' model. */
export enum ApplicationOrderingChoices {
  ApplicantAsc = "applicantAsc",
  ApplicantDesc = "applicantDesc",
  ApplicantTypeAsc = "applicantTypeAsc",
  ApplicantTypeDesc = "applicantTypeDesc",
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
  PreferredUnitNameEnAsc = "preferredUnitNameEnAsc",
  PreferredUnitNameEnDesc = "preferredUnitNameEnDesc",
  PreferredUnitNameFiAsc = "preferredUnitNameFiAsc",
  PreferredUnitNameFiDesc = "preferredUnitNameFiDesc",
  PreferredUnitNameSvAsc = "preferredUnitNameSvAsc",
  PreferredUnitNameSvDesc = "preferredUnitNameSvDesc",
  SentDateAsc = "sentDateAsc",
  SentDateDesc = "sentDateDesc",
  StatusAsc = "statusAsc",
  StatusDesc = "statusDesc",
}

export type ApplicationRoundNode = Node & {
  readonly applicationPeriodBegin: Scalars["DateTime"]["output"];
  readonly applicationPeriodEnd: Scalars["DateTime"]["output"];
  readonly applicationsCount: Scalars["Int"]["output"];
  readonly criteriaEn: Maybe<Scalars["String"]["output"]>;
  readonly criteriaFi: Maybe<Scalars["String"]["output"]>;
  readonly criteriaSv: Maybe<Scalars["String"]["output"]>;
  readonly handledDate: Maybe<Scalars["DateTime"]["output"]>;
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly isSettingHandledAllowed: Scalars["Boolean"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly notesWhenApplyingEn: Maybe<Scalars["String"]["output"]>;
  readonly notesWhenApplyingFi: Maybe<Scalars["String"]["output"]>;
  readonly notesWhenApplyingSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly publicDisplayBegin: Scalars["DateTime"]["output"];
  readonly publicDisplayEnd: Scalars["DateTime"]["output"];
  readonly purposes: ReadonlyArray<ReservationPurposeNode>;
  readonly reservationCreationStatus: ApplicationRoundReservationCreationStatusChoice;
  readonly reservationPeriodBegin: Scalars["Date"]["output"];
  readonly reservationPeriodEnd: Scalars["Date"]["output"];
  readonly reservationUnitCount: Scalars["Int"]["output"];
  readonly reservationUnits: ReadonlyArray<ReservationUnitNode>;
  readonly sentDate: Maybe<Scalars["DateTime"]["output"]>;
  readonly status: ApplicationRoundStatusChoice;
  readonly statusTimestamp: Maybe<Scalars["DateTime"]["output"]>;
  readonly termsOfUse: Maybe<TermsOfUseNode>;
};

export type ApplicationRoundNodePurposesArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationPurposeOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ApplicationRoundNodeReservationUnitsArgs = {
  accessType?: InputMaybe<ReadonlyArray<InputMaybe<AccessType>>>;
  accessTypeBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  accessTypeEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  applicationRound?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  calculateFirstReservableTime?: InputMaybe<Scalars["Boolean"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  equipments?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]["input"]>;
  maxPersonsGte?: InputMaybe<Scalars["Int"]["input"]>;
  maxPersonsLte?: InputMaybe<Scalars["Int"]["input"]>;
  minPersonsGte?: InputMaybe<Scalars["Int"]["input"]>;
  minPersonsLte?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitOrderingChoices>>
  >;
  personsAllowed?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  publishingState?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitPublishingState>>
  >;
  purposes?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifiers?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Int"]["input"]>;
  rankLte?: InputMaybe<Scalars["Int"]["input"]>;
  reservableDateEnd?: InputMaybe<Scalars["Date"]["input"]>;
  reservableDateStart?: InputMaybe<Scalars["Date"]["input"]>;
  reservableMinimumDurationMinutes?: InputMaybe<Scalars["Int"]["input"]>;
  reservableTimeEnd?: InputMaybe<Scalars["Time"]["input"]>;
  reservableTimeStart?: InputMaybe<Scalars["Time"]["input"]>;
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
  reservationState?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitReservationState>>
  >;
  reservationUnitType?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  surfaceAreaGte?: InputMaybe<Scalars["Int"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Int"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  tprekDepartmentId?: InputMaybe<Scalars["String"]["input"]>;
  tprekId?: InputMaybe<Scalars["String"]["input"]>;
  typeRankGte?: InputMaybe<Scalars["Int"]["input"]>;
  typeRankLte?: InputMaybe<Scalars["Int"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  uuid?: InputMaybe<Scalars["UUID"]["input"]>;
};

export type ApplicationRoundNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ApplicationRoundNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ApplicationRoundNode` and its cursor. */
export type ApplicationRoundNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ApplicationRoundNode>;
};

/** Ordering fields for the 'ApplicationRound' model. */
export enum ApplicationRoundOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

/** An enumeration. */
export enum ApplicationRoundReservationCreationStatusChoice {
  Completed = "COMPLETED",
  Failed = "FAILED",
  NotCompleted = "NOT_COMPLETED",
}

/** An enumeration. */
export enum ApplicationRoundStatusChoice {
  Handled = "HANDLED",
  InAllocation = "IN_ALLOCATION",
  Open = "OPEN",
  ResultsSent = "RESULTS_SENT",
  Upcoming = "UPCOMING",
}

export type ApplicationRoundTimeSlotNode = Node & {
  readonly closed: Scalars["Boolean"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly reservableTimes: ReadonlyArray<Maybe<TimeSlotType>>;
  readonly weekday: Scalars["Int"]["output"];
};

export type ApplicationRoundTimeSlotSerializerInput = {
  readonly closed?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly reservableTimes?: InputMaybe<
    ReadonlyArray<InputMaybe<TimeSlotSerializerInput>>
  >;
  readonly weekday: Scalars["Int"]["input"];
};

export type ApplicationSectionCreateMutationInput = {
  readonly ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly application: Scalars["Int"]["input"];
  readonly appliedReservationsPerWeek: Scalars["Int"]["input"];
  readonly name: Scalars["String"]["input"];
  readonly numPersons: Scalars["Int"]["input"];
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly purpose?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationMaxDuration: Scalars["Duration"]["input"];
  readonly reservationMinDuration: Scalars["Duration"]["input"];
  readonly reservationUnitOptions: ReadonlyArray<
    InputMaybe<ReservationUnitOptionApplicantSerializerInput>
  >;
  readonly reservationsBeginDate: Scalars["Date"]["input"];
  readonly reservationsEndDate: Scalars["Date"]["input"];
  readonly suitableTimeRanges: ReadonlyArray<
    InputMaybe<SuitableTimeRangeSerializerInput>
  >;
};

export type ApplicationSectionCreateMutationPayload = {
  readonly ageGroup: Maybe<Scalars["Int"]["output"]>;
  readonly application: Maybe<Scalars["Int"]["output"]>;
  readonly appliedReservationsPerWeek: Maybe<Scalars["Int"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly numPersons: Maybe<Scalars["Int"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly purpose: Maybe<Scalars["Int"]["output"]>;
  readonly reservationMaxDuration: Maybe<Scalars["Duration"]["output"]>;
  readonly reservationMinDuration: Maybe<Scalars["Duration"]["output"]>;
  readonly reservationUnitOptions: Maybe<
    ReadonlyArray<Maybe<ReservationUnitOptionNode>>
  >;
  readonly reservationsBeginDate: Maybe<Scalars["Date"]["output"]>;
  readonly reservationsEndDate: Maybe<Scalars["Date"]["output"]>;
  readonly suitableTimeRanges: Maybe<
    ReadonlyArray<Maybe<SuitableTimeRangeNode>>
  >;
};

export type ApplicationSectionDeleteMutationInput = {
  readonly pk: Scalars["ID"]["input"];
};

export type ApplicationSectionDeleteMutationPayload = {
  readonly deleted: Maybe<Scalars["Boolean"]["output"]>;
};

export type ApplicationSectionForApplicationSerializerInput = {
  readonly ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly appliedReservationsPerWeek: Scalars["Int"]["input"];
  readonly name: Scalars["String"]["input"];
  readonly numPersons: Scalars["Int"]["input"];
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly purpose?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationMaxDuration: Scalars["Duration"]["input"];
  readonly reservationMinDuration: Scalars["Duration"]["input"];
  readonly reservationUnitOptions: ReadonlyArray<
    InputMaybe<ReservationUnitOptionApplicantSerializerInput>
  >;
  readonly reservationsBeginDate: Scalars["Date"]["input"];
  readonly reservationsEndDate: Scalars["Date"]["input"];
  readonly suitableTimeRanges: ReadonlyArray<
    InputMaybe<SuitableTimeRangeSerializerInput>
  >;
};

export type ApplicationSectionNode = Node & {
  readonly ageGroup: Maybe<AgeGroupNode>;
  readonly allocations: Scalars["Int"]["output"];
  readonly application: ApplicationNode;
  readonly appliedReservationsPerWeek: Scalars["Int"]["output"];
  readonly extUuid: Scalars["UUID"]["output"];
  readonly hasReservations: Scalars["Boolean"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly name: Scalars["String"]["output"];
  readonly numPersons: Scalars["Int"]["output"];
  /** Info fetched from Pindora API. Cached per reservation for 30s. Please don't use this when filtering multiple sections, queries to Pindora are not optimized. */
  readonly pindoraInfo: Maybe<PindoraSectionInfoType>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly purpose: Maybe<ReservationPurposeNode>;
  readonly reservationMaxDuration: Scalars["Duration"]["output"];
  readonly reservationMinDuration: Scalars["Duration"]["output"];
  readonly reservationUnitOptions: ReadonlyArray<ReservationUnitOptionNode>;
  readonly reservationsBeginDate: Scalars["Date"]["output"];
  readonly reservationsEndDate: Scalars["Date"]["output"];
  readonly shouldHaveActiveAccessCode: Scalars["Boolean"]["output"];
  readonly status: ApplicationSectionStatusChoice;
  readonly suitableTimeRanges: ReadonlyArray<SuitableTimeRangeNode>;
};

export type ApplicationSectionNodeReservationUnitOptionsArgs = {
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitOptionOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  preferredOrder?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  reservationUnit?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
};

export type ApplicationSectionNodeSuitableTimeRangesArgs = {
  fulfilled?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<SuitableTimeRangeOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  priority?: InputMaybe<ReadonlyArray<InputMaybe<Priority>>>;
};

export type ApplicationSectionNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ApplicationSectionNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ApplicationSectionNode` and its cursor. */
export type ApplicationSectionNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ApplicationSectionNode>;
};

/** Ordering fields for the 'ApplicationSection' model. */
export enum ApplicationSectionOrderingChoices {
  AllocationsAsc = "allocationsAsc",
  AllocationsDesc = "allocationsDesc",
  ApplicantAsc = "applicantAsc",
  ApplicantDesc = "applicantDesc",
  ApplicationPkAsc = "applicationPkAsc",
  ApplicationPkDesc = "applicationPkDesc",
  ApplicationStatusAsc = "applicationStatusAsc",
  ApplicationStatusDesc = "applicationStatusDesc",
  HasAllocationsAsc = "hasAllocationsAsc",
  HasAllocationsDesc = "hasAllocationsDesc",
  NameAsc = "nameAsc",
  NameDesc = "nameDesc",
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
  PreferredUnitNameEnAsc = "preferredUnitNameEnAsc",
  PreferredUnitNameEnDesc = "preferredUnitNameEnDesc",
  PreferredUnitNameFiAsc = "preferredUnitNameFiAsc",
  PreferredUnitNameFiDesc = "preferredUnitNameFiDesc",
  PreferredUnitNameSvAsc = "preferredUnitNameSvAsc",
  PreferredUnitNameSvDesc = "preferredUnitNameSvDesc",
  StatusAsc = "statusAsc",
  StatusDesc = "statusDesc",
}

export type ApplicationSectionReservationCancellationMutationInput = {
  readonly cancelDetails?: InputMaybe<Scalars["String"]["input"]>;
  readonly cancelReason: Scalars["Int"]["input"];
  readonly pk: Scalars["Int"]["input"];
};

export type ApplicationSectionReservationCancellationMutationPayload = {
  readonly cancelled: Maybe<Scalars["Int"]["output"]>;
  readonly future: Maybe<Scalars["Int"]["output"]>;
};

/** An enumeration. */
export enum ApplicationSectionStatusChoice {
  Handled = "HANDLED",
  InAllocation = "IN_ALLOCATION",
  Rejected = "REJECTED",
  Unallocated = "UNALLOCATED",
}

export type ApplicationSectionUpdateMutationInput = {
  readonly ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly application?: InputMaybe<Scalars["Int"]["input"]>;
  readonly appliedReservationsPerWeek?: InputMaybe<Scalars["Int"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
  readonly purpose?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationMaxDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly reservationMinDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly reservationUnitOptions?: InputMaybe<
    ReadonlyArray<
      InputMaybe<UpdateReservationUnitOptionApplicantSerializerInput>
    >
  >;
  readonly reservationsBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  readonly reservationsEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  readonly suitableTimeRanges?: InputMaybe<
    ReadonlyArray<InputMaybe<UpdateSuitableTimeRangeSerializerInput>>
  >;
};

export type ApplicationSectionUpdateMutationPayload = {
  readonly ageGroup: Maybe<Scalars["Int"]["output"]>;
  readonly application: Maybe<Scalars["Int"]["output"]>;
  readonly appliedReservationsPerWeek: Maybe<Scalars["Int"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly numPersons: Maybe<Scalars["Int"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly purpose: Maybe<Scalars["Int"]["output"]>;
  readonly reservationMaxDuration: Maybe<Scalars["Duration"]["output"]>;
  readonly reservationMinDuration: Maybe<Scalars["Duration"]["output"]>;
  readonly reservationUnitOptions: Maybe<
    ReadonlyArray<Maybe<ReservationUnitOptionNode>>
  >;
  readonly reservationsBeginDate: Maybe<Scalars["Date"]["output"]>;
  readonly reservationsEndDate: Maybe<Scalars["Date"]["output"]>;
  readonly suitableTimeRanges: Maybe<
    ReadonlyArray<Maybe<SuitableTimeRangeNode>>
  >;
};

export type ApplicationSendMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type ApplicationSendMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

/** An enumeration. */
export enum ApplicationStatusChoice {
  Cancelled = "CANCELLED",
  Draft = "DRAFT",
  Expired = "EXPIRED",
  Handled = "HANDLED",
  InAllocation = "IN_ALLOCATION",
  Received = "RECEIVED",
  ResultsSent = "RESULTS_SENT",
}

export type ApplicationUpdateMutationInput = {
  readonly additionalInformation?: InputMaybe<Scalars["String"]["input"]>;
  readonly applicantType?: InputMaybe<ApplicantTypeChoice>;
  readonly applicationSections?: InputMaybe<
    ReadonlyArray<
      InputMaybe<UpdateApplicationSectionForApplicationSerializerInput>
    >
  >;
  readonly billingAddress?: InputMaybe<UpdateAddressSerializerInput>;
  readonly contactPerson?: InputMaybe<UpdatePersonSerializerInput>;
  readonly homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  readonly organisation?: InputMaybe<UpdateOrganisationSerializerInput>;
  readonly pk: Scalars["Int"]["input"];
};

export type ApplicationUpdateMutationPayload = {
  readonly additionalInformation: Maybe<Scalars["String"]["output"]>;
  readonly applicantType: Maybe<ApplicantTypeChoice>;
  readonly applicationRound: Maybe<Scalars["ID"]["output"]>;
  readonly applicationSections: Maybe<
    ReadonlyArray<Maybe<ApplicationSectionNode>>
  >;
  readonly billingAddress: Maybe<AddressNode>;
  readonly cancelledDate: Maybe<Scalars["DateTime"]["output"]>;
  readonly contactPerson: Maybe<PersonNode>;
  readonly createdDate: Maybe<Scalars["DateTime"]["output"]>;
  readonly homeCity: Maybe<Scalars["Int"]["output"]>;
  readonly lastModifiedDate: Maybe<Scalars["DateTime"]["output"]>;
  readonly organisation: Maybe<OrganisationNode>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly sentDate: Maybe<Scalars["DateTime"]["output"]>;
  readonly status: Maybe<Status>;
  readonly user: Maybe<Scalars["ID"]["output"]>;
};

export type ApplicationWorkingMemoMutationInput = {
  readonly pk: Scalars["Int"]["input"];
  readonly workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ApplicationWorkingMemoMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly workingMemo: Maybe<Scalars["String"]["output"]>;
};

/** An enumeration. */
export enum Authentication {
  /** Vahva */
  Strong = "STRONG",
  /** Heikko */
  Weak = "WEAK",
}

export type BannerNotificationCreateMutationInput = {
  readonly activeFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly activeUntil?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly draft?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly level: BannerNotificationLevel;
  readonly message?: InputMaybe<Scalars["String"]["input"]>;
  readonly messageEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly messageFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly messageSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly name: Scalars["String"]["input"];
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly target: BannerNotificationTarget;
};

export type BannerNotificationCreateMutationPayload = {
  readonly activeFrom: Maybe<Scalars["DateTime"]["output"]>;
  readonly activeUntil: Maybe<Scalars["DateTime"]["output"]>;
  readonly draft: Maybe<Scalars["Boolean"]["output"]>;
  readonly level: Maybe<BannerNotificationLevel>;
  readonly message: Maybe<Scalars["String"]["output"]>;
  readonly messageEn: Maybe<Scalars["String"]["output"]>;
  readonly messageFi: Maybe<Scalars["String"]["output"]>;
  readonly messageSv: Maybe<Scalars["String"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly target: Maybe<BannerNotificationTarget>;
};

export type BannerNotificationDeleteMutationInput = {
  readonly pk: Scalars["ID"]["input"];
};

export type BannerNotificationDeleteMutationPayload = {
  readonly deleted: Maybe<Scalars["Boolean"]["output"]>;
};

/** An enumeration. */
export enum BannerNotificationLevel {
  /** Poikkeus */
  Exception = "EXCEPTION",
  /** Normaali */
  Normal = "NORMAL",
  /** Varoitus */
  Warning = "WARNING",
}

export type BannerNotificationNode = Node & {
  readonly activeFrom: Maybe<Scalars["DateTime"]["output"]>;
  readonly activeUntil: Maybe<Scalars["DateTime"]["output"]>;
  readonly draft: Scalars["Boolean"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly level: BannerNotificationLevel;
  readonly messageEn: Maybe<Scalars["String"]["output"]>;
  readonly messageFi: Maybe<Scalars["String"]["output"]>;
  readonly messageSv: Maybe<Scalars["String"]["output"]>;
  readonly name: Scalars["String"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly state: BannerNotificationState;
  readonly target: BannerNotificationTarget;
};

export type BannerNotificationNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<BannerNotificationNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `BannerNotificationNode` and its cursor. */
export type BannerNotificationNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<BannerNotificationNode>;
};

/** Ordering fields for the 'BannerNotification' model. */
export enum BannerNotificationOrderingChoices {
  EndsAsc = "endsAsc",
  EndsDesc = "endsDesc",
  LevelAsc = "levelAsc",
  LevelDesc = "levelDesc",
  NameAsc = "nameAsc",
  NameDesc = "nameDesc",
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
  StartsAsc = "startsAsc",
  StartsDesc = "startsDesc",
  StateAsc = "stateAsc",
  StateDesc = "stateDesc",
  TargetAsc = "targetAsc",
  TargetDesc = "targetDesc",
}

/** An enumeration. */
export enum BannerNotificationState {
  Active = "ACTIVE",
  Draft = "DRAFT",
  Scheduled = "SCHEDULED",
}

/** An enumeration. */
export enum BannerNotificationTarget {
  /** Kaikki */
  All = "ALL",
  /** Henkilökunta */
  Staff = "STAFF",
  /** Käyttäjä */
  User = "USER",
}

export type BannerNotificationUpdateMutationInput = {
  readonly activeFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly activeUntil?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly draft?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly level?: InputMaybe<BannerNotificationLevel>;
  readonly message?: InputMaybe<Scalars["String"]["input"]>;
  readonly messageEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly messageFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly messageSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
  readonly target?: InputMaybe<BannerNotificationTarget>;
};

export type BannerNotificationUpdateMutationPayload = {
  readonly activeFrom: Maybe<Scalars["DateTime"]["output"]>;
  readonly activeUntil: Maybe<Scalars["DateTime"]["output"]>;
  readonly draft: Maybe<Scalars["Boolean"]["output"]>;
  readonly level: Maybe<BannerNotificationLevel>;
  readonly message: Maybe<Scalars["String"]["output"]>;
  readonly messageEn: Maybe<Scalars["String"]["output"]>;
  readonly messageFi: Maybe<Scalars["String"]["output"]>;
  readonly messageSv: Maybe<Scalars["String"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly target: Maybe<BannerNotificationTarget>;
};

export type CityNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly municipalityCode: Scalars["String"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type CityNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<CityNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `CityNode` and its cursor. */
export type CityNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<CityNode>;
};

export type CurrentUserUpdateMutationInput = {
  readonly preferredLanguage?: InputMaybe<PreferredLanguage>;
};

export type CurrentUserUpdateMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly preferredLanguage: Maybe<PreferredLanguage>;
};

/** An enumeration. */
export enum CustomerTypeChoice {
  Business = "BUSINESS",
  Individual = "INDIVIDUAL",
  Nonprofit = "NONPROFIT",
}

/** This Node should be kept to the bare minimum and never expose any relations to avoid performance issues. */
export type EquipmentAllNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCategoryCreateMutationInput = {
  readonly name: Scalars["String"]["input"];
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type EquipmentCategoryCreateMutationPayload = {
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCategoryDeleteMutationInput = {
  readonly pk: Scalars["ID"]["input"];
};

export type EquipmentCategoryDeleteMutationPayload = {
  readonly deleted: Maybe<Scalars["Boolean"]["output"]>;
};

export type EquipmentCategoryNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCategoryNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<EquipmentCategoryNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `EquipmentCategoryNode` and its cursor. */
export type EquipmentCategoryNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<EquipmentCategoryNode>;
};

/** Ordering fields for the 'EquipmentCategory' model. */
export enum EquipmentCategoryOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type EquipmentCategoryUpdateMutationInput = {
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
};

export type EquipmentCategoryUpdateMutationPayload = {
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCreateMutationInput = {
  readonly category: Scalars["Int"]["input"];
  readonly name: Scalars["String"]["input"];
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type EquipmentCreateMutationPayload = {
  readonly category: Maybe<Scalars["Int"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentDeleteMutationInput = {
  readonly pk: Scalars["ID"]["input"];
};

export type EquipmentDeleteMutationPayload = {
  readonly deleted: Maybe<Scalars["Boolean"]["output"]>;
};

export type EquipmentNode = Node & {
  readonly category: EquipmentCategoryNode;
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<EquipmentNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `EquipmentNode` and its cursor. */
export type EquipmentNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<EquipmentNode>;
};

/** Ordering fields for the 'Equipment' model. */
export enum EquipmentOrderingChoices {
  CategoryRankAsc = "categoryRankAsc",
  CategoryRankDesc = "categoryRankDesc",
  NameAsc = "nameAsc",
  NameDesc = "nameDesc",
  NameEnAsc = "nameEnAsc",
  NameEnDesc = "nameEnDesc",
  NameFiAsc = "nameFiAsc",
  NameFiDesc = "nameFiDesc",
  NameSvAsc = "nameSvAsc",
  NameSvDesc = "nameSvDesc",
}

export type EquipmentUpdateMutationInput = {
  readonly category?: InputMaybe<Scalars["Int"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
};

export type EquipmentUpdateMutationPayload = {
  readonly category: Maybe<Scalars["Int"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type GeneralRoleNode = Node & {
  readonly assigner: Maybe<UserNode>;
  readonly created: Scalars["DateTime"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly modified: Scalars["DateTime"]["output"];
  readonly permissions: ReadonlyArray<UserPermissionChoice>;
  readonly role: UserRoleChoice;
  readonly user: UserNode;
};

export type HelsinkiProfileDataNode = {
  readonly birthday: Maybe<Scalars["Date"]["output"]>;
  readonly city: Maybe<Scalars["String"]["output"]>;
  readonly email: Maybe<Scalars["String"]["output"]>;
  readonly firstName: Maybe<Scalars["String"]["output"]>;
  readonly isStrongLogin: Scalars["Boolean"]["output"];
  readonly lastName: Maybe<Scalars["String"]["output"]>;
  readonly loginMethod: LoginMethod;
  readonly municipalityCode: Maybe<Scalars["String"]["output"]>;
  readonly municipalityName: Maybe<Scalars["String"]["output"]>;
  readonly phone: Maybe<Scalars["String"]["output"]>;
  readonly pk: Scalars["Int"]["output"];
  readonly postalCode: Maybe<Scalars["String"]["output"]>;
  readonly ssn: Maybe<Scalars["String"]["output"]>;
  readonly streetAddress: Maybe<Scalars["String"]["output"]>;
};

/** An enumeration. */
export enum ImageType {
  /** Pääkuva */
  Main = "MAIN",
  /** Muu */
  Other = "OTHER",
}

export type LocationNode = Node & {
  readonly addressCityEn: Maybe<Scalars["String"]["output"]>;
  readonly addressCityFi: Maybe<Scalars["String"]["output"]>;
  readonly addressCitySv: Maybe<Scalars["String"]["output"]>;
  readonly addressStreetEn: Maybe<Scalars["String"]["output"]>;
  readonly addressStreetFi: Maybe<Scalars["String"]["output"]>;
  readonly addressStreetSv: Maybe<Scalars["String"]["output"]>;
  readonly addressZip: Scalars["String"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly latitude: Maybe<Scalars["String"]["output"]>;
  readonly longitude: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

/** An enumeration. */
export enum LocationType {
  /** Kiinteä */
  Fixed = "FIXED",
  /** Siirrettävä */
  Movable = "MOVABLE",
}

/** An enumeration. */
export enum LoginMethod {
  Ad = "AD",
  Other = "OTHER",
  Profile = "PROFILE",
}

export type Mutation = {
  readonly addReservationToSeries: Maybe<ReservationSeriesAddMutationPayload>;
  readonly adjustReservationTime: Maybe<ReservationAdjustTimeMutationPayload>;
  readonly approveReservation: Maybe<ReservationApproveMutationPayload>;
  readonly cancelAllApplicationSectionReservations: Maybe<ApplicationSectionReservationCancellationMutationPayload>;
  readonly cancelApplication: Maybe<ApplicationCancelMutationPayload>;
  readonly cancelReservation: Maybe<ReservationCancellationMutationPayload>;
  readonly changeReservationSeriesAccessCode: Maybe<ReservationSeriesChangeAccessCodeMutationPayload>;
  readonly confirmReservation: Maybe<ReservationConfirmMutationPayload>;
  readonly createAllocatedTimeslot: Maybe<AllocatedTimeSlotCreateMutationPayload>;
  readonly createApplication: Maybe<ApplicationCreateMutationPayload>;
  readonly createApplicationSection: Maybe<ApplicationSectionCreateMutationPayload>;
  readonly createBannerNotification: Maybe<BannerNotificationCreateMutationPayload>;
  readonly createEquipment: Maybe<EquipmentCreateMutationPayload>;
  readonly createEquipmentCategory: Maybe<EquipmentCategoryCreateMutationPayload>;
  readonly createPurpose: Maybe<PurposeCreateMutationPayload>;
  readonly createReservation: Maybe<ReservationCreateMutationPayload>;
  readonly createReservationSeries: Maybe<ReservationSeriesCreateMutationPayload>;
  readonly createReservationUnit: Maybe<ReservationUnitCreateMutationPayload>;
  readonly createReservationUnitImage: Maybe<ReservationUnitImageCreateMutationPayload>;
  readonly createResource: Maybe<ResourceCreateMutationPayload>;
  readonly createSpace: Maybe<SpaceCreateMutationPayload>;
  readonly createStaffReservation: Maybe<ReservationStaffCreateMutationPayload>;
  readonly deleteAllocatedTimeslot: Maybe<AllocatedTimeSlotDeleteMutationPayload>;
  readonly deleteApplicationSection: Maybe<ApplicationSectionDeleteMutationPayload>;
  readonly deleteBannerNotification: Maybe<BannerNotificationDeleteMutationPayload>;
  readonly deleteEquipment: Maybe<EquipmentDeleteMutationPayload>;
  readonly deleteEquipmentCategory: Maybe<EquipmentCategoryDeleteMutationPayload>;
  /** @deprecated Renamed to 'deleteTentativeReservation'. */
  readonly deleteReservation: Maybe<ReservationDeleteMutationPayload>;
  readonly deleteReservationUnitImage: Maybe<ReservationUnitImageDeleteMutationPayload>;
  readonly deleteResource: Maybe<ResourceDeleteMutationPayload>;
  readonly deleteSpace: Maybe<SpaceDeleteMutationPayload>;
  /** Used only for deleting a reservation before it is confirmed. */
  readonly deleteTentativeReservation: Maybe<ReservationDeleteTentativeMutationPayload>;
  readonly denyReservation: Maybe<ReservationDenyMutationPayload>;
  readonly denyReservationSeries: Maybe<ReservationSeriesDenyMutationPayload>;
  readonly refreshOrder: Maybe<RefreshOrderMutationPayload>;
  readonly refundReservation: Maybe<ReservationRefundMutationPayload>;
  readonly rejectAllApplicationOptions: Maybe<RejectAllApplicationOptionsMutationPayload>;
  readonly rejectAllSectionOptions: Maybe<RejectAllSectionOptionsMutationPayload>;
  readonly repairReservationSeriesAccessCode: Maybe<ReservationSeriesRepairAccessCodeMutationPayload>;
  readonly requireHandlingForReservation: Maybe<ReservationRequiresHandlingMutationPayload>;
  readonly rescheduleReservationSeries: Maybe<ReservationSeriesRescheduleMutationPayload>;
  readonly restoreAllApplicationOptions: Maybe<RestoreAllApplicationOptionsMutationPayload>;
  readonly restoreAllSectionOptions: Maybe<RestoreAllSectionOptionsMutationPayload>;
  readonly sendApplication: Maybe<ApplicationSendMutationPayload>;
  readonly setApplicationRoundHandled: Maybe<SetApplicationRoundHandledMutationPayload>;
  readonly setApplicationRoundResultsSent: Maybe<SetApplicationRoundResultsSentMutationPayload>;
  readonly staffAdjustReservationTime: Maybe<ReservationStaffAdjustTimeMutationPayload>;
  readonly staffChangeReservationAccessCode: Maybe<ReservationStaffChangeAccessCodeMutationPayload>;
  readonly staffRepairReservationAccessCode: Maybe<ReservationStaffRepairAccessCodeMutationPayload>;
  readonly staffReservationModify: Maybe<ReservationStaffModifyMutationPayload>;
  readonly updateApplication: Maybe<ApplicationUpdateMutationPayload>;
  readonly updateApplicationSection: Maybe<ApplicationSectionUpdateMutationPayload>;
  readonly updateApplicationWorkingMemo: Maybe<ApplicationWorkingMemoMutationPayload>;
  readonly updateBannerNotification: Maybe<BannerNotificationUpdateMutationPayload>;
  readonly updateCurrentUser: Maybe<CurrentUserUpdateMutationPayload>;
  readonly updateEquipment: Maybe<EquipmentUpdateMutationPayload>;
  readonly updateEquipmentCategory: Maybe<EquipmentCategoryUpdateMutationPayload>;
  readonly updatePurpose: Maybe<PurposeUpdateMutationPayload>;
  readonly updateReservation: Maybe<ReservationUpdateMutationPayload>;
  readonly updateReservationSeries: Maybe<ReservationSeriesUpdateMutationPayload>;
  readonly updateReservationUnit: Maybe<ReservationUnitUpdateMutationPayload>;
  readonly updateReservationUnitImage: Maybe<ReservationUnitImageUpdateMutationPayload>;
  readonly updateReservationUnitOption: Maybe<ReservationUnitOptionUpdateMutationPayload>;
  readonly updateReservationWorkingMemo: Maybe<ReservationWorkingMemoMutationPayload>;
  readonly updateResource: Maybe<ResourceUpdateMutationPayload>;
  readonly updateSpace: Maybe<SpaceUpdateMutationPayload>;
  readonly updateStaffUser: Maybe<UserStaffUpdateMutationPayload>;
  readonly updateUnit: Maybe<UnitUpdateMutationPayload>;
};

export type MutationAddReservationToSeriesArgs = {
  input: ReservationSeriesAddMutationInput;
};

export type MutationAdjustReservationTimeArgs = {
  input: ReservationAdjustTimeMutationInput;
};

export type MutationApproveReservationArgs = {
  input: ReservationApproveMutationInput;
};

export type MutationCancelAllApplicationSectionReservationsArgs = {
  input: ApplicationSectionReservationCancellationMutationInput;
};

export type MutationCancelApplicationArgs = {
  input: ApplicationCancelMutationInput;
};

export type MutationCancelReservationArgs = {
  input: ReservationCancellationMutationInput;
};

export type MutationChangeReservationSeriesAccessCodeArgs = {
  input: ReservationSeriesChangeAccessCodeMutationInput;
};

export type MutationConfirmReservationArgs = {
  input: ReservationConfirmMutationInput;
};

export type MutationCreateAllocatedTimeslotArgs = {
  input: AllocatedTimeSlotCreateMutationInput;
};

export type MutationCreateApplicationArgs = {
  input: ApplicationCreateMutationInput;
};

export type MutationCreateApplicationSectionArgs = {
  input: ApplicationSectionCreateMutationInput;
};

export type MutationCreateBannerNotificationArgs = {
  input: BannerNotificationCreateMutationInput;
};

export type MutationCreateEquipmentArgs = {
  input: EquipmentCreateMutationInput;
};

export type MutationCreateEquipmentCategoryArgs = {
  input: EquipmentCategoryCreateMutationInput;
};

export type MutationCreatePurposeArgs = {
  input: PurposeCreateMutationInput;
};

export type MutationCreateReservationArgs = {
  input: ReservationCreateMutationInput;
};

export type MutationCreateReservationSeriesArgs = {
  input: ReservationSeriesCreateMutationInput;
};

export type MutationCreateReservationUnitArgs = {
  input: ReservationUnitCreateMutationInput;
};

export type MutationCreateReservationUnitImageArgs = {
  input: ReservationUnitImageCreateMutationInput;
};

export type MutationCreateResourceArgs = {
  input: ResourceCreateMutationInput;
};

export type MutationCreateSpaceArgs = {
  input: SpaceCreateMutationInput;
};

export type MutationCreateStaffReservationArgs = {
  input: ReservationStaffCreateMutationInput;
};

export type MutationDeleteAllocatedTimeslotArgs = {
  input: AllocatedTimeSlotDeleteMutationInput;
};

export type MutationDeleteApplicationSectionArgs = {
  input: ApplicationSectionDeleteMutationInput;
};

export type MutationDeleteBannerNotificationArgs = {
  input: BannerNotificationDeleteMutationInput;
};

export type MutationDeleteEquipmentArgs = {
  input: EquipmentDeleteMutationInput;
};

export type MutationDeleteEquipmentCategoryArgs = {
  input: EquipmentCategoryDeleteMutationInput;
};

export type MutationDeleteReservationArgs = {
  input: ReservationDeleteMutationInput;
};

export type MutationDeleteReservationUnitImageArgs = {
  input: ReservationUnitImageDeleteMutationInput;
};

export type MutationDeleteResourceArgs = {
  input: ResourceDeleteMutationInput;
};

export type MutationDeleteSpaceArgs = {
  input: SpaceDeleteMutationInput;
};

export type MutationDeleteTentativeReservationArgs = {
  input: ReservationDeleteTentativeMutationInput;
};

export type MutationDenyReservationArgs = {
  input: ReservationDenyMutationInput;
};

export type MutationDenyReservationSeriesArgs = {
  input: ReservationSeriesDenyMutationInput;
};

export type MutationRefreshOrderArgs = {
  input: RefreshOrderMutationInput;
};

export type MutationRefundReservationArgs = {
  input: ReservationRefundMutationInput;
};

export type MutationRejectAllApplicationOptionsArgs = {
  input: RejectAllApplicationOptionsMutationInput;
};

export type MutationRejectAllSectionOptionsArgs = {
  input: RejectAllSectionOptionsMutationInput;
};

export type MutationRepairReservationSeriesAccessCodeArgs = {
  input: ReservationSeriesRepairAccessCodeMutationInput;
};

export type MutationRequireHandlingForReservationArgs = {
  input: ReservationRequiresHandlingMutationInput;
};

export type MutationRescheduleReservationSeriesArgs = {
  input: ReservationSeriesRescheduleMutationInput;
};

export type MutationRestoreAllApplicationOptionsArgs = {
  input: RestoreAllApplicationOptionsMutationInput;
};

export type MutationRestoreAllSectionOptionsArgs = {
  input: RestoreAllSectionOptionsMutationInput;
};

export type MutationSendApplicationArgs = {
  input: ApplicationSendMutationInput;
};

export type MutationSetApplicationRoundHandledArgs = {
  input: SetApplicationRoundHandledMutationInput;
};

export type MutationSetApplicationRoundResultsSentArgs = {
  input: SetApplicationRoundResultsSentMutationInput;
};

export type MutationStaffAdjustReservationTimeArgs = {
  input: ReservationStaffAdjustTimeMutationInput;
};

export type MutationStaffChangeReservationAccessCodeArgs = {
  input: ReservationStaffChangeAccessCodeMutationInput;
};

export type MutationStaffRepairReservationAccessCodeArgs = {
  input: ReservationStaffRepairAccessCodeMutationInput;
};

export type MutationStaffReservationModifyArgs = {
  input: ReservationStaffModifyMutationInput;
};

export type MutationUpdateApplicationArgs = {
  input: ApplicationUpdateMutationInput;
};

export type MutationUpdateApplicationSectionArgs = {
  input: ApplicationSectionUpdateMutationInput;
};

export type MutationUpdateApplicationWorkingMemoArgs = {
  input: ApplicationWorkingMemoMutationInput;
};

export type MutationUpdateBannerNotificationArgs = {
  input: BannerNotificationUpdateMutationInput;
};

export type MutationUpdateCurrentUserArgs = {
  input: CurrentUserUpdateMutationInput;
};

export type MutationUpdateEquipmentArgs = {
  input: EquipmentUpdateMutationInput;
};

export type MutationUpdateEquipmentCategoryArgs = {
  input: EquipmentCategoryUpdateMutationInput;
};

export type MutationUpdatePurposeArgs = {
  input: PurposeUpdateMutationInput;
};

export type MutationUpdateReservationArgs = {
  input: ReservationUpdateMutationInput;
};

export type MutationUpdateReservationSeriesArgs = {
  input: ReservationSeriesUpdateMutationInput;
};

export type MutationUpdateReservationUnitArgs = {
  input: ReservationUnitUpdateMutationInput;
};

export type MutationUpdateReservationUnitImageArgs = {
  input: ReservationUnitImageUpdateMutationInput;
};

export type MutationUpdateReservationUnitOptionArgs = {
  input: ReservationUnitOptionUpdateMutationInput;
};

export type MutationUpdateReservationWorkingMemoArgs = {
  input: ReservationWorkingMemoMutationInput;
};

export type MutationUpdateResourceArgs = {
  input: ResourceUpdateMutationInput;
};

export type MutationUpdateSpaceArgs = {
  input: SpaceUpdateMutationInput;
};

export type MutationUpdateStaffUserArgs = {
  input: UserStaffUpdateMutationInput;
};

export type MutationUpdateUnitArgs = {
  input: UnitUpdateMutationInput;
};

/** An object with an ID */
export type Node = {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
};

/** An enumeration. */
export enum OrderStatus {
  Cancelled = "CANCELLED",
  Draft = "DRAFT",
  Expired = "EXPIRED",
  Paid = "PAID",
  PaidManually = "PAID_MANUALLY",
  Refunded = "REFUNDED",
}

/** Same as OrderStatus, but includes the 'FREE' option used for filtering reservations without payments. */
export enum OrderStatusWithFree {
  Cancelled = "CANCELLED",
  Draft = "DRAFT",
  Expired = "EXPIRED",
  Free = "FREE",
  Paid = "PAID",
  PaidManually = "PAID_MANUALLY",
  Refunded = "REFUNDED",
}

export type OrganisationNode = Node & {
  readonly activeMembers: Maybe<Scalars["Int"]["output"]>;
  readonly address: Maybe<AddressNode>;
  readonly coreBusinessEn: Maybe<Scalars["String"]["output"]>;
  readonly coreBusinessFi: Maybe<Scalars["String"]["output"]>;
  readonly coreBusinessSv: Maybe<Scalars["String"]["output"]>;
  readonly email: Scalars["String"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly identifier: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly organisationType: OrganizationTypeChoice;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly yearEstablished: Maybe<Scalars["Int"]["output"]>;
};

export type OrganisationSerializerInput = {
  readonly activeMembers?: InputMaybe<Scalars["Int"]["input"]>;
  readonly address: AddressSerializerInput;
  readonly coreBusiness?: InputMaybe<Scalars["String"]["input"]>;
  readonly coreBusinessEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly coreBusinessFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly coreBusinessSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly email?: InputMaybe<Scalars["String"]["input"]>;
  readonly identifier?: InputMaybe<Scalars["String"]["input"]>;
  readonly name: Scalars["String"]["input"];
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly organisationType?: InputMaybe<OrganizationTypeChoice>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly yearEstablished?: InputMaybe<Scalars["Int"]["input"]>;
};

/** An enumeration. */
export enum OrganizationTypeChoice {
  /** Yritys */
  Company = "COMPANY",
  /** Kuntakonsortio */
  MunicipalityConsortium = "MUNICIPALITY_CONSORTIUM",
  /** Julkinen yhdistys */
  PublicAssociation = "PUBLIC_ASSOCIATION",
  /** Rekisteröity yhdistys */
  RegisteredAssociation = "REGISTERED_ASSOCIATION",
  /** Uskonnollinen yhteisö */
  ReligiousCommunity = "RELIGIOUS_COMMUNITY",
  /** Rekisteröimätön yhdistys */
  UnregisteredAssociation = "UNREGISTERED_ASSOCIATION",
}

/** The Relay compliant `PageInfo` type, containing data necessary to paginate this connection. */
export type PageInfo = {
  /** When paginating forwards, the cursor to continue. */
  readonly endCursor: Maybe<Scalars["String"]["output"]>;
  /** When paginating forwards, are there more items? */
  readonly hasNextPage: Scalars["Boolean"]["output"];
  /** When paginating backwards, are there more items? */
  readonly hasPreviousPage: Scalars["Boolean"]["output"];
  /** When paginating backwards, the cursor to continue. */
  readonly startCursor: Maybe<Scalars["String"]["output"]>;
};

export type PaymentMerchantNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly name: Scalars["String"]["output"];
  readonly pk: Scalars["UUID"]["output"];
};

export type PaymentOrderNode = Node & {
  readonly checkoutUrl: Maybe<Scalars["String"]["output"]>;
  readonly expiresInMinutes: Maybe<Scalars["Int"]["output"]>;
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly orderUuid: Maybe<Scalars["UUID"]["output"]>;
  readonly paymentType: PaymentType;
  readonly processedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly receiptUrl: Maybe<Scalars["String"]["output"]>;
  readonly refundUuid: Maybe<Scalars["UUID"]["output"]>;
  readonly reservationPk: Maybe<Scalars["String"]["output"]>;
  readonly status: OrderStatus;
};

export type PaymentProductNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly merchant: Maybe<PaymentMerchantNode>;
  readonly pk: Scalars["UUID"]["output"];
};

/** An enumeration. */
export enum PaymentType {
  Invoice = "INVOICE",
  Online = "ONLINE",
  OnSite = "ON_SITE",
}

export type PermissionCheckerType = {
  readonly hasPermission: Scalars["Boolean"]["output"];
};

export type PersonNode = Node & {
  readonly email: Maybe<Scalars["String"]["output"]>;
  readonly firstName: Scalars["String"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly lastName: Scalars["String"]["output"];
  readonly phoneNumber: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type PersonSerializerInput = {
  readonly email?: InputMaybe<Scalars["String"]["input"]>;
  readonly firstName: Scalars["String"]["input"];
  readonly lastName: Scalars["String"]["input"];
  readonly phoneNumber?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type PindoraReservationInfoType = {
  readonly accessCode: Scalars["String"]["output"];
  readonly accessCodeBeginsAt: Scalars["DateTime"]["output"];
  readonly accessCodeEndsAt: Scalars["DateTime"]["output"];
  readonly accessCodeGeneratedAt: Scalars["DateTime"]["output"];
  readonly accessCodeIsActive: Scalars["Boolean"]["output"];
  readonly accessCodeKeypadUrl: Scalars["String"]["output"];
  readonly accessCodePhoneNumber: Scalars["String"]["output"];
  readonly accessCodeSmsMessage: Scalars["String"]["output"];
  readonly accessCodeSmsNumber: Scalars["String"]["output"];
};

export type PindoraSectionInfoType = {
  readonly accessCode: Scalars["String"]["output"];
  readonly accessCodeGeneratedAt: Scalars["DateTime"]["output"];
  readonly accessCodeIsActive: Scalars["Boolean"]["output"];
  readonly accessCodeKeypadUrl: Scalars["String"]["output"];
  readonly accessCodePhoneNumber: Scalars["String"]["output"];
  readonly accessCodeSmsMessage: Scalars["String"]["output"];
  readonly accessCodeSmsNumber: Scalars["String"]["output"];
  readonly accessCodeValidity: ReadonlyArray<PindoraSectionValidityInfoType>;
};

export type PindoraSectionValidityInfoType = {
  readonly accessCodeBeginsAt: Scalars["DateTime"]["output"];
  readonly accessCodeEndsAt: Scalars["DateTime"]["output"];
  readonly reservationId: Scalars["Int"]["output"];
  readonly reservationSeriesId: Scalars["Int"]["output"];
};

export type PindoraSeriesInfoType = {
  readonly accessCode: Scalars["String"]["output"];
  readonly accessCodeGeneratedAt: Scalars["DateTime"]["output"];
  readonly accessCodeIsActive: Scalars["Boolean"]["output"];
  readonly accessCodeKeypadUrl: Scalars["String"]["output"];
  readonly accessCodePhoneNumber: Scalars["String"]["output"];
  readonly accessCodeSmsMessage: Scalars["String"]["output"];
  readonly accessCodeSmsNumber: Scalars["String"]["output"];
  readonly accessCodeValidity: ReadonlyArray<PindoraSeriesValidityInfoType>;
};

export type PindoraSeriesValidityInfoType = {
  readonly accessCodeBeginsAt: Scalars["DateTime"]["output"];
  readonly accessCodeEndsAt: Scalars["DateTime"]["output"];
  readonly reservationId: Scalars["Int"]["output"];
  readonly reservationSeriesId: Scalars["Int"]["output"];
};

/** An enumeration. */
export enum PreferredLanguage {
  /** Englanti */
  En = "EN",
  /** Suomi */
  Fi = "FI",
  /** Ruotsi */
  Sv = "SV",
}

/** An enumeration. */
export enum PriceUnit {
  /** per kerta */
  Fixed = "FIXED",
  /** per 15 minuuttia */
  Per_15Mins = "PER_15_MINS",
  /** per 30 minuuttia */
  Per_30Mins = "PER_30_MINS",
  /** per päivä */
  PerDay = "PER_DAY",
  /** per puolipäivää */
  PerHalfDay = "PER_HALF_DAY",
  /** per tunti */
  PerHour = "PER_HOUR",
  /** per viikko */
  PerWeek = "PER_WEEK",
}

/** An enumeration. */
export enum Priority {
  Primary = "PRIMARY",
  Secondary = "SECONDARY",
}

export type PurposeCreateMutationInput = {
  readonly name: Scalars["String"]["input"];
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type PurposeCreateMutationPayload = {
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type PurposeNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly imageUrl: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly rank: Scalars["Int"]["output"];
  readonly smallUrl: Maybe<Scalars["String"]["output"]>;
};

export type PurposeNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<PurposeNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `PurposeNode` and its cursor. */
export type PurposeNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<PurposeNode>;
};

/** Ordering fields for the 'Purpose' model. */
export enum PurposeOrderingChoices {
  NameEnAsc = "nameEnAsc",
  NameEnDesc = "nameEnDesc",
  NameFiAsc = "nameFiAsc",
  NameFiDesc = "nameFiDesc",
  NameSvAsc = "nameSvAsc",
  NameSvDesc = "nameSvDesc",
  RankAsc = "rankAsc",
  RankDesc = "rankDesc",
}

export type PurposeUpdateMutationInput = {
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
};

export type PurposeUpdateMutationPayload = {
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type QualifierNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type QualifierNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<QualifierNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `QualifierNode` and its cursor. */
export type QualifierNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<QualifierNode>;
};

/** Ordering fields for the 'Qualifier' model. */
export enum QualifierOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type Query = {
  /** Return all allocations that affect allocations for given reservation unit (through space hierarchy or common resource) during the given time period. */
  readonly affectingAllocatedTimeSlots: Maybe<
    ReadonlyArray<AllocatedTimeSlotNode>
  >;
  /** Find all reservations that affect other reservations through the space hierarchy or a common resource. */
  readonly affectingReservations: Maybe<ReadonlyArray<ReservationNode>>;
  readonly ageGroups: Maybe<AgeGroupNodeConnection>;
  readonly allocatedTimeSlots: Maybe<AllocatedTimeSlotNodeConnection>;
  readonly application: Maybe<ApplicationNode>;
  readonly applicationRound: Maybe<ApplicationRoundNode>;
  readonly applicationRounds: Maybe<ApplicationRoundNodeConnection>;
  readonly applicationSection: Maybe<ApplicationSectionNode>;
  readonly applicationSections: Maybe<ApplicationSectionNodeConnection>;
  readonly applications: Maybe<ApplicationNodeConnection>;
  readonly bannerNotification: Maybe<BannerNotificationNode>;
  readonly bannerNotifications: Maybe<BannerNotificationNodeConnection>;
  readonly checkPermissions: Maybe<PermissionCheckerType>;
  readonly cities: Maybe<CityNodeConnection>;
  readonly currentUser: Maybe<UserNode>;
  readonly equipment: Maybe<EquipmentNode>;
  readonly equipmentCategories: Maybe<EquipmentCategoryNodeConnection>;
  readonly equipmentCategory: Maybe<EquipmentCategoryNode>;
  readonly equipments: Maybe<EquipmentNodeConnection>;
  readonly equipmentsAll: Maybe<ReadonlyArray<EquipmentAllNode>>;
  readonly metadataSets: Maybe<ReservationMetadataSetNodeConnection>;
  readonly order: Maybe<PaymentOrderNode>;
  /** Get information about a user from Helsinki profile. If user is not a profile user, still return data stored in our database, e.g. first and last name. Use only one of 'reservation_id' or 'application_id' to select the user. This determines the required permissions to view the user's data. */
  readonly profileData: Maybe<HelsinkiProfileDataNode>;
  readonly purposes: Maybe<PurposeNodeConnection>;
  readonly qualifiers: Maybe<QualifierNodeConnection>;
  readonly recurringReservation: Maybe<RecurringReservationNode>;
  readonly recurringReservations: Maybe<RecurringReservationNodeConnection>;
  readonly rejectedOccurrence: Maybe<RejectedOccurrenceNode>;
  readonly rejectedOccurrences: Maybe<RejectedOccurrenceNodeConnection>;
  readonly reservation: Maybe<ReservationNode>;
  readonly reservationCancelReasons: Maybe<ReservationCancelReasonNodeConnection>;
  readonly reservationDenyReasons: Maybe<ReservationDenyReasonNodeConnection>;
  readonly reservationPurposes: Maybe<ReservationPurposeNodeConnection>;
  readonly reservationUnit: Maybe<ReservationUnitNode>;
  readonly reservationUnitCancellationRules: Maybe<ReservationUnitCancellationRuleNodeConnection>;
  readonly reservationUnitTypes: Maybe<ReservationUnitTypeNodeConnection>;
  readonly reservationUnits: Maybe<ReservationUnitNodeConnection>;
  readonly reservationUnitsAll: Maybe<ReadonlyArray<ReservationUnitAllNode>>;
  readonly reservations: Maybe<ReservationNodeConnection>;
  readonly resource: Maybe<ResourceNode>;
  readonly resources: Maybe<ResourceNodeConnection>;
  readonly space: Maybe<SpaceNode>;
  readonly spaces: Maybe<SpaceNodeConnection>;
  readonly taxPercentages: Maybe<TaxPercentageNodeConnection>;
  readonly termsOfUse: Maybe<TermsOfUseNodeConnection>;
  readonly unit: Maybe<UnitNode>;
  readonly unitGroups: Maybe<UnitGroupNodeConnection>;
  readonly units: Maybe<UnitNodeConnection>;
  readonly unitsAll: Maybe<ReadonlyArray<UnitAllNode>>;
  readonly user: Maybe<UserNode>;
};

export type QueryAffectingAllocatedTimeSlotsArgs = {
  beginDate: Scalars["Date"]["input"];
  endDate: Scalars["Date"]["input"];
  reservationUnit: Scalars["Int"]["input"];
};

export type QueryAffectingReservationsArgs = {
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  createdAtGte?: InputMaybe<Scalars["Date"]["input"]>;
  createdAtLte?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  extUuid?: InputMaybe<Scalars["UUID"]["input"]>;
  forReservationUnits?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  forUnits?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<ReadonlyArray<InputMaybe<OrderStatusWithFree>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationTypeChoice>>
  >;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  reservationUnits?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  state?: InputMaybe<ReadonlyArray<InputMaybe<ReservationStateChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryAgeGroupsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryAllocatedTimeSlotsArgs = {
  accessCodeState?: InputMaybe<ReadonlyArray<InputMaybe<AccessCodeState>>>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  allocatedReservationUnit?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  allocatedUnit?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  applicantType?: InputMaybe<ReadonlyArray<InputMaybe<ApplicantTypeChoice>>>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  applicationSectionStatus?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationSectionStatusChoice>>
  >;
  before?: InputMaybe<Scalars["String"]["input"]>;
  dayOfTheWeek?: InputMaybe<ReadonlyArray<InputMaybe<Weekday>>>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<AllocatedTimeSlotOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryApplicationArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryApplicationRoundArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryApplicationRoundsArgs = {
  active?: InputMaybe<Scalars["Boolean"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  ongoing?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermissions?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationRoundOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryApplicationSectionArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryApplicationSectionsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  ageGroup?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  applicantType?: InputMaybe<ReadonlyArray<InputMaybe<ApplicantTypeChoice>>>;
  application?: InputMaybe<Scalars["Int"]["input"]>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  applicationStatus?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationStatusChoice>>
  >;
  before?: InputMaybe<Scalars["String"]["input"]>;
  extUuid?: InputMaybe<Scalars["UUID"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  hasAllocations?: InputMaybe<Scalars["Boolean"]["input"]>;
  homeCity?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  includePreferredOrder10OrHigher?: InputMaybe<Scalars["Boolean"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationSectionOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  preferredOrder?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  priority?: InputMaybe<ReadonlyArray<InputMaybe<Priority>>>;
  purpose?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnit?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  status?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationSectionStatusChoice>>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryApplicationsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  applicantType?: InputMaybe<ReadonlyArray<InputMaybe<ApplicantTypeChoice>>>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<ApplicationOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  status?: InputMaybe<ReadonlyArray<InputMaybe<ApplicationStatusChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryBannerNotificationArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryBannerNotificationsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<BannerNotificationOrderingChoices>>
  >;
  target?: InputMaybe<BannerNotificationTarget>;
};

export type QueryCheckPermissionsArgs = {
  permission: UserPermissionChoice;
  requireAll?: InputMaybe<Scalars["Boolean"]["input"]>;
  units?: InputMaybe<ReadonlyArray<Scalars["Int"]["input"]>>;
};

export type QueryCitiesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryEquipmentArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryEquipmentCategoriesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<EquipmentCategoryOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryEquipmentCategoryArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryEquipmentsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  name_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  name_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<EquipmentOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Int"]["input"]>;
  rankLte?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryEquipmentsAllArgs = {
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<EquipmentOrderingChoices>>>;
};

export type QueryMetadataSetsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryOrderArgs = {
  orderUuid: Scalars["String"]["input"];
};

export type QueryProfileDataArgs = {
  applicationId?: InputMaybe<Scalars["Int"]["input"]>;
  reservationId?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryPurposesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<PurposeOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryQualifiersArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<QualifierOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryRecurringReservationArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryRecurringReservationsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  beginTime?: InputMaybe<Scalars["Time"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  endTime?: InputMaybe<Scalars["Time"]["input"]>;
  extUuid?: InputMaybe<Scalars["UUID"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<RecurringReservationOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnit?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["ID"]["input"]>>
  >;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["ID"]["input"]>>
  >;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["ID"]["input"]>>>;
  user?: InputMaybe<Scalars["ID"]["input"]>;
};

export type QueryRejectedOccurrenceArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryRejectedOccurrencesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<RejectedOccurrenceOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  recurringReservation?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryReservationArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryReservationCancelReasonsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationCancelReasonOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  reason?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryReservationDenyReasonsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationDenyReasonOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  reason?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryReservationPurposesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationPurposeOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryReservationUnitArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryReservationUnitCancellationRulesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitCancellationRuleOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryReservationUnitTypesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitTypeOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryReservationUnitsArgs = {
  accessType?: InputMaybe<ReadonlyArray<InputMaybe<AccessType>>>;
  accessTypeBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  accessTypeEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  applicationRound?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  before?: InputMaybe<Scalars["String"]["input"]>;
  calculateFirstReservableTime?: InputMaybe<Scalars["Boolean"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  equipments?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  maxPersonsGte?: InputMaybe<Scalars["Int"]["input"]>;
  maxPersonsLte?: InputMaybe<Scalars["Int"]["input"]>;
  minPersonsGte?: InputMaybe<Scalars["Int"]["input"]>;
  minPersonsLte?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitOrderingChoices>>
  >;
  personsAllowed?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  publishingState?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitPublishingState>>
  >;
  purposes?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifiers?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Int"]["input"]>;
  rankLte?: InputMaybe<Scalars["Int"]["input"]>;
  reservableDateEnd?: InputMaybe<Scalars["Date"]["input"]>;
  reservableDateStart?: InputMaybe<Scalars["Date"]["input"]>;
  reservableMinimumDurationMinutes?: InputMaybe<Scalars["Int"]["input"]>;
  reservableTimeEnd?: InputMaybe<Scalars["Time"]["input"]>;
  reservableTimeStart?: InputMaybe<Scalars["Time"]["input"]>;
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
  reservationState?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitReservationState>>
  >;
  reservationUnitType?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  surfaceAreaGte?: InputMaybe<Scalars["Int"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Int"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  tprekDepartmentId?: InputMaybe<Scalars["String"]["input"]>;
  tprekId?: InputMaybe<Scalars["String"]["input"]>;
  typeRankGte?: InputMaybe<Scalars["Int"]["input"]>;
  typeRankLte?: InputMaybe<Scalars["Int"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  uuid?: InputMaybe<Scalars["UUID"]["input"]>;
};

export type QueryReservationUnitsAllArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitOrderingChoices>>
  >;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryReservationsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  createdAtGte?: InputMaybe<Scalars["Date"]["input"]>;
  createdAtLte?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  extUuid?: InputMaybe<Scalars["UUID"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<ReadonlyArray<InputMaybe<OrderStatusWithFree>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationTypeChoice>>
  >;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  reservationUnits?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  state?: InputMaybe<ReadonlyArray<InputMaybe<ReservationStateChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryResourceArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryResourcesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<ResourceOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QuerySpaceArgs = {
  id: Scalars["ID"]["input"];
};

export type QuerySpacesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<SpaceOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryTaxPercentagesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<TaxPercentageOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  value?: InputMaybe<Scalars["Decimal"]["input"]>;
};

export type QueryTermsOfUseArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<TermsOfUseOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["String"]["input"]>>>;
  termsType?: InputMaybe<TermsType>;
};

export type QueryUnitArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryUnitGroupsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryUnitsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyDirectBookable?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlySeasonalBookable?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<UnitOrderingChoices>>>;
  ownReservations?: InputMaybe<Scalars["Boolean"]["input"]>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  publishedReservationUnits?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type QueryUnitsAllArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyDirectBookable?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlySeasonalBookable?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<UnitOrderingChoices>>>;
  ownReservations?: InputMaybe<Scalars["Boolean"]["input"]>;
  publishedReservationUnits?: InputMaybe<Scalars["Boolean"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryUserArgs = {
  id: Scalars["ID"]["input"];
};

export type RecurringReservationNode = Node & {
  readonly abilityGroup: Maybe<AbilityGroupNode>;
  readonly accessType: AccessTypeWithMultivalued;
  readonly ageGroup: Maybe<AgeGroupNode>;
  readonly allocatedTimeSlot: Maybe<AllocatedTimeSlotNode>;
  readonly beginDate: Maybe<Scalars["Date"]["output"]>;
  readonly beginTime: Maybe<Scalars["Time"]["output"]>;
  readonly created: Scalars["DateTime"]["output"];
  readonly description: Scalars["String"]["output"];
  readonly endDate: Maybe<Scalars["Date"]["output"]>;
  readonly endTime: Maybe<Scalars["Time"]["output"]>;
  readonly extUuid: Scalars["UUID"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly isAccessCodeIsActiveCorrect: Scalars["Boolean"]["output"];
  readonly name: Scalars["String"]["output"];
  /** Info fetched from Pindora API. Cached per reservation for 30s. Please don't use this when filtering multiple series, queries to Pindora are not optimized. */
  readonly pindoraInfo: Maybe<PindoraSeriesInfoType>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly recurrenceInDays: Maybe<Scalars["Int"]["output"]>;
  readonly rejectedOccurrences: ReadonlyArray<RejectedOccurrenceNode>;
  readonly reservationUnit: ReservationUnitNode;
  readonly reservations: ReadonlyArray<ReservationNode>;
  readonly shouldHaveActiveAccessCode: Scalars["Boolean"]["output"];
  readonly usedAccessTypes: ReadonlyArray<Maybe<AccessType>>;
  readonly user: Maybe<UserNode>;
  readonly weekdays: ReadonlyArray<Scalars["Int"]["output"]>;
};

export type RecurringReservationNodeRejectedOccurrencesArgs = {
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<RejectedOccurrenceOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  recurringReservation?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type RecurringReservationNodeReservationsArgs = {
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  createdAtGte?: InputMaybe<Scalars["Date"]["input"]>;
  createdAtLte?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  extUuid?: InputMaybe<Scalars["UUID"]["input"]>;
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<ReadonlyArray<InputMaybe<OrderStatusWithFree>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationTypeChoice>>
  >;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  reservationUnits?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  state?: InputMaybe<ReadonlyArray<InputMaybe<ReservationStateChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type RecurringReservationNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<RecurringReservationNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `RecurringReservationNode` and its cursor. */
export type RecurringReservationNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<RecurringReservationNode>;
};

/** Ordering fields for the 'RecurringReservation' model. */
export enum RecurringReservationOrderingChoices {
  BeginDateAsc = "beginDateAsc",
  BeginDateDesc = "beginDateDesc",
  BeginTimeAsc = "beginTimeAsc",
  BeginTimeDesc = "beginTimeDesc",
  CreatedAsc = "createdAsc",
  CreatedDesc = "createdDesc",
  EndDateAsc = "endDateAsc",
  EndDateDesc = "endDateDesc",
  EndTimeAsc = "endTimeAsc",
  EndTimeDesc = "endTimeDesc",
  NameAsc = "nameAsc",
  NameDesc = "nameDesc",
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
  ReservationUnitNameEnAsc = "reservationUnitNameEnAsc",
  ReservationUnitNameEnDesc = "reservationUnitNameEnDesc",
  ReservationUnitNameFiAsc = "reservationUnitNameFiAsc",
  ReservationUnitNameFiDesc = "reservationUnitNameFiDesc",
  ReservationUnitNameSvAsc = "reservationUnitNameSvAsc",
  ReservationUnitNameSvDesc = "reservationUnitNameSvDesc",
  UnitNameEnAsc = "unitNameEnAsc",
  UnitNameEnDesc = "unitNameEnDesc",
  UnitNameFiAsc = "unitNameFiAsc",
  UnitNameFiDesc = "unitNameFiDesc",
  UnitNameSvAsc = "unitNameSvAsc",
  UnitNameSvDesc = "unitNameSvDesc",
}

export type RefreshOrderMutationInput = {
  readonly orderUuid: Scalars["String"]["input"];
};

export type RefreshOrderMutationPayload = {
  readonly orderUuid: Maybe<Scalars["String"]["output"]>;
  readonly reservationPk: Maybe<Scalars["Int"]["output"]>;
  readonly status: Maybe<Scalars["String"]["output"]>;
};

export type RejectAllApplicationOptionsMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type RejectAllApplicationOptionsMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type RejectAllSectionOptionsMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type RejectAllSectionOptionsMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type RejectedOccurrenceNode = Node & {
  readonly beginDatetime: Scalars["DateTime"]["output"];
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly endDatetime: Scalars["DateTime"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly recurringReservation: RecurringReservationNode;
  readonly rejectionReason: RejectionReadinessChoice;
};

export type RejectedOccurrenceNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<RejectedOccurrenceNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `RejectedOccurrenceNode` and its cursor. */
export type RejectedOccurrenceNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<RejectedOccurrenceNode>;
};

/** Ordering fields for the 'RejectedOccurrence' model. */
export enum RejectedOccurrenceOrderingChoices {
  ApplicantAsc = "applicantAsc",
  ApplicantDesc = "applicantDesc",
  ApplicationPkAsc = "applicationPkAsc",
  ApplicationPkDesc = "applicationPkDesc",
  ApplicationSectionNameAsc = "applicationSectionNameAsc",
  ApplicationSectionNameDesc = "applicationSectionNameDesc",
  ApplicationSectionPkAsc = "applicationSectionPkAsc",
  ApplicationSectionPkDesc = "applicationSectionPkDesc",
  BeginDatetimeAsc = "beginDatetimeAsc",
  BeginDatetimeDesc = "beginDatetimeDesc",
  EndDatetimeAsc = "endDatetimeAsc",
  EndDatetimeDesc = "endDatetimeDesc",
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
  RejectionReasonAsc = "rejectionReasonAsc",
  RejectionReasonDesc = "rejectionReasonDesc",
  ReservationUnitNameAsc = "reservationUnitNameAsc",
  ReservationUnitNameDesc = "reservationUnitNameDesc",
  ReservationUnitPkAsc = "reservationUnitPkAsc",
  ReservationUnitPkDesc = "reservationUnitPkDesc",
  UnitNameAsc = "unitNameAsc",
  UnitNameDesc = "unitNameDesc",
  UnitPkAsc = "unitPkAsc",
  UnitPkDesc = "unitPkDesc",
}

/** An enumeration. */
export enum RejectionReadinessChoice {
  /** Aloitusaika ei sallittu */
  IntervalNotAllowed = "INTERVAL_NOT_ALLOWED",
  /** Päällekkäisiä varauksia */
  OverlappingReservations = "OVERLAPPING_RESERVATIONS",
  /** Varausyksikkö suljettu */
  ReservationUnitClosed = "RESERVATION_UNIT_CLOSED",
}

export type ReservableTimeSpanType = {
  readonly endDatetime: Maybe<Scalars["DateTime"]["output"]>;
  readonly startDatetime: Maybe<Scalars["DateTime"]["output"]>;
};

export type ReservationAdjustTimeMutationInput = {
  readonly begin: Scalars["DateTime"]["input"];
  readonly end: Scalars["DateTime"]["input"];
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationAdjustTimeMutationPayload = {
  readonly begin: Maybe<Scalars["DateTime"]["output"]>;
  readonly end: Maybe<Scalars["DateTime"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly state: Maybe<ReservationStateChoice>;
};

export type ReservationApproveMutationInput = {
  readonly handlingDetails: Scalars["String"]["input"];
  readonly pk: Scalars["Int"]["input"];
  readonly price: Scalars["Decimal"]["input"];
};

export type ReservationApproveMutationPayload = {
  readonly handledAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly handlingDetails: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly price: Maybe<Scalars["Decimal"]["output"]>;
  readonly state: Maybe<ReservationStateChoice>;
};

export type ReservationCancelReasonNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly reasonEn: Maybe<Scalars["String"]["output"]>;
  readonly reasonFi: Maybe<Scalars["String"]["output"]>;
  readonly reasonSv: Maybe<Scalars["String"]["output"]>;
};

export type ReservationCancelReasonNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ReservationCancelReasonNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationCancelReasonNode` and its cursor. */
export type ReservationCancelReasonNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ReservationCancelReasonNode>;
};

/** Ordering fields for the 'ReservationCancelReason' model. */
export enum ReservationCancelReasonOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type ReservationCancellationMutationInput = {
  readonly cancelDetails?: InputMaybe<Scalars["String"]["input"]>;
  readonly cancelReason: Scalars["Int"]["input"];
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationCancellationMutationPayload = {
  readonly cancelDetails: Maybe<Scalars["String"]["output"]>;
  readonly cancelReason: Maybe<Scalars["Int"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly state: Maybe<ReservationStateChoice>;
};

export type ReservationConfirmMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationConfirmMutationPayload = {
  readonly order: Maybe<PaymentOrderNode>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly state: Maybe<ReservationStateChoice>;
};

export type ReservationCreateMutationInput = {
  readonly begin: Scalars["DateTime"]["input"];
  readonly end: Scalars["DateTime"]["input"];
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationUnit: Scalars["Int"]["input"];
};

export type ReservationCreateMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationDeleteMutationInput = {
  readonly pk: Scalars["ID"]["input"];
};

export type ReservationDeleteMutationPayload = {
  readonly deleted: Maybe<Scalars["Boolean"]["output"]>;
};

export type ReservationDeleteTentativeMutationInput = {
  readonly pk: Scalars["ID"]["input"];
};

/** Used only for deleting a reservation before it is confirmed. */
export type ReservationDeleteTentativeMutationPayload = {
  readonly deleted: Maybe<Scalars["Boolean"]["output"]>;
};

export type ReservationDenyMutationInput = {
  readonly denyReason: Scalars["Int"]["input"];
  readonly handlingDetails: Scalars["String"]["input"];
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationDenyMutationPayload = {
  readonly denyReason: Maybe<Scalars["Int"]["output"]>;
  readonly handledAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly handlingDetails: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly state: Maybe<ReservationStateChoice>;
};

export type ReservationDenyReasonNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly reasonEn: Maybe<Scalars["String"]["output"]>;
  readonly reasonFi: Maybe<Scalars["String"]["output"]>;
  readonly reasonSv: Maybe<Scalars["String"]["output"]>;
};

export type ReservationDenyReasonNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ReservationDenyReasonNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationDenyReasonNode` and its cursor. */
export type ReservationDenyReasonNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ReservationDenyReasonNode>;
};

/** Ordering fields for the 'ReservationDenyReason' model. */
export enum ReservationDenyReasonOrderingChoices {
  RankAsc = "rankAsc",
  RankDesc = "rankDesc",
}

/** An enumeration. */
export enum ReservationKind {
  /** Suora */
  Direct = "DIRECT",
  /** Suora ja kausi */
  DirectAndSeason = "DIRECT_AND_SEASON",
  /** Kausi */
  Season = "SEASON",
}

export type ReservationMetadataFieldNode = Node & {
  readonly fieldName: Scalars["String"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationMetadataSetNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly name: Scalars["String"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly requiredFields: ReadonlyArray<ReservationMetadataFieldNode>;
  readonly supportedFields: ReadonlyArray<ReservationMetadataFieldNode>;
};

export type ReservationMetadataSetNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ReservationMetadataSetNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationMetadataSetNode` and its cursor. */
export type ReservationMetadataSetNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ReservationMetadataSetNode>;
};

export type ReservationNode = Node & {
  readonly accessCodeGeneratedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly accessCodeIsActive: Maybe<Scalars["Boolean"]["output"]>;
  readonly accessCodeShouldBeActive: Maybe<Scalars["Boolean"]["output"]>;
  readonly accessType: Maybe<AccessType>;
  /** Which reservation units' reserveability is affected by this reservation? */
  readonly affectedReservationUnits: Maybe<
    ReadonlyArray<Maybe<Scalars["Int"]["output"]>>
  >;
  readonly ageGroup: Maybe<AgeGroupNode>;
  readonly applyingForFreeOfCharge: Maybe<Scalars["Boolean"]["output"]>;
  readonly begin: Scalars["DateTime"]["output"];
  readonly billingAddressCity: Maybe<Scalars["String"]["output"]>;
  readonly billingAddressStreet: Maybe<Scalars["String"]["output"]>;
  readonly billingAddressZip: Maybe<Scalars["String"]["output"]>;
  readonly billingEmail: Maybe<Scalars["String"]["output"]>;
  readonly billingFirstName: Maybe<Scalars["String"]["output"]>;
  readonly billingLastName: Maybe<Scalars["String"]["output"]>;
  readonly billingPhone: Maybe<Scalars["String"]["output"]>;
  readonly bufferTimeAfter: Scalars["Duration"]["output"];
  readonly bufferTimeBefore: Scalars["Duration"]["output"];
  readonly calendarUrl: Maybe<Scalars["String"]["output"]>;
  readonly cancelDetails: Maybe<Scalars["String"]["output"]>;
  readonly cancelReason: Maybe<ReservationCancelReasonNode>;
  readonly createdAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly denyReason: Maybe<ReservationDenyReasonNode>;
  readonly description: Maybe<Scalars["String"]["output"]>;
  readonly end: Scalars["DateTime"]["output"];
  readonly extUuid: Scalars["UUID"]["output"];
  readonly freeOfChargeReason: Maybe<Scalars["String"]["output"]>;
  readonly handledAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly handlingDetails: Maybe<Scalars["String"]["output"]>;
  readonly homeCity: Maybe<CityNode>;
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly isAccessCodeIsActiveCorrect: Maybe<Scalars["Boolean"]["output"]>;
  readonly isBlocked: Scalars["Boolean"]["output"];
  readonly isHandled: Maybe<Scalars["Boolean"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly numPersons: Maybe<Scalars["Int"]["output"]>;
  readonly paymentOrder: ReadonlyArray<PaymentOrderNode>;
  /** Info fetched from Pindora API. Cached per reservation for 30s. Please don't use this when filtering multiple reservations, queries to Pindora are not optimized. */
  readonly pindoraInfo: Maybe<PindoraReservationInfoType>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly price: Maybe<Scalars["Decimal"]["output"]>;
  readonly priceNet: Maybe<Scalars["Decimal"]["output"]>;
  readonly purpose: Maybe<ReservationPurposeNode>;
  readonly recurringReservation: Maybe<RecurringReservationNode>;
  readonly reservationUnits: ReadonlyArray<ReservationUnitNode>;
  readonly reserveeAddressCity: Maybe<Scalars["String"]["output"]>;
  readonly reserveeAddressStreet: Maybe<Scalars["String"]["output"]>;
  readonly reserveeAddressZip: Maybe<Scalars["String"]["output"]>;
  readonly reserveeEmail: Maybe<Scalars["String"]["output"]>;
  readonly reserveeFirstName: Maybe<Scalars["String"]["output"]>;
  readonly reserveeId: Maybe<Scalars["String"]["output"]>;
  readonly reserveeIsUnregisteredAssociation: Maybe<
    Scalars["Boolean"]["output"]
  >;
  readonly reserveeLastName: Maybe<Scalars["String"]["output"]>;
  readonly reserveeName: Maybe<Scalars["String"]["output"]>;
  readonly reserveeOrganisationName: Maybe<Scalars["String"]["output"]>;
  readonly reserveePhone: Maybe<Scalars["String"]["output"]>;
  readonly reserveeType: Maybe<CustomerTypeChoice>;
  readonly state: Maybe<ReservationStateChoice>;
  readonly taxPercentageValue: Maybe<Scalars["Decimal"]["output"]>;
  readonly type: Maybe<ReservationTypeChoice>;
  readonly unitPrice: Maybe<Scalars["Decimal"]["output"]>;
  readonly user: Maybe<UserNode>;
  readonly workingMemo: Maybe<Scalars["String"]["output"]>;
};

export type ReservationNodeReservationUnitsArgs = {
  accessType?: InputMaybe<ReadonlyArray<InputMaybe<AccessType>>>;
  accessTypeBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  accessTypeEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  applicationRound?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  calculateFirstReservableTime?: InputMaybe<Scalars["Boolean"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  equipments?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]["input"]>;
  maxPersonsGte?: InputMaybe<Scalars["Int"]["input"]>;
  maxPersonsLte?: InputMaybe<Scalars["Int"]["input"]>;
  minPersonsGte?: InputMaybe<Scalars["Int"]["input"]>;
  minPersonsLte?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitOrderingChoices>>
  >;
  personsAllowed?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  publishingState?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitPublishingState>>
  >;
  purposes?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifiers?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Int"]["input"]>;
  rankLte?: InputMaybe<Scalars["Int"]["input"]>;
  reservableDateEnd?: InputMaybe<Scalars["Date"]["input"]>;
  reservableDateStart?: InputMaybe<Scalars["Date"]["input"]>;
  reservableMinimumDurationMinutes?: InputMaybe<Scalars["Int"]["input"]>;
  reservableTimeEnd?: InputMaybe<Scalars["Time"]["input"]>;
  reservableTimeStart?: InputMaybe<Scalars["Time"]["input"]>;
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
  reservationState?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitReservationState>>
  >;
  reservationUnitType?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  surfaceAreaGte?: InputMaybe<Scalars["Int"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Int"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  tprekDepartmentId?: InputMaybe<Scalars["String"]["input"]>;
  tprekId?: InputMaybe<Scalars["String"]["input"]>;
  typeRankGte?: InputMaybe<Scalars["Int"]["input"]>;
  typeRankLte?: InputMaybe<Scalars["Int"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  uuid?: InputMaybe<Scalars["UUID"]["input"]>;
};

export type ReservationNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ReservationNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationNode` and its cursor. */
export type ReservationNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ReservationNode>;
};

/** When user wants to receive reservation notification emails. */
export enum ReservationNotification {
  All = "ALL",
  None = "NONE",
  OnlyHandlingRequired = "ONLY_HANDLING_REQUIRED",
}

/** Ordering fields for the 'Reservation' model. */
export enum ReservationOrderingChoices {
  BeginAsc = "beginAsc",
  BeginDesc = "beginDesc",
  CreatedAtAsc = "createdAtAsc",
  CreatedAtDesc = "createdAtDesc",
  EndAsc = "endAsc",
  EndDesc = "endDesc",
  NameAsc = "nameAsc",
  NameDesc = "nameDesc",
  OrderStatusAsc = "orderStatusAsc",
  OrderStatusDesc = "orderStatusDesc",
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
  PriceAsc = "priceAsc",
  PriceDesc = "priceDesc",
  ReservationUnitNameEnAsc = "reservationUnitNameEnAsc",
  ReservationUnitNameEnDesc = "reservationUnitNameEnDesc",
  ReservationUnitNameFiAsc = "reservationUnitNameFiAsc",
  ReservationUnitNameFiDesc = "reservationUnitNameFiDesc",
  ReservationUnitNameSvAsc = "reservationUnitNameSvAsc",
  ReservationUnitNameSvDesc = "reservationUnitNameSvDesc",
  ReserveeNameAsc = "reserveeNameAsc",
  ReserveeNameDesc = "reserveeNameDesc",
  StateAsc = "stateAsc",
  StateDesc = "stateDesc",
  UnitNameEnAsc = "unitNameEnAsc",
  UnitNameEnDesc = "unitNameEnDesc",
  UnitNameFiAsc = "unitNameFiAsc",
  UnitNameFiDesc = "unitNameFiDesc",
  UnitNameSvAsc = "unitNameSvAsc",
  UnitNameSvDesc = "unitNameSvDesc",
}

export type ReservationPurposeNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly rank: Scalars["Int"]["output"];
};

export type ReservationPurposeNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ReservationPurposeNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationPurposeNode` and its cursor. */
export type ReservationPurposeNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ReservationPurposeNode>;
};

/** Ordering fields for the 'ReservationPurpose' model. */
export enum ReservationPurposeOrderingChoices {
  NameEnAsc = "nameEnAsc",
  NameEnDesc = "nameEnDesc",
  NameFiAsc = "nameFiAsc",
  NameFiDesc = "nameFiDesc",
  NameSvAsc = "nameSvAsc",
  NameSvDesc = "nameSvDesc",
  RankAsc = "rankAsc",
  RankDesc = "rankDesc",
}

export type ReservationRefundMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationRefundMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationRequiresHandlingMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationRequiresHandlingMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly state: Maybe<ReservationStateChoice>;
};

export type ReservationSeriesAddMutationInput = {
  readonly begin: Scalars["DateTime"]["input"];
  readonly bufferTimeAfter?: InputMaybe<Scalars["String"]["input"]>;
  readonly bufferTimeBefore?: InputMaybe<Scalars["String"]["input"]>;
  readonly end: Scalars["DateTime"]["input"];
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationSeriesAddMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationSeriesChangeAccessCodeMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationSeriesChangeAccessCodeMutationPayload = {
  readonly accessCodeGeneratedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly accessCodeIsActive: Maybe<Scalars["Boolean"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationSeriesCreateMutationInput = {
  readonly abilityGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly beginDate: Scalars["Date"]["input"];
  readonly beginTime: Scalars["Time"]["input"];
  readonly checkOpeningHours?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly description?: InputMaybe<Scalars["String"]["input"]>;
  readonly endDate: Scalars["Date"]["input"];
  readonly endTime: Scalars["Time"]["input"];
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly recurrenceInDays: Scalars["Int"]["input"];
  readonly reservationDetails: ReservationSeriesReservationCreateSerializerInput;
  readonly reservationUnit: Scalars["Int"]["input"];
  readonly skipDates?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Date"]["input"]>>
  >;
  readonly weekdays: ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>;
};

export type ReservationSeriesCreateMutationPayload = {
  readonly abilityGroup: Maybe<Scalars["Int"]["output"]>;
  readonly ageGroup: Maybe<Scalars["Int"]["output"]>;
  readonly beginDate: Maybe<Scalars["Date"]["output"]>;
  readonly beginTime: Maybe<Scalars["Time"]["output"]>;
  readonly description: Maybe<Scalars["String"]["output"]>;
  readonly endDate: Maybe<Scalars["Date"]["output"]>;
  readonly endTime: Maybe<Scalars["Time"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly recurrenceInDays: Maybe<Scalars["Int"]["output"]>;
  readonly reservationUnit: Maybe<Scalars["Int"]["output"]>;
  readonly weekdays: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
};

export type ReservationSeriesDenyMutationInput = {
  readonly denyReason: Scalars["Int"]["input"];
  readonly handlingDetails?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationSeriesDenyMutationPayload = {
  readonly denied: Maybe<Scalars["Int"]["output"]>;
  readonly future: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationSeriesRepairAccessCodeMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationSeriesRepairAccessCodeMutationPayload = {
  readonly accessCodeGeneratedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly accessCodeIsActive: Maybe<Scalars["Boolean"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationSeriesRescheduleMutationInput = {
  readonly beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  readonly beginTime?: InputMaybe<Scalars["Time"]["input"]>;
  readonly bufferTimeAfter?: InputMaybe<Scalars["String"]["input"]>;
  readonly bufferTimeBefore?: InputMaybe<Scalars["String"]["input"]>;
  readonly endDate?: InputMaybe<Scalars["Date"]["input"]>;
  readonly endTime?: InputMaybe<Scalars["Time"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
  readonly skipDates?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Date"]["input"]>>
  >;
  readonly weekdays?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
};

export type ReservationSeriesRescheduleMutationPayload = {
  readonly beginDate: Maybe<Scalars["Date"]["output"]>;
  readonly beginTime: Maybe<Scalars["Time"]["output"]>;
  readonly endDate: Maybe<Scalars["Date"]["output"]>;
  readonly endTime: Maybe<Scalars["Time"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly weekdays: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
};

export type ReservationSeriesReservationCreateSerializerInput = {
  readonly ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  readonly bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly confirmedAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly description?: InputMaybe<Scalars["String"]["input"]>;
  readonly freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  readonly handledAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly purpose?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeIsUnregisteredAssociation?: InputMaybe<
    Scalars["Boolean"]["input"]
  >;
  readonly reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeType?: InputMaybe<ReserveeType>;
  readonly state?: InputMaybe<ReservationStateChoice>;
  readonly type: ReservationTypeStaffChoice;
  readonly user: Scalars["Int"]["input"];
  readonly workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationSeriesUpdateMutationInput = {
  readonly ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly description?: InputMaybe<Scalars["String"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
  readonly reservationDetails?: InputMaybe<UpdateReservationSeriesReservationUpdateSerializerInput>;
  readonly skipReservations?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
};

export type ReservationSeriesUpdateMutationPayload = {
  readonly ageGroup: Maybe<Scalars["Int"]["output"]>;
  readonly description: Maybe<Scalars["String"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationStaffAdjustTimeMutationInput = {
  readonly begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly end?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationStaffAdjustTimeMutationPayload = {
  readonly begin: Maybe<Scalars["DateTime"]["output"]>;
  readonly bufferTimeAfter: Maybe<Scalars["Duration"]["output"]>;
  readonly bufferTimeBefore: Maybe<Scalars["Duration"]["output"]>;
  readonly end: Maybe<Scalars["DateTime"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly state: Maybe<ReservationStateChoice>;
};

export type ReservationStaffChangeAccessCodeMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationStaffChangeAccessCodeMutationPayload = {
  readonly accessCodeGeneratedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly accessCodeIsActive: Maybe<Scalars["Boolean"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationStaffCreateMutationInput = {
  readonly ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly begin: Scalars["DateTime"]["input"];
  readonly billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  readonly bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly description?: InputMaybe<Scalars["String"]["input"]>;
  readonly end: Scalars["DateTime"]["input"];
  readonly freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  readonly homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly purpose?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationUnit: Scalars["Int"]["input"];
  readonly reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeIsUnregisteredAssociation?: InputMaybe<
    Scalars["Boolean"]["input"]
  >;
  readonly reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeType?: InputMaybe<CustomerTypeChoice>;
  readonly type: ReservationTypeChoice;
  readonly workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationStaffCreateMutationPayload = {
  readonly ageGroup: Maybe<Scalars["Int"]["output"]>;
  readonly applyingForFreeOfCharge: Maybe<Scalars["Boolean"]["output"]>;
  readonly begin: Maybe<Scalars["DateTime"]["output"]>;
  readonly billingAddressCity: Maybe<Scalars["String"]["output"]>;
  readonly billingAddressStreet: Maybe<Scalars["String"]["output"]>;
  readonly billingAddressZip: Maybe<Scalars["String"]["output"]>;
  readonly billingEmail: Maybe<Scalars["String"]["output"]>;
  readonly billingFirstName: Maybe<Scalars["String"]["output"]>;
  readonly billingLastName: Maybe<Scalars["String"]["output"]>;
  readonly billingPhone: Maybe<Scalars["String"]["output"]>;
  readonly bufferTimeAfter: Maybe<Scalars["Duration"]["output"]>;
  readonly bufferTimeBefore: Maybe<Scalars["Duration"]["output"]>;
  readonly confirmedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly description: Maybe<Scalars["String"]["output"]>;
  readonly end: Maybe<Scalars["DateTime"]["output"]>;
  readonly freeOfChargeReason: Maybe<Scalars["String"]["output"]>;
  readonly handledAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly homeCity: Maybe<Scalars["Int"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly numPersons: Maybe<Scalars["Int"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly purpose: Maybe<Scalars["Int"]["output"]>;
  readonly reserveeAddressCity: Maybe<Scalars["String"]["output"]>;
  readonly reserveeAddressStreet: Maybe<Scalars["String"]["output"]>;
  readonly reserveeAddressZip: Maybe<Scalars["String"]["output"]>;
  readonly reserveeEmail: Maybe<Scalars["String"]["output"]>;
  readonly reserveeFirstName: Maybe<Scalars["String"]["output"]>;
  readonly reserveeId: Maybe<Scalars["String"]["output"]>;
  readonly reserveeIsUnregisteredAssociation: Maybe<
    Scalars["Boolean"]["output"]
  >;
  readonly reserveeLastName: Maybe<Scalars["String"]["output"]>;
  readonly reserveeOrganisationName: Maybe<Scalars["String"]["output"]>;
  readonly reserveePhone: Maybe<Scalars["String"]["output"]>;
  readonly reserveeType: Maybe<CustomerTypeChoice>;
  readonly state: Maybe<ReservationStateChoice>;
  readonly type: Maybe<ReservationTypeChoice>;
  readonly workingMemo: Maybe<Scalars["String"]["output"]>;
};

export type ReservationStaffModifyMutationInput = {
  readonly ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  readonly description?: InputMaybe<Scalars["String"]["input"]>;
  readonly freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  readonly homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
  readonly purpose?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeIsUnregisteredAssociation?: InputMaybe<
    Scalars["Boolean"]["input"]
  >;
  readonly reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeType?: InputMaybe<CustomerTypeChoice>;
  readonly type?: InputMaybe<ReservationTypeChoice>;
};

export type ReservationStaffModifyMutationPayload = {
  readonly ageGroup: Maybe<Scalars["Int"]["output"]>;
  readonly applyingForFreeOfCharge: Maybe<Scalars["Boolean"]["output"]>;
  readonly begin: Maybe<Scalars["DateTime"]["output"]>;
  readonly billingAddressCity: Maybe<Scalars["String"]["output"]>;
  readonly billingAddressStreet: Maybe<Scalars["String"]["output"]>;
  readonly billingAddressZip: Maybe<Scalars["String"]["output"]>;
  readonly billingEmail: Maybe<Scalars["String"]["output"]>;
  readonly billingFirstName: Maybe<Scalars["String"]["output"]>;
  readonly billingLastName: Maybe<Scalars["String"]["output"]>;
  readonly billingPhone: Maybe<Scalars["String"]["output"]>;
  readonly bufferTimeAfter: Maybe<Scalars["Duration"]["output"]>;
  readonly bufferTimeBefore: Maybe<Scalars["Duration"]["output"]>;
  readonly confirmedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly description: Maybe<Scalars["String"]["output"]>;
  readonly end: Maybe<Scalars["DateTime"]["output"]>;
  readonly freeOfChargeReason: Maybe<Scalars["String"]["output"]>;
  readonly homeCity: Maybe<Scalars["Int"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nonSubsidisedPrice: Maybe<Scalars["Decimal"]["output"]>;
  readonly nonSubsidisedPriceNet: Maybe<Scalars["String"]["output"]>;
  readonly numPersons: Maybe<Scalars["Int"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly price: Maybe<Scalars["Decimal"]["output"]>;
  readonly priceNet: Maybe<Scalars["String"]["output"]>;
  readonly purpose: Maybe<Scalars["Int"]["output"]>;
  readonly reserveeAddressCity: Maybe<Scalars["String"]["output"]>;
  readonly reserveeAddressStreet: Maybe<Scalars["String"]["output"]>;
  readonly reserveeAddressZip: Maybe<Scalars["String"]["output"]>;
  readonly reserveeEmail: Maybe<Scalars["String"]["output"]>;
  readonly reserveeFirstName: Maybe<Scalars["String"]["output"]>;
  readonly reserveeId: Maybe<Scalars["String"]["output"]>;
  readonly reserveeIsUnregisteredAssociation: Maybe<
    Scalars["Boolean"]["output"]
  >;
  readonly reserveeLastName: Maybe<Scalars["String"]["output"]>;
  readonly reserveeOrganisationName: Maybe<Scalars["String"]["output"]>;
  readonly reserveePhone: Maybe<Scalars["String"]["output"]>;
  readonly reserveeType: Maybe<CustomerTypeChoice>;
  readonly state: Maybe<ReservationStateChoice>;
  readonly taxPercentageValue: Maybe<Scalars["Decimal"]["output"]>;
  readonly type: Maybe<ReservationTypeChoice>;
  readonly unitPrice: Maybe<Scalars["Decimal"]["output"]>;
};

export type ReservationStaffRepairAccessCodeMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationStaffRepairAccessCodeMutationPayload = {
  readonly accessCodeGeneratedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly accessCodeIsActive: Maybe<Scalars["Boolean"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

/** An enumeration. */
export enum ReservationStartInterval {
  /** 15 minuuttia */
  Interval_15Mins = "INTERVAL_15_MINS",
  /** 30 minuuttia */
  Interval_30Mins = "INTERVAL_30_MINS",
  /** 60 minuuttia */
  Interval_60Mins = "INTERVAL_60_MINS",
  /** 90 minuuttia */
  Interval_90Mins = "INTERVAL_90_MINS",
  /** 2 tuntia */
  Interval_120Mins = "INTERVAL_120_MINS",
  /** 3 tuntia */
  Interval_180Mins = "INTERVAL_180_MINS",
  /** 4 tuntia */
  Interval_240Mins = "INTERVAL_240_MINS",
  /** 5 tuntia */
  Interval_300Mins = "INTERVAL_300_MINS",
  /** 6 tuntia */
  Interval_360Mins = "INTERVAL_360_MINS",
  /** 7 tuntia */
  Interval_420Mins = "INTERVAL_420_MINS",
}

/** An enumeration. */
export enum ReservationStateChoice {
  Cancelled = "CANCELLED",
  Confirmed = "CONFIRMED",
  Created = "CREATED",
  Denied = "DENIED",
  RequiresHandling = "REQUIRES_HANDLING",
  WaitingForPayment = "WAITING_FOR_PAYMENT",
}

/** An enumeration. */
export enum ReservationTypeChoice {
  Behalf = "BEHALF",
  Blocked = "BLOCKED",
  Normal = "NORMAL",
  Seasonal = "SEASONAL",
  Staff = "STAFF",
}

/** An enumeration. */
export enum ReservationTypeStaffChoice {
  /** Puolesta */
  Behalf = "BEHALF",
  /** Suljettu */
  Blocked = "BLOCKED",
  /** Henkilökunta */
  Staff = "STAFF",
}

export type ReservationUnitAccessTypeNode = Node & {
  readonly accessType: AccessType;
  readonly beginDate: Scalars["Date"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

/** Ordering fields for the 'ReservationUnitAccessType' model. */
export enum ReservationUnitAccessTypeOrderingChoices {
  BeginDateAsc = "beginDateAsc",
  BeginDateDesc = "beginDateDesc",
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type ReservationUnitAccessTypeSerializerInput = {
  readonly accessType?: InputMaybe<AccessType>;
  readonly beginDate: Scalars["Date"]["input"];
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
};

/** This Node should be kept to the bare minimum and never expose any relations to avoid performance issues. */
export type ReservationUnitAllNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitCancellationRuleNode = Node & {
  readonly canBeCancelledTimeBefore: Maybe<Scalars["Duration"]["output"]>;
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitCancellationRuleNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ReservationUnitCancellationRuleNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitCancellationRuleNode` and its cursor. */
export type ReservationUnitCancellationRuleNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ReservationUnitCancellationRuleNode>;
};

/** Ordering fields for the 'ReservationUnitCancellationRule' model. */
export enum ReservationUnitCancellationRuleOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type ReservationUnitCreateMutationInput = {
  readonly accessTypes?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitAccessTypeSerializerInput>>
  >;
  readonly allowReservationsWithoutOpeningHours?: InputMaybe<
    Scalars["Boolean"]["input"]
  >;
  readonly applicationRoundTimeSlots?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationRoundTimeSlotSerializerInput>>
  >;
  readonly authentication?: InputMaybe<Authentication>;
  readonly bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly canApplyFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly cancellationRule?: InputMaybe<Scalars["Int"]["input"]>;
  readonly cancellationTerms?: InputMaybe<Scalars["String"]["input"]>;
  readonly contactInformation?: InputMaybe<Scalars["String"]["input"]>;
  readonly description?: InputMaybe<Scalars["String"]["input"]>;
  readonly descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly equipments?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  readonly images?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitImageFieldSerializerInput>>
  >;
  readonly isArchived?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly maxReservationDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly maxReservationsPerUser?: InputMaybe<Scalars["Int"]["input"]>;
  readonly metadataSet?: InputMaybe<Scalars["Int"]["input"]>;
  readonly minPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly minReservationDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly name: Scalars["String"]["input"];
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly paymentTerms?: InputMaybe<Scalars["String"]["input"]>;
  readonly paymentTypes?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["String"]["input"]>>
  >;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly pricingTerms?: InputMaybe<Scalars["String"]["input"]>;
  readonly pricings?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitPricingSerializerInput>>
  >;
  readonly publishBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly publishEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly purposes?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  readonly qualifiers?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  readonly requireAdultReservee?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly requireReservationHandling?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly reservationBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly reservationBlockWholeDay?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly reservationCancelledInstructions?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationCancelledInstructionsEn?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationCancelledInstructionsFi?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationCancelledInstructionsSv?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationConfirmedInstructions?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationConfirmedInstructionsEn?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationConfirmedInstructionsFi?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationConfirmedInstructionsSv?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly reservationKind?: InputMaybe<ReservationKind>;
  readonly reservationPendingInstructions?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationPendingInstructionsEn?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationPendingInstructionsFi?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationPendingInstructionsSv?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationStartInterval?: InputMaybe<ReservationStartInterval>;
  readonly reservationUnitType?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationsMaxDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationsMinDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  readonly resources?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  readonly searchTerms?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["String"]["input"]>>
  >;
  readonly serviceSpecificTerms?: InputMaybe<Scalars["String"]["input"]>;
  readonly spaces?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  readonly surfaceArea?: InputMaybe<Scalars["Int"]["input"]>;
  readonly termsOfUse?: InputMaybe<Scalars["String"]["input"]>;
  readonly termsOfUseEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly termsOfUseFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly termsOfUseSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly unit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ReservationUnitCreateMutationPayload = {
  readonly accessTypes: Maybe<
    ReadonlyArray<Maybe<ReservationUnitAccessTypeNode>>
  >;
  readonly allowReservationsWithoutOpeningHours: Maybe<
    Scalars["Boolean"]["output"]
  >;
  readonly applicationRoundTimeSlots: Maybe<
    ReadonlyArray<Maybe<ApplicationRoundTimeSlotNode>>
  >;
  readonly authentication: Maybe<Authentication>;
  readonly bufferTimeAfter: Maybe<Scalars["Duration"]["output"]>;
  readonly bufferTimeBefore: Maybe<Scalars["Duration"]["output"]>;
  readonly canApplyFreeOfCharge: Maybe<Scalars["Boolean"]["output"]>;
  readonly cancellationRule: Maybe<Scalars["Int"]["output"]>;
  readonly cancellationTerms: Maybe<Scalars["String"]["output"]>;
  readonly contactInformation: Maybe<Scalars["String"]["output"]>;
  readonly description: Maybe<Scalars["String"]["output"]>;
  readonly descriptionEn: Maybe<Scalars["String"]["output"]>;
  readonly descriptionFi: Maybe<Scalars["String"]["output"]>;
  readonly descriptionSv: Maybe<Scalars["String"]["output"]>;
  readonly equipments: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
  readonly images: Maybe<ReadonlyArray<Maybe<ReservationUnitImageNode>>>;
  readonly isArchived: Maybe<Scalars["Boolean"]["output"]>;
  readonly isDraft: Maybe<Scalars["Boolean"]["output"]>;
  readonly maxPersons: Maybe<Scalars["Int"]["output"]>;
  readonly maxReservationDuration: Maybe<Scalars["Duration"]["output"]>;
  readonly maxReservationsPerUser: Maybe<Scalars["Int"]["output"]>;
  readonly metadataSet: Maybe<Scalars["Int"]["output"]>;
  readonly minPersons: Maybe<Scalars["Int"]["output"]>;
  readonly minReservationDuration: Maybe<Scalars["Duration"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly paymentTerms: Maybe<Scalars["String"]["output"]>;
  readonly paymentTypes: Maybe<
    ReadonlyArray<Maybe<Scalars["String"]["output"]>>
  >;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly pricingTerms: Maybe<Scalars["String"]["output"]>;
  readonly pricings: Maybe<ReadonlyArray<Maybe<ReservationUnitPricingNode>>>;
  readonly publishBegins: Maybe<Scalars["DateTime"]["output"]>;
  readonly publishEnds: Maybe<Scalars["DateTime"]["output"]>;
  readonly publishingState: Maybe<Scalars["String"]["output"]>;
  readonly purposes: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
  readonly qualifiers: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
  readonly requireAdultReservee: Maybe<Scalars["Boolean"]["output"]>;
  readonly requireReservationHandling: Maybe<Scalars["Boolean"]["output"]>;
  readonly reservationBegins: Maybe<Scalars["DateTime"]["output"]>;
  readonly reservationBlockWholeDay: Maybe<Scalars["Boolean"]["output"]>;
  readonly reservationCancelledInstructions: Maybe<Scalars["String"]["output"]>;
  readonly reservationCancelledInstructionsEn: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationCancelledInstructionsFi: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationCancelledInstructionsSv: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationConfirmedInstructions: Maybe<Scalars["String"]["output"]>;
  readonly reservationConfirmedInstructionsEn: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationConfirmedInstructionsFi: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationConfirmedInstructionsSv: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationEnds: Maybe<Scalars["DateTime"]["output"]>;
  readonly reservationKind: Maybe<ReservationKind>;
  readonly reservationPendingInstructions: Maybe<Scalars["String"]["output"]>;
  readonly reservationPendingInstructionsEn: Maybe<Scalars["String"]["output"]>;
  readonly reservationPendingInstructionsFi: Maybe<Scalars["String"]["output"]>;
  readonly reservationPendingInstructionsSv: Maybe<Scalars["String"]["output"]>;
  readonly reservationStartInterval: Maybe<ReservationStartInterval>;
  readonly reservationUnitType: Maybe<Scalars["Int"]["output"]>;
  readonly reservationsMaxDaysBefore: Maybe<Scalars["Int"]["output"]>;
  readonly reservationsMinDaysBefore: Maybe<Scalars["Int"]["output"]>;
  readonly resources: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
  readonly searchTerms: Maybe<
    ReadonlyArray<Maybe<Scalars["String"]["output"]>>
  >;
  readonly serviceSpecificTerms: Maybe<Scalars["String"]["output"]>;
  readonly spaces: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
  readonly surfaceArea: Maybe<Scalars["Int"]["output"]>;
  readonly termsOfUse: Maybe<Scalars["String"]["output"]>;
  readonly termsOfUseEn: Maybe<Scalars["String"]["output"]>;
  readonly termsOfUseFi: Maybe<Scalars["String"]["output"]>;
  readonly termsOfUseSv: Maybe<Scalars["String"]["output"]>;
  readonly unit: Maybe<Scalars["Int"]["output"]>;
  readonly uuid: Maybe<Scalars["String"]["output"]>;
};

export type ReservationUnitImageCreateMutationInput = {
  readonly image: Scalars["Upload"]["input"];
  readonly imageType: ImageType;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationUnit: Scalars["Int"]["input"];
};

export type ReservationUnitImageCreateMutationPayload = {
  readonly imageType: Maybe<ImageType>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly reservationUnit: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitImageDeleteMutationInput = {
  readonly pk: Scalars["ID"]["input"];
};

export type ReservationUnitImageDeleteMutationPayload = {
  readonly deleted: Maybe<Scalars["Boolean"]["output"]>;
};

export type ReservationUnitImageFieldSerializerInput = {
  readonly imageType: ImageType;
  readonly imageUrl: Scalars["Upload"]["input"];
  readonly largeUrl?: InputMaybe<Scalars["String"]["input"]>;
  readonly mediumUrl?: InputMaybe<Scalars["String"]["input"]>;
  readonly smallUrl?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationUnitImageNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly imageType: ImageType;
  readonly imageUrl: Maybe<Scalars["String"]["output"]>;
  readonly largeUrl: Maybe<Scalars["String"]["output"]>;
  readonly mediumUrl: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly smallUrl: Maybe<Scalars["String"]["output"]>;
};

export type ReservationUnitImageUpdateMutationInput = {
  readonly imageType?: InputMaybe<ImageType>;
  readonly pk: Scalars["Int"]["input"];
};

export type ReservationUnitImageUpdateMutationPayload = {
  readonly imageType: Maybe<ImageType>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitNode = Node & {
  readonly accessTypes: ReadonlyArray<ReservationUnitAccessTypeNode>;
  readonly allowReservationsWithoutOpeningHours: Scalars["Boolean"]["output"];
  readonly applicationRoundTimeSlots: ReadonlyArray<ApplicationRoundTimeSlotNode>;
  readonly applicationRounds: ReadonlyArray<ApplicationRoundNode>;
  readonly authentication: Authentication;
  readonly bufferTimeAfter: Scalars["Duration"]["output"];
  readonly bufferTimeBefore: Scalars["Duration"]["output"];
  readonly calculatedSurfaceArea: Scalars["Int"]["output"];
  readonly canApplyFreeOfCharge: Scalars["Boolean"]["output"];
  readonly cancellationRule: Maybe<ReservationUnitCancellationRuleNode>;
  readonly cancellationTerms: Maybe<TermsOfUseNode>;
  readonly contactInformation: Scalars["String"]["output"];
  readonly currentAccessType: Maybe<AccessType>;
  readonly descriptionEn: Maybe<Scalars["String"]["output"]>;
  readonly descriptionFi: Maybe<Scalars["String"]["output"]>;
  readonly descriptionSv: Maybe<Scalars["String"]["output"]>;
  readonly effectiveAccessType: Maybe<AccessType>;
  readonly equipments: ReadonlyArray<EquipmentNode>;
  readonly firstReservableDatetime: Maybe<Scalars["DateTime"]["output"]>;
  readonly haukiUrl: Maybe<Scalars["String"]["output"]>;
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly images: ReadonlyArray<ReservationUnitImageNode>;
  readonly isArchived: Scalars["Boolean"]["output"];
  readonly isClosed: Scalars["Boolean"]["output"];
  readonly isDraft: Scalars["Boolean"]["output"];
  readonly location: Maybe<LocationNode>;
  readonly maxPersons: Maybe<Scalars["Int"]["output"]>;
  readonly maxReservationDuration: Maybe<Scalars["Duration"]["output"]>;
  readonly maxReservationsPerUser: Maybe<Scalars["Int"]["output"]>;
  readonly metadataSet: Maybe<ReservationMetadataSetNode>;
  readonly minPersons: Maybe<Scalars["Int"]["output"]>;
  readonly minReservationDuration: Maybe<Scalars["Duration"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly numActiveUserReservations: Scalars["Int"]["output"];
  readonly paymentMerchant: Maybe<PaymentMerchantNode>;
  readonly paymentProduct: Maybe<PaymentProductNode>;
  readonly paymentTerms: Maybe<TermsOfUseNode>;
  readonly paymentTypes: ReadonlyArray<ReservationUnitPaymentTypeNode>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly pricingTerms: Maybe<TermsOfUseNode>;
  readonly pricings: ReadonlyArray<ReservationUnitPricingNode>;
  readonly publishBegins: Maybe<Scalars["DateTime"]["output"]>;
  readonly publishEnds: Maybe<Scalars["DateTime"]["output"]>;
  readonly publishingState: ReservationUnitPublishingState;
  readonly purposes: ReadonlyArray<PurposeNode>;
  readonly qualifiers: ReadonlyArray<QualifierNode>;
  readonly rank: Scalars["Int"]["output"];
  readonly requireAdultReservee: Scalars["Boolean"]["output"];
  readonly requireReservationHandling: Scalars["Boolean"]["output"];
  readonly reservableTimeSpans: Maybe<ReadonlyArray<ReservableTimeSpanType>>;
  readonly reservationBegins: Maybe<Scalars["DateTime"]["output"]>;
  readonly reservationBlockWholeDay: Scalars["Boolean"]["output"];
  readonly reservationCancelledInstructionsEn: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationCancelledInstructionsFi: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationCancelledInstructionsSv: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationConfirmedInstructionsEn: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationConfirmedInstructionsFi: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationConfirmedInstructionsSv: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationEnds: Maybe<Scalars["DateTime"]["output"]>;
  readonly reservationKind: ReservationKind;
  readonly reservationPendingInstructionsEn: Maybe<Scalars["String"]["output"]>;
  readonly reservationPendingInstructionsFi: Maybe<Scalars["String"]["output"]>;
  readonly reservationPendingInstructionsSv: Maybe<Scalars["String"]["output"]>;
  readonly reservationStartInterval: ReservationStartInterval;
  readonly reservationState: ReservationUnitReservationState;
  readonly reservationUnitType: Maybe<ReservationUnitTypeNode>;
  readonly reservations: Maybe<ReadonlyArray<ReservationNode>>;
  readonly reservationsMaxDaysBefore: Maybe<Scalars["Int"]["output"]>;
  readonly reservationsMinDaysBefore: Maybe<Scalars["Int"]["output"]>;
  readonly resources: ReadonlyArray<ResourceNode>;
  readonly searchTerms: ReadonlyArray<Scalars["String"]["output"]>;
  readonly serviceSpecificTerms: Maybe<TermsOfUseNode>;
  readonly spaces: ReadonlyArray<SpaceNode>;
  readonly surfaceArea: Maybe<Scalars["Int"]["output"]>;
  readonly termsOfUseEn: Maybe<Scalars["String"]["output"]>;
  readonly termsOfUseFi: Maybe<Scalars["String"]["output"]>;
  readonly termsOfUseSv: Maybe<Scalars["String"]["output"]>;
  readonly unit: Maybe<UnitNode>;
  readonly uuid: Scalars["UUID"]["output"];
};

export type ReservationUnitNodeAccessTypesArgs = {
  isActiveOrFuture?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitAccessTypeOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationUnitNodeApplicationRoundsArgs = {
  active?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  ongoing?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermissions?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationRoundOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationUnitNodeEquipmentsArgs = {
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  name_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  name_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<EquipmentOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Int"]["input"]>;
  rankLte?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ReservationUnitNodePurposesArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<PurposeOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationUnitNodeQualifiersArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<QualifierOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationUnitNodeReservableTimeSpansArgs = {
  endDate: Scalars["Date"]["input"];
  startDate: Scalars["Date"]["input"];
};

export type ReservationUnitNodeReservationsArgs = {
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  createdAtGte?: InputMaybe<Scalars["Date"]["input"]>;
  createdAtLte?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  extUuid?: InputMaybe<Scalars["UUID"]["input"]>;
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<ReadonlyArray<InputMaybe<OrderStatusWithFree>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationTypeChoice>>
  >;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  reservationUnits?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  state?: InputMaybe<ReadonlyArray<InputMaybe<ReservationStateChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationUnitNodeResourcesArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<ResourceOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationUnitNodeSpacesArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<SpaceOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationUnitNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ReservationUnitNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitNode` and its cursor. */
export type ReservationUnitNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ReservationUnitNode>;
};

export type ReservationUnitOptionApplicantSerializerInput = {
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly preferredOrder: Scalars["Int"]["input"];
  readonly reservationUnit: Scalars["Int"]["input"];
};

export type ReservationUnitOptionNode = Node & {
  readonly allocatedTimeSlots: ReadonlyArray<AllocatedTimeSlotNode>;
  readonly applicationSection: ApplicationSectionNode;
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly locked: Scalars["Boolean"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly preferredOrder: Scalars["Int"]["output"];
  readonly rejected: Scalars["Boolean"]["output"];
  readonly reservationUnit: ReservationUnitNode;
};

export type ReservationUnitOptionNodeAllocatedTimeSlotsArgs = {
  accessCodeState?: InputMaybe<ReadonlyArray<InputMaybe<AccessCodeState>>>;
  allocatedReservationUnit?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  allocatedUnit?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  applicantType?: InputMaybe<ReadonlyArray<InputMaybe<ApplicantTypeChoice>>>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  applicationSectionStatus?: InputMaybe<
    ReadonlyArray<InputMaybe<ApplicationSectionStatusChoice>>
  >;
  dayOfTheWeek?: InputMaybe<ReadonlyArray<InputMaybe<Weekday>>>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<AllocatedTimeSlotOrderingChoices>>
  >;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
};

/** Ordering fields for the 'ReservationUnitOption' model. */
export enum ReservationUnitOptionOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type ReservationUnitOptionUpdateMutationInput = {
  readonly locked?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
  readonly rejected?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type ReservationUnitOptionUpdateMutationPayload = {
  readonly locked: Maybe<Scalars["Boolean"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly rejected: Maybe<Scalars["Boolean"]["output"]>;
};

/** Ordering fields for the 'ReservationUnit' model. */
export enum ReservationUnitOrderingChoices {
  MaxPersonsAsc = "maxPersonsAsc",
  MaxPersonsDesc = "maxPersonsDesc",
  NameEnAsc = "nameEnAsc",
  NameEnDesc = "nameEnDesc",
  NameFiAsc = "nameFiAsc",
  NameFiDesc = "nameFiDesc",
  NameSvAsc = "nameSvAsc",
  NameSvDesc = "nameSvDesc",
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
  RankAsc = "rankAsc",
  RankDesc = "rankDesc",
  SurfaceAreaAsc = "surfaceAreaAsc",
  SurfaceAreaDesc = "surfaceAreaDesc",
  TypeEnAsc = "typeEnAsc",
  TypeEnDesc = "typeEnDesc",
  TypeFiAsc = "typeFiAsc",
  TypeFiDesc = "typeFiDesc",
  TypeRankAsc = "typeRankAsc",
  TypeRankDesc = "typeRankDesc",
  TypeSvAsc = "typeSvAsc",
  TypeSvDesc = "typeSvDesc",
  UnitNameEnAsc = "unitNameEnAsc",
  UnitNameEnDesc = "unitNameEnDesc",
  UnitNameFiAsc = "unitNameFiAsc",
  UnitNameFiDesc = "unitNameFiDesc",
  UnitNameSvAsc = "unitNameSvAsc",
  UnitNameSvDesc = "unitNameSvDesc",
}

export type ReservationUnitPaymentTypeNode = Node & {
  readonly code: Scalars["String"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
};

export type ReservationUnitPricingNode = Node & {
  readonly begins: Scalars["Date"]["output"];
  readonly highestPrice: Scalars["Decimal"]["output"];
  readonly highestPriceNet: Scalars["Decimal"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly lowestPrice: Scalars["Decimal"]["output"];
  readonly lowestPriceNet: Scalars["Decimal"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly priceUnit: PriceUnit;
  readonly taxPercentage: TaxPercentageNode;
};

export type ReservationUnitPricingSerializerInput = {
  readonly begins: Scalars["Date"]["input"];
  readonly highestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  readonly highestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  readonly isActivatedOnBegins?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly lowestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  readonly lowestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly priceUnit?: InputMaybe<PriceUnit>;
  readonly taxPercentage?: InputMaybe<Scalars["Int"]["input"]>;
};

/** An enumeration. */
export enum ReservationUnitPublishingState {
  Archived = "ARCHIVED",
  Draft = "DRAFT",
  Hidden = "HIDDEN",
  Published = "PUBLISHED",
  ScheduledHiding = "SCHEDULED_HIDING",
  ScheduledPeriod = "SCHEDULED_PERIOD",
  ScheduledPublishing = "SCHEDULED_PUBLISHING",
}

/** An enumeration. */
export enum ReservationUnitReservationState {
  Reservable = "RESERVABLE",
  ReservationClosed = "RESERVATION_CLOSED",
  ScheduledClosing = "SCHEDULED_CLOSING",
  ScheduledPeriod = "SCHEDULED_PERIOD",
  ScheduledReservation = "SCHEDULED_RESERVATION",
}

export type ReservationUnitTypeNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly rank: Scalars["Int"]["output"];
};

export type ReservationUnitTypeNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ReservationUnitTypeNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitTypeNode` and its cursor. */
export type ReservationUnitTypeNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ReservationUnitTypeNode>;
};

/** Ordering fields for the 'ReservationUnitType' model. */
export enum ReservationUnitTypeOrderingChoices {
  NameEnAsc = "nameEnAsc",
  NameEnDesc = "nameEnDesc",
  NameFiAsc = "nameFiAsc",
  NameFiDesc = "nameFiDesc",
  NameSvAsc = "nameSvAsc",
  NameSvDesc = "nameSvDesc",
  RankAsc = "rankAsc",
  RankDesc = "rankDesc",
}

export type ReservationUnitUpdateMutationInput = {
  readonly accessTypes?: InputMaybe<
    ReadonlyArray<InputMaybe<UpdateReservationUnitAccessTypeSerializerInput>>
  >;
  readonly allowReservationsWithoutOpeningHours?: InputMaybe<
    Scalars["Boolean"]["input"]
  >;
  readonly applicationRoundTimeSlots?: InputMaybe<
    ReadonlyArray<InputMaybe<UpdateApplicationRoundTimeSlotSerializerInput>>
  >;
  readonly authentication?: InputMaybe<Authentication>;
  readonly bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly canApplyFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly cancellationRule?: InputMaybe<Scalars["Int"]["input"]>;
  readonly cancellationTerms?: InputMaybe<Scalars["String"]["input"]>;
  readonly contactInformation?: InputMaybe<Scalars["String"]["input"]>;
  readonly description?: InputMaybe<Scalars["String"]["input"]>;
  readonly descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly equipments?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  readonly images?: InputMaybe<
    ReadonlyArray<InputMaybe<UpdateReservationUnitImageFieldSerializerInput>>
  >;
  readonly isArchived?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly maxReservationDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly maxReservationsPerUser?: InputMaybe<Scalars["Int"]["input"]>;
  readonly metadataSet?: InputMaybe<Scalars["Int"]["input"]>;
  readonly minPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly minReservationDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly paymentTerms?: InputMaybe<Scalars["String"]["input"]>;
  readonly paymentTypes?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["String"]["input"]>>
  >;
  readonly pk: Scalars["Int"]["input"];
  readonly pricingTerms?: InputMaybe<Scalars["String"]["input"]>;
  readonly pricings?: InputMaybe<
    ReadonlyArray<InputMaybe<UpdateReservationUnitPricingSerializerInput>>
  >;
  readonly publishBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly publishEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly purposes?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  readonly qualifiers?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  readonly requireAdultReservee?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly requireReservationHandling?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly reservationBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly reservationBlockWholeDay?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly reservationCancelledInstructions?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationCancelledInstructionsEn?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationCancelledInstructionsFi?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationCancelledInstructionsSv?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationConfirmedInstructions?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationConfirmedInstructionsEn?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationConfirmedInstructionsFi?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationConfirmedInstructionsSv?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly reservationKind?: InputMaybe<ReservationKind>;
  readonly reservationPendingInstructions?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationPendingInstructionsEn?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationPendingInstructionsFi?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationPendingInstructionsSv?: InputMaybe<
    Scalars["String"]["input"]
  >;
  readonly reservationStartInterval?: InputMaybe<ReservationStartInterval>;
  readonly reservationUnitType?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationsMaxDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationsMinDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  readonly resources?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  readonly searchTerms?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["String"]["input"]>>
  >;
  readonly serviceSpecificTerms?: InputMaybe<Scalars["String"]["input"]>;
  readonly spaces?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  readonly surfaceArea?: InputMaybe<Scalars["Int"]["input"]>;
  readonly termsOfUse?: InputMaybe<Scalars["String"]["input"]>;
  readonly termsOfUseEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly termsOfUseFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly termsOfUseSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly unit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ReservationUnitUpdateMutationPayload = {
  readonly accessTypes: Maybe<
    ReadonlyArray<Maybe<ReservationUnitAccessTypeNode>>
  >;
  readonly allowReservationsWithoutOpeningHours: Maybe<
    Scalars["Boolean"]["output"]
  >;
  readonly applicationRoundTimeSlots: Maybe<
    ReadonlyArray<Maybe<ApplicationRoundTimeSlotNode>>
  >;
  readonly authentication: Maybe<Authentication>;
  readonly bufferTimeAfter: Maybe<Scalars["Duration"]["output"]>;
  readonly bufferTimeBefore: Maybe<Scalars["Duration"]["output"]>;
  readonly canApplyFreeOfCharge: Maybe<Scalars["Boolean"]["output"]>;
  readonly cancellationRule: Maybe<Scalars["Int"]["output"]>;
  readonly cancellationTerms: Maybe<Scalars["String"]["output"]>;
  readonly contactInformation: Maybe<Scalars["String"]["output"]>;
  readonly description: Maybe<Scalars["String"]["output"]>;
  readonly descriptionEn: Maybe<Scalars["String"]["output"]>;
  readonly descriptionFi: Maybe<Scalars["String"]["output"]>;
  readonly descriptionSv: Maybe<Scalars["String"]["output"]>;
  readonly equipments: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
  readonly images: Maybe<ReadonlyArray<Maybe<ReservationUnitImageNode>>>;
  readonly isArchived: Maybe<Scalars["Boolean"]["output"]>;
  readonly isDraft: Maybe<Scalars["Boolean"]["output"]>;
  readonly maxPersons: Maybe<Scalars["Int"]["output"]>;
  readonly maxReservationDuration: Maybe<Scalars["Duration"]["output"]>;
  readonly maxReservationsPerUser: Maybe<Scalars["Int"]["output"]>;
  readonly metadataSet: Maybe<Scalars["Int"]["output"]>;
  readonly minPersons: Maybe<Scalars["Int"]["output"]>;
  readonly minReservationDuration: Maybe<Scalars["Duration"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly paymentTerms: Maybe<Scalars["String"]["output"]>;
  readonly paymentTypes: Maybe<
    ReadonlyArray<Maybe<Scalars["String"]["output"]>>
  >;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly pricingTerms: Maybe<Scalars["String"]["output"]>;
  readonly pricings: Maybe<ReadonlyArray<Maybe<ReservationUnitPricingNode>>>;
  readonly publishBegins: Maybe<Scalars["DateTime"]["output"]>;
  readonly publishEnds: Maybe<Scalars["DateTime"]["output"]>;
  readonly publishingState: Maybe<Scalars["String"]["output"]>;
  readonly purposes: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
  readonly qualifiers: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
  readonly requireAdultReservee: Maybe<Scalars["Boolean"]["output"]>;
  readonly requireReservationHandling: Maybe<Scalars["Boolean"]["output"]>;
  readonly reservationBegins: Maybe<Scalars["DateTime"]["output"]>;
  readonly reservationBlockWholeDay: Maybe<Scalars["Boolean"]["output"]>;
  readonly reservationCancelledInstructions: Maybe<Scalars["String"]["output"]>;
  readonly reservationCancelledInstructionsEn: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationCancelledInstructionsFi: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationCancelledInstructionsSv: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationConfirmedInstructions: Maybe<Scalars["String"]["output"]>;
  readonly reservationConfirmedInstructionsEn: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationConfirmedInstructionsFi: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationConfirmedInstructionsSv: Maybe<
    Scalars["String"]["output"]
  >;
  readonly reservationEnds: Maybe<Scalars["DateTime"]["output"]>;
  readonly reservationKind: Maybe<ReservationKind>;
  readonly reservationPendingInstructions: Maybe<Scalars["String"]["output"]>;
  readonly reservationPendingInstructionsEn: Maybe<Scalars["String"]["output"]>;
  readonly reservationPendingInstructionsFi: Maybe<Scalars["String"]["output"]>;
  readonly reservationPendingInstructionsSv: Maybe<Scalars["String"]["output"]>;
  readonly reservationStartInterval: Maybe<ReservationStartInterval>;
  readonly reservationUnitType: Maybe<Scalars["Int"]["output"]>;
  readonly reservationsMaxDaysBefore: Maybe<Scalars["Int"]["output"]>;
  readonly reservationsMinDaysBefore: Maybe<Scalars["Int"]["output"]>;
  readonly resources: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
  readonly searchTerms: Maybe<
    ReadonlyArray<Maybe<Scalars["String"]["output"]>>
  >;
  readonly serviceSpecificTerms: Maybe<Scalars["String"]["output"]>;
  readonly spaces: Maybe<ReadonlyArray<Maybe<Scalars["Int"]["output"]>>>;
  readonly surfaceArea: Maybe<Scalars["Int"]["output"]>;
  readonly termsOfUse: Maybe<Scalars["String"]["output"]>;
  readonly termsOfUseEn: Maybe<Scalars["String"]["output"]>;
  readonly termsOfUseFi: Maybe<Scalars["String"]["output"]>;
  readonly termsOfUseSv: Maybe<Scalars["String"]["output"]>;
  readonly unit: Maybe<Scalars["Int"]["output"]>;
  readonly uuid: Maybe<Scalars["String"]["output"]>;
};

export type ReservationUpdateMutationInput = {
  readonly ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  readonly description?: InputMaybe<Scalars["String"]["input"]>;
  readonly freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  readonly homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
  readonly purpose?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeIsUnregisteredAssociation?: InputMaybe<
    Scalars["Boolean"]["input"]
  >;
  readonly reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeType?: InputMaybe<CustomerTypeChoice>;
};

export type ReservationUpdateMutationPayload = {
  readonly ageGroup: Maybe<Scalars["Int"]["output"]>;
  readonly applyingForFreeOfCharge: Maybe<Scalars["Boolean"]["output"]>;
  readonly billingAddressCity: Maybe<Scalars["String"]["output"]>;
  readonly billingAddressStreet: Maybe<Scalars["String"]["output"]>;
  readonly billingAddressZip: Maybe<Scalars["String"]["output"]>;
  readonly billingEmail: Maybe<Scalars["String"]["output"]>;
  readonly billingFirstName: Maybe<Scalars["String"]["output"]>;
  readonly billingLastName: Maybe<Scalars["String"]["output"]>;
  readonly billingPhone: Maybe<Scalars["String"]["output"]>;
  readonly description: Maybe<Scalars["String"]["output"]>;
  readonly freeOfChargeReason: Maybe<Scalars["String"]["output"]>;
  readonly homeCity: Maybe<Scalars["Int"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly numPersons: Maybe<Scalars["Int"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly purpose: Maybe<Scalars["Int"]["output"]>;
  readonly reserveeAddressCity: Maybe<Scalars["String"]["output"]>;
  readonly reserveeAddressStreet: Maybe<Scalars["String"]["output"]>;
  readonly reserveeAddressZip: Maybe<Scalars["String"]["output"]>;
  readonly reserveeEmail: Maybe<Scalars["String"]["output"]>;
  readonly reserveeFirstName: Maybe<Scalars["String"]["output"]>;
  readonly reserveeId: Maybe<Scalars["String"]["output"]>;
  readonly reserveeIsUnregisteredAssociation: Maybe<
    Scalars["Boolean"]["output"]
  >;
  readonly reserveeLastName: Maybe<Scalars["String"]["output"]>;
  readonly reserveeOrganisationName: Maybe<Scalars["String"]["output"]>;
  readonly reserveePhone: Maybe<Scalars["String"]["output"]>;
  readonly reserveeType: Maybe<CustomerTypeChoice>;
  readonly state: Maybe<ReservationStateChoice>;
};

export type ReservationWorkingMemoMutationInput = {
  readonly pk: Scalars["Int"]["input"];
  readonly workingMemo: Scalars["String"]["input"];
};

export type ReservationWorkingMemoMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly workingMemo: Maybe<Scalars["String"]["output"]>;
};

/** An enumeration. */
export enum ReserveeType {
  /** Yritys */
  Business = "BUSINESS",
  /** Yksityinen */
  Individual = "INDIVIDUAL",
  /** Voittoa tavoittelematon */
  Nonprofit = "NONPROFIT",
}

export type ResourceCreateMutationInput = {
  readonly locationType?: InputMaybe<LocationType>;
  readonly name: Scalars["String"]["input"];
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly space?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ResourceCreateMutationPayload = {
  readonly locationType: Maybe<LocationType>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly space: Maybe<Scalars["Int"]["output"]>;
};

export type ResourceDeleteMutationInput = {
  readonly pk: Scalars["ID"]["input"];
};

export type ResourceDeleteMutationPayload = {
  readonly deleted: Maybe<Scalars["Boolean"]["output"]>;
};

/** An enumeration. */
export enum ResourceLocationType {
  Fixed = "FIXED",
  Movable = "MOVABLE",
}

export type ResourceNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly locationType: ResourceLocationType;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly space: Maybe<SpaceNode>;
};

export type ResourceNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<ResourceNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ResourceNode` and its cursor. */
export type ResourceNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<ResourceNode>;
};

/** Ordering fields for the 'Resource' model. */
export enum ResourceOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type ResourceUpdateMutationInput = {
  readonly locationType?: InputMaybe<LocationType>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
  readonly space?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ResourceUpdateMutationPayload = {
  readonly locationType: Maybe<LocationType>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly space: Maybe<Scalars["Int"]["output"]>;
};

export type RestoreAllApplicationOptionsMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type RestoreAllApplicationOptionsMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type RestoreAllSectionOptionsMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type RestoreAllSectionOptionsMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type SetApplicationRoundHandledMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type SetApplicationRoundHandledMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type SetApplicationRoundResultsSentMutationInput = {
  readonly pk: Scalars["Int"]["input"];
};

export type SetApplicationRoundResultsSentMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
};

export type SpaceCreateMutationInput = {
  readonly code?: InputMaybe<Scalars["String"]["input"]>;
  readonly maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly name: Scalars["String"]["input"];
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly parent?: InputMaybe<Scalars["Int"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly surfaceArea?: InputMaybe<Scalars["Int"]["input"]>;
  readonly unit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type SpaceCreateMutationPayload = {
  readonly code: Maybe<Scalars["String"]["output"]>;
  readonly maxPersons: Maybe<Scalars["Int"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly parent: Maybe<Scalars["Int"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly surfaceArea: Maybe<Scalars["Int"]["output"]>;
  readonly unit: Maybe<Scalars["Int"]["output"]>;
};

export type SpaceDeleteMutationInput = {
  readonly pk: Scalars["ID"]["input"];
};

export type SpaceDeleteMutationPayload = {
  readonly deleted: Maybe<Scalars["Boolean"]["output"]>;
};

export type SpaceNode = Node & {
  readonly children: Maybe<ReadonlyArray<SpaceNode>>;
  readonly code: Scalars["String"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly maxPersons: Maybe<Scalars["Int"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly parent: Maybe<SpaceNode>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly resources: ReadonlyArray<ResourceNode>;
  readonly surfaceArea: Maybe<Scalars["Int"]["output"]>;
  readonly unit: Maybe<UnitNode>;
};

export type SpaceNodeChildrenArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<SpaceOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type SpaceNodeResourcesArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<ResourceOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type SpaceNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<SpaceNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `SpaceNode` and its cursor. */
export type SpaceNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<SpaceNode>;
};

/** Ordering fields for the 'Space' model. */
export enum SpaceOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type SpaceUpdateMutationInput = {
  readonly code?: InputMaybe<Scalars["String"]["input"]>;
  readonly maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly parent?: InputMaybe<Scalars["Int"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
  readonly surfaceArea?: InputMaybe<Scalars["Int"]["input"]>;
  readonly unit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type SpaceUpdateMutationPayload = {
  readonly code: Maybe<Scalars["String"]["output"]>;
  readonly maxPersons: Maybe<Scalars["Int"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly parent: Maybe<Scalars["Int"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly surfaceArea: Maybe<Scalars["Int"]["output"]>;
  readonly unit: Maybe<Scalars["Int"]["output"]>;
};

/** An enumeration. */
export enum Status {
  /** Peruttu */
  Cancelled = "CANCELLED",
  /** Luonnos */
  Draft = "DRAFT",
  /** Rauennut */
  Expired = "EXPIRED",
  /** Käsitelty */
  Handled = "HANDLED",
  /** Käsittelyssä */
  InAllocation = "IN_ALLOCATION",
  /** Vastaanotettu */
  Received = "RECEIVED",
  /** Päätökset lähetetty */
  ResultSent = "RESULT_SENT",
}

export type SuitableTimeRangeNode = Node & {
  readonly applicationSection: ApplicationSectionNode;
  readonly beginTime: Scalars["Time"]["output"];
  readonly dayOfTheWeek: Weekday;
  readonly endTime: Scalars["Time"]["output"];
  readonly fulfilled: Scalars["Boolean"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly priority: Priority;
};

/** Ordering fields for the 'SuitableTimeRange' model. */
export enum SuitableTimeRangeOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type SuitableTimeRangeSerializerInput = {
  readonly beginTime: Scalars["Time"]["input"];
  readonly dayOfTheWeek: Weekday;
  readonly endTime: Scalars["Time"]["input"];
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly priority: Priority;
};

export type TaxPercentageNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly value: Scalars["Decimal"]["output"];
};

export type TaxPercentageNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<TaxPercentageNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `TaxPercentageNode` and its cursor. */
export type TaxPercentageNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<TaxPercentageNode>;
};

/** Ordering fields for the 'TaxPercentage' model. */
export enum TaxPercentageOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type TermsOfUseNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["String"]["output"]>;
  readonly termsType: TermsType;
  readonly textEn: Maybe<Scalars["String"]["output"]>;
  readonly textFi: Maybe<Scalars["String"]["output"]>;
  readonly textSv: Maybe<Scalars["String"]["output"]>;
};

export type TermsOfUseNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<TermsOfUseNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `TermsOfUseNode` and its cursor. */
export type TermsOfUseNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<TermsOfUseNode>;
};

/** Ordering fields for the 'TermsOfUse' model. */
export enum TermsOfUseOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

/** An enumeration. */
export enum TermsType {
  /** Peruutusehdot */
  CancellationTerms = "CANCELLATION_TERMS",
  /** Yleiset ehdot */
  GenericTerms = "GENERIC_TERMS",
  /** Maksuehdot */
  PaymentTerms = "PAYMENT_TERMS",
  /** Hinnoitteluehdot */
  PricingTerms = "PRICING_TERMS",
  /** Kausivarauksen ehdot */
  RecurringTerms = "RECURRING_TERMS",
  /** Palvelukohtaiset ehdot */
  ServiceTerms = "SERVICE_TERMS",
}

export type TimeSlotSerializerInput = {
  readonly begin: Scalars["Time"]["input"];
  readonly end: Scalars["Time"]["input"];
};

export type TimeSlotType = {
  readonly begin: Scalars["Time"]["output"];
  readonly end: Scalars["Time"]["output"];
};

/** This Node should be kept to the bare minimum and never expose any relations to avoid performance issues. */
export type UnitAllNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly tprekId: Maybe<Scalars["String"]["output"]>;
};

export type UnitGroupNode = Node & {
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly units: ReadonlyArray<UnitNode>;
};

export type UnitGroupNodeUnitsArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyDirectBookable?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlySeasonalBookable?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<UnitOrderingChoices>>>;
  ownReservations?: InputMaybe<Scalars["Boolean"]["input"]>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  publishedReservationUnits?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type UnitGroupNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<UnitGroupNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `UnitGroupNode` and its cursor. */
export type UnitGroupNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<UnitGroupNode>;
};

export type UnitNode = Node & {
  readonly descriptionEn: Maybe<Scalars["String"]["output"]>;
  readonly descriptionFi: Maybe<Scalars["String"]["output"]>;
  readonly descriptionSv: Maybe<Scalars["String"]["output"]>;
  readonly email: Scalars["String"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly location: Maybe<LocationNode>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly paymentMerchant: Maybe<PaymentMerchantNode>;
  readonly phone: Scalars["String"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly reservationUnits: ReadonlyArray<ReservationUnitNode>;
  readonly shortDescriptionEn: Maybe<Scalars["String"]["output"]>;
  readonly shortDescriptionFi: Maybe<Scalars["String"]["output"]>;
  readonly shortDescriptionSv: Maybe<Scalars["String"]["output"]>;
  readonly spaces: ReadonlyArray<SpaceNode>;
  readonly tprekId: Maybe<Scalars["String"]["output"]>;
  readonly unitGroups: ReadonlyArray<UnitGroupNode>;
  readonly webPage: Scalars["String"]["output"];
};

export type UnitNodeReservationUnitsArgs = {
  accessType?: InputMaybe<ReadonlyArray<InputMaybe<AccessType>>>;
  accessTypeBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  accessTypeEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  applicationRound?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  calculateFirstReservableTime?: InputMaybe<Scalars["Boolean"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  equipments?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]["input"]>;
  maxPersonsGte?: InputMaybe<Scalars["Int"]["input"]>;
  maxPersonsLte?: InputMaybe<Scalars["Int"]["input"]>;
  minPersonsGte?: InputMaybe<Scalars["Int"]["input"]>;
  minPersonsLte?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitOrderingChoices>>
  >;
  personsAllowed?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  publishingState?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitPublishingState>>
  >;
  purposes?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifiers?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Int"]["input"]>;
  rankLte?: InputMaybe<Scalars["Int"]["input"]>;
  reservableDateEnd?: InputMaybe<Scalars["Date"]["input"]>;
  reservableDateStart?: InputMaybe<Scalars["Date"]["input"]>;
  reservableMinimumDurationMinutes?: InputMaybe<Scalars["Int"]["input"]>;
  reservableTimeEnd?: InputMaybe<Scalars["Time"]["input"]>;
  reservableTimeStart?: InputMaybe<Scalars["Time"]["input"]>;
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
  reservationState?: InputMaybe<
    ReadonlyArray<InputMaybe<ReservationUnitReservationState>>
  >;
  reservationUnitType?: InputMaybe<
    ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
  >;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  surfaceAreaGte?: InputMaybe<Scalars["Int"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Int"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  tprekDepartmentId?: InputMaybe<Scalars["String"]["input"]>;
  tprekId?: InputMaybe<Scalars["String"]["input"]>;
  typeRankGte?: InputMaybe<Scalars["Int"]["input"]>;
  typeRankLte?: InputMaybe<Scalars["Int"]["input"]>;
  unit?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  uuid?: InputMaybe<Scalars["UUID"]["input"]>;
};

export type UnitNodeSpacesArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<SpaceOrderingChoices>>>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type UnitNodeConnection = {
  /** Contains the nodes in this connection. */
  readonly edges: ReadonlyArray<Maybe<UnitNodeEdge>>;
  /** Pagination data for this connection. */
  readonly pageInfo: PageInfo;
  readonly totalCount: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `UnitNode` and its cursor. */
export type UnitNodeEdge = {
  /** A cursor for use in pagination */
  readonly cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  readonly node: Maybe<UnitNode>;
};

/** Ordering fields for the 'Unit' model. */
export enum UnitOrderingChoices {
  NameEnAsc = "nameEnAsc",
  NameEnDesc = "nameEnDesc",
  NameFiAsc = "nameFiAsc",
  NameFiDesc = "nameFiDesc",
  NameSvAsc = "nameSvAsc",
  NameSvDesc = "nameSvDesc",
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
  RankAsc = "rankAsc",
  RankDesc = "rankDesc",
  ReservationCountAsc = "reservationCountAsc",
  ReservationCountDesc = "reservationCountDesc",
  ReservationUnitsCountAsc = "reservationUnitsCountAsc",
  ReservationUnitsCountDesc = "reservationUnitsCountDesc",
  UnitGroupNameEnAsc = "unitGroupNameEnAsc",
  UnitGroupNameEnDesc = "unitGroupNameEnDesc",
  UnitGroupNameFiAsc = "unitGroupNameFiAsc",
  UnitGroupNameFiDesc = "unitGroupNameFiDesc",
  UnitGroupNameSvAsc = "unitGroupNameSvAsc",
  UnitGroupNameSvDesc = "unitGroupNameSvDesc",
}

export type UnitRoleNode = Node & {
  readonly assigner: Maybe<UserNode>;
  readonly created: Scalars["DateTime"]["output"];
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly modified: Scalars["DateTime"]["output"];
  readonly permissions: ReadonlyArray<UserPermissionChoice>;
  readonly role: UserRoleChoice;
  readonly unitGroups: ReadonlyArray<UnitGroupNode>;
  readonly units: ReadonlyArray<UnitNode>;
  readonly user: UserNode;
};

export type UnitRoleNodeUnitsArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  onlyDirectBookable?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlySeasonalBookable?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<ReadonlyArray<InputMaybe<UnitOrderingChoices>>>;
  ownReservations?: InputMaybe<Scalars["Boolean"]["input"]>;
  pk?: InputMaybe<ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>>;
  publishedReservationUnits?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type UnitUpdateMutationInput = {
  readonly description?: InputMaybe<Scalars["String"]["input"]>;
  readonly descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly email?: InputMaybe<Scalars["String"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly phone?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk: Scalars["Int"]["input"];
  readonly shortDescription?: InputMaybe<Scalars["String"]["input"]>;
  readonly shortDescriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly shortDescriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly shortDescriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly tprekId?: InputMaybe<Scalars["String"]["input"]>;
  readonly webPage?: InputMaybe<Scalars["String"]["input"]>;
};

export type UnitUpdateMutationPayload = {
  readonly description: Maybe<Scalars["String"]["output"]>;
  readonly descriptionEn: Maybe<Scalars["String"]["output"]>;
  readonly descriptionFi: Maybe<Scalars["String"]["output"]>;
  readonly descriptionSv: Maybe<Scalars["String"]["output"]>;
  readonly email: Maybe<Scalars["String"]["output"]>;
  readonly name: Maybe<Scalars["String"]["output"]>;
  readonly nameEn: Maybe<Scalars["String"]["output"]>;
  readonly nameFi: Maybe<Scalars["String"]["output"]>;
  readonly nameSv: Maybe<Scalars["String"]["output"]>;
  readonly phone: Maybe<Scalars["String"]["output"]>;
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly shortDescription: Maybe<Scalars["String"]["output"]>;
  readonly shortDescriptionEn: Maybe<Scalars["String"]["output"]>;
  readonly shortDescriptionFi: Maybe<Scalars["String"]["output"]>;
  readonly shortDescriptionSv: Maybe<Scalars["String"]["output"]>;
  readonly tprekId: Maybe<Scalars["String"]["output"]>;
  readonly webPage: Maybe<Scalars["String"]["output"]>;
};

export type UpdateAddressSerializerInput = {
  readonly city?: InputMaybe<Scalars["String"]["input"]>;
  readonly cityEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly cityFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly citySv?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly postCode?: InputMaybe<Scalars["String"]["input"]>;
  readonly streetAddress?: InputMaybe<Scalars["String"]["input"]>;
  readonly streetAddressEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly streetAddressFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly streetAddressSv?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateApplicationRoundTimeSlotSerializerInput = {
  readonly closed?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly reservableTimes?: InputMaybe<
    ReadonlyArray<InputMaybe<TimeSlotSerializerInput>>
  >;
  readonly weekday: Scalars["Int"]["input"];
};

export type UpdateApplicationSectionForApplicationSerializerInput = {
  readonly ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly appliedReservationsPerWeek?: InputMaybe<Scalars["Int"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly purpose?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationMaxDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly reservationMinDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  readonly reservationUnitOptions?: InputMaybe<
    ReadonlyArray<
      InputMaybe<UpdateReservationUnitOptionApplicantSerializerInput>
    >
  >;
  readonly reservationsBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  readonly reservationsEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  readonly suitableTimeRanges?: InputMaybe<
    ReadonlyArray<InputMaybe<UpdateSuitableTimeRangeSerializerInput>>
  >;
};

export type UpdateOrganisationSerializerInput = {
  readonly activeMembers?: InputMaybe<Scalars["Int"]["input"]>;
  readonly address?: InputMaybe<UpdateAddressSerializerInput>;
  readonly coreBusiness?: InputMaybe<Scalars["String"]["input"]>;
  readonly coreBusinessEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly coreBusinessFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly coreBusinessSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly email?: InputMaybe<Scalars["String"]["input"]>;
  readonly identifier?: InputMaybe<Scalars["String"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameEn?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameFi?: InputMaybe<Scalars["String"]["input"]>;
  readonly nameSv?: InputMaybe<Scalars["String"]["input"]>;
  readonly organisationType?: InputMaybe<OrganizationTypeChoice>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly yearEstablished?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdatePersonSerializerInput = {
  readonly email?: InputMaybe<Scalars["String"]["input"]>;
  readonly firstName?: InputMaybe<Scalars["String"]["input"]>;
  readonly lastName?: InputMaybe<Scalars["String"]["input"]>;
  readonly phoneNumber?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateReservationSeriesReservationUpdateSerializerInput = {
  readonly ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  readonly applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  readonly billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  readonly description?: InputMaybe<Scalars["String"]["input"]>;
  readonly freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  readonly homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  readonly name?: InputMaybe<Scalars["String"]["input"]>;
  readonly numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  readonly purpose?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeIsUnregisteredAssociation?: InputMaybe<
    Scalars["Boolean"]["input"]
  >;
  readonly reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  readonly reserveeType?: InputMaybe<ReserveeType>;
  readonly workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateReservationUnitAccessTypeSerializerInput = {
  readonly accessType?: InputMaybe<AccessType>;
  readonly beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateReservationUnitImageFieldSerializerInput = {
  readonly imageType?: InputMaybe<ImageType>;
  readonly imageUrl: Scalars["Upload"]["input"];
  readonly largeUrl?: InputMaybe<Scalars["String"]["input"]>;
  readonly mediumUrl?: InputMaybe<Scalars["String"]["input"]>;
  readonly smallUrl?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateReservationUnitOptionApplicantSerializerInput = {
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly preferredOrder?: InputMaybe<Scalars["Int"]["input"]>;
  readonly reservationUnit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateReservationUnitPricingSerializerInput = {
  readonly begins?: InputMaybe<Scalars["Date"]["input"]>;
  readonly highestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  readonly highestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  readonly isActivatedOnBegins?: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly lowestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  readonly lowestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly priceUnit?: InputMaybe<PriceUnit>;
  readonly taxPercentage?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateSuitableTimeRangeSerializerInput = {
  readonly beginTime?: InputMaybe<Scalars["Time"]["input"]>;
  readonly dayOfTheWeek?: InputMaybe<Weekday>;
  readonly endTime?: InputMaybe<Scalars["Time"]["input"]>;
  readonly pk?: InputMaybe<Scalars["Int"]["input"]>;
  readonly priority?: InputMaybe<Priority>;
};

export type UserNode = Node & {
  readonly dateOfBirth: Maybe<Scalars["Date"]["output"]>;
  readonly email: Scalars["String"]["output"];
  readonly firstName: Scalars["String"]["output"];
  readonly generalRoles: ReadonlyArray<GeneralRoleNode>;
  /** The ID of the object */
  readonly id: Scalars["ID"]["output"];
  readonly isAdAuthenticated: Scalars["Boolean"]["output"];
  readonly isStronglyAuthenticated: Scalars["Boolean"]["output"];
  /** Antaa käyttäjälle kaikki oikeudet ilman, että niitä täytyy erikseen luetella. */
  readonly isSuperuser: Scalars["Boolean"]["output"];
  readonly lastName: Scalars["String"]["output"];
  readonly name: Scalars["String"]["output"];
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly reservationNotification: Maybe<ReservationNotification>;
  readonly unitRoles: ReadonlyArray<UnitRoleNode>;
  /** Vaaditaan. Enintään 150 merkkiä. Vain kirjaimet, numerot ja @/./+/-/_ ovat sallittuja. */
  readonly username: Scalars["String"]["output"];
  readonly uuid: Scalars["UUID"]["output"];
};

/** An enumeration. */
export enum UserPermissionChoice {
  CanCreateStaffReservations = "CAN_CREATE_STAFF_RESERVATIONS",
  CanManageApplications = "CAN_MANAGE_APPLICATIONS",
  CanManageNotifications = "CAN_MANAGE_NOTIFICATIONS",
  CanManageReservations = "CAN_MANAGE_RESERVATIONS",
  CanManageReservationRelatedData = "CAN_MANAGE_RESERVATION_RELATED_DATA",
  CanManageReservationUnits = "CAN_MANAGE_RESERVATION_UNITS",
  CanViewApplications = "CAN_VIEW_APPLICATIONS",
  CanViewReservations = "CAN_VIEW_RESERVATIONS",
  CanViewUsers = "CAN_VIEW_USERS",
}

/** An enumeration. */
export enum UserRoleChoice {
  /** Pääkäyttäjä */
  Admin = "ADMIN",
  /** Käsittelijä */
  Handler = "HANDLER",
  /** Ilmoituksen hallitsija. */
  NotificationManager = "NOTIFICATION_MANAGER",
  /** Varaaja */
  Reserver = "RESERVER",
  /** Katselija */
  Viewer = "VIEWER",
}

export type UserStaffUpdateMutationInput = {
  readonly pk: Scalars["Int"]["input"];
  readonly reservationNotification?: InputMaybe<ReservationNotification>;
};

export type UserStaffUpdateMutationPayload = {
  readonly pk: Maybe<Scalars["Int"]["output"]>;
  readonly reservationNotification: Maybe<ReservationNotification>;
};

/** An enumeration. */
export enum Weekday {
  Friday = "FRIDAY",
  Monday = "MONDAY",
  Saturday = "SATURDAY",
  Sunday = "SUNDAY",
  Thursday = "THURSDAY",
  Tuesday = "TUESDAY",
  Wednesday = "WEDNESDAY",
}

export type BannerNotificationsListAllQueryVariables = Exact<{
  [key: string]: never;
}>;

export type BannerNotificationsListAllQuery = {
  readonly bannerNotifications: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly level: BannerNotificationLevel;
        readonly activeFrom: string | null;
        readonly messageEn: string | null;
        readonly messageFi: string | null;
        readonly messageSv: string | null;
      } | null;
    } | null>;
  } | null;
};

export type BannerNotificationsListQueryVariables = Exact<{
  target: BannerNotificationTarget;
}>;

export type BannerNotificationsListQuery = {
  readonly bannerNotifications: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly level: BannerNotificationLevel;
        readonly activeFrom: string | null;
        readonly messageEn: string | null;
        readonly messageFi: string | null;
        readonly messageSv: string | null;
      } | null;
    } | null>;
  } | null;
};

export type TermsOfUseQueryVariables = Exact<{
  termsType?: InputMaybe<TermsType>;
}>;

export type TermsOfUseQuery = {
  readonly termsOfUse: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: string | null;
        readonly termsType: TermsType;
        readonly nameFi: string | null;
        readonly nameEn: string | null;
        readonly nameSv: string | null;
        readonly textFi: string | null;
        readonly textEn: string | null;
        readonly textSv: string | null;
      } | null;
    } | null>;
  } | null;
};

export type ApplicationNameFragment = {
  readonly id: string;
  readonly applicantType: ApplicantTypeChoice | null;
  readonly organisation: {
    readonly id: string;
    readonly nameFi: string | null;
    readonly organisationType: OrganizationTypeChoice;
  } | null;
  readonly contactPerson: {
    readonly id: string;
    readonly lastName: string;
    readonly firstName: string;
  } | null;
};

export type ApplicationSectionDurationFragment = {
  readonly id: string;
  readonly reservationsEndDate: string;
  readonly reservationsBeginDate: string;
  readonly appliedReservationsPerWeek: number;
  readonly reservationMinDuration: number;
};

export type ApplicationSectionCommonFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly name: string;
  readonly status: ApplicationSectionStatusChoice;
  readonly reservationMaxDuration: number;
  readonly numPersons: number;
  readonly reservationsEndDate: string;
  readonly reservationsBeginDate: string;
  readonly appliedReservationsPerWeek: number;
  readonly reservationMinDuration: number;
  readonly ageGroup: {
    readonly id: string;
    readonly pk: number | null;
    readonly minimum: number;
    readonly maximum: number | null;
  } | null;
  readonly reservationUnitOptions: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly preferredOrder: number;
  }>;
};

export type SuitableTimeFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly beginTime: string;
  readonly endTime: string;
  readonly dayOfTheWeek: Weekday;
  readonly priority: Priority;
};

export type ApplicantFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly applicantType: ApplicantTypeChoice | null;
  readonly additionalInformation: string | null;
  readonly contactPerson: {
    readonly id: string;
    readonly pk: number | null;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string | null;
    readonly phoneNumber: string | null;
  } | null;
  readonly organisation: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly identifier: string | null;
    readonly organisationType: OrganizationTypeChoice;
    readonly coreBusinessFi: string | null;
    readonly yearEstablished: number | null;
    readonly address: {
      readonly id: string;
      readonly pk: number | null;
      readonly postCode: string;
      readonly streetAddressFi: string | null;
      readonly cityFi: string | null;
    } | null;
  } | null;
  readonly homeCity: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly nameEn: string | null;
    readonly nameSv: string | null;
  } | null;
  readonly billingAddress: {
    readonly id: string;
    readonly pk: number | null;
    readonly postCode: string;
    readonly streetAddressFi: string | null;
    readonly cityFi: string | null;
  } | null;
};

export type ReserveeNameFieldsFragment = {
  readonly id: string;
  readonly reserveeFirstName: string | null;
  readonly reserveeLastName: string | null;
  readonly reserveeEmail: string | null;
  readonly reserveePhone: string | null;
  readonly reserveeType: CustomerTypeChoice | null;
  readonly reserveeOrganisationName: string | null;
  readonly reserveeId: string | null;
};

export type ReserveeBillingFieldsFragment = {
  readonly id: string;
  readonly reserveeId: string | null;
  readonly reserveeIsUnregisteredAssociation: boolean | null;
  readonly reserveeAddressStreet: string | null;
  readonly reserveeAddressCity: string | null;
  readonly reserveeAddressZip: string | null;
  readonly billingFirstName: string | null;
  readonly billingLastName: string | null;
  readonly billingPhone: string | null;
  readonly billingEmail: string | null;
  readonly billingAddressStreet: string | null;
  readonly billingAddressCity: string | null;
  readonly billingAddressZip: string | null;
};

export type MetaFieldsFragment = {
  readonly applyingForFreeOfCharge: boolean | null;
  readonly freeOfChargeReason: string | null;
  readonly description: string | null;
  readonly numPersons: number | null;
  readonly id: string;
  readonly reserveeFirstName: string | null;
  readonly reserveeLastName: string | null;
  readonly reserveeEmail: string | null;
  readonly reserveePhone: string | null;
  readonly reserveeType: CustomerTypeChoice | null;
  readonly reserveeOrganisationName: string | null;
  readonly reserveeId: string | null;
  readonly reserveeIsUnregisteredAssociation: boolean | null;
  readonly reserveeAddressStreet: string | null;
  readonly reserveeAddressCity: string | null;
  readonly reserveeAddressZip: string | null;
  readonly billingFirstName: string | null;
  readonly billingLastName: string | null;
  readonly billingPhone: string | null;
  readonly billingEmail: string | null;
  readonly billingAddressStreet: string | null;
  readonly billingAddressCity: string | null;
  readonly billingAddressZip: string | null;
  readonly ageGroup: {
    readonly id: string;
    readonly pk: number | null;
    readonly maximum: number | null;
    readonly minimum: number;
  } | null;
  readonly purpose: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly nameEn: string | null;
    readonly nameSv: string | null;
  } | null;
  readonly homeCity: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly nameSv: string | null;
    readonly nameEn: string | null;
  } | null;
};

export type TermsOfUseNameFieldsFragment = {
  readonly id: string;
  readonly nameFi: string | null;
  readonly nameEn: string | null;
  readonly nameSv: string | null;
};

export type TermsOfUseTextFieldsFragment = {
  readonly id: string;
  readonly textFi: string | null;
  readonly textEn: string | null;
  readonly textSv: string | null;
};

export type TermsOfUseFieldsFragment = {
  readonly pk: string | null;
  readonly termsType: TermsType;
  readonly id: string;
  readonly nameFi: string | null;
  readonly nameEn: string | null;
  readonly nameSv: string | null;
  readonly textFi: string | null;
  readonly textEn: string | null;
  readonly textSv: string | null;
};

export type PricingFieldsFragment = {
  readonly id: string;
  readonly begins: string;
  readonly priceUnit: PriceUnit;
  readonly lowestPrice: string;
  readonly highestPrice: string;
  readonly taxPercentage: {
    readonly id: string;
    readonly pk: number | null;
    readonly value: string;
  };
};

export type ImageFragment = {
  readonly id: string;
  readonly imageUrl: string | null;
  readonly largeUrl: string | null;
  readonly mediumUrl: string | null;
  readonly smallUrl: string | null;
  readonly imageType: ImageType;
};

export type LocationFieldsFragment = {
  readonly id: string;
  readonly addressStreetFi: string | null;
  readonly addressZip: string;
  readonly addressCityFi: string | null;
};

export type LocationFieldsI18nFragment = {
  readonly addressStreetEn: string | null;
  readonly addressStreetSv: string | null;
  readonly addressCityEn: string | null;
  readonly addressCitySv: string | null;
  readonly id: string;
  readonly addressStreetFi: string | null;
  readonly addressZip: string;
  readonly addressCityFi: string | null;
};

export type BannerNotificationCommonFragment = {
  readonly id: string;
  readonly level: BannerNotificationLevel;
  readonly activeFrom: string | null;
  readonly messageEn: string | null;
  readonly messageFi: string | null;
  readonly messageSv: string | null;
};

export type MetadataSetsFragment = {
  readonly id: string;
  readonly minPersons: number | null;
  readonly maxPersons: number | null;
  readonly metadataSet: {
    readonly id: string;
    readonly requiredFields: ReadonlyArray<{
      readonly id: string;
      readonly fieldName: string;
    }>;
    readonly supportedFields: ReadonlyArray<{
      readonly id: string;
      readonly fieldName: string;
    }>;
  } | null;
};

export type AllocatedTimeSlotFragment = {
  readonly id: string;
  readonly beginTime: string;
  readonly endTime: string;
  readonly dayOfTheWeek: Weekday;
};

export type ApplicationSectionFieldsFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly name: string;
  readonly status: ApplicationSectionStatusChoice;
  readonly reservationMaxDuration: number;
  readonly numPersons: number;
  readonly reservationsEndDate: string;
  readonly reservationsBeginDate: string;
  readonly appliedReservationsPerWeek: number;
  readonly reservationMinDuration: number;
  readonly purpose: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
  } | null;
  readonly application: {
    readonly id: string;
    readonly pk: number | null;
    readonly status: ApplicationStatusChoice;
    readonly applicantType: ApplicantTypeChoice | null;
    readonly organisation: {
      readonly id: string;
      readonly nameFi: string | null;
      readonly organisationType: OrganizationTypeChoice;
    } | null;
    readonly contactPerson: {
      readonly id: string;
      readonly lastName: string;
      readonly firstName: string;
    } | null;
  };
  readonly reservationUnitOptions: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly preferredOrder: number;
    readonly reservationUnit: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly unit: {
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
      } | null;
    };
  }>;
  readonly ageGroup: {
    readonly id: string;
    readonly pk: number | null;
    readonly minimum: number;
    readonly maximum: number | null;
  } | null;
};

export type ReservationCommonFieldsFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly begin: string;
  readonly end: string;
  readonly createdAt: string | null;
  readonly state: ReservationStateChoice | null;
  readonly type: ReservationTypeChoice | null;
  readonly isBlocked: boolean;
  readonly workingMemo: string | null;
  readonly reserveeName: string | null;
  readonly bufferTimeBefore: number;
  readonly bufferTimeAfter: number;
  readonly paymentOrder: ReadonlyArray<{
    readonly id: string;
    readonly status: OrderStatus;
  }>;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
  } | null;
};

export type ReservationUnitReservationsFragment = {
  readonly name: string | null;
  readonly numPersons: number | null;
  readonly calendarUrl: string | null;
  readonly affectedReservationUnits: ReadonlyArray<number | null> | null;
  readonly id: string;
  readonly pk: number | null;
  readonly begin: string;
  readonly end: string;
  readonly createdAt: string | null;
  readonly state: ReservationStateChoice | null;
  readonly type: ReservationTypeChoice | null;
  readonly isBlocked: boolean;
  readonly workingMemo: string | null;
  readonly reserveeName: string | null;
  readonly bufferTimeBefore: number;
  readonly bufferTimeAfter: number;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly bufferTimeBefore: number;
    readonly bufferTimeAfter: number;
    readonly unit: { readonly id: string; readonly pk: number | null } | null;
  }>;
  readonly paymentOrder: ReadonlyArray<{
    readonly id: string;
    readonly status: OrderStatus;
  }>;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly pk: number | null;
  } | null;
};

export type ReservationMetaFieldsFragment = {
  readonly numPersons: number | null;
  readonly name: string | null;
  readonly description: string | null;
  readonly freeOfChargeReason: string | null;
  readonly applyingForFreeOfCharge: boolean | null;
  readonly id: string;
  readonly reserveeFirstName: string | null;
  readonly reserveeLastName: string | null;
  readonly reserveeEmail: string | null;
  readonly reserveePhone: string | null;
  readonly reserveeType: CustomerTypeChoice | null;
  readonly reserveeOrganisationName: string | null;
  readonly reserveeId: string | null;
  readonly reserveeIsUnregisteredAssociation: boolean | null;
  readonly reserveeAddressStreet: string | null;
  readonly reserveeAddressCity: string | null;
  readonly reserveeAddressZip: string | null;
  readonly billingFirstName: string | null;
  readonly billingLastName: string | null;
  readonly billingPhone: string | null;
  readonly billingEmail: string | null;
  readonly billingAddressStreet: string | null;
  readonly billingAddressCity: string | null;
  readonly billingAddressZip: string | null;
  readonly ageGroup: {
    readonly id: string;
    readonly minimum: number;
    readonly maximum: number | null;
    readonly pk: number | null;
  } | null;
  readonly purpose: {
    readonly id: string;
    readonly nameFi: string | null;
    readonly pk: number | null;
  } | null;
  readonly homeCity: {
    readonly id: string;
    readonly nameFi: string | null;
    readonly pk: number | null;
  } | null;
};

export type RecurringReservationFieldsFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly weekdays: ReadonlyArray<number>;
  readonly beginDate: string | null;
  readonly endDate: string | null;
  readonly rejectedOccurrences: ReadonlyArray<{
    readonly id: string;
    readonly beginDatetime: string;
    readonly endDatetime: string;
    readonly rejectionReason: RejectionReadinessChoice;
  }>;
  readonly reservations: ReadonlyArray<{
    readonly state: ReservationStateChoice | null;
    readonly id: string;
    readonly pk: number | null;
    readonly begin: string;
    readonly end: string;
    readonly type: ReservationTypeChoice | null;
    readonly bufferTimeAfter: number;
    readonly bufferTimeBefore: number;
    readonly paymentOrder: ReadonlyArray<{
      readonly id: string;
      readonly status: OrderStatus;
    }>;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly bufferTimeBefore: number;
      readonly bufferTimeAfter: number;
      readonly reservationStartInterval: ReservationStartInterval;
      readonly unit: { readonly id: string; readonly pk: number | null } | null;
    }>;
    readonly recurringReservation: {
      readonly pk: number | null;
      readonly id: string;
      readonly weekdays: ReadonlyArray<number>;
      readonly beginDate: string | null;
      readonly endDate: string | null;
    } | null;
  }>;
};

export type ApplicationRoundTimeSlotsFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly weekday: number;
  readonly closed: boolean;
  readonly reservableTimes: ReadonlyArray<{
    readonly begin: string;
    readonly end: string;
  } | null>;
};

export type ReservationDateOfBirthQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationDateOfBirthQuery = {
  readonly reservation: {
    readonly id: string;
    readonly user: {
      readonly id: string;
      readonly pk: number | null;
      readonly dateOfBirth: string | null;
    } | null;
  } | null;
};

export type ApplicationDateOfBirthQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationDateOfBirthQuery = {
  readonly application: {
    readonly id: string;
    readonly user: {
      readonly id: string;
      readonly pk: number | null;
      readonly dateOfBirth: string | null;
    } | null;
  } | null;
};

export type DenyDialogFieldsFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly handlingDetails: string | null;
  readonly price: string | null;
  readonly paymentOrder: ReadonlyArray<{
    readonly id: string;
    readonly orderUuid: string | null;
    readonly status: OrderStatus;
    readonly refundUuid: string | null;
  }>;
};

export type DenyReservationMutationVariables = Exact<{
  input: ReservationDenyMutationInput;
}>;

export type DenyReservationMutation = {
  readonly denyReservation: {
    readonly pk: number | null;
    readonly state: ReservationStateChoice | null;
  } | null;
};

export type DenyReservationSeriesMutationVariables = Exact<{
  input: ReservationSeriesDenyMutationInput;
}>;

export type DenyReservationSeriesMutation = {
  readonly denyReservationSeries: {
    readonly denied: number | null;
    readonly future: number | null;
  } | null;
};

export type RefundReservationMutationVariables = Exact<{
  input: ReservationRefundMutationInput;
}>;

export type RefundReservationMutation = {
  readonly refundReservation: { readonly pk: number | null } | null;
};

export type StaffAdjustReservationTimeMutationVariables = Exact<{
  input: ReservationStaffAdjustTimeMutationInput;
}>;

export type StaffAdjustReservationTimeMutation = {
  readonly staffAdjustReservationTime: {
    readonly pk: number | null;
    readonly begin: string | null;
    readonly end: string | null;
    readonly state: ReservationStateChoice | null;
  } | null;
};

export type AddReservationToSeriesMutationVariables = Exact<{
  input: ReservationSeriesAddMutationInput;
}>;

export type AddReservationToSeriesMutation = {
  readonly addReservationToSeries: { readonly pk: number | null } | null;
};

export type ChangeReservationTimeFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly begin: string;
  readonly end: string;
  readonly type: ReservationTypeChoice | null;
  readonly bufferTimeAfter: number;
  readonly bufferTimeBefore: number;
  readonly recurringReservation: {
    readonly pk: number | null;
    readonly id: string;
    readonly weekdays: ReadonlyArray<number>;
    readonly beginDate: string | null;
    readonly endDate: string | null;
  } | null;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly bufferTimeBefore: number;
    readonly bufferTimeAfter: number;
    readonly reservationStartInterval: ReservationStartInterval;
  }>;
};

export type ReservationTypeFormFieldsFragment = {
  readonly authentication: Authentication;
  readonly bufferTimeBefore: number;
  readonly bufferTimeAfter: number;
  readonly id: string;
  readonly minPersons: number | null;
  readonly maxPersons: number | null;
  readonly serviceSpecificTerms: {
    readonly id: string;
    readonly textFi: string | null;
    readonly nameFi: string | null;
  } | null;
  readonly paymentTerms: {
    readonly id: string;
    readonly textFi: string | null;
    readonly nameFi: string | null;
  } | null;
  readonly pricingTerms: {
    readonly id: string;
    readonly textFi: string | null;
    readonly nameFi: string | null;
  } | null;
  readonly cancellationTerms: {
    readonly id: string;
    readonly textFi: string | null;
    readonly nameFi: string | null;
  } | null;
  readonly metadataSet: {
    readonly id: string;
    readonly requiredFields: ReadonlyArray<{
      readonly id: string;
      readonly fieldName: string;
    }>;
    readonly supportedFields: ReadonlyArray<{
      readonly id: string;
      readonly fieldName: string;
    }>;
  } | null;
};

export type ReservationToCopyFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly begin: string;
  readonly end: string;
  readonly type: ReservationTypeChoice | null;
  readonly bufferTimeAfter: number;
  readonly bufferTimeBefore: number;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly bufferTimeBefore: number;
    readonly bufferTimeAfter: number;
    readonly reservationStartInterval: ReservationStartInterval;
    readonly unit: { readonly id: string; readonly pk: number | null } | null;
  }>;
  readonly recurringReservation: {
    readonly pk: number | null;
    readonly id: string;
    readonly weekdays: ReadonlyArray<number>;
    readonly beginDate: string | null;
    readonly endDate: string | null;
  } | null;
};

export type VisibleIfPermissionFieldsFragment = {
  readonly id: string;
  readonly user: { readonly id: string; readonly pk: number | null } | null;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly unit: { readonly id: string; readonly pk: number | null } | null;
  }>;
};

export type UpdateReservationWorkingMemoMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
  workingMemo: Scalars["String"]["input"];
}>;

export type UpdateReservationWorkingMemoMutation = {
  readonly updateReservationWorkingMemo: {
    readonly pk: number | null;
    readonly workingMemo: string | null;
  } | null;
};

export type UpdateApplicationWorkingMemoMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
  workingMemo: Scalars["String"]["input"];
}>;

export type UpdateApplicationWorkingMemoMutation = {
  readonly updateApplicationWorkingMemo: {
    readonly pk: number | null;
    readonly workingMemo: string | null;
  } | null;
};

export type CombineAffectedReservationsFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly affectedReservationUnits: ReadonlyArray<number | null> | null;
};

export type ApplicantNameFieldsFragment = {
  readonly id: string;
  readonly applicantType: ApplicantTypeChoice | null;
  readonly contactPerson: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
  } | null;
  readonly organisation: {
    readonly id: string;
    readonly nameFi: string | null;
  } | null;
};

export type ReservationsByReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  state?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>
  >;
}>;

export type ReservationsByReservationUnitQuery = {
  readonly reservationUnit: {
    readonly id: string;
    readonly reservations: ReadonlyArray<{
      readonly id: string;
      readonly name: string | null;
      readonly reserveeName: string | null;
      readonly pk: number | null;
      readonly begin: string;
      readonly end: string;
      readonly state: ReservationStateChoice | null;
      readonly type: ReservationTypeChoice | null;
      readonly bufferTimeBefore: number;
      readonly bufferTimeAfter: number;
      readonly affectedReservationUnits: ReadonlyArray<number | null> | null;
      readonly accessType: AccessType | null;
      readonly user: { readonly id: string; readonly email: string } | null;
      readonly recurringReservation: {
        readonly id: string;
        readonly pk: number | null;
      } | null;
    }> | null;
  } | null;
  readonly affectingReservations: ReadonlyArray<{
    readonly id: string;
    readonly name: string | null;
    readonly reserveeName: string | null;
    readonly pk: number | null;
    readonly begin: string;
    readonly end: string;
    readonly state: ReservationStateChoice | null;
    readonly type: ReservationTypeChoice | null;
    readonly bufferTimeBefore: number;
    readonly bufferTimeAfter: number;
    readonly affectedReservationUnits: ReadonlyArray<number | null> | null;
    readonly accessType: AccessType | null;
    readonly user: { readonly id: string; readonly email: string } | null;
    readonly recurringReservation: {
      readonly id: string;
      readonly pk: number | null;
    } | null;
  }> | null;
};

export type CalendarReservationFragment = {
  readonly id: string;
  readonly name: string | null;
  readonly reserveeName: string | null;
  readonly pk: number | null;
  readonly begin: string;
  readonly end: string;
  readonly state: ReservationStateChoice | null;
  readonly type: ReservationTypeChoice | null;
  readonly bufferTimeBefore: number;
  readonly bufferTimeAfter: number;
  readonly affectedReservationUnits: ReadonlyArray<number | null> | null;
  readonly accessType: AccessType | null;
  readonly user: { readonly id: string; readonly email: string } | null;
  readonly recurringReservation: {
    readonly id: string;
    readonly pk: number | null;
  } | null;
};

export type CheckPermissionsQueryVariables = Exact<{
  permission: UserPermissionChoice;
  units?: InputMaybe<
    ReadonlyArray<Scalars["Int"]["input"]> | Scalars["Int"]["input"]
  >;
  requireAll?: InputMaybe<Scalars["Boolean"]["input"]>;
}>;

export type CheckPermissionsQuery = {
  readonly checkPermissions: { readonly hasPermission: boolean } | null;
};

export type ReservationDenyReasonsQueryVariables = Exact<{
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationDenyReasonOrderingChoices>>
    | InputMaybe<ReservationDenyReasonOrderingChoices>
  >;
}>;

export type ReservationDenyReasonsQuery = {
  readonly reservationDenyReasons: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: number | null;
        readonly reasonFi: string | null;
      } | null;
    } | null>;
  } | null;
};

export type HandlingDataQueryVariables = Exact<{
  beginDate: Scalars["Date"]["input"];
  state:
    | ReadonlyArray<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>;
}>;

export type HandlingDataQuery = {
  readonly reservations: {
    readonly edges: ReadonlyArray<{
      readonly node: { readonly id: string; readonly pk: number | null } | null;
    } | null>;
  } | null;
  readonly unitsAll: ReadonlyArray<{ readonly id: string }> | null;
};

export type OptionsQueryVariables = Exact<{
  reservationPurposesOrderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationPurposeOrderingChoices>>
    | InputMaybe<ReservationPurposeOrderingChoices>
  >;
}>;

export type OptionsQuery = {
  readonly reservationPurposes: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
      } | null;
    } | null>;
  } | null;
  readonly ageGroups: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: number | null;
        readonly minimum: number;
        readonly maximum: number | null;
      } | null;
    } | null>;
  } | null;
  readonly cities: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly nameFi: string | null;
        readonly pk: number | null;
      } | null;
    } | null>;
  } | null;
};

export type RecurringReservationQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type RecurringReservationQuery = {
  readonly recurringReservation: {
    readonly id: string;
    readonly pk: number | null;
    readonly weekdays: ReadonlyArray<number>;
    readonly beginDate: string | null;
    readonly endDate: string | null;
    readonly reservations: ReadonlyArray<{
      readonly id: string;
      readonly handlingDetails: string | null;
      readonly state: ReservationStateChoice | null;
      readonly pk: number | null;
      readonly begin: string;
      readonly end: string;
      readonly type: ReservationTypeChoice | null;
      readonly bufferTimeAfter: number;
      readonly bufferTimeBefore: number;
      readonly paymentOrder: ReadonlyArray<{
        readonly id: string;
        readonly status: OrderStatus;
      }>;
      readonly reservationUnits: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
        readonly bufferTimeBefore: number;
        readonly bufferTimeAfter: number;
        readonly reservationStartInterval: ReservationStartInterval;
        readonly unit: {
          readonly id: string;
          readonly pk: number | null;
        } | null;
      }>;
      readonly recurringReservation: {
        readonly pk: number | null;
        readonly id: string;
        readonly weekdays: ReadonlyArray<number>;
        readonly beginDate: string | null;
        readonly endDate: string | null;
      } | null;
    }>;
    readonly rejectedOccurrences: ReadonlyArray<{
      readonly id: string;
      readonly beginDatetime: string;
      readonly endDatetime: string;
      readonly rejectionReason: RejectionReadinessChoice;
    }>;
  } | null;
};

export type ReservationUnitsFilterParamsQueryVariables = Exact<{
  unit?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationUnitOrderingChoices>>
    | InputMaybe<ReservationUnitOrderingChoices>
  >;
}>;

export type ReservationUnitsFilterParamsQuery = {
  readonly reservationUnitsAll: ReadonlyArray<{
    readonly id: string;
    readonly nameFi: string | null;
    readonly pk: number | null;
  }> | null;
};

export type ReservationUnitTypesFilterQueryVariables = Exact<{
  after?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationUnitTypeOrderingChoices>>
    | InputMaybe<ReservationUnitTypeOrderingChoices>
  >;
}>;

export type ReservationUnitTypesFilterQuery = {
  readonly reservationUnitTypes: {
    readonly totalCount: number | null;
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
      } | null;
    } | null>;
  } | null;
};

export type UnitsFilterQueryVariables = Exact<{
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<UnitOrderingChoices>>
    | InputMaybe<UnitOrderingChoices>
  >;
}>;

export type UnitsFilterQuery = {
  readonly unitsAll: ReadonlyArray<{
    readonly id: string;
    readonly nameFi: string | null;
    readonly pk: number | null;
  }> | null;
};

export type CurrentUserQueryVariables = Exact<{ [key: string]: never }>;

export type CurrentUserQuery = {
  readonly currentUser: {
    readonly id: string;
    readonly username: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly isSuperuser: boolean;
    readonly pk: number | null;
    readonly unitRoles: ReadonlyArray<{
      readonly id: string;
      readonly permissions: ReadonlyArray<UserPermissionChoice>;
      readonly role: UserRoleChoice;
      readonly units: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
      }>;
      readonly unitGroups: ReadonlyArray<{
        readonly id: string;
        readonly units: ReadonlyArray<{
          readonly id: string;
          readonly pk: number | null;
        }>;
      }>;
    }>;
    readonly generalRoles: ReadonlyArray<{
      readonly id: string;
      readonly permissions: ReadonlyArray<UserPermissionChoice>;
      readonly role: UserRoleChoice;
    }>;
  } | null;
};

export type ReservationUnitEditUnitFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly nameFi: string | null;
  readonly spaces: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly maxPersons: number | null;
    readonly surfaceArea: number | null;
    readonly resources: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly locationType: ResourceLocationType;
    }>;
  }>;
  readonly location: {
    readonly id: string;
    readonly addressStreetFi: string | null;
    readonly addressZip: string;
    readonly addressCityFi: string | null;
  } | null;
};

export type ReservationUnitEditQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationUnitEditQuery = {
  readonly reservationUnit: {
    readonly id: string;
    readonly pk: number | null;
    readonly publishingState: ReservationUnitPublishingState;
    readonly reservationState: ReservationUnitReservationState;
    readonly haukiUrl: string | null;
    readonly requireReservationHandling: boolean;
    readonly nameFi: string | null;
    readonly nameSv: string | null;
    readonly nameEn: string | null;
    readonly isDraft: boolean;
    readonly authentication: Authentication;
    readonly uuid: string;
    readonly requireAdultReservee: boolean;
    readonly termsOfUseFi: string | null;
    readonly termsOfUseSv: string | null;
    readonly termsOfUseEn: string | null;
    readonly reservationKind: ReservationKind;
    readonly reservationPendingInstructionsFi: string | null;
    readonly reservationPendingInstructionsSv: string | null;
    readonly reservationPendingInstructionsEn: string | null;
    readonly reservationConfirmedInstructionsFi: string | null;
    readonly reservationConfirmedInstructionsSv: string | null;
    readonly reservationConfirmedInstructionsEn: string | null;
    readonly reservationCancelledInstructionsFi: string | null;
    readonly reservationCancelledInstructionsSv: string | null;
    readonly reservationCancelledInstructionsEn: string | null;
    readonly maxReservationDuration: number | null;
    readonly minReservationDuration: number | null;
    readonly reservationStartInterval: ReservationStartInterval;
    readonly canApplyFreeOfCharge: boolean;
    readonly reservationsMinDaysBefore: number | null;
    readonly reservationsMaxDaysBefore: number | null;
    readonly minPersons: number | null;
    readonly maxPersons: number | null;
    readonly surfaceArea: number | null;
    readonly descriptionFi: string | null;
    readonly descriptionSv: string | null;
    readonly descriptionEn: string | null;
    readonly reservationBlockWholeDay: boolean;
    readonly bufferTimeBefore: number;
    readonly bufferTimeAfter: number;
    readonly reservationBegins: string | null;
    readonly contactInformation: string;
    readonly reservationEnds: string | null;
    readonly publishBegins: string | null;
    readonly publishEnds: string | null;
    readonly maxReservationsPerUser: number | null;
    readonly images: ReadonlyArray<{
      readonly pk: number | null;
      readonly id: string;
      readonly imageUrl: string | null;
      readonly largeUrl: string | null;
      readonly mediumUrl: string | null;
      readonly smallUrl: string | null;
      readonly imageType: ImageType;
    }>;
    readonly cancellationRule: {
      readonly id: string;
      readonly pk: number | null;
    } | null;
    readonly spaces: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
    }>;
    readonly resources: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
    }>;
    readonly purposes: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
    }>;
    readonly paymentTypes: ReadonlyArray<{
      readonly id: string;
      readonly code: string;
    }>;
    readonly pricingTerms: {
      readonly id: string;
      readonly pk: string | null;
    } | null;
    readonly reservationUnitType: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
    } | null;
    readonly equipments: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
    }>;
    readonly qualifiers: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
    }>;
    readonly unit: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly spaces: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
        readonly maxPersons: number | null;
        readonly surfaceArea: number | null;
        readonly resources: ReadonlyArray<{
          readonly id: string;
          readonly pk: number | null;
          readonly nameFi: string | null;
          readonly locationType: ResourceLocationType;
        }>;
      }>;
      readonly location: {
        readonly id: string;
        readonly addressStreetFi: string | null;
        readonly addressZip: string;
        readonly addressCityFi: string | null;
      } | null;
    } | null;
    readonly paymentTerms: {
      readonly id: string;
      readonly pk: string | null;
    } | null;
    readonly cancellationTerms: {
      readonly id: string;
      readonly pk: string | null;
    } | null;
    readonly serviceSpecificTerms: {
      readonly id: string;
      readonly pk: string | null;
    } | null;
    readonly metadataSet: {
      readonly id: string;
      readonly pk: number | null;
    } | null;
    readonly pricings: ReadonlyArray<{
      readonly pk: number | null;
      readonly lowestPriceNet: string;
      readonly highestPriceNet: string;
      readonly id: string;
      readonly begins: string;
      readonly priceUnit: PriceUnit;
      readonly lowestPrice: string;
      readonly highestPrice: string;
      readonly taxPercentage: {
        readonly id: string;
        readonly pk: number | null;
        readonly value: string;
      };
    }>;
    readonly applicationRoundTimeSlots: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly weekday: number;
      readonly closed: boolean;
      readonly reservableTimes: ReadonlyArray<{
        readonly begin: string;
        readonly end: string;
      } | null>;
    }>;
    readonly accessTypes: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly accessType: AccessType;
      readonly beginDate: string;
    }>;
  } | null;
};

export type UpdateReservationUnitMutationVariables = Exact<{
  input: ReservationUnitUpdateMutationInput;
}>;

export type UpdateReservationUnitMutation = {
  readonly updateReservationUnit: { readonly pk: number | null } | null;
};

export type CreateReservationUnitMutationVariables = Exact<{
  input: ReservationUnitCreateMutationInput;
}>;

export type CreateReservationUnitMutation = {
  readonly createReservationUnit: { readonly pk: number | null } | null;
};

export type CreateImageMutationVariables = Exact<{
  image: Scalars["Upload"]["input"];
  reservationUnit: Scalars["Int"]["input"];
  imageType: ImageType;
}>;

export type CreateImageMutation = {
  readonly createReservationUnitImage: { readonly pk: number | null } | null;
};

export type DeleteImageMutationVariables = Exact<{
  pk: Scalars["ID"]["input"];
}>;

export type DeleteImageMutation = {
  readonly deleteReservationUnitImage: {
    readonly deleted: boolean | null;
  } | null;
};

export type UpdateImageMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
  imageType: ImageType;
}>;

export type UpdateImageMutation = {
  readonly updateReservationUnitImage: { readonly pk: number | null } | null;
};

export type ReservationUnitEditorParametersQueryVariables = Exact<{
  equipmentsOrderBy?: InputMaybe<EquipmentOrderingChoices>;
}>;

export type ReservationUnitEditorParametersQuery = {
  readonly equipmentsAll: ReadonlyArray<{
    readonly id: string;
    readonly nameFi: string | null;
    readonly pk: number | null;
  }> | null;
  readonly taxPercentages: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: number | null;
        readonly value: string;
      } | null;
    } | null>;
  } | null;
  readonly purposes: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
      } | null;
    } | null>;
  } | null;
  readonly reservationUnitTypes: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly nameFi: string | null;
        readonly pk: number | null;
      } | null;
    } | null>;
  } | null;
  readonly termsOfUse: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: string | null;
        readonly nameFi: string | null;
        readonly termsType: TermsType;
      } | null;
    } | null>;
  } | null;
  readonly reservationUnitCancellationRules: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly nameFi: string | null;
        readonly pk: number | null;
      } | null;
    } | null>;
  } | null;
  readonly metadataSets: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly name: string;
        readonly pk: number | null;
      } | null;
    } | null>;
  } | null;
  readonly qualifiers: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly nameFi: string | null;
        readonly pk: number | null;
      } | null;
    } | null>;
  } | null;
};

export type ApplicationRoundCardFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly nameFi: string | null;
  readonly status: ApplicationRoundStatusChoice;
  readonly applicationPeriodBegin: string;
  readonly applicationPeriodEnd: string;
  readonly reservationPeriodBegin: string;
  readonly reservationPeriodEnd: string;
  readonly reservationUnitCount: number;
  readonly applicationsCount: number;
};

export type RejectRestMutationVariables = Exact<{
  input: ReservationUnitOptionUpdateMutationInput;
}>;

export type RejectRestMutation = {
  readonly updateReservationUnitOption: {
    readonly pk: number | null;
    readonly rejected: boolean | null;
    readonly locked: boolean | null;
  } | null;
};

export type CreateAllocatedTimeSlotMutationVariables = Exact<{
  input: AllocatedTimeSlotCreateMutationInput;
}>;

export type CreateAllocatedTimeSlotMutation = {
  readonly createAllocatedTimeslot: {
    readonly beginTime: string | null;
    readonly dayOfTheWeek: Weekday | null;
    readonly endTime: string | null;
    readonly pk: number | null;
    readonly reservationUnitOption: number | null;
  } | null;
};

export type DeleteAllocatedTimeSlotMutationVariables = Exact<{
  input: AllocatedTimeSlotDeleteMutationInput;
}>;

export type DeleteAllocatedTimeSlotMutation = {
  readonly deleteAllocatedTimeslot: { readonly deleted: boolean | null } | null;
};

export type ApplicationSectionAllocationsQueryVariables = Exact<{
  applicationRound: Scalars["Int"]["input"];
  applicationStatus:
    | ReadonlyArray<InputMaybe<ApplicationStatusChoice>>
    | InputMaybe<ApplicationStatusChoice>;
  status?: InputMaybe<
    | ReadonlyArray<InputMaybe<ApplicationSectionStatusChoice>>
    | InputMaybe<ApplicationSectionStatusChoice>
  >;
  applicantType?: InputMaybe<
    | ReadonlyArray<InputMaybe<ApplicantTypeChoice>>
    | InputMaybe<ApplicantTypeChoice>
  >;
  preferredOrder?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<
    ReadonlyArray<InputMaybe<Priority>> | InputMaybe<Priority>
  >;
  purpose?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnit: Scalars["Int"]["input"];
  beginDate: Scalars["Date"]["input"];
  endDate: Scalars["Date"]["input"];
  ageGroup?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  homeCity?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  includePreferredOrder10OrHigher?: InputMaybe<Scalars["Boolean"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type ApplicationSectionAllocationsQuery = {
  readonly applicationSections: {
    readonly totalCount: number | null;
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly allocations: number;
        readonly id: string;
        readonly pk: number | null;
        readonly name: string;
        readonly status: ApplicationSectionStatusChoice;
        readonly reservationMaxDuration: number;
        readonly numPersons: number;
        readonly reservationsEndDate: string;
        readonly reservationsBeginDate: string;
        readonly appliedReservationsPerWeek: number;
        readonly reservationMinDuration: number;
        readonly suitableTimeRanges: ReadonlyArray<{
          readonly id: string;
          readonly beginTime: string;
          readonly endTime: string;
          readonly dayOfTheWeek: Weekday;
          readonly priority: Priority;
          readonly fulfilled: boolean;
        }>;
        readonly reservationUnitOptions: ReadonlyArray<{
          readonly id: string;
          readonly pk: number | null;
          readonly locked: boolean;
          readonly rejected: boolean;
          readonly preferredOrder: number;
          readonly allocatedTimeSlots: ReadonlyArray<{
            readonly pk: number | null;
            readonly id: string;
            readonly beginTime: string;
            readonly endTime: string;
            readonly dayOfTheWeek: Weekday;
            readonly reservationUnitOption: {
              readonly id: string;
              readonly pk: number | null;
              readonly applicationSection: {
                readonly id: string;
                readonly pk: number | null;
              };
            };
          }>;
          readonly reservationUnit: {
            readonly id: string;
            readonly pk: number | null;
            readonly nameFi: string | null;
            readonly unit: {
              readonly id: string;
              readonly pk: number | null;
              readonly nameFi: string | null;
            } | null;
          };
        }>;
        readonly purpose: {
          readonly id: string;
          readonly pk: number | null;
          readonly nameFi: string | null;
        } | null;
        readonly application: {
          readonly id: string;
          readonly pk: number | null;
          readonly status: ApplicationStatusChoice;
          readonly applicantType: ApplicantTypeChoice | null;
          readonly organisation: {
            readonly id: string;
            readonly nameFi: string | null;
            readonly organisationType: OrganizationTypeChoice;
          } | null;
          readonly contactPerson: {
            readonly id: string;
            readonly lastName: string;
            readonly firstName: string;
          } | null;
        };
        readonly ageGroup: {
          readonly id: string;
          readonly pk: number | null;
          readonly minimum: number;
          readonly maximum: number | null;
        } | null;
      } | null;
    } | null>;
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean;
    };
  } | null;
  readonly affectingAllocatedTimeSlots: ReadonlyArray<{
    readonly id: string;
    readonly beginTime: string;
    readonly endTime: string;
    readonly dayOfTheWeek: Weekday;
  }> | null;
};

export type AllApplicationEventsQueryVariables = Exact<{
  applicationRound: Scalars["Int"]["input"];
  applicationStatus:
    | ReadonlyArray<InputMaybe<ApplicationStatusChoice>>
    | InputMaybe<ApplicationStatusChoice>;
  unit:
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit:
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>;
}>;

export type AllApplicationEventsQuery = {
  readonly applicationSections: {
    readonly totalCount: number | null;
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly reservationUnitOptions: ReadonlyArray<{
          readonly id: string;
          readonly reservationUnit: {
            readonly id: string;
            readonly pk: number | null;
            readonly nameFi: string | null;
          };
        }>;
      } | null;
    } | null>;
  } | null;
};

export type ApplicationRoundFilterQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRoundFilterQuery = {
  readonly applicationRound: {
    readonly id: string;
    readonly nameFi: string | null;
    readonly status: ApplicationRoundStatusChoice;
    readonly reservationPeriodBegin: string;
    readonly reservationPeriodEnd: string;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly unit: {
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
      } | null;
    }>;
  } | null;
};

export type ApplicationRoundCriteriaQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRoundCriteriaQuery = {
  readonly applicationRound: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly reservationUnitCount: number;
    readonly applicationPeriodBegin: string;
    readonly applicationPeriodEnd: string;
    readonly reservationPeriodBegin: string;
    readonly reservationPeriodEnd: string;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly spaces: ReadonlyArray<{
        readonly id: string;
        readonly nameFi: string | null;
      }>;
      readonly unit: {
        readonly id: string;
        readonly nameFi: string | null;
      } | null;
    }>;
  } | null;
};

export type ApplicationRoundQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRoundQuery = {
  readonly applicationRound: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly status: ApplicationRoundStatusChoice;
    readonly applicationPeriodBegin: string;
    readonly applicationPeriodEnd: string;
    readonly applicationsCount: number;
    readonly isSettingHandledAllowed: boolean;
    readonly reservationCreationStatus: ApplicationRoundReservationCreationStatusChoice;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly unit: {
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
      } | null;
    }>;
  } | null;
};

export type AllocatedTimeSlotsQueryVariables = Exact<{
  applicationRound: Scalars["Int"]["input"];
  allocatedUnit?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  applicantType?: InputMaybe<
    | ReadonlyArray<InputMaybe<ApplicantTypeChoice>>
    | InputMaybe<ApplicantTypeChoice>
  >;
  applicationSectionStatus?: InputMaybe<
    | ReadonlyArray<InputMaybe<ApplicationSectionStatusChoice>>
    | InputMaybe<ApplicationSectionStatusChoice>
  >;
  allocatedReservationUnit?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  dayOfTheWeek?: InputMaybe<
    ReadonlyArray<InputMaybe<Weekday>> | InputMaybe<Weekday>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  accessCodeState?: InputMaybe<
    ReadonlyArray<InputMaybe<AccessCodeState>> | InputMaybe<AccessCodeState>
  >;
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<AllocatedTimeSlotOrderingChoices>>
    | InputMaybe<AllocatedTimeSlotOrderingChoices>
  >;
  after?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type AllocatedTimeSlotsQuery = {
  readonly allocatedTimeSlots: {
    readonly totalCount: number | null;
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: number | null;
        readonly dayOfTheWeek: Weekday;
        readonly endTime: string;
        readonly beginTime: string;
        readonly recurringReservation: {
          readonly id: string;
          readonly pk: number | null;
          readonly shouldHaveActiveAccessCode: boolean;
          readonly isAccessCodeIsActiveCorrect: boolean;
          readonly reservations: ReadonlyArray<{
            readonly id: string;
            readonly pk: number | null;
          }>;
        } | null;
        readonly reservationUnitOption: {
          readonly id: string;
          readonly rejected: boolean;
          readonly locked: boolean;
          readonly preferredOrder: number;
          readonly applicationSection: {
            readonly id: string;
            readonly pk: number | null;
            readonly name: string;
            readonly reservationsEndDate: string;
            readonly reservationsBeginDate: string;
            readonly reservationMinDuration: number;
            readonly reservationMaxDuration: number;
            readonly application: {
              readonly pk: number | null;
              readonly id: string;
              readonly applicantType: ApplicantTypeChoice | null;
              readonly organisation: {
                readonly id: string;
                readonly nameFi: string | null;
                readonly organisationType: OrganizationTypeChoice;
              } | null;
              readonly contactPerson: {
                readonly id: string;
                readonly lastName: string;
                readonly firstName: string;
              } | null;
            };
          };
          readonly reservationUnit: {
            readonly id: string;
            readonly nameFi: string | null;
            readonly unit: {
              readonly id: string;
              readonly nameFi: string | null;
            } | null;
          };
        };
      } | null;
    } | null>;
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean;
    };
  } | null;
};

export type AllocatedSectionsTableElementFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly dayOfTheWeek: Weekday;
  readonly endTime: string;
  readonly beginTime: string;
  readonly recurringReservation: {
    readonly id: string;
    readonly pk: number | null;
    readonly shouldHaveActiveAccessCode: boolean;
    readonly isAccessCodeIsActiveCorrect: boolean;
    readonly reservations: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
    }>;
  } | null;
  readonly reservationUnitOption: {
    readonly id: string;
    readonly rejected: boolean;
    readonly locked: boolean;
    readonly preferredOrder: number;
    readonly applicationSection: {
      readonly id: string;
      readonly pk: number | null;
      readonly name: string;
      readonly reservationsEndDate: string;
      readonly reservationsBeginDate: string;
      readonly reservationMinDuration: number;
      readonly reservationMaxDuration: number;
      readonly application: {
        readonly pk: number | null;
        readonly id: string;
        readonly applicantType: ApplicantTypeChoice | null;
        readonly organisation: {
          readonly id: string;
          readonly nameFi: string | null;
          readonly organisationType: OrganizationTypeChoice;
        } | null;
        readonly contactPerson: {
          readonly id: string;
          readonly lastName: string;
          readonly firstName: string;
        } | null;
      };
    };
    readonly reservationUnit: {
      readonly id: string;
      readonly nameFi: string | null;
      readonly unit: {
        readonly id: string;
        readonly nameFi: string | null;
      } | null;
    };
  };
};

export type ApplicationsQueryVariables = Exact<{
  applicationRound: Scalars["Int"]["input"];
  unit?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  applicantType?: InputMaybe<
    | ReadonlyArray<InputMaybe<ApplicantTypeChoice>>
    | InputMaybe<ApplicantTypeChoice>
  >;
  status:
    | ReadonlyArray<InputMaybe<ApplicationStatusChoice>>
    | InputMaybe<ApplicationStatusChoice>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<ApplicationOrderingChoices>>
    | InputMaybe<ApplicationOrderingChoices>
  >;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type ApplicationsQuery = {
  readonly applications: {
    readonly totalCount: number | null;
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: number | null;
        readonly status: ApplicationStatusChoice;
        readonly applicantType: ApplicantTypeChoice | null;
        readonly applicationSections: ReadonlyArray<{
          readonly id: string;
          readonly pk: number | null;
          readonly name: string;
          readonly reservationsEndDate: string;
          readonly reservationsBeginDate: string;
          readonly appliedReservationsPerWeek: number;
          readonly reservationMinDuration: number;
          readonly reservationUnitOptions: ReadonlyArray<{
            readonly id: string;
            readonly preferredOrder: number;
            readonly reservationUnit: {
              readonly id: string;
              readonly unit: {
                readonly id: string;
                readonly pk: number | null;
                readonly nameFi: string | null;
              } | null;
            };
          }>;
        }> | null;
        readonly organisation: {
          readonly id: string;
          readonly nameFi: string | null;
          readonly organisationType: OrganizationTypeChoice;
        } | null;
        readonly contactPerson: {
          readonly id: string;
          readonly lastName: string;
          readonly firstName: string;
        } | null;
      } | null;
    } | null>;
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean;
    };
  } | null;
};

export type ApplicationSectionsQueryVariables = Exact<{
  applicationRound: Scalars["Int"]["input"];
  applicationStatus:
    | ReadonlyArray<InputMaybe<ApplicationStatusChoice>>
    | InputMaybe<ApplicationStatusChoice>;
  status?: InputMaybe<
    | ReadonlyArray<InputMaybe<ApplicationSectionStatusChoice>>
    | InputMaybe<ApplicationSectionStatusChoice>
  >;
  unit?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  applicantType?: InputMaybe<
    | ReadonlyArray<InputMaybe<ApplicantTypeChoice>>
    | InputMaybe<ApplicantTypeChoice>
  >;
  preferredOrder?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<
    ReadonlyArray<InputMaybe<Priority>> | InputMaybe<Priority>
  >;
  purpose?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnit?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  ageGroup?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  homeCity?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  includePreferredOrder10OrHigher?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<ApplicationSectionOrderingChoices>>
    | InputMaybe<ApplicationSectionOrderingChoices>
  >;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type ApplicationSectionsQuery = {
  readonly applicationSections: {
    readonly totalCount: number | null;
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly allocations: number;
        readonly id: string;
        readonly pk: number | null;
        readonly name: string;
        readonly status: ApplicationSectionStatusChoice;
        readonly reservationMaxDuration: number;
        readonly numPersons: number;
        readonly reservationsEndDate: string;
        readonly reservationsBeginDate: string;
        readonly appliedReservationsPerWeek: number;
        readonly reservationMinDuration: number;
        readonly reservationUnitOptions: ReadonlyArray<{
          readonly id: string;
          readonly pk: number | null;
          readonly preferredOrder: number;
          readonly allocatedTimeSlots: ReadonlyArray<{
            readonly id: string;
            readonly pk: number | null;
            readonly dayOfTheWeek: Weekday;
            readonly beginTime: string;
            readonly endTime: string;
            readonly reservationUnitOption: {
              readonly id: string;
              readonly applicationSection: {
                readonly id: string;
                readonly pk: number | null;
              };
            };
          }>;
          readonly reservationUnit: {
            readonly id: string;
            readonly pk: number | null;
            readonly nameFi: string | null;
            readonly unit: {
              readonly id: string;
              readonly pk: number | null;
              readonly nameFi: string | null;
            } | null;
          };
        }>;
        readonly purpose: {
          readonly id: string;
          readonly pk: number | null;
          readonly nameFi: string | null;
        } | null;
        readonly application: {
          readonly id: string;
          readonly pk: number | null;
          readonly status: ApplicationStatusChoice;
          readonly applicantType: ApplicantTypeChoice | null;
          readonly organisation: {
            readonly id: string;
            readonly nameFi: string | null;
            readonly organisationType: OrganizationTypeChoice;
          } | null;
          readonly contactPerson: {
            readonly id: string;
            readonly lastName: string;
            readonly firstName: string;
          } | null;
        };
        readonly ageGroup: {
          readonly id: string;
          readonly pk: number | null;
          readonly minimum: number;
          readonly maximum: number | null;
        } | null;
      } | null;
    } | null>;
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean;
    };
  } | null;
};

export type ApplicationSectionTableElementFragment = {
  readonly allocations: number;
  readonly id: string;
  readonly pk: number | null;
  readonly name: string;
  readonly status: ApplicationSectionStatusChoice;
  readonly reservationMaxDuration: number;
  readonly numPersons: number;
  readonly reservationsEndDate: string;
  readonly reservationsBeginDate: string;
  readonly appliedReservationsPerWeek: number;
  readonly reservationMinDuration: number;
  readonly reservationUnitOptions: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly preferredOrder: number;
    readonly allocatedTimeSlots: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly dayOfTheWeek: Weekday;
      readonly beginTime: string;
      readonly endTime: string;
      readonly reservationUnitOption: {
        readonly id: string;
        readonly applicationSection: {
          readonly id: string;
          readonly pk: number | null;
        };
      };
    }>;
    readonly reservationUnit: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly unit: {
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
      } | null;
    };
  }>;
  readonly purpose: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
  } | null;
  readonly application: {
    readonly id: string;
    readonly pk: number | null;
    readonly status: ApplicationStatusChoice;
    readonly applicantType: ApplicantTypeChoice | null;
    readonly organisation: {
      readonly id: string;
      readonly nameFi: string | null;
      readonly organisationType: OrganizationTypeChoice;
    } | null;
    readonly contactPerson: {
      readonly id: string;
      readonly lastName: string;
      readonly firstName: string;
    } | null;
  };
  readonly ageGroup: {
    readonly id: string;
    readonly pk: number | null;
    readonly minimum: number;
    readonly maximum: number | null;
  } | null;
};

export type ApplicationsTableElementFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly status: ApplicationStatusChoice;
  readonly applicantType: ApplicantTypeChoice | null;
  readonly applicationSections: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly name: string;
    readonly reservationsEndDate: string;
    readonly reservationsBeginDate: string;
    readonly appliedReservationsPerWeek: number;
    readonly reservationMinDuration: number;
    readonly reservationUnitOptions: ReadonlyArray<{
      readonly id: string;
      readonly preferredOrder: number;
      readonly reservationUnit: {
        readonly id: string;
        readonly unit: {
          readonly id: string;
          readonly pk: number | null;
          readonly nameFi: string | null;
        } | null;
      };
    }>;
  }> | null;
  readonly organisation: {
    readonly id: string;
    readonly nameFi: string | null;
    readonly organisationType: OrganizationTypeChoice;
  } | null;
  readonly contactPerson: {
    readonly id: string;
    readonly lastName: string;
    readonly firstName: string;
  } | null;
};

export type RejectedOccurrencesQueryVariables = Exact<{
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  unit?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnit?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<RejectedOccurrenceOrderingChoices>>
    | InputMaybe<RejectedOccurrenceOrderingChoices>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type RejectedOccurrencesQuery = {
  readonly rejectedOccurrences: {
    readonly totalCount: number | null;
    readonly pageInfo: {
      readonly hasNextPage: boolean;
      readonly endCursor: string | null;
    };
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: number | null;
        readonly beginDatetime: string;
        readonly endDatetime: string;
        readonly rejectionReason: RejectionReadinessChoice;
        readonly recurringReservation: {
          readonly id: string;
          readonly allocatedTimeSlot: {
            readonly id: string;
            readonly pk: number | null;
            readonly dayOfTheWeek: Weekday;
            readonly beginTime: string;
            readonly endTime: string;
            readonly reservationUnitOption: {
              readonly id: string;
              readonly applicationSection: {
                readonly id: string;
                readonly name: string;
                readonly application: {
                  readonly id: string;
                  readonly pk: number | null;
                  readonly applicantType: ApplicantTypeChoice | null;
                  readonly contactPerson: {
                    readonly id: string;
                    readonly firstName: string;
                    readonly lastName: string;
                  } | null;
                  readonly organisation: {
                    readonly id: string;
                    readonly nameFi: string | null;
                  } | null;
                };
              };
              readonly reservationUnit: {
                readonly id: string;
                readonly nameFi: string | null;
                readonly pk: number | null;
                readonly unit: {
                  readonly id: string;
                  readonly nameFi: string | null;
                } | null;
              };
            };
          } | null;
          readonly reservations: ReadonlyArray<{
            readonly id: string;
            readonly pk: number | null;
          }>;
        };
      } | null;
    } | null>;
  } | null;
};

export type RejectedOccurancesTableElementFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly beginDatetime: string;
  readonly endDatetime: string;
  readonly rejectionReason: RejectionReadinessChoice;
  readonly recurringReservation: {
    readonly id: string;
    readonly allocatedTimeSlot: {
      readonly id: string;
      readonly pk: number | null;
      readonly dayOfTheWeek: Weekday;
      readonly beginTime: string;
      readonly endTime: string;
      readonly reservationUnitOption: {
        readonly id: string;
        readonly applicationSection: {
          readonly id: string;
          readonly name: string;
          readonly application: {
            readonly id: string;
            readonly pk: number | null;
            readonly applicantType: ApplicantTypeChoice | null;
            readonly contactPerson: {
              readonly id: string;
              readonly firstName: string;
              readonly lastName: string;
            } | null;
            readonly organisation: {
              readonly id: string;
              readonly nameFi: string | null;
            } | null;
          };
        };
        readonly reservationUnit: {
          readonly id: string;
          readonly nameFi: string | null;
          readonly pk: number | null;
          readonly unit: {
            readonly id: string;
            readonly nameFi: string | null;
          } | null;
        };
      };
    } | null;
    readonly reservations: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
    }>;
  };
};

export type ApplicationRoundAdminFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly nameFi: string | null;
  readonly status: ApplicationRoundStatusChoice;
  readonly applicationPeriodBegin: string;
  readonly applicationPeriodEnd: string;
  readonly applicationsCount: number;
  readonly isSettingHandledAllowed: boolean;
  readonly reservationCreationStatus: ApplicationRoundReservationCreationStatusChoice;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly unit: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
    } | null;
  }>;
};

export type EndAllocationMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
}>;

export type EndAllocationMutation = {
  readonly setApplicationRoundHandled: { readonly pk: number | null } | null;
};

export type SendResultsMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
}>;

export type SendResultsMutation = {
  readonly setApplicationRoundResultsSent: {
    readonly pk: number | null;
  } | null;
};

export type ApplicationRoundListElementFragment = {
  readonly statusTimestamp: string | null;
  readonly id: string;
  readonly pk: number | null;
  readonly nameFi: string | null;
  readonly status: ApplicationRoundStatusChoice;
  readonly applicationPeriodBegin: string;
  readonly applicationPeriodEnd: string;
  readonly reservationPeriodBegin: string;
  readonly reservationPeriodEnd: string;
  readonly reservationUnitCount: number;
  readonly applicationsCount: number;
};

export type ApplicationRoundListQueryVariables = Exact<{
  [key: string]: never;
}>;

export type ApplicationRoundListQuery = {
  readonly applicationRounds: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly statusTimestamp: string | null;
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
        readonly status: ApplicationRoundStatusChoice;
        readonly applicationPeriodBegin: string;
        readonly applicationPeriodEnd: string;
        readonly reservationPeriodBegin: string;
        readonly reservationPeriodEnd: string;
        readonly reservationUnitCount: number;
        readonly applicationsCount: number;
      } | null;
    } | null>;
  } | null;
};

export type ApplicationPageSectionFragment = {
  readonly allocations: number;
  readonly id: string;
  readonly pk: number | null;
  readonly name: string;
  readonly status: ApplicationSectionStatusChoice;
  readonly reservationMaxDuration: number;
  readonly numPersons: number;
  readonly reservationsEndDate: string;
  readonly reservationsBeginDate: string;
  readonly appliedReservationsPerWeek: number;
  readonly reservationMinDuration: number;
  readonly suitableTimeRanges: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly beginTime: string;
    readonly endTime: string;
    readonly dayOfTheWeek: Weekday;
    readonly priority: Priority;
  }>;
  readonly purpose: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
  } | null;
  readonly reservationUnitOptions: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly preferredOrder: number;
    readonly rejected: boolean;
    readonly allocatedTimeSlots: ReadonlyArray<{
      readonly pk: number | null;
      readonly id: string;
    }>;
    readonly reservationUnit: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly unit: {
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
      } | null;
      readonly applicationRoundTimeSlots: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
        readonly weekday: number;
        readonly closed: boolean;
        readonly reservableTimes: ReadonlyArray<{
          readonly begin: string;
          readonly end: string;
        } | null>;
      }>;
    };
  }>;
  readonly ageGroup: {
    readonly id: string;
    readonly pk: number | null;
    readonly minimum: number;
    readonly maximum: number | null;
  } | null;
};

export type ApplicationPageFieldsFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly status: ApplicationStatusChoice;
  readonly lastModifiedDate: string;
  readonly applicantType: ApplicantTypeChoice | null;
  readonly additionalInformation: string | null;
  readonly applicationRound: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
  };
  readonly applicationSections: ReadonlyArray<{
    readonly allocations: number;
    readonly id: string;
    readonly pk: number | null;
    readonly name: string;
    readonly status: ApplicationSectionStatusChoice;
    readonly reservationMaxDuration: number;
    readonly numPersons: number;
    readonly reservationsEndDate: string;
    readonly reservationsBeginDate: string;
    readonly appliedReservationsPerWeek: number;
    readonly reservationMinDuration: number;
    readonly suitableTimeRanges: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly beginTime: string;
      readonly endTime: string;
      readonly dayOfTheWeek: Weekday;
      readonly priority: Priority;
    }>;
    readonly purpose: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
    } | null;
    readonly reservationUnitOptions: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly preferredOrder: number;
      readonly rejected: boolean;
      readonly allocatedTimeSlots: ReadonlyArray<{
        readonly pk: number | null;
        readonly id: string;
      }>;
      readonly reservationUnit: {
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
        readonly unit: {
          readonly id: string;
          readonly pk: number | null;
          readonly nameFi: string | null;
        } | null;
        readonly applicationRoundTimeSlots: ReadonlyArray<{
          readonly id: string;
          readonly pk: number | null;
          readonly weekday: number;
          readonly closed: boolean;
          readonly reservableTimes: ReadonlyArray<{
            readonly begin: string;
            readonly end: string;
          } | null>;
        }>;
      };
    }>;
    readonly ageGroup: {
      readonly id: string;
      readonly pk: number | null;
      readonly minimum: number;
      readonly maximum: number | null;
    } | null;
  }> | null;
  readonly contactPerson: {
    readonly id: string;
    readonly pk: number | null;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string | null;
    readonly phoneNumber: string | null;
  } | null;
  readonly organisation: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly identifier: string | null;
    readonly organisationType: OrganizationTypeChoice;
    readonly coreBusinessFi: string | null;
    readonly yearEstablished: number | null;
    readonly address: {
      readonly id: string;
      readonly pk: number | null;
      readonly postCode: string;
      readonly streetAddressFi: string | null;
      readonly cityFi: string | null;
    } | null;
  } | null;
  readonly homeCity: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly nameEn: string | null;
    readonly nameSv: string | null;
  } | null;
  readonly billingAddress: {
    readonly id: string;
    readonly pk: number | null;
    readonly postCode: string;
    readonly streetAddressFi: string | null;
    readonly cityFi: string | null;
  } | null;
};

export type ReservationUnitOptionFieldsFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly rejected: boolean;
  readonly allocatedTimeSlots: ReadonlyArray<{
    readonly pk: number | null;
    readonly id: string;
  }>;
  readonly reservationUnit: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly unit: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
    } | null;
    readonly applicationRoundTimeSlots: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly weekday: number;
      readonly closed: boolean;
      readonly reservableTimes: ReadonlyArray<{
        readonly begin: string;
        readonly end: string;
      } | null>;
    }>;
  };
};

export type ApplicationAdminQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationAdminQuery = {
  readonly application: {
    readonly workingMemo: string;
    readonly id: string;
    readonly pk: number | null;
    readonly status: ApplicationStatusChoice;
    readonly lastModifiedDate: string;
    readonly applicantType: ApplicantTypeChoice | null;
    readonly additionalInformation: string | null;
    readonly user: { readonly id: string; readonly email: string } | null;
    readonly applicationRound: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
    };
    readonly applicationSections: ReadonlyArray<{
      readonly allocations: number;
      readonly id: string;
      readonly pk: number | null;
      readonly name: string;
      readonly status: ApplicationSectionStatusChoice;
      readonly reservationMaxDuration: number;
      readonly numPersons: number;
      readonly reservationsEndDate: string;
      readonly reservationsBeginDate: string;
      readonly appliedReservationsPerWeek: number;
      readonly reservationMinDuration: number;
      readonly suitableTimeRanges: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
        readonly beginTime: string;
        readonly endTime: string;
        readonly dayOfTheWeek: Weekday;
        readonly priority: Priority;
      }>;
      readonly purpose: {
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
      } | null;
      readonly reservationUnitOptions: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
        readonly preferredOrder: number;
        readonly rejected: boolean;
        readonly allocatedTimeSlots: ReadonlyArray<{
          readonly pk: number | null;
          readonly id: string;
        }>;
        readonly reservationUnit: {
          readonly id: string;
          readonly pk: number | null;
          readonly nameFi: string | null;
          readonly unit: {
            readonly id: string;
            readonly pk: number | null;
            readonly nameFi: string | null;
          } | null;
          readonly applicationRoundTimeSlots: ReadonlyArray<{
            readonly id: string;
            readonly pk: number | null;
            readonly weekday: number;
            readonly closed: boolean;
            readonly reservableTimes: ReadonlyArray<{
              readonly begin: string;
              readonly end: string;
            } | null>;
          }>;
        };
      }>;
      readonly ageGroup: {
        readonly id: string;
        readonly pk: number | null;
        readonly minimum: number;
        readonly maximum: number | null;
      } | null;
    }> | null;
    readonly contactPerson: {
      readonly id: string;
      readonly pk: number | null;
      readonly firstName: string;
      readonly lastName: string;
      readonly email: string | null;
      readonly phoneNumber: string | null;
    } | null;
    readonly organisation: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly identifier: string | null;
      readonly organisationType: OrganizationTypeChoice;
      readonly coreBusinessFi: string | null;
      readonly yearEstablished: number | null;
      readonly address: {
        readonly id: string;
        readonly pk: number | null;
        readonly postCode: string;
        readonly streetAddressFi: string | null;
        readonly cityFi: string | null;
      } | null;
    } | null;
    readonly homeCity: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly nameEn: string | null;
      readonly nameSv: string | null;
    } | null;
    readonly billingAddress: {
      readonly id: string;
      readonly pk: number | null;
      readonly postCode: string;
      readonly streetAddressFi: string | null;
      readonly cityFi: string | null;
    } | null;
  } | null;
};

export type RejectAllSectionOptionsMutationVariables = Exact<{
  input: RejectAllSectionOptionsMutationInput;
}>;

export type RejectAllSectionOptionsMutation = {
  readonly rejectAllSectionOptions: { readonly pk: number | null } | null;
};

export type RestoreAllSectionOptionsMutationVariables = Exact<{
  input: RestoreAllSectionOptionsMutationInput;
}>;

export type RestoreAllSectionOptionsMutation = {
  readonly restoreAllSectionOptions: { readonly pk: number | null } | null;
};

export type RejectAllApplicationOptionsMutationVariables = Exact<{
  input: RejectAllApplicationOptionsMutationInput;
}>;

export type RejectAllApplicationOptionsMutation = {
  readonly rejectAllApplicationOptions: { readonly pk: number | null } | null;
};

export type RestoreAllApplicationOptionsMutationVariables = Exact<{
  input: RestoreAllApplicationOptionsMutationInput;
}>;

export type RestoreAllApplicationOptionsMutation = {
  readonly restoreAllApplicationOptions: { readonly pk: number | null } | null;
};

export type ReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationUnitQuery = {
  readonly reservationUnit: {
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly reservationStartInterval: ReservationStartInterval;
    readonly authentication: Authentication;
    readonly bufferTimeBefore: number;
    readonly bufferTimeAfter: number;
    readonly id: string;
    readonly minPersons: number | null;
    readonly maxPersons: number | null;
    readonly serviceSpecificTerms: {
      readonly id: string;
      readonly textFi: string | null;
      readonly nameFi: string | null;
    } | null;
    readonly paymentTerms: {
      readonly id: string;
      readonly textFi: string | null;
      readonly nameFi: string | null;
    } | null;
    readonly pricingTerms: {
      readonly id: string;
      readonly textFi: string | null;
      readonly nameFi: string | null;
    } | null;
    readonly cancellationTerms: {
      readonly id: string;
      readonly textFi: string | null;
      readonly nameFi: string | null;
    } | null;
    readonly metadataSet: {
      readonly id: string;
      readonly requiredFields: ReadonlyArray<{
        readonly id: string;
        readonly fieldName: string;
      }>;
      readonly supportedFields: ReadonlyArray<{
        readonly id: string;
        readonly fieldName: string;
      }>;
    } | null;
  } | null;
};

export type CreateStaffReservationFragment = {
  readonly pk: number | null;
  readonly nameFi: string | null;
  readonly reservationStartInterval: ReservationStartInterval;
  readonly authentication: Authentication;
  readonly bufferTimeBefore: number;
  readonly bufferTimeAfter: number;
  readonly id: string;
  readonly minPersons: number | null;
  readonly maxPersons: number | null;
  readonly serviceSpecificTerms: {
    readonly id: string;
    readonly textFi: string | null;
    readonly nameFi: string | null;
  } | null;
  readonly paymentTerms: {
    readonly id: string;
    readonly textFi: string | null;
    readonly nameFi: string | null;
  } | null;
  readonly pricingTerms: {
    readonly id: string;
    readonly textFi: string | null;
    readonly nameFi: string | null;
  } | null;
  readonly cancellationTerms: {
    readonly id: string;
    readonly textFi: string | null;
    readonly nameFi: string | null;
  } | null;
  readonly metadataSet: {
    readonly id: string;
    readonly requiredFields: ReadonlyArray<{
      readonly id: string;
      readonly fieldName: string;
    }>;
    readonly supportedFields: ReadonlyArray<{
      readonly id: string;
      readonly fieldName: string;
    }>;
  } | null;
};

export type CreateStaffReservationMutationVariables = Exact<{
  input: ReservationStaffCreateMutationInput;
}>;

export type CreateStaffReservationMutation = {
  readonly createStaffReservation: { readonly pk: number | null } | null;
};

export type ReservationUnitCalendarQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  state?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>
  >;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
}>;

export type ReservationUnitCalendarQuery = {
  readonly reservationUnit: {
    readonly id: string;
    readonly pk: number | null;
    readonly reservations: ReadonlyArray<{
      readonly name: string | null;
      readonly numPersons: number | null;
      readonly calendarUrl: string | null;
      readonly affectedReservationUnits: ReadonlyArray<number | null> | null;
      readonly id: string;
      readonly pk: number | null;
      readonly begin: string;
      readonly end: string;
      readonly createdAt: string | null;
      readonly state: ReservationStateChoice | null;
      readonly type: ReservationTypeChoice | null;
      readonly isBlocked: boolean;
      readonly workingMemo: string | null;
      readonly reserveeName: string | null;
      readonly bufferTimeBefore: number;
      readonly bufferTimeAfter: number;
      readonly reservationUnits: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
        readonly bufferTimeBefore: number;
        readonly bufferTimeAfter: number;
        readonly unit: {
          readonly id: string;
          readonly pk: number | null;
        } | null;
      }>;
      readonly paymentOrder: ReadonlyArray<{
        readonly id: string;
        readonly status: OrderStatus;
      }>;
      readonly user: {
        readonly id: string;
        readonly email: string;
        readonly firstName: string;
        readonly lastName: string;
        readonly pk: number | null;
      } | null;
    }> | null;
  } | null;
  readonly affectingReservations: ReadonlyArray<{
    readonly name: string | null;
    readonly numPersons: number | null;
    readonly calendarUrl: string | null;
    readonly affectedReservationUnits: ReadonlyArray<number | null> | null;
    readonly id: string;
    readonly pk: number | null;
    readonly begin: string;
    readonly end: string;
    readonly createdAt: string | null;
    readonly state: ReservationStateChoice | null;
    readonly type: ReservationTypeChoice | null;
    readonly isBlocked: boolean;
    readonly workingMemo: string | null;
    readonly reserveeName: string | null;
    readonly bufferTimeBefore: number;
    readonly bufferTimeAfter: number;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly bufferTimeBefore: number;
      readonly bufferTimeAfter: number;
      readonly unit: { readonly id: string; readonly pk: number | null } | null;
    }>;
    readonly paymentOrder: ReadonlyArray<{
      readonly id: string;
      readonly status: OrderStatus;
    }>;
    readonly user: {
      readonly id: string;
      readonly email: string;
      readonly firstName: string;
      readonly lastName: string;
      readonly pk: number | null;
    } | null;
  }> | null;
};

export type ReservationUnitsByUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  state?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>
  >;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
}>;

export type ReservationUnitsByUnitQuery = {
  readonly unit: {
    readonly id: string;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly bufferTimeBefore: number;
      readonly bufferTimeAfter: number;
      readonly isDraft: boolean;
      readonly authentication: Authentication;
      readonly spaces: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
      }>;
      readonly reservationUnitType: {
        readonly id: string;
        readonly pk: number | null;
      } | null;
    }>;
  } | null;
  readonly affectingReservations: ReadonlyArray<{
    readonly name: string | null;
    readonly numPersons: number | null;
    readonly calendarUrl: string | null;
    readonly affectedReservationUnits: ReadonlyArray<number | null> | null;
    readonly id: string;
    readonly pk: number | null;
    readonly begin: string;
    readonly end: string;
    readonly createdAt: string | null;
    readonly state: ReservationStateChoice | null;
    readonly type: ReservationTypeChoice | null;
    readonly isBlocked: boolean;
    readonly workingMemo: string | null;
    readonly reserveeName: string | null;
    readonly bufferTimeBefore: number;
    readonly bufferTimeAfter: number;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly bufferTimeBefore: number;
      readonly bufferTimeAfter: number;
      readonly unit: { readonly id: string; readonly pk: number | null } | null;
    }>;
    readonly paymentOrder: ReadonlyArray<{
      readonly id: string;
      readonly status: OrderStatus;
    }>;
    readonly user: {
      readonly id: string;
      readonly email: string;
      readonly firstName: string;
      readonly lastName: string;
      readonly pk: number | null;
    } | null;
  }> | null;
};

export type UnitViewQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type UnitViewQuery = {
  readonly unit: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly location: {
      readonly id: string;
      readonly addressStreetFi: string | null;
      readonly addressZip: string;
      readonly addressCityFi: string | null;
    } | null;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly spaces: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
      }>;
    }>;
  } | null;
};

export type RecurringReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type RecurringReservationUnitQuery = {
  readonly unit: {
    readonly id: string;
    readonly nameFi: string | null;
    readonly pk: number | null;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly reservationStartInterval: ReservationStartInterval;
      readonly bufferTimeBefore: number;
      readonly bufferTimeAfter: number;
    }>;
  } | null;
};

export type CreateReservationSeriesMutationVariables = Exact<{
  input: ReservationSeriesCreateMutationInput;
}>;

export type CreateReservationSeriesMutation = {
  readonly createReservationSeries: { readonly pk: number | null } | null;
};

export type BannerNotificationTableElementFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly name: string;
  readonly activeFrom: string | null;
  readonly activeUntil: string | null;
  readonly state: BannerNotificationState;
  readonly target: BannerNotificationTarget;
  readonly level: BannerNotificationLevel;
};

export type BannerNotificationListQueryVariables = Exact<{
  first?: InputMaybe<Scalars["Int"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<BannerNotificationOrderingChoices>>
    | InputMaybe<BannerNotificationOrderingChoices>
  >;
}>;

export type BannerNotificationListQuery = {
  readonly bannerNotifications: {
    readonly totalCount: number | null;
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: number | null;
        readonly name: string;
        readonly activeFrom: string | null;
        readonly activeUntil: string | null;
        readonly state: BannerNotificationState;
        readonly target: BannerNotificationTarget;
        readonly level: BannerNotificationLevel;
      } | null;
    } | null>;
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean;
    };
  } | null;
};

export type BannerNotificationCreateMutationVariables = Exact<{
  input: BannerNotificationCreateMutationInput;
}>;

export type BannerNotificationCreateMutation = {
  readonly createBannerNotification: { readonly pk: number | null } | null;
};

export type BannerNotificationUpdateMutationVariables = Exact<{
  input: BannerNotificationUpdateMutationInput;
}>;

export type BannerNotificationUpdateMutation = {
  readonly updateBannerNotification: { readonly pk: number | null } | null;
};

export type BannerNotificationDeleteMutationVariables = Exact<{
  input: BannerNotificationDeleteMutationInput;
}>;

export type BannerNotificationDeleteMutation = {
  readonly deleteBannerNotification: {
    readonly deleted: boolean | null;
  } | null;
};

export type BannerNotificationPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type BannerNotificationPageQuery = {
  readonly bannerNotification: {
    readonly id: string;
    readonly pk: number | null;
    readonly level: BannerNotificationLevel;
    readonly activeFrom: string | null;
    readonly messageEn: string | null;
    readonly messageFi: string | null;
    readonly messageSv: string | null;
    readonly name: string;
    readonly target: BannerNotificationTarget;
    readonly activeUntil: string | null;
    readonly draft: boolean;
    readonly state: BannerNotificationState;
  } | null;
};

export type SearchReservationUnitsQueryVariables = Exact<{
  after?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  maxPersonsGte?: InputMaybe<Scalars["Int"]["input"]>;
  maxPersonsLte?: InputMaybe<Scalars["Int"]["input"]>;
  surfaceAreaGte?: InputMaybe<Scalars["Int"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Int"]["input"]>;
  unit?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnitType?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationUnitOrderingChoices>>
    | InputMaybe<ReservationUnitOrderingChoices>
  >;
  publishingState?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationUnitPublishingState>>
    | InputMaybe<ReservationUnitPublishingState>
  >;
}>;

export type SearchReservationUnitsQuery = {
  readonly reservationUnits: {
    readonly totalCount: number | null;
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
        readonly maxPersons: number | null;
        readonly surfaceArea: number | null;
        readonly publishingState: ReservationUnitPublishingState;
        readonly reservationState: ReservationUnitReservationState;
        readonly unit: {
          readonly id: string;
          readonly nameFi: string | null;
          readonly pk: number | null;
        } | null;
        readonly reservationUnitType: {
          readonly id: string;
          readonly nameFi: string | null;
        } | null;
      } | null;
    } | null>;
    readonly pageInfo: {
      readonly hasNextPage: boolean;
      readonly endCursor: string | null;
    };
  } | null;
};

export type ReservationUnitTableElementFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly nameFi: string | null;
  readonly maxPersons: number | null;
  readonly surfaceArea: number | null;
  readonly publishingState: ReservationUnitPublishingState;
  readonly reservationState: ReservationUnitReservationState;
  readonly unit: {
    readonly id: string;
    readonly nameFi: string | null;
    readonly pk: number | null;
  } | null;
  readonly reservationUnitType: {
    readonly id: string;
    readonly nameFi: string | null;
  } | null;
};

export type ReservationListQueryVariables = Exact<{
  first?: InputMaybe<Scalars["Int"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationOrderingChoices>>
    | InputMaybe<ReservationOrderingChoices>
  >;
  unit?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnits?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnitType?: InputMaybe<
    | ReadonlyArray<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationType?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationTypeChoice>>
    | InputMaybe<ReservationTypeChoice>
  >;
  state?: InputMaybe<
    | ReadonlyArray<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>
  >;
  orderStatus?: InputMaybe<
    | ReadonlyArray<InputMaybe<OrderStatusWithFree>>
    | InputMaybe<OrderStatusWithFree>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  createdAtGte?: InputMaybe<Scalars["Date"]["input"]>;
  createdAtLte?: InputMaybe<Scalars["Date"]["input"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
}>;

export type ReservationListQuery = {
  readonly reservations: {
    readonly totalCount: number | null;
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly name: string | null;
        readonly id: string;
        readonly pk: number | null;
        readonly begin: string;
        readonly end: string;
        readonly createdAt: string | null;
        readonly state: ReservationStateChoice | null;
        readonly type: ReservationTypeChoice | null;
        readonly isBlocked: boolean;
        readonly workingMemo: string | null;
        readonly reserveeName: string | null;
        readonly bufferTimeBefore: number;
        readonly bufferTimeAfter: number;
        readonly reservationUnits: ReadonlyArray<{
          readonly id: string;
          readonly nameFi: string | null;
          readonly unit: {
            readonly id: string;
            readonly nameFi: string | null;
          } | null;
        }>;
        readonly paymentOrder: ReadonlyArray<{
          readonly id: string;
          readonly status: OrderStatus;
        }>;
        readonly user: {
          readonly id: string;
          readonly email: string;
          readonly firstName: string;
          readonly lastName: string;
        } | null;
      } | null;
    } | null>;
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean;
    };
  } | null;
};

export type ReservationTableElementFragment = {
  readonly name: string | null;
  readonly id: string;
  readonly pk: number | null;
  readonly begin: string;
  readonly end: string;
  readonly createdAt: string | null;
  readonly state: ReservationStateChoice | null;
  readonly type: ReservationTypeChoice | null;
  readonly isBlocked: boolean;
  readonly workingMemo: string | null;
  readonly reserveeName: string | null;
  readonly bufferTimeBefore: number;
  readonly bufferTimeAfter: number;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly nameFi: string | null;
    readonly unit: {
      readonly id: string;
      readonly nameFi: string | null;
    } | null;
  }>;
  readonly paymentOrder: ReadonlyArray<{
    readonly id: string;
    readonly status: OrderStatus;
  }>;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
  } | null;
};

export type ApprovalButtonsFragment = {
  readonly id: string;
  readonly state: ReservationStateChoice | null;
  readonly pk: number | null;
  readonly handlingDetails: string | null;
  readonly price: string | null;
  readonly applyingForFreeOfCharge: boolean | null;
  readonly freeOfChargeReason: string | null;
  readonly begin: string;
  readonly end: string;
  readonly recurringReservation: {
    readonly id: string;
    readonly pk: number | null;
  } | null;
  readonly paymentOrder: ReadonlyArray<{
    readonly id: string;
    readonly orderUuid: string | null;
    readonly status: OrderStatus;
    readonly refundUuid: string | null;
  }>;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly pricings: ReadonlyArray<{
      readonly id: string;
      readonly begins: string;
      readonly priceUnit: PriceUnit;
      readonly lowestPrice: string;
      readonly highestPrice: string;
      readonly taxPercentage: {
        readonly id: string;
        readonly pk: number | null;
        readonly value: string;
      };
    }>;
  }>;
};

export type ApprovalDialogFieldsFragment = {
  readonly pk: number | null;
  readonly price: string | null;
  readonly handlingDetails: string | null;
  readonly applyingForFreeOfCharge: boolean | null;
  readonly freeOfChargeReason: string | null;
  readonly id: string;
  readonly begin: string;
  readonly end: string;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly pricings: ReadonlyArray<{
      readonly id: string;
      readonly begins: string;
      readonly priceUnit: PriceUnit;
      readonly lowestPrice: string;
      readonly highestPrice: string;
      readonly taxPercentage: {
        readonly id: string;
        readonly pk: number | null;
        readonly value: string;
      };
    }>;
  }>;
};

export type ApproveReservationMutationVariables = Exact<{
  input: ReservationApproveMutationInput;
}>;

export type ApproveReservationMutation = {
  readonly approveReservation: {
    readonly pk: number | null;
    readonly state: ReservationStateChoice | null;
  } | null;
};

export type ChangeReservationAccessCodeSingleMutationVariables = Exact<{
  input: ReservationStaffChangeAccessCodeMutationInput;
}>;

export type ChangeReservationAccessCodeSingleMutation = {
  readonly staffChangeReservationAccessCode: {
    readonly pk: number | null;
    readonly accessCodeIsActive: boolean | null;
    readonly accessCodeGeneratedAt: string | null;
  } | null;
};

export type RepairReservationAccessCodeSingleMutationVariables = Exact<{
  input: ReservationStaffRepairAccessCodeMutationInput;
}>;

export type RepairReservationAccessCodeSingleMutation = {
  readonly staffRepairReservationAccessCode: {
    readonly pk: number | null;
    readonly accessCodeIsActive: boolean | null;
    readonly accessCodeGeneratedAt: string | null;
  } | null;
};

export type ChangeReservationAccessCodeSeriesMutationVariables = Exact<{
  input: ReservationSeriesChangeAccessCodeMutationInput;
}>;

export type ChangeReservationAccessCodeSeriesMutation = {
  readonly changeReservationSeriesAccessCode: {
    readonly pk: number | null;
    readonly accessCodeIsActive: boolean | null;
    readonly accessCodeGeneratedAt: string | null;
  } | null;
};

export type RepairReservationAccessCodeSeriesMutationVariables = Exact<{
  input: ReservationSeriesRepairAccessCodeMutationInput;
}>;

export type RepairReservationAccessCodeSeriesMutation = {
  readonly repairReservationSeriesAccessCode: {
    readonly pk: number | null;
    readonly accessCodeIsActive: boolean | null;
    readonly accessCodeGeneratedAt: string | null;
  } | null;
};

export type ReservationKeylessEntryFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly end: string;
  readonly accessType: AccessType | null;
  readonly isAccessCodeIsActiveCorrect: boolean | null;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly unit: { readonly id: string; readonly pk: number | null } | null;
  }>;
  readonly pindoraInfo: {
    readonly accessCode: string;
    readonly accessCodeIsActive: boolean;
    readonly accessCodeBeginsAt: string;
    readonly accessCodeEndsAt: string;
  } | null;
  readonly recurringReservation: {
    readonly id: string;
    readonly pk: number | null;
    readonly endDate: string | null;
    readonly isAccessCodeIsActiveCorrect: boolean;
    readonly usedAccessTypes: ReadonlyArray<AccessType | null>;
    readonly pindoraInfo: {
      readonly accessCode: string;
      readonly accessCodeIsActive: boolean;
      readonly accessCodeValidity: ReadonlyArray<{
        readonly accessCodeBeginsAt: string;
        readonly accessCodeEndsAt: string;
      }>;
    } | null;
  } | null;
};

export type TimeBlockSectionFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly begin: string;
  readonly end: string;
  readonly bufferTimeAfter: number;
  readonly bufferTimeBefore: number;
  readonly name: string | null;
  readonly state: ReservationStateChoice | null;
  readonly type: ReservationTypeChoice | null;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly bufferTimeBefore: number;
    readonly bufferTimeAfter: number;
    readonly reservationStartInterval: ReservationStartInterval;
    readonly unit: { readonly id: string; readonly pk: number | null } | null;
  }>;
  readonly recurringReservation: {
    readonly id: string;
    readonly pk: number | null;
    readonly weekdays: ReadonlyArray<number>;
    readonly beginDate: string | null;
    readonly endDate: string | null;
  } | null;
  readonly user: { readonly id: string; readonly pk: number | null } | null;
};

export type ReservationApplicationLinkQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationApplicationLinkQuery = {
  readonly recurringReservation: {
    readonly id: string;
    readonly allocatedTimeSlot: {
      readonly id: string;
      readonly pk: number | null;
      readonly reservationUnitOption: {
        readonly id: string;
        readonly pk: number | null;
        readonly applicationSection: {
          readonly id: string;
          readonly pk: number | null;
          readonly application: {
            readonly id: string;
            readonly pk: number | null;
          };
        };
      };
    } | null;
  } | null;
};

export type ReservationTitleSectionFieldsFragment = {
  readonly id: string;
  readonly createdAt: string | null;
  readonly state: ReservationStateChoice | null;
  readonly type: ReservationTypeChoice | null;
  readonly name: string | null;
  readonly pk: number | null;
  readonly reserveeName: string | null;
  readonly recurringReservation: { readonly id: string } | null;
  readonly paymentOrder: ReadonlyArray<{
    readonly id: string;
    readonly status: OrderStatus;
  }>;
};

export type RequireHandlingMutationVariables = Exact<{
  input: ReservationRequiresHandlingMutationInput;
}>;

export type RequireHandlingMutation = {
  readonly requireHandlingForReservation: {
    readonly pk: number | null;
    readonly state: ReservationStateChoice | null;
  } | null;
};

export type ReservationEditPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationEditPageQuery = {
  readonly reservation: {
    readonly id: string;
    readonly pk: number | null;
    readonly begin: string;
    readonly end: string;
    readonly createdAt: string | null;
    readonly state: ReservationStateChoice | null;
    readonly type: ReservationTypeChoice | null;
    readonly isBlocked: boolean;
    readonly workingMemo: string | null;
    readonly reserveeName: string | null;
    readonly bufferTimeBefore: number;
    readonly bufferTimeAfter: number;
    readonly numPersons: number | null;
    readonly name: string | null;
    readonly description: string | null;
    readonly freeOfChargeReason: string | null;
    readonly applyingForFreeOfCharge: boolean | null;
    readonly reserveeFirstName: string | null;
    readonly reserveeLastName: string | null;
    readonly reserveeEmail: string | null;
    readonly reserveePhone: string | null;
    readonly reserveeType: CustomerTypeChoice | null;
    readonly reserveeOrganisationName: string | null;
    readonly reserveeId: string | null;
    readonly reserveeIsUnregisteredAssociation: boolean | null;
    readonly reserveeAddressStreet: string | null;
    readonly reserveeAddressCity: string | null;
    readonly reserveeAddressZip: string | null;
    readonly billingFirstName: string | null;
    readonly billingLastName: string | null;
    readonly billingPhone: string | null;
    readonly billingEmail: string | null;
    readonly billingAddressStreet: string | null;
    readonly billingAddressCity: string | null;
    readonly billingAddressZip: string | null;
    readonly recurringReservation: {
      readonly id: string;
      readonly pk: number | null;
      readonly name: string;
      readonly beginDate: string | null;
      readonly beginTime: string | null;
      readonly endDate: string | null;
      readonly endTime: string | null;
      readonly weekdays: ReadonlyArray<number>;
    } | null;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly authentication: Authentication;
      readonly bufferTimeBefore: number;
      readonly bufferTimeAfter: number;
      readonly minPersons: number | null;
      readonly maxPersons: number | null;
      readonly unit: {
        readonly id: string;
        readonly nameFi: string | null;
      } | null;
      readonly serviceSpecificTerms: {
        readonly id: string;
        readonly textFi: string | null;
        readonly nameFi: string | null;
      } | null;
      readonly paymentTerms: {
        readonly id: string;
        readonly textFi: string | null;
        readonly nameFi: string | null;
      } | null;
      readonly pricingTerms: {
        readonly id: string;
        readonly textFi: string | null;
        readonly nameFi: string | null;
      } | null;
      readonly cancellationTerms: {
        readonly id: string;
        readonly textFi: string | null;
        readonly nameFi: string | null;
      } | null;
      readonly metadataSet: {
        readonly id: string;
        readonly requiredFields: ReadonlyArray<{
          readonly id: string;
          readonly fieldName: string;
        }>;
        readonly supportedFields: ReadonlyArray<{
          readonly id: string;
          readonly fieldName: string;
        }>;
      } | null;
    }>;
    readonly paymentOrder: ReadonlyArray<{
      readonly id: string;
      readonly status: OrderStatus;
    }>;
    readonly user: {
      readonly id: string;
      readonly email: string;
      readonly firstName: string;
      readonly lastName: string;
    } | null;
    readonly ageGroup: {
      readonly id: string;
      readonly minimum: number;
      readonly maximum: number | null;
      readonly pk: number | null;
    } | null;
    readonly purpose: {
      readonly id: string;
      readonly nameFi: string | null;
      readonly pk: number | null;
    } | null;
    readonly homeCity: {
      readonly id: string;
      readonly nameFi: string | null;
      readonly pk: number | null;
    } | null;
  } | null;
};

export type EventStyleReservationFieldsFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly begin: string;
  readonly end: string;
  readonly bufferTimeAfter: number;
  readonly bufferTimeBefore: number;
  readonly name: string | null;
  readonly state: ReservationStateChoice | null;
  readonly type: ReservationTypeChoice | null;
  readonly recurringReservation: {
    readonly id: string;
    readonly pk: number | null;
  } | null;
};

export type ReservationPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationPageQuery = {
  readonly reservation: {
    readonly id: string;
    readonly begin: string;
    readonly end: string;
    readonly pk: number | null;
    readonly createdAt: string | null;
    readonly state: ReservationStateChoice | null;
    readonly type: ReservationTypeChoice | null;
    readonly isBlocked: boolean;
    readonly workingMemo: string | null;
    readonly reserveeName: string | null;
    readonly bufferTimeBefore: number;
    readonly bufferTimeAfter: number;
    readonly name: string | null;
    readonly accessType: AccessType | null;
    readonly isAccessCodeIsActiveCorrect: boolean | null;
    readonly numPersons: number | null;
    readonly description: string | null;
    readonly freeOfChargeReason: string | null;
    readonly applyingForFreeOfCharge: boolean | null;
    readonly handlingDetails: string | null;
    readonly price: string | null;
    readonly reserveeFirstName: string | null;
    readonly reserveeLastName: string | null;
    readonly reserveeEmail: string | null;
    readonly reserveePhone: string | null;
    readonly reserveeType: CustomerTypeChoice | null;
    readonly reserveeOrganisationName: string | null;
    readonly reserveeId: string | null;
    readonly reserveeIsUnregisteredAssociation: boolean | null;
    readonly reserveeAddressStreet: string | null;
    readonly reserveeAddressCity: string | null;
    readonly reserveeAddressZip: string | null;
    readonly billingFirstName: string | null;
    readonly billingLastName: string | null;
    readonly billingPhone: string | null;
    readonly billingEmail: string | null;
    readonly billingAddressStreet: string | null;
    readonly billingAddressCity: string | null;
    readonly billingAddressZip: string | null;
    readonly recurringReservation: {
      readonly id: string;
      readonly pk: number | null;
      readonly beginDate: string | null;
      readonly beginTime: string | null;
      readonly endDate: string | null;
      readonly endTime: string | null;
      readonly weekdays: ReadonlyArray<number>;
      readonly name: string;
      readonly description: string;
      readonly isAccessCodeIsActiveCorrect: boolean;
      readonly usedAccessTypes: ReadonlyArray<AccessType | null>;
      readonly pindoraInfo: {
        readonly accessCode: string;
        readonly accessCodeIsActive: boolean;
        readonly accessCodeValidity: ReadonlyArray<{
          readonly accessCodeBeginsAt: string;
          readonly accessCodeEndsAt: string;
        }>;
      } | null;
    } | null;
    readonly cancelReason: {
      readonly id: string;
      readonly reasonFi: string | null;
    } | null;
    readonly denyReason: {
      readonly id: string;
      readonly reasonFi: string | null;
    } | null;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly reservationStartInterval: ReservationStartInterval;
      readonly nameFi: string | null;
      readonly bufferTimeBefore: number;
      readonly bufferTimeAfter: number;
      readonly authentication: Authentication;
      readonly minPersons: number | null;
      readonly maxPersons: number | null;
      readonly unit: {
        readonly id: string;
        readonly nameFi: string | null;
        readonly pk: number | null;
      } | null;
      readonly serviceSpecificTerms: {
        readonly id: string;
        readonly textFi: string | null;
        readonly nameFi: string | null;
      } | null;
      readonly paymentTerms: {
        readonly id: string;
        readonly textFi: string | null;
        readonly nameFi: string | null;
      } | null;
      readonly pricingTerms: {
        readonly id: string;
        readonly textFi: string | null;
        readonly nameFi: string | null;
      } | null;
      readonly cancellationTerms: {
        readonly id: string;
        readonly textFi: string | null;
        readonly nameFi: string | null;
      } | null;
      readonly pricings: ReadonlyArray<{
        readonly id: string;
        readonly begins: string;
        readonly priceUnit: PriceUnit;
        readonly lowestPrice: string;
        readonly highestPrice: string;
        readonly taxPercentage: {
          readonly id: string;
          readonly pk: number | null;
          readonly value: string;
        };
      }>;
      readonly metadataSet: {
        readonly id: string;
        readonly requiredFields: ReadonlyArray<{
          readonly id: string;
          readonly fieldName: string;
        }>;
        readonly supportedFields: ReadonlyArray<{
          readonly id: string;
          readonly fieldName: string;
        }>;
      } | null;
    }>;
    readonly paymentOrder: ReadonlyArray<{
      readonly id: string;
      readonly status: OrderStatus;
      readonly orderUuid: string | null;
      readonly refundUuid: string | null;
    }>;
    readonly user: {
      readonly id: string;
      readonly email: string;
      readonly firstName: string;
      readonly lastName: string;
      readonly pk: number | null;
    } | null;
    readonly pindoraInfo: {
      readonly accessCode: string;
      readonly accessCodeIsActive: boolean;
      readonly accessCodeBeginsAt: string;
      readonly accessCodeEndsAt: string;
    } | null;
    readonly ageGroup: {
      readonly id: string;
      readonly minimum: number;
      readonly maximum: number | null;
      readonly pk: number | null;
    } | null;
    readonly purpose: {
      readonly id: string;
      readonly nameFi: string | null;
      readonly pk: number | null;
    } | null;
    readonly homeCity: {
      readonly id: string;
      readonly nameFi: string | null;
      readonly pk: number | null;
    } | null;
  } | null;
};

export type SeriesPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type SeriesPageQuery = {
  readonly reservation: {
    readonly id: string;
    readonly pk: number | null;
    readonly type: ReservationTypeChoice | null;
    readonly recurringReservation: {
      readonly recurrenceInDays: number | null;
      readonly endTime: string | null;
      readonly beginTime: string | null;
      readonly id: string;
      readonly pk: number | null;
      readonly weekdays: ReadonlyArray<number>;
      readonly beginDate: string | null;
      readonly endDate: string | null;
      readonly rejectedOccurrences: ReadonlyArray<{
        readonly id: string;
        readonly beginDatetime: string;
        readonly endDatetime: string;
        readonly rejectionReason: RejectionReadinessChoice;
      }>;
      readonly reservations: ReadonlyArray<{
        readonly state: ReservationStateChoice | null;
        readonly id: string;
        readonly pk: number | null;
        readonly begin: string;
        readonly end: string;
        readonly type: ReservationTypeChoice | null;
        readonly bufferTimeAfter: number;
        readonly bufferTimeBefore: number;
        readonly paymentOrder: ReadonlyArray<{
          readonly id: string;
          readonly status: OrderStatus;
        }>;
        readonly reservationUnits: ReadonlyArray<{
          readonly id: string;
          readonly pk: number | null;
          readonly bufferTimeBefore: number;
          readonly bufferTimeAfter: number;
          readonly reservationStartInterval: ReservationStartInterval;
          readonly unit: {
            readonly id: string;
            readonly pk: number | null;
          } | null;
        }>;
        readonly recurringReservation: {
          readonly pk: number | null;
          readonly id: string;
          readonly weekdays: ReadonlyArray<number>;
          readonly beginDate: string | null;
          readonly endDate: string | null;
        } | null;
      }>;
    } | null;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly bufferTimeBefore: number;
      readonly bufferTimeAfter: number;
      readonly reservationStartInterval: ReservationStartInterval;
    }>;
  } | null;
};

export type ReservationSeriesQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationSeriesQuery = {
  readonly recurringReservation: {
    readonly id: string;
    readonly pk: number | null;
    readonly weekdays: ReadonlyArray<number>;
    readonly beginDate: string | null;
    readonly endDate: string | null;
    readonly rejectedOccurrences: ReadonlyArray<{
      readonly id: string;
      readonly beginDatetime: string;
      readonly endDatetime: string;
      readonly rejectionReason: RejectionReadinessChoice;
    }>;
    readonly reservations: ReadonlyArray<{
      readonly state: ReservationStateChoice | null;
      readonly id: string;
      readonly pk: number | null;
      readonly begin: string;
      readonly end: string;
      readonly type: ReservationTypeChoice | null;
      readonly bufferTimeAfter: number;
      readonly bufferTimeBefore: number;
      readonly paymentOrder: ReadonlyArray<{
        readonly id: string;
        readonly status: OrderStatus;
      }>;
      readonly reservationUnits: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
        readonly bufferTimeBefore: number;
        readonly bufferTimeAfter: number;
        readonly reservationStartInterval: ReservationStartInterval;
        readonly unit: {
          readonly id: string;
          readonly pk: number | null;
        } | null;
      }>;
      readonly recurringReservation: {
        readonly pk: number | null;
        readonly id: string;
        readonly weekdays: ReadonlyArray<number>;
        readonly beginDate: string | null;
        readonly endDate: string | null;
      } | null;
    }>;
  } | null;
};

export type RescheduleReservationSeriesMutationVariables = Exact<{
  input: ReservationSeriesRescheduleMutationInput;
}>;

export type RescheduleReservationSeriesMutation = {
  readonly rescheduleReservationSeries: { readonly pk: number | null } | null;
};

export type ReservationUnitPricingFieldsFragment = {
  readonly id: string;
  readonly pricings: ReadonlyArray<{
    readonly id: string;
    readonly begins: string;
    readonly priceUnit: PriceUnit;
    readonly lowestPrice: string;
    readonly highestPrice: string;
    readonly taxPercentage: {
      readonly id: string;
      readonly pk: number | null;
      readonly value: string;
    };
  }>;
};

export type ReservationPriceDetailsFieldsFragment = {
  readonly id: string;
  readonly begin: string;
  readonly end: string;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly pricings: ReadonlyArray<{
      readonly id: string;
      readonly begins: string;
      readonly priceUnit: PriceUnit;
      readonly lowestPrice: string;
      readonly highestPrice: string;
      readonly taxPercentage: {
        readonly id: string;
        readonly pk: number | null;
        readonly value: string;
      };
    }>;
  }>;
};

export type CreateTagStringFragment = {
  readonly id: string;
  readonly begin: string;
  readonly end: string;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly nameFi: string | null;
    readonly unit: {
      readonly id: string;
      readonly nameFi: string | null;
    } | null;
  }>;
  readonly recurringReservation: {
    readonly id: string;
    readonly beginDate: string | null;
    readonly beginTime: string | null;
    readonly endDate: string | null;
    readonly endTime: string | null;
    readonly weekdays: ReadonlyArray<number>;
  } | null;
};

export type UseStaffReservationFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly recurringReservation: {
    readonly id: string;
    readonly pk: number | null;
  } | null;
};

export type UpdateStaffReservationMutationVariables = Exact<{
  input: ReservationStaffModifyMutationInput;
  workingMemo: ReservationWorkingMemoMutationInput;
}>;

export type UpdateStaffReservationMutation = {
  readonly staffReservationModify: { readonly pk: number | null } | null;
  readonly updateReservationWorkingMemo: {
    readonly workingMemo: string | null;
  } | null;
};

export type UpdateRecurringReservationMutationVariables = Exact<{
  input: ReservationSeriesUpdateMutationInput;
}>;

export type UpdateRecurringReservationMutation = {
  readonly updateReservationSeries: { readonly pk: number | null } | null;
};

export type ReservationPermissionsQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationPermissionsQuery = {
  readonly reservation: {
    readonly id: string;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly unit: { readonly id: string; readonly pk: number | null } | null;
    }>;
  } | null;
};

export type DeleteResourceMutationVariables = Exact<{
  input: ResourceDeleteMutationInput;
}>;

export type DeleteResourceMutation = {
  readonly deleteResource: { readonly deleted: boolean | null } | null;
};

export type ResourceTableFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly spaces: ReadonlyArray<{
    readonly id: string;
    readonly resources: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly locationType: ResourceLocationType;
    }>;
  }>;
};

export type SpacesResourcesQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type SpacesResourcesQuery = {
  readonly unit: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly location: {
      readonly id: string;
      readonly addressStreetFi: string | null;
      readonly addressZip: string;
      readonly addressCityFi: string | null;
    } | null;
    readonly spaces: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly code: string;
      readonly surfaceArea: number | null;
      readonly maxPersons: number | null;
      readonly nameFi: string | null;
      readonly resources: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
        readonly locationType: ResourceLocationType;
      }>;
      readonly children: ReadonlyArray<{ readonly id: string }> | null;
    }>;
  } | null;
};

export type SpacesTableFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly nameFi: string | null;
  readonly spaces: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly code: string;
    readonly surfaceArea: number | null;
    readonly maxPersons: number | null;
    readonly nameFi: string | null;
    readonly resources: ReadonlyArray<{ readonly id: string }>;
    readonly children: ReadonlyArray<{ readonly id: string }> | null;
  }>;
  readonly location: {
    readonly id: string;
    readonly addressStreetFi: string | null;
    readonly addressZip: string;
    readonly addressCityFi: string | null;
  } | null;
};

export type DeleteSpaceMutationVariables = Exact<{
  input: SpaceDeleteMutationInput;
}>;

export type DeleteSpaceMutation = {
  readonly deleteSpace: { readonly deleted: boolean | null } | null;
};

export type UnitSubpageHeadFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly nameFi: string | null;
  readonly location: {
    readonly id: string;
    readonly addressStreetFi: string | null;
    readonly addressZip: string;
    readonly addressCityFi: string | null;
  } | null;
};

export type UnitListQueryVariables = Exact<{
  first?: InputMaybe<Scalars["Int"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    | ReadonlyArray<InputMaybe<UnitOrderingChoices>>
    | InputMaybe<UnitOrderingChoices>
  >;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type UnitListQuery = {
  readonly units: {
    readonly totalCount: number | null;
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly nameFi: string | null;
        readonly pk: number | null;
        readonly unitGroups: ReadonlyArray<{
          readonly id: string;
          readonly nameFi: string | null;
        }>;
        readonly reservationUnits: ReadonlyArray<{
          readonly id: string;
          readonly pk: number | null;
        }>;
      } | null;
    } | null>;
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean;
    };
  } | null;
};

export type UnitTableElementFragment = {
  readonly id: string;
  readonly nameFi: string | null;
  readonly pk: number | null;
  readonly unitGroups: ReadonlyArray<{
    readonly id: string;
    readonly nameFi: string | null;
  }>;
  readonly reservationUnits: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
  }>;
};

export type ReservationUnitCardFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly nameFi: string | null;
  readonly maxPersons: number | null;
  readonly isDraft: boolean;
  readonly reservationUnitType: {
    readonly id: string;
    readonly nameFi: string | null;
  } | null;
  readonly images: ReadonlyArray<{
    readonly id: string;
    readonly imageUrl: string | null;
    readonly largeUrl: string | null;
    readonly mediumUrl: string | null;
    readonly smallUrl: string | null;
    readonly imageType: ImageType;
  }>;
  readonly purposes: ReadonlyArray<{ readonly id: string }>;
  readonly resources: ReadonlyArray<{ readonly id: string }>;
};

export type UnitPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type UnitPageQuery = {
  readonly unit: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly tprekId: string | null;
    readonly shortDescriptionFi: string | null;
    readonly reservationUnits: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly maxPersons: number | null;
      readonly isDraft: boolean;
      readonly reservationUnitType: {
        readonly id: string;
        readonly nameFi: string | null;
      } | null;
      readonly images: ReadonlyArray<{
        readonly id: string;
        readonly imageUrl: string | null;
        readonly largeUrl: string | null;
        readonly mediumUrl: string | null;
        readonly smallUrl: string | null;
        readonly imageType: ImageType;
      }>;
      readonly purposes: ReadonlyArray<{ readonly id: string }>;
      readonly resources: ReadonlyArray<{ readonly id: string }>;
    }>;
    readonly spaces: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
    }>;
    readonly location: {
      readonly id: string;
      readonly addressStreetFi: string | null;
      readonly addressZip: string;
      readonly addressCityFi: string | null;
    } | null;
  } | null;
};

export type CreateResourceMutationVariables = Exact<{
  input: ResourceCreateMutationInput;
}>;

export type CreateResourceMutation = {
  readonly createResource: { readonly pk: number | null } | null;
};

export type ResourceQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  unitId: Scalars["ID"]["input"];
}>;

export type ResourceQuery = {
  readonly resource: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly nameSv: string | null;
    readonly nameEn: string | null;
    readonly space: { readonly id: string; readonly pk: number | null } | null;
  } | null;
  readonly unit: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly location: {
      readonly id: string;
      readonly addressStreetFi: string | null;
      readonly addressZip: string;
      readonly addressCityFi: string | null;
    } | null;
  } | null;
};

export type UpdateResourceMutationVariables = Exact<{
  input: ResourceUpdateMutationInput;
}>;

export type UpdateResourceMutation = {
  readonly updateResource: { readonly pk: number | null } | null;
};

export type UnitSpacesQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type UnitSpacesQuery = {
  readonly unit: {
    readonly id: string;
    readonly spaces: ReadonlyArray<{
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly parent: {
        readonly id: string;
        readonly pk: number | null;
      } | null;
    }>;
  } | null;
};

export type UpdateSpaceMutationVariables = Exact<{
  input: SpaceUpdateMutationInput;
}>;

export type UpdateSpaceMutation = {
  readonly updateSpace: { readonly pk: number | null } | null;
};

export type SpaceQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type SpaceQuery = {
  readonly space: {
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
    readonly nameSv: string | null;
    readonly nameEn: string | null;
    readonly code: string;
    readonly surfaceArea: number | null;
    readonly maxPersons: number | null;
    readonly unit: {
      readonly id: string;
      readonly descriptionFi: string | null;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly spaces: ReadonlyArray<{
        readonly id: string;
        readonly pk: number | null;
        readonly nameFi: string | null;
      }>;
      readonly location: {
        readonly id: string;
        readonly addressStreetFi: string | null;
        readonly addressZip: string;
        readonly addressCityFi: string | null;
      } | null;
    } | null;
    readonly parent: {
      readonly id: string;
      readonly pk: number | null;
      readonly nameFi: string | null;
      readonly parent: {
        readonly id: string;
        readonly nameFi: string | null;
        readonly parent: {
          readonly id: string;
          readonly nameFi: string | null;
        } | null;
      } | null;
    } | null;
  } | null;
};

export type UnitResourceInfoFieldsFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly nameFi: string | null;
  readonly location: {
    readonly id: string;
    readonly addressStreetFi: string | null;
    readonly addressZip: string;
    readonly addressCityFi: string | null;
  } | null;
};

export type NewResourceUnitFieldsFragment = {
  readonly id: string;
  readonly pk: number | null;
  readonly nameFi: string | null;
  readonly spaces: ReadonlyArray<{
    readonly id: string;
    readonly pk: number | null;
    readonly nameFi: string | null;
  }>;
  readonly location: {
    readonly id: string;
    readonly addressStreetFi: string | null;
    readonly addressZip: string;
    readonly addressCityFi: string | null;
  } | null;
};

export type CreateSpaceMutationVariables = Exact<{
  input: SpaceCreateMutationInput;
}>;

export type CreateSpaceMutation = {
  readonly createSpace: { readonly pk: number | null } | null;
};

export const ReserveeNameFieldsFragmentDoc = gql`
  fragment ReserveeNameFields on ReservationNode {
    id
    reserveeFirstName
    reserveeLastName
    reserveeEmail
    reserveePhone
    reserveeType
    reserveeOrganisationName
    reserveeId
  }
`;
export const ReserveeBillingFieldsFragmentDoc = gql`
  fragment ReserveeBillingFields on ReservationNode {
    id
    reserveeId
    reserveeIsUnregisteredAssociation
    reserveeAddressStreet
    reserveeAddressCity
    reserveeAddressZip
    billingFirstName
    billingLastName
    billingPhone
    billingEmail
    billingAddressStreet
    billingAddressCity
    billingAddressZip
  }
`;
export const MetaFieldsFragmentDoc = gql`
  fragment MetaFields on ReservationNode {
    ...ReserveeNameFields
    ...ReserveeBillingFields
    applyingForFreeOfCharge
    freeOfChargeReason
    description
    numPersons
    ageGroup {
      id
      pk
      maximum
      minimum
    }
    purpose {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    homeCity {
      id
      pk
      nameFi
      nameSv
      nameEn
    }
  }
  ${ReserveeNameFieldsFragmentDoc}
  ${ReserveeBillingFieldsFragmentDoc}
`;
export const TermsOfUseNameFieldsFragmentDoc = gql`
  fragment TermsOfUseNameFields on TermsOfUseNode {
    id
    nameFi
    nameEn
    nameSv
  }
`;
export const TermsOfUseTextFieldsFragmentDoc = gql`
  fragment TermsOfUseTextFields on TermsOfUseNode {
    id
    textFi
    textEn
    textSv
  }
`;
export const TermsOfUseFieldsFragmentDoc = gql`
  fragment TermsOfUseFields on TermsOfUseNode {
    pk
    ...TermsOfUseNameFields
    ...TermsOfUseTextFields
    termsType
  }
  ${TermsOfUseNameFieldsFragmentDoc}
  ${TermsOfUseTextFieldsFragmentDoc}
`;
export const LocationFieldsFragmentDoc = gql`
  fragment LocationFields on LocationNode {
    id
    addressStreetFi
    addressZip
    addressCityFi
  }
`;
export const LocationFieldsI18nFragmentDoc = gql`
  fragment LocationFieldsI18n on LocationNode {
    ...LocationFields
    addressStreetEn
    addressStreetSv
    addressCityEn
    addressCitySv
  }
  ${LocationFieldsFragmentDoc}
`;
export const BannerNotificationCommonFragmentDoc = gql`
  fragment BannerNotificationCommon on BannerNotificationNode {
    id
    level
    activeFrom
    messageEn
    messageFi
    messageSv
  }
`;
export const AllocatedTimeSlotFragmentDoc = gql`
  fragment AllocatedTimeSlot on AllocatedTimeSlotNode {
    id
    beginTime
    endTime
    dayOfTheWeek
  }
`;
export const ReservationCommonFieldsFragmentDoc = gql`
  fragment ReservationCommonFields on ReservationNode {
    id
    pk
    begin
    end
    createdAt
    state
    type
    isBlocked
    workingMemo
    reserveeName
    paymentOrder {
      id
      status
    }
    user {
      id
      email
      firstName
      lastName
    }
    bufferTimeBefore
    bufferTimeAfter
  }
`;
export const VisibleIfPermissionFieldsFragmentDoc = gql`
  fragment VisibleIfPermissionFields on ReservationNode {
    id
    user {
      id
      pk
    }
    reservationUnits {
      id
      unit {
        id
        pk
      }
    }
  }
`;
export const ReservationUnitReservationsFragmentDoc = gql`
  fragment ReservationUnitReservations on ReservationNode {
    ...ReservationCommonFields
    ...VisibleIfPermissionFields
    name
    numPersons
    calendarUrl
    reservationUnits {
      id
      pk
      nameFi
      bufferTimeBefore
      bufferTimeAfter
      unit {
        id
        pk
      }
    }
    affectedReservationUnits
  }
  ${ReservationCommonFieldsFragmentDoc}
  ${VisibleIfPermissionFieldsFragmentDoc}
`;
export const ReservationMetaFieldsFragmentDoc = gql`
  fragment ReservationMetaFields on ReservationNode {
    ageGroup {
      id
      minimum
      maximum
      pk
    }
    purpose {
      id
      nameFi
      pk
    }
    homeCity {
      id
      nameFi
      pk
    }
    numPersons
    name
    description
    ...ReserveeNameFields
    ...ReserveeBillingFields
    freeOfChargeReason
    applyingForFreeOfCharge
  }
  ${ReserveeNameFieldsFragmentDoc}
  ${ReserveeBillingFieldsFragmentDoc}
`;
export const ChangeReservationTimeFragmentDoc = gql`
  fragment ChangeReservationTime on ReservationNode {
    id
    pk
    begin
    end
    type
    bufferTimeAfter
    bufferTimeBefore
    recurringReservation {
      pk
      id
      weekdays
      beginDate
      endDate
    }
    reservationUnits {
      id
      pk
      bufferTimeBefore
      bufferTimeAfter
      reservationStartInterval
    }
  }
`;
export const RecurringReservationFieldsFragmentDoc = gql`
  fragment RecurringReservationFields on RecurringReservationNode {
    id
    pk
    weekdays
    beginDate
    endDate
    rejectedOccurrences {
      id
      beginDatetime
      endDatetime
      rejectionReason
    }
    reservations {
      ...ChangeReservationTime
      state
      paymentOrder {
        id
        status
      }
      reservationUnits {
        id
        unit {
          id
          pk
        }
      }
    }
  }
  ${ChangeReservationTimeFragmentDoc}
`;
export const CombineAffectedReservationsFragmentDoc = gql`
  fragment CombineAffectedReservations on ReservationNode {
    id
    pk
    affectedReservationUnits
  }
`;
export const CalendarReservationFragmentDoc = gql`
  fragment CalendarReservation on ReservationNode {
    id
    user {
      id
      email
    }
    name
    reserveeName
    pk
    begin
    end
    state
    type
    bufferTimeBefore
    bufferTimeAfter
    affectedReservationUnits
    accessType
    recurringReservation {
      id
      pk
    }
  }
`;
export const UnitSubpageHeadFragmentDoc = gql`
  fragment UnitSubpageHead on UnitNode {
    id
    pk
    nameFi
    location {
      ...LocationFields
    }
  }
  ${LocationFieldsFragmentDoc}
`;
export const ReservationUnitEditUnitFragmentDoc = gql`
  fragment ReservationUnitEditUnit on UnitNode {
    ...UnitSubpageHead
    spaces {
      id
      pk
      nameFi
      maxPersons
      surfaceArea
      resources {
        id
        pk
        nameFi
        locationType
      }
    }
  }
  ${UnitSubpageHeadFragmentDoc}
`;
export const ApplicationNameFragmentDoc = gql`
  fragment ApplicationName on ApplicationNode {
    id
    applicantType
    organisation {
      id
      nameFi
      organisationType
    }
    contactPerson {
      id
      lastName
      firstName
    }
  }
`;
export const AllocatedSectionsTableElementFragmentDoc = gql`
  fragment AllocatedSectionsTableElement on AllocatedTimeSlotNode {
    id
    pk
    dayOfTheWeek
    endTime
    beginTime
    recurringReservation {
      id
      pk
      shouldHaveActiveAccessCode
      isAccessCodeIsActiveCorrect
      reservations {
        id
        pk
      }
    }
    reservationUnitOption {
      id
      rejected
      locked
      preferredOrder
      applicationSection {
        id
        pk
        name
        reservationsEndDate
        reservationsBeginDate
        reservationMinDuration
        reservationMaxDuration
        application {
          pk
          id
          ...ApplicationName
        }
      }
      reservationUnit {
        id
        nameFi
        unit {
          id
          nameFi
        }
      }
    }
  }
  ${ApplicationNameFragmentDoc}
`;
export const ApplicationSectionDurationFragmentDoc = gql`
  fragment ApplicationSectionDuration on ApplicationSectionNode {
    id
    reservationsEndDate
    reservationsBeginDate
    appliedReservationsPerWeek
    reservationMinDuration
  }
`;
export const ApplicationSectionCommonFragmentDoc = gql`
  fragment ApplicationSectionCommon on ApplicationSectionNode {
    id
    pk
    name
    status
    ...ApplicationSectionDuration
    reservationMaxDuration
    ageGroup {
      id
      pk
      minimum
      maximum
    }
    numPersons
    reservationUnitOptions {
      id
      pk
      preferredOrder
    }
  }
  ${ApplicationSectionDurationFragmentDoc}
`;
export const ApplicationSectionFieldsFragmentDoc = gql`
  fragment ApplicationSectionFields on ApplicationSectionNode {
    ...ApplicationSectionCommon
    purpose {
      id
      pk
      nameFi
    }
    application {
      id
      pk
      status
      ...ApplicationName
    }
    reservationUnitOptions {
      id
      reservationUnit {
        id
        pk
        nameFi
        unit {
          id
          pk
          nameFi
        }
      }
    }
  }
  ${ApplicationSectionCommonFragmentDoc}
  ${ApplicationNameFragmentDoc}
`;
export const ApplicationSectionTableElementFragmentDoc = gql`
  fragment ApplicationSectionTableElement on ApplicationSectionNode {
    ...ApplicationSectionFields
    allocations
    reservationUnitOptions {
      id
      allocatedTimeSlots {
        id
        pk
        dayOfTheWeek
        beginTime
        endTime
        reservationUnitOption {
          id
          applicationSection {
            id
            pk
          }
        }
      }
    }
  }
  ${ApplicationSectionFieldsFragmentDoc}
`;
export const ApplicationsTableElementFragmentDoc = gql`
  fragment ApplicationsTableElement on ApplicationNode {
    id
    pk
    status
    ...ApplicationName
    applicationSections {
      id
      pk
      name
      ...ApplicationSectionDuration
      reservationUnitOptions {
        id
        preferredOrder
        reservationUnit {
          id
          unit {
            id
            pk
            nameFi
          }
        }
      }
    }
  }
  ${ApplicationNameFragmentDoc}
  ${ApplicationSectionDurationFragmentDoc}
`;
export const ApplicantNameFieldsFragmentDoc = gql`
  fragment ApplicantNameFields on ApplicationNode {
    id
    applicantType
    contactPerson {
      id
      firstName
      lastName
    }
    organisation {
      id
      nameFi
    }
  }
`;
export const RejectedOccurancesTableElementFragmentDoc = gql`
  fragment RejectedOccurancesTableElement on RejectedOccurrenceNode {
    id
    pk
    beginDatetime
    endDatetime
    rejectionReason
    recurringReservation {
      id
      allocatedTimeSlot {
        id
        pk
        dayOfTheWeek
        beginTime
        endTime
        reservationUnitOption {
          id
          applicationSection {
            id
            name
            application {
              id
              pk
              ...ApplicantNameFields
            }
          }
          reservationUnit {
            id
            nameFi
            pk
            unit {
              id
              nameFi
            }
          }
        }
      }
      reservations {
        id
        pk
      }
    }
  }
  ${ApplicantNameFieldsFragmentDoc}
`;
export const ApplicationRoundAdminFragmentDoc = gql`
  fragment ApplicationRoundAdmin on ApplicationRoundNode {
    id
    pk
    nameFi
    status
    applicationPeriodBegin
    applicationPeriodEnd
    applicationsCount
    isSettingHandledAllowed
    reservationCreationStatus
    reservationUnits {
      id
      pk
      nameFi
      unit {
        id
        pk
        nameFi
      }
    }
  }
`;
export const ApplicationRoundCardFragmentDoc = gql`
  fragment ApplicationRoundCard on ApplicationRoundNode {
    id
    pk
    nameFi
    status
    applicationPeriodBegin
    applicationPeriodEnd
    reservationPeriodBegin
    reservationPeriodEnd
    reservationUnitCount
    applicationsCount
  }
`;
export const ApplicationRoundListElementFragmentDoc = gql`
  fragment ApplicationRoundListElement on ApplicationRoundNode {
    ...ApplicationRoundCard
    statusTimestamp
  }
  ${ApplicationRoundCardFragmentDoc}
`;
export const ApplicantFragmentDoc = gql`
  fragment Applicant on ApplicationNode {
    id
    pk
    applicantType
    contactPerson {
      id
      pk
      firstName
      lastName
      email
      phoneNumber
    }
    additionalInformation
    organisation {
      id
      pk
      nameFi
      identifier
      organisationType
      coreBusinessFi
      yearEstablished
      address {
        id
        pk
        postCode
        streetAddressFi
        cityFi
      }
    }
    homeCity {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    billingAddress {
      id
      pk
      postCode
      streetAddressFi
      cityFi
    }
  }
`;
export const SuitableTimeFragmentDoc = gql`
  fragment SuitableTime on SuitableTimeRangeNode {
    id
    pk
    beginTime
    endTime
    dayOfTheWeek
    priority
  }
`;
export const ApplicationRoundTimeSlotsFragmentDoc = gql`
  fragment ApplicationRoundTimeSlots on ApplicationRoundTimeSlotNode {
    id
    pk
    weekday
    closed
    reservableTimes {
      begin
      end
    }
  }
`;
export const ReservationUnitOptionFieldsFragmentDoc = gql`
  fragment ReservationUnitOptionFields on ReservationUnitOptionNode {
    id
    pk
    rejected
    allocatedTimeSlots {
      pk
      id
    }
    reservationUnit {
      id
      pk
      nameFi
      unit {
        id
        pk
        nameFi
      }
      applicationRoundTimeSlots {
        ...ApplicationRoundTimeSlots
      }
    }
  }
  ${ApplicationRoundTimeSlotsFragmentDoc}
`;
export const ApplicationPageSectionFragmentDoc = gql`
  fragment ApplicationPageSection on ApplicationSectionNode {
    ...ApplicationSectionCommon
    suitableTimeRanges {
      ...SuitableTime
    }
    purpose {
      id
      pk
      nameFi
    }
    allocations
    reservationUnitOptions {
      id
      ...ReservationUnitOptionFields
    }
  }
  ${ApplicationSectionCommonFragmentDoc}
  ${SuitableTimeFragmentDoc}
  ${ReservationUnitOptionFieldsFragmentDoc}
`;
export const ApplicationPageFieldsFragmentDoc = gql`
  fragment ApplicationPageFields on ApplicationNode {
    id
    pk
    status
    lastModifiedDate
    ...Applicant
    ...ApplicantNameFields
    applicationRound {
      id
      pk
      nameFi
    }
    applicationSections {
      ...ApplicationPageSection
    }
  }
  ${ApplicantFragmentDoc}
  ${ApplicantNameFieldsFragmentDoc}
  ${ApplicationPageSectionFragmentDoc}
`;
export const MetadataSetsFragmentDoc = gql`
  fragment MetadataSets on ReservationUnitNode {
    id
    minPersons
    maxPersons
    metadataSet {
      id
      requiredFields {
        id
        fieldName
      }
      supportedFields {
        id
        fieldName
      }
    }
  }
`;
export const ReservationTypeFormFieldsFragmentDoc = gql`
  fragment ReservationTypeFormFields on ReservationUnitNode {
    ...MetadataSets
    authentication
    bufferTimeBefore
    bufferTimeAfter
    serviceSpecificTerms {
      id
      textFi
      nameFi
    }
    paymentTerms {
      id
      textFi
      nameFi
    }
    pricingTerms {
      id
      textFi
      nameFi
    }
    cancellationTerms {
      id
      textFi
      nameFi
    }
  }
  ${MetadataSetsFragmentDoc}
`;
export const CreateStaffReservationFragmentDoc = gql`
  fragment CreateStaffReservation on ReservationUnitNode {
    pk
    nameFi
    reservationStartInterval
    ...ReservationTypeFormFields
  }
  ${ReservationTypeFormFieldsFragmentDoc}
`;
export const BannerNotificationTableElementFragmentDoc = gql`
  fragment BannerNotificationTableElement on BannerNotificationNode {
    id
    pk
    name
    activeFrom
    activeUntil
    state
    target
    level
  }
`;
export const ReservationUnitTableElementFragmentDoc = gql`
  fragment ReservationUnitTableElement on ReservationUnitNode {
    id
    pk
    nameFi
    unit {
      id
      nameFi
      pk
    }
    reservationUnitType {
      id
      nameFi
    }
    maxPersons
    surfaceArea
    publishingState
    reservationState
  }
`;
export const ReservationTableElementFragmentDoc = gql`
  fragment ReservationTableElement on ReservationNode {
    ...ReservationCommonFields
    name
    reservationUnits {
      id
      nameFi
      unit {
        id
        nameFi
      }
    }
  }
  ${ReservationCommonFieldsFragmentDoc}
`;
export const DenyDialogFieldsFragmentDoc = gql`
  fragment DenyDialogFields on ReservationNode {
    id
    pk
    handlingDetails
    price
    paymentOrder {
      id
      orderUuid
      status
      refundUuid
    }
  }
`;
export const PricingFieldsFragmentDoc = gql`
  fragment PricingFields on ReservationUnitPricingNode {
    id
    begins
    priceUnit
    lowestPrice
    highestPrice
    taxPercentage {
      id
      pk
      value
    }
  }
`;
export const ReservationUnitPricingFieldsFragmentDoc = gql`
  fragment ReservationUnitPricingFields on ReservationUnitNode {
    id
    pricings {
      id
      ...PricingFields
    }
  }
  ${PricingFieldsFragmentDoc}
`;
export const ReservationPriceDetailsFieldsFragmentDoc = gql`
  fragment ReservationPriceDetailsFields on ReservationNode {
    id
    begin
    end
    reservationUnits {
      ...ReservationUnitPricingFields
    }
  }
  ${ReservationUnitPricingFieldsFragmentDoc}
`;
export const ApprovalDialogFieldsFragmentDoc = gql`
  fragment ApprovalDialogFields on ReservationNode {
    pk
    price
    handlingDetails
    applyingForFreeOfCharge
    freeOfChargeReason
    ...ReservationPriceDetailsFields
  }
  ${ReservationPriceDetailsFieldsFragmentDoc}
`;
export const ApprovalButtonsFragmentDoc = gql`
  fragment ApprovalButtons on ReservationNode {
    id
    state
    ...DenyDialogFields
    ...ApprovalDialogFields
    recurringReservation {
      id
      pk
    }
  }
  ${DenyDialogFieldsFragmentDoc}
  ${ApprovalDialogFieldsFragmentDoc}
`;
export const ReservationKeylessEntryFragmentDoc = gql`
  fragment ReservationKeylessEntry on ReservationNode {
    id
    pk
    end
    reservationUnits {
      id
      unit {
        id
        pk
      }
    }
    accessType
    isAccessCodeIsActiveCorrect
    pindoraInfo {
      accessCode
      accessCodeIsActive
      accessCodeBeginsAt
      accessCodeEndsAt
    }
    recurringReservation {
      id
      pk
      endDate
      isAccessCodeIsActiveCorrect
      usedAccessTypes
      pindoraInfo {
        accessCode
        accessCodeIsActive
        accessCodeValidity {
          accessCodeBeginsAt
          accessCodeEndsAt
        }
      }
    }
  }
`;
export const EventStyleReservationFieldsFragmentDoc = gql`
  fragment EventStyleReservationFields on ReservationNode {
    id
    pk
    begin
    end
    bufferTimeAfter
    bufferTimeBefore
    name
    state
    type
    recurringReservation {
      id
      pk
    }
  }
`;
export const ReservationToCopyFragmentDoc = gql`
  fragment ReservationToCopy on ReservationNode {
    ...ChangeReservationTime
    reservationUnits {
      id
      unit {
        id
        pk
      }
    }
  }
  ${ChangeReservationTimeFragmentDoc}
`;
export const TimeBlockSectionFragmentDoc = gql`
  fragment TimeBlockSection on ReservationNode {
    id
    pk
    ...EventStyleReservationFields
    ...ReservationToCopy
    ...VisibleIfPermissionFields
    reservationUnits {
      id
      pk
    }
    recurringReservation {
      id
      pk
    }
  }
  ${EventStyleReservationFieldsFragmentDoc}
  ${ReservationToCopyFragmentDoc}
  ${VisibleIfPermissionFieldsFragmentDoc}
`;
export const ReservationTitleSectionFieldsFragmentDoc = gql`
  fragment ReservationTitleSectionFields on ReservationNode {
    id
    createdAt
    state
    type
    name
    pk
    reserveeName
    recurringReservation {
      id
    }
    paymentOrder {
      id
      status
    }
  }
`;
export const CreateTagStringFragmentDoc = gql`
  fragment CreateTagString on ReservationNode {
    id
    begin
    end
    reservationUnits {
      id
      nameFi
      unit {
        id
        nameFi
      }
    }
    recurringReservation {
      id
      beginDate
      beginTime
      endDate
      endTime
      weekdays
    }
  }
`;
export const UseStaffReservationFragmentDoc = gql`
  fragment UseStaffReservation on ReservationNode {
    id
    pk
    recurringReservation {
      id
      pk
    }
  }
`;
export const ResourceTableFragmentDoc = gql`
  fragment ResourceTable on UnitNode {
    id
    pk
    spaces {
      id
      resources {
        id
        pk
        nameFi
        locationType
      }
    }
  }
`;
export const UnitResourceInfoFieldsFragmentDoc = gql`
  fragment UnitResourceInfoFields on UnitNode {
    id
    pk
    nameFi
    location {
      ...LocationFields
    }
  }
  ${LocationFieldsFragmentDoc}
`;
export const NewResourceUnitFieldsFragmentDoc = gql`
  fragment NewResourceUnitFields on UnitNode {
    ...UnitResourceInfoFields
    spaces {
      id
      pk
      nameFi
    }
  }
  ${UnitResourceInfoFieldsFragmentDoc}
`;
export const SpacesTableFragmentDoc = gql`
  fragment SpacesTable on UnitNode {
    ...NewResourceUnitFields
    spaces {
      id
      pk
      code
      surfaceArea
      maxPersons
      resources {
        id
      }
      children {
        id
      }
    }
  }
  ${NewResourceUnitFieldsFragmentDoc}
`;
export const UnitTableElementFragmentDoc = gql`
  fragment UnitTableElement on UnitNode {
    id
    nameFi
    pk
    unitGroups {
      id
      nameFi
    }
    reservationUnits {
      id
      pk
    }
  }
`;
export const ImageFragmentDoc = gql`
  fragment Image on ReservationUnitImageNode {
    id
    imageUrl
    largeUrl
    mediumUrl
    smallUrl
    imageType
  }
`;
export const ReservationUnitCardFragmentDoc = gql`
  fragment ReservationUnitCard on ReservationUnitNode {
    id
    pk
    nameFi
    maxPersons
    isDraft
    reservationUnitType {
      id
      nameFi
    }
    images {
      ...Image
    }
    purposes {
      id
    }
    resources {
      id
    }
  }
  ${ImageFragmentDoc}
`;
export const BannerNotificationsListAllDocument = gql`
  query BannerNotificationsListAll {
    bannerNotifications(isVisible: true, target: ALL) {
      edges {
        node {
          ...BannerNotificationCommon
        }
      }
    }
  }
  ${BannerNotificationCommonFragmentDoc}
`;

/**
 * __useBannerNotificationsListAllQuery__
 *
 * To run a query within a React component, call `useBannerNotificationsListAllQuery` and pass it any options that fit your needs.
 * When your component renders, `useBannerNotificationsListAllQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBannerNotificationsListAllQuery({
 *   variables: {
 *   },
 * });
 */
export function useBannerNotificationsListAllQuery(
  baseOptions?: Apollo.QueryHookOptions<
    BannerNotificationsListAllQuery,
    BannerNotificationsListAllQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    BannerNotificationsListAllQuery,
    BannerNotificationsListAllQueryVariables
  >(BannerNotificationsListAllDocument, options);
}
export function useBannerNotificationsListAllLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    BannerNotificationsListAllQuery,
    BannerNotificationsListAllQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    BannerNotificationsListAllQuery,
    BannerNotificationsListAllQueryVariables
  >(BannerNotificationsListAllDocument, options);
}
export function useBannerNotificationsListAllSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        BannerNotificationsListAllQuery,
        BannerNotificationsListAllQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    BannerNotificationsListAllQuery,
    BannerNotificationsListAllQueryVariables
  >(BannerNotificationsListAllDocument, options);
}
export type BannerNotificationsListAllQueryHookResult = ReturnType<
  typeof useBannerNotificationsListAllQuery
>;
export type BannerNotificationsListAllLazyQueryHookResult = ReturnType<
  typeof useBannerNotificationsListAllLazyQuery
>;
export type BannerNotificationsListAllSuspenseQueryHookResult = ReturnType<
  typeof useBannerNotificationsListAllSuspenseQuery
>;
export type BannerNotificationsListAllQueryResult = Apollo.QueryResult<
  BannerNotificationsListAllQuery,
  BannerNotificationsListAllQueryVariables
>;
export const BannerNotificationsListDocument = gql`
  query BannerNotificationsList($target: BannerNotificationTarget!) {
    bannerNotifications(isVisible: true, target: $target) {
      edges {
        node {
          ...BannerNotificationCommon
        }
      }
    }
  }
  ${BannerNotificationCommonFragmentDoc}
`;

/**
 * __useBannerNotificationsListQuery__
 *
 * To run a query within a React component, call `useBannerNotificationsListQuery` and pass it any options that fit your needs.
 * When your component renders, `useBannerNotificationsListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBannerNotificationsListQuery({
 *   variables: {
 *      target: // value for 'target'
 *   },
 * });
 */
export function useBannerNotificationsListQuery(
  baseOptions: Apollo.QueryHookOptions<
    BannerNotificationsListQuery,
    BannerNotificationsListQueryVariables
  > &
    (
      | { variables: BannerNotificationsListQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    BannerNotificationsListQuery,
    BannerNotificationsListQueryVariables
  >(BannerNotificationsListDocument, options);
}
export function useBannerNotificationsListLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    BannerNotificationsListQuery,
    BannerNotificationsListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    BannerNotificationsListQuery,
    BannerNotificationsListQueryVariables
  >(BannerNotificationsListDocument, options);
}
export function useBannerNotificationsListSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        BannerNotificationsListQuery,
        BannerNotificationsListQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    BannerNotificationsListQuery,
    BannerNotificationsListQueryVariables
  >(BannerNotificationsListDocument, options);
}
export type BannerNotificationsListQueryHookResult = ReturnType<
  typeof useBannerNotificationsListQuery
>;
export type BannerNotificationsListLazyQueryHookResult = ReturnType<
  typeof useBannerNotificationsListLazyQuery
>;
export type BannerNotificationsListSuspenseQueryHookResult = ReturnType<
  typeof useBannerNotificationsListSuspenseQuery
>;
export type BannerNotificationsListQueryResult = Apollo.QueryResult<
  BannerNotificationsListQuery,
  BannerNotificationsListQueryVariables
>;
export const TermsOfUseDocument = gql`
  query TermsOfUse($termsType: TermsType) {
    termsOfUse(termsType: $termsType) {
      edges {
        node {
          id
          ...TermsOfUseFields
        }
      }
    }
  }
  ${TermsOfUseFieldsFragmentDoc}
`;

/**
 * __useTermsOfUseQuery__
 *
 * To run a query within a React component, call `useTermsOfUseQuery` and pass it any options that fit your needs.
 * When your component renders, `useTermsOfUseQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTermsOfUseQuery({
 *   variables: {
 *      termsType: // value for 'termsType'
 *   },
 * });
 */
export function useTermsOfUseQuery(
  baseOptions?: Apollo.QueryHookOptions<
    TermsOfUseQuery,
    TermsOfUseQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<TermsOfUseQuery, TermsOfUseQueryVariables>(
    TermsOfUseDocument,
    options
  );
}
export function useTermsOfUseLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    TermsOfUseQuery,
    TermsOfUseQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<TermsOfUseQuery, TermsOfUseQueryVariables>(
    TermsOfUseDocument,
    options
  );
}
export function useTermsOfUseSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<TermsOfUseQuery, TermsOfUseQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<TermsOfUseQuery, TermsOfUseQueryVariables>(
    TermsOfUseDocument,
    options
  );
}
export type TermsOfUseQueryHookResult = ReturnType<typeof useTermsOfUseQuery>;
export type TermsOfUseLazyQueryHookResult = ReturnType<
  typeof useTermsOfUseLazyQuery
>;
export type TermsOfUseSuspenseQueryHookResult = ReturnType<
  typeof useTermsOfUseSuspenseQuery
>;
export type TermsOfUseQueryResult = Apollo.QueryResult<
  TermsOfUseQuery,
  TermsOfUseQueryVariables
>;
export const ReservationDateOfBirthDocument = gql`
  query ReservationDateOfBirth($id: ID!) {
    reservation(id: $id) {
      id
      user {
        id
        pk
        dateOfBirth
      }
    }
  }
`;

/**
 * __useReservationDateOfBirthQuery__
 *
 * To run a query within a React component, call `useReservationDateOfBirthQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationDateOfBirthQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationDateOfBirthQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationDateOfBirthQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationDateOfBirthQuery,
    ReservationDateOfBirthQueryVariables
  > &
    (
      | { variables: ReservationDateOfBirthQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationDateOfBirthQuery,
    ReservationDateOfBirthQueryVariables
  >(ReservationDateOfBirthDocument, options);
}
export function useReservationDateOfBirthLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationDateOfBirthQuery,
    ReservationDateOfBirthQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationDateOfBirthQuery,
    ReservationDateOfBirthQueryVariables
  >(ReservationDateOfBirthDocument, options);
}
export function useReservationDateOfBirthSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationDateOfBirthQuery,
        ReservationDateOfBirthQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationDateOfBirthQuery,
    ReservationDateOfBirthQueryVariables
  >(ReservationDateOfBirthDocument, options);
}
export type ReservationDateOfBirthQueryHookResult = ReturnType<
  typeof useReservationDateOfBirthQuery
>;
export type ReservationDateOfBirthLazyQueryHookResult = ReturnType<
  typeof useReservationDateOfBirthLazyQuery
>;
export type ReservationDateOfBirthSuspenseQueryHookResult = ReturnType<
  typeof useReservationDateOfBirthSuspenseQuery
>;
export type ReservationDateOfBirthQueryResult = Apollo.QueryResult<
  ReservationDateOfBirthQuery,
  ReservationDateOfBirthQueryVariables
>;
export const ApplicationDateOfBirthDocument = gql`
  query ApplicationDateOfBirth($id: ID!) {
    application(id: $id) {
      id
      user {
        id
        pk
        dateOfBirth
      }
    }
  }
`;

/**
 * __useApplicationDateOfBirthQuery__
 *
 * To run a query within a React component, call `useApplicationDateOfBirthQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationDateOfBirthQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationDateOfBirthQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationDateOfBirthQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationDateOfBirthQuery,
    ApplicationDateOfBirthQueryVariables
  > &
    (
      | { variables: ApplicationDateOfBirthQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationDateOfBirthQuery,
    ApplicationDateOfBirthQueryVariables
  >(ApplicationDateOfBirthDocument, options);
}
export function useApplicationDateOfBirthLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationDateOfBirthQuery,
    ApplicationDateOfBirthQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationDateOfBirthQuery,
    ApplicationDateOfBirthQueryVariables
  >(ApplicationDateOfBirthDocument, options);
}
export function useApplicationDateOfBirthSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationDateOfBirthQuery,
        ApplicationDateOfBirthQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationDateOfBirthQuery,
    ApplicationDateOfBirthQueryVariables
  >(ApplicationDateOfBirthDocument, options);
}
export type ApplicationDateOfBirthQueryHookResult = ReturnType<
  typeof useApplicationDateOfBirthQuery
>;
export type ApplicationDateOfBirthLazyQueryHookResult = ReturnType<
  typeof useApplicationDateOfBirthLazyQuery
>;
export type ApplicationDateOfBirthSuspenseQueryHookResult = ReturnType<
  typeof useApplicationDateOfBirthSuspenseQuery
>;
export type ApplicationDateOfBirthQueryResult = Apollo.QueryResult<
  ApplicationDateOfBirthQuery,
  ApplicationDateOfBirthQueryVariables
>;
export const DenyReservationDocument = gql`
  mutation DenyReservation($input: ReservationDenyMutationInput!) {
    denyReservation(input: $input) {
      pk
      state
    }
  }
`;
export type DenyReservationMutationFn = Apollo.MutationFunction<
  DenyReservationMutation,
  DenyReservationMutationVariables
>;

/**
 * __useDenyReservationMutation__
 *
 * To run a mutation, you first call `useDenyReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDenyReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [denyReservationMutation, { data, loading, error }] = useDenyReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDenyReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DenyReservationMutation,
    DenyReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DenyReservationMutation,
    DenyReservationMutationVariables
  >(DenyReservationDocument, options);
}
export type DenyReservationMutationHookResult = ReturnType<
  typeof useDenyReservationMutation
>;
export type DenyReservationMutationResult =
  Apollo.MutationResult<DenyReservationMutation>;
export type DenyReservationMutationOptions = Apollo.BaseMutationOptions<
  DenyReservationMutation,
  DenyReservationMutationVariables
>;
export const DenyReservationSeriesDocument = gql`
  mutation DenyReservationSeries($input: ReservationSeriesDenyMutationInput!) {
    denyReservationSeries(input: $input) {
      denied
      future
    }
  }
`;
export type DenyReservationSeriesMutationFn = Apollo.MutationFunction<
  DenyReservationSeriesMutation,
  DenyReservationSeriesMutationVariables
>;

/**
 * __useDenyReservationSeriesMutation__
 *
 * To run a mutation, you first call `useDenyReservationSeriesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDenyReservationSeriesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [denyReservationSeriesMutation, { data, loading, error }] = useDenyReservationSeriesMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDenyReservationSeriesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DenyReservationSeriesMutation,
    DenyReservationSeriesMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DenyReservationSeriesMutation,
    DenyReservationSeriesMutationVariables
  >(DenyReservationSeriesDocument, options);
}
export type DenyReservationSeriesMutationHookResult = ReturnType<
  typeof useDenyReservationSeriesMutation
>;
export type DenyReservationSeriesMutationResult =
  Apollo.MutationResult<DenyReservationSeriesMutation>;
export type DenyReservationSeriesMutationOptions = Apollo.BaseMutationOptions<
  DenyReservationSeriesMutation,
  DenyReservationSeriesMutationVariables
>;
export const RefundReservationDocument = gql`
  mutation RefundReservation($input: ReservationRefundMutationInput!) {
    refundReservation(input: $input) {
      pk
    }
  }
`;
export type RefundReservationMutationFn = Apollo.MutationFunction<
  RefundReservationMutation,
  RefundReservationMutationVariables
>;

/**
 * __useRefundReservationMutation__
 *
 * To run a mutation, you first call `useRefundReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefundReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refundReservationMutation, { data, loading, error }] = useRefundReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRefundReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RefundReservationMutation,
    RefundReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RefundReservationMutation,
    RefundReservationMutationVariables
  >(RefundReservationDocument, options);
}
export type RefundReservationMutationHookResult = ReturnType<
  typeof useRefundReservationMutation
>;
export type RefundReservationMutationResult =
  Apollo.MutationResult<RefundReservationMutation>;
export type RefundReservationMutationOptions = Apollo.BaseMutationOptions<
  RefundReservationMutation,
  RefundReservationMutationVariables
>;
export const StaffAdjustReservationTimeDocument = gql`
  mutation StaffAdjustReservationTime(
    $input: ReservationStaffAdjustTimeMutationInput!
  ) {
    staffAdjustReservationTime(input: $input) {
      pk
      begin
      end
      state
    }
  }
`;
export type StaffAdjustReservationTimeMutationFn = Apollo.MutationFunction<
  StaffAdjustReservationTimeMutation,
  StaffAdjustReservationTimeMutationVariables
>;

/**
 * __useStaffAdjustReservationTimeMutation__
 *
 * To run a mutation, you first call `useStaffAdjustReservationTimeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useStaffAdjustReservationTimeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [staffAdjustReservationTimeMutation, { data, loading, error }] = useStaffAdjustReservationTimeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useStaffAdjustReservationTimeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    StaffAdjustReservationTimeMutation,
    StaffAdjustReservationTimeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    StaffAdjustReservationTimeMutation,
    StaffAdjustReservationTimeMutationVariables
  >(StaffAdjustReservationTimeDocument, options);
}
export type StaffAdjustReservationTimeMutationHookResult = ReturnType<
  typeof useStaffAdjustReservationTimeMutation
>;
export type StaffAdjustReservationTimeMutationResult =
  Apollo.MutationResult<StaffAdjustReservationTimeMutation>;
export type StaffAdjustReservationTimeMutationOptions =
  Apollo.BaseMutationOptions<
    StaffAdjustReservationTimeMutation,
    StaffAdjustReservationTimeMutationVariables
  >;
export const AddReservationToSeriesDocument = gql`
  mutation AddReservationToSeries($input: ReservationSeriesAddMutationInput!) {
    addReservationToSeries(input: $input) {
      pk
    }
  }
`;
export type AddReservationToSeriesMutationFn = Apollo.MutationFunction<
  AddReservationToSeriesMutation,
  AddReservationToSeriesMutationVariables
>;

/**
 * __useAddReservationToSeriesMutation__
 *
 * To run a mutation, you first call `useAddReservationToSeriesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddReservationToSeriesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addReservationToSeriesMutation, { data, loading, error }] = useAddReservationToSeriesMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddReservationToSeriesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    AddReservationToSeriesMutation,
    AddReservationToSeriesMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    AddReservationToSeriesMutation,
    AddReservationToSeriesMutationVariables
  >(AddReservationToSeriesDocument, options);
}
export type AddReservationToSeriesMutationHookResult = ReturnType<
  typeof useAddReservationToSeriesMutation
>;
export type AddReservationToSeriesMutationResult =
  Apollo.MutationResult<AddReservationToSeriesMutation>;
export type AddReservationToSeriesMutationOptions = Apollo.BaseMutationOptions<
  AddReservationToSeriesMutation,
  AddReservationToSeriesMutationVariables
>;
export const UpdateReservationWorkingMemoDocument = gql`
  mutation UpdateReservationWorkingMemo($pk: Int!, $workingMemo: String!) {
    updateReservationWorkingMemo(
      input: { pk: $pk, workingMemo: $workingMemo }
    ) {
      pk
      workingMemo
    }
  }
`;
export type UpdateReservationWorkingMemoMutationFn = Apollo.MutationFunction<
  UpdateReservationWorkingMemoMutation,
  UpdateReservationWorkingMemoMutationVariables
>;

/**
 * __useUpdateReservationWorkingMemoMutation__
 *
 * To run a mutation, you first call `useUpdateReservationWorkingMemoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateReservationWorkingMemoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateReservationWorkingMemoMutation, { data, loading, error }] = useUpdateReservationWorkingMemoMutation({
 *   variables: {
 *      pk: // value for 'pk'
 *      workingMemo: // value for 'workingMemo'
 *   },
 * });
 */
export function useUpdateReservationWorkingMemoMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateReservationWorkingMemoMutation,
    UpdateReservationWorkingMemoMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateReservationWorkingMemoMutation,
    UpdateReservationWorkingMemoMutationVariables
  >(UpdateReservationWorkingMemoDocument, options);
}
export type UpdateReservationWorkingMemoMutationHookResult = ReturnType<
  typeof useUpdateReservationWorkingMemoMutation
>;
export type UpdateReservationWorkingMemoMutationResult =
  Apollo.MutationResult<UpdateReservationWorkingMemoMutation>;
export type UpdateReservationWorkingMemoMutationOptions =
  Apollo.BaseMutationOptions<
    UpdateReservationWorkingMemoMutation,
    UpdateReservationWorkingMemoMutationVariables
  >;
export const UpdateApplicationWorkingMemoDocument = gql`
  mutation UpdateApplicationWorkingMemo($pk: Int!, $workingMemo: String!) {
    updateApplicationWorkingMemo(
      input: { pk: $pk, workingMemo: $workingMemo }
    ) {
      pk
      workingMemo
    }
  }
`;
export type UpdateApplicationWorkingMemoMutationFn = Apollo.MutationFunction<
  UpdateApplicationWorkingMemoMutation,
  UpdateApplicationWorkingMemoMutationVariables
>;

/**
 * __useUpdateApplicationWorkingMemoMutation__
 *
 * To run a mutation, you first call `useUpdateApplicationWorkingMemoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateApplicationWorkingMemoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateApplicationWorkingMemoMutation, { data, loading, error }] = useUpdateApplicationWorkingMemoMutation({
 *   variables: {
 *      pk: // value for 'pk'
 *      workingMemo: // value for 'workingMemo'
 *   },
 * });
 */
export function useUpdateApplicationWorkingMemoMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateApplicationWorkingMemoMutation,
    UpdateApplicationWorkingMemoMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateApplicationWorkingMemoMutation,
    UpdateApplicationWorkingMemoMutationVariables
  >(UpdateApplicationWorkingMemoDocument, options);
}
export type UpdateApplicationWorkingMemoMutationHookResult = ReturnType<
  typeof useUpdateApplicationWorkingMemoMutation
>;
export type UpdateApplicationWorkingMemoMutationResult =
  Apollo.MutationResult<UpdateApplicationWorkingMemoMutation>;
export type UpdateApplicationWorkingMemoMutationOptions =
  Apollo.BaseMutationOptions<
    UpdateApplicationWorkingMemoMutation,
    UpdateApplicationWorkingMemoMutationVariables
  >;
export const ReservationsByReservationUnitDocument = gql`
  query ReservationsByReservationUnit(
    $id: ID!
    $pk: Int!
    $beginDate: Date
    $endDate: Date
    $state: [ReservationStateChoice]
  ) {
    reservationUnit(id: $id) {
      id
      reservations(state: $state, beginDate: $beginDate, endDate: $endDate) {
        ...CalendarReservation
        ...CombineAffectedReservations
      }
    }
    affectingReservations(
      forReservationUnits: [$pk]
      state: $state
      beginDate: $beginDate
      endDate: $endDate
    ) {
      ...CalendarReservation
      ...CombineAffectedReservations
    }
  }
  ${CalendarReservationFragmentDoc}
  ${CombineAffectedReservationsFragmentDoc}
`;

/**
 * __useReservationsByReservationUnitQuery__
 *
 * To run a query within a React component, call `useReservationsByReservationUnitQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationsByReservationUnitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationsByReservationUnitQuery({
 *   variables: {
 *      id: // value for 'id'
 *      pk: // value for 'pk'
 *      beginDate: // value for 'beginDate'
 *      endDate: // value for 'endDate'
 *      state: // value for 'state'
 *   },
 * });
 */
export function useReservationsByReservationUnitQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationsByReservationUnitQuery,
    ReservationsByReservationUnitQueryVariables
  > &
    (
      | {
          variables: ReservationsByReservationUnitQueryVariables;
          skip?: boolean;
        }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationsByReservationUnitQuery,
    ReservationsByReservationUnitQueryVariables
  >(ReservationsByReservationUnitDocument, options);
}
export function useReservationsByReservationUnitLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationsByReservationUnitQuery,
    ReservationsByReservationUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationsByReservationUnitQuery,
    ReservationsByReservationUnitQueryVariables
  >(ReservationsByReservationUnitDocument, options);
}
export function useReservationsByReservationUnitSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationsByReservationUnitQuery,
        ReservationsByReservationUnitQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationsByReservationUnitQuery,
    ReservationsByReservationUnitQueryVariables
  >(ReservationsByReservationUnitDocument, options);
}
export type ReservationsByReservationUnitQueryHookResult = ReturnType<
  typeof useReservationsByReservationUnitQuery
>;
export type ReservationsByReservationUnitLazyQueryHookResult = ReturnType<
  typeof useReservationsByReservationUnitLazyQuery
>;
export type ReservationsByReservationUnitSuspenseQueryHookResult = ReturnType<
  typeof useReservationsByReservationUnitSuspenseQuery
>;
export type ReservationsByReservationUnitQueryResult = Apollo.QueryResult<
  ReservationsByReservationUnitQuery,
  ReservationsByReservationUnitQueryVariables
>;
export const CheckPermissionsDocument = gql`
  query CheckPermissions(
    $permission: UserPermissionChoice!
    $units: [Int!]
    $requireAll: Boolean = false
  ) {
    checkPermissions(
      permission: $permission
      units: $units
      requireAll: $requireAll
    ) {
      hasPermission
    }
  }
`;

/**
 * __useCheckPermissionsQuery__
 *
 * To run a query within a React component, call `useCheckPermissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCheckPermissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCheckPermissionsQuery({
 *   variables: {
 *      permission: // value for 'permission'
 *      units: // value for 'units'
 *      requireAll: // value for 'requireAll'
 *   },
 * });
 */
export function useCheckPermissionsQuery(
  baseOptions: Apollo.QueryHookOptions<
    CheckPermissionsQuery,
    CheckPermissionsQueryVariables
  > &
    (
      | { variables: CheckPermissionsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<CheckPermissionsQuery, CheckPermissionsQueryVariables>(
    CheckPermissionsDocument,
    options
  );
}
export function useCheckPermissionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    CheckPermissionsQuery,
    CheckPermissionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    CheckPermissionsQuery,
    CheckPermissionsQueryVariables
  >(CheckPermissionsDocument, options);
}
export function useCheckPermissionsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        CheckPermissionsQuery,
        CheckPermissionsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    CheckPermissionsQuery,
    CheckPermissionsQueryVariables
  >(CheckPermissionsDocument, options);
}
export type CheckPermissionsQueryHookResult = ReturnType<
  typeof useCheckPermissionsQuery
>;
export type CheckPermissionsLazyQueryHookResult = ReturnType<
  typeof useCheckPermissionsLazyQuery
>;
export type CheckPermissionsSuspenseQueryHookResult = ReturnType<
  typeof useCheckPermissionsSuspenseQuery
>;
export type CheckPermissionsQueryResult = Apollo.QueryResult<
  CheckPermissionsQuery,
  CheckPermissionsQueryVariables
>;
export const ReservationDenyReasonsDocument = gql`
  query ReservationDenyReasons(
    $orderBy: [ReservationDenyReasonOrderingChoices]
  ) {
    reservationDenyReasons(orderBy: $orderBy) {
      edges {
        node {
          id
          pk
          reasonFi
        }
      }
    }
  }
`;

/**
 * __useReservationDenyReasonsQuery__
 *
 * To run a query within a React component, call `useReservationDenyReasonsQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationDenyReasonsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationDenyReasonsQuery({
 *   variables: {
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useReservationDenyReasonsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ReservationDenyReasonsQuery,
    ReservationDenyReasonsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationDenyReasonsQuery,
    ReservationDenyReasonsQueryVariables
  >(ReservationDenyReasonsDocument, options);
}
export function useReservationDenyReasonsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationDenyReasonsQuery,
    ReservationDenyReasonsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationDenyReasonsQuery,
    ReservationDenyReasonsQueryVariables
  >(ReservationDenyReasonsDocument, options);
}
export function useReservationDenyReasonsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationDenyReasonsQuery,
        ReservationDenyReasonsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationDenyReasonsQuery,
    ReservationDenyReasonsQueryVariables
  >(ReservationDenyReasonsDocument, options);
}
export type ReservationDenyReasonsQueryHookResult = ReturnType<
  typeof useReservationDenyReasonsQuery
>;
export type ReservationDenyReasonsLazyQueryHookResult = ReturnType<
  typeof useReservationDenyReasonsLazyQuery
>;
export type ReservationDenyReasonsSuspenseQueryHookResult = ReturnType<
  typeof useReservationDenyReasonsSuspenseQuery
>;
export type ReservationDenyReasonsQueryResult = Apollo.QueryResult<
  ReservationDenyReasonsQuery,
  ReservationDenyReasonsQueryVariables
>;
export const HandlingDataDocument = gql`
  query HandlingData($beginDate: Date!, $state: [ReservationStateChoice]!) {
    reservations(
      state: $state
      beginDate: $beginDate
      onlyWithHandlingPermission: true
    ) {
      edges {
        node {
          id
          pk
        }
      }
    }
    unitsAll(onlyWithPermission: true) {
      id
    }
  }
`;

/**
 * __useHandlingDataQuery__
 *
 * To run a query within a React component, call `useHandlingDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useHandlingDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHandlingDataQuery({
 *   variables: {
 *      beginDate: // value for 'beginDate'
 *      state: // value for 'state'
 *   },
 * });
 */
export function useHandlingDataQuery(
  baseOptions: Apollo.QueryHookOptions<
    HandlingDataQuery,
    HandlingDataQueryVariables
  > &
    (
      | { variables: HandlingDataQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<HandlingDataQuery, HandlingDataQueryVariables>(
    HandlingDataDocument,
    options
  );
}
export function useHandlingDataLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    HandlingDataQuery,
    HandlingDataQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<HandlingDataQuery, HandlingDataQueryVariables>(
    HandlingDataDocument,
    options
  );
}
export function useHandlingDataSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        HandlingDataQuery,
        HandlingDataQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<HandlingDataQuery, HandlingDataQueryVariables>(
    HandlingDataDocument,
    options
  );
}
export type HandlingDataQueryHookResult = ReturnType<
  typeof useHandlingDataQuery
>;
export type HandlingDataLazyQueryHookResult = ReturnType<
  typeof useHandlingDataLazyQuery
>;
export type HandlingDataSuspenseQueryHookResult = ReturnType<
  typeof useHandlingDataSuspenseQuery
>;
export type HandlingDataQueryResult = Apollo.QueryResult<
  HandlingDataQuery,
  HandlingDataQueryVariables
>;
export const OptionsDocument = gql`
  query Options(
    $reservationPurposesOrderBy: [ReservationPurposeOrderingChoices]
  ) {
    reservationPurposes(orderBy: $reservationPurposesOrderBy) {
      edges {
        node {
          id
          pk
          nameFi
        }
      }
    }
    ageGroups {
      edges {
        node {
          id
          pk
          minimum
          maximum
        }
      }
    }
    cities {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
    }
  }
`;

/**
 * __useOptionsQuery__
 *
 * To run a query within a React component, call `useOptionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useOptionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOptionsQuery({
 *   variables: {
 *      reservationPurposesOrderBy: // value for 'reservationPurposesOrderBy'
 *   },
 * });
 */
export function useOptionsQuery(
  baseOptions?: Apollo.QueryHookOptions<OptionsQuery, OptionsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<OptionsQuery, OptionsQueryVariables>(
    OptionsDocument,
    options
  );
}
export function useOptionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<OptionsQuery, OptionsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<OptionsQuery, OptionsQueryVariables>(
    OptionsDocument,
    options
  );
}
export function useOptionsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<OptionsQuery, OptionsQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<OptionsQuery, OptionsQueryVariables>(
    OptionsDocument,
    options
  );
}
export type OptionsQueryHookResult = ReturnType<typeof useOptionsQuery>;
export type OptionsLazyQueryHookResult = ReturnType<typeof useOptionsLazyQuery>;
export type OptionsSuspenseQueryHookResult = ReturnType<
  typeof useOptionsSuspenseQuery
>;
export type OptionsQueryResult = Apollo.QueryResult<
  OptionsQuery,
  OptionsQueryVariables
>;
export const RecurringReservationDocument = gql`
  query RecurringReservation($id: ID!) {
    recurringReservation(id: $id) {
      ...RecurringReservationFields
      reservations {
        id
        handlingDetails
      }
    }
  }
  ${RecurringReservationFieldsFragmentDoc}
`;

/**
 * __useRecurringReservationQuery__
 *
 * To run a query within a React component, call `useRecurringReservationQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecurringReservationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecurringReservationQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRecurringReservationQuery(
  baseOptions: Apollo.QueryHookOptions<
    RecurringReservationQuery,
    RecurringReservationQueryVariables
  > &
    (
      | { variables: RecurringReservationQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    RecurringReservationQuery,
    RecurringReservationQueryVariables
  >(RecurringReservationDocument, options);
}
export function useRecurringReservationLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    RecurringReservationQuery,
    RecurringReservationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    RecurringReservationQuery,
    RecurringReservationQueryVariables
  >(RecurringReservationDocument, options);
}
export function useRecurringReservationSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        RecurringReservationQuery,
        RecurringReservationQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    RecurringReservationQuery,
    RecurringReservationQueryVariables
  >(RecurringReservationDocument, options);
}
export type RecurringReservationQueryHookResult = ReturnType<
  typeof useRecurringReservationQuery
>;
export type RecurringReservationLazyQueryHookResult = ReturnType<
  typeof useRecurringReservationLazyQuery
>;
export type RecurringReservationSuspenseQueryHookResult = ReturnType<
  typeof useRecurringReservationSuspenseQuery
>;
export type RecurringReservationQueryResult = Apollo.QueryResult<
  RecurringReservationQuery,
  RecurringReservationQueryVariables
>;
export const ReservationUnitsFilterParamsDocument = gql`
  query ReservationUnitsFilterParams(
    $unit: [Int]
    $orderBy: [ReservationUnitOrderingChoices]
  ) {
    reservationUnitsAll(
      onlyWithPermission: true
      unit: $unit
      orderBy: $orderBy
    ) {
      id
      nameFi
      pk
    }
  }
`;

/**
 * __useReservationUnitsFilterParamsQuery__
 *
 * To run a query within a React component, call `useReservationUnitsFilterParamsQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationUnitsFilterParamsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationUnitsFilterParamsQuery({
 *   variables: {
 *      unit: // value for 'unit'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useReservationUnitsFilterParamsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ReservationUnitsFilterParamsQuery,
    ReservationUnitsFilterParamsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationUnitsFilterParamsQuery,
    ReservationUnitsFilterParamsQueryVariables
  >(ReservationUnitsFilterParamsDocument, options);
}
export function useReservationUnitsFilterParamsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationUnitsFilterParamsQuery,
    ReservationUnitsFilterParamsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationUnitsFilterParamsQuery,
    ReservationUnitsFilterParamsQueryVariables
  >(ReservationUnitsFilterParamsDocument, options);
}
export function useReservationUnitsFilterParamsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationUnitsFilterParamsQuery,
        ReservationUnitsFilterParamsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationUnitsFilterParamsQuery,
    ReservationUnitsFilterParamsQueryVariables
  >(ReservationUnitsFilterParamsDocument, options);
}
export type ReservationUnitsFilterParamsQueryHookResult = ReturnType<
  typeof useReservationUnitsFilterParamsQuery
>;
export type ReservationUnitsFilterParamsLazyQueryHookResult = ReturnType<
  typeof useReservationUnitsFilterParamsLazyQuery
>;
export type ReservationUnitsFilterParamsSuspenseQueryHookResult = ReturnType<
  typeof useReservationUnitsFilterParamsSuspenseQuery
>;
export type ReservationUnitsFilterParamsQueryResult = Apollo.QueryResult<
  ReservationUnitsFilterParamsQuery,
  ReservationUnitsFilterParamsQueryVariables
>;
export const ReservationUnitTypesFilterDocument = gql`
  query ReservationUnitTypesFilter(
    $after: String
    $orderBy: [ReservationUnitTypeOrderingChoices]
  ) {
    reservationUnitTypes(after: $after, orderBy: $orderBy) {
      edges {
        node {
          id
          pk
          nameFi
        }
      }
      totalCount
    }
  }
`;

/**
 * __useReservationUnitTypesFilterQuery__
 *
 * To run a query within a React component, call `useReservationUnitTypesFilterQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationUnitTypesFilterQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationUnitTypesFilterQuery({
 *   variables: {
 *      after: // value for 'after'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useReservationUnitTypesFilterQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ReservationUnitTypesFilterQuery,
    ReservationUnitTypesFilterQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationUnitTypesFilterQuery,
    ReservationUnitTypesFilterQueryVariables
  >(ReservationUnitTypesFilterDocument, options);
}
export function useReservationUnitTypesFilterLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationUnitTypesFilterQuery,
    ReservationUnitTypesFilterQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationUnitTypesFilterQuery,
    ReservationUnitTypesFilterQueryVariables
  >(ReservationUnitTypesFilterDocument, options);
}
export function useReservationUnitTypesFilterSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationUnitTypesFilterQuery,
        ReservationUnitTypesFilterQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationUnitTypesFilterQuery,
    ReservationUnitTypesFilterQueryVariables
  >(ReservationUnitTypesFilterDocument, options);
}
export type ReservationUnitTypesFilterQueryHookResult = ReturnType<
  typeof useReservationUnitTypesFilterQuery
>;
export type ReservationUnitTypesFilterLazyQueryHookResult = ReturnType<
  typeof useReservationUnitTypesFilterLazyQuery
>;
export type ReservationUnitTypesFilterSuspenseQueryHookResult = ReturnType<
  typeof useReservationUnitTypesFilterSuspenseQuery
>;
export type ReservationUnitTypesFilterQueryResult = Apollo.QueryResult<
  ReservationUnitTypesFilterQuery,
  ReservationUnitTypesFilterQueryVariables
>;
export const UnitsFilterDocument = gql`
  query UnitsFilter($orderBy: [UnitOrderingChoices]) {
    unitsAll(onlyWithPermission: true, orderBy: $orderBy) {
      id
      nameFi
      pk
    }
  }
`;

/**
 * __useUnitsFilterQuery__
 *
 * To run a query within a React component, call `useUnitsFilterQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnitsFilterQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnitsFilterQuery({
 *   variables: {
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useUnitsFilterQuery(
  baseOptions?: Apollo.QueryHookOptions<
    UnitsFilterQuery,
    UnitsFilterQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<UnitsFilterQuery, UnitsFilterQueryVariables>(
    UnitsFilterDocument,
    options
  );
}
export function useUnitsFilterLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    UnitsFilterQuery,
    UnitsFilterQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<UnitsFilterQuery, UnitsFilterQueryVariables>(
    UnitsFilterDocument,
    options
  );
}
export function useUnitsFilterSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        UnitsFilterQuery,
        UnitsFilterQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<UnitsFilterQuery, UnitsFilterQueryVariables>(
    UnitsFilterDocument,
    options
  );
}
export type UnitsFilterQueryHookResult = ReturnType<typeof useUnitsFilterQuery>;
export type UnitsFilterLazyQueryHookResult = ReturnType<
  typeof useUnitsFilterLazyQuery
>;
export type UnitsFilterSuspenseQueryHookResult = ReturnType<
  typeof useUnitsFilterSuspenseQuery
>;
export type UnitsFilterQueryResult = Apollo.QueryResult<
  UnitsFilterQuery,
  UnitsFilterQueryVariables
>;
export const CurrentUserDocument = gql`
  query CurrentUser {
    currentUser {
      id
      username
      firstName
      lastName
      email
      isSuperuser
      pk
      unitRoles {
        id
        permissions
        units {
          id
          pk
          nameFi
        }
        unitGroups {
          id
          units {
            id
            pk
          }
        }
        role
      }
      generalRoles {
        id
        permissions
        role
      }
    }
  }
`;

/**
 * __useCurrentUserQuery__
 *
 * To run a query within a React component, call `useCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useCurrentUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    CurrentUserQuery,
    CurrentUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(
    CurrentUserDocument,
    options
  );
}
export function useCurrentUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    CurrentUserQuery,
    CurrentUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<CurrentUserQuery, CurrentUserQueryVariables>(
    CurrentUserDocument,
    options
  );
}
export function useCurrentUserSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        CurrentUserQuery,
        CurrentUserQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<CurrentUserQuery, CurrentUserQueryVariables>(
    CurrentUserDocument,
    options
  );
}
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<
  typeof useCurrentUserLazyQuery
>;
export type CurrentUserSuspenseQueryHookResult = ReturnType<
  typeof useCurrentUserSuspenseQuery
>;
export type CurrentUserQueryResult = Apollo.QueryResult<
  CurrentUserQuery,
  CurrentUserQueryVariables
>;
export const ReservationUnitEditDocument = gql`
  query ReservationUnitEdit($id: ID!) {
    reservationUnit(id: $id) {
      id
      pk
      publishingState
      reservationState
      images {
        pk
        ...Image
      }
      haukiUrl
      cancellationRule {
        id
        pk
      }
      requireReservationHandling
      nameFi
      nameSv
      nameEn
      isDraft
      authentication
      spaces {
        id
        pk
        nameFi
      }
      resources {
        id
        pk
        nameFi
      }
      purposes {
        id
        pk
        nameFi
      }
      paymentTypes {
        id
        code
      }
      pricingTerms {
        id
        pk
      }
      reservationUnitType {
        id
        pk
        nameFi
      }
      uuid
      requireAdultReservee
      termsOfUseFi
      termsOfUseSv
      termsOfUseEn
      reservationKind
      reservationPendingInstructionsFi
      reservationPendingInstructionsSv
      reservationPendingInstructionsEn
      reservationConfirmedInstructionsFi
      reservationConfirmedInstructionsSv
      reservationConfirmedInstructionsEn
      reservationCancelledInstructionsFi
      reservationCancelledInstructionsSv
      reservationCancelledInstructionsEn
      maxReservationDuration
      minReservationDuration
      reservationStartInterval
      canApplyFreeOfCharge
      reservationsMinDaysBefore
      reservationsMaxDaysBefore
      equipments {
        id
        pk
        nameFi
      }
      qualifiers {
        id
        pk
        nameFi
      }
      unit {
        ...ReservationUnitEditUnit
      }
      minPersons
      maxPersons
      surfaceArea
      descriptionFi
      descriptionSv
      descriptionEn
      paymentTerms {
        id
        pk
      }
      cancellationTerms {
        id
        pk
      }
      serviceSpecificTerms {
        id
        pk
      }
      reservationBlockWholeDay
      bufferTimeBefore
      bufferTimeAfter
      reservationBegins
      contactInformation
      reservationEnds
      publishBegins
      publishEnds
      maxReservationsPerUser
      metadataSet {
        id
        pk
      }
      pricings {
        pk
        ...PricingFields
        lowestPriceNet
        highestPriceNet
      }
      applicationRoundTimeSlots {
        ...ApplicationRoundTimeSlots
      }
      accessTypes(isActiveOrFuture: true) {
        id
        pk
        accessType
        beginDate
      }
    }
  }
  ${ImageFragmentDoc}
  ${ReservationUnitEditUnitFragmentDoc}
  ${PricingFieldsFragmentDoc}
  ${ApplicationRoundTimeSlotsFragmentDoc}
`;

/**
 * __useReservationUnitEditQuery__
 *
 * To run a query within a React component, call `useReservationUnitEditQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationUnitEditQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationUnitEditQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationUnitEditQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationUnitEditQuery,
    ReservationUnitEditQueryVariables
  > &
    (
      | { variables: ReservationUnitEditQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationUnitEditQuery,
    ReservationUnitEditQueryVariables
  >(ReservationUnitEditDocument, options);
}
export function useReservationUnitEditLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationUnitEditQuery,
    ReservationUnitEditQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationUnitEditQuery,
    ReservationUnitEditQueryVariables
  >(ReservationUnitEditDocument, options);
}
export function useReservationUnitEditSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationUnitEditQuery,
        ReservationUnitEditQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationUnitEditQuery,
    ReservationUnitEditQueryVariables
  >(ReservationUnitEditDocument, options);
}
export type ReservationUnitEditQueryHookResult = ReturnType<
  typeof useReservationUnitEditQuery
>;
export type ReservationUnitEditLazyQueryHookResult = ReturnType<
  typeof useReservationUnitEditLazyQuery
>;
export type ReservationUnitEditSuspenseQueryHookResult = ReturnType<
  typeof useReservationUnitEditSuspenseQuery
>;
export type ReservationUnitEditQueryResult = Apollo.QueryResult<
  ReservationUnitEditQuery,
  ReservationUnitEditQueryVariables
>;
export const UpdateReservationUnitDocument = gql`
  mutation UpdateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
    updateReservationUnit(input: $input) {
      pk
    }
  }
`;
export type UpdateReservationUnitMutationFn = Apollo.MutationFunction<
  UpdateReservationUnitMutation,
  UpdateReservationUnitMutationVariables
>;

/**
 * __useUpdateReservationUnitMutation__
 *
 * To run a mutation, you first call `useUpdateReservationUnitMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateReservationUnitMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateReservationUnitMutation, { data, loading, error }] = useUpdateReservationUnitMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateReservationUnitMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateReservationUnitMutation,
    UpdateReservationUnitMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateReservationUnitMutation,
    UpdateReservationUnitMutationVariables
  >(UpdateReservationUnitDocument, options);
}
export type UpdateReservationUnitMutationHookResult = ReturnType<
  typeof useUpdateReservationUnitMutation
>;
export type UpdateReservationUnitMutationResult =
  Apollo.MutationResult<UpdateReservationUnitMutation>;
export type UpdateReservationUnitMutationOptions = Apollo.BaseMutationOptions<
  UpdateReservationUnitMutation,
  UpdateReservationUnitMutationVariables
>;
export const CreateReservationUnitDocument = gql`
  mutation CreateReservationUnit($input: ReservationUnitCreateMutationInput!) {
    createReservationUnit(input: $input) {
      pk
    }
  }
`;
export type CreateReservationUnitMutationFn = Apollo.MutationFunction<
  CreateReservationUnitMutation,
  CreateReservationUnitMutationVariables
>;

/**
 * __useCreateReservationUnitMutation__
 *
 * To run a mutation, you first call `useCreateReservationUnitMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateReservationUnitMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createReservationUnitMutation, { data, loading, error }] = useCreateReservationUnitMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateReservationUnitMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateReservationUnitMutation,
    CreateReservationUnitMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateReservationUnitMutation,
    CreateReservationUnitMutationVariables
  >(CreateReservationUnitDocument, options);
}
export type CreateReservationUnitMutationHookResult = ReturnType<
  typeof useCreateReservationUnitMutation
>;
export type CreateReservationUnitMutationResult =
  Apollo.MutationResult<CreateReservationUnitMutation>;
export type CreateReservationUnitMutationOptions = Apollo.BaseMutationOptions<
  CreateReservationUnitMutation,
  CreateReservationUnitMutationVariables
>;
export const CreateImageDocument = gql`
  mutation CreateImage(
    $image: Upload!
    $reservationUnit: Int!
    $imageType: ImageType!
  ) {
    createReservationUnitImage(
      input: {
        image: $image
        reservationUnit: $reservationUnit
        imageType: $imageType
      }
    ) {
      pk
    }
  }
`;
export type CreateImageMutationFn = Apollo.MutationFunction<
  CreateImageMutation,
  CreateImageMutationVariables
>;

/**
 * __useCreateImageMutation__
 *
 * To run a mutation, you first call `useCreateImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createImageMutation, { data, loading, error }] = useCreateImageMutation({
 *   variables: {
 *      image: // value for 'image'
 *      reservationUnit: // value for 'reservationUnit'
 *      imageType: // value for 'imageType'
 *   },
 * });
 */
export function useCreateImageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateImageMutation,
    CreateImageMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateImageMutation, CreateImageMutationVariables>(
    CreateImageDocument,
    options
  );
}
export type CreateImageMutationHookResult = ReturnType<
  typeof useCreateImageMutation
>;
export type CreateImageMutationResult =
  Apollo.MutationResult<CreateImageMutation>;
export type CreateImageMutationOptions = Apollo.BaseMutationOptions<
  CreateImageMutation,
  CreateImageMutationVariables
>;
export const DeleteImageDocument = gql`
  mutation DeleteImage($pk: ID!) {
    deleteReservationUnitImage(input: { pk: $pk }) {
      deleted
    }
  }
`;
export type DeleteImageMutationFn = Apollo.MutationFunction<
  DeleteImageMutation,
  DeleteImageMutationVariables
>;

/**
 * __useDeleteImageMutation__
 *
 * To run a mutation, you first call `useDeleteImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteImageMutation, { data, loading, error }] = useDeleteImageMutation({
 *   variables: {
 *      pk: // value for 'pk'
 *   },
 * });
 */
export function useDeleteImageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteImageMutation,
    DeleteImageMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteImageMutation, DeleteImageMutationVariables>(
    DeleteImageDocument,
    options
  );
}
export type DeleteImageMutationHookResult = ReturnType<
  typeof useDeleteImageMutation
>;
export type DeleteImageMutationResult =
  Apollo.MutationResult<DeleteImageMutation>;
export type DeleteImageMutationOptions = Apollo.BaseMutationOptions<
  DeleteImageMutation,
  DeleteImageMutationVariables
>;
export const UpdateImageDocument = gql`
  mutation UpdateImage($pk: Int!, $imageType: ImageType!) {
    updateReservationUnitImage(input: { pk: $pk, imageType: $imageType }) {
      pk
    }
  }
`;
export type UpdateImageMutationFn = Apollo.MutationFunction<
  UpdateImageMutation,
  UpdateImageMutationVariables
>;

/**
 * __useUpdateImageMutation__
 *
 * To run a mutation, you first call `useUpdateImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateImageMutation, { data, loading, error }] = useUpdateImageMutation({
 *   variables: {
 *      pk: // value for 'pk'
 *      imageType: // value for 'imageType'
 *   },
 * });
 */
export function useUpdateImageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateImageMutation,
    UpdateImageMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateImageMutation, UpdateImageMutationVariables>(
    UpdateImageDocument,
    options
  );
}
export type UpdateImageMutationHookResult = ReturnType<
  typeof useUpdateImageMutation
>;
export type UpdateImageMutationResult =
  Apollo.MutationResult<UpdateImageMutation>;
export type UpdateImageMutationOptions = Apollo.BaseMutationOptions<
  UpdateImageMutation,
  UpdateImageMutationVariables
>;
export const ReservationUnitEditorParametersDocument = gql`
  query ReservationUnitEditorParameters(
    $equipmentsOrderBy: EquipmentOrderingChoices
  ) {
    equipmentsAll(orderBy: [$equipmentsOrderBy]) {
      id
      nameFi
      pk
    }
    taxPercentages {
      edges {
        node {
          id
          pk
          value
        }
      }
    }
    purposes {
      edges {
        node {
          id
          pk
          nameFi
        }
      }
    }
    reservationUnitTypes {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
    }
    termsOfUse {
      edges {
        node {
          id
          pk
          nameFi
          termsType
        }
      }
    }
    reservationUnitCancellationRules {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
    }
    metadataSets {
      edges {
        node {
          id
          name
          pk
        }
      }
    }
    qualifiers {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
    }
  }
`;

/**
 * __useReservationUnitEditorParametersQuery__
 *
 * To run a query within a React component, call `useReservationUnitEditorParametersQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationUnitEditorParametersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationUnitEditorParametersQuery({
 *   variables: {
 *      equipmentsOrderBy: // value for 'equipmentsOrderBy'
 *   },
 * });
 */
export function useReservationUnitEditorParametersQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ReservationUnitEditorParametersQuery,
    ReservationUnitEditorParametersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationUnitEditorParametersQuery,
    ReservationUnitEditorParametersQueryVariables
  >(ReservationUnitEditorParametersDocument, options);
}
export function useReservationUnitEditorParametersLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationUnitEditorParametersQuery,
    ReservationUnitEditorParametersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationUnitEditorParametersQuery,
    ReservationUnitEditorParametersQueryVariables
  >(ReservationUnitEditorParametersDocument, options);
}
export function useReservationUnitEditorParametersSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationUnitEditorParametersQuery,
        ReservationUnitEditorParametersQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationUnitEditorParametersQuery,
    ReservationUnitEditorParametersQueryVariables
  >(ReservationUnitEditorParametersDocument, options);
}
export type ReservationUnitEditorParametersQueryHookResult = ReturnType<
  typeof useReservationUnitEditorParametersQuery
>;
export type ReservationUnitEditorParametersLazyQueryHookResult = ReturnType<
  typeof useReservationUnitEditorParametersLazyQuery
>;
export type ReservationUnitEditorParametersSuspenseQueryHookResult = ReturnType<
  typeof useReservationUnitEditorParametersSuspenseQuery
>;
export type ReservationUnitEditorParametersQueryResult = Apollo.QueryResult<
  ReservationUnitEditorParametersQuery,
  ReservationUnitEditorParametersQueryVariables
>;
export const RejectRestDocument = gql`
  mutation RejectRest($input: ReservationUnitOptionUpdateMutationInput!) {
    updateReservationUnitOption(input: $input) {
      pk
      rejected
      locked
    }
  }
`;
export type RejectRestMutationFn = Apollo.MutationFunction<
  RejectRestMutation,
  RejectRestMutationVariables
>;

/**
 * __useRejectRestMutation__
 *
 * To run a mutation, you first call `useRejectRestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRejectRestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rejectRestMutation, { data, loading, error }] = useRejectRestMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRejectRestMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RejectRestMutation,
    RejectRestMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<RejectRestMutation, RejectRestMutationVariables>(
    RejectRestDocument,
    options
  );
}
export type RejectRestMutationHookResult = ReturnType<
  typeof useRejectRestMutation
>;
export type RejectRestMutationResult =
  Apollo.MutationResult<RejectRestMutation>;
export type RejectRestMutationOptions = Apollo.BaseMutationOptions<
  RejectRestMutation,
  RejectRestMutationVariables
>;
export const CreateAllocatedTimeSlotDocument = gql`
  mutation CreateAllocatedTimeSlot(
    $input: AllocatedTimeSlotCreateMutationInput!
  ) {
    createAllocatedTimeslot(input: $input) {
      beginTime
      dayOfTheWeek
      endTime
      pk
      reservationUnitOption
    }
  }
`;
export type CreateAllocatedTimeSlotMutationFn = Apollo.MutationFunction<
  CreateAllocatedTimeSlotMutation,
  CreateAllocatedTimeSlotMutationVariables
>;

/**
 * __useCreateAllocatedTimeSlotMutation__
 *
 * To run a mutation, you first call `useCreateAllocatedTimeSlotMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAllocatedTimeSlotMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAllocatedTimeSlotMutation, { data, loading, error }] = useCreateAllocatedTimeSlotMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateAllocatedTimeSlotMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateAllocatedTimeSlotMutation,
    CreateAllocatedTimeSlotMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateAllocatedTimeSlotMutation,
    CreateAllocatedTimeSlotMutationVariables
  >(CreateAllocatedTimeSlotDocument, options);
}
export type CreateAllocatedTimeSlotMutationHookResult = ReturnType<
  typeof useCreateAllocatedTimeSlotMutation
>;
export type CreateAllocatedTimeSlotMutationResult =
  Apollo.MutationResult<CreateAllocatedTimeSlotMutation>;
export type CreateAllocatedTimeSlotMutationOptions = Apollo.BaseMutationOptions<
  CreateAllocatedTimeSlotMutation,
  CreateAllocatedTimeSlotMutationVariables
>;
export const DeleteAllocatedTimeSlotDocument = gql`
  mutation DeleteAllocatedTimeSlot(
    $input: AllocatedTimeSlotDeleteMutationInput!
  ) {
    deleteAllocatedTimeslot(input: $input) {
      deleted
    }
  }
`;
export type DeleteAllocatedTimeSlotMutationFn = Apollo.MutationFunction<
  DeleteAllocatedTimeSlotMutation,
  DeleteAllocatedTimeSlotMutationVariables
>;

/**
 * __useDeleteAllocatedTimeSlotMutation__
 *
 * To run a mutation, you first call `useDeleteAllocatedTimeSlotMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAllocatedTimeSlotMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAllocatedTimeSlotMutation, { data, loading, error }] = useDeleteAllocatedTimeSlotMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteAllocatedTimeSlotMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteAllocatedTimeSlotMutation,
    DeleteAllocatedTimeSlotMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteAllocatedTimeSlotMutation,
    DeleteAllocatedTimeSlotMutationVariables
  >(DeleteAllocatedTimeSlotDocument, options);
}
export type DeleteAllocatedTimeSlotMutationHookResult = ReturnType<
  typeof useDeleteAllocatedTimeSlotMutation
>;
export type DeleteAllocatedTimeSlotMutationResult =
  Apollo.MutationResult<DeleteAllocatedTimeSlotMutation>;
export type DeleteAllocatedTimeSlotMutationOptions = Apollo.BaseMutationOptions<
  DeleteAllocatedTimeSlotMutation,
  DeleteAllocatedTimeSlotMutationVariables
>;
export const ApplicationSectionAllocationsDocument = gql`
  query ApplicationSectionAllocations(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice]!
    $status: [ApplicationSectionStatusChoice]
    $applicantType: [ApplicantTypeChoice]
    $preferredOrder: [Int]
    $textSearch: String
    $priority: [Priority]
    $purpose: [Int]
    $reservationUnit: Int!
    $beginDate: Date!
    $endDate: Date!
    $ageGroup: [Int]
    $homeCity: [Int]
    $includePreferredOrder10OrHigher: Boolean
    $after: String
  ) {
    applicationSections(
      applicationRound: $applicationRound
      applicationStatus: $applicationStatus
      status: $status
      applicantType: $applicantType
      preferredOrder: $preferredOrder
      textSearch: $textSearch
      priority: $priority
      purpose: $purpose
      reservationUnit: [$reservationUnit]
      ageGroup: $ageGroup
      homeCity: $homeCity
      includePreferredOrder10OrHigher: $includePreferredOrder10OrHigher
      after: $after
    ) {
      edges {
        node {
          ...ApplicationSectionFields
          allocations
          suitableTimeRanges(fulfilled: false) {
            id
            beginTime
            endTime
            dayOfTheWeek
            priority
            fulfilled
          }
          reservationUnitOptions {
            id
            pk
            locked
            rejected
            allocatedTimeSlots {
              pk
              ...AllocatedTimeSlot
              reservationUnitOption {
                id
                pk
                applicationSection {
                  id
                  pk
                }
              }
            }
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
    affectingAllocatedTimeSlots(
      reservationUnit: $reservationUnit
      beginDate: $beginDate
      endDate: $endDate
    ) {
      ...AllocatedTimeSlot
    }
  }
  ${ApplicationSectionFieldsFragmentDoc}
  ${AllocatedTimeSlotFragmentDoc}
`;

/**
 * __useApplicationSectionAllocationsQuery__
 *
 * To run a query within a React component, call `useApplicationSectionAllocationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationSectionAllocationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationSectionAllocationsQuery({
 *   variables: {
 *      applicationRound: // value for 'applicationRound'
 *      applicationStatus: // value for 'applicationStatus'
 *      status: // value for 'status'
 *      applicantType: // value for 'applicantType'
 *      preferredOrder: // value for 'preferredOrder'
 *      textSearch: // value for 'textSearch'
 *      priority: // value for 'priority'
 *      purpose: // value for 'purpose'
 *      reservationUnit: // value for 'reservationUnit'
 *      beginDate: // value for 'beginDate'
 *      endDate: // value for 'endDate'
 *      ageGroup: // value for 'ageGroup'
 *      homeCity: // value for 'homeCity'
 *      includePreferredOrder10OrHigher: // value for 'includePreferredOrder10OrHigher'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useApplicationSectionAllocationsQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationSectionAllocationsQuery,
    ApplicationSectionAllocationsQueryVariables
  > &
    (
      | {
          variables: ApplicationSectionAllocationsQueryVariables;
          skip?: boolean;
        }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationSectionAllocationsQuery,
    ApplicationSectionAllocationsQueryVariables
  >(ApplicationSectionAllocationsDocument, options);
}
export function useApplicationSectionAllocationsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationSectionAllocationsQuery,
    ApplicationSectionAllocationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationSectionAllocationsQuery,
    ApplicationSectionAllocationsQueryVariables
  >(ApplicationSectionAllocationsDocument, options);
}
export function useApplicationSectionAllocationsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationSectionAllocationsQuery,
        ApplicationSectionAllocationsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationSectionAllocationsQuery,
    ApplicationSectionAllocationsQueryVariables
  >(ApplicationSectionAllocationsDocument, options);
}
export type ApplicationSectionAllocationsQueryHookResult = ReturnType<
  typeof useApplicationSectionAllocationsQuery
>;
export type ApplicationSectionAllocationsLazyQueryHookResult = ReturnType<
  typeof useApplicationSectionAllocationsLazyQuery
>;
export type ApplicationSectionAllocationsSuspenseQueryHookResult = ReturnType<
  typeof useApplicationSectionAllocationsSuspenseQuery
>;
export type ApplicationSectionAllocationsQueryResult = Apollo.QueryResult<
  ApplicationSectionAllocationsQuery,
  ApplicationSectionAllocationsQueryVariables
>;
export const AllApplicationEventsDocument = gql`
  query AllApplicationEvents(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice]!
    $unit: [Int]!
    $reservationUnit: [Int]!
  ) {
    applicationSections(
      applicationRound: $applicationRound
      reservationUnit: $reservationUnit
      unit: $unit
      applicationStatus: $applicationStatus
    ) {
      edges {
        node {
          id
          reservationUnitOptions {
            id
            reservationUnit {
              id
              pk
              nameFi
            }
          }
        }
      }
      totalCount
    }
  }
`;

/**
 * __useAllApplicationEventsQuery__
 *
 * To run a query within a React component, call `useAllApplicationEventsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAllApplicationEventsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAllApplicationEventsQuery({
 *   variables: {
 *      applicationRound: // value for 'applicationRound'
 *      applicationStatus: // value for 'applicationStatus'
 *      unit: // value for 'unit'
 *      reservationUnit: // value for 'reservationUnit'
 *   },
 * });
 */
export function useAllApplicationEventsQuery(
  baseOptions: Apollo.QueryHookOptions<
    AllApplicationEventsQuery,
    AllApplicationEventsQueryVariables
  > &
    (
      | { variables: AllApplicationEventsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    AllApplicationEventsQuery,
    AllApplicationEventsQueryVariables
  >(AllApplicationEventsDocument, options);
}
export function useAllApplicationEventsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AllApplicationEventsQuery,
    AllApplicationEventsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    AllApplicationEventsQuery,
    AllApplicationEventsQueryVariables
  >(AllApplicationEventsDocument, options);
}
export function useAllApplicationEventsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        AllApplicationEventsQuery,
        AllApplicationEventsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    AllApplicationEventsQuery,
    AllApplicationEventsQueryVariables
  >(AllApplicationEventsDocument, options);
}
export type AllApplicationEventsQueryHookResult = ReturnType<
  typeof useAllApplicationEventsQuery
>;
export type AllApplicationEventsLazyQueryHookResult = ReturnType<
  typeof useAllApplicationEventsLazyQuery
>;
export type AllApplicationEventsSuspenseQueryHookResult = ReturnType<
  typeof useAllApplicationEventsSuspenseQuery
>;
export type AllApplicationEventsQueryResult = Apollo.QueryResult<
  AllApplicationEventsQuery,
  AllApplicationEventsQueryVariables
>;
export const ApplicationRoundFilterDocument = gql`
  query ApplicationRoundFilter($id: ID!) {
    applicationRound(id: $id) {
      id
      nameFi
      status
      reservationPeriodBegin
      reservationPeriodEnd
      reservationUnits {
        id
        pk
        nameFi
        unit {
          id
          pk
          nameFi
        }
      }
    }
  }
`;

/**
 * __useApplicationRoundFilterQuery__
 *
 * To run a query within a React component, call `useApplicationRoundFilterQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationRoundFilterQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationRoundFilterQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationRoundFilterQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationRoundFilterQuery,
    ApplicationRoundFilterQueryVariables
  > &
    (
      | { variables: ApplicationRoundFilterQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationRoundFilterQuery,
    ApplicationRoundFilterQueryVariables
  >(ApplicationRoundFilterDocument, options);
}
export function useApplicationRoundFilterLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationRoundFilterQuery,
    ApplicationRoundFilterQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationRoundFilterQuery,
    ApplicationRoundFilterQueryVariables
  >(ApplicationRoundFilterDocument, options);
}
export function useApplicationRoundFilterSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationRoundFilterQuery,
        ApplicationRoundFilterQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationRoundFilterQuery,
    ApplicationRoundFilterQueryVariables
  >(ApplicationRoundFilterDocument, options);
}
export type ApplicationRoundFilterQueryHookResult = ReturnType<
  typeof useApplicationRoundFilterQuery
>;
export type ApplicationRoundFilterLazyQueryHookResult = ReturnType<
  typeof useApplicationRoundFilterLazyQuery
>;
export type ApplicationRoundFilterSuspenseQueryHookResult = ReturnType<
  typeof useApplicationRoundFilterSuspenseQuery
>;
export type ApplicationRoundFilterQueryResult = Apollo.QueryResult<
  ApplicationRoundFilterQuery,
  ApplicationRoundFilterQueryVariables
>;
export const ApplicationRoundCriteriaDocument = gql`
  query ApplicationRoundCriteria($id: ID!) {
    applicationRound(id: $id) {
      id
      pk
      nameFi
      reservationUnitCount
      applicationPeriodBegin
      applicationPeriodEnd
      reservationPeriodBegin
      reservationPeriodEnd
      reservationUnits {
        id
        pk
        nameFi
        spaces {
          id
          nameFi
        }
        unit {
          id
          nameFi
        }
      }
    }
  }
`;

/**
 * __useApplicationRoundCriteriaQuery__
 *
 * To run a query within a React component, call `useApplicationRoundCriteriaQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationRoundCriteriaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationRoundCriteriaQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationRoundCriteriaQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationRoundCriteriaQuery,
    ApplicationRoundCriteriaQueryVariables
  > &
    (
      | { variables: ApplicationRoundCriteriaQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationRoundCriteriaQuery,
    ApplicationRoundCriteriaQueryVariables
  >(ApplicationRoundCriteriaDocument, options);
}
export function useApplicationRoundCriteriaLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationRoundCriteriaQuery,
    ApplicationRoundCriteriaQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationRoundCriteriaQuery,
    ApplicationRoundCriteriaQueryVariables
  >(ApplicationRoundCriteriaDocument, options);
}
export function useApplicationRoundCriteriaSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationRoundCriteriaQuery,
        ApplicationRoundCriteriaQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationRoundCriteriaQuery,
    ApplicationRoundCriteriaQueryVariables
  >(ApplicationRoundCriteriaDocument, options);
}
export type ApplicationRoundCriteriaQueryHookResult = ReturnType<
  typeof useApplicationRoundCriteriaQuery
>;
export type ApplicationRoundCriteriaLazyQueryHookResult = ReturnType<
  typeof useApplicationRoundCriteriaLazyQuery
>;
export type ApplicationRoundCriteriaSuspenseQueryHookResult = ReturnType<
  typeof useApplicationRoundCriteriaSuspenseQuery
>;
export type ApplicationRoundCriteriaQueryResult = Apollo.QueryResult<
  ApplicationRoundCriteriaQuery,
  ApplicationRoundCriteriaQueryVariables
>;
export const ApplicationRoundDocument = gql`
  query ApplicationRound($id: ID!) {
    applicationRound(id: $id) {
      ...ApplicationRoundAdmin
    }
  }
  ${ApplicationRoundAdminFragmentDoc}
`;

/**
 * __useApplicationRoundQuery__
 *
 * To run a query within a React component, call `useApplicationRoundQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationRoundQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationRoundQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationRoundQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationRoundQuery,
    ApplicationRoundQueryVariables
  > &
    (
      | { variables: ApplicationRoundQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ApplicationRoundQuery, ApplicationRoundQueryVariables>(
    ApplicationRoundDocument,
    options
  );
}
export function useApplicationRoundLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationRoundQuery,
    ApplicationRoundQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationRoundQuery,
    ApplicationRoundQueryVariables
  >(ApplicationRoundDocument, options);
}
export function useApplicationRoundSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationRoundQuery,
        ApplicationRoundQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationRoundQuery,
    ApplicationRoundQueryVariables
  >(ApplicationRoundDocument, options);
}
export type ApplicationRoundQueryHookResult = ReturnType<
  typeof useApplicationRoundQuery
>;
export type ApplicationRoundLazyQueryHookResult = ReturnType<
  typeof useApplicationRoundLazyQuery
>;
export type ApplicationRoundSuspenseQueryHookResult = ReturnType<
  typeof useApplicationRoundSuspenseQuery
>;
export type ApplicationRoundQueryResult = Apollo.QueryResult<
  ApplicationRoundQuery,
  ApplicationRoundQueryVariables
>;
export const AllocatedTimeSlotsDocument = gql`
  query AllocatedTimeSlots(
    $applicationRound: Int!
    $allocatedUnit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $applicationSectionStatus: [ApplicationSectionStatusChoice]
    $allocatedReservationUnit: [Int]
    $dayOfTheWeek: [Weekday]
    $textSearch: String
    $accessCodeState: [AccessCodeState]
    $orderBy: [AllocatedTimeSlotOrderingChoices]
    $after: String
    $first: Int
  ) {
    allocatedTimeSlots(
      after: $after
      first: $first
      applicationRound: $applicationRound
      allocatedUnit: $allocatedUnit
      applicantType: $applicantType
      applicationSectionStatus: $applicationSectionStatus
      allocatedReservationUnit: $allocatedReservationUnit
      accessCodeState: $accessCodeState
      dayOfTheWeek: $dayOfTheWeek
      textSearch: $textSearch
      orderBy: $orderBy
    ) {
      edges {
        node {
          ...AllocatedSectionsTableElement
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${AllocatedSectionsTableElementFragmentDoc}
`;

/**
 * __useAllocatedTimeSlotsQuery__
 *
 * To run a query within a React component, call `useAllocatedTimeSlotsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAllocatedTimeSlotsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAllocatedTimeSlotsQuery({
 *   variables: {
 *      applicationRound: // value for 'applicationRound'
 *      allocatedUnit: // value for 'allocatedUnit'
 *      applicantType: // value for 'applicantType'
 *      applicationSectionStatus: // value for 'applicationSectionStatus'
 *      allocatedReservationUnit: // value for 'allocatedReservationUnit'
 *      dayOfTheWeek: // value for 'dayOfTheWeek'
 *      textSearch: // value for 'textSearch'
 *      accessCodeState: // value for 'accessCodeState'
 *      orderBy: // value for 'orderBy'
 *      after: // value for 'after'
 *      first: // value for 'first'
 *   },
 * });
 */
export function useAllocatedTimeSlotsQuery(
  baseOptions: Apollo.QueryHookOptions<
    AllocatedTimeSlotsQuery,
    AllocatedTimeSlotsQueryVariables
  > &
    (
      | { variables: AllocatedTimeSlotsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    AllocatedTimeSlotsQuery,
    AllocatedTimeSlotsQueryVariables
  >(AllocatedTimeSlotsDocument, options);
}
export function useAllocatedTimeSlotsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AllocatedTimeSlotsQuery,
    AllocatedTimeSlotsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    AllocatedTimeSlotsQuery,
    AllocatedTimeSlotsQueryVariables
  >(AllocatedTimeSlotsDocument, options);
}
export function useAllocatedTimeSlotsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        AllocatedTimeSlotsQuery,
        AllocatedTimeSlotsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    AllocatedTimeSlotsQuery,
    AllocatedTimeSlotsQueryVariables
  >(AllocatedTimeSlotsDocument, options);
}
export type AllocatedTimeSlotsQueryHookResult = ReturnType<
  typeof useAllocatedTimeSlotsQuery
>;
export type AllocatedTimeSlotsLazyQueryHookResult = ReturnType<
  typeof useAllocatedTimeSlotsLazyQuery
>;
export type AllocatedTimeSlotsSuspenseQueryHookResult = ReturnType<
  typeof useAllocatedTimeSlotsSuspenseQuery
>;
export type AllocatedTimeSlotsQueryResult = Apollo.QueryResult<
  AllocatedTimeSlotsQuery,
  AllocatedTimeSlotsQueryVariables
>;
export const ApplicationsDocument = gql`
  query Applications(
    $applicationRound: Int!
    $unit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $status: [ApplicationStatusChoice]!
    $textSearch: String
    $orderBy: [ApplicationOrderingChoices]
    $first: Int
    $after: String
  ) {
    applications(
      applicationRound: $applicationRound
      unit: $unit
      applicantType: $applicantType
      status: $status
      textSearch: $textSearch
      orderBy: $orderBy
      first: $first
      after: $after
    ) {
      edges {
        node {
          ...ApplicationsTableElement
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${ApplicationsTableElementFragmentDoc}
`;

/**
 * __useApplicationsQuery__
 *
 * To run a query within a React component, call `useApplicationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationsQuery({
 *   variables: {
 *      applicationRound: // value for 'applicationRound'
 *      unit: // value for 'unit'
 *      applicantType: // value for 'applicantType'
 *      status: // value for 'status'
 *      textSearch: // value for 'textSearch'
 *      orderBy: // value for 'orderBy'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useApplicationsQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationsQuery,
    ApplicationsQueryVariables
  > &
    (
      | { variables: ApplicationsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ApplicationsQuery, ApplicationsQueryVariables>(
    ApplicationsDocument,
    options
  );
}
export function useApplicationsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationsQuery,
    ApplicationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ApplicationsQuery, ApplicationsQueryVariables>(
    ApplicationsDocument,
    options
  );
}
export function useApplicationsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationsQuery,
        ApplicationsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<ApplicationsQuery, ApplicationsQueryVariables>(
    ApplicationsDocument,
    options
  );
}
export type ApplicationsQueryHookResult = ReturnType<
  typeof useApplicationsQuery
>;
export type ApplicationsLazyQueryHookResult = ReturnType<
  typeof useApplicationsLazyQuery
>;
export type ApplicationsSuspenseQueryHookResult = ReturnType<
  typeof useApplicationsSuspenseQuery
>;
export type ApplicationsQueryResult = Apollo.QueryResult<
  ApplicationsQuery,
  ApplicationsQueryVariables
>;
export const ApplicationSectionsDocument = gql`
  query ApplicationSections(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice]!
    $status: [ApplicationSectionStatusChoice]
    $unit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $preferredOrder: [Int]
    $textSearch: String
    $priority: [Priority]
    $purpose: [Int]
    $reservationUnit: [Int]
    $ageGroup: [Int]
    $homeCity: [Int]
    $includePreferredOrder10OrHigher: Boolean
    $orderBy: [ApplicationSectionOrderingChoices]
    $first: Int
    $after: String
  ) {
    applicationSections(
      applicationRound: $applicationRound
      applicationStatus: $applicationStatus
      status: $status
      unit: $unit
      applicantType: $applicantType
      preferredOrder: $preferredOrder
      textSearch: $textSearch
      priority: $priority
      purpose: $purpose
      reservationUnit: $reservationUnit
      ageGroup: $ageGroup
      homeCity: $homeCity
      includePreferredOrder10OrHigher: $includePreferredOrder10OrHigher
      orderBy: $orderBy
      first: $first
      after: $after
    ) {
      edges {
        node {
          ...ApplicationSectionTableElement
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${ApplicationSectionTableElementFragmentDoc}
`;

/**
 * __useApplicationSectionsQuery__
 *
 * To run a query within a React component, call `useApplicationSectionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationSectionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationSectionsQuery({
 *   variables: {
 *      applicationRound: // value for 'applicationRound'
 *      applicationStatus: // value for 'applicationStatus'
 *      status: // value for 'status'
 *      unit: // value for 'unit'
 *      applicantType: // value for 'applicantType'
 *      preferredOrder: // value for 'preferredOrder'
 *      textSearch: // value for 'textSearch'
 *      priority: // value for 'priority'
 *      purpose: // value for 'purpose'
 *      reservationUnit: // value for 'reservationUnit'
 *      ageGroup: // value for 'ageGroup'
 *      homeCity: // value for 'homeCity'
 *      includePreferredOrder10OrHigher: // value for 'includePreferredOrder10OrHigher'
 *      orderBy: // value for 'orderBy'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useApplicationSectionsQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationSectionsQuery,
    ApplicationSectionsQueryVariables
  > &
    (
      | { variables: ApplicationSectionsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationSectionsQuery,
    ApplicationSectionsQueryVariables
  >(ApplicationSectionsDocument, options);
}
export function useApplicationSectionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationSectionsQuery,
    ApplicationSectionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationSectionsQuery,
    ApplicationSectionsQueryVariables
  >(ApplicationSectionsDocument, options);
}
export function useApplicationSectionsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationSectionsQuery,
        ApplicationSectionsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationSectionsQuery,
    ApplicationSectionsQueryVariables
  >(ApplicationSectionsDocument, options);
}
export type ApplicationSectionsQueryHookResult = ReturnType<
  typeof useApplicationSectionsQuery
>;
export type ApplicationSectionsLazyQueryHookResult = ReturnType<
  typeof useApplicationSectionsLazyQuery
>;
export type ApplicationSectionsSuspenseQueryHookResult = ReturnType<
  typeof useApplicationSectionsSuspenseQuery
>;
export type ApplicationSectionsQueryResult = Apollo.QueryResult<
  ApplicationSectionsQuery,
  ApplicationSectionsQueryVariables
>;
export const RejectedOccurrencesDocument = gql`
  query RejectedOccurrences(
    $applicationRound: Int
    $unit: [Int]
    $reservationUnit: [Int]
    $orderBy: [RejectedOccurrenceOrderingChoices]
    $textSearch: String
    $after: String
    $first: Int
  ) {
    rejectedOccurrences(
      applicationRound: $applicationRound
      unit: $unit
      reservationUnit: $reservationUnit
      orderBy: $orderBy
      textSearch: $textSearch
      after: $after
      first: $first
    ) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ...RejectedOccurancesTableElement
        }
      }
    }
  }
  ${RejectedOccurancesTableElementFragmentDoc}
`;

/**
 * __useRejectedOccurrencesQuery__
 *
 * To run a query within a React component, call `useRejectedOccurrencesQuery` and pass it any options that fit your needs.
 * When your component renders, `useRejectedOccurrencesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRejectedOccurrencesQuery({
 *   variables: {
 *      applicationRound: // value for 'applicationRound'
 *      unit: // value for 'unit'
 *      reservationUnit: // value for 'reservationUnit'
 *      orderBy: // value for 'orderBy'
 *      textSearch: // value for 'textSearch'
 *      after: // value for 'after'
 *      first: // value for 'first'
 *   },
 * });
 */
export function useRejectedOccurrencesQuery(
  baseOptions?: Apollo.QueryHookOptions<
    RejectedOccurrencesQuery,
    RejectedOccurrencesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    RejectedOccurrencesQuery,
    RejectedOccurrencesQueryVariables
  >(RejectedOccurrencesDocument, options);
}
export function useRejectedOccurrencesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    RejectedOccurrencesQuery,
    RejectedOccurrencesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    RejectedOccurrencesQuery,
    RejectedOccurrencesQueryVariables
  >(RejectedOccurrencesDocument, options);
}
export function useRejectedOccurrencesSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        RejectedOccurrencesQuery,
        RejectedOccurrencesQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    RejectedOccurrencesQuery,
    RejectedOccurrencesQueryVariables
  >(RejectedOccurrencesDocument, options);
}
export type RejectedOccurrencesQueryHookResult = ReturnType<
  typeof useRejectedOccurrencesQuery
>;
export type RejectedOccurrencesLazyQueryHookResult = ReturnType<
  typeof useRejectedOccurrencesLazyQuery
>;
export type RejectedOccurrencesSuspenseQueryHookResult = ReturnType<
  typeof useRejectedOccurrencesSuspenseQuery
>;
export type RejectedOccurrencesQueryResult = Apollo.QueryResult<
  RejectedOccurrencesQuery,
  RejectedOccurrencesQueryVariables
>;
export const EndAllocationDocument = gql`
  mutation EndAllocation($pk: Int!) {
    setApplicationRoundHandled(input: { pk: $pk }) {
      pk
    }
  }
`;
export type EndAllocationMutationFn = Apollo.MutationFunction<
  EndAllocationMutation,
  EndAllocationMutationVariables
>;

/**
 * __useEndAllocationMutation__
 *
 * To run a mutation, you first call `useEndAllocationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEndAllocationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [endAllocationMutation, { data, loading, error }] = useEndAllocationMutation({
 *   variables: {
 *      pk: // value for 'pk'
 *   },
 * });
 */
export function useEndAllocationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    EndAllocationMutation,
    EndAllocationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    EndAllocationMutation,
    EndAllocationMutationVariables
  >(EndAllocationDocument, options);
}
export type EndAllocationMutationHookResult = ReturnType<
  typeof useEndAllocationMutation
>;
export type EndAllocationMutationResult =
  Apollo.MutationResult<EndAllocationMutation>;
export type EndAllocationMutationOptions = Apollo.BaseMutationOptions<
  EndAllocationMutation,
  EndAllocationMutationVariables
>;
export const SendResultsDocument = gql`
  mutation SendResults($pk: Int!) {
    setApplicationRoundResultsSent(input: { pk: $pk }) {
      pk
    }
  }
`;
export type SendResultsMutationFn = Apollo.MutationFunction<
  SendResultsMutation,
  SendResultsMutationVariables
>;

/**
 * __useSendResultsMutation__
 *
 * To run a mutation, you first call `useSendResultsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendResultsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendResultsMutation, { data, loading, error }] = useSendResultsMutation({
 *   variables: {
 *      pk: // value for 'pk'
 *   },
 * });
 */
export function useSendResultsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SendResultsMutation,
    SendResultsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<SendResultsMutation, SendResultsMutationVariables>(
    SendResultsDocument,
    options
  );
}
export type SendResultsMutationHookResult = ReturnType<
  typeof useSendResultsMutation
>;
export type SendResultsMutationResult =
  Apollo.MutationResult<SendResultsMutation>;
export type SendResultsMutationOptions = Apollo.BaseMutationOptions<
  SendResultsMutation,
  SendResultsMutationVariables
>;
export const ApplicationRoundListDocument = gql`
  query ApplicationRoundList {
    applicationRounds(onlyWithPermissions: true) {
      edges {
        node {
          ...ApplicationRoundListElement
        }
      }
    }
  }
  ${ApplicationRoundListElementFragmentDoc}
`;

/**
 * __useApplicationRoundListQuery__
 *
 * To run a query within a React component, call `useApplicationRoundListQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationRoundListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationRoundListQuery({
 *   variables: {
 *   },
 * });
 */
export function useApplicationRoundListQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ApplicationRoundListQuery,
    ApplicationRoundListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationRoundListQuery,
    ApplicationRoundListQueryVariables
  >(ApplicationRoundListDocument, options);
}
export function useApplicationRoundListLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationRoundListQuery,
    ApplicationRoundListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationRoundListQuery,
    ApplicationRoundListQueryVariables
  >(ApplicationRoundListDocument, options);
}
export function useApplicationRoundListSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationRoundListQuery,
        ApplicationRoundListQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationRoundListQuery,
    ApplicationRoundListQueryVariables
  >(ApplicationRoundListDocument, options);
}
export type ApplicationRoundListQueryHookResult = ReturnType<
  typeof useApplicationRoundListQuery
>;
export type ApplicationRoundListLazyQueryHookResult = ReturnType<
  typeof useApplicationRoundListLazyQuery
>;
export type ApplicationRoundListSuspenseQueryHookResult = ReturnType<
  typeof useApplicationRoundListSuspenseQuery
>;
export type ApplicationRoundListQueryResult = Apollo.QueryResult<
  ApplicationRoundListQuery,
  ApplicationRoundListQueryVariables
>;
export const ApplicationAdminDocument = gql`
  query ApplicationAdmin($id: ID!) {
    application(id: $id) {
      ...ApplicationPageFields
      workingMemo
      user {
        id
        email
      }
    }
  }
  ${ApplicationPageFieldsFragmentDoc}
`;

/**
 * __useApplicationAdminQuery__
 *
 * To run a query within a React component, call `useApplicationAdminQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationAdminQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationAdminQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationAdminQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationAdminQuery,
    ApplicationAdminQueryVariables
  > &
    (
      | { variables: ApplicationAdminQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ApplicationAdminQuery, ApplicationAdminQueryVariables>(
    ApplicationAdminDocument,
    options
  );
}
export function useApplicationAdminLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationAdminQuery,
    ApplicationAdminQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationAdminQuery,
    ApplicationAdminQueryVariables
  >(ApplicationAdminDocument, options);
}
export function useApplicationAdminSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationAdminQuery,
        ApplicationAdminQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationAdminQuery,
    ApplicationAdminQueryVariables
  >(ApplicationAdminDocument, options);
}
export type ApplicationAdminQueryHookResult = ReturnType<
  typeof useApplicationAdminQuery
>;
export type ApplicationAdminLazyQueryHookResult = ReturnType<
  typeof useApplicationAdminLazyQuery
>;
export type ApplicationAdminSuspenseQueryHookResult = ReturnType<
  typeof useApplicationAdminSuspenseQuery
>;
export type ApplicationAdminQueryResult = Apollo.QueryResult<
  ApplicationAdminQuery,
  ApplicationAdminQueryVariables
>;
export const RejectAllSectionOptionsDocument = gql`
  mutation RejectAllSectionOptions(
    $input: RejectAllSectionOptionsMutationInput!
  ) {
    rejectAllSectionOptions(input: $input) {
      pk
    }
  }
`;
export type RejectAllSectionOptionsMutationFn = Apollo.MutationFunction<
  RejectAllSectionOptionsMutation,
  RejectAllSectionOptionsMutationVariables
>;

/**
 * __useRejectAllSectionOptionsMutation__
 *
 * To run a mutation, you first call `useRejectAllSectionOptionsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRejectAllSectionOptionsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rejectAllSectionOptionsMutation, { data, loading, error }] = useRejectAllSectionOptionsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRejectAllSectionOptionsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RejectAllSectionOptionsMutation,
    RejectAllSectionOptionsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RejectAllSectionOptionsMutation,
    RejectAllSectionOptionsMutationVariables
  >(RejectAllSectionOptionsDocument, options);
}
export type RejectAllSectionOptionsMutationHookResult = ReturnType<
  typeof useRejectAllSectionOptionsMutation
>;
export type RejectAllSectionOptionsMutationResult =
  Apollo.MutationResult<RejectAllSectionOptionsMutation>;
export type RejectAllSectionOptionsMutationOptions = Apollo.BaseMutationOptions<
  RejectAllSectionOptionsMutation,
  RejectAllSectionOptionsMutationVariables
>;
export const RestoreAllSectionOptionsDocument = gql`
  mutation RestoreAllSectionOptions(
    $input: RestoreAllSectionOptionsMutationInput!
  ) {
    restoreAllSectionOptions(input: $input) {
      pk
    }
  }
`;
export type RestoreAllSectionOptionsMutationFn = Apollo.MutationFunction<
  RestoreAllSectionOptionsMutation,
  RestoreAllSectionOptionsMutationVariables
>;

/**
 * __useRestoreAllSectionOptionsMutation__
 *
 * To run a mutation, you first call `useRestoreAllSectionOptionsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRestoreAllSectionOptionsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [restoreAllSectionOptionsMutation, { data, loading, error }] = useRestoreAllSectionOptionsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRestoreAllSectionOptionsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RestoreAllSectionOptionsMutation,
    RestoreAllSectionOptionsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RestoreAllSectionOptionsMutation,
    RestoreAllSectionOptionsMutationVariables
  >(RestoreAllSectionOptionsDocument, options);
}
export type RestoreAllSectionOptionsMutationHookResult = ReturnType<
  typeof useRestoreAllSectionOptionsMutation
>;
export type RestoreAllSectionOptionsMutationResult =
  Apollo.MutationResult<RestoreAllSectionOptionsMutation>;
export type RestoreAllSectionOptionsMutationOptions =
  Apollo.BaseMutationOptions<
    RestoreAllSectionOptionsMutation,
    RestoreAllSectionOptionsMutationVariables
  >;
export const RejectAllApplicationOptionsDocument = gql`
  mutation RejectAllApplicationOptions(
    $input: RejectAllApplicationOptionsMutationInput!
  ) {
    rejectAllApplicationOptions(input: $input) {
      pk
    }
  }
`;
export type RejectAllApplicationOptionsMutationFn = Apollo.MutationFunction<
  RejectAllApplicationOptionsMutation,
  RejectAllApplicationOptionsMutationVariables
>;

/**
 * __useRejectAllApplicationOptionsMutation__
 *
 * To run a mutation, you first call `useRejectAllApplicationOptionsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRejectAllApplicationOptionsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rejectAllApplicationOptionsMutation, { data, loading, error }] = useRejectAllApplicationOptionsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRejectAllApplicationOptionsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RejectAllApplicationOptionsMutation,
    RejectAllApplicationOptionsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RejectAllApplicationOptionsMutation,
    RejectAllApplicationOptionsMutationVariables
  >(RejectAllApplicationOptionsDocument, options);
}
export type RejectAllApplicationOptionsMutationHookResult = ReturnType<
  typeof useRejectAllApplicationOptionsMutation
>;
export type RejectAllApplicationOptionsMutationResult =
  Apollo.MutationResult<RejectAllApplicationOptionsMutation>;
export type RejectAllApplicationOptionsMutationOptions =
  Apollo.BaseMutationOptions<
    RejectAllApplicationOptionsMutation,
    RejectAllApplicationOptionsMutationVariables
  >;
export const RestoreAllApplicationOptionsDocument = gql`
  mutation RestoreAllApplicationOptions(
    $input: RestoreAllApplicationOptionsMutationInput!
  ) {
    restoreAllApplicationOptions(input: $input) {
      pk
    }
  }
`;
export type RestoreAllApplicationOptionsMutationFn = Apollo.MutationFunction<
  RestoreAllApplicationOptionsMutation,
  RestoreAllApplicationOptionsMutationVariables
>;

/**
 * __useRestoreAllApplicationOptionsMutation__
 *
 * To run a mutation, you first call `useRestoreAllApplicationOptionsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRestoreAllApplicationOptionsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [restoreAllApplicationOptionsMutation, { data, loading, error }] = useRestoreAllApplicationOptionsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRestoreAllApplicationOptionsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RestoreAllApplicationOptionsMutation,
    RestoreAllApplicationOptionsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RestoreAllApplicationOptionsMutation,
    RestoreAllApplicationOptionsMutationVariables
  >(RestoreAllApplicationOptionsDocument, options);
}
export type RestoreAllApplicationOptionsMutationHookResult = ReturnType<
  typeof useRestoreAllApplicationOptionsMutation
>;
export type RestoreAllApplicationOptionsMutationResult =
  Apollo.MutationResult<RestoreAllApplicationOptionsMutation>;
export type RestoreAllApplicationOptionsMutationOptions =
  Apollo.BaseMutationOptions<
    RestoreAllApplicationOptionsMutation,
    RestoreAllApplicationOptionsMutationVariables
  >;
export const ReservationUnitDocument = gql`
  query ReservationUnit($id: ID!) {
    reservationUnit(id: $id) {
      ...CreateStaffReservation
    }
  }
  ${CreateStaffReservationFragmentDoc}
`;

/**
 * __useReservationUnitQuery__
 *
 * To run a query within a React component, call `useReservationUnitQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationUnitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationUnitQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationUnitQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationUnitQuery,
    ReservationUnitQueryVariables
  > &
    (
      | { variables: ReservationUnitQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ReservationUnitQuery, ReservationUnitQueryVariables>(
    ReservationUnitDocument,
    options
  );
}
export function useReservationUnitLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationUnitQuery,
    ReservationUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationUnitQuery,
    ReservationUnitQueryVariables
  >(ReservationUnitDocument, options);
}
export function useReservationUnitSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationUnitQuery,
        ReservationUnitQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationUnitQuery,
    ReservationUnitQueryVariables
  >(ReservationUnitDocument, options);
}
export type ReservationUnitQueryHookResult = ReturnType<
  typeof useReservationUnitQuery
>;
export type ReservationUnitLazyQueryHookResult = ReturnType<
  typeof useReservationUnitLazyQuery
>;
export type ReservationUnitSuspenseQueryHookResult = ReturnType<
  typeof useReservationUnitSuspenseQuery
>;
export type ReservationUnitQueryResult = Apollo.QueryResult<
  ReservationUnitQuery,
  ReservationUnitQueryVariables
>;
export const CreateStaffReservationDocument = gql`
  mutation CreateStaffReservation(
    $input: ReservationStaffCreateMutationInput!
  ) {
    createStaffReservation(input: $input) {
      pk
    }
  }
`;
export type CreateStaffReservationMutationFn = Apollo.MutationFunction<
  CreateStaffReservationMutation,
  CreateStaffReservationMutationVariables
>;

/**
 * __useCreateStaffReservationMutation__
 *
 * To run a mutation, you first call `useCreateStaffReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateStaffReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createStaffReservationMutation, { data, loading, error }] = useCreateStaffReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateStaffReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateStaffReservationMutation,
    CreateStaffReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateStaffReservationMutation,
    CreateStaffReservationMutationVariables
  >(CreateStaffReservationDocument, options);
}
export type CreateStaffReservationMutationHookResult = ReturnType<
  typeof useCreateStaffReservationMutation
>;
export type CreateStaffReservationMutationResult =
  Apollo.MutationResult<CreateStaffReservationMutation>;
export type CreateStaffReservationMutationOptions = Apollo.BaseMutationOptions<
  CreateStaffReservationMutation,
  CreateStaffReservationMutationVariables
>;
export const ReservationUnitCalendarDocument = gql`
  query ReservationUnitCalendar(
    $id: ID!
    $pk: Int!
    $state: [ReservationStateChoice]
    $beginDate: Date
    $endDate: Date
  ) {
    reservationUnit(id: $id) {
      id
      pk
      reservations(state: $state, beginDate: $beginDate, endDate: $endDate) {
        ...ReservationUnitReservations
        ...CombineAffectedReservations
      }
    }
    affectingReservations(
      forReservationUnits: [$pk]
      state: $state
      beginDate: $beginDate
      endDate: $endDate
    ) {
      ...ReservationUnitReservations
      ...CombineAffectedReservations
    }
  }
  ${ReservationUnitReservationsFragmentDoc}
  ${CombineAffectedReservationsFragmentDoc}
`;

/**
 * __useReservationUnitCalendarQuery__
 *
 * To run a query within a React component, call `useReservationUnitCalendarQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationUnitCalendarQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationUnitCalendarQuery({
 *   variables: {
 *      id: // value for 'id'
 *      pk: // value for 'pk'
 *      state: // value for 'state'
 *      beginDate: // value for 'beginDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useReservationUnitCalendarQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationUnitCalendarQuery,
    ReservationUnitCalendarQueryVariables
  > &
    (
      | { variables: ReservationUnitCalendarQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationUnitCalendarQuery,
    ReservationUnitCalendarQueryVariables
  >(ReservationUnitCalendarDocument, options);
}
export function useReservationUnitCalendarLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationUnitCalendarQuery,
    ReservationUnitCalendarQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationUnitCalendarQuery,
    ReservationUnitCalendarQueryVariables
  >(ReservationUnitCalendarDocument, options);
}
export function useReservationUnitCalendarSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationUnitCalendarQuery,
        ReservationUnitCalendarQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationUnitCalendarQuery,
    ReservationUnitCalendarQueryVariables
  >(ReservationUnitCalendarDocument, options);
}
export type ReservationUnitCalendarQueryHookResult = ReturnType<
  typeof useReservationUnitCalendarQuery
>;
export type ReservationUnitCalendarLazyQueryHookResult = ReturnType<
  typeof useReservationUnitCalendarLazyQuery
>;
export type ReservationUnitCalendarSuspenseQueryHookResult = ReturnType<
  typeof useReservationUnitCalendarSuspenseQuery
>;
export type ReservationUnitCalendarQueryResult = Apollo.QueryResult<
  ReservationUnitCalendarQuery,
  ReservationUnitCalendarQueryVariables
>;
export const ReservationUnitsByUnitDocument = gql`
  query ReservationUnitsByUnit(
    $id: ID!
    $pk: Int!
    $state: [ReservationStateChoice]
    $beginDate: Date
    $endDate: Date
  ) {
    unit(id: $id) {
      id
      reservationUnits {
        id
        pk
        nameFi
        spaces {
          id
          pk
        }
        reservationUnitType {
          id
          pk
        }
        bufferTimeBefore
        bufferTimeAfter
        isDraft
        authentication
      }
    }
    affectingReservations(
      beginDate: $beginDate
      endDate: $endDate
      state: $state
      forUnits: [$pk]
    ) {
      ...ReservationUnitReservations
    }
  }
  ${ReservationUnitReservationsFragmentDoc}
`;

/**
 * __useReservationUnitsByUnitQuery__
 *
 * To run a query within a React component, call `useReservationUnitsByUnitQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationUnitsByUnitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationUnitsByUnitQuery({
 *   variables: {
 *      id: // value for 'id'
 *      pk: // value for 'pk'
 *      state: // value for 'state'
 *      beginDate: // value for 'beginDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useReservationUnitsByUnitQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationUnitsByUnitQuery,
    ReservationUnitsByUnitQueryVariables
  > &
    (
      | { variables: ReservationUnitsByUnitQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationUnitsByUnitQuery,
    ReservationUnitsByUnitQueryVariables
  >(ReservationUnitsByUnitDocument, options);
}
export function useReservationUnitsByUnitLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationUnitsByUnitQuery,
    ReservationUnitsByUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationUnitsByUnitQuery,
    ReservationUnitsByUnitQueryVariables
  >(ReservationUnitsByUnitDocument, options);
}
export function useReservationUnitsByUnitSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationUnitsByUnitQuery,
        ReservationUnitsByUnitQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationUnitsByUnitQuery,
    ReservationUnitsByUnitQueryVariables
  >(ReservationUnitsByUnitDocument, options);
}
export type ReservationUnitsByUnitQueryHookResult = ReturnType<
  typeof useReservationUnitsByUnitQuery
>;
export type ReservationUnitsByUnitLazyQueryHookResult = ReturnType<
  typeof useReservationUnitsByUnitLazyQuery
>;
export type ReservationUnitsByUnitSuspenseQueryHookResult = ReturnType<
  typeof useReservationUnitsByUnitSuspenseQuery
>;
export type ReservationUnitsByUnitQueryResult = Apollo.QueryResult<
  ReservationUnitsByUnitQuery,
  ReservationUnitsByUnitQueryVariables
>;
export const UnitViewDocument = gql`
  query UnitView($id: ID!) {
    unit(id: $id) {
      id
      pk
      nameFi
      location {
        ...LocationFields
      }
      reservationUnits {
        id
        pk
        nameFi
        spaces {
          id
          pk
        }
      }
    }
  }
  ${LocationFieldsFragmentDoc}
`;

/**
 * __useUnitViewQuery__
 *
 * To run a query within a React component, call `useUnitViewQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnitViewQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnitViewQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUnitViewQuery(
  baseOptions: Apollo.QueryHookOptions<UnitViewQuery, UnitViewQueryVariables> &
    ({ variables: UnitViewQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<UnitViewQuery, UnitViewQueryVariables>(
    UnitViewDocument,
    options
  );
}
export function useUnitViewLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    UnitViewQuery,
    UnitViewQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<UnitViewQuery, UnitViewQueryVariables>(
    UnitViewDocument,
    options
  );
}
export function useUnitViewSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<UnitViewQuery, UnitViewQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<UnitViewQuery, UnitViewQueryVariables>(
    UnitViewDocument,
    options
  );
}
export type UnitViewQueryHookResult = ReturnType<typeof useUnitViewQuery>;
export type UnitViewLazyQueryHookResult = ReturnType<
  typeof useUnitViewLazyQuery
>;
export type UnitViewSuspenseQueryHookResult = ReturnType<
  typeof useUnitViewSuspenseQuery
>;
export type UnitViewQueryResult = Apollo.QueryResult<
  UnitViewQuery,
  UnitViewQueryVariables
>;
export const RecurringReservationUnitDocument = gql`
  query RecurringReservationUnit($id: ID!) {
    unit(id: $id) {
      id
      nameFi
      pk
      reservationUnits {
        id
        pk
        nameFi
        reservationStartInterval
        bufferTimeBefore
        bufferTimeAfter
      }
    }
  }
`;

/**
 * __useRecurringReservationUnitQuery__
 *
 * To run a query within a React component, call `useRecurringReservationUnitQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecurringReservationUnitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecurringReservationUnitQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRecurringReservationUnitQuery(
  baseOptions: Apollo.QueryHookOptions<
    RecurringReservationUnitQuery,
    RecurringReservationUnitQueryVariables
  > &
    (
      | { variables: RecurringReservationUnitQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    RecurringReservationUnitQuery,
    RecurringReservationUnitQueryVariables
  >(RecurringReservationUnitDocument, options);
}
export function useRecurringReservationUnitLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    RecurringReservationUnitQuery,
    RecurringReservationUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    RecurringReservationUnitQuery,
    RecurringReservationUnitQueryVariables
  >(RecurringReservationUnitDocument, options);
}
export function useRecurringReservationUnitSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        RecurringReservationUnitQuery,
        RecurringReservationUnitQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    RecurringReservationUnitQuery,
    RecurringReservationUnitQueryVariables
  >(RecurringReservationUnitDocument, options);
}
export type RecurringReservationUnitQueryHookResult = ReturnType<
  typeof useRecurringReservationUnitQuery
>;
export type RecurringReservationUnitLazyQueryHookResult = ReturnType<
  typeof useRecurringReservationUnitLazyQuery
>;
export type RecurringReservationUnitSuspenseQueryHookResult = ReturnType<
  typeof useRecurringReservationUnitSuspenseQuery
>;
export type RecurringReservationUnitQueryResult = Apollo.QueryResult<
  RecurringReservationUnitQuery,
  RecurringReservationUnitQueryVariables
>;
export const CreateReservationSeriesDocument = gql`
  mutation CreateReservationSeries(
    $input: ReservationSeriesCreateMutationInput!
  ) {
    createReservationSeries(input: $input) {
      pk
    }
  }
`;
export type CreateReservationSeriesMutationFn = Apollo.MutationFunction<
  CreateReservationSeriesMutation,
  CreateReservationSeriesMutationVariables
>;

/**
 * __useCreateReservationSeriesMutation__
 *
 * To run a mutation, you first call `useCreateReservationSeriesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateReservationSeriesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createReservationSeriesMutation, { data, loading, error }] = useCreateReservationSeriesMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateReservationSeriesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateReservationSeriesMutation,
    CreateReservationSeriesMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateReservationSeriesMutation,
    CreateReservationSeriesMutationVariables
  >(CreateReservationSeriesDocument, options);
}
export type CreateReservationSeriesMutationHookResult = ReturnType<
  typeof useCreateReservationSeriesMutation
>;
export type CreateReservationSeriesMutationResult =
  Apollo.MutationResult<CreateReservationSeriesMutation>;
export type CreateReservationSeriesMutationOptions = Apollo.BaseMutationOptions<
  CreateReservationSeriesMutation,
  CreateReservationSeriesMutationVariables
>;
export const BannerNotificationListDocument = gql`
  query BannerNotificationList(
    $first: Int
    $after: String
    $orderBy: [BannerNotificationOrderingChoices]
  ) {
    bannerNotifications(first: $first, after: $after, orderBy: $orderBy) {
      edges {
        node {
          ...BannerNotificationTableElement
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${BannerNotificationTableElementFragmentDoc}
`;

/**
 * __useBannerNotificationListQuery__
 *
 * To run a query within a React component, call `useBannerNotificationListQuery` and pass it any options that fit your needs.
 * When your component renders, `useBannerNotificationListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBannerNotificationListQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useBannerNotificationListQuery(
  baseOptions?: Apollo.QueryHookOptions<
    BannerNotificationListQuery,
    BannerNotificationListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    BannerNotificationListQuery,
    BannerNotificationListQueryVariables
  >(BannerNotificationListDocument, options);
}
export function useBannerNotificationListLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    BannerNotificationListQuery,
    BannerNotificationListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    BannerNotificationListQuery,
    BannerNotificationListQueryVariables
  >(BannerNotificationListDocument, options);
}
export function useBannerNotificationListSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        BannerNotificationListQuery,
        BannerNotificationListQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    BannerNotificationListQuery,
    BannerNotificationListQueryVariables
  >(BannerNotificationListDocument, options);
}
export type BannerNotificationListQueryHookResult = ReturnType<
  typeof useBannerNotificationListQuery
>;
export type BannerNotificationListLazyQueryHookResult = ReturnType<
  typeof useBannerNotificationListLazyQuery
>;
export type BannerNotificationListSuspenseQueryHookResult = ReturnType<
  typeof useBannerNotificationListSuspenseQuery
>;
export type BannerNotificationListQueryResult = Apollo.QueryResult<
  BannerNotificationListQuery,
  BannerNotificationListQueryVariables
>;
export const BannerNotificationCreateDocument = gql`
  mutation BannerNotificationCreate(
    $input: BannerNotificationCreateMutationInput!
  ) {
    createBannerNotification(input: $input) {
      pk
    }
  }
`;
export type BannerNotificationCreateMutationFn = Apollo.MutationFunction<
  BannerNotificationCreateMutation,
  BannerNotificationCreateMutationVariables
>;

/**
 * __useBannerNotificationCreateMutation__
 *
 * To run a mutation, you first call `useBannerNotificationCreateMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBannerNotificationCreateMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [bannerNotificationCreateMutation, { data, loading, error }] = useBannerNotificationCreateMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useBannerNotificationCreateMutation(
  baseOptions?: Apollo.MutationHookOptions<
    BannerNotificationCreateMutation,
    BannerNotificationCreateMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    BannerNotificationCreateMutation,
    BannerNotificationCreateMutationVariables
  >(BannerNotificationCreateDocument, options);
}
export type BannerNotificationCreateMutationHookResult = ReturnType<
  typeof useBannerNotificationCreateMutation
>;
export type BannerNotificationCreateMutationResult =
  Apollo.MutationResult<BannerNotificationCreateMutation>;
export type BannerNotificationCreateMutationOptions =
  Apollo.BaseMutationOptions<
    BannerNotificationCreateMutation,
    BannerNotificationCreateMutationVariables
  >;
export const BannerNotificationUpdateDocument = gql`
  mutation BannerNotificationUpdate(
    $input: BannerNotificationUpdateMutationInput!
  ) {
    updateBannerNotification(input: $input) {
      pk
    }
  }
`;
export type BannerNotificationUpdateMutationFn = Apollo.MutationFunction<
  BannerNotificationUpdateMutation,
  BannerNotificationUpdateMutationVariables
>;

/**
 * __useBannerNotificationUpdateMutation__
 *
 * To run a mutation, you first call `useBannerNotificationUpdateMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBannerNotificationUpdateMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [bannerNotificationUpdateMutation, { data, loading, error }] = useBannerNotificationUpdateMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useBannerNotificationUpdateMutation(
  baseOptions?: Apollo.MutationHookOptions<
    BannerNotificationUpdateMutation,
    BannerNotificationUpdateMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    BannerNotificationUpdateMutation,
    BannerNotificationUpdateMutationVariables
  >(BannerNotificationUpdateDocument, options);
}
export type BannerNotificationUpdateMutationHookResult = ReturnType<
  typeof useBannerNotificationUpdateMutation
>;
export type BannerNotificationUpdateMutationResult =
  Apollo.MutationResult<BannerNotificationUpdateMutation>;
export type BannerNotificationUpdateMutationOptions =
  Apollo.BaseMutationOptions<
    BannerNotificationUpdateMutation,
    BannerNotificationUpdateMutationVariables
  >;
export const BannerNotificationDeleteDocument = gql`
  mutation BannerNotificationDelete(
    $input: BannerNotificationDeleteMutationInput!
  ) {
    deleteBannerNotification(input: $input) {
      deleted
    }
  }
`;
export type BannerNotificationDeleteMutationFn = Apollo.MutationFunction<
  BannerNotificationDeleteMutation,
  BannerNotificationDeleteMutationVariables
>;

/**
 * __useBannerNotificationDeleteMutation__
 *
 * To run a mutation, you first call `useBannerNotificationDeleteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBannerNotificationDeleteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [bannerNotificationDeleteMutation, { data, loading, error }] = useBannerNotificationDeleteMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useBannerNotificationDeleteMutation(
  baseOptions?: Apollo.MutationHookOptions<
    BannerNotificationDeleteMutation,
    BannerNotificationDeleteMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    BannerNotificationDeleteMutation,
    BannerNotificationDeleteMutationVariables
  >(BannerNotificationDeleteDocument, options);
}
export type BannerNotificationDeleteMutationHookResult = ReturnType<
  typeof useBannerNotificationDeleteMutation
>;
export type BannerNotificationDeleteMutationResult =
  Apollo.MutationResult<BannerNotificationDeleteMutation>;
export type BannerNotificationDeleteMutationOptions =
  Apollo.BaseMutationOptions<
    BannerNotificationDeleteMutation,
    BannerNotificationDeleteMutationVariables
  >;
export const BannerNotificationPageDocument = gql`
  query BannerNotificationPage($id: ID!) {
    bannerNotification(id: $id) {
      id
      pk
      level
      activeFrom
      messageEn
      messageFi
      messageSv
      name
      target
      activeUntil
      draft
      state
    }
  }
`;

/**
 * __useBannerNotificationPageQuery__
 *
 * To run a query within a React component, call `useBannerNotificationPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useBannerNotificationPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBannerNotificationPageQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useBannerNotificationPageQuery(
  baseOptions: Apollo.QueryHookOptions<
    BannerNotificationPageQuery,
    BannerNotificationPageQueryVariables
  > &
    (
      | { variables: BannerNotificationPageQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    BannerNotificationPageQuery,
    BannerNotificationPageQueryVariables
  >(BannerNotificationPageDocument, options);
}
export function useBannerNotificationPageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    BannerNotificationPageQuery,
    BannerNotificationPageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    BannerNotificationPageQuery,
    BannerNotificationPageQueryVariables
  >(BannerNotificationPageDocument, options);
}
export function useBannerNotificationPageSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        BannerNotificationPageQuery,
        BannerNotificationPageQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    BannerNotificationPageQuery,
    BannerNotificationPageQueryVariables
  >(BannerNotificationPageDocument, options);
}
export type BannerNotificationPageQueryHookResult = ReturnType<
  typeof useBannerNotificationPageQuery
>;
export type BannerNotificationPageLazyQueryHookResult = ReturnType<
  typeof useBannerNotificationPageLazyQuery
>;
export type BannerNotificationPageSuspenseQueryHookResult = ReturnType<
  typeof useBannerNotificationPageSuspenseQuery
>;
export type BannerNotificationPageQueryResult = Apollo.QueryResult<
  BannerNotificationPageQuery,
  BannerNotificationPageQueryVariables
>;
export const SearchReservationUnitsDocument = gql`
  query SearchReservationUnits(
    $after: String
    $first: Int
    $textSearch: String
    $maxPersonsGte: Int
    $maxPersonsLte: Int
    $surfaceAreaGte: Int
    $surfaceAreaLte: Int
    $unit: [Int]
    $reservationUnitType: [Int]
    $orderBy: [ReservationUnitOrderingChoices]
    $publishingState: [ReservationUnitPublishingState]
  ) {
    reservationUnits(
      first: $first
      after: $after
      orderBy: $orderBy
      textSearch: $textSearch
      maxPersonsGte: $maxPersonsGte
      minPersonsGte: $maxPersonsGte
      maxPersonsLte: $maxPersonsLte
      minPersonsLte: $maxPersonsLte
      surfaceAreaGte: $surfaceAreaGte
      surfaceAreaLte: $surfaceAreaLte
      unit: $unit
      reservationUnitType: $reservationUnitType
      publishingState: $publishingState
      onlyWithPermission: true
    ) {
      edges {
        node {
          ...ReservationUnitTableElement
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
  ${ReservationUnitTableElementFragmentDoc}
`;

/**
 * __useSearchReservationUnitsQuery__
 *
 * To run a query within a React component, call `useSearchReservationUnitsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchReservationUnitsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchReservationUnitsQuery({
 *   variables: {
 *      after: // value for 'after'
 *      first: // value for 'first'
 *      textSearch: // value for 'textSearch'
 *      maxPersonsGte: // value for 'maxPersonsGte'
 *      maxPersonsLte: // value for 'maxPersonsLte'
 *      surfaceAreaGte: // value for 'surfaceAreaGte'
 *      surfaceAreaLte: // value for 'surfaceAreaLte'
 *      unit: // value for 'unit'
 *      reservationUnitType: // value for 'reservationUnitType'
 *      orderBy: // value for 'orderBy'
 *      publishingState: // value for 'publishingState'
 *   },
 * });
 */
export function useSearchReservationUnitsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    SearchReservationUnitsQuery,
    SearchReservationUnitsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    SearchReservationUnitsQuery,
    SearchReservationUnitsQueryVariables
  >(SearchReservationUnitsDocument, options);
}
export function useSearchReservationUnitsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SearchReservationUnitsQuery,
    SearchReservationUnitsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    SearchReservationUnitsQuery,
    SearchReservationUnitsQueryVariables
  >(SearchReservationUnitsDocument, options);
}
export function useSearchReservationUnitsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        SearchReservationUnitsQuery,
        SearchReservationUnitsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    SearchReservationUnitsQuery,
    SearchReservationUnitsQueryVariables
  >(SearchReservationUnitsDocument, options);
}
export type SearchReservationUnitsQueryHookResult = ReturnType<
  typeof useSearchReservationUnitsQuery
>;
export type SearchReservationUnitsLazyQueryHookResult = ReturnType<
  typeof useSearchReservationUnitsLazyQuery
>;
export type SearchReservationUnitsSuspenseQueryHookResult = ReturnType<
  typeof useSearchReservationUnitsSuspenseQuery
>;
export type SearchReservationUnitsQueryResult = Apollo.QueryResult<
  SearchReservationUnitsQuery,
  SearchReservationUnitsQueryVariables
>;
export const ReservationListDocument = gql`
  query ReservationList(
    $first: Int
    $after: String
    $orderBy: [ReservationOrderingChoices]
    $unit: [Int]
    $reservationUnits: [Int]
    $reservationUnitType: [Int]
    $reservationType: [ReservationTypeChoice]
    $state: [ReservationStateChoice]
    $orderStatus: [OrderStatusWithFree]
    $textSearch: String
    $priceLte: Decimal
    $priceGte: Decimal
    $beginDate: Date
    $endDate: Date
    $createdAtGte: Date
    $createdAtLte: Date
    $applyingForFreeOfCharge: Boolean
    $isRecurring: Boolean
  ) {
    reservations(
      first: $first
      after: $after
      orderBy: $orderBy
      unit: $unit
      reservationUnits: $reservationUnits
      reservationUnitType: $reservationUnitType
      reservationType: $reservationType
      state: $state
      orderStatus: $orderStatus
      textSearch: $textSearch
      priceLte: $priceLte
      priceGte: $priceGte
      beginDate: $beginDate
      endDate: $endDate
      createdAtGte: $createdAtGte
      createdAtLte: $createdAtLte
      isRecurring: $isRecurring
      applyingForFreeOfCharge: $applyingForFreeOfCharge
      onlyWithPermission: true
    ) {
      edges {
        node {
          ...ReservationTableElement
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${ReservationTableElementFragmentDoc}
`;

/**
 * __useReservationListQuery__
 *
 * To run a query within a React component, call `useReservationListQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationListQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      orderBy: // value for 'orderBy'
 *      unit: // value for 'unit'
 *      reservationUnits: // value for 'reservationUnits'
 *      reservationUnitType: // value for 'reservationUnitType'
 *      reservationType: // value for 'reservationType'
 *      state: // value for 'state'
 *      orderStatus: // value for 'orderStatus'
 *      textSearch: // value for 'textSearch'
 *      priceLte: // value for 'priceLte'
 *      priceGte: // value for 'priceGte'
 *      beginDate: // value for 'beginDate'
 *      endDate: // value for 'endDate'
 *      createdAtGte: // value for 'createdAtGte'
 *      createdAtLte: // value for 'createdAtLte'
 *      applyingForFreeOfCharge: // value for 'applyingForFreeOfCharge'
 *      isRecurring: // value for 'isRecurring'
 *   },
 * });
 */
export function useReservationListQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ReservationListQuery,
    ReservationListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ReservationListQuery, ReservationListQueryVariables>(
    ReservationListDocument,
    options
  );
}
export function useReservationListLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationListQuery,
    ReservationListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationListQuery,
    ReservationListQueryVariables
  >(ReservationListDocument, options);
}
export function useReservationListSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationListQuery,
        ReservationListQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationListQuery,
    ReservationListQueryVariables
  >(ReservationListDocument, options);
}
export type ReservationListQueryHookResult = ReturnType<
  typeof useReservationListQuery
>;
export type ReservationListLazyQueryHookResult = ReturnType<
  typeof useReservationListLazyQuery
>;
export type ReservationListSuspenseQueryHookResult = ReturnType<
  typeof useReservationListSuspenseQuery
>;
export type ReservationListQueryResult = Apollo.QueryResult<
  ReservationListQuery,
  ReservationListQueryVariables
>;
export const ApproveReservationDocument = gql`
  mutation ApproveReservation($input: ReservationApproveMutationInput!) {
    approveReservation(input: $input) {
      pk
      state
    }
  }
`;
export type ApproveReservationMutationFn = Apollo.MutationFunction<
  ApproveReservationMutation,
  ApproveReservationMutationVariables
>;

/**
 * __useApproveReservationMutation__
 *
 * To run a mutation, you first call `useApproveReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useApproveReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [approveReservationMutation, { data, loading, error }] = useApproveReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useApproveReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ApproveReservationMutation,
    ApproveReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ApproveReservationMutation,
    ApproveReservationMutationVariables
  >(ApproveReservationDocument, options);
}
export type ApproveReservationMutationHookResult = ReturnType<
  typeof useApproveReservationMutation
>;
export type ApproveReservationMutationResult =
  Apollo.MutationResult<ApproveReservationMutation>;
export type ApproveReservationMutationOptions = Apollo.BaseMutationOptions<
  ApproveReservationMutation,
  ApproveReservationMutationVariables
>;
export const ChangeReservationAccessCodeSingleDocument = gql`
  mutation ChangeReservationAccessCodeSingle(
    $input: ReservationStaffChangeAccessCodeMutationInput!
  ) {
    staffChangeReservationAccessCode(input: $input) {
      pk
      accessCodeIsActive
      accessCodeGeneratedAt
    }
  }
`;
export type ChangeReservationAccessCodeSingleMutationFn =
  Apollo.MutationFunction<
    ChangeReservationAccessCodeSingleMutation,
    ChangeReservationAccessCodeSingleMutationVariables
  >;

/**
 * __useChangeReservationAccessCodeSingleMutation__
 *
 * To run a mutation, you first call `useChangeReservationAccessCodeSingleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangeReservationAccessCodeSingleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changeReservationAccessCodeSingleMutation, { data, loading, error }] = useChangeReservationAccessCodeSingleMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useChangeReservationAccessCodeSingleMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ChangeReservationAccessCodeSingleMutation,
    ChangeReservationAccessCodeSingleMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ChangeReservationAccessCodeSingleMutation,
    ChangeReservationAccessCodeSingleMutationVariables
  >(ChangeReservationAccessCodeSingleDocument, options);
}
export type ChangeReservationAccessCodeSingleMutationHookResult = ReturnType<
  typeof useChangeReservationAccessCodeSingleMutation
>;
export type ChangeReservationAccessCodeSingleMutationResult =
  Apollo.MutationResult<ChangeReservationAccessCodeSingleMutation>;
export type ChangeReservationAccessCodeSingleMutationOptions =
  Apollo.BaseMutationOptions<
    ChangeReservationAccessCodeSingleMutation,
    ChangeReservationAccessCodeSingleMutationVariables
  >;
export const RepairReservationAccessCodeSingleDocument = gql`
  mutation RepairReservationAccessCodeSingle(
    $input: ReservationStaffRepairAccessCodeMutationInput!
  ) {
    staffRepairReservationAccessCode(input: $input) {
      pk
      accessCodeIsActive
      accessCodeGeneratedAt
    }
  }
`;
export type RepairReservationAccessCodeSingleMutationFn =
  Apollo.MutationFunction<
    RepairReservationAccessCodeSingleMutation,
    RepairReservationAccessCodeSingleMutationVariables
  >;

/**
 * __useRepairReservationAccessCodeSingleMutation__
 *
 * To run a mutation, you first call `useRepairReservationAccessCodeSingleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRepairReservationAccessCodeSingleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [repairReservationAccessCodeSingleMutation, { data, loading, error }] = useRepairReservationAccessCodeSingleMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRepairReservationAccessCodeSingleMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RepairReservationAccessCodeSingleMutation,
    RepairReservationAccessCodeSingleMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RepairReservationAccessCodeSingleMutation,
    RepairReservationAccessCodeSingleMutationVariables
  >(RepairReservationAccessCodeSingleDocument, options);
}
export type RepairReservationAccessCodeSingleMutationHookResult = ReturnType<
  typeof useRepairReservationAccessCodeSingleMutation
>;
export type RepairReservationAccessCodeSingleMutationResult =
  Apollo.MutationResult<RepairReservationAccessCodeSingleMutation>;
export type RepairReservationAccessCodeSingleMutationOptions =
  Apollo.BaseMutationOptions<
    RepairReservationAccessCodeSingleMutation,
    RepairReservationAccessCodeSingleMutationVariables
  >;
export const ChangeReservationAccessCodeSeriesDocument = gql`
  mutation ChangeReservationAccessCodeSeries(
    $input: ReservationSeriesChangeAccessCodeMutationInput!
  ) {
    changeReservationSeriesAccessCode(input: $input) {
      pk
      accessCodeIsActive
      accessCodeGeneratedAt
    }
  }
`;
export type ChangeReservationAccessCodeSeriesMutationFn =
  Apollo.MutationFunction<
    ChangeReservationAccessCodeSeriesMutation,
    ChangeReservationAccessCodeSeriesMutationVariables
  >;

/**
 * __useChangeReservationAccessCodeSeriesMutation__
 *
 * To run a mutation, you first call `useChangeReservationAccessCodeSeriesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangeReservationAccessCodeSeriesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changeReservationAccessCodeSeriesMutation, { data, loading, error }] = useChangeReservationAccessCodeSeriesMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useChangeReservationAccessCodeSeriesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ChangeReservationAccessCodeSeriesMutation,
    ChangeReservationAccessCodeSeriesMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ChangeReservationAccessCodeSeriesMutation,
    ChangeReservationAccessCodeSeriesMutationVariables
  >(ChangeReservationAccessCodeSeriesDocument, options);
}
export type ChangeReservationAccessCodeSeriesMutationHookResult = ReturnType<
  typeof useChangeReservationAccessCodeSeriesMutation
>;
export type ChangeReservationAccessCodeSeriesMutationResult =
  Apollo.MutationResult<ChangeReservationAccessCodeSeriesMutation>;
export type ChangeReservationAccessCodeSeriesMutationOptions =
  Apollo.BaseMutationOptions<
    ChangeReservationAccessCodeSeriesMutation,
    ChangeReservationAccessCodeSeriesMutationVariables
  >;
export const RepairReservationAccessCodeSeriesDocument = gql`
  mutation RepairReservationAccessCodeSeries(
    $input: ReservationSeriesRepairAccessCodeMutationInput!
  ) {
    repairReservationSeriesAccessCode(input: $input) {
      pk
      accessCodeIsActive
      accessCodeGeneratedAt
    }
  }
`;
export type RepairReservationAccessCodeSeriesMutationFn =
  Apollo.MutationFunction<
    RepairReservationAccessCodeSeriesMutation,
    RepairReservationAccessCodeSeriesMutationVariables
  >;

/**
 * __useRepairReservationAccessCodeSeriesMutation__
 *
 * To run a mutation, you first call `useRepairReservationAccessCodeSeriesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRepairReservationAccessCodeSeriesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [repairReservationAccessCodeSeriesMutation, { data, loading, error }] = useRepairReservationAccessCodeSeriesMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRepairReservationAccessCodeSeriesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RepairReservationAccessCodeSeriesMutation,
    RepairReservationAccessCodeSeriesMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RepairReservationAccessCodeSeriesMutation,
    RepairReservationAccessCodeSeriesMutationVariables
  >(RepairReservationAccessCodeSeriesDocument, options);
}
export type RepairReservationAccessCodeSeriesMutationHookResult = ReturnType<
  typeof useRepairReservationAccessCodeSeriesMutation
>;
export type RepairReservationAccessCodeSeriesMutationResult =
  Apollo.MutationResult<RepairReservationAccessCodeSeriesMutation>;
export type RepairReservationAccessCodeSeriesMutationOptions =
  Apollo.BaseMutationOptions<
    RepairReservationAccessCodeSeriesMutation,
    RepairReservationAccessCodeSeriesMutationVariables
  >;
export const ReservationApplicationLinkDocument = gql`
  query ReservationApplicationLink($id: ID!) {
    recurringReservation(id: $id) {
      id
      allocatedTimeSlot {
        id
        pk
        reservationUnitOption {
          id
          pk
          applicationSection {
            id
            pk
            application {
              id
              pk
            }
          }
        }
      }
    }
  }
`;

/**
 * __useReservationApplicationLinkQuery__
 *
 * To run a query within a React component, call `useReservationApplicationLinkQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationApplicationLinkQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationApplicationLinkQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationApplicationLinkQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationApplicationLinkQuery,
    ReservationApplicationLinkQueryVariables
  > &
    (
      | { variables: ReservationApplicationLinkQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationApplicationLinkQuery,
    ReservationApplicationLinkQueryVariables
  >(ReservationApplicationLinkDocument, options);
}
export function useReservationApplicationLinkLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationApplicationLinkQuery,
    ReservationApplicationLinkQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationApplicationLinkQuery,
    ReservationApplicationLinkQueryVariables
  >(ReservationApplicationLinkDocument, options);
}
export function useReservationApplicationLinkSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationApplicationLinkQuery,
        ReservationApplicationLinkQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationApplicationLinkQuery,
    ReservationApplicationLinkQueryVariables
  >(ReservationApplicationLinkDocument, options);
}
export type ReservationApplicationLinkQueryHookResult = ReturnType<
  typeof useReservationApplicationLinkQuery
>;
export type ReservationApplicationLinkLazyQueryHookResult = ReturnType<
  typeof useReservationApplicationLinkLazyQuery
>;
export type ReservationApplicationLinkSuspenseQueryHookResult = ReturnType<
  typeof useReservationApplicationLinkSuspenseQuery
>;
export type ReservationApplicationLinkQueryResult = Apollo.QueryResult<
  ReservationApplicationLinkQuery,
  ReservationApplicationLinkQueryVariables
>;
export const RequireHandlingDocument = gql`
  mutation RequireHandling($input: ReservationRequiresHandlingMutationInput!) {
    requireHandlingForReservation(input: $input) {
      pk
      state
    }
  }
`;
export type RequireHandlingMutationFn = Apollo.MutationFunction<
  RequireHandlingMutation,
  RequireHandlingMutationVariables
>;

/**
 * __useRequireHandlingMutation__
 *
 * To run a mutation, you first call `useRequireHandlingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequireHandlingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requireHandlingMutation, { data, loading, error }] = useRequireHandlingMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRequireHandlingMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RequireHandlingMutation,
    RequireHandlingMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RequireHandlingMutation,
    RequireHandlingMutationVariables
  >(RequireHandlingDocument, options);
}
export type RequireHandlingMutationHookResult = ReturnType<
  typeof useRequireHandlingMutation
>;
export type RequireHandlingMutationResult =
  Apollo.MutationResult<RequireHandlingMutation>;
export type RequireHandlingMutationOptions = Apollo.BaseMutationOptions<
  RequireHandlingMutation,
  RequireHandlingMutationVariables
>;
export const ReservationEditPageDocument = gql`
  query ReservationEditPage($id: ID!) {
    reservation(id: $id) {
      id
      pk
      ...CreateTagString
      ...ReservationCommonFields
      ...ReservationMetaFields
      ...ReservationTitleSectionFields
      ...UseStaffReservation
      recurringReservation {
        id
        pk
        name
      }
      reservationUnits {
        id
        pk
        ...ReservationTypeFormFields
      }
    }
  }
  ${CreateTagStringFragmentDoc}
  ${ReservationCommonFieldsFragmentDoc}
  ${ReservationMetaFieldsFragmentDoc}
  ${ReservationTitleSectionFieldsFragmentDoc}
  ${UseStaffReservationFragmentDoc}
  ${ReservationTypeFormFieldsFragmentDoc}
`;

/**
 * __useReservationEditPageQuery__
 *
 * To run a query within a React component, call `useReservationEditPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationEditPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationEditPageQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationEditPageQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationEditPageQuery,
    ReservationEditPageQueryVariables
  > &
    (
      | { variables: ReservationEditPageQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationEditPageQuery,
    ReservationEditPageQueryVariables
  >(ReservationEditPageDocument, options);
}
export function useReservationEditPageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationEditPageQuery,
    ReservationEditPageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationEditPageQuery,
    ReservationEditPageQueryVariables
  >(ReservationEditPageDocument, options);
}
export function useReservationEditPageSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationEditPageQuery,
        ReservationEditPageQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationEditPageQuery,
    ReservationEditPageQueryVariables
  >(ReservationEditPageDocument, options);
}
export type ReservationEditPageQueryHookResult = ReturnType<
  typeof useReservationEditPageQuery
>;
export type ReservationEditPageLazyQueryHookResult = ReturnType<
  typeof useReservationEditPageLazyQuery
>;
export type ReservationEditPageSuspenseQueryHookResult = ReturnType<
  typeof useReservationEditPageSuspenseQuery
>;
export type ReservationEditPageQueryResult = Apollo.QueryResult<
  ReservationEditPageQuery,
  ReservationEditPageQueryVariables
>;
export const ReservationPageDocument = gql`
  query ReservationPage($id: ID!) {
    reservation(id: $id) {
      id
      ...CreateTagString
      ...ReservationCommonFields
      ...TimeBlockSection
      ...ReservationTitleSectionFields
      ...ReservationKeylessEntry
      recurringReservation {
        id
        pk
        beginDate
        beginTime
        endDate
        endTime
        weekdays
        name
        description
      }
      ...ApprovalButtons
      cancelReason {
        id
        reasonFi
      }
      denyReason {
        id
        reasonFi
      }
      reservationUnits {
        id
        pk
        reservationStartInterval
        ...ReservationTypeFormFields
      }
      ...ReservationMetaFields
    }
  }
  ${CreateTagStringFragmentDoc}
  ${ReservationCommonFieldsFragmentDoc}
  ${TimeBlockSectionFragmentDoc}
  ${ReservationTitleSectionFieldsFragmentDoc}
  ${ReservationKeylessEntryFragmentDoc}
  ${ApprovalButtonsFragmentDoc}
  ${ReservationTypeFormFieldsFragmentDoc}
  ${ReservationMetaFieldsFragmentDoc}
`;

/**
 * __useReservationPageQuery__
 *
 * To run a query within a React component, call `useReservationPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationPageQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationPageQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationPageQuery,
    ReservationPageQueryVariables
  > &
    (
      | { variables: ReservationPageQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ReservationPageQuery, ReservationPageQueryVariables>(
    ReservationPageDocument,
    options
  );
}
export function useReservationPageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationPageQuery,
    ReservationPageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationPageQuery,
    ReservationPageQueryVariables
  >(ReservationPageDocument, options);
}
export function useReservationPageSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationPageQuery,
        ReservationPageQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationPageQuery,
    ReservationPageQueryVariables
  >(ReservationPageDocument, options);
}
export type ReservationPageQueryHookResult = ReturnType<
  typeof useReservationPageQuery
>;
export type ReservationPageLazyQueryHookResult = ReturnType<
  typeof useReservationPageLazyQuery
>;
export type ReservationPageSuspenseQueryHookResult = ReturnType<
  typeof useReservationPageSuspenseQuery
>;
export type ReservationPageQueryResult = Apollo.QueryResult<
  ReservationPageQuery,
  ReservationPageQueryVariables
>;
export const SeriesPageDocument = gql`
  query SeriesPage($id: ID!) {
    reservation(id: $id) {
      id
      pk
      type
      recurringReservation {
        ...RecurringReservationFields
        recurrenceInDays
        endTime
        beginTime
      }
      reservationUnits {
        id
        pk
        nameFi
        bufferTimeBefore
        bufferTimeAfter
        reservationStartInterval
      }
    }
  }
  ${RecurringReservationFieldsFragmentDoc}
`;

/**
 * __useSeriesPageQuery__
 *
 * To run a query within a React component, call `useSeriesPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useSeriesPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSeriesPageQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useSeriesPageQuery(
  baseOptions: Apollo.QueryHookOptions<
    SeriesPageQuery,
    SeriesPageQueryVariables
  > &
    (
      | { variables: SeriesPageQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<SeriesPageQuery, SeriesPageQueryVariables>(
    SeriesPageDocument,
    options
  );
}
export function useSeriesPageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SeriesPageQuery,
    SeriesPageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<SeriesPageQuery, SeriesPageQueryVariables>(
    SeriesPageDocument,
    options
  );
}
export function useSeriesPageSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<SeriesPageQuery, SeriesPageQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<SeriesPageQuery, SeriesPageQueryVariables>(
    SeriesPageDocument,
    options
  );
}
export type SeriesPageQueryHookResult = ReturnType<typeof useSeriesPageQuery>;
export type SeriesPageLazyQueryHookResult = ReturnType<
  typeof useSeriesPageLazyQuery
>;
export type SeriesPageSuspenseQueryHookResult = ReturnType<
  typeof useSeriesPageSuspenseQuery
>;
export type SeriesPageQueryResult = Apollo.QueryResult<
  SeriesPageQuery,
  SeriesPageQueryVariables
>;
export const ReservationSeriesDocument = gql`
  query ReservationSeries($id: ID!) {
    recurringReservation(id: $id) {
      ...RecurringReservationFields
    }
  }
  ${RecurringReservationFieldsFragmentDoc}
`;

/**
 * __useReservationSeriesQuery__
 *
 * To run a query within a React component, call `useReservationSeriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationSeriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationSeriesQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationSeriesQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationSeriesQuery,
    ReservationSeriesQueryVariables
  > &
    (
      | { variables: ReservationSeriesQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationSeriesQuery,
    ReservationSeriesQueryVariables
  >(ReservationSeriesDocument, options);
}
export function useReservationSeriesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationSeriesQuery,
    ReservationSeriesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationSeriesQuery,
    ReservationSeriesQueryVariables
  >(ReservationSeriesDocument, options);
}
export function useReservationSeriesSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationSeriesQuery,
        ReservationSeriesQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationSeriesQuery,
    ReservationSeriesQueryVariables
  >(ReservationSeriesDocument, options);
}
export type ReservationSeriesQueryHookResult = ReturnType<
  typeof useReservationSeriesQuery
>;
export type ReservationSeriesLazyQueryHookResult = ReturnType<
  typeof useReservationSeriesLazyQuery
>;
export type ReservationSeriesSuspenseQueryHookResult = ReturnType<
  typeof useReservationSeriesSuspenseQuery
>;
export type ReservationSeriesQueryResult = Apollo.QueryResult<
  ReservationSeriesQuery,
  ReservationSeriesQueryVariables
>;
export const RescheduleReservationSeriesDocument = gql`
  mutation RescheduleReservationSeries(
    $input: ReservationSeriesRescheduleMutationInput!
  ) {
    rescheduleReservationSeries(input: $input) {
      pk
    }
  }
`;
export type RescheduleReservationSeriesMutationFn = Apollo.MutationFunction<
  RescheduleReservationSeriesMutation,
  RescheduleReservationSeriesMutationVariables
>;

/**
 * __useRescheduleReservationSeriesMutation__
 *
 * To run a mutation, you first call `useRescheduleReservationSeriesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRescheduleReservationSeriesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rescheduleReservationSeriesMutation, { data, loading, error }] = useRescheduleReservationSeriesMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRescheduleReservationSeriesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RescheduleReservationSeriesMutation,
    RescheduleReservationSeriesMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RescheduleReservationSeriesMutation,
    RescheduleReservationSeriesMutationVariables
  >(RescheduleReservationSeriesDocument, options);
}
export type RescheduleReservationSeriesMutationHookResult = ReturnType<
  typeof useRescheduleReservationSeriesMutation
>;
export type RescheduleReservationSeriesMutationResult =
  Apollo.MutationResult<RescheduleReservationSeriesMutation>;
export type RescheduleReservationSeriesMutationOptions =
  Apollo.BaseMutationOptions<
    RescheduleReservationSeriesMutation,
    RescheduleReservationSeriesMutationVariables
  >;
export const UpdateStaffReservationDocument = gql`
  mutation UpdateStaffReservation(
    $input: ReservationStaffModifyMutationInput!
    $workingMemo: ReservationWorkingMemoMutationInput!
  ) {
    staffReservationModify(input: $input) {
      pk
    }
    updateReservationWorkingMemo(input: $workingMemo) {
      workingMemo
    }
  }
`;
export type UpdateStaffReservationMutationFn = Apollo.MutationFunction<
  UpdateStaffReservationMutation,
  UpdateStaffReservationMutationVariables
>;

/**
 * __useUpdateStaffReservationMutation__
 *
 * To run a mutation, you first call `useUpdateStaffReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateStaffReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateStaffReservationMutation, { data, loading, error }] = useUpdateStaffReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *      workingMemo: // value for 'workingMemo'
 *   },
 * });
 */
export function useUpdateStaffReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateStaffReservationMutation,
    UpdateStaffReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateStaffReservationMutation,
    UpdateStaffReservationMutationVariables
  >(UpdateStaffReservationDocument, options);
}
export type UpdateStaffReservationMutationHookResult = ReturnType<
  typeof useUpdateStaffReservationMutation
>;
export type UpdateStaffReservationMutationResult =
  Apollo.MutationResult<UpdateStaffReservationMutation>;
export type UpdateStaffReservationMutationOptions = Apollo.BaseMutationOptions<
  UpdateStaffReservationMutation,
  UpdateStaffReservationMutationVariables
>;
export const UpdateRecurringReservationDocument = gql`
  mutation UpdateRecurringReservation(
    $input: ReservationSeriesUpdateMutationInput!
  ) {
    updateReservationSeries(input: $input) {
      pk
    }
  }
`;
export type UpdateRecurringReservationMutationFn = Apollo.MutationFunction<
  UpdateRecurringReservationMutation,
  UpdateRecurringReservationMutationVariables
>;

/**
 * __useUpdateRecurringReservationMutation__
 *
 * To run a mutation, you first call `useUpdateRecurringReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateRecurringReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateRecurringReservationMutation, { data, loading, error }] = useUpdateRecurringReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateRecurringReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateRecurringReservationMutation,
    UpdateRecurringReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateRecurringReservationMutation,
    UpdateRecurringReservationMutationVariables
  >(UpdateRecurringReservationDocument, options);
}
export type UpdateRecurringReservationMutationHookResult = ReturnType<
  typeof useUpdateRecurringReservationMutation
>;
export type UpdateRecurringReservationMutationResult =
  Apollo.MutationResult<UpdateRecurringReservationMutation>;
export type UpdateRecurringReservationMutationOptions =
  Apollo.BaseMutationOptions<
    UpdateRecurringReservationMutation,
    UpdateRecurringReservationMutationVariables
  >;
export const ReservationPermissionsDocument = gql`
  query ReservationPermissions($id: ID!) {
    reservation(id: $id) {
      id
      reservationUnits {
        id
        unit {
          id
          pk
        }
      }
    }
  }
`;

/**
 * __useReservationPermissionsQuery__
 *
 * To run a query within a React component, call `useReservationPermissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationPermissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationPermissionsQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationPermissionsQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationPermissionsQuery,
    ReservationPermissionsQueryVariables
  > &
    (
      | { variables: ReservationPermissionsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationPermissionsQuery,
    ReservationPermissionsQueryVariables
  >(ReservationPermissionsDocument, options);
}
export function useReservationPermissionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationPermissionsQuery,
    ReservationPermissionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationPermissionsQuery,
    ReservationPermissionsQueryVariables
  >(ReservationPermissionsDocument, options);
}
export function useReservationPermissionsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationPermissionsQuery,
        ReservationPermissionsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationPermissionsQuery,
    ReservationPermissionsQueryVariables
  >(ReservationPermissionsDocument, options);
}
export type ReservationPermissionsQueryHookResult = ReturnType<
  typeof useReservationPermissionsQuery
>;
export type ReservationPermissionsLazyQueryHookResult = ReturnType<
  typeof useReservationPermissionsLazyQuery
>;
export type ReservationPermissionsSuspenseQueryHookResult = ReturnType<
  typeof useReservationPermissionsSuspenseQuery
>;
export type ReservationPermissionsQueryResult = Apollo.QueryResult<
  ReservationPermissionsQuery,
  ReservationPermissionsQueryVariables
>;
export const DeleteResourceDocument = gql`
  mutation DeleteResource($input: ResourceDeleteMutationInput!) {
    deleteResource(input: $input) {
      deleted
    }
  }
`;
export type DeleteResourceMutationFn = Apollo.MutationFunction<
  DeleteResourceMutation,
  DeleteResourceMutationVariables
>;

/**
 * __useDeleteResourceMutation__
 *
 * To run a mutation, you first call `useDeleteResourceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteResourceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteResourceMutation, { data, loading, error }] = useDeleteResourceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteResourceMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteResourceMutation,
    DeleteResourceMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteResourceMutation,
    DeleteResourceMutationVariables
  >(DeleteResourceDocument, options);
}
export type DeleteResourceMutationHookResult = ReturnType<
  typeof useDeleteResourceMutation
>;
export type DeleteResourceMutationResult =
  Apollo.MutationResult<DeleteResourceMutation>;
export type DeleteResourceMutationOptions = Apollo.BaseMutationOptions<
  DeleteResourceMutation,
  DeleteResourceMutationVariables
>;
export const SpacesResourcesDocument = gql`
  query SpacesResources($id: ID!) {
    unit(id: $id) {
      id
      ...UnitSubpageHead
      ...SpacesTable
      ...ResourceTable
    }
  }
  ${UnitSubpageHeadFragmentDoc}
  ${SpacesTableFragmentDoc}
  ${ResourceTableFragmentDoc}
`;

/**
 * __useSpacesResourcesQuery__
 *
 * To run a query within a React component, call `useSpacesResourcesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSpacesResourcesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSpacesResourcesQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useSpacesResourcesQuery(
  baseOptions: Apollo.QueryHookOptions<
    SpacesResourcesQuery,
    SpacesResourcesQueryVariables
  > &
    (
      | { variables: SpacesResourcesQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<SpacesResourcesQuery, SpacesResourcesQueryVariables>(
    SpacesResourcesDocument,
    options
  );
}
export function useSpacesResourcesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SpacesResourcesQuery,
    SpacesResourcesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    SpacesResourcesQuery,
    SpacesResourcesQueryVariables
  >(SpacesResourcesDocument, options);
}
export function useSpacesResourcesSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        SpacesResourcesQuery,
        SpacesResourcesQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    SpacesResourcesQuery,
    SpacesResourcesQueryVariables
  >(SpacesResourcesDocument, options);
}
export type SpacesResourcesQueryHookResult = ReturnType<
  typeof useSpacesResourcesQuery
>;
export type SpacesResourcesLazyQueryHookResult = ReturnType<
  typeof useSpacesResourcesLazyQuery
>;
export type SpacesResourcesSuspenseQueryHookResult = ReturnType<
  typeof useSpacesResourcesSuspenseQuery
>;
export type SpacesResourcesQueryResult = Apollo.QueryResult<
  SpacesResourcesQuery,
  SpacesResourcesQueryVariables
>;
export const DeleteSpaceDocument = gql`
  mutation DeleteSpace($input: SpaceDeleteMutationInput!) {
    deleteSpace(input: $input) {
      deleted
    }
  }
`;
export type DeleteSpaceMutationFn = Apollo.MutationFunction<
  DeleteSpaceMutation,
  DeleteSpaceMutationVariables
>;

/**
 * __useDeleteSpaceMutation__
 *
 * To run a mutation, you first call `useDeleteSpaceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteSpaceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteSpaceMutation, { data, loading, error }] = useDeleteSpaceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteSpaceMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteSpaceMutation,
    DeleteSpaceMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteSpaceMutation, DeleteSpaceMutationVariables>(
    DeleteSpaceDocument,
    options
  );
}
export type DeleteSpaceMutationHookResult = ReturnType<
  typeof useDeleteSpaceMutation
>;
export type DeleteSpaceMutationResult =
  Apollo.MutationResult<DeleteSpaceMutation>;
export type DeleteSpaceMutationOptions = Apollo.BaseMutationOptions<
  DeleteSpaceMutation,
  DeleteSpaceMutationVariables
>;
export const UnitListDocument = gql`
  query UnitList(
    $first: Int
    $after: String
    $orderBy: [UnitOrderingChoices]
    $nameFi: String
  ) {
    units(
      first: $first
      after: $after
      orderBy: $orderBy
      nameFi: $nameFi
      onlyWithPermission: true
    ) {
      edges {
        node {
          ...UnitTableElement
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${UnitTableElementFragmentDoc}
`;

/**
 * __useUnitListQuery__
 *
 * To run a query within a React component, call `useUnitListQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnitListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnitListQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      orderBy: // value for 'orderBy'
 *      nameFi: // value for 'nameFi'
 *   },
 * });
 */
export function useUnitListQuery(
  baseOptions?: Apollo.QueryHookOptions<UnitListQuery, UnitListQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<UnitListQuery, UnitListQueryVariables>(
    UnitListDocument,
    options
  );
}
export function useUnitListLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    UnitListQuery,
    UnitListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<UnitListQuery, UnitListQueryVariables>(
    UnitListDocument,
    options
  );
}
export function useUnitListSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<UnitListQuery, UnitListQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<UnitListQuery, UnitListQueryVariables>(
    UnitListDocument,
    options
  );
}
export type UnitListQueryHookResult = ReturnType<typeof useUnitListQuery>;
export type UnitListLazyQueryHookResult = ReturnType<
  typeof useUnitListLazyQuery
>;
export type UnitListSuspenseQueryHookResult = ReturnType<
  typeof useUnitListSuspenseQuery
>;
export type UnitListQueryResult = Apollo.QueryResult<
  UnitListQuery,
  UnitListQueryVariables
>;
export const UnitPageDocument = gql`
  query UnitPage($id: ID!) {
    unit(id: $id) {
      id
      pk
      nameFi
      tprekId
      shortDescriptionFi
      reservationUnits {
        ...ReservationUnitCard
      }
      ...NewResourceUnitFields
    }
  }
  ${ReservationUnitCardFragmentDoc}
  ${NewResourceUnitFieldsFragmentDoc}
`;

/**
 * __useUnitPageQuery__
 *
 * To run a query within a React component, call `useUnitPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnitPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnitPageQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUnitPageQuery(
  baseOptions: Apollo.QueryHookOptions<UnitPageQuery, UnitPageQueryVariables> &
    ({ variables: UnitPageQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<UnitPageQuery, UnitPageQueryVariables>(
    UnitPageDocument,
    options
  );
}
export function useUnitPageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    UnitPageQuery,
    UnitPageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<UnitPageQuery, UnitPageQueryVariables>(
    UnitPageDocument,
    options
  );
}
export function useUnitPageSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<UnitPageQuery, UnitPageQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<UnitPageQuery, UnitPageQueryVariables>(
    UnitPageDocument,
    options
  );
}
export type UnitPageQueryHookResult = ReturnType<typeof useUnitPageQuery>;
export type UnitPageLazyQueryHookResult = ReturnType<
  typeof useUnitPageLazyQuery
>;
export type UnitPageSuspenseQueryHookResult = ReturnType<
  typeof useUnitPageSuspenseQuery
>;
export type UnitPageQueryResult = Apollo.QueryResult<
  UnitPageQuery,
  UnitPageQueryVariables
>;
export const CreateResourceDocument = gql`
  mutation CreateResource($input: ResourceCreateMutationInput!) {
    createResource(input: $input) {
      pk
    }
  }
`;
export type CreateResourceMutationFn = Apollo.MutationFunction<
  CreateResourceMutation,
  CreateResourceMutationVariables
>;

/**
 * __useCreateResourceMutation__
 *
 * To run a mutation, you first call `useCreateResourceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateResourceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createResourceMutation, { data, loading, error }] = useCreateResourceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateResourceMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateResourceMutation,
    CreateResourceMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateResourceMutation,
    CreateResourceMutationVariables
  >(CreateResourceDocument, options);
}
export type CreateResourceMutationHookResult = ReturnType<
  typeof useCreateResourceMutation
>;
export type CreateResourceMutationResult =
  Apollo.MutationResult<CreateResourceMutation>;
export type CreateResourceMutationOptions = Apollo.BaseMutationOptions<
  CreateResourceMutation,
  CreateResourceMutationVariables
>;
export const ResourceDocument = gql`
  query Resource($id: ID!, $unitId: ID!) {
    resource(id: $id) {
      id
      pk
      nameFi
      nameSv
      nameEn
      space {
        id
        pk
      }
    }
    unit(id: $unitId) {
      id
      pk
      nameFi
      location {
        ...LocationFields
      }
    }
  }
  ${LocationFieldsFragmentDoc}
`;

/**
 * __useResourceQuery__
 *
 * To run a query within a React component, call `useResourceQuery` and pass it any options that fit your needs.
 * When your component renders, `useResourceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useResourceQuery({
 *   variables: {
 *      id: // value for 'id'
 *      unitId: // value for 'unitId'
 *   },
 * });
 */
export function useResourceQuery(
  baseOptions: Apollo.QueryHookOptions<ResourceQuery, ResourceQueryVariables> &
    ({ variables: ResourceQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ResourceQuery, ResourceQueryVariables>(
    ResourceDocument,
    options
  );
}
export function useResourceLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ResourceQuery,
    ResourceQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ResourceQuery, ResourceQueryVariables>(
    ResourceDocument,
    options
  );
}
export function useResourceSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<ResourceQuery, ResourceQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<ResourceQuery, ResourceQueryVariables>(
    ResourceDocument,
    options
  );
}
export type ResourceQueryHookResult = ReturnType<typeof useResourceQuery>;
export type ResourceLazyQueryHookResult = ReturnType<
  typeof useResourceLazyQuery
>;
export type ResourceSuspenseQueryHookResult = ReturnType<
  typeof useResourceSuspenseQuery
>;
export type ResourceQueryResult = Apollo.QueryResult<
  ResourceQuery,
  ResourceQueryVariables
>;
export const UpdateResourceDocument = gql`
  mutation UpdateResource($input: ResourceUpdateMutationInput!) {
    updateResource(input: $input) {
      pk
    }
  }
`;
export type UpdateResourceMutationFn = Apollo.MutationFunction<
  UpdateResourceMutation,
  UpdateResourceMutationVariables
>;

/**
 * __useUpdateResourceMutation__
 *
 * To run a mutation, you first call `useUpdateResourceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateResourceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateResourceMutation, { data, loading, error }] = useUpdateResourceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateResourceMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateResourceMutation,
    UpdateResourceMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateResourceMutation,
    UpdateResourceMutationVariables
  >(UpdateResourceDocument, options);
}
export type UpdateResourceMutationHookResult = ReturnType<
  typeof useUpdateResourceMutation
>;
export type UpdateResourceMutationResult =
  Apollo.MutationResult<UpdateResourceMutation>;
export type UpdateResourceMutationOptions = Apollo.BaseMutationOptions<
  UpdateResourceMutation,
  UpdateResourceMutationVariables
>;
export const UnitSpacesDocument = gql`
  query UnitSpaces($id: ID!) {
    unit(id: $id) {
      id
      spaces {
        id
        pk
        nameFi
        parent {
          id
          pk
        }
      }
    }
  }
`;

/**
 * __useUnitSpacesQuery__
 *
 * To run a query within a React component, call `useUnitSpacesQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnitSpacesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnitSpacesQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUnitSpacesQuery(
  baseOptions: Apollo.QueryHookOptions<
    UnitSpacesQuery,
    UnitSpacesQueryVariables
  > &
    (
      | { variables: UnitSpacesQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<UnitSpacesQuery, UnitSpacesQueryVariables>(
    UnitSpacesDocument,
    options
  );
}
export function useUnitSpacesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    UnitSpacesQuery,
    UnitSpacesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<UnitSpacesQuery, UnitSpacesQueryVariables>(
    UnitSpacesDocument,
    options
  );
}
export function useUnitSpacesSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<UnitSpacesQuery, UnitSpacesQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<UnitSpacesQuery, UnitSpacesQueryVariables>(
    UnitSpacesDocument,
    options
  );
}
export type UnitSpacesQueryHookResult = ReturnType<typeof useUnitSpacesQuery>;
export type UnitSpacesLazyQueryHookResult = ReturnType<
  typeof useUnitSpacesLazyQuery
>;
export type UnitSpacesSuspenseQueryHookResult = ReturnType<
  typeof useUnitSpacesSuspenseQuery
>;
export type UnitSpacesQueryResult = Apollo.QueryResult<
  UnitSpacesQuery,
  UnitSpacesQueryVariables
>;
export const UpdateSpaceDocument = gql`
  mutation UpdateSpace($input: SpaceUpdateMutationInput!) {
    updateSpace(input: $input) {
      pk
    }
  }
`;
export type UpdateSpaceMutationFn = Apollo.MutationFunction<
  UpdateSpaceMutation,
  UpdateSpaceMutationVariables
>;

/**
 * __useUpdateSpaceMutation__
 *
 * To run a mutation, you first call `useUpdateSpaceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSpaceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSpaceMutation, { data, loading, error }] = useUpdateSpaceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateSpaceMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateSpaceMutation,
    UpdateSpaceMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateSpaceMutation, UpdateSpaceMutationVariables>(
    UpdateSpaceDocument,
    options
  );
}
export type UpdateSpaceMutationHookResult = ReturnType<
  typeof useUpdateSpaceMutation
>;
export type UpdateSpaceMutationResult =
  Apollo.MutationResult<UpdateSpaceMutation>;
export type UpdateSpaceMutationOptions = Apollo.BaseMutationOptions<
  UpdateSpaceMutation,
  UpdateSpaceMutationVariables
>;
export const SpaceDocument = gql`
  query Space($id: ID!) {
    space(id: $id) {
      id
      pk
      nameFi
      nameSv
      nameEn
      code
      surfaceArea
      maxPersons
      unit {
        id
        ...UnitSubpageHead
        descriptionFi
        spaces {
          id
          pk
          nameFi
        }
      }
      parent {
        id
        pk
        nameFi
        parent {
          id
          nameFi
          parent {
            id
            nameFi
          }
        }
      }
    }
  }
  ${UnitSubpageHeadFragmentDoc}
`;

/**
 * __useSpaceQuery__
 *
 * To run a query within a React component, call `useSpaceQuery` and pass it any options that fit your needs.
 * When your component renders, `useSpaceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSpaceQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useSpaceQuery(
  baseOptions: Apollo.QueryHookOptions<SpaceQuery, SpaceQueryVariables> &
    ({ variables: SpaceQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<SpaceQuery, SpaceQueryVariables>(
    SpaceDocument,
    options
  );
}
export function useSpaceLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<SpaceQuery, SpaceQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<SpaceQuery, SpaceQueryVariables>(
    SpaceDocument,
    options
  );
}
export function useSpaceSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<SpaceQuery, SpaceQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<SpaceQuery, SpaceQueryVariables>(
    SpaceDocument,
    options
  );
}
export type SpaceQueryHookResult = ReturnType<typeof useSpaceQuery>;
export type SpaceLazyQueryHookResult = ReturnType<typeof useSpaceLazyQuery>;
export type SpaceSuspenseQueryHookResult = ReturnType<
  typeof useSpaceSuspenseQuery
>;
export type SpaceQueryResult = Apollo.QueryResult<
  SpaceQuery,
  SpaceQueryVariables
>;
export const CreateSpaceDocument = gql`
  mutation CreateSpace($input: SpaceCreateMutationInput!) {
    createSpace(input: $input) {
      pk
    }
  }
`;
export type CreateSpaceMutationFn = Apollo.MutationFunction<
  CreateSpaceMutation,
  CreateSpaceMutationVariables
>;

/**
 * __useCreateSpaceMutation__
 *
 * To run a mutation, you first call `useCreateSpaceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSpaceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSpaceMutation, { data, loading, error }] = useCreateSpaceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSpaceMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateSpaceMutation,
    CreateSpaceMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateSpaceMutation, CreateSpaceMutationVariables>(
    CreateSpaceDocument,
    options
  );
}
export type CreateSpaceMutationHookResult = ReturnType<
  typeof useCreateSpaceMutation
>;
export type CreateSpaceMutationResult =
  Apollo.MutationResult<CreateSpaceMutation>;
export type CreateSpaceMutationOptions = Apollo.BaseMutationOptions<
  CreateSpaceMutation,
  CreateSpaceMutationVariables
>;
