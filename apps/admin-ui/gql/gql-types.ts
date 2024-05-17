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
  __typename?: "AbilityGroupNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type AddressNode = Node & {
  __typename?: "AddressNode";
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
  __typename?: "AgeGroupNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  maximum?: Maybe<Scalars["Int"]["output"]>;
  minimum: Scalars["Int"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type AgeGroupNodeConnection = {
  __typename?: "AgeGroupNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<AgeGroupNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `AgeGroupNode` and its cursor. */
export type AgeGroupNodeEdge = {
  __typename?: "AgeGroupNodeEdge";
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
  __typename?: "AllocatedTimeSlotCreateMutationPayload";
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
  __typename?: "AllocatedTimeSlotDeleteMutationPayload";
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type AllocatedTimeSlotNode = Node & {
  __typename?: "AllocatedTimeSlotNode";
  beginTime: Scalars["Time"]["output"];
  dayOfTheWeek: Weekday;
  endTime: Scalars["Time"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationUnitOption: ReservationUnitOptionNode;
};

export type AllocatedTimeSlotNodeConnection = {
  __typename?: "AllocatedTimeSlotNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<AllocatedTimeSlotNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `AllocatedTimeSlotNode` and its cursor. */
export type AllocatedTimeSlotNodeEdge = {
  __typename?: "AllocatedTimeSlotNodeEdge";
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
  __typename?: "ApplicantNode";
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
  __typename?: "ApplicationCancelMutationPayload";
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
  __typename?: "ApplicationCreateMutationPayload";
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
  __typename?: "ApplicationNode";
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
  __typename?: "ApplicationNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ApplicationNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ApplicationNode` and its cursor. */
export type ApplicationNodeEdge = {
  __typename?: "ApplicationNodeEdge";
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
  __typename?: "ApplicationRoundNode";
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
  reservationState?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
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
  __typename?: "ApplicationRoundNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ApplicationRoundNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ApplicationRoundNode` and its cursor. */
export type ApplicationRoundNodeEdge = {
  __typename?: "ApplicationRoundNodeEdge";
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
export enum ApplicationRoundStatusChoice {
  Handled = "HANDLED",
  InAllocation = "IN_ALLOCATION",
  Open = "OPEN",
  ResultsSent = "RESULTS_SENT",
  Upcoming = "UPCOMING",
}

export type ApplicationRoundTimeSlotNode = Node & {
  __typename?: "ApplicationRoundTimeSlotNode";
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
  __typename?: "ApplicationSectionCreateMutationPayload";
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
  __typename?: "ApplicationSectionDeleteMutationPayload";
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
  __typename?: "ApplicationSectionNode";
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
  __typename?: "ApplicationSectionNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ApplicationSectionNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ApplicationSectionNode` and its cursor. */
export type ApplicationSectionNodeEdge = {
  __typename?: "ApplicationSectionNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ApplicationSectionNode>;
};

/** Ordering fields for the 'ApplicationSection' model. */
export enum ApplicationSectionOrderingChoices {
  ApplicantAsc = "applicantAsc",
  ApplicantDesc = "applicantDesc",
  ApplicationPkAsc = "applicationPkAsc",
  ApplicationPkDesc = "applicationPkDesc",
  ApplicationStatusAsc = "applicationStatusAsc",
  ApplicationStatusDesc = "applicationStatusDesc",
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
  Failed = "FAILED",
  Handled = "HANDLED",
  InAllocation = "IN_ALLOCATION",
  Reserved = "RESERVED",
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
  __typename?: "ApplicationSectionUpdateMutationPayload";
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
  __typename?: "ApplicationSendMutationPayload";
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
  __typename?: "ApplicationUpdateMutationPayload";
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
  __typename?: "BannerNotificationCreateMutationPayload";
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
  __typename?: "BannerNotificationDeleteMutationPayload";
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
  __typename?: "BannerNotificationNode";
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
  __typename?: "BannerNotificationNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<BannerNotificationNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `BannerNotificationNode` and its cursor. */
export type BannerNotificationNodeEdge = {
  __typename?: "BannerNotificationNodeEdge";
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
  __typename?: "BannerNotificationUpdateMutationPayload";
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
  __typename?: "CityNode";
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
  __typename?: "CityNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<CityNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `CityNode` and its cursor. */
export type CityNodeEdge = {
  __typename?: "CityNodeEdge";
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

/** Debugging information for the current query. */
export type DjangoDebug = {
  __typename?: "DjangoDebug";
  /** Raise exceptions for this API query. */
  exceptions?: Maybe<Array<Maybe<DjangoDebugException>>>;
  /** Executed SQL queries for this API query. */
  sql?: Maybe<Array<Maybe<DjangoDebugSql>>>;
};

/** Represents a single exception raised. */
export type DjangoDebugException = {
  __typename?: "DjangoDebugException";
  /** The class of the exception */
  excType: Scalars["String"]["output"];
  /** The message of the exception */
  message: Scalars["String"]["output"];
  /** The stack trace */
  stack: Scalars["String"]["output"];
};

/** Represents a single database query made to a Django managed DB. */
export type DjangoDebugSql = {
  __typename?: "DjangoDebugSQL";
  /** The Django database alias (e.g. 'default'). */
  alias: Scalars["String"]["output"];
  /** Duration of this database query in seconds. */
  duration: Scalars["Float"]["output"];
  /** Postgres connection encoding if available. */
  encoding?: Maybe<Scalars["String"]["output"]>;
  /** Whether this database query was a SELECT. */
  isSelect: Scalars["Boolean"]["output"];
  /** Whether this database query took more than 10 seconds. */
  isSlow: Scalars["Boolean"]["output"];
  /** Postgres isolation level if available. */
  isoLevel?: Maybe<Scalars["String"]["output"]>;
  /** JSON encoded database query parameters. */
  params: Scalars["String"]["output"];
  /** The raw SQL of this query, without params. */
  rawSql: Scalars["String"]["output"];
  /** The actual SQL sent to this database. */
  sql?: Maybe<Scalars["String"]["output"]>;
  /** Start time of this database query. */
  startTime: Scalars["Float"]["output"];
  /** Stop time of this database query. */
  stopTime: Scalars["Float"]["output"];
  /** Postgres transaction ID if available. */
  transId?: Maybe<Scalars["String"]["output"]>;
  /** Postgres transaction status if available. */
  transStatus?: Maybe<Scalars["String"]["output"]>;
  /** The type of database being used (e.g. postrgesql, mysql, sqlite). */
  vendor: Scalars["String"]["output"];
};

export type EquipmentCategoryCreateMutationInput = {
  name: Scalars["String"]["input"];
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type EquipmentCategoryCreateMutationPayload = {
  __typename?: "EquipmentCategoryCreateMutationPayload";
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
  __typename?: "EquipmentCategoryDeleteMutationPayload";
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type EquipmentCategoryNode = Node & {
  __typename?: "EquipmentCategoryNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCategoryNodeConnection = {
  __typename?: "EquipmentCategoryNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<EquipmentCategoryNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `EquipmentCategoryNode` and its cursor. */
export type EquipmentCategoryNodeEdge = {
  __typename?: "EquipmentCategoryNodeEdge";
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
  __typename?: "EquipmentCategoryUpdateMutationPayload";
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
  __typename?: "EquipmentCreateMutationPayload";
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
  __typename?: "EquipmentDeleteMutationPayload";
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type EquipmentNode = Node & {
  __typename?: "EquipmentNode";
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
  __typename?: "EquipmentNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<EquipmentNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `EquipmentNode` and its cursor. */
export type EquipmentNodeEdge = {
  __typename?: "EquipmentNodeEdge";
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
  __typename?: "EquipmentUpdateMutationPayload";
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
  __typename?: "GeneralRoleChoiceNode";
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
  __typename?: "GeneralRoleNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  role: GeneralRoleChoiceNode;
};

export type GeneralRolePermissionNode = Node & {
  __typename?: "GeneralRolePermissionNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  permission?: Maybe<GeneralPermissionChoices>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type HelsinkiProfileDataNode = {
  __typename?: "HelsinkiProfileDataNode";
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
  __typename?: "KeywordCategoryNode";
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
  __typename?: "KeywordCategoryNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordCategoryNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `KeywordCategoryNode` and its cursor. */
export type KeywordCategoryNodeEdge = {
  __typename?: "KeywordCategoryNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<KeywordCategoryNode>;
};

export type KeywordGroupNode = Node & {
  __typename?: "KeywordGroupNode";
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
  __typename?: "KeywordGroupNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordGroupNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `KeywordGroupNode` and its cursor. */
export type KeywordGroupNodeEdge = {
  __typename?: "KeywordGroupNodeEdge";
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
  __typename?: "KeywordNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type KeywordNodeConnection = {
  __typename?: "KeywordNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `KeywordNode` and its cursor. */
export type KeywordNodeEdge = {
  __typename?: "KeywordNodeEdge";
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
  __typename?: "LocationNode";
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
  __typename?: "Mutation";
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

export type OrganisationNode = Node & {
  __typename?: "OrganisationNode";
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
  __typename?: "PageInfo";
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
  __typename?: "PaymentMerchantNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["UUID"]["output"]>;
};

export type PaymentOrderNode = Node & {
  __typename?: "PaymentOrderNode";
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
  __typename?: "PaymentProductNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  /** Merchant used for payments */
  merchant?: Maybe<PaymentMerchantNode>;
  pk?: Maybe<Scalars["UUID"]["output"]>;
};

/** An enumeration. */
export enum PaymentType {
  /** Lasku */
  Invoice = "INVOICE",
  /** Verkossa */
  Online = "ONLINE",
  /** Paikan päällä */
  OnSite = "ON_SITE",
}

export type PersonNode = Node & {
  __typename?: "PersonNode";
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
  /** Free */
  Free = "FREE",
  /** Paid */
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
  __typename?: "PurposeCreateMutationPayload";
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type PurposeNode = Node & {
  __typename?: "PurposeNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  imageUrl?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** Järjestysnumero, jota käytetään rajapinnan järjestämisessä. */
  rank?: Maybe<Scalars["Int"]["output"]>;
  smallUrl?: Maybe<Scalars["String"]["output"]>;
};

export type PurposeNodeConnection = {
  __typename?: "PurposeNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<PurposeNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `PurposeNode` and its cursor. */
export type PurposeNodeEdge = {
  __typename?: "PurposeNodeEdge";
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
  __typename?: "PurposeUpdateMutationPayload";
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type QualifierNode = Node & {
  __typename?: "QualifierNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type QualifierNodeConnection = {
  __typename?: "QualifierNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<QualifierNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `QualifierNode` and its cursor. */
export type QualifierNodeEdge = {
  __typename?: "QualifierNodeEdge";
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
  __typename?: "Query";
  _debug?: Maybe<DjangoDebug>;
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
  units?: Maybe<UnitNodeConnection>;
  user?: Maybe<UserNode>;
};

export type QueryAffectingAllocatedTimeSlotsArgs = {
  beginDate: Scalars["Date"]["input"];
  endDate: Scalars["Date"]["input"];
  reservationUnit: Scalars["Int"]["input"];
};

export type QueryAffectingReservationsArgs = {
  begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  begin_Gte?: InputMaybe<Scalars["DateTime"]["input"]>;
  begin_Lte?: InputMaybe<Scalars["DateTime"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  forReservationUnits?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  forUnits?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<Scalars["ID"]["input"]>;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  user?: InputMaybe<Scalars["ID"]["input"]>;
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
  reservationState?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
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
  before?: InputMaybe<Scalars["String"]["input"]>;
  begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  begin_Gte?: InputMaybe<Scalars["DateTime"]["input"]>;
  begin_Lte?: InputMaybe<Scalars["DateTime"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<Scalars["ID"]["input"]>;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  user?: InputMaybe<Scalars["ID"]["input"]>;
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
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  beginTime?: InputMaybe<Scalars["Time"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  endTime?: InputMaybe<Scalars["Time"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  recurrenceInDays?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit: Scalars["Int"]["input"];
  user?: InputMaybe<Scalars["Int"]["input"]>;
  weekdays?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type RecurringReservationCreateMutationPayload = {
  __typename?: "RecurringReservationCreateMutationPayload";
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
  user?: Maybe<Scalars["Int"]["output"]>;
  weekdays?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type RecurringReservationNode = Node & {
  __typename?: "RecurringReservationNode";
  abilityGroup?: Maybe<AbilityGroupNode>;
  ageGroup?: Maybe<AgeGroupNode>;
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
  reservationUnit: ReservationUnitNode;
  reservations: Array<ReservationNode>;
  user?: Maybe<UserNode>;
  weekdays?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type RecurringReservationNodeReservationsArgs = {
  begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  begin_Gte?: InputMaybe<Scalars["DateTime"]["input"]>;
  begin_Lte?: InputMaybe<Scalars["DateTime"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<Scalars["ID"]["input"]>;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  user?: InputMaybe<Scalars["ID"]["input"]>;
};

export type RecurringReservationNodeConnection = {
  __typename?: "RecurringReservationNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<RecurringReservationNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `RecurringReservationNode` and its cursor. */
export type RecurringReservationNodeEdge = {
  __typename?: "RecurringReservationNodeEdge";
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
  user?: InputMaybe<Scalars["Int"]["input"]>;
  weekdays?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type RecurringReservationUpdateMutationPayload = {
  __typename?: "RecurringReservationUpdateMutationPayload";
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
  user?: Maybe<Scalars["Int"]["output"]>;
  weekdays?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type RefreshOrderMutationInput = {
  orderUuid: Scalars["String"]["input"];
};

export type RefreshOrderMutationPayload = {
  __typename?: "RefreshOrderMutationPayload";
  orderUuid?: Maybe<Scalars["String"]["output"]>;
  reservationPk?: Maybe<Scalars["Int"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
};

export type RejectAllApplicationOptionsMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type RejectAllApplicationOptionsMutationPayload = {
  __typename?: "RejectAllApplicationOptionsMutationPayload";
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type RejectAllSectionOptionsMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type RejectAllSectionOptionsMutationPayload = {
  __typename?: "RejectAllSectionOptionsMutationPayload";
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservableTimeSpanType = {
  __typename?: "ReservableTimeSpanType";
  endDatetime?: Maybe<Scalars["DateTime"]["output"]>;
  startDatetime?: Maybe<Scalars["DateTime"]["output"]>;
};

export type ReservationAdjustTimeMutationInput = {
  begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  end?: InputMaybe<Scalars["DateTime"]["input"]>;
  pk: Scalars["Int"]["input"];
  state?: InputMaybe<State>;
};

export type ReservationAdjustTimeMutationPayload = {
  __typename?: "ReservationAdjustTimeMutationPayload";
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<State>;
};

export type ReservationApproveMutationInput = {
  handlingDetails: Scalars["String"]["input"];
  pk: Scalars["Int"]["input"];
  price: Scalars["Decimal"]["input"];
  priceNet: Scalars["Decimal"]["input"];
};

export type ReservationApproveMutationPayload = {
  __typename?: "ReservationApproveMutationPayload";
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  handlingDetails?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
  state?: Maybe<State>;
};

export type ReservationCancelReasonNode = Node & {
  __typename?: "ReservationCancelReasonNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reason: Scalars["String"]["output"];
  reasonEn?: Maybe<Scalars["String"]["output"]>;
  reasonFi?: Maybe<Scalars["String"]["output"]>;
  reasonSv?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationCancelReasonNodeConnection = {
  __typename?: "ReservationCancelReasonNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationCancelReasonNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationCancelReasonNode` and its cursor. */
export type ReservationCancelReasonNodeEdge = {
  __typename?: "ReservationCancelReasonNodeEdge";
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
  __typename?: "ReservationCancellationMutationPayload";
  cancelDetails?: Maybe<Scalars["String"]["output"]>;
  cancelReason?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<State>;
};

export type ReservationConfirmMutationInput = {
  /** Type of the payment. Possible values are ONLINE, INVOICE, ON_SITE. */
  paymentType?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ReservationConfirmMutationPayload = {
  __typename?: "ReservationConfirmMutationPayload";
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
  reserveeType?: Maybe<Scalars["String"]["output"]>;
  /** String value for ReservationType's ReservationState enum. Possible values are CREATED, CANCELLED, REQUIRES_HANDLING, WAITING_FOR_PAYMENT, CONFIRMED, DENIED. */
  state?: Maybe<Scalars["String"]["output"]>;
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
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
  reserveeType?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationCreateMutationPayload = {
  __typename?: "ReservationCreateMutationPayload";
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
  reserveeType?: Maybe<Scalars["String"]["output"]>;
  state?: Maybe<Scalars["String"]["output"]>;
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
};

export type ReservationDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type ReservationDeleteMutationPayload = {
  __typename?: "ReservationDeleteMutationPayload";
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type ReservationDenyMutationInput = {
  denyReason: Scalars["Int"]["input"];
  handlingDetails: Scalars["String"]["input"];
  pk: Scalars["Int"]["input"];
};

export type ReservationDenyMutationPayload = {
  __typename?: "ReservationDenyMutationPayload";
  denyReason?: Maybe<Scalars["Int"]["output"]>;
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  handlingDetails?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<State>;
};

export type ReservationDenyReasonNode = Node & {
  __typename?: "ReservationDenyReasonNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reason: Scalars["String"]["output"];
  reasonEn?: Maybe<Scalars["String"]["output"]>;
  reasonFi?: Maybe<Scalars["String"]["output"]>;
  reasonSv?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationDenyReasonNodeConnection = {
  __typename?: "ReservationDenyReasonNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationDenyReasonNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationDenyReasonNode` and its cursor. */
export type ReservationDenyReasonNodeEdge = {
  __typename?: "ReservationDenyReasonNodeEdge";
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
  /** Direct */
  Direct = "DIRECT",
  /** Direct And Season */
  DirectAndSeason = "DIRECT_AND_SEASON",
  /** Season */
  Season = "SEASON",
}

export type ReservationMetadataFieldNode = Node & {
  __typename?: "ReservationMetadataFieldNode";
  fieldName: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationMetadataSetNode = Node & {
  __typename?: "ReservationMetadataSetNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  requiredFields: Array<ReservationMetadataFieldNode>;
  supportedFields: Array<ReservationMetadataFieldNode>;
};

export type ReservationMetadataSetNodeConnection = {
  __typename?: "ReservationMetadataSetNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationMetadataSetNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationMetadataSetNode` and its cursor. */
export type ReservationMetadataSetNodeEdge = {
  __typename?: "ReservationMetadataSetNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationMetadataSetNode>;
};

export type ReservationNode = Node & {
  __typename?: "ReservationNode";
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
  order?: Maybe<PaymentOrderNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Decimal"]["output"]>;
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
  purpose?: Maybe<ReservationPurposeNode>;
  recurringReservation?: Maybe<RecurringReservationNode>;
  reservationUnit?: Maybe<Array<ReservationUnitNode>>;
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
  /** @deprecated Please refer to type. */
  staffEvent?: Maybe<Scalars["Boolean"]["output"]>;
  state: State;
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
  reservationState?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
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
  __typename?: "ReservationNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationNode` and its cursor. */
export type ReservationNodeEdge = {
  __typename?: "ReservationNodeEdge";
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
  __typename?: "ReservationPurposeNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationPurposeNodeConnection = {
  __typename?: "ReservationPurposeNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationPurposeNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationPurposeNode` and its cursor. */
export type ReservationPurposeNodeEdge = {
  __typename?: "ReservationPurposeNodeEdge";
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
  __typename?: "ReservationRefundMutationPayload";
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationRequiresHandlingMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type ReservationRequiresHandlingMutationPayload = {
  __typename?: "ReservationRequiresHandlingMutationPayload";
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<State>;
};

export type ReservationStaffAdjustTimeMutationInput = {
  begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeAfter?: InputMaybe<Scalars["String"]["input"]>;
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeBefore?: InputMaybe<Scalars["String"]["input"]>;
  end?: InputMaybe<Scalars["DateTime"]["input"]>;
  pk: Scalars["Int"]["input"];
  state?: InputMaybe<State>;
};

export type ReservationStaffAdjustTimeMutationPayload = {
  __typename?: "ReservationStaffAdjustTimeMutationPayload";
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeAfter?: Maybe<Scalars["String"]["output"]>;
  /** Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined value means buffer from reservation unit is used. */
  bufferTimeBefore?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<State>;
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
  reserveeType?: InputMaybe<Scalars["String"]["input"]>;
  type: Scalars["String"]["input"];
  unitPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationStaffCreateMutationPayload = {
  __typename?: "ReservationStaffCreateMutationPayload";
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
  reserveeType?: Maybe<Scalars["String"]["output"]>;
  state?: Maybe<State>;
  type?: Maybe<Scalars["String"]["output"]>;
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
  reserveeLanguage?: InputMaybe<Scalars["String"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<Scalars["String"]["input"]>;
  /** String value for ReservationType's ReservationState enum. Possible values are CREATED, CANCELLED, REQUIRES_HANDLING, WAITING_FOR_PAYMENT, CONFIRMED, DENIED. */
  state?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationStaffModifyMutationPayload = {
  __typename?: "ReservationStaffModifyMutationPayload";
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
  reserveeType?: Maybe<Scalars["String"]["output"]>;
  /** String value for ReservationType's ReservationState enum. Possible values are CREATED, CANCELLED, REQUIRES_HANDLING, WAITING_FOR_PAYMENT, CONFIRMED, DENIED. */
  state?: Maybe<Scalars["String"]["output"]>;
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
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
export enum ReservationTypeChoice {
  Behalf = "BEHALF",
  Blocked = "BLOCKED",
  Normal = "NORMAL",
  Staff = "STAFF",
}

export type ReservationUnitCancellationRuleNode = Node & {
  __typename?: "ReservationUnitCancellationRuleNode";
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
  __typename?: "ReservationUnitCancellationRuleNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitCancellationRuleNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitCancellationRuleNode` and its cursor. */
export type ReservationUnitCancellationRuleNodeEdge = {
  __typename?: "ReservationUnitCancellationRuleNodeEdge";
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
  __typename?: "ReservationUnitCreateMutationPayload";
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
  __typename?: "ReservationUnitImageCreateMutationPayload";
  imageType?: Maybe<ImageType>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationUnit?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitImageDeleteMutationInput = {
  pk: Scalars["ID"]["input"];
};

export type ReservationUnitImageDeleteMutationPayload = {
  __typename?: "ReservationUnitImageDeleteMutationPayload";
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
  __typename?: "ReservationUnitImageNode";
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
  __typename?: "ReservationUnitImageUpdateMutationPayload";
  imageType?: Maybe<ImageType>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitNode = Node & {
  __typename?: "ReservationUnitNode";
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
  begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  begin_Gte?: InputMaybe<Scalars["DateTime"]["input"]>;
  begin_Lte?: InputMaybe<Scalars["DateTime"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  onlyWithHandlingPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Array<InputMaybe<ReservationOrderingChoices>>>;
  orderStatus?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  recurringReservation?: InputMaybe<Scalars["ID"]["input"]>;
  requested?: InputMaybe<Scalars["Boolean"]["input"]>;
  reservationType?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  user?: InputMaybe<Scalars["ID"]["input"]>;
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
  __typename?: "ReservationUnitNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitNode` and its cursor. */
export type ReservationUnitNodeEdge = {
  __typename?: "ReservationUnitNodeEdge";
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
  __typename?: "ReservationUnitOptionNode";
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
  __typename?: "ReservationUnitOptionUpdateMutationPayload";
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
  __typename?: "ReservationUnitPaymentTypeNode";
  code: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
};

export type ReservationUnitPricingNode = Node & {
  __typename?: "ReservationUnitPricingNode";
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
  __typename?: "ReservationUnitTypeNode";
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
  __typename?: "ReservationUnitTypeNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitTypeNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitTypeNode` and its cursor. */
export type ReservationUnitTypeNodeEdge = {
  __typename?: "ReservationUnitTypeNodeEdge";
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
  __typename?: "ReservationUnitUpdateMutationPayload";
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
  reserveeType?: InputMaybe<Scalars["String"]["input"]>;
  /** String value for ReservationType's ReservationState enum. Possible values are CREATED, CANCELLED, REQUIRES_HANDLING, WAITING_FOR_PAYMENT, CONFIRMED, DENIED. */
  state?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationUpdateMutationPayload = {
  __typename?: "ReservationUpdateMutationPayload";
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
  reserveeType?: Maybe<Scalars["String"]["output"]>;
  /** String value for ReservationType's ReservationState enum. Possible values are CREATED, CANCELLED, REQUIRES_HANDLING, WAITING_FOR_PAYMENT, CONFIRMED, DENIED. */
  state?: Maybe<Scalars["String"]["output"]>;
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
};

export type ReservationWorkingMemoMutationInput = {
  /** Primary key of the reservation */
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationWorkingMemoMutationPayload = {
  __typename?: "ReservationWorkingMemoMutationPayload";
  /** Primary key of the reservation */
  pk?: Maybe<Scalars["Int"]["output"]>;
  workingMemo?: Maybe<Scalars["String"]["output"]>;
};

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
  __typename?: "ResourceCreateMutationPayload";
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
  __typename?: "ResourceDeleteMutationPayload";
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

/** An enumeration. */
export enum ResourceLocationType {
  Fixed = "FIXED",
  Movable = "MOVABLE",
}

export type ResourceNode = Node & {
  __typename?: "ResourceNode";
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
  __typename?: "ResourceNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ResourceNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ResourceNode` and its cursor. */
export type ResourceNodeEdge = {
  __typename?: "ResourceNodeEdge";
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
  __typename?: "ResourceUpdateMutationPayload";
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
  __typename?: "RestoreAllApplicationOptionsMutationPayload";
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type RestoreAllSectionOptionsMutationInput = {
  pk: Scalars["Int"]["input"];
};

export type RestoreAllSectionOptionsMutationPayload = {
  __typename?: "RestoreAllSectionOptionsMutationPayload";
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ServiceNode = Node & {
  __typename?: "ServiceNode";
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
  __typename?: "ServiceSectorNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ServiceSectorNodeConnection = {
  __typename?: "ServiceSectorNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ServiceSectorNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ServiceSectorNode` and its cursor. */
export type ServiceSectorNodeEdge = {
  __typename?: "ServiceSectorNodeEdge";
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
  __typename?: "ServiceSectorRoleChoiceNode";
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
  __typename?: "ServiceSectorRoleNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  role: ServiceSectorRoleChoiceNode;
  serviceSector: ServiceSectorNode;
};

export type ServiceSectorRolePermissionNode = Node & {
  __typename?: "ServiceSectorRolePermissionNode";
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
  __typename?: "SpaceCreateMutationPayload";
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
  __typename?: "SpaceDeleteMutationPayload";
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
};

export type SpaceNode = Node & {
  __typename?: "SpaceNode";
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
  __typename?: "SpaceNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<SpaceNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `SpaceNode` and its cursor. */
export type SpaceNodeEdge = {
  __typename?: "SpaceNodeEdge";
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
  __typename?: "SpaceUpdateMutationPayload";
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
export enum State {
  /** Peruttu */
  Cancelled = "CANCELLED",
  /** Vahvistettu */
  Confirmed = "CONFIRMED",
  /** Luotu */
  Created = "CREATED",
  /** Hylätty */
  Denied = "DENIED",
  /** Vaatiiko käsittelyn */
  RequiresHandling = "REQUIRES_HANDLING",
  /** Odottaa maksua */
  WaitingForPayment = "WAITING_FOR_PAYMENT",
}

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
  __typename?: "SuitableTimeRangeNode";
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
  __typename?: "TaxPercentageNode";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** The tax percentage for a price */
  value: Scalars["Decimal"]["output"];
};

export type TaxPercentageNodeConnection = {
  __typename?: "TaxPercentageNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<TaxPercentageNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `TaxPercentageNode` and its cursor. */
export type TaxPercentageNodeEdge = {
  __typename?: "TaxPercentageNodeEdge";
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
  __typename?: "TermsOfUseNode";
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
  __typename?: "TermsOfUseNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<TermsOfUseNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `TermsOfUseNode` and its cursor. */
export type TermsOfUseNodeEdge = {
  __typename?: "TermsOfUseNodeEdge";
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
  /** Toistuvan varauksen ehdot */
  RecurringTerms = "RECURRING_TERMS",
  /** Palvelualuekohtaiset ehdot */
  ServiceTerms = "SERVICE_TERMS",
}

export type TimeSlotSerializerInput = {
  begin: Scalars["Time"]["input"];
  end: Scalars["Time"]["input"];
};

export type TimeSlotType = {
  __typename?: "TimeSlotType";
  begin: Scalars["Time"]["output"];
  end: Scalars["Time"]["output"];
};

export type UnitGroupNode = Node & {
  __typename?: "UnitGroupNode";
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

export type UnitNode = Node & {
  __typename?: "UnitNode";
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
  reservationState?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
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
  __typename?: "UnitNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<UnitNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `UnitNode` and its cursor. */
export type UnitNodeEdge = {
  __typename?: "UnitNodeEdge";
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
  __typename?: "UnitRoleChoiceNode";
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
  __typename?: "UnitRoleNode";
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
  __typename?: "UnitRolePermissionNode";
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
  __typename?: "UnitUpdateMutationPayload";
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
  __typename?: "UserNode";
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
  __typename?: "UserUpdateMutationPayload";
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

export type BannerNotificationCommonFragment = {
  __typename?: "BannerNotificationNode";
  id: string;
  level: BannerNotificationLevel;
  activeFrom?: string | null;
  message: string;
  messageEn?: string | null;
  messageFi?: string | null;
  messageSv?: string | null;
};

export type BannerNotificationsAdminFragmentFragment = {
  __typename?: "BannerNotificationNode";
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
  __typename?: "Query";
  bannerNotification?: {
    __typename?: "BannerNotificationNode";
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
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    | Array<InputMaybe<BannerNotificationOrderingChoices>>
    | InputMaybe<BannerNotificationOrderingChoices>
  >;
}>;

export type BannerNotificationsAdminListQuery = {
  __typename?: "Query";
  bannerNotifications?: {
    __typename?: "BannerNotificationNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "BannerNotificationNodeEdge";
      node?: {
        __typename?: "BannerNotificationNode";
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
    pageInfo: {
      __typename?: "PageInfo";
      endCursor?: string | null;
      hasNextPage: boolean;
    };
  } | null;
};

export type BannerNotificationsListQueryVariables = Exact<{
  target: BannerNotificationTarget;
}>;

export type BannerNotificationsListQuery = {
  __typename?: "Query";
  bannerNotifications?: {
    __typename?: "BannerNotificationNodeConnection";
    edges: Array<{
      __typename?: "BannerNotificationNodeEdge";
      node?: {
        __typename?: "BannerNotificationNode";
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
  bannerNotificationsAll?: {
    __typename?: "BannerNotificationNodeConnection";
    edges: Array<{
      __typename?: "BannerNotificationNodeEdge";
      node?: {
        __typename?: "BannerNotificationNode";
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

export type ApplicationNameFragmentFragment = {
  __typename?: "ApplicationNode";
  applicantType?: ApplicantTypeChoice | null;
  organisation?: {
    __typename?: "OrganisationNode";
    name: string;
    organisationType: OrganizationTypeChoice;
  } | null;
  contactPerson?: {
    __typename?: "PersonNode";
    lastName: string;
    firstName: string;
  } | null;
};

export type ApplicationSectionDurationFragmentFragment = {
  __typename?: "ApplicationSectionNode";
  reservationsEndDate: string;
  reservationsBeginDate: string;
  appliedReservationsPerWeek: number;
  reservationMinDuration: number;
};

export type ApplicationSectionCommonFragmentFragment = {
  __typename?: "ApplicationSectionNode";
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
    __typename?: "AgeGroupNode";
    pk?: number | null;
    minimum: number;
    maximum?: number | null;
  } | null;
  reservationUnitOptions: Array<{
    __typename?: "ReservationUnitOptionNode";
    pk?: number | null;
    preferredOrder: number;
  }>;
};

export type ApplicationSectionFragmentFragment = {
  __typename?: "ApplicationSectionNode";
  pk?: number | null;
  name: string;
  status?: ApplicationSectionStatusChoice | null;
  reservationMaxDuration: number;
  numPersons: number;
  reservationsEndDate: string;
  reservationsBeginDate: string;
  appliedReservationsPerWeek: number;
  reservationMinDuration: number;
  purpose?: {
    __typename?: "ReservationPurposeNode";
    pk?: number | null;
    nameFi?: string | null;
  } | null;
  application: {
    __typename?: "ApplicationNode";
    pk?: number | null;
    status?: ApplicationStatusChoice | null;
    applicantType?: ApplicantTypeChoice | null;
    organisation?: {
      __typename?: "OrganisationNode";
      name: string;
      organisationType: OrganizationTypeChoice;
    } | null;
    contactPerson?: {
      __typename?: "PersonNode";
      lastName: string;
      firstName: string;
    } | null;
  };
  reservationUnitOptions: Array<{
    __typename?: "ReservationUnitOptionNode";
    pk?: number | null;
    preferredOrder: number;
    reservationUnit: {
      __typename?: "ReservationUnitNode";
      pk?: number | null;
      nameFi?: string | null;
      unit?: {
        __typename?: "UnitNode";
        pk?: number | null;
        nameFi?: string | null;
      } | null;
    };
  }>;
  ageGroup?: {
    __typename?: "AgeGroupNode";
    pk?: number | null;
    minimum: number;
    maximum?: number | null;
  } | null;
};

export type ApplicationSectionUiFragmentFragment = {
  __typename?: "ApplicationSectionNode";
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
    __typename?: "SuitableTimeRangeNode";
    beginTime: string;
    endTime: string;
    dayOfTheWeek: Weekday;
    priority: Priority;
  }>;
  purpose?: {
    __typename?: "ReservationPurposeNode";
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
  } | null;
  reservationUnitOptions: Array<{
    __typename?: "ReservationUnitOptionNode";
    pk?: number | null;
    preferredOrder: number;
    reservationUnit: {
      __typename?: "ReservationUnitNode";
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      unit?: {
        __typename?: "UnitNode";
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
      applicationRoundTimeSlots: Array<{
        __typename?: "ApplicationRoundTimeSlotNode";
        weekday: number;
        reservableTimes?: Array<{
          __typename?: "TimeSlotType";
          begin: string;
          end: string;
        } | null> | null;
      }>;
    };
  }>;
  ageGroup?: {
    __typename?: "AgeGroupNode";
    pk?: number | null;
    minimum: number;
    maximum?: number | null;
  } | null;
};

export type ApplicantFragmentFragment = {
  __typename?: "ApplicationNode";
  applicantType?: ApplicantTypeChoice | null;
  additionalInformation?: string | null;
  contactPerson?: {
    __typename?: "PersonNode";
    pk?: number | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  organisation?: {
    __typename?: "OrganisationNode";
    pk?: number | null;
    name: string;
    identifier?: string | null;
    organisationType: OrganizationTypeChoice;
    coreBusiness: string;
    address?: {
      __typename?: "AddressNode";
      postCode: string;
      streetAddress: string;
      city: string;
    } | null;
  } | null;
  homeCity?: {
    __typename?: "CityNode";
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  billingAddress?: {
    __typename?: "AddressNode";
    pk?: number | null;
    postCode: string;
    streetAddress: string;
    city: string;
  } | null;
  user?: {
    __typename?: "ApplicantNode";
    name?: string | null;
    email: string;
    pk?: number | null;
  } | null;
};

export type ApplicationRoundFragmentFragment = {
  __typename?: "ApplicationRoundNode";
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
  serviceSector?: {
    __typename?: "ServiceSectorNode";
    pk?: number | null;
    nameFi?: string | null;
  } | null;
  reservationUnits: Array<{
    __typename?: "ReservationUnitNode";
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
    minPersons?: number | null;
    maxPersons?: number | null;
    images: Array<{
      __typename?: "ReservationUnitImageNode";
      imageUrl?: string | null;
      largeUrl?: string | null;
      mediumUrl?: string | null;
      smallUrl?: string | null;
      imageType: ImageType;
    }>;
    unit?: {
      __typename?: "UnitNode";
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
    } | null;
  }>;
};

export type ApplicationAdminFragmentFragment = {
  __typename?: "ApplicationNode";
  pk?: number | null;
  id: string;
  status?: ApplicationStatusChoice | null;
  lastModifiedDate: string;
  applicantType?: ApplicantTypeChoice | null;
  additionalInformation?: string | null;
  applicationRound: {
    __typename?: "ApplicationRoundNode";
    pk?: number | null;
    nameFi?: string | null;
  };
  applicationSections?: Array<{
    __typename?: "ApplicationSectionNode";
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
      __typename?: "ReservationUnitOptionNode";
      rejected: boolean;
      pk?: number | null;
      preferredOrder: number;
      allocatedTimeSlots: Array<{
        __typename?: "AllocatedTimeSlotNode";
        pk?: number | null;
        id: string;
      }>;
      reservationUnit: {
        __typename?: "ReservationUnitNode";
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        unit?: {
          __typename?: "UnitNode";
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
        applicationRoundTimeSlots: Array<{
          __typename?: "ApplicationRoundTimeSlotNode";
          weekday: number;
          reservableTimes?: Array<{
            __typename?: "TimeSlotType";
            begin: string;
            end: string;
          } | null> | null;
        }>;
      };
    }>;
    suitableTimeRanges: Array<{
      __typename?: "SuitableTimeRangeNode";
      beginTime: string;
      endTime: string;
      dayOfTheWeek: Weekday;
      priority: Priority;
    }>;
    purpose?: {
      __typename?: "ReservationPurposeNode";
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
    } | null;
    ageGroup?: {
      __typename?: "AgeGroupNode";
      pk?: number | null;
      minimum: number;
      maximum?: number | null;
    } | null;
  }> | null;
  contactPerson?: {
    __typename?: "PersonNode";
    pk?: number | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  organisation?: {
    __typename?: "OrganisationNode";
    pk?: number | null;
    name: string;
    identifier?: string | null;
    organisationType: OrganizationTypeChoice;
    coreBusiness: string;
    address?: {
      __typename?: "AddressNode";
      postCode: string;
      streetAddress: string;
      city: string;
    } | null;
  } | null;
  homeCity?: {
    __typename?: "CityNode";
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  billingAddress?: {
    __typename?: "AddressNode";
    pk?: number | null;
    postCode: string;
    streetAddress: string;
    city: string;
  } | null;
  user?: {
    __typename?: "ApplicantNode";
    name?: string | null;
    email: string;
    pk?: number | null;
  } | null;
};

export type ApplicationCommonFragment = {
  __typename?: "ApplicationNode";
  pk?: number | null;
  status?: ApplicationStatusChoice | null;
  lastModifiedDate: string;
  applicantType?: ApplicantTypeChoice | null;
  additionalInformation?: string | null;
  applicationRound: {
    __typename?: "ApplicationRoundNode";
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
    serviceSector?: {
      __typename?: "ServiceSectorNode";
      pk?: number | null;
      nameFi?: string | null;
    } | null;
    reservationUnits: Array<{
      __typename?: "ReservationUnitNode";
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
      minPersons?: number | null;
      maxPersons?: number | null;
      images: Array<{
        __typename?: "ReservationUnitImageNode";
        imageUrl?: string | null;
        largeUrl?: string | null;
        mediumUrl?: string | null;
        smallUrl?: string | null;
        imageType: ImageType;
      }>;
      unit?: {
        __typename?: "UnitNode";
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
    }>;
  };
  applicationSections?: Array<{
    __typename?: "ApplicationSectionNode";
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
      __typename?: "SuitableTimeRangeNode";
      beginTime: string;
      endTime: string;
      dayOfTheWeek: Weekday;
      priority: Priority;
    }>;
    purpose?: {
      __typename?: "ReservationPurposeNode";
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
    } | null;
    reservationUnitOptions: Array<{
      __typename?: "ReservationUnitOptionNode";
      pk?: number | null;
      preferredOrder: number;
      reservationUnit: {
        __typename?: "ReservationUnitNode";
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        unit?: {
          __typename?: "UnitNode";
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
        applicationRoundTimeSlots: Array<{
          __typename?: "ApplicationRoundTimeSlotNode";
          weekday: number;
          reservableTimes?: Array<{
            __typename?: "TimeSlotType";
            begin: string;
            end: string;
          } | null> | null;
        }>;
      };
    }>;
    ageGroup?: {
      __typename?: "AgeGroupNode";
      pk?: number | null;
      minimum: number;
      maximum?: number | null;
    } | null;
  }> | null;
  contactPerson?: {
    __typename?: "PersonNode";
    pk?: number | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  organisation?: {
    __typename?: "OrganisationNode";
    pk?: number | null;
    name: string;
    identifier?: string | null;
    organisationType: OrganizationTypeChoice;
    coreBusiness: string;
    address?: {
      __typename?: "AddressNode";
      postCode: string;
      streetAddress: string;
      city: string;
    } | null;
  } | null;
  homeCity?: {
    __typename?: "CityNode";
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  billingAddress?: {
    __typename?: "AddressNode";
    pk?: number | null;
    postCode: string;
    streetAddress: string;
    city: string;
  } | null;
  user?: {
    __typename?: "ApplicantNode";
    name?: string | null;
    email: string;
    pk?: number | null;
  } | null;
};

export type GetApplicationQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetApplicationQuery = {
  __typename?: "Query";
  application?: {
    __typename?: "ApplicationNode";
    pk?: number | null;
    status?: ApplicationStatusChoice | null;
    lastModifiedDate: string;
    applicantType?: ApplicantTypeChoice | null;
    additionalInformation?: string | null;
    applicationRound: {
      __typename?: "ApplicationRoundNode";
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
        __typename?: "TermsOfUseNode";
        pk?: string | null;
        termsType: TermsType;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      serviceSector?: {
        __typename?: "ServiceSectorNode";
        pk?: number | null;
        nameFi?: string | null;
      } | null;
      reservationUnits: Array<{
        __typename?: "ReservationUnitNode";
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
        minPersons?: number | null;
        maxPersons?: number | null;
        images: Array<{
          __typename?: "ReservationUnitImageNode";
          imageUrl?: string | null;
          largeUrl?: string | null;
          mediumUrl?: string | null;
          smallUrl?: string | null;
          imageType: ImageType;
        }>;
        unit?: {
          __typename?: "UnitNode";
          pk?: number | null;
          nameFi?: string | null;
          nameSv?: string | null;
          nameEn?: string | null;
        } | null;
      }>;
    };
    applicationSections?: Array<{
      __typename?: "ApplicationSectionNode";
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
        __typename?: "SuitableTimeRangeNode";
        beginTime: string;
        endTime: string;
        dayOfTheWeek: Weekday;
        priority: Priority;
      }>;
      purpose?: {
        __typename?: "ReservationPurposeNode";
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
      reservationUnitOptions: Array<{
        __typename?: "ReservationUnitOptionNode";
        pk?: number | null;
        preferredOrder: number;
        reservationUnit: {
          __typename?: "ReservationUnitNode";
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          unit?: {
            __typename?: "UnitNode";
            pk?: number | null;
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
          } | null;
          applicationRoundTimeSlots: Array<{
            __typename?: "ApplicationRoundTimeSlotNode";
            weekday: number;
            reservableTimes?: Array<{
              __typename?: "TimeSlotType";
              begin: string;
              end: string;
            } | null> | null;
          }>;
        };
      }>;
      ageGroup?: {
        __typename?: "AgeGroupNode";
        pk?: number | null;
        minimum: number;
        maximum?: number | null;
      } | null;
    }> | null;
    contactPerson?: {
      __typename?: "PersonNode";
      pk?: number | null;
      firstName: string;
      lastName: string;
      email?: string | null;
      phoneNumber?: string | null;
    } | null;
    organisation?: {
      __typename?: "OrganisationNode";
      pk?: number | null;
      name: string;
      identifier?: string | null;
      organisationType: OrganizationTypeChoice;
      coreBusiness: string;
      address?: {
        __typename?: "AddressNode";
        postCode: string;
        streetAddress: string;
        city: string;
      } | null;
    } | null;
    homeCity?: {
      __typename?: "CityNode";
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    billingAddress?: {
      __typename?: "AddressNode";
      pk?: number | null;
      postCode: string;
      streetAddress: string;
      city: string;
    } | null;
    user?: {
      __typename?: "ApplicantNode";
      name?: string | null;
      email: string;
      pk?: number | null;
    } | null;
  } | null;
};

export type ReserveeNameFieldsFragment = {
  __typename?: "ReservationNode";
  reserveeFirstName?: string | null;
  reserveeLastName?: string | null;
  reserveeEmail?: string | null;
  reserveePhone?: string | null;
  reserveeType?: CustomerTypeChoice | null;
  reserveeOrganisationName?: string | null;
  reserveeId?: string | null;
};

export type ReserveeBillingFieldsFragment = {
  __typename?: "ReservationNode";
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
  __typename?: "TermsOfUseNode";
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
};

export type TermsOfUseTextFieldsFragment = {
  __typename?: "TermsOfUseNode";
  textFi?: string | null;
  textEn?: string | null;
  textSv?: string | null;
};

export type TermsOfUseFieldsFragment = {
  __typename?: "TermsOfUseNode";
  pk?: string | null;
  termsType: TermsType;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  textFi?: string | null;
  textEn?: string | null;
  textSv?: string | null;
};

export type PricingFieldsFragment = {
  __typename?: "ReservationUnitPricingNode";
  begins: string;
  priceUnit: PriceUnit;
  pricingType?: PricingType | null;
  lowestPrice: string;
  highestPrice: string;
  status: Status;
  taxPercentage: { __typename?: "TaxPercentageNode"; value: string };
};

export type ImageFragmentFragment = {
  __typename?: "ReservationUnitImageNode";
  imageUrl?: string | null;
  largeUrl?: string | null;
  mediumUrl?: string | null;
  smallUrl?: string | null;
  imageType: ImageType;
};

export type LocationFieldsFragment = {
  __typename?: "LocationNode";
  addressStreetFi?: string | null;
  addressZip: string;
  addressCityFi?: string | null;
};

export type LocationFieldsI18nFragment = {
  __typename?: "LocationNode";
  addressStreetEn?: string | null;
  addressStreetSv?: string | null;
  addressCityEn?: string | null;
  addressCitySv?: string | null;
  addressStreetFi?: string | null;
  addressZip: string;
  addressCityFi?: string | null;
};

export type TermsOfUseQueryVariables = Exact<{
  termsType?: InputMaybe<TermsType>;
}>;

export type TermsOfUseQuery = {
  __typename?: "Query";
  termsOfUse?: {
    __typename?: "TermsOfUseNodeConnection";
    edges: Array<{
      __typename?: "TermsOfUseNodeEdge";
      node?: {
        __typename?: "TermsOfUseNode";
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
  __typename?: "SpaceNode";
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  surfaceArea?: number | null;
  maxPersons?: number | null;
  parent?: {
    __typename?: "SpaceNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
  } | null;
};

export type ResourceFieldsFragment = {
  __typename?: "ResourceNode";
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  space?: {
    __typename?: "SpaceNode";
    id: string;
    nameFi?: string | null;
    unit?: {
      __typename?: "UnitNode";
      id: string;
      nameFi?: string | null;
      pk?: number | null;
    } | null;
  } | null;
};

export type SpaceFieldsFragment = {
  __typename?: "SpaceNode";
  code: string;
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  surfaceArea?: number | null;
  maxPersons?: number | null;
  resourceSet: Array<{
    __typename?: "ResourceNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    space?: {
      __typename?: "SpaceNode";
      id: string;
      nameFi?: string | null;
      unit?: {
        __typename?: "UnitNode";
        id: string;
        nameFi?: string | null;
        pk?: number | null;
      } | null;
    } | null;
  }>;
  children?: Array<{
    __typename?: "SpaceNode";
    id: string;
    pk?: number | null;
  }> | null;
  parent?: {
    __typename?: "SpaceNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
  } | null;
};

export type ReservationUnitCommonFieldsFragment = {
  __typename?: "ReservationUnitNode";
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  maxPersons?: number | null;
  surfaceArea?: number | null;
  reservationUnitType?: {
    __typename?: "ReservationUnitTypeNode";
    id: string;
    nameFi?: string | null;
  } | null;
};

export type UnitNameFieldsFragment = {
  __typename?: "UnitNode";
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  serviceSectors: Array<{
    __typename?: "ServiceSectorNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
  }>;
};

export type SpacesQueryVariables = Exact<{ [key: string]: never }>;

export type SpacesQuery = {
  __typename?: "Query";
  spaces?: {
    __typename?: "SpaceNodeConnection";
    edges: Array<{
      __typename?: "SpaceNodeEdge";
      node?: {
        __typename?: "SpaceNode";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        surfaceArea?: number | null;
        maxPersons?: number | null;
        unit?: {
          __typename?: "UnitNode";
          pk?: number | null;
          nameFi?: string | null;
        } | null;
        parent?: {
          __typename?: "SpaceNode";
          id: string;
          pk?: number | null;
          nameFi?: string | null;
        } | null;
      } | null;
    } | null>;
  } | null;
};

export type ResourcesQueryVariables = Exact<{ [key: string]: never }>;

export type ResourcesQuery = {
  __typename?: "Query";
  resources?: {
    __typename?: "ResourceNodeConnection";
    edges: Array<{
      __typename?: "ResourceNodeEdge";
      node?: {
        __typename?: "ResourceNode";
        locationType?: ResourceLocationType | null;
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        space?: {
          __typename?: "SpaceNode";
          id: string;
          nameFi?: string | null;
          unit?: {
            __typename?: "UnitNode";
            id: string;
            nameFi?: string | null;
            pk?: number | null;
          } | null;
        } | null;
      } | null;
    } | null>;
  } | null;
};

export type DeleteSpaceMutationVariables = Exact<{
  input: SpaceDeleteMutationInput;
}>;

export type DeleteSpaceMutation = {
  __typename?: "Mutation";
  deleteSpace?: {
    __typename?: "SpaceDeleteMutationPayload";
    deleted?: boolean | null;
  } | null;
};

export type UnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type UnitQuery = {
  __typename?: "Query";
  unit?: {
    __typename?: "UnitNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    tprekId?: string | null;
    shortDescriptionFi?: string | null;
    reservationunitSet: Array<{
      __typename?: "ReservationUnitNode";
      isArchived: boolean;
      isDraft: boolean;
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      maxPersons?: number | null;
      surfaceArea?: number | null;
      resources: Array<{ __typename?: "ResourceNode"; pk?: number | null }>;
      purposes: Array<{
        __typename?: "PurposeNode";
        pk?: number | null;
        nameFi?: string | null;
      }>;
      images: Array<{
        __typename?: "ReservationUnitImageNode";
        imageUrl?: string | null;
        largeUrl?: string | null;
        mediumUrl?: string | null;
        smallUrl?: string | null;
        imageType: ImageType;
      }>;
      reservationUnitType?: {
        __typename?: "ReservationUnitTypeNode";
        id: string;
        nameFi?: string | null;
      } | null;
    }>;
    spaces: Array<{
      __typename?: "SpaceNode";
      code: string;
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      surfaceArea?: number | null;
      maxPersons?: number | null;
      resourceSet: Array<{
        __typename?: "ResourceNode";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        space?: {
          __typename?: "SpaceNode";
          id: string;
          nameFi?: string | null;
          unit?: {
            __typename?: "UnitNode";
            id: string;
            nameFi?: string | null;
            pk?: number | null;
          } | null;
        } | null;
      }>;
      children?: Array<{
        __typename?: "SpaceNode";
        id: string;
        pk?: number | null;
      }> | null;
      parent?: {
        __typename?: "SpaceNode";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
      } | null;
    }>;
    location?: {
      __typename?: "LocationNode";
      longitude?: string | null;
      latitude?: string | null;
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
  __typename?: "Query";
  unit?: {
    __typename?: "UnitNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    spaces: Array<{
      __typename?: "SpaceNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      surfaceArea?: number | null;
      maxPersons?: number | null;
      resourceSet: Array<{
        __typename?: "ResourceNode";
        pk?: number | null;
        nameFi?: string | null;
      }>;
      parent?: {
        __typename?: "SpaceNode";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
      } | null;
    }>;
    location?: {
      __typename?: "LocationNode";
      addressStreetFi?: string | null;
      addressZip: string;
      addressCityFi?: string | null;
    } | null;
  } | null;
};

export type DeleteResourceMutationVariables = Exact<{
  input: ResourceDeleteMutationInput;
}>;

export type DeleteResourceMutation = {
  __typename?: "Mutation";
  deleteResource?: {
    __typename?: "ResourceDeleteMutationPayload";
    deleted?: boolean | null;
  } | null;
};

export type HandlingDataQueryVariables = Exact<{
  beginDate: Scalars["Date"]["input"];
}>;

export type HandlingDataQuery = {
  __typename?: "Query";
  reservations?: {
    __typename?: "ReservationNodeConnection";
    edges: Array<{
      __typename?: "ReservationNodeEdge";
      node?: { __typename?: "ReservationNode"; pk?: number | null } | null;
    } | null>;
  } | null;
  units?: {
    __typename?: "UnitNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "UnitNodeEdge";
      node?: { __typename?: "UnitNode"; pk?: number | null } | null;
    } | null>;
  } | null;
};

export type ReservationDateOfBirthQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationDateOfBirthQuery = {
  __typename?: "Query";
  reservation?: {
    __typename?: "ReservationNode";
    user?: {
      __typename?: "UserNode";
      pk?: number | null;
      dateOfBirth?: string | null;
    } | null;
  } | null;
};

export type ApplicationDateOfBirthQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationDateOfBirthQuery = {
  __typename?: "Query";
  application?: {
    __typename?: "ApplicationNode";
    user?: {
      __typename?: "ApplicantNode";
      pk?: number | null;
      dateOfBirth?: string | null;
    } | null;
  } | null;
};

export type CreateResourceMutationVariables = Exact<{
  input: ResourceCreateMutationInput;
}>;

export type CreateResourceMutation = {
  __typename?: "Mutation";
  createResource?: {
    __typename?: "ResourceCreateMutationPayload";
    pk?: number | null;
  } | null;
};

export type UpdateResourceMutationVariables = Exact<{
  input: ResourceUpdateMutationInput;
}>;

export type UpdateResourceMutation = {
  __typename?: "Mutation";
  updateResource?: {
    __typename?: "ResourceUpdateMutationPayload";
    pk?: number | null;
  } | null;
};

export type ResourceQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ResourceQuery = {
  __typename?: "Query";
  resource?: {
    __typename?: "ResourceNode";
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
    space?: { __typename?: "SpaceNode"; pk?: number | null } | null;
  } | null;
};

export type CreateSpaceMutationVariables = Exact<{
  input: SpaceCreateMutationInput;
}>;

export type CreateSpaceMutation = {
  __typename?: "Mutation";
  createSpace?: {
    __typename?: "SpaceCreateMutationPayload";
    pk?: number | null;
  } | null;
};

export type UpdateSpaceMutationVariables = Exact<{
  input: SpaceUpdateMutationInput;
}>;

export type UpdateSpaceMutation = {
  __typename?: "Mutation";
  updateSpace?: {
    __typename?: "SpaceUpdateMutationPayload";
    pk?: number | null;
  } | null;
};

export type UnitSpacesQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type UnitSpacesQuery = {
  __typename?: "Query";
  unit?: {
    __typename?: "UnitNode";
    spaces: Array<{
      __typename?: "SpaceNode";
      pk?: number | null;
      nameFi?: string | null;
      parent?: { __typename?: "SpaceNode"; pk?: number | null } | null;
    }>;
  } | null;
};

export type SpaceQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type SpaceQuery = {
  __typename?: "Query";
  space?: {
    __typename?: "SpaceNode";
    nameSv?: string | null;
    nameEn?: string | null;
    code: string;
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    surfaceArea?: number | null;
    maxPersons?: number | null;
    unit?: {
      __typename?: "UnitNode";
      pk?: number | null;
      nameFi?: string | null;
      descriptionFi?: string | null;
      location?: {
        __typename?: "LocationNode";
        addressStreetFi?: string | null;
        addressZip: string;
        addressCityFi?: string | null;
      } | null;
      spaces: Array<{
        __typename?: "SpaceNode";
        pk?: number | null;
        nameFi?: string | null;
      }>;
    } | null;
    parent?: {
      __typename?: "SpaceNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      parent?: {
        __typename?: "SpaceNode";
        nameFi?: string | null;
        parent?: { __typename?: "SpaceNode"; nameFi?: string | null } | null;
      } | null;
    } | null;
  } | null;
};

export type UnitsQueryVariables = Exact<{
  first?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    Array<InputMaybe<UnitOrderingChoices>> | InputMaybe<UnitOrderingChoices>
  >;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type UnitsQuery = {
  __typename?: "Query";
  units?: {
    __typename?: "UnitNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "UnitNodeEdge";
      node?: {
        __typename?: "UnitNode";
        nameFi?: string | null;
        pk?: number | null;
        serviceSectors: Array<{
          __typename?: "ServiceSectorNode";
          nameFi?: string | null;
        }>;
        reservationunitSet: Array<{
          __typename?: "ReservationUnitNode";
          pk?: number | null;
        }>;
      } | null;
    } | null>;
  } | null;
};

export type UnitsFilterQueryVariables = Exact<{
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type UnitsFilterQuery = {
  __typename?: "Query";
  units?: {
    __typename?: "UnitNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "UnitNodeEdge";
      node?: {
        __typename?: "UnitNode";
        nameFi?: string | null;
        pk?: number | null;
      } | null;
    } | null>;
  } | null;
};

export type ReservationUnitTypesFilterQueryVariables = Exact<{
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type ReservationUnitTypesFilterQuery = {
  __typename?: "Query";
  reservationUnitTypes?: {
    __typename?: "ReservationUnitTypeNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "ReservationUnitTypeNodeEdge";
      node?: {
        __typename?: "ReservationUnitTypeNode";
        pk?: number | null;
        nameFi?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type ReservationUnitsFilterParamsQueryVariables = Exact<{
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  unit?: InputMaybe<
    | Array<InputMaybe<Scalars["Int"]["input"]>>
    | InputMaybe<Scalars["Int"]["input"]>
  >;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ReservationUnitOrderingChoices>>
    | InputMaybe<ReservationUnitOrderingChoices>
  >;
}>;

export type ReservationUnitsFilterParamsQuery = {
  __typename?: "Query";
  reservationUnits?: {
    __typename?: "ReservationUnitNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "ReservationUnitNodeEdge";
      node?: {
        __typename?: "ReservationUnitNode";
        nameFi?: string | null;
        pk?: number | null;
      } | null;
    } | null>;
  } | null;
};

export type CreateRecurringReservationMutationVariables = Exact<{
  input: RecurringReservationCreateMutationInput;
}>;

export type CreateRecurringReservationMutation = {
  __typename?: "Mutation";
  createRecurringReservation?: {
    __typename?: "RecurringReservationCreateMutationPayload";
    pk?: number | null;
  } | null;
};

export type ReservationsInIntervalFragment = {
  __typename?: "ReservationNode";
  id: string;
  begin: string;
  end: string;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  type?: ReservationTypeChoice | null;
  affectedReservationUnits?: Array<number | null> | null;
};

export type ReservationTimesInReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  state?: InputMaybe<
    | Array<InputMaybe<Scalars["String"]["input"]>>
    | InputMaybe<Scalars["String"]["input"]>
  >;
}>;

export type ReservationTimesInReservationUnitQuery = {
  __typename?: "Query";
  reservationUnit?: {
    __typename?: "ReservationUnitNode";
    reservationSet?: Array<{
      __typename?: "ReservationNode";
      id: string;
      begin: string;
      end: string;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      type?: ReservationTypeChoice | null;
      affectedReservationUnits?: Array<number | null> | null;
    }> | null;
  } | null;
  affectingReservations?: Array<{
    __typename?: "ReservationNode";
    id: string;
    begin: string;
    end: string;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    type?: ReservationTypeChoice | null;
    affectedReservationUnits?: Array<number | null> | null;
  }> | null;
};

export type CreateStaffReservationMutationVariables = Exact<{
  input: ReservationStaffCreateMutationInput;
}>;

export type CreateStaffReservationMutation = {
  __typename?: "Mutation";
  createStaffReservation?: {
    __typename?: "ReservationStaffCreateMutationPayload";
    pk?: number | null;
  } | null;
};

export type OptionsQueryVariables = Exact<{ [key: string]: never }>;

export type OptionsQuery = {
  __typename?: "Query";
  reservationPurposes?: {
    __typename?: "ReservationPurposeNodeConnection";
    edges: Array<{
      __typename?: "ReservationPurposeNodeEdge";
      node?: {
        __typename?: "ReservationPurposeNode";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
      } | null;
    } | null>;
  } | null;
  ageGroups?: {
    __typename?: "AgeGroupNodeConnection";
    edges: Array<{
      __typename?: "AgeGroupNodeEdge";
      node?: {
        __typename?: "AgeGroupNode";
        id: string;
        pk?: number | null;
        minimum: number;
        maximum?: number | null;
      } | null;
    } | null>;
  } | null;
  cities?: {
    __typename?: "CityNodeConnection";
    edges: Array<{
      __typename?: "CityNodeEdge";
      node?: {
        __typename?: "CityNode";
        id: string;
        nameFi?: string | null;
        pk?: number | null;
      } | null;
    } | null>;
  } | null;
};

export type UnitViewQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type UnitViewQuery = {
  __typename?: "Query";
  unit?: {
    __typename?: "UnitNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    location?: {
      __typename?: "LocationNode";
      addressStreetFi?: string | null;
      addressZip: string;
      addressCityFi?: string | null;
    } | null;
    reservationunitSet: Array<{
      __typename?: "ReservationUnitNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      spaces: Array<{
        __typename?: "SpaceNode";
        id: string;
        pk?: number | null;
      }>;
    }>;
    serviceSectors: Array<{
      __typename?: "ServiceSectorNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
    }>;
  } | null;
};

export type ReservationUnitsByUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  state?: InputMaybe<
    | Array<InputMaybe<Scalars["String"]["input"]>>
    | InputMaybe<Scalars["String"]["input"]>
  >;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
}>;

export type ReservationUnitsByUnitQuery = {
  __typename?: "Query";
  unit?: {
    __typename?: "UnitNode";
    id: string;
    reservationunitSet: Array<{
      __typename?: "ReservationUnitNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      isDraft: boolean;
      authentication: Authentication;
      spaces: Array<{
        __typename?: "SpaceNode";
        id: string;
        pk?: number | null;
      }>;
      reservationUnitType?: {
        __typename?: "ReservationUnitTypeNode";
        id: string;
        pk?: number | null;
      } | null;
      reservationSet?: Array<{
        __typename?: "ReservationNode";
        name?: string | null;
        numPersons?: number | null;
        calendarUrl?: string | null;
        affectedReservationUnits?: Array<number | null> | null;
        id: string;
        pk?: number | null;
        begin: string;
        end: string;
        createdAt?: string | null;
        state: State;
        type?: ReservationTypeChoice | null;
        isBlocked?: boolean | null;
        workingMemo?: string | null;
        reserveeName?: string | null;
        bufferTimeBefore: number;
        bufferTimeAfter: number;
        reservationUnit?: Array<{
          __typename?: "ReservationUnitNode";
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          bufferTimeBefore: number;
          bufferTimeAfter: number;
          unit?: {
            __typename?: "UnitNode";
            id: string;
            pk?: number | null;
            serviceSectors: Array<{
              __typename?: "ServiceSectorNode";
              pk?: number | null;
            }>;
          } | null;
        }> | null;
        user?: {
          __typename?: "UserNode";
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          pk?: number | null;
        } | null;
        order?: {
          __typename?: "PaymentOrderNode";
          status?: OrderStatus | null;
        } | null;
      }> | null;
    }>;
  } | null;
  affectingReservations?: Array<{
    __typename?: "ReservationNode";
    name?: string | null;
    numPersons?: number | null;
    calendarUrl?: string | null;
    affectedReservationUnits?: Array<number | null> | null;
    id: string;
    pk?: number | null;
    begin: string;
    end: string;
    createdAt?: string | null;
    state: State;
    type?: ReservationTypeChoice | null;
    isBlocked?: boolean | null;
    workingMemo?: string | null;
    reserveeName?: string | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationUnit?: Array<{
      __typename?: "ReservationUnitNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      unit?: {
        __typename?: "UnitNode";
        id: string;
        pk?: number | null;
        serviceSectors: Array<{
          __typename?: "ServiceSectorNode";
          pk?: number | null;
        }>;
      } | null;
    }> | null;
    user?: {
      __typename?: "UserNode";
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      pk?: number | null;
    } | null;
    order?: {
      __typename?: "PaymentOrderNode";
      status?: OrderStatus | null;
    } | null;
  }> | null;
};

export type ReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationUnitQuery = {
  __typename?: "Query";
  reservationUnit?: {
    __typename?: "ReservationUnitNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    maxPersons?: number | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationStartInterval: ReservationStartInterval;
    authentication: Authentication;
    termsOfUseFi?: string | null;
    unit?: {
      __typename?: "UnitNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      serviceSectors: Array<{
        __typename?: "ServiceSectorNode";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
      }>;
    } | null;
    metadataSet?: {
      __typename?: "ReservationMetadataSetNode";
      id: string;
      name: string;
      supportedFields: Array<{
        __typename?: "ReservationMetadataFieldNode";
        id: string;
        fieldName: string;
      }>;
      requiredFields: Array<{
        __typename?: "ReservationMetadataFieldNode";
        id: string;
        fieldName: string;
      }>;
    } | null;
    cancellationTerms?: {
      __typename?: "TermsOfUseNode";
      id: string;
      textFi?: string | null;
      nameFi?: string | null;
    } | null;
    paymentTerms?: {
      __typename?: "TermsOfUseNode";
      textFi?: string | null;
      nameFi?: string | null;
    } | null;
    pricingTerms?: {
      __typename?: "TermsOfUseNode";
      textFi?: string | null;
      nameFi?: string | null;
    } | null;
    serviceSpecificTerms?: {
      __typename?: "TermsOfUseNode";
      textFi?: string | null;
      nameFi?: string | null;
    } | null;
  } | null;
};

export type RecurringReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type RecurringReservationUnitQuery = {
  __typename?: "Query";
  unit?: {
    __typename?: "UnitNode";
    nameFi?: string | null;
    pk?: number | null;
    reservationunitSet: Array<{
      __typename?: "ReservationUnitNode";
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
    | Array<InputMaybe<Scalars["String"]["input"]>>
    | InputMaybe<Scalars["String"]["input"]>
  >;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
}>;

export type ReservationUnitCalendarQuery = {
  __typename?: "Query";
  reservationUnit?: {
    __typename?: "ReservationUnitNode";
    pk?: number | null;
    reservationSet?: Array<{
      __typename?: "ReservationNode";
      name?: string | null;
      numPersons?: number | null;
      calendarUrl?: string | null;
      affectedReservationUnits?: Array<number | null> | null;
      id: string;
      pk?: number | null;
      begin: string;
      end: string;
      createdAt?: string | null;
      state: State;
      type?: ReservationTypeChoice | null;
      isBlocked?: boolean | null;
      workingMemo?: string | null;
      reserveeName?: string | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      reservationUnit?: Array<{
        __typename?: "ReservationUnitNode";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        bufferTimeBefore: number;
        bufferTimeAfter: number;
        unit?: {
          __typename?: "UnitNode";
          id: string;
          pk?: number | null;
          serviceSectors: Array<{
            __typename?: "ServiceSectorNode";
            pk?: number | null;
          }>;
        } | null;
      }> | null;
      user?: {
        __typename?: "UserNode";
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        pk?: number | null;
      } | null;
      order?: {
        __typename?: "PaymentOrderNode";
        status?: OrderStatus | null;
      } | null;
    }> | null;
  } | null;
  affectingReservations?: Array<{
    __typename?: "ReservationNode";
    name?: string | null;
    numPersons?: number | null;
    calendarUrl?: string | null;
    affectedReservationUnits?: Array<number | null> | null;
    id: string;
    pk?: number | null;
    begin: string;
    end: string;
    createdAt?: string | null;
    state: State;
    type?: ReservationTypeChoice | null;
    isBlocked?: boolean | null;
    workingMemo?: string | null;
    reserveeName?: string | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationUnit?: Array<{
      __typename?: "ReservationUnitNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      unit?: {
        __typename?: "UnitNode";
        id: string;
        pk?: number | null;
        serviceSectors: Array<{
          __typename?: "ServiceSectorNode";
          pk?: number | null;
        }>;
      } | null;
    }> | null;
    user?: {
      __typename?: "UserNode";
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      pk?: number | null;
    } | null;
    order?: {
      __typename?: "PaymentOrderNode";
      status?: OrderStatus | null;
    } | null;
  }> | null;
};

export type BannerNotificationCreateMutationVariables = Exact<{
  input: BannerNotificationCreateMutationInput;
}>;

export type BannerNotificationCreateMutation = {
  __typename?: "Mutation";
  createBannerNotification?: {
    __typename?: "BannerNotificationCreateMutationPayload";
    pk?: number | null;
  } | null;
};

export type BannerNotificationUpdateMutationVariables = Exact<{
  input: BannerNotificationUpdateMutationInput;
}>;

export type BannerNotificationUpdateMutation = {
  __typename?: "Mutation";
  updateBannerNotification?: {
    __typename?: "BannerNotificationUpdateMutationPayload";
    pk?: number | null;
  } | null;
};

export type BannerNotificationDeleteMutationVariables = Exact<{
  input: BannerNotificationDeleteMutationInput;
}>;

export type BannerNotificationDeleteMutation = {
  __typename?: "Mutation";
  deleteBannerNotification?: {
    __typename?: "BannerNotificationDeleteMutationPayload";
    deleted?: boolean | null;
  } | null;
};

export type UpdateReservationWorkingMemoMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
  workingMemo: Scalars["String"]["input"];
}>;

export type UpdateReservationWorkingMemoMutation = {
  __typename?: "Mutation";
  updateReservationWorkingMemo?: {
    __typename?: "ReservationWorkingMemoMutationPayload";
    pk?: number | null;
    workingMemo?: string | null;
  } | null;
};

export type UpdateApplicationWorkingMemoMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
  workingMemo: Scalars["String"]["input"];
}>;

export type UpdateApplicationWorkingMemoMutation = {
  __typename?: "Mutation";
  updateApplication?: {
    __typename?: "ApplicationUpdateMutationPayload";
    pk?: number | null;
    workingMemo?: string | null;
  } | null;
};

export type SearchReservationUnitsQueryVariables = Exact<{
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
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  state?: InputMaybe<
    | Array<InputMaybe<Scalars["String"]["input"]>>
    | InputMaybe<Scalars["String"]["input"]>
  >;
}>;

export type SearchReservationUnitsQuery = {
  __typename?: "Query";
  reservationUnits?: {
    __typename?: "ReservationUnitNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "ReservationUnitNodeEdge";
      node?: {
        __typename?: "ReservationUnitNode";
        pk?: number | null;
        nameFi?: string | null;
        maxPersons?: number | null;
        surfaceArea?: number | null;
        state?: ReservationUnitState | null;
        reservationState?: ReservationState | null;
        unit?: {
          __typename?: "UnitNode";
          nameFi?: string | null;
          pk?: number | null;
        } | null;
        reservationUnitType?: {
          __typename?: "ReservationUnitTypeNode";
          nameFi?: string | null;
        } | null;
      } | null;
    } | null>;
    pageInfo: {
      __typename?: "PageInfo";
      hasNextPage: boolean;
      endCursor?: string | null;
    };
  } | null;
};

export type ReservationMetaFieldsFragment = {
  __typename?: "ReservationNode";
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
    __typename?: "AgeGroupNode";
    minimum: number;
    maximum?: number | null;
    pk?: number | null;
  } | null;
  purpose?: {
    __typename?: "ReservationPurposeNode";
    nameFi?: string | null;
    pk?: number | null;
  } | null;
  homeCity?: {
    __typename?: "CityNode";
    nameFi?: string | null;
    pk?: number | null;
  } | null;
};

export type ReservationUnitPricingFragment = {
  __typename?: "ReservationUnitNode";
  pricings: Array<{
    __typename?: "ReservationUnitPricingNode";
    id: string;
    begins: string;
    priceUnit: PriceUnit;
    pricingType?: PricingType | null;
    lowestPrice: string;
    highestPrice: string;
    status: Status;
    taxPercentage: { __typename?: "TaxPercentageNode"; value: string };
  }>;
};

export type ReservationUnitFragment = {
  __typename?: "ReservationUnitNode";
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  maxPersons?: number | null;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  reservationStartInterval: ReservationStartInterval;
  authentication: Authentication;
  termsOfUseFi?: string | null;
  unit?: {
    __typename?: "UnitNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    serviceSectors: Array<{
      __typename?: "ServiceSectorNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
    }>;
  } | null;
  metadataSet?: {
    __typename?: "ReservationMetadataSetNode";
    id: string;
    name: string;
    supportedFields: Array<{
      __typename?: "ReservationMetadataFieldNode";
      id: string;
      fieldName: string;
    }>;
    requiredFields: Array<{
      __typename?: "ReservationMetadataFieldNode";
      id: string;
      fieldName: string;
    }>;
  } | null;
  cancellationTerms?: {
    __typename?: "TermsOfUseNode";
    id: string;
    textFi?: string | null;
    nameFi?: string | null;
  } | null;
  paymentTerms?: {
    __typename?: "TermsOfUseNode";
    textFi?: string | null;
    nameFi?: string | null;
  } | null;
  pricingTerms?: {
    __typename?: "TermsOfUseNode";
    textFi?: string | null;
    nameFi?: string | null;
  } | null;
  serviceSpecificTerms?: {
    __typename?: "TermsOfUseNode";
    textFi?: string | null;
    nameFi?: string | null;
  } | null;
};

export type ReservationRecurringFragment = {
  __typename?: "ReservationNode";
  recurringReservation?: {
    __typename?: "RecurringReservationNode";
    pk?: number | null;
    beginDate?: string | null;
    endDate?: string | null;
    weekdays?: Array<number | null> | null;
    name: string;
    description: string;
  } | null;
};

export type ReservationCommonFragment = {
  __typename?: "ReservationNode";
  id: string;
  pk?: number | null;
  begin: string;
  end: string;
  createdAt?: string | null;
  state: State;
  type?: ReservationTypeChoice | null;
  isBlocked?: boolean | null;
  workingMemo?: string | null;
  reserveeName?: string | null;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  order?: {
    __typename?: "PaymentOrderNode";
    status?: OrderStatus | null;
  } | null;
  user?: {
    __typename?: "UserNode";
    firstName: string;
    lastName: string;
  } | null;
};

export type ReservationUnitReservationsFragment = {
  __typename?: "ReservationNode";
  name?: string | null;
  numPersons?: number | null;
  calendarUrl?: string | null;
  affectedReservationUnits?: Array<number | null> | null;
  id: string;
  pk?: number | null;
  begin: string;
  end: string;
  createdAt?: string | null;
  state: State;
  type?: ReservationTypeChoice | null;
  isBlocked?: boolean | null;
  workingMemo?: string | null;
  reserveeName?: string | null;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  reservationUnit?: Array<{
    __typename?: "ReservationUnitNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    unit?: {
      __typename?: "UnitNode";
      id: string;
      pk?: number | null;
      serviceSectors: Array<{
        __typename?: "ServiceSectorNode";
        pk?: number | null;
      }>;
    } | null;
  }> | null;
  user?: {
    __typename?: "UserNode";
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    pk?: number | null;
  } | null;
  order?: {
    __typename?: "PaymentOrderNode";
    status?: OrderStatus | null;
  } | null;
};

export type UpdateStaffReservationMutationVariables = Exact<{
  input: ReservationStaffModifyMutationInput;
  workingMemo: ReservationWorkingMemoMutationInput;
}>;

export type UpdateStaffReservationMutation = {
  __typename?: "Mutation";
  staffReservationModify?: {
    __typename?: "ReservationStaffModifyMutationPayload";
    pk?: number | null;
  } | null;
  updateReservationWorkingMemo?: {
    __typename?: "ReservationWorkingMemoMutationPayload";
    workingMemo?: string | null;
  } | null;
};

export type UpdateRecurringReservationMutationVariables = Exact<{
  input: RecurringReservationUpdateMutationInput;
}>;

export type UpdateRecurringReservationMutation = {
  __typename?: "Mutation";
  updateRecurringReservation?: {
    __typename?: "RecurringReservationUpdateMutationPayload";
    pk?: number | null;
  } | null;
};

export type ReservationsQueryVariables = Exact<{
  after?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<
    | Array<InputMaybe<Scalars["ID"]["input"]>>
    | InputMaybe<Scalars["ID"]["input"]>
  >;
  reservationUnitType?: InputMaybe<
    | Array<InputMaybe<Scalars["ID"]["input"]>>
    | InputMaybe<Scalars["ID"]["input"]>
  >;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ReservationOrderingChoices>>
    | InputMaybe<ReservationOrderingChoices>
  >;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  state?: InputMaybe<
    | Array<InputMaybe<Scalars["String"]["input"]>>
    | InputMaybe<Scalars["String"]["input"]>
  >;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  priceGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  priceLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  reservationUnit?: InputMaybe<
    | Array<InputMaybe<Scalars["ID"]["input"]>>
    | InputMaybe<Scalars["ID"]["input"]>
  >;
  orderStatus?: InputMaybe<
    | Array<InputMaybe<Scalars["String"]["input"]>>
    | InputMaybe<Scalars["String"]["input"]>
  >;
}>;

export type ReservationsQuery = {
  __typename?: "Query";
  reservations?: {
    __typename?: "ReservationNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "ReservationNodeEdge";
      node?: {
        __typename?: "ReservationNode";
        name?: string | null;
        id: string;
        pk?: number | null;
        begin: string;
        end: string;
        createdAt?: string | null;
        state: State;
        type?: ReservationTypeChoice | null;
        isBlocked?: boolean | null;
        workingMemo?: string | null;
        reserveeName?: string | null;
        bufferTimeBefore: number;
        bufferTimeAfter: number;
        reservationUnit?: Array<{
          __typename?: "ReservationUnitNode";
          nameFi?: string | null;
          unit?: { __typename?: "UnitNode"; nameFi?: string | null } | null;
        }> | null;
        order?: {
          __typename?: "PaymentOrderNode";
          status?: OrderStatus | null;
        } | null;
        user?: {
          __typename?: "UserNode";
          firstName: string;
          lastName: string;
        } | null;
      } | null;
    } | null>;
    pageInfo: {
      __typename?: "PageInfo";
      endCursor?: string | null;
      hasNextPage: boolean;
    };
  } | null;
};

export type StaffAdjustReservationTimeMutationVariables = Exact<{
  input: ReservationStaffAdjustTimeMutationInput;
}>;

export type StaffAdjustReservationTimeMutation = {
  __typename?: "Mutation";
  staffAdjustReservationTime?: {
    __typename?: "ReservationStaffAdjustTimeMutationPayload";
    pk?: number | null;
    begin?: string | null;
    end?: string | null;
    state?: State | null;
  } | null;
};

export type CalendarReservationFragment = {
  __typename?: "ReservationNode";
  id: string;
  name?: string | null;
  reserveeName?: string | null;
  pk?: number | null;
  begin: string;
  end: string;
  state: State;
  type?: ReservationTypeChoice | null;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  affectedReservationUnits?: Array<number | null> | null;
  user?: { __typename?: "UserNode"; id: string; email: string } | null;
};

export type ReservationsByReservationUnitQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  state?: InputMaybe<
    | Array<InputMaybe<Scalars["String"]["input"]>>
    | InputMaybe<Scalars["String"]["input"]>
  >;
}>;

export type ReservationsByReservationUnitQuery = {
  __typename?: "Query";
  reservationUnit?: {
    __typename?: "ReservationUnitNode";
    id: string;
    reservationSet?: Array<{
      __typename?: "ReservationNode";
      id: string;
      name?: string | null;
      reserveeName?: string | null;
      pk?: number | null;
      begin: string;
      end: string;
      state: State;
      type?: ReservationTypeChoice | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      affectedReservationUnits?: Array<number | null> | null;
      user?: { __typename?: "UserNode"; id: string; email: string } | null;
    }> | null;
  } | null;
  affectingReservations?: Array<{
    __typename?: "ReservationNode";
    id: string;
    name?: string | null;
    reserveeName?: string | null;
    pk?: number | null;
    begin: string;
    end: string;
    state: State;
    type?: ReservationTypeChoice | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    affectedReservationUnits?: Array<number | null> | null;
    user?: { __typename?: "UserNode"; id: string; email: string } | null;
  }> | null;
};

export type ReservationSpecialisationFragment = {
  __typename?: "ReservationNode";
  calendarUrl?: string | null;
  price?: string | null;
  taxPercentageValue?: string | null;
  handlingDetails?: string | null;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  order?: {
    __typename?: "PaymentOrderNode";
    orderUuid?: string | null;
    refundUuid?: string | null;
  } | null;
  cancelReason?: {
    __typename?: "ReservationCancelReasonNode";
    reasonFi?: string | null;
  } | null;
  denyReason?: {
    __typename?: "ReservationDenyReasonNode";
    reasonFi?: string | null;
  } | null;
  user?: {
    __typename?: "UserNode";
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
  __typename?: "Query";
  reservation?: {
    __typename?: "ReservationNode";
    id: string;
    pk?: number | null;
    begin: string;
    end: string;
    createdAt?: string | null;
    state: State;
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
    reservationUnit?: Array<{
      __typename?: "ReservationUnitNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      maxPersons?: number | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      reservationStartInterval: ReservationStartInterval;
      authentication: Authentication;
      termsOfUseFi?: string | null;
      unit?: {
        __typename?: "UnitNode";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        serviceSectors: Array<{
          __typename?: "ServiceSectorNode";
          id: string;
          pk?: number | null;
          nameFi?: string | null;
        }>;
      } | null;
      metadataSet?: {
        __typename?: "ReservationMetadataSetNode";
        id: string;
        name: string;
        supportedFields: Array<{
          __typename?: "ReservationMetadataFieldNode";
          id: string;
          fieldName: string;
        }>;
        requiredFields: Array<{
          __typename?: "ReservationMetadataFieldNode";
          id: string;
          fieldName: string;
        }>;
      } | null;
      cancellationTerms?: {
        __typename?: "TermsOfUseNode";
        id: string;
        textFi?: string | null;
        nameFi?: string | null;
      } | null;
      paymentTerms?: {
        __typename?: "TermsOfUseNode";
        textFi?: string | null;
        nameFi?: string | null;
      } | null;
      pricingTerms?: {
        __typename?: "TermsOfUseNode";
        textFi?: string | null;
        nameFi?: string | null;
      } | null;
      serviceSpecificTerms?: {
        __typename?: "TermsOfUseNode";
        textFi?: string | null;
        nameFi?: string | null;
      } | null;
      pricings: Array<{
        __typename?: "ReservationUnitPricingNode";
        id: string;
        begins: string;
        priceUnit: PriceUnit;
        pricingType?: PricingType | null;
        lowestPrice: string;
        highestPrice: string;
        status: Status;
        taxPercentage: { __typename?: "TaxPercentageNode"; value: string };
      }>;
    }> | null;
    order?: {
      __typename?: "PaymentOrderNode";
      status?: OrderStatus | null;
      orderUuid?: string | null;
      refundUuid?: string | null;
    } | null;
    user?: {
      __typename?: "UserNode";
      firstName: string;
      lastName: string;
      email: string;
      pk?: number | null;
    } | null;
    recurringReservation?: {
      __typename?: "RecurringReservationNode";
      pk?: number | null;
      beginDate?: string | null;
      endDate?: string | null;
      weekdays?: Array<number | null> | null;
      name: string;
      description: string;
    } | null;
    cancelReason?: {
      __typename?: "ReservationCancelReasonNode";
      reasonFi?: string | null;
    } | null;
    denyReason?: {
      __typename?: "ReservationDenyReasonNode";
      reasonFi?: string | null;
    } | null;
    ageGroup?: {
      __typename?: "AgeGroupNode";
      minimum: number;
      maximum?: number | null;
      pk?: number | null;
    } | null;
    purpose?: {
      __typename?: "ReservationPurposeNode";
      nameFi?: string | null;
      pk?: number | null;
    } | null;
    homeCity?: {
      __typename?: "CityNode";
      nameFi?: string | null;
      pk?: number | null;
    } | null;
  } | null;
};

export type RecurringReservationQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type RecurringReservationQuery = {
  __typename?: "Query";
  recurringReservation?: {
    __typename?: "RecurringReservationNode";
    id: string;
    pk?: number | null;
    weekdays?: Array<number | null> | null;
    beginDate?: string | null;
    endDate?: string | null;
    reservations: Array<{
      __typename?: "ReservationNode";
      id: string;
      pk?: number | null;
      begin: string;
      end: string;
      state: State;
      reservationUnit?: Array<{
        __typename?: "ReservationUnitNode";
        id: string;
        pk?: number | null;
      }> | null;
    }>;
  } | null;
};

export type ApproveReservationMutationVariables = Exact<{
  input: ReservationApproveMutationInput;
}>;

export type ApproveReservationMutation = {
  __typename?: "Mutation";
  approveReservation?: {
    __typename?: "ReservationApproveMutationPayload";
    pk?: number | null;
    state?: State | null;
  } | null;
};

export type DenyReservationMutationVariables = Exact<{
  input: ReservationDenyMutationInput;
}>;

export type DenyReservationMutation = {
  __typename?: "Mutation";
  denyReservation?: {
    __typename?: "ReservationDenyMutationPayload";
    pk?: number | null;
    state?: State | null;
  } | null;
};

export type RefundReservationMutationVariables = Exact<{
  input: ReservationRefundMutationInput;
}>;

export type RefundReservationMutation = {
  __typename?: "Mutation";
  refundReservation?: {
    __typename?: "ReservationRefundMutationPayload";
    pk?: number | null;
  } | null;
};

export type RequireHandlingMutationVariables = Exact<{
  input: ReservationRequiresHandlingMutationInput;
}>;

export type RequireHandlingMutation = {
  __typename?: "Mutation";
  requireHandlingForReservation?: {
    __typename?: "ReservationRequiresHandlingMutationPayload";
    pk?: number | null;
    state?: State | null;
  } | null;
};

export type ReservationDenyReasonsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type ReservationDenyReasonsQuery = {
  __typename?: "Query";
  reservationDenyReasons?: {
    __typename?: "ReservationDenyReasonNodeConnection";
    edges: Array<{
      __typename?: "ReservationDenyReasonNodeEdge";
      node?: {
        __typename?: "ReservationDenyReasonNode";
        id: string;
        pk?: number | null;
        reasonFi?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type CurrentUserQueryVariables = Exact<{ [key: string]: never }>;

export type CurrentUserQuery = {
  __typename?: "Query";
  currentUser?: {
    __typename?: "UserNode";
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    isSuperuser: boolean;
    pk?: number | null;
    unitRoles: Array<{
      __typename?: "UnitRoleNode";
      pk?: number | null;
      role: {
        __typename?: "UnitRoleChoiceNode";
        code: string;
        verboseNameFi?: string | null;
        permissions?: Array<{
          __typename?: "UnitRolePermissionNode";
          permission?: UnitPermissionChoices | null;
        }> | null;
      };
      unit: Array<{
        __typename?: "UnitNode";
        pk?: number | null;
        nameFi?: string | null;
      }>;
      unitGroup: Array<{
        __typename?: "UnitGroupNode";
        units: Array<{
          __typename?: "UnitNode";
          pk?: number | null;
          nameFi?: string | null;
        }>;
      }>;
    }>;
    serviceSectorRoles: Array<{
      __typename?: "ServiceSectorRoleNode";
      pk?: number | null;
      serviceSector: {
        __typename?: "ServiceSectorNode";
        pk?: number | null;
        nameFi?: string | null;
      };
      role: {
        __typename?: "ServiceSectorRoleChoiceNode";
        permissions?: Array<{
          __typename?: "ServiceSectorRolePermissionNode";
          permission?: ServiceSectorPermissionsChoices | null;
        }> | null;
      };
    }>;
    generalRoles: Array<{
      __typename?: "GeneralRoleNode";
      pk?: number | null;
      role: {
        __typename?: "GeneralRoleChoiceNode";
        code: string;
        verboseNameFi?: string | null;
        permissions?: Array<{
          __typename?: "GeneralRolePermissionNode";
          permission?: GeneralPermissionChoices | null;
        }> | null;
      };
    }>;
  } | null;
};

export type ReservationUnitEditQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ReservationUnitEditQuery = {
  __typename?: "Query";
  reservationUnit?: {
    __typename?: "ReservationUnitNode";
    id: string;
    pk?: number | null;
    state?: ReservationUnitState | null;
    reservationState?: ReservationState | null;
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
      __typename?: "ReservationUnitImageNode";
      pk?: number | null;
      imageUrl?: string | null;
      largeUrl?: string | null;
      mediumUrl?: string | null;
      smallUrl?: string | null;
      imageType: ImageType;
    }>;
    cancellationRule?: {
      __typename?: "ReservationUnitCancellationRuleNode";
      pk?: number | null;
    } | null;
    spaces: Array<{
      __typename?: "SpaceNode";
      pk?: number | null;
      nameFi?: string | null;
    }>;
    resources: Array<{
      __typename?: "ResourceNode";
      pk?: number | null;
      nameFi?: string | null;
    }>;
    purposes: Array<{
      __typename?: "PurposeNode";
      pk?: number | null;
      nameFi?: string | null;
    }>;
    paymentTypes: Array<{
      __typename?: "ReservationUnitPaymentTypeNode";
      code: string;
    }>;
    pricingTerms?: { __typename?: "TermsOfUseNode"; pk?: string | null } | null;
    reservationUnitType?: {
      __typename?: "ReservationUnitTypeNode";
      pk?: number | null;
      nameFi?: string | null;
    } | null;
    equipments: Array<{
      __typename?: "EquipmentNode";
      pk?: number | null;
      nameFi?: string | null;
    }>;
    qualifiers: Array<{
      __typename?: "QualifierNode";
      pk?: number | null;
      nameFi?: string | null;
    }>;
    unit?: {
      __typename?: "UnitNode";
      pk?: number | null;
      nameFi?: string | null;
    } | null;
    paymentTerms?: { __typename?: "TermsOfUseNode"; pk?: string | null } | null;
    cancellationTerms?: {
      __typename?: "TermsOfUseNode";
      pk?: string | null;
    } | null;
    serviceSpecificTerms?: {
      __typename?: "TermsOfUseNode";
      pk?: string | null;
    } | null;
    metadataSet?: {
      __typename?: "ReservationMetadataSetNode";
      pk?: number | null;
    } | null;
    pricings: Array<{
      __typename?: "ReservationUnitPricingNode";
      lowestPriceNet?: string | null;
      highestPriceNet?: string | null;
      pk?: number | null;
      begins: string;
      priceUnit: PriceUnit;
      pricingType?: PricingType | null;
      lowestPrice: string;
      highestPrice: string;
      status: Status;
      taxPercentage: {
        __typename?: "TaxPercentageNode";
        pk?: number | null;
        value: string;
      };
    }>;
    applicationRoundTimeSlots: Array<{
      __typename?: "ApplicationRoundTimeSlotNode";
      pk?: number | null;
      closed: boolean;
      weekday: number;
      reservableTimes?: Array<{
        __typename?: "TimeSlotType";
        begin: string;
        end: string;
      } | null> | null;
    }>;
  } | null;
};

export type UpdateReservationUnitMutationVariables = Exact<{
  input: ReservationUnitUpdateMutationInput;
}>;

export type UpdateReservationUnitMutation = {
  __typename?: "Mutation";
  updateReservationUnit?: {
    __typename?: "ReservationUnitUpdateMutationPayload";
    pk?: number | null;
  } | null;
};

export type CreateReservationUnitMutationVariables = Exact<{
  input: ReservationUnitCreateMutationInput;
}>;

export type CreateReservationUnitMutation = {
  __typename?: "Mutation";
  createReservationUnit?: {
    __typename?: "ReservationUnitCreateMutationPayload";
    pk?: number | null;
  } | null;
};

export type CreateImageMutationVariables = Exact<{
  image: Scalars["Upload"]["input"];
  reservationUnit: Scalars["Int"]["input"];
  imageType: ImageType;
}>;

export type CreateImageMutation = {
  __typename?: "Mutation";
  createReservationUnitImage?: {
    __typename?: "ReservationUnitImageCreateMutationPayload";
    pk?: number | null;
  } | null;
};

export type DeleteImageMutationVariables = Exact<{
  pk: Scalars["ID"]["input"];
}>;

export type DeleteImageMutation = {
  __typename?: "Mutation";
  deleteReservationUnitImage?: {
    __typename?: "ReservationUnitImageDeleteMutationPayload";
    deleted?: boolean | null;
  } | null;
};

export type UpdateImageMutationVariables = Exact<{
  pk: Scalars["Int"]["input"];
  imageType: ImageType;
}>;

export type UpdateImageMutation = {
  __typename?: "Mutation";
  updateReservationUnitImage?: {
    __typename?: "ReservationUnitImageUpdateMutationPayload";
    pk?: number | null;
  } | null;
};

export type ReservationUnitEditorParametersQueryVariables = Exact<{
  [key: string]: never;
}>;

export type ReservationUnitEditorParametersQuery = {
  __typename?: "Query";
  equipments?: {
    __typename?: "EquipmentNodeConnection";
    edges: Array<{
      __typename?: "EquipmentNodeEdge";
      node?: {
        __typename?: "EquipmentNode";
        nameFi?: string | null;
        pk?: number | null;
      } | null;
    } | null>;
  } | null;
  taxPercentages?: {
    __typename?: "TaxPercentageNodeConnection";
    edges: Array<{
      __typename?: "TaxPercentageNodeEdge";
      node?: {
        __typename?: "TaxPercentageNode";
        pk?: number | null;
        value: string;
      } | null;
    } | null>;
  } | null;
  purposes?: {
    __typename?: "PurposeNodeConnection";
    edges: Array<{
      __typename?: "PurposeNodeEdge";
      node?: {
        __typename?: "PurposeNode";
        pk?: number | null;
        nameFi?: string | null;
      } | null;
    } | null>;
  } | null;
  reservationUnitTypes?: {
    __typename?: "ReservationUnitTypeNodeConnection";
    edges: Array<{
      __typename?: "ReservationUnitTypeNodeEdge";
      node?: {
        __typename?: "ReservationUnitTypeNode";
        nameFi?: string | null;
        pk?: number | null;
      } | null;
    } | null>;
  } | null;
  termsOfUse?: {
    __typename?: "TermsOfUseNodeConnection";
    edges: Array<{
      __typename?: "TermsOfUseNodeEdge";
      node?: {
        __typename?: "TermsOfUseNode";
        pk?: string | null;
        nameFi?: string | null;
        termsType: TermsType;
      } | null;
    } | null>;
  } | null;
  reservationUnitCancellationRules?: {
    __typename?: "ReservationUnitCancellationRuleNodeConnection";
    edges: Array<{
      __typename?: "ReservationUnitCancellationRuleNodeEdge";
      node?: {
        __typename?: "ReservationUnitCancellationRuleNode";
        nameFi?: string | null;
        pk?: number | null;
      } | null;
    } | null>;
  } | null;
  metadataSets?: {
    __typename?: "ReservationMetadataSetNodeConnection";
    edges: Array<{
      __typename?: "ReservationMetadataSetNodeEdge";
      node?: {
        __typename?: "ReservationMetadataSetNode";
        name: string;
        pk?: number | null;
      } | null;
    } | null>;
  } | null;
  qualifiers?: {
    __typename?: "QualifierNodeConnection";
    edges: Array<{
      __typename?: "QualifierNodeEdge";
      node?: {
        __typename?: "QualifierNode";
        nameFi?: string | null;
        pk?: number | null;
      } | null;
    } | null>;
  } | null;
};

export type ApplicationAdminQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationAdminQuery = {
  __typename?: "Query";
  application?: {
    __typename?: "ApplicationNode";
    workingMemo: string;
    pk?: number | null;
    id: string;
    status?: ApplicationStatusChoice | null;
    lastModifiedDate: string;
    applicantType?: ApplicantTypeChoice | null;
    additionalInformation?: string | null;
    applicationRound: {
      __typename?: "ApplicationRoundNode";
      pk?: number | null;
      nameFi?: string | null;
    };
    applicationSections?: Array<{
      __typename?: "ApplicationSectionNode";
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
        __typename?: "ReservationUnitOptionNode";
        rejected: boolean;
        pk?: number | null;
        preferredOrder: number;
        allocatedTimeSlots: Array<{
          __typename?: "AllocatedTimeSlotNode";
          pk?: number | null;
          id: string;
        }>;
        reservationUnit: {
          __typename?: "ReservationUnitNode";
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          unit?: {
            __typename?: "UnitNode";
            pk?: number | null;
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
          } | null;
          applicationRoundTimeSlots: Array<{
            __typename?: "ApplicationRoundTimeSlotNode";
            weekday: number;
            reservableTimes?: Array<{
              __typename?: "TimeSlotType";
              begin: string;
              end: string;
            } | null> | null;
          }>;
        };
      }>;
      suitableTimeRanges: Array<{
        __typename?: "SuitableTimeRangeNode";
        beginTime: string;
        endTime: string;
        dayOfTheWeek: Weekday;
        priority: Priority;
      }>;
      purpose?: {
        __typename?: "ReservationPurposeNode";
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
      ageGroup?: {
        __typename?: "AgeGroupNode";
        pk?: number | null;
        minimum: number;
        maximum?: number | null;
      } | null;
    }> | null;
    contactPerson?: {
      __typename?: "PersonNode";
      pk?: number | null;
      firstName: string;
      lastName: string;
      email?: string | null;
      phoneNumber?: string | null;
    } | null;
    organisation?: {
      __typename?: "OrganisationNode";
      pk?: number | null;
      name: string;
      identifier?: string | null;
      organisationType: OrganizationTypeChoice;
      coreBusiness: string;
      address?: {
        __typename?: "AddressNode";
        postCode: string;
        streetAddress: string;
        city: string;
      } | null;
    } | null;
    homeCity?: {
      __typename?: "CityNode";
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    billingAddress?: {
      __typename?: "AddressNode";
      pk?: number | null;
      postCode: string;
      streetAddress: string;
      city: string;
    } | null;
    user?: {
      __typename?: "ApplicantNode";
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
  __typename?: "Mutation";
  rejectAllSectionOptions?: {
    __typename?: "RejectAllSectionOptionsMutationPayload";
    pk?: number | null;
  } | null;
};

export type RestoreAllSectionOptionsMutationVariables = Exact<{
  input: RestoreAllSectionOptionsMutationInput;
}>;

export type RestoreAllSectionOptionsMutation = {
  __typename?: "Mutation";
  restoreAllSectionOptions?: {
    __typename?: "RestoreAllSectionOptionsMutationPayload";
    pk?: number | null;
  } | null;
};

export type RejectAllApplicationOptionsMutationVariables = Exact<{
  input: RejectAllApplicationOptionsMutationInput;
}>;

export type RejectAllApplicationOptionsMutation = {
  __typename?: "Mutation";
  rejectAllApplicationOptions?: {
    __typename?: "RejectAllApplicationOptionsMutationPayload";
    pk?: number | null;
  } | null;
};

export type RestoreAllApplicationOptionsMutationVariables = Exact<{
  input: RestoreAllApplicationOptionsMutationInput;
}>;

export type RestoreAllApplicationOptionsMutation = {
  __typename?: "Mutation";
  restoreAllApplicationOptions?: {
    __typename?: "RestoreAllApplicationOptionsMutationPayload";
    pk?: number | null;
  } | null;
};

export type ApplicationRoundFilterQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRoundFilterQuery = {
  __typename?: "Query";
  applicationRound?: {
    __typename?: "ApplicationRoundNode";
    nameFi?: string | null;
    status?: ApplicationRoundStatusChoice | null;
    reservationPeriodBegin: string;
    reservationPeriodEnd: string;
    reservationUnits: Array<{
      __typename?: "ReservationUnitNode";
      pk?: number | null;
      nameFi?: string | null;
      unit?: {
        __typename?: "UnitNode";
        pk?: number | null;
        nameFi?: string | null;
      } | null;
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
  __typename?: "Query";
  applicationSections?: {
    __typename?: "ApplicationSectionNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "ApplicationSectionNodeEdge";
      node?: {
        __typename?: "ApplicationSectionNode";
        reservationUnitOptions: Array<{
          __typename?: "ReservationUnitOptionNode";
          reservationUnit: {
            __typename?: "ReservationUnitNode";
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
  __typename?: "Mutation";
  createAllocatedTimeslot?: {
    __typename?: "AllocatedTimeSlotCreateMutationPayload";
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
  __typename?: "Mutation";
  deleteAllocatedTimeslot?: {
    __typename?: "AllocatedTimeSlotDeleteMutationPayload";
    deleted?: boolean | null;
  } | null;
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
}>;

export type ApplicationSectionAllocationsQuery = {
  __typename?: "Query";
  applicationSections?: {
    __typename?: "ApplicationSectionNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "ApplicationSectionNodeEdge";
      node?: {
        __typename?: "ApplicationSectionNode";
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
        suitableTimeRanges: Array<{
          __typename?: "SuitableTimeRangeNode";
          beginTime: string;
          endTime: string;
          dayOfTheWeek: Weekday;
          priority: Priority;
          fulfilled?: boolean | null;
        }>;
        reservationUnitOptions: Array<{
          __typename?: "ReservationUnitOptionNode";
          locked: boolean;
          rejected: boolean;
          pk?: number | null;
          preferredOrder: number;
          allocatedTimeSlots: Array<{
            __typename?: "AllocatedTimeSlotNode";
            pk?: number | null;
            dayOfTheWeek: Weekday;
            beginTime: string;
            endTime: string;
            reservationUnitOption: {
              __typename?: "ReservationUnitOptionNode";
              applicationSection: {
                __typename?: "ApplicationSectionNode";
                pk?: number | null;
              };
            };
          }>;
          reservationUnit: {
            __typename?: "ReservationUnitNode";
            pk?: number | null;
            nameFi?: string | null;
            unit?: {
              __typename?: "UnitNode";
              pk?: number | null;
              nameFi?: string | null;
            } | null;
          };
        }>;
        purpose?: {
          __typename?: "ReservationPurposeNode";
          pk?: number | null;
          nameFi?: string | null;
        } | null;
        application: {
          __typename?: "ApplicationNode";
          pk?: number | null;
          status?: ApplicationStatusChoice | null;
          applicantType?: ApplicantTypeChoice | null;
          organisation?: {
            __typename?: "OrganisationNode";
            name: string;
            organisationType: OrganizationTypeChoice;
          } | null;
          contactPerson?: {
            __typename?: "PersonNode";
            lastName: string;
            firstName: string;
          } | null;
        };
        ageGroup?: {
          __typename?: "AgeGroupNode";
          pk?: number | null;
          minimum: number;
          maximum?: number | null;
        } | null;
      } | null;
    } | null>;
  } | null;
  affectingAllocatedTimeSlots?: Array<{
    __typename?: "AllocatedTimeSlotNode";
    beginTime: string;
    dayOfTheWeek: Weekday;
    endTime: string;
  }> | null;
};

export type GetAffectingAllocationsQueryVariables = Exact<{
  reservationUnit: Scalars["Int"]["input"];
  beginDate: Scalars["Date"]["input"];
  endDate: Scalars["Date"]["input"];
}>;

export type GetAffectingAllocationsQuery = {
  __typename?: "Query";
  affectingAllocatedTimeSlots?: Array<{
    __typename?: "AllocatedTimeSlotNode";
    beginTime: string;
    dayOfTheWeek: Weekday;
    endTime: string;
  }> | null;
};

export type RejectRestMutationVariables = Exact<{
  input: ReservationUnitOptionUpdateMutationInput;
}>;

export type RejectRestMutation = {
  __typename?: "Mutation";
  updateReservationUnitOption?: {
    __typename?: "ReservationUnitOptionUpdateMutationPayload";
    pk?: number | null;
    rejected?: boolean | null;
    locked?: boolean | null;
  } | null;
};

export type ApplicationRoundCriteriaQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRoundCriteriaQuery = {
  __typename?: "Query";
  applicationRound?: {
    __typename?: "ApplicationRoundNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    reservationUnitCount?: number | null;
    applicationPeriodBegin: string;
    applicationPeriodEnd: string;
    reservationPeriodBegin: string;
    reservationPeriodEnd: string;
    reservationUnits: Array<{
      __typename?: "ReservationUnitNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      spaces: Array<{
        __typename?: "SpaceNode";
        id: string;
        nameFi?: string | null;
      }>;
      unit?: {
        __typename?: "UnitNode";
        id: string;
        nameFi?: string | null;
      } | null;
    }>;
  } | null;
};

export type GetApplicationsQueryVariables = Exact<{
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
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetApplicationsQuery = {
  __typename?: "Query";
  applications?: {
    __typename?: "ApplicationNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "ApplicationNodeEdge";
      node?: {
        __typename?: "ApplicationNode";
        pk?: number | null;
        status?: ApplicationStatusChoice | null;
        applicantType?: ApplicantTypeChoice | null;
        applicationSections?: Array<{
          __typename?: "ApplicationSectionNode";
          name: string;
          pk?: number | null;
          reservationsEndDate: string;
          reservationsBeginDate: string;
          appliedReservationsPerWeek: number;
          reservationMinDuration: number;
          reservationUnitOptions: Array<{
            __typename?: "ReservationUnitOptionNode";
            preferredOrder: number;
            reservationUnit: {
              __typename?: "ReservationUnitNode";
              unit?: {
                __typename?: "UnitNode";
                pk?: number | null;
                nameFi?: string | null;
              } | null;
            };
          }>;
        }> | null;
        organisation?: {
          __typename?: "OrganisationNode";
          name: string;
          organisationType: OrganizationTypeChoice;
        } | null;
        contactPerson?: {
          __typename?: "PersonNode";
          lastName: string;
          firstName: string;
        } | null;
      } | null;
    } | null>;
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
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type ApplicationSectionsQuery = {
  __typename?: "Query";
  applicationSections?: {
    __typename?: "ApplicationSectionNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "ApplicationSectionNodeEdge";
      node?: {
        __typename?: "ApplicationSectionNode";
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
          __typename?: "ReservationUnitOptionNode";
          pk?: number | null;
          preferredOrder: number;
          allocatedTimeSlots: Array<{
            __typename?: "AllocatedTimeSlotNode";
            pk?: number | null;
            dayOfTheWeek: Weekday;
            beginTime: string;
            endTime: string;
            reservationUnitOption: {
              __typename?: "ReservationUnitOptionNode";
              applicationSection: {
                __typename?: "ApplicationSectionNode";
                pk?: number | null;
              };
            };
          }>;
          reservationUnit: {
            __typename?: "ReservationUnitNode";
            pk?: number | null;
            nameFi?: string | null;
            unit?: {
              __typename?: "UnitNode";
              pk?: number | null;
              nameFi?: string | null;
            } | null;
          };
        }>;
        purpose?: {
          __typename?: "ReservationPurposeNode";
          pk?: number | null;
          nameFi?: string | null;
        } | null;
        application: {
          __typename?: "ApplicationNode";
          pk?: number | null;
          status?: ApplicationStatusChoice | null;
          applicantType?: ApplicantTypeChoice | null;
          organisation?: {
            __typename?: "OrganisationNode";
            name: string;
            organisationType: OrganizationTypeChoice;
          } | null;
          contactPerson?: {
            __typename?: "PersonNode";
            lastName: string;
            firstName: string;
          } | null;
        };
        ageGroup?: {
          __typename?: "AgeGroupNode";
          pk?: number | null;
          minimum: number;
          maximum?: number | null;
        } | null;
      } | null;
    } | null>;
  } | null;
};

export type GetAllocatedTimeSlotsQueryVariables = Exact<{
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
  first?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetAllocatedTimeSlotsQuery = {
  __typename?: "Query";
  allocatedTimeSlots?: {
    __typename?: "AllocatedTimeSlotNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "AllocatedTimeSlotNodeEdge";
      node?: {
        __typename?: "AllocatedTimeSlotNode";
        pk?: number | null;
        dayOfTheWeek: Weekday;
        endTime: string;
        beginTime: string;
        reservationUnitOption: {
          __typename?: "ReservationUnitOptionNode";
          rejected: boolean;
          locked: boolean;
          preferredOrder: number;
          applicationSection: {
            __typename?: "ApplicationSectionNode";
            pk?: number | null;
            name: string;
            reservationsEndDate: string;
            reservationsBeginDate: string;
            reservationMinDuration: number;
            reservationMaxDuration: number;
            application: {
              __typename?: "ApplicationNode";
              pk?: number | null;
              applicantType?: ApplicantTypeChoice | null;
              organisation?: {
                __typename?: "OrganisationNode";
                name: string;
                organisationType: OrganizationTypeChoice;
              } | null;
              contactPerson?: {
                __typename?: "PersonNode";
                lastName: string;
                firstName: string;
              } | null;
            };
          };
          reservationUnit: {
            __typename?: "ReservationUnitNode";
            nameFi?: string | null;
            unit?: { __typename?: "UnitNode"; nameFi?: string | null } | null;
          };
        };
      } | null;
    } | null>;
  } | null;
};

export type ApplicationRoundBaseFragment = {
  __typename?: "ApplicationRoundNode";
  pk?: number | null;
  nameFi?: string | null;
  status?: ApplicationRoundStatusChoice | null;
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
};

export type ApplicationRoundsQueryVariables = Exact<{ [key: string]: never }>;

export type ApplicationRoundsQuery = {
  __typename?: "Query";
  applicationRounds?: {
    __typename?: "ApplicationRoundNodeConnection";
    edges: Array<{
      __typename?: "ApplicationRoundNodeEdge";
      node?: {
        __typename?: "ApplicationRoundNode";
        reservationPeriodBegin: string;
        reservationPeriodEnd: string;
        applicationsCount?: number | null;
        reservationUnitCount?: number | null;
        statusTimestamp?: string | null;
        pk?: number | null;
        nameFi?: string | null;
        status?: ApplicationRoundStatusChoice | null;
        applicationPeriodBegin: string;
        applicationPeriodEnd: string;
        serviceSector?: {
          __typename?: "ServiceSectorNode";
          pk?: number | null;
          nameFi?: string | null;
        } | null;
      } | null;
    } | null>;
  } | null;
};

export type ApplicationRoundAdminFragmentFragment = {
  __typename?: "ApplicationRoundNode";
  id: string;
  applicationsCount?: number | null;
  pk?: number | null;
  nameFi?: string | null;
  status?: ApplicationRoundStatusChoice | null;
  applicationPeriodBegin: string;
  applicationPeriodEnd: string;
  reservationUnits: Array<{
    __typename?: "ReservationUnitNode";
    pk?: number | null;
    nameFi?: string | null;
    unit?: {
      __typename?: "UnitNode";
      pk?: number | null;
      nameFi?: string | null;
    } | null;
  }>;
};

export type ApplicationRoundQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApplicationRoundQuery = {
  __typename?: "Query";
  applicationRound?: {
    __typename?: "ApplicationRoundNode";
    id: string;
    applicationsCount?: number | null;
    pk?: number | null;
    nameFi?: string | null;
    status?: ApplicationRoundStatusChoice | null;
    applicationPeriodBegin: string;
    applicationPeriodEnd: string;
    reservationUnits: Array<{
      __typename?: "ReservationUnitNode";
      pk?: number | null;
      nameFi?: string | null;
      unit?: {
        __typename?: "UnitNode";
        pk?: number | null;
        nameFi?: string | null;
      } | null;
    }>;
  } | null;
};

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
export const BannerNotificationsAdminFragmentFragmentDoc = gql`
  fragment BannerNotificationsAdminFragment on BannerNotificationNode {
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
export const ApplicationSectionDurationFragmentFragmentDoc = gql`
  fragment ApplicationSectionDurationFragment on ApplicationSectionNode {
    reservationsEndDate
    reservationsBeginDate
    appliedReservationsPerWeek
    reservationMinDuration
  }
`;
export const ApplicationSectionCommonFragmentFragmentDoc = gql`
  fragment ApplicationSectionCommonFragment on ApplicationSectionNode {
    pk
    name
    status
    ...ApplicationSectionDurationFragment
    reservationMaxDuration
    ageGroup {
      pk
      minimum
      maximum
    }
    numPersons
    reservationUnitOptions {
      pk
      preferredOrder
    }
  }
  ${ApplicationSectionDurationFragmentFragmentDoc}
`;
export const ApplicationNameFragmentFragmentDoc = gql`
  fragment ApplicationNameFragment on ApplicationNode {
    applicantType
    organisation {
      name
      organisationType
    }
    contactPerson {
      lastName
      firstName
    }
  }
`;
export const ApplicationSectionFragmentFragmentDoc = gql`
  fragment ApplicationSectionFragment on ApplicationSectionNode {
    ...ApplicationSectionCommonFragment
    purpose {
      pk
      nameFi
    }
    application {
      pk
      status
      ...ApplicationNameFragment
    }
    reservationUnitOptions {
      reservationUnit {
        pk
        nameFi
        unit {
          pk
          nameFi
        }
      }
    }
  }
  ${ApplicationSectionCommonFragmentFragmentDoc}
  ${ApplicationNameFragmentFragmentDoc}
`;
export const ApplicantFragmentFragmentDoc = gql`
  fragment ApplicantFragment on ApplicationNode {
    applicantType
    contactPerson {
      pk
      firstName
      lastName
      email
      phoneNumber
    }
    additionalInformation
    organisation {
      pk
      name
      identifier
      organisationType
      coreBusiness
      address {
        postCode
        streetAddress
        city
      }
    }
    homeCity {
      pk
      nameFi
      nameEn
      nameSv
    }
    billingAddress {
      pk
      postCode
      streetAddress
      city
    }
    user {
      name
      email
      pk
    }
  }
`;
export const ApplicationSectionUiFragmentFragmentDoc = gql`
  fragment ApplicationSectionUIFragment on ApplicationSectionNode {
    ...ApplicationSectionCommonFragment
    suitableTimeRanges {
      beginTime
      endTime
      dayOfTheWeek
      priority
    }
    purpose {
      pk
      nameFi
      nameSv
      nameEn
    }
    reservationUnitOptions {
      reservationUnit {
        pk
        nameFi
        nameEn
        nameSv
        unit {
          pk
          nameFi
          nameEn
          nameSv
        }
        applicationRoundTimeSlots {
          weekday
          reservableTimes {
            begin
            end
          }
        }
      }
    }
  }
  ${ApplicationSectionCommonFragmentFragmentDoc}
`;
export const ApplicationAdminFragmentFragmentDoc = gql`
  fragment ApplicationAdminFragment on ApplicationNode {
    pk
    id
    status
    lastModifiedDate
    ...ApplicantFragment
    applicationRound {
      pk
      nameFi
    }
    applicationSections {
      ...ApplicationSectionUIFragment
      allocations
      reservationUnitOptions {
        rejected
        allocatedTimeSlots {
          pk
          id
        }
      }
    }
  }
  ${ApplicantFragmentFragmentDoc}
  ${ApplicationSectionUiFragmentFragmentDoc}
`;
export const ImageFragmentFragmentDoc = gql`
  fragment ImageFragment on ReservationUnitImageNode {
    imageUrl
    largeUrl
    mediumUrl
    smallUrl
    imageType
  }
`;
export const ApplicationRoundFragmentFragmentDoc = gql`
  fragment ApplicationRoundFragment on ApplicationRoundNode {
    pk
    nameFi
    nameSv
    nameEn
    serviceSector {
      pk
      nameFi
    }
    reservationUnits {
      pk
      nameFi
      nameSv
      nameEn
      minPersons
      maxPersons
      images {
        ...ImageFragment
      }
      unit {
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
  ${ImageFragmentFragmentDoc}
`;
export const ApplicationCommonFragmentDoc = gql`
  fragment ApplicationCommon on ApplicationNode {
    pk
    status
    lastModifiedDate
    ...ApplicantFragment
    applicationRound {
      ...ApplicationRoundFragment
    }
    applicationSections {
      ...ApplicationSectionUIFragment
    }
  }
  ${ApplicantFragmentFragmentDoc}
  ${ApplicationRoundFragmentFragmentDoc}
  ${ApplicationSectionUiFragmentFragmentDoc}
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
    resourceSet {
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
export const ReservationsInIntervalFragmentDoc = gql`
  fragment ReservationsInInterval on ReservationNode {
    id
    begin
    end
    bufferTimeBefore
    bufferTimeAfter
    type
    affectedReservationUnits
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
      minimum
      maximum
      pk
    }
    purpose {
      nameFi
      pk
    }
    homeCity {
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
export const PricingFieldsFragmentDoc = gql`
  fragment PricingFields on ReservationUnitPricingNode {
    begins
    priceUnit
    pricingType
    lowestPrice
    highestPrice
    taxPercentage {
      value
    }
    status
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
export const UnitNameFieldsFragmentDoc = gql`
  fragment UnitNameFields on UnitNode {
    id
    pk
    nameFi
    serviceSectors {
      id
      pk
      nameFi
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
    metadataSet {
      id
      name
      supportedFields {
        id
        fieldName
      }
      requiredFields {
        id
        fieldName
      }
    }
    cancellationTerms {
      id
      textFi
      nameFi
    }
    paymentTerms {
      textFi
      nameFi
    }
    pricingTerms {
      textFi
      nameFi
    }
    termsOfUseFi
    serviceSpecificTerms {
      textFi
      nameFi
    }
  }
  ${UnitNameFieldsFragmentDoc}
`;
export const ReservationRecurringFragmentDoc = gql`
  fragment ReservationRecurring on ReservationNode {
    recurringReservation {
      pk
      beginDate
      endDate
      weekdays
      name
      description
    }
  }
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
    order {
      status
    }
    user {
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
    reservationUnit {
      id
      pk
      nameFi
      bufferTimeBefore
      bufferTimeAfter
      unit {
        id
        pk
        serviceSectors {
          pk
        }
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
    order {
      orderUuid
      refundUuid
    }
    cancelReason {
      reasonFi
    }
    denyReason {
      reasonFi
    }
    handlingDetails
    user {
      firstName
      lastName
      email
      pk
    }
    bufferTimeBefore
    bufferTimeAfter
  }
`;
export const ApplicationRoundBaseFragmentDoc = gql`
  fragment ApplicationRoundBase on ApplicationRoundNode {
    pk
    nameFi
    status
    applicationPeriodBegin
    applicationPeriodEnd
  }
`;
export const ApplicationRoundAdminFragmentFragmentDoc = gql`
  fragment ApplicationRoundAdminFragment on ApplicationRoundNode {
    id
    ...ApplicationRoundBase
    applicationsCount
    reservationUnits {
      pk
      nameFi
      unit {
        pk
        nameFi
      }
    }
  }
  ${ApplicationRoundBaseFragmentDoc}
`;
export const BannerNotificationsAdminDocument = gql`
  query BannerNotificationsAdmin($id: ID!) {
    bannerNotification(id: $id) {
      ...BannerNotificationsAdminFragment
    }
  }
  ${BannerNotificationsAdminFragmentFragmentDoc}
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    BannerNotificationsAdminQuery,
    BannerNotificationsAdminQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
    $offset: Int
    $orderBy: [BannerNotificationOrderingChoices]
  ) {
    bannerNotifications(first: $first, offset: $offset, orderBy: $orderBy) {
      edges {
        node {
          ...BannerNotificationsAdminFragment
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
  ${BannerNotificationsAdminFragmentFragmentDoc}
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
 *      offset: // value for 'offset'
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    BannerNotificationsAdminListQuery,
    BannerNotificationsAdminListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const BannerNotificationsListDocument = gql`
  query BannerNotificationsList($target: BannerNotificationTarget!) {
    bannerNotifications(isVisible: true, target: $target) {
      edges {
        node {
          ...BannerNotificationCommon
        }
      }
    }
    bannerNotificationsAll: bannerNotifications(isVisible: true, target: ALL) {
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
export const GetApplicationDocument = gql`
  query getApplication($id: ID!) {
    application(id: $id) {
      ...ApplicationCommon
      applicationRound {
        termsOfUse {
          ...TermsOfUseFields
        }
      }
    }
  }
  ${ApplicationCommonFragmentDoc}
  ${TermsOfUseFieldsFragmentDoc}
`;

/**
 * __useGetApplicationQuery__
 *
 * To run a query within a React component, call `useGetApplicationQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetApplicationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetApplicationQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetApplicationQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetApplicationQuery,
    GetApplicationQueryVariables
  > &
    (
      | { variables: GetApplicationQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetApplicationQuery, GetApplicationQueryVariables>(
    GetApplicationDocument,
    options
  );
}
export function useGetApplicationLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetApplicationQuery,
    GetApplicationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetApplicationQuery, GetApplicationQueryVariables>(
    GetApplicationDocument,
    options
  );
}
export function useGetApplicationSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetApplicationQuery,
    GetApplicationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetApplicationQuery,
    GetApplicationQueryVariables
  >(GetApplicationDocument, options);
}
export type GetApplicationQueryHookResult = ReturnType<
  typeof useGetApplicationQuery
>;
export type GetApplicationLazyQueryHookResult = ReturnType<
  typeof useGetApplicationLazyQuery
>;
export type GetApplicationSuspenseQueryHookResult = ReturnType<
  typeof useGetApplicationSuspenseQuery
>;
export type GetApplicationQueryResult = Apollo.QueryResult<
  GetApplicationQuery,
  GetApplicationQueryVariables
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
export const SpacesDocument = gql`
  query Spaces {
    spaces(onlyWithPermission: true) {
      edges {
        node {
          ...SpaceCommonFields
          unit {
            pk
            nameFi
          }
        }
      }
    }
  }
  ${SpaceCommonFieldsFragmentDoc}
`;

/**
 * __useSpacesQuery__
 *
 * To run a query within a React component, call `useSpacesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSpacesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSpacesQuery({
 *   variables: {
 *   },
 * });
 */
export function useSpacesQuery(
  baseOptions?: Apollo.QueryHookOptions<SpacesQuery, SpacesQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<SpacesQuery, SpacesQueryVariables>(
    SpacesDocument,
    options
  );
}
export function useSpacesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<SpacesQuery, SpacesQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<SpacesQuery, SpacesQueryVariables>(
    SpacesDocument,
    options
  );
}
export function useSpacesSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    SpacesQuery,
    SpacesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<SpacesQuery, SpacesQueryVariables>(
    SpacesDocument,
    options
  );
}
export type SpacesQueryHookResult = ReturnType<typeof useSpacesQuery>;
export type SpacesLazyQueryHookResult = ReturnType<typeof useSpacesLazyQuery>;
export type SpacesSuspenseQueryHookResult = ReturnType<
  typeof useSpacesSuspenseQuery
>;
export type SpacesQueryResult = Apollo.QueryResult<
  SpacesQuery,
  SpacesQueryVariables
>;
export const ResourcesDocument = gql`
  query Resources {
    resources(onlyWithPermission: true) {
      edges {
        node {
          locationType
          ...ResourceFields
        }
      }
    }
  }
  ${ResourceFieldsFragmentDoc}
`;

/**
 * __useResourcesQuery__
 *
 * To run a query within a React component, call `useResourcesQuery` and pass it any options that fit your needs.
 * When your component renders, `useResourcesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useResourcesQuery({
 *   variables: {
 *   },
 * });
 */
export function useResourcesQuery(
  baseOptions?: Apollo.QueryHookOptions<ResourcesQuery, ResourcesQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ResourcesQuery, ResourcesQueryVariables>(
    ResourcesDocument,
    options
  );
}
export function useResourcesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ResourcesQuery,
    ResourcesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ResourcesQuery, ResourcesQueryVariables>(
    ResourcesDocument,
    options
  );
}
export function useResourcesSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ResourcesQuery,
    ResourcesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<ResourcesQuery, ResourcesQueryVariables>(
    ResourcesDocument,
    options
  );
}
export type ResourcesQueryHookResult = ReturnType<typeof useResourcesQuery>;
export type ResourcesLazyQueryHookResult = ReturnType<
  typeof useResourcesLazyQuery
>;
export type ResourcesSuspenseQueryHookResult = ReturnType<
  typeof useResourcesSuspenseQuery
>;
export type ResourcesQueryResult = Apollo.QueryResult<
  ResourcesQuery,
  ResourcesQueryVariables
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
export const UnitDocument = gql`
  query Unit($id: ID!) {
    unit(id: $id) {
      id
      pk
      nameFi
      tprekId
      shortDescriptionFi
      reservationunitSet {
        ...ReservationUnitCommonFields
        isArchived
        resources {
          pk
        }
        isDraft
        purposes {
          pk
          nameFi
        }
        images {
          ...ImageFragment
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
  ${ImageFragmentFragmentDoc}
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<UnitQuery, UnitQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
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
        resourceSet {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    UnitWithSpacesAndResourcesQuery,
    UnitWithSpacesAndResourcesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const HandlingDataDocument = gql`
  query HandlingData($beginDate: Date!) {
    reservations(
      state: "REQUIRES_HANDLING"
      beginDate: $beginDate
      onlyWithPermission: true
    ) {
      edges {
        node {
          pk
        }
      }
    }
    units(onlyWithPermission: true) {
      edges {
        node {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    HandlingDataQuery,
    HandlingDataQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const ReservationDateOfBirthDocument = gql`
  query ReservationDateOfBirth($id: ID!) {
    reservation(id: $id) {
      user {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationDateOfBirthQuery,
    ReservationDateOfBirthQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
      user {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationDateOfBirthQuery,
    ApplicationDateOfBirthQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const CreateResourceDocument = gql`
  mutation createResource($input: ResourceCreateMutationInput!) {
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
  mutation updateResource($input: ResourceUpdateMutationInput!) {
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
      pk
      nameFi
      nameSv
      nameEn
      space {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ResourceQuery,
    ResourceQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
  mutation createSpace($input: SpaceCreateMutationInput!) {
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
  mutation updateSpace($input: SpaceUpdateMutationInput!) {
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
      spaces {
        pk
        nameFi
        parent {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    UnitSpacesQuery,
    UnitSpacesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
        pk
        nameFi
        descriptionFi
        location {
          ...LocationFields
        }
        spaces {
          pk
          nameFi
        }
      }
      parent {
        parent {
          nameFi
          parent {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<SpaceQuery, SpaceQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const UnitsDocument = gql`
  query Units(
    $first: Int
    $offset: Int
    $orderBy: [UnitOrderingChoices]
    $nameFi: String
  ) {
    units(
      first: $first
      offset: $offset
      orderBy: $orderBy
      nameFi: $nameFi
      onlyWithPermission: true
    ) {
      edges {
        node {
          nameFi
          pk
          serviceSectors {
            nameFi
          }
          reservationunitSet {
            pk
          }
        }
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
 *      offset: // value for 'offset'
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<UnitsQuery, UnitsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const UnitsFilterDocument = gql`
  query UnitsFilter($offset: Int, $first: Int) {
    units(onlyWithPermission: true, offset: $offset, first: $first) {
      edges {
        node {
          nameFi
          pk
        }
      }
      totalCount
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
 *      offset: // value for 'offset'
 *      first: // value for 'first'
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    UnitsFilterQuery,
    UnitsFilterQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const ReservationUnitTypesFilterDocument = gql`
  query ReservationUnitTypesFilter($offset: Int, $first: Int) {
    reservationUnitTypes(offset: $offset, first: $first) {
      edges {
        node {
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
 *      offset: // value for 'offset'
 *      first: // value for 'first'
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationUnitTypesFilterQuery,
    ReservationUnitTypesFilterQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const ReservationUnitsFilterParamsDocument = gql`
  query ReservationUnitsFilterParams(
    $offset: Int
    $unit: [Int]
    $first: Int
    $orderBy: [ReservationUnitOrderingChoices]
  ) {
    reservationUnits(
      offset: $offset
      onlyWithPermission: true
      unit: $unit
      orderBy: $orderBy
      first: $first
    ) {
      edges {
        node {
          nameFi
          pk
        }
      }
      totalCount
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
 *      offset: // value for 'offset'
 *      unit: // value for 'unit'
 *      first: // value for 'first'
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationUnitsFilterParamsQuery,
    ReservationUnitsFilterParamsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const CreateRecurringReservationDocument = gql`
  mutation createRecurringReservation(
    $input: RecurringReservationCreateMutationInput!
  ) {
    createRecurringReservation(input: $input) {
      pk
    }
  }
`;
export type CreateRecurringReservationMutationFn = Apollo.MutationFunction<
  CreateRecurringReservationMutation,
  CreateRecurringReservationMutationVariables
>;

/**
 * __useCreateRecurringReservationMutation__
 *
 * To run a mutation, you first call `useCreateRecurringReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateRecurringReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createRecurringReservationMutation, { data, loading, error }] = useCreateRecurringReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateRecurringReservationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateRecurringReservationMutation,
    CreateRecurringReservationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateRecurringReservationMutation,
    CreateRecurringReservationMutationVariables
  >(CreateRecurringReservationDocument, options);
}
export type CreateRecurringReservationMutationHookResult = ReturnType<
  typeof useCreateRecurringReservationMutation
>;
export type CreateRecurringReservationMutationResult =
  Apollo.MutationResult<CreateRecurringReservationMutation>;
export type CreateRecurringReservationMutationOptions =
  Apollo.BaseMutationOptions<
    CreateRecurringReservationMutation,
    CreateRecurringReservationMutationVariables
  >;
export const ReservationTimesInReservationUnitDocument = gql`
  query ReservationTimesInReservationUnit(
    $id: ID!
    $pk: Int!
    $beginDate: Date
    $endDate: Date
    $state: [String]
  ) {
    reservationUnit(id: $id) {
      reservationSet(beginDate: $beginDate, endDate: $endDate, state: $state) {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationTimesInReservationUnitQuery,
    ReservationTimesInReservationUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const CreateStaffReservationDocument = gql`
  mutation createStaffReservation(
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
  query options {
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
export const UnitViewDocument = gql`
  query UnitView($id: ID!) {
    unit(id: $id) {
      ...UnitNameFields
      location {
        ...LocationFields
      }
      reservationunitSet {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    UnitViewQuery,
    UnitViewQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
    $state: [String]
    $beginDate: Date
    $endDate: Date
  ) {
    unit(id: $id) {
      id
      reservationunitSet {
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
        reservationSet(
          beginDate: $beginDate
          endDate: $endDate
          state: $state
        ) {
          ...ReservationUnitReservations
        }
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationUnitsByUnitQuery,
    ReservationUnitsByUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const RecurringReservationUnitDocument = gql`
  query RecurringReservationUnit($id: ID!) {
    unit(id: $id) {
      nameFi
      pk
      reservationunitSet {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    RecurringReservationUnitQuery,
    RecurringReservationUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
    $state: [String]
    $beginDate: Date
    $endDate: Date
  ) {
    reservationUnit(id: $id) {
      pk
      reservationSet(state: $state, beginDate: $beginDate, endDate: $endDate) {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationUnitCalendarQuery,
    ReservationUnitCalendarQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const UpdateReservationWorkingMemoDocument = gql`
  mutation updateReservationWorkingMemo($pk: Int!, $workingMemo: String!) {
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
  mutation updateApplicationWorkingMemo($pk: Int!, $workingMemo: String!) {
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
export const SearchReservationUnitsDocument = gql`
  query SearchReservationUnits(
    $nameFi: String
    $maxPersonsGte: Decimal
    $maxPersonsLte: Decimal
    $surfaceAreaGte: Decimal
    $surfaceAreaLte: Decimal
    $unit: [Int]
    $reservationUnitType: [Int]
    $orderBy: [ReservationUnitOrderingChoices]
    $offset: Int
    $first: Int
    $state: [String]
  ) {
    reservationUnits(
      first: $first
      offset: $offset
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
      state: $state
      onlyWithPermission: true
    ) {
      edges {
        node {
          pk
          nameFi
          unit {
            nameFi
            pk
          }
          reservationUnitType {
            nameFi
          }
          maxPersons
          surfaceArea
          state
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
 *      nameFi: // value for 'nameFi'
 *      maxPersonsGte: // value for 'maxPersonsGte'
 *      maxPersonsLte: // value for 'maxPersonsLte'
 *      surfaceAreaGte: // value for 'surfaceAreaGte'
 *      surfaceAreaLte: // value for 'surfaceAreaLte'
 *      unit: // value for 'unit'
 *      reservationUnitType: // value for 'reservationUnitType'
 *      orderBy: // value for 'orderBy'
 *      offset: // value for 'offset'
 *      first: // value for 'first'
 *      state: // value for 'state'
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
export const UpdateStaffReservationDocument = gql`
  mutation updateStaffReservation(
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
  mutation updateRecurringReservation(
    $input: RecurringReservationUpdateMutationInput!
  ) {
    updateRecurringReservation(input: $input) {
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
    $after: String
    $unit: [ID]
    $reservationUnitType: [ID]
    $orderBy: [ReservationOrderingChoices]
    $offset: Int
    $first: Int
    $state: [String]
    $textSearch: String
    $priceGte: Decimal
    $priceLte: Decimal
    $beginDate: Date
    $endDate: Date
    $reservationUnit: [ID]
    $orderStatus: [String]
  ) {
    reservations(
      first: $first
      offset: $offset
      orderBy: $orderBy
      after: $after
      unit: $unit
      reservationUnit: $reservationUnit
      reservationUnitType: $reservationUnitType
      state: $state
      orderStatus: $orderStatus
      textSearch: $textSearch
      priceLte: $priceLte
      priceGte: $priceGte
      beginDate: $beginDate
      endDate: $endDate
      onlyWithPermission: true
    ) {
      edges {
        node {
          ...ReservationCommon
          reservationUnit {
            nameFi
            unit {
              nameFi
            }
          }
          name
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
 *      after: // value for 'after'
 *      unit: // value for 'unit'
 *      reservationUnitType: // value for 'reservationUnitType'
 *      orderBy: // value for 'orderBy'
 *      offset: // value for 'offset'
 *      first: // value for 'first'
 *      state: // value for 'state'
 *      textSearch: // value for 'textSearch'
 *      priceGte: // value for 'priceGte'
 *      priceLte: // value for 'priceLte'
 *      beginDate: // value for 'beginDate'
 *      endDate: // value for 'endDate'
 *      reservationUnit: // value for 'reservationUnit'
 *      orderStatus: // value for 'orderStatus'
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationsQuery,
    ReservationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const StaffAdjustReservationTimeDocument = gql`
  mutation staffAdjustReservationTime(
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
export const ReservationsByReservationUnitDocument = gql`
  query ReservationsByReservationUnit(
    $id: ID!
    $pk: Int!
    $beginDate: Date
    $endDate: Date
    $state: [String]
  ) {
    reservationUnit(id: $id) {
      id
      reservationSet(state: $state, beginDate: $beginDate, endDate: $endDate) {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationsByReservationUnitQuery,
    ReservationsByReservationUnitQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
      reservationUnit {
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
export const RecurringReservationDocument = gql`
  query RecurringReservation($id: ID!) {
    recurringReservation(id: $id) {
      id
      pk
      weekdays
      beginDate
      endDate
      reservations {
        id
        pk
        begin
        end
        state
        reservationUnit {
          id
          pk
        }
      }
    }
  }
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    RecurringReservationQuery,
    RecurringReservationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
  mutation approveReservation($input: ReservationApproveMutationInput!) {
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
  mutation denyReservation($input: ReservationDenyMutationInput!) {
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
  mutation refundReservation($input: ReservationRefundMutationInput!) {
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
  mutation requireHandling($input: ReservationRequiresHandlingMutationInput!) {
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
export const ReservationDenyReasonsDocument = gql`
  query ReservationDenyReasons {
    reservationDenyReasons {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationDenyReasonsQuery,
    ReservationDenyReasonsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const CurrentUserDocument = gql`
  query CurrentUser {
    currentUser {
      username
      firstName
      lastName
      email
      isSuperuser
      pk
      unitRoles {
        pk
        role {
          code
          verboseNameFi
          permissions {
            permission
          }
        }
        unit {
          pk
          nameFi
        }
        unitGroup {
          units {
            pk
            nameFi
          }
        }
      }
      serviceSectorRoles {
        pk
        serviceSector {
          pk
          nameFi
        }
        role {
          permissions {
            permission
          }
        }
      }
      generalRoles {
        pk
        role {
          code
          verboseNameFi
          permissions {
            permission
          }
        }
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
export const ReservationUnitEditDocument = gql`
  query ReservationUnitEdit($id: ID!) {
    reservationUnit(id: $id) {
      id
      pk
      state
      reservationState
      images {
        pk
        ...ImageFragment
      }
      haukiUrl
      cancellationRule {
        pk
      }
      requireReservationHandling
      nameFi
      nameSv
      nameEn
      isDraft
      authentication
      spaces {
        pk
        nameFi
      }
      resources {
        pk
        nameFi
      }
      purposes {
        pk
        nameFi
      }
      paymentTypes {
        code
      }
      pricingTerms {
        pk
      }
      reservationUnitType {
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
        pk
        nameFi
      }
      qualifiers {
        pk
        nameFi
      }
      unit {
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
        pk
      }
      cancellationTerms {
        pk
      }
      serviceSpecificTerms {
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
        pk
      }
      pricings {
        ...PricingFields
        lowestPriceNet
        highestPriceNet
        taxPercentage {
          pk
        }
        pk
      }
      applicationRoundTimeSlots {
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
  ${ImageFragmentFragmentDoc}
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationUnitEditQuery,
    ReservationUnitEditQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
  mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
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
  mutation createReservationUnit($input: ReservationUnitCreateMutationInput!) {
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
  mutation createImage(
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
  mutation deleteImage($pk: ID!) {
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
  mutation updateImage($pk: Int!, $imageType: ImageType!) {
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
          nameFi
          pk
        }
      }
    }
    taxPercentages {
      edges {
        node {
          pk
          value
        }
      }
    }
    purposes {
      edges {
        node {
          pk
          nameFi
        }
      }
    }
    reservationUnitTypes {
      edges {
        node {
          nameFi
          pk
        }
      }
    }
    termsOfUse {
      edges {
        node {
          pk
          nameFi
          termsType
        }
      }
    }
    reservationUnitCancellationRules {
      edges {
        node {
          nameFi
          pk
        }
      }
    }
    metadataSets {
      edges {
        node {
          name
          pk
        }
      }
    }
    qualifiers {
      edges {
        node {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ReservationUnitEditorParametersQuery,
    ReservationUnitEditorParametersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const ApplicationAdminDocument = gql`
  query ApplicationAdmin($id: ID!) {
    application(id: $id) {
      ...ApplicationAdminFragment
      workingMemo
    }
  }
  ${ApplicationAdminFragmentFragmentDoc}
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationAdminQuery,
    ApplicationAdminQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
  mutation rejectAllSectionOptions(
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
  mutation restoreAllSectionOptions(
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
  mutation rejectAllApplicationOptions(
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
  mutation restoreAllApplicationOptions(
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
export const ApplicationRoundFilterDocument = gql`
  query ApplicationRoundFilter($id: ID!) {
    applicationRound(id: $id) {
      nameFi
      status
      reservationPeriodBegin
      reservationPeriodEnd
      reservationUnits {
        pk
        nameFi
        unit {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationRoundFilterQuery,
    ApplicationRoundFilterQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
          reservationUnitOptions {
            reservationUnit {
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    AllApplicationEventsQuery,
    AllApplicationEventsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
    ) {
      edges {
        node {
          ...ApplicationSectionFragment
          allocations
          suitableTimeRanges(fulfilled: false) {
            beginTime
            endTime
            dayOfTheWeek
            priority
            fulfilled
          }
          reservationUnitOptions {
            locked
            rejected
            allocatedTimeSlots {
              pk
              dayOfTheWeek
              beginTime
              endTime
              reservationUnitOption {
                applicationSection {
                  pk
                }
              }
            }
          }
        }
      }
      totalCount
    }
    affectingAllocatedTimeSlots(
      reservationUnit: $reservationUnit
      beginDate: $beginDate
      endDate: $endDate
    ) {
      beginTime
      dayOfTheWeek
      endTime
    }
  }
  ${ApplicationSectionFragmentFragmentDoc}
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationSectionAllocationsQuery,
    ApplicationSectionAllocationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const GetAffectingAllocationsDocument = gql`
  query getAffectingAllocations(
    $reservationUnit: Int!
    $beginDate: Date!
    $endDate: Date!
  ) {
    affectingAllocatedTimeSlots(
      reservationUnit: $reservationUnit
      beginDate: $beginDate
      endDate: $endDate
    ) {
      beginTime
      dayOfTheWeek
      endTime
    }
  }
`;

/**
 * __useGetAffectingAllocationsQuery__
 *
 * To run a query within a React component, call `useGetAffectingAllocationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAffectingAllocationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAffectingAllocationsQuery({
 *   variables: {
 *      reservationUnit: // value for 'reservationUnit'
 *      beginDate: // value for 'beginDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetAffectingAllocationsQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetAffectingAllocationsQuery,
    GetAffectingAllocationsQueryVariables
  > &
    (
      | { variables: GetAffectingAllocationsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetAffectingAllocationsQuery,
    GetAffectingAllocationsQueryVariables
  >(GetAffectingAllocationsDocument, options);
}
export function useGetAffectingAllocationsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetAffectingAllocationsQuery,
    GetAffectingAllocationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetAffectingAllocationsQuery,
    GetAffectingAllocationsQueryVariables
  >(GetAffectingAllocationsDocument, options);
}
export function useGetAffectingAllocationsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetAffectingAllocationsQuery,
    GetAffectingAllocationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetAffectingAllocationsQuery,
    GetAffectingAllocationsQueryVariables
  >(GetAffectingAllocationsDocument, options);
}
export type GetAffectingAllocationsQueryHookResult = ReturnType<
  typeof useGetAffectingAllocationsQuery
>;
export type GetAffectingAllocationsLazyQueryHookResult = ReturnType<
  typeof useGetAffectingAllocationsLazyQuery
>;
export type GetAffectingAllocationsSuspenseQueryHookResult = ReturnType<
  typeof useGetAffectingAllocationsSuspenseQuery
>;
export type GetAffectingAllocationsQueryResult = Apollo.QueryResult<
  GetAffectingAllocationsQuery,
  GetAffectingAllocationsQueryVariables
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationRoundCriteriaQuery,
    ApplicationRoundCriteriaQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const GetApplicationsDocument = gql`
  query getApplications(
    $applicationRound: Int!
    $unit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $status: [ApplicationStatusChoice]!
    $textSearch: String
    $orderBy: [ApplicationOrderingChoices]
    $first: Int
    $offset: Int
  ) {
    applications(
      applicationRound: $applicationRound
      unit: $unit
      applicantType: $applicantType
      status: $status
      textSearch: $textSearch
      orderBy: $orderBy
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          pk
          status
          ...ApplicationNameFragment
          applicationSections {
            name
            pk
            ...ApplicationSectionDurationFragment
            reservationUnitOptions {
              preferredOrder
              reservationUnit {
                unit {
                  pk
                  nameFi
                }
              }
            }
          }
        }
      }
      totalCount
    }
  }
  ${ApplicationNameFragmentFragmentDoc}
  ${ApplicationSectionDurationFragmentFragmentDoc}
`;

/**
 * __useGetApplicationsQuery__
 *
 * To run a query within a React component, call `useGetApplicationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetApplicationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetApplicationsQuery({
 *   variables: {
 *      applicationRound: // value for 'applicationRound'
 *      unit: // value for 'unit'
 *      applicantType: // value for 'applicantType'
 *      status: // value for 'status'
 *      textSearch: // value for 'textSearch'
 *      orderBy: // value for 'orderBy'
 *      first: // value for 'first'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetApplicationsQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetApplicationsQuery,
    GetApplicationsQueryVariables
  > &
    (
      | { variables: GetApplicationsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetApplicationsQuery, GetApplicationsQueryVariables>(
    GetApplicationsDocument,
    options
  );
}
export function useGetApplicationsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetApplicationsQuery,
    GetApplicationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetApplicationsQuery,
    GetApplicationsQueryVariables
  >(GetApplicationsDocument, options);
}
export function useGetApplicationsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetApplicationsQuery,
    GetApplicationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetApplicationsQuery,
    GetApplicationsQueryVariables
  >(GetApplicationsDocument, options);
}
export type GetApplicationsQueryHookResult = ReturnType<
  typeof useGetApplicationsQuery
>;
export type GetApplicationsLazyQueryHookResult = ReturnType<
  typeof useGetApplicationsLazyQuery
>;
export type GetApplicationsSuspenseQueryHookResult = ReturnType<
  typeof useGetApplicationsSuspenseQuery
>;
export type GetApplicationsQueryResult = Apollo.QueryResult<
  GetApplicationsQuery,
  GetApplicationsQueryVariables
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
    $offset: Int
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
      offset: $offset
    ) {
      edges {
        node {
          ...ApplicationSectionFragment
          allocations
          reservationUnitOptions {
            allocatedTimeSlots {
              pk
              dayOfTheWeek
              beginTime
              endTime
              reservationUnitOption {
                applicationSection {
                  pk
                }
              }
            }
          }
        }
      }
      totalCount
    }
  }
  ${ApplicationSectionFragmentFragmentDoc}
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
 *      offset: // value for 'offset'
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationSectionsQuery,
    ApplicationSectionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
export const GetAllocatedTimeSlotsDocument = gql`
  query getAllocatedTimeSlots(
    $applicationRound: Int!
    $allocatedUnit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $applicationSectionStatus: [ApplicationSectionStatusChoice]
    $allocatedReservationUnit: [Int]
    $dayOfTheWeek: [Weekday]
    $textSearch: String
    $orderBy: [AllocatedTimeSlotOrderingChoices]
    $first: Int
    $offset: Int
  ) {
    allocatedTimeSlots(
      applicationRound: $applicationRound
      allocatedUnit: $allocatedUnit
      applicantType: $applicantType
      applicationSectionStatus: $applicationSectionStatus
      allocatedReservationUnit: $allocatedReservationUnit
      dayOfTheWeek: $dayOfTheWeek
      textSearch: $textSearch
      orderBy: $orderBy
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          pk
          dayOfTheWeek
          endTime
          beginTime
          reservationUnitOption {
            rejected
            locked
            preferredOrder
            applicationSection {
              pk
              name
              reservationsEndDate
              reservationsBeginDate
              reservationMinDuration
              reservationMaxDuration
              application {
                pk
                ...ApplicationNameFragment
              }
            }
            reservationUnit {
              nameFi
              unit {
                nameFi
              }
            }
          }
        }
      }
      totalCount
    }
  }
  ${ApplicationNameFragmentFragmentDoc}
`;

/**
 * __useGetAllocatedTimeSlotsQuery__
 *
 * To run a query within a React component, call `useGetAllocatedTimeSlotsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAllocatedTimeSlotsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAllocatedTimeSlotsQuery({
 *   variables: {
 *      applicationRound: // value for 'applicationRound'
 *      allocatedUnit: // value for 'allocatedUnit'
 *      applicantType: // value for 'applicantType'
 *      applicationSectionStatus: // value for 'applicationSectionStatus'
 *      allocatedReservationUnit: // value for 'allocatedReservationUnit'
 *      dayOfTheWeek: // value for 'dayOfTheWeek'
 *      textSearch: // value for 'textSearch'
 *      orderBy: // value for 'orderBy'
 *      first: // value for 'first'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetAllocatedTimeSlotsQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetAllocatedTimeSlotsQuery,
    GetAllocatedTimeSlotsQueryVariables
  > &
    (
      | { variables: GetAllocatedTimeSlotsQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetAllocatedTimeSlotsQuery,
    GetAllocatedTimeSlotsQueryVariables
  >(GetAllocatedTimeSlotsDocument, options);
}
export function useGetAllocatedTimeSlotsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetAllocatedTimeSlotsQuery,
    GetAllocatedTimeSlotsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetAllocatedTimeSlotsQuery,
    GetAllocatedTimeSlotsQueryVariables
  >(GetAllocatedTimeSlotsDocument, options);
}
export function useGetAllocatedTimeSlotsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetAllocatedTimeSlotsQuery,
    GetAllocatedTimeSlotsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetAllocatedTimeSlotsQuery,
    GetAllocatedTimeSlotsQueryVariables
  >(GetAllocatedTimeSlotsDocument, options);
}
export type GetAllocatedTimeSlotsQueryHookResult = ReturnType<
  typeof useGetAllocatedTimeSlotsQuery
>;
export type GetAllocatedTimeSlotsLazyQueryHookResult = ReturnType<
  typeof useGetAllocatedTimeSlotsLazyQuery
>;
export type GetAllocatedTimeSlotsSuspenseQueryHookResult = ReturnType<
  typeof useGetAllocatedTimeSlotsSuspenseQuery
>;
export type GetAllocatedTimeSlotsQueryResult = Apollo.QueryResult<
  GetAllocatedTimeSlotsQuery,
  GetAllocatedTimeSlotsQueryVariables
>;
export const ApplicationRoundsDocument = gql`
  query ApplicationRounds {
    applicationRounds {
      edges {
        node {
          ...ApplicationRoundBase
          reservationPeriodBegin
          reservationPeriodEnd
          applicationsCount
          reservationUnitCount
          statusTimestamp
          serviceSector {
            pk
            nameFi
          }
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationRoundsQuery,
    ApplicationRoundsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
      ...ApplicationRoundAdminFragment
    }
  }
  ${ApplicationRoundAdminFragmentFragmentDoc}
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
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ApplicationRoundQuery,
    ApplicationRoundQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
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
