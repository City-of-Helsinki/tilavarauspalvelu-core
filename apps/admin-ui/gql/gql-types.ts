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
  cancelledDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  contactPerson?: InputMaybe<PersonSerializerInput>;
  homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  organisation?: InputMaybe<OrganisationSerializerInput>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  sentDate?: InputMaybe<Scalars["DateTime"]["input"]>;
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
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  numPersons: Scalars["Int"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  purpose?: Maybe<ReservationPurposeNode>;
  reservationMaxDuration: Scalars["Duration"]["output"];
  reservationMinDuration: Scalars["Duration"]["output"];
  reservationUnitOptions: Array<ReservationUnitOptionNode>;
  reservationsBeginDate: Scalars["Date"]["output"];
  reservationsEndDate: Scalars["Date"]["output"];
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
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  applicationSections?: InputMaybe<
    Array<InputMaybe<UpdateApplicationSectionForApplicationSerializerInput>>
  >;
  billingAddress?: InputMaybe<UpdateAddressSerializerInput>;
  cancelledDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  contactPerson?: InputMaybe<UpdatePersonSerializerInput>;
  homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  organisation?: InputMaybe<UpdateOrganisationSerializerInput>;
  pk: Scalars["Int"]["input"];
  sentDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ApplicationUpdateMutationPayload = {
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
  /** Pohjapiirros */
  GroundPlan = "GROUND_PLAN",
  /** Pääkuva */
  Main = "MAIN",
  /** Kartta */
  Map = "MAP",
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
  adjustReservationTime?: Maybe<ReservationAdjustTimeMutationPayload>;
  approveReservation?: Maybe<ReservationApproveMutationPayload>;
  cancelAllApplicationSectionReservations?: Maybe<ApplicationSectionReservationCancellationMutationPayload>;
  cancelApplication?: Maybe<ApplicationCancelMutationPayload>;
  cancelReservation?: Maybe<ReservationCancellationMutationPayload>;
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
  requireHandlingForReservation?: Maybe<ReservationRequiresHandlingMutationPayload>;
  rescheduleReservationSeries?: Maybe<ReservationSeriesRescheduleMutationPayload>;
  restoreAllApplicationOptions?: Maybe<RestoreAllApplicationOptionsMutationPayload>;
  restoreAllSectionOptions?: Maybe<RestoreAllSectionOptionsMutationPayload>;
  sendApplication?: Maybe<ApplicationSendMutationPayload>;
  setApplicationRoundHandled?: Maybe<SetApplicationRoundHandledMutationPayload>;
  setApplicationRoundResultsSent?: Maybe<SetApplicationRoundResultsSentMutationPayload>;
  staffAdjustReservationTime?: Maybe<ReservationStaffAdjustTimeMutationPayload>;
  staffReservationModify?: Maybe<ReservationStaffModifyMutationPayload>;
  updateApplication?: Maybe<ApplicationUpdateMutationPayload>;
  updateApplicationSection?: Maybe<ApplicationSectionUpdateMutationPayload>;
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

export type MutationStaffReservationModifyArgs = {
  input: ReservationStaffModifyMutationInput;
};

export type MutationUpdateApplicationArgs = {
  input: ApplicationUpdateMutationInput;
};

export type MutationUpdateApplicationSectionArgs = {
  input: ApplicationSectionUpdateMutationInput;
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
  /** Get information about the user, using Helsinki profile if necessary. */
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
  forReservationUnits?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  forUnits?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<OrderStatusWithFree>>>;
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

export type QueryApplicationSectionsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  ageGroup?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  applicantType?: InputMaybe<Array<InputMaybe<ApplicantTypeChoice>>>;
  application?: InputMaybe<Scalars["Int"]["input"]>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  applicationStatus?: InputMaybe<Array<InputMaybe<ApplicationStatusChoice>>>;
  before?: InputMaybe<Scalars["String"]["input"]>;
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
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<RecurringReservationOrderingChoices>>>;
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
  first?: InputMaybe<Scalars["Int"]["input"]>;
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<OrderStatusWithFree>>>;
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
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<UnitOrderingChoices>>>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryUserArgs = {
  id: Scalars["ID"]["input"];
};

export type RecurringReservationNode = Node & {
  abilityGroup?: Maybe<AbilityGroupNode>;
  ageGroup?: Maybe<AgeGroupNode>;
  allocatedTimeSlot?: Maybe<AllocatedTimeSlotNode>;
  beginDate?: Maybe<Scalars["Date"]["output"]>;
  beginTime?: Maybe<Scalars["Time"]["output"]>;
  created: Scalars["DateTime"]["output"];
  description: Scalars["String"]["output"];
  endDate?: Maybe<Scalars["Date"]["output"]>;
  endTime?: Maybe<Scalars["Time"]["output"]>;
  extId: Scalars["UUID"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  recurrenceInDays?: Maybe<Scalars["Int"]["output"]>;
  rejectedOccurrences: Array<RejectedOccurrenceNode>;
  reservationUnit: ReservationUnitNode;
  reservations: Array<ReservationNode>;
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
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<OrderStatusWithFree>>>;
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
  begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  end?: InputMaybe<Scalars["DateTime"]["input"]>;
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
  paymentType?: InputMaybe<PaymentType>;
  pk: Scalars["Int"]["input"];
};

export type ReservationConfirmMutationPayload = {
  ageGroupPk?: Maybe<Scalars["Int"]["output"]>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  billingAddressCity?: Maybe<Scalars["String"]["output"]>;
  billingAddressStreet?: Maybe<Scalars["String"]["output"]>;
  billingAddressZip?: Maybe<Scalars["String"]["output"]>;
  billingEmail?: Maybe<Scalars["String"]["output"]>;
  billingFirstName?: Maybe<Scalars["String"]["output"]>;
  billingLastName?: Maybe<Scalars["String"]["output"]>;
  billingPhone?: Maybe<Scalars["String"]["output"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  homeCityPk?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nonSubsidisedPrice?: Maybe<Scalars["Decimal"]["output"]>;
  nonSubsidisedPriceNet?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  order?: Maybe<PaymentOrderNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["String"]["output"]>;
  purposePk?: Maybe<Scalars["Int"]["output"]>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLanguage?: Maybe<Scalars["String"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<CustomerTypeChoice>;
  state?: Maybe<ReservationStateChoice>;
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
};

export type ReservationCreateMutationInput = {
  ageGroupPk?: InputMaybe<Scalars["Int"]["input"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  begin: Scalars["DateTime"]["input"];
  billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Int"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Int"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  end: Scalars["DateTime"]["input"];
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  homeCityPk?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  purposePk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnitPks: Array<InputMaybe<Scalars["Int"]["input"]>>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLanguage?: InputMaybe<Scalars["String"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<CustomerTypeChoice>;
};

export type ReservationCreateMutationPayload = {
  ageGroupPk?: Maybe<Scalars["Int"]["output"]>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  billingAddressCity?: Maybe<Scalars["String"]["output"]>;
  billingAddressStreet?: Maybe<Scalars["String"]["output"]>;
  billingAddressZip?: Maybe<Scalars["String"]["output"]>;
  billingEmail?: Maybe<Scalars["String"]["output"]>;
  billingFirstName?: Maybe<Scalars["String"]["output"]>;
  billingLastName?: Maybe<Scalars["String"]["output"]>;
  billingPhone?: Maybe<Scalars["String"]["output"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  homeCityPk?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nonSubsidisedPrice?: Maybe<Scalars["Decimal"]["output"]>;
  nonSubsidisedPriceNet?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["String"]["output"]>;
  purposePk?: Maybe<Scalars["Int"]["output"]>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLanguage?: Maybe<Scalars["String"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<CustomerTypeChoice>;
  state?: Maybe<ReservationStateChoice>;
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
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
  extId: Scalars["UUID"]["output"];
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  handlingDetails?: Maybe<Scalars["String"]["output"]>;
  homeCity?: Maybe<CityNode>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  isBlocked?: Maybe<Scalars["Boolean"]["output"]>;
  isHandled?: Maybe<Scalars["Boolean"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  /** @deprecated Please use to 'paymentOrder' instead. */
  order?: Maybe<PaymentOrderNode>;
  paymentOrder: Array<PaymentOrderNode>;
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
  pk?: InputMaybe<Scalars["Int"]["input"]>;
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
  reserveeLanguage?: InputMaybe<ReserveeLanguage>;
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
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeAfter?: InputMaybe<Scalars["String"]["input"]>;
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeBefore?: InputMaybe<Scalars["String"]["input"]>;
  end?: InputMaybe<Scalars["DateTime"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ReservationStaffAdjustTimeMutationPayload = {
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeAfter?: Maybe<Scalars["String"]["output"]>;
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeBefore?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<ReservationStateChoice>;
};

export type ReservationStaffCreateMutationInput = {
  ageGroupPk?: InputMaybe<Scalars["Int"]["input"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  begin: Scalars["DateTime"]["input"];
  billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeAfter?: InputMaybe<Scalars["String"]["input"]>;
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeBefore?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  end: Scalars["DateTime"]["input"];
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  homeCityPk?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  purposePk?: InputMaybe<Scalars["Int"]["input"]>;
  recurringReservationPk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnitPks: Array<InputMaybe<Scalars["Int"]["input"]>>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLanguage?: InputMaybe<Scalars["String"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<CustomerTypeChoice>;
  type: ReservationTypeChoice;
  unitPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationStaffCreateMutationPayload = {
  ageGroupPk?: Maybe<Scalars["Int"]["output"]>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  billingAddressCity?: Maybe<Scalars["String"]["output"]>;
  billingAddressStreet?: Maybe<Scalars["String"]["output"]>;
  billingAddressZip?: Maybe<Scalars["String"]["output"]>;
  billingEmail?: Maybe<Scalars["String"]["output"]>;
  billingFirstName?: Maybe<Scalars["String"]["output"]>;
  billingLastName?: Maybe<Scalars["String"]["output"]>;
  billingPhone?: Maybe<Scalars["String"]["output"]>;
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeAfter?: Maybe<Scalars["String"]["output"]>;
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeBefore?: Maybe<Scalars["String"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  homeCityPk?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  purposePk?: Maybe<Scalars["Int"]["output"]>;
  recurringReservationPk?: Maybe<Scalars["Int"]["output"]>;
  reservationUnitPks?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLanguage?: Maybe<Scalars["String"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<CustomerTypeChoice>;
  state?: Maybe<ReservationStateChoice>;
  type?: Maybe<ReservationTypeChoice>;
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
  workingMemo?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationStaffModifyMutationInput = {
  ageGroupPk?: InputMaybe<Scalars["Int"]["input"]>;
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
  homeCityPk?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk: Scalars["Int"]["input"];
  purposePk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnitPks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLanguage?: InputMaybe<ReserveeLanguage>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<CustomerTypeChoice>;
  state?: InputMaybe<ReservationStateChoice>;
  type?: InputMaybe<ReservationTypeChoice>;
};

export type ReservationStaffModifyMutationPayload = {
  ageGroupPk?: Maybe<Scalars["Int"]["output"]>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  billingAddressCity?: Maybe<Scalars["String"]["output"]>;
  billingAddressStreet?: Maybe<Scalars["String"]["output"]>;
  billingAddressZip?: Maybe<Scalars["String"]["output"]>;
  billingEmail?: Maybe<Scalars["String"]["output"]>;
  billingFirstName?: Maybe<Scalars["String"]["output"]>;
  billingLastName?: Maybe<Scalars["String"]["output"]>;
  billingPhone?: Maybe<Scalars["String"]["output"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  homeCityPk?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nonSubsidisedPrice?: Maybe<Scalars["Decimal"]["output"]>;
  nonSubsidisedPriceNet?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["String"]["output"]>;
  purposePk?: Maybe<Scalars["Int"]["output"]>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLanguage?: Maybe<ReserveeLanguage>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<CustomerTypeChoice>;
  state?: Maybe<ReservationStateChoice>;
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  type?: Maybe<ReservationTypeChoice>;
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
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
  requireIntroduction?: InputMaybe<Scalars["Boolean"]["input"]>;
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
  requireIntroduction?: Maybe<Scalars["Boolean"]["output"]>;
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
  description: Scalars["String"]["output"];
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
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
  requireIntroduction: Scalars["Boolean"]["output"];
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
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<OrderStatusWithFree>>>;
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
  requireIntroduction?: InputMaybe<Scalars["Boolean"]["input"]>;
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
  requireIntroduction?: Maybe<Scalars["Boolean"]["output"]>;
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
  ageGroupPk?: InputMaybe<Scalars["Int"]["input"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  billingAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  billingAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  billingEmail?: InputMaybe<Scalars["String"]["input"]>;
  billingFirstName?: InputMaybe<Scalars["String"]["input"]>;
  billingLastName?: InputMaybe<Scalars["String"]["input"]>;
  billingPhone?: InputMaybe<Scalars["String"]["input"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Int"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Int"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  end?: InputMaybe<Scalars["DateTime"]["input"]>;
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  homeCityPk?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk: Scalars["Int"]["input"];
  purposePk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnitPks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLanguage?: InputMaybe<Scalars["String"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<CustomerTypeChoice>;
  state?: InputMaybe<ReservationStateChoice>;
};

export type ReservationUpdateMutationPayload = {
  ageGroupPk?: Maybe<Scalars["Int"]["output"]>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  billingAddressCity?: Maybe<Scalars["String"]["output"]>;
  billingAddressStreet?: Maybe<Scalars["String"]["output"]>;
  billingAddressZip?: Maybe<Scalars["String"]["output"]>;
  billingEmail?: Maybe<Scalars["String"]["output"]>;
  billingFirstName?: Maybe<Scalars["String"]["output"]>;
  billingLastName?: Maybe<Scalars["String"]["output"]>;
  billingPhone?: Maybe<Scalars["String"]["output"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  homeCityPk?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nonSubsidisedPrice?: Maybe<Scalars["Decimal"]["output"]>;
  nonSubsidisedPriceNet?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["String"]["output"]>;
  purposePk?: Maybe<Scalars["Int"]["output"]>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLanguage?: Maybe<Scalars["String"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<CustomerTypeChoice>;
  state?: Maybe<ReservationStateChoice>;
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
};

export type ReservationWorkingMemoMutationInput = {
  /** Primary key of the reservation */
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationWorkingMemoMutationPayload = {
  /** Primary key of the reservation */
  pk?: Maybe<Scalars["Int"]["output"]>;
  workingMemo?: Maybe<Scalars["String"]["output"]>;
};

/** An enumeration. */
export enum ReserveeLanguage {
  A = "A_",
  /** Englanti */
  En = "EN",
  /** Suomi */
  Fi = "FI",
  /** Ruotsi */
  Sv = "SV",
}

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
  reserveeLanguage?: InputMaybe<ReserveeLanguage>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<ReserveeType>;
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
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
  applicantType?: ApplicantTypeChoice | null;
  organisation?: {
    id: string;
    nameFi?: string | null;
    organisationType: OrganizationTypeChoice;
  } | null;
  contactPerson?: { id: string; lastName: string; firstName: string } | null;
};

export type ApplicationSectionDurationFragment = {
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

export type ApplicationSectionUiFragment = {
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
      unit?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
      applicationRoundTimeSlots: Array<{
        id: string;
        weekday: number;
        closed: boolean;
        reservableTimes?: Array<{ begin: string; end: string } | null> | null;
      }>;
    };
  }>;
  ageGroup?: {
    id: string;
    pk?: number | null;
    minimum: number;
    maximum?: number | null;
  } | null;
};

export type ApplicantFragment = {
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
  user?: {
    id: string;
    name?: string | null;
    email: string;
    pk?: number | null;
  } | null;
};

export type ApplicationRoundFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameSv?: string | null;
  nameEn?: string | null;
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
  status?: ApplicationRoundStatusChoice | null;
  applicationsCount?: number | null;
  reservationUnitCount?: number | null;
  statusTimestamp?: string | null;
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
  }>;
};

export type ApplicationCommonFragment = {
  id: string;
  pk?: number | null;
  status?: ApplicationStatusChoice | null;
  lastModifiedDate: string;
  applicantType?: ApplicantTypeChoice | null;
  additionalInformation?: string | null;
  applicationRound: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
    applicationPeriodBegin: string;
    applicationPeriodEnd: string;
    reservationPeriodBegin: string;
    reservationPeriodEnd: string;
    status?: ApplicationRoundStatusChoice | null;
    applicationsCount?: number | null;
    reservationUnitCount?: number | null;
    statusTimestamp?: string | null;
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
        unit?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
        applicationRoundTimeSlots: Array<{
          id: string;
          weekday: number;
          closed: boolean;
          reservableTimes?: Array<{ begin: string; end: string } | null> | null;
        }>;
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
  user?: {
    id: string;
    name?: string | null;
    email: string;
    pk?: number | null;
  } | null;
};

export type ReserveeNameFieldsFragment = {
  reserveeFirstName?: string | null;
  reserveeLastName?: string | null;
  reserveeEmail?: string | null;
  reserveePhone?: string | null;
  reserveeType?: CustomerTypeChoice | null;
  reserveeOrganisationName?: string | null;
  reserveeId?: string | null;
};

export type ReserveeBillingFieldsFragment = {
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

export type TermsOfUseNameFieldsFragment = {
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
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  id: string;
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

export type SpaceCommonFieldsFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  surfaceArea?: number | null;
  maxPersons?: number | null;
  parent?: { id: string; pk?: number | null; nameFi?: string | null } | null;
};

export type ResourceFieldsFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  space?: {
    id: string;
    nameFi?: string | null;
    unit?: { id: string; nameFi?: string | null; pk?: number | null } | null;
  } | null;
};

export type SpaceFieldsFragment = {
  code: string;
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  surfaceArea?: number | null;
  maxPersons?: number | null;
  resources: Array<{
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    space?: {
      id: string;
      nameFi?: string | null;
      unit?: { id: string; nameFi?: string | null; pk?: number | null } | null;
    } | null;
  }>;
  children?: Array<{ id: string; pk?: number | null }> | null;
  parent?: { id: string; pk?: number | null; nameFi?: string | null } | null;
};

export type ReservationUnitCommonFieldsFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  maxPersons?: number | null;
  surfaceArea?: number | null;
  reservationUnitType?: { id: string; nameFi?: string | null } | null;
};

export type UnitNameFieldsFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
};

export type ApplicationSectionFragment = {
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
  purpose?: { id: string; pk?: number | null; nameFi?: string | null } | null;
  application: {
    id: string;
    pk?: number | null;
    status?: ApplicationStatusChoice | null;
    applicantType?: ApplicantTypeChoice | null;
    organisation?: {
      id: string;
      nameFi?: string | null;
      organisationType: OrganizationTypeChoice;
    } | null;
    contactPerson?: { id: string; lastName: string; firstName: string } | null;
  };
  reservationUnitOptions: Array<{
    id: string;
    pk?: number | null;
    preferredOrder: number;
    reservationUnit: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      unit?: { id: string; pk?: number | null; nameFi?: string | null } | null;
    };
  }>;
  ageGroup?: {
    id: string;
    pk?: number | null;
    minimum: number;
    maximum?: number | null;
  } | null;
};

export type ApplicationAdminFragment = {
  pk?: number | null;
  id: string;
  status?: ApplicationStatusChoice | null;
  lastModifiedDate: string;
  applicantType?: ApplicantTypeChoice | null;
  additionalInformation?: string | null;
  applicationRound: { id: string; pk?: number | null; nameFi?: string | null };
  applicationSections?: Array<{
    id: string;
    allocations?: number | null;
    pk?: number | null;
    name: string;
    status?: ApplicationSectionStatusChoice | null;
    reservationMaxDuration: number;
    numPersons: number;
    reservationsEndDate: string;
    reservationsBeginDate: string;
    appliedReservationsPerWeek: number;
    reservationMinDuration: number;
    reservationUnitOptions: Array<{
      id: string;
      rejected: boolean;
      pk?: number | null;
      preferredOrder: number;
      allocatedTimeSlots: Array<{ pk?: number | null; id: string }>;
      reservationUnit: {
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
        applicationRoundTimeSlots: Array<{
          id: string;
          weekday: number;
          closed: boolean;
          reservableTimes?: Array<{ begin: string; end: string } | null> | null;
        }>;
      };
    }>;
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
  user?: {
    id: string;
    name?: string | null;
    email: string;
    pk?: number | null;
  } | null;
};

export type ReservationCommonFragment = {
  id: string;
  pk?: number | null;
  begin: string;
  end: string;
  createdAt?: string | null;
  state?: ReservationStateChoice | null;
  type?: ReservationTypeChoice | null;
  isBlocked?: boolean | null;
  workingMemo?: string | null;
  reserveeName?: string | null;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  paymentOrder: Array<{ id: string; status?: OrderStatus | null }>;
  user?: { id: string; firstName: string; lastName: string } | null;
};

export type ReservationUnitReservationsFragment = {
  name?: string | null;
  numPersons?: number | null;
  calendarUrl?: string | null;
  affectedReservationUnits?: Array<number | null> | null;
  id: string;
  pk?: number | null;
  begin: string;
  end: string;
  createdAt?: string | null;
  state?: ReservationStateChoice | null;
  type?: ReservationTypeChoice | null;
  isBlocked?: boolean | null;
  workingMemo?: string | null;
  reserveeName?: string | null;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  reservationUnits: Array<{
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    unit?: { id: string; pk?: number | null } | null;
  }>;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    pk?: number | null;
  } | null;
  paymentOrder: Array<{ id: string; status?: OrderStatus | null }>;
};

export type ReservationUnitFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  maxPersons?: number | null;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  reservationStartInterval: ReservationStartInterval;
  authentication: Authentication;
  termsOfUseFi?: string | null;
  minPersons?: number | null;
  unit?: { id: string; pk?: number | null; nameFi?: string | null } | null;
  cancellationTerms?: {
    id: string;
    textFi?: string | null;
    nameFi?: string | null;
  } | null;
  paymentTerms?: {
    id: string;
    textFi?: string | null;
    nameFi?: string | null;
  } | null;
  pricingTerms?: {
    id: string;
    textFi?: string | null;
    nameFi?: string | null;
  } | null;
  serviceSpecificTerms?: {
    id: string;
    textFi?: string | null;
    nameFi?: string | null;
  } | null;
  metadataSet?: {
    id: string;
    requiredFields: Array<{ id: string; fieldName: string }>;
    supportedFields: Array<{ id: string; fieldName: string }>;
  } | null;
};

export type UnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type UnitQuery = {
  unit?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    tprekId?: string | null;
    shortDescriptionFi?: string | null;
    reservationUnits: Array<{
      isDraft: boolean;
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      maxPersons?: number | null;
      surfaceArea?: number | null;
      resources: Array<{ id: string; pk?: number | null }>;
      purposes: Array<{
        id: string;
        pk?: number | null;
        nameFi?: string | null;
      }>;
      images: Array<{
        id: string;
        imageUrl?: string | null;
        largeUrl?: string | null;
        mediumUrl?: string | null;
        smallUrl?: string | null;
        imageType: ImageType;
      }>;
      reservationUnitType?: { id: string; nameFi?: string | null } | null;
    }>;
    spaces: Array<{
      code: string;
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      surfaceArea?: number | null;
      maxPersons?: number | null;
      resources: Array<{
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        space?: {
          id: string;
          nameFi?: string | null;
          unit?: {
            id: string;
            nameFi?: string | null;
            pk?: number | null;
          } | null;
        } | null;
      }>;
      children?: Array<{ id: string; pk?: number | null }> | null;
      parent?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
      } | null;
    }>;
    location?: {
      longitude?: string | null;
      latitude?: string | null;
      id: string;
      addressStreetFi?: string | null;
      addressZip: string;
      addressCityFi?: string | null;
    } | null;
  } | null;
};

export type UnitWithSpacesAndResourcesQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type UnitWithSpacesAndResourcesQuery = {
  unit?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    spaces: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      surfaceArea?: number | null;
      maxPersons?: number | null;
      resources: Array<{
        id: string;
        pk?: number | null;
        nameFi?: string | null;
      }>;
      parent?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
      } | null;
    }>;
    location?: {
      id: string;
      addressStreetFi?: string | null;
      addressZip: string;
      addressCityFi?: string | null;
    } | null;
  } | null;
};

export type HandlingDataQueryVariables = Exact<{
  beginDate: Scalars["Date"]["input"];
  state:
    | Array<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>;
}>;

export type HandlingDataQuery = {
  reservations?: {
    edges: Array<{ node?: { id: string; pk?: number | null } | null } | null>;
  } | null;
  units?: {
    totalCount?: number | null;
    edges: Array<{ node?: { id: string; pk?: number | null } | null } | null>;
  } | null;
};

export type BannerNotificationsAdminFragment = {
  pk?: number | null;
  name: string;
  target: BannerNotificationTarget;
  activeUntil?: string | null;
  draft: boolean;
  state?: BannerNotificationState | null;
  id: string;
  level: BannerNotificationLevel;
  activeFrom?: string | null;
  message: string;
  messageEn?: string | null;
  messageFi?: string | null;
  messageSv?: string | null;
};

export type BannerNotificationsAdminQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type BannerNotificationsAdminQuery = {
  bannerNotification?: {
    pk?: number | null;
    name: string;
    target: BannerNotificationTarget;
    activeUntil?: string | null;
    draft: boolean;
    state?: BannerNotificationState | null;
    id: string;
    level: BannerNotificationLevel;
    activeFrom?: string | null;
    message: string;
    messageEn?: string | null;
    messageFi?: string | null;
    messageSv?: string | null;
  } | null;
};

export type BannerNotificationsAdminListQueryVariables = Exact<{
  first?: InputMaybe<Scalars["Int"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    | Array<InputMaybe<BannerNotificationOrderingChoices>>
    | InputMaybe<BannerNotificationOrderingChoices>
  >;
}>;

export type BannerNotificationsAdminListQuery = {
  bannerNotifications?: {
    totalCount?: number | null;
    edges: Array<{
      node?: {
        pk?: number | null;
        name: string;
        target: BannerNotificationTarget;
        activeUntil?: string | null;
        draft: boolean;
        state?: BannerNotificationState | null;
        id: string;
        level: BannerNotificationLevel;
        activeFrom?: string | null;
        message: string;
        messageEn?: string | null;
        messageFi?: string | null;
        messageSv?: string | null;
      } | null;
    } | null>;
    pageInfo: { endCursor?: string | null; hasNextPage: boolean };
  } | null;
};

export type ReservationDateOfBirthQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationDateOfBirthQuery = {
  reservation?: {
    id: string;
    user?: {
      id: string;
      pk?: number | null;
      dateOfBirth?: string | null;
    } | null;
  } | null;
};

export type ApplicationDateOfBirthQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationDateOfBirthQuery = {
  application?: {
    id: string;
    user?: {
      id: string;
      pk?: number | null;
      dateOfBirth?: string | null;
    } | null;
  } | null;
};

export type StaffAdjustReservationTimeMutationVariables = Exact<{
  input: ReservationStaffAdjustTimeMutationInput;
}>;

export type StaffAdjustReservationTimeMutation = {
  staffAdjustReservationTime?: {
    pk?: number | null;
    begin?: string | null;
    end?: string | null;
    state?: ReservationStateChoice | null;
  } | null;
};

export type ChangeReservationTimeFragment = {
  id: string;
  pk?: number | null;
  begin: string;
  end: string;
  type?: ReservationTypeChoice | null;
  bufferTimeAfter: number;
  bufferTimeBefore: number;
  recurringReservation?: {
    pk?: number | null;
    id: string;
    weekdays?: Array<number | null> | null;
    beginDate?: string | null;
    endDate?: string | null;
  } | null;
  reservationUnits: Array<{
    id: string;
    pk?: number | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationStartInterval: ReservationStartInterval;
  }>;
};

export type UpdateReservationWorkingMemoMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
  workingMemo: Scalars["String"]["input"];
}>;

export type UpdateReservationWorkingMemoMutation = {
  updateReservationWorkingMemo?: {
    pk?: number | null;
    workingMemo?: string | null;
  } | null;
};

export type UpdateApplicationWorkingMemoMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
  workingMemo: Scalars["String"]["input"];
}>;

export type UpdateApplicationWorkingMemoMutation = {
  updateApplication?: {
    pk?: number | null;
    workingMemo?: string | null;
  } | null;
};

export type CheckPermissionsQueryVariables = Exact<{
  permission: UserPermissionChoice;
  units?: InputMaybe<Array<Scalars["Int"]["input"]> | Scalars["Int"]["input"]>;
  requireAll?: InputMaybe<Scalars["Boolean"]["input"]>;
}>;

export type CheckPermissionsQuery = {
  checkPermissions?: { hasPermission: boolean } | null;
};

export type ReservationDenyReasonsQueryVariables = Exact<{
  orderBy?: InputMaybe<
    | Array<InputMaybe<ReservationDenyReasonOrderingChoices>>
    | InputMaybe<ReservationDenyReasonOrderingChoices>
  >;
}>;

export type ReservationDenyReasonsQuery = {
  reservationDenyReasons?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        reasonFi?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type ReservationUnitsFilterParamsQueryVariables = Exact<{
  unit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ReservationUnitOrderingChoices>>
    | InputMaybe<ReservationUnitOrderingChoices>
  >;
}>;

export type ReservationUnitsFilterParamsQuery = {
  reservationUnitsAll?: Array<{
    id: string;
    nameFi?: string | null;
    pk?: number | null;
  }> | null;
};

export type ReservationUnitTypesFilterQueryVariables = Exact<{
  after?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ReservationUnitTypeOrderingChoices>>
    | InputMaybe<ReservationUnitTypeOrderingChoices>
  >;
}>;

export type ReservationUnitTypesFilterQuery = {
  reservationUnitTypes?: {
    totalCount?: number | null;
    edges: Array<{
      node?: { id: string; pk?: number | null; nameFi?: string | null } | null;
    } | null>;
  } | null;
};

export type UnitsFilterQueryVariables = Exact<{
  orderBy?: InputMaybe<
    Array<InputMaybe<UnitOrderingChoices>> | InputMaybe<UnitOrderingChoices>
  >;
}>;

export type UnitsFilterQuery = {
  unitsAll?: Array<{
    id: string;
    nameFi?: string | null;
    pk?: number | null;
  }> | null;
};

export type CurrentUserQueryVariables = Exact<{ [key: string]: never }>;

export type CurrentUserQuery = {
  currentUser?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    isSuperuser: boolean;
    pk?: number | null;
    unitRoles: Array<{
      id: string;
      permissions?: Array<UserPermissionChoice | null> | null;
      role: UserRoleChoice;
      units: Array<{ id: string; pk?: number | null; nameFi?: string | null }>;
      unitGroups: Array<{
        id: string;
        units: Array<{ id: string; pk?: number | null }>;
      }>;
    }>;
    generalRoles: Array<{
      id: string;
      permissions?: Array<UserPermissionChoice | null> | null;
      role: UserRoleChoice;
    }>;
  } | null;
};

export type ReservationUnitEditQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationUnitEditQuery = {
  reservationUnit?: {
    id: string;
    pk?: number | null;
    publishingState?: ReservationUnitPublishingState | null;
    reservationState?: ReservationUnitReservationState | null;
    haukiUrl?: string | null;
    requireReservationHandling: boolean;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
    isDraft: boolean;
    authentication: Authentication;
    uuid: string;
    requireIntroduction: boolean;
    termsOfUseFi?: string | null;
    termsOfUseSv?: string | null;
    termsOfUseEn?: string | null;
    reservationKind: ReservationKind;
    reservationPendingInstructionsFi?: string | null;
    reservationPendingInstructionsSv?: string | null;
    reservationPendingInstructionsEn?: string | null;
    reservationConfirmedInstructionsFi?: string | null;
    reservationConfirmedInstructionsSv?: string | null;
    reservationConfirmedInstructionsEn?: string | null;
    reservationCancelledInstructionsFi?: string | null;
    reservationCancelledInstructionsSv?: string | null;
    reservationCancelledInstructionsEn?: string | null;
    maxReservationDuration?: number | null;
    minReservationDuration?: number | null;
    reservationStartInterval: ReservationStartInterval;
    canApplyFreeOfCharge: boolean;
    reservationsMinDaysBefore?: number | null;
    reservationsMaxDaysBefore?: number | null;
    minPersons?: number | null;
    maxPersons?: number | null;
    surfaceArea?: number | null;
    descriptionFi?: string | null;
    descriptionSv?: string | null;
    descriptionEn?: string | null;
    reservationBlockWholeDay: boolean;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationBegins?: string | null;
    contactInformation: string;
    reservationEnds?: string | null;
    publishBegins?: string | null;
    publishEnds?: string | null;
    maxReservationsPerUser?: number | null;
    images: Array<{
      pk?: number | null;
      id: string;
      imageUrl?: string | null;
      largeUrl?: string | null;
      mediumUrl?: string | null;
      smallUrl?: string | null;
      imageType: ImageType;
    }>;
    cancellationRule?: { id: string; pk?: number | null } | null;
    spaces: Array<{ id: string; pk?: number | null; nameFi?: string | null }>;
    resources: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
    }>;
    purposes: Array<{ id: string; pk?: number | null; nameFi?: string | null }>;
    paymentTypes: Array<{ id: string; code: string }>;
    pricingTerms?: { id: string; pk?: string | null } | null;
    reservationUnitType?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
    } | null;
    equipments: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
    }>;
    qualifiers: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
    }>;
    unit?: { id: string; pk?: number | null; nameFi?: string | null } | null;
    paymentTerms?: { id: string; pk?: string | null } | null;
    cancellationTerms?: { id: string; pk?: string | null } | null;
    serviceSpecificTerms?: { id: string; pk?: string | null } | null;
    metadataSet?: { id: string; pk?: number | null } | null;
    pricings: Array<{
      pk?: number | null;
      lowestPriceNet?: string | null;
      highestPriceNet?: string | null;
      id: string;
      begins: string;
      priceUnit: PriceUnit;
      lowestPrice: string;
      highestPrice: string;
      taxPercentage: { id: string; pk?: number | null; value: string };
    }>;
    applicationRoundTimeSlots: Array<{
      id: string;
      pk?: number | null;
      closed: boolean;
      weekday: number;
      reservableTimes?: Array<{ begin: string; end: string } | null> | null;
    }>;
  } | null;
};

export type UpdateReservationUnitMutationVariables = Exact<{
  input: ReservationUnitUpdateMutationInput;
}>;

export type UpdateReservationUnitMutation = {
  updateReservationUnit?: { pk?: number | null } | null;
};

export type CreateReservationUnitMutationVariables = Exact<{
  input: ReservationUnitCreateMutationInput;
}>;

export type CreateReservationUnitMutation = {
  createReservationUnit?: { pk?: number | null } | null;
};

export type CreateImageMutationVariables = Exact<{
  image: Scalars["Upload"]["input"];
  reservationUnit: Scalars["Int"]["input"];
  imageType: ImageType;
}>;

export type CreateImageMutation = {
  createReservationUnitImage?: { pk?: number | null } | null;
};

export type DeleteImageMutationVariables = Exact<{
  pk: Scalars["ID"]["input"];
}>;

export type DeleteImageMutation = {
  deleteReservationUnitImage?: { deleted?: boolean | null } | null;
};

export type UpdateImageMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
  imageType: ImageType;
}>;

export type UpdateImageMutation = {
  updateReservationUnitImage?: { pk?: number | null } | null;
};

export type ReservationUnitEditorParametersQueryVariables = Exact<{
  [key: string]: never;
}>;

export type ReservationUnitEditorParametersQuery = {
  equipments?: {
    edges: Array<{
      node?: { id: string; nameFi?: string | null; pk?: number | null } | null;
    } | null>;
  } | null;
  taxPercentages?: {
    edges: Array<{
      node?: { id: string; pk?: number | null; value: string } | null;
    } | null>;
  } | null;
  purposes?: {
    edges: Array<{
      node?: { id: string; pk?: number | null; nameFi?: string | null } | null;
    } | null>;
  } | null;
  reservationUnitTypes?: {
    edges: Array<{
      node?: { id: string; nameFi?: string | null; pk?: number | null } | null;
    } | null>;
  } | null;
  termsOfUse?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: string | null;
        nameFi?: string | null;
        termsType: TermsType;
      } | null;
    } | null>;
  } | null;
  reservationUnitCancellationRules?: {
    edges: Array<{
      node?: { id: string; nameFi?: string | null; pk?: number | null } | null;
    } | null>;
  } | null;
  metadataSets?: {
    edges: Array<{
      node?: { id: string; name: string; pk?: number | null } | null;
    } | null>;
  } | null;
  qualifiers?: {
    edges: Array<{
      node?: { id: string; nameFi?: string | null; pk?: number | null } | null;
    } | null>;
  } | null;
};

export type ApplicationRoundFilterQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRoundFilterQuery = {
  applicationRound?: {
    id: string;
    nameFi?: string | null;
    status?: ApplicationRoundStatusChoice | null;
    reservationPeriodBegin: string;
    reservationPeriodEnd: string;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      unit?: { id: string; pk?: number | null; nameFi?: string | null } | null;
    }>;
  } | null;
};

export type AllApplicationEventsQueryVariables = Exact<{
  applicationRound: Scalars["Int"]["input"];
  applicationStatus:
    | Array<InputMaybe<ApplicationStatusChoice>>
    | InputMaybe<ApplicationStatusChoice>;
  unit:
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit:
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>;
}>;

export type AllApplicationEventsQuery = {
  applicationSections?: {
    totalCount?: number | null;
    edges: Array<{
      node?: {
        id: string;
        reservationUnitOptions: Array<{
          id: string;
          reservationUnit: {
            id: string;
            pk?: number | null;
            nameFi?: string | null;
          };
        }>;
      } | null;
    } | null>;
  } | null;
};

export type CreateAllocatedTimeSlotMutationVariables = Exact<{
  input: AllocatedTimeSlotCreateMutationInput;
}>;

export type CreateAllocatedTimeSlotMutation = {
  createAllocatedTimeslot?: {
    beginTime?: string | null;
    dayOfTheWeek?: Weekday | null;
    endTime?: string | null;
    pk?: number | null;
    reservationUnitOption?: number | null;
  } | null;
};

export type DeleteAllocatedTimeSlotMutationVariables = Exact<{
  input: AllocatedTimeSlotDeleteMutationInput;
}>;

export type DeleteAllocatedTimeSlotMutation = {
  deleteAllocatedTimeslot?: { deleted?: boolean | null } | null;
};

export type AllocatedTimeSlotFragment = {
  id: string;
  beginTime: string;
  endTime: string;
  dayOfTheWeek: Weekday;
};

export type ApplicationSectionAllocationsQueryVariables = Exact<{
  applicationRound: Scalars["Int"]["input"];
  applicationStatus:
    | Array<InputMaybe<ApplicationStatusChoice>>
    | InputMaybe<ApplicationStatusChoice>;
  status?: InputMaybe<
    | Array<InputMaybe<ApplicationSectionStatusChoice>>
    | InputMaybe<ApplicationSectionStatusChoice>
  >;
  applicantType?: InputMaybe<
    Array<InputMaybe<ApplicantTypeChoice>> | InputMaybe<ApplicantTypeChoice>
  >;
  preferredOrder?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<Array<InputMaybe<Priority>> | InputMaybe<Priority>>;
  purpose?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnit: Scalars["Int"]["input"];
  beginDate: Scalars["Date"]["input"];
  endDate: Scalars["Date"]["input"];
  ageGroup?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  homeCity?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  includePreferredOrder10OrHigher?: InputMaybe<Scalars["Boolean"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type ApplicationSectionAllocationsQuery = {
  applicationSections?: {
    totalCount?: number | null;
    edges: Array<{
      node?: {
        allocations?: number | null;
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
          beginTime: string;
          endTime: string;
          dayOfTheWeek: Weekday;
          priority: Priority;
          fulfilled?: boolean | null;
        }>;
        reservationUnitOptions: Array<{
          id: string;
          pk?: number | null;
          locked: boolean;
          rejected: boolean;
          preferredOrder: number;
          allocatedTimeSlots: Array<{
            pk?: number | null;
            id: string;
            beginTime: string;
            endTime: string;
            dayOfTheWeek: Weekday;
            reservationUnitOption: {
              id: string;
              pk?: number | null;
              applicationSection: { id: string; pk?: number | null };
            };
          }>;
          reservationUnit: {
            id: string;
            pk?: number | null;
            nameFi?: string | null;
            unit?: {
              id: string;
              pk?: number | null;
              nameFi?: string | null;
            } | null;
          };
        }>;
        purpose?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
        } | null;
        application: {
          id: string;
          pk?: number | null;
          status?: ApplicationStatusChoice | null;
          applicantType?: ApplicantTypeChoice | null;
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
        };
        ageGroup?: {
          id: string;
          pk?: number | null;
          minimum: number;
          maximum?: number | null;
        } | null;
      } | null;
    } | null>;
    pageInfo: { endCursor?: string | null; hasNextPage: boolean };
  } | null;
  affectingAllocatedTimeSlots?: Array<{
    id: string;
    beginTime: string;
    endTime: string;
    dayOfTheWeek: Weekday;
  }> | null;
};

export type RejectRestMutationVariables = Exact<{
  input: ReservationUnitOptionUpdateMutationInput;
}>;

export type RejectRestMutation = {
  updateReservationUnitOption?: {
    pk?: number | null;
    rejected?: boolean | null;
    locked?: boolean | null;
  } | null;
};

export type ApplicationRoundCriteriaQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRoundCriteriaQuery = {
  applicationRound?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    reservationUnitCount?: number | null;
    applicationPeriodBegin: string;
    applicationPeriodEnd: string;
    reservationPeriodBegin: string;
    reservationPeriodEnd: string;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      spaces: Array<{ id: string; nameFi?: string | null }>;
      unit?: { id: string; nameFi?: string | null } | null;
    }>;
  } | null;
};

export type RejectedOccurrencesQueryVariables = Exact<{
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  unit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  orderBy?: InputMaybe<
    | Array<InputMaybe<RejectedOccurrenceOrderingChoices>>
    | InputMaybe<RejectedOccurrenceOrderingChoices>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type RejectedOccurrencesQuery = {
  rejectedOccurrences?: {
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        beginDatetime: string;
        endDatetime: string;
        rejectionReason: RejectionReadinessChoice;
        recurringReservation: {
          id: string;
          allocatedTimeSlot?: {
            id: string;
            pk?: number | null;
            dayOfTheWeek: Weekday;
            beginTime: string;
            endTime: string;
            reservationUnitOption: {
              id: string;
              applicationSection: {
                id: string;
                name: string;
                application: {
                  id: string;
                  pk?: number | null;
                  applicantType?: ApplicantTypeChoice | null;
                  contactPerson?: {
                    id: string;
                    firstName: string;
                    lastName: string;
                  } | null;
                  organisation?: { id: string; nameFi?: string | null } | null;
                };
              };
              reservationUnit: {
                id: string;
                nameFi?: string | null;
                pk?: number | null;
                unit?: { id: string; nameFi?: string | null } | null;
              };
            };
          } | null;
          reservations: Array<{ id: string; pk?: number | null }>;
        };
      } | null;
    } | null>;
  } | null;
};

