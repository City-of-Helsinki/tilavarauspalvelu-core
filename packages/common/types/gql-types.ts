import { gql } from "@apollo/client";
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
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /**
   * The `Date` scalar type represents a Date
   * value as specified by
   * [iso8601](https://en.wikipedia.org/wiki/ISO_8601).
   */
  Date: { input: string; output: string };
  /**
   * The `DateTime` scalar type represents a DateTime
   * value as specified by
   * [iso8601](https://en.wikipedia.org/wiki/ISO_8601).
   */
  DateTime: { input: string; output: string };
  /** The `Decimal` scalar type represents a python Decimal. */
  Decimal: { input: string; output: string };
  /**
   * The `Duration` scalar type represents a duration value as an integer in seconds.
   * For example, a value of 900 means a duration of 15 minutes.
   */
  Duration: { input: number; output: number };
  /**
   * The `Time` scalar type represents a Time value as
   * specified by
   * [iso8601](https://en.wikipedia.org/wiki/ISO_8601).
   */
  Time: { input: string; output: string };
  /** Time scalar that can parse time-strings from database. */
  TimeString: { input: string; output: string };
  /**
   * Leverages the internal Python implementation of UUID (uuid.UUID) to provide native UUID objects
   * in fields, resolvers and input.
   */
  UUID: { input: string; output: string };
  /**
   * Create scalar that ignores normal serialization/deserialization, since
   * that will be handled by the multipart request spec
   */
  Upload: { input: unknown; output: unknown };
};

