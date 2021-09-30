export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
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
  /**
   * The `Time` scalar type represents a Time value as
   * specified by
   * [iso8601](https://en.wikipedia.org/wiki/ISO_8601).
   */
  Time: any;
  /**
   * Leverages the internal Python implmeentation of UUID (uuid.UUID) to provide native UUID objects
   * in fields, resolvers and input.
   */
  UUID: any;
};

export type BuildingType = Node & {
  __typename?: 'BuildingType';
  district?: Maybe<DistrictType>;
  /** The ID of the object. */
  id: Scalars['ID'];
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
  realEstate?: Maybe<RealEstateType>;
  surfaceArea?: Maybe<Scalars['Float']>;
};

export type DistrictType = Node & {
  __typename?: 'DistrictType';
  /** The ID of the object. */
  id: Scalars['ID'];
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
};

export type EquipmentCategoryCreateMutationInput = {
  clientMutationId?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
};

export type EquipmentCategoryCreateMutationPayload = {
  __typename?: 'EquipmentCategoryCreateMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  equipmentCategory?: Maybe<EquipmentCategoryType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
};

export type EquipmentCategoryDeleteMutationInput = {
  clientMutationId?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['ID']>;
};

export type EquipmentCategoryDeleteMutationPayload = {
  __typename?: 'EquipmentCategoryDeleteMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  deleted?: Maybe<Scalars['Boolean']>;
  errors?: Maybe<Scalars['String']>;
};

export type EquipmentCategoryType = Node & {
  __typename?: 'EquipmentCategoryType';
  /** The ID of the object. */
  id: Scalars['ID'];
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
};