export type EndAllocationMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
}>;

export type EndAllocationMutation = {
  setApplicationRoundHandled?: { pk?: number | null } | null;
};

export type ApplicationsQueryVariables = Exact<{
  applicationRound: Scalars["Int"]["input"];
  unit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  applicantType?: InputMaybe<
    Array<InputMaybe<ApplicantTypeChoice>> | InputMaybe<ApplicantTypeChoice>
  >;
  status:
    | Array<InputMaybe<ApplicationStatusChoice>>
    | InputMaybe<ApplicationStatusChoice>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ApplicationOrderingChoices>>
    | InputMaybe<ApplicationOrderingChoices>
  >;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type ApplicationsQuery = {
  applications?: {
    totalCount?: number | null;
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        status?: ApplicationStatusChoice | null;
        applicantType?: ApplicantTypeChoice | null;
        applicationSections?: Array<{
          id: string;
          pk?: number | null;
          name: string;
          reservationsEndDate: string;
          reservationsBeginDate: string;
          appliedReservationsPerWeek: number;
          reservationMinDuration: number;
          reservationUnitOptions: Array<{
            id: string;
            preferredOrder: number;
            reservationUnit: {
              id: string;
              unit?: {
                id: string;
                pk?: number | null;
                nameFi?: string | null;
              } | null;
            };
          }>;
        }> | null;
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
    pageInfo: { endCursor?: string | null; hasNextPage: boolean };
  } | null;
};

export type ApplicationSectionsQueryVariables = Exact<{
  applicationRound: Scalars["Int"]["input"];
  applicationStatus:
    | Array<InputMaybe<ApplicationStatusChoice>>
    | InputMaybe<ApplicationStatusChoice>;
  status?: InputMaybe<
    | Array<InputMaybe<ApplicationSectionStatusChoice>>
    | InputMaybe<ApplicationSectionStatusChoice>
  >;
  unit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  applicantType?: InputMaybe<
    Array<InputMaybe<ApplicantTypeChoice>> | InputMaybe<ApplicantTypeChoice>
  >;
  preferredOrder?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<Array<InputMaybe<Priority>> | InputMaybe<Priority>>;
  purpose?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  ageGroup?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  homeCity?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  includePreferredOrder10OrHigher?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ApplicationSectionOrderingChoices>>
    | InputMaybe<ApplicationSectionOrderingChoices>
  >;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type ApplicationSectionsQuery = {
  applicationSections?: {
    totalCount?: number | null;
    edges: Array<{
      node?: {
        allocations?: number | null;
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
        reservationUnitOptions: Array<{
          id: string;
          pk?: number | null;
          preferredOrder: number;
          allocatedTimeSlots: Array<{
            id: string;
            pk?: number | null;
            dayOfTheWeek: Weekday;
            beginTime: string;
            endTime: string;
            reservationUnitOption: {
              id: string;
              applicationSection: { id: string; pk?: number | null };
            };
          }>;
          reservationUnit: {
            id: string;
            pk?: number | null;
            nameFi?: string | null;
            unit?: {
              id: string;
              pk?: number | null;
              nameFi?: string | null;
            } | null;
          };
        }>;
        purpose?: {
          id: string;
          pk?: number | null;
          nameFi?: string | null;
        } | null;
        application: {
          id: string;
          pk?: number | null;
          status?: ApplicationStatusChoice | null;
          applicantType?: ApplicantTypeChoice | null;
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
        };
        ageGroup?: {
          id: string;
          pk?: number | null;
          minimum: number;
          maximum?: number | null;
        } | null;
      } | null;
    } | null>;
    pageInfo: { endCursor?: string | null; hasNextPage: boolean };
  } | null;
};

export type AllocatedTimeSlotsQueryVariables = Exact<{
  applicationRound: Scalars["Int"]["input"];
  allocatedUnit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  applicantType?: InputMaybe<
    Array<InputMaybe<ApplicantTypeChoice>> | InputMaybe<ApplicantTypeChoice>
  >;
  applicationSectionStatus?: InputMaybe<
    | Array<InputMaybe<ApplicationSectionStatusChoice>>
    | InputMaybe<ApplicationSectionStatusChoice>
  >;
  allocatedReservationUnit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  dayOfTheWeek?: InputMaybe<Array<InputMaybe<Weekday>> | InputMaybe<Weekday>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    | Array<InputMaybe<AllocatedTimeSlotOrderingChoices>>
    | InputMaybe<AllocatedTimeSlotOrderingChoices>
  >;
  after?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type AllocatedTimeSlotsQuery = {
  allocatedTimeSlots?: {
    totalCount?: number | null;
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        dayOfTheWeek: Weekday;
        endTime: string;
        beginTime: string;
        recurringReservation?: {
          id: string;
          pk?: number | null;
          reservations: Array<{ id: string; pk?: number | null }>;
        } | null;
        reservationUnitOption: {
          id: string;
          rejected: boolean;
          locked: boolean;
          preferredOrder: number;
          applicationSection: {
            id: string;
            pk?: number | null;
            name: string;
            reservationsEndDate: string;
            reservationsBeginDate: string;
            reservationMinDuration: number;
            reservationMaxDuration: number;
            application: {
              pk?: number | null;
              id: string;
              applicantType?: ApplicantTypeChoice | null;
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
            };
          };
          reservationUnit: {
            id: string;
            nameFi?: string | null;
            unit?: { id: string; nameFi?: string | null } | null;
          };
        };
      } | null;
    } | null>;
    pageInfo: { endCursor?: string | null; hasNextPage: boolean };
  } | null;
};

export type ApplicationRoundBaseFragment = {
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  status?: ApplicationRoundStatusChoice | null;
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
};

export type ApplicationRoundsQueryVariables = Exact<{ [key: string]: never }>;

export type ApplicationRoundsQuery = {
  applicationRounds?: {
    edges: Array<{
      node?: {
        reservationPeriodBegin: string;
        reservationPeriodEnd: string;
        applicationsCount?: number | null;
        reservationUnitCount?: number | null;
        statusTimestamp?: string | null;
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        status?: ApplicationRoundStatusChoice | null;
        applicationPeriodBegin: string;
        applicationPeriodEnd: string;
      } | null;
    } | null>;
  } | null;
};

export type ApplicationRoundAdminFragment = {
  applicationsCount?: number | null;
  isSettingHandledAllowed?: boolean | null;
  reservationCreationStatus?: ApplicationRoundReservationCreationStatusChoice | null;
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  status?: ApplicationRoundStatusChoice | null;
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  reservationUnits: Array<{
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    unit?: { id: string; pk?: number | null; nameFi?: string | null } | null;
  }>;
};

export type ApplicationRoundQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRoundQuery = {
  applicationRound?: {
    applicationsCount?: number | null;
    isSettingHandledAllowed?: boolean | null;
    reservationCreationStatus?: ApplicationRoundReservationCreationStatusChoice | null;
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    status?: ApplicationRoundStatusChoice | null;
    applicationPeriodBegin: string;
    applicationPeriodEnd: string;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      unit?: { id: string; pk?: number | null; nameFi?: string | null } | null;
    }>;
  } | null;
};