export type AbilityGroupType = {
  __typename?: "AbilityGroupType";
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type AddressNode = Node & {
  __typename?: "AddressNode";
  city: Scalars["String"]["output"];
  cityEn?: Maybe<Scalars["String"]["output"]>;
  cityFi?: Maybe<Scalars["String"]["output"]>;
  citySv?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
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

export type AgeGroupType = Node & {
  __typename?: "AgeGroupType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  maximum?: Maybe<Scalars["Int"]["output"]>;
  minimum: Scalars["Int"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type AgeGroupTypeConnection = {
  __typename?: "AgeGroupTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<AgeGroupTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `AgeGroupType` and its cursor. */
export type AgeGroupTypeEdge = {
  __typename?: "AgeGroupTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<AgeGroupType>;
};

export type ApplicantNode = Node & {
  __typename?: "ApplicantNode";
  dateOfBirth?: Maybe<Scalars["Date"]["output"]>;
  email: Scalars["String"]["output"];
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

/** An enumeration. */
export enum ApplicantTypeChoice {
  Association = "ASSOCIATION",
  Community = "COMMUNITY",
  Company = "COMPANY",
  Individual = "INDIVIDUAL",
}

export type ApplicationCancelMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ApplicationCancelMutationPayload = {
  __typename?: "ApplicationCancelMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ApplicationCreateMutationInput = {
  additionalInformation?: InputMaybe<Scalars["String"]["input"]>;
  applicantType?: InputMaybe<Applicant_Type>;
  applicationEvents?: InputMaybe<
    Array<InputMaybe<ApplicationEventInApplicationSerializerInput>>
  >;
  applicationRound: Scalars["Int"]["input"];
  billingAddress?: InputMaybe<AddressSerializerInput>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  contactPerson?: InputMaybe<PersonSerializerInput>;
  homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  organisation?: InputMaybe<OrganisationSerializerInput>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ApplicationCreateMutationPayload = {
  __typename?: "ApplicationCreateMutationPayload";
  additionalInformation?: Maybe<Scalars["String"]["output"]>;
  applicantType?: Maybe<Applicant_Type>;
  applicationEvents?: Maybe<Array<Maybe<ApplicationEventNode>>>;
  applicationRound?: Maybe<Scalars["Int"]["output"]>;
  billingAddress?: Maybe<AddressNode>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  contactPerson?: Maybe<PersonNode>;
  createdDate?: Maybe<Scalars["DateTime"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  homeCity?: Maybe<Scalars["Int"]["output"]>;
  lastModifiedDate?: Maybe<Scalars["DateTime"]["output"]>;
  organisation?: Maybe<OrganisationNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
};

export type ApplicationDeclineMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ApplicationDeclineMutationPayload = {
  __typename?: "ApplicationDeclineMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ApplicationEventCreateMutationInput = {
  abilityGroup?: InputMaybe<Scalars["Int"]["input"]>;
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  application: Scalars["Int"]["input"];
  applicationEventSchedules: Array<
    InputMaybe<ApplicationEventScheduleInEventSerializerInput>
  >;
  begin?: InputMaybe<Scalars["Date"]["input"]>;
  biweekly?: InputMaybe<Scalars["Boolean"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  end?: InputMaybe<Scalars["Date"]["input"]>;
  eventReservationUnits: Array<InputMaybe<EventReservationUnitSerializerInput>>;
  eventsPerWeek?: InputMaybe<Scalars["Int"]["input"]>;
  maxDuration?: InputMaybe<Scalars["String"]["input"]>;
  minDuration?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ApplicationEventCreateMutationPayload = {
  __typename?: "ApplicationEventCreateMutationPayload";
  abilityGroup?: Maybe<Scalars["Int"]["output"]>;
  ageGroup?: Maybe<Scalars["Int"]["output"]>;
  application?: Maybe<Scalars["Int"]["output"]>;
  applicationEventSchedules?: Maybe<Array<Maybe<ApplicationEventScheduleNode>>>;
  begin?: Maybe<Scalars["Date"]["output"]>;
  biweekly?: Maybe<Scalars["Boolean"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["Date"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  eventReservationUnits?: Maybe<Array<Maybe<EventReservationUnitNode>>>;
  eventsPerWeek?: Maybe<Scalars["Int"]["output"]>;
  maxDuration?: Maybe<Scalars["String"]["output"]>;
  minDuration?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  purpose?: Maybe<Scalars["Int"]["output"]>;
};

export type ApplicationEventDeclineMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ApplicationEventDeclineMutationPayload = {
  __typename?: "ApplicationEventDeclineMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ApplicationEventDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["ID"]["input"];
};

export type ApplicationEventDeleteMutationPayload = {
  __typename?: "ApplicationEventDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** Whether the object was deleted successfully. */
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Number of rows deleted. */
  rowCount?: Maybe<Scalars["Int"]["output"]>;
};

export type ApplicationEventInApplicationSerializerInput = {
  abilityGroup?: InputMaybe<Scalars["Int"]["input"]>;
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  applicationEventSchedules: Array<
    InputMaybe<ApplicationEventScheduleInEventSerializerInput>
  >;
  begin?: InputMaybe<Scalars["Date"]["input"]>;
  biweekly?: InputMaybe<Scalars["Boolean"]["input"]>;
  end?: InputMaybe<Scalars["Date"]["input"]>;
  eventReservationUnits: Array<InputMaybe<EventReservationUnitSerializerInput>>;
  eventsPerWeek?: InputMaybe<Scalars["Int"]["input"]>;
  maxDuration?: InputMaybe<Scalars["String"]["input"]>;
  minDuration?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ApplicationEventNode = Node & {
  __typename?: "ApplicationEventNode";
  abilityGroup?: Maybe<AbilityGroupType>;
  ageGroup?: Maybe<AgeGroupType>;
  application: ApplicationNode;
  applicationEventSchedules?: Maybe<Array<ApplicationEventScheduleNode>>;
  begin?: Maybe<Scalars["Date"]["output"]>;
  biweekly: Scalars["Boolean"]["output"];
  end?: Maybe<Scalars["Date"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  eventReservationUnits?: Maybe<Array<EventReservationUnitNode>>;
  eventsPerWeek?: Maybe<Scalars["Int"]["output"]>;
  flagged: Scalars["Boolean"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  maxDuration?: Maybe<Scalars["Duration"]["output"]>;
  minDuration?: Maybe<Scalars["Duration"]["output"]>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  purpose?: Maybe<ReservationPurposeType>;
  status?: Maybe<ApplicationEventStatusChoice>;
  uuid: Scalars["UUID"]["output"];
};

export type ApplicationEventNodeEventReservationUnitsArgs = {
  preferredOrder?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ApplicationEventNodeConnection = {
  __typename?: "ApplicationEventNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ApplicationEventNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ApplicationEventNode` and its cursor. */
export type ApplicationEventNodeEdge = {
  __typename?: "ApplicationEventNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ApplicationEventNode>;
};

export type ApplicationEventScheduleApproveMutationInput = {
  allocatedBegin: Scalars["Time"]["input"];
  allocatedDay: Scalars["Int"]["input"];
  allocatedEnd: Scalars["Time"]["input"];
  allocatedReservationUnit: Scalars["Int"]["input"];
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ApplicationEventScheduleApproveMutationPayload = {
  __typename?: "ApplicationEventScheduleApproveMutationPayload";
  allocatedBegin?: Maybe<Scalars["Time"]["output"]>;
  allocatedDay?: Maybe<Scalars["Int"]["output"]>;
  allocatedEnd?: Maybe<Scalars["Time"]["output"]>;
  allocatedReservationUnit?: Maybe<Scalars["Int"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ApplicationEventScheduleDeclineMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ApplicationEventScheduleDeclineMutationPayload = {
  __typename?: "ApplicationEventScheduleDeclineMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ApplicationEventScheduleInEventSerializerInput = {
  begin: Scalars["Time"]["input"];
  day: Scalars["Int"]["input"];
  end: Scalars["Time"]["input"];
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  priority?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ApplicationEventScheduleNode = Node & {
  __typename?: "ApplicationEventScheduleNode";
  allocatedBegin?: Maybe<Scalars["TimeString"]["output"]>;
  allocatedDay?: Maybe<Scalars["Int"]["output"]>;
  allocatedEnd?: Maybe<Scalars["TimeString"]["output"]>;
  allocatedReservationUnit?: Maybe<ReservationUnitType>;
  applicationEvent: ApplicationEventNode;
  begin: Scalars["TimeString"]["output"];
  day: Scalars["Int"]["output"];
  declined: Scalars["Boolean"]["output"];
  end: Scalars["TimeString"]["output"];
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  priority: Scalars["Int"]["output"];
};

export type ApplicationEventScheduleNodeConnection = {
  __typename?: "ApplicationEventScheduleNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ApplicationEventScheduleNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ApplicationEventScheduleNode` and its cursor. */
export type ApplicationEventScheduleNodeEdge = {
  __typename?: "ApplicationEventScheduleNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ApplicationEventScheduleNode>;
};

/** An enumeration. */
export enum ApplicationEventStatusChoice {
  Approved = "APPROVED",
  Declined = "DECLINED",
  Failed = "FAILED",
  Reserved = "RESERVED",
  Unallocated = "UNALLOCATED",
}

export type ApplicationEventUpdateMutationInput = {
  abilityGroup?: InputMaybe<Scalars["Int"]["input"]>;
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  application?: InputMaybe<Scalars["Int"]["input"]>;
  applicationEventSchedules?: InputMaybe<
    Array<InputMaybe<UpdateApplicationEventScheduleInEventSerializerInput>>
  >;
  begin?: InputMaybe<Scalars["Date"]["input"]>;
  biweekly?: InputMaybe<Scalars["Boolean"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  end?: InputMaybe<Scalars["Date"]["input"]>;
  eventReservationUnits?: InputMaybe<
    Array<InputMaybe<UpdateEventReservationUnitSerializerInput>>
  >;
  eventsPerWeek?: InputMaybe<Scalars["Int"]["input"]>;
  maxDuration?: InputMaybe<Scalars["String"]["input"]>;
  minDuration?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk: Scalars["Int"]["input"];
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ApplicationEventUpdateMutationPayload = {
  __typename?: "ApplicationEventUpdateMutationPayload";
  abilityGroup?: Maybe<Scalars["Int"]["output"]>;
  ageGroup?: Maybe<Scalars["Int"]["output"]>;
  application?: Maybe<Scalars["Int"]["output"]>;
  applicationEventSchedules?: Maybe<Array<Maybe<ApplicationEventScheduleNode>>>;
  begin?: Maybe<Scalars["Date"]["output"]>;
  biweekly?: Maybe<Scalars["Boolean"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["Date"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  eventReservationUnits?: Maybe<Array<Maybe<EventReservationUnitNode>>>;
  eventsPerWeek?: Maybe<Scalars["Int"]["output"]>;
  maxDuration?: Maybe<Scalars["String"]["output"]>;
  minDuration?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  purpose?: Maybe<Scalars["Int"]["output"]>;
};

export type ApplicationNode = Node & {
  __typename?: "ApplicationNode";
  additionalInformation?: Maybe<Scalars["String"]["output"]>;
  applicant?: Maybe<ApplicantNode>;
  applicantType?: Maybe<ApplicationsApplicationApplicantTypeChoices>;
  applicationEvents?: Maybe<Array<ApplicationEventNode>>;
  applicationRound: ApplicationRoundNode;
  billingAddress?: Maybe<AddressNode>;
  contactPerson?: Maybe<PersonNode>;
  createdDate: Scalars["DateTime"]["output"];
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  homeCity?: Maybe<CityNode>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  lastModifiedDate: Scalars["DateTime"]["output"];
  organisation?: Maybe<OrganisationNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  status?: Maybe<ApplicationStatusChoice>;
  workingMemo: Scalars["String"]["output"];
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

export type ApplicationRoundNode = Node & {
  __typename?: "ApplicationRoundNode";
  applicationPeriodBegin: Scalars["DateTime"]["output"];
  applicationPeriodEnd: Scalars["DateTime"]["output"];
  applicationsCount?: Maybe<Scalars["Int"]["output"]>;
  criteria: Scalars["String"]["output"];
  criteriaEn?: Maybe<Scalars["String"]["output"]>;
  criteriaFi?: Maybe<Scalars["String"]["output"]>;
  criteriaSv?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  handledDate?: Maybe<Scalars["DateTime"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  publicDisplayBegin: Scalars["DateTime"]["output"];
  publicDisplayEnd: Scalars["DateTime"]["output"];
  purposes?: Maybe<Array<ReservationPurposeType>>;
  reservationPeriodBegin: Scalars["Date"]["output"];
  reservationPeriodEnd: Scalars["Date"]["output"];
  reservationUnitCount?: Maybe<Scalars["Int"]["output"]>;
  reservationUnits?: Maybe<Array<ReservationUnitType>>;
  sentDate?: Maybe<Scalars["DateTime"]["output"]>;
  serviceSector?: Maybe<ServiceSectorType>;
  status?: Maybe<ApplicationRoundStatusChoice>;
  statusTimestamp?: Maybe<Scalars["DateTime"]["output"]>;
  targetGroup: ApplicationsApplicationRoundTargetGroupChoices;
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
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
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

export type ApplicationSendMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ApplicationSendMutationPayload = {
  __typename?: "ApplicationSendMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
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
  applicantType?: InputMaybe<Applicant_Type>;
  applicationEvents?: InputMaybe<
    Array<InputMaybe<UpdateApplicationEventInApplicationSerializerInput>>
  >;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  billingAddress?: InputMaybe<UpdateAddressSerializerInput>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  contactPerson?: InputMaybe<UpdatePersonSerializerInput>;
  homeCity?: InputMaybe<Scalars["Int"]["input"]>;
  organisation?: InputMaybe<UpdateOrganisationSerializerInput>;
  pk: Scalars["Int"]["input"];
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ApplicationUpdateMutationPayload = {
  __typename?: "ApplicationUpdateMutationPayload";
  additionalInformation?: Maybe<Scalars["String"]["output"]>;
  applicantType?: Maybe<Applicant_Type>;
  applicationEvents?: Maybe<Array<Maybe<ApplicationEventNode>>>;
  applicationRound?: Maybe<Scalars["Int"]["output"]>;
  billingAddress?: Maybe<AddressNode>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  contactPerson?: Maybe<PersonNode>;
  createdDate?: Maybe<Scalars["DateTime"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  homeCity?: Maybe<Scalars["Int"]["output"]>;
  lastModifiedDate?: Maybe<Scalars["DateTime"]["output"]>;
  organisation?: Maybe<OrganisationNode>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
  workingMemo?: Maybe<Scalars["String"]["output"]>;
};

/** An enumeration. */
export enum ApplicationsApplicationApplicantTypeChoices {
  /** Association */
  Association = "ASSOCIATION",
  /** Community */
  Community = "COMMUNITY",
  /** Company */
  Company = "COMPANY",
  /** Individual */
  Individual = "INDIVIDUAL",
}

/** An enumeration. */
export enum ApplicationsApplicationRoundTargetGroupChoices {
  /** Kaikki */
  All = "ALL",
  /** Internal */
  Internal = "INTERNAL",
  /** Public */
  Public = "PUBLIC",
}

/** An enumeration. */
export enum ApplicationsOrganisationOrganisationTypeChoices {
  /** Company */
  Company = "COMPANY",
  /** Municipality consortium */
  MunicipalityConsortium = "MUNICIPALITY_CONSORTIUM",
  /** Public association */
  PublicAssociation = "PUBLIC_ASSOCIATION",
  /** Registered association */
  RegisteredAssociation = "REGISTERED_ASSOCIATION",
  /** Religious community */
  ReligiousCommunity = "RELIGIOUS_COMMUNITY",
  /** Unregistered association */
  UnregisteredAssociation = "UNREGISTERED_ASSOCIATION",
}

export type BannerNotificationCreateMutationInput = {
  activeFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  activeUntil?: InputMaybe<Scalars["DateTime"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  draft?: InputMaybe<Scalars["Boolean"]["input"]>;
  level: Level;
  message?: InputMaybe<Scalars["String"]["input"]>;
  messageEn?: InputMaybe<Scalars["String"]["input"]>;
  messageFi?: InputMaybe<Scalars["String"]["input"]>;
  messageSv?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  target: Target;
};

export type BannerNotificationCreateMutationPayload = {
  __typename?: "BannerNotificationCreateMutationPayload";
  activeFrom?: Maybe<Scalars["DateTime"]["output"]>;
  activeUntil?: Maybe<Scalars["DateTime"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  draft?: Maybe<Scalars["Boolean"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  level?: Maybe<Level>;
  message?: Maybe<Scalars["String"]["output"]>;
  messageEn?: Maybe<Scalars["String"]["output"]>;
  messageFi?: Maybe<Scalars["String"]["output"]>;
  messageSv?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  target?: Maybe<Target>;
};

export type BannerNotificationDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["ID"]["input"];
};

export type BannerNotificationDeleteMutationPayload = {
  __typename?: "BannerNotificationDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** Whether the object was deleted successfully. */
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Number of rows deleted. */
  rowCount?: Maybe<Scalars["Int"]["output"]>;
};

export type BannerNotificationNode = Node & {
  __typename?: "BannerNotificationNode";
  activeFrom?: Maybe<Scalars["DateTime"]["output"]>;
  activeUntil?: Maybe<Scalars["DateTime"]["output"]>;
  draft: Scalars["Boolean"]["output"];
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  level: CommonBannerNotificationLevelChoices;
  message: Scalars["String"]["output"];
  messageEn?: Maybe<Scalars["String"]["output"]>;
  messageFi?: Maybe<Scalars["String"]["output"]>;
  messageSv?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<BannerNotificationState>;
  target: CommonBannerNotificationTargetChoices;
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

/** An enumeration. */
export enum BannerNotificationState {
  Active = "ACTIVE",
  Draft = "DRAFT",
  Scheduled = "SCHEDULED",
}

export type BannerNotificationUpdateMutationInput = {
  activeFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  activeUntil?: InputMaybe<Scalars["DateTime"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  draft?: InputMaybe<Scalars["Boolean"]["input"]>;
  level?: InputMaybe<Level>;
  message?: InputMaybe<Scalars["String"]["input"]>;
  messageEn?: InputMaybe<Scalars["String"]["input"]>;
  messageFi?: InputMaybe<Scalars["String"]["input"]>;
  messageSv?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
  target?: InputMaybe<Target>;
};

export type BannerNotificationUpdateMutationPayload = {
  __typename?: "BannerNotificationUpdateMutationPayload";
  activeFrom?: Maybe<Scalars["DateTime"]["output"]>;
  activeUntil?: Maybe<Scalars["DateTime"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  draft?: Maybe<Scalars["Boolean"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  level?: Maybe<Level>;
  message?: Maybe<Scalars["String"]["output"]>;
  messageEn?: Maybe<Scalars["String"]["output"]>;
  messageFi?: Maybe<Scalars["String"]["output"]>;
  messageSv?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  target?: Maybe<Target>;
};

export type BuildingType = Node & {
  __typename?: "BuildingType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  realEstate?: Maybe<RealEstateType>;
  surfaceArea?: Maybe<Scalars["Decimal"]["output"]>;
};

export type CityNode = Node & {
  __typename?: "CityNode";
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
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
export enum CommonBannerNotificationLevelChoices {
  /** Exception */
  Exception = "EXCEPTION",
  /** Normal */
  Normal = "NORMAL",
  /** Warning */
  Warning = "WARNING",
}

/** An enumeration. */
export enum CommonBannerNotificationTargetChoices {
  /** Kaikki */
  All = "ALL",
  /** Staff */
  Staff = "STAFF",
  /** Käyttäjä */
  User = "USER",
}

export type EquipmentCategoryCreateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
};

export type EquipmentCategoryCreateMutationPayload = {
  __typename?: "EquipmentCategoryCreateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  equipmentCategory?: Maybe<EquipmentCategoryType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCategoryDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type EquipmentCategoryDeleteMutationPayload = {
  __typename?: "EquipmentCategoryDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
  errors?: Maybe<Scalars["String"]["output"]>;
};

export type EquipmentCategoryType = Node & {
  __typename?: "EquipmentCategoryType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCategoryTypeConnection = {
  __typename?: "EquipmentCategoryTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<EquipmentCategoryTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `EquipmentCategoryType` and its cursor. */
export type EquipmentCategoryTypeEdge = {
  __typename?: "EquipmentCategoryTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<EquipmentCategoryType>;
};

export type EquipmentCategoryUpdateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type EquipmentCategoryUpdateMutationPayload = {
  __typename?: "EquipmentCategoryUpdateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  equipmentCategory?: Maybe<EquipmentCategoryType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentCreateMutationInput = {
  categoryPk: Scalars["Int"]["input"];
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
};

export type EquipmentCreateMutationPayload = {
  __typename?: "EquipmentCreateMutationPayload";
  categoryPk?: Maybe<Scalars["Int"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  equipment?: Maybe<EquipmentType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type EquipmentDeleteMutationPayload = {
  __typename?: "EquipmentDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
  errors?: Maybe<Scalars["String"]["output"]>;
};

export type EquipmentType = Node & {
  __typename?: "EquipmentType";
  category?: Maybe<EquipmentCategoryType>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type EquipmentTypeConnection = {
  __typename?: "EquipmentTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<EquipmentTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `EquipmentType` and its cursor. */
export type EquipmentTypeEdge = {
  __typename?: "EquipmentTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<EquipmentType>;
};

export type EquipmentUpdateMutationInput = {
  categoryPk: Scalars["Int"]["input"];
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type EquipmentUpdateMutationPayload = {
  __typename?: "EquipmentUpdateMutationPayload";
  categoryPk?: Maybe<Scalars["Int"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  equipment?: Maybe<EquipmentType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ErrorType = {
  __typename?: "ErrorType";
  field: Scalars["String"]["output"];
  messages: Array<Scalars["String"]["output"]>;
};

export type EventReservationUnitNode = Node & {
  __typename?: "EventReservationUnitNode";
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  preferredOrder: Scalars["Int"]["output"];
  reservationUnit: ReservationUnitByPkType;
};

export type EventReservationUnitSerializerInput = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  preferredOrder: Scalars["Int"]["input"];
  reservationUnit: Scalars["Int"]["input"];
};

export type GeneralRolePermissionType = {
  __typename?: "GeneralRolePermissionType";
  permission?: Maybe<Scalars["String"]["output"]>;
};

export type GeneralRoleType = Node & {
  __typename?: "GeneralRoleType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  permissions?: Maybe<Array<Maybe<GeneralRolePermissionType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  role?: Maybe<RoleType>;
};

export type KeywordCategoryType = Node & {
  __typename?: "KeywordCategoryType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  keywordGroups?: Maybe<Array<Maybe<KeywordGroupType>>>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type KeywordCategoryTypeConnection = {
  __typename?: "KeywordCategoryTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordCategoryTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `KeywordCategoryType` and its cursor. */
export type KeywordCategoryTypeEdge = {
  __typename?: "KeywordCategoryTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<KeywordCategoryType>;
};

export type KeywordGroupType = Node & {
  __typename?: "KeywordGroupType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  keywords?: Maybe<Array<Maybe<KeywordType>>>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type KeywordGroupTypeConnection = {
  __typename?: "KeywordGroupTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordGroupTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `KeywordGroupType` and its cursor. */
export type KeywordGroupTypeEdge = {
  __typename?: "KeywordGroupTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<KeywordGroupType>;
};

export type KeywordType = Node & {
  __typename?: "KeywordType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type KeywordTypeConnection = {
  __typename?: "KeywordTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `KeywordType` and its cursor. */
export type KeywordTypeEdge = {
  __typename?: "KeywordTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<KeywordType>;
};

export type LocationType = Node & {
  __typename?: "LocationType";
  addressCityEn?: Maybe<Scalars["String"]["output"]>;
  addressCityFi?: Maybe<Scalars["String"]["output"]>;
  addressCitySv?: Maybe<Scalars["String"]["output"]>;
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

export type Mutation = {
  __typename?: "Mutation";
  adjustReservationTime?: Maybe<ReservationAdjustTimeMutationPayload>;
  approveApplicationEventSchedule?: Maybe<ApplicationEventScheduleApproveMutationPayload>;
  approveReservation?: Maybe<ReservationApproveMutationPayload>;
  cancelApplication?: Maybe<ApplicationCancelMutationPayload>;
  cancelReservation?: Maybe<ReservationCancellationMutationPayload>;
  confirmReservation?: Maybe<ReservationConfirmMutationPayload>;
  createApplication?: Maybe<ApplicationCreateMutationPayload>;
  createApplicationEvent?: Maybe<ApplicationEventCreateMutationPayload>;
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
  declineApplication?: Maybe<ApplicationDeclineMutationPayload>;
  declineApplicationEvent?: Maybe<ApplicationEventDeclineMutationPayload>;
  declineApplicationEventSchedule?: Maybe<ApplicationEventScheduleDeclineMutationPayload>;
  deleteApplicationEvent?: Maybe<ApplicationEventDeleteMutationPayload>;
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
  requireHandlingForReservation?: Maybe<ReservationRequiresHandlingMutationPayload>;
  sendApplication?: Maybe<ApplicationSendMutationPayload>;
  staffAdjustReservationTime?: Maybe<ReservationStaffAdjustTimeMutationPayload>;
  staffReservationModify?: Maybe<ReservationStaffModifyMutationPayload>;
  updateApplication?: Maybe<ApplicationUpdateMutationPayload>;
  updateApplicationEvent?: Maybe<ApplicationEventUpdateMutationPayload>;
  updateBannerNotification?: Maybe<BannerNotificationUpdateMutationPayload>;
  updateEquipment?: Maybe<EquipmentUpdateMutationPayload>;
  updateEquipmentCategory?: Maybe<EquipmentCategoryUpdateMutationPayload>;
  updatePurpose?: Maybe<PurposeUpdateMutationPayload>;
  updateRecurringReservation?: Maybe<RecurringReservationUpdateMutationPayload>;
  updateReservation?: Maybe<ReservationUpdateMutationPayload>;
  updateReservationUnit?: Maybe<ReservationUnitUpdateMutationPayload>;
  updateReservationUnitImage?: Maybe<ReservationUnitImageUpdateMutationPayload>;
  updateReservationWorkingMemo?: Maybe<ReservationWorkingMemoMutationPayload>;
  updateResource?: Maybe<ResourceUpdateMutationPayload>;
  updateSpace?: Maybe<SpaceUpdateMutationPayload>;
  updateUnit?: Maybe<UnitUpdateMutationPayload>;
  updateUser?: Maybe<UserUpdateMutationPayload>;
};

export type MutationAdjustReservationTimeArgs = {
  input: ReservationAdjustTimeMutationInput;
};

export type MutationApproveApplicationEventScheduleArgs = {
  input: ApplicationEventScheduleApproveMutationInput;
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

export type MutationCreateApplicationArgs = {
  input: ApplicationCreateMutationInput;
};

export type MutationCreateApplicationEventArgs = {
  input: ApplicationEventCreateMutationInput;
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

export type MutationDeclineApplicationArgs = {
  input: ApplicationDeclineMutationInput;
};

export type MutationDeclineApplicationEventArgs = {
  input: ApplicationEventDeclineMutationInput;
};

export type MutationDeclineApplicationEventScheduleArgs = {
  input: ApplicationEventScheduleDeclineMutationInput;
};

export type MutationDeleteApplicationEventArgs = {
  input: ApplicationEventDeleteMutationInput;
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

export type MutationRequireHandlingForReservationArgs = {
  input: ReservationRequiresHandlingMutationInput;
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

export type MutationUpdateApplicationEventArgs = {
  input: ApplicationEventUpdateMutationInput;
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

export type OrganisationNode = Node & {
  __typename?: "OrganisationNode";
  activeMembers?: Maybe<Scalars["Int"]["output"]>;
  address?: Maybe<AddressNode>;
  coreBusiness: Scalars["String"]["output"];
  coreBusinessEn?: Maybe<Scalars["String"]["output"]>;
  coreBusinessFi?: Maybe<Scalars["String"]["output"]>;
  coreBusinessSv?: Maybe<Scalars["String"]["output"]>;
  email: Scalars["String"]["output"];
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  identifier?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  organisationType: ApplicationsOrganisationOrganisationTypeChoices;
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
  organisationType?: InputMaybe<Organisation_Type>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  yearEstablished?: InputMaybe<Scalars["Int"]["input"]>;
};

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

export type PaymentMerchantType = Node & {
  __typename?: "PaymentMerchantType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["String"]["output"]>;
};

export type PaymentOrderType = Node & {
  __typename?: "PaymentOrderType";
  checkoutUrl?: Maybe<Scalars["String"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  orderUuid?: Maybe<Scalars["String"]["output"]>;
  paymentType?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  processedAt?: Maybe<Scalars["DateTime"]["output"]>;
  receiptUrl?: Maybe<Scalars["String"]["output"]>;
  refundId?: Maybe<Scalars["String"]["output"]>;
  reservationPk?: Maybe<Scalars["String"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
};

export type PaymentProductType = Node & {
  __typename?: "PaymentProductType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  merchantPk?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["String"]["output"]>;
};

export type PersonNode = Node & {
  __typename?: "PersonNode";
  email?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
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

export type PurposeCreateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
};

export type PurposeCreateMutationPayload = {
  __typename?: "PurposeCreateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  purpose?: Maybe<PurposeType>;
};

export type PurposeType = Node & {
  __typename?: "PurposeType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  imageUrl?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** Order number to be used in api sorting. */
  rank?: Maybe<Scalars["Int"]["output"]>;
  smallUrl?: Maybe<Scalars["String"]["output"]>;
};

export type PurposeTypeConnection = {
  __typename?: "PurposeTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<PurposeTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `PurposeType` and its cursor. */
export type PurposeTypeEdge = {
  __typename?: "PurposeTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<PurposeType>;
};

export type PurposeUpdateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type PurposeUpdateMutationPayload = {
  __typename?: "PurposeUpdateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  purpose?: Maybe<PurposeType>;
};

export type QualifierType = Node & {
  __typename?: "QualifierType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type QualifierTypeConnection = {
  __typename?: "QualifierTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<QualifierTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `QualifierType` and its cursor. */
export type QualifierTypeEdge = {
  __typename?: "QualifierTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<QualifierType>;
};

export type Query = {
  __typename?: "Query";
  ageGroups?: Maybe<AgeGroupTypeConnection>;
  applicationEventSchedules?: Maybe<ApplicationEventScheduleNodeConnection>;
  applicationEvents?: Maybe<ApplicationEventNodeConnection>;
  applicationRounds?: Maybe<ApplicationRoundNodeConnection>;
  applications?: Maybe<ApplicationNodeConnection>;
  bannerNotification?: Maybe<BannerNotificationNode>;
  bannerNotifications?: Maybe<BannerNotificationNodeConnection>;
  cities?: Maybe<CityNodeConnection>;
  currentUser?: Maybe<UserType>;
  equipment?: Maybe<EquipmentType>;
  equipmentByPk?: Maybe<EquipmentType>;
  equipmentCategories?: Maybe<EquipmentCategoryTypeConnection>;
  equipmentCategory?: Maybe<EquipmentCategoryType>;
  equipmentCategoryByPk?: Maybe<EquipmentCategoryType>;
  equipments?: Maybe<EquipmentTypeConnection>;
  keywordCategories?: Maybe<KeywordCategoryTypeConnection>;
  keywordGroups?: Maybe<KeywordGroupTypeConnection>;
  keywords?: Maybe<KeywordTypeConnection>;
  metadataSets?: Maybe<ReservationMetadataSetTypeConnection>;
  order?: Maybe<PaymentOrderType>;
  purposes?: Maybe<PurposeTypeConnection>;
  qualifiers?: Maybe<QualifierTypeConnection>;
  recurringReservations?: Maybe<RecurringReservationTypeConnection>;
  reservationByPk?: Maybe<ReservationType>;
  reservationCancelReasons?: Maybe<ReservationCancelReasonTypeConnection>;
  reservationDenyReasons?: Maybe<ReservationDenyReasonTypeConnection>;
  reservationPurposes?: Maybe<ReservationPurposeTypeConnection>;
  reservationUnit?: Maybe<ReservationUnitType>;
  reservationUnitByPk?: Maybe<ReservationUnitByPkType>;
  reservationUnitCancellationRules?: Maybe<ReservationUnitCancellationRuleTypeConnection>;
  reservationUnitHaukiUrl?: Maybe<ReservationUnitHaukiUrlType>;
  reservationUnitTypes?: Maybe<ReservationUnitTypeTypeConnection>;
  reservationUnits?: Maybe<ReservationUnitTypeConnection>;
  reservations?: Maybe<ReservationTypeConnection>;
  resource?: Maybe<ResourceType>;
  resourceByPk?: Maybe<ResourceType>;
  resources?: Maybe<ResourceTypeConnection>;
  serviceSectors?: Maybe<ServiceSectorTypeConnection>;
  space?: Maybe<SpaceType>;
  spaceByPk?: Maybe<SpaceType>;
  spaces?: Maybe<SpaceTypeConnection>;
  taxPercentages?: Maybe<TaxPercentageTypeConnection>;
  termsOfUse?: Maybe<TermsOfUseTypeConnection>;
  unit?: Maybe<UnitType>;
  unitByPk?: Maybe<UnitByPkType>;
  units?: Maybe<UnitTypeConnection>;
  user?: Maybe<UserType>;
};

export type QueryAgeGroupsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryApplicationEventSchedulesArgs = {
  accepted?: InputMaybe<Scalars["Boolean"]["input"]>;
  after?: InputMaybe<Scalars["String"]["input"]>;
  allocatedDay?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  allocatedReservationUnit?: InputMaybe<
    Array<InputMaybe<Scalars["Int"]["input"]>>
  >;
  allocatedUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  applicantType?: InputMaybe<Array<InputMaybe<ApplicantTypeChoice>>>;
  applicationEventStatus?: InputMaybe<
    Array<InputMaybe<ApplicationEventStatusChoice>>
  >;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  declined?: InputMaybe<Scalars["Boolean"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unallocated?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type QueryApplicationEventsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  ageGroup?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  applicantType?: InputMaybe<Array<InputMaybe<ApplicantTypeChoice>>>;
  application?: InputMaybe<Scalars["ID"]["input"]>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  applicationStatus?: InputMaybe<Array<InputMaybe<ApplicationStatusChoice>>>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  homeCity?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  includePreferredOrder10OrHigher?: InputMaybe<Scalars["Boolean"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  preferredOrder?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  priority?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  purpose?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  status?: InputMaybe<Array<InputMaybe<ApplicationEventStatusChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  user?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryApplicationRoundsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name_Istartswith?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryApplicationsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  applicant?: InputMaybe<Scalars["Int"]["input"]>;
  applicantType?: InputMaybe<Array<InputMaybe<ApplicantTypeChoice>>>;
  applicationRound?: InputMaybe<Scalars["Int"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  status?: InputMaybe<Array<InputMaybe<ApplicationStatusChoice>>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
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
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
  target?: InputMaybe<CommonBannerNotificationTargetChoices>;
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

export type QueryEquipmentByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryEquipmentCategoriesArgs = {
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
};

export type QueryEquipmentCategoryArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryEquipmentCategoryByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryEquipmentsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
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
};

export type QueryMetadataSetsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryOrderArgs = {
  orderUuid?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryPurposesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
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
};

export type QueryRecurringReservationsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  beginTime?: InputMaybe<Scalars["TimeString"]["input"]>;
  end?: InputMaybe<Scalars["DateTime"]["input"]>;
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  endTime?: InputMaybe<Scalars["TimeString"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  reservationUnitNameEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitNameSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  user?: InputMaybe<Scalars["ID"]["input"]>;
};

export type QueryReservationByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryReservationCancelReasonsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  reason?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryReservationDenyReasonsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
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
};

export type QueryReservationUnitArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryReservationUnitByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryReservationUnitCancellationRulesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryReservationUnitHaukiUrlArgs = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnits?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryReservationUnitTypesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryReservationUnitsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  applicationRound?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  before?: InputMaybe<Scalars["String"]["input"]>;
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
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  purposes?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifiers?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  rankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  rankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  reservableDateEnd?: InputMaybe<Scalars["Date"]["input"]>;
  reservableDateStart?: InputMaybe<Scalars["Date"]["input"]>;
  reservableMinimumDurationMinutes?: InputMaybe<Scalars["Decimal"]["input"]>;
  reservableTimeEnd?: InputMaybe<Scalars["TimeString"]["input"]>;
  reservableTimeStart?: InputMaybe<Scalars["TimeString"]["input"]>;
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
  reservationState?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  showOnlyReservable?: InputMaybe<Scalars["Boolean"]["input"]>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  surfaceAreaGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  typeRankGte?: InputMaybe<Scalars["Decimal"]["input"]>;
  typeRankLte?: InputMaybe<Scalars["Decimal"]["input"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type QueryReservationsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  begin?: InputMaybe<Scalars["DateTime"]["input"]>;
  end?: InputMaybe<Scalars["DateTime"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
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

export type QueryResourceByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryResourcesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
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

export type QuerySpaceByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QuerySpacesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryTaxPercentagesArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  value?: InputMaybe<Scalars["Decimal"]["input"]>;
};

export type QueryTermsOfUseArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  termsType?: InputMaybe<TermsOfUseTermsOfUseTermsTypeChoices>;
};

export type QueryUnitArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryUnitByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryUnitsArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  last?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  onlyWithPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
  orderBy?: InputMaybe<Scalars["String"]["input"]>;
  ownReservations?: InputMaybe<Scalars["Boolean"]["input"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  publishedReservationUnits?: InputMaybe<Scalars["Boolean"]["input"]>;
  serviceSector?: InputMaybe<Scalars["Decimal"]["input"]>;
};

export type QueryUserArgs = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type RealEstateType = Node & {
  __typename?: "RealEstateType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  surfaceArea?: Maybe<Scalars["Decimal"]["output"]>;
};

export type RecurringReservationCreateMutationInput = {
  abilityGroupPk?: InputMaybe<Scalars["Int"]["input"]>;
  ageGroupPk?: InputMaybe<Scalars["Int"]["input"]>;
  /** Date when first reservation begins. */
  beginDate: Scalars["Date"]["input"];
  /** Time when reservations begins. */
  beginTime: Scalars["Time"]["input"];
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Date when last reservation begins. */
  endDate: Scalars["Date"]["input"];
  /** Time when reservations ends. */
  endTime: Scalars["Time"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
  recurrenceInDays: Scalars["Int"]["input"];
  reservationUnitPk: Scalars["Int"]["input"];
  user?: InputMaybe<Scalars["String"]["input"]>;
  /** List of weekdays which days the reservations occurs */
  weekdays: Array<InputMaybe<Scalars["Int"]["input"]>>;
};

export type RecurringReservationCreateMutationPayload = {
  __typename?: "RecurringReservationCreateMutationPayload";
  abilityGroupPk?: Maybe<Scalars["Int"]["output"]>;
  ageGroupPk?: Maybe<Scalars["Int"]["output"]>;
  /** Date when first reservation begins. */
  beginDate?: Maybe<Scalars["Date"]["output"]>;
  /** Time when reservations begins. */
  beginTime?: Maybe<Scalars["Time"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  /** Date when last reservation begins. */
  endDate?: Maybe<Scalars["Date"]["output"]>;
  /** Time when reservations ends. */
  endTime?: Maybe<Scalars["Time"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  name?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  recurrenceInDays?: Maybe<Scalars["Int"]["output"]>;
  recurringReservation?: Maybe<RecurringReservationType>;
  reservationUnitPk?: Maybe<Scalars["Int"]["output"]>;
  user?: Maybe<Scalars["String"]["output"]>;
  /** List of weekdays which days the reservations occurs */
  weekdays?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type RecurringReservationType = Node & {
  __typename?: "RecurringReservationType";
  abilityGroup?: Maybe<AbilityGroupType>;
  ageGroup?: Maybe<AgeGroupType>;
  applicationEventSchedule?: Maybe<Scalars["Int"]["output"]>;
  beginDate?: Maybe<Scalars["Date"]["output"]>;
  beginTime?: Maybe<Scalars["TimeString"]["output"]>;
  created: Scalars["DateTime"]["output"];
  description: Scalars["String"]["output"];
  endDate?: Maybe<Scalars["Date"]["output"]>;
  endTime?: Maybe<Scalars["TimeString"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  recurrenceInDays?: Maybe<Scalars["Int"]["output"]>;
  reservationUnit: ReservationUnitByPkType;
  user?: Maybe<Scalars["String"]["output"]>;
  weekdays?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type RecurringReservationTypeConnection = {
  __typename?: "RecurringReservationTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<RecurringReservationTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `RecurringReservationType` and its cursor. */
export type RecurringReservationTypeEdge = {
  __typename?: "RecurringReservationTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<RecurringReservationType>;
};

export type RecurringReservationUpdateMutationInput = {
  abilityGroupPk?: InputMaybe<Scalars["Int"]["input"]>;
  ageGroupPk?: InputMaybe<Scalars["Int"]["input"]>;
  /** Date when first reservation begins. */
  beginDate?: InputMaybe<Scalars["Date"]["input"]>;
  /** Time when reservations begins. */
  beginTime?: InputMaybe<Scalars["Time"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Date when last reservation begins. */
  endDate?: InputMaybe<Scalars["Date"]["input"]>;
  /** Time when reservations ends. */
  endTime?: InputMaybe<Scalars["Time"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
  recurrenceInDays?: InputMaybe<Scalars["Int"]["input"]>;
  user?: InputMaybe<Scalars["String"]["input"]>;
  /** List of weekdays which days the reservations occurs */
  weekdays?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
};

export type RecurringReservationUpdateMutationPayload = {
  __typename?: "RecurringReservationUpdateMutationPayload";
  abilityGroupPk?: Maybe<Scalars["Int"]["output"]>;
  ageGroupPk?: Maybe<Scalars["Int"]["output"]>;
  /** Date when first reservation begins. */
  beginDate?: Maybe<Scalars["Date"]["output"]>;
  /** Time when reservations begins. */
  beginTime?: Maybe<Scalars["Time"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  /** Date when last reservation begins. */
  endDate?: Maybe<Scalars["Date"]["output"]>;
  /** Time when reservations ends. */
  endTime?: Maybe<Scalars["Time"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  name?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  recurrenceInDays?: Maybe<Scalars["Int"]["output"]>;
  recurringReservation?: Maybe<RecurringReservationType>;
  user?: Maybe<Scalars["String"]["output"]>;
  /** List of weekdays which days the reservations occurs */
  weekdays?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
};

export type RefreshOrderMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  orderUuid: Scalars["UUID"]["input"];
};

export type RefreshOrderMutationPayload = {
  __typename?: "RefreshOrderMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  orderUuid?: Maybe<Scalars["UUID"]["output"]>;
  reservationPk?: Maybe<Scalars["Int"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
};

export type ReservableTimeSpanType = {
  __typename?: "ReservableTimeSpanType";
  endDatetime?: Maybe<Scalars["DateTime"]["output"]>;
  startDatetime?: Maybe<Scalars["DateTime"]["output"]>;
};

export type ReservationAdjustTimeMutationInput = {
  begin: Scalars["DateTime"]["input"];
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  end: Scalars["DateTime"]["input"];
  pk: Scalars["Int"]["input"];
  state?: InputMaybe<State>;
};

export type ReservationAdjustTimeMutationPayload = {
  __typename?: "ReservationAdjustTimeMutationPayload";
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<State>;
};

export type ReservationApproveMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  /** Additional information for approval. */
  handlingDetails: Scalars["String"]["input"];
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  price: Scalars["Float"]["input"];
  priceNet: Scalars["Float"]["input"];
};

export type ReservationApproveMutationPayload = {
  __typename?: "ReservationApproveMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** When this reservation was handled. */
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Additional information for approval. */
  handlingDetails?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Float"]["output"]>;
  priceNet?: Maybe<Scalars["Float"]["output"]>;
  state?: Maybe<State>;
};

export type ReservationCancelReasonType = Node & {
  __typename?: "ReservationCancelReasonType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reason: Scalars["String"]["output"];
  reasonEn?: Maybe<Scalars["String"]["output"]>;
  reasonFi?: Maybe<Scalars["String"]["output"]>;
  reasonSv?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationCancelReasonTypeConnection = {
  __typename?: "ReservationCancelReasonTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationCancelReasonTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ReservationCancelReasonType` and its cursor. */
export type ReservationCancelReasonTypeEdge = {
  __typename?: "ReservationCancelReasonTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationCancelReasonType>;
};

export type ReservationCancellationMutationInput = {
  /** Additional information for the cancellation. */
  cancelDetails?: InputMaybe<Scalars["String"]["input"]>;
  /** Primary key for the pre-defined cancel reason. */
  cancelReasonPk: Scalars["Int"]["input"];
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ReservationCancellationMutationPayload = {
  __typename?: "ReservationCancellationMutationPayload";
  /** Additional information for the cancellation. */
  cancelDetails?: Maybe<Scalars["String"]["output"]>;
  /** Primary key for the pre-defined cancel reason. */
  cancelReasonPk?: Maybe<Scalars["Int"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<State>;
};

export type ReservationConfirmMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
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
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  homeCityPk?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  /** The non subsidised price of this reservation including VAT */
  nonSubsidisedPrice?: Maybe<Scalars["Decimal"]["output"]>;
  /** The non subsidised price of this reservation excluding VAT */
  nonSubsidisedPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  order?: Maybe<PaymentOrderType>;
  /** Type of the payment. Possible values are ONLINE, INVOICE, ON_SITE. */
  paymentType?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** The price of this particular reservation including VAT */
  price?: Maybe<Scalars["Decimal"]["output"]>;
  /** The price of this particular reservation excluding VAT */
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
  priority?: Maybe<Scalars["Int"]["output"]>;
  purposePk?: Maybe<Scalars["Int"]["output"]>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  /** Reservee's business or association identity code */
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLanguage?: Maybe<Scalars["String"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<Scalars["String"]["output"]>;
  /**
   * String value for ReservationType's ReservationState enum. Possible values are
   * CREATED, CANCELLED, REQUIRES_HANDLING, WAITING_FOR_PAYMENT, CONFIRMED, DENIED.
   */
  state?: Maybe<Scalars["String"]["output"]>;
  /** The value of the tax percentage for this particular reservation */
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  /** The unit price of this particular reservation */
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
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  end: Scalars["DateTime"]["input"];
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  homeCityPk?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  priority?: InputMaybe<Scalars["Int"]["input"]>;
  purposePk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnitPks: Array<InputMaybe<Scalars["Int"]["input"]>>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  /** Reservee's business or association identity code */
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
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  homeCityPk?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  /** The non subsidised price of this reservation including VAT */
  nonSubsidisedPrice?: Maybe<Scalars["Decimal"]["output"]>;
  /** The non subsidised price of this reservation excluding VAT */
  nonSubsidisedPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** The price of this particular reservation including VAT */
  price?: Maybe<Scalars["Decimal"]["output"]>;
  /** The price of this particular reservation excluding VAT */
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
  priority?: Maybe<Scalars["Int"]["output"]>;
  purposePk?: Maybe<Scalars["Int"]["output"]>;
  reservation?: Maybe<ReservationType>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  /** Reservee's business or association identity code */
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLanguage?: Maybe<Scalars["String"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<Scalars["String"]["output"]>;
  state?: Maybe<Scalars["String"]["output"]>;
  /** The value of the tax percentage for this particular reservation */
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  /** The unit price of this particular reservation */
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
};

export type ReservationDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ReservationDeleteMutationPayload = {
  __typename?: "ReservationDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
  errors?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationDenyMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  /** Primary key for the pre-defined deny reason. */
  denyReasonPk: Scalars["Int"]["input"];
  /** Additional information for denying. */
  handlingDetails?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ReservationDenyMutationPayload = {
  __typename?: "ReservationDenyMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** Primary key for the pre-defined deny reason. */
  denyReasonPk?: Maybe<Scalars["Int"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** When this reservation was handled. */
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Additional information for denying. */
  handlingDetails?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<State>;
};

export type ReservationDenyReasonType = Node & {
  __typename?: "ReservationDenyReasonType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reason: Scalars["String"]["output"];
  reasonEn?: Maybe<Scalars["String"]["output"]>;
  reasonFi?: Maybe<Scalars["String"]["output"]>;
  reasonSv?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationDenyReasonTypeConnection = {
  __typename?: "ReservationDenyReasonTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationDenyReasonTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ReservationDenyReasonType` and its cursor. */
export type ReservationDenyReasonTypeEdge = {
  __typename?: "ReservationDenyReasonTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationDenyReasonType>;
};

export type ReservationMetadataSetType = Node & {
  __typename?: "ReservationMetadataSetType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  requiredFields?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
  supportedFields?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
};

export type ReservationMetadataSetTypeConnection = {
  __typename?: "ReservationMetadataSetTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationMetadataSetTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ReservationMetadataSetType` and its cursor. */
export type ReservationMetadataSetTypeEdge = {
  __typename?: "ReservationMetadataSetTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationMetadataSetType>;
};

export type ReservationPurposeType = Node & {
  __typename?: "ReservationPurposeType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationPurposeTypeConnection = {
  __typename?: "ReservationPurposeTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationPurposeTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ReservationPurposeType` and its cursor. */
export type ReservationPurposeTypeEdge = {
  __typename?: "ReservationPurposeTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationPurposeType>;
};

export type ReservationRefundMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ReservationRefundMutationPayload = {
  __typename?: "ReservationRefundMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationRequiresHandlingMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ReservationRequiresHandlingMutationPayload = {
  __typename?: "ReservationRequiresHandlingMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  state?: Maybe<State>;
};

export type ReservationStaffAdjustTimeMutationInput = {
  begin: Scalars["DateTime"]["input"];
  /**
   * Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined
   * value means buffer from reservation unit is used.
   */
  bufferTimeAfter?: InputMaybe<Scalars["String"]["input"]>;
  /**
   * Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined
   * value means buffer from reservation unit is used.
   */
  bufferTimeBefore?: InputMaybe<Scalars["String"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  end: Scalars["DateTime"]["input"];
  pk: Scalars["Int"]["input"];
  state?: InputMaybe<State>;
};

export type ReservationStaffAdjustTimeMutationPayload = {
  __typename?: "ReservationStaffAdjustTimeMutationPayload";
  begin?: Maybe<Scalars["DateTime"]["output"]>;
  /**
   * Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined
   * value means buffer from reservation unit is used.
   */
  bufferTimeAfter?: Maybe<Scalars["String"]["output"]>;
  /**
   * Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined
   * value means buffer from reservation unit is used.
   */
  bufferTimeBefore?: Maybe<Scalars["String"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
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
  /**
   * Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined
   * value means buffer from reservation unit is used.
   */
  bufferTimeAfter?: InputMaybe<Scalars["String"]["input"]>;
  /**
   * Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined
   * value means buffer from reservation unit is used.
   */
  bufferTimeBefore?: InputMaybe<Scalars["String"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  end: Scalars["DateTime"]["input"];
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  homeCityPk?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  purposePk?: InputMaybe<Scalars["Int"]["input"]>;
  recurringReservationPk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnitPks: Array<InputMaybe<Scalars["Int"]["input"]>>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  /** Reservee's business or association identity code */
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLanguage?: InputMaybe<Scalars["String"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<Scalars["String"]["input"]>;
  type: Scalars["String"]["input"];
  /** The unit price of this particular reservation */
  unitPrice?: InputMaybe<Scalars["Decimal"]["input"]>;
  /** Working memo for staff users. */
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
  /**
   * Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined
   * value means buffer from reservation unit is used.
   */
  bufferTimeAfter?: Maybe<Scalars["String"]["output"]>;
  /**
   * Can be a number of seconds or timespan in format HH:MM:SS. Null/undefined
   * value means buffer from reservation unit is used.
   */
  bufferTimeBefore?: Maybe<Scalars["String"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  /** When this reservation was handled. */
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  homeCityPk?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  purposePk?: Maybe<Scalars["Int"]["output"]>;
  recurringReservationPk?: Maybe<Scalars["Int"]["output"]>;
  reservation?: Maybe<ReservationType>;
  reservationUnitPks?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  /** Reservee's business or association identity code */
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLanguage?: Maybe<Scalars["String"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<Scalars["String"]["output"]>;
  state?: Maybe<State>;
  type?: Maybe<Scalars["String"]["output"]>;
  /** The unit price of this particular reservation */
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
  /** Working memo for staff users. */
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
  bufferTimeAfter?: InputMaybe<Scalars["Int"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Int"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  homeCityPk?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk: Scalars["Int"]["input"];
  priority?: InputMaybe<Scalars["Int"]["input"]>;
  purposePk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnitPks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  /** Reservee's business or association identity code */
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLanguage?: InputMaybe<Scalars["String"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<Scalars["String"]["input"]>;
  /**
   * String value for ReservationType's ReservationState enum. Possible values are
   * CREATED, CANCELLED, REQUIRES_HANDLING, WAITING_FOR_PAYMENT, CONFIRMED, DENIED.
   */
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
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  homeCityPk?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  /** The non subsidised price of this reservation including VAT */
  nonSubsidisedPrice?: Maybe<Scalars["Decimal"]["output"]>;
  /** The non subsidised price of this reservation excluding VAT */
  nonSubsidisedPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** The price of this particular reservation including VAT */
  price?: Maybe<Scalars["Decimal"]["output"]>;
  /** The price of this particular reservation excluding VAT */
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
  priority?: Maybe<Scalars["Int"]["output"]>;
  purposePk?: Maybe<Scalars["Int"]["output"]>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  /** Reservee's business or association identity code */
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLanguage?: Maybe<Scalars["String"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<Scalars["String"]["output"]>;
  /**
   * String value for ReservationType's ReservationState enum. Possible values are
   * CREATED, CANCELLED, REQUIRES_HANDLING, WAITING_FOR_PAYMENT, CONFIRMED, DENIED.
   */
  state?: Maybe<Scalars["String"]["output"]>;
  /** The value of the tax percentage for this particular reservation */
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  /** The unit price of this particular reservation */
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
};

/** An enumeration. */
export enum ReservationState {
  Reservable = "RESERVABLE",
  ReservationClosed = "RESERVATION_CLOSED",
  ScheduledClosing = "SCHEDULED_CLOSING",
  ScheduledPeriod = "SCHEDULED_PERIOD",
  ScheduledReservation = "SCHEDULED_RESERVATION",
}

export type ReservationType = Node & {
  __typename?: "ReservationType";
  ageGroup?: Maybe<AgeGroupType>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  begin: Scalars["DateTime"]["output"];
  billingAddressCity?: Maybe<Scalars["String"]["output"]>;
  billingAddressStreet?: Maybe<Scalars["String"]["output"]>;
  billingAddressZip?: Maybe<Scalars["String"]["output"]>;
  billingEmail?: Maybe<Scalars["String"]["output"]>;
  billingFirstName?: Maybe<Scalars["String"]["output"]>;
  billingLastName?: Maybe<Scalars["String"]["output"]>;
  billingPhone?: Maybe<Scalars["String"]["output"]>;
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  calendarUrl?: Maybe<Scalars["String"]["output"]>;
  cancelDetails?: Maybe<Scalars["String"]["output"]>;
  cancelReason?: Maybe<ReservationCancelReasonType>;
  createdAt?: Maybe<Scalars["String"]["output"]>;
  denyReason?: Maybe<ReservationDenyReasonType>;
  description?: Maybe<Scalars["String"]["output"]>;
  end: Scalars["DateTime"]["output"];
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  handledAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Additional details for denying or approving the reservation */
  handlingDetails: Scalars["String"]["output"];
  /** Home city of the group or association */
  homeCity?: Maybe<CityNode>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  isBlocked?: Maybe<Scalars["Boolean"]["output"]>;
  isHandled?: Maybe<Scalars["Boolean"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  orderStatus?: Maybe<Scalars["String"]["output"]>;
  orderUuid?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  price?: Maybe<Scalars["Float"]["output"]>;
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
  priority: ReservationsReservationPriorityChoices;
  purpose?: Maybe<ReservationPurposeType>;
  recurringReservation?: Maybe<RecurringReservationType>;
  refundUuid?: Maybe<Scalars["String"]["output"]>;
  reservationUnits?: Maybe<Array<Maybe<ReservationUnitType>>>;
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
  /** Type of reservee */
  reserveeType?: Maybe<ReservationsReservationReserveeTypeChoices>;
  /** @deprecated Please refer to type. */
  staffEvent?: Maybe<Scalars["Boolean"]["output"]>;
  state: ReservationsReservationStateChoices;
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  /** Type of reservation */
  type?: Maybe<ReservationsReservationTypeChoices>;
  unitPrice?: Maybe<Scalars["Float"]["output"]>;
  user?: Maybe<UserType>;
  /** Working memo for staff users. */
  workingMemo?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationTypeConnection = {
  __typename?: "ReservationTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationType` and its cursor. */
export type ReservationTypeEdge = {
  __typename?: "ReservationTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationType>;
};

export type ReservationUnitByPkType = Node & {
  __typename?: "ReservationUnitByPkType";
  /** Is it possible to reserve this reservation unit when opening hours are not defined. */
  allowReservationsWithoutOpeningHours: Scalars["Boolean"]["output"];
  applicationRoundTimeSlots?: Maybe<Array<ApplicationRoundTimeSlotNode>>;
  applicationRounds?: Maybe<Array<Maybe<ApplicationRoundNode>>>;
  /** Authentication required for reserving this reservation unit. */
  authentication: ReservationUnitsReservationUnitAuthenticationChoices;
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge: Scalars["Boolean"]["output"];
  cancellationRule?: Maybe<ReservationUnitCancellationRuleType>;
  cancellationTerms?: Maybe<TermsOfUseType>;
  contactInformation: Scalars["String"]["output"];
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  equipment?: Maybe<Array<Maybe<EquipmentType>>>;
  firstReservableDatetime?: Maybe<Scalars["DateTime"]["output"]>;
  haukiUrl?: Maybe<ReservationUnitHaukiUrlType>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  images: Array<ReservationUnitImageType>;
  /** Is reservation unit archived. */
  isArchived: Scalars["Boolean"]["output"];
  isClosed?: Maybe<Scalars["Boolean"]["output"]>;
  isDraft: Scalars["Boolean"]["output"];
  keywordGroups?: Maybe<Array<Maybe<KeywordGroupType>>>;
  location?: Maybe<LocationType>;
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  maxReservationDuration?: Maybe<Scalars["Duration"]["output"]>;
  maxReservationsPerUser?: Maybe<Scalars["Int"]["output"]>;
  metadataSet?: Maybe<ReservationMetadataSetType>;
  minPersons?: Maybe<Scalars["Int"]["output"]>;
  minReservationDuration?: Maybe<Scalars["Duration"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  paymentMerchant?: Maybe<PaymentMerchantType>;
  paymentProduct?: Maybe<PaymentProductType>;
  paymentTerms?: Maybe<TermsOfUseType>;
  paymentTypes?: Maybe<Array<Maybe<ReservationUnitPaymentTypeType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  pricingTerms?: Maybe<TermsOfUseType>;
  pricings?: Maybe<Array<Maybe<ReservationUnitPricingType>>>;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: Maybe<Scalars["DateTime"]["output"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: Maybe<Scalars["DateTime"]["output"]>;
  purposes?: Maybe<Array<Maybe<PurposeType>>>;
  qualifiers?: Maybe<Array<Maybe<QualifierType>>>;
  /** Order number to be use in api sorting. */
  rank?: Maybe<Scalars["Int"]["output"]>;
  requireIntroduction: Scalars["Boolean"]["output"];
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling: Scalars["Boolean"]["output"];
  reservableTimeSpans?: Maybe<Array<Maybe<ReservableTimeSpanType>>>;
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: Maybe<Scalars["DateTime"]["output"]>;
  reservationCancelledInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: Maybe<Scalars["DateTime"]["output"]>;
  /** What kind of reservations are to be booked with this reservation unit. */
  reservationKind: ReservationUnitsReservationUnitReservationKindChoices;
  reservationPendingInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 15, 30, 60, or
   * 90. Possible values are interval_15_mins, interval_30_mins, interval_60_mins,
   * interval_90_mins.
   */
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices;
  reservationState?: Maybe<ReservationState>;
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservations?: Maybe<Array<Maybe<ReservationType>>>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  serviceSpecificTerms?: Maybe<TermsOfUseType>;
  services?: Maybe<Array<Maybe<ServiceType>>>;
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  state?: Maybe<ReservationUnitState>;
  surfaceArea?: Maybe<Scalars["Int"]["output"]>;
  termsOfUseEn?: Maybe<Scalars["String"]["output"]>;
  termsOfUseFi?: Maybe<Scalars["String"]["output"]>;
  termsOfUseSv?: Maybe<Scalars["String"]["output"]>;
  unit?: Maybe<UnitType>;
  uuid: Scalars["UUID"]["output"];
};

export type ReservationUnitByPkTypeApplicationRoundsArgs = {
  active?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type ReservationUnitByPkTypeReservableTimeSpansArgs = {
  endDate: Scalars["Date"]["input"];
  startDate: Scalars["Date"]["input"];
};

export type ReservationUnitByPkTypeReservationsArgs = {
  from?: InputMaybe<Scalars["Date"]["input"]>;
  includeWithSameComponents?: InputMaybe<Scalars["Boolean"]["input"]>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  to?: InputMaybe<Scalars["Date"]["input"]>;
};

export type ReservationUnitCancellationRuleType = Node & {
  __typename?: "ReservationUnitCancellationRuleType";
  /** Seconds before reservations related to this cancellation rule can be cancelled without handling. */
  canBeCancelledTimeBefore?: Maybe<Scalars["Float"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  needsHandling: Scalars["Boolean"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitCancellationRuleTypeConnection = {
  __typename?: "ReservationUnitCancellationRuleTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitCancellationRuleTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitCancellationRuleType` and its cursor. */
export type ReservationUnitCancellationRuleTypeEdge = {
  __typename?: "ReservationUnitCancellationRuleTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitCancellationRuleType>;
};

export type ReservationUnitCreateMutationInput = {
  /** Allow reservations without opening hours. Used for testing. */
  allowReservationsWithoutOpeningHours?: InputMaybe<
    Scalars["Boolean"]["input"]
  >;
  applicationRoundTimeSlots?: InputMaybe<
    Array<InputMaybe<ApplicationRoundTimeSlotSerializerInput>>
  >;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: InputMaybe<Scalars["String"]["input"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Int"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Int"]["input"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  cancellationRulePk?: InputMaybe<Scalars["Int"]["input"]>;
  cancellationTermsPk?: InputMaybe<Scalars["String"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  /** Contact information for this reservation unit. */
  contactInformation?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  equipmentPks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  /** Is reservation unit archived */
  isArchived?: InputMaybe<Scalars["Boolean"]["input"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  maxReservationDuration?: InputMaybe<Scalars["Int"]["input"]>;
  maxReservationsPerUser?: InputMaybe<Scalars["Int"]["input"]>;
  metadataSetPk?: InputMaybe<Scalars["Int"]["input"]>;
  minPersons?: InputMaybe<Scalars["Int"]["input"]>;
  minReservationDuration?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  paymentTermsPk?: InputMaybe<Scalars["String"]["input"]>;
  paymentTypes?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  pricingTerms?: InputMaybe<Scalars["String"]["input"]>;
  pricingTermsPk?: InputMaybe<Scalars["String"]["input"]>;
  pricings?: InputMaybe<
    Array<InputMaybe<ReservationUnitPricingCreateSerializerInput>>
  >;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  purposePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifierPks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  reservationCancelledInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationCancelledInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationCancelledInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  /**
   * What kind of reservations are to be made to this is reservation unit. Possible
   * values are: DIRECT, SEASON, DIRECT_AND_SEASON.
   */
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or
   * 45. Possible values are INTERVAL_15_MINUTES, INTERVAL_30_MINUTES,
   * INTERVAL_60_MINUTES, INTERVAL_90_MINUTES.
   */
  reservationStartInterval?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitTypePk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationsMaxDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  reservationsMinDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  resourcePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  servicePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  serviceSpecificTermsPk?: InputMaybe<Scalars["String"]["input"]>;
  spacePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  surfaceArea?: InputMaybe<Scalars["Int"]["input"]>;
  termsOfUseEn?: InputMaybe<Scalars["String"]["input"]>;
  termsOfUseFi?: InputMaybe<Scalars["String"]["input"]>;
  termsOfUseSv?: InputMaybe<Scalars["String"]["input"]>;
  unitPk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ReservationUnitCreateMutationPayload = {
  __typename?: "ReservationUnitCreateMutationPayload";
  /** Allow reservations without opening hours. Used for testing. */
  allowReservationsWithoutOpeningHours?: Maybe<Scalars["Boolean"]["output"]>;
  applicationRoundTimeSlots?: Maybe<Array<Maybe<ApplicationRoundTimeSlotNode>>>;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: Maybe<Scalars["String"]["output"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]["output"]>;
  building?: Maybe<Scalars["String"]["output"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  cancellationRulePk?: Maybe<Scalars["Int"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** Contact information for this reservation unit. */
  contactInformation?: Maybe<Scalars["String"]["output"]>;
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Images of the reservation unit as nested related objects.  */
  images?: Maybe<Array<Maybe<ReservationUnitImageType>>>;
  /** Is reservation unit archived */
  isArchived?: Maybe<Scalars["Boolean"]["output"]>;
  isDraft?: Maybe<Scalars["Boolean"]["output"]>;
  /** Location of this reservation unit. Dynamically determined from spaces of the reservation unit. */
  location?: Maybe<Scalars["String"]["output"]>;
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  maxReservationDuration?: Maybe<Scalars["Int"]["output"]>;
  maxReservationsPerUser?: Maybe<Scalars["Int"]["output"]>;
  minPersons?: Maybe<Scalars["Int"]["output"]>;
  minReservationDuration?: Maybe<Scalars["Int"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  paymentTypes?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  pricingTerms?: Maybe<Scalars["String"]["output"]>;
  pricings?: Maybe<Array<Maybe<ReservationUnitPricingType>>>;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: Maybe<Scalars["DateTime"]["output"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: Maybe<Scalars["DateTime"]["output"]>;
  purposes?: Maybe<Array<Maybe<PurposeType>>>;
  qualifierPks?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: Maybe<Scalars["Boolean"]["output"]>;
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling?: Maybe<Scalars["Boolean"]["output"]>;
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: Maybe<Scalars["DateTime"]["output"]>;
  reservationCancelledInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: Maybe<Scalars["DateTime"]["output"]>;
  /**
   * What kind of reservations are to be made to this is reservation unit. Possible
   * values are: DIRECT, SEASON, DIRECT_AND_SEASON.
   */
  reservationKind?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or
   * 45. Possible values are INTERVAL_15_MINUTES, INTERVAL_30_MINUTES,
   * INTERVAL_60_MINUTES, INTERVAL_90_MINUTES.
   */
  reservationStartInterval?: Maybe<Scalars["String"]["output"]>;
  reservationUnit?: Maybe<ReservationUnitType>;
  /** Type of the reservation unit as nested related object. */
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservationUnitTypePk?: Maybe<Scalars["Int"]["output"]>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  /** Resources included in the reservation unit as nested related objects. */
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  /** Services included in the reservation unit as nested related objects. */
  services?: Maybe<Array<Maybe<ServiceType>>>;
  /** Spaces included in the reservation unit as nested related objects. */
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  state?: Maybe<Scalars["String"]["output"]>;
  surfaceArea?: Maybe<Scalars["Int"]["output"]>;
  termsOfUseEn?: Maybe<Scalars["String"]["output"]>;
  termsOfUseFi?: Maybe<Scalars["String"]["output"]>;
  termsOfUseSv?: Maybe<Scalars["String"]["output"]>;
  unitPk?: Maybe<Scalars["Int"]["output"]>;
  uuid?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationUnitHaukiUrlType = {
  __typename?: "ReservationUnitHaukiUrlType";
  url?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationUnitImageCreateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  image?: InputMaybe<Scalars["Upload"]["input"]>;
  /** Type of image. Value is one of image_type enum values: MAIN, GROUND_PLAN, MAP, OTHER. */
  imageType: Scalars["String"]["input"];
  reservationUnitPk: Scalars["Int"]["input"];
};

export type ReservationUnitImageCreateMutationPayload = {
  __typename?: "ReservationUnitImageCreateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Type of image. Value is one of image_type enum values: MAIN, GROUND_PLAN, MAP, OTHER. */
  imageType?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationUnitImage?: Maybe<ReservationUnitImageType>;
  reservationUnitPk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitImageDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ReservationUnitImageDeleteMutationPayload = {
  __typename?: "ReservationUnitImageDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
  errors?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationUnitImageType = {
  __typename?: "ReservationUnitImageType";
  imageType: ReservationUnitsReservationUnitImageImageTypeChoices;
  imageUrl?: Maybe<Scalars["String"]["output"]>;
  largeUrl?: Maybe<Scalars["String"]["output"]>;
  mediumUrl?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  smallUrl?: Maybe<Scalars["String"]["output"]>;
};

export type ReservationUnitImageUpdateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  /** Type of image. Value is one of image_type enum values: MAIN, GROUND_PLAN, MAP, OTHER. */
  imageType?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ReservationUnitImageUpdateMutationPayload = {
  __typename?: "ReservationUnitImageUpdateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Type of image. Value is one of image_type enum values: MAIN, GROUND_PLAN, MAP, OTHER. */
  imageType?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationUnitImage?: Maybe<ReservationUnitImageType>;
  reservationUnitPk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitPaymentTypeType = Node & {
  __typename?: "ReservationUnitPaymentTypeType";
  /** Available values: ONLINE, INVOICE, ON_SITE */
  code?: Maybe<Scalars["String"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitPricingCreateSerializerInput = {
  /** When pricing is activated */
  begins: Scalars["Date"]["input"];
  highestPrice?: InputMaybe<Scalars["Float"]["input"]>;
  highestPriceNet?: InputMaybe<Scalars["Float"]["input"]>;
  lowestPrice?: InputMaybe<Scalars["Float"]["input"]>;
  lowestPriceNet?: InputMaybe<Scalars["Float"]["input"]>;
  /** Unit of the price. Possible values are PER_15_MINS, PER_30_MINS, PER_HOUR, PER_HALF_DAY, PER_DAY, PER_WEEK, FIXED. */
  priceUnit?: InputMaybe<Scalars["String"]["input"]>;
  /** What kind of pricing type this pricing has. Possible values are PAID, FREE. */
  pricingType: Scalars["String"]["input"];
  /** Pricing status. Possible values are PAST, ACTIVE, FUTURE. */
  status: Scalars["String"]["input"];
  taxPercentagePk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ReservationUnitPricingType = {
  __typename?: "ReservationUnitPricingType";
  /** When pricing is activated */
  begins: Scalars["Date"]["output"];
  /** Maximum price of the reservation unit including VAT */
  highestPrice: Scalars["Decimal"]["output"];
  /** Maximum price of the reservation unit excluding VAT */
  highestPriceNet: Scalars["Decimal"]["output"];
  /** Minimum price of the reservation unit including VAT */
  lowestPrice: Scalars["Decimal"]["output"];
  /** Minimum price of the reservation unit excluding VAT */
  lowestPriceNet: Scalars["Decimal"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** Unit of the price */
  priceUnit: ReservationUnitsReservationUnitPricingPriceUnitChoices;
  /** What kind of pricing types are available with this reservation unit. */
  pricingType?: Maybe<ReservationUnitsReservationUnitPricingPricingTypeChoices>;
  /** Status of the pricing */
  status: ReservationUnitsReservationUnitPricingStatusChoices;
  /** The percentage of tax included in the price */
  taxPercentage: TaxPercentageType;
};

export type ReservationUnitPricingUpdateSerializerInput = {
  /** When pricing is activated */
  begins: Scalars["Date"]["input"];
  highestPrice?: InputMaybe<Scalars["Float"]["input"]>;
  highestPriceNet?: InputMaybe<Scalars["Float"]["input"]>;
  lowestPrice?: InputMaybe<Scalars["Float"]["input"]>;
  lowestPriceNet?: InputMaybe<Scalars["Float"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  /** Unit of the price. Possible values are PER_15_MINS, PER_30_MINS, PER_HOUR, PER_HALF_DAY, PER_DAY, PER_WEEK, FIXED. */
  priceUnit?: InputMaybe<Scalars["String"]["input"]>;
  /** What kind of pricing type this pricing has. Possible values are PAID, FREE. */
  pricingType: Scalars["String"]["input"];
  /** Pricing status. Possible values are PAST, ACTIVE, FUTURE. */
  status: Scalars["String"]["input"];
  taxPercentagePk?: InputMaybe<Scalars["Int"]["input"]>;
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

export type ReservationUnitType = Node & {
  __typename?: "ReservationUnitType";
  /** Is it possible to reserve this reservation unit when opening hours are not defined. */
  allowReservationsWithoutOpeningHours: Scalars["Boolean"]["output"];
  applicationRoundTimeSlots?: Maybe<Array<ApplicationRoundTimeSlotNode>>;
  applicationRounds?: Maybe<Array<Maybe<ApplicationRoundNode>>>;
  /** Authentication required for reserving this reservation unit. */
  authentication: ReservationUnitsReservationUnitAuthenticationChoices;
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge: Scalars["Boolean"]["output"];
  cancellationRule?: Maybe<ReservationUnitCancellationRuleType>;
  cancellationTerms?: Maybe<TermsOfUseType>;
  contactInformation: Scalars["String"]["output"];
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  equipment?: Maybe<Array<Maybe<EquipmentType>>>;
  firstReservableDatetime?: Maybe<Scalars["DateTime"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  images: Array<ReservationUnitImageType>;
  /** Is reservation unit archived. */
  isArchived: Scalars["Boolean"]["output"];
  isClosed?: Maybe<Scalars["Boolean"]["output"]>;
  isDraft: Scalars["Boolean"]["output"];
  keywordGroups?: Maybe<Array<Maybe<KeywordGroupType>>>;
  location?: Maybe<LocationType>;
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  maxReservationDuration?: Maybe<Scalars["Duration"]["output"]>;
  maxReservationsPerUser?: Maybe<Scalars["Int"]["output"]>;
  metadataSet?: Maybe<ReservationMetadataSetType>;
  minPersons?: Maybe<Scalars["Int"]["output"]>;
  minReservationDuration?: Maybe<Scalars["Duration"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  paymentMerchant?: Maybe<PaymentMerchantType>;
  paymentProduct?: Maybe<PaymentProductType>;
  paymentTerms?: Maybe<TermsOfUseType>;
  paymentTypes?: Maybe<Array<Maybe<ReservationUnitPaymentTypeType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  pricingTerms?: Maybe<TermsOfUseType>;
  pricings?: Maybe<Array<Maybe<ReservationUnitPricingType>>>;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: Maybe<Scalars["DateTime"]["output"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: Maybe<Scalars["DateTime"]["output"]>;
  purposes?: Maybe<Array<Maybe<PurposeType>>>;
  qualifiers?: Maybe<Array<Maybe<QualifierType>>>;
  /** Order number to be use in api sorting. */
  rank?: Maybe<Scalars["Int"]["output"]>;
  requireIntroduction: Scalars["Boolean"]["output"];
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling: Scalars["Boolean"]["output"];
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: Maybe<Scalars["DateTime"]["output"]>;
  reservationCancelledInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: Maybe<Scalars["DateTime"]["output"]>;
  /** What kind of reservations are to be booked with this reservation unit. */
  reservationKind: ReservationUnitsReservationUnitReservationKindChoices;
  reservationPendingInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 15, 30, 60, or
   * 90. Possible values are interval_15_mins, interval_30_mins, interval_60_mins,
   * interval_90_mins.
   */
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices;
  reservationState?: Maybe<ReservationState>;
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservations?: Maybe<Array<Maybe<ReservationType>>>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  serviceSpecificTerms?: Maybe<TermsOfUseType>;
  services?: Maybe<Array<Maybe<ServiceType>>>;
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  state?: Maybe<ReservationUnitState>;
  surfaceArea?: Maybe<Scalars["Int"]["output"]>;
  termsOfUseEn?: Maybe<Scalars["String"]["output"]>;
  termsOfUseFi?: Maybe<Scalars["String"]["output"]>;
  termsOfUseSv?: Maybe<Scalars["String"]["output"]>;
  unit?: Maybe<UnitType>;
  uuid: Scalars["UUID"]["output"];
};

export type ReservationUnitTypeApplicationRoundsArgs = {
  active?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type ReservationUnitTypeReservationsArgs = {
  from?: InputMaybe<Scalars["Date"]["input"]>;
  includeWithSameComponents?: InputMaybe<Scalars["Boolean"]["input"]>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  to?: InputMaybe<Scalars["Date"]["input"]>;
};

export type ReservationUnitTypeConnection = {
  __typename?: "ReservationUnitTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitType` and its cursor. */
export type ReservationUnitTypeEdge = {
  __typename?: "ReservationUnitTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitType>;
};

export type ReservationUnitTypeType = Node & {
  __typename?: "ReservationUnitTypeType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** Order number to be used in api sorting. */
  rank?: Maybe<Scalars["Int"]["output"]>;
};

export type ReservationUnitTypeTypeConnection = {
  __typename?: "ReservationUnitTypeTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitTypeTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ReservationUnitTypeType` and its cursor. */
export type ReservationUnitTypeTypeEdge = {
  __typename?: "ReservationUnitTypeTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitTypeType>;
};

export type ReservationUnitUpdateMutationInput = {
  /** Allow reservations without opening hours. Used for testing. */
  allowReservationsWithoutOpeningHours?: InputMaybe<
    Scalars["Boolean"]["input"]
  >;
  applicationRoundTimeSlots?: InputMaybe<
    Array<InputMaybe<ApplicationRoundTimeSlotSerializerInput>>
  >;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: InputMaybe<Scalars["String"]["input"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Int"]["input"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Int"]["input"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge?: InputMaybe<Scalars["Boolean"]["input"]>;
  cancellationRulePk?: InputMaybe<Scalars["Int"]["input"]>;
  cancellationTermsPk?: InputMaybe<Scalars["String"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  /** Contact information for this reservation unit. */
  contactInformation?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  equipmentPks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  /** Is reservation unit archived */
  isArchived?: InputMaybe<Scalars["Boolean"]["input"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]["input"]>;
  maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  maxReservationDuration?: InputMaybe<Scalars["Int"]["input"]>;
  maxReservationsPerUser?: InputMaybe<Scalars["Int"]["input"]>;
  metadataSetPk?: InputMaybe<Scalars["Int"]["input"]>;
  minPersons?: InputMaybe<Scalars["Int"]["input"]>;
  minReservationDuration?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  paymentTermsPk?: InputMaybe<Scalars["String"]["input"]>;
  paymentTypes?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
  pk: Scalars["Int"]["input"];
  pricingTerms?: InputMaybe<Scalars["String"]["input"]>;
  pricingTermsPk?: InputMaybe<Scalars["String"]["input"]>;
  pricings: Array<InputMaybe<ReservationUnitPricingUpdateSerializerInput>>;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  purposePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  qualifierPks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: InputMaybe<Scalars["DateTime"]["input"]>;
  reservationCancelledInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationCancelledInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationCancelledInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationConfirmedInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: InputMaybe<Scalars["DateTime"]["input"]>;
  /**
   * What kind of reservations are to be made to this is reservation unit. Possible
   * values are: DIRECT, SEASON, DIRECT_AND_SEASON.
   */
  reservationKind?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsEn?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsFi?: InputMaybe<Scalars["String"]["input"]>;
  reservationPendingInstructionsSv?: InputMaybe<Scalars["String"]["input"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or
   * 45. Possible values are INTERVAL_15_MINUTES, INTERVAL_30_MINUTES,
   * INTERVAL_60_MINUTES, INTERVAL_90_MINUTES.
   */
  reservationStartInterval?: InputMaybe<Scalars["String"]["input"]>;
  reservationUnitTypePk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationsMaxDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  reservationsMinDaysBefore?: InputMaybe<Scalars["Int"]["input"]>;
  resourcePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  servicePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  serviceSpecificTermsPk?: InputMaybe<Scalars["String"]["input"]>;
  spacePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  surfaceArea?: InputMaybe<Scalars["Int"]["input"]>;
  termsOfUseEn?: InputMaybe<Scalars["String"]["input"]>;
  termsOfUseFi?: InputMaybe<Scalars["String"]["input"]>;
  termsOfUseSv?: InputMaybe<Scalars["String"]["input"]>;
  unitPk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ReservationUnitUpdateMutationPayload = {
  __typename?: "ReservationUnitUpdateMutationPayload";
  /** Allow reservations without opening hours. Used for testing. */
  allowReservationsWithoutOpeningHours?: Maybe<Scalars["Boolean"]["output"]>;
  applicationRoundTimeSlots?: Maybe<Array<Maybe<ApplicationRoundTimeSlotNode>>>;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: Maybe<Scalars["String"]["output"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]["output"]>;
  building?: Maybe<Scalars["String"]["output"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge?: Maybe<Scalars["Boolean"]["output"]>;
  cancellationRulePk?: Maybe<Scalars["Int"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** Contact information for this reservation unit. */
  contactInformation?: Maybe<Scalars["String"]["output"]>;
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Images of the reservation unit as nested related objects.  */
  images?: Maybe<Array<Maybe<ReservationUnitImageType>>>;
  /** Is reservation unit archived */
  isArchived?: Maybe<Scalars["Boolean"]["output"]>;
  isDraft?: Maybe<Scalars["Boolean"]["output"]>;
  /** Location of this reservation unit. Dynamically determined from spaces of the reservation unit. */
  location?: Maybe<Scalars["String"]["output"]>;
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  maxReservationDuration?: Maybe<Scalars["Int"]["output"]>;
  maxReservationsPerUser?: Maybe<Scalars["Int"]["output"]>;
  minPersons?: Maybe<Scalars["Int"]["output"]>;
  minReservationDuration?: Maybe<Scalars["Int"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  paymentTypes?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  pricingTerms?: Maybe<Scalars["String"]["output"]>;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: Maybe<Scalars["DateTime"]["output"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: Maybe<Scalars["DateTime"]["output"]>;
  purposes?: Maybe<Array<Maybe<PurposeType>>>;
  qualifierPks?: Maybe<Array<Maybe<Scalars["Int"]["output"]>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: Maybe<Scalars["Boolean"]["output"]>;
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling?: Maybe<Scalars["Boolean"]["output"]>;
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: Maybe<Scalars["DateTime"]["output"]>;
  reservationCancelledInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationCancelledInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationConfirmedInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: Maybe<Scalars["DateTime"]["output"]>;
  /**
   * What kind of reservations are to be made to this is reservation unit. Possible
   * values are: DIRECT, SEASON, DIRECT_AND_SEASON.
   */
  reservationKind?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsEn?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsFi?: Maybe<Scalars["String"]["output"]>;
  reservationPendingInstructionsSv?: Maybe<Scalars["String"]["output"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or
   * 45. Possible values are INTERVAL_15_MINUTES, INTERVAL_30_MINUTES,
   * INTERVAL_60_MINUTES, INTERVAL_90_MINUTES.
   */
  reservationStartInterval?: Maybe<Scalars["String"]["output"]>;
  reservationUnit?: Maybe<ReservationUnitType>;
  /** Type of the reservation unit as nested related object. */
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservationUnitTypePk?: Maybe<Scalars["Int"]["output"]>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]["output"]>;
  /** Resources included in the reservation unit as nested related objects. */
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  /** Services included in the reservation unit as nested related objects. */
  services?: Maybe<Array<Maybe<ServiceType>>>;
  /** Spaces included in the reservation unit as nested related objects. */
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  state?: Maybe<Scalars["String"]["output"]>;
  surfaceArea?: Maybe<Scalars["Int"]["output"]>;
  termsOfUseEn?: Maybe<Scalars["String"]["output"]>;
  termsOfUseFi?: Maybe<Scalars["String"]["output"]>;
  termsOfUseSv?: Maybe<Scalars["String"]["output"]>;
  unitPk?: Maybe<Scalars["Int"]["output"]>;
  uuid?: Maybe<Scalars["String"]["output"]>;
};

/** An enumeration. */
export enum ReservationUnitsReservationUnitAuthenticationChoices {
  /** Strong */
  Strong = "STRONG",
  /** Weak */
  Weak = "WEAK",
}

/** An enumeration. */
export enum ReservationUnitsReservationUnitImageImageTypeChoices {
  /** Ground plan */
  GroundPlan = "GROUND_PLAN",
  /** Main image */
  Main = "MAIN",
  /** Map */
  Map = "MAP",
  /** Other */
  Other = "OTHER",
}

/** An enumeration. */
export enum ReservationUnitsReservationUnitPricingPriceUnitChoices {
  /** fixed */
  Fixed = "FIXED",
  /** per 15 minutes */
  Per_15Mins = "PER_15_MINS",
  /** per 30 minutes */
  Per_30Mins = "PER_30_MINS",
  /** per day */
  PerDay = "PER_DAY",
  /** per half a day */
  PerHalfDay = "PER_HALF_DAY",
  /** per hour */
  PerHour = "PER_HOUR",
  /** per week */
  PerWeek = "PER_WEEK",
}

/** An enumeration. */
export enum ReservationUnitsReservationUnitPricingPricingTypeChoices {
  /** Free */
  Free = "FREE",
  /** Paid */
  Paid = "PAID",
}

/** An enumeration. */
export enum ReservationUnitsReservationUnitPricingStatusChoices {
  /** voimassa */
  Active = "ACTIVE",
  /** future */
  Future = "FUTURE",
  /** past */
  Past = "PAST",
}

/** An enumeration. */
export enum ReservationUnitsReservationUnitReservationKindChoices {
  /** Direct */
  Direct = "DIRECT",
  /** Direct And Season */
  DirectAndSeason = "DIRECT_AND_SEASON",
  /** Season */
  Season = "SEASON",
}

/** An enumeration. */
export enum ReservationUnitsReservationUnitReservationStartIntervalChoices {
  /** 15 minutes */
  Interval_15Mins = "INTERVAL_15_MINS",
  /** 30 minutes */
  Interval_30Mins = "INTERVAL_30_MINS",
  /** 60 minutes */
  Interval_60Mins = "INTERVAL_60_MINS",
  /** 90 minutes */
  Interval_90Mins = "INTERVAL_90_MINS",
}

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
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  end?: InputMaybe<Scalars["DateTime"]["input"]>;
  freeOfChargeReason?: InputMaybe<Scalars["String"]["input"]>;
  homeCityPk?: InputMaybe<Scalars["Int"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk: Scalars["Int"]["input"];
  priority?: InputMaybe<Scalars["Int"]["input"]>;
  purposePk?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnitPks?: InputMaybe<Array<InputMaybe<Scalars["Int"]["input"]>>>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]["input"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]["input"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]["input"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]["input"]>;
  /** Reservee's business or association identity code */
  reserveeId?: InputMaybe<Scalars["String"]["input"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]["input"]>;
  reserveeLanguage?: InputMaybe<Scalars["String"]["input"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]["input"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]["input"]>;
  reserveePhone?: InputMaybe<Scalars["String"]["input"]>;
  reserveeType?: InputMaybe<Scalars["String"]["input"]>;
  /**
   * String value for ReservationType's ReservationState enum. Possible values are
   * CREATED, CANCELLED, REQUIRES_HANDLING, WAITING_FOR_PAYMENT, CONFIRMED, DENIED.
   */
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
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end?: Maybe<Scalars["DateTime"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  freeOfChargeReason?: Maybe<Scalars["String"]["output"]>;
  homeCityPk?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  /** The non subsidised price of this reservation including VAT */
  nonSubsidisedPrice?: Maybe<Scalars["Decimal"]["output"]>;
  /** The non subsidised price of this reservation excluding VAT */
  nonSubsidisedPriceNet?: Maybe<Scalars["Decimal"]["output"]>;
  numPersons?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** The price of this particular reservation including VAT */
  price?: Maybe<Scalars["Decimal"]["output"]>;
  /** The price of this particular reservation excluding VAT */
  priceNet?: Maybe<Scalars["Decimal"]["output"]>;
  priority?: Maybe<Scalars["Int"]["output"]>;
  purposePk?: Maybe<Scalars["Int"]["output"]>;
  reservation?: Maybe<ReservationType>;
  reserveeAddressCity?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]["output"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]["output"]>;
  reserveeEmail?: Maybe<Scalars["String"]["output"]>;
  reserveeFirstName?: Maybe<Scalars["String"]["output"]>;
  /** Reservee's business or association identity code */
  reserveeId?: Maybe<Scalars["String"]["output"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]["output"]>;
  reserveeLanguage?: Maybe<Scalars["String"]["output"]>;
  reserveeLastName?: Maybe<Scalars["String"]["output"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]["output"]>;
  reserveePhone?: Maybe<Scalars["String"]["output"]>;
  reserveeType?: Maybe<Scalars["String"]["output"]>;
  /**
   * String value for ReservationType's ReservationState enum. Possible values are
   * CREATED, CANCELLED, REQUIRES_HANDLING, WAITING_FOR_PAYMENT, CONFIRMED, DENIED.
   */
  state?: Maybe<Scalars["String"]["output"]>;
  /** The value of the tax percentage for this particular reservation */
  taxPercentageValue?: Maybe<Scalars["Decimal"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  /** The unit price of this particular reservation */
  unitPrice?: Maybe<Scalars["Decimal"]["output"]>;
};

export type ReservationWorkingMemoMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  /** Primary key of the reservation */
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  /** Working memo for staff users. */
  workingMemo?: InputMaybe<Scalars["String"]["input"]>;
};

export type ReservationWorkingMemoMutationPayload = {
  __typename?: "ReservationWorkingMemoMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Primary key of the reservation */
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** Working memo for staff users. */
  workingMemo?: Maybe<Scalars["String"]["output"]>;
};

/** An enumeration. */
export enum ReservationsReservationPriorityChoices {
  /** Low */
  A_100 = "A_100",
  /** Medium */
  A_200 = "A_200",
  /** High */
  A_300 = "A_300",
}

/** An enumeration. */
export enum ReservationsReservationReserveeTypeChoices {
  /** Business */
  Business = "BUSINESS",
  /** Individual */
  Individual = "INDIVIDUAL",
  /** Nonprofit */
  Nonprofit = "NONPROFIT",
}

/** An enumeration. */
export enum ReservationsReservationStateChoices {
  /** Cancelled */
  Cancelled = "CANCELLED",
  /** Confirmed */
  Confirmed = "CONFIRMED",
  /** Luotu */
  Created = "CREATED",
  /** Denied */
  Denied = "DENIED",
  /** Requires handling */
  RequiresHandling = "REQUIRES_HANDLING",
  /** Waiting for payment */
  WaitingForPayment = "WAITING_FOR_PAYMENT",
}

/** An enumeration. */
export enum ReservationsReservationTypeChoices {
  /** Behalf */
  Behalf = "BEHALF",
  /** Blocked */
  Blocked = "BLOCKED",
  /** Normal */
  Normal = "NORMAL",
  /** Staff */
  Staff = "STAFF",
}

export type ResourceCreateMutationInput = {
  /**
   * Buffer time while reservation unit is unreservable after the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeAfter?: InputMaybe<Scalars["Int"]["input"]>;
  /**
   * Buffer time while reservation unit is unreservable before the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeBefore?: InputMaybe<Scalars["Int"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  locationType?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  /** PK of the related space for this resource. */
  spacePk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ResourceCreateMutationPayload = {
  __typename?: "ResourceCreateMutationPayload";
  /**
   * Buffer time while reservation unit is unreservable after the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeAfter?: Maybe<Scalars["Int"]["output"]>;
  /**
   * Buffer time while reservation unit is unreservable before the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeBefore?: Maybe<Scalars["Int"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  locationType?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  resource?: Maybe<ResourceType>;
  /** PK of the related space for this resource. */
  spacePk?: Maybe<Scalars["Int"]["output"]>;
};

export type ResourceDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type ResourceDeleteMutationPayload = {
  __typename?: "ResourceDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
  errors?: Maybe<Scalars["String"]["output"]>;
};

export type ResourceType = Node & {
  __typename?: "ResourceType";
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  building?: Maybe<Array<Maybe<BuildingType>>>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  locationType: ResourcesResourceLocationTypeChoices;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  space?: Maybe<SpaceType>;
};

export type ResourceTypeConnection = {
  __typename?: "ResourceTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ResourceTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ResourceType` and its cursor. */
export type ResourceTypeEdge = {
  __typename?: "ResourceTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ResourceType>;
};

export type ResourceUpdateMutationInput = {
  /**
   * Buffer time while reservation unit is unreservable after the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeAfter?: InputMaybe<Scalars["Int"]["input"]>;
  /**
   * Buffer time while reservation unit is unreservable before the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeBefore?: InputMaybe<Scalars["Int"]["input"]>;
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  locationType?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
  /** PK of the related space for this resource. */
  spacePk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ResourceUpdateMutationPayload = {
  __typename?: "ResourceUpdateMutationPayload";
  /**
   * Buffer time while reservation unit is unreservable after the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeAfter?: Maybe<Scalars["Int"]["output"]>;
  /**
   * Buffer time while reservation unit is unreservable before the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeBefore?: Maybe<Scalars["Int"]["output"]>;
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  locationType?: Maybe<Scalars["String"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  resource?: Maybe<ResourceType>;
  /** PK of the related space for this resource. */
  spacePk?: Maybe<Scalars["Int"]["output"]>;
};

/** An enumeration. */
export enum ResourcesResourceLocationTypeChoices {
  /** Fixed */
  Fixed = "FIXED",
  /** Movable */
  Movable = "MOVABLE",
}

export type RoleType = {
  __typename?: "RoleType";
  code?: Maybe<Scalars["String"]["output"]>;
  verboseName?: Maybe<Scalars["String"]["output"]>;
  verboseNameEn?: Maybe<Scalars["String"]["output"]>;
  verboseNameFi?: Maybe<Scalars["String"]["output"]>;
  verboseNameSv?: Maybe<Scalars["String"]["output"]>;
};

export type ServiceSectorRolePermissionType = {
  __typename?: "ServiceSectorRolePermissionType";
  permission?: Maybe<Scalars["String"]["output"]>;
};

export type ServiceSectorRoleType = Node & {
  __typename?: "ServiceSectorRoleType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  permissions?: Maybe<Array<Maybe<ServiceSectorRolePermissionType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  role?: Maybe<RoleType>;
  serviceSector?: Maybe<ServiceSectorType>;
};

export type ServiceSectorType = Node & {
  __typename?: "ServiceSectorType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
};

export type ServiceSectorTypeConnection = {
  __typename?: "ServiceSectorTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ServiceSectorTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `ServiceSectorType` and its cursor. */
export type ServiceSectorTypeEdge = {
  __typename?: "ServiceSectorTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<ServiceSectorType>;
};

export type ServiceType = Node & {
  __typename?: "ServiceType";
  bufferTimeAfter?: Maybe<Scalars["Duration"]["output"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]["output"]>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  serviceType: ServicesServiceServiceTypeChoices;
};

/** An enumeration. */
export enum ServicesServiceServiceTypeChoices {
  /** Catering */
  Catering = "CATERING",
  /** Configuration */
  Configuration = "CONFIGURATION",
  /** Introduction */
  Introduction = "INTRODUCTION",
}

export type SpaceCreateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  code?: InputMaybe<Scalars["String"]["input"]>;
  maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi: Scalars["String"]["input"];
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  /** PK of the parent space for this space. */
  parentPk?: InputMaybe<Scalars["Int"]["input"]>;
  surfaceArea?: InputMaybe<Scalars["Float"]["input"]>;
  unitPk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type SpaceCreateMutationPayload = {
  __typename?: "SpaceCreateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  code?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  /** PK of the parent space for this space. */
  parentPk?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  space?: Maybe<SpaceType>;
  surfaceArea?: Maybe<Scalars["Float"]["output"]>;
  unitPk?: Maybe<Scalars["Int"]["output"]>;
};

export type SpaceDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
};

export type SpaceDeleteMutationPayload = {
  __typename?: "SpaceDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  deleted?: Maybe<Scalars["Boolean"]["output"]>;
  errors?: Maybe<Scalars["String"]["output"]>;
};

export type SpaceType = Node & {
  __typename?: "SpaceType";
  building?: Maybe<BuildingType>;
  children?: Maybe<Array<Maybe<SpaceType>>>;
  code: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  parent?: Maybe<SpaceType>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  surfaceArea?: Maybe<Scalars["Int"]["output"]>;
  unit?: Maybe<UnitByPkType>;
};

export type SpaceTypeConnection = {
  __typename?: "SpaceTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<SpaceTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `SpaceType` and its cursor. */
export type SpaceTypeEdge = {
  __typename?: "SpaceTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<SpaceType>;
};

export type SpaceUpdateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  code?: InputMaybe<Scalars["String"]["input"]>;
  maxPersons?: InputMaybe<Scalars["Int"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  /** PK of the parent space for this space. */
  parentPk?: InputMaybe<Scalars["Int"]["input"]>;
  pk: Scalars["Int"]["input"];
  surfaceArea?: InputMaybe<Scalars["Float"]["input"]>;
  unitPk?: InputMaybe<Scalars["Int"]["input"]>;
};

export type SpaceUpdateMutationPayload = {
  __typename?: "SpaceUpdateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  code?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  maxPersons?: Maybe<Scalars["Int"]["output"]>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  /** PK of the parent space for this space. */
  parentPk?: Maybe<Scalars["Int"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  space?: Maybe<SpaceType>;
  surfaceArea?: Maybe<Scalars["Float"]["output"]>;
  unitPk?: Maybe<Scalars["Int"]["output"]>;
};

export type TaxPercentageType = Node & {
  __typename?: "TaxPercentageType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** The tax percentage for a price */
  value: Scalars["Decimal"]["output"];
};

export type TaxPercentageTypeConnection = {
  __typename?: "TaxPercentageTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<TaxPercentageTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `TaxPercentageType` and its cursor. */
export type TaxPercentageTypeEdge = {
  __typename?: "TaxPercentageTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<TaxPercentageType>;
};

/** An enumeration. */
export enum TermsOfUseTermsOfUseTermsTypeChoices {
  /** Cancellation terms */
  CancellationTerms = "CANCELLATION_TERMS",
  /** Generic terms */
  GenericTerms = "GENERIC_TERMS",
  /** Payment terms */
  PaymentTerms = "PAYMENT_TERMS",
  /** Pricing terms */
  PricingTerms = "PRICING_TERMS",
  /** Recurring reservation terms */
  RecurringTerms = "RECURRING_TERMS",
  /** Service-specific terms */
  ServiceTerms = "SERVICE_TERMS",
}

export type TermsOfUseType = Node & {
  __typename?: "TermsOfUseType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["String"]["output"]>;
  termsType: TermsOfUseTermsOfUseTermsTypeChoices;
  textEn?: Maybe<Scalars["String"]["output"]>;
  textFi?: Maybe<Scalars["String"]["output"]>;
  textSv?: Maybe<Scalars["String"]["output"]>;
};

export type TermsOfUseTypeConnection = {
  __typename?: "TermsOfUseTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<TermsOfUseTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `TermsOfUseType` and its cursor. */
export type TermsOfUseTypeEdge = {
  __typename?: "TermsOfUseTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<TermsOfUseType>;
};

export type TimeSlotSerializerInput = {
  begin: Scalars["Time"]["input"];
  end: Scalars["Time"]["input"];
};

export type TimeSlotType = {
  __typename?: "TimeSlotType";
  begin: Scalars["TimeString"]["output"];
  end: Scalars["TimeString"]["output"];
};

export type UnitByPkType = Node & {
  __typename?: "UnitByPkType";
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  email: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  location?: Maybe<LocationType>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  paymentMerchant?: Maybe<PaymentMerchantType>;
  phone: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationUnits?: Maybe<Array<Maybe<ReservationUnitType>>>;
  serviceSectors?: Maybe<Array<Maybe<ServiceSectorType>>>;
  shortDescriptionEn?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionFi?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionSv?: Maybe<Scalars["String"]["output"]>;
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  tprekId?: Maybe<Scalars["String"]["output"]>;
  webPage: Scalars["String"]["output"];
};

export type UnitGroupType = Node & {
  __typename?: "UnitGroupType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  units?: Maybe<Array<Maybe<UnitType>>>;
};

export type UnitRolePermissionType = {
  __typename?: "UnitRolePermissionType";
  permission?: Maybe<Scalars["String"]["output"]>;
};

export type UnitRoleType = Node & {
  __typename?: "UnitRoleType";
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  permissions?: Maybe<Array<Maybe<UnitRolePermissionType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  role?: Maybe<RoleType>;
  unitGroups?: Maybe<Array<Maybe<UnitGroupType>>>;
  units?: Maybe<Array<Maybe<UnitType>>>;
};

export type UnitType = Node & {
  __typename?: "UnitType";
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  email: Scalars["String"]["output"];
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  location?: Maybe<LocationType>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  paymentMerchant?: Maybe<PaymentMerchantType>;
  phone: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationUnits?: Maybe<Array<Maybe<ReservationUnitType>>>;
  serviceSectors?: Maybe<Array<Maybe<ServiceSectorType>>>;
  shortDescriptionEn?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionFi?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionSv?: Maybe<Scalars["String"]["output"]>;
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  tprekId?: Maybe<Scalars["String"]["output"]>;
  webPage: Scalars["String"]["output"];
};

export type UnitTypeConnection = {
  __typename?: "UnitTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<UnitTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]["output"]>;
};

/** A Relay edge containing a `UnitType` and its cursor. */
export type UnitTypeEdge = {
  __typename?: "UnitTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"]["output"];
  /** The item at the end of the edge */
  node?: Maybe<UnitType>;
};

export type UnitUpdateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  descriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  descriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  descriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  phone?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
  shortDescriptionEn?: InputMaybe<Scalars["String"]["input"]>;
  shortDescriptionFi?: InputMaybe<Scalars["String"]["input"]>;
  shortDescriptionSv?: InputMaybe<Scalars["String"]["input"]>;
  tprekId?: InputMaybe<Scalars["String"]["input"]>;
  webPage?: InputMaybe<Scalars["String"]["input"]>;
};

export type UnitUpdateMutationPayload = {
  __typename?: "UnitUpdateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  descriptionEn?: Maybe<Scalars["String"]["output"]>;
  descriptionFi?: Maybe<Scalars["String"]["output"]>;
  descriptionSv?: Maybe<Scalars["String"]["output"]>;
  email?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]["output"]>;
  nameFi?: Maybe<Scalars["String"]["output"]>;
  nameSv?: Maybe<Scalars["String"]["output"]>;
  phone?: Maybe<Scalars["String"]["output"]>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  shortDescriptionEn?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionFi?: Maybe<Scalars["String"]["output"]>;
  shortDescriptionSv?: Maybe<Scalars["String"]["output"]>;
  tprekId?: Maybe<Scalars["String"]["output"]>;
  unit?: Maybe<UnitType>;
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

export type UpdateApplicationEventInApplicationSerializerInput = {
  abilityGroup?: InputMaybe<Scalars["Int"]["input"]>;
  ageGroup?: InputMaybe<Scalars["Int"]["input"]>;
  applicationEventSchedules?: InputMaybe<
    Array<InputMaybe<UpdateApplicationEventScheduleInEventSerializerInput>>
  >;
  begin?: InputMaybe<Scalars["Date"]["input"]>;
  biweekly?: InputMaybe<Scalars["Boolean"]["input"]>;
  end?: InputMaybe<Scalars["Date"]["input"]>;
  eventReservationUnits?: InputMaybe<
    Array<InputMaybe<UpdateEventReservationUnitSerializerInput>>
  >;
  eventsPerWeek?: InputMaybe<Scalars["Int"]["input"]>;
  maxDuration?: InputMaybe<Scalars["String"]["input"]>;
  minDuration?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameEn?: InputMaybe<Scalars["String"]["input"]>;
  nameFi?: InputMaybe<Scalars["String"]["input"]>;
  nameSv?: InputMaybe<Scalars["String"]["input"]>;
  numPersons?: InputMaybe<Scalars["Int"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  purpose?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateApplicationEventScheduleInEventSerializerInput = {
  begin?: InputMaybe<Scalars["Time"]["input"]>;
  day?: InputMaybe<Scalars["Int"]["input"]>;
  end?: InputMaybe<Scalars["Time"]["input"]>;
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  priority?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateEventReservationUnitSerializerInput = {
  pk?: InputMaybe<Scalars["Int"]["input"]>;
  preferredOrder?: InputMaybe<Scalars["Int"]["input"]>;
  reservationUnit?: InputMaybe<Scalars["Int"]["input"]>;
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
  organisationType?: InputMaybe<Organisation_Type>;
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

export type UserType = Node & {
  __typename?: "UserType";
  dateOfBirth?: Maybe<Scalars["Date"]["output"]>;
  email: Scalars["String"]["output"];
  firstName: Scalars["String"]["output"];
  generalRoles?: Maybe<Array<Maybe<GeneralRoleType>>>;
  /** The ID of the object */
  id: Scalars["ID"]["output"];
  isAdAuthenticated?: Maybe<Scalars["Boolean"]["output"]>;
  isStronglyAuthenticated?: Maybe<Scalars["Boolean"]["output"]>;
  /** Antaa käyttäjälle kaikki oikeudet ilman, että niitä täytyy erikseen luetella. */
  isSuperuser: Scalars["Boolean"]["output"];
  lastName: Scalars["String"]["output"];
  pk?: Maybe<Scalars["Int"]["output"]>;
  reservationNotification?: Maybe<Scalars["String"]["output"]>;
  serviceSectorRoles?: Maybe<Array<Maybe<ServiceSectorRoleType>>>;
  unitRoles?: Maybe<Array<Maybe<UnitRoleType>>>;
  /** Vaaditaan. Enintään 150 merkkiä. Vain kirjaimet, numerot ja @/./+/-/_ ovat sallittuja. */
  username: Scalars["String"]["output"];
  uuid: Scalars["UUID"]["output"];
};

export type UserUpdateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]["input"]>;
  pk: Scalars["Int"]["input"];
  /** When reservation notification emails are sent. Possible values are: ALL, ONLY_HANDLING_REQUIRED, NONE. */
  reservationNotification?: InputMaybe<Scalars["String"]["input"]>;
};

export type UserUpdateMutationPayload = {
  __typename?: "UserUpdateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]["output"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]["output"]>;
  /** When reservation notification emails are sent. Possible values are: ALL, ONLY_HANDLING_REQUIRED, NONE. */
  reservationNotification?: Maybe<Scalars["String"]["output"]>;
  user?: Maybe<UserType>;
};

/** An enumeration. */
export enum Applicant_Type {
  /** Association */
  Association = "ASSOCIATION",
  /** Community */
  Community = "COMMUNITY",
  /** Company */
  Company = "COMPANY",
  /** Individual */
  Individual = "INDIVIDUAL",
}

/** An enumeration. */
export enum Level {
  /** Exception */
  Exception = "EXCEPTION",
  /** Normal */
  Normal = "NORMAL",
  /** Warning */
  Warning = "WARNING",
}

/** An enumeration. */
export enum Organisation_Type {
  /** Company */
  Company = "COMPANY",
  /** Municipality consortium */
  MunicipalityConsortium = "MUNICIPALITY_CONSORTIUM",
  /** Public association */
  PublicAssociation = "PUBLIC_ASSOCIATION",
  /** Registered association */
  RegisteredAssociation = "REGISTERED_ASSOCIATION",
  /** Religious community */
  ReligiousCommunity = "RELIGIOUS_COMMUNITY",
  /** Unregistered association */
  UnregisteredAssociation = "UNREGISTERED_ASSOCIATION",
}

/** An enumeration. */
export enum State {
  /** Cancelled */
  Cancelled = "CANCELLED",
  /** Confirmed */
  Confirmed = "CONFIRMED",
  /** Luotu */
  Created = "CREATED",
  /** Denied */
  Denied = "DENIED",
  /** Requires handling */
  RequiresHandling = "REQUIRES_HANDLING",
  /** Waiting for payment */
  WaitingForPayment = "WAITING_FOR_PAYMENT",
}

/** An enumeration. */
export enum Target {
  /** Kaikki */
  All = "ALL",
  /** Staff */
  Staff = "STAFF",
  /** Käyttäjä */
  User = "USER",
}