export type EquipmentCategoryTypeConnection = {
  __typename?: 'EquipmentCategoryTypeConnection';
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<EquipmentCategoryTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `EquipmentCategoryType` and its cursor. */
export type EquipmentCategoryTypeEdge = {
  __typename?: 'EquipmentCategoryTypeEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
  /** The item at the end of the edge */
  node?: Maybe<EquipmentCategoryType>;
};

export type EquipmentCategoryUpdateMutationInput = {
  clientMutationId?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  pk: Scalars['Int'];
};

export type EquipmentCategoryUpdateMutationPayload = {
  __typename?: 'EquipmentCategoryUpdateMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  equipmentCategory?: Maybe<EquipmentCategoryType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['Int']>;
};

export type EquipmentCreateMutationInput = {
  categoryId: Scalars['String'];
  clientMutationId?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
};

export type EquipmentCreateMutationPayload = {
  __typename?: 'EquipmentCreateMutationPayload';
  categoryId?: Maybe<Scalars['String']>;
  clientMutationId?: Maybe<Scalars['String']>;
  equipment?: Maybe<EquipmentType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
};

export type EquipmentDeleteMutationInput = {
  clientMutationId?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['ID']>;
};

export type EquipmentDeleteMutationPayload = {
  __typename?: 'EquipmentDeleteMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  deleted?: Maybe<Scalars['Boolean']>;
  errors?: Maybe<Scalars['String']>;
};

export type EquipmentType = Node & {
  __typename?: 'EquipmentType';
  category?: Maybe<EquipmentCategoryType>;
  /** The ID of the object. */
  id: Scalars['ID'];
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
};

export type EquipmentTypeConnection = {
  __typename?: 'EquipmentTypeConnection';
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<EquipmentTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `EquipmentType` and its cursor. */
export type EquipmentTypeEdge = {
  __typename?: 'EquipmentTypeEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
  /** The item at the end of the edge */
  node?: Maybe<EquipmentType>;
};

export type EquipmentUpdateMutationInput = {
  categoryId: Scalars['String'];
  clientMutationId?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  pk: Scalars['Int'];
};

export type EquipmentUpdateMutationPayload = {
  __typename?: 'EquipmentUpdateMutationPayload';
  categoryId?: Maybe<Scalars['String']>;
  clientMutationId?: Maybe<Scalars['String']>;
  equipment?: Maybe<EquipmentType>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['Int']>;
};

export type ErrorType = {
  __typename?: 'ErrorType';
  field: Scalars['String'];
  messages: Array<Scalars['String']>;
};

export type KeywordCategoryType = Node & {
  __typename?: 'KeywordCategoryType';
  /** The ID of the object. */
  id: Scalars['ID'];
  keywordGroups?: Maybe<Array<Maybe<KeywordGroupType>>>;
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
};

export type KeywordCategoryTypeConnection = {
  __typename?: 'KeywordCategoryTypeConnection';
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordCategoryTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `KeywordCategoryType` and its cursor. */
export type KeywordCategoryTypeEdge = {
  __typename?: 'KeywordCategoryTypeEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
  /** The item at the end of the edge */
  node?: Maybe<KeywordCategoryType>;
};

export type KeywordGroupType = Node & {
  __typename?: 'KeywordGroupType';
  /** The ID of the object. */
  id: Scalars['ID'];
  keywords?: Maybe<Array<Maybe<KeywordType>>>;
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
};

export type KeywordGroupTypeConnection = {
  __typename?: 'KeywordGroupTypeConnection';
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordGroupTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `KeywordGroupType` and its cursor. */
export type KeywordGroupTypeEdge = {
  __typename?: 'KeywordGroupTypeEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
  /** The item at the end of the edge */
  node?: Maybe<KeywordGroupType>;
};

export type KeywordType = Node & {
  __typename?: 'KeywordType';
  /** The ID of the object. */
  id: Scalars['ID'];
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
};

export type KeywordTypeConnection = {
  __typename?: 'KeywordTypeConnection';
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<KeywordTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `KeywordType` and its cursor. */
export type KeywordTypeEdge = {
  __typename?: 'KeywordTypeEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
  /** The item at the end of the edge */
  node?: Maybe<KeywordType>;
};

export type LocationType = Node & {
  __typename?: 'LocationType';
  addressCity: Scalars['String'];
  addressStreet: Scalars['String'];
  addressZip: Scalars['String'];
  /** The ID of the object. */
  id: Scalars['ID'];
  latitude?: Maybe<Scalars['String']>;
  longitude?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['Int']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createEquipment?: Maybe<EquipmentCreateMutationPayload>;
  createEquipmentCategory?: Maybe<EquipmentCategoryCreateMutationPayload>;
  createPurpose?: Maybe<PurposeCreateMutationPayload>;
  createReservation?: Maybe<ReservationMutationPayload>;
  createReservationUnit?: Maybe<ReservationUnitCreateMutationPayload>;
  createResource?: Maybe<ResourceCreateMutationPayload>;
  createSpace?: Maybe<SpaceCreateMutationPayload>;
  deleteEquipment?: Maybe<EquipmentDeleteMutationPayload>;
  deleteEquipmentCategory?: Maybe<EquipmentCategoryDeleteMutationPayload>;
  deleteResource?: Maybe<ResourceDeleteMutationPayload>;
  deleteSpace?: Maybe<SpaceDeleteMutationPayload>;
  updateEquipment?: Maybe<EquipmentUpdateMutationPayload>;
  updateEquipmentCategory?: Maybe<EquipmentCategoryUpdateMutationPayload>;
  updatePurpose?: Maybe<PurposeUpdateMutationPayload>;
  updateReservationUnit?: Maybe<ReservationUnitUpdateMutationPayload>;
  updateResource?: Maybe<ResourceUpdateMutationPayload>;
  updateSpace?: Maybe<SpaceUpdateMutationPayload>;
  updateUnit?: Maybe<UnitUpdateMutationPayload>;
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
  input: ReservationMutationInput;
};


export type MutationCreateReservationUnitArgs = {
  input: ReservationUnitCreateMutationInput;
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


export type MutationDeleteResourceArgs = {
  input: ResourceDeleteMutationInput;
};


export type MutationDeleteSpaceArgs = {
  input: SpaceDeleteMutationInput;
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


export type MutationUpdateReservationUnitArgs = {
  input: ReservationUnitUpdateMutationInput;
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
  /** The ID of the object. */
  id: Scalars['ID'];
};

export type OpeningHoursType = {
  __typename?: 'OpeningHoursType';
  openingTimePeriods?: Maybe<Array<Maybe<PeriodType>>>;
  openingTimes?: Maybe<Array<Maybe<OpeningTimesType>>>;
};

export type OpeningTimesType = {
  __typename?: 'OpeningTimesType';
  date?: Maybe<Scalars['Date']>;
  endTime?: Maybe<Scalars['Time']>;
  periods?: Maybe<Array<Maybe<Scalars['Int']>>>;
  startTime?: Maybe<Scalars['Time']>;
  state?: Maybe<Scalars['String']>;
};

/** The Relay compliant `PageInfo` type, containing data necessary to paginate this connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']>;
};

export type PeriodType = {
  __typename?: 'PeriodType';
  description?: Maybe<TranslatedStringType>;
  endDate?: Maybe<Scalars['Date']>;
  name?: Maybe<TranslatedStringType>;
  periodId?: Maybe<Scalars['Int']>;
  resourceState?: Maybe<Scalars['String']>;
  startDate?: Maybe<Scalars['Date']>;
  timeSpans?: Maybe<Array<Maybe<TimeSpanType>>>;
};

export type PurposeCreateMutationInput = {
  clientMutationId?: Maybe<Scalars['String']>;
  name: Scalars['String'];
};

export type PurposeCreateMutationPayload = {
  __typename?: 'PurposeCreateMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  purpose?: Maybe<PurposeType>;
};

export type PurposeType = Node & {
  __typename?: 'PurposeType';
  /** The ID of the object. */
  id: Scalars['ID'];
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
};

export type PurposeUpdateMutationInput = {
  clientMutationId?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  pk: Scalars['Int'];
};

export type PurposeUpdateMutationPayload = {
  __typename?: 'PurposeUpdateMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['Int']>;
  purpose?: Maybe<PurposeType>;
};

export type Query = {
  __typename?: 'Query';
  /** The ID of the object */
  equipment?: Maybe<EquipmentType>;
  equipmentByPk?: Maybe<EquipmentType>;
  equipmentCategories?: Maybe<EquipmentCategoryTypeConnection>;
  /** The ID of the object */
  equipmentCategory?: Maybe<EquipmentCategoryType>;
  equipmentCategoryByPk?: Maybe<EquipmentCategoryType>;
  equipments?: Maybe<EquipmentTypeConnection>;
  keywordCategories?: Maybe<KeywordCategoryTypeConnection>;
  keywordGroups?: Maybe<KeywordGroupTypeConnection>;
  keywords?: Maybe<KeywordTypeConnection>;
  /** The ID of the object */
  reservationUnit?: Maybe<ReservationUnitType>;
  reservationUnitByPk?: Maybe<ReservationUnitByPkType>;
  reservationUnits?: Maybe<ReservationUnitTypeConnection>;
  /** The ID of the object */
  resource?: Maybe<ResourceType>;
  resourceByPk?: Maybe<ResourceType>;
  resources?: Maybe<ResourceTypeConnection>;
  /** The ID of the object */
  space?: Maybe<SpaceType>;
  spaceByPk?: Maybe<SpaceType>;
  spaces?: Maybe<SpaceTypeConnection>;
  /** The ID of the object */
  unit?: Maybe<UnitType>;
  unitByPk?: Maybe<UnitByPkType>;
  units?: Maybe<UnitTypeConnection>;
};


export type QueryEquipmentArgs = {
  id: Scalars['ID'];
};


export type QueryEquipmentByPkArgs = {
  pk?: Maybe<Scalars['Int']>;
};


export type QueryEquipmentCategoriesArgs = {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  name_Icontains?: Maybe<Scalars['String']>;
  name_Istartswith?: Maybe<Scalars['String']>;
};


export type QueryEquipmentCategoryArgs = {
  id: Scalars['ID'];
};


export type QueryEquipmentCategoryByPkArgs = {
  pk?: Maybe<Scalars['Int']>;
};


export type QueryEquipmentsArgs = {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  name_Icontains?: Maybe<Scalars['String']>;
  name_Istartswith?: Maybe<Scalars['String']>;
};


export type QueryKeywordCategoriesArgs = {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
};


export type QueryKeywordGroupsArgs = {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
};


export type QueryKeywordsArgs = {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
};


export type QueryReservationUnitArgs = {
  id: Scalars['ID'];
};


export type QueryReservationUnitByPkArgs = {
  pk?: Maybe<Scalars['Int']>;
};


export type QueryReservationUnitsArgs = {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  keywordGroups?: Maybe<Scalars['ID']>;
  last?: Maybe<Scalars['Int']>;
  maxPersonsGte?: Maybe<Scalars['Float']>;
  maxPersonsLte?: Maybe<Scalars['Float']>;
  reservationUnitType?: Maybe<Scalars['ID']>;
  textSearch?: Maybe<Scalars['String']>;
  unit?: Maybe<Scalars['ID']>;
};


export type QueryResourceArgs = {
  id: Scalars['ID'];
};


export type QueryResourceByPkArgs = {
  pk?: Maybe<Scalars['Int']>;
};


export type QueryResourcesArgs = {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  name_Icontains?: Maybe<Scalars['String']>;
  name_Istartswith?: Maybe<Scalars['String']>;
};


export type QuerySpaceArgs = {
  id: Scalars['ID'];
};


export type QuerySpaceByPkArgs = {
  pk?: Maybe<Scalars['Int']>;
};


export type QuerySpacesArgs = {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  name_Icontains?: Maybe<Scalars['String']>;
  name_Istartswith?: Maybe<Scalars['String']>;
};


export type QueryUnitArgs = {
  id: Scalars['ID'];
};


export type QueryUnitByPkArgs = {
  pk?: Maybe<Scalars['Int']>;
};


export type QueryUnitsArgs = {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  name_Icontains?: Maybe<Scalars['String']>;
  name_Istartswith?: Maybe<Scalars['String']>;
};

export type RealEstateType = Node & {
  __typename?: 'RealEstateType';
  district?: Maybe<DistrictType>;
  /** The ID of the object. */
  id: Scalars['ID'];
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
  surfaceArea?: Maybe<Scalars['Float']>;
};

export type ReservationMutationInput = {
  begin: Scalars['DateTime'];
  bufferTimeAfter?: Maybe<Scalars['String']>;
  bufferTimeBefore?: Maybe<Scalars['String']>;
  clientMutationId?: Maybe<Scalars['String']>;
  end: Scalars['DateTime'];
  id?: Maybe<Scalars['ID']>;
  priority: Scalars['String'];
  reservationUnit: Array<Maybe<Scalars['ID']>>;
  state: Scalars['String'];
  user: Scalars['ID'];
};

export type ReservationMutationPayload = {
  __typename?: 'ReservationMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  reservation?: Maybe<ReservationType>;
};

/** An enumeration. */
export enum ReservationPriority {
  /** Low */
  A_100 = 'A_100',
  /** Medium */
  A_200 = 'A_200',
  /** High */
  A_300 = 'A_300'
}

/** An enumeration. */
export enum ReservationState {
  /** cancelled */
  Cancelled = 'CANCELLED',
  /** confirmed */
  Confirmed = 'CONFIRMED',
  /** created */
  Created = 'CREATED',
  /** denied */
  Denied = 'DENIED',
  /** requested */
  Requested = 'REQUESTED',
  /** waiting for payment */
  WaitingForPayment = 'WAITING_FOR_PAYMENT'
}

export type ReservationType = Node & {
  __typename?: 'ReservationType';
  begin: Scalars['DateTime'];
  bufferTimeAfter?: Maybe<Scalars['Float']>;
  bufferTimeBefore?: Maybe<Scalars['Float']>;
  calendarUrl?: Maybe<Scalars['String']>;
  end: Scalars['DateTime'];
  /** The ID of the object. */
  id: Scalars['ID'];
  numPersons?: Maybe<Scalars['Int']>;
  pk?: Maybe<Scalars['Int']>;
  priority: ReservationPriority;
  reservationUnit: ReservationUnitByPkTypeConnection;
  state: ReservationState;
};


export type ReservationTypeReservationUnitArgs = {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
};

export type ReservationUnitByPkType = Node & {
  __typename?: 'ReservationUnitByPkType';
  contactInformation: Scalars['String'];
  description: Scalars['String'];
  equipment?: Maybe<Array<Maybe<EquipmentType>>>;
  haukiUrl?: Maybe<ReservationUnitHaukiUrlType>;
  /** The ID of the object. */
  id: Scalars['ID'];
  images?: Maybe<Array<Maybe<ReservationUnitImageType>>>;
  keywordGroups?: Maybe<Array<Maybe<KeywordGroupType>>>;
  location?: Maybe<LocationType>;
  maxPersons?: Maybe<Scalars['Int']>;
  maxReservationDuration?: Maybe<Scalars['Time']>;
  minReservationDuration?: Maybe<Scalars['Time']>;
  name: Scalars['String'];
  nextAvailableSlot?: Maybe<Scalars['DateTime']>;
  openingHours?: Maybe<OpeningHoursType>;
  pk?: Maybe<Scalars['Int']>;
  purposes?: Maybe<Array<Maybe<PurposeType>>>;
  requireIntroduction: Scalars['Boolean'];
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  services?: Maybe<Array<Maybe<ServiceType>>>;
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  surfaceArea?: Maybe<Scalars['Int']>;
  termsOfUse?: Maybe<Scalars['String']>;
  unit?: Maybe<UnitType>;
  uuid: Scalars['UUID'];
};


export type ReservationUnitByPkTypeOpeningHoursArgs = {
  endDate?: Maybe<Scalars['Date']>;
  openingTimes?: Maybe<Scalars['Boolean']>;
  periods?: Maybe<Scalars['Boolean']>;
  startDate?: Maybe<Scalars['Date']>;
};

export type ReservationUnitByPkTypeConnection = {
  __typename?: 'ReservationUnitByPkTypeConnection';
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitByPkTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ReservationUnitByPkType` and its cursor. */
export type ReservationUnitByPkTypeEdge = {
  __typename?: 'ReservationUnitByPkTypeEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitByPkType>;
};

export type ReservationUnitCreateMutationInput = {
  bufferTimeBetweenReservations?: Maybe<Scalars['String']>;
  clientMutationId?: Maybe<Scalars['String']>;
  /** Contact information for this reservation unit. */
  contactInformation?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  descriptionEn?: Maybe<Scalars['String']>;
  descriptionFi?: Maybe<Scalars['String']>;
  descriptionSv?: Maybe<Scalars['String']>;
  equipmentIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  isDraft?: Maybe<Scalars['Boolean']>;
  maxPersons?: Maybe<Scalars['Int']>;
  maxReservationDuration?: Maybe<Scalars['String']>;
  minReservationDuration?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  nameSv?: Maybe<Scalars['String']>;
  purposeIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: Maybe<Scalars['Boolean']>;
  reservationUnitTypeId?: Maybe<Scalars['String']>;
  resourceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  serviceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  spaceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  surfaceArea?: Maybe<Scalars['Float']>;
  termsOfUse?: Maybe<Scalars['String']>;
  unitId: Scalars['String'];
};

export type ReservationUnitCreateMutationPayload = {
  __typename?: 'ReservationUnitCreateMutationPayload';
  bufferTimeBetweenReservations?: Maybe<Scalars['String']>;
  building?: Maybe<Scalars['String']>;
  clientMutationId?: Maybe<Scalars['String']>;
  /** Contact information for this reservation unit. */
  contactInformation?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  descriptionEn?: Maybe<Scalars['String']>;
  descriptionFi?: Maybe<Scalars['String']>;
  descriptionSv?: Maybe<Scalars['String']>;
  equipmentIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  /** Images of the reservation unit as nested related objects.  */
  images?: Maybe<Array<Maybe<ReservationUnitImageType>>>;
  isDraft?: Maybe<Scalars['Boolean']>;
  /** Location of this reservation unit. Dynamically determined from spaces of the reservation unit. */
  location?: Maybe<Scalars['String']>;
  maxPersons?: Maybe<Scalars['Int']>;
  maxReservationDuration?: Maybe<Scalars['String']>;
  minReservationDuration?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  nameSv?: Maybe<Scalars['String']>;
  purposeIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  purposes?: Maybe<Array<Maybe<PurposeType>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: Maybe<Scalars['Boolean']>;
  reservationUnit?: Maybe<ReservationUnitType>;
  /** Type of the reservation unit as nested related object. */
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservationUnitTypeId?: Maybe<Scalars['String']>;
  resourceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Resources included in the reservation unit as nested related objects. */
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  serviceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Services included in the reservation unit as nested related objects. */
  services?: Maybe<Array<Maybe<ServiceType>>>;
  spaceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Spaces included in the reservation unit as nested related objects. */
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  surfaceArea?: Maybe<Scalars['Float']>;
  termsOfUse?: Maybe<Scalars['String']>;
  unitId?: Maybe<Scalars['String']>;
  uuid?: Maybe<Scalars['String']>;
};

export type ReservationUnitHaukiUrlType = {
  __typename?: 'ReservationUnitHaukiUrlType';
  url?: Maybe<Scalars['String']>;
};

/** An enumeration. */
export enum ReservationUnitImageImageType {
  /** Ground plan */
  GroundPlan = 'GROUND_PLAN',
  /** Main image */
  Main = 'MAIN',
  /** Map */
  Map = 'MAP',
  /** Other */
  Other = 'OTHER'
}

export type ReservationUnitImageType = {
  __typename?: 'ReservationUnitImageType';
  imageType: ReservationUnitImageImageType;
  imageUrl?: Maybe<Scalars['String']>;
  mediumUrl?: Maybe<Scalars['String']>;
  smallUrl?: Maybe<Scalars['String']>;
};

export type ReservationUnitType = Node & {
  __typename?: 'ReservationUnitType';
  bufferTimeBetweenReservations?: Maybe<Scalars['Float']>;
  contactInformation: Scalars['String'];
  description: Scalars['String'];
  equipment?: Maybe<Array<Maybe<EquipmentType>>>;
  /** The ID of the object. */
  id: Scalars['ID'];
  images?: Maybe<Array<Maybe<ReservationUnitImageType>>>;
  isDraft: Scalars['Boolean'];
  keywordGroups?: Maybe<Array<Maybe<KeywordGroupType>>>;
  location?: Maybe<LocationType>;
  maxPersons?: Maybe<Scalars['Int']>;
  maxReservationDuration?: Maybe<Scalars['Time']>;
  minReservationDuration?: Maybe<Scalars['Time']>;
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
  purposes?: Maybe<Array<Maybe<PurposeType>>>;
  requireIntroduction: Scalars['Boolean'];
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  services?: Maybe<Array<Maybe<ServiceType>>>;
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  surfaceArea?: Maybe<Scalars['Int']>;
  termsOfUse?: Maybe<Scalars['String']>;
  unit?: Maybe<UnitType>;
  uuid: Scalars['UUID'];
};

export type ReservationUnitTypeConnection = {
  __typename?: 'ReservationUnitTypeConnection';
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ReservationUnitType` and its cursor. */
export type ReservationUnitTypeEdge = {
  __typename?: 'ReservationUnitTypeEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
  /** The item at the end of the edge */
  node?: Maybe<ReservationUnitType>;
};

export type ReservationUnitTypeType = Node & {
  __typename?: 'ReservationUnitTypeType';
  /** The ID of the object. */
  id: Scalars['ID'];
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
};

export type ReservationUnitUpdateMutationInput = {
  bufferTimeBetweenReservations?: Maybe<Scalars['String']>;
  clientMutationId?: Maybe<Scalars['String']>;
  /** Contact information for this reservation unit. */
  contactInformation?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  descriptionEn?: Maybe<Scalars['String']>;
  descriptionFi?: Maybe<Scalars['String']>;
  descriptionSv?: Maybe<Scalars['String']>;
  equipmentIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  isDraft?: Maybe<Scalars['Boolean']>;
  maxPersons?: Maybe<Scalars['Int']>;
  maxReservationDuration?: Maybe<Scalars['String']>;
  minReservationDuration?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  nameSv?: Maybe<Scalars['String']>;
  pk: Scalars['Int'];
  purposeIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: Maybe<Scalars['Boolean']>;
  reservationUnitTypeId?: Maybe<Scalars['String']>;
  resourceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  serviceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  spaceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  surfaceArea?: Maybe<Scalars['Float']>;
  termsOfUse?: Maybe<Scalars['String']>;
  unitId?: Maybe<Scalars['String']>;
};

export type ReservationUnitUpdateMutationPayload = {
  __typename?: 'ReservationUnitUpdateMutationPayload';
  bufferTimeBetweenReservations?: Maybe<Scalars['String']>;
  building?: Maybe<Scalars['String']>;
  clientMutationId?: Maybe<Scalars['String']>;
  /** Contact information for this reservation unit. */
  contactInformation?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  descriptionEn?: Maybe<Scalars['String']>;
  descriptionFi?: Maybe<Scalars['String']>;
  descriptionSv?: Maybe<Scalars['String']>;
  equipmentIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  /** Images of the reservation unit as nested related objects.  */
  images?: Maybe<Array<Maybe<ReservationUnitImageType>>>;
  isDraft?: Maybe<Scalars['Boolean']>;
  /** Location of this reservation unit. Dynamically determined from spaces of the reservation unit. */
  location?: Maybe<Scalars['String']>;
  maxPersons?: Maybe<Scalars['Int']>;
  maxReservationDuration?: Maybe<Scalars['String']>;
  minReservationDuration?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  nameSv?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['Int']>;
  purposeIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  purposes?: Maybe<Array<Maybe<PurposeType>>>;
  /** Determines if introduction is required in order to reserve this reservation unit. */
  requireIntroduction?: Maybe<Scalars['Boolean']>;
  reservationUnit?: Maybe<ReservationUnitType>;
  /** Type of the reservation unit as nested related object. */
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservationUnitTypeId?: Maybe<Scalars['String']>;
  resourceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Resources included in the reservation unit as nested related objects. */
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  serviceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Services included in the reservation unit as nested related objects. */
  services?: Maybe<Array<Maybe<ServiceType>>>;
  spaceIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Spaces included in the reservation unit as nested related objects. */
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  surfaceArea?: Maybe<Scalars['Float']>;
  termsOfUse?: Maybe<Scalars['String']>;
  unitId?: Maybe<Scalars['String']>;
  uuid?: Maybe<Scalars['String']>;
};

export type ResourceCreateMutationInput = {
  /** Begin date and time of the reservation. */
  bufferTimeAfter?: Maybe<Scalars['String']>;
  /** Buffer time while reservation unit is unreservable after the reservation. Dynamically calculated from spaces and resources. */
  bufferTimeBefore?: Maybe<Scalars['String']>;
  clientMutationId?: Maybe<Scalars['String']>;
  descriptionEn?: Maybe<Scalars['String']>;
  descriptionFi?: Maybe<Scalars['String']>;
  descriptionSv?: Maybe<Scalars['String']>;
  isDraft?: Maybe<Scalars['Boolean']>;
  locationType?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  nameSv?: Maybe<Scalars['String']>;
  /** Id of related space for this resource. */
  spaceId?: Maybe<Scalars['String']>;
};

export type ResourceCreateMutationPayload = {
  __typename?: 'ResourceCreateMutationPayload';
  /** Begin date and time of the reservation. */
  bufferTimeAfter?: Maybe<Scalars['String']>;
  /** Buffer time while reservation unit is unreservable after the reservation. Dynamically calculated from spaces and resources. */
  bufferTimeBefore?: Maybe<Scalars['String']>;
  clientMutationId?: Maybe<Scalars['String']>;
  descriptionEn?: Maybe<Scalars['String']>;
  descriptionFi?: Maybe<Scalars['String']>;
  descriptionSv?: Maybe<Scalars['String']>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  isDraft?: Maybe<Scalars['Boolean']>;
  locationType?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  nameSv?: Maybe<Scalars['String']>;
  resource?: Maybe<ResourceType>;
  /** Id of related space for this resource. */
  spaceId?: Maybe<Scalars['String']>;
};

export type ResourceDeleteMutationInput = {
  clientMutationId?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['ID']>;
};

export type ResourceDeleteMutationPayload = {
  __typename?: 'ResourceDeleteMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  deleted?: Maybe<Scalars['Boolean']>;
  errors?: Maybe<Scalars['String']>;
};

/** An enumeration. */
export enum ResourceLocationType {
  /** Fixed */
  Fixed = 'FIXED',
  /** Movable */
  Movable = 'MOVABLE'
}

export type ResourceType = Node & {
  __typename?: 'ResourceType';
  bufferTimeAfter?: Maybe<Scalars['Float']>;
  bufferTimeBefore?: Maybe<Scalars['Float']>;
  building?: Maybe<Array<Maybe<BuildingType>>>;
  description: Scalars['String'];
  /** The ID of the object. */
  id: Scalars['ID'];
  isDraft: Scalars['Boolean'];
  locationType: ResourceLocationType;
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
  space?: Maybe<SpaceType>;
};

export type ResourceTypeConnection = {
  __typename?: 'ResourceTypeConnection';
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ResourceTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ResourceType` and its cursor. */
export type ResourceTypeEdge = {
  __typename?: 'ResourceTypeEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
  /** The item at the end of the edge */
  node?: Maybe<ResourceType>;
};

export type ResourceUpdateMutationInput = {
  /** Begin date and time of the reservation. */
  bufferTimeAfter?: Maybe<Scalars['String']>;
  /** Buffer time while reservation unit is unreservable after the reservation. Dynamically calculated from spaces and resources. */
  bufferTimeBefore?: Maybe<Scalars['String']>;
  clientMutationId?: Maybe<Scalars['String']>;
  descriptionEn?: Maybe<Scalars['String']>;
  descriptionFi?: Maybe<Scalars['String']>;
  descriptionSv?: Maybe<Scalars['String']>;
  isDraft?: Maybe<Scalars['Boolean']>;
  locationType?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  nameSv?: Maybe<Scalars['String']>;
  pk: Scalars['Int'];
  /** Id of related space for this resource. */
  spaceId?: Maybe<Scalars['String']>;
};

export type ResourceUpdateMutationPayload = {
  __typename?: 'ResourceUpdateMutationPayload';
  /** Begin date and time of the reservation. */
  bufferTimeAfter?: Maybe<Scalars['String']>;
  /** Buffer time while reservation unit is unreservable after the reservation. Dynamically calculated from spaces and resources. */
  bufferTimeBefore?: Maybe<Scalars['String']>;
  clientMutationId?: Maybe<Scalars['String']>;
  descriptionEn?: Maybe<Scalars['String']>;
  descriptionFi?: Maybe<Scalars['String']>;
  descriptionSv?: Maybe<Scalars['String']>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  isDraft?: Maybe<Scalars['Boolean']>;
  locationType?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  nameSv?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['Int']>;
  resource?: Maybe<ResourceType>;
  /** Id of related space for this resource. */
  spaceId?: Maybe<Scalars['String']>;
};

/** An enumeration. */
export enum ServiceServiceType {
  /** Catering */
  Catering = 'CATERING',
  /** Configuration */
  Configuration = 'CONFIGURATION',
  /** Introduction */
  Introduction = 'INTRODUCTION'
}

export type ServiceType = Node & {
  __typename?: 'ServiceType';
  bufferTimeAfter?: Maybe<Scalars['String']>;
  bufferTimeBefore?: Maybe<Scalars['String']>;
  /** The ID of the object. */
  id: Scalars['ID'];
  name: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
  serviceType: ServiceServiceType;
};

export type SpaceCreateMutationInput = {
  clientMutationId?: Maybe<Scalars['String']>;
  code?: Maybe<Scalars['String']>;
  /** Id of district for this space. */
  districtId?: Maybe<Scalars['String']>;
  maxPersons?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi: Scalars['String'];
  nameSv?: Maybe<Scalars['String']>;
  /** Id of parent space for this space. */
  parentId?: Maybe<Scalars['String']>;
  /** Surface area of the space as square meters */
  surfaceArea?: Maybe<Scalars['Float']>;
  termsOfUse?: Maybe<Scalars['String']>;
  unitId?: Maybe<Scalars['String']>;
};

export type SpaceCreateMutationPayload = {
  __typename?: 'SpaceCreateMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  code?: Maybe<Scalars['String']>;
  /** Id of district for this space. */
  districtId?: Maybe<Scalars['String']>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  maxPersons?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  nameSv?: Maybe<Scalars['String']>;
  /** Id of parent space for this space. */
  parentId?: Maybe<Scalars['String']>;
  space?: Maybe<SpaceType>;
  /** Surface area of the space as square meters */
  surfaceArea?: Maybe<Scalars['Float']>;
  termsOfUse?: Maybe<Scalars['String']>;
  unitId?: Maybe<Scalars['String']>;
};

export type SpaceDeleteMutationInput = {
  clientMutationId?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['ID']>;
};

export type SpaceDeleteMutationPayload = {
  __typename?: 'SpaceDeleteMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  deleted?: Maybe<Scalars['Boolean']>;
  errors?: Maybe<Scalars['String']>;
};

export type SpaceType = Node & {
  __typename?: 'SpaceType';
  building?: Maybe<BuildingType>;
  children?: Maybe<Array<Maybe<SpaceType>>>;
  code: Scalars['String'];
  /** The ID of the object. */
  id: Scalars['ID'];
  maxPersons?: Maybe<Scalars['Int']>;
  name: Scalars['String'];
  parent?: Maybe<SpaceType>;
  pk?: Maybe<Scalars['Int']>;
  resources?: Maybe<Array<Maybe<ResourceType>>>;
  surfaceArea?: Maybe<Scalars['Float']>;
  termsOfUse: Scalars['String'];
  unit?: Maybe<UnitByPkType>;
};

export type SpaceTypeConnection = {
  __typename?: 'SpaceTypeConnection';
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<SpaceTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `SpaceType` and its cursor. */
export type SpaceTypeEdge = {
  __typename?: 'SpaceTypeEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
  /** The item at the end of the edge */
  node?: Maybe<SpaceType>;
};

export type SpaceUpdateMutationInput = {
  clientMutationId?: Maybe<Scalars['String']>;
  code?: Maybe<Scalars['String']>;
  /** Id of district for this space. */
  districtId?: Maybe<Scalars['String']>;
  maxPersons?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  nameSv?: Maybe<Scalars['String']>;
  /** Id of parent space for this space. */
  parentId?: Maybe<Scalars['String']>;
  pk: Scalars['Int'];
  /** Surface area of the space as square meters */
  surfaceArea?: Maybe<Scalars['Float']>;
  termsOfUse?: Maybe<Scalars['String']>;
  unitId?: Maybe<Scalars['String']>;
};

export type SpaceUpdateMutationPayload = {
  __typename?: 'SpaceUpdateMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  code?: Maybe<Scalars['String']>;
  /** Id of district for this space. */
  districtId?: Maybe<Scalars['String']>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  maxPersons?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  nameEn?: Maybe<Scalars['String']>;
  nameFi?: Maybe<Scalars['String']>;
  nameSv?: Maybe<Scalars['String']>;
  /** Id of parent space for this space. */
  parentId?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['Int']>;
  space?: Maybe<SpaceType>;
  /** Surface area of the space as square meters */
  surfaceArea?: Maybe<Scalars['Float']>;
  termsOfUse?: Maybe<Scalars['String']>;
  unitId?: Maybe<Scalars['String']>;
};

export type TimeSpanType = {
  __typename?: 'TimeSpanType';
  description?: Maybe<TranslatedStringType>;
  endTime?: Maybe<Scalars['Time']>;
  endTimeOnNextDay?: Maybe<Scalars['Boolean']>;
  name?: Maybe<TranslatedStringType>;
  resourceState?: Maybe<Scalars['String']>;
  startTime?: Maybe<Scalars['Time']>;
  weekdays?: Maybe<Array<Maybe<Scalars['Int']>>>;
};

export type TranslatedStringType = {
  __typename?: 'TranslatedStringType';
  en?: Maybe<Scalars['String']>;
  fi?: Maybe<Scalars['String']>;
  sv?: Maybe<Scalars['String']>;
};

export type UnitByPkType = Node & {
  __typename?: 'UnitByPkType';
  description: Scalars['String'];
  email: Scalars['String'];
  /** The ID of the object. */
  id: Scalars['ID'];
  location?: Maybe<LocationType>;
  name: Scalars['String'];
  openingHours?: Maybe<OpeningHoursType>;
  phone: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
  reservationUnits?: Maybe<Array<Maybe<ReservationUnitType>>>;
  shortDescription: Scalars['String'];
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  tprekId?: Maybe<Scalars['String']>;
  webPage: Scalars['String'];
};


export type UnitByPkTypeOpeningHoursArgs = {
  endDate?: Maybe<Scalars['Date']>;
  openingTimes?: Maybe<Scalars['Boolean']>;
  periods?: Maybe<Scalars['Boolean']>;
  startDate?: Maybe<Scalars['Date']>;
};

export type UnitType = Node & {
  __typename?: 'UnitType';
  description: Scalars['String'];
  email: Scalars['String'];
  /** The ID of the object. */
  id: Scalars['ID'];
  location?: Maybe<LocationType>;
  name: Scalars['String'];
  phone: Scalars['String'];
  pk?: Maybe<Scalars['Int']>;
  reservationUnits?: Maybe<Array<Maybe<ReservationUnitType>>>;
  shortDescription: Scalars['String'];
  spaces?: Maybe<Array<Maybe<SpaceType>>>;
  tprekId?: Maybe<Scalars['String']>;
  webPage: Scalars['String'];
};

export type UnitTypeConnection = {
  __typename?: 'UnitTypeConnection';
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<UnitTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `UnitType` and its cursor. */
export type UnitTypeEdge = {
  __typename?: 'UnitTypeEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
  /** The item at the end of the edge */
  node?: Maybe<UnitType>;
};

export type UnitUpdateMutationInput = {
  clientMutationId?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  pk: Scalars['Int'];
  shortDescription?: Maybe<Scalars['String']>;
  tprekId?: Maybe<Scalars['String']>;
  webPage?: Maybe<Scalars['String']>;
};

export type UnitUpdateMutationPayload = {
  __typename?: 'UnitUpdateMutationPayload';
  clientMutationId?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  /** May contain more than one error for same field. */
  errors?: Maybe<Array<Maybe<ErrorType>>>;
  id?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  pk?: Maybe<Scalars['Int']>;
  shortDescription?: Maybe<Scalars['String']>;
  tprekId?: Maybe<Scalars['String']>;
  unit?: Maybe<UnitType>;
  webPage?: Maybe<Scalars['String']>;
};