export type ApplicationAdminQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationAdminQuery = {
  application?: {
    workingMemo: string;
    pk?: number | null;
    id: string;
    status?: ApplicationStatusChoice | null;
    lastModifiedDate: string;
    applicantType?: ApplicantTypeChoice | null;
    additionalInformation?: string | null;
    applicationRound: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
    };
    applicationSections?: Array<{
      id: string;
      allocations?: number | null;
      pk?: number | null;
      name: string;
      status?: ApplicationSectionStatusChoice | null;
      reservationMaxDuration: number;
      numPersons: number;
      reservationsEndDate: string;
      reservationsBeginDate: string;
      appliedReservationsPerWeek: number;
      reservationMinDuration: number;
      reservationUnitOptions: Array<{
        id: string;
        rejected: boolean;
        pk?: number | null;
        preferredOrder: number;
        allocatedTimeSlots: Array<{ pk?: number | null; id: string }>;
        reservationUnit: {
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
          applicationRoundTimeSlots: Array<{
            id: string;
            weekday: number;
            closed: boolean;
            reservableTimes?: Array<{
              begin: string;
              end: string;
            } | null> | null;
          }>;
        };
      }>;
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
    user?: {
      id: string;
      name?: string | null;
      email: string;
      pk?: number | null;
    } | null;
  } | null;
};

