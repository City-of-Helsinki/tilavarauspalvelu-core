import { MunicipalityChoice, type ReserveeType } from "../../gql/gql-types";

export type ReservationFormT = {
  pk: number;
  name: string;
  reserveeFirstName: string;
  reserveeLastName: string;
  reserveePhone: string;
  reserveeEmail: string;
  reserveeOrganisationName: string;
  description: string;
  municipality?: MunicipalityChoice;
  purpose?: number;
  numPersons?: number;
  ageGroup?: number;
  reserveeType?: ReserveeType;
  freeOfChargeReason: string;
  applyingForFreeOfCharge: boolean;
  reserveeIsUnregisteredAssociation?: boolean;
  reserveeIdentifier?: string;
};
