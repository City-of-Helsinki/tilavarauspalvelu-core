import { MunicipalityChoice, type ReserveeType } from "../../gql/gql-types";

type Reservee = {
  reserveeFirstName: string;
  reserveeLastName: string;
  reserveePhone: string;
  reserveeAddressStreet: string;
  reserveeAddressZip: string;
  reserveeAddressCity: string;
  reserveeEmail: string;
  reserveeOrganisationName: string;
};

type CommonInputs = {
  name: string;
  description: string;
  municipality?: MunicipalityChoice;
  spaceTerms: boolean;
  resourceTerms: boolean;
  purpose?: number;
  numPersons?: number;
  ageGroup?: number;
  reserveeType?: ReserveeType;
  freeOfChargeReason: string;
  applyingForFreeOfCharge: boolean;
};

export type Inputs = {
  pk: number;
  reserveeIsUnregisteredAssociation?: boolean;
  reserveeIdentifier?: string;
  showBillingAddress?: boolean;
} & Reservee &
  CommonInputs;

export type Reservation = {
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

const fieldsCommon = [
  "reservee_first_name",
  "reservee_last_name",
  "reservee_address_street",
  "reservee_address_zip",
  "reservee_address_city",
  "reservee_email",
  "reservee_phone",
  "municipality",
  "billing_first_name",
  "billing_last_name",
  "billing_phone",
  "billing_email",
  "billing_address_street",
  "billing_address_zip",
  "billing_address_city",
];

export const reservationApplicationFields = {
  individual: fieldsCommon,
  nonprofit: [
    "reservee_organisation_name",
    "municipality",
    "reservee_is_unregistered_association",
    "reservee_identifier",
    ...fieldsCommon,
  ],
  company: ["reservee_organisation_name", "municipality", "reservee_identifier", ...fieldsCommon],
  common: [
    "reservee_type",
    "name",
    "purpose",
    "num_persons",
    "age_group",
    "description",
    "applying_for_free_of_charge",
    "free_of_charge_reason",
  ],
};
