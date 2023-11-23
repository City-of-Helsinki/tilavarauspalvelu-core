import {
  Maybe,
  ReservationUnitsReservationUnitImageImageTypeChoices,
} from "common/types/gql-types";

export const PaymentTypes = ["ONLINE", "INVOICE", "ON_SITE"] as const;

export type Image = {
  pk?: Maybe<number> | undefined;
  mediumUrl?: Maybe<string> | undefined;
  imageUrl?: Maybe<string> | undefined;
  imageType?: ReservationUnitsReservationUnitImageImageTypeChoices;
  originalImageType?: ReservationUnitsReservationUnitImageImageTypeChoices;
  bytes?: File;
  deleted?: boolean;
};