export type RejectAllSectionOptionsMutationVariables = Exact<{
  input: RejectAllSectionOptionsMutationInput;
}>;

export type RejectAllSectionOptionsMutation = {
  rejectAllSectionOptions?: { pk?: number | null } | null;
};

export type RestoreAllSectionOptionsMutationVariables = Exact<{
  input: RestoreAllSectionOptionsMutationInput;
}>;

export type RestoreAllSectionOptionsMutation = {
  restoreAllSectionOptions?: { pk?: number | null } | null;
};

export type RejectAllApplicationOptionsMutationVariables = Exact<{
  input: RejectAllApplicationOptionsMutationInput;
}>;

export type RejectAllApplicationOptionsMutation = {
  rejectAllApplicationOptions?: { pk?: number | null } | null;
};

export type RestoreAllApplicationOptionsMutationVariables = Exact<{
  input: RestoreAllApplicationOptionsMutationInput;
}>;

export type RestoreAllApplicationOptionsMutation = {
  restoreAllApplicationOptions?: { pk?: number | null } | null;
};

export type CreateStaffReservationMutationVariables = Exact<{
  input: ReservationStaffCreateMutationInput;
}>;

export type CreateStaffReservationMutation = {
  createStaffReservation?: { pk?: number | null } | null;
};

