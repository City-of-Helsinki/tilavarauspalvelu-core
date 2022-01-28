import {
  Maybe,
  Query,
  ReservationUnitByPkType,
  ReservationUnitCreateMutationInput,
  ReservationUnitsReservationUnitImageImageTypeChoices,
  ReservationUnitUpdateMutationInput,
  ResourceType,
  SpaceType,
  UnitByPkType,
} from "../../../common/gql-types";
import { OptionType } from "../../../common/types";

export interface IProps {
  reservationUnitPk?: string;
  unitPk: string;
}

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
  | { type: "clearError" }
  | { type: "dataLoaded"; reservationUnit: ReservationUnitByPkType }
  | { type: "unitLoaded"; unit: UnitByPkType }
  | { type: "editNew"; unitPk: number }
  | { type: "dataInitializationError"; message: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: "set"; value: any }
  | { type: "setSpaces"; spaces: OptionType[] }
  | { type: "setResources"; resources: OptionType[] }
  | { type: "setEquipments"; equipments: OptionType[] }
  | { type: "setPurposes"; purposes: OptionType[] }
  | { type: "parametersLoaded"; parameters: Query }
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
  reservationUnitTypeOptions: OptionType[];
  paymentTermsOptions: OptionType[];
  cancellationTermsOptions: OptionType[];
  serviceSpecificTermsOptions: OptionType[];
  cancellationRuleOptions: OptionType[];
  taxPercentageOptions: OptionType[];
  metadataOptions: OptionType[];
  unit?: UnitByPkType;
  dataLoaded: LoadingCompleted[];
  images: Image[];
};

export type Image = {
  pk?: Maybe<number> | undefined;
  mediumUrl?: Maybe<string> | undefined;
  imageType?: ReservationUnitsReservationUnitImageImageTypeChoices;
  originalImageType?: ReservationUnitsReservationUnitImageImageTypeChoices;
  bytes?: File;
  deleted?: boolean;
};
