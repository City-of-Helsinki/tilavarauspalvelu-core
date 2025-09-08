import { MunicipalityChoice, type ReserveeType } from "../../gql/gql-types";

type Reservee = {
  reserveeFirstName: string;
  reserveeLastName: string;
  reserveePhone: string;
  reserveeEmail: string;
  reserveeOrganisationName: string;
};

type CommonInputs = {
  name: string;
  description: string;
  municipality?: MunicipalityChoice;
  purpose?: number;
  numPersons?: number;
  ageGroup?: number;
  reserveeType?: ReserveeType;
  freeOfChargeReason: string;
  applyingForFreeOfCharge: boolean;
};

export type InputsT = {
  pk: number;
  reserveeIsUnregisteredAssociation?: boolean;
  reserveeIdentifier?: string;
} & Reservee &
  CommonInputs;

export type ReservationFormT = {
  pk: number;
  begin: string;
  end: string;
  reservationUnitPks: number[];
  user?: { email: string };
  calendarUrl?: string;
  state?: string;
  price?: number;
  taxPercentageValue?: number;
} & Partial<Reservee> &
  Partial<CommonInputs>;
