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

export type AddressType = Node & {
  __typename?: "AddressType";
  city: Scalars["String"];
  /** The ID of the object */
  id: Scalars["ID"];
  pk?: Maybe<Scalars["Int"]>;
  postCode: Scalars["String"];
  streetAddress: Scalars["String"];
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

export type ApplicationAggregatedDataType = {
  __typename?: "ApplicationAggregatedDataType";
  appliedMinDurationTotal?: Maybe<Scalars["Float"]>;
  appliedReservationsTotal?: Maybe<Scalars["Float"]>;
  createdReservationsTotal?: Maybe<Scalars["Float"]>;
  reservationsDurationTotal?: Maybe<Scalars["Float"]>;
};

export type ApplicationEventAggregatedDataType = {
  __typename?: "ApplicationEventAggregatedDataType";
  allocationResultsDurationTotal?: Maybe<Scalars["Float"]>;
  allocationResultsReservationsTotal?: Maybe<Scalars["Float"]>;
  durationTotal?: Maybe<Scalars["Float"]>;
  reservationsTotal?: Maybe<Scalars["Float"]>;
};

export type ApplicationEventScheduleType = Node & {
  __typename?: "ApplicationEventScheduleType";
  begin: Scalars["Time"];
  day: ApplicationsApplicationEventScheduleDayChoices;
  end: Scalars["Time"];
  /** The ID of the object */
  id: Scalars["ID"];
  pk?: Maybe<Scalars["Int"]>;
  priority: ApplicationsApplicationEventSchedulePriorityChoices;
};

export type ApplicationEventType = Node & {
  __typename?: "ApplicationEventType";
  abilityGroup?: Maybe<AbilityGroupType>;
  abilityGroupId?: Maybe<Scalars["Int"]>;
  ageGroup?: Maybe<AgeGroupType>;
  ageGroupId?: Maybe<Scalars["Int"]>;
  aggregatedData?: Maybe<ApplicationEventAggregatedDataType>;
  applicationEventSchedules?: Maybe<Array<Maybe<ApplicationEventScheduleType>>>;
  applicationId?: Maybe<Scalars["Int"]>;
  begin?: Maybe<Scalars["Date"]>;
  biweekly: Scalars["Boolean"];
  declinedReservationUnits?: Maybe<Array<ReservationUnitType>>;
  end?: Maybe<Scalars["Date"]>;
  eventReservationUnits?: Maybe<Array<Maybe<EventReservationUnitType>>>;
  eventsPerWeek?: Maybe<Scalars["Int"]>;
  /** The ID of the object */
  id: Scalars["ID"];
  maxDuration?: Maybe<Scalars["Float"]>;
  minDuration?: Maybe<Scalars["Float"]>;
  name: Scalars["String"];
  numPersons?: Maybe<Scalars["Int"]>;
  pk?: Maybe<Scalars["Int"]>;
  purpose?: Maybe<ReservationPurposeType>;
  purposeId?: Maybe<Scalars["Int"]>;
  status?: Maybe<ApplicationEventStatus>;
  uuid: Scalars["UUID"];
  weeklyAmountReductionsCount?: Maybe<Scalars["Int"]>;
};

export type ApplicationEventTypeConnection = {
  __typename?: "ApplicationEventTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ApplicationEventTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]>;
};

/** A Relay edge containing a `ApplicationEventType` and its cursor. */
export type ApplicationEventTypeEdge = {
  __typename?: "ApplicationEventTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ApplicationEventType>;
};

export type ApplicationRoundAggregatedDataType = {
  __typename?: "ApplicationRoundAggregatedDataType";
  allocationDurationTotal?: Maybe<Scalars["Int"]>;
  allocationResultEventsCount?: Maybe<Scalars["Int"]>;
  totalHourCapacity?: Maybe<Scalars["Int"]>;
  totalReservationDuration?: Maybe<Scalars["Int"]>;
};

export type ApplicationRoundBasketType = Node & {
  __typename?: "ApplicationRoundBasketType";
  ageGroupIds?: Maybe<Array<Maybe<Scalars["Int"]>>>;
  allocationPercentage: Scalars["Int"];
  customerType: Array<Maybe<Scalars["String"]>>;
  homeCityId?: Maybe<Scalars["Int"]>;
  /** The ID of the object */
  id: Scalars["ID"];
  mustBeMainPurposeOfApplicant: Scalars["Boolean"];
  name: Scalars["String"];
  orderNumber: Scalars["Int"];
  pk?: Maybe<Scalars["Int"]>;
  purposeIds?: Maybe<Array<Maybe<Scalars["Int"]>>>;
};

export type ApplicationRoundType = Node & {
  __typename?: "ApplicationRoundType";
  aggregatedData?: Maybe<ApplicationRoundAggregatedDataType>;
  allocating: Scalars["Boolean"];
  applicationPeriodBegin: Scalars["DateTime"];
  applicationPeriodEnd: Scalars["DateTime"];
  applicationRoundBaskets?: Maybe<Array<Maybe<ApplicationRoundBasketType>>>;
  applicationsCount?: Maybe<Scalars["Int"]>;
  applicationsSent?: Maybe<Scalars["Boolean"]>;
  approvedBy?: Maybe<Scalars["String"]>;
  criteriaEn?: Maybe<Scalars["String"]>;
  criteriaFi?: Maybe<Scalars["String"]>;
  criteriaSv?: Maybe<Scalars["String"]>;
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
  publicDisplayBegin: Scalars["DateTime"];
  publicDisplayEnd: Scalars["DateTime"];
  purposes?: Maybe<Array<Maybe<ReservationPurposeType>>>;
  reservationPeriodBegin: Scalars["Date"];
  reservationPeriodEnd: Scalars["Date"];
  reservationUnitCount?: Maybe<Scalars["Int"]>;
  reservationUnits?: Maybe<Array<Maybe<ReservationUnitType>>>;
  serviceSector?: Maybe<ServiceSectorType>;
  status?: Maybe<ApplicationRoundStatus>;
  statusTimestamp?: Maybe<Scalars["DateTime"]>;
  targetGroup: ApplicationsApplicationRoundTargetGroupChoices;
};

export type ApplicationRoundTypeConnection = {
  __typename?: "ApplicationRoundTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ApplicationRoundTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]>;
};

/** A Relay edge containing a `ApplicationRoundType` and its cursor. */
export type ApplicationRoundTypeEdge = {
  __typename?: "ApplicationRoundTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ApplicationRoundType>;
};

export type ApplicationType = Node & {
  __typename?: "ApplicationType";
  /** Additional information about the application */
  additionalInformation?: Maybe<Scalars["String"]>;
  aggregatedData?: Maybe<ApplicationAggregatedDataType>;
  applicantEmail?: Maybe<Scalars["String"]>;
  applicantId?: Maybe<Scalars["Int"]>;
  applicantName?: Maybe<Scalars["String"]>;
  applicantType?: Maybe<ApplicationsApplicationApplicantTypeChoices>;
  applicationEvents?: Maybe<Array<Maybe<ApplicationEventType>>>;
  applicationRoundId?: Maybe<Scalars["Int"]>;
  billingAddress?: Maybe<AddressType>;
  contactPerson?: Maybe<PersonType>;
  createdDate: Scalars["DateTime"];
  homeCity?: Maybe<CityType>;
  /** The ID of the object */
  id: Scalars["ID"];
  lastModifiedDate: Scalars["DateTime"];
  organisation?: Maybe<OrganisationType>;
  pk?: Maybe<Scalars["Int"]>;
  status?: Maybe<ApplicationStatus>;
};

export type ApplicationTypeConnection = {
  __typename?: "ApplicationTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ApplicationTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]>;
};

/** A Relay edge containing a `ApplicationType` and its cursor. */
export type ApplicationTypeEdge = {
  __typename?: "ApplicationTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ApplicationType>;
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
export enum ApplicationsApplicationEventScheduleDayChoices {
  /** maanantai */
  A_0 = "A_0",
  /** tiistai */
  A_1 = "A_1",
  /** keskiviikko */
  A_2 = "A_2",
  /** torstai */
  A_3 = "A_3",
  /** perjantai */
  A_4 = "A_4",
  /** lauantai */
  A_5 = "A_5",
  /** sunnuntai */
  A_6 = "A_6",
}

/** An enumeration. */
export enum ApplicationsApplicationEventSchedulePriorityChoices {
  /** Low */
  A_100 = "A_100",
  /** Medium */
  A_200 = "A_200",
  /** High */
  A_300 = "A_300",
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
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type CityTypeConnection = {
  __typename?: "CityTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<CityTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]>;
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
  totalCount?: Maybe<Scalars["Int"]>;
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
  totalCount?: Maybe<Scalars["Int"]>;
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

export type EventReservationUnitType = Node & {
  __typename?: "EventReservationUnitType";
  /** The ID of the object */
  id: Scalars["ID"];
  pk?: Maybe<Scalars["Int"]>;
  priority?: Maybe<Scalars["Int"]>;
  reservationUnit?: Maybe<ReservationUnitType>;
  reservationUnitId?: Maybe<Scalars["Int"]>;
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
  totalCount?: Maybe<Scalars["Int"]>;
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
  totalCount?: Maybe<Scalars["Int"]>;
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
  totalCount?: Maybe<Scalars["Int"]>;
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

export type OrganisationType = Node & {
  __typename?: "OrganisationType";
  activeMembers?: Maybe<Scalars["Int"]>;
  address?: Maybe<AddressType>;
  coreBusiness: Scalars["String"];
  email: Scalars["String"];
  /** The ID of the object */
  id: Scalars["ID"];
  identifier?: Maybe<Scalars["String"]>;
  name: Scalars["String"];
  organisationType: ApplicationsOrganisationOrganisationTypeChoices;
  pk?: Maybe<Scalars["Int"]>;
  yearEstablished?: Maybe<Scalars["Int"]>;
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

export type PersonType = Node & {
  __typename?: "PersonType";
  email?: Maybe<Scalars["String"]>;
  firstName: Scalars["String"];
  /** The ID of the object */
  id: Scalars["ID"];
  lastName: Scalars["String"];
  phoneNumber?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
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
  totalCount?: Maybe<Scalars["Int"]>;
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
  applicationEvents?: Maybe<ApplicationEventTypeConnection>;
  applicationRounds?: Maybe<ApplicationRoundTypeConnection>;
  applications?: Maybe<ApplicationTypeConnection>;
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
  serviceSectors?: Maybe<ServiceSectorTypeConnection>;
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

export type QueryApplicationEventsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  application?: InputMaybe<Scalars["ID"]>;
  applicationRound?: InputMaybe<Scalars["ID"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Scalars["String"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  reservationUnit?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  status?: InputMaybe<Scalars["String"]>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  user?: InputMaybe<Scalars["ID"]>;
};

export type QueryApplicationRoundsArgs = {
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

export type QueryApplicationsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  applicationRound?: InputMaybe<Scalars["ID"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Scalars["String"]>;
  status?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>;
  unit?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  user?: InputMaybe<Scalars["ID"]>;
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
  name?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Scalars["String"]>;
  rankGte?: InputMaybe<Scalars["Float"]>;
  rankLte?: InputMaybe<Scalars["Float"]>;
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
  applicationRound?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  isDraft?: InputMaybe<Scalars["Boolean"]>;
  isVisible?: InputMaybe<Scalars["Boolean"]>;
  keywordGroups?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  last?: InputMaybe<Scalars["Int"]>;
  maxPersonsGte?: InputMaybe<Scalars["Float"]>;
  maxPersonsLte?: InputMaybe<Scalars["Float"]>;
  nameEn?: InputMaybe<Scalars["String"]>;
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Scalars["String"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  purposes?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  rankGte?: InputMaybe<Scalars["Float"]>;
  rankLte?: InputMaybe<Scalars["Float"]>;
  reservationKind?: InputMaybe<Scalars["String"]>;
  reservationUnitType?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  surfaceAreaGte?: InputMaybe<Scalars["Float"]>;
  surfaceAreaLte?: InputMaybe<Scalars["Float"]>;
  textSearch?: InputMaybe<Scalars["String"]>;
  typeRankGte?: InputMaybe<Scalars["Float"]>;
  typeRankLte?: InputMaybe<Scalars["Float"]>;
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

export type QueryServiceSectorsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
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
  nameFi?: InputMaybe<Scalars["String"]>;
  nameSv?: InputMaybe<Scalars["String"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Scalars["String"]>;
  pk?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>;
  serviceSector?: InputMaybe<Scalars["Float"]>;
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
  /** String value for ReservationType's ReservationState enum. Possible values are CREATED, CANCELLED, REQUIRES_HANDLING, CONFIRMED, DENIED. */
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
  cancelDetails: Scalars["String"];
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
  /** Is it possible to reserve this reservation unit when opening hours are not defined. */
  allowReservationsWithoutOpeningHours: Scalars["Boolean"];
  applicationRounds?: Maybe<Array<Maybe<ApplicationRoundType>>>;
  /** Authentication required for reserving this reservation unit. */
  authentication: ReservationUnitsReservationUnitAuthenticationChoices;
  bufferTimeAfter?: Maybe<Scalars["Duration"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge: Scalars["Boolean"];
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
  minPersons?: Maybe<Scalars["Int"]>;
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
  /** What kind of reservations are to be booked with this reservation unit. */
  reservationKind: ReservationUnitsReservationUnitReservationKindChoices;
  /** Determines the interval for the start time of the reservation. For example an interval of 15 minutes means a reservation can begin at minutes 15, 30, 60, or 90. Possible values are interval_15_mins, interval_30_mins, interval_60_mins, interval_90_mins. */
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices;
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservations?: Maybe<Array<Maybe<ReservationType>>>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]>;
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
  totalCount?: Maybe<Scalars["Int"]>;
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
  /** Allow reservations without opening hours. Used for testing. */
  allowReservationsWithoutOpeningHours?: InputMaybe<Scalars["Boolean"]>;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: InputMaybe<Scalars["String"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Int"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Int"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge?: InputMaybe<Scalars["Boolean"]>;
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
  minPersons?: InputMaybe<Scalars["Int"]>;
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
  /** What kind of reservations are to be made to this is reservation unit. Possible values are: DIRECT, SEASON, DIRECT_AND_SEASON. */
  reservationKind?: InputMaybe<Scalars["String"]>;
  /** Determines the interval for the start time of the reservation. For example an interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or 45. Possible values are INTERVAL_15_MINS, INTERVAL_30_MINS, INTERVAL_60_MINS, INTERVAL_90_MINS. */
  reservationStartInterval?: InputMaybe<Scalars["String"]>;
  reservationUnitTypePk?: InputMaybe<Scalars["Int"]>;
  reservationsMaxDaysBefore?: InputMaybe<Scalars["Int"]>;
  reservationsMinDaysBefore?: InputMaybe<Scalars["Int"]>;
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
  /** Allow reservations without opening hours. Used for testing. */
  allowReservationsWithoutOpeningHours?: Maybe<Scalars["Boolean"]>;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: Maybe<Scalars["String"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]>;
  building?: Maybe<Scalars["String"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge?: Maybe<Scalars["Boolean"]>;
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
  minPersons?: Maybe<Scalars["Int"]>;
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
  /** What kind of reservations are to be made to this is reservation unit. Possible values are: DIRECT, SEASON, DIRECT_AND_SEASON. */
  reservationKind?: Maybe<Scalars["String"]>;
  /** Determines the interval for the start time of the reservation. For example an interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or 45. Possible values are INTERVAL_15_MINS, INTERVAL_30_MINS, INTERVAL_60_MINS, INTERVAL_90_MINS. */
  reservationStartInterval?: Maybe<Scalars["String"]>;
  reservationUnit?: Maybe<ReservationUnitType>;
  /** Type of the reservation unit as nested related object. */
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservationUnitTypePk?: Maybe<Scalars["Int"]>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]>;
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
  largeUrl?: Maybe<Scalars["String"]>;
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
  /** Is it possible to reserve this reservation unit when opening hours are not defined. */
  allowReservationsWithoutOpeningHours: Scalars["Boolean"];
  applicationRounds?: Maybe<Array<Maybe<ApplicationRoundType>>>;
  /** Authentication required for reserving this reservation unit. */
  authentication: ReservationUnitsReservationUnitAuthenticationChoices;
  bufferTimeAfter?: Maybe<Scalars["Duration"]>;
  bufferTimeBefore?: Maybe<Scalars["Duration"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge: Scalars["Boolean"];
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
  minPersons?: Maybe<Scalars["Int"]>;
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
  /** Order number to be use in api sorting. */
  rank?: Maybe<Scalars["Int"]>;
  requireIntroduction: Scalars["Boolean"];
  /** Does reservations of this reservation unit need to be handled before they're confirmed. */
  requireReservationHandling: Scalars["Boolean"];
  /** Time when making reservations become possible for this reservation unit. */
  reservationBegins?: Maybe<Scalars["DateTime"]>;
  /** Time when making reservations become not possible for this reservation unit */
  reservationEnds?: Maybe<Scalars["DateTime"]>;
  /** What kind of reservations are to be booked with this reservation unit. */
  reservationKind: ReservationUnitsReservationUnitReservationKindChoices;
  /** Determines the interval for the start time of the reservation. For example an interval of 15 minutes means a reservation can begin at minutes 15, 30, 60, or 90. Possible values are interval_15_mins, interval_30_mins, interval_60_mins, interval_90_mins. */
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices;
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservations?: Maybe<Array<Maybe<ReservationType>>>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]>;
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
  totalCount?: Maybe<Scalars["Int"]>;
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
  /** Order number to be used in api sorting. */
  rank?: Maybe<Scalars["Int"]>;
};

export type ReservationUnitTypeTypeConnection = {
  __typename?: "ReservationUnitTypeTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ReservationUnitTypeTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]>;
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
  /** Allow reservations without opening hours. Used for testing. */
  allowReservationsWithoutOpeningHours?: InputMaybe<Scalars["Boolean"]>;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: InputMaybe<Scalars["String"]>;
  bufferTimeAfter?: InputMaybe<Scalars["Int"]>;
  bufferTimeBefore?: InputMaybe<Scalars["Int"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge?: InputMaybe<Scalars["Boolean"]>;
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
  minPersons?: InputMaybe<Scalars["Int"]>;
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
  /** What kind of reservations are to be made to this is reservation unit. Possible values are: DIRECT, SEASON, DIRECT_AND_SEASON. */
  reservationKind?: InputMaybe<Scalars["String"]>;
  /** Determines the interval for the start time of the reservation. For example an interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or 45. Possible values are INTERVAL_15_MINS, INTERVAL_30_MINS, INTERVAL_60_MINS, INTERVAL_90_MINS. */
  reservationStartInterval?: InputMaybe<Scalars["String"]>;
  reservationUnitTypePk?: InputMaybe<Scalars["Int"]>;
  reservationsMaxDaysBefore?: InputMaybe<Scalars["Int"]>;
  reservationsMinDaysBefore?: InputMaybe<Scalars["Int"]>;
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
  /** Allow reservations without opening hours. Used for testing. */
  allowReservationsWithoutOpeningHours?: Maybe<Scalars["Boolean"]>;
  /** Authentication required for reserving this reservation unit. Possible values are WEAK, STRONG. */
  authentication?: Maybe<Scalars["String"]>;
  bufferTimeAfter?: Maybe<Scalars["Int"]>;
  bufferTimeBefore?: Maybe<Scalars["Int"]>;
  building?: Maybe<Scalars["String"]>;
  /** Can reservations to this reservation unit be able to apply free of charge. */
  canApplyFreeOfCharge?: Maybe<Scalars["Boolean"]>;
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
  minPersons?: Maybe<Scalars["Int"]>;
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
  /** What kind of reservations are to be made to this is reservation unit. Possible values are: DIRECT, SEASON, DIRECT_AND_SEASON. */
  reservationKind?: Maybe<Scalars["String"]>;
  /** Determines the interval for the start time of the reservation. For example an interval of 15 minutes means a reservation can begin at minutes 0, 15, 30, or 45. Possible values are INTERVAL_15_MINS, INTERVAL_30_MINS, INTERVAL_60_MINS, INTERVAL_90_MINS. */
  reservationStartInterval?: Maybe<Scalars["String"]>;
  reservationUnit?: Maybe<ReservationUnitType>;
  /** Type of the reservation unit as nested related object. */
  reservationUnitType?: Maybe<ReservationUnitTypeType>;
  reservationUnitTypePk?: Maybe<Scalars["Int"]>;
  reservationsMaxDaysBefore?: Maybe<Scalars["Int"]>;
  reservationsMinDaysBefore?: Maybe<Scalars["Int"]>;
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
export enum ReservationUnitsReservationUnitReservationKindChoices {
  /** Direct */
  Direct = "DIRECT",
  /** Direct and season */
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
  /** String value for ReservationType's ReservationState enum. Possible values are CREATED, CANCELLED, REQUIRES_HANDLING, CONFIRMED, DENIED. */
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
  /** String value for ReservationType's ReservationState enum. Possible values are CREATED, CANCELLED, REQUIRES_HANDLING, CONFIRMED, DENIED. */
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
  /** Buffer time while reservation unit is unreservable after the reservation. Dynamically calculated from spaces and resources. */
  bufferTimeAfter?: InputMaybe<Scalars["Int"]>;
  /** Buffer time while reservation unit is unreservable before the reservation. Dynamically calculated from spaces and resources. */
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
  /** Buffer time while reservation unit is unreservable after the reservation. Dynamically calculated from spaces and resources. */
  bufferTimeAfter?: Maybe<Scalars["Int"]>;
  /** Buffer time while reservation unit is unreservable before the reservation. Dynamically calculated from spaces and resources. */
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
  totalCount?: Maybe<Scalars["Int"]>;
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
  /** Buffer time while reservation unit is unreservable after the reservation. Dynamically calculated from spaces and resources. */
  bufferTimeAfter?: InputMaybe<Scalars["Int"]>;
  /** Buffer time while reservation unit is unreservable before the reservation. Dynamically calculated from spaces and resources. */
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
  /** Buffer time while reservation unit is unreservable after the reservation. Dynamically calculated from spaces and resources. */
  bufferTimeAfter?: Maybe<Scalars["Int"]>;
  /** Buffer time while reservation unit is unreservable before the reservation. Dynamically calculated from spaces and resources. */
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

export type ServiceSectorType = Node & {
  __typename?: "ServiceSectorType";
  /** The ID of the object */
  id: Scalars["ID"];
  nameEn?: Maybe<Scalars["String"]>;
  nameFi?: Maybe<Scalars["String"]>;
  nameSv?: Maybe<Scalars["String"]>;
  pk?: Maybe<Scalars["Int"]>;
};

export type ServiceSectorTypeConnection = {
  __typename?: "ServiceSectorTypeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ServiceSectorTypeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars["Int"]>;
};

/** A Relay edge containing a `ServiceSectorType` and its cursor. */
export type ServiceSectorTypeEdge = {
  __typename?: "ServiceSectorTypeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ServiceSectorType>;
};

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
  totalCount?: Maybe<Scalars["Int"]>;
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
  totalCount?: Maybe<Scalars["Int"]>;
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
  totalCount?: Maybe<Scalars["Int"]>;
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
  serviceSectors?: Maybe<Array<Maybe<ServiceSectorType>>>;
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
  serviceSectors?: Maybe<Array<Maybe<ServiceSectorType>>>;
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
  totalCount?: Maybe<Scalars["Int"]>;
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
export enum ApplicationEventStatus {
  Allocated = "allocated",
  Approved = "approved",
  Created = "created",
  Declined = "declined",
  Validated = "validated",
}

/** An enumeration. */
export enum ApplicationRoundStatus {
  Allocated = "allocated",
  Approved = "approved",
  Draft = "draft",
  Handled = "handled",
  InReview = "in_review",
  ReviewDone = "review_done",
  Validated = "validated",
}

/** An enumeration. */
export enum ApplicationStatus {
  Cancelled = "cancelled",
  Declined = "declined",
  Draft = "draft",
  InReview = "in_review",
  ReviewDone = "review_done",
  Sent = "sent",
}

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