export type OptionsQueryVariables = Exact<{ [key: string]: never }>;

export type OptionsQuery = {
  reservationPurposes?: {
    edges: Array<{
      node?: { id: string; pk?: number | null; nameFi?: string | null } | null;
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
      node?: { id: string; nameFi?: string | null; pk?: number | null } | null;
    } | null>;
  } | null;
};

export type UnitViewQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type UnitViewQuery = {
  unit?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    location?: {
      id: string;
      addressStreetFi?: string | null;
      addressZip: string;
      addressCityFi?: string | null;
    } | null;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      spaces: Array<{ id: string; pk?: number | null }>;
    }>;
  } | null;
};

export type ReservationUnitsByUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  state?: InputMaybe<
    | Array<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>
  >;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
}>;

export type ReservationUnitsByUnitQuery = {
  unit?: {
    id: string;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      isDraft: boolean;
      authentication: Authentication;
      spaces: Array<{ id: string; pk?: number | null }>;
      reservationUnitType?: { id: string; pk?: number | null } | null;
    }>;
  } | null;
  affectingReservations?: Array<{
    name?: string | null;
    numPersons?: number | null;
    calendarUrl?: string | null;
    affectedReservationUnits?: Array<number | null> | null;
    id: string;
    pk?: number | null;
    begin: string;
    end: string;
    createdAt?: string | null;
    state?: ReservationStateChoice | null;
    type?: ReservationTypeChoice | null;
    isBlocked?: boolean | null;
    workingMemo?: string | null;
    reserveeName?: string | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      unit?: { id: string; pk?: number | null } | null;
    }>;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      pk?: number | null;
    } | null;
    paymentOrder: Array<{ id: string; status?: OrderStatus | null }>;
  }> | null;
};

export type ReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationUnitQuery = {
  reservationUnit?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    maxPersons?: number | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationStartInterval: ReservationStartInterval;
    authentication: Authentication;
    termsOfUseFi?: string | null;
    minPersons?: number | null;
    unit?: { id: string; pk?: number | null; nameFi?: string | null } | null;
    cancellationTerms?: {
      id: string;
      textFi?: string | null;
      nameFi?: string | null;
    } | null;
    paymentTerms?: {
      id: string;
      textFi?: string | null;
      nameFi?: string | null;
    } | null;
    pricingTerms?: {
      id: string;
      textFi?: string | null;
      nameFi?: string | null;
    } | null;
    serviceSpecificTerms?: {
      id: string;
      textFi?: string | null;
      nameFi?: string | null;
    } | null;
    metadataSet?: {
      id: string;
      requiredFields: Array<{ id: string; fieldName: string }>;
      supportedFields: Array<{ id: string; fieldName: string }>;
    } | null;
  } | null;
};

export type RecurringReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type RecurringReservationUnitQuery = {
  unit?: {
    id: string;
    nameFi?: string | null;
    pk?: number | null;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      reservationStartInterval: ReservationStartInterval;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
    }>;
  } | null;
};

export type ReservationUnitCalendarQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  state?: InputMaybe<
    | Array<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>
  >;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
}>;

export type ReservationUnitCalendarQuery = {
  reservationUnit?: {
    id: string;
    pk?: number | null;
    reservations?: Array<{
      name?: string | null;
      numPersons?: number | null;
      calendarUrl?: string | null;
      affectedReservationUnits?: Array<number | null> | null;
      id: string;
      pk?: number | null;
      begin: string;
      end: string;
      createdAt?: string | null;
      state?: ReservationStateChoice | null;
      type?: ReservationTypeChoice | null;
      isBlocked?: boolean | null;
      workingMemo?: string | null;
      reserveeName?: string | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      reservationUnits: Array<{
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        bufferTimeBefore: number;
        bufferTimeAfter: number;
        unit?: { id: string; pk?: number | null } | null;
      }>;
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        pk?: number | null;
      } | null;
      paymentOrder: Array<{ id: string; status?: OrderStatus | null }>;
    }> | null;
  } | null;
  affectingReservations?: Array<{
    name?: string | null;
    numPersons?: number | null;
    calendarUrl?: string | null;
    affectedReservationUnits?: Array<number | null> | null;
    id: string;
    pk?: number | null;
    begin: string;
    end: string;
    createdAt?: string | null;
    state?: ReservationStateChoice | null;
    type?: ReservationTypeChoice | null;
    isBlocked?: boolean | null;
    workingMemo?: string | null;
    reserveeName?: string | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      unit?: { id: string; pk?: number | null } | null;
    }>;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      pk?: number | null;
    } | null;
    paymentOrder: Array<{ id: string; status?: OrderStatus | null }>;
  }> | null;
};

export type CreateReservationSeriesMutationVariables = Exact<{
  input: ReservationSeriesCreateMutationInput;
}>;

export type CreateReservationSeriesMutation = {
  createReservationSeries?: { pk?: number | null } | null;
};

export type ReservationsInIntervalFragment = {
  id: string;
  begin: string;
  end: string;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  type?: ReservationTypeChoice | null;
  affectedReservationUnits?: Array<number | null> | null;
  recurringReservation?: { id: string; pk?: number | null } | null;
};

export type ReservationTimesInReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  state?: InputMaybe<
    | Array<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>
  >;
}>;

export type ReservationTimesInReservationUnitQuery = {
  reservationUnit?: {
    id: string;
    reservations?: Array<{
      id: string;
      begin: string;
      end: string;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      type?: ReservationTypeChoice | null;
      affectedReservationUnits?: Array<number | null> | null;
      recurringReservation?: { id: string; pk?: number | null } | null;
    }> | null;
  } | null;
  affectingReservations?: Array<{
    id: string;
    begin: string;
    end: string;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    type?: ReservationTypeChoice | null;
    affectedReservationUnits?: Array<number | null> | null;
    recurringReservation?: { id: string; pk?: number | null } | null;
  }> | null;
};

export type BannerNotificationCreateMutationVariables = Exact<{
  input: BannerNotificationCreateMutationInput;
}>;

export type BannerNotificationCreateMutation = {
  createBannerNotification?: { pk?: number | null } | null;
};

export type BannerNotificationUpdateMutationVariables = Exact<{
  input: BannerNotificationUpdateMutationInput;
}>;

export type BannerNotificationUpdateMutation = {
  updateBannerNotification?: { pk?: number | null } | null;
};

export type BannerNotificationDeleteMutationVariables = Exact<{
  input: BannerNotificationDeleteMutationInput;
}>;

export type BannerNotificationDeleteMutation = {
  deleteBannerNotification?: { deleted?: boolean | null } | null;
};

export type SearchReservationUnitsQueryVariables = Exact<{
  after?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  maxPersonsGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  maxPersonsLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  surfaceAreaGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  unit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnitType?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ReservationUnitOrderingChoices>>
    | InputMaybe<ReservationUnitOrderingChoices>
  >;
  publishingState?: InputMaybe<
    | Array<InputMaybe<ReservationUnitPublishingState>>
    | InputMaybe<ReservationUnitPublishingState>
  >;
}>;

export type SearchReservationUnitsQuery = {
  reservationUnits?: {
    totalCount?: number | null;
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        maxPersons?: number | null;
        surfaceArea?: number | null;
        publishingState?: ReservationUnitPublishingState | null;
        reservationState?: ReservationUnitReservationState | null;
        unit?: {
          id: string;
          nameFi?: string | null;
          pk?: number | null;
        } | null;
        reservationUnitType?: { id: string; nameFi?: string | null } | null;
      } | null;
    } | null>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  } | null;
};

export type ReservationApplicationLinkQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationApplicationLinkQuery = {
  recurringReservation?: {
    id: string;
    allocatedTimeSlot?: {
      id: string;
      pk?: number | null;
      reservationUnitOption: {
        id: string;
        pk?: number | null;
        applicationSection: {
          id: string;
          pk?: number | null;
          application: { id: string; pk?: number | null };
        };
      };
    } | null;
  } | null;
};

export type ReservationMetaFieldsFragment = {
  numPersons?: number | null;
  name?: string | null;
  description?: string | null;
  freeOfChargeReason?: string | null;
  applyingForFreeOfCharge?: boolean | null;
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
    minimum: number;
    maximum?: number | null;
    pk?: number | null;
  } | null;
  purpose?: { id: string; nameFi?: string | null; pk?: number | null } | null;
  homeCity?: { id: string; nameFi?: string | null; pk?: number | null } | null;
};

export type CalendarReservationFragment = {
  id: string;
  name?: string | null;
  reserveeName?: string | null;
  pk?: number | null;
  begin: string;
  end: string;
  state?: ReservationStateChoice | null;
  type?: ReservationTypeChoice | null;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  affectedReservationUnits?: Array<number | null> | null;
  user?: { id: string; email: string } | null;
};

export type ReservationsByReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  state?: InputMaybe<
    | Array<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>
  >;
}>;

export type ReservationsByReservationUnitQuery = {
  reservationUnit?: {
    id: string;
    reservations?: Array<{
      id: string;
      name?: string | null;
      reserveeName?: string | null;
      pk?: number | null;
      begin: string;
      end: string;
      state?: ReservationStateChoice | null;
      type?: ReservationTypeChoice | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      affectedReservationUnits?: Array<number | null> | null;
      user?: { id: string; email: string } | null;
    }> | null;
  } | null;
  affectingReservations?: Array<{
    id: string;
    name?: string | null;
    reserveeName?: string | null;
    pk?: number | null;
    begin: string;
    end: string;
    state?: ReservationStateChoice | null;
    type?: ReservationTypeChoice | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    affectedReservationUnits?: Array<number | null> | null;
    user?: { id: string; email: string } | null;
  }> | null;
};

export type ReservationSpecialisationFragment = {
  calendarUrl?: string | null;
  price?: string | null;
  taxPercentageValue?: string | null;
  handlingDetails?: string | null;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  paymentOrder: Array<{
    id: string;
    orderUuid?: string | null;
    refundUuid?: string | null;
  }>;
  cancelReason?: { id: string; reasonFi?: string | null } | null;
  denyReason?: { id: string; reasonFi?: string | null } | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    pk?: number | null;
  } | null;
};

export type ReservationQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationQuery = {
  reservation?: {
    id: string;
    pk?: number | null;
    begin: string;
    end: string;
    createdAt?: string | null;
    state?: ReservationStateChoice | null;
    type?: ReservationTypeChoice | null;
    isBlocked?: boolean | null;
    workingMemo?: string | null;
    reserveeName?: string | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    calendarUrl?: string | null;
    price?: string | null;
    taxPercentageValue?: string | null;
    handlingDetails?: string | null;
    numPersons?: number | null;
    name?: string | null;
    description?: string | null;
    freeOfChargeReason?: string | null;
    applyingForFreeOfCharge?: boolean | null;
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
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      maxPersons?: number | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      reservationStartInterval: ReservationStartInterval;
      authentication: Authentication;
      termsOfUseFi?: string | null;
      minPersons?: number | null;
      unit?: { id: string; pk?: number | null; nameFi?: string | null } | null;
      cancellationTerms?: {
        id: string;
        textFi?: string | null;
        nameFi?: string | null;
      } | null;
      paymentTerms?: {
        id: string;
        textFi?: string | null;
        nameFi?: string | null;
      } | null;
      pricingTerms?: {
        id: string;
        textFi?: string | null;
        nameFi?: string | null;
      } | null;
      serviceSpecificTerms?: {
        id: string;
        textFi?: string | null;
        nameFi?: string | null;
      } | null;
      pricings: Array<{
        id: string;
        begins: string;
        priceUnit: PriceUnit;
        lowestPrice: string;
        highestPrice: string;
        taxPercentage: { id: string; pk?: number | null; value: string };
      }>;
      metadataSet?: {
        id: string;
        requiredFields: Array<{ id: string; fieldName: string }>;
        supportedFields: Array<{ id: string; fieldName: string }>;
      } | null;
    }>;
    paymentOrder: Array<{
      id: string;
      status?: OrderStatus | null;
      orderUuid?: string | null;
      refundUuid?: string | null;
    }>;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      pk?: number | null;
    } | null;
    recurringReservation?: {
      id: string;
      pk?: number | null;
      beginDate?: string | null;
      beginTime?: string | null;
      endDate?: string | null;
      endTime?: string | null;
      weekdays?: Array<number | null> | null;
      name: string;
      description: string;
    } | null;
    cancelReason?: { id: string; reasonFi?: string | null } | null;
    denyReason?: { id: string; reasonFi?: string | null } | null;
    ageGroup?: {
      id: string;
      minimum: number;
      maximum?: number | null;
      pk?: number | null;
    } | null;
    purpose?: { id: string; nameFi?: string | null; pk?: number | null } | null;
    homeCity?: {
      id: string;
      nameFi?: string | null;
      pk?: number | null;
    } | null;
  } | null;
};

