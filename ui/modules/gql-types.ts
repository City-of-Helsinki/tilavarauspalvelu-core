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
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /**
   * The `Date` scalar type represents a Date
   * value as specified by
   * [iso8601](https://en.wikipedia.org/wiki/ISO_8601).
   */
  Date: any;
  /**
   * The `DateTime` scalar type represents a DateTime
   * value as specified by
   * [iso8601](https://en.wikipedia.org/wiki/ISO_8601).
   */
  DateTime: any;
  /** The `Decimal` scalar type represents a python Decimal. */
  Decimal: any;
  /**
   * The `Duration` scalar type represents a duration value as an integer in seconds.
   * For example, a value of 900 means a duration of 15 minutes.
   */
  Duration: any;
  /**
   * The `Time` scalar type represents a Time value as
   * specified by
   * [iso8601](https://en.wikipedia.org/wiki/ISO_8601).
   */
  Time: any;
  /**
   * Leverages the internal Python implementation of UUID (uuid.UUID) to provide native UUID objects
   * in fields, resolvers and input.
   */
  UUID: any;
  /**
   * Create scalar that ignores normal serialization/deserialization, since
   * that will be handled by the multipart request spec
   */
  Upload: any;
};

export type AbilityGroupType = {
  __typename?: "AbilityGroupType";
  name: Scalars["String"];
  pk?: Maybe<Scalars["Int"]>;
};

export type AgeGroupType = Node & {
  __typename?: "AgeGroupType";
  /** The ID of the object */
  id: Scalars["ID"];
  maximum?: Maybe<Scalars["Int"]>;
  minimum: Scalars["Int"];
  pk?: Maybe<Scalars["Int"]>;
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
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<AgeGroupType>;
};

