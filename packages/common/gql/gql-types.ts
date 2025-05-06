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