export type RecurringReservationFragment = {
  id: string;
  pk?: number | null;
  weekdays?: Array<number | null> | null;
  beginDate?: string | null;
  endDate?: string | null;
  rejectedOccurrences: Array<{
    id: string;
    beginDatetime: string;
    endDatetime: string;
    rejectionReason: RejectionReadinessChoice;
  }>;
  reservations: Array<{
    state?: ReservationStateChoice | null;
    id: string;
    pk?: number | null;
    begin: string;
    end: string;
    type?: ReservationTypeChoice | null;
    bufferTimeAfter: number;
    bufferTimeBefore: number;
    paymentOrder: Array<{ id: string; status?: OrderStatus | null }>;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      reservationStartInterval: ReservationStartInterval;
      unit?: { id: string; pk?: number | null } | null;
    }>;
    recurringReservation?: {
      pk?: number | null;
      id: string;
      weekdays?: Array<number | null> | null;
      beginDate?: string | null;
      endDate?: string | null;
    } | null;
  }>;
};

export type RecurringReservationQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type RecurringReservationQuery = {
  recurringReservation?: {
    id: string;
    pk?: number | null;
    weekdays?: Array<number | null> | null;
    beginDate?: string | null;
    endDate?: string | null;
    rejectedOccurrences: Array<{
      id: string;
      beginDatetime: string;
      endDatetime: string;
      rejectionReason: RejectionReadinessChoice;
    }>;
    reservations: Array<{
      state?: ReservationStateChoice | null;
      id: string;
      pk?: number | null;
      begin: string;
      end: string;
      type?: ReservationTypeChoice | null;
      bufferTimeAfter: number;
      bufferTimeBefore: number;
      paymentOrder: Array<{ id: string; status?: OrderStatus | null }>;
      reservationUnits: Array<{
        id: string;
        pk?: number | null;
        bufferTimeBefore: number;
        bufferTimeAfter: number;
        reservationStartInterval: ReservationStartInterval;
        unit?: { id: string; pk?: number | null } | null;
      }>;
      recurringReservation?: {
        pk?: number | null;
        id: string;
        weekdays?: Array<number | null> | null;
        beginDate?: string | null;
        endDate?: string | null;
      } | null;
    }>;
  } | null;
};

export type ApproveReservationMutationVariables = Exact<{
  input: ReservationApproveMutationInput;
}>;

export type ApproveReservationMutation = {
  approveReservation?: {
    pk?: number | null;
    state?: ReservationStateChoice | null;
  } | null;
};

export type DenyReservationMutationVariables = Exact<{
  input: ReservationDenyMutationInput;
}>;

export type DenyReservationMutation = {
  denyReservation?: {
    pk?: number | null;
    state?: ReservationStateChoice | null;
  } | null;
};

export type RefundReservationMutationVariables = Exact<{
  input: ReservationRefundMutationInput;
}>;

export type RefundReservationMutation = {
  refundReservation?: { pk?: number | null } | null;
};

export type RequireHandlingMutationVariables = Exact<{
  input: ReservationRequiresHandlingMutationInput;
}>;

export type RequireHandlingMutation = {
  requireHandlingForReservation?: {
    pk?: number | null;
    state?: ReservationStateChoice | null;
  } | null;
};

export type SeriesPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type SeriesPageQuery = {
  reservation?: {
    id: string;
    pk?: number | null;
    type?: ReservationTypeChoice | null;
    recurringReservation?: {
      recurrenceInDays?: number | null;
      endTime?: string | null;
      beginTime?: string | null;
      id: string;
      pk?: number | null;
      weekdays?: Array<number | null> | null;
      beginDate?: string | null;
      endDate?: string | null;
      rejectedOccurrences: Array<{
        id: string;
        beginDatetime: string;
        endDatetime: string;
        rejectionReason: RejectionReadinessChoice;
      }>;
      reservations: Array<{
        state?: ReservationStateChoice | null;
        id: string;
        pk?: number | null;
        begin: string;
        end: string;
        type?: ReservationTypeChoice | null;
        bufferTimeAfter: number;
        bufferTimeBefore: number;
        paymentOrder: Array<{ id: string; status?: OrderStatus | null }>;
        reservationUnits: Array<{
          id: string;
          pk?: number | null;
          bufferTimeBefore: number;
          bufferTimeAfter: number;
          reservationStartInterval: ReservationStartInterval;
          unit?: { id: string; pk?: number | null } | null;
        }>;
        recurringReservation?: {
          pk?: number | null;
          id: string;
          weekdays?: Array<number | null> | null;
          beginDate?: string | null;
          endDate?: string | null;
        } | null;
      }>;
    } | null;
    reservationUnits: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      reservationStartInterval: ReservationStartInterval;
    }>;
  } | null;
};

export type ReservationSeriesQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationSeriesQuery = {
  recurringReservation?: {
    id: string;
    pk?: number | null;
    weekdays?: Array<number | null> | null;
    beginDate?: string | null;
    endDate?: string | null;
    rejectedOccurrences: Array<{
      id: string;
      beginDatetime: string;
      endDatetime: string;
      rejectionReason: RejectionReadinessChoice;
    }>;
    reservations: Array<{
      state?: ReservationStateChoice | null;
      id: string;
      pk?: number | null;
      begin: string;
      end: string;
      type?: ReservationTypeChoice | null;
      bufferTimeAfter: number;
      bufferTimeBefore: number;
      paymentOrder: Array<{ id: string; status?: OrderStatus | null }>;
      reservationUnits: Array<{
        id: string;
        pk?: number | null;
        bufferTimeBefore: number;
        bufferTimeAfter: number;
        reservationStartInterval: ReservationStartInterval;
        unit?: { id: string; pk?: number | null } | null;
      }>;
      recurringReservation?: {
        pk?: number | null;
        id: string;
        weekdays?: Array<number | null> | null;
        beginDate?: string | null;
        endDate?: string | null;
      } | null;
    }>;
  } | null;
};

export type RescheduleReservationSeriesMutationVariables = Exact<{
  input: ReservationSeriesRescheduleMutationInput;
}>;

export type RescheduleReservationSeriesMutation = {
  rescheduleReservationSeries?: { pk?: number | null } | null;
};

export type ReservationUnitPricingFragment = {
  pricings: Array<{
    id: string;
    begins: string;
    priceUnit: PriceUnit;
    lowestPrice: string;
    highestPrice: string;
    taxPercentage: { id: string; pk?: number | null; value: string };
  }>;
};

export type ReservationRecurringFragment = {
  recurringReservation?: {
    id: string;
    pk?: number | null;
    beginDate?: string | null;
    beginTime?: string | null;
    endDate?: string | null;
    endTime?: string | null;
    weekdays?: Array<number | null> | null;
    name: string;
    description: string;
  } | null;
};

export type UpdateStaffReservationMutationVariables = Exact<{
  input: ReservationStaffModifyMutationInput;
  workingMemo: ReservationWorkingMemoMutationInput;
}>;

export type UpdateStaffReservationMutation = {
  staffReservationModify?: { pk?: number | null } | null;
  updateReservationWorkingMemo?: { workingMemo?: string | null } | null;
};

export type UpdateRecurringReservationMutationVariables = Exact<{
  input: ReservationSeriesUpdateMutationInput;
}>;

export type UpdateRecurringReservationMutation = {
  updateReservationSeries?: { pk?: number | null } | null;
};

