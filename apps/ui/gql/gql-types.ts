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
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
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
  city: Scalars["String"]["output"];
  cityEn?: Maybe<Scalars["String"]["output"]>;
  cityFi?: Maybe<Scalars["String"]["output"]>;
  citySv?: Maybe<Scalars["String"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  postCode: Scalars["String"]["output"];
  streetAddress: Scalars["String"]["output"];
  streetAddressEn?: Maybe<Scalars["String"]["output"]>;
  streetAddressFi?: Maybe<Scalars["String"]["output"]>;
  streetAddressSv?: Maybe<Scalars["String"]["output"]>;
};

export type AddressSerializerInput = {
  city: Scalars["String"]["input"];
  cityEn?: InputMaybe<Scalars["String"]["input"]>;
  cityFi?: InputMaybe<Scalars["String"]["input"]>;
  citySv?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  postCode: Scalars["String"]["input"];
  streetAddress: Scalars["String"]["input"];
  streetAddressEn?: InputMaybe<Scalars["String"]["input"]>;
  streetAddressFi?: InputMaybe<Scalars["String"]["input"]>;
  streetAddressSv?: InputMaybe<Scalars["String"]["input"]>;
};

export type AgeGroupNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  maximum?: Maybe<Scalars["Int"]["output"]>;
  minimum: Scalars["Int"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type AgeGroupNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<AgeGroupNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `AgeGroupNode` and its cursor. */
export type AgeGroupNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<AgeGroupNode>;
};

