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
  serviceSectorRoles: Array<ServiceSectorRoleNode>;
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
  serviceSector?: Maybe<ServiceSectorNode>;
  status?: Maybe<ApplicationRoundStatusChoice>;
  statusTimestamp?: Maybe<Scalars["DateTime"]["output"]>;
  targetGroup: TargetGroup;
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
  keywordGroups?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  reservationState?: InputMaybe<Array<InputMaybe<ReservationState>>>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  state?: InputMaybe<Array<InputMaybe<ReservationUnitState>>>;
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

/** An enumeration. */
export enum CustomerTypeChoice {
  Business = "BUSINESS",
  Individual = "INDIVIDUAL",
  Nonprofit = "NONPROFIT",
}

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

/** An enumeration. */
export enum GeneralPermissionChoices {
  CanAllocateApplications = "CAN_ALLOCATE_APPLICATIONS",
  CanCommentReservations = "CAN_COMMENT_RESERVATIONS",
  CanCreateStaffReservations = "CAN_CREATE_STAFF_RESERVATIONS",
  CanHandleApplications = "CAN_HANDLE_APPLICATIONS",
  CanManageAbilityGroups = "CAN_MANAGE_ABILITY_GROUPS",
  CanManageAgeGroups = "CAN_MANAGE_AGE_GROUPS",
  CanManageApplicationRounds = "CAN_MANAGE_APPLICATION_ROUNDS",
  CanManageEquipment = "CAN_MANAGE_EQUIPMENT",
  CanManageEquipmentCategories = "CAN_MANAGE_EQUIPMENT_CATEGORIES",
  CanManageGeneralRoles = "CAN_MANAGE_GENERAL_ROLES",
  CanManageNotifications = "CAN_MANAGE_NOTIFICATIONS",
  CanManagePurposes = "CAN_MANAGE_PURPOSES",
  CanManageQualifiers = "CAN_MANAGE_QUALIFIERS",
  CanManageReservations = "CAN_MANAGE_RESERVATIONS",
  CanManageReservationPurposes = "CAN_MANAGE_RESERVATION_PURPOSES",
  CanManageReservationUnits = "CAN_MANAGE_RESERVATION_UNITS",
  CanManageReservationUnitTypes = "CAN_MANAGE_RESERVATION_UNIT_TYPES",
  CanManageResources = "CAN_MANAGE_RESOURCES",
  CanManageServiceSectorRoles = "CAN_MANAGE_SERVICE_SECTOR_ROLES",
  CanManageSpaces = "CAN_MANAGE_SPACES",
  CanManageUnits = "CAN_MANAGE_UNITS",
  CanManageUnitRoles = "CAN_MANAGE_UNIT_ROLES",
  CanValidateApplications = "CAN_VALIDATE_APPLICATIONS",
  CanViewReservations = "CAN_VIEW_RESERVATIONS",
  CanViewUsers = "CAN_VIEW_USERS",
}

export type GeneralRoleChoiceNode = Node & {
  code: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  permissions?: Maybe<Array<GeneralRolePermissionNode>>;
  verboseName: Scalars["String"]["output"];
  verboseNameEn?: Maybe<Scalars["String"]["output"]>;
  verboseNameFi?: Maybe<Scalars["String"]["output"]>;
  verboseNameSv?: Maybe<Scalars["String"]["output"]>;
};

export type GeneralRoleNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  role: GeneralRoleChoiceNode;
};

export type GeneralRolePermissionNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  permission?: Maybe<GeneralPermissionChoices>;
  pk?: Maybe<Scalars["Int"]["output"]>;
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

export type KeywordCategoryNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  keywordGroups: Array<KeywordGroupNode>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type KeywordCategoryNodeKeywordGroupsArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<KeywordGroupOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type KeywordCategoryNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordCategoryNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `KeywordCategoryNode` and its cursor. */
export type KeywordCategoryNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<KeywordCategoryNode>;
};

export type KeywordGroupNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  keywords: Array<KeywordNode>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type KeywordGroupNodeKeywordsArgs = {
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<KeywordOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type KeywordGroupNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordGroupNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `KeywordGroupNode` and its cursor. */
export type KeywordGroupNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<KeywordGroupNode>;
};

/** Ordering fields for the 'KeywordGroup' model. */
export enum KeywordGroupOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
}

export type KeywordNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type KeywordNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `KeywordNode` and its cursor. */
export type KeywordNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<KeywordNode>;
};

/** Ordering fields for the 'Keyword' model. */
export enum KeywordOrderingChoices {
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
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
  createRecurringReservation?: Maybe<RecurringReservationCreateMutationPayload>;
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
  deleteReservation?: Maybe<ReservationDeleteMutationPayload>;
  deleteReservationUnitImage?: Maybe<ReservationUnitImageDeleteMutationPayload>;
  deleteResource?: Maybe<ResourceDeleteMutationPayload>;
  deleteSpace?: Maybe<SpaceDeleteMutationPayload>;
  denyReservation?: Maybe<ReservationDenyMutationPayload>;
  refreshOrder?: Maybe<RefreshOrderMutationPayload>;
  refundReservation?: Maybe<ReservationRefundMutationPayload>;
  rejectAllApplicationOptions?: Maybe<RejectAllApplicationOptionsMutationPayload>;
  rejectAllSectionOptions?: Maybe<RejectAllSectionOptionsMutationPayload>;
  requireHandlingForReservation?: Maybe<ReservationRequiresHandlingMutationPayload>;
  restoreAllApplicationOptions?: Maybe<RestoreAllApplicationOptionsMutationPayload>;
  restoreAllSectionOptions?: Maybe<RestoreAllSectionOptionsMutationPayload>;
  sendApplication?: Maybe<ApplicationSendMutationPayload>;
  setApplicationRoundHandled?: Maybe<SetApplicationRoundHandledMutationPayload>;
  staffAdjustReservationTime?: Maybe<ReservationStaffAdjustTimeMutationPayload>;
  staffReservationModify?: Maybe<ReservationStaffModifyMutationPayload>;
  updateApplication?: Maybe<ApplicationUpdateMutationPayload>;
  updateApplicationSection?: Maybe<ApplicationSectionUpdateMutationPayload>;
  updateBannerNotification?: Maybe<BannerNotificationUpdateMutationPayload>;
  updateEquipment?: Maybe<EquipmentUpdateMutationPayload>;
  updateEquipmentCategory?: Maybe<EquipmentCategoryUpdateMutationPayload>;
  updatePurpose?: Maybe<PurposeUpdateMutationPayload>;
  updateRecurringReservation?: Maybe<RecurringReservationUpdateMutationPayload>;
  updateReservation?: Maybe<ReservationUpdateMutationPayload>;
  updateReservationUnit?: Maybe<ReservationUnitUpdateMutationPayload>;
  updateReservationUnitImage?: Maybe<ReservationUnitImageUpdateMutationPayload>;
  updateReservationUnitOption?: Maybe<ReservationUnitOptionUpdateMutationPayload>;
  updateReservationWorkingMemo?: Maybe<ReservationWorkingMemoMutationPayload>;
  updateResource?: Maybe<ResourceUpdateMutationPayload>;
  updateSpace?: Maybe<SpaceUpdateMutationPayload>;
  updateUnit?: Maybe<UnitUpdateMutationPayload>;
  updateUser?: Maybe<UserUpdateMutationPayload>;
};