export type ReservationsQueryVariables = Exact<{
  first?: InputMaybe<Scalars["Int"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ReservationOrderingChoices>>
    | InputMaybe<ReservationOrderingChoices>
  >;
  unit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnits?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationUnitType?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  reservationType?: InputMaybe<
    Array<InputMaybe<ReservationTypeChoice>> | InputMaybe<ReservationTypeChoice>
  >;
  state?: InputMaybe<
    | Array<InputMaybe<ReservationStateChoice>>
    | InputMaybe<ReservationStateChoice>
  >;
  orderStatus?: InputMaybe<
    Array<InputMaybe<OrderStatusWithFree>> | InputMaybe<OrderStatusWithFree>
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

export type ReservationsQuery = {
  reservations?: {
    totalCount?: number | null;
    edges: Array<{
      node?: {
        name?: string | null;
        id: string;
        pk?: number | null;
        begin: string;
        end: string;
        createdAt?: string | null;
        state?: ReservationStateChoice | null;
        type?: ReservationTypeChoice | null;
        isBlocked?: boolean | null;
        workingMemo?: string | null;
        reserveeName?: string | null;
        bufferTimeBefore: number;
        bufferTimeAfter: number;
        reservationUnits: Array<{
          id: string;
          nameFi?: string | null;
          unit?: { id: string; nameFi?: string | null } | null;
        }>;
        paymentOrder: Array<{ id: string; status?: OrderStatus | null }>;
        user?: { id: string; firstName: string; lastName: string } | null;
      } | null;
    } | null>;
    pageInfo: { endCursor?: string | null; hasNextPage: boolean };
  } | null;
};

export type DeleteResourceMutationVariables = Exact<{
  input: ResourceDeleteMutationInput;
}>;

export type DeleteResourceMutation = {
  deleteResource?: { deleted?: boolean | null } | null;
};

export type DeleteSpaceMutationVariables = Exact<{
  input: SpaceDeleteMutationInput;
}>;

export type DeleteSpaceMutation = {
  deleteSpace?: { deleted?: boolean | null } | null;
};

export type UnitsQueryVariables = Exact<{
  first?: InputMaybe<Scalars["Int"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<
    Array<InputMaybe<UnitOrderingChoices>> | InputMaybe<UnitOrderingChoices>
  >;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type UnitsQuery = {
  units?: {
    totalCount?: number | null;
    edges: Array<{
      node?: {
        id: string;
        nameFi?: string | null;
        pk?: number | null;
        unitGroups: Array<{ id: string; nameFi?: string | null }>;
        reservationUnits: Array<{ id: string; pk?: number | null }>;
      } | null;
    } | null>;
    pageInfo: { endCursor?: string | null; hasNextPage: boolean };
  } | null;
};

export type CreateResourceMutationVariables = Exact<{
  input: ResourceCreateMutationInput;
}>;

export type CreateResourceMutation = {
  createResource?: { pk?: number | null } | null;
};

export type UpdateResourceMutationVariables = Exact<{
  input: ResourceUpdateMutationInput;
}>;

export type UpdateResourceMutation = {
  updateResource?: { pk?: number | null } | null;
};

export type ResourceQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ResourceQuery = {
  resource?: {
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
    space?: { id: string; pk?: number | null } | null;
  } | null;
};

export type CreateSpaceMutationVariables = Exact<{
  input: SpaceCreateMutationInput;
}>;

export type CreateSpaceMutation = {
  createSpace?: { pk?: number | null } | null;
};

export type UpdateSpaceMutationVariables = Exact<{
  input: SpaceUpdateMutationInput;
}>;

export type UpdateSpaceMutation = {
  updateSpace?: { pk?: number | null } | null;
};

export type UnitSpacesQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type UnitSpacesQuery = {
  unit?: {
    id: string;
    spaces: Array<{
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      parent?: { id: string; pk?: number | null } | null;
    }>;
  } | null;
};

export type SpaceQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type SpaceQuery = {
  space?: {
    nameSv?: string | null;
    nameEn?: string | null;
    code: string;
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    surfaceArea?: number | null;
    maxPersons?: number | null;
    unit?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      descriptionFi?: string | null;
      location?: {
        id: string;
        addressStreetFi?: string | null;
        addressZip: string;
        addressCityFi?: string | null;
      } | null;
      spaces: Array<{ id: string; pk?: number | null; nameFi?: string | null }>;
    } | null;
    parent?: {
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      parent?: {
        id: string;
        nameFi?: string | null;
        parent?: { id: string; nameFi?: string | null } | null;
      } | null;
    } | null;
  } | null;
};

export const ApplicantFragmentDoc = gql`
  fragment Applicant on ApplicationNode {
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
    user {
      id
      name
      email
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
export const ApplicationRoundFragmentDoc = gql`
  fragment ApplicationRound on ApplicationRoundNode {
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
    }
    applicationPeriodBegin
    applicationPeriodEnd
    reservationPeriodBegin
    reservationPeriodEnd
    status
    applicationsCount
    reservationUnitCount
    statusTimestamp
  }
  ${ImageFragmentDoc}
`;
export const ApplicationSectionDurationFragmentDoc = gql`
  fragment ApplicationSectionDuration on ApplicationSectionNode {
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
export const ApplicationSectionUiFragmentDoc = gql`
  fragment ApplicationSectionUI on ApplicationSectionNode {
    ...ApplicationSectionCommon
    suitableTimeRanges {
      id
      pk
      beginTime
      endTime
      dayOfTheWeek
      priority
    }
    purpose {
      id
      pk
      nameFi
      nameSv
      nameEn
    }
    reservationUnitOptions {
      id
      reservationUnit {
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
        applicationRoundTimeSlots {
          id
          weekday
          closed
          reservableTimes {
            begin
            end
          }
        }
      }
    }
  }
  ${ApplicationSectionCommonFragmentDoc}
`;
export const ApplicationCommonFragmentDoc = gql`
  fragment ApplicationCommon on ApplicationNode {
    id
    pk
    status
    lastModifiedDate
    ...Applicant
    applicationRound {
      ...ApplicationRound
    }
    applicationSections {
      ...ApplicationSectionUI
    }
  }
  ${ApplicantFragmentDoc}
  ${ApplicationRoundFragmentDoc}
  ${ApplicationSectionUiFragmentDoc}
`;
export const TermsOfUseNameFieldsFragmentDoc = gql`
  fragment TermsOfUseNameFields on TermsOfUseNode {
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
export const SpaceCommonFieldsFragmentDoc = gql`
  fragment SpaceCommonFields on SpaceNode {
    id
    pk
    nameFi
    parent {
      id
      pk
      nameFi
    }
    surfaceArea
    maxPersons
  }
`;
export const ResourceFieldsFragmentDoc = gql`
  fragment ResourceFields on ResourceNode {
    id
    pk
    nameFi
    space {
      id
      nameFi
      unit {
        id
        nameFi
        pk
      }
    }
  }
`;
export const SpaceFieldsFragmentDoc = gql`
  fragment SpaceFields on SpaceNode {
    ...SpaceCommonFields
    code
    resources {
      ...ResourceFields
    }
    children {
      id
      pk
    }
  }
  ${SpaceCommonFieldsFragmentDoc}
  ${ResourceFieldsFragmentDoc}
`;
export const ReservationUnitCommonFieldsFragmentDoc = gql`
  fragment ReservationUnitCommonFields on ReservationUnitNode {
    id
    pk
    nameFi
    maxPersons
    surfaceArea
    reservationUnitType {
      id
      nameFi
    }
  }
`;
export const ApplicationNameFragmentDoc = gql`
  fragment ApplicationName on ApplicationNode {
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
export const ApplicationSectionFragmentDoc = gql`
  fragment ApplicationSection on ApplicationSectionNode {
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
export const ApplicationAdminFragmentDoc = gql`
  fragment ApplicationAdmin on ApplicationNode {
    pk
    id
    status
    lastModifiedDate
    ...Applicant
    applicationRound {
      id
      pk
      nameFi
    }
    applicationSections {
      id
      ...ApplicationSectionUI
      allocations
      reservationUnitOptions {
        id
        rejected
        allocatedTimeSlots {
          pk
          id
        }
      }
    }
  }
  ${ApplicantFragmentDoc}
  ${ApplicationSectionUiFragmentDoc}
`;
export const ReservationCommonFragmentDoc = gql`
  fragment ReservationCommon on ReservationNode {
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
      firstName
      lastName
    }
    bufferTimeBefore
    bufferTimeAfter
  }
`;
export const ReservationUnitReservationsFragmentDoc = gql`
  fragment ReservationUnitReservations on ReservationNode {
    ...ReservationCommon
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
    user {
      id
      firstName
      lastName
      email
      pk
    }
    affectedReservationUnits
  }
  ${ReservationCommonFragmentDoc}
`;
export const UnitNameFieldsFragmentDoc = gql`
  fragment UnitNameFields on UnitNode {
    id
    pk
    nameFi
  }
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
export const ReservationUnitFragmentDoc = gql`
  fragment ReservationUnit on ReservationUnitNode {
    id
    pk
    nameFi
    maxPersons
    bufferTimeBefore
    bufferTimeAfter
    reservationStartInterval
    authentication
    unit {
      ...UnitNameFields
    }
    ...MetadataSets
    cancellationTerms {
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
    termsOfUseFi
    serviceSpecificTerms {
      id
      textFi
      nameFi
    }
  }
  ${UnitNameFieldsFragmentDoc}
  ${MetadataSetsFragmentDoc}
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
export const BannerNotificationsAdminFragmentDoc = gql`
  fragment BannerNotificationsAdmin on BannerNotificationNode {
    pk
    ...BannerNotificationCommon
    name
    target
    activeUntil
    draft
    state
  }
  ${BannerNotificationCommonFragmentDoc}
`;
export const AllocatedTimeSlotFragmentDoc = gql`
  fragment AllocatedTimeSlot on AllocatedTimeSlotNode {
    id
    beginTime
    endTime
    dayOfTheWeek
  }
`;
export const ApplicationRoundBaseFragmentDoc = gql`
  fragment ApplicationRoundBase on ApplicationRoundNode {
    id
    pk
    nameFi
    status
    applicationPeriodBegin
    applicationPeriodEnd
  }
`;
export const ApplicationRoundAdminFragmentDoc = gql`
  fragment ApplicationRoundAdmin on ApplicationRoundNode {
    ...ApplicationRoundBase
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
  ${ApplicationRoundBaseFragmentDoc}
`;
export const ReservationsInIntervalFragmentDoc = gql`
  fragment ReservationsInInterval on ReservationNode {
    id
    begin
    end
    bufferTimeBefore
    bufferTimeAfter
    type
    affectedReservationUnits
    recurringReservation {
      id
      pk
    }
  }
`;
export const ReserveeNameFieldsFragmentDoc = gql`
  fragment ReserveeNameFields on ReservationNode {
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
  }
`;
export const ReservationSpecialisationFragmentDoc = gql`
  fragment ReservationSpecialisation on ReservationNode {
    calendarUrl
    price
    taxPercentageValue
    paymentOrder {
      id
      orderUuid
      refundUuid
    }
    cancelReason {
      id
      reasonFi
    }
    denyReason {
      id
      reasonFi
    }
    handlingDetails
    user {
      id
      firstName
      lastName
      email
      pk
    }
    bufferTimeBefore
    bufferTimeAfter
  }
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
export const RecurringReservationFragmentDoc = gql`
  fragment RecurringReservation on RecurringReservationNode {
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
export const ReservationUnitPricingFragmentDoc = gql`
  fragment ReservationUnitPricing on ReservationUnitNode {
    pricings {
      id
      ...PricingFields
    }
  }
  ${PricingFieldsFragmentDoc}
`;
export const ReservationRecurringFragmentDoc = gql`
  fragment ReservationRecurring on ReservationNode {
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
  }
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
export const UnitDocument = gql`
  query Unit($id: ID!) {
    unit(id: $id) {
      id
      pk
      nameFi
      tprekId
      shortDescriptionFi
      reservationUnits {
        ...ReservationUnitCommonFields
        resources {
          id
          pk
        }
        isDraft
        purposes {
          id
          pk
          nameFi
        }
        images {
          ...Image
        }
      }
      spaces {
        ...SpaceFields
      }
      location {
        ...LocationFields
        longitude
        latitude
      }
    }
  }
  ${ReservationUnitCommonFieldsFragmentDoc}
  ${ImageFragmentDoc}
  ${SpaceFieldsFragmentDoc}
  ${LocationFieldsFragmentDoc}
`;

/**
 * __useUnitQuery__
 *
 * To run a query within a React component, call `useUnitQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnitQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUnitQuery(
  baseOptions: Apollo.QueryHookOptions<UnitQuery, UnitQueryVariables> &
    ({ variables: UnitQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<UnitQuery, UnitQueryVariables>(UnitDocument, options);
}
export function useUnitLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<UnitQuery, UnitQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<UnitQuery, UnitQueryVariables>(
    UnitDocument,
    options
  );
}
export function useUnitSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<UnitQuery, UnitQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<UnitQuery, UnitQueryVariables>(
    UnitDocument,
    options
  );
}
export type UnitQueryHookResult = ReturnType<typeof useUnitQuery>;
export type UnitLazyQueryHookResult = ReturnType<typeof useUnitLazyQuery>;
export type UnitSuspenseQueryHookResult = ReturnType<
  typeof useUnitSuspenseQuery
>;
export type UnitQueryResult = Apollo.QueryResult<UnitQuery, UnitQueryVariables>;
export const UnitWithSpacesAndResourcesDocument = gql`
  query UnitWithSpacesAndResources($id: ID!) {
    unit(id: $id) {
      id
      pk
      nameFi
      spaces {
        ...SpaceCommonFields
        resources {
          id
          pk
          nameFi
        }
      }
      location {
        ...LocationFields
      }
    }
  }
  ${SpaceCommonFieldsFragmentDoc}
  ${LocationFieldsFragmentDoc}
`;

/**
 * __useUnitWithSpacesAndResourcesQuery__
 *
 * To run a query within a React component, call `useUnitWithSpacesAndResourcesQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnitWithSpacesAndResourcesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnitWithSpacesAndResourcesQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUnitWithSpacesAndResourcesQuery(
  baseOptions: Apollo.QueryHookOptions<
    UnitWithSpacesAndResourcesQuery,
    UnitWithSpacesAndResourcesQueryVariables
  > &
    (
      | { variables: UnitWithSpacesAndResourcesQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    UnitWithSpacesAndResourcesQuery,
    UnitWithSpacesAndResourcesQueryVariables
  >(UnitWithSpacesAndResourcesDocument, options);
}
export function useUnitWithSpacesAndResourcesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    UnitWithSpacesAndResourcesQuery,
    UnitWithSpacesAndResourcesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    UnitWithSpacesAndResourcesQuery,
    UnitWithSpacesAndResourcesQueryVariables
  >(UnitWithSpacesAndResourcesDocument, options);
}
export function useUnitWithSpacesAndResourcesSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        UnitWithSpacesAndResourcesQuery,
        UnitWithSpacesAndResourcesQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    UnitWithSpacesAndResourcesQuery,
    UnitWithSpacesAndResourcesQueryVariables
  >(UnitWithSpacesAndResourcesDocument, options);
}
export type UnitWithSpacesAndResourcesQueryHookResult = ReturnType<
  typeof useUnitWithSpacesAndResourcesQuery
>;
export type UnitWithSpacesAndResourcesLazyQueryHookResult = ReturnType<
  typeof useUnitWithSpacesAndResourcesLazyQuery
>;
export type UnitWithSpacesAndResourcesSuspenseQueryHookResult = ReturnType<
  typeof useUnitWithSpacesAndResourcesSuspenseQuery
>;
export type UnitWithSpacesAndResourcesQueryResult = Apollo.QueryResult<
  UnitWithSpacesAndResourcesQuery,
  UnitWithSpacesAndResourcesQueryVariables
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
    units(onlyWithPermission: true) {
      edges {
        node {
          id
          pk
        }
      }
      totalCount
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
export const BannerNotificationsAdminDocument = gql`
  query BannerNotificationsAdmin($id: ID!) {
    bannerNotification(id: $id) {
      ...BannerNotificationsAdmin
    }
  }
  ${BannerNotificationsAdminFragmentDoc}
`;

/**
 * __useBannerNotificationsAdminQuery__
 *
 * To run a query within a React component, call `useBannerNotificationsAdminQuery` and pass it any options that fit your needs.
 * When your component renders, `useBannerNotificationsAdminQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBannerNotificationsAdminQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useBannerNotificationsAdminQuery(
  baseOptions: Apollo.QueryHookOptions<
    BannerNotificationsAdminQuery,
    BannerNotificationsAdminQueryVariables
  > &
    (
      | { variables: BannerNotificationsAdminQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    BannerNotificationsAdminQuery,
    BannerNotificationsAdminQueryVariables
  >(BannerNotificationsAdminDocument, options);
}
export function useBannerNotificationsAdminLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    BannerNotificationsAdminQuery,
    BannerNotificationsAdminQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    BannerNotificationsAdminQuery,
    BannerNotificationsAdminQueryVariables
  >(BannerNotificationsAdminDocument, options);
}
export function useBannerNotificationsAdminSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        BannerNotificationsAdminQuery,
        BannerNotificationsAdminQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    BannerNotificationsAdminQuery,
    BannerNotificationsAdminQueryVariables
  >(BannerNotificationsAdminDocument, options);
}
export type BannerNotificationsAdminQueryHookResult = ReturnType<
  typeof useBannerNotificationsAdminQuery
>;
export type BannerNotificationsAdminLazyQueryHookResult = ReturnType<
  typeof useBannerNotificationsAdminLazyQuery
>;
export type BannerNotificationsAdminSuspenseQueryHookResult = ReturnType<
  typeof useBannerNotificationsAdminSuspenseQuery
>;
export type BannerNotificationsAdminQueryResult = Apollo.QueryResult<
  BannerNotificationsAdminQuery,
  BannerNotificationsAdminQueryVariables
>;
export const BannerNotificationsAdminListDocument = gql`
  query BannerNotificationsAdminList(
    $first: Int
    $after: String
    $orderBy: [BannerNotificationOrderingChoices]
  ) {
    bannerNotifications(first: $first, after: $after, orderBy: $orderBy) {
      edges {
        node {
          ...BannerNotificationsAdmin
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${BannerNotificationsAdminFragmentDoc}
`;

/**
 * __useBannerNotificationsAdminListQuery__
 *
 * To run a query within a React component, call `useBannerNotificationsAdminListQuery` and pass it any options that fit your needs.
 * When your component renders, `useBannerNotificationsAdminListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBannerNotificationsAdminListQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useBannerNotificationsAdminListQuery(
  baseOptions?: Apollo.QueryHookOptions<
    BannerNotificationsAdminListQuery,
    BannerNotificationsAdminListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    BannerNotificationsAdminListQuery,
    BannerNotificationsAdminListQueryVariables
  >(BannerNotificationsAdminListDocument, options);
}
export function useBannerNotificationsAdminListLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    BannerNotificationsAdminListQuery,
    BannerNotificationsAdminListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    BannerNotificationsAdminListQuery,
    BannerNotificationsAdminListQueryVariables
  >(BannerNotificationsAdminListDocument, options);
}
export function useBannerNotificationsAdminListSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        BannerNotificationsAdminListQuery,
        BannerNotificationsAdminListQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    BannerNotificationsAdminListQuery,
    BannerNotificationsAdminListQueryVariables
  >(BannerNotificationsAdminListDocument, options);
}
export type BannerNotificationsAdminListQueryHookResult = ReturnType<
  typeof useBannerNotificationsAdminListQuery
>;
export type BannerNotificationsAdminListLazyQueryHookResult = ReturnType<
  typeof useBannerNotificationsAdminListLazyQuery
>;
export type BannerNotificationsAdminListSuspenseQueryHookResult = ReturnType<
  typeof useBannerNotificationsAdminListSuspenseQuery
>;
export type BannerNotificationsAdminListQueryResult = Apollo.QueryResult<
  BannerNotificationsAdminListQuery,
  BannerNotificationsAdminListQueryVariables
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
    updateApplication(input: { pk: $pk, workingMemo: $workingMemo }) {
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
      requireIntroduction
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
        id
        pk
        nameFi
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
        id
        pk
        closed
        weekday
        reservableTimes {
          begin
          end
        }
      }
    }
  }
  ${ImageFragmentDoc}
  ${PricingFieldsFragmentDoc}
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
  query ReservationUnitEditorParameters {
    equipments {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
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
          ...ApplicationSection
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
  ${ApplicationSectionFragmentDoc}
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
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
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
      }
    }
  }
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
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${ApplicationNameFragmentDoc}
  ${ApplicationSectionDurationFragmentDoc}
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
          ...ApplicationSection
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
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${ApplicationSectionFragmentDoc}
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
export const AllocatedTimeSlotsDocument = gql`
  query AllocatedTimeSlots(
    $applicationRound: Int!
    $allocatedUnit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $applicationSectionStatus: [ApplicationSectionStatusChoice]
    $allocatedReservationUnit: [Int]
    $dayOfTheWeek: [Weekday]
    $textSearch: String
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
      dayOfTheWeek: $dayOfTheWeek
      textSearch: $textSearch
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          pk
          dayOfTheWeek
          endTime
          beginTime
          recurringReservation {
            id
            pk
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
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${ApplicationNameFragmentDoc}
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
export const ApplicationRoundsDocument = gql`
  query ApplicationRounds {
    applicationRounds(onlyWithPermissions: true) {
      edges {
        node {
          ...ApplicationRoundBase
          reservationPeriodBegin
          reservationPeriodEnd
          applicationsCount
          reservationUnitCount
          statusTimestamp
        }
      }
    }
  }
  ${ApplicationRoundBaseFragmentDoc}
`;

/**
 * __useApplicationRoundsQuery__
 *
 * To run a query within a React component, call `useApplicationRoundsQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationRoundsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationRoundsQuery({
 *   variables: {
 *   },
 * });
 */
export function useApplicationRoundsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ApplicationRoundsQuery,
    ApplicationRoundsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ApplicationRoundsQuery,
    ApplicationRoundsQueryVariables
  >(ApplicationRoundsDocument, options);
}
export function useApplicationRoundsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationRoundsQuery,
    ApplicationRoundsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ApplicationRoundsQuery,
    ApplicationRoundsQueryVariables
  >(ApplicationRoundsDocument, options);
}
export function useApplicationRoundsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ApplicationRoundsQuery,
        ApplicationRoundsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ApplicationRoundsQuery,
    ApplicationRoundsQueryVariables
  >(ApplicationRoundsDocument, options);
}
export type ApplicationRoundsQueryHookResult = ReturnType<
  typeof useApplicationRoundsQuery
>;
export type ApplicationRoundsLazyQueryHookResult = ReturnType<
  typeof useApplicationRoundsLazyQuery
>;
export type ApplicationRoundsSuspenseQueryHookResult = ReturnType<
  typeof useApplicationRoundsSuspenseQuery
>;
export type ApplicationRoundsQueryResult = Apollo.QueryResult<
  ApplicationRoundsQuery,
  ApplicationRoundsQueryVariables
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
export const ApplicationAdminDocument = gql`
  query ApplicationAdmin($id: ID!) {
    application(id: $id) {
      ...ApplicationAdmin
      workingMemo
    }
  }
  ${ApplicationAdminFragmentDoc}
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
export const OptionsDocument = gql`
  query Options {
    reservationPurposes {
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
export const UnitViewDocument = gql`
  query UnitView($id: ID!) {
    unit(id: $id) {
      ...UnitNameFields
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
  ${UnitNameFieldsFragmentDoc}
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
export const ReservationUnitDocument = gql`
  query ReservationUnit($id: ID!) {
    reservationUnit(id: $id) {
      ...ReservationUnit
    }
  }
  ${ReservationUnitFragmentDoc}
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
      }
    }
    affectingReservations(
      forReservationUnits: [$pk]
      state: $state
      beginDate: $beginDate
      endDate: $endDate
    ) {
      ...ReservationUnitReservations
    }
  }
  ${ReservationUnitReservationsFragmentDoc}
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
export const ReservationTimesInReservationUnitDocument = gql`
  query ReservationTimesInReservationUnit(
    $id: ID!
    $pk: Int!
    $beginDate: Date
    $endDate: Date
    $state: [ReservationStateChoice]
  ) {
    reservationUnit(id: $id) {
      id
      reservations(beginDate: $beginDate, endDate: $endDate, state: $state) {
        ...ReservationsInInterval
      }
    }
    affectingReservations(
      forReservationUnits: [$pk]
      state: $state
      beginDate: $beginDate
      endDate: $endDate
    ) {
      ...ReservationsInInterval
    }
  }
  ${ReservationsInIntervalFragmentDoc}
`;

