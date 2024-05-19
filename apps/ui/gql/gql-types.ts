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

export type OptionsQueryVariables = Exact<{ [key: string]: never }>;

export type OptionsQuery = {
  __typename?: "Query";
  reservationUnitTypes?: {
    __typename?: "ReservationUnitTypeNodeConnection";
    edges: Array<{
      __typename?: "ReservationUnitTypeNodeEdge";
      node?: {
        __typename?: "ReservationUnitTypeNode";
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
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
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null>;
  } | null;
  reservationPurposes?: {
    __typename?: "ReservationPurposeNodeConnection";
    edges: Array<{
      __typename?: "ReservationPurposeNodeEdge";
      node?: {
        __typename?: "ReservationPurposeNode";
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null>;
  } | null;
  ageGroups?: {
    __typename?: "AgeGroupNodeConnection";
    edges: Array<{
      __typename?: "AgeGroupNodeEdge";
      node?: {
        __typename?: "AgeGroupNode";
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
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null>;
  } | null;
  equipments?: {
    __typename?: "EquipmentNodeConnection";
    edges: Array<{
      __typename?: "EquipmentNodeEdge";
      node?: {
        __typename?: "EquipmentNode";
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
  __typename?: "Query";
  applications?: {
    __typename?: "ApplicationNodeConnection";
    edges: Array<{
      __typename?: "ApplicationNodeEdge";
      node?: {
        __typename?: "ApplicationNode";
        pk?: number | null;
        status?: ApplicationStatusChoice | null;
        lastModifiedDate: string;
        applicantType?: ApplicantTypeChoice | null;
        applicationRound: {
          __typename?: "ApplicationRoundNode";
          pk?: number | null;
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
          reservationUnits: Array<{
            __typename?: "ReservationUnitNode";
            pk?: number | null;
            unit?: { __typename?: "UnitNode"; pk?: number | null } | null;
          }>;
        };
        user?: { __typename?: "ApplicantNode"; name?: string | null } | null;
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

export type CreateApplicationMutationVariables = Exact<{
  input: ApplicationCreateMutationInput;
}>;

export type CreateApplicationMutation = {
  __typename?: "Mutation";
  createApplication?: {
    __typename?: "ApplicationCreateMutationPayload";
    pk?: number | null;
  } | null;
};

export type UpdateApplicationMutationVariables = Exact<{
  input: ApplicationUpdateMutationInput;
}>;

export type UpdateApplicationMutation = {
  __typename?: "Mutation";
  updateApplication?: {
    __typename?: "ApplicationUpdateMutationPayload";
    pk?: number | null;
  } | null;
};

export type SendApplicationMutationVariables = Exact<{
  input: ApplicationSendMutationInput;
}>;

export type SendApplicationMutation = {
  __typename?: "Mutation";
  sendApplication?: {
    __typename?: "ApplicationSendMutationPayload";
    pk?: number | null;
  } | null;
};

export type CancelApplicationMutationVariables = Exact<{
  input: ApplicationCancelMutationInput;
}>;

export type CancelApplicationMutation = {
  __typename?: "Mutation";
  cancelApplication?: {
    __typename?: "ApplicationCancelMutationPayload";
    pk?: number | null;
  } | null;
};

export type ApplicationRoundFieldsFragment = {
  __typename?: "ApplicationRoundNode";
  pk?: number | null;
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
  reservationUnits: Array<{
    __typename?: "ReservationUnitNode";
    pk?: number | null;
    unit?: { __typename?: "UnitNode"; pk?: number | null } | null;
  }>;
};

export type ApplicationRoundPeriodsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type ApplicationRoundPeriodsQuery = {
  __typename?: "Query";
  applicationRounds?: {
    __typename?: "ApplicationRoundNodeConnection";
    edges: Array<{
      __typename?: "ApplicationRoundNodeEdge";
      node?: {
        __typename?: "ApplicationRoundNode";
        pk?: number | null;
        reservationPeriodBegin: string;
        reservationPeriodEnd: string;
        applicationPeriodBegin: string;
        status?: ApplicationRoundStatusChoice | null;
        reservationUnits: Array<{
          __typename?: "ReservationUnitNode";
          pk?: number | null;
        }>;
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
  __typename?: "Query";
  applicationRounds?: {
    __typename?: "ApplicationRoundNodeConnection";
    edges: Array<{
      __typename?: "ApplicationRoundNodeEdge";
      node?: {
        __typename?: "ApplicationRoundNode";
        pk?: number | null;
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
        reservationUnits: Array<{
          __typename?: "ReservationUnitNode";
          pk?: number | null;
          unit?: { __typename?: "UnitNode"; pk?: number | null } | null;
        }>;
      } | null;
    } | null>;
  } | null;
};

export type UnitNameFieldsI18NFragment = {
  __typename?: "UnitNode";
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  location?: {
    __typename?: "LocationNode";
    addressStreetEn?: string | null;
    addressStreetSv?: string | null;
    addressCityEn?: string | null;
    addressCitySv?: string | null;
    addressStreetFi?: string | null;
    addressZip: string;
    addressCityFi?: string | null;
  } | null;
};

export type UnitFieldsFragment = {
  __typename?: "UnitNode";
  id: string;
  tprekId?: string | null;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  location?: {
    __typename?: "LocationNode";
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
  __typename?: "ReservationUnitNode";
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
    __typename?: "UnitNode";
    id: string;
    tprekId?: string | null;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    location?: {
      __typename?: "LocationNode";
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
    __typename?: "TermsOfUseNode";
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  cancellationTerms?: {
    __typename?: "TermsOfUseNode";
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  paymentTerms?: {
    __typename?: "TermsOfUseNode";
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  pricingTerms?: {
    __typename?: "TermsOfUseNode";
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  pricings: Array<{
    __typename?: "ReservationUnitPricingNode";
    begins: string;
    priceUnit: PriceUnit;
    pricingType?: PricingType | null;
    lowestPrice: string;
    highestPrice: string;
    status: Status;
    taxPercentage: { __typename?: "TaxPercentageNode"; value: string };
  }>;
  images: Array<{
    __typename?: "ReservationUnitImageNode";
    imageUrl?: string | null;
    largeUrl?: string | null;
    mediumUrl?: string | null;
    smallUrl?: string | null;
    imageType: ImageType;
  }>;
  metadataSet?: {
    __typename?: "ReservationMetadataSetNode";
    id: string;
    name: string;
    pk?: number | null;
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
};

export type SearchFormParamsUnitQueryVariables = Exact<{
  publishedReservationUnits?: InputMaybe<Scalars["Boolean"]["input"]>;
  ownReservations?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<
    Array<InputMaybe<UnitOrderingChoices>> | InputMaybe<UnitOrderingChoices>
  >;
}>;

export type SearchFormParamsUnitQuery = {
  __typename?: "Query";
  units?: {
    __typename?: "UnitNodeConnection";
    edges: Array<{
      __typename?: "UnitNodeEdge";
      node?: {
        __typename?: "UnitNode";
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
  __typename?: "Query";
  purposes?: {
    __typename?: "PurposeNodeConnection";
    edges: Array<{
      __typename?: "PurposeNodeEdge";
      node?: {
        __typename?: "PurposeNode";
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
  __typename?: "Mutation";
  createReservation?: {
    __typename?: "ReservationCreateMutationPayload";
    pk?: number | null;
    price?: string | null;
  } | null;
};

export type UpdateReservationMutationVariables = Exact<{
  input: ReservationUpdateMutationInput;
}>;

export type UpdateReservationMutation = {
  __typename?: "Mutation";
  updateReservation?: {
    __typename?: "ReservationUpdateMutationPayload";
    pk?: number | null;
    state?: string | null;
  } | null;
};

export type DeleteReservationMutationVariables = Exact<{
  input: ReservationDeleteMutationInput;
}>;

export type DeleteReservationMutation = {
  __typename?: "Mutation";
  deleteReservation?: {
    __typename?: "ReservationDeleteMutationPayload";
    deleted?: boolean | null;
  } | null;
};

export type CancelReservationMutationVariables = Exact<{
  input: ReservationCancellationMutationInput;
}>;

export type CancelReservationMutation = {
  __typename?: "Mutation";
  cancelReservation?: {
    __typename?: "ReservationCancellationMutationPayload";
    pk?: number | null;
  } | null;
};

export type ConfirmReservationMutationVariables = Exact<{
  input: ReservationConfirmMutationInput;
}>;

export type ConfirmReservationMutation = {
  __typename?: "Mutation";
  confirmReservation?: {
    __typename?: "ReservationConfirmMutationPayload";
    pk?: number | null;
    state?: string | null;
    order?: {
      __typename?: "PaymentOrderNode";
      checkoutUrl?: string | null;
    } | null;
  } | null;
};

export type CancellationRuleFieldsFragment = {
  __typename?: "ReservationUnitNode";
  cancellationRule?: {
    __typename?: "ReservationUnitCancellationRuleNode";
    canBeCancelledTimeBefore?: number | null;
    needsHandling: boolean;
  } | null;
};

export type ListReservationsQueryVariables = Exact<{
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  state?: InputMaybe<
    | Array<InputMaybe<Scalars["String"]["input"]>>
    | InputMaybe<Scalars["String"]["input"]>
  >;
  user: Scalars["ID"]["input"];
  reservationUnit?: InputMaybe<
    | Array<InputMaybe<Scalars["ID"]["input"]>>
    | InputMaybe<Scalars["ID"]["input"]>
  >;
  orderBy?: InputMaybe<
    | Array<InputMaybe<ReservationOrderingChoices>>
    | InputMaybe<ReservationOrderingChoices>
  >;
}>;

export type ListReservationsQuery = {
  __typename?: "Query";
  reservations?: {
    __typename?: "ReservationNodeConnection";
    edges: Array<{
      __typename?: "ReservationNodeEdge";
      node?: {
        __typename?: "ReservationNode";
        id: string;
        pk?: number | null;
        name?: string | null;
        begin: string;
        end: string;
        state: State;
        price?: string | null;
        bufferTimeBefore: number;
        bufferTimeAfter: number;
        isBlocked?: boolean | null;
        order?: {
          __typename?: "PaymentOrderNode";
          id: string;
          orderUuid?: string | null;
        } | null;
        reservationUnit?: Array<{
          __typename?: "ReservationUnitNode";
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          unit?: {
            __typename?: "UnitNode";
            id: string;
            pk?: number | null;
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
            location?: {
              __typename?: "LocationNode";
              addressStreetEn?: string | null;
              addressStreetSv?: string | null;
              addressCityEn?: string | null;
              addressCitySv?: string | null;
              addressStreetFi?: string | null;
              addressZip: string;
              addressCityFi?: string | null;
            } | null;
          } | null;
          images: Array<{
            __typename?: "ReservationUnitImageNode";
            imageUrl?: string | null;
            largeUrl?: string | null;
            mediumUrl?: string | null;
            smallUrl?: string | null;
            imageType: ImageType;
          }>;
          pricings: Array<{
            __typename?: "ReservationUnitPricingNode";
            begins: string;
            priceUnit: PriceUnit;
            pricingType?: PricingType | null;
            lowestPrice: string;
            highestPrice: string;
            status: Status;
            taxPercentage: { __typename?: "TaxPercentageNode"; value: string };
          }>;
          cancellationRule?: {
            __typename?: "ReservationUnitCancellationRuleNode";
            canBeCancelledTimeBefore?: number | null;
            needsHandling: boolean;
          } | null;
        }> | null;
      } | null;
    } | null>;
  } | null;
};

export type ReservationInfoFragmentFragment = {
  __typename?: "ReservationNode";
  description?: string | null;
  numPersons?: number | null;
  purpose?: {
    __typename?: "ReservationPurposeNode";
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  ageGroup?: {
    __typename?: "AgeGroupNode";
    pk?: number | null;
    minimum: number;
    maximum?: number | null;
  } | null;
  homeCity?: {
    __typename?: "CityNode";
    pk?: number | null;
    name: string;
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
    name?: string | null;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    begin: string;
    end: string;
    calendarUrl?: string | null;
    state: State;
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
    description?: string | null;
    numPersons?: number | null;
    user?: {
      __typename?: "UserNode";
      id: string;
      email: string;
      pk?: number | null;
    } | null;
    order?: {
      __typename?: "PaymentOrderNode";
      id: string;
      orderUuid?: string | null;
      status?: OrderStatus | null;
    } | null;
    reservationUnit?: Array<{
      __typename?: "ReservationUnitNode";
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
        __typename?: "UnitNode";
        id: string;
        tprekId?: string | null;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        location?: {
          __typename?: "LocationNode";
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
        __typename?: "TermsOfUseNode";
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      cancellationTerms?: {
        __typename?: "TermsOfUseNode";
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      paymentTerms?: {
        __typename?: "TermsOfUseNode";
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      pricingTerms?: {
        __typename?: "TermsOfUseNode";
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      pricings: Array<{
        __typename?: "ReservationUnitPricingNode";
        begins: string;
        priceUnit: PriceUnit;
        pricingType?: PricingType | null;
        lowestPrice: string;
        highestPrice: string;
        status: Status;
        taxPercentage: { __typename?: "TaxPercentageNode"; value: string };
      }>;
      images: Array<{
        __typename?: "ReservationUnitImageNode";
        imageUrl?: string | null;
        largeUrl?: string | null;
        mediumUrl?: string | null;
        smallUrl?: string | null;
        imageType: ImageType;
      }>;
      metadataSet?: {
        __typename?: "ReservationMetadataSetNode";
        id: string;
        name: string;
        pk?: number | null;
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
      cancellationRule?: {
        __typename?: "ReservationUnitCancellationRuleNode";
        canBeCancelledTimeBefore?: number | null;
        needsHandling: boolean;
      } | null;
    }> | null;
    purpose?: {
      __typename?: "ReservationPurposeNode";
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    ageGroup?: {
      __typename?: "AgeGroupNode";
      pk?: number | null;
      minimum: number;
      maximum?: number | null;
    } | null;
    homeCity?: {
      __typename?: "CityNode";
      pk?: number | null;
      name: string;
    } | null;
  } | null;
};

export type GetReservationCancelReasonsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type GetReservationCancelReasonsQuery = {
  __typename?: "Query";
  reservationCancelReasons?: {
    __typename?: "ReservationCancelReasonNodeConnection";
    edges: Array<{
      __typename?: "ReservationCancelReasonNodeEdge";
      node?: {
        __typename?: "ReservationCancelReasonNode";
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
  __typename?: "Mutation";
  adjustReservationTime?: {
    __typename?: "ReservationAdjustTimeMutationPayload";
    pk?: number | null;
    state?: State | null;
    begin?: string | null;
    end?: string | null;
  } | null;
};

export type OrderQueryVariables = Exact<{
  orderUuid: Scalars["String"]["input"];
}>;

export type OrderQuery = {
  __typename?: "Query";
  order?: {
    __typename?: "PaymentOrderNode";
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
  __typename?: "Mutation";
  refreshOrder?: {
    __typename?: "RefreshOrderMutationPayload";
    orderUuid?: string | null;
    status?: string | null;
  } | null;
};

export type ReservationUnitTypeFieldsFragment = {
  __typename?: "ReservationUnitTypeNode";
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
};

export type ReservationUnitNameFieldsFragment = {
  __typename?: "ReservationUnitNode";
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
};

export type EquipmentFieldsFragment = {
  __typename?: "EquipmentNode";
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  category: {
    __typename?: "EquipmentCategoryNode";
    id: string;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  };
};

export type ReservationUnitPageFieldsFragment = {
  __typename?: "ReservationUnitNode";
  isDraft: boolean;
  descriptionFi?: string | null;
  descriptionEn?: string | null;
  descriptionSv?: string | null;
  reservationKind: ReservationKind;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  reservationStartInterval: ReservationStartInterval;
  reservationBegins?: string | null;
  reservationEnds?: string | null;
  canApplyFreeOfCharge: boolean;
  state?: ReservationUnitState | null;
  reservationState?: ReservationState | null;
  minReservationDuration?: number | null;
  maxReservationDuration?: number | null;
  maxReservationsPerUser?: number | null;
  reservationsMinDaysBefore?: number | null;
  reservationsMaxDaysBefore?: number | null;
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
  applicationRoundTimeSlots: Array<{
    __typename?: "ApplicationRoundTimeSlotNode";
    closed: boolean;
    weekday: number;
    reservableTimes?: Array<{
      __typename?: "TimeSlotType";
      begin: string;
      end: string;
    } | null> | null;
  }>;
  reservationUnitType?: {
    __typename?: "ReservationUnitTypeNode";
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  equipments: Array<{
    __typename?: "EquipmentNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    category: {
      __typename?: "EquipmentCategoryNode";
      id: string;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    };
  }>;
  unit?: {
    __typename?: "UnitNode";
    id: string;
    tprekId?: string | null;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    location?: {
      __typename?: "LocationNode";
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
    __typename?: "TermsOfUseNode";
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  cancellationTerms?: {
    __typename?: "TermsOfUseNode";
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  paymentTerms?: {
    __typename?: "TermsOfUseNode";
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  pricingTerms?: {
    __typename?: "TermsOfUseNode";
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    textFi?: string | null;
    textEn?: string | null;
    textSv?: string | null;
  } | null;
  pricings: Array<{
    __typename?: "ReservationUnitPricingNode";
    begins: string;
    priceUnit: PriceUnit;
    pricingType?: PricingType | null;
    lowestPrice: string;
    highestPrice: string;
    status: Status;
    taxPercentage: { __typename?: "TaxPercentageNode"; value: string };
  }>;
  metadataSet?: {
    __typename?: "ReservationMetadataSetNode";
    id: string;
    name: string;
    pk?: number | null;
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
};

export type BlockingReservationFieldsFragment = {
  __typename?: "ReservationNode";
  pk?: number | null;
  state: State;
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
  __typename?: "Query";
  reservationUnit?: {
    __typename?: "ReservationUnitNode";
    isDraft: boolean;
    descriptionFi?: string | null;
    descriptionEn?: string | null;
    descriptionSv?: string | null;
    reservationKind: ReservationKind;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationStartInterval: ReservationStartInterval;
    reservationBegins?: string | null;
    reservationEnds?: string | null;
    canApplyFreeOfCharge: boolean;
    state?: ReservationUnitState | null;
    reservationState?: ReservationState | null;
    minReservationDuration?: number | null;
    maxReservationDuration?: number | null;
    maxReservationsPerUser?: number | null;
    reservationsMinDaysBefore?: number | null;
    reservationsMaxDaysBefore?: number | null;
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
    applicationRoundTimeSlots: Array<{
      __typename?: "ApplicationRoundTimeSlotNode";
      closed: boolean;
      weekday: number;
      reservableTimes?: Array<{
        __typename?: "TimeSlotType";
        begin: string;
        end: string;
      } | null> | null;
    }>;
    reservationUnitType?: {
      __typename?: "ReservationUnitTypeNode";
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    equipments: Array<{
      __typename?: "EquipmentNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      category: {
        __typename?: "EquipmentCategoryNode";
        id: string;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      };
    }>;
    unit?: {
      __typename?: "UnitNode";
      id: string;
      tprekId?: string | null;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      location?: {
        __typename?: "LocationNode";
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
      __typename?: "TermsOfUseNode";
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    cancellationTerms?: {
      __typename?: "TermsOfUseNode";
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    paymentTerms?: {
      __typename?: "TermsOfUseNode";
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    pricingTerms?: {
      __typename?: "TermsOfUseNode";
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    pricings: Array<{
      __typename?: "ReservationUnitPricingNode";
      begins: string;
      priceUnit: PriceUnit;
      pricingType?: PricingType | null;
      lowestPrice: string;
      highestPrice: string;
      status: Status;
      taxPercentage: { __typename?: "TaxPercentageNode"; value: string };
    }>;
    metadataSet?: {
      __typename?: "ReservationMetadataSetNode";
      id: string;
      name: string;
      pk?: number | null;
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
  } | null;
};

export type ReservationUnitPageQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
  pk: Scalars["Int"]["input"];
  beginDate: Scalars["Date"]["input"];
  endDate: Scalars["Date"]["input"];
  state?: InputMaybe<
    | Array<InputMaybe<Scalars["String"]["input"]>>
    | InputMaybe<Scalars["String"]["input"]>
  >;
}>;

export type ReservationUnitPageQuery = {
  __typename?: "Query";
  reservationUnit?: {
    __typename?: "ReservationUnitNode";
    isDraft: boolean;
    descriptionFi?: string | null;
    descriptionEn?: string | null;
    descriptionSv?: string | null;
    reservationKind: ReservationKind;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    reservationStartInterval: ReservationStartInterval;
    reservationBegins?: string | null;
    reservationEnds?: string | null;
    canApplyFreeOfCharge: boolean;
    state?: ReservationUnitState | null;
    reservationState?: ReservationState | null;
    minReservationDuration?: number | null;
    maxReservationDuration?: number | null;
    maxReservationsPerUser?: number | null;
    reservationsMinDaysBefore?: number | null;
    reservationsMaxDaysBefore?: number | null;
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
    minPersons?: number | null;
    maxPersons?: number | null;
    reservableTimeSpans?: Array<{
      __typename?: "ReservableTimeSpanType";
      startDatetime?: string | null;
      endDatetime?: string | null;
    } | null> | null;
    reservationSet?: Array<{
      __typename?: "ReservationNode";
      pk?: number | null;
      state: State;
      isBlocked?: boolean | null;
      begin: string;
      end: string;
      numPersons?: number | null;
      calendarUrl?: string | null;
      bufferTimeBefore: number;
      bufferTimeAfter: number;
      affectedReservationUnits?: Array<number | null> | null;
    }> | null;
    images: Array<{
      __typename?: "ReservationUnitImageNode";
      imageUrl?: string | null;
      largeUrl?: string | null;
      mediumUrl?: string | null;
      smallUrl?: string | null;
      imageType: ImageType;
    }>;
    applicationRoundTimeSlots: Array<{
      __typename?: "ApplicationRoundTimeSlotNode";
      closed: boolean;
      weekday: number;
      reservableTimes?: Array<{
        __typename?: "TimeSlotType";
        begin: string;
        end: string;
      } | null> | null;
    }>;
    reservationUnitType?: {
      __typename?: "ReservationUnitTypeNode";
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    equipments: Array<{
      __typename?: "EquipmentNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      category: {
        __typename?: "EquipmentCategoryNode";
        id: string;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      };
    }>;
    unit?: {
      __typename?: "UnitNode";
      id: string;
      tprekId?: string | null;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      location?: {
        __typename?: "LocationNode";
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
      __typename?: "TermsOfUseNode";
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    cancellationTerms?: {
      __typename?: "TermsOfUseNode";
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    paymentTerms?: {
      __typename?: "TermsOfUseNode";
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    pricingTerms?: {
      __typename?: "TermsOfUseNode";
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    pricings: Array<{
      __typename?: "ReservationUnitPricingNode";
      begins: string;
      priceUnit: PriceUnit;
      pricingType?: PricingType | null;
      lowestPrice: string;
      highestPrice: string;
      status: Status;
      taxPercentage: { __typename?: "TaxPercentageNode"; value: string };
    }>;
    metadataSet?: {
      __typename?: "ReservationMetadataSetNode";
      id: string;
      name: string;
      pk?: number | null;
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
  } | null;
  affectingReservations?: Array<{
    __typename?: "ReservationNode";
    pk?: number | null;
    state: State;
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
  __typename?: "ReservationUnitNode";
  maxPersons?: number | null;
  id: string;
  pk?: number | null;
  nameFi?: string | null;
  nameEn?: string | null;
  nameSv?: string | null;
  unit?: {
    __typename?: "UnitNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    location?: {
      __typename?: "LocationNode";
      addressStreetEn?: string | null;
      addressStreetSv?: string | null;
      addressCityEn?: string | null;
      addressCitySv?: string | null;
      addressStreetFi?: string | null;
      addressZip: string;
      addressCityFi?: string | null;
    } | null;
  } | null;
  reservationUnitType?: {
    __typename?: "ReservationUnitTypeNode";
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  images: Array<{
    __typename?: "ReservationUnitImageNode";
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
  __typename?: "Query";
  reservationUnits?: {
    __typename?: "ReservationUnitNodeConnection";
    totalCount?: number | null;
    edges: Array<{
      __typename?: "ReservationUnitNodeEdge";
      node?: {
        __typename?: "ReservationUnitNode";
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
          __typename?: "ReservationUnitPricingNode";
          begins: string;
          priceUnit: PriceUnit;
          pricingType?: PricingType | null;
          lowestPrice: string;
          highestPrice: string;
          status: Status;
          taxPercentage: { __typename?: "TaxPercentageNode"; value: string };
        }>;
        unit?: {
          __typename?: "UnitNode";
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          location?: {
            __typename?: "LocationNode";
            addressStreetEn?: string | null;
            addressStreetSv?: string | null;
            addressCityEn?: string | null;
            addressCitySv?: string | null;
            addressStreetFi?: string | null;
            addressZip: string;
            addressCityFi?: string | null;
          } | null;
        } | null;
        reservationUnitType?: {
          __typename?: "ReservationUnitTypeNode";
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
        images: Array<{
          __typename?: "ReservationUnitImageNode";
          imageUrl?: string | null;
          largeUrl?: string | null;
          mediumUrl?: string | null;
          smallUrl?: string | null;
          imageType: ImageType;
        }>;
      } | null;
    } | null>;
    pageInfo: {
      __typename?: "PageInfo";
      endCursor?: string | null;
      hasNextPage: boolean;
    };
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
  __typename?: "Query";
  reservationUnits?: {
    __typename?: "ReservationUnitNodeConnection";
    edges: Array<{
      __typename?: "ReservationUnitNodeEdge";
      node?: {
        __typename?: "ReservationUnitNode";
        maxPersons?: number | null;
        isDraft: boolean;
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
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
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          location?: {
            __typename?: "LocationNode";
            addressStreetEn?: string | null;
            addressStreetSv?: string | null;
            addressCityEn?: string | null;
            addressCitySv?: string | null;
            addressStreetFi?: string | null;
            addressZip: string;
            addressCityFi?: string | null;
          } | null;
        } | null;
        reservationUnitType?: {
          __typename?: "ReservationUnitTypeNode";
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
        pricings: Array<{
          __typename?: "ReservationUnitPricingNode";
          begins: string;
          priceUnit: PriceUnit;
          pricingType?: PricingType | null;
          lowestPrice: string;
          highestPrice: string;
          status: Status;
          taxPercentage: { __typename?: "TaxPercentageNode"; value: string };
        }>;
      } | null;
    } | null>;
  } | null;
};

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never }>;

export type GetCurrentUserQuery = {
  __typename?: "Query";
  currentUser?: {
    __typename?: "UserNode";
    pk?: number | null;
    firstName: string;
    lastName: string;
    email: string;
    isAdAuthenticated?: boolean | null;
  } | null;
};

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
    __typename?: "AgeGroupNode";
    id: string;
    pk?: number | null;
    minimum: number;
    maximum?: number | null;
  } | null;
  reservationUnitOptions: Array<{
    __typename?: "ReservationUnitOptionNode";
    id: string;
    pk?: number | null;
    preferredOrder: number;
  }>;
};

export type ApplicationSectionFragmentFragment = {
  __typename?: "ApplicationSectionNode";
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
    id: string;
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
    id: string;
    pk?: number | null;
    minimum: number;
    maximum?: number | null;
  } | null;
};

export type ApplicationSectionUiFragmentFragment = {
  __typename?: "ApplicationSectionNode";
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
    __typename?: "SuitableTimeRangeNode";
    id: string;
    pk?: number | null;
    beginTime: string;
    endTime: string;
    dayOfTheWeek: Weekday;
    priority: Priority;
  }>;
  purpose?: {
    __typename?: "ReservationPurposeNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
  } | null;
  reservationUnitOptions: Array<{
    __typename?: "ReservationUnitOptionNode";
    id: string;
    pk?: number | null;
    preferredOrder: number;
    reservationUnit: {
      __typename?: "ReservationUnitNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      unit?: {
        __typename?: "UnitNode";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
      applicationRoundTimeSlots: Array<{
        __typename?: "ApplicationRoundTimeSlotNode";
        id: string;
        weekday: number;
        closed: boolean;
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
    id: string;
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
    id: string;
    pk?: number | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  organisation?: {
    __typename?: "OrganisationNode";
    id: string;
    pk?: number | null;
    name: string;
    identifier?: string | null;
    organisationType: OrganizationTypeChoice;
    coreBusiness: string;
    yearEstablished?: number | null;
    address?: {
      __typename?: "AddressNode";
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddress: string;
      city: string;
    } | null;
  } | null;
  homeCity?: {
    __typename?: "CityNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  billingAddress?: {
    __typename?: "AddressNode";
    id: string;
    pk?: number | null;
    postCode: string;
    streetAddress: string;
    city: string;
  } | null;
  user?: {
    __typename?: "ApplicantNode";
    id: string;
    name?: string | null;
    email: string;
    pk?: number | null;
  } | null;
};

export type ApplicationRoundFragmentFragment = {
  __typename?: "ApplicationRoundNode";
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
  serviceSector?: {
    __typename?: "ServiceSectorNode";
    pk?: number | null;
    nameFi?: string | null;
  } | null;
  reservationUnits: Array<{
    __typename?: "ReservationUnitNode";
    id: string;
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
      id: string;
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
      __typename?: "ReservationUnitOptionNode";
      id: string;
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
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        unit?: {
          __typename?: "UnitNode";
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
        applicationRoundTimeSlots: Array<{
          __typename?: "ApplicationRoundTimeSlotNode";
          id: string;
          weekday: number;
          closed: boolean;
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
      id: string;
      pk?: number | null;
      beginTime: string;
      endTime: string;
      dayOfTheWeek: Weekday;
      priority: Priority;
    }>;
    purpose?: {
      __typename?: "ReservationPurposeNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
    } | null;
    ageGroup?: {
      __typename?: "AgeGroupNode";
      id: string;
      pk?: number | null;
      minimum: number;
      maximum?: number | null;
    } | null;
  }> | null;
  contactPerson?: {
    __typename?: "PersonNode";
    id: string;
    pk?: number | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  organisation?: {
    __typename?: "OrganisationNode";
    id: string;
    pk?: number | null;
    name: string;
    identifier?: string | null;
    organisationType: OrganizationTypeChoice;
    coreBusiness: string;
    yearEstablished?: number | null;
    address?: {
      __typename?: "AddressNode";
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddress: string;
      city: string;
    } | null;
  } | null;
  homeCity?: {
    __typename?: "CityNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  billingAddress?: {
    __typename?: "AddressNode";
    id: string;
    pk?: number | null;
    postCode: string;
    streetAddress: string;
    city: string;
  } | null;
  user?: {
    __typename?: "ApplicantNode";
    id: string;
    name?: string | null;
    email: string;
    pk?: number | null;
  } | null;
};

export type ApplicationCommonFragment = {
  __typename?: "ApplicationNode";
  id: string;
  pk?: number | null;
  status?: ApplicationStatusChoice | null;
  lastModifiedDate: string;
  applicantType?: ApplicantTypeChoice | null;
  additionalInformation?: string | null;
  applicationRound: {
    __typename?: "ApplicationRoundNode";
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
    serviceSector?: {
      __typename?: "ServiceSectorNode";
      pk?: number | null;
      nameFi?: string | null;
    } | null;
    reservationUnits: Array<{
      __typename?: "ReservationUnitNode";
      id: string;
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
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
    }>;
  };
  applicationSections?: Array<{
    __typename?: "ApplicationSectionNode";
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
      __typename?: "SuitableTimeRangeNode";
      id: string;
      pk?: number | null;
      beginTime: string;
      endTime: string;
      dayOfTheWeek: Weekday;
      priority: Priority;
    }>;
    purpose?: {
      __typename?: "ReservationPurposeNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameSv?: string | null;
      nameEn?: string | null;
    } | null;
    reservationUnitOptions: Array<{
      __typename?: "ReservationUnitOptionNode";
      id: string;
      pk?: number | null;
      preferredOrder: number;
      reservationUnit: {
        __typename?: "ReservationUnitNode";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        unit?: {
          __typename?: "UnitNode";
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
        applicationRoundTimeSlots: Array<{
          __typename?: "ApplicationRoundTimeSlotNode";
          id: string;
          weekday: number;
          closed: boolean;
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
      id: string;
      pk?: number | null;
      minimum: number;
      maximum?: number | null;
    } | null;
  }> | null;
  contactPerson?: {
    __typename?: "PersonNode";
    id: string;
    pk?: number | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  organisation?: {
    __typename?: "OrganisationNode";
    id: string;
    pk?: number | null;
    name: string;
    identifier?: string | null;
    organisationType: OrganizationTypeChoice;
    coreBusiness: string;
    yearEstablished?: number | null;
    address?: {
      __typename?: "AddressNode";
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddress: string;
      city: string;
    } | null;
  } | null;
  homeCity?: {
    __typename?: "CityNode";
    id: string;
    pk?: number | null;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
  } | null;
  billingAddress?: {
    __typename?: "AddressNode";
    id: string;
    pk?: number | null;
    postCode: string;
    streetAddress: string;
    city: string;
  } | null;
  user?: {
    __typename?: "ApplicantNode";
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
  __typename?: "Query";
  application?: {
    __typename?: "ApplicationNode";
    id: string;
    pk?: number | null;
    status?: ApplicationStatusChoice | null;
    lastModifiedDate: string;
    applicantType?: ApplicantTypeChoice | null;
    additionalInformation?: string | null;
    applicationRound: {
      __typename?: "ApplicationRoundNode";
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
        id: string;
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
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameSv?: string | null;
          nameEn?: string | null;
        } | null;
      }>;
    };
    applicationSections?: Array<{
      __typename?: "ApplicationSectionNode";
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
        __typename?: "SuitableTimeRangeNode";
        id: string;
        pk?: number | null;
        beginTime: string;
        endTime: string;
        dayOfTheWeek: Weekday;
        priority: Priority;
      }>;
      purpose?: {
        __typename?: "ReservationPurposeNode";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameSv?: string | null;
        nameEn?: string | null;
      } | null;
      reservationUnitOptions: Array<{
        __typename?: "ReservationUnitOptionNode";
        id: string;
        pk?: number | null;
        preferredOrder: number;
        reservationUnit: {
          __typename?: "ReservationUnitNode";
          id: string;
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          unit?: {
            __typename?: "UnitNode";
            id: string;
            pk?: number | null;
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
          } | null;
          applicationRoundTimeSlots: Array<{
            __typename?: "ApplicationRoundTimeSlotNode";
            id: string;
            weekday: number;
            closed: boolean;
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
        id: string;
        pk?: number | null;
        minimum: number;
        maximum?: number | null;
      } | null;
    }> | null;
    contactPerson?: {
      __typename?: "PersonNode";
      id: string;
      pk?: number | null;
      firstName: string;
      lastName: string;
      email?: string | null;
      phoneNumber?: string | null;
    } | null;
    organisation?: {
      __typename?: "OrganisationNode";
      id: string;
      pk?: number | null;
      name: string;
      identifier?: string | null;
      organisationType: OrganizationTypeChoice;
      coreBusiness: string;
      yearEstablished?: number | null;
      address?: {
        __typename?: "AddressNode";
        id: string;
        pk?: number | null;
        postCode: string;
        streetAddress: string;
        city: string;
      } | null;
    } | null;
    homeCity?: {
      __typename?: "CityNode";
      id: string;
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    billingAddress?: {
      __typename?: "AddressNode";
      id: string;
      pk?: number | null;
      postCode: string;
      streetAddress: string;
      city: string;
    } | null;
    user?: {
      __typename?: "ApplicantNode";
      id: string;
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

export const ApplicationRoundFieldsFragmentDoc = gql`
  fragment ApplicationRoundFields on ApplicationRoundNode {
    pk
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
    reservationUnits {
      pk
      unit {
        pk
      }
    }
  }
`;
export const CancellationRuleFieldsFragmentDoc = gql`
  fragment CancellationRuleFields on ReservationUnitNode {
    cancellationRule {
      canBeCancelledTimeBefore
      needsHandling
    }
  }
`;
export const ReservationInfoFragmentFragmentDoc = gql`
  fragment ReservationInfoFragment on ReservationNode {
    description
    purpose {
      pk
      nameFi
      nameEn
      nameSv
    }
    ageGroup {
      pk
      minimum
      maximum
    }
    homeCity {
      pk
      name
    }
    numPersons
  }
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
      latitude
      longitude
    }
  }
  ${UnitNameFieldsI18NFragmentDoc}
`;
export const TermsOfUseTextFieldsFragmentDoc = gql`
  fragment TermsOfUseTextFields on TermsOfUseNode {
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
export const ImageFragmentFragmentDoc = gql`
  fragment ImageFragment on ReservationUnitImageNode {
    imageUrl
    largeUrl
    mediumUrl
    smallUrl
    imageType
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
      ...ImageFragment
    }
    metadataSet {
      id
      name
      pk
      supportedFields {
        id
        fieldName
      }
      requiredFields {
        id
        fieldName
      }
    }
    minPersons
    maxPersons
  }
  ${UnitFieldsFragmentDoc}
  ${TermsOfUseTextFieldsFragmentDoc}
  ${TermsOfUseNameFieldsFragmentDoc}
  ${PricingFieldsFragmentDoc}
  ${ImageFragmentFragmentDoc}
`;
export const ReservationUnitTypeFieldsFragmentDoc = gql`
  fragment ReservationUnitTypeFields on ReservationUnitTypeNode {
    pk
    nameFi
    nameEn
    nameSv
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
      ...ImageFragment
    }
    applicationRoundTimeSlots {
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
    reservationBegins
    reservationEnds
    canApplyFreeOfCharge
    state
    reservationState
    reservationUnitType {
      ...ReservationUnitTypeFields
    }
    minReservationDuration
    maxReservationDuration
    maxReservationsPerUser
    reservationsMinDaysBefore
    reservationsMaxDaysBefore
    requireReservationHandling
    equipments {
      ...EquipmentFields
    }
  }
  ${ReservationUnitFieldsFragmentDoc}
  ${ImageFragmentFragmentDoc}
  ${ReservationUnitTypeFieldsFragmentDoc}
  ${EquipmentFieldsFragmentDoc}
`;
export const BlockingReservationFieldsFragmentDoc = gql`
  fragment BlockingReservationFields on ReservationNode {
    pk
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
      ...ImageFragment
    }
    maxPersons
  }
  ${ReservationUnitNameFieldsFragmentDoc}
  ${UnitNameFieldsI18NFragmentDoc}
  ${ReservationUnitTypeFieldsFragmentDoc}
  ${ImageFragmentFragmentDoc}
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
    id
    pk
    name
    status
    ...ApplicationSectionDurationFragment
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
      name
      identifier
      organisationType
      coreBusiness
      yearEstablished
      address {
        id
        pk
        postCode
        streetAddress
        city
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
      streetAddress
      city
    }
    user {
      id
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
      id
      ...ApplicationSectionUIFragment
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
  ${ApplicantFragmentFragmentDoc}
  ${ApplicationSectionUiFragmentFragmentDoc}
`;
export const ApplicationRoundFragmentFragmentDoc = gql`
  fragment ApplicationRoundFragment on ApplicationRoundNode {
    id
    pk
    nameFi
    nameSv
    nameEn
    serviceSector {
      pk
      nameFi
    }
    reservationUnits {
      id
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
  ${ImageFragmentFragmentDoc}
`;
export const ApplicationCommonFragmentDoc = gql`
  fragment ApplicationCommon on ApplicationNode {
    id
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
export const OptionsDocument = gql`
  query Options {
    reservationUnitTypes {
      edges {
        node {
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
          pk
          minimum
          maximum
        }
      }
    }
    cities {
      edges {
        node {
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
          pk
          applicationRound {
            ...ApplicationRoundFields
          }
          user {
            name
          }
          status
          ...ApplicationNameFragment
          lastModifiedDate
        }
      }
    }
  }
  ${ApplicationRoundFieldsFragmentDoc}
  ${ApplicationNameFragmentFragmentDoc}
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
          pk
          reservationPeriodBegin
          reservationPeriodEnd
          applicationPeriodBegin
          status
          reservationUnits {
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
    $orderBy: [UnitOrderingChoices]
  ) {
    units(
      publishedReservationUnits: $publishedReservationUnits
      ownReservations: $ownReservations
      orderBy: $orderBy
    ) {
      edges {
        node {
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
  mutation createReservation($input: ReservationCreateMutationInput!) {
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
  mutation updateReservation($input: ReservationUpdateMutationInput!) {
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
    $state: [String]
    $user: ID!
    $reservationUnit: [ID]
    $orderBy: [ReservationOrderingChoices]
  ) {
    reservations(
      beginDate: $beginDate
      endDate: $endDate
      state: $state
      user: $user
      reservationUnit: $reservationUnit
      orderBy: $orderBy
      reservationType: ""
    ) {
      edges {
        node {
          id
          pk
          name
          begin
          end
          state
          price
          bufferTimeBefore
          bufferTimeAfter
          order {
            id
            orderUuid
          }
          isBlocked
          reservationUnit {
            id
            pk
            nameFi
            nameEn
            nameSv
            unit {
              ...UnitNameFieldsI18N
            }
            ...CancellationRuleFields
            images {
              ...ImageFragment
            }
            pricings {
              ...PricingFields
            }
          }
        }
      }
    }
  }
  ${UnitNameFieldsI18NFragmentDoc}
  ${CancellationRuleFieldsFragmentDoc}
  ${ImageFragmentFragmentDoc}
  ${PricingFieldsFragmentDoc}
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
      order {
        id
        orderUuid
        status
      }
      reservationUnit {
        id
        ...ReservationUnitFields
        ...CancellationRuleFields
      }
      ...ReservationInfoFragment
      isHandled
    }
  }
  ${ReserveeNameFieldsFragmentDoc}
  ${ReservationUnitFieldsFragmentDoc}
  ${CancellationRuleFieldsFragmentDoc}
  ${ReservationInfoFragmentFragmentDoc}
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
export const GetReservationCancelReasonsDocument = gql`
  query getReservationCancelReasons {
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
 * __useGetReservationCancelReasonsQuery__
 *
 * To run a query within a React component, call `useGetReservationCancelReasonsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetReservationCancelReasonsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetReservationCancelReasonsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetReservationCancelReasonsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetReservationCancelReasonsQuery,
    GetReservationCancelReasonsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetReservationCancelReasonsQuery,
    GetReservationCancelReasonsQueryVariables
  >(GetReservationCancelReasonsDocument, options);
}
export function useGetReservationCancelReasonsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetReservationCancelReasonsQuery,
    GetReservationCancelReasonsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetReservationCancelReasonsQuery,
    GetReservationCancelReasonsQueryVariables
  >(GetReservationCancelReasonsDocument, options);
}
export function useGetReservationCancelReasonsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetReservationCancelReasonsQuery,
    GetReservationCancelReasonsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetReservationCancelReasonsQuery,
    GetReservationCancelReasonsQueryVariables
  >(GetReservationCancelReasonsDocument, options);
}
export type GetReservationCancelReasonsQueryHookResult = ReturnType<
  typeof useGetReservationCancelReasonsQuery
>;
export type GetReservationCancelReasonsLazyQueryHookResult = ReturnType<
  typeof useGetReservationCancelReasonsLazyQuery
>;
export type GetReservationCancelReasonsSuspenseQueryHookResult = ReturnType<
  typeof useGetReservationCancelReasonsSuspenseQuery
>;
export type GetReservationCancelReasonsQueryResult = Apollo.QueryResult<
  GetReservationCancelReasonsQuery,
  GetReservationCancelReasonsQueryVariables
>;
export const AdjustReservationTimeDocument = gql`
  mutation adjustReservationTime($input: ReservationAdjustTimeMutationInput!) {
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
  query order($orderUuid: String!) {
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
  mutation refreshOrder($input: RefreshOrderMutationInput!) {
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
    $state: [String]
  ) {
    reservationUnit(id: $id) {
      ...ReservationUnitPageFields
      reservableTimeSpans(startDate: $beginDate, endDate: $endDate) {
        startDatetime
        endDatetime
      }
      reservationSet(state: $state) {
        ...BlockingReservationFields
      }
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
            ...ImageFragment
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
  ${ImageFragmentFragmentDoc}
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
export const GetCurrentUserDocument = gql`
  query GetCurrentUser {
    currentUser {
      pk
      firstName
      lastName
      email
      isAdAuthenticated
    }
  }
`;

/**
 * __useGetCurrentUserQuery__
 *
 * To run a query within a React component, call `useGetCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetCurrentUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetCurrentUserQuery,
    GetCurrentUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(
    GetCurrentUserDocument,
    options
  );
}
export function useGetCurrentUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetCurrentUserQuery,
    GetCurrentUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(
    GetCurrentUserDocument,
    options
  );
}
export function useGetCurrentUserSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetCurrentUserQuery,
    GetCurrentUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetCurrentUserQuery,
    GetCurrentUserQueryVariables
  >(GetCurrentUserDocument, options);
}
export type GetCurrentUserQueryHookResult = ReturnType<
  typeof useGetCurrentUserQuery
>;
export type GetCurrentUserLazyQueryHookResult = ReturnType<
  typeof useGetCurrentUserLazyQuery
>;
export type GetCurrentUserSuspenseQueryHookResult = ReturnType<
  typeof useGetCurrentUserSuspenseQuery
>;
export type GetCurrentUserQueryResult = Apollo.QueryResult<
  GetCurrentUserQuery,
  GetCurrentUserQueryVariables
>;
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
export const ApplicationDocument = gql`
  query Application($id: ID!) {
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