export type AllocatedTimeSlotCreateMutationInput = {
  beginTime: Scalars["Time"]["input"];
  dayOfTheWeek: Weekday;
  endTime: Scalars["Time"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnitOption: Scalars["Int"]["input"];
};

export type AllocatedTimeSlotCreateMutationPayload = {
  beginTime?: Maybe<Scalars["Time"]["output"]>;
  dayOfTheWeek?: Maybe<Weekday>;
  endTime?: Maybe<Scalars["Time"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationUnitOption?: Maybe<Scalars["Int"]["output"]>;
};

export type AllocatedTimeSlotDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type AllocatedTimeSlotDeleteMutationPayload = {
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type AllocatedTimeSlotNode = Node & {
  beginTime: Scalars["Time"]["output"];
  dayOfTheWeek: Weekday;
  endTime: Scalars["Time"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  recurringReservation?: Maybe<RecurringReservationNode>;
  reservationUnitOption: ReservationUnitOptionNode;
};

export type AllocatedTimeSlotNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<AllocatedTimeSlotNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `AllocatedTimeSlotNode` and its cursor. */
export type AllocatedTimeSlotNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<AllocatedTimeSlotNode>;
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
  dateOfBirth?: Maybe<Scalars["Date"]["output"]>;
  email: Scalars["String"]["output"];
  firstName: Scalars["String"]["output"];
  generalRoles: Array<GeneralRoleNode>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  isAdAuthenticated?: Maybe<Scalars["Boolean"]["output"]>;
  isStronglyAuthenticated?: Maybe<Scalars["Boolean"]["output"]>;
  /** Antaa käyttäjälle kaikki oikeudet ilman, että niitä täytyy erikseen luetella. */
  isSuperuser: Scalars["Boolean"]["output"];
  lastName: Scalars["String"]["output"];
  name?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationNotification?: Maybe<Scalars["String"]["output"]>;
  unitRoles: Array<UnitRoleNode>;
  /** Vaaditaan. Enintään 150 merkkiä. Vain kirjaimet, numerot ja @/./+/-/_ ovat sallittuja. */
  username: Scalars["String"]["output"];
  uuid: Scalars["UUID"]["output"];
};

/** An enumeration. */
export enum ApplicantTypeChoice {
  Association = "ASSOCIATION",
  Community = "COMMUNITY",
  Company = "COMPANY",
  Individual = "INDIVIDUAL",
}

export type ApplicationCancelMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type ApplicationCancelMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ApplicationCreateMutationInput = {
  additionalInformation?: InputMaybe<Scalars["String"]["input"]>;
  applicantType?: InputMaybe<ApplicantTypeChoice>;
  applicationRound: Scalars["Int"]["input"];
  applicationSections?: InputMaybe<
    Array<InputMaybe<ApplicationSectionForApplicationSerializerInput>>
  >;
  billingAddress?: InputMaybe<AddressSerializerInput>;
  contactPerson?: InputMaybe<PersonSerializerInput>;
  homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  organisation?: InputMaybe<OrganisationSerializerInput>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ApplicationCreateMutationPayload = {
  additionalInformation?: Maybe<Scalars["String"]["output"]>;
  applicantType?: Maybe<ApplicantTypeChoice>;
  applicationRound?: Maybe<Scalars["Int"]["output"]>;
  applicationSections?: Maybe<Array<Maybe<ApplicationSectionNode>>>;
  billingAddress?: Maybe<AddressNode>;
  cancelledDate?: Maybe<Scalars["DateTime"]["output"]>;
  contactPerson?: Maybe<PersonNode>;
  createdDate?: Maybe<Scalars["DateTime"]["output"]>;
  homeCity?: Maybe<Scalars["Int"]["output"]>;
  lastModifiedDate?: Maybe<Scalars["DateTime"]["output"]>;
  organisation?: Maybe<OrganisationNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  sentDate?: Maybe<Scalars["DateTime"]["output"]>;
  status?: Maybe<Status>;
};

export type ApplicationNode = Node & {
  additionalInformation?: Maybe<Scalars["String"]["output"]>;
  applicantType?: Maybe<ApplicantTypeChoice>;
  applicationRound: ApplicationRoundNode;
  applicationSections?: Maybe<Array<ApplicationSectionNode>>;
  billingAddress?: Maybe<AddressNode>;
  cancelledDate?: Maybe<Scalars["DateTime"]["output"]>;
  contactPerson?: Maybe<PersonNode>;
  createdDate: Scalars["DateTime"]["output"];
  homeCity?: Maybe<CityNode>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  lastModifiedDate: Scalars["DateTime"]["output"];
  organisation?: Maybe<OrganisationNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  sentDate?: Maybe<Scalars["DateTime"]["output"]>;
  status?: Maybe<ApplicationStatusChoice>;
  user?: Maybe<ApplicantNode>;
  workingMemo: Scalars["String"]["output"];
};

export type ApplicationNodeApplicationSectionsArgs = {
  ageGroup?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  applicantType?: InputMaybe<Array<InputMaybe<ApplicantTypeChoice>>>;
  application?: InputMaybe<Scalars["Int"]["input"]>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  applicationStatus?: InputMaybe<Array<InputMaybe<ApplicationStatusChoice>>>;
  extUuid?: InputMaybe<Scalars["UUID"]["input"]>;
  hasAllocations?: InputMaybe<Scalars["Boolean"]["input"]>;
  homeCity?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  includePreferredOrder10OrHigher?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ApplicationSectionOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  preferredOrder?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  priority?: InputMaybe<Array<InputMaybe<Priority>>>;
  purpose?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  status?: InputMaybe<Array<InputMaybe<ApplicationSectionStatusChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ApplicationNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ApplicationNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ApplicationNode` and its cursor. */
export type ApplicationNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ApplicationNode>;
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
  applicationPeriodBegin: Scalars["DateTime"]["output"];
  applicationPeriodEnd: Scalars["DateTime"]["output"];
  applicationsCount?: Maybe<Scalars["Int"]["output"]>;
  criteria: Scalars["String"]["output"];
  criteriaEn?: Maybe<Scalars["String"]["output"]>;
  criteriaFi?: Maybe<Scalars["String"]["output"]>;
  criteriaSv?: Maybe<Scalars["String"]["output"]>;
  handledDate?: Maybe<Scalars["DateTime"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  isSettingHandledAllowed?: Maybe<Scalars["Boolean"]["output"]>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  notesWhenApplying: Scalars["String"]["output"];
  notesWhenApplyingEn?: Maybe<Scalars["String"]["output"]>;
  notesWhenApplyingFi?: Maybe<Scalars["String"]["output"]>;
  notesWhenApplyingSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  publicDisplayBegin: Scalars["DateTime"]["output"];
  publicDisplayEnd: Scalars["DateTime"]["output"];
  purposes: Array<ReservationPurposeNode>;
  reservationCreationStatus?: Maybe<ApplicationRoundReservationCreationStatusChoice>;
  reservationPeriodBegin: Scalars["Date"]["output"];
  reservationPeriodEnd: Scalars["Date"]["output"];
  reservationUnitCount?: Maybe<Scalars["Int"]["output"]>;
  reservationUnits: Array<ReservationUnitNode>;
  sentDate?: Maybe<Scalars["DateTime"]["output"]>;
  status?: Maybe<ApplicationRoundStatusChoice>;
  statusTimestamp?: Maybe<Scalars["DateTime"]["output"]>;
  termsOfUse?: Maybe<TermsOfUseNode>;
};

export type ApplicationRoundNodePurposesArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationPurposeOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ApplicationRoundNodeReservationUnitsArgs = {
  accessType?: InputMaybe<Array<InputMaybe<AccessType>>>;
  accessTypeBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  accessTypeEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  applicationRound?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  calculateFirstReservableTime?: InputMaybe<Scalars["Boolean"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  equipments?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]["input"]>;
  maxPersonsGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  maxPersonsLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  minPersonsGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  minPersonsLte?: InputMaybe<Scalars["Decimal"]["input"]>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ReservationUnitOrderingChoices>>>;
  personsAllowed?: InputMaybe<Scalars["Decimal"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  publishingState?: InputMaybe<
    Array<InputMaybe<ReservationUnitPublishingState>>
  >;
  purposes?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifiers?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  rankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  reservableDateEnd?: InputMaybe<Scalars["Date"]["input"]>;
  reservableDateStart?: InputMaybe<Scalars["Date"]["input"]>;
  reservableMinimumDurationMinutes?: InputMaybe<Scalars["Decimal"]["input"]>;
  reservableTimeEnd?: InputMaybe<Scalars["Time"]["input"]>;
  reservableTimeStart?: InputMaybe<Scalars["Time"]["input"]>;
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
  reservationState?: InputMaybe<
    Array<InputMaybe<ReservationUnitReservationState>>
  >;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  surfaceAreaGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  tprekDepartmentId?: InputMaybe<Scalars["String"]["input"]>;
  tprekId?: InputMaybe<Scalars["String"]["input"]>;
  typeRankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  typeRankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  uuid?: InputMaybe<Scalars["UUID"]["input"]>;
};

export type ApplicationRoundNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ApplicationRoundNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ApplicationRoundNode` and its cursor. */
export type ApplicationRoundNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ApplicationRoundNode>;
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
  closed: Scalars["Boolean"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservableTimes?: Maybe<Array<Maybe<TimeSlotType>>>;
  weekday: Scalars["Int"]["output"];
};

export type ApplicationRoundTimeSlotSerializerInput = {
  closed?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservableTimes?: InputMaybe<Array<InputMaybe<TimeSlotSerializerInput>>>;
  weekday: Scalars["Int"]["input"];
};

export type ApplicationSectionCreateMutationInput = {
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  application: Scalars["Int"]["input"];
  appliedReservationsPerWeek: Scalars["Int"]["input"];
  name: Scalars["String"]["input"];
  numPersons: Scalars["Int"]["input"];
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
  reservationMaxDuration: Scalars["Duration"]["input"];
  reservationMinDuration: Scalars["Duration"]["input"];
  reservationUnitOptions: Array<
    InputMaybe<ReservationUnitOptionApplicantSerializerInput>
  >;
  reservationsBeginDate: Scalars["Date"]["input"];
  reservationsEndDate: Scalars["Date"]["input"];
  suitableTimeRanges: Array<InputMaybe<SuitableTimeRangeSerializerInput>>;
};

export type ApplicationSectionCreateMutationPayload = {
  ageGroup?: Maybe<Scalars["Int"]["output"]>;
  application?: Maybe<Scalars["Int"]["output"]>;
  appliedReservationsPerWeek?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  purpose?: Maybe<Scalars["Int"]["output"]>;
  reservationMaxDuration?: Maybe<Scalars["Duration"]["output"]>;
  reservationMinDuration?: Maybe<Scalars["Duration"]["output"]>;
  reservationUnitOptions?: Maybe<Array<Maybe<ReservationUnitOptionNode>>>;
  reservationsBeginDate?: Maybe<Scalars["Date"]["output"]>;
  reservationsEndDate?: Maybe<Scalars["Date"]["output"]>;
  suitableTimeRanges?: Maybe<Array<Maybe<SuitableTimeRangeNode>>>;
};

export type ApplicationSectionDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type ApplicationSectionDeleteMutationPayload = {
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type ApplicationSectionForApplicationSerializerInput = {
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  appliedReservationsPerWeek: Scalars["Int"]["input"];
  name: Scalars["String"]["input"];
  numPersons: Scalars["Int"]["input"];
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
  reservationMaxDuration: Scalars["Duration"]["input"];
  reservationMinDuration: Scalars["Duration"]["input"];
  reservationUnitOptions: Array<
    InputMaybe<ReservationUnitOptionApplicantSerializerInput>
  >;
  reservationsBeginDate: Scalars["Date"]["input"];
  reservationsEndDate: Scalars["Date"]["input"];
  suitableTimeRanges: Array<InputMaybe<SuitableTimeRangeSerializerInput>>;
};

export type ApplicationSectionNode = Node & {
  ageGroup?: Maybe<AgeGroupNode>;
  allocations?: Maybe<Scalars["Int"]["output"]>;
  application: ApplicationNode;
  appliedReservationsPerWeek: Scalars["Int"]["output"];
  extUuid: Scalars["UUID"]["output"];
  hasReservations: Scalars["Boolean"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  numPersons: Scalars["Int"]["output"];
  /** Info fetched from Pindora API. Cached per reservation for 30s. Please don't use this when filtering multiple sections, queries to Pindora are not optimized. */
  pindoraInfo?: Maybe<PindoraSectionInfoType>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  purpose?: Maybe<ReservationPurposeNode>;
  reservationMaxDuration: Scalars["Duration"]["output"];
  reservationMinDuration: Scalars["Duration"]["output"];
  reservationUnitOptions: Array<ReservationUnitOptionNode>;
  reservationsBeginDate: Scalars["Date"]["output"];
  reservationsEndDate: Scalars["Date"]["output"];
  shouldHaveActiveAccessCode?: Maybe<Scalars["Boolean"]["output"]>;
  status?: Maybe<ApplicationSectionStatusChoice>;
  suitableTimeRanges: Array<SuitableTimeRangeNode>;
};

export type ApplicationSectionNodeReservationUnitOptionsArgs = {
  orderBy?: InputMaybe<Array<InputMaybe<ReservationUnitOptionOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  preferredOrder?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ApplicationSectionNodeSuitableTimeRangesArgs = {
  fulfilled?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<SuitableTimeRangeOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  priority?: InputMaybe<Array<InputMaybe<Priority>>>;
};

export type ApplicationSectionNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ApplicationSectionNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ApplicationSectionNode` and its cursor. */
export type ApplicationSectionNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ApplicationSectionNode>;
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
  cancelDetails?: InputMaybe<Scalars["String"]["input"]>;
  cancelReason: Scalars["Int"]["input"];
  pk: Scalars["Int"]["input"];
};

export type ApplicationSectionReservationCancellationMutationPayload = {
  cancelled?: Maybe<Scalars["Int"]["output"]>;
  future?: Maybe<Scalars["Int"]["output"]>;
};

/** An enumeration. */
export enum ApplicationSectionStatusChoice {
  Handled = "HANDLED",
  InAllocation = "IN_ALLOCATION",
  Rejected = "REJECTED",
  Unallocated = "UNALLOCATED",
}

export type ApplicationSectionUpdateMutationInput = {
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  application?: InputMaybe<Scalars["Int"]["input"]>;
  appliedReservationsPerWeek?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk: Scalars["Int"]["input"];
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
  reservationMaxDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  reservationMinDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  reservationUnitOptions?: InputMaybe<
    Array<InputMaybe<UpdateReservationUnitOptionApplicantSerializerInput>>
  >;
  reservationsBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  reservationsEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  suitableTimeRanges?: InputMaybe<
    Array<InputMaybe<UpdateSuitableTimeRangeSerializerInput>>
  >;
};

export type ApplicationSectionUpdateMutationPayload = {
  ageGroup?: Maybe<Scalars["Int"]["output"]>;
  application?: Maybe<Scalars["Int"]["output"]>;
  appliedReservationsPerWeek?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  purpose?: Maybe<Scalars["Int"]["output"]>;
  reservationMaxDuration?: Maybe<Scalars["Duration"]["output"]>;
  reservationMinDuration?: Maybe<Scalars["Duration"]["output"]>;
  reservationUnitOptions?: Maybe<Array<Maybe<ReservationUnitOptionNode>>>;
  reservationsBeginDate?: Maybe<Scalars["Date"]["output"]>;
  reservationsEndDate?: Maybe<Scalars["Date"]["output"]>;
  suitableTimeRanges?: Maybe<Array<Maybe<SuitableTimeRangeNode>>>;
};

export type ApplicationSendMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type ApplicationSendMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
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
  additionalInformation?: InputMaybe<Scalars["String"]["input"]>;
  applicantType?: InputMaybe<ApplicantTypeChoice>;
  applicationSections?: InputMaybe<
    Array<InputMaybe<UpdateApplicationSectionForApplicationSerializerInput>>
  >;
  billingAddress?: InputMaybe<UpdateAddressSerializerInput>;
  contactPerson?: InputMaybe<UpdatePersonSerializerInput>;
  homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  organisation?: InputMaybe<UpdateOrganisationSerializerInput>;
  pk: Scalars["Int"]["input"];
};

export type ApplicationUpdateMutationPayload = {
  additionalInformation?: Maybe<Scalars["String"]["output"]>;
  applicantType?: Maybe<ApplicantTypeChoice>;
  applicationRound?: Maybe<Scalars["ID"]["output"]>;
  applicationSections?: Maybe<Array<Maybe<ApplicationSectionNode>>>;
  billingAddress?: Maybe<AddressNode>;
  cancelledDate?: Maybe<Scalars["DateTime"]["output"]>;
  contactPerson?: Maybe<PersonNode>;
  createdDate?: Maybe<Scalars["DateTime"]["output"]>;
  homeCity?: Maybe<Scalars["Int"]["output"]>;
  lastModifiedDate?: Maybe<Scalars["DateTime"]["output"]>;
  organisation?: Maybe<OrganisationNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  sentDate?: Maybe<Scalars["DateTime"]["output"]>;
  status?: Maybe<Status>;
  user?: Maybe<Scalars["ID"]["output"]>;
};

export type ApplicationWorkingMemoMutationInput = {
  pk: Scalars["Int"]["input"];
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ApplicationWorkingMemoMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
  workingMemo?: Maybe<Scalars["String"]["output"]>;
};

/** An enumeration. */
export enum Authentication {
  /** Vahva */
  Strong = "STRONG",
  /** Heikko */
  Weak = "WEAK",
}

export type BannerNotificationCreateMutationInput = {
  activeFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  activeUntil?: InputMaybe<Scalars["DateTime"]["input"]>;
  draft?: InputMaybe<Scalars["Boolean"]["input"]>;
  level: BannerNotificationLevel;
  message?: InputMaybe<Scalars["String"]["input"]>;
  messageEn?: InputMaybe<Scalars["String"]["input"]>;
  messageFi?: InputMaybe<Scalars["String"]["input"]>;
  messageSv?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  target: BannerNotificationTarget;
};

export type BannerNotificationCreateMutationPayload = {
  activeFrom?: Maybe<Scalars["DateTime"]["output"]>;
  activeUntil?: Maybe<Scalars["DateTime"]["output"]>;
  draft?: Maybe<Scalars["Boolean"]["output"]>;
  level?: Maybe<BannerNotificationLevel>;
  message?: Maybe<Scalars["String"]["output"]>;
  messageEn?: Maybe<Scalars["String"]["output"]>;
  messageFi?: Maybe<Scalars["String"]["output"]>;
  messageSv?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  target?: Maybe<BannerNotificationTarget>;
};

export type BannerNotificationDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type BannerNotificationDeleteMutationPayload = {
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
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
  activeFrom?: Maybe<Scalars["DateTime"]["output"]>;
  activeUntil?: Maybe<Scalars["DateTime"]["output"]>;
  draft: Scalars["Boolean"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  level: BannerNotificationLevel;
  message: Scalars["String"]["output"];
  messageEn?: Maybe<Scalars["String"]["output"]>;
  messageFi?: Maybe<Scalars["String"]["output"]>;
  messageSv?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<BannerNotificationState>;
  target: BannerNotificationTarget;
};

export type BannerNotificationNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<BannerNotificationNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `BannerNotificationNode` and its cursor. */
export type BannerNotificationNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<BannerNotificationNode>;
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
  activeFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  activeUntil?: InputMaybe<Scalars["DateTime"]["input"]>;
  draft?: InputMaybe<Scalars["Boolean"]["input"]>;
  level?: InputMaybe<BannerNotificationLevel>;
  message?: InputMaybe<Scalars["String"]["input"]>;
  messageEn?: InputMaybe<Scalars["String"]["input"]>;
  messageFi?: InputMaybe<Scalars["String"]["input"]>;
  messageSv?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
  target?: InputMaybe<BannerNotificationTarget>;
};

export type BannerNotificationUpdateMutationPayload = {
  activeFrom?: Maybe<Scalars["DateTime"]["output"]>;
  activeUntil?: Maybe<Scalars["DateTime"]["output"]>;
  draft?: Maybe<Scalars["Boolean"]["output"]>;
  level?: Maybe<BannerNotificationLevel>;
  message?: Maybe<Scalars["String"]["output"]>;
  messageEn?: Maybe<Scalars["String"]["output"]>;
  messageFi?: Maybe<Scalars["String"]["output"]>;
  messageSv?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  target?: Maybe<BannerNotificationTarget>;
};

export type CityNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  municipalityCode: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type CityNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<CityNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `CityNode` and its cursor. */
export type CityNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<CityNode>;
};

export type CurrentUserUpdateMutationInput = {
  preferredLanguage?: InputMaybe<PreferredLanguage>;
};

export type CurrentUserUpdateMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
  preferredLanguage?: Maybe<PreferredLanguage>;
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
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCategoryCreateMutationInput = {
  name: Scalars["String"]["input"];
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type EquipmentCategoryCreateMutationPayload = {
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCategoryDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type EquipmentCategoryDeleteMutationPayload = {
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type EquipmentCategoryNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCategoryNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<EquipmentCategoryNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `EquipmentCategoryNode` and its cursor. */
export type EquipmentCategoryNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<EquipmentCategoryNode>;
};

/** Ordering fields for the 'EquipmentCategory' model. */
export enum EquipmentCategoryOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type EquipmentCategoryUpdateMutationInput = {
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type EquipmentCategoryUpdateMutationPayload = {
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCreateMutationInput = {
  category: Scalars["Int"]["input"];
  name: Scalars["String"]["input"];
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type EquipmentCreateMutationPayload = {
  category?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type EquipmentDeleteMutationPayload = {
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type EquipmentNode = Node & {
  category: EquipmentCategoryNode;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<EquipmentNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `EquipmentNode` and its cursor. */
export type EquipmentNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<EquipmentNode>;
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
  category?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type EquipmentUpdateMutationPayload = {
  category?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type GeneralRoleNode = Node & {
  assigner?: Maybe<UserNode>;
  created: Scalars["DateTime"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  modified: Scalars["DateTime"]["output"];
  permissions?: Maybe<Array<Maybe<UserPermissionChoice>>>;
  role: UserRoleChoice;
  user: UserNode;
};

export type HelsinkiProfileDataNode = {
  birthday?: Maybe<Scalars["Date"]["output"]>;
  city?: Maybe<Scalars["String"]["output"]>;
  email?: Maybe<Scalars["String"]["output"]>;
  firstName?: Maybe<Scalars["String"]["output"]>;
  isStrongLogin: Scalars["Boolean"]["output"];
  lastName?: Maybe<Scalars["String"]["output"]>;
  loginMethod?: Maybe<LoginMethod>;
  municipalityCode?: Maybe<Scalars["String"]["output"]>;
  municipalityName?: Maybe<Scalars["String"]["output"]>;
  phone?: Maybe<Scalars["String"]["output"]>;
  pk: Scalars["Int"]["output"];
  postalCode?: Maybe<Scalars["String"]["output"]>;
  ssn?: Maybe<Scalars["String"]["output"]>;
  streetAddress?: Maybe<Scalars["String"]["output"]>;
};

/** An enumeration. */
export enum ImageType {
  /** Pääkuva */
  Main = "MAIN",
  /** Muu */
  Other = "OTHER",
}

export type LocationNode = Node & {
  addressCity: Scalars["String"]["output"];
  addressCityEn?: Maybe<Scalars["String"]["output"]>;
  addressCityFi?: Maybe<Scalars["String"]["output"]>;
  addressCitySv?: Maybe<Scalars["String"]["output"]>;
  addressStreet: Scalars["String"]["output"];
  addressStreetEn?: Maybe<Scalars["String"]["output"]>;
  addressStreetFi?: Maybe<Scalars["String"]["output"]>;
  addressStreetSv?: Maybe<Scalars["String"]["output"]>;
  addressZip: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  latitude?: Maybe<Scalars["String"]["output"]>;
  longitude?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
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
  addReservationToSeries?: Maybe<ReservationSeriesAddMutationPayload>;
  adjustReservationTime?: Maybe<ReservationAdjustTimeMutationPayload>;
  approveReservation?: Maybe<ReservationApproveMutationPayload>;
  cancelAllApplicationSectionReservations?: Maybe<ApplicationSectionReservationCancellationMutationPayload>;
  cancelApplication?: Maybe<ApplicationCancelMutationPayload>;
  cancelReservation?: Maybe<ReservationCancellationMutationPayload>;
  changeReservationSeriesAccessCode?: Maybe<ReservationSeriesChangeAccessCodeMutationPayload>;
  confirmReservation?: Maybe<ReservationConfirmMutationPayload>;
  createAllocatedTimeslot?: Maybe<AllocatedTimeSlotCreateMutationPayload>;
  createApplication?: Maybe<ApplicationCreateMutationPayload>;
  createApplicationSection?: Maybe<ApplicationSectionCreateMutationPayload>;
  createBannerNotification?: Maybe<BannerNotificationCreateMutationPayload>;
  createEquipment?: Maybe<EquipmentCreateMutationPayload>;
  createEquipmentCategory?: Maybe<EquipmentCategoryCreateMutationPayload>;
  createPurpose?: Maybe<PurposeCreateMutationPayload>;
  createReservation?: Maybe<ReservationCreateMutationPayload>;
  createReservationSeries?: Maybe<ReservationSeriesCreateMutationPayload>;
  createReservationUnit?: Maybe<ReservationUnitCreateMutationPayload>;
  createReservationUnitImage?: Maybe<ReservationUnitImageCreateMutationPayload>;
  createResource?: Maybe<ResourceCreateMutationPayload>;
  createSpace?: Maybe<SpaceCreateMutationPayload>;
  createStaffReservation?: Maybe<ReservationStaffCreateMutationPayload>;
  deleteAllocatedTimeslot?: Maybe<AllocatedTimeSlotDeleteMutationPayload>;
  deleteApplicationSection?: Maybe<ApplicationSectionDeleteMutationPayload>;
  deleteBannerNotification?: Maybe<BannerNotificationDeleteMutationPayload>;
  deleteEquipment?: Maybe<EquipmentDeleteMutationPayload>;
  deleteEquipmentCategory?: Maybe<EquipmentCategoryDeleteMutationPayload>;
  /** @deprecated Renamed to 'deleteTentativeReservation'. */
  deleteReservation?: Maybe<ReservationDeleteMutationPayload>;
  deleteReservationUnitImage?: Maybe<ReservationUnitImageDeleteMutationPayload>;
  deleteResource?: Maybe<ResourceDeleteMutationPayload>;
  deleteSpace?: Maybe<SpaceDeleteMutationPayload>;
  /** Used only for deleting a reservation before it is confirmed. */
  deleteTentativeReservation?: Maybe<ReservationDeleteTentativeMutationPayload>;
  denyReservation?: Maybe<ReservationDenyMutationPayload>;
  denyReservationSeries?: Maybe<ReservationSeriesDenyMutationPayload>;
  refreshOrder?: Maybe<RefreshOrderMutationPayload>;
  refundReservation?: Maybe<ReservationRefundMutationPayload>;
  rejectAllApplicationOptions?: Maybe<RejectAllApplicationOptionsMutationPayload>;
  rejectAllSectionOptions?: Maybe<RejectAllSectionOptionsMutationPayload>;
  repairReservationSeriesAccessCode?: Maybe<ReservationSeriesRepairAccessCodeMutationPayload>;
  requireHandlingForReservation?: Maybe<ReservationRequiresHandlingMutationPayload>;
  rescheduleReservationSeries?: Maybe<ReservationSeriesRescheduleMutationPayload>;
  restoreAllApplicationOptions?: Maybe<RestoreAllApplicationOptionsMutationPayload>;
  restoreAllSectionOptions?: Maybe<RestoreAllSectionOptionsMutationPayload>;
  sendApplication?: Maybe<ApplicationSendMutationPayload>;
  setApplicationRoundHandled?: Maybe<SetApplicationRoundHandledMutationPayload>;
  setApplicationRoundResultsSent?: Maybe<SetApplicationRoundResultsSentMutationPayload>;
  staffAdjustReservationTime?: Maybe<ReservationStaffAdjustTimeMutationPayload>;
  staffChangeReservationAccessCode?: Maybe<ReservationStaffChangeAccessCodeMutationPayload>;
  staffRepairReservationAccessCode?: Maybe<ReservationStaffRepairAccessCodeMutationPayload>;
  staffReservationModify?: Maybe<ReservationStaffModifyMutationPayload>;
  updateApplication?: Maybe<ApplicationUpdateMutationPayload>;
  updateApplicationSection?: Maybe<ApplicationSectionUpdateMutationPayload>;
  updateApplicationWorkingMemo?: Maybe<ApplicationWorkingMemoMutationPayload>;
  updateBannerNotification?: Maybe<BannerNotificationUpdateMutationPayload>;
  updateCurrentUser?: Maybe<CurrentUserUpdateMutationPayload>;
  updateEquipment?: Maybe<EquipmentUpdateMutationPayload>;
  updateEquipmentCategory?: Maybe<EquipmentCategoryUpdateMutationPayload>;
  updatePurpose?: Maybe<PurposeUpdateMutationPayload>;
  updateReservation?: Maybe<ReservationUpdateMutationPayload>;
  updateReservationSeries?: Maybe<ReservationSeriesUpdateMutationPayload>;
  updateReservationUnit?: Maybe<ReservationUnitUpdateMutationPayload>;
  updateReservationUnitImage?: Maybe<ReservationUnitImageUpdateMutationPayload>;
  updateReservationUnitOption?: Maybe<ReservationUnitOptionUpdateMutationPayload>;
  updateReservationWorkingMemo?: Maybe<ReservationWorkingMemoMutationPayload>;
  updateResource?: Maybe<ResourceUpdateMutationPayload>;
  updateSpace?: Maybe<SpaceUpdateMutationPayload>;
  updateStaffUser?: Maybe<UserStaffUpdateMutationPayload>;
  updateUnit?: Maybe<UnitUpdateMutationPayload>;
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
  id: Scalars["ID"]["output"];
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
  activeMembers?: Maybe<Scalars["Int"]["output"]>;
  address?: Maybe<AddressNode>;
  coreBusiness: Scalars["String"]["output"];
  coreBusinessEn?: Maybe<Scalars["String"]["output"]>;
  coreBusinessFi?: Maybe<Scalars["String"]["output"]>;
  coreBusinessSv?: Maybe<Scalars["String"]["output"]>;
  email: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  identifier?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  organisationType: OrganizationTypeChoice;
  pk?: Maybe<Scalars["Int"]["output"]>;
  yearEstablished?: Maybe<Scalars["Int"]["output"]>;
};

export type OrganisationSerializerInput = {
  activeMembers?: InputMaybe<Scalars["Int"]["input"]>;
  address: AddressSerializerInput;
  coreBusiness?: InputMaybe<Scalars["String"]["input"]>;
  coreBusinessEn?: InputMaybe<Scalars["String"]["input"]>;
  coreBusinessFi?: InputMaybe<Scalars["String"]["input"]>;
  coreBusinessSv?: InputMaybe<Scalars["String"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  identifier?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  organisationType?: InputMaybe<OrganizationTypeChoice>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  yearEstablished?: InputMaybe<Scalars["Int"]["input"]>;
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
  endCursor?: Maybe<Scalars["String"]["output"]>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars["Boolean"]["output"];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars["Boolean"]["output"];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars["String"]["output"]>;
};

export type PaymentMerchantNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["UUID"]["output"]>;
};

export type PaymentOrderNode = Node & {
  checkoutUrl?: Maybe<Scalars["String"]["output"]>;
  expiresInMinutes?: Maybe<Scalars["Int"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  orderUuid?: Maybe<Scalars["UUID"]["output"]>;
  paymentType: PaymentType;
  processedAt?: Maybe<Scalars["DateTime"]["output"]>;
  receiptUrl?: Maybe<Scalars["String"]["output"]>;
  refundUuid?: Maybe<Scalars["UUID"]["output"]>;
  reservationPk?: Maybe<Scalars["String"]["output"]>;
  status?: Maybe<OrderStatus>;
};

export type PaymentProductNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  merchant?: Maybe<PaymentMerchantNode>;
  pk?: Maybe<Scalars["UUID"]["output"]>;
};

/** An enumeration. */
export enum PaymentType {
  Invoice = "INVOICE",
  Online = "ONLINE",
  OnSite = "ON_SITE",
}

export type PermissionCheckerType = {
  hasPermission: Scalars["Boolean"]["output"];
};

export type PersonNode = Node & {
  email?: Maybe<Scalars["String"]["output"]>;
  firstName: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  lastName: Scalars["String"]["output"];
  phoneNumber?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type PersonSerializerInput = {
  email?: InputMaybe<Scalars["String"]["input"]>;
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
  phoneNumber?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type PindoraReservationInfoType = {
  accessCode: Scalars["String"]["output"];
  accessCodeBeginsAt: Scalars["DateTime"]["output"];
  accessCodeEndsAt: Scalars["DateTime"]["output"];
  accessCodeGeneratedAt: Scalars["DateTime"]["output"];
  accessCodeIsActive: Scalars["Boolean"]["output"];
  accessCodeKeypadUrl: Scalars["String"]["output"];
  accessCodePhoneNumber: Scalars["String"]["output"];
  accessCodeSmsMessage: Scalars["String"]["output"];
  accessCodeSmsNumber: Scalars["String"]["output"];
};

export type PindoraSectionInfoType = {
  accessCode: Scalars["String"]["output"];
  accessCodeGeneratedAt: Scalars["DateTime"]["output"];
  accessCodeIsActive: Scalars["Boolean"]["output"];
  accessCodeKeypadUrl: Scalars["String"]["output"];
  accessCodePhoneNumber: Scalars["String"]["output"];
  accessCodeSmsMessage: Scalars["String"]["output"];
  accessCodeSmsNumber: Scalars["String"]["output"];
  accessCodeValidity: Array<Maybe<PindoraSectionValidityInfoType>>;
};

export type PindoraSectionValidityInfoType = {
  accessCodeBeginsAt: Scalars["DateTime"]["output"];
  accessCodeEndsAt: Scalars["DateTime"]["output"];
  reservationId: Scalars["Int"]["output"];
  reservationSeriesId: Scalars["Int"]["output"];
};

export type PindoraSeriesInfoType = {
  accessCode: Scalars["String"]["output"];
  accessCodeGeneratedAt: Scalars["DateTime"]["output"];
  accessCodeIsActive: Scalars["Boolean"]["output"];
  accessCodeKeypadUrl: Scalars["String"]["output"];
  accessCodePhoneNumber: Scalars["String"]["output"];
  accessCodeSmsMessage: Scalars["String"]["output"];
  accessCodeSmsNumber: Scalars["String"]["output"];
  accessCodeValidity: Array<PindoraSeriesValidityInfoType>;
};

export type PindoraSeriesValidityInfoType = {
  accessCodeBeginsAt: Scalars["DateTime"]["output"];
  accessCodeEndsAt: Scalars["DateTime"]["output"];
  reservationId: Scalars["Int"]["output"];
  reservationSeriesId: Scalars["Int"]["output"];
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
  name: Scalars["String"]["input"];
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type PurposeCreateMutationPayload = {
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type PurposeNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  imageUrl?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  rank: Scalars["Int"]["output"];
  smallUrl?: Maybe<Scalars["String"]["output"]>;
};

export type PurposeNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<PurposeNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `PurposeNode` and its cursor. */
export type PurposeNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<PurposeNode>;
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
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type PurposeUpdateMutationPayload = {
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type QualifierNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type QualifierNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<QualifierNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `QualifierNode` and its cursor. */
export type QualifierNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<QualifierNode>;
};

/** Ordering fields for the 'Qualifier' model. */
export enum QualifierOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type Query = {
  /** Return all allocations that affect allocations for given reservation unit (through space hierarchy or common resource) during the given time period. */
  affectingAllocatedTimeSlots?: Maybe<Array<AllocatedTimeSlotNode>>;
  /** Find all reservations that affect other reservations through the space hierarchy or a common resource. */
  affectingReservations?: Maybe<Array<ReservationNode>>;
  ageGroups?: Maybe<AgeGroupNodeConnection>;
  allocatedTimeSlots?: Maybe<AllocatedTimeSlotNodeConnection>;
  application?: Maybe<ApplicationNode>;
  applicationRound?: Maybe<ApplicationRoundNode>;
  applicationRounds?: Maybe<ApplicationRoundNodeConnection>;
  applicationSection?: Maybe<ApplicationSectionNode>;
  applicationSections?: Maybe<ApplicationSectionNodeConnection>;
  applications?: Maybe<ApplicationNodeConnection>;
  bannerNotification?: Maybe<BannerNotificationNode>;
  bannerNotifications?: Maybe<BannerNotificationNodeConnection>;
  checkPermissions?: Maybe<PermissionCheckerType>;
  cities?: Maybe<CityNodeConnection>;
  currentUser?: Maybe<UserNode>;
  equipment?: Maybe<EquipmentNode>;
  equipmentCategories?: Maybe<EquipmentCategoryNodeConnection>;
  equipmentCategory?: Maybe<EquipmentCategoryNode>;
  equipments?: Maybe<EquipmentNodeConnection>;
  equipmentsAll?: Maybe<Array<EquipmentAllNode>>;
  metadataSets?: Maybe<ReservationMetadataSetNodeConnection>;
  order?: Maybe<PaymentOrderNode>;
  /** Get information about a user from Helsinki profile. If user is not a profile user, still return data stored in our database, e.g. first and last name. Use only one of 'reservation_id' or 'application_id' to select the user. This determines the required permissions to view the user's data. */
  profileData?: Maybe<HelsinkiProfileDataNode>;
  purposes?: Maybe<PurposeNodeConnection>;
  qualifiers?: Maybe<QualifierNodeConnection>;
  recurringReservation?: Maybe<RecurringReservationNode>;
  recurringReservations?: Maybe<RecurringReservationNodeConnection>;
  rejectedOccurrence?: Maybe<RejectedOccurrenceNode>;
  rejectedOccurrences?: Maybe<RejectedOccurrenceNodeConnection>;
  reservation?: Maybe<ReservationNode>;
  reservationCancelReasons?: Maybe<ReservationCancelReasonNodeConnection>;
  reservationDenyReasons?: Maybe<ReservationDenyReasonNodeConnection>;
  reservationPurposes?: Maybe<ReservationPurposeNodeConnection>;
  reservationUnit?: Maybe<ReservationUnitNode>;
  reservationUnitCancellationRules?: Maybe<ReservationUnitCancellationRuleNodeConnection>;
  reservationUnitTypes?: Maybe<ReservationUnitTypeNodeConnection>;
  reservationUnits?: Maybe<ReservationUnitNodeConnection>;
  reservationUnitsAll?: Maybe<Array<ReservationUnitAllNode>>;
  reservations?: Maybe<ReservationNodeConnection>;
  resource?: Maybe<ResourceNode>;
  resources?: Maybe<ResourceNodeConnection>;
  space?: Maybe<SpaceNode>;
  spaces?: Maybe<SpaceNodeConnection>;
  taxPercentages?: Maybe<TaxPercentageNodeConnection>;
  termsOfUse?: Maybe<TermsOfUseNodeConnection>;
  unit?: Maybe<UnitNode>;
  unitGroups?: Maybe<UnitGroupNodeConnection>;
  units?: Maybe<UnitNodeConnection>;
  unitsAll?: Maybe<Array<UnitAllNode>>;
  user?: Maybe<UserNode>;
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
  forReservationUnits?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  forUnits?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<OrderStatusWithFree>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<Array<InputMaybe<ReservationTypeChoice>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnits?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  state?: InputMaybe<Array<InputMaybe<ReservationStateChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryAgeGroupsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryAllocatedTimeSlotsArgs = {
  accessCodeState?: InputMaybe<Array<InputMaybe<AccessCodeState>>>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  allocatedReservationUnit?: InputMaybe<
    Array<InputMaybe<Scalars["Int"]["input"]>>
  >;
  allocatedUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  applicantType?: InputMaybe<Array<InputMaybe<ApplicantTypeChoice>>>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  applicationSectionStatus?: InputMaybe<
    Array<InputMaybe<ApplicationSectionStatusChoice>>
  >;
  before?: InputMaybe<Scalars["String"]["input"]>;
  dayOfTheWeek?: InputMaybe<Array<InputMaybe<Weekday>>>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<AllocatedTimeSlotOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ApplicationRoundOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryApplicationSectionArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryApplicationSectionsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  ageGroup?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  applicantType?: InputMaybe<Array<InputMaybe<ApplicantTypeChoice>>>;
  application?: InputMaybe<Scalars["Int"]["input"]>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  applicationStatus?: InputMaybe<Array<InputMaybe<ApplicationStatusChoice>>>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  extUuid?: InputMaybe<Scalars["UUID"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  hasAllocations?: InputMaybe<Scalars["Boolean"]["input"]>;
  homeCity?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  includePreferredOrder10OrHigher?: InputMaybe<Scalars["Boolean"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ApplicationSectionOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  preferredOrder?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  priority?: InputMaybe<Array<InputMaybe<Priority>>>;
  purpose?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  status?: InputMaybe<Array<InputMaybe<ApplicationSectionStatusChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryApplicationsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  applicantType?: InputMaybe<Array<InputMaybe<ApplicantTypeChoice>>>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ApplicationOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  status?: InputMaybe<Array<InputMaybe<ApplicationStatusChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<BannerNotificationOrderingChoices>>>;
  target?: InputMaybe<BannerNotificationTarget>;
};

export type QueryCheckPermissionsArgs = {
  permission: UserPermissionChoice;
  requireAll?: InputMaybe<Scalars["Boolean"]["input"]>;
  units?: InputMaybe<Array<Scalars["Int"]["input"]>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<EquipmentCategoryOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<EquipmentOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  rankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
};

export type QueryEquipmentsAllArgs = {
  orderBy?: InputMaybe<Array<InputMaybe<EquipmentOrderingChoices>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<PurposeOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<QualifierOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<RecurringReservationOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<RejectedOccurrenceOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  recurringReservation?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
    Array<InputMaybe<ReservationCancelReasonOrderingChoices>>
  >;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reason?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryReservationDenyReasonsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationDenyReasonOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ReservationPurposeOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
    Array<InputMaybe<ReservationUnitCancellationRuleOrderingChoices>>
  >;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ReservationUnitTypeOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryReservationUnitsArgs = {
  accessType?: InputMaybe<Array<InputMaybe<AccessType>>>;
  accessTypeBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  accessTypeEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  applicationRound?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  calculateFirstReservableTime?: InputMaybe<Scalars["Boolean"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  equipments?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  maxPersonsGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  maxPersonsLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  minPersonsGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  minPersonsLte?: InputMaybe<Scalars["Decimal"]["input"]>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ReservationUnitOrderingChoices>>>;
  personsAllowed?: InputMaybe<Scalars["Decimal"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  publishingState?: InputMaybe<
    Array<InputMaybe<ReservationUnitPublishingState>>
  >;
  purposes?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifiers?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  rankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  reservableDateEnd?: InputMaybe<Scalars["Date"]["input"]>;
  reservableDateStart?: InputMaybe<Scalars["Date"]["input"]>;
  reservableMinimumDurationMinutes?: InputMaybe<Scalars["Decimal"]["input"]>;
  reservableTimeEnd?: InputMaybe<Scalars["Time"]["input"]>;
  reservableTimeStart?: InputMaybe<Scalars["Time"]["input"]>;
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
  reservationState?: InputMaybe<
    Array<InputMaybe<ReservationUnitReservationState>>
  >;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  surfaceAreaGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  tprekDepartmentId?: InputMaybe<Scalars["String"]["input"]>;
  tprekId?: InputMaybe<Scalars["String"]["input"]>;
  typeRankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  typeRankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ReservationUnitOrderingChoices>>>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<OrderStatusWithFree>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<Array<InputMaybe<ReservationTypeChoice>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnits?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  state?: InputMaybe<Array<InputMaybe<ReservationStateChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ResourceOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<SpaceOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryTaxPercentagesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<TaxPercentageOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  value?: InputMaybe<Scalars["Decimal"]["input"]>;
};

export type QueryTermsOfUseArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<TermsOfUseOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<UnitOrderingChoices>>>;
  ownReservations?: InputMaybe<Scalars["Boolean"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<UnitOrderingChoices>>>;
  ownReservations?: InputMaybe<Scalars["Boolean"]["input"]>;
  publishedReservationUnits?: InputMaybe<Scalars["Boolean"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryUserArgs = {
  id: Scalars["ID"]["input"];
};

export type RecurringReservationNode = Node & {
  abilityGroup?: Maybe<AbilityGroupNode>;
  accessType?: Maybe<AccessTypeWithMultivalued>;
  ageGroup?: Maybe<AgeGroupNode>;
  allocatedTimeSlot?: Maybe<AllocatedTimeSlotNode>;
  beginDate?: Maybe<Scalars["Date"]["output"]>;
  beginTime?: Maybe<Scalars["Time"]["output"]>;
  created: Scalars["DateTime"]["output"];
  description: Scalars["String"]["output"];
  endDate?: Maybe<Scalars["Date"]["output"]>;
  endTime?: Maybe<Scalars["Time"]["output"]>;
  extUuid: Scalars["UUID"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  isAccessCodeIsActiveCorrect?: Maybe<Scalars["Boolean"]["output"]>;
  name: Scalars["String"]["output"];
  /** Info fetched from Pindora API. Cached per reservation for 30s. Please don't use this when filtering multiple series, queries to Pindora are not optimized. */
  pindoraInfo?: Maybe<PindoraSeriesInfoType>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  recurrenceInDays?: Maybe<Scalars["Int"]["output"]>;
  rejectedOccurrences: Array<RejectedOccurrenceNode>;
  reservationUnit: ReservationUnitNode;
  reservations: Array<ReservationNode>;
  shouldHaveActiveAccessCode?: Maybe<Scalars["Boolean"]["output"]>;
  usedAccessTypes?: Maybe<Array<Maybe<AccessType>>>;
  user?: Maybe<UserNode>;
  weekdays?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type RecurringReservationNodeRejectedOccurrencesArgs = {
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<RejectedOccurrenceOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  recurringReservation?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<OrderStatusWithFree>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<Array<InputMaybe<ReservationTypeChoice>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnits?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  state?: InputMaybe<Array<InputMaybe<ReservationStateChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type RecurringReservationNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<RecurringReservationNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `RecurringReservationNode` and its cursor. */
export type RecurringReservationNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<RecurringReservationNode>;
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
  orderUuid: Scalars["String"]["input"];
};

export type RefreshOrderMutationPayload = {
  orderUuid?: Maybe<Scalars["String"]["output"]>;
  reservationPk?: Maybe<Scalars["Int"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
};

export type RejectAllApplicationOptionsMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type RejectAllApplicationOptionsMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type RejectAllSectionOptionsMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type RejectAllSectionOptionsMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type RejectedOccurrenceNode = Node & {
  beginDatetime: Scalars["DateTime"]["output"];
  createdAt: Scalars["DateTime"]["output"];
  endDatetime: Scalars["DateTime"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  recurringReservation: RecurringReservationNode;
  rejectionReason: RejectionReadinessChoice;
};

export type RejectedOccurrenceNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<RejectedOccurrenceNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `RejectedOccurrenceNode` and its cursor. */
export type RejectedOccurrenceNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<RejectedOccurrenceNode>;
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
  endDatetime?: Maybe<Scalars["DateTime"]["output"]>;
  startDatetime?: Maybe<Scalars["DateTime"]["output"]>;
};

export type ReservationAdjustTimeMutationInput = {
  begin: Scalars["DateTime"]["input"];
  end: Scalars["DateTime"]["input"];
  pk: Scalars["Int"]["input"];
};

export type ReservationAdjustTimeMutationPayload = {
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<ReservationStateChoice>;
};

export type ReservationApproveMutationInput = {
  handlingDetails: Scalars["String"]["input"];
  pk: Scalars["Int"]["input"];
  price: Scalars["Decimal"]["input"];
};

export type ReservationApproveMutationPayload = {
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  handlingDetails?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  state?: Maybe<ReservationStateChoice>;
};

export type ReservationCancelReasonNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reason: Scalars["String"]["output"];
  reasonEn?: Maybe<Scalars["String"]["output"]>;
  reasonFi?: Maybe<Scalars["String"]["output"]>;
  reasonSv?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationCancelReasonNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationCancelReasonNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationCancelReasonNode` and its cursor. */
export type ReservationCancelReasonNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationCancelReasonNode>;
};

/** Ordering fields for the 'ReservationCancelReason' model. */
export enum ReservationCancelReasonOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type ReservationCancellationMutationInput = {
  cancelDetails?: InputMaybe<Scalars["String"]["input"]>;
  cancelReason: Scalars["Int"]["input"];
  pk: Scalars["Int"]["input"];
};

export type ReservationCancellationMutationPayload = {
  cancelDetails?: Maybe<Scalars["String"]["output"]>;
  cancelReason?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<ReservationStateChoice>;
};

export type ReservationConfirmMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type ReservationConfirmMutationPayload = {
  order?: Maybe<PaymentOrderNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<ReservationStateChoice>;
};

export type ReservationCreateMutationInput = {
  begin: Scalars["DateTime"]["input"];
  end: Scalars["DateTime"]["input"];
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit: Scalars["Int"]["input"];
};

export type ReservationCreateMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type ReservationDeleteMutationPayload = {
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type ReservationDeleteTentativeMutationInput = {
  pk: Scalars["ID"]["input"];
};

/** Used only for deleting a reservation before it is confirmed. */
export type ReservationDeleteTentativeMutationPayload = {
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type ReservationDenyMutationInput = {
  denyReason: Scalars["Int"]["input"];
  handlingDetails: Scalars["String"]["input"];
  pk: Scalars["Int"]["input"];
};

export type ReservationDenyMutationPayload = {
  denyReason?: Maybe<Scalars["Int"]["output"]>;
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  handlingDetails?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<ReservationStateChoice>;
};

export type ReservationDenyReasonNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reason: Scalars["String"]["output"];
  reasonEn?: Maybe<Scalars["String"]["output"]>;
  reasonFi?: Maybe<Scalars["String"]["output"]>;
  reasonSv?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationDenyReasonNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationDenyReasonNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationDenyReasonNode` and its cursor. */
export type ReservationDenyReasonNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationDenyReasonNode>;
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
  fieldName: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationMetadataSetNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  requiredFields: Array<ReservationMetadataFieldNode>;
  supportedFields: Array<ReservationMetadataFieldNode>;
};

export type ReservationMetadataSetNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationMetadataSetNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationMetadataSetNode` and its cursor. */
export type ReservationMetadataSetNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationMetadataSetNode>;
};

export type ReservationNode = Node & {
  accessCodeGeneratedAt?: Maybe<Scalars["DateTime"]["output"]>;
  accessCodeIsActive: Scalars["Boolean"]["output"];
  accessCodeShouldBeActive?: Maybe<Scalars["Boolean"]["output"]>;
  accessType: AccessType;
  /** Which reservation units' reserveability is affected by this reservation? */
  affectedReservationUnits?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  ageGroup?: Maybe<AgeGroupNode>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  begin: Scalars["DateTime"]["output"];
  billingAddressCity?: Maybe<Scalars["String"]["output"]>;
  billingAddressStreet?: Maybe<Scalars["String"]["output"]>;
  billingAddressZip?: Maybe<Scalars["String"]["output"]>;
  billingEmail?: Maybe<Scalars["String"]["output"]>;
  billingFirstName?: Maybe<Scalars["String"]["output"]>;
  billingLastName?: Maybe<Scalars["String"]["output"]>;
  billingPhone?: Maybe<Scalars["String"]["output"]>;
  bufferTimeAfter: Scalars["Duration"]["output"];
  bufferTimeBefore: Scalars["Duration"]["output"];
  calendarUrl?: Maybe<Scalars["String"]["output"]>;
  cancelDetails?: Maybe<Scalars["String"]["output"]>;
  cancelReason?: Maybe<ReservationCancelReasonNode>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  denyReason?: Maybe<ReservationDenyReasonNode>;
  description?: Maybe<Scalars["String"]["output"]>;
  end: Scalars["DateTime"]["output"];
  extUuid: Scalars["UUID"]["output"];
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  handlingDetails?: Maybe<Scalars["String"]["output"]>;
  homeCity?: Maybe<CityNode>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  isAccessCodeIsActiveCorrect?: Maybe<Scalars["Boolean"]["output"]>;
  isBlocked?: Maybe<Scalars["Boolean"]["output"]>;
  isHandled?: Maybe<Scalars["Boolean"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  /** @deprecated Please use to 'paymentOrder' instead. */
  order?: Maybe<PaymentOrderNode>;
  paymentOrder: Array<PaymentOrderNode>;
  /** Info fetched from Pindora API. Cached per reservation for 30s. Please don't use this when filtering multiple reservations, queries to Pindora are not optimized. */
  pindoraInfo?: Maybe<PindoraReservationInfoType>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
  purpose?: Maybe<ReservationPurposeNode>;
  recurringReservation?: Maybe<RecurringReservationNode>;
  reservationUnits: Array<ReservationUnitNode>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<CustomerTypeChoice>;
  /** @deprecated Please use to 'type' instead. */
  staffEvent?: Maybe<Scalars["Boolean"]["output"]>;
  state?: Maybe<ReservationStateChoice>;
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  type?: Maybe<ReservationTypeChoice>;
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
  user?: Maybe<UserNode>;
  workingMemo?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationNodeReservationUnitsArgs = {
  accessType?: InputMaybe<Array<InputMaybe<AccessType>>>;
  accessTypeBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  accessTypeEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  applicationRound?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  calculateFirstReservableTime?: InputMaybe<Scalars["Boolean"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  equipments?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]["input"]>;
  maxPersonsGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  maxPersonsLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  minPersonsGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  minPersonsLte?: InputMaybe<Scalars["Decimal"]["input"]>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ReservationUnitOrderingChoices>>>;
  personsAllowed?: InputMaybe<Scalars["Decimal"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  publishingState?: InputMaybe<
    Array<InputMaybe<ReservationUnitPublishingState>>
  >;
  purposes?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifiers?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  rankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  reservableDateEnd?: InputMaybe<Scalars["Date"]["input"]>;
  reservableDateStart?: InputMaybe<Scalars["Date"]["input"]>;
  reservableMinimumDurationMinutes?: InputMaybe<Scalars["Decimal"]["input"]>;
  reservableTimeEnd?: InputMaybe<Scalars["Time"]["input"]>;
  reservableTimeStart?: InputMaybe<Scalars["Time"]["input"]>;
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
  reservationState?: InputMaybe<
    Array<InputMaybe<ReservationUnitReservationState>>
  >;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  surfaceAreaGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  tprekDepartmentId?: InputMaybe<Scalars["String"]["input"]>;
  tprekId?: InputMaybe<Scalars["String"]["input"]>;
  typeRankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  typeRankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  uuid?: InputMaybe<Scalars["UUID"]["input"]>;
};

export type ReservationNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationNode` and its cursor. */
export type ReservationNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationNode>;
};

/** An enumeration. */
export enum ReservationNotification {
  /** All */
  All = "ALL",
  /** None */
  None = "NONE",
  /** Only Handling Required */
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
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  rank: Scalars["Int"]["output"];
};

export type ReservationPurposeNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationPurposeNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationPurposeNode` and its cursor. */
export type ReservationPurposeNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationPurposeNode>;
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
  pk: Scalars["Int"]["input"];
};

export type ReservationRefundMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationRequiresHandlingMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type ReservationRequiresHandlingMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<ReservationStateChoice>;
};

export type ReservationSeriesAddMutationInput = {
  begin: Scalars["DateTime"]["input"];
  bufferTimeAfter?: InputMaybe<Scalars["String"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["String"]["input"]>;
  end: Scalars["DateTime"]["input"];
  pk: Scalars["Int"]["input"];
};

export type ReservationSeriesAddMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationSeriesChangeAccessCodeMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type ReservationSeriesChangeAccessCodeMutationPayload = {
  accessCodeGeneratedAt?: Maybe<Scalars["DateTime"]["output"]>;
  accessCodeIsActive?: Maybe<Scalars["Boolean"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationSeriesCreateMutationInput = {
  abilityGroup?: InputMaybe<Scalars["Int"]["input"]>;
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  beginDate: Scalars["Date"]["input"];
  beginTime: Scalars["Time"]["input"];
  checkOpeningHours?: InputMaybe<Scalars["Boolean"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  endDate: Scalars["Date"]["input"];
  endTime: Scalars["Time"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  recurrenceInDays: Scalars["Int"]["input"];
  reservationDetails: ReservationSeriesReservationCreateSerializerInput;
  reservationUnit: Scalars["Int"]["input"];
  skipDates?: InputMaybe<Array<InputMaybe<Scalars["Date"]["input"]>>>;
  weekdays: Array<InputMaybe<Scalars["Int"]["input"]>>;
};

export type ReservationSeriesCreateMutationPayload = {
  abilityGroup?: Maybe<Scalars["Int"]["output"]>;
  ageGroup?: Maybe<Scalars["Int"]["output"]>;
  beginDate?: Maybe<Scalars["Date"]["output"]>;
  beginTime?: Maybe<Scalars["Time"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  endDate?: Maybe<Scalars["Date"]["output"]>;
  endTime?: Maybe<Scalars["Time"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  recurrenceInDays?: Maybe<Scalars["Int"]["output"]>;
  reservationUnit?: Maybe<Scalars["Int"]["output"]>;
  weekdays?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type ReservationSeriesDenyMutationInput = {
  denyReason: Scalars["Int"]["input"];
  handlingDetails?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ReservationSeriesDenyMutationPayload = {
  denied?: Maybe<Scalars["Int"]["output"]>;
  future?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationSeriesRepairAccessCodeMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type ReservationSeriesRepairAccessCodeMutationPayload = {
  accessCodeGeneratedAt?: Maybe<Scalars["DateTime"]["output"]>;
  accessCodeIsActive?: Maybe<Scalars["Boolean"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationSeriesRescheduleMutationInput = {
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  beginTime?: InputMaybe<Scalars["Time"]["input"]>;
  bufferTimeAfter?: InputMaybe<Scalars["String"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["String"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  endTime?: InputMaybe<Scalars["Time"]["input"]>;
  pk: Scalars["Int"]["input"];
  skipDates?: InputMaybe<Array<InputMaybe<Scalars["Date"]["input"]>>>;
  weekdays?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationSeriesRescheduleMutationPayload = {
  beginDate?: Maybe<Scalars["Date"]["output"]>;
  beginTime?: Maybe<Scalars["Time"]["output"]>;
  endDate?: Maybe<Scalars["Date"]["output"]>;
  endTime?: Maybe<Scalars["Time"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  weekdays?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type ReservationSeriesReservationCreateSerializerInput = {
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  confirmedAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  handledAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<ReserveeType>;
  state?: InputMaybe<ReservationStateChoice>;
  type: ReservationTypeStaffChoice;
  user: Scalars["Int"]["input"];
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationSeriesUpdateMutationInput = {
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
  reservationDetails?: InputMaybe<UpdateReservationSeriesReservationUpdateSerializerInput>;
  skipReservations?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationSeriesUpdateMutationPayload = {
  ageGroup?: Maybe<Scalars["Int"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationStaffAdjustTimeMutationInput = {
  begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  end?: InputMaybe<Scalars["DateTime"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ReservationStaffAdjustTimeMutationPayload = {
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<ReservationStateChoice>;
};

export type ReservationStaffChangeAccessCodeMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type ReservationStaffChangeAccessCodeMutationPayload = {
  accessCodeGeneratedAt?: Maybe<Scalars["DateTime"]["output"]>;
  accessCodeIsActive?: Maybe<Scalars["Boolean"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationStaffCreateMutationInput = {
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  begin: Scalars["DateTime"]["input"];
  billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  end: Scalars["DateTime"]["input"];
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit: Scalars["Int"]["input"];
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<CustomerTypeChoice>;
  type: ReservationTypeChoice;
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationStaffCreateMutationPayload = {
  ageGroup?: Maybe<Scalars["Int"]["output"]>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  billingAddressCity?: Maybe<Scalars["String"]["output"]>;
  billingAddressStreet?: Maybe<Scalars["String"]["output"]>;
  billingAddressZip?: Maybe<Scalars["String"]["output"]>;
  billingEmail?: Maybe<Scalars["String"]["output"]>;
  billingFirstName?: Maybe<Scalars["String"]["output"]>;
  billingLastName?: Maybe<Scalars["String"]["output"]>;
  billingPhone?: Maybe<Scalars["String"]["output"]>;
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  homeCity?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  purpose?: Maybe<Scalars["Int"]["output"]>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<CustomerTypeChoice>;
  state?: Maybe<ReservationStateChoice>;
  type?: Maybe<ReservationTypeChoice>;
  workingMemo?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationStaffModifyMutationInput = {
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk: Scalars["Int"]["input"];
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<CustomerTypeChoice>;
  type?: InputMaybe<ReservationTypeChoice>;
};

export type ReservationStaffModifyMutationPayload = {
  ageGroup?: Maybe<Scalars["Int"]["output"]>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  billingAddressCity?: Maybe<Scalars["String"]["output"]>;
  billingAddressStreet?: Maybe<Scalars["String"]["output"]>;
  billingAddressZip?: Maybe<Scalars["String"]["output"]>;
  billingEmail?: Maybe<Scalars["String"]["output"]>;
  billingFirstName?: Maybe<Scalars["String"]["output"]>;
  billingLastName?: Maybe<Scalars["String"]["output"]>;
  billingPhone?: Maybe<Scalars["String"]["output"]>;
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  homeCity?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nonSubsidisedPrice?: Maybe<Scalars["Decimal"]["output"]>;
  nonSubsidisedPriceNet?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["String"]["output"]>;
  purpose?: Maybe<Scalars["Int"]["output"]>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<CustomerTypeChoice>;
  state?: Maybe<ReservationStateChoice>;
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  type?: Maybe<ReservationTypeChoice>;
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
};

export type ReservationStaffRepairAccessCodeMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type ReservationStaffRepairAccessCodeMutationPayload = {
  accessCodeGeneratedAt?: Maybe<Scalars["DateTime"]["output"]>;
  accessCodeIsActive?: Maybe<Scalars["Boolean"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
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
  accessType: AccessType;
  beginDate: Scalars["Date"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationUnit: ReservationUnitNode;
};

/** Ordering fields for the 'ReservationUnitAccessType' model. */
export enum ReservationUnitAccessTypeOrderingChoices {
  BeginDateAsc = "beginDateAsc",
  BeginDateDesc = "beginDateDesc",
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type ReservationUnitAccessTypeSerializerInput = {
  accessType?: InputMaybe<AccessType>;
  beginDate: Scalars["Date"]["input"];
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

/** This Node should be kept to the bare minimum and never expose any relations to avoid performance issues. */
export type ReservationUnitAllNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitCancellationRuleNode = Node & {
  canBeCancelledTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitCancellationRuleNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitCancellationRuleNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitCancellationRuleNode` and its cursor. */
export type ReservationUnitCancellationRuleNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitCancellationRuleNode>;
};

/** Ordering fields for the 'ReservationUnitCancellationRule' model. */
export enum ReservationUnitCancellationRuleOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type ReservationUnitCreateMutationInput = {
  accessTypes?: InputMaybe<
    Array<InputMaybe<ReservationUnitAccessTypeSerializerInput>>
  >;
  allowReservationsWithoutOpeningHours?: InputMaybe<
    Scalars["Boolean"]["input"]
  >;
  applicationRoundTimeSlots?: InputMaybe<
    Array<InputMaybe<ApplicationRoundTimeSlotSerializerInput>>
  >;
  authentication?: InputMaybe<Authentication>;
  bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  canApplyFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  cancellationRule?: InputMaybe<Scalars["Int"]["input"]>;
  cancellationTerms?: InputMaybe<Scalars["String"]["input"]>;
  contactInformation?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  equipments?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  images?: InputMaybe<
    Array<InputMaybe<ReservationUnitImageFieldSerializerInput>>
  >;
  isArchived?: InputMaybe<Scalars["Boolean"]["input"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  maxReservationDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  maxReservationsPerUser?: InputMaybe<Scalars["Int"]["input"]>;
  metadataSet?: InputMaybe<Scalars["Int"]["input"]>;
  minPersons?: InputMaybe<Scalars["Int"]["input"]>;
  minReservationDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  name: Scalars["String"]["input"];
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  paymentTerms?: InputMaybe<Scalars["String"]["input"]>;
  paymentTypes?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  pricingTerms?: InputMaybe<Scalars["String"]["input"]>;
  pricings?: InputMaybe<
    Array<InputMaybe<ReservationUnitPricingSerializerInput>>
  >;
  publishBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  publishEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  purposes?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifiers?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  requireAdultReservee?: InputMaybe<Scalars["Boolean"]["input"]>;
  requireReservationHandling?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  reservationBlockWholeDay?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationCancelledInstructions?: InputMaybe<Scalars["String"]["input"]>;
  reservationCancelledInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationCancelledInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationCancelledInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructions?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  reservationKind?: InputMaybe<ReservationKind>;
  reservationPendingInstructions?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationStartInterval?: InputMaybe<ReservationStartInterval>;
  reservationUnitType?: InputMaybe<Scalars["Int"]["input"]>;
  reservationsMaxDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  reservationsMinDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  resources?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  searchTerms?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  serviceSpecificTerms?: InputMaybe<Scalars["String"]["input"]>;
  spaces?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  surfaceArea?: InputMaybe<Scalars["Int"]["input"]>;
  termsOfUse?: InputMaybe<Scalars["String"]["input"]>;
  termsOfUseEn?: InputMaybe<Scalars["String"]["input"]>;
  termsOfUseFi?: InputMaybe<Scalars["String"]["input"]>;
  termsOfUseSv?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ReservationUnitCreateMutationPayload = {
  accessTypes?: Maybe<Array<Maybe<ReservationUnitAccessTypeNode>>>;
  allowReservationsWithoutOpeningHours?: Maybe<Scalars["Boolean"]["output"]>;
  applicationRoundTimeSlots?: Maybe<Array<Maybe<ApplicationRoundTimeSlotNode>>>;
  authentication?: Maybe<Authentication>;
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  canApplyFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  cancellationRule?: Maybe<Scalars["Int"]["output"]>;
  cancellationTerms?: Maybe<Scalars["String"]["output"]>;
  contactInformation?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  equipments?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  images?: Maybe<Array<Maybe<ReservationUnitImageNode>>>;
  isArchived?: Maybe<Scalars["Boolean"]["output"]>;
  isDraft?: Maybe<Scalars["Boolean"]["output"]>;
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  maxReservationDuration?: Maybe<Scalars["Duration"]["output"]>;
  maxReservationsPerUser?: Maybe<Scalars["Int"]["output"]>;
  metadataSet?: Maybe<Scalars["Int"]["output"]>;
  minPersons?: Maybe<Scalars["Int"]["output"]>;
  minReservationDuration?: Maybe<Scalars["Duration"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  paymentTerms?: Maybe<Scalars["String"]["output"]>;
  paymentTypes?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  pricingTerms?: Maybe<Scalars["String"]["output"]>;
  pricings?: Maybe<Array<Maybe<ReservationUnitPricingNode>>>;
  publishBegins?: Maybe<Scalars["DateTime"]["output"]>;
  publishEnds?: Maybe<Scalars["DateTime"]["output"]>;
  publishingState?: Maybe<Scalars["String"]["output"]>;
  purposes?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  qualifiers?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  requireAdultReservee?: Maybe<Scalars["Boolean"]["output"]>;
  requireReservationHandling?: Maybe<Scalars["Boolean"]["output"]>;
  reservationBegins?: Maybe<Scalars["DateTime"]["output"]>;
  reservationBlockWholeDay?: Maybe<Scalars["Boolean"]["output"]>;
  reservationCancelledInstructions?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructions?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationEnds?: Maybe<Scalars["DateTime"]["output"]>;
  reservationKind?: Maybe<ReservationKind>;
  reservationPendingInstructions?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationStartInterval?: Maybe<ReservationStartInterval>;
  reservationUnitType?: Maybe<Scalars["Int"]["output"]>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  resources?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  searchTerms?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
  serviceSpecificTerms?: Maybe<Scalars["String"]["output"]>;
  spaces?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  surfaceArea?: Maybe<Scalars["Int"]["output"]>;
  termsOfUse?: Maybe<Scalars["String"]["output"]>;
  termsOfUseEn?: Maybe<Scalars["String"]["output"]>;
  termsOfUseFi?: Maybe<Scalars["String"]["output"]>;
  termsOfUseSv?: Maybe<Scalars["String"]["output"]>;
  unit?: Maybe<Scalars["Int"]["output"]>;
  uuid?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationUnitImageCreateMutationInput = {
  image: Scalars["Upload"]["input"];
  imageType: ImageType;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit: Scalars["Int"]["input"];
};

export type ReservationUnitImageCreateMutationPayload = {
  imageType?: Maybe<ImageType>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationUnit?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitImageDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type ReservationUnitImageDeleteMutationPayload = {
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type ReservationUnitImageFieldSerializerInput = {
  imageType: ImageType;
  imageUrl: Scalars["Upload"]["input"];
  largeUrl?: InputMaybe<Scalars["String"]["input"]>;
  mediumUrl?: InputMaybe<Scalars["String"]["input"]>;
  smallUrl?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationUnitImageNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  imageType: ImageType;
  imageUrl?: Maybe<Scalars["String"]["output"]>;
  largeUrl?: Maybe<Scalars["String"]["output"]>;
  mediumUrl?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  smallUrl?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationUnitImageUpdateMutationInput = {
  imageType?: InputMaybe<ImageType>;
  pk: Scalars["Int"]["input"];
};

export type ReservationUnitImageUpdateMutationPayload = {
  imageType?: Maybe<ImageType>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitNode = Node & {
  accessTypes: Array<ReservationUnitAccessTypeNode>;
  allowReservationsWithoutOpeningHours: Scalars["Boolean"]["output"];
  applicationRoundTimeSlots: Array<ApplicationRoundTimeSlotNode>;
  applicationRounds: Array<ApplicationRoundNode>;
  authentication: Authentication;
  bufferTimeAfter: Scalars["Duration"]["output"];
  bufferTimeBefore: Scalars["Duration"]["output"];
  calculatedSurfaceArea?: Maybe<Scalars["Int"]["output"]>;
  canApplyFreeOfCharge: Scalars["Boolean"]["output"];
  cancellationRule?: Maybe<ReservationUnitCancellationRuleNode>;
  cancellationTerms?: Maybe<TermsOfUseNode>;
  contactInformation: Scalars["String"]["output"];
  currentAccessType?: Maybe<AccessType>;
  description: Scalars["String"]["output"];
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  effectiveAccessType?: Maybe<AccessType>;
  equipments: Array<EquipmentNode>;
  firstReservableDatetime?: Maybe<Scalars["DateTime"]["output"]>;
  haukiUrl?: Maybe<Scalars["String"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  images: Array<ReservationUnitImageNode>;
  isArchived: Scalars["Boolean"]["output"];
  isClosed?: Maybe<Scalars["Boolean"]["output"]>;
  isDraft: Scalars["Boolean"]["output"];
  location?: Maybe<LocationNode>;
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  maxReservationDuration?: Maybe<Scalars["Duration"]["output"]>;
  maxReservationsPerUser?: Maybe<Scalars["Int"]["output"]>;
  metadataSet?: Maybe<ReservationMetadataSetNode>;
  minPersons?: Maybe<Scalars["Int"]["output"]>;
  minReservationDuration?: Maybe<Scalars["Duration"]["output"]>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  numActiveUserReservations?: Maybe<Scalars["Int"]["output"]>;
  paymentMerchant?: Maybe<PaymentMerchantNode>;
  paymentProduct?: Maybe<PaymentProductNode>;
  paymentTerms?: Maybe<TermsOfUseNode>;
  paymentTypes: Array<ReservationUnitPaymentTypeNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  pricingTerms?: Maybe<TermsOfUseNode>;
  pricings: Array<ReservationUnitPricingNode>;
  publishBegins?: Maybe<Scalars["DateTime"]["output"]>;
  publishEnds?: Maybe<Scalars["DateTime"]["output"]>;
  publishingState?: Maybe<ReservationUnitPublishingState>;
  purposes: Array<PurposeNode>;
  qualifiers: Array<QualifierNode>;
  rank: Scalars["Int"]["output"];
  requireAdultReservee: Scalars["Boolean"]["output"];
  requireReservationHandling: Scalars["Boolean"]["output"];
  reservableTimeSpans?: Maybe<Array<Maybe<ReservableTimeSpanType>>>;
  reservationBegins?: Maybe<Scalars["DateTime"]["output"]>;
  reservationBlockWholeDay: Scalars["Boolean"]["output"];
  reservationCancelledInstructions: Scalars["String"]["output"];
  reservationCancelledInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructions: Scalars["String"]["output"];
  reservationConfirmedInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationEnds?: Maybe<Scalars["DateTime"]["output"]>;
  reservationKind: ReservationKind;
  reservationPendingInstructions: Scalars["String"]["output"];
  reservationPendingInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationStartInterval: ReservationStartInterval;
  reservationState?: Maybe<ReservationUnitReservationState>;
  reservationUnitType?: Maybe<ReservationUnitTypeNode>;
  reservations?: Maybe<Array<ReservationNode>>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  resources: Array<ResourceNode>;
  searchTerms: Array<Scalars["String"]["output"]>;
  serviceSpecificTerms?: Maybe<TermsOfUseNode>;
  spaces: Array<SpaceNode>;
  surfaceArea?: Maybe<Scalars["Int"]["output"]>;
  termsOfUse?: Maybe<Scalars["String"]["output"]>;
  termsOfUseEn?: Maybe<Scalars["String"]["output"]>;
  termsOfUseFi?: Maybe<Scalars["String"]["output"]>;
  termsOfUseSv?: Maybe<Scalars["String"]["output"]>;
  unit?: Maybe<UnitNode>;
  uuid: Scalars["UUID"]["output"];
};

export type ReservationUnitNodeAccessTypesArgs = {
  isActiveOrFuture?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    Array<InputMaybe<ReservationUnitAccessTypeOrderingChoices>>
  >;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationUnitNodeApplicationRoundsArgs = {
  active?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  ongoing?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermissions?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ApplicationRoundOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<EquipmentOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  rankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
};

export type ReservationUnitNodePurposesArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<PurposeOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationUnitNodeQualifiersArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<QualifierOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<OrderStatusWithFree>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<Array<InputMaybe<ReservationTypeChoice>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnits?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  state?: InputMaybe<Array<InputMaybe<ReservationStateChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ResourceOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<SpaceOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type ReservationUnitNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitNode` and its cursor. */
export type ReservationUnitNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitNode>;
};

export type ReservationUnitOptionApplicantSerializerInput = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  preferredOrder: Scalars["Int"]["input"];
  reservationUnit: Scalars["Int"]["input"];
};

export type ReservationUnitOptionNode = Node & {
  allocatedTimeSlots: Array<AllocatedTimeSlotNode>;
  applicationSection: ApplicationSectionNode;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  locked: Scalars["Boolean"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  preferredOrder: Scalars["Int"]["output"];
  rejected: Scalars["Boolean"]["output"];
  reservationUnit: ReservationUnitNode;
};

export type ReservationUnitOptionNodeAllocatedTimeSlotsArgs = {
  accessCodeState?: InputMaybe<Array<InputMaybe<AccessCodeState>>>;
  allocatedReservationUnit?: InputMaybe<
    Array<InputMaybe<Scalars["Int"]["input"]>>
  >;
  allocatedUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  applicantType?: InputMaybe<Array<InputMaybe<ApplicantTypeChoice>>>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  applicationSectionStatus?: InputMaybe<
    Array<InputMaybe<ApplicationSectionStatusChoice>>
  >;
  dayOfTheWeek?: InputMaybe<Array<InputMaybe<Weekday>>>;
  orderBy?: InputMaybe<Array<InputMaybe<AllocatedTimeSlotOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
};

/** Ordering fields for the 'ReservationUnitOption' model. */
export enum ReservationUnitOptionOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type ReservationUnitOptionUpdateMutationInput = {
  locked?: InputMaybe<Scalars["Boolean"]["input"]>;
  pk: Scalars["Int"]["input"];
  rejected?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type ReservationUnitOptionUpdateMutationPayload = {
  locked?: Maybe<Scalars["Boolean"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  rejected?: Maybe<Scalars["Boolean"]["output"]>;
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
  code: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
};

export type ReservationUnitPricingNode = Node & {
  begins: Scalars["Date"]["output"];
  highestPrice: Scalars["Decimal"]["output"];
  highestPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  lowestPrice: Scalars["Decimal"]["output"];
  lowestPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  priceUnit: PriceUnit;
  taxPercentage: TaxPercentageNode;
};

export type ReservationUnitPricingSerializerInput = {
  begins: Scalars["Date"]["input"];
  highestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  highestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  isActivatedOnBegins?: InputMaybe<Scalars["Boolean"]["input"]>;
  lowestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  lowestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  priceUnit?: InputMaybe<PriceUnit>;
  taxPercentage?: InputMaybe<Scalars["Int"]["input"]>;
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
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  rank: Scalars["Int"]["output"];
};

export type ReservationUnitTypeNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitTypeNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitTypeNode` and its cursor. */
export type ReservationUnitTypeNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitTypeNode>;
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
  accessTypes?: InputMaybe<
    Array<InputMaybe<UpdateReservationUnitAccessTypeSerializerInput>>
  >;
  allowReservationsWithoutOpeningHours?: InputMaybe<
    Scalars["Boolean"]["input"]
  >;
  applicationRoundTimeSlots?: InputMaybe<
    Array<InputMaybe<UpdateApplicationRoundTimeSlotSerializerInput>>
  >;
  authentication?: InputMaybe<Authentication>;
  bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  canApplyFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  cancellationRule?: InputMaybe<Scalars["Int"]["input"]>;
  cancellationTerms?: InputMaybe<Scalars["String"]["input"]>;
  contactInformation?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  equipments?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  images?: InputMaybe<
    Array<InputMaybe<UpdateReservationUnitImageFieldSerializerInput>>
  >;
  isArchived?: InputMaybe<Scalars["Boolean"]["input"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  maxReservationDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  maxReservationsPerUser?: InputMaybe<Scalars["Int"]["input"]>;
  metadataSet?: InputMaybe<Scalars["Int"]["input"]>;
  minPersons?: InputMaybe<Scalars["Int"]["input"]>;
  minReservationDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  paymentTerms?: InputMaybe<Scalars["String"]["input"]>;
  paymentTypes?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  pk: Scalars["Int"]["input"];
  pricingTerms?: InputMaybe<Scalars["String"]["input"]>;
  pricings?: InputMaybe<
    Array<InputMaybe<UpdateReservationUnitPricingSerializerInput>>
  >;
  publishBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  publishEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  purposes?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifiers?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  requireAdultReservee?: InputMaybe<Scalars["Boolean"]["input"]>;
  requireReservationHandling?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  reservationBlockWholeDay?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationCancelledInstructions?: InputMaybe<Scalars["String"]["input"]>;
  reservationCancelledInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationCancelledInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationCancelledInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructions?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  reservationKind?: InputMaybe<ReservationKind>;
  reservationPendingInstructions?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationStartInterval?: InputMaybe<ReservationStartInterval>;
  reservationUnitType?: InputMaybe<Scalars["Int"]["input"]>;
  reservationsMaxDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  reservationsMinDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  resources?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  searchTerms?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  serviceSpecificTerms?: InputMaybe<Scalars["String"]["input"]>;
  spaces?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  surfaceArea?: InputMaybe<Scalars["Int"]["input"]>;
  termsOfUse?: InputMaybe<Scalars["String"]["input"]>;
  termsOfUseEn?: InputMaybe<Scalars["String"]["input"]>;
  termsOfUseFi?: InputMaybe<Scalars["String"]["input"]>;
  termsOfUseSv?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ReservationUnitUpdateMutationPayload = {
  accessTypes?: Maybe<Array<Maybe<ReservationUnitAccessTypeNode>>>;
  allowReservationsWithoutOpeningHours?: Maybe<Scalars["Boolean"]["output"]>;
  applicationRoundTimeSlots?: Maybe<Array<Maybe<ApplicationRoundTimeSlotNode>>>;
  authentication?: Maybe<Authentication>;
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  canApplyFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  cancellationRule?: Maybe<Scalars["Int"]["output"]>;
  cancellationTerms?: Maybe<Scalars["String"]["output"]>;
  contactInformation?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  equipments?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  images?: Maybe<Array<Maybe<ReservationUnitImageNode>>>;
  isArchived?: Maybe<Scalars["Boolean"]["output"]>;
  isDraft?: Maybe<Scalars["Boolean"]["output"]>;
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  maxReservationDuration?: Maybe<Scalars["Duration"]["output"]>;
  maxReservationsPerUser?: Maybe<Scalars["Int"]["output"]>;
  metadataSet?: Maybe<Scalars["Int"]["output"]>;
  minPersons?: Maybe<Scalars["Int"]["output"]>;
  minReservationDuration?: Maybe<Scalars["Duration"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  paymentTerms?: Maybe<Scalars["String"]["output"]>;
  paymentTypes?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  pricingTerms?: Maybe<Scalars["String"]["output"]>;
  pricings?: Maybe<Array<Maybe<ReservationUnitPricingNode>>>;
  publishBegins?: Maybe<Scalars["DateTime"]["output"]>;
  publishEnds?: Maybe<Scalars["DateTime"]["output"]>;
  publishingState?: Maybe<Scalars["String"]["output"]>;
  purposes?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  qualifiers?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  requireAdultReservee?: Maybe<Scalars["Boolean"]["output"]>;
  requireReservationHandling?: Maybe<Scalars["Boolean"]["output"]>;
  reservationBegins?: Maybe<Scalars["DateTime"]["output"]>;
  reservationBlockWholeDay?: Maybe<Scalars["Boolean"]["output"]>;
  reservationCancelledInstructions?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructions?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationEnds?: Maybe<Scalars["DateTime"]["output"]>;
  reservationKind?: Maybe<ReservationKind>;
  reservationPendingInstructions?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationStartInterval?: Maybe<ReservationStartInterval>;
  reservationUnitType?: Maybe<Scalars["Int"]["output"]>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  resources?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  searchTerms?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
  serviceSpecificTerms?: Maybe<Scalars["String"]["output"]>;
  spaces?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  surfaceArea?: Maybe<Scalars["Int"]["output"]>;
  termsOfUse?: Maybe<Scalars["String"]["output"]>;
  termsOfUseEn?: Maybe<Scalars["String"]["output"]>;
  termsOfUseFi?: Maybe<Scalars["String"]["output"]>;
  termsOfUseSv?: Maybe<Scalars["String"]["output"]>;
  unit?: Maybe<Scalars["Int"]["output"]>;
  uuid?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationUpdateMutationInput = {
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk: Scalars["Int"]["input"];
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<CustomerTypeChoice>;
};

export type ReservationUpdateMutationPayload = {
  ageGroup?: Maybe<Scalars["Int"]["output"]>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  billingAddressCity?: Maybe<Scalars["String"]["output"]>;
  billingAddressStreet?: Maybe<Scalars["String"]["output"]>;
  billingAddressZip?: Maybe<Scalars["String"]["output"]>;
  billingEmail?: Maybe<Scalars["String"]["output"]>;
  billingFirstName?: Maybe<Scalars["String"]["output"]>;
  billingLastName?: Maybe<Scalars["String"]["output"]>;
  billingPhone?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  homeCity?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  purpose?: Maybe<Scalars["Int"]["output"]>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<CustomerTypeChoice>;
  state?: Maybe<ReservationStateChoice>;
};

export type ReservationWorkingMemoMutationInput = {
  pk: Scalars["Int"]["input"];
  workingMemo: Scalars["String"]["input"];
};

export type ReservationWorkingMemoMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
  workingMemo?: Maybe<Scalars["String"]["output"]>;
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
  locationType?: InputMaybe<LocationType>;
  name: Scalars["String"]["input"];
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  space?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ResourceCreateMutationPayload = {
  locationType?: Maybe<LocationType>;
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  space?: Maybe<Scalars["Int"]["output"]>;
};

export type ResourceDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type ResourceDeleteMutationPayload = {
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

/** An enumeration. */
export enum ResourceLocationType {
  Fixed = "FIXED",
  Movable = "MOVABLE",
}

export type ResourceNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  locationType?: Maybe<ResourceLocationType>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  space?: Maybe<SpaceNode>;
};

export type ResourceNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ResourceNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ResourceNode` and its cursor. */
export type ResourceNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ResourceNode>;
};

/** Ordering fields for the 'Resource' model. */
export enum ResourceOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type ResourceUpdateMutationInput = {
  locationType?: InputMaybe<LocationType>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
  space?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ResourceUpdateMutationPayload = {
  locationType?: Maybe<LocationType>;
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  space?: Maybe<Scalars["Int"]["output"]>;
};

export type RestoreAllApplicationOptionsMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type RestoreAllApplicationOptionsMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type RestoreAllSectionOptionsMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type RestoreAllSectionOptionsMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type SetApplicationRoundHandledMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type SetApplicationRoundHandledMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type SetApplicationRoundResultsSentMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type SetApplicationRoundResultsSentMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type SpaceCreateMutationInput = {
  code?: InputMaybe<Scalars["String"]["input"]>;
  maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  name: Scalars["String"]["input"];
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  parent?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  surfaceArea?: InputMaybe<Scalars["Int"]["input"]>;
  unit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type SpaceCreateMutationPayload = {
  code?: Maybe<Scalars["String"]["output"]>;
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  parent?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  surfaceArea?: Maybe<Scalars["Int"]["output"]>;
  unit?: Maybe<Scalars["Int"]["output"]>;
};

export type SpaceDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type SpaceDeleteMutationPayload = {
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type SpaceNode = Node & {
  children?: Maybe<Array<SpaceNode>>;
  code: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  parent?: Maybe<SpaceNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  resources: Array<ResourceNode>;
  surfaceArea?: Maybe<Scalars["Int"]["output"]>;
  unit?: Maybe<UnitNode>;
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
  orderBy?: InputMaybe<Array<InputMaybe<SpaceOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ResourceOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type SpaceNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<SpaceNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `SpaceNode` and its cursor. */
export type SpaceNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<SpaceNode>;
};

/** Ordering fields for the 'Space' model. */
export enum SpaceOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type SpaceUpdateMutationInput = {
  code?: InputMaybe<Scalars["String"]["input"]>;
  maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  parent?: InputMaybe<Scalars["Int"]["input"]>;
  pk: Scalars["Int"]["input"];
  surfaceArea?: InputMaybe<Scalars["Int"]["input"]>;
  unit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type SpaceUpdateMutationPayload = {
  code?: Maybe<Scalars["String"]["output"]>;
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  parent?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  surfaceArea?: Maybe<Scalars["Int"]["output"]>;
  unit?: Maybe<Scalars["Int"]["output"]>;
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
  applicationSection: ApplicationSectionNode;
  beginTime: Scalars["Time"]["output"];
  dayOfTheWeek: Weekday;
  endTime: Scalars["Time"]["output"];
  fulfilled?: Maybe<Scalars["Boolean"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  priority: Priority;
};

/** Ordering fields for the 'SuitableTimeRange' model. */
export enum SuitableTimeRangeOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type SuitableTimeRangeSerializerInput = {
  beginTime: Scalars["Time"]["input"];
  dayOfTheWeek: Weekday;
  endTime: Scalars["Time"]["input"];
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  priority: Priority;
};

export type TaxPercentageNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  value: Scalars["Decimal"]["output"];
};

export type TaxPercentageNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<TaxPercentageNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `TaxPercentageNode` and its cursor. */
export type TaxPercentageNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<TaxPercentageNode>;
};

/** Ordering fields for the 'TaxPercentage' model. */
export enum TaxPercentageOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type TermsOfUseNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["String"]["output"]>;
  termsType: TermsType;
  text: Scalars["String"]["output"];
  textEn?: Maybe<Scalars["String"]["output"]>;
  textFi?: Maybe<Scalars["String"]["output"]>;
  textSv?: Maybe<Scalars["String"]["output"]>;
};

export type TermsOfUseNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<TermsOfUseNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `TermsOfUseNode` and its cursor. */
export type TermsOfUseNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<TermsOfUseNode>;
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
  begin: Scalars["Time"]["input"];
  end: Scalars["Time"]["input"];
};

export type TimeSlotType = {
  begin: Scalars["Time"]["output"];
  end: Scalars["Time"]["output"];
};

/** This Node should be kept to the bare minimum and never expose any relations to avoid performance issues. */
export type UnitAllNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  tprekId?: Maybe<Scalars["String"]["output"]>;
};

export type UnitGroupNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  units: Array<UnitNode>;
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
  orderBy?: InputMaybe<Array<InputMaybe<UnitOrderingChoices>>>;
  ownReservations?: InputMaybe<Scalars["Boolean"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  publishedReservationUnits?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type UnitGroupNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<UnitGroupNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `UnitGroupNode` and its cursor. */
export type UnitGroupNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<UnitGroupNode>;
};

export type UnitNode = Node & {
  description: Scalars["String"]["output"];
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  email: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  location?: Maybe<LocationNode>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  paymentMerchant?: Maybe<PaymentMerchantNode>;
  phone: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationUnits: Array<ReservationUnitNode>;
  shortDescription: Scalars["String"]["output"];
  shortDescriptionEn?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionFi?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionSv?: Maybe<Scalars["String"]["output"]>;
  spaces: Array<SpaceNode>;
  tprekId?: Maybe<Scalars["String"]["output"]>;
  unitGroups: Array<UnitGroupNode>;
  webPage: Scalars["String"]["output"];
};

export type UnitNodeReservationUnitsArgs = {
  accessType?: InputMaybe<Array<InputMaybe<AccessType>>>;
  accessTypeBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  accessTypeEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  applicationRound?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  calculateFirstReservableTime?: InputMaybe<Scalars["Boolean"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv_Icontains?: InputMaybe<Scalars["String"]["input"]>;
  equipments?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]["input"]>;
  maxPersonsGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  maxPersonsLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  minPersonsGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  minPersonsLte?: InputMaybe<Scalars["Decimal"]["input"]>;
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
  orderBy?: InputMaybe<Array<InputMaybe<ReservationUnitOrderingChoices>>>;
  personsAllowed?: InputMaybe<Scalars["Decimal"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  publishingState?: InputMaybe<
    Array<InputMaybe<ReservationUnitPublishingState>>
  >;
  purposes?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifiers?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  rankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  reservableDateEnd?: InputMaybe<Scalars["Date"]["input"]>;
  reservableDateStart?: InputMaybe<Scalars["Date"]["input"]>;
  reservableMinimumDurationMinutes?: InputMaybe<Scalars["Decimal"]["input"]>;
  reservableTimeEnd?: InputMaybe<Scalars["Time"]["input"]>;
  reservableTimeStart?: InputMaybe<Scalars["Time"]["input"]>;
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
  reservationState?: InputMaybe<
    Array<InputMaybe<ReservationUnitReservationState>>
  >;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  surfaceAreaGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  tprekDepartmentId?: InputMaybe<Scalars["String"]["input"]>;
  tprekId?: InputMaybe<Scalars["String"]["input"]>;
  typeRankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  typeRankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<SpaceOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type UnitNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<UnitNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `UnitNode` and its cursor. */
export type UnitNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<UnitNode>;
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
  assigner?: Maybe<UserNode>;
  created: Scalars["DateTime"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  modified: Scalars["DateTime"]["output"];
  permissions?: Maybe<Array<Maybe<UserPermissionChoice>>>;
  role: UserRoleChoice;
  unitGroups: Array<UnitGroupNode>;
  units: Array<UnitNode>;
  user: UserNode;
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
  orderBy?: InputMaybe<Array<InputMaybe<UnitOrderingChoices>>>;
  ownReservations?: InputMaybe<Scalars["Boolean"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  publishedReservationUnits?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type UnitUpdateMutationInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  phone?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
  shortDescription?: InputMaybe<Scalars["String"]["input"]>;
  shortDescriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  shortDescriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  shortDescriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  tprekId?: InputMaybe<Scalars["String"]["input"]>;
  webPage?: InputMaybe<Scalars["String"]["input"]>;
};

export type UnitUpdateMutationPayload = {
  description?: Maybe<Scalars["String"]["output"]>;
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  email?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  phone?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  shortDescription?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionEn?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionFi?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionSv?: Maybe<Scalars["String"]["output"]>;
  tprekId?: Maybe<Scalars["String"]["output"]>;
  webPage?: Maybe<Scalars["String"]["output"]>;
};

export type UpdateAddressSerializerInput = {
  city?: InputMaybe<Scalars["String"]["input"]>;
  cityEn?: InputMaybe<Scalars["String"]["input"]>;
  cityFi?: InputMaybe<Scalars["String"]["input"]>;
  citySv?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  postCode?: InputMaybe<Scalars["String"]["input"]>;
  streetAddress?: InputMaybe<Scalars["String"]["input"]>;
  streetAddressEn?: InputMaybe<Scalars["String"]["input"]>;
  streetAddressFi?: InputMaybe<Scalars["String"]["input"]>;
  streetAddressSv?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateApplicationRoundTimeSlotSerializerInput = {
  closed?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservableTimes?: InputMaybe<Array<InputMaybe<TimeSlotSerializerInput>>>;
  weekday: Scalars["Int"]["input"];
};

export type UpdateApplicationSectionForApplicationSerializerInput = {
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  appliedReservationsPerWeek?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
  reservationMaxDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  reservationMinDuration?: InputMaybe<Scalars["Duration"]["input"]>;
  reservationUnitOptions?: InputMaybe<
    Array<InputMaybe<UpdateReservationUnitOptionApplicantSerializerInput>>
  >;
  reservationsBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  reservationsEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  suitableTimeRanges?: InputMaybe<
    Array<InputMaybe<UpdateSuitableTimeRangeSerializerInput>>
  >;
};

export type UpdateOrganisationSerializerInput = {
  activeMembers?: InputMaybe<Scalars["Int"]["input"]>;
  address?: InputMaybe<UpdateAddressSerializerInput>;
  coreBusiness?: InputMaybe<Scalars["String"]["input"]>;
  coreBusinessEn?: InputMaybe<Scalars["String"]["input"]>;
  coreBusinessFi?: InputMaybe<Scalars["String"]["input"]>;
  coreBusinessSv?: InputMaybe<Scalars["String"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  identifier?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  organisationType?: InputMaybe<OrganizationTypeChoice>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  yearEstablished?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdatePersonSerializerInput = {
  email?: InputMaybe<Scalars["String"]["input"]>;
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  lastName?: InputMaybe<Scalars["String"]["input"]>;
  phoneNumber?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateReservationSeriesReservationUpdateSerializerInput = {
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<ReserveeType>;
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateReservationUnitAccessTypeSerializerInput = {
  accessType?: InputMaybe<AccessType>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateReservationUnitImageFieldSerializerInput = {
  imageType?: InputMaybe<ImageType>;
  imageUrl: Scalars["Upload"]["input"];
  largeUrl?: InputMaybe<Scalars["String"]["input"]>;
  mediumUrl?: InputMaybe<Scalars["String"]["input"]>;
  smallUrl?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateReservationUnitOptionApplicantSerializerInput = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  preferredOrder?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateReservationUnitPricingSerializerInput = {
  begins?: InputMaybe<Scalars["Date"]["input"]>;
  highestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  highestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  isActivatedOnBegins?: InputMaybe<Scalars["Boolean"]["input"]>;
  lowestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  lowestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  priceUnit?: InputMaybe<PriceUnit>;
  taxPercentage?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateSuitableTimeRangeSerializerInput = {
  beginTime?: InputMaybe<Scalars["Time"]["input"]>;
  dayOfTheWeek?: InputMaybe<Weekday>;
  endTime?: InputMaybe<Scalars["Time"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  priority?: InputMaybe<Priority>;
};

export type UserNode = Node & {
  dateOfBirth?: Maybe<Scalars["Date"]["output"]>;
  email: Scalars["String"]["output"];
  firstName: Scalars["String"]["output"];
  generalRoles: Array<GeneralRoleNode>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  isAdAuthenticated?: Maybe<Scalars["Boolean"]["output"]>;
  isStronglyAuthenticated?: Maybe<Scalars["Boolean"]["output"]>;
  /** Antaa käyttäjälle kaikki oikeudet ilman, että niitä täytyy erikseen luetella. */
  isSuperuser: Scalars["Boolean"]["output"];
  lastName: Scalars["String"]["output"];
  name?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationNotification?: Maybe<Scalars["String"]["output"]>;
  unitRoles: Array<UnitRoleNode>;
  /** Vaaditaan. Enintään 150 merkkiä. Vain kirjaimet, numerot ja @/./+/-/_ ovat sallittuja. */
  username: Scalars["String"]["output"];
  uuid: Scalars["UUID"]["output"];
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
  pk: Scalars["Int"]["input"];
  reservationNotification?: InputMaybe<ReservationNotification>;
};

export type UserStaffUpdateMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationNotification?: Maybe<ReservationNotification>;
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

export type InstructionsFragment = {
  id: string;
  state?: ReservationStateChoice | null;
  reservationUnits: Array<{
    id: string;
    reservationPendingInstructionsFi?: string | null;
    reservationPendingInstructionsEn?: string | null;
    reservationPendingInstructionsSv?: string | null;
    reservationConfirmedInstructionsFi?: string | null;
    reservationConfirmedInstructionsEn?: string | null;
    reservationConfirmedInstructionsSv?: string | null;
    reservationCancelledInstructionsFi?: string | null;
    reservationCancelledInstructionsEn?: string | null;
    reservationCancelledInstructionsSv?: string | null;
  }>;
};

export type ApplicationRoundForApplicationFragment = {
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameSv?: string | null;
  nameEn?: string | null;
  reservationUnits: Array<{
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
    minPersons?: number | null;
    maxPersons?: number | null;
    images: Array<{
      id: string;
      imageUrl?: string | null;
      largeUrl?: string | null;
      mediumUrl?: string | null;
      smallUrl?: string | null;
      imageType: ImageType;
    }>;
    unit?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
    } | null;
    accessTypes: Array<{ id: string; accessType: AccessType }>;
  }>;
};

export type ApplicationSectionReservationFragment = {
  id: string;
  pk?: number | null;
  name: string;
  pindoraInfo?: {
    accessCode: string;
    accessCodeIsActive: boolean;
    accessCodeValidity: Array<{
      accessCodeBeginsAt: string;
      accessCodeEndsAt: string;
      reservationSeriesId: number;
      reservationId: number;
    } | null>;
  } | null;
  reservationUnitOptions: Array<{
    id: string;
    allocatedTimeSlots: Array<{
      id: string;
      dayOfTheWeek: Weekday;
      beginTime: string;
      endTime: string;
      recurringReservation?: {
        id: string;
        pk?: number | null;
        beginTime?: string | null;
        endTime?: string | null;
        weekdays?: Array<number | null> | null;
        accessType?: AccessTypeWithMultivalued | null;
        usedAccessTypes?: Array<AccessType | null> | null;
        pindoraInfo?: {
          accessCode: string;
          accessCodeIsActive: boolean;
          accessCodeValidity: Array<{
            accessCodeBeginsAt: string;
            accessCodeEndsAt: string;
            reservationId: number;
            reservationSeriesId: number;
          }>;
        } | null;
        reservationUnit: {
          reservationConfirmedInstructionsFi?: string | null;
          reservationConfirmedInstructionsEn?: string | null;
          reservationConfirmedInstructionsSv?: string | null;
          nameFi?: string | null;
          nameSv?: string | null;
          nameEn?: string | null;
          id: string;
          pk?: number | null;
          reservationCancelledInstructionsFi?: string | null;
          reservationCancelledInstructionsSv?: string | null;
          reservationCancelledInstructionsEn?: string | null;
          currentAccessType?: AccessType | null;
          unit?: {
            id: string;
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
          } | null;
          accessTypes: Array<{
            id: string;
            pk?: number | null;
            accessType: AccessType;
            beginDate: string;
          }>;
        };
        rejectedOccurrences: Array<{
          id: string;
          beginDatetime: string;
          endDatetime: string;
        }>;
        reservations: Array<{
          id: string;
          pk?: number | null;
          end: string;
          state?: ReservationStateChoice | null;
          accessType: AccessType;
          accessCodeIsActive: boolean;
          begin: string;
          pindoraInfo?: {
            accessCode: string;
            accessCodeBeginsAt: string;
            accessCodeEndsAt: string;
            accessCodeIsActive: boolean;
          } | null;
          reservationUnits: Array<{
            id: string;
            cancellationRule?: {
              id: string;
              canBeCancelledTimeBefore?: number | null;
            } | null;
          }>;
        }>;
      } | null;
    }>;
  }>;
};

export type ApplicationReservationsQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  beginDate: Scalars["Date"]["input"];
}>;

export type ApplicationReservationsQuery = {
  application?: {
    id: string;
    pk?: number | null;
    applicationSections?: Array<{
      id: string;
      pk?: number | null;
      name: string;
      pindoraInfo?: {
        accessCode: string;
        accessCodeIsActive: boolean;
        accessCodeValidity: Array<{
          accessCodeBeginsAt: string;
          accessCodeEndsAt: string;
          reservationSeriesId: number;
          reservationId: number;
        } | null>;
      } | null;
      reservationUnitOptions: Array<{
        id: string;
        allocatedTimeSlots: Array<{
          id: string;
          dayOfTheWeek: Weekday;
          beginTime: string;
          endTime: string;
          recurringReservation?: {
            id: string;
            pk?: number | null;
            beginTime?: string | null;
            endTime?: string | null;
            weekdays?: Array<number | null> | null;
            accessType?: AccessTypeWithMultivalued | null;
            usedAccessTypes?: Array<AccessType | null> | null;
            pindoraInfo?: {
              accessCode: string;
              accessCodeIsActive: boolean;
              accessCodeValidity: Array<{
                accessCodeBeginsAt: string;
                accessCodeEndsAt: string;
                reservationId: number;
                reservationSeriesId: number;
              }>;
            } | null;
            reservationUnit: {
              reservationConfirmedInstructionsFi?: string | null;
              reservationConfirmedInstructionsEn?: string | null;
              reservationConfirmedInstructionsSv?: string | null;
              nameFi?: string | null;
              nameSv?: string | null;
              nameEn?: string | null;
              id: string;
              pk?: number | null;
              reservationCancelledInstructionsFi?: string | null;
              reservationCancelledInstructionsSv?: string | null;
              reservationCancelledInstructionsEn?: string | null;
              currentAccessType?: AccessType | null;
              unit?: {
                id: string;
                nameFi?: string | null;
                nameEn?: string | null;
                nameSv?: string | null;
              } | null;
              accessTypes: Array<{
                id: string;
                pk?: number | null;
                accessType: AccessType;
                beginDate: string;
              }>;
            };
            rejectedOccurrences: Array<{
              id: string;
              beginDatetime: string;
              endDatetime: string;
            }>;
            reservations: Array<{
              id: string;
              pk?: number | null;
              end: string;
              state?: ReservationStateChoice | null;
              accessType: AccessType;
              accessCodeIsActive: boolean;
              begin: string;
              pindoraInfo?: {
                accessCode: string;
                accessCodeBeginsAt: string;
                accessCodeEndsAt: string;
                accessCodeIsActive: boolean;
              } | null;
              reservationUnits: Array<{
                id: string;
                cancellationRule?: {
                  id: string;
                  canBeCancelledTimeBefore?: number | null;
                } | null;
              }>;
            }>;
          } | null;
        }>;
      }>;
    }> | null;
  } | null;
};

export type ApplicationSectionReservationUnitFragment = {
  nameFi?: string | null;
  nameSv?: string | null;
  nameEn?: string | null;
  id: string;
  pk?: number | null;
  reservationCancelledInstructionsFi?: string | null;
  reservationCancelledInstructionsSv?: string | null;
  reservationCancelledInstructionsEn?: string | null;
  currentAccessType?: AccessType | null;
  accessTypes: Array<{
    id: string;
    pk?: number | null;
    accessType: AccessType;
    beginDate: string;
  }>;
};

export type ApplicationReservationUnitListFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameSv?: string | null;
  nameEn?: string | null;
  reservationUnits: Array<{
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
    minPersons?: number | null;
    maxPersons?: number | null;
    images: Array<{
      id: string;
      imageUrl?: string | null;
      largeUrl?: string | null;
      mediumUrl?: string | null;
      smallUrl?: string | null;
      imageType: ImageType;
    }>;
    unit?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
    } | null;
    accessTypes: Array<{ id: string; accessType: AccessType }>;
  }>;
};

export type ApplicationViewFragment = {
  id: string;
  pk?: number | null;
  status?: ApplicationStatusChoice | null;
  applicantType?: ApplicantTypeChoice | null;
  additionalInformation?: string | null;
  applicationRound: {
    id: string;
    sentDate?: string | null;
    status?: ApplicationRoundStatusChoice | null;
    notesWhenApplyingFi?: string | null;
    notesWhenApplyingEn?: string | null;
    notesWhenApplyingSv?: string | null;
    reservationPeriodBegin: string;
    reservationPeriodEnd: string;
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
    termsOfUse?: {
      id: string;
      pk?: string | null;
      termsType: TermsType;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
      minPersons?: number | null;
      maxPersons?: number | null;
      images: Array<{
        id: string;
        imageUrl?: string | null;
        largeUrl?: string | null;
        mediumUrl?: string | null;
        smallUrl?: string | null;
        imageType: ImageType;
      }>;
      unit?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
      accessTypes: Array<{ id: string; accessType: AccessType }>;
    }>;
  };
  applicationSections?: Array<{
    id: string;
    pk?: number | null;
    name: string;
    status?: ApplicationSectionStatusChoice | null;
    reservationMaxDuration: number;
    numPersons: number;
    reservationsEndDate: string;
    reservationsBeginDate: string;
    appliedReservationsPerWeek: number;
    reservationMinDuration: number;
    suitableTimeRanges: Array<{
      id: string;
      pk?: number | null;
      beginTime: string;
      endTime: string;
      dayOfTheWeek: Weekday;
      priority: Priority;
    }>;
    purpose?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
    } | null;
    reservationUnitOptions: Array<{
      id: string;
      pk?: number | null;
      preferredOrder: number;
      reservationUnit: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        applicationRoundTimeSlots: Array<{
          id: string;
          pk?: number | null;
          weekday: number;
          closed: boolean;
          reservableTimes?: Array<{ begin: string; end: string } | null> | null;
        }>;
        unit?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
      };
    }>;
    ageGroup?: {
      id: string;
      pk?: number | null;
      minimum: number;
      maximum?: number | null;
    } | null;
  }> | null;
  contactPerson?: {
    id: string;
    pk?: number | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  organisation?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    identifier?: string | null;
    organisationType: OrganizationTypeChoice;
    coreBusinessFi?: string | null;
    yearEstablished?: number | null;
    address?: {
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddressFi?: string | null;
      cityFi?: string | null;
    } | null;
  } | null;
  homeCity?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  billingAddress?: {
    id: string;
    pk?: number | null;
    postCode: string;
    streetAddressFi?: string | null;
    cityFi?: string | null;
  } | null;
};

export type ApplicationCardFragment = {
  id: string;
  pk?: number | null;
  status?: ApplicationStatusChoice | null;
  lastModifiedDate: string;
  applicantType?: ApplicantTypeChoice | null;
  applicationRound: {
    id: string;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  };
  organisation?: {
    id: string;
    nameFi?: string | null;
    organisationType: OrganizationTypeChoice;
  } | null;
  contactPerson?: { id: string; lastName: string; firstName: string } | null;
};

export type CancelApplicationMutationVariables = Exact<{
  input: ApplicationCancelMutationInput;
}>;

export type CancelApplicationMutation = {
  cancelApplication?: { pk?: number | null } | null;
};

export type ApplicationsGroupFragment = {
  sentDate?: string | null;
  id: string;
  pk?: number | null;
  status?: ApplicationStatusChoice | null;
  lastModifiedDate: string;
  applicantType?: ApplicantTypeChoice | null;
  applicationRound: {
    id: string;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  };
  organisation?: {
    id: string;
    nameFi?: string | null;
    organisationType: OrganizationTypeChoice;
  } | null;
  contactPerson?: { id: string; lastName: string; firstName: string } | null;
};

export type PurposeCardFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  imageUrl?: string | null;
  smallUrl?: string | null;
};

export type ApplicationRoundCardFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  status?: ApplicationRoundStatusChoice | null;
};

export type AddressFieldsFragment = {
  id: string;
  tprekId?: string | null;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  location?: {
    addressStreetEn?: string | null;
    addressStreetSv?: string | null;
    addressCityEn?: string | null;
    addressCitySv?: string | null;
    id: string;
    addressStreetFi?: string | null;
    addressZip: string;
    addressCityFi?: string | null;
  } | null;
};

export type ReservationInfoContainerFragment = {
  id: string;
  reservationBegins?: string | null;
  reservationEnds?: string | null;
  reservationsMaxDaysBefore?: number | null;
  reservationsMinDaysBefore?: number | null;
  minReservationDuration?: number | null;
  maxReservationDuration?: number | null;
  maxReservationsPerUser?: number | null;
};

export type ReservationInfoCardFragment = {
  id: string;
  pk?: number | null;
  taxPercentageValue?: string | null;
  state?: ReservationStateChoice | null;
  accessType: AccessType;
  price?: string | null;
  begin: string;
  end: string;
  applyingForFreeOfCharge?: boolean | null;
  pindoraInfo?: { accessCode: string } | null;
  reservationUnits: Array<{
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    reservationBegins?: string | null;
    reservationEnds?: string | null;
    images: Array<{
      id: string;
      imageUrl?: string | null;
      largeUrl?: string | null;
      mediumUrl?: string | null;
      smallUrl?: string | null;
      imageType: ImageType;
    }>;
    unit?: {
      id: string;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    pricings: Array<{
      id: string;
      begins: string;
      priceUnit: PriceUnit;
      lowestPrice: string;
      highestPrice: string;
      taxPercentage: { id: string; pk?: number | null; value: string };
    }>;
  }>;
};

export type OptionsQueryVariables = Exact<{
  reservationUnitTypesOrderBy?: InputMaybe<
    | Array<InputMaybe<ReservationUnitTypeOrderingChoices>>
    | InputMaybe<ReservationUnitTypeOrderingChoices>
  >;
  purposesOrderBy?: InputMaybe<
    | Array<InputMaybe<PurposeOrderingChoices>>
    | InputMaybe<PurposeOrderingChoices>
  >;
  unitsOrderBy?: InputMaybe<
    Array<InputMaybe<UnitOrderingChoices>> | InputMaybe<UnitOrderingChoices>
  >;
  equipmentsOrderBy?: InputMaybe<
    | Array<InputMaybe<EquipmentOrderingChoices>>
    | InputMaybe<EquipmentOrderingChoices>
  >;
  reservationPurposesOrderBy?: InputMaybe<
    | Array<InputMaybe<ReservationPurposeOrderingChoices>>
    | InputMaybe<ReservationPurposeOrderingChoices>
  >;
}>;

export type OptionsQuery = {
  reservationUnitTypes?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null>;
  } | null;
  purposes?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null>;
  } | null;
  reservationPurposes?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null>;
  } | null;
  ageGroups?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        minimum: number;
        maximum?: number | null;
      } | null;
    } | null>;
  } | null;
  cities?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null>;
  } | null;
  equipmentsAll?: Array<{
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  }> | null;
  unitsAll?: Array<{
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
  }> | null;
};

export type ApplicationFormFragment = {
  id: string;
  pk?: number | null;
  status?: ApplicationStatusChoice | null;
  applicantType?: ApplicantTypeChoice | null;
  additionalInformation?: string | null;
  applicationRound: {
    id: string;
    notesWhenApplyingFi?: string | null;
    notesWhenApplyingEn?: string | null;
    notesWhenApplyingSv?: string | null;
    reservationPeriodBegin: string;
    reservationPeriodEnd: string;
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
      minPersons?: number | null;
      maxPersons?: number | null;
      images: Array<{
        id: string;
        imageUrl?: string | null;
        largeUrl?: string | null;
        mediumUrl?: string | null;
        smallUrl?: string | null;
        imageType: ImageType;
      }>;
      unit?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
      accessTypes: Array<{ id: string; accessType: AccessType }>;
    }>;
  };
  applicationSections?: Array<{
    id: string;
    pk?: number | null;
    name: string;
    status?: ApplicationSectionStatusChoice | null;
    reservationMaxDuration: number;
    numPersons: number;
    reservationsEndDate: string;
    reservationsBeginDate: string;
    appliedReservationsPerWeek: number;
    reservationMinDuration: number;
    suitableTimeRanges: Array<{
      id: string;
      pk?: number | null;
      beginTime: string;
      endTime: string;
      dayOfTheWeek: Weekday;
      priority: Priority;
    }>;
    purpose?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
    } | null;
    reservationUnitOptions: Array<{
      id: string;
      pk?: number | null;
      preferredOrder: number;
      reservationUnit: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        applicationRoundTimeSlots: Array<{
          id: string;
          pk?: number | null;
          weekday: number;
          closed: boolean;
          reservableTimes?: Array<{ begin: string; end: string } | null> | null;
        }>;
        unit?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
      };
    }>;
    ageGroup?: {
      id: string;
      pk?: number | null;
      minimum: number;
      maximum?: number | null;
    } | null;
  }> | null;
  contactPerson?: {
    id: string;
    pk?: number | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  organisation?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    identifier?: string | null;
    organisationType: OrganizationTypeChoice;
    coreBusinessFi?: string | null;
    yearEstablished?: number | null;
    address?: {
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddressFi?: string | null;
      cityFi?: string | null;
    } | null;
  } | null;
  homeCity?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  billingAddress?: {
    id: string;
    pk?: number | null;
    postCode: string;
    streetAddressFi?: string | null;
    cityFi?: string | null;
  } | null;
};

export type UpdateApplicationMutationVariables = Exact<{
  input: ApplicationUpdateMutationInput;
}>;

export type UpdateApplicationMutation = {
  updateApplication?: { pk?: number | null } | null;
};

export type ApplicationRoundPeriodsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type ApplicationRoundPeriodsQuery = {
  applicationRounds?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        reservationPeriodBegin: string;
        reservationPeriodEnd: string;
        applicationPeriodBegin: string;
        status?: ApplicationRoundStatusChoice | null;
        reservationUnits: Array<{ id: string; pk?: number | null }>;
      } | null;
    } | null>;
  } | null;
};

export type UnitNameFieldsI18NFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  location?: {
    addressStreetEn?: string | null;
    addressStreetSv?: string | null;
    addressCityEn?: string | null;
    addressCitySv?: string | null;
    id: string;
    addressStreetFi?: string | null;
    addressZip: string;
    addressCityFi?: string | null;
  } | null;
};

export type TermsOfUseFragment = {
  id: string;
  termsOfUseFi?: string | null;
  termsOfUseEn?: string | null;
  termsOfUseSv?: string | null;
  serviceSpecificTerms?: {
    id: string;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  cancellationTerms?: {
    id: string;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  paymentTerms?: {
    id: string;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  pricingTerms?: {
    id: string;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
};

export type CancelReasonFieldsFragment = {
  id: string;
  pk?: number | null;
  reasonFi?: string | null;
  reasonEn?: string | null;
  reasonSv?: string | null;
};

export type PindoraReservationFragment = {
  accessCode: string;
  accessCodeBeginsAt: string;
  accessCodeEndsAt: string;
  accessCodeIsActive: boolean;
};

export type PindoraSeriesFragment = {
  accessCode: string;
  accessCodeIsActive: boolean;
  accessCodeValidity: Array<{
    accessCodeBeginsAt: string;
    accessCodeEndsAt: string;
    reservationId: number;
    reservationSeriesId: number;
  }>;
};

export type PindoraSectionFragment = {
  accessCode: string;
  accessCodeIsActive: boolean;
  accessCodeValidity: Array<{
    accessCodeBeginsAt: string;
    accessCodeEndsAt: string;
    reservationSeriesId: number;
    reservationId: number;
  } | null>;
};

export type SearchFormParamsUnitQueryVariables = Exact<{
  publishedReservationUnits?: InputMaybe<Scalars["Boolean"]["input"]>;
  ownReservations?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyDirectBookable?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlySeasonalBookable?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    Array<InputMaybe<UnitOrderingChoices>> | InputMaybe<UnitOrderingChoices>
  >;
}>;

export type SearchFormParamsUnitQuery = {
  unitsAll?: Array<{
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  }> | null;
};

export type CreateReservationMutationVariables = Exact<{
  input: ReservationCreateMutationInput;
}>;

export type CreateReservationMutation = {
  createReservation?: { pk?: number | null } | null;
};

export type UpdateReservationMutationVariables = Exact<{
  input: ReservationUpdateMutationInput;
}>;

export type UpdateReservationMutation = {
  updateReservation?: {
    pk?: number | null;
    state?: ReservationStateChoice | null;
  } | null;
};

export type DeleteReservationMutationVariables = Exact<{
  input: ReservationDeleteTentativeMutationInput;
}>;

export type DeleteReservationMutation = {
  deleteTentativeReservation?: { deleted?: boolean | null } | null;
};

export type CancelReservationMutationVariables = Exact<{
  input: ReservationCancellationMutationInput;
}>;

export type CancelReservationMutation = {
  cancelReservation?: { pk?: number | null } | null;
};

export type ConfirmReservationMutationVariables = Exact<{
  input: ReservationConfirmMutationInput;
}>;

export type ConfirmReservationMutation = {
  confirmReservation?: {
    pk?: number | null;
    state?: ReservationStateChoice | null;
    order?: { id: string; checkoutUrl?: string | null } | null;
  } | null;
};

export type CancellationRuleFieldsFragment = {
  id: string;
  cancellationRule?: {
    id: string;
    canBeCancelledTimeBefore?: number | null;
  } | null;
};

export type ReservationOrderStatusFragment = {
  id: string;
  state?: ReservationStateChoice | null;
  paymentOrder: Array<{ id: string; status?: OrderStatus | null }>;
};

export type ListReservationsQueryVariables = Exact<{
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  state?: InputMaybe<
    | Array<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>
  >;
  user?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnits?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ReservationOrderingChoices>>
    | InputMaybe<ReservationOrderingChoices>
  >;
  reservationType:
    | Array<InputMaybe<ReservationTypeChoice>>
    | InputMaybe<ReservationTypeChoice>;
}>;

export type ListReservationsQuery = {
  reservations?: {
    edges: Array<{
      node?: {
        id: string;
        name?: string | null;
        bufferTimeBefore: number;
        bufferTimeAfter: number;
        isBlocked?: boolean | null;
        pk?: number | null;
        taxPercentageValue?: string | null;
        state?: ReservationStateChoice | null;
        accessType: AccessType;
        price?: string | null;
        begin: string;
        end: string;
        applyingForFreeOfCharge?: boolean | null;
        paymentOrder: Array<{
          id: string;
          checkoutUrl?: string | null;
          expiresInMinutes?: number | null;
          status?: OrderStatus | null;
        }>;
        reservationUnits: Array<{
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          reservationBegins?: string | null;
          reservationEnds?: string | null;
          images: Array<{
            id: string;
            imageUrl?: string | null;
            largeUrl?: string | null;
            mediumUrl?: string | null;
            smallUrl?: string | null;
            imageType: ImageType;
          }>;
          unit?: {
            id: string;
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
          } | null;
          cancellationRule?: {
            id: string;
            canBeCancelledTimeBefore?: number | null;
          } | null;
          pricings: Array<{
            id: string;
            begins: string;
            priceUnit: PriceUnit;
            lowestPrice: string;
            highestPrice: string;
            taxPercentage: { id: string; pk?: number | null; value: string };
          }>;
        }>;
        pindoraInfo?: { accessCode: string } | null;
      } | null;
    } | null>;
  } | null;
};

export type OrderFieldsFragment = {
  id: string;
  reservationPk?: string | null;
  status?: OrderStatus | null;
  paymentType: PaymentType;
  receiptUrl?: string | null;
  checkoutUrl?: string | null;
};

export type CanUserCancelReservationFragment = {
  id: string;
  state?: ReservationStateChoice | null;
  begin: string;
  reservationUnits: Array<{
    id: string;
    cancellationRule?: {
      id: string;
      canBeCancelledTimeBefore?: number | null;
    } | null;
  }>;
};

export type ReservationStateQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationStateQuery = {
  reservation?: {
    id: string;
    pk?: number | null;
    state?: ReservationStateChoice | null;
  } | null;
};

export type AdjustReservationTimeMutationVariables = Exact<{
  input: ReservationAdjustTimeMutationInput;
}>;

export type AdjustReservationTimeMutation = {
  adjustReservationTime?: {
    pk?: number | null;
    state?: ReservationStateChoice | null;
    begin?: string | null;
    end?: string | null;
  } | null;
};

export type OrderQueryVariables = Exact<{
  orderUuid: Scalars["String"]["input"];
}>;

export type OrderQuery = {
  order?: {
    id: string;
    reservationPk?: string | null;
    status?: OrderStatus | null;
    paymentType: PaymentType;
    receiptUrl?: string | null;
    checkoutUrl?: string | null;
  } | null;
};

export type RefreshOrderMutationVariables = Exact<{
  input: RefreshOrderMutationInput;
}>;

export type RefreshOrderMutation = {
  refreshOrder?: { orderUuid?: string | null; status?: string | null } | null;
};

export type AccessCodeQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type AccessCodeQuery = {
  reservation?: {
    id: string;
    pindoraInfo?: {
      accessCode: string;
      accessCodeBeginsAt: string;
      accessCodeEndsAt: string;
      accessCodeIsActive: boolean;
    } | null;
  } | null;
};

export type ReservationUnitTypeFieldsFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
};

export type ReservationUnitNameFieldsFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
};

export type EquipmentFieldsFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  category: {
    id: string;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  };
};

export type ReservationUnitPageFieldsFragment = {
  id: string;
  pk?: number | null;
  uuid: string;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  isDraft: boolean;
  descriptionFi?: string | null;
  descriptionEn?: string | null;
  descriptionSv?: string | null;
  reservationKind: ReservationKind;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  reservationStartInterval: ReservationStartInterval;
  canApplyFreeOfCharge: boolean;
  publishingState?: ReservationUnitPublishingState | null;
  reservationState?: ReservationUnitReservationState | null;
  numActiveUserReservations?: number | null;
  requireReservationHandling: boolean;
  currentAccessType?: AccessType | null;
  termsOfUseFi?: string | null;
  termsOfUseEn?: string | null;
  termsOfUseSv?: string | null;
  minPersons?: number | null;
  maxPersons?: number | null;
  reservationBegins?: string | null;
  reservationEnds?: string | null;
  reservationsMaxDaysBefore?: number | null;
  reservationsMinDaysBefore?: number | null;
  minReservationDuration?: number | null;
  maxReservationDuration?: number | null;
  maxReservationsPerUser?: number | null;
  unit?: {
    id: string;
    tprekId?: string | null;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    location?: {
      addressStreetEn?: string | null;
      addressStreetSv?: string | null;
      addressCityEn?: string | null;
      addressCitySv?: string | null;
      id: string;
      addressStreetFi?: string | null;
      addressZip: string;
      addressCityFi?: string | null;
    } | null;
  } | null;
  pricings: Array<{
    id: string;
    begins: string;
    priceUnit: PriceUnit;
    lowestPrice: string;
    highestPrice: string;
    taxPercentage: { id: string; pk?: number | null; value: string };
  }>;
  images: Array<{
    id: string;
    imageUrl?: string | null;
    largeUrl?: string | null;
    mediumUrl?: string | null;
    smallUrl?: string | null;
    imageType: ImageType;
  }>;
  applicationRoundTimeSlots: Array<{
    id: string;
    closed: boolean;
    weekday: number;
    reservableTimes?: Array<{ begin: string; end: string } | null> | null;
  }>;
  applicationRounds: Array<{
    id: string;
    reservationPeriodBegin: string;
    reservationPeriodEnd: string;
  }>;
  reservationUnitType?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  equipments: Array<{
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    category: {
      id: string;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    };
  }>;
  accessTypes: Array<{
    id: string;
    pk?: number | null;
    accessType: AccessType;
    beginDate: string;
  }>;
  serviceSpecificTerms?: {
    id: string;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  cancellationTerms?: {
    id: string;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  paymentTerms?: {
    id: string;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  pricingTerms?: {
    id: string;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  metadataSet?: {
    id: string;
    requiredFields: Array<{ id: string; fieldName: string }>;
    supportedFields: Array<{ id: string; fieldName: string }>;
  } | null;
};

export type BlockingReservationFieldsFragment = {
  pk?: number | null;
  id: string;
  state?: ReservationStateChoice | null;
  isBlocked?: boolean | null;
  begin: string;
  end: string;
  numPersons?: number | null;
  calendarUrl?: string | null;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  affectedReservationUnits?: Array<number | null> | null;
};

export type IsReservableFieldsFragment = {
  id: string;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  maxReservationDuration?: number | null;
  minReservationDuration?: number | null;
  reservationStartInterval: ReservationStartInterval;
  reservationsMaxDaysBefore?: number | null;
  reservationsMinDaysBefore?: number | null;
  reservationBegins?: string | null;
  reservationEnds?: string | null;
  reservableTimeSpans?: Array<{
    startDatetime?: string | null;
    endDatetime?: string | null;
  } | null> | null;
};

export type ReservationUnitPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  beginDate: Scalars["Date"]["input"];
  endDate: Scalars["Date"]["input"];
  state?: InputMaybe<
    | Array<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>
  >;
}>;

export type ReservationUnitPageQuery = {
  reservationUnit?: {
    id: string;
    pk?: number | null;
    uuid: string;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    isDraft: boolean;
    descriptionFi?: string | null;
    descriptionEn?: string | null;
    descriptionSv?: string | null;
    reservationKind: ReservationKind;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationStartInterval: ReservationStartInterval;
    canApplyFreeOfCharge: boolean;
    publishingState?: ReservationUnitPublishingState | null;
    reservationState?: ReservationUnitReservationState | null;
    numActiveUserReservations?: number | null;
    requireReservationHandling: boolean;
    currentAccessType?: AccessType | null;
    maxReservationDuration?: number | null;
    minReservationDuration?: number | null;
    reservationsMaxDaysBefore?: number | null;
    reservationsMinDaysBefore?: number | null;
    reservationBegins?: string | null;
    reservationEnds?: string | null;
    termsOfUseFi?: string | null;
    termsOfUseEn?: string | null;
    termsOfUseSv?: string | null;
    minPersons?: number | null;
    maxPersons?: number | null;
    maxReservationsPerUser?: number | null;
    unit?: {
      id: string;
      tprekId?: string | null;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      location?: {
        addressStreetEn?: string | null;
        addressStreetSv?: string | null;
        addressCityEn?: string | null;
        addressCitySv?: string | null;
        id: string;
        addressStreetFi?: string | null;
        addressZip: string;
        addressCityFi?: string | null;
      } | null;
    } | null;
    pricings: Array<{
      id: string;
      begins: string;
      priceUnit: PriceUnit;
      lowestPrice: string;
      highestPrice: string;
      taxPercentage: { id: string; pk?: number | null; value: string };
    }>;
    images: Array<{
      id: string;
      imageUrl?: string | null;
      largeUrl?: string | null;
      mediumUrl?: string | null;
      smallUrl?: string | null;
      imageType: ImageType;
    }>;
    applicationRoundTimeSlots: Array<{
      id: string;
      closed: boolean;
      weekday: number;
      reservableTimes?: Array<{ begin: string; end: string } | null> | null;
    }>;
    applicationRounds: Array<{
      id: string;
      reservationPeriodBegin: string;
      reservationPeriodEnd: string;
    }>;
    reservationUnitType?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    equipments: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      category: {
        id: string;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      };
    }>;
    accessTypes: Array<{
      id: string;
      pk?: number | null;
      accessType: AccessType;
      beginDate: string;
    }>;
    reservableTimeSpans?: Array<{
      startDatetime?: string | null;
      endDatetime?: string | null;
    } | null> | null;
    serviceSpecificTerms?: {
      id: string;
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    cancellationTerms?: {
      id: string;
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    paymentTerms?: {
      id: string;
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    pricingTerms?: {
      id: string;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    metadataSet?: {
      id: string;
      requiredFields: Array<{ id: string; fieldName: string }>;
      supportedFields: Array<{ id: string; fieldName: string }>;
    } | null;
  } | null;
  affectingReservations?: Array<{
    pk?: number | null;
    id: string;
    state?: ReservationStateChoice | null;
    isBlocked?: boolean | null;
    begin: string;
    end: string;
    numPersons?: number | null;
    calendarUrl?: string | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    affectedReservationUnits?: Array<number | null> | null;
  }> | null;
};

export type ReservationUnitCardFieldsFragment = {
  maxPersons?: number | null;
  currentAccessType?: AccessType | null;
  effectiveAccessType?: AccessType | null;
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  unit?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    location?: {
      addressStreetEn?: string | null;
      addressStreetSv?: string | null;
      addressCityEn?: string | null;
      addressCitySv?: string | null;
      id: string;
      addressStreetFi?: string | null;
      addressZip: string;
      addressCityFi?: string | null;
    } | null;
  } | null;
  reservationUnitType?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  images: Array<{
    id: string;
    imageUrl?: string | null;
    largeUrl?: string | null;
    mediumUrl?: string | null;
    smallUrl?: string | null;
    imageType: ImageType;
  }>;
  accessTypes: Array<{ id: string; accessType: AccessType }>;
};

export type SearchReservationUnitsQueryVariables = Exact<{
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  applicationRound?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  personsAllowed?: InputMaybe<Scalars["Decimal"]["input"]>;
  unit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnitType?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  purposes?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  equipments?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  accessType?: InputMaybe<
    Array<InputMaybe<AccessType>> | InputMaybe<AccessType>
  >;
  accessTypeBeginDate?: InputMaybe<Scalars["Date"]["input"]>;
  accessTypeEndDate?: InputMaybe<Scalars["Date"]["input"]>;
  reservableDateStart?: InputMaybe<Scalars["Date"]["input"]>;
  reservableDateEnd?: InputMaybe<Scalars["Date"]["input"]>;
  reservableTimeStart?: InputMaybe<Scalars["Time"]["input"]>;
  reservableTimeEnd?: InputMaybe<Scalars["Time"]["input"]>;
  reservableMinimumDurationMinutes?: InputMaybe<Scalars["Decimal"]["input"]>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ReservationUnitOrderingChoices>>
    | InputMaybe<ReservationUnitOrderingChoices>
  >;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type SearchReservationUnitsQuery = {
  reservationUnits?: {
    totalCount?: number | null;
    edges: Array<{
      node?: {
        reservationBegins?: string | null;
        reservationEnds?: string | null;
        isClosed?: boolean | null;
        firstReservableDatetime?: string | null;
        currentAccessType?: AccessType | null;
        maxPersons?: number | null;
        effectiveAccessType?: AccessType | null;
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        pricings: Array<{
          id: string;
          begins: string;
          priceUnit: PriceUnit;
          lowestPrice: string;
          highestPrice: string;
          taxPercentage: { id: string; pk?: number | null; value: string };
        }>;
        unit?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          location?: {
            addressStreetEn?: string | null;
            addressStreetSv?: string | null;
            addressCityEn?: string | null;
            addressCitySv?: string | null;
            id: string;
            addressStreetFi?: string | null;
            addressZip: string;
            addressCityFi?: string | null;
          } | null;
        } | null;
        reservationUnitType?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
        images: Array<{
          id: string;
          imageUrl?: string | null;
          largeUrl?: string | null;
          mediumUrl?: string | null;
          smallUrl?: string | null;
          imageType: ImageType;
        }>;
        accessTypes: Array<{ id: string; accessType: AccessType }>;
      } | null;
    } | null>;
    pageInfo: { endCursor?: string | null; hasNextPage: boolean };
  } | null;
};

export type RelatedReservationUnitsQueryVariables = Exact<{
  unit:
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]["input"]>;
}>;

export type RelatedReservationUnitsQuery = {
  reservationUnits?: {
    edges: Array<{
      node?: {
        maxPersons?: number | null;
        isDraft: boolean;
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        images: Array<{
          id: string;
          imageUrl?: string | null;
          largeUrl?: string | null;
          mediumUrl?: string | null;
          smallUrl?: string | null;
          imageType: ImageType;
        }>;
        unit?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          location?: {
            addressStreetEn?: string | null;
            addressStreetSv?: string | null;
            addressCityEn?: string | null;
            addressCitySv?: string | null;
            id: string;
            addressStreetFi?: string | null;
            addressZip: string;
            addressCityFi?: string | null;
          } | null;
        } | null;
        reservationUnitType?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
        pricings: Array<{
          id: string;
          begins: string;
          priceUnit: PriceUnit;
          lowestPrice: string;
          highestPrice: string;
          taxPercentage: { id: string; pk?: number | null; value: string };
        }>;
      } | null;
    } | null>;
  } | null;
};

export type CurrentUserQueryVariables = Exact<{ [key: string]: never }>;

export type CurrentUserQuery = {
  currentUser?: {
    id: string;
    pk?: number | null;
    firstName: string;
    lastName: string;
    email: string;
    isAdAuthenticated?: boolean | null;
  } | null;
};

export type PriceReservationUnitFragment = {
  id: string;
  reservationBegins?: string | null;
  reservationEnds?: string | null;
  pricings: Array<{
    id: string;
    begins: string;
    priceUnit: PriceUnit;
    lowestPrice: string;
    highestPrice: string;
    taxPercentage: { id: string; pk?: number | null; value: string };
  }>;
};

export type ReservationPriceFragment = {
  id: string;
  price?: string | null;
  begin: string;
  state?: ReservationStateChoice | null;
  end: string;
  applyingForFreeOfCharge?: boolean | null;
  reservationUnits: Array<{
    id: string;
    reservationBegins?: string | null;
    reservationEnds?: string | null;
    pricings: Array<{
      id: string;
      begins: string;
      priceUnit: PriceUnit;
      lowestPrice: string;
      highestPrice: string;
      taxPercentage: { id: string; pk?: number | null; value: string };
    }>;
  }>;
};

export type BannerNotificationsListAllQueryVariables = Exact<{
  [key: string]: never;
}>;

export type BannerNotificationsListAllQuery = {
  bannerNotifications?: {
    edges: Array<{
      node?: {
        id: string;
        level: BannerNotificationLevel;
        activeFrom?: string | null;
        message: string;
        messageEn?: string | null;
        messageFi?: string | null;
        messageSv?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type BannerNotificationsListQueryVariables = Exact<{
  target: BannerNotificationTarget;
}>;

export type BannerNotificationsListQuery = {
  bannerNotifications?: {
    edges: Array<{
      node?: {
        id: string;
        level: BannerNotificationLevel;
        activeFrom?: string | null;
        message: string;
        messageEn?: string | null;
        messageFi?: string | null;
        messageSv?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type ApplicationNameFragment = {
  id: string;
  applicantType?: ApplicantTypeChoice | null;
  organisation?: {
    id: string;
    nameFi?: string | null;
    organisationType: OrganizationTypeChoice;
  } | null;
  contactPerson?: { id: string; lastName: string; firstName: string } | null;
};

export type ApplicationSectionDurationFragment = {
  id: string;
  reservationsEndDate: string;
  reservationsBeginDate: string;
  appliedReservationsPerWeek: number;
  reservationMinDuration: number;
};

export type ApplicationSectionCommonFragment = {
  id: string;
  pk?: number | null;
  name: string;
  status?: ApplicationSectionStatusChoice | null;
  reservationMaxDuration: number;
  numPersons: number;
  reservationsEndDate: string;
  reservationsBeginDate: string;
  appliedReservationsPerWeek: number;
  reservationMinDuration: number;
  ageGroup?: {
    id: string;
    pk?: number | null;
    minimum: number;
    maximum?: number | null;
  } | null;
  reservationUnitOptions: Array<{
    id: string;
    pk?: number | null;
    preferredOrder: number;
  }>;
};

export type SuitableTimeFragment = {
  id: string;
  pk?: number | null;
  beginTime: string;
  endTime: string;
  dayOfTheWeek: Weekday;
  priority: Priority;
};

export type ReservationPurposeNameFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameSv?: string | null;
  nameEn?: string | null;
};

export type ReservationUnitNameFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  unit?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
};

export type ApplicationRoundTimeSlotsFragment = {
  id: string;
  pk?: number | null;
  weekday: number;
  closed: boolean;
  reservableTimes?: Array<{ begin: string; end: string } | null> | null;
};

export type ReservationUnitOptionFragment = {
  id: string;
  reservationUnit: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    applicationRoundTimeSlots: Array<{
      id: string;
      pk?: number | null;
      weekday: number;
      closed: boolean;
      reservableTimes?: Array<{ begin: string; end: string } | null> | null;
    }>;
    unit?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
  };
};

export type ApplicantFragment = {
  id: string;
  pk?: number | null;
  applicantType?: ApplicantTypeChoice | null;
  additionalInformation?: string | null;
  contactPerson?: {
    id: string;
    pk?: number | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  organisation?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    identifier?: string | null;
    organisationType: OrganizationTypeChoice;
    coreBusinessFi?: string | null;
    yearEstablished?: number | null;
    address?: {
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddressFi?: string | null;
      cityFi?: string | null;
    } | null;
  } | null;
  homeCity?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  billingAddress?: {
    id: string;
    pk?: number | null;
    postCode: string;
    streetAddressFi?: string | null;
    cityFi?: string | null;
  } | null;
};

export type ReserveeNameFieldsFragment = {
  id: string;
  reserveeFirstName?: string | null;
  reserveeLastName?: string | null;
  reserveeEmail?: string | null;
  reserveePhone?: string | null;
  reserveeType?: CustomerTypeChoice | null;
  reserveeOrganisationName?: string | null;
  reserveeId?: string | null;
};

export type ReserveeBillingFieldsFragment = {
  id: string;
  reserveeId?: string | null;
  reserveeIsUnregisteredAssociation?: boolean | null;
  reserveeAddressStreet?: string | null;
  reserveeAddressCity?: string | null;
  reserveeAddressZip?: string | null;
  billingFirstName?: string | null;
  billingLastName?: string | null;
  billingPhone?: string | null;
  billingEmail?: string | null;
  billingAddressStreet?: string | null;
  billingAddressCity?: string | null;
  billingAddressZip?: string | null;
};

export type MetaFieldsFragment = {
  applyingForFreeOfCharge?: boolean | null;
  freeOfChargeReason?: string | null;
  description?: string | null;
  numPersons?: number | null;
  id: string;
  reserveeFirstName?: string | null;
  reserveeLastName?: string | null;
  reserveeEmail?: string | null;
  reserveePhone?: string | null;
  reserveeType?: CustomerTypeChoice | null;
  reserveeOrganisationName?: string | null;
  reserveeId?: string | null;
  reserveeIsUnregisteredAssociation?: boolean | null;
  reserveeAddressStreet?: string | null;
  reserveeAddressCity?: string | null;
  reserveeAddressZip?: string | null;
  billingFirstName?: string | null;
  billingLastName?: string | null;
  billingPhone?: string | null;
  billingEmail?: string | null;
  billingAddressStreet?: string | null;
  billingAddressCity?: string | null;
  billingAddressZip?: string | null;
  ageGroup?: {
    id: string;
    pk?: number | null;
    maximum?: number | null;
    minimum: number;
  } | null;
  purpose?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  homeCity?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
  } | null;
};

export type TermsOfUseNameFieldsFragment = {
  id: string;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
};

export type TermsOfUseTextFieldsFragment = {
  id: string;
  textFi?: string | null;
  textEn?: string | null;
  textSv?: string | null;
};

export type TermsOfUseFieldsFragment = {
  pk?: string | null;
  termsType: TermsType;
  id: string;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  textFi?: string | null;
  textEn?: string | null;
  textSv?: string | null;
};

export type PricingFieldsFragment = {
  id: string;
  begins: string;
  priceUnit: PriceUnit;
  lowestPrice: string;
  highestPrice: string;
  taxPercentage: { id: string; pk?: number | null; value: string };
};

export type ImageFragment = {
  id: string;
  imageUrl?: string | null;
  largeUrl?: string | null;
  mediumUrl?: string | null;
  smallUrl?: string | null;
  imageType: ImageType;
};

export type LocationFieldsFragment = {
  id: string;
  addressStreetFi?: string | null;
  addressZip: string;
  addressCityFi?: string | null;
};

export type LocationFieldsI18nFragment = {
  addressStreetEn?: string | null;
  addressStreetSv?: string | null;
  addressCityEn?: string | null;
  addressCitySv?: string | null;
  id: string;
  addressStreetFi?: string | null;
  addressZip: string;
  addressCityFi?: string | null;
};

export type BannerNotificationCommonFragment = {
  id: string;
  level: BannerNotificationLevel;
  activeFrom?: string | null;
  message: string;
  messageEn?: string | null;
  messageFi?: string | null;
  messageSv?: string | null;
};

export type MetadataSetsFragment = {
  id: string;
  minPersons?: number | null;
  maxPersons?: number | null;
  metadataSet?: {
    id: string;
    requiredFields: Array<{ id: string; fieldName: string }>;
    supportedFields: Array<{ id: string; fieldName: string }>;
  } | null;
};

export type TermsOfUseQueryVariables = Exact<{
  termsType?: InputMaybe<TermsType>;
}>;

export type TermsOfUseQuery = {
  termsOfUse?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: string | null;
        termsType: TermsType;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type ApplicationPage1QueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationPage1Query = {
  application?: {
    id: string;
    pk?: number | null;
    status?: ApplicationStatusChoice | null;
    applicantType?: ApplicantTypeChoice | null;
    additionalInformation?: string | null;
    applicationRound: {
      id: string;
      notesWhenApplyingFi?: string | null;
      notesWhenApplyingEn?: string | null;
      notesWhenApplyingSv?: string | null;
      reservationPeriodBegin: string;
      reservationPeriodEnd: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
      reservationUnits: Array<{
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
        minPersons?: number | null;
        maxPersons?: number | null;
        images: Array<{
          id: string;
          imageUrl?: string | null;
          largeUrl?: string | null;
          mediumUrl?: string | null;
          smallUrl?: string | null;
          imageType: ImageType;
        }>;
        unit?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameSv?: string | null;
          nameEn?: string | null;
        } | null;
        accessTypes: Array<{ id: string; accessType: AccessType }>;
      }>;
    };
    applicationSections?: Array<{
      id: string;
      pk?: number | null;
      name: string;
      status?: ApplicationSectionStatusChoice | null;
      reservationMaxDuration: number;
      numPersons: number;
      reservationsEndDate: string;
      reservationsBeginDate: string;
      appliedReservationsPerWeek: number;
      reservationMinDuration: number;
      suitableTimeRanges: Array<{
        id: string;
        pk?: number | null;
        beginTime: string;
        endTime: string;
        dayOfTheWeek: Weekday;
        priority: Priority;
      }>;
      purpose?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
      reservationUnitOptions: Array<{
        id: string;
        pk?: number | null;
        preferredOrder: number;
        reservationUnit: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          applicationRoundTimeSlots: Array<{
            id: string;
            pk?: number | null;
            weekday: number;
            closed: boolean;
            reservableTimes?: Array<{
              begin: string;
              end: string;
            } | null> | null;
          }>;
          unit?: {
            id: string;
            pk?: number | null;
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
          } | null;
        };
      }>;
      ageGroup?: {
        id: string;
        pk?: number | null;
        minimum: number;
        maximum?: number | null;
      } | null;
    }> | null;
    contactPerson?: {
      id: string;
      pk?: number | null;
      firstName: string;
      lastName: string;
      email?: string | null;
      phoneNumber?: string | null;
    } | null;
    organisation?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      identifier?: string | null;
      organisationType: OrganizationTypeChoice;
      coreBusinessFi?: string | null;
      yearEstablished?: number | null;
      address?: {
        id: string;
        pk?: number | null;
        postCode: string;
        streetAddressFi?: string | null;
        cityFi?: string | null;
      } | null;
    } | null;
    homeCity?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    billingAddress?: {
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddressFi?: string | null;
      cityFi?: string | null;
    } | null;
  } | null;
};

export type ApplicationPage2QueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationPage2Query = {
  application?: {
    id: string;
    pk?: number | null;
    status?: ApplicationStatusChoice | null;
    applicantType?: ApplicantTypeChoice | null;
    additionalInformation?: string | null;
    applicationRound: {
      id: string;
      notesWhenApplyingFi?: string | null;
      notesWhenApplyingEn?: string | null;
      notesWhenApplyingSv?: string | null;
      reservationPeriodBegin: string;
      reservationPeriodEnd: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
      reservationUnits: Array<{
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
        minPersons?: number | null;
        maxPersons?: number | null;
        images: Array<{
          id: string;
          imageUrl?: string | null;
          largeUrl?: string | null;
          mediumUrl?: string | null;
          smallUrl?: string | null;
          imageType: ImageType;
        }>;
        unit?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameSv?: string | null;
          nameEn?: string | null;
        } | null;
        accessTypes: Array<{ id: string; accessType: AccessType }>;
      }>;
    };
    applicationSections?: Array<{
      id: string;
      pk?: number | null;
      name: string;
      status?: ApplicationSectionStatusChoice | null;
      reservationMaxDuration: number;
      numPersons: number;
      reservationsEndDate: string;
      reservationsBeginDate: string;
      appliedReservationsPerWeek: number;
      reservationMinDuration: number;
      suitableTimeRanges: Array<{
        id: string;
        pk?: number | null;
        beginTime: string;
        endTime: string;
        dayOfTheWeek: Weekday;
        priority: Priority;
      }>;
      purpose?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
      reservationUnitOptions: Array<{
        id: string;
        pk?: number | null;
        preferredOrder: number;
        reservationUnit: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          applicationRoundTimeSlots: Array<{
            id: string;
            pk?: number | null;
            weekday: number;
            closed: boolean;
            reservableTimes?: Array<{
              begin: string;
              end: string;
            } | null> | null;
          }>;
          unit?: {
            id: string;
            pk?: number | null;
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
          } | null;
        };
      }>;
      ageGroup?: {
        id: string;
        pk?: number | null;
        minimum: number;
        maximum?: number | null;
      } | null;
    }> | null;
    contactPerson?: {
      id: string;
      pk?: number | null;
      firstName: string;
      lastName: string;
      email?: string | null;
      phoneNumber?: string | null;
    } | null;
    organisation?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      identifier?: string | null;
      organisationType: OrganizationTypeChoice;
      coreBusinessFi?: string | null;
      yearEstablished?: number | null;
      address?: {
        id: string;
        pk?: number | null;
        postCode: string;
        streetAddressFi?: string | null;
        cityFi?: string | null;
      } | null;
    } | null;
    homeCity?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    billingAddress?: {
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddressFi?: string | null;
      cityFi?: string | null;
    } | null;
  } | null;
};

export type ApplicationPage3QueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationPage3Query = {
  application?: {
    id: string;
    pk?: number | null;
    status?: ApplicationStatusChoice | null;
    applicantType?: ApplicantTypeChoice | null;
    additionalInformation?: string | null;
    applicationRound: {
      id: string;
      notesWhenApplyingFi?: string | null;
      notesWhenApplyingEn?: string | null;
      notesWhenApplyingSv?: string | null;
      reservationPeriodBegin: string;
      reservationPeriodEnd: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
      reservationUnits: Array<{
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
        minPersons?: number | null;
        maxPersons?: number | null;
        images: Array<{
          id: string;
          imageUrl?: string | null;
          largeUrl?: string | null;
          mediumUrl?: string | null;
          smallUrl?: string | null;
          imageType: ImageType;
        }>;
        unit?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameSv?: string | null;
          nameEn?: string | null;
        } | null;
        accessTypes: Array<{ id: string; accessType: AccessType }>;
      }>;
    };
    applicationSections?: Array<{
      id: string;
      pk?: number | null;
      name: string;
      status?: ApplicationSectionStatusChoice | null;
      reservationMaxDuration: number;
      numPersons: number;
      reservationsEndDate: string;
      reservationsBeginDate: string;
      appliedReservationsPerWeek: number;
      reservationMinDuration: number;
      suitableTimeRanges: Array<{
        id: string;
        pk?: number | null;
        beginTime: string;
        endTime: string;
        dayOfTheWeek: Weekday;
        priority: Priority;
      }>;
      purpose?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
      reservationUnitOptions: Array<{
        id: string;
        pk?: number | null;
        preferredOrder: number;
        reservationUnit: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          applicationRoundTimeSlots: Array<{
            id: string;
            pk?: number | null;
            weekday: number;
            closed: boolean;
            reservableTimes?: Array<{
              begin: string;
              end: string;
            } | null> | null;
          }>;
          unit?: {
            id: string;
            pk?: number | null;
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
          } | null;
        };
      }>;
      ageGroup?: {
        id: string;
        pk?: number | null;
        minimum: number;
        maximum?: number | null;
      } | null;
    }> | null;
    contactPerson?: {
      id: string;
      pk?: number | null;
      firstName: string;
      lastName: string;
      email?: string | null;
      phoneNumber?: string | null;
    } | null;
    organisation?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      identifier?: string | null;
      organisationType: OrganizationTypeChoice;
      coreBusinessFi?: string | null;
      yearEstablished?: number | null;
      address?: {
        id: string;
        pk?: number | null;
        postCode: string;
        streetAddressFi?: string | null;
        cityFi?: string | null;
      } | null;
    } | null;
    homeCity?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    billingAddress?: {
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddressFi?: string | null;
      cityFi?: string | null;
    } | null;
  } | null;
};

export type ApplicationPagePreviewQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationPagePreviewQuery = {
  application?: {
    id: string;
    pk?: number | null;
    status?: ApplicationStatusChoice | null;
    applicantType?: ApplicantTypeChoice | null;
    additionalInformation?: string | null;
    applicationRound: {
      id: string;
      sentDate?: string | null;
      status?: ApplicationRoundStatusChoice | null;
      notesWhenApplyingFi?: string | null;
      notesWhenApplyingEn?: string | null;
      notesWhenApplyingSv?: string | null;
      reservationPeriodBegin: string;
      reservationPeriodEnd: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
      termsOfUse?: {
        id: string;
        pk?: string | null;
        termsType: TermsType;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      reservationUnits: Array<{
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
        minPersons?: number | null;
        maxPersons?: number | null;
        images: Array<{
          id: string;
          imageUrl?: string | null;
          largeUrl?: string | null;
          mediumUrl?: string | null;
          smallUrl?: string | null;
          imageType: ImageType;
        }>;
        unit?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameSv?: string | null;
          nameEn?: string | null;
        } | null;
        accessTypes: Array<{ id: string; accessType: AccessType }>;
      }>;
    };
    applicationSections?: Array<{
      id: string;
      pk?: number | null;
      name: string;
      status?: ApplicationSectionStatusChoice | null;
      reservationMaxDuration: number;
      numPersons: number;
      reservationsEndDate: string;
      reservationsBeginDate: string;
      appliedReservationsPerWeek: number;
      reservationMinDuration: number;
      suitableTimeRanges: Array<{
        id: string;
        pk?: number | null;
        beginTime: string;
        endTime: string;
        dayOfTheWeek: Weekday;
        priority: Priority;
      }>;
      purpose?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
      reservationUnitOptions: Array<{
        id: string;
        pk?: number | null;
        preferredOrder: number;
        reservationUnit: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          applicationRoundTimeSlots: Array<{
            id: string;
            pk?: number | null;
            weekday: number;
            closed: boolean;
            reservableTimes?: Array<{
              begin: string;
              end: string;
            } | null> | null;
          }>;
          unit?: {
            id: string;
            pk?: number | null;
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
          } | null;
        };
      }>;
      ageGroup?: {
        id: string;
        pk?: number | null;
        minimum: number;
        maximum?: number | null;
      } | null;
    }> | null;
    contactPerson?: {
      id: string;
      pk?: number | null;
      firstName: string;
      lastName: string;
      email?: string | null;
      phoneNumber?: string | null;
    } | null;
    organisation?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      identifier?: string | null;
      organisationType: OrganizationTypeChoice;
      coreBusinessFi?: string | null;
      yearEstablished?: number | null;
      address?: {
        id: string;
        pk?: number | null;
        postCode: string;
        streetAddressFi?: string | null;
        cityFi?: string | null;
      } | null;
    } | null;
    homeCity?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    billingAddress?: {
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddressFi?: string | null;
      cityFi?: string | null;
    } | null;
  } | null;
};

export type SendApplicationMutationVariables = Exact<{
  input: ApplicationSendMutationInput;
}>;

export type SendApplicationMutation = {
  sendApplication?: { pk?: number | null } | null;
};

export type ApplicationSectionCancelQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationSectionCancelQuery = {
  applicationSection?: {
    pk?: number | null;
    id: string;
    name: string;
    reservationsBeginDate: string;
    reservationsEndDate: string;
    reservationUnitOptions: Array<{
      id: string;
      reservationUnit: {
        id: string;
        pk?: number | null;
        nameEn?: string | null;
        nameFi?: string | null;
        nameSv?: string | null;
      };
      allocatedTimeSlots: Array<{
        id: string;
        dayOfTheWeek: Weekday;
        beginTime: string;
        endTime: string;
        recurringReservation?: {
          id: string;
          reservations: Array<{
            id: string;
            state?: ReservationStateChoice | null;
            begin: string;
            reservationUnits: Array<{
              id: string;
              cancellationRule?: {
                id: string;
                canBeCancelledTimeBefore?: number | null;
              } | null;
            }>;
          }>;
        } | null;
      }>;
    }>;
    application: {
      id: string;
      pk?: number | null;
      applicationRound: {
        id: string;
        termsOfUse?: {
          id: string;
          textFi?: string | null;
          textEn?: string | null;
          textSv?: string | null;
        } | null;
      };
    };
  } | null;
  reservationCancelReasons?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        reasonFi?: string | null;
        reasonEn?: string | null;
        reasonSv?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type CancelApplicationSectionMutationVariables = Exact<{
  input: ApplicationSectionReservationCancellationMutationInput;
}>;

export type CancelApplicationSectionMutation = {
  cancelAllApplicationSectionReservations?: {
    future?: number | null;
    cancelled?: number | null;
  } | null;
};

export type ApplicationSectionViewQueryVariables = Exact<{
  pk: Scalars["Int"]["input"];
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
}>;

export type ApplicationSectionViewQuery = {
  applicationSections?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        name: string;
        application: {
          id: string;
          pk?: number | null;
          status?: ApplicationStatusChoice | null;
          applicationRound: {
            id: string;
            nameEn?: string | null;
            nameFi?: string | null;
            nameSv?: string | null;
          };
        };
        pindoraInfo?: {
          accessCode: string;
          accessCodeIsActive: boolean;
          accessCodeValidity: Array<{
            accessCodeBeginsAt: string;
            accessCodeEndsAt: string;
            reservationSeriesId: number;
            reservationId: number;
          } | null>;
        } | null;
        reservationUnitOptions: Array<{
          id: string;
          allocatedTimeSlots: Array<{
            id: string;
            dayOfTheWeek: Weekday;
            beginTime: string;
            endTime: string;
            recurringReservation?: {
              id: string;
              pk?: number | null;
              beginTime?: string | null;
              endTime?: string | null;
              weekdays?: Array<number | null> | null;
              accessType?: AccessTypeWithMultivalued | null;
              usedAccessTypes?: Array<AccessType | null> | null;
              pindoraInfo?: {
                accessCode: string;
                accessCodeIsActive: boolean;
                accessCodeValidity: Array<{
                  accessCodeBeginsAt: string;
                  accessCodeEndsAt: string;
                  reservationId: number;
                  reservationSeriesId: number;
                }>;
              } | null;
              reservationUnit: {
                reservationConfirmedInstructionsFi?: string | null;
                reservationConfirmedInstructionsEn?: string | null;
                reservationConfirmedInstructionsSv?: string | null;
                nameFi?: string | null;
                nameSv?: string | null;
                nameEn?: string | null;
                id: string;
                pk?: number | null;
                reservationCancelledInstructionsFi?: string | null;
                reservationCancelledInstructionsSv?: string | null;
                reservationCancelledInstructionsEn?: string | null;
                currentAccessType?: AccessType | null;
                unit?: {
                  id: string;
                  nameFi?: string | null;
                  nameEn?: string | null;
                  nameSv?: string | null;
                } | null;
                accessTypes: Array<{
                  id: string;
                  pk?: number | null;
                  accessType: AccessType;
                  beginDate: string;
                }>;
              };
              rejectedOccurrences: Array<{
                id: string;
                beginDatetime: string;
                endDatetime: string;
              }>;
              reservations: Array<{
                id: string;
                pk?: number | null;
                end: string;
                state?: ReservationStateChoice | null;
                accessType: AccessType;
                accessCodeIsActive: boolean;
                begin: string;
                pindoraInfo?: {
                  accessCode: string;
                  accessCodeBeginsAt: string;
                  accessCodeEndsAt: string;
                  accessCodeIsActive: boolean;
                } | null;
                reservationUnits: Array<{
                  id: string;
                  cancellationRule?: {
                    id: string;
                    canBeCancelledTimeBefore?: number | null;
                  } | null;
                }>;
              }>;
            } | null;
          }>;
        }>;
      } | null;
    } | null>;
  } | null;
};

export type ApplicationSentPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationSentPageQuery = {
  application?: {
    id: string;
    pk?: number | null;
    status?: ApplicationStatusChoice | null;
  } | null;
};

export type ApplicationViewQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationViewQuery = {
  application?: {
    id: string;
    pk?: number | null;
    status?: ApplicationStatusChoice | null;
    applicantType?: ApplicantTypeChoice | null;
    additionalInformation?: string | null;
    applicationSections?: Array<{
      id: string;
      hasReservations: boolean;
      pk?: number | null;
      name: string;
      status?: ApplicationSectionStatusChoice | null;
      reservationMaxDuration: number;
      numPersons: number;
      reservationsEndDate: string;
      reservationsBeginDate: string;
      appliedReservationsPerWeek: number;
      reservationMinDuration: number;
      suitableTimeRanges: Array<{
        id: string;
        pk?: number | null;
        beginTime: string;
        endTime: string;
        dayOfTheWeek: Weekday;
        priority: Priority;
      }>;
      purpose?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
      reservationUnitOptions: Array<{
        id: string;
        pk?: number | null;
        preferredOrder: number;
        reservationUnit: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          applicationRoundTimeSlots: Array<{
            id: string;
            pk?: number | null;
            weekday: number;
            closed: boolean;
            reservableTimes?: Array<{
              begin: string;
              end: string;
            } | null> | null;
          }>;
          unit?: {
            id: string;
            pk?: number | null;
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
          } | null;
        };
      }>;
      ageGroup?: {
        id: string;
        pk?: number | null;
        minimum: number;
        maximum?: number | null;
      } | null;
    }> | null;
    applicationRound: {
      id: string;
      sentDate?: string | null;
      status?: ApplicationRoundStatusChoice | null;
      notesWhenApplyingFi?: string | null;
      notesWhenApplyingEn?: string | null;
      notesWhenApplyingSv?: string | null;
      reservationPeriodBegin: string;
      reservationPeriodEnd: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
      termsOfUse?: {
        id: string;
        pk?: string | null;
        termsType: TermsType;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      reservationUnits: Array<{
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
        minPersons?: number | null;
        maxPersons?: number | null;
        images: Array<{
          id: string;
          imageUrl?: string | null;
          largeUrl?: string | null;
          mediumUrl?: string | null;
          smallUrl?: string | null;
          imageType: ImageType;
        }>;
        unit?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameSv?: string | null;
          nameEn?: string | null;
        } | null;
        accessTypes: Array<{ id: string; accessType: AccessType }>;
      }>;
    };
    contactPerson?: {
      id: string;
      pk?: number | null;
      firstName: string;
      lastName: string;
      email?: string | null;
      phoneNumber?: string | null;
    } | null;
    organisation?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      identifier?: string | null;
      organisationType: OrganizationTypeChoice;
      coreBusinessFi?: string | null;
      yearEstablished?: number | null;
      address?: {
        id: string;
        pk?: number | null;
        postCode: string;
        streetAddressFi?: string | null;
        cityFi?: string | null;
      } | null;
    } | null;
    homeCity?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    billingAddress?: {
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddressFi?: string | null;
      cityFi?: string | null;
    } | null;
  } | null;
};

export type ApplicationsQueryVariables = Exact<{
  user: Scalars["Int"]["input"];
  status:
    | Array<InputMaybe<ApplicationStatusChoice>>
    | InputMaybe<ApplicationStatusChoice>;
  orderBy:
    | Array<InputMaybe<ApplicationOrderingChoices>>
    | InputMaybe<ApplicationOrderingChoices>;
}>;

export type ApplicationsQuery = {
  applications?: {
    edges: Array<{
      node?: {
        sentDate?: string | null;
        id: string;
        pk?: number | null;
        status?: ApplicationStatusChoice | null;
        lastModifiedDate: string;
        applicantType?: ApplicantTypeChoice | null;
        applicationRound: {
          id: string;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        };
        organisation?: {
          id: string;
          nameFi?: string | null;
          organisationType: OrganizationTypeChoice;
        } | null;
        contactPerson?: {
          id: string;
          lastName: string;
          firstName: string;
        } | null;
      } | null;
    } | null>;
  } | null;
};

export type ReservationUnitPurposesQueryVariables = Exact<{
  orderBy?: InputMaybe<
    | Array<InputMaybe<PurposeOrderingChoices>>
    | InputMaybe<PurposeOrderingChoices>
  >;
}>;

export type ReservationUnitPurposesQuery = {
  purposes?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        imageUrl?: string | null;
        smallUrl?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type ApplicationRoundCriteriaQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRoundCriteriaQuery = {
  applicationRound?: {
    pk?: number | null;
    id: string;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    criteriaFi?: string | null;
    criteriaEn?: string | null;
    criteriaSv?: string | null;
    notesWhenApplyingFi?: string | null;
    notesWhenApplyingEn?: string | null;
    notesWhenApplyingSv?: string | null;
  } | null;
};

export type ApplicationRoundQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRoundQuery = {
  applicationRound?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    reservationPeriodBegin: string;
    reservationPeriodEnd: string;
    reservationUnits: Array<{ id: string; pk?: number | null }>;
  } | null;
};

export type CreateApplicationMutationVariables = Exact<{
  input: ApplicationCreateMutationInput;
}>;

export type CreateApplicationMutation = {
  createApplication?: { pk?: number | null } | null;
};

export type ApplicationRoundFieldsFragment = {
  publicDisplayBegin: string;
  publicDisplayEnd: string;
  criteriaFi?: string | null;
  criteriaEn?: string | null;
  criteriaSv?: string | null;
  notesWhenApplyingFi?: string | null;
  notesWhenApplyingEn?: string | null;
  notesWhenApplyingSv?: string | null;
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  status?: ApplicationRoundStatusChoice | null;
  reservationUnits: Array<{
    id: string;
    pk?: number | null;
    unit?: { id: string; pk?: number | null } | null;
  }>;
};

export type ApplicationRoundsUiQueryVariables = Exact<{
  orderBy?: InputMaybe<
    | Array<InputMaybe<ApplicationRoundOrderingChoices>>
    | InputMaybe<ApplicationRoundOrderingChoices>
  >;
}>;

export type ApplicationRoundsUiQuery = {
  applicationRounds?: {
    edges: Array<{
      node?: {
        publicDisplayBegin: string;
        publicDisplayEnd: string;
        criteriaFi?: string | null;
        criteriaEn?: string | null;
        criteriaSv?: string | null;
        notesWhenApplyingFi?: string | null;
        notesWhenApplyingEn?: string | null;
        notesWhenApplyingSv?: string | null;
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        reservationPeriodBegin: string;
        reservationPeriodEnd: string;
        applicationPeriodBegin: string;
        applicationPeriodEnd: string;
        status?: ApplicationRoundStatusChoice | null;
        reservationUnits: Array<{
          id: string;
          pk?: number | null;
          unit?: { id: string; pk?: number | null } | null;
        }>;
      } | null;
    } | null>;
  } | null;
};

export type ReservationQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationQuery = {
  reservation?: {
    id: string;
    pk?: number | null;
    name?: string | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    calendarUrl?: string | null;
    applyingForFreeOfCharge?: boolean | null;
    freeOfChargeReason?: string | null;
    description?: string | null;
    numPersons?: number | null;
    taxPercentageValue?: string | null;
    state?: ReservationStateChoice | null;
    accessType: AccessType;
    reserveeFirstName?: string | null;
    reserveeLastName?: string | null;
    reserveeEmail?: string | null;
    reserveePhone?: string | null;
    reserveeType?: CustomerTypeChoice | null;
    reserveeOrganisationName?: string | null;
    reserveeId?: string | null;
    reserveeIsUnregisteredAssociation?: boolean | null;
    reserveeAddressStreet?: string | null;
    reserveeAddressCity?: string | null;
    reserveeAddressZip?: string | null;
    billingFirstName?: string | null;
    billingLastName?: string | null;
    billingPhone?: string | null;
    billingEmail?: string | null;
    billingAddressStreet?: string | null;
    billingAddressCity?: string | null;
    billingAddressZip?: string | null;
    price?: string | null;
    begin: string;
    end: string;
    paymentOrder: Array<{
      id: string;
      reservationPk?: string | null;
      status?: OrderStatus | null;
      paymentType: PaymentType;
      receiptUrl?: string | null;
      checkoutUrl?: string | null;
    }>;
    reservationUnits: Array<{
      id: string;
      canApplyFreeOfCharge: boolean;
      requireReservationHandling: boolean;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      minPersons?: number | null;
      maxPersons?: number | null;
      termsOfUseFi?: string | null;
      termsOfUseEn?: string | null;
      termsOfUseSv?: string | null;
      reservationBegins?: string | null;
      reservationEnds?: string | null;
      images: Array<{
        id: string;
        imageUrl?: string | null;
        largeUrl?: string | null;
        mediumUrl?: string | null;
        smallUrl?: string | null;
        imageType: ImageType;
      }>;
      unit?: {
        id: string;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
      cancellationRule?: {
        id: string;
        canBeCancelledTimeBefore?: number | null;
      } | null;
      metadataSet?: {
        id: string;
        requiredFields: Array<{ id: string; fieldName: string }>;
        supportedFields: Array<{ id: string; fieldName: string }>;
      } | null;
      serviceSpecificTerms?: {
        id: string;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      cancellationTerms?: {
        id: string;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      paymentTerms?: {
        id: string;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      pricingTerms?: {
        id: string;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      pricings: Array<{
        id: string;
        begins: string;
        priceUnit: PriceUnit;
        lowestPrice: string;
        highestPrice: string;
        taxPercentage: { id: string; pk?: number | null; value: string };
      }>;
    }>;
    ageGroup?: {
      id: string;
      pk?: number | null;
      maximum?: number | null;
      minimum: number;
    } | null;
    purpose?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    homeCity?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
    } | null;
    pindoraInfo?: { accessCode: string } | null;
  } | null;
};

export type ReservationCancelPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationCancelPageQuery = {
  reservation?: {
    id: string;
    name?: string | null;
    pk?: number | null;
    taxPercentageValue?: string | null;
    state?: ReservationStateChoice | null;
    accessType: AccessType;
    price?: string | null;
    begin: string;
    end: string;
    applyingForFreeOfCharge?: boolean | null;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      reservationBegins?: string | null;
      reservationEnds?: string | null;
      cancellationTerms?: {
        id: string;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      images: Array<{
        id: string;
        imageUrl?: string | null;
        largeUrl?: string | null;
        mediumUrl?: string | null;
        smallUrl?: string | null;
        imageType: ImageType;
      }>;
      unit?: {
        id: string;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
      cancellationRule?: {
        id: string;
        canBeCancelledTimeBefore?: number | null;
      } | null;
      pricings: Array<{
        id: string;
        begins: string;
        priceUnit: PriceUnit;
        lowestPrice: string;
        highestPrice: string;
        taxPercentage: { id: string; pk?: number | null; value: string };
      }>;
    }>;
    recurringReservation?: {
      id: string;
      name: string;
      allocatedTimeSlot?: {
        id: string;
        pk?: number | null;
        reservationUnitOption: {
          id: string;
          applicationSection: {
            id: string;
            application: {
              id: string;
              pk?: number | null;
              applicationRound: {
                id: string;
                termsOfUse?: {
                  id: string;
                  textFi?: string | null;
                  textEn?: string | null;
                  textSv?: string | null;
                } | null;
              };
            };
          };
        };
      } | null;
    } | null;
    pindoraInfo?: { accessCode: string } | null;
  } | null;
  reservationCancelReasons?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        reasonFi?: string | null;
        reasonEn?: string | null;
        reasonSv?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type ReservationConfirmationPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationConfirmationPageQuery = {
  reservation?: {
    id: string;
    pk?: number | null;
    name?: string | null;
    calendarUrl?: string | null;
    reserveeFirstName?: string | null;
    reserveeLastName?: string | null;
    reserveeEmail?: string | null;
    reserveePhone?: string | null;
    reserveeType?: CustomerTypeChoice | null;
    reserveeOrganisationName?: string | null;
    reserveeId?: string | null;
    reserveeIsUnregisteredAssociation?: boolean | null;
    reserveeAddressStreet?: string | null;
    reserveeAddressCity?: string | null;
    reserveeAddressZip?: string | null;
    billingFirstName?: string | null;
    billingLastName?: string | null;
    billingPhone?: string | null;
    billingEmail?: string | null;
    billingAddressStreet?: string | null;
    billingAddressCity?: string | null;
    billingAddressZip?: string | null;
    description?: string | null;
    numPersons?: number | null;
    taxPercentageValue?: string | null;
    state?: ReservationStateChoice | null;
    accessType: AccessType;
    price?: string | null;
    begin: string;
    end: string;
    applyingForFreeOfCharge?: boolean | null;
    paymentOrder: Array<{
      id: string;
      reservationPk?: string | null;
      status?: OrderStatus | null;
      paymentType: PaymentType;
      receiptUrl?: string | null;
      checkoutUrl?: string | null;
    }>;
    reservationUnits: Array<{
      id: string;
      canApplyFreeOfCharge: boolean;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      reservationPendingInstructionsFi?: string | null;
      reservationPendingInstructionsEn?: string | null;
      reservationPendingInstructionsSv?: string | null;
      reservationConfirmedInstructionsFi?: string | null;
      reservationConfirmedInstructionsEn?: string | null;
      reservationConfirmedInstructionsSv?: string | null;
      reservationCancelledInstructionsFi?: string | null;
      reservationCancelledInstructionsEn?: string | null;
      reservationCancelledInstructionsSv?: string | null;
      reservationBegins?: string | null;
      reservationEnds?: string | null;
      images: Array<{
        id: string;
        imageUrl?: string | null;
        largeUrl?: string | null;
        mediumUrl?: string | null;
        smallUrl?: string | null;
        imageType: ImageType;
      }>;
      unit?: {
        id: string;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
      cancellationRule?: {
        id: string;
        canBeCancelledTimeBefore?: number | null;
      } | null;
      pricings: Array<{
        id: string;
        begins: string;
        priceUnit: PriceUnit;
        lowestPrice: string;
        highestPrice: string;
        taxPercentage: { id: string; pk?: number | null; value: string };
      }>;
    }>;
    purpose?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    ageGroup?: {
      id: string;
      pk?: number | null;
      minimum: number;
      maximum?: number | null;
    } | null;
    pindoraInfo?: { accessCode: string } | null;
  } | null;
};

export type ReservationEditPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationEditPageQuery = {
  reservation?: {
    id: string;
    pk?: number | null;
    name?: string | null;
    isHandled?: boolean | null;
    applyingForFreeOfCharge?: boolean | null;
    freeOfChargeReason?: string | null;
    description?: string | null;
    numPersons?: number | null;
    taxPercentageValue?: string | null;
    state?: ReservationStateChoice | null;
    accessType: AccessType;
    reserveeFirstName?: string | null;
    reserveeLastName?: string | null;
    reserveeEmail?: string | null;
    reserveePhone?: string | null;
    reserveeType?: CustomerTypeChoice | null;
    reserveeOrganisationName?: string | null;
    reserveeId?: string | null;
    reserveeIsUnregisteredAssociation?: boolean | null;
    reserveeAddressStreet?: string | null;
    reserveeAddressCity?: string | null;
    reserveeAddressZip?: string | null;
    billingFirstName?: string | null;
    billingLastName?: string | null;
    billingPhone?: string | null;
    billingEmail?: string | null;
    billingAddressStreet?: string | null;
    billingAddressCity?: string | null;
    billingAddressZip?: string | null;
    price?: string | null;
    begin: string;
    end: string;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      minPersons?: number | null;
      maxPersons?: number | null;
      reservationBegins?: string | null;
      reservationEnds?: string | null;
      images: Array<{
        id: string;
        imageUrl?: string | null;
        largeUrl?: string | null;
        mediumUrl?: string | null;
        smallUrl?: string | null;
        imageType: ImageType;
      }>;
      unit?: {
        id: string;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
      cancellationRule?: {
        id: string;
        canBeCancelledTimeBefore?: number | null;
      } | null;
      metadataSet?: {
        id: string;
        requiredFields: Array<{ id: string; fieldName: string }>;
        supportedFields: Array<{ id: string; fieldName: string }>;
      } | null;
      pricings: Array<{
        id: string;
        begins: string;
        priceUnit: PriceUnit;
        lowestPrice: string;
        highestPrice: string;
        taxPercentage: { id: string; pk?: number | null; value: string };
      }>;
    }>;
    ageGroup?: {
      id: string;
      pk?: number | null;
      maximum?: number | null;
      minimum: number;
    } | null;
    purpose?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    homeCity?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
    } | null;
    pindoraInfo?: { accessCode: string } | null;
  } | null;
};

export type ApplicationRecurringReservationQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRecurringReservationQuery = {
  recurringReservation?: {
    id: string;
    allocatedTimeSlot?: {
      id: string;
      reservationUnitOption: {
        id: string;
        applicationSection: {
          id: string;
          application: { id: string; pk?: number | null };
        };
      };
    } | null;
  } | null;
};

export type ReservationPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationPageQuery = {
  reservation?: {
    id: string;
    pk?: number | null;
    applyingForFreeOfCharge?: boolean | null;
    calendarUrl?: string | null;
    reserveeFirstName?: string | null;
    reserveeLastName?: string | null;
    reserveeEmail?: string | null;
    reserveePhone?: string | null;
    reserveeType?: CustomerTypeChoice | null;
    reserveeOrganisationName?: string | null;
    reserveeId?: string | null;
    reserveeIsUnregisteredAssociation?: boolean | null;
    reserveeAddressStreet?: string | null;
    reserveeAddressCity?: string | null;
    reserveeAddressZip?: string | null;
    billingFirstName?: string | null;
    billingLastName?: string | null;
    billingPhone?: string | null;
    billingEmail?: string | null;
    billingAddressStreet?: string | null;
    billingAddressCity?: string | null;
    billingAddressZip?: string | null;
    description?: string | null;
    numPersons?: number | null;
    taxPercentageValue?: string | null;
    state?: ReservationStateChoice | null;
    accessType: AccessType;
    price?: string | null;
    begin: string;
    end: string;
    paymentOrder: Array<{
      id: string;
      reservationPk?: string | null;
      status?: OrderStatus | null;
      paymentType: PaymentType;
      receiptUrl?: string | null;
      checkoutUrl?: string | null;
    }>;
    recurringReservation?: { id: string } | null;
    reservationUnits: Array<{
      id: string;
      canApplyFreeOfCharge: boolean;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      reservationPendingInstructionsFi?: string | null;
      reservationPendingInstructionsEn?: string | null;
      reservationPendingInstructionsSv?: string | null;
      reservationConfirmedInstructionsFi?: string | null;
      reservationConfirmedInstructionsEn?: string | null;
      reservationConfirmedInstructionsSv?: string | null;
      reservationCancelledInstructionsFi?: string | null;
      reservationCancelledInstructionsEn?: string | null;
      reservationCancelledInstructionsSv?: string | null;
      minPersons?: number | null;
      maxPersons?: number | null;
      termsOfUseFi?: string | null;
      termsOfUseEn?: string | null;
      termsOfUseSv?: string | null;
      reservationBegins?: string | null;
      reservationEnds?: string | null;
      unit?: {
        id: string;
        tprekId?: string | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        pk?: number | null;
        location?: {
          addressStreetEn?: string | null;
          addressStreetSv?: string | null;
          addressCityEn?: string | null;
          addressCitySv?: string | null;
          id: string;
          addressStreetFi?: string | null;
          addressZip: string;
          addressCityFi?: string | null;
        } | null;
      } | null;
      images: Array<{
        id: string;
        imageUrl?: string | null;
        largeUrl?: string | null;
        mediumUrl?: string | null;
        smallUrl?: string | null;
        imageType: ImageType;
      }>;
      cancellationRule?: {
        id: string;
        canBeCancelledTimeBefore?: number | null;
      } | null;
      metadataSet?: {
        id: string;
        requiredFields: Array<{ id: string; fieldName: string }>;
        supportedFields: Array<{ id: string; fieldName: string }>;
      } | null;
      serviceSpecificTerms?: {
        id: string;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      cancellationTerms?: {
        id: string;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      paymentTerms?: {
        id: string;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      pricingTerms?: {
        id: string;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      pricings: Array<{
        id: string;
        begins: string;
        priceUnit: PriceUnit;
        lowestPrice: string;
        highestPrice: string;
        taxPercentage: { id: string; pk?: number | null; value: string };
      }>;
    }>;
    purpose?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    ageGroup?: {
      id: string;
      pk?: number | null;
      minimum: number;
      maximum?: number | null;
    } | null;
    pindoraInfo?: { accessCode: string } | null;
  } | null;
};

export type ReservationInfoFragment = {
  id: string;
  description?: string | null;
  numPersons?: number | null;
  purpose?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  ageGroup?: {
    id: string;
    pk?: number | null;
    minimum: number;
    maximum?: number | null;
  } | null;
};

export const InstructionsFragmentDoc = gql`
  fragment Instructions on ReservationNode {
    id
    state
    reservationUnits {
      id
      reservationPendingInstructionsFi
      reservationPendingInstructionsEn
      reservationPendingInstructionsSv
      reservationConfirmedInstructionsFi
      reservationConfirmedInstructionsEn
      reservationConfirmedInstructionsSv
      reservationCancelledInstructionsFi
      reservationCancelledInstructionsEn
      reservationCancelledInstructionsSv
    }
  }
`;
export const PindoraSectionFragmentDoc = gql`
  fragment PindoraSection on PindoraSectionInfoType {
    accessCode
    accessCodeIsActive
    accessCodeValidity {
      accessCodeBeginsAt
      accessCodeEndsAt
      reservationSeriesId
      reservationId
    }
  }
`;
export const PindoraSeriesFragmentDoc = gql`
  fragment PindoraSeries on PindoraSeriesInfoType {
    accessCode
    accessCodeIsActive
    accessCodeValidity {
      accessCodeBeginsAt
      accessCodeEndsAt
      reservationId
      reservationSeriesId
    }
  }
`;
export const ApplicationSectionReservationUnitFragmentDoc = gql`
  fragment ApplicationSectionReservationUnit on ReservationUnitNode {
    nameFi
    nameSv
    nameEn
    id
    pk
    reservationCancelledInstructionsFi
    reservationCancelledInstructionsSv
    reservationCancelledInstructionsEn
    accessTypes {
      id
      pk
      accessType
      beginDate
    }
    currentAccessType
  }
`;
export const CancellationRuleFieldsFragmentDoc = gql`
  fragment CancellationRuleFields on ReservationUnitNode {
    id
    cancellationRule {
      id
      canBeCancelledTimeBefore
    }
  }
`;
export const CanUserCancelReservationFragmentDoc = gql`
  fragment CanUserCancelReservation on ReservationNode {
    id
    state
    begin
    reservationUnits {
      id
      ...CancellationRuleFields
    }
  }
  ${CancellationRuleFieldsFragmentDoc}
`;
export const PindoraReservationFragmentDoc = gql`
  fragment PindoraReservation on PindoraReservationInfoType {
    accessCode
    accessCodeBeginsAt
    accessCodeEndsAt
    accessCodeIsActive
  }
`;
export const ApplicationSectionReservationFragmentDoc = gql`
  fragment ApplicationSectionReservation on ApplicationSectionNode {
    id
    pk
    name
    pindoraInfo {
      ...PindoraSection
    }
    reservationUnitOptions {
      id
      allocatedTimeSlots {
        id
        dayOfTheWeek
        beginTime
        endTime
        recurringReservation {
          id
          pk
          beginTime
          endTime
          weekdays
          accessType
          usedAccessTypes
          pindoraInfo {
            ...PindoraSeries
          }
          reservationUnit {
            ...ApplicationSectionReservationUnit
            reservationConfirmedInstructionsFi
            reservationConfirmedInstructionsEn
            reservationConfirmedInstructionsSv
            unit {
              id
              nameFi
              nameEn
              nameSv
            }
          }
          rejectedOccurrences {
            id
            beginDatetime
            endDatetime
          }
          reservations(orderBy: [beginAsc], beginDate: $beginDate) {
            id
            pk
            end
            state
            ...CanUserCancelReservation
            accessType
            accessCodeIsActive
            pindoraInfo {
              ...PindoraReservation
            }
          }
        }
      }
    }
  }
  ${PindoraSectionFragmentDoc}
  ${PindoraSeriesFragmentDoc}
  ${ApplicationSectionReservationUnitFragmentDoc}
  ${CanUserCancelReservationFragmentDoc}
  ${PindoraReservationFragmentDoc}
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
export const ApplicationReservationUnitListFragmentDoc = gql`
  fragment ApplicationReservationUnitList on ApplicationRoundNode {
    id
    pk
    nameFi
    nameSv
    nameEn
    reservationUnits {
      id
      pk
      nameFi
      nameSv
      nameEn
      minPersons
      maxPersons
      images {
        ...Image
      }
      unit {
        id
        pk
        nameFi
        nameSv
        nameEn
      }
      accessTypes {
        id
        accessType
      }
    }
  }
  ${ImageFragmentDoc}
`;
export const ApplicationRoundForApplicationFragmentDoc = gql`
  fragment ApplicationRoundForApplication on ApplicationRoundNode {
    ...ApplicationReservationUnitList
    reservationPeriodBegin
    reservationPeriodEnd
  }
  ${ApplicationReservationUnitListFragmentDoc}
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
export const ReservationPurposeNameFragmentDoc = gql`
  fragment ReservationPurposeName on ReservationPurposeNode {
    id
    pk
    nameFi
    nameSv
    nameEn
  }
`;
export const ReservationUnitNameFragmentDoc = gql`
  fragment ReservationUnitName on ReservationUnitNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    unit {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
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
export const ReservationUnitOptionFragmentDoc = gql`
  fragment ReservationUnitOption on ReservationUnitOptionNode {
    id
    reservationUnit {
      ...ReservationUnitName
      applicationRoundTimeSlots {
        ...ApplicationRoundTimeSlots
      }
    }
  }
  ${ReservationUnitNameFragmentDoc}
  ${ApplicationRoundTimeSlotsFragmentDoc}
`;
export const ApplicationFormFragmentDoc = gql`
  fragment ApplicationForm on ApplicationNode {
    id
    pk
    status
    ...Applicant
    applicationRound {
      id
      ...ApplicationRoundForApplication
      notesWhenApplyingFi
      notesWhenApplyingEn
      notesWhenApplyingSv
    }
    applicationSections {
      ...ApplicationSectionCommon
      suitableTimeRanges {
        ...SuitableTime
      }
      purpose {
        ...ReservationPurposeName
      }
      reservationUnitOptions {
        ...ReservationUnitOption
      }
    }
  }
  ${ApplicantFragmentDoc}
  ${ApplicationRoundForApplicationFragmentDoc}
  ${ApplicationSectionCommonFragmentDoc}
  ${SuitableTimeFragmentDoc}
  ${ReservationPurposeNameFragmentDoc}
  ${ReservationUnitOptionFragmentDoc}
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
export const ApplicationViewFragmentDoc = gql`
  fragment ApplicationView on ApplicationNode {
    ...ApplicationForm
    applicationRound {
      id
      sentDate
      status
      termsOfUse {
        id
        ...TermsOfUseFields
      }
    }
  }
  ${ApplicationFormFragmentDoc}
  ${TermsOfUseFieldsFragmentDoc}
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
export const ApplicationCardFragmentDoc = gql`
  fragment ApplicationCard on ApplicationNode {
    id
    pk
    ...ApplicationName
    status
    lastModifiedDate
    applicationRound {
      id
      nameFi
      nameEn
      nameSv
    }
  }
  ${ApplicationNameFragmentDoc}
`;
export const ApplicationsGroupFragmentDoc = gql`
  fragment ApplicationsGroup on ApplicationNode {
    ...ApplicationCard
    sentDate
  }
  ${ApplicationCardFragmentDoc}
`;
export const PurposeCardFragmentDoc = gql`
  fragment PurposeCard on PurposeNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    imageUrl
    smallUrl
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
export const PriceReservationUnitFragmentDoc = gql`
  fragment PriceReservationUnit on ReservationUnitNode {
    id
    pricings {
      ...PricingFields
    }
    reservationBegins
    reservationEnds
  }
  ${PricingFieldsFragmentDoc}
`;
export const ReservationPriceFragmentDoc = gql`
  fragment ReservationPrice on ReservationNode {
    id
    reservationUnits {
      ...PriceReservationUnit
    }
    price
    begin
    state
    end
    applyingForFreeOfCharge
  }
  ${PriceReservationUnitFragmentDoc}
`;
export const ReservationInfoCardFragmentDoc = gql`
  fragment ReservationInfoCard on ReservationNode {
    id
    pk
    ...ReservationPrice
    taxPercentageValue
    state
    accessType
    pindoraInfo {
      accessCode
    }
    reservationUnits {
      id
      pk
      nameFi
      nameEn
      nameSv
      images {
        ...Image
      }
      unit {
        id
        nameFi
        nameEn
        nameSv
      }
    }
  }
  ${ReservationPriceFragmentDoc}
  ${ImageFragmentDoc}
`;
export const CancelReasonFieldsFragmentDoc = gql`
  fragment CancelReasonFields on ReservationCancelReasonNode {
    id
    pk
    reasonFi
    reasonEn
    reasonSv
  }
`;
export const ReservationOrderStatusFragmentDoc = gql`
  fragment ReservationOrderStatus on ReservationNode {
    id
    state
    paymentOrder {
      id
      status
    }
  }
`;
export const OrderFieldsFragmentDoc = gql`
  fragment OrderFields on PaymentOrderNode {
    id
    reservationPk
    status
    paymentType
    receiptUrl
    checkoutUrl
  }
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
export const UnitNameFieldsI18NFragmentDoc = gql`
  fragment UnitNameFieldsI18N on UnitNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    location {
      ...LocationFieldsI18n
    }
  }
  ${LocationFieldsI18nFragmentDoc}
`;
export const AddressFieldsFragmentDoc = gql`
  fragment AddressFields on UnitNode {
    ...UnitNameFieldsI18N
    id
    tprekId
  }
  ${UnitNameFieldsI18NFragmentDoc}
`;
export const TermsOfUseFragmentDoc = gql`
  fragment TermsOfUse on ReservationUnitNode {
    id
    termsOfUseFi
    termsOfUseEn
    termsOfUseSv
    serviceSpecificTerms {
      ...TermsOfUseTextFields
    }
    cancellationTerms {
      ...TermsOfUseTextFields
    }
    paymentTerms {
      ...TermsOfUseTextFields
    }
    pricingTerms {
      ...TermsOfUseNameFields
      ...TermsOfUseTextFields
    }
  }
  ${TermsOfUseTextFieldsFragmentDoc}
  ${TermsOfUseNameFieldsFragmentDoc}
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
export const ReservationUnitTypeFieldsFragmentDoc = gql`
  fragment ReservationUnitTypeFields on ReservationUnitTypeNode {
    id
    pk
    nameFi
    nameEn
    nameSv
  }
`;
export const ReservationInfoContainerFragmentDoc = gql`
  fragment ReservationInfoContainer on ReservationUnitNode {
    id
    reservationBegins
    reservationEnds
    reservationsMaxDaysBefore
    reservationsMinDaysBefore
    minReservationDuration
    maxReservationDuration
    maxReservationsPerUser
  }
`;
export const EquipmentFieldsFragmentDoc = gql`
  fragment EquipmentFields on EquipmentNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    category {
      id
      nameFi
      nameEn
      nameSv
    }
  }
`;
export const ReservationUnitPageFieldsFragmentDoc = gql`
  fragment ReservationUnitPageFields on ReservationUnitNode {
    unit {
      ...AddressFields
    }
    id
    pk
    uuid
    nameFi
    nameEn
    nameSv
    ...TermsOfUse
    pricings {
      ...PricingFields
    }
    images {
      ...Image
    }
    ...MetadataSets
    isDraft
    applicationRoundTimeSlots {
      id
      closed
      weekday
      reservableTimes {
        begin
        end
      }
    }
    applicationRounds(ongoing: true) {
      id
      reservationPeriodBegin
      reservationPeriodEnd
    }
    descriptionFi
    descriptionEn
    descriptionSv
    reservationKind
    bufferTimeBefore
    bufferTimeAfter
    reservationStartInterval
    canApplyFreeOfCharge
    publishingState
    reservationState
    reservationUnitType {
      ...ReservationUnitTypeFields
    }
    ...ReservationInfoContainer
    numActiveUserReservations
    requireReservationHandling
    equipments {
      id
      ...EquipmentFields
    }
    currentAccessType
    accessTypes(isActiveOrFuture: true, orderBy: [beginDateAsc]) {
      id
      pk
      accessType
      beginDate
    }
  }
  ${AddressFieldsFragmentDoc}
  ${TermsOfUseFragmentDoc}
  ${PricingFieldsFragmentDoc}
  ${ImageFragmentDoc}
  ${MetadataSetsFragmentDoc}
  ${ReservationUnitTypeFieldsFragmentDoc}
  ${ReservationInfoContainerFragmentDoc}
  ${EquipmentFieldsFragmentDoc}
`;
export const BlockingReservationFieldsFragmentDoc = gql`
  fragment BlockingReservationFields on ReservationNode {
    pk
    id
    state
    isBlocked
    begin
    end
    numPersons
    calendarUrl
    bufferTimeBefore
    bufferTimeAfter
    affectedReservationUnits
  }
`;
export const IsReservableFieldsFragmentDoc = gql`
  fragment IsReservableFields on ReservationUnitNode {
    id
    bufferTimeBefore
    bufferTimeAfter
    reservableTimeSpans(startDate: $beginDate, endDate: $endDate) {
      startDatetime
      endDatetime
    }
    maxReservationDuration
    minReservationDuration
    reservationStartInterval
    reservationsMaxDaysBefore
    reservationsMinDaysBefore
    reservationBegins
    reservationEnds
  }
`;
export const ReservationUnitNameFieldsFragmentDoc = gql`
  fragment ReservationUnitNameFields on ReservationUnitNode {
    id
    pk
    nameFi
    nameEn
    nameSv
  }
`;
export const ReservationUnitCardFieldsFragmentDoc = gql`
  fragment ReservationUnitCardFields on ReservationUnitNode {
    ...ReservationUnitNameFields
    unit {
      ...UnitNameFieldsI18N
    }
    reservationUnitType {
      ...ReservationUnitTypeFields
    }
    images {
      ...Image
    }
    maxPersons
    currentAccessType
    effectiveAccessType
    accessTypes(isActiveOrFuture: true, orderBy: [beginDateAsc]) {
      id
      accessType
    }
  }
  ${ReservationUnitNameFieldsFragmentDoc}
  ${UnitNameFieldsI18NFragmentDoc}
  ${ReservationUnitTypeFieldsFragmentDoc}
  ${ImageFragmentDoc}
`;
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
export const BannerNotificationCommonFragmentDoc = gql`
  fragment BannerNotificationCommon on BannerNotificationNode {
    id
    level
    activeFrom
    message
    messageEn
    messageFi
    messageSv
  }
`;
export const ApplicationRoundCardFragmentDoc = gql`
  fragment ApplicationRoundCard on ApplicationRoundNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    reservationPeriodBegin
    reservationPeriodEnd
    applicationPeriodBegin
    applicationPeriodEnd
    status
  }
`;
export const ApplicationRoundFieldsFragmentDoc = gql`
  fragment ApplicationRoundFields on ApplicationRoundNode {
    ...ApplicationRoundCard
    publicDisplayBegin
    publicDisplayEnd
    criteriaFi
    criteriaEn
    criteriaSv
    notesWhenApplyingFi
    notesWhenApplyingEn
    notesWhenApplyingSv
    reservationUnits {
      id
      pk
      unit {
        id
        pk
      }
    }
  }
  ${ApplicationRoundCardFragmentDoc}
`;
export const ReservationInfoFragmentDoc = gql`
  fragment ReservationInfo on ReservationNode {
    id
    description
    purpose {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    ageGroup {
      id
      pk
      minimum
      maximum
    }
    numPersons
  }
`;
export const ApplicationReservationsDocument = gql`
  query ApplicationReservations($id: ID!, $beginDate: Date!) {
    application(id: $id) {
      id
      pk
      applicationSections {
        ...ApplicationSectionReservation
      }
    }
  }
  ${ApplicationSectionReservationFragmentDoc}
`;

/**
 * __useApplicationReservationsQuery__
 *
 * To run a query within a React component, call `useApplicationReservationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationReservationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationReservationsQuery({
 *   variables: {
 *      id: // value for 'id'
 *      beginDate: // value for 'beginDate'
 *   },
 * });
 */
export function useApplicationReservationsQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationReservationsQuery,
    ApplicationReservationsQueryVariables
  > &
    (
      | { variables: ApplicationReservationsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationReservationsQuery,
    ApplicationReservationsQueryVariables
  >(ApplicationReservationsDocument, options);
}
export function useApplicationReservationsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationReservationsQuery,
    ApplicationReservationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationReservationsQuery,
    ApplicationReservationsQueryVariables
  >(ApplicationReservationsDocument, options);
}
export function useApplicationReservationsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationReservationsQuery,
        ApplicationReservationsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationReservationsQuery,
    ApplicationReservationsQueryVariables
  >(ApplicationReservationsDocument, options);
}
export type ApplicationReservationsQueryHookResult = ReturnType<
  typeof useApplicationReservationsQuery
>;
export type ApplicationReservationsLazyQueryHookResult = ReturnType<
  typeof useApplicationReservationsLazyQuery
>;
export type ApplicationReservationsSuspenseQueryHookResult = ReturnType<
  typeof useApplicationReservationsSuspenseQuery
>;
export type ApplicationReservationsQueryResult = Apollo.QueryResult<
  ApplicationReservationsQuery,
  ApplicationReservationsQueryVariables
>;
export const CancelApplicationDocument = gql`
  mutation CancelApplication($input: ApplicationCancelMutationInput!) {
    cancelApplication(input: $input) {
      pk
    }
  }
`;
export type CancelApplicationMutationFn = Apollo.MutationFunction<
  CancelApplicationMutation,
  CancelApplicationMutationVariables
>;

/**
 * __useCancelApplicationMutation__
 *
 * To run a mutation, you first call `useCancelApplicationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelApplicationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelApplicationMutation, { data, loading, error }] = useCancelApplicationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCancelApplicationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CancelApplicationMutation,
    CancelApplicationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CancelApplicationMutation,
    CancelApplicationMutationVariables
  >(CancelApplicationDocument, options);
}
export type CancelApplicationMutationHookResult = ReturnType<
  typeof useCancelApplicationMutation
>;
export type CancelApplicationMutationResult =
  Apollo.MutationResult<CancelApplicationMutation>;
export type CancelApplicationMutationOptions = Apollo.BaseMutationOptions<
  CancelApplicationMutation,
  CancelApplicationMutationVariables
>;
export const OptionsDocument = gql`
  query Options(
    $reservationUnitTypesOrderBy: [ReservationUnitTypeOrderingChoices]
    $purposesOrderBy: [PurposeOrderingChoices]
    $unitsOrderBy: [UnitOrderingChoices]
    $equipmentsOrderBy: [EquipmentOrderingChoices]
    $reservationPurposesOrderBy: [ReservationPurposeOrderingChoices]
  ) {
    reservationUnitTypes(orderBy: $reservationUnitTypesOrderBy) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
        }
      }
    }
    purposes(orderBy: $purposesOrderBy) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
        }
      }
    }
    reservationPurposes(orderBy: $reservationPurposesOrderBy) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
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
          pk
          nameFi
          nameEn
          nameSv
        }
      }
    }
    equipmentsAll(orderBy: $equipmentsOrderBy) {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    unitsAll(orderBy: $unitsOrderBy) {
      id
      pk
      nameFi
      nameSv
      nameEn
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
 *      reservationUnitTypesOrderBy: // value for 'reservationUnitTypesOrderBy'
 *      purposesOrderBy: // value for 'purposesOrderBy'
 *      unitsOrderBy: // value for 'unitsOrderBy'
 *      equipmentsOrderBy: // value for 'equipmentsOrderBy'
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
export const UpdateApplicationDocument = gql`
  mutation UpdateApplication($input: ApplicationUpdateMutationInput!) {
    updateApplication(input: $input) {
      pk
    }
  }
`;
export type UpdateApplicationMutationFn = Apollo.MutationFunction<
  UpdateApplicationMutation,
  UpdateApplicationMutationVariables
>;

/**
 * __useUpdateApplicationMutation__
 *
 * To run a mutation, you first call `useUpdateApplicationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateApplicationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateApplicationMutation, { data, loading, error }] = useUpdateApplicationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateApplicationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateApplicationMutation,
    UpdateApplicationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateApplicationMutation,
    UpdateApplicationMutationVariables
  >(UpdateApplicationDocument, options);
}
export type UpdateApplicationMutationHookResult = ReturnType<
  typeof useUpdateApplicationMutation
>;
export type UpdateApplicationMutationResult =
  Apollo.MutationResult<UpdateApplicationMutation>;
export type UpdateApplicationMutationOptions = Apollo.BaseMutationOptions<
  UpdateApplicationMutation,
  UpdateApplicationMutationVariables
>;
export const ApplicationRoundPeriodsDocument = gql`
  query ApplicationRoundPeriods {
    applicationRounds {
      edges {
        node {
          id
          pk
          reservationPeriodBegin
          reservationPeriodEnd
          applicationPeriodBegin
          status
          reservationUnits {
            id
            pk
          }
        }
      }
    }
  }
`;

/**
 * __useApplicationRoundPeriodsQuery__
 *
 * To run a query within a React component, call `useApplicationRoundPeriodsQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationRoundPeriodsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationRoundPeriodsQuery({
 *   variables: {
 *   },
 * });
 */
export function useApplicationRoundPeriodsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ApplicationRoundPeriodsQuery,
    ApplicationRoundPeriodsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationRoundPeriodsQuery,
    ApplicationRoundPeriodsQueryVariables
  >(ApplicationRoundPeriodsDocument, options);
}
export function useApplicationRoundPeriodsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationRoundPeriodsQuery,
    ApplicationRoundPeriodsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationRoundPeriodsQuery,
    ApplicationRoundPeriodsQueryVariables
  >(ApplicationRoundPeriodsDocument, options);
}
export function useApplicationRoundPeriodsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationRoundPeriodsQuery,
        ApplicationRoundPeriodsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationRoundPeriodsQuery,
    ApplicationRoundPeriodsQueryVariables
  >(ApplicationRoundPeriodsDocument, options);
}
export type ApplicationRoundPeriodsQueryHookResult = ReturnType<
  typeof useApplicationRoundPeriodsQuery
>;
export type ApplicationRoundPeriodsLazyQueryHookResult = ReturnType<
  typeof useApplicationRoundPeriodsLazyQuery
>;
export type ApplicationRoundPeriodsSuspenseQueryHookResult = ReturnType<
  typeof useApplicationRoundPeriodsSuspenseQuery
>;
export type ApplicationRoundPeriodsQueryResult = Apollo.QueryResult<
  ApplicationRoundPeriodsQuery,
  ApplicationRoundPeriodsQueryVariables
>;
export const SearchFormParamsUnitDocument = gql`
  query SearchFormParamsUnit(
    $publishedReservationUnits: Boolean
    $ownReservations: Boolean
    $onlyDirectBookable: Boolean
    $onlySeasonalBookable: Boolean
    $orderBy: [UnitOrderingChoices]
  ) {
    unitsAll(
      publishedReservationUnits: $publishedReservationUnits
      ownReservations: $ownReservations
      onlyDirectBookable: $onlyDirectBookable
      onlySeasonalBookable: $onlySeasonalBookable
      orderBy: $orderBy
    ) {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
  }
`;

/**
 * __useSearchFormParamsUnitQuery__
 *
 * To run a query within a React component, call `useSearchFormParamsUnitQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchFormParamsUnitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchFormParamsUnitQuery({
 *   variables: {
 *      publishedReservationUnits: // value for 'publishedReservationUnits'
 *      ownReservations: // value for 'ownReservations'
 *      onlyDirectBookable: // value for 'onlyDirectBookable'
 *      onlySeasonalBookable: // value for 'onlySeasonalBookable'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useSearchFormParamsUnitQuery(
  baseOptions?: Apollo.QueryHookOptions<
    SearchFormParamsUnitQuery,
    SearchFormParamsUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    SearchFormParamsUnitQuery,
    SearchFormParamsUnitQueryVariables
  >(SearchFormParamsUnitDocument, options);
}
export function useSearchFormParamsUnitLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SearchFormParamsUnitQuery,
    SearchFormParamsUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    SearchFormParamsUnitQuery,
    SearchFormParamsUnitQueryVariables
  >(SearchFormParamsUnitDocument, options);
}
export function useSearchFormParamsUnitSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        SearchFormParamsUnitQuery,
        SearchFormParamsUnitQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    SearchFormParamsUnitQuery,
    SearchFormParamsUnitQueryVariables
  >(SearchFormParamsUnitDocument, options);
}
export type SearchFormParamsUnitQueryHookResult = ReturnType<
  typeof useSearchFormParamsUnitQuery
>;
export type SearchFormParamsUnitLazyQueryHookResult = ReturnType<
  typeof useSearchFormParamsUnitLazyQuery
>;
export type SearchFormParamsUnitSuspenseQueryHookResult = ReturnType<
  typeof useSearchFormParamsUnitSuspenseQuery
>;
export type SearchFormParamsUnitQueryResult = Apollo.QueryResult<
  SearchFormParamsUnitQuery,
  SearchFormParamsUnitQueryVariables
>;
export const CreateReservationDocument = gql`
  mutation CreateReservation($input: ReservationCreateMutationInput!) {
    createReservation(input: $input) {
      pk
    }
  }
`;
export type CreateReservationMutationFn = Apollo.MutationFunction<
  CreateReservationMutation,
  CreateReservationMutationVariables
>;

/**
 * __useCreateReservationMutation__
 *
 * To run a mutation, you first call `useCreateReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createReservationMutation, { data, loading, error }] = useCreateReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateReservationMutation,
    CreateReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateReservationMutation,
    CreateReservationMutationVariables
  >(CreateReservationDocument, options);
}
export type CreateReservationMutationHookResult = ReturnType<
  typeof useCreateReservationMutation
>;
export type CreateReservationMutationResult =
  Apollo.MutationResult<CreateReservationMutation>;
export type CreateReservationMutationOptions = Apollo.BaseMutationOptions<
  CreateReservationMutation,
  CreateReservationMutationVariables
>;
export const UpdateReservationDocument = gql`
  mutation UpdateReservation($input: ReservationUpdateMutationInput!) {
    updateReservation(input: $input) {
      pk
      state
    }
  }
`;
export type UpdateReservationMutationFn = Apollo.MutationFunction<
  UpdateReservationMutation,
  UpdateReservationMutationVariables
>;

/**
 * __useUpdateReservationMutation__
 *
 * To run a mutation, you first call `useUpdateReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateReservationMutation, { data, loading, error }] = useUpdateReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateReservationMutation,
    UpdateReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    UpdateReservationMutation,
    UpdateReservationMutationVariables
  >(UpdateReservationDocument, options);
}
export type UpdateReservationMutationHookResult = ReturnType<
  typeof useUpdateReservationMutation
>;
export type UpdateReservationMutationResult =
  Apollo.MutationResult<UpdateReservationMutation>;
export type UpdateReservationMutationOptions = Apollo.BaseMutationOptions<
  UpdateReservationMutation,
  UpdateReservationMutationVariables
>;
export const DeleteReservationDocument = gql`
  mutation DeleteReservation($input: ReservationDeleteTentativeMutationInput!) {
    deleteTentativeReservation(input: $input) {
      deleted
    }
  }
`;
export type DeleteReservationMutationFn = Apollo.MutationFunction<
  DeleteReservationMutation,
  DeleteReservationMutationVariables
>;

/**
 * __useDeleteReservationMutation__
 *
 * To run a mutation, you first call `useDeleteReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteReservationMutation, { data, loading, error }] = useDeleteReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteReservationMutation,
    DeleteReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeleteReservationMutation,
    DeleteReservationMutationVariables
  >(DeleteReservationDocument, options);
}
export type DeleteReservationMutationHookResult = ReturnType<
  typeof useDeleteReservationMutation
>;
export type DeleteReservationMutationResult =
  Apollo.MutationResult<DeleteReservationMutation>;
export type DeleteReservationMutationOptions = Apollo.BaseMutationOptions<
  DeleteReservationMutation,
  DeleteReservationMutationVariables
>;
export const CancelReservationDocument = gql`
  mutation CancelReservation($input: ReservationCancellationMutationInput!) {
    cancelReservation(input: $input) {
      pk
    }
  }
`;
export type CancelReservationMutationFn = Apollo.MutationFunction<
  CancelReservationMutation,
  CancelReservationMutationVariables
>;

/**
 * __useCancelReservationMutation__
 *
 * To run a mutation, you first call `useCancelReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelReservationMutation, { data, loading, error }] = useCancelReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCancelReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CancelReservationMutation,
    CancelReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CancelReservationMutation,
    CancelReservationMutationVariables
  >(CancelReservationDocument, options);
}
export type CancelReservationMutationHookResult = ReturnType<
  typeof useCancelReservationMutation
>;
export type CancelReservationMutationResult =
  Apollo.MutationResult<CancelReservationMutation>;
export type CancelReservationMutationOptions = Apollo.BaseMutationOptions<
  CancelReservationMutation,
  CancelReservationMutationVariables
>;
export const ConfirmReservationDocument = gql`
  mutation ConfirmReservation($input: ReservationConfirmMutationInput!) {
    confirmReservation(input: $input) {
      pk
      state
      order {
        id
        checkoutUrl
      }
    }
  }
`;
export type ConfirmReservationMutationFn = Apollo.MutationFunction<
  ConfirmReservationMutation,
  ConfirmReservationMutationVariables
>;

/**
 * __useConfirmReservationMutation__
 *
 * To run a mutation, you first call `useConfirmReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConfirmReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [confirmReservationMutation, { data, loading, error }] = useConfirmReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useConfirmReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ConfirmReservationMutation,
    ConfirmReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ConfirmReservationMutation,
    ConfirmReservationMutationVariables
  >(ConfirmReservationDocument, options);
}
export type ConfirmReservationMutationHookResult = ReturnType<
  typeof useConfirmReservationMutation
>;
export type ConfirmReservationMutationResult =
  Apollo.MutationResult<ConfirmReservationMutation>;
export type ConfirmReservationMutationOptions = Apollo.BaseMutationOptions<
  ConfirmReservationMutation,
  ConfirmReservationMutationVariables
>;
export const ListReservationsDocument = gql`
  query ListReservations(
    $beginDate: Date
    $endDate: Date
    $state: [ReservationStateChoice]
    $user: [Int]
    $reservationUnits: [Int]
    $orderBy: [ReservationOrderingChoices]
    $reservationType: [ReservationTypeChoice]!
  ) {
    reservations(
      beginDate: $beginDate
      endDate: $endDate
      state: $state
      user: $user
      reservationUnits: $reservationUnits
      orderBy: $orderBy
      reservationType: $reservationType
    ) {
      edges {
        node {
          id
          ...ReservationInfoCard
          name
          bufferTimeBefore
          bufferTimeAfter
          ...ReservationOrderStatus
          paymentOrder {
            id
            checkoutUrl
            expiresInMinutes
          }
          isBlocked
          reservationUnits {
            ...CancellationRuleFields
          }
        }
      }
    }
  }
  ${ReservationInfoCardFragmentDoc}
  ${ReservationOrderStatusFragmentDoc}
  ${CancellationRuleFieldsFragmentDoc}
`;

/**
 * __useListReservationsQuery__
 *
 * To run a query within a React component, call `useListReservationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListReservationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListReservationsQuery({
 *   variables: {
 *      beginDate: // value for 'beginDate'
 *      endDate: // value for 'endDate'
 *      state: // value for 'state'
 *      user: // value for 'user'
 *      reservationUnits: // value for 'reservationUnits'
 *      orderBy: // value for 'orderBy'
 *      reservationType: // value for 'reservationType'
 *   },
 * });
 */
export function useListReservationsQuery(
  baseOptions: Apollo.QueryHookOptions<
    ListReservationsQuery,
    ListReservationsQueryVariables
  > &
    (
      | { variables: ListReservationsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ListReservationsQuery, ListReservationsQueryVariables>(
    ListReservationsDocument,
    options
  );
}
export function useListReservationsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ListReservationsQuery,
    ListReservationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ListReservationsQuery,
    ListReservationsQueryVariables
  >(ListReservationsDocument, options);
}
export function useListReservationsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ListReservationsQuery,
        ListReservationsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ListReservationsQuery,
    ListReservationsQueryVariables
  >(ListReservationsDocument, options);
}
export type ListReservationsQueryHookResult = ReturnType<
  typeof useListReservationsQuery
>;
export type ListReservationsLazyQueryHookResult = ReturnType<
  typeof useListReservationsLazyQuery
>;
export type ListReservationsSuspenseQueryHookResult = ReturnType<
  typeof useListReservationsSuspenseQuery
>;
export type ListReservationsQueryResult = Apollo.QueryResult<
  ListReservationsQuery,
  ListReservationsQueryVariables
>;
export const ReservationStateDocument = gql`
  query ReservationState($id: ID!) {
    reservation(id: $id) {
      id
      pk
      state
    }
  }
`;

/**
 * __useReservationStateQuery__
 *
 * To run a query within a React component, call `useReservationStateQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationStateQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationStateQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationStateQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationStateQuery,
    ReservationStateQueryVariables
  > &
    (
      | { variables: ReservationStateQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ReservationStateQuery, ReservationStateQueryVariables>(
    ReservationStateDocument,
    options
  );
}
export function useReservationStateLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationStateQuery,
    ReservationStateQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationStateQuery,
    ReservationStateQueryVariables
  >(ReservationStateDocument, options);
}
export function useReservationStateSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationStateQuery,
        ReservationStateQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationStateQuery,
    ReservationStateQueryVariables
  >(ReservationStateDocument, options);
}
export type ReservationStateQueryHookResult = ReturnType<
  typeof useReservationStateQuery
>;
export type ReservationStateLazyQueryHookResult = ReturnType<
  typeof useReservationStateLazyQuery
>;
export type ReservationStateSuspenseQueryHookResult = ReturnType<
  typeof useReservationStateSuspenseQuery
>;
export type ReservationStateQueryResult = Apollo.QueryResult<
  ReservationStateQuery,
  ReservationStateQueryVariables
>;
export const AdjustReservationTimeDocument = gql`
  mutation AdjustReservationTime($input: ReservationAdjustTimeMutationInput!) {
    adjustReservationTime(input: $input) {
      pk
      state
      begin
      end
    }
  }
`;
export type AdjustReservationTimeMutationFn = Apollo.MutationFunction<
  AdjustReservationTimeMutation,
  AdjustReservationTimeMutationVariables
>;

/**
 * __useAdjustReservationTimeMutation__
 *
 * To run a mutation, you first call `useAdjustReservationTimeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAdjustReservationTimeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [adjustReservationTimeMutation, { data, loading, error }] = useAdjustReservationTimeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAdjustReservationTimeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    AdjustReservationTimeMutation,
    AdjustReservationTimeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    AdjustReservationTimeMutation,
    AdjustReservationTimeMutationVariables
  >(AdjustReservationTimeDocument, options);
}
export type AdjustReservationTimeMutationHookResult = ReturnType<
  typeof useAdjustReservationTimeMutation
>;
export type AdjustReservationTimeMutationResult =
  Apollo.MutationResult<AdjustReservationTimeMutation>;
export type AdjustReservationTimeMutationOptions = Apollo.BaseMutationOptions<
  AdjustReservationTimeMutation,
  AdjustReservationTimeMutationVariables
>;
export const OrderDocument = gql`
  query Order($orderUuid: String!) {
    order(orderUuid: $orderUuid) {
      ...OrderFields
    }
  }
  ${OrderFieldsFragmentDoc}
`;

/**
 * __useOrderQuery__
 *
 * To run a query within a React component, call `useOrderQuery` and pass it any options that fit your needs.
 * When your component renders, `useOrderQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOrderQuery({
 *   variables: {
 *      orderUuid: // value for 'orderUuid'
 *   },
 * });
 */
export function useOrderQuery(
  baseOptions: Apollo.QueryHookOptions<OrderQuery, OrderQueryVariables> &
    ({ variables: OrderQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<OrderQuery, OrderQueryVariables>(
    OrderDocument,
    options
  );
}
export function useOrderLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<OrderQuery, OrderQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<OrderQuery, OrderQueryVariables>(
    OrderDocument,
    options
  );
}
export function useOrderSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<OrderQuery, OrderQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<OrderQuery, OrderQueryVariables>(
    OrderDocument,
    options
  );
}
export type OrderQueryHookResult = ReturnType<typeof useOrderQuery>;
export type OrderLazyQueryHookResult = ReturnType<typeof useOrderLazyQuery>;
export type OrderSuspenseQueryHookResult = ReturnType<
  typeof useOrderSuspenseQuery
>;
export type OrderQueryResult = Apollo.QueryResult<
  OrderQuery,
  OrderQueryVariables
>;
export const RefreshOrderDocument = gql`
  mutation RefreshOrder($input: RefreshOrderMutationInput!) {
    refreshOrder(input: $input) {
      orderUuid
      status
    }
  }
`;
export type RefreshOrderMutationFn = Apollo.MutationFunction<
  RefreshOrderMutation,
  RefreshOrderMutationVariables
>;

/**
 * __useRefreshOrderMutation__
 *
 * To run a mutation, you first call `useRefreshOrderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefreshOrderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refreshOrderMutation, { data, loading, error }] = useRefreshOrderMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRefreshOrderMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RefreshOrderMutation,
    RefreshOrderMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RefreshOrderMutation,
    RefreshOrderMutationVariables
  >(RefreshOrderDocument, options);
}
export type RefreshOrderMutationHookResult = ReturnType<
  typeof useRefreshOrderMutation
>;
export type RefreshOrderMutationResult =
  Apollo.MutationResult<RefreshOrderMutation>;
export type RefreshOrderMutationOptions = Apollo.BaseMutationOptions<
  RefreshOrderMutation,
  RefreshOrderMutationVariables
>;
export const AccessCodeDocument = gql`
  query AccessCode($id: ID!) {
    reservation(id: $id) {
      id
      pindoraInfo {
        accessCode
        accessCodeBeginsAt
        accessCodeEndsAt
        accessCodeIsActive
      }
    }
  }
`;

/**
 * __useAccessCodeQuery__
 *
 * To run a query within a React component, call `useAccessCodeQuery` and pass it any options that fit your needs.
 * When your component renders, `useAccessCodeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAccessCodeQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useAccessCodeQuery(
  baseOptions: Apollo.QueryHookOptions<
    AccessCodeQuery,
    AccessCodeQueryVariables
  > &
    (
      | { variables: AccessCodeQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<AccessCodeQuery, AccessCodeQueryVariables>(
    AccessCodeDocument,
    options
  );
}
export function useAccessCodeLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AccessCodeQuery,
    AccessCodeQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<AccessCodeQuery, AccessCodeQueryVariables>(
    AccessCodeDocument,
    options
  );
}
export function useAccessCodeSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<AccessCodeQuery, AccessCodeQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<AccessCodeQuery, AccessCodeQueryVariables>(
    AccessCodeDocument,
    options
  );
}
export type AccessCodeQueryHookResult = ReturnType<typeof useAccessCodeQuery>;
export type AccessCodeLazyQueryHookResult = ReturnType<
  typeof useAccessCodeLazyQuery
>;
export type AccessCodeSuspenseQueryHookResult = ReturnType<
  typeof useAccessCodeSuspenseQuery
>;
export type AccessCodeQueryResult = Apollo.QueryResult<
  AccessCodeQuery,
  AccessCodeQueryVariables
>;
export const ReservationUnitPageDocument = gql`
  query ReservationUnitPage(
    $id: ID!
    $pk: Int!
    $beginDate: Date!
    $endDate: Date!
    $state: [ReservationStateChoice]
  ) {
    reservationUnit(id: $id) {
      ...ReservationUnitPageFields
      ...IsReservableFields
    }
    affectingReservations(
      forReservationUnits: [$pk]
      beginDate: $beginDate
      endDate: $endDate
      state: $state
    ) {
      ...BlockingReservationFields
    }
  }
  ${ReservationUnitPageFieldsFragmentDoc}
  ${IsReservableFieldsFragmentDoc}
  ${BlockingReservationFieldsFragmentDoc}
`;

/**
 * __useReservationUnitPageQuery__
 *
 * To run a query within a React component, call `useReservationUnitPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationUnitPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationUnitPageQuery({
 *   variables: {
 *      id: // value for 'id'
 *      pk: // value for 'pk'
 *      beginDate: // value for 'beginDate'
 *      endDate: // value for 'endDate'
 *      state: // value for 'state'
 *   },
 * });
 */
export function useReservationUnitPageQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationUnitPageQuery,
    ReservationUnitPageQueryVariables
  > &
    (
      | { variables: ReservationUnitPageQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationUnitPageQuery,
    ReservationUnitPageQueryVariables
  >(ReservationUnitPageDocument, options);
}
export function useReservationUnitPageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationUnitPageQuery,
    ReservationUnitPageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationUnitPageQuery,
    ReservationUnitPageQueryVariables
  >(ReservationUnitPageDocument, options);
}
export function useReservationUnitPageSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationUnitPageQuery,
        ReservationUnitPageQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationUnitPageQuery,
    ReservationUnitPageQueryVariables
  >(ReservationUnitPageDocument, options);
}
export type ReservationUnitPageQueryHookResult = ReturnType<
  typeof useReservationUnitPageQuery
>;
export type ReservationUnitPageLazyQueryHookResult = ReturnType<
  typeof useReservationUnitPageLazyQuery
>;
export type ReservationUnitPageSuspenseQueryHookResult = ReturnType<
  typeof useReservationUnitPageSuspenseQuery
>;
export type ReservationUnitPageQueryResult = Apollo.QueryResult<
  ReservationUnitPageQuery,
  ReservationUnitPageQueryVariables
>;
export const SearchReservationUnitsDocument = gql`
  query SearchReservationUnits(
    $textSearch: String
    $pk: [Int]
    $applicationRound: [Int]
    $personsAllowed: Decimal
    $unit: [Int]
    $reservationUnitType: [Int]
    $purposes: [Int]
    $equipments: [Int]
    $accessType: [AccessType]
    $accessTypeBeginDate: Date
    $accessTypeEndDate: Date
    $reservableDateStart: Date
    $reservableDateEnd: Date
    $reservableTimeStart: Time
    $reservableTimeEnd: Time
    $reservableMinimumDurationMinutes: Decimal
    $showOnlyReservable: Boolean
    $first: Int
    $before: String
    $after: String
    $orderBy: [ReservationUnitOrderingChoices]
    $isDraft: Boolean
    $isVisible: Boolean
    $reservationKind: String
  ) {
    reservationUnits(
      textSearch: $textSearch
      pk: $pk
      applicationRound: $applicationRound
      personsAllowed: $personsAllowed
      unit: $unit
      reservationUnitType: $reservationUnitType
      purposes: $purposes
      equipments: $equipments
      accessType: $accessType
      accessTypeBeginDate: $accessTypeBeginDate
      accessTypeEndDate: $accessTypeEndDate
      reservableDateStart: $reservableDateStart
      reservableDateEnd: $reservableDateEnd
      reservableTimeStart: $reservableTimeStart
      reservableTimeEnd: $reservableTimeEnd
      reservableMinimumDurationMinutes: $reservableMinimumDurationMinutes
      showOnlyReservable: $showOnlyReservable
      first: $first
      after: $after
      before: $before
      orderBy: $orderBy
      isDraft: $isDraft
      isVisible: $isVisible
      reservationKind: $reservationKind
      calculateFirstReservableTime: true
    ) {
      edges {
        node {
          ...ReservationUnitCardFields
          reservationBegins
          reservationEnds
          isClosed
          firstReservableDatetime
          currentAccessType
          pricings {
            ...PricingFields
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${ReservationUnitCardFieldsFragmentDoc}
  ${PricingFieldsFragmentDoc}
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
 *      textSearch: // value for 'textSearch'
 *      pk: // value for 'pk'
 *      applicationRound: // value for 'applicationRound'
 *      personsAllowed: // value for 'personsAllowed'
 *      unit: // value for 'unit'
 *      reservationUnitType: // value for 'reservationUnitType'
 *      purposes: // value for 'purposes'
 *      equipments: // value for 'equipments'
 *      accessType: // value for 'accessType'
 *      accessTypeBeginDate: // value for 'accessTypeBeginDate'
 *      accessTypeEndDate: // value for 'accessTypeEndDate'
 *      reservableDateStart: // value for 'reservableDateStart'
 *      reservableDateEnd: // value for 'reservableDateEnd'
 *      reservableTimeStart: // value for 'reservableTimeStart'
 *      reservableTimeEnd: // value for 'reservableTimeEnd'
 *      reservableMinimumDurationMinutes: // value for 'reservableMinimumDurationMinutes'
 *      showOnlyReservable: // value for 'showOnlyReservable'
 *      first: // value for 'first'
 *      before: // value for 'before'
 *      after: // value for 'after'
 *      orderBy: // value for 'orderBy'
 *      isDraft: // value for 'isDraft'
 *      isVisible: // value for 'isVisible'
 *      reservationKind: // value for 'reservationKind'
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
export const RelatedReservationUnitsDocument = gql`
  query RelatedReservationUnits(
    $unit: [Int]!
    $isDraft: Boolean
    $isVisible: Boolean
  ) {
    reservationUnits(unit: $unit, isDraft: $isDraft, isVisible: $isVisible) {
      edges {
        node {
          ...ReservationUnitNameFields
          images {
            ...Image
          }
          unit {
            ...UnitNameFieldsI18N
          }
          reservationUnitType {
            ...ReservationUnitTypeFields
          }
          maxPersons
          isDraft
          pricings {
            ...PricingFields
          }
        }
      }
    }
  }
  ${ReservationUnitNameFieldsFragmentDoc}
  ${ImageFragmentDoc}
  ${UnitNameFieldsI18NFragmentDoc}
  ${ReservationUnitTypeFieldsFragmentDoc}
  ${PricingFieldsFragmentDoc}
`;

/**
 * __useRelatedReservationUnitsQuery__
 *
 * To run a query within a React component, call `useRelatedReservationUnitsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRelatedReservationUnitsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRelatedReservationUnitsQuery({
 *   variables: {
 *      unit: // value for 'unit'
 *      isDraft: // value for 'isDraft'
 *      isVisible: // value for 'isVisible'
 *   },
 * });
 */
export function useRelatedReservationUnitsQuery(
  baseOptions: Apollo.QueryHookOptions<
    RelatedReservationUnitsQuery,
    RelatedReservationUnitsQueryVariables
  > &
    (
      | { variables: RelatedReservationUnitsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    RelatedReservationUnitsQuery,
    RelatedReservationUnitsQueryVariables
  >(RelatedReservationUnitsDocument, options);
}
export function useRelatedReservationUnitsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    RelatedReservationUnitsQuery,
    RelatedReservationUnitsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    RelatedReservationUnitsQuery,
    RelatedReservationUnitsQueryVariables
  >(RelatedReservationUnitsDocument, options);
}
export function useRelatedReservationUnitsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        RelatedReservationUnitsQuery,
        RelatedReservationUnitsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    RelatedReservationUnitsQuery,
    RelatedReservationUnitsQueryVariables
  >(RelatedReservationUnitsDocument, options);
}
export type RelatedReservationUnitsQueryHookResult = ReturnType<
  typeof useRelatedReservationUnitsQuery
>;
export type RelatedReservationUnitsLazyQueryHookResult = ReturnType<
  typeof useRelatedReservationUnitsLazyQuery
>;
export type RelatedReservationUnitsSuspenseQueryHookResult = ReturnType<
  typeof useRelatedReservationUnitsSuspenseQuery
>;
export type RelatedReservationUnitsQueryResult = Apollo.QueryResult<
  RelatedReservationUnitsQuery,
  RelatedReservationUnitsQueryVariables
>;
export const CurrentUserDocument = gql`
  query CurrentUser {
    currentUser {
      id
      pk
      firstName
      lastName
      email
      isAdAuthenticated
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
export const ApplicationPage1Document = gql`
  query ApplicationPage1($id: ID!) {
    application(id: $id) {
      ...ApplicationForm
    }
  }
  ${ApplicationFormFragmentDoc}
`;

/**
 * __useApplicationPage1Query__
 *
 * To run a query within a React component, call `useApplicationPage1Query` and pass it any options that fit your needs.
 * When your component renders, `useApplicationPage1Query` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationPage1Query({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationPage1Query(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationPage1Query,
    ApplicationPage1QueryVariables
  > &
    (
      | { variables: ApplicationPage1QueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ApplicationPage1Query, ApplicationPage1QueryVariables>(
    ApplicationPage1Document,
    options
  );
}
export function useApplicationPage1LazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationPage1Query,
    ApplicationPage1QueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationPage1Query,
    ApplicationPage1QueryVariables
  >(ApplicationPage1Document, options);
}
export function useApplicationPage1SuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationPage1Query,
        ApplicationPage1QueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationPage1Query,
    ApplicationPage1QueryVariables
  >(ApplicationPage1Document, options);
}
export type ApplicationPage1QueryHookResult = ReturnType<
  typeof useApplicationPage1Query
>;
export type ApplicationPage1LazyQueryHookResult = ReturnType<
  typeof useApplicationPage1LazyQuery
>;
export type ApplicationPage1SuspenseQueryHookResult = ReturnType<
  typeof useApplicationPage1SuspenseQuery
>;
export type ApplicationPage1QueryResult = Apollo.QueryResult<
  ApplicationPage1Query,
  ApplicationPage1QueryVariables
>;
export const ApplicationPage2Document = gql`
  query ApplicationPage2($id: ID!) {
    application(id: $id) {
      ...ApplicationForm
    }
  }
  ${ApplicationFormFragmentDoc}
`;

/**
 * __useApplicationPage2Query__
 *
 * To run a query within a React component, call `useApplicationPage2Query` and pass it any options that fit your needs.
 * When your component renders, `useApplicationPage2Query` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationPage2Query({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationPage2Query(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationPage2Query,
    ApplicationPage2QueryVariables
  > &
    (
      | { variables: ApplicationPage2QueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ApplicationPage2Query, ApplicationPage2QueryVariables>(
    ApplicationPage2Document,
    options
  );
}
export function useApplicationPage2LazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationPage2Query,
    ApplicationPage2QueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationPage2Query,
    ApplicationPage2QueryVariables
  >(ApplicationPage2Document, options);
}
export function useApplicationPage2SuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationPage2Query,
        ApplicationPage2QueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationPage2Query,
    ApplicationPage2QueryVariables
  >(ApplicationPage2Document, options);
}
export type ApplicationPage2QueryHookResult = ReturnType<
  typeof useApplicationPage2Query
>;
export type ApplicationPage2LazyQueryHookResult = ReturnType<
  typeof useApplicationPage2LazyQuery
>;
export type ApplicationPage2SuspenseQueryHookResult = ReturnType<
  typeof useApplicationPage2SuspenseQuery
>;
export type ApplicationPage2QueryResult = Apollo.QueryResult<
  ApplicationPage2Query,
  ApplicationPage2QueryVariables
>;
export const ApplicationPage3Document = gql`
  query ApplicationPage3($id: ID!) {
    application(id: $id) {
      ...ApplicationForm
    }
  }
  ${ApplicationFormFragmentDoc}
`;

/**
 * __useApplicationPage3Query__
 *
 * To run a query within a React component, call `useApplicationPage3Query` and pass it any options that fit your needs.
 * When your component renders, `useApplicationPage3Query` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationPage3Query({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationPage3Query(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationPage3Query,
    ApplicationPage3QueryVariables
  > &
    (
      | { variables: ApplicationPage3QueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ApplicationPage3Query, ApplicationPage3QueryVariables>(
    ApplicationPage3Document,
    options
  );
}
export function useApplicationPage3LazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationPage3Query,
    ApplicationPage3QueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationPage3Query,
    ApplicationPage3QueryVariables
  >(ApplicationPage3Document, options);
}
export function useApplicationPage3SuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationPage3Query,
        ApplicationPage3QueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationPage3Query,
    ApplicationPage3QueryVariables
  >(ApplicationPage3Document, options);
}
export type ApplicationPage3QueryHookResult = ReturnType<
  typeof useApplicationPage3Query
>;
export type ApplicationPage3LazyQueryHookResult = ReturnType<
  typeof useApplicationPage3LazyQuery
>;
export type ApplicationPage3SuspenseQueryHookResult = ReturnType<
  typeof useApplicationPage3SuspenseQuery
>;
export type ApplicationPage3QueryResult = Apollo.QueryResult<
  ApplicationPage3Query,
  ApplicationPage3QueryVariables
>;
export const ApplicationPagePreviewDocument = gql`
  query ApplicationPagePreview($id: ID!) {
    application(id: $id) {
      ...ApplicationView
    }
  }
  ${ApplicationViewFragmentDoc}
`;

/**
 * __useApplicationPagePreviewQuery__
 *
 * To run a query within a React component, call `useApplicationPagePreviewQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationPagePreviewQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationPagePreviewQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationPagePreviewQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationPagePreviewQuery,
    ApplicationPagePreviewQueryVariables
  > &
    (
      | { variables: ApplicationPagePreviewQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationPagePreviewQuery,
    ApplicationPagePreviewQueryVariables
  >(ApplicationPagePreviewDocument, options);
}
export function useApplicationPagePreviewLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationPagePreviewQuery,
    ApplicationPagePreviewQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationPagePreviewQuery,
    ApplicationPagePreviewQueryVariables
  >(ApplicationPagePreviewDocument, options);
}
export function useApplicationPagePreviewSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationPagePreviewQuery,
        ApplicationPagePreviewQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationPagePreviewQuery,
    ApplicationPagePreviewQueryVariables
  >(ApplicationPagePreviewDocument, options);
}
export type ApplicationPagePreviewQueryHookResult = ReturnType<
  typeof useApplicationPagePreviewQuery
>;
export type ApplicationPagePreviewLazyQueryHookResult = ReturnType<
  typeof useApplicationPagePreviewLazyQuery
>;
export type ApplicationPagePreviewSuspenseQueryHookResult = ReturnType<
  typeof useApplicationPagePreviewSuspenseQuery
>;
export type ApplicationPagePreviewQueryResult = Apollo.QueryResult<
  ApplicationPagePreviewQuery,
  ApplicationPagePreviewQueryVariables
>;
export const SendApplicationDocument = gql`
  mutation SendApplication($input: ApplicationSendMutationInput!) {
    sendApplication(input: $input) {
      pk
    }
  }
`;
export type SendApplicationMutationFn = Apollo.MutationFunction<
  SendApplicationMutation,
  SendApplicationMutationVariables
>;

/**
 * __useSendApplicationMutation__
 *
 * To run a mutation, you first call `useSendApplicationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendApplicationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendApplicationMutation, { data, loading, error }] = useSendApplicationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSendApplicationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SendApplicationMutation,
    SendApplicationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    SendApplicationMutation,
    SendApplicationMutationVariables
  >(SendApplicationDocument, options);
}
export type SendApplicationMutationHookResult = ReturnType<
  typeof useSendApplicationMutation
>;
export type SendApplicationMutationResult =
  Apollo.MutationResult<SendApplicationMutation>;
export type SendApplicationMutationOptions = Apollo.BaseMutationOptions<
  SendApplicationMutation,
  SendApplicationMutationVariables
>;
export const ApplicationSectionCancelDocument = gql`
  query ApplicationSectionCancel($id: ID!) {
    applicationSection(id: $id) {
      pk
      id
      name
      reservationsBeginDate
      reservationsEndDate
      reservationUnitOptions {
        id
        reservationUnit {
          id
          pk
          nameEn
          nameFi
          nameSv
        }
        allocatedTimeSlots {
          id
          dayOfTheWeek
          beginTime
          endTime
          recurringReservation {
            id
            reservations {
              id
              state
              ...CanUserCancelReservation
            }
          }
        }
      }
      application {
        id
        pk
        applicationRound {
          id
          termsOfUse {
            ...TermsOfUseTextFields
          }
        }
      }
    }
    reservationCancelReasons {
      edges {
        node {
          ...CancelReasonFields
        }
      }
    }
  }
  ${CanUserCancelReservationFragmentDoc}
  ${TermsOfUseTextFieldsFragmentDoc}
  ${CancelReasonFieldsFragmentDoc}
`;

/**
 * __useApplicationSectionCancelQuery__
 *
 * To run a query within a React component, call `useApplicationSectionCancelQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationSectionCancelQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationSectionCancelQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationSectionCancelQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationSectionCancelQuery,
    ApplicationSectionCancelQueryVariables
  > &
    (
      | { variables: ApplicationSectionCancelQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationSectionCancelQuery,
    ApplicationSectionCancelQueryVariables
  >(ApplicationSectionCancelDocument, options);
}
export function useApplicationSectionCancelLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationSectionCancelQuery,
    ApplicationSectionCancelQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationSectionCancelQuery,
    ApplicationSectionCancelQueryVariables
  >(ApplicationSectionCancelDocument, options);
}
export function useApplicationSectionCancelSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationSectionCancelQuery,
        ApplicationSectionCancelQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationSectionCancelQuery,
    ApplicationSectionCancelQueryVariables
  >(ApplicationSectionCancelDocument, options);
}
export type ApplicationSectionCancelQueryHookResult = ReturnType<
  typeof useApplicationSectionCancelQuery
>;
export type ApplicationSectionCancelLazyQueryHookResult = ReturnType<
  typeof useApplicationSectionCancelLazyQuery
>;
export type ApplicationSectionCancelSuspenseQueryHookResult = ReturnType<
  typeof useApplicationSectionCancelSuspenseQuery
>;
export type ApplicationSectionCancelQueryResult = Apollo.QueryResult<
  ApplicationSectionCancelQuery,
  ApplicationSectionCancelQueryVariables
>;
export const CancelApplicationSectionDocument = gql`
  mutation CancelApplicationSection(
    $input: ApplicationSectionReservationCancellationMutationInput!
  ) {
    cancelAllApplicationSectionReservations(input: $input) {
      future
      cancelled
    }
  }
`;
export type CancelApplicationSectionMutationFn = Apollo.MutationFunction<
  CancelApplicationSectionMutation,
  CancelApplicationSectionMutationVariables
>;

/**
 * __useCancelApplicationSectionMutation__
 *
 * To run a mutation, you first call `useCancelApplicationSectionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelApplicationSectionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelApplicationSectionMutation, { data, loading, error }] = useCancelApplicationSectionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCancelApplicationSectionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CancelApplicationSectionMutation,
    CancelApplicationSectionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CancelApplicationSectionMutation,
    CancelApplicationSectionMutationVariables
  >(CancelApplicationSectionDocument, options);
}
export type CancelApplicationSectionMutationHookResult = ReturnType<
  typeof useCancelApplicationSectionMutation
>;
export type CancelApplicationSectionMutationResult =
  Apollo.MutationResult<CancelApplicationSectionMutation>;
export type CancelApplicationSectionMutationOptions =
  Apollo.BaseMutationOptions<
    CancelApplicationSectionMutation,
    CancelApplicationSectionMutationVariables
  >;
export const ApplicationSectionViewDocument = gql`
  query ApplicationSectionView($pk: Int!, $beginDate: Date = null) {
    applicationSections(pk: [$pk]) {
      edges {
        node {
          ...ApplicationSectionReservation
          application {
            id
            pk
            status
            applicationRound {
              id
              nameEn
              nameFi
              nameSv
            }
          }
        }
      }
    }
  }
  ${ApplicationSectionReservationFragmentDoc}
`;

/**
 * __useApplicationSectionViewQuery__
 *
 * To run a query within a React component, call `useApplicationSectionViewQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationSectionViewQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationSectionViewQuery({
 *   variables: {
 *      pk: // value for 'pk'
 *      beginDate: // value for 'beginDate'
 *   },
 * });
 */
export function useApplicationSectionViewQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationSectionViewQuery,
    ApplicationSectionViewQueryVariables
  > &
    (
      | { variables: ApplicationSectionViewQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationSectionViewQuery,
    ApplicationSectionViewQueryVariables
  >(ApplicationSectionViewDocument, options);
}
export function useApplicationSectionViewLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationSectionViewQuery,
    ApplicationSectionViewQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationSectionViewQuery,
    ApplicationSectionViewQueryVariables
  >(ApplicationSectionViewDocument, options);
}
export function useApplicationSectionViewSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationSectionViewQuery,
        ApplicationSectionViewQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationSectionViewQuery,
    ApplicationSectionViewQueryVariables
  >(ApplicationSectionViewDocument, options);
}
export type ApplicationSectionViewQueryHookResult = ReturnType<
  typeof useApplicationSectionViewQuery
>;
export type ApplicationSectionViewLazyQueryHookResult = ReturnType<
  typeof useApplicationSectionViewLazyQuery
>;
export type ApplicationSectionViewSuspenseQueryHookResult = ReturnType<
  typeof useApplicationSectionViewSuspenseQuery
>;
export type ApplicationSectionViewQueryResult = Apollo.QueryResult<
  ApplicationSectionViewQuery,
  ApplicationSectionViewQueryVariables
>;
export const ApplicationSentPageDocument = gql`
  query ApplicationSentPage($id: ID!) {
    application(id: $id) {
      id
      pk
      status
    }
  }
`;

/**
 * __useApplicationSentPageQuery__
 *
 * To run a query within a React component, call `useApplicationSentPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationSentPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationSentPageQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationSentPageQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationSentPageQuery,
    ApplicationSentPageQueryVariables
  > &
    (
      | { variables: ApplicationSentPageQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationSentPageQuery,
    ApplicationSentPageQueryVariables
  >(ApplicationSentPageDocument, options);
}
export function useApplicationSentPageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationSentPageQuery,
    ApplicationSentPageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationSentPageQuery,
    ApplicationSentPageQueryVariables
  >(ApplicationSentPageDocument, options);
}
export function useApplicationSentPageSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationSentPageQuery,
        ApplicationSentPageQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationSentPageQuery,
    ApplicationSentPageQueryVariables
  >(ApplicationSentPageDocument, options);
}
export type ApplicationSentPageQueryHookResult = ReturnType<
  typeof useApplicationSentPageQuery
>;
export type ApplicationSentPageLazyQueryHookResult = ReturnType<
  typeof useApplicationSentPageLazyQuery
>;
export type ApplicationSentPageSuspenseQueryHookResult = ReturnType<
  typeof useApplicationSentPageSuspenseQuery
>;
export type ApplicationSentPageQueryResult = Apollo.QueryResult<
  ApplicationSentPageQuery,
  ApplicationSentPageQueryVariables
>;
export const ApplicationViewDocument = gql`
  query ApplicationView($id: ID!) {
    application(id: $id) {
      ...ApplicationView
      applicationSections {
        id
        hasReservations
      }
    }
  }
  ${ApplicationViewFragmentDoc}
`;

/**
 * __useApplicationViewQuery__
 *
 * To run a query within a React component, call `useApplicationViewQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationViewQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationViewQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationViewQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationViewQuery,
    ApplicationViewQueryVariables
  > &
    (
      | { variables: ApplicationViewQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ApplicationViewQuery, ApplicationViewQueryVariables>(
    ApplicationViewDocument,
    options
  );
}
export function useApplicationViewLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationViewQuery,
    ApplicationViewQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationViewQuery,
    ApplicationViewQueryVariables
  >(ApplicationViewDocument, options);
}
export function useApplicationViewSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationViewQuery,
        ApplicationViewQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationViewQuery,
    ApplicationViewQueryVariables
  >(ApplicationViewDocument, options);
}
export type ApplicationViewQueryHookResult = ReturnType<
  typeof useApplicationViewQuery
>;
export type ApplicationViewLazyQueryHookResult = ReturnType<
  typeof useApplicationViewLazyQuery
>;
export type ApplicationViewSuspenseQueryHookResult = ReturnType<
  typeof useApplicationViewSuspenseQuery
>;
export type ApplicationViewQueryResult = Apollo.QueryResult<
  ApplicationViewQuery,
  ApplicationViewQueryVariables
>;
export const ApplicationsDocument = gql`
  query Applications(
    $user: Int!
    $status: [ApplicationStatusChoice]!
    $orderBy: [ApplicationOrderingChoices]!
  ) {
    applications(user: $user, status: $status, orderBy: $orderBy) {
      edges {
        node {
          ...ApplicationsGroup
        }
      }
    }
  }
  ${ApplicationsGroupFragmentDoc}
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
 *      user: // value for 'user'
 *      status: // value for 'status'
 *      orderBy: // value for 'orderBy'
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
export const ReservationUnitPurposesDocument = gql`
  query ReservationUnitPurposes($orderBy: [PurposeOrderingChoices]) {
    purposes(orderBy: $orderBy) {
      edges {
        node {
          ...PurposeCard
        }
      }
    }
  }
  ${PurposeCardFragmentDoc}
`;

/**
 * __useReservationUnitPurposesQuery__
 *
 * To run a query within a React component, call `useReservationUnitPurposesQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationUnitPurposesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationUnitPurposesQuery({
 *   variables: {
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useReservationUnitPurposesQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ReservationUnitPurposesQuery,
    ReservationUnitPurposesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationUnitPurposesQuery,
    ReservationUnitPurposesQueryVariables
  >(ReservationUnitPurposesDocument, options);
}
export function useReservationUnitPurposesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationUnitPurposesQuery,
    ReservationUnitPurposesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationUnitPurposesQuery,
    ReservationUnitPurposesQueryVariables
  >(ReservationUnitPurposesDocument, options);
}
export function useReservationUnitPurposesSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationUnitPurposesQuery,
        ReservationUnitPurposesQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationUnitPurposesQuery,
    ReservationUnitPurposesQueryVariables
  >(ReservationUnitPurposesDocument, options);
}
export type ReservationUnitPurposesQueryHookResult = ReturnType<
  typeof useReservationUnitPurposesQuery
>;
export type ReservationUnitPurposesLazyQueryHookResult = ReturnType<
  typeof useReservationUnitPurposesLazyQuery
>;
export type ReservationUnitPurposesSuspenseQueryHookResult = ReturnType<
  typeof useReservationUnitPurposesSuspenseQuery
>;
export type ReservationUnitPurposesQueryResult = Apollo.QueryResult<
  ReservationUnitPurposesQuery,
  ReservationUnitPurposesQueryVariables
>;
export const ApplicationRoundCriteriaDocument = gql`
  query ApplicationRoundCriteria($id: ID!) {
    applicationRound(id: $id) {
      pk
      id
      nameFi
      nameEn
      nameSv
      criteriaFi
      criteriaEn
      criteriaSv
      notesWhenApplyingFi
      notesWhenApplyingEn
      notesWhenApplyingSv
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
      id
      pk
      nameFi
      nameEn
      nameSv
      reservationPeriodBegin
      reservationPeriodEnd
      reservationUnits {
        id
        pk
      }
    }
  }
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
export const CreateApplicationDocument = gql`
  mutation CreateApplication($input: ApplicationCreateMutationInput!) {
    createApplication(input: $input) {
      pk
    }
  }
`;
export type CreateApplicationMutationFn = Apollo.MutationFunction<
  CreateApplicationMutation,
  CreateApplicationMutationVariables
>;

/**
 * __useCreateApplicationMutation__
 *
 * To run a mutation, you first call `useCreateApplicationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateApplicationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createApplicationMutation, { data, loading, error }] = useCreateApplicationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateApplicationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateApplicationMutation,
    CreateApplicationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateApplicationMutation,
    CreateApplicationMutationVariables
  >(CreateApplicationDocument, options);
}
export type CreateApplicationMutationHookResult = ReturnType<
  typeof useCreateApplicationMutation
>;
export type CreateApplicationMutationResult =
  Apollo.MutationResult<CreateApplicationMutation>;
export type CreateApplicationMutationOptions = Apollo.BaseMutationOptions<
  CreateApplicationMutation,
  CreateApplicationMutationVariables
>;
export const ApplicationRoundsUiDocument = gql`
  query ApplicationRoundsUi($orderBy: [ApplicationRoundOrderingChoices]) {
    applicationRounds(orderBy: $orderBy) {
      edges {
        node {
          ...ApplicationRoundFields
        }
      }
    }
  }
  ${ApplicationRoundFieldsFragmentDoc}
`;

/**
 * __useApplicationRoundsUiQuery__
 *
 * To run a query within a React component, call `useApplicationRoundsUiQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationRoundsUiQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationRoundsUiQuery({
 *   variables: {
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useApplicationRoundsUiQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ApplicationRoundsUiQuery,
    ApplicationRoundsUiQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationRoundsUiQuery,
    ApplicationRoundsUiQueryVariables
  >(ApplicationRoundsUiDocument, options);
}
export function useApplicationRoundsUiLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationRoundsUiQuery,
    ApplicationRoundsUiQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationRoundsUiQuery,
    ApplicationRoundsUiQueryVariables
  >(ApplicationRoundsUiDocument, options);
}
export function useApplicationRoundsUiSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationRoundsUiQuery,
        ApplicationRoundsUiQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationRoundsUiQuery,
    ApplicationRoundsUiQueryVariables
  >(ApplicationRoundsUiDocument, options);
}
export type ApplicationRoundsUiQueryHookResult = ReturnType<
  typeof useApplicationRoundsUiQuery
>;
export type ApplicationRoundsUiLazyQueryHookResult = ReturnType<
  typeof useApplicationRoundsUiLazyQuery
>;
export type ApplicationRoundsUiSuspenseQueryHookResult = ReturnType<
  typeof useApplicationRoundsUiSuspenseQuery
>;
export type ApplicationRoundsUiQueryResult = Apollo.QueryResult<
  ApplicationRoundsUiQuery,
  ApplicationRoundsUiQueryVariables
>;
export const ReservationDocument = gql`
  query Reservation($id: ID!) {
    reservation(id: $id) {
      id
      pk
      name
      ...MetaFields
      ...ReservationInfoCard
      bufferTimeBefore
      bufferTimeAfter
      calendarUrl
      paymentOrder {
        ...OrderFields
      }
      reservationUnits {
        id
        canApplyFreeOfCharge
        ...CancellationRuleFields
        ...MetadataSets
        ...TermsOfUse
        requireReservationHandling
      }
    }
  }
  ${MetaFieldsFragmentDoc}
  ${ReservationInfoCardFragmentDoc}
  ${OrderFieldsFragmentDoc}
  ${CancellationRuleFieldsFragmentDoc}
  ${MetadataSetsFragmentDoc}
  ${TermsOfUseFragmentDoc}
`;

/**
 * __useReservationQuery__
 *
 * To run a query within a React component, call `useReservationQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationQuery,
    ReservationQueryVariables
  > &
    (
      | { variables: ReservationQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ReservationQuery, ReservationQueryVariables>(
    ReservationDocument,
    options
  );
}
export function useReservationLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationQuery,
    ReservationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ReservationQuery, ReservationQueryVariables>(
    ReservationDocument,
    options
  );
}
export function useReservationSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationQuery,
        ReservationQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<ReservationQuery, ReservationQueryVariables>(
    ReservationDocument,
    options
  );
}
export type ReservationQueryHookResult = ReturnType<typeof useReservationQuery>;
export type ReservationLazyQueryHookResult = ReturnType<
  typeof useReservationLazyQuery
>;
export type ReservationSuspenseQueryHookResult = ReturnType<
  typeof useReservationSuspenseQuery
>;
export type ReservationQueryResult = Apollo.QueryResult<
  ReservationQuery,
  ReservationQueryVariables
>;
export const ReservationCancelPageDocument = gql`
  query ReservationCancelPage($id: ID!) {
    reservation(id: $id) {
      id
      ...ReservationInfoCard
      name
      reservationUnits {
        id
        ...CancellationRuleFields
        cancellationTerms {
          ...TermsOfUseTextFields
        }
      }
      recurringReservation {
        id
        name
        allocatedTimeSlot {
          id
          pk
          reservationUnitOption {
            id
            applicationSection {
              id
              application {
                id
                pk
                applicationRound {
                  id
                  termsOfUse {
                    ...TermsOfUseTextFields
                  }
                }
              }
            }
          }
        }
      }
    }
    reservationCancelReasons {
      edges {
        node {
          ...CancelReasonFields
        }
      }
    }
  }
  ${ReservationInfoCardFragmentDoc}
  ${CancellationRuleFieldsFragmentDoc}
  ${TermsOfUseTextFieldsFragmentDoc}
  ${CancelReasonFieldsFragmentDoc}
`;

/**
 * __useReservationCancelPageQuery__
 *
 * To run a query within a React component, call `useReservationCancelPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationCancelPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationCancelPageQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationCancelPageQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationCancelPageQuery,
    ReservationCancelPageQueryVariables
  > &
    (
      | { variables: ReservationCancelPageQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationCancelPageQuery,
    ReservationCancelPageQueryVariables
  >(ReservationCancelPageDocument, options);
}
export function useReservationCancelPageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationCancelPageQuery,
    ReservationCancelPageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationCancelPageQuery,
    ReservationCancelPageQueryVariables
  >(ReservationCancelPageDocument, options);
}
export function useReservationCancelPageSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationCancelPageQuery,
        ReservationCancelPageQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationCancelPageQuery,
    ReservationCancelPageQueryVariables
  >(ReservationCancelPageDocument, options);
}
export type ReservationCancelPageQueryHookResult = ReturnType<
  typeof useReservationCancelPageQuery
>;
export type ReservationCancelPageLazyQueryHookResult = ReturnType<
  typeof useReservationCancelPageLazyQuery
>;
export type ReservationCancelPageSuspenseQueryHookResult = ReturnType<
  typeof useReservationCancelPageSuspenseQuery
>;
export type ReservationCancelPageQueryResult = Apollo.QueryResult<
  ReservationCancelPageQuery,
  ReservationCancelPageQueryVariables
>;
export const ReservationConfirmationPageDocument = gql`
  query ReservationConfirmationPage($id: ID!) {
    reservation(id: $id) {
      id
      pk
      name
      ...ReserveeNameFields
      ...ReserveeBillingFields
      ...ReservationInfo
      ...ReservationInfoCard
      ...Instructions
      calendarUrl
      paymentOrder {
        ...OrderFields
      }
      reservationUnits {
        id
        canApplyFreeOfCharge
        ...CancellationRuleFields
      }
    }
  }
  ${ReserveeNameFieldsFragmentDoc}
  ${ReserveeBillingFieldsFragmentDoc}
  ${ReservationInfoFragmentDoc}
  ${ReservationInfoCardFragmentDoc}
  ${InstructionsFragmentDoc}
  ${OrderFieldsFragmentDoc}
  ${CancellationRuleFieldsFragmentDoc}
`;

/**
 * __useReservationConfirmationPageQuery__
 *
 * To run a query within a React component, call `useReservationConfirmationPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationConfirmationPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationConfirmationPageQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReservationConfirmationPageQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationConfirmationPageQuery,
    ReservationConfirmationPageQueryVariables
  > &
    (
      | { variables: ReservationConfirmationPageQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationConfirmationPageQuery,
    ReservationConfirmationPageQueryVariables
  >(ReservationConfirmationPageDocument, options);
}
export function useReservationConfirmationPageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationConfirmationPageQuery,
    ReservationConfirmationPageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationConfirmationPageQuery,
    ReservationConfirmationPageQueryVariables
  >(ReservationConfirmationPageDocument, options);
}
export function useReservationConfirmationPageSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationConfirmationPageQuery,
        ReservationConfirmationPageQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationConfirmationPageQuery,
    ReservationConfirmationPageQueryVariables
  >(ReservationConfirmationPageDocument, options);
}
export type ReservationConfirmationPageQueryHookResult = ReturnType<
  typeof useReservationConfirmationPageQuery
>;
export type ReservationConfirmationPageLazyQueryHookResult = ReturnType<
  typeof useReservationConfirmationPageLazyQuery
>;
export type ReservationConfirmationPageSuspenseQueryHookResult = ReturnType<
  typeof useReservationConfirmationPageSuspenseQuery
>;
export type ReservationConfirmationPageQueryResult = Apollo.QueryResult<
  ReservationConfirmationPageQuery,
  ReservationConfirmationPageQueryVariables
>;
export const ReservationEditPageDocument = gql`
  query ReservationEditPage($id: ID!) {
    reservation(id: $id) {
      id
      pk
      name
      isHandled
      ...MetaFields
      ...ReservationInfoCard
      reservationUnits {
        id
        ...CancellationRuleFields
        ...MetadataSets
      }
    }
  }
  ${MetaFieldsFragmentDoc}
  ${ReservationInfoCardFragmentDoc}
  ${CancellationRuleFieldsFragmentDoc}
  ${MetadataSetsFragmentDoc}
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
export const ApplicationRecurringReservationDocument = gql`
  query ApplicationRecurringReservation($id: ID!) {
    recurringReservation(id: $id) {
      id
      allocatedTimeSlot {
        id
        reservationUnitOption {
          id
          applicationSection {
            id
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
 * __useApplicationRecurringReservationQuery__
 *
 * To run a query within a React component, call `useApplicationRecurringReservationQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationRecurringReservationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationRecurringReservationQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationRecurringReservationQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationRecurringReservationQuery,
    ApplicationRecurringReservationQueryVariables
  > &
    (
      | {
          variables: ApplicationRecurringReservationQueryVariables;
          skip?: boolean;
        }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationRecurringReservationQuery,
    ApplicationRecurringReservationQueryVariables
  >(ApplicationRecurringReservationDocument, options);
}
export function useApplicationRecurringReservationLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationRecurringReservationQuery,
    ApplicationRecurringReservationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationRecurringReservationQuery,
    ApplicationRecurringReservationQueryVariables
  >(ApplicationRecurringReservationDocument, options);
}
export function useApplicationRecurringReservationSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationRecurringReservationQuery,
        ApplicationRecurringReservationQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationRecurringReservationQuery,
    ApplicationRecurringReservationQueryVariables
  >(ApplicationRecurringReservationDocument, options);
}
export type ApplicationRecurringReservationQueryHookResult = ReturnType<
  typeof useApplicationRecurringReservationQuery
>;
export type ApplicationRecurringReservationLazyQueryHookResult = ReturnType<
  typeof useApplicationRecurringReservationLazyQuery
>;
export type ApplicationRecurringReservationSuspenseQueryHookResult = ReturnType<
  typeof useApplicationRecurringReservationSuspenseQuery
>;
export type ApplicationRecurringReservationQueryResult = Apollo.QueryResult<
  ApplicationRecurringReservationQuery,
  ApplicationRecurringReservationQueryVariables
>;
export const ReservationPageDocument = gql`
  query ReservationPage($id: ID!) {
    reservation(id: $id) {
      id
      pk
      ...ReserveeNameFields
      ...ReserveeBillingFields
      ...ReservationInfo
      ...ReservationInfoCard
      ...Instructions
      applyingForFreeOfCharge
      calendarUrl
      paymentOrder {
        ...OrderFields
      }
      recurringReservation {
        id
      }
      reservationUnits {
        id
        unit {
          id
          tprekId
          ...UnitNameFieldsI18N
        }
        canApplyFreeOfCharge
        ...CancellationRuleFields
        ...MetadataSets
        ...TermsOfUse
      }
    }
  }
  ${ReserveeNameFieldsFragmentDoc}
  ${ReserveeBillingFieldsFragmentDoc}
  ${ReservationInfoFragmentDoc}
  ${ReservationInfoCardFragmentDoc}
  ${InstructionsFragmentDoc}
  ${OrderFieldsFragmentDoc}
  ${UnitNameFieldsI18NFragmentDoc}
  ${CancellationRuleFieldsFragmentDoc}
  ${MetadataSetsFragmentDoc}
  ${TermsOfUseFragmentDoc}
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