/**
 * __useReservationTimesInReservationUnitQuery__
 *
 * To run a query within a React component, call `useReservationTimesInReservationUnitQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationTimesInReservationUnitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationTimesInReservationUnitQuery({
 *   variables: {
 *      id: // value for 'id'
 *      pk: // value for 'pk'
 *      beginDate: // value for 'beginDate'
 *      endDate: // value for 'endDate'
 *      state: // value for 'state'
 *   },
 * });
 */
export function useReservationTimesInReservationUnitQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationTimesInReservationUnitQuery,
    ReservationTimesInReservationUnitQueryVariables
  > &
    (
      | {
          variables: ReservationTimesInReservationUnitQueryVariables;
          skip?: boolean;
        }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationTimesInReservationUnitQuery,
    ReservationTimesInReservationUnitQueryVariables
  >(ReservationTimesInReservationUnitDocument, options);
}
export function useReservationTimesInReservationUnitLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationTimesInReservationUnitQuery,
    ReservationTimesInReservationUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationTimesInReservationUnitQuery,
    ReservationTimesInReservationUnitQueryVariables
  >(ReservationTimesInReservationUnitDocument, options);
}
export function useReservationTimesInReservationUnitSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationTimesInReservationUnitQuery,
        ReservationTimesInReservationUnitQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationTimesInReservationUnitQuery,
    ReservationTimesInReservationUnitQueryVariables
  >(ReservationTimesInReservationUnitDocument, options);
}
export type ReservationTimesInReservationUnitQueryHookResult = ReturnType<
  typeof useReservationTimesInReservationUnitQuery
>;
export type ReservationTimesInReservationUnitLazyQueryHookResult = ReturnType<
  typeof useReservationTimesInReservationUnitLazyQuery
>;
export type ReservationTimesInReservationUnitSuspenseQueryHookResult =
  ReturnType<typeof useReservationTimesInReservationUnitSuspenseQuery>;
export type ReservationTimesInReservationUnitQueryResult = Apollo.QueryResult<
  ReservationTimesInReservationUnitQuery,
  ReservationTimesInReservationUnitQueryVariables
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
export const SearchReservationUnitsDocument = gql`
  query SearchReservationUnits(
    $after: String
    $first: Int
    $nameFi: String
    $maxPersonsGte: Decimal
    $maxPersonsLte: Decimal
    $surfaceAreaGte: Decimal
    $surfaceAreaLte: Decimal
    $unit: [Int]
    $reservationUnitType: [Int]
    $orderBy: [ReservationUnitOrderingChoices]
    $publishingState: [ReservationUnitPublishingState]
  ) {
    reservationUnits(
      first: $first
      after: $after
      orderBy: $orderBy
      nameFi: $nameFi
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
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
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
 *      nameFi: // value for 'nameFi'
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
      }
    }
    affectingReservations(
      forReservationUnits: [$pk]
      state: $state
      beginDate: $beginDate
      endDate: $endDate
    ) {
      ...CalendarReservation
    }
  }
  ${CalendarReservationFragmentDoc}
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
export const ReservationDocument = gql`
  query Reservation($id: ID!) {
    reservation(id: $id) {
      ...ReservationCommon
      ...ReservationRecurring
      ...ReservationSpecialisation
      reservationUnits {
        ...ReservationUnit
        ...ReservationUnitPricing
      }
      ...ReservationMetaFields
    }
  }
  ${ReservationCommonFragmentDoc}
  ${ReservationRecurringFragmentDoc}
  ${ReservationSpecialisationFragmentDoc}
  ${ReservationUnitFragmentDoc}
  ${ReservationUnitPricingFragmentDoc}
  ${ReservationMetaFieldsFragmentDoc}
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
export const RecurringReservationDocument = gql`
  query RecurringReservation($id: ID!) {
    recurringReservation(id: $id) {
      ...RecurringReservation
    }
  }
  ${RecurringReservationFragmentDoc}
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
export const SeriesPageDocument = gql`
  query SeriesPage($id: ID!) {
    reservation(id: $id) {
      id
      pk
      type
      recurringReservation {
        ...RecurringReservation
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
  ${RecurringReservationFragmentDoc}
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
      ...RecurringReservation
    }
  }
  ${RecurringReservationFragmentDoc}
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
export const ReservationsDocument = gql`
  query Reservations(
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
          ...ReservationCommon
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
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${ReservationCommonFragmentDoc}
`;

/**
 * __useReservationsQuery__
 *
 * To run a query within a React component, call `useReservationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationsQuery({
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
export function useReservationsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ReservationsQuery,
    ReservationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ReservationsQuery, ReservationsQueryVariables>(
    ReservationsDocument,
    options
  );
}
export function useReservationsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationsQuery,
    ReservationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ReservationsQuery, ReservationsQueryVariables>(
    ReservationsDocument,
    options
  );
}
export function useReservationsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ReservationsQuery,
        ReservationsQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<ReservationsQuery, ReservationsQueryVariables>(
    ReservationsDocument,
    options
  );
}
export type ReservationsQueryHookResult = ReturnType<
  typeof useReservationsQuery
>;
export type ReservationsLazyQueryHookResult = ReturnType<
  typeof useReservationsLazyQuery
>;
export type ReservationsSuspenseQueryHookResult = ReturnType<
  typeof useReservationsSuspenseQuery
>;
export type ReservationsQueryResult = Apollo.QueryResult<
  ReservationsQuery,
  ReservationsQueryVariables
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
export const UnitsDocument = gql`
  query Units(
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
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

/**
 * __useUnitsQuery__
 *
 * To run a query within a React component, call `useUnitsQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnitsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnitsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      orderBy: // value for 'orderBy'
 *      nameFi: // value for 'nameFi'
 *   },
 * });
 */
export function useUnitsQuery(
  baseOptions?: Apollo.QueryHookOptions<UnitsQuery, UnitsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<UnitsQuery, UnitsQueryVariables>(
    UnitsDocument,
    options
  );
}
export function useUnitsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<UnitsQuery, UnitsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<UnitsQuery, UnitsQueryVariables>(
    UnitsDocument,
    options
  );
}
export function useUnitsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<UnitsQuery, UnitsQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<UnitsQuery, UnitsQueryVariables>(
    UnitsDocument,
    options
  );
}
export type UnitsQueryHookResult = ReturnType<typeof useUnitsQuery>;
export type UnitsLazyQueryHookResult = ReturnType<typeof useUnitsLazyQuery>;
export type UnitsSuspenseQueryHookResult = ReturnType<
  typeof useUnitsSuspenseQuery
>;
export type UnitsQueryResult = Apollo.QueryResult<
  UnitsQuery,
  UnitsQueryVariables
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
export const ResourceDocument = gql`
  query Resource($id: ID!) {
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
  }
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
export const SpaceDocument = gql`
  query Space($id: ID!) {
    space(id: $id) {
      ...SpaceCommonFields
      nameSv
      nameEn
      code
      unit {
        id
        pk
        nameFi
        descriptionFi
        location {
          ...LocationFields
        }
        spaces {
          id
          pk
          nameFi
        }
      }
      parent {
        id
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
  ${SpaceCommonFieldsFragmentDoc}
  ${LocationFieldsFragmentDoc}
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