export type MutationAdjustReservationTimeArgs = {
  input: ReservationAdjustTimeMutationInput;
};

export type MutationApproveReservationArgs = {
  input: ReservationApproveMutationInput;
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

export type MutationCreateRecurringReservationArgs = {
  input: RecurringReservationCreateMutationInput;
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

export type MutationDenyReservationArgs = {
  input: ReservationDenyMutationInput;
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

export type MutationUpdateEquipmentArgs = {
  input: EquipmentUpdateMutationInput;
};

export type MutationUpdateEquipmentCategoryArgs = {
  input: EquipmentCategoryUpdateMutationInput;
};

export type MutationUpdatePurposeArgs = {
  input: PurposeUpdateMutationInput;
};

export type MutationUpdateRecurringReservationArgs = {
  input: RecurringReservationUpdateMutationInput;
};

export type MutationUpdateReservationArgs = {
  input: ReservationUpdateMutationInput;
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

export type MutationUpdateUnitArgs = {
  input: UnitUpdateMutationInput;
};

export type MutationUpdateUserArgs = {
  input: UserUpdateMutationInput;
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
export enum PricingType {
  /** Maksuton */
  Free = "FREE",
  /** Maksullinen */
  Paid = "PAID",
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
  rank?: Maybe<Scalars["Int"]["output"]>;
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
  cities?: Maybe<CityNodeConnection>;
  currentUser?: Maybe<UserNode>;
  equipment?: Maybe<EquipmentNode>;
  equipmentCategories?: Maybe<EquipmentCategoryNodeConnection>;
  equipmentCategory?: Maybe<EquipmentCategoryNode>;
  equipments?: Maybe<EquipmentNodeConnection>;
  keywordCategories?: Maybe<KeywordCategoryNodeConnection>;
  keywordGroups?: Maybe<KeywordGroupNodeConnection>;
  keywords?: Maybe<KeywordNodeConnection>;
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
  reservations?: Maybe<ReservationNodeConnection>;
  resource?: Maybe<ResourceNode>;
  resources?: Maybe<ResourceNodeConnection>;
  serviceSectors?: Maybe<ServiceSectorNodeConnection>;
  space?: Maybe<SpaceNode>;
  spaces?: Maybe<SpaceNodeConnection>;
  taxPercentages?: Maybe<TaxPercentageNodeConnection>;
  termsOfUse?: Maybe<TermsOfUseNodeConnection>;
  unit?: Maybe<UnitNode>;
  unitGroups?: Maybe<UnitGroupNodeConnection>;
  units?: Maybe<UnitNodeConnection>;
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
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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

export type QueryKeywordCategoriesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<KeywordGroupOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryKeywordGroupsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<KeywordGroupOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryKeywordsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<KeywordOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  name?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationPurposeOrderingChoices>>>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  keywordGroups?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  reservationState?: InputMaybe<Array<InputMaybe<ReservationState>>>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  state?: InputMaybe<Array<InputMaybe<ReservationUnitState>>>;
  surfaceAreaGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  tprekDepartmentId?: InputMaybe<Scalars["String"]["input"]>;
  tprekId?: InputMaybe<Scalars["String"]["input"]>;
  typeRankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  typeRankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
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
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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

export type QueryServiceSectorsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
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
  serviceSector?: InputMaybe<Scalars["Decimal"]["input"]>;
};

export type QueryUserArgs = {
  id: Scalars["ID"]["input"];
};

export type RecurringReservationCreateMutationInput = {
  abilityGroup?: InputMaybe<Scalars["Int"]["input"]>;
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  beginDate: Scalars["Date"]["input"];
  beginTime: Scalars["Time"]["input"];
  description?: InputMaybe<Scalars["String"]["input"]>;
  endDate: Scalars["Date"]["input"];
  endTime: Scalars["Time"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  recurrenceInDays: Scalars["Int"]["input"];
  reservationUnit: Scalars["Int"]["input"];
  weekdays: Array<InputMaybe<Scalars["Int"]["input"]>>;
};

export type RecurringReservationCreateMutationPayload = {
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
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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

export type RecurringReservationUpdateMutationInput = {
  abilityGroup?: InputMaybe<Scalars["Int"]["input"]>;
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  beginTime?: InputMaybe<Scalars["Time"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  endTime?: InputMaybe<Scalars["Time"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
  recurrenceInDays?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit?: InputMaybe<Scalars["Int"]["input"]>;
  weekdays?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type RecurringReservationUpdateMutationPayload = {
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
  ReservationUnitPkAsc = "reservationUnitPkAsc",
  ReservationUnitPkDesc = "reservationUnitPkDesc",
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
  priceNet: Scalars["Decimal"]["input"];
};

export type ReservationApproveMutationPayload = {
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  handlingDetails?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
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
  nonSubsidisedPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  order?: Maybe<PaymentOrderNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
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
  type?: Maybe<ReservationTypeChoice>;
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
  type?: InputMaybe<ReservationTypeChoice>;
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
  nonSubsidisedPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
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
  type?: Maybe<ReservationTypeChoice>;
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
};

export type ReservationDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type ReservationDeleteMutationPayload = {
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
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
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
  reservationUnit: Array<ReservationUnitNode>;
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

export type ReservationNodeReservationUnitArgs = {
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
  keywordGroups?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  reservationState?: InputMaybe<Array<InputMaybe<ReservationState>>>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  state?: InputMaybe<Array<InputMaybe<ReservationUnitState>>>;
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
  PkAsc = "pkAsc",
  PkDesc = "pkDesc",
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
  reservationDetails: ReservationSeriesReservationSerializerInput;
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

export type ReservationSeriesReservationSerializerInput = {
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
  nonSubsidisedPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
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
export enum ReservationState {
  Reservable = "RESERVABLE",
  ReservationClosed = "RESERVATION_CLOSED",
  ScheduledClosing = "SCHEDULED_CLOSING",
  ScheduledPeriod = "SCHEDULED_PERIOD",
  ScheduledReservation = "SCHEDULED_RESERVATION",
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

export type ReservationUnitCancellationRuleNode = Node & {
  /** Seconds before reservations related to this cancellation rule can be cancelled without handling. */
  canBeCancelledTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  needsHandling: Scalars["Boolean"]["output"];
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
  services?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  services?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  spaces?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  state?: Maybe<Scalars["String"]["output"]>;
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
  purposes: Array<PurposeNode>;
  qualifiers: Array<QualifierNode>;
  rank?: Maybe<Scalars["Int"]["output"]>;
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
  reservationSet?: Maybe<Array<ReservationNode>>;
  reservationStartInterval: ReservationStartInterval;
  reservationState?: Maybe<ReservationState>;
  reservationUnitType?: Maybe<ReservationUnitTypeNode>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  resources: Array<ResourceNode>;
  serviceSpecificTerms?: Maybe<TermsOfUseNode>;
  services: Array<ServiceNode>;
  spaces: Array<SpaceNode>;
  state?: Maybe<ReservationUnitState>;
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

export type ReservationUnitNodeReservationSetArgs = {
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
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  /** When pricing is activated */
  begins: Scalars["Date"]["output"];
  /** Maximum price of the reservation unit including VAT */
  highestPrice: Scalars["Decimal"]["output"];
  highestPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  /** Minimum price of the reservation unit including VAT */
  lowestPrice: Scalars["Decimal"]["output"];
  lowestPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** Unit of the price */
  priceUnit: PriceUnit;
  /** What kind of pricing types are available with this reservation unit. */
  pricingType?: Maybe<PricingType>;
  /** Status of the pricing */
  status: Status;
  /** The percentage of tax included in the price */
  taxPercentage: TaxPercentageNode;
};

export type ReservationUnitPricingSerializerInput = {
  /** When pricing is activated */
  begins: Scalars["Date"]["input"];
  /** Maximum price of the reservation unit including VAT */
  highestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  highestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  /** Minimum price of the reservation unit including VAT */
  lowestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  lowestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  /** Unit of the price */
  priceUnit?: InputMaybe<PriceUnit>;
  /** What kind of pricing types are available with this reservation unit. */
  pricingType?: InputMaybe<PricingType>;
  /** Status of the pricing */
  status: Status;
  /** The percentage of tax included in the price */
  taxPercentage?: InputMaybe<Scalars["Int"]["input"]>;
};

/** An enumeration. */
export enum ReservationUnitState {
  Archived = "ARCHIVED",
  Draft = "DRAFT",
  Hidden = "HIDDEN",
  Published = "PUBLISHED",
  ScheduledHiding = "SCHEDULED_HIDING",
  ScheduledPeriod = "SCHEDULED_PERIOD",
  ScheduledPublishing = "SCHEDULED_PUBLISHING",
}

export type ReservationUnitTypeNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** Järjestysnumero, jota käytetään rajapinnan järjestämisessä. */
  rank?: Maybe<Scalars["Int"]["output"]>;
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
  services?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  services?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  spaces?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  state?: Maybe<Scalars["String"]["output"]>;
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
  type?: InputMaybe<ReservationTypeChoice>;
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
  nonSubsidisedPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
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
  type?: Maybe<ReservationTypeChoice>;
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
  bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  locationType?: InputMaybe<LocationType>;
  name: Scalars["String"]["input"];
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  space?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ResourceCreateMutationPayload = {
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
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
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
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
  bufferTimeAfter?: InputMaybe<Scalars["Duration"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Duration"]["input"]>;
  locationType?: InputMaybe<LocationType>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
  space?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ResourceUpdateMutationPayload = {
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
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

export type ServiceNode = Node & {
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  serviceType: ServiceType;
};

export type ServiceSectorNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ServiceSectorNodeConnection = {
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ServiceSectorNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ServiceSectorNode` and its cursor. */
export type ServiceSectorNodeEdge = {
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ServiceSectorNode>;
};

/** An enumeration. */
export enum ServiceSectorPermissionsChoices {
  CanAllocateApplications = "CAN_ALLOCATE_APPLICATIONS",
  CanCommentReservations = "CAN_COMMENT_RESERVATIONS",
  CanCreateStaffReservations = "CAN_CREATE_STAFF_RESERVATIONS",
  CanHandleApplications = "CAN_HANDLE_APPLICATIONS",
  CanManageApplicationRounds = "CAN_MANAGE_APPLICATION_ROUNDS",
  CanManageReservations = "CAN_MANAGE_RESERVATIONS",
  CanManageReservationUnits = "CAN_MANAGE_RESERVATION_UNITS",
  CanManageResources = "CAN_MANAGE_RESOURCES",
  CanManageServiceSectorRoles = "CAN_MANAGE_SERVICE_SECTOR_ROLES",
  CanManageSpaces = "CAN_MANAGE_SPACES",
  CanManageUnits = "CAN_MANAGE_UNITS",
  CanManageUnitRoles = "CAN_MANAGE_UNIT_ROLES",
  CanValidateApplications = "CAN_VALIDATE_APPLICATIONS",
  CanViewReservations = "CAN_VIEW_RESERVATIONS",
  CanViewUsers = "CAN_VIEW_USERS",
}

export type ServiceSectorRoleChoiceNode = Node & {
  code: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  permissions?: Maybe<Array<ServiceSectorRolePermissionNode>>;
  verboseName: Scalars["String"]["output"];
  verboseNameEn?: Maybe<Scalars["String"]["output"]>;
  verboseNameFi?: Maybe<Scalars["String"]["output"]>;
  verboseNameSv?: Maybe<Scalars["String"]["output"]>;
};

export type ServiceSectorRoleNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  role: ServiceSectorRoleChoiceNode;
  serviceSector: ServiceSectorNode;
};

export type ServiceSectorRolePermissionNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  permission?: Maybe<ServiceSectorPermissionsChoices>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

/** An enumeration. */
export enum ServiceType {
  /** Tarjoilu */
  Catering = "CATERING",
  /** Konfiguraatio */
  Configuration = "CONFIGURATION",
  /** Perehdytys */
  Introduction = "INTRODUCTION",
}

export type SetApplicationRoundHandledMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type SetApplicationRoundHandledMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type SpaceCreateMutationInput = {
  building?: InputMaybe<Scalars["Int"]["input"]>;
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
  building?: Maybe<Scalars["Int"]["output"]>;
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
  resourceSet: Array<ResourceNode>;
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

export type SpaceNodeResourceSetArgs = {
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
  building?: InputMaybe<Scalars["Int"]["input"]>;
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
  building?: Maybe<Scalars["Int"]["output"]>;
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
  /** aktiivinen */
  Active = "ACTIVE",
  /** tuleva */
  Future = "FUTURE",
  /** mennyt */
  Past = "PAST",
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

/** An enumeration. */
export enum TargetGroup {
  /** Kaikki */
  All = "ALL",
  /** Sisäinen */
  Internal = "INTERNAL",
  /** Julkinen */
  Public = "PUBLIC",
}

export type TaxPercentageNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** The tax percentage for a price */
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
  serviceSector?: InputMaybe<Scalars["Decimal"]["input"]>;
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
  reservationunitSet: Array<ReservationUnitNode>;
  serviceSectors: Array<ServiceSectorNode>;
  shortDescription: Scalars["String"]["output"];
  shortDescriptionEn?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionFi?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionSv?: Maybe<Scalars["String"]["output"]>;
  spaces: Array<SpaceNode>;
  tprekId?: Maybe<Scalars["String"]["output"]>;
  unitGroups: Array<UnitGroupNode>;
  webPage: Scalars["String"]["output"];
};

export type UnitNodeReservationunitSetArgs = {
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
  keywordGroups?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  reservationState?: InputMaybe<Array<InputMaybe<ReservationState>>>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  state?: InputMaybe<Array<InputMaybe<ReservationUnitState>>>;
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

/** An enumeration. */
export enum UnitPermissionChoices {
  CanAllocateApplications = "CAN_ALLOCATE_APPLICATIONS",
  CanCommentReservations = "CAN_COMMENT_RESERVATIONS",
  CanCreateStaffReservations = "CAN_CREATE_STAFF_RESERVATIONS",
  CanHandleApplications = "CAN_HANDLE_APPLICATIONS",
  CanManageReservations = "CAN_MANAGE_RESERVATIONS",
  CanManageReservationUnits = "CAN_MANAGE_RESERVATION_UNITS",
  CanManageResources = "CAN_MANAGE_RESOURCES",
  CanManageSpaces = "CAN_MANAGE_SPACES",
  CanManageUnits = "CAN_MANAGE_UNITS",
  CanManageUnitRoles = "CAN_MANAGE_UNIT_ROLES",
  CanValidateApplications = "CAN_VALIDATE_APPLICATIONS",
  CanViewReservations = "CAN_VIEW_RESERVATIONS",
  CanViewUsers = "CAN_VIEW_USERS",
}

export type UnitRoleChoiceNode = Node & {
  code: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  permissions?: Maybe<Array<UnitRolePermissionNode>>;
  verboseName: Scalars["String"]["output"];
  verboseNameEn?: Maybe<Scalars["String"]["output"]>;
  verboseNameFi?: Maybe<Scalars["String"]["output"]>;
  verboseNameSv?: Maybe<Scalars["String"]["output"]>;
};

export type UnitRoleNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  role: UnitRoleChoiceNode;
  unit: Array<UnitNode>;
  unitGroup: Array<UnitGroupNode>;
};

export type UnitRoleNodeUnitArgs = {
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
  serviceSector?: InputMaybe<Scalars["Decimal"]["input"]>;
};

export type UnitRolePermissionNode = Node & {
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  permission?: Maybe<UnitPermissionChoices>;
  pk?: Maybe<Scalars["Int"]["output"]>;
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
  /** When pricing is activated */
  begins?: InputMaybe<Scalars["Date"]["input"]>;
  /** Maximum price of the reservation unit including VAT */
  highestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  highestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  /** Minimum price of the reservation unit including VAT */
  lowestPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  lowestPriceNet?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  /** Unit of the price */
  priceUnit?: InputMaybe<PriceUnit>;
  /** What kind of pricing types are available with this reservation unit. */
  pricingType?: InputMaybe<PricingType>;
  /** Status of the pricing */
  status?: InputMaybe<Status>;
  /** The percentage of tax included in the price */
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
  serviceSectorRoles: Array<ServiceSectorRoleNode>;
  unitRoles: Array<UnitRoleNode>;
  /** Vaaditaan. Enintään 150 merkkiä. Vain kirjaimet, numerot ja @/./+/-/_ ovat sallittuja. */
  username: Scalars["String"]["output"];
  uuid: Scalars["UUID"]["output"];
};

export type UserUpdateMutationInput = {
  pk: Scalars["Int"]["input"];
  /** When user wants to receive reservation notification emails. */
  reservationNotification?: InputMaybe<ReservationNotification>;
};

export type UserUpdateMutationPayload = {
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** When user wants to receive reservation notification emails. */
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

export type ReservationInfoContainerFragment = {
  reservationBegins?: string | null;
  reservationEnds?: string | null;
  reservationsMaxDaysBefore?: number | null;
  reservationsMinDaysBefore?: number | null;
  minReservationDuration?: number | null;
  maxReservationDuration?: number | null;
  maxReservationsPerUser?: number | null;
};

export type ReservationInfoCardFragment = {
  pk?: number | null;
  taxPercentageValue?: string | null;
  begin: string;
  end: string;
  state?: ReservationStateChoice | null;
  price?: string | null;
  reservationUnit: Array<{
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
      pricingType?: PricingType | null;
      lowestPrice: string;
      highestPrice: string;
      status: Status;
      taxPercentage: { id: string; pk?: number | null; value: string };
    }>;
  }>;
};

export type OptionsQueryVariables = Exact<{ [key: string]: never }>;

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
  equipments?: {
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
};

export type ApplicationsQueryVariables = Exact<{
  user: Scalars["Int"]["input"];
  status:
    | Array<InputMaybe<ApplicationStatusChoice>>
    | InputMaybe<ApplicationStatusChoice>;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ApplicationOrderingChoices>>
    | InputMaybe<ApplicationOrderingChoices>
  >;
}>;

export type ApplicationsQuery = {
  applications?: {
    edges: Array<{
      node?: {
        id: string;
        pk?: number | null;
        status?: ApplicationStatusChoice | null;
        lastModifiedDate: string;
        applicantType?: ApplicantTypeChoice | null;
        applicationRound: {
          pk?: number | null;
          id: string;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          reservationPeriodBegin: string;
          reservationPeriodEnd: string;
          publicDisplayBegin: string;
          publicDisplayEnd: string;
          applicationPeriodBegin: string;
          applicationPeriodEnd: string;
          status?: ApplicationRoundStatusChoice | null;
          criteriaFi?: string | null;
          criteriaEn?: string | null;
          criteriaSv?: string | null;
          notesWhenApplyingFi?: string | null;
          notesWhenApplyingEn?: string | null;
          notesWhenApplyingSv?: string | null;
          reservationUnits: Array<{
            id: string;
            pk?: number | null;
            unit?: { id: string; pk?: number | null } | null;
          }>;
        };
        user?: { id: string; name?: string | null } | null;
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

export type CreateApplicationMutationVariables = Exact<{
  input: ApplicationCreateMutationInput;
}>;

export type CreateApplicationMutation = {
  createApplication?: { pk?: number | null } | null;
};

export type UpdateApplicationMutationVariables = Exact<{
  input: ApplicationUpdateMutationInput;
}>;

export type UpdateApplicationMutation = {
  updateApplication?: { pk?: number | null } | null;
};

export type SendApplicationMutationVariables = Exact<{
  input: ApplicationSendMutationInput;
}>;

export type SendApplicationMutation = {
  sendApplication?: { pk?: number | null } | null;
};

export type CancelApplicationMutationVariables = Exact<{
  input: ApplicationCancelMutationInput;
}>;

export type CancelApplicationMutation = {
  cancelApplication?: { pk?: number | null } | null;
};

export type ApplicationRoundFieldsFragment = {
  pk?: number | null;
  id: string;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
  publicDisplayBegin: string;
  publicDisplayEnd: string;
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  status?: ApplicationRoundStatusChoice | null;
  criteriaFi?: string | null;
  criteriaEn?: string | null;
  criteriaSv?: string | null;
  notesWhenApplyingFi?: string | null;
  notesWhenApplyingEn?: string | null;
  notesWhenApplyingSv?: string | null;
  reservationUnits: Array<{
    id: string;
    pk?: number | null;
    unit?: { id: string; pk?: number | null } | null;
  }>;
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
        pk?: number | null;
        id: string;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        reservationPeriodBegin: string;
        reservationPeriodEnd: string;
        publicDisplayBegin: string;
        publicDisplayEnd: string;
        applicationPeriodBegin: string;
        applicationPeriodEnd: string;
        status?: ApplicationRoundStatusChoice | null;
        criteriaFi?: string | null;
        criteriaEn?: string | null;
        criteriaSv?: string | null;
        notesWhenApplyingFi?: string | null;
        notesWhenApplyingEn?: string | null;
        notesWhenApplyingSv?: string | null;
        reservationUnits: Array<{
          id: string;
          pk?: number | null;
          unit?: { id: string; pk?: number | null } | null;
        }>;
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

export type UnitFieldsFragment = {
  id: string;
  tprekId?: string | null;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  location?: {
    id: string;
    latitude?: string | null;
    longitude?: string | null;
    addressStreetEn?: string | null;
    addressStreetSv?: string | null;
    addressCityEn?: string | null;
    addressCitySv?: string | null;
    addressStreetFi?: string | null;
    addressZip: string;
    addressCityFi?: string | null;
  } | null;
};

export type ReservationUnitFieldsFragment = {
  id: string;
  pk?: number | null;
  uuid: string;
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
  termsOfUseFi?: string | null;
  termsOfUseEn?: string | null;
  termsOfUseSv?: string | null;
  minPersons?: number | null;
  maxPersons?: number | null;
  unit?: {
    id: string;
    tprekId?: string | null;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    location?: {
      id: string;
      latitude?: string | null;
      longitude?: string | null;
      addressStreetEn?: string | null;
      addressStreetSv?: string | null;
      addressCityEn?: string | null;
      addressCitySv?: string | null;
      addressStreetFi?: string | null;
      addressZip: string;
      addressCityFi?: string | null;
    } | null;
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
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    id: string;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  pricings: Array<{
    id: string;
    begins: string;
    priceUnit: PriceUnit;
    pricingType?: PricingType | null;
    lowestPrice: string;
    highestPrice: string;
    status: Status;
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
  metadataSet?: {
    id: string;
    requiredFields: Array<{ id: string; fieldName: string }>;
    supportedFields: Array<{ id: string; fieldName: string }>;
  } | null;
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
  units?: {
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
        smallUrl?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type CreateReservationMutationVariables = Exact<{
  input: ReservationCreateMutationInput;
}>;

export type CreateReservationMutation = {
  createReservation?: { pk?: number | null; price?: string | null } | null;
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
  input: ReservationDeleteMutationInput;
}>;

export type DeleteReservationMutation = {
  deleteReservation?: { deleted?: boolean | null } | null;
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
  cancellationRule?: {
    id: string;
    canBeCancelledTimeBefore?: number | null;
    needsHandling: boolean;
  } | null;
};

export type ReservationOrderStatusFragment = {
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
  reservationUnit?: InputMaybe<
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
        begin: string;
        end: string;
        state?: ReservationStateChoice | null;
        price?: string | null;
        paymentOrder: Array<{
          id: string;
          orderUuid?: string | null;
          expiresInMinutes?: number | null;
          status?: OrderStatus | null;
        }>;
        reservationUnit: Array<{
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
            needsHandling: boolean;
          } | null;
          pricings: Array<{
            id: string;
            begins: string;
            priceUnit: PriceUnit;
            pricingType?: PricingType | null;
            lowestPrice: string;
            highestPrice: string;
            status: Status;
            taxPercentage: { id: string; pk?: number | null; value: string };
          }>;
        }>;
      } | null;
    } | null>;
  } | null;
};

export type ReservationInfoFragment = {
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
  homeCity?: { id: string; pk?: number | null; name: string } | null;
};

export type ReservationQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationQuery = {
  reservation?: {
    id: string;
    pk?: number | null;
    name?: string | null;
    applyingForFreeOfCharge?: boolean | null;
    freeOfChargeReason?: string | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    begin: string;
    end: string;
    calendarUrl?: string | null;
    state?: ReservationStateChoice | null;
    price?: string | null;
    priceNet?: string | null;
    taxPercentageValue?: string | null;
    isHandled?: boolean | null;
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
    user?: { id: string; email: string; pk?: number | null } | null;
    paymentOrder: Array<{
      id: string;
      orderUuid?: string | null;
      status?: OrderStatus | null;
    }>;
    reservationUnit: Array<{
      id: string;
      canApplyFreeOfCharge: boolean;
      pk?: number | null;
      uuid: string;
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
      termsOfUseFi?: string | null;
      termsOfUseEn?: string | null;
      termsOfUseSv?: string | null;
      minPersons?: number | null;
      maxPersons?: number | null;
      unit?: {
        id: string;
        tprekId?: string | null;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        location?: {
          id: string;
          latitude?: string | null;
          longitude?: string | null;
          addressStreetEn?: string | null;
          addressStreetSv?: string | null;
          addressCityEn?: string | null;
          addressCitySv?: string | null;
          addressStreetFi?: string | null;
          addressZip: string;
          addressCityFi?: string | null;
        } | null;
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
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        id: string;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      pricings: Array<{
        id: string;
        begins: string;
        priceUnit: PriceUnit;
        pricingType?: PricingType | null;
        lowestPrice: string;
        highestPrice: string;
        status: Status;
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
      cancellationRule?: {
        id: string;
        canBeCancelledTimeBefore?: number | null;
        needsHandling: boolean;
      } | null;
      metadataSet?: {
        id: string;
        requiredFields: Array<{ id: string; fieldName: string }>;
        supportedFields: Array<{ id: string; fieldName: string }>;
      } | null;
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
    homeCity?: { id: string; pk?: number | null; name: string } | null;
  } | null;
};

export type ReservationCancelReasonsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type ReservationCancelReasonsQuery = {
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
  isDraft: boolean;
  descriptionFi?: string | null;
  descriptionEn?: string | null;
  descriptionSv?: string | null;
  reservationKind: ReservationKind;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  reservationStartInterval: ReservationStartInterval;
  canApplyFreeOfCharge: boolean;
  state?: ReservationUnitState | null;
  reservationState?: ReservationState | null;
  numActiveUserReservations?: number | null;
  requireReservationHandling: boolean;
  id: string;
  pk?: number | null;
  uuid: string;
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
  termsOfUseFi?: string | null;
  termsOfUseEn?: string | null;
  termsOfUseSv?: string | null;
  reservationBegins?: string | null;
  reservationEnds?: string | null;
  reservationsMaxDaysBefore?: number | null;
  reservationsMinDaysBefore?: number | null;
  minReservationDuration?: number | null;
  maxReservationDuration?: number | null;
  maxReservationsPerUser?: number | null;
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
  applicationRoundTimeSlots: Array<{
    id: string;
    closed: boolean;
    weekday: number;
    reservableTimes?: Array<{ begin: string; end: string } | null> | null;
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
  unit?: {
    id: string;
    tprekId?: string | null;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    location?: {
      id: string;
      latitude?: string | null;
      longitude?: string | null;
      addressStreetEn?: string | null;
      addressStreetSv?: string | null;
      addressCityEn?: string | null;
      addressCitySv?: string | null;
      addressStreetFi?: string | null;
      addressZip: string;
      addressCityFi?: string | null;
    } | null;
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
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    id: string;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  pricings: Array<{
    id: string;
    begins: string;
    priceUnit: PriceUnit;
    pricingType?: PricingType | null;
    lowestPrice: string;
    highestPrice: string;
    status: Status;
    taxPercentage: { id: string; pk?: number | null; value: string };
  }>;
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

export type ReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationUnitQuery = {
  reservationUnit?: {
    isDraft: boolean;
    descriptionFi?: string | null;
    descriptionEn?: string | null;
    descriptionSv?: string | null;
    reservationKind: ReservationKind;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationStartInterval: ReservationStartInterval;
    canApplyFreeOfCharge: boolean;
    state?: ReservationUnitState | null;
    reservationState?: ReservationState | null;
    numActiveUserReservations?: number | null;
    requireReservationHandling: boolean;
    id: string;
    pk?: number | null;
    uuid: string;
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
    termsOfUseFi?: string | null;
    termsOfUseEn?: string | null;
    termsOfUseSv?: string | null;
    reservationBegins?: string | null;
    reservationEnds?: string | null;
    reservationsMaxDaysBefore?: number | null;
    reservationsMinDaysBefore?: number | null;
    minReservationDuration?: number | null;
    maxReservationDuration?: number | null;
    maxReservationsPerUser?: number | null;
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
    applicationRoundTimeSlots: Array<{
      id: string;
      closed: boolean;
      weekday: number;
      reservableTimes?: Array<{ begin: string; end: string } | null> | null;
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
    unit?: {
      id: string;
      tprekId?: string | null;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      location?: {
        id: string;
        latitude?: string | null;
        longitude?: string | null;
        addressStreetEn?: string | null;
        addressStreetSv?: string | null;
        addressCityEn?: string | null;
        addressCitySv?: string | null;
        addressStreetFi?: string | null;
        addressZip: string;
        addressCityFi?: string | null;
      } | null;
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
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      id: string;
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    pricings: Array<{
      id: string;
      begins: string;
      priceUnit: PriceUnit;
      pricingType?: PricingType | null;
      lowestPrice: string;
      highestPrice: string;
      status: Status;
      taxPercentage: { id: string; pk?: number | null; value: string };
    }>;
    metadataSet?: {
      id: string;
      requiredFields: Array<{ id: string; fieldName: string }>;
      supportedFields: Array<{ id: string; fieldName: string }>;
    } | null;
  } | null;
};

export type IsReservableFieldsFragment = {
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  maxReservationDuration?: number | null;
  minReservationDuration?: number | null;
  reservationStartInterval: ReservationStartInterval;
  reservationsMaxDaysBefore?: number | null;
  reservationsMinDaysBefore?: number | null;
  reservationBegins?: string | null;
  reservationEnds?: string | null;
  reservationSet?: Array<{
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
    isDraft: boolean;
    descriptionFi?: string | null;
    descriptionEn?: string | null;
    descriptionSv?: string | null;
    reservationKind: ReservationKind;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationStartInterval: ReservationStartInterval;
    canApplyFreeOfCharge: boolean;
    state?: ReservationUnitState | null;
    reservationState?: ReservationState | null;
    numActiveUserReservations?: number | null;
    requireReservationHandling: boolean;
    maxReservationDuration?: number | null;
    minReservationDuration?: number | null;
    reservationsMaxDaysBefore?: number | null;
    reservationsMinDaysBefore?: number | null;
    reservationBegins?: string | null;
    reservationEnds?: string | null;
    id: string;
    pk?: number | null;
    uuid: string;
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
    termsOfUseFi?: string | null;
    termsOfUseEn?: string | null;
    termsOfUseSv?: string | null;
    maxReservationsPerUser?: number | null;
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
    applicationRoundTimeSlots: Array<{
      id: string;
      closed: boolean;
      weekday: number;
      reservableTimes?: Array<{ begin: string; end: string } | null> | null;
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
    reservationSet?: Array<{
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
    reservableTimeSpans?: Array<{
      startDatetime?: string | null;
      endDatetime?: string | null;
    } | null> | null;
    unit?: {
      id: string;
      tprekId?: string | null;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      location?: {
        id: string;
        latitude?: string | null;
        longitude?: string | null;
        addressStreetEn?: string | null;
        addressStreetSv?: string | null;
        addressCityEn?: string | null;
        addressCitySv?: string | null;
        addressStreetFi?: string | null;
        addressZip: string;
        addressCityFi?: string | null;
      } | null;
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
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      id: string;
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    pricings: Array<{
      id: string;
      begins: string;
      priceUnit: PriceUnit;
      pricingType?: PricingType | null;
      lowestPrice: string;
      highestPrice: string;
      status: Status;
      taxPercentage: { id: string; pk?: number | null; value: string };
    }>;
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
  minPersons?: InputMaybe<Scalars["Decimal"]["input"]>;
  maxPersons?: InputMaybe<Scalars["Decimal"]["input"]>;
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
        maxPersons?: number | null;
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        pricings: Array<{
          id: string;
          begins: string;
          priceUnit: PriceUnit;
          pricingType?: PricingType | null;
          lowestPrice: string;
          highestPrice: string;
          status: Status;
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
          pricingType?: PricingType | null;
          lowestPrice: string;
          highestPrice: string;
          status: Status;
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
  reservationBegins?: string | null;
  reservationEnds?: string | null;
  pricings: Array<{
    id: string;
    begins: string;
    priceUnit: PriceUnit;
    pricingType?: PricingType | null;
    lowestPrice: string;
    highestPrice: string;
    status: Status;
    taxPercentage: { id: string; pk?: number | null; value: string };
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

export type ApplicationQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationQuery = {
  application?: {
    id: string;
    pk?: number | null;
    status?: ApplicationStatusChoice | null;
    lastModifiedDate: string;
    applicantType?: ApplicantTypeChoice | null;
    additionalInformation?: string | null;
    applicationRound: {
      id: string;
      notesWhenApplyingFi?: string | null;
      notesWhenApplyingEn?: string | null;
      notesWhenApplyingSv?: string | null;
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
            reservableTimes?: Array<{
              begin: string;
              end: string;
            } | null> | null;
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
  pricingType?: PricingType | null;
  lowestPrice: string;
  highestPrice: string;
  status: Status;
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

export const PricingFieldsFragmentDoc = gql`
  fragment PricingFields on ReservationUnitPricingNode {
    id
    begins
    priceUnit
    pricingType
    lowestPrice
    highestPrice
    taxPercentage {
      id
      pk
      value
    }
    status
  }
`;
export const PriceReservationUnitFragmentDoc = gql`
  fragment PriceReservationUnit on ReservationUnitNode {
    pricings {
      ...PricingFields
    }
    reservationBegins
    reservationEnds
  }
  ${PricingFieldsFragmentDoc}
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
export const ReservationInfoCardFragmentDoc = gql`
  fragment ReservationInfoCard on ReservationNode {
    pk
    taxPercentageValue
    begin
    end
    state
    price
    reservationUnit {
      id
      pk
      nameFi
      nameEn
      nameSv
      ...PriceReservationUnit
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
  ${PriceReservationUnitFragmentDoc}
  ${ImageFragmentDoc}
`;
export const ApplicationRoundFieldsFragmentDoc = gql`
  fragment ApplicationRoundFields on ApplicationRoundNode {
    pk
    id
    nameFi
    nameEn
    nameSv
    reservationPeriodBegin
    reservationPeriodEnd
    publicDisplayBegin
    publicDisplayEnd
    applicationPeriodBegin
    applicationPeriodEnd
    status
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
`;
export const CancellationRuleFieldsFragmentDoc = gql`
  fragment CancellationRuleFields on ReservationUnitNode {
    cancellationRule {
      id
      canBeCancelledTimeBefore
      needsHandling
    }
  }
`;
export const ReservationOrderStatusFragmentDoc = gql`
  fragment ReservationOrderStatus on ReservationNode {
    state
    paymentOrder {
      id
      status
    }
  }
`;
export const ReservationInfoFragmentDoc = gql`
  fragment ReservationInfo on ReservationNode {
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
    homeCity {
      id
      pk
      name
    }
    numPersons
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
export const UnitFieldsFragmentDoc = gql`
  fragment UnitFields on UnitNode {
    ...UnitNameFieldsI18N
    id
    tprekId
    location {
      id
      latitude
      longitude
    }
  }
  ${UnitNameFieldsI18NFragmentDoc}
`;
export const TermsOfUseTextFieldsFragmentDoc = gql`
  fragment TermsOfUseTextFields on TermsOfUseNode {
    id
    textFi
    textEn
    textSv
  }
`;
export const TermsOfUseNameFieldsFragmentDoc = gql`
  fragment TermsOfUseNameFields on TermsOfUseNode {
    nameFi
    nameEn
    nameSv
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
export const ReservationUnitFieldsFragmentDoc = gql`
  fragment ReservationUnitFields on ReservationUnitNode {
    unit {
      ...UnitFields
    }
    id
    pk
    uuid
    nameFi
    nameEn
    nameSv
    reservationPendingInstructionsFi
    reservationPendingInstructionsEn
    reservationPendingInstructionsSv
    reservationConfirmedInstructionsFi
    reservationConfirmedInstructionsEn
    reservationConfirmedInstructionsSv
    reservationCancelledInstructionsFi
    reservationCancelledInstructionsEn
    reservationCancelledInstructionsSv
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
    pricings {
      ...PricingFields
    }
    images {
      ...Image
    }
    ...MetadataSets
  }
  ${UnitFieldsFragmentDoc}
  ${TermsOfUseTextFieldsFragmentDoc}
  ${TermsOfUseNameFieldsFragmentDoc}
  ${PricingFieldsFragmentDoc}
  ${ImageFragmentDoc}
  ${MetadataSetsFragmentDoc}
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
    ...ReservationUnitFields
    isDraft
    images {
      ...Image
    }
    applicationRoundTimeSlots {
      id
      closed
      weekday
      reservableTimes {
        begin
        end
      }
    }
    descriptionFi
    descriptionEn
    descriptionSv
    reservationKind
    bufferTimeBefore
    bufferTimeAfter
    reservationStartInterval
    canApplyFreeOfCharge
    state
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
  }
  ${ReservationUnitFieldsFragmentDoc}
  ${ImageFragmentDoc}
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
    reservationSet(state: $state) {
      ...BlockingReservationFields
    }
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
  ${BlockingReservationFieldsFragmentDoc}
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
  }
  ${ReservationUnitNameFieldsFragmentDoc}
  ${UnitNameFieldsI18NFragmentDoc}
  ${ReservationUnitTypeFieldsFragmentDoc}
  ${ImageFragmentDoc}
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
export const OptionsDocument = gql`
  query Options {
    reservationUnitTypes {
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
    purposes {
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
    reservationPurposes {
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
    equipments {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    OptionsQuery,
    OptionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const ApplicationsDocument = gql`
  query Applications(
    $user: Int!
    $status: [ApplicationStatusChoice]!
    $orderBy: [ApplicationOrderingChoices] = []
  ) {
    applications(user: $user, status: $status, orderBy: $orderBy) {
      edges {
        node {
          id
          pk
          applicationRound {
            ...ApplicationRoundFields
          }
          user {
            id
            name
          }
          status
          ...ApplicationName
          lastModifiedDate
        }
      }
    }
  }
  ${ApplicationRoundFieldsFragmentDoc}
  ${ApplicationNameFragmentDoc}
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationsQuery,
    ApplicationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationRoundPeriodsQuery,
    ApplicationRoundPeriodsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationRoundsUiQuery,
    ApplicationRoundsUiQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const SearchFormParamsUnitDocument = gql`
  query SearchFormParamsUnit(
    $publishedReservationUnits: Boolean
    $ownReservations: Boolean
    $onlyDirectBookable: Boolean
    $onlySeasonalBookable: Boolean
    $orderBy: [UnitOrderingChoices]
  ) {
    units(
      publishedReservationUnits: $publishedReservationUnits
      ownReservations: $ownReservations
      onlyDirectBookable: $onlyDirectBookable
      onlySeasonalBookable: $onlySeasonalBookable
      orderBy: $orderBy
    ) {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    SearchFormParamsUnitQuery,
    SearchFormParamsUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const ReservationUnitPurposesDocument = gql`
  query ReservationUnitPurposes($orderBy: [PurposeOrderingChoices]) {
    purposes(orderBy: $orderBy) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
          smallUrl
        }
      }
    }
  }
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationUnitPurposesQuery,
    ReservationUnitPurposesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const CreateReservationDocument = gql`
  mutation CreateReservation($input: ReservationCreateMutationInput!) {
    createReservation(input: $input) {
      pk
      price
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
  mutation DeleteReservation($input: ReservationDeleteMutationInput!) {
    deleteReservation(input: $input) {
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
    $reservationUnit: [Int]
    $orderBy: [ReservationOrderingChoices]
    $reservationType: [ReservationTypeChoice]!
  ) {
    reservations(
      beginDate: $beginDate
      endDate: $endDate
      state: $state
      user: $user
      reservationUnit: $reservationUnit
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
            orderUuid
            expiresInMinutes
            status
          }
          isBlocked
          reservationUnit {
            id
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
 *      reservationUnit: // value for 'reservationUnit'
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ListReservationsQuery,
    ListReservationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const ReservationDocument = gql`
  query Reservation($id: ID!) {
    reservation(id: $id) {
      id
      pk
      name
      ...ReserveeNameFields
      ...ReserveeBillingFields
      ...ReservationInfo
      applyingForFreeOfCharge
      freeOfChargeReason
      bufferTimeBefore
      bufferTimeAfter
      begin
      end
      calendarUrl
      user {
        id
        email
        pk
      }
      state
      price
      priceNet
      taxPercentageValue
      paymentOrder {
        id
        orderUuid
        status
      }
      reservationUnit {
        id
        canApplyFreeOfCharge
        ...ReservationUnitFields
        ...CancellationRuleFields
      }
      isHandled
    }
  }
  ${ReserveeNameFieldsFragmentDoc}
  ${ReserveeBillingFieldsFragmentDoc}
  ${ReservationInfoFragmentDoc}
  ${ReservationUnitFieldsFragmentDoc}
  ${CancellationRuleFieldsFragmentDoc}
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationQuery,
    ReservationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const ReservationCancelReasonsDocument = gql`
  query ReservationCancelReasons {
    reservationCancelReasons {
      edges {
        node {
          id
          pk
          reasonFi
          reasonEn
          reasonSv
        }
      }
    }
  }
`;

/**
 * __useReservationCancelReasonsQuery__
 *
 * To run a query within a React component, call `useReservationCancelReasonsQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationCancelReasonsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationCancelReasonsQuery({
 *   variables: {
 *   },
 * });
 */
export function useReservationCancelReasonsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ReservationCancelReasonsQuery,
    ReservationCancelReasonsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationCancelReasonsQuery,
    ReservationCancelReasonsQueryVariables
  >(ReservationCancelReasonsDocument, options);
}
export function useReservationCancelReasonsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationCancelReasonsQuery,
    ReservationCancelReasonsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationCancelReasonsQuery,
    ReservationCancelReasonsQueryVariables
  >(ReservationCancelReasonsDocument, options);
}
export function useReservationCancelReasonsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationCancelReasonsQuery,
    ReservationCancelReasonsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ReservationCancelReasonsQuery,
    ReservationCancelReasonsQueryVariables
  >(ReservationCancelReasonsDocument, options);
}
export type ReservationCancelReasonsQueryHookResult = ReturnType<
  typeof useReservationCancelReasonsQuery
>;
export type ReservationCancelReasonsLazyQueryHookResult = ReturnType<
  typeof useReservationCancelReasonsLazyQuery
>;
export type ReservationCancelReasonsSuspenseQueryHookResult = ReturnType<
  typeof useReservationCancelReasonsSuspenseQuery
>;
export type ReservationCancelReasonsQueryResult = Apollo.QueryResult<
  ReservationCancelReasonsQuery,
  ReservationCancelReasonsQueryVariables
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
      id
      reservationPk
      status
      paymentType
      receiptUrl
      checkoutUrl
    }
  }
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<OrderQuery, OrderQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const ReservationUnitDocument = gql`
  query ReservationUnit($id: ID!) {
    reservationUnit(id: $id) {
      ...ReservationUnitPageFields
    }
  }
  ${ReservationUnitPageFieldsFragmentDoc}
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationUnitQuery,
    ReservationUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationUnitPageQuery,
    ReservationUnitPageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
    $minPersons: Decimal
    $maxPersons: Decimal
    $unit: [Int]
    $reservationUnitType: [Int]
    $purposes: [Int]
    $equipments: [Int]
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
      maxPersonsGte: $minPersons
      minPersonsGte: $minPersons
      maxPersonsLte: $maxPersons
      minPersonsLte: $maxPersons
      unit: $unit
      reservationUnitType: $reservationUnitType
      purposes: $purposes
      equipments: $equipments
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
 *      minPersons: // value for 'minPersons'
 *      maxPersons: // value for 'maxPersons'
 *      unit: // value for 'unit'
 *      reservationUnitType: // value for 'reservationUnitType'
 *      purposes: // value for 'purposes'
 *      equipments: // value for 'equipments'
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    SearchReservationUnitsQuery,
    SearchReservationUnitsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    RelatedReservationUnitsQuery,
    RelatedReservationUnitsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    CurrentUserQuery,
    CurrentUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    BannerNotificationsListAllQuery,
    BannerNotificationsListAllQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    BannerNotificationsListQuery,
    BannerNotificationsListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const ApplicationDocument = gql`
  query Application($id: ID!) {
    application(id: $id) {
      ...ApplicationCommon
      applicationRound {
        id
        notesWhenApplyingFi
        notesWhenApplyingEn
        notesWhenApplyingSv
        termsOfUse {
          id
          ...TermsOfUseFields
        }
      }
    }
  }
  ${ApplicationCommonFragmentDoc}
  ${TermsOfUseFieldsFragmentDoc}
`;

/**
 * __useApplicationQuery__
 *
 * To run a query within a React component, call `useApplicationQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApplicationQuery(
  baseOptions: Apollo.QueryHookOptions<
    ApplicationQuery,
    ApplicationQueryVariables
  > &
    (
      | { variables: ApplicationQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ApplicationQuery, ApplicationQueryVariables>(
    ApplicationDocument,
    options
  );
}
export function useApplicationLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ApplicationQuery,
    ApplicationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ApplicationQuery, ApplicationQueryVariables>(
    ApplicationDocument,
    options
  );
}
export function useApplicationSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationQuery,
    ApplicationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<ApplicationQuery, ApplicationQueryVariables>(
    ApplicationDocument,
    options
  );
}
export type ApplicationQueryHookResult = ReturnType<typeof useApplicationQuery>;
export type ApplicationLazyQueryHookResult = ReturnType<
  typeof useApplicationLazyQuery
>;
export type ApplicationSuspenseQueryHookResult = ReturnType<
  typeof useApplicationSuspenseQuery
>;
export type ApplicationQueryResult = Apollo.QueryResult<
  ApplicationQuery,
  ApplicationQueryVariables
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    TermsOfUseQuery,
    TermsOfUseQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
