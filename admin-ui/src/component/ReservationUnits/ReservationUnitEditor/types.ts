import Joi from "joi";
import {
  Maybe,
  Query,
  ReservationUnitByPkType,
  ReservationUnitCreateMutationInput,
  ReservationUnitPricingUpdateSerializerInput,
  ReservationUnitsReservationUnitImageImageTypeChoices,
  ReservationUnitUpdateMutationInput,
  ResourceType,
  SpaceType,
  UnitByPkType,
} from "common/types/gql-types";
import { OptionType } from "../../../common/types";

export type IProps = {
  reservationUnitPk?: string;
  unitPk: string;
};
export type NotificationType = {
  title: string;
  text: string;
  type: "success" | "error";
};

export type Action =
  | {
      type: "setNotification";
      notification: NotificationType;
    }
  | { type: "clearNotification" }
  | { type: "toggleFuturePrice" }
  | { type: "clearError" }
  | { type: "dataLoaded"; reservationUnit: ReservationUnitByPkType }
  | { type: "unitLoaded"; unit: UnitByPkType }
  | { type: "editNew"; unitPk: number }
  | { type: "dataInitializationError"; message: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: "set"; value: any }
  | { type: "created"; pk: number }
  | { type: "setSpaces"; spaces: OptionType[] }
  | { type: "setResources"; resources: OptionType[] }
  | { type: "setEquipments"; equipments: OptionType[] }
  | { type: "setPaymentTypes"; paymentTypes: OptionType[] }
  | {
      type: "updatePricingType";
      pricingType: ReservationUnitPricingUpdateSerializerInput;
      changeField?:
        | "lowestPriceNet"
        | "lowestPrice"
        | "highestPriceNet"
        | "highestPrice"
        | "taxPercentagePk";
    }
  | { type: "setPurposes"; purposes: OptionType[] }
  | { type: "setQualifiers"; qualifiers: OptionType[] }
  | { type: "parametersLoaded"; parameters: Query }
  | { type: "setMaxPersons"; maxPersons: number }
  | { type: "setReservationsMaxDaysBefore"; reservationsMaxDaysBefore: number }
  | {
      type: "setValidationErrors";
      validationErrors: Joi.ValidationResult | null;
    }
  | { type: "setImages"; images: Image[] };

export type ReservationUnitEditorType =
  | ReservationUnitUpdateMutationInput
  | ReservationUnitCreateMutationInput;

export enum LoadingCompleted {
  "UNIT",
  "RESERVATION_UNIT",
  "PARAMS",
}

export type State = {
  reservationUnitPk?: number;
  loading: boolean;
  reservationUnit: ReservationUnitByPkType | null;
  reservationUnitEdit: Partial<ReservationUnitEditorType>;
  hasChanges: boolean;
  error?: {
    message: string;
  };
  spaces: SpaceType[];
  resources: ResourceType[];
  spaceOptions: OptionType[];
  resourceOptions: OptionType[];
  equipmentOptions: OptionType[];
  purposeOptions: OptionType[];
  qualifierOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  paymentTermsOptions: OptionType[];
  paymentTypeOptions: OptionType[];
  pricingTermsOptions: OptionType[];
  cancellationTermsOptions: OptionType[];
  serviceSpecificTermsOptions: OptionType[];
  cancellationRuleOptions: OptionType[];
  taxPercentageOptions: OptionType[];
  metadataOptions: OptionType[];
  unit?: UnitByPkType;
  dataLoaded: LoadingCompleted[];
  images: Image[];
  validationErrors: Joi.ValidationResult | null;
};

export type Image = {
  pk?: Maybe<number> | undefined;
  mediumUrl?: Maybe<string> | undefined;
  imageType?: ReservationUnitsReservationUnitImageImageTypeChoices;
  originalImageType?: ReservationUnitsReservationUnitImageImageTypeChoices;
  bytes?: File;
  deleted?: boolean;
};

const requiredForSingle = (then: Joi.SchemaLike) =>
  Joi.when("reservationKind", {
    not: "SEASON",
    then,
  });

const requiredForNonFree = (then: Joi.SchemaLike) =>
  Joi.when("pricingType", {
    not: "FREE",
    then,
  });

const requiredForNonFreeRU = (then: Joi.SchemaLike) =>
  Joi.when("pricings", {
    is: Joi.array().has(Joi.object({ pricingType: "PAID" })),
    then,
  });

const pricing = Joi.object({
  pricingType: Joi.string().required(),
  lowestPrice: requiredForNonFree(Joi.number().precision(2).min(0).required()),
  highestPrice: requiredForNonFree(
    Joi.number().precision(2).min(Joi.ref("lowestPrice")).required()
  ),
  priceUnit: requiredForNonFree(Joi.string().required()),
  taxPercentagePk: requiredForNonFree(Joi.number().required()),
});

export const schema = Joi.object({
  reservationKind: Joi.string().required(),
  nameFi: Joi.string().required().max(80),
  nameSv: Joi.string().required().max(80),
  nameEn: Joi.string().required().max(80),
  spacePks: Joi.array().required().min(1).items(Joi.number()),
  resourcePks: Joi.array().items(Joi.number()),
  surfaceArea: Joi.number().min(1).required(), // checking against selected spaces is implemented in ui
  minPersons: Joi.number().allow(null).min(0).max(Joi.ref("maxPersons")),
  maxPersons: Joi.number().min(1).required(),
  reservationUnitTypePk: Joi.number().required(),
  descriptionFi: Joi.string().required().max(4000),
  descriptionSv: Joi.string().required().max(4000),
  descriptionEn: Joi.string().required().max(4000),
  minReservationDuration: requiredForSingle(Joi.number().required()),
  maxReservationDuration: requiredForSingle(Joi.number().required()),
  reservationsMinDaysBefore: requiredForSingle(Joi.number().required()),
  reservationsMaxDaysBefore: requiredForSingle(Joi.number().required()),
  reservationStartInterval: requiredForSingle(Joi.string().required()),
  authentication: requiredForSingle(Joi.string().required()),
  metadataSetPk: requiredForSingle(Joi.number().required()),
  termsOfUseFi: Joi.string().allow(null).max(10000),
  termsOfUseSv: Joi.string().allow(null).max(10000),
  termsOfUseEn: Joi.string().allow(null).max(10000),
  additionalInstructionsFi: Joi.string().allow("").max(10000),
  additionalInstructionsSv: Joi.string().allow("").max(10000),
  additionalInstructionsEn: Joi.string().allow("").max(10000),
  pricings: Joi.array().min(1).items(pricing),
  paymentTypes: requiredForNonFreeRU(Joi.array().min(1).required()),
}).options({
  allowUnknown: true,
  abortEarly: false,
  convert: false,
});

// validation for drafts
const draftPricing = Joi.object({
  lowestPrice: requiredForNonFree(Joi.number().precision(2).min(0)),
  highestPrice: requiredForNonFree(
    Joi.number().precision(2).min(Joi.ref("lowestPrice")).required()
  ),
});

export const draftSchema = Joi.object({
  pricings: Joi.array().min(0).items(draftPricing),
}).options({
  allowUnknown: true,
  abortEarly: false,
  convert: false,
});