export type ApplicationRoundType = {
  __typename?: "ApplicationRoundType";
  allocating: Scalars["Boolean"];
  applicationPeriodBegin: Scalars["DateTime"];
  applicationPeriodEnd: Scalars["DateTime"];
  criteriaEn?: Maybe<Scalars["String"]>;
  criteriaFi?: Maybe<Scalars["String"]>;
  criteriaSv?: Maybe<Scalars["String"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  publicDisplayBegin: Scalars["DateTime"];
  publicDisplayEnd: Scalars["DateTime"];
  purposes: ReservationPurposeTypeConnection;
  reservationPeriodBegin: Scalars["Date"];
  reservationPeriodEnd: Scalars["Date"];
  reservationUnits: ReservationUnitByPkTypeConnection;
  targetGroup: ApplicationsApplicationRoundTargetGroupChoices;
};

export type ApplicationRoundTypePurposesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type ApplicationRoundTypeReservationUnitsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

/** An enumeration. */
export enum ApplicationsApplicationRoundTargetGroupChoices {
  /** Kaikki */
  All = "ALL",
  /** Internal */
  Internal = "INTERNAL",
  /** Public */
  Public = "PUBLIC",
}

export type BuildingType = Node & {
  __typename?: "BuildingType";
  district?: Maybe<DistrictType>;
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  realEstate?: Maybe<RealEstateType>;
  surfaceArea?: Maybe<Scalars["Decimal"]>;
};

export type CityType = Node & {
  __typename?: "CityType";
  /** The ID of the object */
  id: Scalars["ID"];
  name: Scalars["String"];
  pk?: Maybe<Scalars["Int"]>;
};

export type CityTypeConnection = {
  __typename?: "CityTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<CityTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `CityType` and its cursor. */
export type CityTypeEdge = {
  __typename?: "CityTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<CityType>;
};

export type DistrictType = Node & {
  __typename?: "DistrictType";
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type EquipmentCategoryCreateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
};

export type EquipmentCategoryCreateMutationPayload = {
  __typename?: "EquipmentCategoryCreateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  equipmentCategory?: Maybe<EquipmentCategoryType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type EquipmentCategoryDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
};

export type EquipmentCategoryDeleteMutationPayload = {
  __typename?: "EquipmentCategoryDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  deleted?: Maybe<Scalars["Boolean"]>;
  errors?: Maybe<Scalars["String"]>;
};

export type EquipmentCategoryType = Node & {
  __typename?: "EquipmentCategoryType";
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type EquipmentCategoryTypeConnection = {
  __typename?: "EquipmentCategoryTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<EquipmentCategoryTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `EquipmentCategoryType` and its cursor. */
export type EquipmentCategoryTypeEdge = {
  __typename?: "EquipmentCategoryTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<EquipmentCategoryType>;
};

export type EquipmentCategoryUpdateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
};

export type EquipmentCategoryUpdateMutationPayload = {
  __typename?: "EquipmentCategoryUpdateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  equipmentCategory?: Maybe<EquipmentCategoryType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type EquipmentCreateMutationInput = {
  categoryPk: Scalars["Int"];
  clientMutationId?: InputMaybe<Scalars["String"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
};

export type EquipmentCreateMutationPayload = {
  __typename?: "EquipmentCreateMutationPayload";
  categoryPk?: Maybe<Scalars["Int"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
  equipment?: Maybe<EquipmentType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type EquipmentDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
};

export type EquipmentDeleteMutationPayload = {
  __typename?: "EquipmentDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  deleted?: Maybe<Scalars["Boolean"]>;
  errors?: Maybe<Scalars["String"]>;
};

export type EquipmentType = Node & {
  __typename?: "EquipmentType";
  category?: Maybe<EquipmentCategoryType>;
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type EquipmentTypeConnection = {
  __typename?: "EquipmentTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<EquipmentTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `EquipmentType` and its cursor. */
export type EquipmentTypeEdge = {
  __typename?: "EquipmentTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<EquipmentType>;
};

export type EquipmentUpdateMutationInput = {
  categoryPk: Scalars["Int"];
  clientMutationId?: InputMaybe<Scalars["String"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
};

export type EquipmentUpdateMutationPayload = {
  __typename?: "EquipmentUpdateMutationPayload";
  categoryPk?: Maybe<Scalars["Int"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
  equipment?: Maybe<EquipmentType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type ErrorType = {
  __typename?: "ErrorType";
  field: Scalars["String"];
  messages: Array<Scalars["String"]>;
};

export type KeywordCategoryType = Node & {
  __typename?: "KeywordCategoryType";
  /** The ID of the object */
  id: Scalars["ID"];
  keywordGroups?: Maybe<Array<Maybe<KeywordGroupType>>>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type KeywordCategoryTypeConnection = {
  __typename?: "KeywordCategoryTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordCategoryTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `KeywordCategoryType` and its cursor. */
export type KeywordCategoryTypeEdge = {
  __typename?: "KeywordCategoryTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<KeywordCategoryType>;
};

export type KeywordGroupType = Node & {
  __typename?: "KeywordGroupType";
  /** The ID of the object */
  id: Scalars["ID"];
  keywords?: Maybe<Array<Maybe<KeywordType>>>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type KeywordGroupTypeConnection = {
  __typename?: "KeywordGroupTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordGroupTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `KeywordGroupType` and its cursor. */
export type KeywordGroupTypeEdge = {
  __typename?: "KeywordGroupTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<KeywordGroupType>;
};

export type KeywordType = Node & {
  __typename?: "KeywordType";
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type KeywordTypeConnection = {
  __typename?: "KeywordTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `KeywordType` and its cursor. */
export type KeywordTypeEdge = {
  __typename?: "KeywordTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<KeywordType>;
};

export type LocationType = Node & {
  __typename?: "LocationType";
  addressCityEn?: Maybe<Scalars["String"]>;
  addressCityFi?: Maybe<Scalars["String"]>;
  addressCitySv?: Maybe<Scalars["String"]>;
  addressStreetEn?: Maybe<Scalars["String"]>;
  addressStreetFi?: Maybe<Scalars["String"]>;
  addressStreetSv?: Maybe<Scalars["String"]>;
  addressZip: Scalars["String"];
  /** The ID of the object */
  id: Scalars["ID"];
  latitude?: Maybe<Scalars["String"]>;
  longitude?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type Mutation = {
  __typename?: "Mutation";
  approveReservation?: Maybe<ReservationApproveMutationPayload>;
  cancelReservation?: Maybe<ReservationCancellationMutationPayload>;
  confirmReservation?: Maybe<ReservationConfirmMutationPayload>;
  createEquipment?: Maybe<EquipmentCreateMutationPayload>;
  createEquipmentCategory?: Maybe<EquipmentCategoryCreateMutationPayload>;
  createPurpose?: Maybe<PurposeCreateMutationPayload>;
  createReservation?: Maybe<ReservationCreateMutationPayload>;
  createReservationUnit?: Maybe<ReservationUnitCreateMutationPayload>;
  createReservationUnitImage?: Maybe<ReservationUnitImageCreateMutationPayload>;
  createResource?: Maybe<ResourceCreateMutationPayload>;
  createSpace?: Maybe<SpaceCreateMutationPayload>;
  deleteEquipment?: Maybe<EquipmentDeleteMutationPayload>;
  deleteEquipmentCategory?: Maybe<EquipmentCategoryDeleteMutationPayload>;
  deleteReservationUnitImage?: Maybe<ReservationUnitImageDeleteMutationPayload>;
  deleteResource?: Maybe<ResourceDeleteMutationPayload>;
  deleteSpace?: Maybe<SpaceDeleteMutationPayload>;
  denyReservation?: Maybe<ReservationDenyMutationPayload>;
  requireHandlingForReservation?: Maybe<ReservationRequiresHandlingMutationPayload>;
  updateEquipment?: Maybe<EquipmentUpdateMutationPayload>;
  updateEquipmentCategory?: Maybe<EquipmentCategoryUpdateMutationPayload>;
  updatePurpose?: Maybe<PurposeUpdateMutationPayload>;
  updateReservation?: Maybe<ReservationUpdateMutationPayload>;
  updateReservationUnit?: Maybe<ReservationUnitUpdateMutationPayload>;
  updateReservationUnitImage?: Maybe<ReservationUnitImageUpdateMutationPayload>;
  updateReservationWorkingMemo?: Maybe<ReservationWorkingMemoMutationPayload>;
  updateResource?: Maybe<ResourceUpdateMutationPayload>;
  updateSpace?: Maybe<SpaceUpdateMutationPayload>;
  updateUnit?: Maybe<UnitUpdateMutationPayload>;
};

export type MutationApproveReservationArgs = {
  input: ReservationApproveMutationInput;
};

export type MutationCancelReservationArgs = {
  input: ReservationCancellationMutationInput;
};

export type MutationConfirmReservationArgs = {
  input: ReservationConfirmMutationInput;
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

export type MutationDeleteEquipmentArgs = {
  input: EquipmentDeleteMutationInput;
};

export type MutationDeleteEquipmentCategoryArgs = {
  input: EquipmentCategoryDeleteMutationInput;
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

export type MutationRequireHandlingForReservationArgs = {
  input: ReservationRequiresHandlingMutationInput;
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

/** An object with an ID */
export type Node = {
  /** The ID of the object */
  id: Scalars["ID"];
};

export type OpeningHoursType = {
  __typename?: "OpeningHoursType";
  openingTimePeriods?: Maybe<Array<Maybe<PeriodType>>>;
  openingTimes?: Maybe<Array<Maybe<OpeningTimesType>>>;
};

export type OpeningTimesType = {
  __typename?: "OpeningTimesType";
  date?: Maybe<Scalars["Date"]>;
  endTime?: Maybe<Scalars["Time"]>;
  periods?: Maybe<Array<Maybe<Scalars["Int"]>>>;
  startTime?: Maybe<Scalars["Time"]>;
  state?: Maybe<Scalars["String"]>;
};

/** The Relay compliant `PageInfo` type, containing data necessary to paginate this connection. */
export type PageInfo = {
  __typename?: "PageInfo";
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars["String"]>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars["Boolean"];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars["Boolean"];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars["String"]>;
};

export type PeriodType = {
  __typename?: "PeriodType";
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  endDate?: Maybe<Scalars["Date"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  periodId?: Maybe<Scalars["Int"]>;
  resourceState?: Maybe<Scalars["String"]>;
  startDate?: Maybe<Scalars["Date"]>;
  timeSpans?: Maybe<Array<Maybe<TimeSpanType>>>;
};

export type PurposeCreateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
};

export type PurposeCreateMutationPayload = {
  __typename?: "PurposeCreateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  purpose?: Maybe<PurposeType>;
};

export type PurposeType = Node & {
  __typename?: "PurposeType";
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type PurposeTypeConnection = {
  __typename?: "PurposeTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<PurposeTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `PurposeType` and its cursor. */
export type PurposeTypeEdge = {
  __typename?: "PurposeTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<PurposeType>;
};

export type PurposeUpdateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
};

export type PurposeUpdateMutationPayload = {
  __typename?: "PurposeUpdateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  purpose?: Maybe<PurposeType>;
};

export type Query = {
  __typename?: "Query";
  ageGroups?: Maybe<AgeGroupTypeConnection>;
  cities?: Maybe<CityTypeConnection>;
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
  purposes?: Maybe<PurposeTypeConnection>;
  reservationByPk?: Maybe<ReservationType>;
  reservationCancelReasons?: Maybe<ReservationCancelReasonTypeConnection>;
  reservationDenyReasons?: Maybe<ReservationDenyReasonTypeConnection>;
  reservationPurposes?: Maybe<ReservationPurposeTypeConnection>;
  reservationUnit?: Maybe<ReservationUnitType>;
  reservationUnitByPk?: Maybe<ReservationUnitByPkType>;
  reservationUnitCancellationRules?: Maybe<ReservationUnitCancellationRuleTypeConnection>;
  reservationUnitTypes?: Maybe<ReservationUnitTypeTypeConnection>;
  reservationUnits?: Maybe<ReservationUnitTypeConnection>;
  reservations?: Maybe<ReservationTypeConnection>;
  resource?: Maybe<ResourceType>;
  resourceByPk?: Maybe<ResourceType>;
  resources?: Maybe<ResourceTypeConnection>;
  space?: Maybe<SpaceType>;
  spaceByPk?: Maybe<SpaceType>;
  spaces?: Maybe<SpaceTypeConnection>;
  taxPercentages?: Maybe<TaxPercentageTypeConnection>;
  termsOfUse?: Maybe<TermsOfUseTypeConnection>;
  unit?: Maybe<UnitType>;
  unitByPk?: Maybe<UnitByPkType>;
  units?: Maybe<UnitTypeConnection>;
};

export type QueryAgeGroupsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryCitiesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryEquipmentArgs = {
  id: Scalars["ID"];
};

export type QueryEquipmentByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]>;
};

export type QueryEquipmentCategoriesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryEquipmentCategoryArgs = {
  id: Scalars["ID"];
};

export type QueryEquipmentCategoryByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]>;
};

export type QueryEquipmentsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryKeywordCategoriesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryKeywordGroupsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryKeywordsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryMetadataSetsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryPurposesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryReservationByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]>;
};

export type QueryReservationCancelReasonsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  reason?: InputMaybe<Scalars["String"]>;
};

export type QueryReservationDenyReasonsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  reason?: InputMaybe<Scalars["String"]>;
};

export type QueryReservationPurposesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryReservationUnitArgs = {
  id: Scalars["ID"];
};

export type QueryReservationUnitByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]>;
};

export type QueryReservationUnitCancellationRulesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  name?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryReservationUnitTypesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryReservationUnitsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]>;
  keywordGroups?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  last?: InputMaybe<Scalars["Int"]>;
  maxPersonsGte?: InputMaybe<Scalars["Float"]>;
  maxPersonsLte?: InputMaybe<Scalars["Float"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Scalars["String"]>;
  purposes?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  textSearch?: InputMaybe<Scalars["String"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
};

export type QueryReservationsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  begin?: InputMaybe<Scalars["DateTime"]>;
  end?: InputMaybe<Scalars["DateTime"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Scalars["String"]>;
  requested?: InputMaybe<Scalars["Boolean"]>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>;
};

export type QueryResourceArgs = {
  id: Scalars["ID"];
};

export type QueryResourceByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]>;
};

export type QueryResourcesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QuerySpaceArgs = {
  id: Scalars["ID"];
};

export type QuerySpaceByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]>;
};

export type QuerySpacesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QueryTaxPercentagesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  value?: InputMaybe<Scalars["Float"]>;
};

export type QueryTermsOfUseArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  termsType?: InputMaybe<Scalars["String"]>;
};

export type QueryUnitArgs = {
  id: Scalars["ID"];
};

export type QueryUnitByPkArgs = {
  pk?: InputMaybe<Scalars["Int"]>;
};

export type QueryUnitsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameEn_Icontains?: InputMaybe<Scalars["String"]>;
  nameEn_Istartswith?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameFi_Icontains?: InputMaybe<Scalars["String"]>;
  nameFi_Istartswith?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  nameSv_Icontains?: InputMaybe<Scalars["String"]>;
  nameSv_Istartswith?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type RealEstateType = Node & {
  __typename?: "RealEstateType";
  district?: Maybe<DistrictType>;
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  surfaceArea?: Maybe<Scalars["Decimal"]>;
};

export type RecurringReservationType = {
  __typename?: "RecurringReservationType";
  abilityGroup?: Maybe<AbilityGroupType>;
  ageGroup?: Maybe<AgeGroupType>;
  applicationEventPk?: Maybe<Scalars["Int"]>;
  applicationPk?: Maybe<Scalars["Int"]>;
  pk?: Maybe<Scalars["Int"]>;
  user?: Maybe<Scalars["String"]>;
};

export type ReservationApproveMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  /** Additional information for approval. */
  handlingDetails?: InputMaybe<Scalars["String"]>;
  pk?: InputMaybe<Scalars["Int"]>;
  /** The price of this particular reservation */
  price: Scalars["Float"];
};

export type ReservationApproveMutationPayload = {
  __typename?: "ReservationApproveMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** When this reservation was handled. */
  handledAt?: Maybe<Scalars["DateTime"]>;
  /** Additional information for approval. */
  handlingDetails?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  /** The price of this particular reservation */
  price?: Maybe<Scalars["Float"]>;
  state?: Maybe<State>;
};

export type ReservationCancelReasonType = Node & {
  __typename?: "ReservationCancelReasonType";
  /** The ID of the object */
  id: Scalars["ID"];
  pk?: Maybe<Scalars["Int"]>;
  reason: Scalars["String"];
  reasonEn?: Maybe<Scalars["String"]>;
  reasonFi?: Maybe<Scalars["String"]>;
  reasonSv?: Maybe<Scalars["String"]>;
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
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationCancelReasonType>;
};

export type ReservationCancellationMutationInput = {
  /** Additional information for the cancellation. */
  cancelDetails?: InputMaybe<Scalars["String"]>;
  /** Primary key for the pre-defined cancel reason. */
  cancelReasonPk: Scalars["Int"];
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
};

export type ReservationCancellationMutationPayload = {
  __typename?: "ReservationCancellationMutationPayload";
  /** Additional information for the cancellation. */
  cancelDetails?: Maybe<Scalars["String"]>;
  /** Primary key for the pre-defined cancel reason. */
  cancelReasonPk?: Maybe<Scalars["Int"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]>;
  state?: Maybe<State>;
};

export type ReservationConfirmMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
};

export type ReservationConfirmMutationPayload = {
  __typename?: "ReservationConfirmMutationPayload";
  ageGroupPk?: Maybe<Scalars["Int"]>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]>;
  begin?: Maybe<Scalars["DateTime"]>;
  billingAddressCity?: Maybe<Scalars["String"]>;
  billingAddressStreet?: Maybe<Scalars["String"]>;
  billingAddressZip?: Maybe<Scalars["String"]>;
  billingEmail?: Maybe<Scalars["String"]>;
  billingFirstName?: Maybe<Scalars["String"]>;
  billingLastName?: Maybe<Scalars["String"]>;
  billingPhone?: Maybe<Scalars["String"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]>;
  description?: Maybe<Scalars["String"]>;
  end?: Maybe<Scalars["DateTime"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  freeOfChargeReason?: Maybe<Scalars["String"]>;
  homeCityPk?: Maybe<Scalars["Int"]>;
  name?: Maybe<Scalars["String"]>;
  numPersons?: Maybe<Scalars["Int"]>;
  pk?: Maybe<Scalars["Int"]>;
  /** The price of this particular reservation */
  price?: Maybe<Scalars["Float"]>;
  priority?: Maybe<Scalars["Int"]>;
  purposePk?: Maybe<Scalars["Int"]>;
  reserveeAddressCity?: Maybe<Scalars["String"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]>;
  reserveeEmail?: Maybe<Scalars["String"]>;
  reserveeFirstName?: Maybe<Scalars["String"]>;
  /** Reservee's business or association identity code */
  reserveeId?: Maybe<Scalars["String"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]>;
  reserveeLastName?: Maybe<Scalars["String"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]>;
  reserveePhone?: Maybe<Scalars["String"]>;
  /** Type of the reservee. Possible values are BUSINESS, NONPROFIT, INDIVIDUAL. */
  reserveeType?: Maybe<Scalars["String"]>;
  /**
   * String value for ReservationType's ReservationState enum. Possible values are
   * CREATED, CANCELLED, REQUIRES_HANDLING, CONFIRMED, DENIED.
   */
  state?: Maybe<Scalars["String"]>;
  /** The value of the tax percentage for this particular reservation */
  taxPercentageValue?: Maybe<Scalars["Float"]>;
  /** The price of this particular reservation */
  unitPrice?: Maybe<Scalars["Float"]>;
};

export type ReservationCreateMutationInput = {
  ageGroupPk?: InputMaybe<Scalars["Int"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]>;
  begin: Scalars["DateTime"];
  billingAddressCity?: InputMaybe<Scalars["String"]>;
  billingAddressStreet?: InputMaybe<Scalars["String"]>;
  billingAddressZip?: InputMaybe<Scalars["String"]>;
  billingEmail?: InputMaybe<Scalars["String"]>;
  billingFirstName?: InputMaybe<Scalars["String"]>;
  billingLastName?: InputMaybe<Scalars["String"]>;
  billingPhone?: InputMaybe<Scalars["String"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Int"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Int"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  description?: InputMaybe<Scalars["String"]>;
  end: Scalars["DateTime"];
  freeOfChargeReason?: InputMaybe<Scalars["String"]>;
  homeCityPk?: InputMaybe<Scalars["Int"]>;
  name?: InputMaybe<Scalars["String"]>;
  numPersons?: InputMaybe<Scalars["Int"]>;
  priority?: InputMaybe<Scalars["Int"]>;
  purposePk?: InputMaybe<Scalars["Int"]>;
  reservationUnitPks: Array<InputMaybe<Scalars["Int"]>>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]>;
  /** Reservee's business or association identity code */
  reserveeId?: InputMaybe<Scalars["String"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]>;
  reserveePhone?: InputMaybe<Scalars["String"]>;
  /** Type of the reservee. Possible values are BUSINESS, NONPROFIT, INDIVIDUAL. */
  reserveeType?: InputMaybe<Scalars["String"]>;
};

export type ReservationCreateMutationPayload = {
  __typename?: "ReservationCreateMutationPayload";
  ageGroupPk?: Maybe<Scalars["Int"]>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]>;
  begin?: Maybe<Scalars["DateTime"]>;
  billingAddressCity?: Maybe<Scalars["String"]>;
  billingAddressStreet?: Maybe<Scalars["String"]>;
  billingAddressZip?: Maybe<Scalars["String"]>;
  billingEmail?: Maybe<Scalars["String"]>;
  billingFirstName?: Maybe<Scalars["String"]>;
  billingLastName?: Maybe<Scalars["String"]>;
  billingPhone?: Maybe<Scalars["String"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]>;
  description?: Maybe<Scalars["String"]>;
  end?: Maybe<Scalars["DateTime"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  freeOfChargeReason?: Maybe<Scalars["String"]>;
  homeCityPk?: Maybe<Scalars["Int"]>;
  name?: Maybe<Scalars["String"]>;
  numPersons?: Maybe<Scalars["Int"]>;
  pk?: Maybe<Scalars["Int"]>;
  /** The price of this particular reservation */
  price?: Maybe<Scalars["Float"]>;
  priority?: Maybe<Scalars["Int"]>;
  purposePk?: Maybe<Scalars["Int"]>;
  reservation?: Maybe<ReservationType>;
  reserveeAddressCity?: Maybe<Scalars["String"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]>;
  reserveeEmail?: Maybe<Scalars["String"]>;
  reserveeFirstName?: Maybe<Scalars["String"]>;
  /** Reservee's business or association identity code */
  reserveeId?: Maybe<Scalars["String"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]>;
  reserveeLastName?: Maybe<Scalars["String"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]>;
  reserveePhone?: Maybe<Scalars["String"]>;
  /** Type of the reservee. Possible values are BUSINESS, NONPROFIT, INDIVIDUAL. */
  reserveeType?: Maybe<Scalars["String"]>;
  /** Read only string value for ReservationType's ReservationState enum. */
  state?: Maybe<Scalars["String"]>;
  /** The value of the tax percentage for this particular reservation */
  taxPercentageValue?: Maybe<Scalars["Float"]>;
  /** The price of this particular reservation */
  unitPrice?: Maybe<Scalars["Float"]>;
};

export type ReservationDenyMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  /** Primary key for the pre-defined deny reason. */
  denyReasonPk: Scalars["Int"];
  /** Additional information for denying. */
  handlingDetails?: InputMaybe<Scalars["String"]>;
  pk?: InputMaybe<Scalars["Int"]>;
};

export type ReservationDenyMutationPayload = {
  __typename?: "ReservationDenyMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  /** Primary key for the pre-defined deny reason. */
  denyReasonPk?: Maybe<Scalars["Int"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** When this reservation was handled. */
  handledAt?: Maybe<Scalars["DateTime"]>;
  /** Additional information for denying. */
  handlingDetails?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  state?: Maybe<State>;
};

export type ReservationDenyReasonType = Node & {
  __typename?: "ReservationDenyReasonType";
  /** The ID of the object */
  id: Scalars["ID"];
  pk?: Maybe<Scalars["Int"]>;
  reason: Scalars["String"];
  reasonEn?: Maybe<Scalars["String"]>;
  reasonFi?: Maybe<Scalars["String"]>;
  reasonSv?: Maybe<Scalars["String"]>;
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
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationDenyReasonType>;
};

export type ReservationMetadataSetType = Node & {
  __typename?: "ReservationMetadataSetType";
  /** The ID of the object */
  id: Scalars["ID"];
  name: Scalars["String"];
  pk?: Maybe<Scalars["Int"]>;
  requiredFields?: Maybe<Array<Maybe<Scalars["String"]>>>;
  supportedFields?: Maybe<Array<Maybe<Scalars["String"]>>>;
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
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationMetadataSetType>;
};

export type ReservationPurposeType = Node & {
  __typename?: "ReservationPurposeType";
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
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
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationPurposeType>;
};

export type ReservationRequiresHandlingMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk?: InputMaybe<Scalars["Int"]>;
};

export type ReservationRequiresHandlingMutationPayload = {
  __typename?: "ReservationRequiresHandlingMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  pk?: Maybe<Scalars["Int"]>;
  state?: Maybe<State>;
};

export type ReservationType = Node & {
  __typename?: "ReservationType";
  ageGroup?: Maybe<AgeGroupType>;
  applyingForFreeOfCharge: Scalars["Boolean"];
  begin: Scalars["DateTime"];
  billingAddressCity: Scalars["String"];
  billingAddressStreet: Scalars["String"];
  billingAddressZip: Scalars["String"];
  billingEmail?: Maybe<Scalars["String"]>;
  billingFirstName: Scalars["String"];
  billingLastName: Scalars["String"];
  billingPhone: Scalars["String"];
  bufferTimeAfter?: Maybe<Scalars["Duration"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]>;
  calendarUrl?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  end: Scalars["DateTime"];
  freeOfChargeReason?: Maybe<Scalars["String"]>;
  /** Home city of the group or association */
  homeCity?: Maybe<CityType>;
  /** The ID of the object */
  id: Scalars["ID"];
  name?: Maybe<Scalars["String"]>;
  numPersons?: Maybe<Scalars["Int"]>;
  pk?: Maybe<Scalars["Int"]>;
  price?: Maybe<Scalars["Float"]>;
  priority: ReservationsReservationPriorityChoices;
  purpose?: Maybe<ReservationPurposeType>;
  recurringReservation?: Maybe<RecurringReservationType>;
  reservationUnits?: Maybe<Array<Maybe<ReservationUnitType>>>;
  reserveeAddressCity: Scalars["String"];
  reserveeAddressStreet: Scalars["String"];
  reserveeAddressZip: Scalars["String"];
  reserveeEmail?: Maybe<Scalars["String"]>;
  reserveeFirstName?: Maybe<Scalars["String"]>;
  /** Reservee's business or association identity code */
  reserveeId: Scalars["String"];
  reserveeIsUnregisteredAssociation: Scalars["Boolean"];
  reserveeLastName?: Maybe<Scalars["String"]>;
  reserveeOrganisationName: Scalars["String"];
  reserveePhone?: Maybe<Scalars["String"]>;
  /** Type of reservee */
  reserveeType?: Maybe<ReservationsReservationReserveeTypeChoices>;
  state: ReservationsReservationStateChoices;
  taxPercentageValue?: Maybe<Scalars["Decimal"]>;
  unitPrice?: Maybe<Scalars["Float"]>;
  user?: Maybe<Scalars["String"]>;
  /** Working memo for staff users. */
  workingMemo?: Maybe<Scalars["String"]>;
};

export type ReservationTypeConnection = {
  __typename?: "ReservationTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]>;
};

/** A Relay edge containing a `ReservationType` and its cursor. */
export type ReservationTypeEdge = {
  __typename?: "ReservationTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationType>;
};

export type ReservationUnitByPkType = Node & {
  __typename?: "ReservationUnitByPkType";
  additionalInstructionsEn?: Maybe<Scalars["String"]>;
  additionalInstructionsFi?: Maybe<Scalars["String"]>;
  additionalInstructionsSv?: Maybe<Scalars["String"]>;
  applicationRounds?: Maybe<Array<Maybe<ApplicationRoundType>>>;
  /** Authentication required for reserving this reservation unit. */
  authentication: ReservationUnitsReservationUnitAuthenticationChoices;
  bufferTimeAfter?: Maybe<Scalars["Duration"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]>;
  cancellationRule?: Maybe<ReservationUnitCancellationRuleType>;
  cancellationTerms?: Maybe<TermsOfUseType>;
  contactInformation: Scalars["String"];
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  equipment?: Maybe<Array<Maybe<EquipmentType>>>;
  haukiUrl?: Maybe<ReservationUnitHaukiUrlType>;
  /** Maximum price of the reservation unit */
  highestPrice: Scalars["Decimal"];
  /** The ID of the object */
  id: Scalars["ID"];
  images?: Maybe<Array<Maybe<ReservationUnitImageType>>>;
  isDraft: Scalars["Boolean"];
  keywordGroups?: Maybe<Array<Maybe<KeywordGroupType>>>;
  location?: Maybe<LocationType>;
  /** Minimum price of the reservation unit */
  lowestPrice: Scalars["Decimal"];
  maxPersons?: Maybe<Scalars["Int"]>;
  maxReservationDuration?: Maybe<Scalars["Duration"]>;
  maxReservationsPerUser?: Maybe<Scalars["Int"]>;
  metadataSet?: Maybe<ReservationMetadataSetType>;
  minReservationDuration?: Maybe<Scalars["Duration"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  nextAvailableSlot?: Maybe<Scalars["DateTime"]>;
  openingHours?: Maybe<OpeningHoursType>;
  paymentTerms?: Maybe<TermsOfUseType>;
  pk?: Maybe<Scalars["Int"]>;
  /** Unit of the price */
  priceUnit: ReservationUnitsReservationUnitPriceUnitChoices;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: Maybe<Scalars["DateTime"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: Maybe<Scalars["DateTime"]>;
  purposes?: Maybe<Array<Maybe<PurposeType>>>;
  requireIntroduction: Scalars["Boolean"];
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling: Scalars["Boolean"];
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: Maybe<Scalars["DateTime"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: Maybe<Scalars["DateTime"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 15, 30, 60, or
   * 90. Possible values are interval_15_mins, interval_30_mins, interval_60_mins,
   * interval_90_mins.
   */
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices;
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservations?: Maybe<Array<Maybe<ReservationType>>>;
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  serviceSpecificTerms?: Maybe<TermsOfUseType>;
  services?: Maybe<Array<Maybe<ServiceType>>>;
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  surfaceArea?: Maybe<Scalars["Decimal"]>;
  taxPercentage?: Maybe<TaxPercentageType>;
  termsOfUseEn?: Maybe<Scalars["String"]>;
  termsOfUseFi?: Maybe<Scalars["String"]>;
  termsOfUseSv?: Maybe<Scalars["String"]>;
  unit?: Maybe<UnitType>;
  uuid: Scalars["UUID"];
};

export type ReservationUnitByPkTypeApplicationRoundsArgs = {
  active?: InputMaybe<Scalars["Boolean"]>;
};

export type ReservationUnitByPkTypeOpeningHoursArgs = {
  endDate?: InputMaybe<Scalars["Date"]>;
  openingTimes?: InputMaybe<Scalars["Boolean"]>;
  periods?: InputMaybe<Scalars["Boolean"]>;
  startDate?: InputMaybe<Scalars["Date"]>;
};

export type ReservationUnitByPkTypeReservationsArgs = {
  from?: InputMaybe<Scalars["Date"]>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>;
  to?: InputMaybe<Scalars["Date"]>;
};

export type ReservationUnitByPkTypeConnection = {
  __typename?: "ReservationUnitByPkTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitByPkTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ReservationUnitByPkType` and its cursor. */
export type ReservationUnitByPkTypeEdge = {
  __typename?: "ReservationUnitByPkTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitByPkType>;
};

export type ReservationUnitCancellationRuleType = Node & {
  __typename?: "ReservationUnitCancellationRuleType";
  /** Seconds before reservations related to this cancellation rule can be cancelled without handling. */
  canBeCancelledTimeBefore?: Maybe<Scalars["Float"]>;
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  needsHandling: Scalars["Boolean"];
  pk?: Maybe<Scalars["Int"]>;
};

export type ReservationUnitCancellationRuleTypeConnection = {
  __typename?: "ReservationUnitCancellationRuleTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitCancellationRuleTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ReservationUnitCancellationRuleType` and its cursor. */
export type ReservationUnitCancellationRuleTypeEdge = {
  __typename?: "ReservationUnitCancellationRuleTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitCancellationRuleType>;
};

export type ReservationUnitCreateMutationInput = {
  additionalInstructionsEn?: InputMaybe<Scalars["String"]>;
  additionalInstructionsFi?: InputMaybe<Scalars["String"]>;
  additionalInstructionsSv?: InputMaybe<Scalars["String"]>;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: InputMaybe<Scalars["String"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Int"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Int"]>;
  cancellationRulePk?: InputMaybe<Scalars["Int"]>;
  cancellationTermsPk?: InputMaybe<Scalars["String"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  /** Contact information for this reservation unit. */
  contactInformation?: InputMaybe<Scalars["String"]>;
  descriptionEn?: InputMaybe<Scalars["String"]>;
  descriptionFi?: InputMaybe<Scalars["String"]>;
  descriptionSv?: InputMaybe<Scalars["String"]>;
  equipmentPks?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>;
  /** Maximum price of the reservation unit */
  highestPrice?: InputMaybe<Scalars["Float"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]>;
  /** Minimum price of the reservation unit */
  lowestPrice?: InputMaybe<Scalars["Float"]>;
  maxPersons?: InputMaybe<Scalars["Int"]>;
  maxReservationDuration?: InputMaybe<Scalars["Int"]>;
  maxReservationsPerUser?: InputMaybe<Scalars["Int"]>;
  metadataSetPk?: InputMaybe<Scalars["Int"]>;
  minReservationDuration?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  paymentTermsPk?: InputMaybe<Scalars["String"]>;
  /** Unit of the price. Possible values are PER_15_MINS, PER_30_MINS, PER_HOUR, PER_HALF_DAY, PER_DAY, PER_WEEK, FIXED. */
  priceUnit?: InputMaybe<Scalars["String"]>;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: InputMaybe<Scalars["DateTime"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: InputMaybe<Scalars["DateTime"]>;
  purposePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: InputMaybe<Scalars["Boolean"]>;
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling?: InputMaybe<Scalars["Boolean"]>;
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: InputMaybe<Scalars["DateTime"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: InputMaybe<Scalars["DateTime"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or
   * 45. Possible values are INTERVAL_15_MINS, INTERVAL_30_MINS, INTERVAL_60_MINS,
   * INTERVAL_90_MINS.
   */
  reservationStartInterval?: InputMaybe<Scalars["String"]>;
  reservationUnitTypePk?: InputMaybe<Scalars["Int"]>;
  resourcePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>;
  servicePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>;
  serviceSpecificTermsPk?: InputMaybe<Scalars["String"]>;
  spacePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>;
  surfaceArea?: InputMaybe<Scalars["Float"]>;
  taxPercentagePk?: InputMaybe<Scalars["Int"]>;
  termsOfUseEn?: InputMaybe<Scalars["String"]>;
  termsOfUseFi?: InputMaybe<Scalars["String"]>;
  termsOfUseSv?: InputMaybe<Scalars["String"]>;
  unitPk?: InputMaybe<Scalars["Int"]>;
};

export type ReservationUnitCreateMutationPayload = {
  __typename?: "ReservationUnitCreateMutationPayload";
  additionalInstructionsEn?: Maybe<Scalars["String"]>;
  additionalInstructionsFi?: Maybe<Scalars["String"]>;
  additionalInstructionsSv?: Maybe<Scalars["String"]>;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: Maybe<Scalars["String"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]>;
  building?: Maybe<Scalars["String"]>;
  cancellationRulePk?: Maybe<Scalars["Int"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
  /** Contact information for this reservation unit. */
  contactInformation?: Maybe<Scalars["String"]>;
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Maximum price of the reservation unit */
  highestPrice?: Maybe<Scalars["Float"]>;
  /** Images of the reservation unit as nested related objects.  */
  images?: Maybe<Array<Maybe<ReservationUnitImageType>>>;
  isDraft?: Maybe<Scalars["Boolean"]>;
  /** Location of this reservation unit. Dynamically determined from spaces of the reservation unit. */
  location?: Maybe<Scalars["String"]>;
  /** Minimum price of the reservation unit */
  lowestPrice?: Maybe<Scalars["Float"]>;
  maxPersons?: Maybe<Scalars["Int"]>;
  maxReservationDuration?: Maybe<Scalars["Int"]>;
  maxReservationsPerUser?: Maybe<Scalars["Int"]>;
  minReservationDuration?: Maybe<Scalars["Int"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  /** Unit of the price. Possible values are PER_15_MINS, PER_30_MINS, PER_HOUR, PER_HALF_DAY, PER_DAY, PER_WEEK, FIXED. */
  priceUnit?: Maybe<Scalars["String"]>;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: Maybe<Scalars["DateTime"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: Maybe<Scalars["DateTime"]>;
  purposes?: Maybe<Array<Maybe<ReservationPurposeType>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: Maybe<Scalars["Boolean"]>;
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling?: Maybe<Scalars["Boolean"]>;
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: Maybe<Scalars["DateTime"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: Maybe<Scalars["DateTime"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or
   * 45. Possible values are INTERVAL_15_MINS, INTERVAL_30_MINS, INTERVAL_60_MINS,
   * INTERVAL_90_MINS.
   */
  reservationStartInterval?: Maybe<Scalars["String"]>;
  reservationUnit?: Maybe<ReservationUnitType>;
  /** Type of the reservation unit as nested related object. */
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservationUnitTypePk?: Maybe<Scalars["Int"]>;
  /** Resources included in the reservation unit as nested related objects. */
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  /** Services included in the reservation unit as nested related objects. */
  services?: Maybe<Array<Maybe<ServiceType>>>;
  /** Spaces included in the reservation unit as nested related objects. */
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  surfaceArea?: Maybe<Scalars["Float"]>;
  termsOfUseEn?: Maybe<Scalars["String"]>;
  termsOfUseFi?: Maybe<Scalars["String"]>;
  termsOfUseSv?: Maybe<Scalars["String"]>;
  unitPk?: Maybe<Scalars["Int"]>;
  uuid?: Maybe<Scalars["String"]>;
};

export type ReservationUnitHaukiUrlType = {
  __typename?: "ReservationUnitHaukiUrlType";
  url?: Maybe<Scalars["String"]>;
};

export type ReservationUnitImageCreateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  image?: InputMaybe<Scalars["Upload"]>;
  /** Type of image. Value is one of image_type enum values: MAIN, GROUND_PLAN, MAP, OTHER. */
  imageType: Scalars["String"];
  reservationUnitPk: Scalars["Int"];
};

export type ReservationUnitImageCreateMutationPayload = {
  __typename?: "ReservationUnitImageCreateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Type of image. Value is one of image_type enum values: MAIN, GROUND_PLAN, MAP, OTHER. */
  imageType?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  reservationUnitImage?: Maybe<ReservationUnitImageType>;
  reservationUnitPk?: Maybe<Scalars["Int"]>;
};

export type ReservationUnitImageDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
};

export type ReservationUnitImageDeleteMutationPayload = {
  __typename?: "ReservationUnitImageDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  deleted?: Maybe<Scalars["Boolean"]>;
  errors?: Maybe<Scalars["String"]>;
};

export type ReservationUnitImageType = {
  __typename?: "ReservationUnitImageType";
  imageType: ReservationUnitsReservationUnitImageImageTypeChoices;
  imageUrl?: Maybe<Scalars["String"]>;
  mediumUrl?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  smallUrl?: Maybe<Scalars["String"]>;
};

export type ReservationUnitImageUpdateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  /** Type of image. Value is one of image_type enum values: MAIN, GROUND_PLAN, MAP, OTHER. */
  imageType?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
};

export type ReservationUnitImageUpdateMutationPayload = {
  __typename?: "ReservationUnitImageUpdateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Type of image. Value is one of image_type enum values: MAIN, GROUND_PLAN, MAP, OTHER. */
  imageType?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  reservationUnitImage?: Maybe<ReservationUnitImageType>;
  reservationUnitPk?: Maybe<Scalars["Int"]>;
};

export type ReservationUnitType = Node & {
  __typename?: "ReservationUnitType";
  additionalInstructionsEn?: Maybe<Scalars["String"]>;
  additionalInstructionsFi?: Maybe<Scalars["String"]>;
  additionalInstructionsSv?: Maybe<Scalars["String"]>;
  applicationRounds?: Maybe<Array<Maybe<ApplicationRoundType>>>;
  /** Authentication required for reserving this reservation unit. */
  authentication: ReservationUnitsReservationUnitAuthenticationChoices;
  bufferTimeAfter?: Maybe<Scalars["Duration"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]>;
  cancellationRule?: Maybe<ReservationUnitCancellationRuleType>;
  cancellationTerms?: Maybe<TermsOfUseType>;
  contactInformation: Scalars["String"];
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  equipment?: Maybe<Array<Maybe<EquipmentType>>>;
  /** Maximum price of the reservation unit */
  highestPrice: Scalars["Decimal"];
  /** The ID of the object */
  id: Scalars["ID"];
  images?: Maybe<Array<Maybe<ReservationUnitImageType>>>;
  isDraft: Scalars["Boolean"];
  keywordGroups?: Maybe<Array<Maybe<KeywordGroupType>>>;
  location?: Maybe<LocationType>;
  /** Minimum price of the reservation unit */
  lowestPrice: Scalars["Decimal"];
  maxPersons?: Maybe<Scalars["Int"]>;
  maxReservationDuration?: Maybe<Scalars["Duration"]>;
  maxReservationsPerUser?: Maybe<Scalars["Int"]>;
  metadataSet?: Maybe<ReservationMetadataSetType>;
  minReservationDuration?: Maybe<Scalars["Duration"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  paymentTerms?: Maybe<TermsOfUseType>;
  pk?: Maybe<Scalars["Int"]>;
  /** Unit of the price */
  priceUnit: ReservationUnitsReservationUnitPriceUnitChoices;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: Maybe<Scalars["DateTime"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: Maybe<Scalars["DateTime"]>;
  purposes?: Maybe<Array<Maybe<PurposeType>>>;
  requireIntroduction: Scalars["Boolean"];
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling: Scalars["Boolean"];
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: Maybe<Scalars["DateTime"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: Maybe<Scalars["DateTime"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 15, 30, 60, or
   * 90. Possible values are interval_15_mins, interval_30_mins, interval_60_mins,
   * interval_90_mins.
   */
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices;
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservations?: Maybe<Array<Maybe<ReservationType>>>;
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  serviceSpecificTerms?: Maybe<TermsOfUseType>;
  services?: Maybe<Array<Maybe<ServiceType>>>;
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  surfaceArea?: Maybe<Scalars["Decimal"]>;
  taxPercentage?: Maybe<TaxPercentageType>;
  termsOfUseEn?: Maybe<Scalars["String"]>;
  termsOfUseFi?: Maybe<Scalars["String"]>;
  termsOfUseSv?: Maybe<Scalars["String"]>;
  unit?: Maybe<UnitType>;
  uuid: Scalars["UUID"];
};

export type ReservationUnitTypeApplicationRoundsArgs = {
  active?: InputMaybe<Scalars["Boolean"]>;
};

export type ReservationUnitTypeReservationsArgs = {
  from?: InputMaybe<Scalars["Date"]>;
  state?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>;
  to?: InputMaybe<Scalars["Date"]>;
};

export type ReservationUnitTypeConnection = {
  __typename?: "ReservationUnitTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ReservationUnitType` and its cursor. */
export type ReservationUnitTypeEdge = {
  __typename?: "ReservationUnitTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitType>;
};

export type ReservationUnitTypeType = Node & {
  __typename?: "ReservationUnitTypeType";
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type ReservationUnitTypeTypeConnection = {
  __typename?: "ReservationUnitTypeTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitTypeTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ReservationUnitTypeType` and its cursor. */
export type ReservationUnitTypeTypeEdge = {
  __typename?: "ReservationUnitTypeTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitTypeType>;
};

export type ReservationUnitUpdateMutationInput = {
  additionalInstructionsEn?: InputMaybe<Scalars["String"]>;
  additionalInstructionsFi?: InputMaybe<Scalars["String"]>;
  additionalInstructionsSv?: InputMaybe<Scalars["String"]>;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: InputMaybe<Scalars["String"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Int"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Int"]>;
  cancellationRulePk?: InputMaybe<Scalars["Int"]>;
  cancellationTermsPk?: InputMaybe<Scalars["String"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  /** Contact information for this reservation unit. */
  contactInformation?: InputMaybe<Scalars["String"]>;
  descriptionEn?: InputMaybe<Scalars["String"]>;
  descriptionFi?: InputMaybe<Scalars["String"]>;
  descriptionSv?: InputMaybe<Scalars["String"]>;
  equipmentPks?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>;
  /** Maximum price of the reservation unit */
  highestPrice?: InputMaybe<Scalars["Float"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]>;
  /** Minimum price of the reservation unit */
  lowestPrice?: InputMaybe<Scalars["Float"]>;
  maxPersons?: InputMaybe<Scalars["Int"]>;
  maxReservationDuration?: InputMaybe<Scalars["Int"]>;
  maxReservationsPerUser?: InputMaybe<Scalars["Int"]>;
  metadataSetPk?: InputMaybe<Scalars["Int"]>;
  minReservationDuration?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  paymentTermsPk?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
  /** Unit of the price. Possible values are PER_15_MINS, PER_30_MINS, PER_HOUR, PER_HALF_DAY, PER_DAY, PER_WEEK, FIXED. */
  priceUnit?: InputMaybe<Scalars["String"]>;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: InputMaybe<Scalars["DateTime"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: InputMaybe<Scalars["DateTime"]>;
  purposePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: InputMaybe<Scalars["Boolean"]>;
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling?: InputMaybe<Scalars["Boolean"]>;
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: InputMaybe<Scalars["DateTime"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: InputMaybe<Scalars["DateTime"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or
   * 45. Possible values are INTERVAL_15_MINS, INTERVAL_30_MINS, INTERVAL_60_MINS,
   * INTERVAL_90_MINS.
   */
  reservationStartInterval?: InputMaybe<Scalars["String"]>;
  reservationUnitTypePk?: InputMaybe<Scalars["Int"]>;
  resourcePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>;
  servicePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>;
  serviceSpecificTermsPk?: InputMaybe<Scalars["String"]>;
  spacePks?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>;
  surfaceArea?: InputMaybe<Scalars["Float"]>;
  taxPercentagePk?: InputMaybe<Scalars["Int"]>;
  termsOfUseEn?: InputMaybe<Scalars["String"]>;
  termsOfUseFi?: InputMaybe<Scalars["String"]>;
  termsOfUseSv?: InputMaybe<Scalars["String"]>;
  unitPk?: InputMaybe<Scalars["Int"]>;
};

export type ReservationUnitUpdateMutationPayload = {
  __typename?: "ReservationUnitUpdateMutationPayload";
  additionalInstructionsEn?: Maybe<Scalars["String"]>;
  additionalInstructionsFi?: Maybe<Scalars["String"]>;
  additionalInstructionsSv?: Maybe<Scalars["String"]>;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: Maybe<Scalars["String"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]>;
  building?: Maybe<Scalars["String"]>;
  cancellationRulePk?: Maybe<Scalars["Int"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
  /** Contact information for this reservation unit. */
  contactInformation?: Maybe<Scalars["String"]>;
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Maximum price of the reservation unit */
  highestPrice?: Maybe<Scalars["Float"]>;
  /** Images of the reservation unit as nested related objects.  */
  images?: Maybe<Array<Maybe<ReservationUnitImageType>>>;
  isDraft?: Maybe<Scalars["Boolean"]>;
  /** Location of this reservation unit. Dynamically determined from spaces of the reservation unit. */
  location?: Maybe<Scalars["String"]>;
  /** Minimum price of the reservation unit */
  lowestPrice?: Maybe<Scalars["Float"]>;
  maxPersons?: Maybe<Scalars["Int"]>;
  maxReservationDuration?: Maybe<Scalars["Int"]>;
  maxReservationsPerUser?: Maybe<Scalars["Int"]>;
  minReservationDuration?: Maybe<Scalars["Int"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  /** Unit of the price. Possible values are PER_15_MINS, PER_30_MINS, PER_HOUR, PER_HALF_DAY, PER_DAY, PER_WEEK, FIXED. */
  priceUnit?: Maybe<Scalars["String"]>;
  /** Time after this reservation unit should be publicly visible in UI. */
  publishBegins?: Maybe<Scalars["DateTime"]>;
  /** Time after this reservation unit should not be publicly visible in UI. */
  publishEnds?: Maybe<Scalars["DateTime"]>;
  purposes?: Maybe<Array<Maybe<ReservationPurposeType>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: Maybe<Scalars["Boolean"]>;
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling?: Maybe<Scalars["Boolean"]>;
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: Maybe<Scalars["DateTime"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: Maybe<Scalars["DateTime"]>;
  /**
   * Determines the interval for the start time of the reservation. For example an
   * interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or
   * 45. Possible values are INTERVAL_15_MINS, INTERVAL_30_MINS, INTERVAL_60_MINS,
   * INTERVAL_90_MINS.
   */
  reservationStartInterval?: Maybe<Scalars["String"]>;
  reservationUnit?: Maybe<ReservationUnitType>;
  /** Type of the reservation unit as nested related object. */
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservationUnitTypePk?: Maybe<Scalars["Int"]>;
  /** Resources included in the reservation unit as nested related objects. */
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  /** Services included in the reservation unit as nested related objects. */
  services?: Maybe<Array<Maybe<ServiceType>>>;
  /** Spaces included in the reservation unit as nested related objects. */
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  surfaceArea?: Maybe<Scalars["Float"]>;
  termsOfUseEn?: Maybe<Scalars["String"]>;
  termsOfUseFi?: Maybe<Scalars["String"]>;
  termsOfUseSv?: Maybe<Scalars["String"]>;
  unitPk?: Maybe<Scalars["Int"]>;
  uuid?: Maybe<Scalars["String"]>;
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
export enum ReservationUnitsReservationUnitPriceUnitChoices {
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
  ageGroupPk?: InputMaybe<Scalars["Int"]>;
  applyingForFreeOfCharge?: InputMaybe<Scalars["Boolean"]>;
  begin?: InputMaybe<Scalars["DateTime"]>;
  billingAddressCity?: InputMaybe<Scalars["String"]>;
  billingAddressStreet?: InputMaybe<Scalars["String"]>;
  billingAddressZip?: InputMaybe<Scalars["String"]>;
  billingEmail?: InputMaybe<Scalars["String"]>;
  billingFirstName?: InputMaybe<Scalars["String"]>;
  billingLastName?: InputMaybe<Scalars["String"]>;
  billingPhone?: InputMaybe<Scalars["String"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Int"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Int"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  description?: InputMaybe<Scalars["String"]>;
  end?: InputMaybe<Scalars["DateTime"]>;
  freeOfChargeReason?: InputMaybe<Scalars["String"]>;
  homeCityPk?: InputMaybe<Scalars["Int"]>;
  name?: InputMaybe<Scalars["String"]>;
  numPersons?: InputMaybe<Scalars["Int"]>;
  pk: Scalars["Int"];
  priority?: InputMaybe<Scalars["Int"]>;
  purposePk?: InputMaybe<Scalars["Int"]>;
  reservationUnitPks?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>;
  reserveeAddressCity?: InputMaybe<Scalars["String"]>;
  reserveeAddressStreet?: InputMaybe<Scalars["String"]>;
  reserveeAddressZip?: InputMaybe<Scalars["String"]>;
  reserveeEmail?: InputMaybe<Scalars["String"]>;
  reserveeFirstName?: InputMaybe<Scalars["String"]>;
  /** Reservee's business or association identity code */
  reserveeId?: InputMaybe<Scalars["String"]>;
  reserveeIsUnregisteredAssociation?: InputMaybe<Scalars["Boolean"]>;
  reserveeLastName?: InputMaybe<Scalars["String"]>;
  reserveeOrganisationName?: InputMaybe<Scalars["String"]>;
  reserveePhone?: InputMaybe<Scalars["String"]>;
  /** Type of the reservee. Possible values are BUSINESS, NONPROFIT, INDIVIDUAL. */
  reserveeType?: InputMaybe<Scalars["String"]>;
  /**
   * String value for ReservationType's ReservationState enum. Possible values are
   * CREATED, CANCELLED, REQUIRES_HANDLING, CONFIRMED, DENIED.
   */
  state?: InputMaybe<Scalars["String"]>;
};

export type ReservationUpdateMutationPayload = {
  __typename?: "ReservationUpdateMutationPayload";
  ageGroupPk?: Maybe<Scalars["Int"]>;
  applyingForFreeOfCharge?: Maybe<Scalars["Boolean"]>;
  begin?: Maybe<Scalars["DateTime"]>;
  billingAddressCity?: Maybe<Scalars["String"]>;
  billingAddressStreet?: Maybe<Scalars["String"]>;
  billingAddressZip?: Maybe<Scalars["String"]>;
  billingEmail?: Maybe<Scalars["String"]>;
  billingFirstName?: Maybe<Scalars["String"]>;
  billingLastName?: Maybe<Scalars["String"]>;
  billingPhone?: Maybe<Scalars["String"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
  confirmedAt?: Maybe<Scalars["DateTime"]>;
  description?: Maybe<Scalars["String"]>;
  end?: Maybe<Scalars["DateTime"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  freeOfChargeReason?: Maybe<Scalars["String"]>;
  homeCityPk?: Maybe<Scalars["Int"]>;
  name?: Maybe<Scalars["String"]>;
  numPersons?: Maybe<Scalars["Int"]>;
  pk?: Maybe<Scalars["Int"]>;
  /** The price of this particular reservation */
  price?: Maybe<Scalars["Float"]>;
  priority?: Maybe<Scalars["Int"]>;
  purposePk?: Maybe<Scalars["Int"]>;
  reservation?: Maybe<ReservationType>;
  reserveeAddressCity?: Maybe<Scalars["String"]>;
  reserveeAddressStreet?: Maybe<Scalars["String"]>;
  reserveeAddressZip?: Maybe<Scalars["String"]>;
  reserveeEmail?: Maybe<Scalars["String"]>;
  reserveeFirstName?: Maybe<Scalars["String"]>;
  /** Reservee's business or association identity code */
  reserveeId?: Maybe<Scalars["String"]>;
  reserveeIsUnregisteredAssociation?: Maybe<Scalars["Boolean"]>;
  reserveeLastName?: Maybe<Scalars["String"]>;
  reserveeOrganisationName?: Maybe<Scalars["String"]>;
  reserveePhone?: Maybe<Scalars["String"]>;
  /** Type of the reservee. Possible values are BUSINESS, NONPROFIT, INDIVIDUAL. */
  reserveeType?: Maybe<Scalars["String"]>;
  /**
   * String value for ReservationType's ReservationState enum. Possible values are
   * CREATED, CANCELLED, REQUIRES_HANDLING, CONFIRMED, DENIED.
   */
  state?: Maybe<Scalars["String"]>;
  /** The value of the tax percentage for this particular reservation */
  taxPercentageValue?: Maybe<Scalars["Float"]>;
  /** The price of this particular reservation */
  unitPrice?: Maybe<Scalars["Float"]>;
};

export type ReservationWorkingMemoMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  /** Primary key of the reservation */
  pk?: InputMaybe<Scalars["Int"]>;
  /** Working memo for staff users. */
  workingMemo?: InputMaybe<Scalars["String"]>;
};

export type ReservationWorkingMemoMutationPayload = {
  __typename?: "ReservationWorkingMemoMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  /** Primary key of the reservation */
  pk?: Maybe<Scalars["Int"]>;
  /** Working memo for staff users. */
  workingMemo?: Maybe<Scalars["String"]>;
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
  /** cancelled */
  Cancelled = "CANCELLED",
  /** confirmed */
  Confirmed = "CONFIRMED",
  /** created */
  Created = "CREATED",
  /** denied */
  Denied = "DENIED",
  /** requires_handling */
  RequiresHandling = "REQUIRES_HANDLING",
}

export type ResourceCreateMutationInput = {
  /**
   * Buffer time while reservation unit is unreservable after the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeAfter?: InputMaybe<Scalars["Int"]>;
  /**
   * Buffer time while reservation unit is unreservable before the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeBefore?: InputMaybe<Scalars["Int"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  descriptionEn?: InputMaybe<Scalars["String"]>;
  descriptionFi?: InputMaybe<Scalars["String"]>;
  descriptionSv?: InputMaybe<Scalars["String"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]>;
  locationType?: InputMaybe<Scalars["String"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  /** PK of the related space for this resource. */
  spacePk?: InputMaybe<Scalars["Int"]>;
};

export type ResourceCreateMutationPayload = {
  __typename?: "ResourceCreateMutationPayload";
  /**
   * Buffer time while reservation unit is unreservable after the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeAfter?: Maybe<Scalars["Int"]>;
  /**
   * Buffer time while reservation unit is unreservable before the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeBefore?: Maybe<Scalars["Int"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  isDraft?: Maybe<Scalars["Boolean"]>;
  locationType?: Maybe<Scalars["String"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  resource?: Maybe<ResourceType>;
  /** PK of the related space for this resource. */
  spacePk?: Maybe<Scalars["Int"]>;
};

export type ResourceDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
};

export type ResourceDeleteMutationPayload = {
  __typename?: "ResourceDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  deleted?: Maybe<Scalars["Boolean"]>;
  errors?: Maybe<Scalars["String"]>;
};

export type ResourceType = Node & {
  __typename?: "ResourceType";
  bufferTimeAfter?: Maybe<Scalars["Duration"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]>;
  building?: Maybe<Array<Maybe<BuildingType>>>;
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  /** The ID of the object */
  id: Scalars["ID"];
  isDraft: Scalars["Boolean"];
  locationType: ResourcesResourceLocationTypeChoices;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  space?: Maybe<SpaceType>;
};

export type ResourceTypeConnection = {
  __typename?: "ResourceTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ResourceTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ResourceType` and its cursor. */
export type ResourceTypeEdge = {
  __typename?: "ResourceTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ResourceType>;
};

export type ResourceUpdateMutationInput = {
  /**
   * Buffer time while reservation unit is unreservable after the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeAfter?: InputMaybe<Scalars["Int"]>;
  /**
   * Buffer time while reservation unit is unreservable before the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeBefore?: InputMaybe<Scalars["Int"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  descriptionEn?: InputMaybe<Scalars["String"]>;
  descriptionFi?: InputMaybe<Scalars["String"]>;
  descriptionSv?: InputMaybe<Scalars["String"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]>;
  locationType?: InputMaybe<Scalars["String"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
  /** PK of the related space for this resource. */
  spacePk?: InputMaybe<Scalars["Int"]>;
};

export type ResourceUpdateMutationPayload = {
  __typename?: "ResourceUpdateMutationPayload";
  /**
   * Buffer time while reservation unit is unreservable after the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeAfter?: Maybe<Scalars["Int"]>;
  /**
   * Buffer time while reservation unit is unreservable before the reservation.
   * Dynamically calculated from spaces and resources.
   */
  bufferTimeBefore?: Maybe<Scalars["Int"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  isDraft?: Maybe<Scalars["Boolean"]>;
  locationType?: Maybe<Scalars["String"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  resource?: Maybe<ResourceType>;
  /** PK of the related space for this resource. */
  spacePk?: Maybe<Scalars["Int"]>;
};

/** An enumeration. */
export enum ResourcesResourceLocationTypeChoices {
  /** Fixed */
  Fixed = "FIXED",
  /** Movable */
  Movable = "MOVABLE",
}

export type ServiceType = Node & {
  __typename?: "ServiceType";
  bufferTimeAfter?: Maybe<Scalars["Duration"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]>;
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
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
  clientMutationId?: InputMaybe<Scalars["String"]>;
  code?: InputMaybe<Scalars["String"]>;
  /** PK of the district for this space. */
  districtPk?: InputMaybe<Scalars["Int"]>;
  maxPersons?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi: Scalars["String"];
  nameSv?: InputMaybe<Scalars["String"]>;
  /** PK of the parent space for this space. */
  parentPk?: InputMaybe<Scalars["Int"]>;
  /** Surface area of the space as square meters */
  surfaceArea?: InputMaybe<Scalars["Float"]>;
  unitPk?: InputMaybe<Scalars["Int"]>;
};

export type SpaceCreateMutationPayload = {
  __typename?: "SpaceCreateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  code?: Maybe<Scalars["String"]>;
  /** PK of the district for this space. */
  districtPk?: Maybe<Scalars["Int"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  maxPersons?: Maybe<Scalars["Int"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  /** PK of the parent space for this space. */
  parentPk?: Maybe<Scalars["Int"]>;
  pk?: Maybe<Scalars["Int"]>;
  space?: Maybe<SpaceType>;
  /** Surface area of the space as square meters */
  surfaceArea?: Maybe<Scalars["Float"]>;
  unitPk?: Maybe<Scalars["Int"]>;
};

export type SpaceDeleteMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
};

export type SpaceDeleteMutationPayload = {
  __typename?: "SpaceDeleteMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  deleted?: Maybe<Scalars["Boolean"]>;
  errors?: Maybe<Scalars["String"]>;
};

export type SpaceType = Node & {
  __typename?: "SpaceType";
  building?: Maybe<BuildingType>;
  children?: Maybe<Array<Maybe<SpaceType>>>;
  code: Scalars["String"];
  /** The ID of the object */
  id: Scalars["ID"];
  maxPersons?: Maybe<Scalars["Int"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  parent?: Maybe<SpaceType>;
  pk?: Maybe<Scalars["Int"]>;
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  surfaceArea?: Maybe<Scalars["Float"]>;
  unit?: Maybe<UnitByPkType>;
};

export type SpaceTypeConnection = {
  __typename?: "SpaceTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<SpaceTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `SpaceType` and its cursor. */
export type SpaceTypeEdge = {
  __typename?: "SpaceTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<SpaceType>;
};

export type SpaceUpdateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  code?: InputMaybe<Scalars["String"]>;
  /** PK of the district for this space. */
  districtPk?: InputMaybe<Scalars["Int"]>;
  maxPersons?: InputMaybe<Scalars["Int"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  /** PK of the parent space for this space. */
  parentPk?: InputMaybe<Scalars["Int"]>;
  pk: Scalars["Int"];
  /** Surface area of the space as square meters */
  surfaceArea?: InputMaybe<Scalars["Float"]>;
  unitPk?: InputMaybe<Scalars["Int"]>;
};

export type SpaceUpdateMutationPayload = {
  __typename?: "SpaceUpdateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  code?: Maybe<Scalars["String"]>;
  /** PK of the district for this space. */
  districtPk?: Maybe<Scalars["Int"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  maxPersons?: Maybe<Scalars["Int"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  /** PK of the parent space for this space. */
  parentPk?: Maybe<Scalars["Int"]>;
  pk?: Maybe<Scalars["Int"]>;
  space?: Maybe<SpaceType>;
  /** Surface area of the space as square meters */
  surfaceArea?: Maybe<Scalars["Float"]>;
  unitPk?: Maybe<Scalars["Int"]>;
};

export type TaxPercentageType = Node & {
  __typename?: "TaxPercentageType";
  /** The ID of the object */
  id: Scalars["ID"];
  pk?: Maybe<Scalars["Int"]>;
  /** The tax percentage for a price */
  value: Scalars["Decimal"];
};

export type TaxPercentageTypeConnection = {
  __typename?: "TaxPercentageTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<TaxPercentageTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `TaxPercentageType` and its cursor. */
export type TaxPercentageTypeEdge = {
  __typename?: "TaxPercentageTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
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
  /** Recurring reservation terms */
  RecurringTerms = "RECURRING_TERMS",
  /** Service-specific terms */
  ServiceTerms = "SERVICE_TERMS",
}

export type TermsOfUseType = Node & {
  __typename?: "TermsOfUseType";
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["String"]>;
  termsType: TermsOfUseTermsOfUseTermsTypeChoices;
  textEn?: Maybe<Scalars["String"]>;
  textFi?: Maybe<Scalars["String"]>;
  textSv?: Maybe<Scalars["String"]>;
};

export type TermsOfUseTypeConnection = {
  __typename?: "TermsOfUseTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<TermsOfUseTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `TermsOfUseType` and its cursor. */
export type TermsOfUseTypeEdge = {
  __typename?: "TermsOfUseTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<TermsOfUseType>;
};

export type TimeSpanType = {
  __typename?: "TimeSpanType";
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  endTime?: Maybe<Scalars["Time"]>;
  endTimeOnNextDay?: Maybe<Scalars["Boolean"]>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  resourceState?: Maybe<Scalars["String"]>;
  startTime?: Maybe<Scalars["Time"]>;
  weekdays?: Maybe<Array<Maybe<Scalars["Int"]>>>;
};

export type UnitByPkType = Node & {
  __typename?: "UnitByPkType";
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  email: Scalars["String"];
  /** The ID of the object */
  id: Scalars["ID"];
  location?: Maybe<LocationType>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  openingHours?: Maybe<OpeningHoursType>;
  phone: Scalars["String"];
  pk?: Maybe<Scalars["Int"]>;
  reservationUnits?: Maybe<Array<Maybe<ReservationUnitType>>>;
  shortDescriptionEn?: Maybe<Scalars["String"]>;
  shortDescriptionFi?: Maybe<Scalars["String"]>;
  shortDescriptionSv?: Maybe<Scalars["String"]>;
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  tprekId?: Maybe<Scalars["String"]>;
  webPage: Scalars["String"];
};

export type UnitByPkTypeOpeningHoursArgs = {
  endDate?: InputMaybe<Scalars["Date"]>;
  openingTimes?: InputMaybe<Scalars["Boolean"]>;
  periods?: InputMaybe<Scalars["Boolean"]>;
  startDate?: InputMaybe<Scalars["Date"]>;
};

export type UnitType = Node & {
  __typename?: "UnitType";
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  email: Scalars["String"];
  /** The ID of the object */
  id: Scalars["ID"];
  location?: Maybe<LocationType>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  phone: Scalars["String"];
  pk?: Maybe<Scalars["Int"]>;
  reservationUnits?: Maybe<Array<Maybe<ReservationUnitType>>>;
  shortDescriptionEn?: Maybe<Scalars["String"]>;
  shortDescriptionFi?: Maybe<Scalars["String"]>;
  shortDescriptionSv?: Maybe<Scalars["String"]>;
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  tprekId?: Maybe<Scalars["String"]>;
  webPage: Scalars["String"];
};

export type UnitTypeConnection = {
  __typename?: "UnitTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<UnitTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `UnitType` and its cursor. */
export type UnitTypeEdge = {
  __typename?: "UnitTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<UnitType>;
};

export type UnitUpdateMutationInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  descriptionEn?: InputMaybe<Scalars["String"]>;
  descriptionFi?: InputMaybe<Scalars["String"]>;
  descriptionSv?: InputMaybe<Scalars["String"]>;
  email?: InputMaybe<Scalars["String"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  phone?: InputMaybe<Scalars["String"]>;
  pk: Scalars["Int"];
  shortDescriptionEn?: InputMaybe<Scalars["String"]>;
  shortDescriptionFi?: InputMaybe<Scalars["String"]>;
  shortDescriptionSv?: InputMaybe<Scalars["String"]>;
  tprekId?: InputMaybe<Scalars["String"]>;
  webPage?: InputMaybe<Scalars["String"]>;
};

export type UnitUpdateMutationPayload = {
  __typename?: "UnitUpdateMutationPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  descriptionEn?: Maybe<Scalars["String"]>;
  descriptionFi?: Maybe<Scalars["String"]>;
  descriptionSv?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["String"]>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  phone?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  shortDescriptionEn?: Maybe<Scalars["String"]>;
  shortDescriptionFi?: Maybe<Scalars["String"]>;
  shortDescriptionSv?: Maybe<Scalars["String"]>;
  tprekId?: Maybe<Scalars["String"]>;
  unit?: Maybe<UnitType>;
  webPage?: Maybe<Scalars["String"]>;
};

/** An enumeration. */
export enum State {
  /** cancelled */
  Cancelled = "CANCELLED",
  /** confirmed */
  Confirmed = "CONFIRMED",
  /** created */
  Created = "CREATED",
  /** denied */
  Denied = "DENIED",
  /** requires_handling */
  RequiresHandling = "REQUIRES_HANDLING",
}

export const SearchFormParamsUnitDocument = gql`
  query SearchFormParamsUnit {
    units {
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
export type SearchFormParamsUnitQueryHookResult = ReturnType<
  typeof useSearchFormParamsUnitQuery
>;
export type SearchFormParamsUnitLazyQueryHookResult = ReturnType<
  typeof useSearchFormParamsUnitLazyQuery
>;
export type SearchFormParamsUnitQueryResult = Apollo.QueryResult<
  SearchFormParamsUnitQuery,
  SearchFormParamsUnitQueryVariables
>;
export const SearchFormParamsPurposeDocument = gql`
  query SearchFormParamsPurpose {
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
  }
`;

/**
 * __useSearchFormParamsPurposeQuery__
 *
 * To run a query within a React component, call `useSearchFormParamsPurposeQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchFormParamsPurposeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchFormParamsPurposeQuery({
 *   variables: {
 *   },
 * });
 */
export function useSearchFormParamsPurposeQuery(
  baseOptions?: Apollo.QueryHookOptions<
    SearchFormParamsPurposeQuery,
    SearchFormParamsPurposeQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    SearchFormParamsPurposeQuery,
    SearchFormParamsPurposeQueryVariables
  >(SearchFormParamsPurposeDocument, options);
}
export function useSearchFormParamsPurposeLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SearchFormParamsPurposeQuery,
    SearchFormParamsPurposeQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    SearchFormParamsPurposeQuery,
    SearchFormParamsPurposeQueryVariables
  >(SearchFormParamsPurposeDocument, options);
}
export type SearchFormParamsPurposeQueryHookResult = ReturnType<
  typeof useSearchFormParamsPurposeQuery
>;
export type SearchFormParamsPurposeLazyQueryHookResult = ReturnType<
  typeof useSearchFormParamsPurposeLazyQuery
>;
export type SearchFormParamsPurposeQueryResult = Apollo.QueryResult<
  SearchFormParamsPurposeQuery,
  SearchFormParamsPurposeQueryVariables
>;
export const ReservationPurposesDocument = gql`
  query ReservationPurposes {
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
  }
`;

/**
 * __useReservationPurposesQuery__
 *
 * To run a query within a React component, call `useReservationPurposesQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationPurposesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationPurposesQuery({
 *   variables: {
 *   },
 * });
 */
export function useReservationPurposesQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ReservationPurposesQuery,
    ReservationPurposesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationPurposesQuery,
    ReservationPurposesQueryVariables
  >(ReservationPurposesDocument, options);
}
export function useReservationPurposesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationPurposesQuery,
    ReservationPurposesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationPurposesQuery,
    ReservationPurposesQueryVariables
  >(ReservationPurposesDocument, options);
}
export type ReservationPurposesQueryHookResult = ReturnType<
  typeof useReservationPurposesQuery
>;
export type ReservationPurposesLazyQueryHookResult = ReturnType<
  typeof useReservationPurposesLazyQuery
>;
export type ReservationPurposesQueryResult = Apollo.QueryResult<
  ReservationPurposesQuery,
  ReservationPurposesQueryVariables
>;
export const AgeGroupsDocument = gql`
  query AgeGroups {
    ageGroups {
      edges {
        node {
          pk
          minimum
          maximum
        }
      }
    }
  }
`;

/**
 * __useAgeGroupsQuery__
 *
 * To run a query within a React component, call `useAgeGroupsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAgeGroupsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAgeGroupsQuery({
 *   variables: {
 *   },
 * });
 */
export function useAgeGroupsQuery(
  baseOptions?: Apollo.QueryHookOptions<AgeGroupsQuery, AgeGroupsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<AgeGroupsQuery, AgeGroupsQueryVariables>(
    AgeGroupsDocument,
    options
  );
}
export function useAgeGroupsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AgeGroupsQuery,
    AgeGroupsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<AgeGroupsQuery, AgeGroupsQueryVariables>(
    AgeGroupsDocument,
    options
  );
}
export type AgeGroupsQueryHookResult = ReturnType<typeof useAgeGroupsQuery>;
export type AgeGroupsLazyQueryHookResult = ReturnType<
  typeof useAgeGroupsLazyQuery
>;
export type AgeGroupsQueryResult = Apollo.QueryResult<
  AgeGroupsQuery,
  AgeGroupsQueryVariables
>;
export const CreateReservationDocument = gql`
  mutation createReservation($input: ReservationCreateMutationInput!) {
    createReservation(input: $input) {
      pk
      price
      errors {
        field
        messages
      }
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
      reservation {
        pk
        calendarUrl
        state
        user
        name
        description
        purpose {
          pk
        }
        numPersons
        ageGroup {
          pk
        }
        reserveeFirstName
        reserveeLastName
        reserveeOrganisationName
        reserveePhone
        reserveeEmail
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
        homeCity {
          pk
        }
        applyingForFreeOfCharge
        freeOfChargeReason
      }
      errors {
        field
        messages
      }
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
export const CancelReservationDocument = gql`
  mutation cancelReservation($input: ReservationCancellationMutationInput!) {
    cancelReservation(input: $input) {
      pk
      cancelReasonPk
      cancelDetails
      state
      clientMutationId
      errors {
        field
        messages
      }
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
  mutation confirmReservation($input: ReservationConfirmMutationInput!) {
    confirmReservation(input: $input) {
      pk
      state
      errors {
        field
        messages
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
  query listReservations(
    $before: String
    $after: String
    $first: Int
    $last: Int
    $begin: DateTime
    $end: DateTime
  ) {
    reservations(
      before: $before
      after: $after
      first: $first
      last: $last
      begin: $begin
      end: $end
    ) {
      edges {
        node {
          pk
          name
          begin
          end
          state
          price
          bufferTimeBefore
          bufferTimeAfter
          reservationUnits {
            pk
            nameFi
            nameEn
            nameSv
            unit {
              nameFi
              nameEn
              nameSv
              location {
                addressStreetFi
                addressStreetEn
                addressStreetSv
              }
            }
            cancellationRule {
              canBeCancelledTimeBefore
              needsHandling
            }
            images {
              imageType
              imageUrl
              mediumUrl
            }
          }
        }
      }
    }
  }
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
 *      before: // value for 'before'
 *      after: // value for 'after'
 *      first: // value for 'first'
 *      last: // value for 'last'
 *      begin: // value for 'begin'
 *      end: // value for 'end'
 *   },
 * });
 */
export function useListReservationsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ListReservationsQuery,
    ListReservationsQueryVariables
  >
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
export type ListReservationsQueryHookResult = ReturnType<
  typeof useListReservationsQuery
>;
export type ListReservationsLazyQueryHookResult = ReturnType<
  typeof useListReservationsLazyQuery
>;
export type ListReservationsQueryResult = Apollo.QueryResult<
  ListReservationsQuery,
  ListReservationsQueryVariables
>;
export const ReservationByPkDocument = gql`
  query reservationByPk($pk: Int!) {
    reservationByPk(pk: $pk) {
      pk
      name
      description
      reserveeFirstName
      reserveeLastName
      reserveePhone
      reserveeType
      begin
      end
      calendarUrl
      user
      state
      reservationUnits {
        pk
        nameFi
        nameEn
        nameSv
        additionalInstructionsFi
        additionalInstructionsEn
        additionalInstructionsSv
        termsOfUseFi
        termsOfUseEn
        termsOfUseSv
        serviceSpecificTerms {
          textFi
          textEn
          textSv
        }
        unit {
          nameFi
          nameEn
          nameSv
          location {
            addressStreetFi
            addressStreetEn
            addressStreetSv
          }
        }
        cancellationRule {
          canBeCancelledTimeBefore
          needsHandling
        }
        spaces {
          pk
          nameFi
          nameEn
          nameSv
        }
        metadataSet {
          supportedFields
          requiredFields
        }
      }
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
    }
  }
`;

/**
 * __useReservationByPkQuery__
 *
 * To run a query within a React component, call `useReservationByPkQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationByPkQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationByPkQuery({
 *   variables: {
 *      pk: // value for 'pk'
 *   },
 * });
 */
export function useReservationByPkQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationByPkQuery,
    ReservationByPkQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ReservationByPkQuery, ReservationByPkQueryVariables>(
    ReservationByPkDocument,
    options
  );
}
export function useReservationByPkLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationByPkQuery,
    ReservationByPkQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationByPkQuery,
    ReservationByPkQueryVariables
  >(ReservationByPkDocument, options);
}
export type ReservationByPkQueryHookResult = ReturnType<
  typeof useReservationByPkQuery
>;
export type ReservationByPkLazyQueryHookResult = ReturnType<
  typeof useReservationByPkLazyQuery
>;
export type ReservationByPkQueryResult = Apollo.QueryResult<
  ReservationByPkQuery,
  ReservationByPkQueryVariables
>;
export const GetReservationCancelReasonsDocument = gql`
  query getReservationCancelReasons {
    reservationCancelReasons {
      edges {
        node {
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
export type GetReservationCancelReasonsQueryHookResult = ReturnType<
  typeof useGetReservationCancelReasonsQuery
>;
export type GetReservationCancelReasonsLazyQueryHookResult = ReturnType<
  typeof useGetReservationCancelReasonsLazyQuery
>;
export type GetReservationCancelReasonsQueryResult = Apollo.QueryResult<
  GetReservationCancelReasonsQuery,
  GetReservationCancelReasonsQueryVariables
>;
export const GetCitiesDocument = gql`
  query getCities {
    cities {
      edges {
        node {
          pk
          name
        }
      }
    }
  }
`;

/**
 * __useGetCitiesQuery__
 *
 * To run a query within a React component, call `useGetCitiesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCitiesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCitiesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetCitiesQuery(
  baseOptions?: Apollo.QueryHookOptions<GetCitiesQuery, GetCitiesQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetCitiesQuery, GetCitiesQueryVariables>(
    GetCitiesDocument,
    options
  );
}
export function useGetCitiesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetCitiesQuery,
    GetCitiesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetCitiesQuery, GetCitiesQueryVariables>(
    GetCitiesDocument,
    options
  );
}
export type GetCitiesQueryHookResult = ReturnType<typeof useGetCitiesQuery>;
export type GetCitiesLazyQueryHookResult = ReturnType<
  typeof useGetCitiesLazyQuery
>;
export type GetCitiesQueryResult = Apollo.QueryResult<
  GetCitiesQuery,
  GetCitiesQueryVariables
>;
export const ReservationUnitDocument = gql`
  query ReservationUnit($pk: Int!) {
    reservationUnitByPk(pk: $pk) {
      id
      pk
      uuid
      nameFi
      nameEn
      nameSv
      isDraft
      images {
        imageUrl
        mediumUrl
        smallUrl
        imageType
      }
      descriptionFi
      descriptionEn
      descriptionSv
      lowestPrice
      highestPrice
      priceUnit
      termsOfUseFi
      termsOfUseEn
      termsOfUseSv
      additionalInstructionsFi
      additionalInstructionsEn
      additionalInstructionsSv
      bufferTimeBefore
      bufferTimeAfter
      reservationStartInterval
      publishBegins
      publishEnds
      reservationBegins
      reservationEnds
      serviceSpecificTerms {
        nameFi
        nameEn
        nameSv
        textFi
        textEn
        textSv
      }
      reservationUnitType {
        nameFi
        nameEn
        nameSv
      }
      maxPersons
      minReservationDuration
      maxReservationDuration
      maxReservationsPerUser
      nextAvailableSlot
      unit {
        id
        pk
        tprekId
        nameFi
        nameEn
        nameSv
        location {
          latitude
          longitude
          addressStreetFi
          addressStreetEn
          addressStreetSv
          addressZip
          addressCityFi
          addressCityEn
          addressCitySv
        }
      }
      spaces {
        pk
        nameFi
        nameEn
        nameSv
      }
      openingHours(openingTimes: false, periods: true) {
        openingTimePeriods {
          periodId
          startDate
          endDate
          resourceState
          timeSpans {
            startTime
            endTime
            resourceState
            weekdays
          }
        }
      }
      requireReservationHandling
      metadataSet {
        id
        name
        pk
        supportedFields
        requiredFields
      }
      equipment {
        pk
        nameFi
        nameEn
        nameSv
        category {
          nameFi
          nameEn
          nameSv
        }
      }
    }
  }
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
 *      pk: // value for 'pk'
 *   },
 * });
 */
export function useReservationUnitQuery(
  baseOptions: Apollo.QueryHookOptions<
    ReservationUnitQuery,
    ReservationUnitQueryVariables
  >
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
export type ReservationUnitQueryHookResult = ReturnType<
  typeof useReservationUnitQuery
>;
export type ReservationUnitLazyQueryHookResult = ReturnType<
  typeof useReservationUnitLazyQuery
>;
export type ReservationUnitQueryResult = Apollo.QueryResult<
  ReservationUnitQuery,
  ReservationUnitQueryVariables
>;
export const SearchReservationUnitsDocument = gql`
  query SearchReservationUnits(
    $textSearch: String
    $minPersons: Float
    $maxPersons: Float
    $unit: [ID]
    $reservationUnitType: [ID]
    $purposes: [ID]
    $first: Int
    $after: String
    $orderBy: String
    $isDraft: Boolean
    $isVisible: Boolean
  ) {
    reservationUnits(
      textSearch: $textSearch
      maxPersonsGte: $minPersons
      maxPersonsLte: $maxPersons
      reservationUnitType: $reservationUnitType
      purposes: $purposes
      unit: $unit
      first: $first
      after: $after
      orderBy: $orderBy
      isDraft: $isDraft
      isVisible: $isVisible
    ) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
          lowestPrice
          highestPrice
          priceUnit
          nameFi
          reservationBegins
          reservationEnds
          reservationUnitType {
            id: pk
            nameFi
            nameEn
            nameSv
          }
          unit {
            id: pk
            nameFi
            nameEn
            nameSv
            location {
              addressStreetFi
              addressStreetEn
              addressStreetSv
            }
          }
          maxPersons
          images {
            imageType
            smallUrl
            mediumUrl
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
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
 *      textSearch: // value for 'textSearch'
 *      minPersons: // value for 'minPersons'
 *      maxPersons: // value for 'maxPersons'
 *      unit: // value for 'unit'
 *      reservationUnitType: // value for 'reservationUnitType'
 *      purposes: // value for 'purposes'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      orderBy: // value for 'orderBy'
 *      isDraft: // value for 'isDraft'
 *      isVisible: // value for 'isVisible'
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
export type SearchReservationUnitsQueryHookResult = ReturnType<
  typeof useSearchReservationUnitsQuery
>;
export type SearchReservationUnitsLazyQueryHookResult = ReturnType<
  typeof useSearchReservationUnitsLazyQuery
>;
export type SearchReservationUnitsQueryResult = Apollo.QueryResult<
  SearchReservationUnitsQuery,
  SearchReservationUnitsQueryVariables
>;
export const RelatedReservationUnitsDocument = gql`
  query RelatedReservationUnits($unit: [ID]!) {
    reservationUnits(unit: $unit) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
          images {
            imageUrl
            smallUrl
            imageType
          }
          unit {
            pk
            nameFi
            nameEn
            nameSv
            location {
              addressStreetFi
              addressStreetEn
              addressStreetSv
            }
          }
          reservationUnitType {
            nameFi
            nameEn
            nameSv
          }
          maxPersons
        }
      }
    }
  }
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
 *   },
 * });
 */
export function useRelatedReservationUnitsQuery(
  baseOptions: Apollo.QueryHookOptions<
    RelatedReservationUnitsQuery,
    RelatedReservationUnitsQueryVariables
  >
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
export type RelatedReservationUnitsQueryHookResult = ReturnType<
  typeof useRelatedReservationUnitsQuery
>;
export type RelatedReservationUnitsLazyQueryHookResult = ReturnType<
  typeof useRelatedReservationUnitsLazyQuery
>;
export type RelatedReservationUnitsQueryResult = Apollo.QueryResult<
  RelatedReservationUnitsQuery,
  RelatedReservationUnitsQueryVariables
>;
export const ReservationUnitOpeningHoursDocument = gql`
  query ReservationUnitOpeningHours(
    $pk: Int
    $startDate: Date
    $endDate: Date
    $from: Date
    $to: Date
    $state: [String]
  ) {
    reservationUnitByPk(pk: $pk) {
      openingHours(
        openingTimes: true
        periods: false
        startDate: $startDate
        endDate: $endDate
      ) {
        openingTimes {
          date
          startTime
          endTime
          state
          periods
        }
      }
      reservations(state: $state, from: $from, to: $to) {
        pk
        state
        priority
        begin
        end
        numPersons
        calendarUrl
        bufferTimeBefore
        bufferTimeAfter
      }
    }
  }
`;

/**
 * __useReservationUnitOpeningHoursQuery__
 *
 * To run a query within a React component, call `useReservationUnitOpeningHoursQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationUnitOpeningHoursQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationUnitOpeningHoursQuery({
 *   variables: {
 *      pk: // value for 'pk'
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *      from: // value for 'from'
 *      to: // value for 'to'
 *      state: // value for 'state'
 *   },
 * });
 */
export function useReservationUnitOpeningHoursQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ReservationUnitOpeningHoursQuery,
    ReservationUnitOpeningHoursQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationUnitOpeningHoursQuery,
    ReservationUnitOpeningHoursQueryVariables
  >(ReservationUnitOpeningHoursDocument, options);
}
export function useReservationUnitOpeningHoursLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationUnitOpeningHoursQuery,
    ReservationUnitOpeningHoursQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationUnitOpeningHoursQuery,
    ReservationUnitOpeningHoursQueryVariables
  >(ReservationUnitOpeningHoursDocument, options);
}
export type ReservationUnitOpeningHoursQueryHookResult = ReturnType<
  typeof useReservationUnitOpeningHoursQuery
>;
export type ReservationUnitOpeningHoursLazyQueryHookResult = ReturnType<
  typeof useReservationUnitOpeningHoursLazyQuery
>;
export type ReservationUnitOpeningHoursQueryResult = Apollo.QueryResult<
  ReservationUnitOpeningHoursQuery,
  ReservationUnitOpeningHoursQueryVariables
>;
export const TermsOfUseDocument = gql`
  query TermsOfUse($termsType: String) {
    termsOfUse(termsType: $termsType) {
      edges {
        node {
          pk
          nameFi
          nameEn
          nameSv
          textFi
          textEn
          textSv
          termsType
        }
      }
    }
  }
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
export type TermsOfUseQueryHookResult = ReturnType<typeof useTermsOfUseQuery>;
export type TermsOfUseLazyQueryHookResult = ReturnType<
  typeof useTermsOfUseLazyQuery
>;
export type TermsOfUseQueryResult = Apollo.QueryResult<
  TermsOfUseQuery,
  TermsOfUseQueryVariables
>;
export const ReservationUnitTypesDocument = gql`
  query ReservationUnitTypes {
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
  }
`;

/**
 * __useReservationUnitTypesQuery__
 *
 * To run a query within a React component, call `useReservationUnitTypesQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationUnitTypesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationUnitTypesQuery({
 *   variables: {
 *   },
 * });
 */
export function useReservationUnitTypesQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ReservationUnitTypesQuery,
    ReservationUnitTypesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ReservationUnitTypesQuery,
    ReservationUnitTypesQueryVariables
  >(ReservationUnitTypesDocument, options);
}
export function useReservationUnitTypesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ReservationUnitTypesQuery,
    ReservationUnitTypesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ReservationUnitTypesQuery,
    ReservationUnitTypesQueryVariables
  >(ReservationUnitTypesDocument, options);
}
export type ReservationUnitTypesQueryHookResult = ReturnType<
  typeof useReservationUnitTypesQuery
>;
export type ReservationUnitTypesLazyQueryHookResult = ReturnType<
  typeof useReservationUnitTypesLazyQuery
>;
export type ReservationUnitTypesQueryResult = Apollo.QueryResult<
  ReservationUnitTypesQuery,
  ReservationUnitTypesQueryVariables
>;
export type SearchFormParamsUnitQueryVariables = Exact<{
  [key: string]: never;
}>;

export type SearchFormParamsUnitQuery = {
  __typename?: "Query";
  units?: {
    __typename?: "UnitTypeConnection";
    edges: Array<{
      __typename?: "UnitTypeEdge";
      node?: {
        __typename?: "UnitType";
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type SearchFormParamsPurposeQueryVariables = Exact<{
  [key: string]: never;
}>;

export type SearchFormParamsPurposeQuery = {
  __typename?: "Query";
  purposes?: {
    __typename?: "PurposeTypeConnection";
    edges: Array<{
      __typename?: "PurposeTypeEdge";
      node?: {
        __typename?: "PurposeType";
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type ReservationPurposesQueryVariables = Exact<{ [key: string]: never }>;

export type ReservationPurposesQuery = {
  __typename?: "Query";
  reservationPurposes?: {
    __typename?: "ReservationPurposeTypeConnection";
    edges: Array<{
      __typename?: "ReservationPurposeTypeEdge";
      node?: {
        __typename?: "ReservationPurposeType";
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type AgeGroupsQueryVariables = Exact<{ [key: string]: never }>;

export type AgeGroupsQuery = {
  __typename?: "Query";
  ageGroups?: {
    __typename?: "AgeGroupTypeConnection";
    edges: Array<{
      __typename?: "AgeGroupTypeEdge";
      node?: {
        __typename?: "AgeGroupType";
        pk?: number | null;
        minimum: number;
        maximum?: number | null;
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
    price?: number | null;
    errors?: Array<{
      __typename?: "ErrorType";
      field: string;
      messages: Array<string>;
    } | null> | null;
  } | null;
};

export type UpdateReservationMutationVariables = Exact<{
  input: ReservationUpdateMutationInput;
}>;

export type UpdateReservationMutation = {
  __typename?: "Mutation";
  updateReservation?: {
    __typename?: "ReservationUpdateMutationPayload";
    reservation?: {
      __typename?: "ReservationType";
      pk?: number | null;
      calendarUrl?: string | null;
      state: ReservationsReservationStateChoices;
      user?: string | null;
      name?: string | null;
      description?: string | null;
      numPersons?: number | null;
      reserveeFirstName?: string | null;
      reserveeLastName?: string | null;
      reserveeOrganisationName: string;
      reserveePhone?: string | null;
      reserveeEmail?: string | null;
      reserveeId: string;
      reserveeIsUnregisteredAssociation: boolean;
      reserveeAddressStreet: string;
      reserveeAddressCity: string;
      reserveeAddressZip: string;
      billingFirstName: string;
      billingLastName: string;
      billingPhone: string;
      billingEmail?: string | null;
      billingAddressStreet: string;
      billingAddressCity: string;
      billingAddressZip: string;
      applyingForFreeOfCharge: boolean;
      freeOfChargeReason?: string | null;
      purpose?: {
        __typename?: "ReservationPurposeType";
        pk?: number | null;
      } | null;
      ageGroup?: { __typename?: "AgeGroupType"; pk?: number | null } | null;
      homeCity?: { __typename?: "CityType"; pk?: number | null } | null;
    } | null;
    errors?: Array<{
      __typename?: "ErrorType";
      field: string;
      messages: Array<string>;
    } | null> | null;
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
    cancelReasonPk?: number | null;
    cancelDetails?: string | null;
    state?: State | null;
    clientMutationId?: string | null;
    errors?: Array<{
      __typename?: "ErrorType";
      field: string;
      messages: Array<string>;
    } | null> | null;
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
    errors?: Array<{
      __typename?: "ErrorType";
      field: string;
      messages: Array<string>;
    } | null> | null;
  } | null;
};

export type ListReservationsQueryVariables = Exact<{
  before?: InputMaybe<Scalars["String"]>;
  after?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  begin?: InputMaybe<Scalars["DateTime"]>;
  end?: InputMaybe<Scalars["DateTime"]>;
}>;

export type ListReservationsQuery = {
  __typename?: "Query";
  reservations?: {
    __typename?: "ReservationTypeConnection";
    edges: Array<{
      __typename?: "ReservationTypeEdge";
      node?: {
        __typename?: "ReservationType";
        pk?: number | null;
        name?: string | null;
        begin: any;
        end: any;
        state: ReservationsReservationStateChoices;
        price?: number | null;
        bufferTimeBefore?: any | null;
        bufferTimeAfter?: any | null;
        reservationUnits?: Array<{
          __typename?: "ReservationUnitType";
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          unit?: {
            __typename?: "UnitType";
            nameFi?: string | null;
            nameEn?: string | null;
            nameSv?: string | null;
            location?: {
              __typename?: "LocationType";
              addressStreetFi?: string | null;
              addressStreetEn?: string | null;
              addressStreetSv?: string | null;
            } | null;
          } | null;
          cancellationRule?: {
            __typename?: "ReservationUnitCancellationRuleType";
            canBeCancelledTimeBefore?: number | null;
            needsHandling: boolean;
          } | null;
          images?: Array<{
            __typename?: "ReservationUnitImageType";
            imageType: ReservationUnitsReservationUnitImageImageTypeChoices;
            imageUrl?: string | null;
            mediumUrl?: string | null;
          } | null> | null;
        } | null> | null;
      } | null;
    } | null>;
  } | null;
};

export type ReservationByPkQueryVariables = Exact<{
  pk: Scalars["Int"];
}>;

export type ReservationByPkQuery = {
  __typename?: "Query";
  reservationByPk?: {
    __typename?: "ReservationType";
    pk?: number | null;
    name?: string | null;
    description?: string | null;
    reserveeFirstName?: string | null;
    reserveeLastName?: string | null;
    reserveePhone?: string | null;
    reserveeType?: ReservationsReservationReserveeTypeChoices | null;
    begin: any;
    end: any;
    calendarUrl?: string | null;
    user?: string | null;
    state: ReservationsReservationStateChoices;
    reservationUnits?: Array<{
      __typename?: "ReservationUnitType";
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      additionalInstructionsFi?: string | null;
      additionalInstructionsEn?: string | null;
      additionalInstructionsSv?: string | null;
      termsOfUseFi?: string | null;
      termsOfUseEn?: string | null;
      termsOfUseSv?: string | null;
      serviceSpecificTerms?: {
        __typename?: "TermsOfUseType";
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
      } | null;
      unit?: {
        __typename?: "UnitType";
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        location?: {
          __typename?: "LocationType";
          addressStreetFi?: string | null;
          addressStreetEn?: string | null;
          addressStreetSv?: string | null;
        } | null;
      } | null;
      cancellationRule?: {
        __typename?: "ReservationUnitCancellationRuleType";
        canBeCancelledTimeBefore?: number | null;
        needsHandling: boolean;
      } | null;
      spaces?: Array<{
        __typename?: "SpaceType";
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null> | null;
      metadataSet?: {
        __typename?: "ReservationMetadataSetType";
        supportedFields?: Array<string | null> | null;
        requiredFields?: Array<string | null> | null;
      } | null;
    } | null> | null;
    purpose?: {
      __typename?: "ReservationPurposeType";
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    ageGroup?: {
      __typename?: "AgeGroupType";
      pk?: number | null;
      minimum: number;
      maximum?: number | null;
    } | null;
    homeCity?: {
      __typename?: "CityType";
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
    __typename?: "ReservationCancelReasonTypeConnection";
    edges: Array<{
      __typename?: "ReservationCancelReasonTypeEdge";
      node?: {
        __typename?: "ReservationCancelReasonType";
        pk?: number | null;
        reasonFi?: string | null;
        reasonEn?: string | null;
        reasonSv?: string | null;
      } | null;
    } | null>;
  } | null;
};

export type GetCitiesQueryVariables = Exact<{ [key: string]: never }>;

export type GetCitiesQuery = {
  __typename?: "Query";
  cities?: {
    __typename?: "CityTypeConnection";
    edges: Array<{
      __typename?: "CityTypeEdge";
      node?: {
        __typename?: "CityType";
        pk?: number | null;
        name: string;
      } | null;
    } | null>;
  } | null;
};

export type ReservationUnitQueryVariables = Exact<{
  pk: Scalars["Int"];
}>;

export type ReservationUnitQuery = {
  __typename?: "Query";
  reservationUnitByPk?: {
    __typename?: "ReservationUnitByPkType";
    id: string;
    pk?: number | null;
    uuid: any;
    nameFi?: string | null;
    nameEn?: string | null;
    nameSv?: string | null;
    isDraft: boolean;
    descriptionFi?: string | null;
    descriptionEn?: string | null;
    descriptionSv?: string | null;
    lowestPrice: any;
    highestPrice: any;
    priceUnit: ReservationUnitsReservationUnitPriceUnitChoices;
    termsOfUseFi?: string | null;
    termsOfUseEn?: string | null;
    termsOfUseSv?: string | null;
    additionalInstructionsFi?: string | null;
    additionalInstructionsEn?: string | null;
    additionalInstructionsSv?: string | null;
    bufferTimeBefore?: any | null;
    bufferTimeAfter?: any | null;
    reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices;
    publishBegins?: any | null;
    publishEnds?: any | null;
    reservationBegins?: any | null;
    reservationEnds?: any | null;
    maxPersons?: number | null;
    minReservationDuration?: any | null;
    maxReservationDuration?: any | null;
    maxReservationsPerUser?: number | null;
    nextAvailableSlot?: any | null;
    requireReservationHandling: boolean;
    images?: Array<{
      __typename?: "ReservationUnitImageType";
      imageUrl?: string | null;
      mediumUrl?: string | null;
      smallUrl?: string | null;
      imageType: ReservationUnitsReservationUnitImageImageTypeChoices;
    } | null> | null;
    serviceSpecificTerms?: {
      __typename?: "TermsOfUseType";
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      textFi?: string | null;
      textEn?: string | null;
      textSv?: string | null;
    } | null;
    reservationUnitType?: {
      __typename?: "ReservationUnitTypeType";
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null;
    unit?: {
      __typename?: "UnitType";
      id: string;
      pk?: number | null;
      tprekId?: string | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      location?: {
        __typename?: "LocationType";
        latitude?: string | null;
        longitude?: string | null;
        addressStreetFi?: string | null;
        addressStreetEn?: string | null;
        addressStreetSv?: string | null;
        addressZip: string;
        addressCityFi?: string | null;
        addressCityEn?: string | null;
        addressCitySv?: string | null;
      } | null;
    } | null;
    spaces?: Array<{
      __typename?: "SpaceType";
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
    } | null> | null;
    openingHours?: {
      __typename?: "OpeningHoursType";
      openingTimePeriods?: Array<{
        __typename?: "PeriodType";
        periodId?: number | null;
        startDate?: any | null;
        endDate?: any | null;
        resourceState?: string | null;
        timeSpans?: Array<{
          __typename?: "TimeSpanType";
          startTime?: any | null;
          endTime?: any | null;
          resourceState?: string | null;
          weekdays?: Array<number | null> | null;
        } | null> | null;
      } | null> | null;
    } | null;
    metadataSet?: {
      __typename?: "ReservationMetadataSetType";
      id: string;
      name: string;
      pk?: number | null;
      supportedFields?: Array<string | null> | null;
      requiredFields?: Array<string | null> | null;
    } | null;
    equipment?: Array<{
      __typename?: "EquipmentType";
      pk?: number | null;
      nameFi?: string | null;
      nameEn?: string | null;
      nameSv?: string | null;
      category?: {
        __typename?: "EquipmentCategoryType";
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null> | null;
  } | null;
};

export type SearchReservationUnitsQueryVariables = Exact<{
  textSearch?: InputMaybe<Scalars["String"]>;
  minPersons?: InputMaybe<Scalars["Float"]>;
  maxPersons?: InputMaybe<Scalars["Float"]>;
  unit?: InputMaybe<
    Array<InputMaybe<Scalars["ID"]>> | InputMaybe<Scalars["ID"]>
  >;
  reservationUnitType?: InputMaybe<
    Array<InputMaybe<Scalars["ID"]>> | InputMaybe<Scalars["ID"]>
  >;
  purposes?: InputMaybe<
    Array<InputMaybe<Scalars["ID"]>> | InputMaybe<Scalars["ID"]>
  >;
  first?: InputMaybe<Scalars["Int"]>;
  after?: InputMaybe<Scalars["String"]>;
  orderBy?: InputMaybe<Scalars["String"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]>;
}>;

export type SearchReservationUnitsQuery = {
  __typename?: "Query";
  reservationUnits?: {
    __typename?: "ReservationUnitTypeConnection";
    edges: Array<{
      __typename?: "ReservationUnitTypeEdge";
      node?: {
        __typename?: "ReservationUnitType";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        lowestPrice: any;
        highestPrice: any;
        priceUnit: ReservationUnitsReservationUnitPriceUnitChoices;
        reservationBegins?: any | null;
        reservationEnds?: any | null;
        maxPersons?: number | null;
        reservationUnitType?: {
          __typename?: "ReservationUnitTypeType";
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          id?: number | null;
        } | null;
        unit?: {
          __typename?: "UnitType";
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          id?: number | null;
          location?: {
            __typename?: "LocationType";
            addressStreetFi?: string | null;
            addressStreetEn?: string | null;
            addressStreetSv?: string | null;
          } | null;
        } | null;
        images?: Array<{
          __typename?: "ReservationUnitImageType";
          imageType: ReservationUnitsReservationUnitImageImageTypeChoices;
          smallUrl?: string | null;
          mediumUrl?: string | null;
        } | null> | null;
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
  unit: Array<InputMaybe<Scalars["ID"]>> | InputMaybe<Scalars["ID"]>;
}>;

export type RelatedReservationUnitsQuery = {
  __typename?: "Query";
  reservationUnits?: {
    __typename?: "ReservationUnitTypeConnection";
    edges: Array<{
      __typename?: "ReservationUnitTypeEdge";
      node?: {
        __typename?: "ReservationUnitType";
        id: string;
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        maxPersons?: number | null;
        images?: Array<{
          __typename?: "ReservationUnitImageType";
          imageUrl?: string | null;
          smallUrl?: string | null;
          imageType: ReservationUnitsReservationUnitImageImageTypeChoices;
        } | null> | null;
        unit?: {
          __typename?: "UnitType";
          pk?: number | null;
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
          location?: {
            __typename?: "LocationType";
            addressStreetFi?: string | null;
            addressStreetEn?: string | null;
            addressStreetSv?: string | null;
          } | null;
        } | null;
        reservationUnitType?: {
          __typename?: "ReservationUnitTypeType";
          nameFi?: string | null;
          nameEn?: string | null;
          nameSv?: string | null;
        } | null;
      } | null;
    } | null>;
  } | null;
};

export type ReservationUnitOpeningHoursQueryVariables = Exact<{
  pk?: InputMaybe<Scalars["Int"]>;
  startDate?: InputMaybe<Scalars["Date"]>;
  endDate?: InputMaybe<Scalars["Date"]>;
  from?: InputMaybe<Scalars["Date"]>;
  to?: InputMaybe<Scalars["Date"]>;
  state?: InputMaybe<
    Array<InputMaybe<Scalars["String"]>> | InputMaybe<Scalars["String"]>
  >;
}>;

export type ReservationUnitOpeningHoursQuery = {
  __typename?: "Query";
  reservationUnitByPk?: {
    __typename?: "ReservationUnitByPkType";
    openingHours?: {
      __typename?: "OpeningHoursType";
      openingTimes?: Array<{
        __typename?: "OpeningTimesType";
        date?: any | null;
        startTime?: any | null;
        endTime?: any | null;
        state?: string | null;
        periods?: Array<number | null> | null;
      } | null> | null;
    } | null;
    reservations?: Array<{
      __typename?: "ReservationType";
      pk?: number | null;
      state: ReservationsReservationStateChoices;
      priority: ReservationsReservationPriorityChoices;
      begin: any;
      end: any;
      numPersons?: number | null;
      calendarUrl?: string | null;
      bufferTimeBefore?: any | null;
      bufferTimeAfter?: any | null;
    } | null> | null;
  } | null;
};

export type TermsOfUseQueryVariables = Exact<{
  termsType?: InputMaybe<Scalars["String"]>;
}>;

export type TermsOfUseQuery = {
  __typename?: "Query";
  termsOfUse?: {
    __typename?: "TermsOfUseTypeConnection";
    edges: Array<{
      __typename?: "TermsOfUseTypeEdge";
      node?: {
        __typename?: "TermsOfUseType";
        pk?: string | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
        textFi?: string | null;
        textEn?: string | null;
        textSv?: string | null;
        termsType: TermsOfUseTermsOfUseTermsTypeChoices;
      } | null;
    } | null>;
  } | null;
};

export type ReservationUnitTypesQueryVariables = Exact<{
  [key: string]: never;
}>;

export type ReservationUnitTypesQuery = {
  __typename?: "Query";
  reservationUnitTypes?: {
    __typename?: "ReservationUnitTypeTypeConnection";
    edges: Array<{
      __typename?: "ReservationUnitTypeTypeEdge";
      node?: {
        __typename?: "ReservationUnitTypeType";
        pk?: number | null;
        nameFi?: string | null;
        nameEn?: string | null;
        nameSv?: string | null;
      } | null;
    } | null>;
  } | null;
};
