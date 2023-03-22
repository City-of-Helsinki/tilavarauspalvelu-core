/// FIXME Test this before applying

type Billing = {
  billingFirstName: string;
  billingLastName: string;
  billingPhone: string;
  billingEmail: string;
  billingAddressStreet: string;
  billingAddressCity: string;
  billingAddressZip: string;
};

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
  // Whose name?
  name: string;
  description: string;
  homeCity: number;
  spaceTerms: boolean;
  resourceTerms: boolean;
  purpose: number;
  numPersons: number;
  ageGroup: number;
  freeOfChargeReason: string;
  applyingForFreeOfCharge: boolean;
};

export type Inputs = {
  pk: number;
  // TODO why is this optional unlike other fields?
  showBillingAddress?: boolean;
  reserveeIsUnregisteredAssociation?: boolean;
  reserveeId?: number;
} & Billing &
  Reservee &
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
  showBillingAddress?: boolean;
} & Partial<Billing> &
  Partial<Reservee> &
  Partial<CommonInputs>;

export type ReserveeType = "individual" | "nonprofit" | "business";

const fieldsCommon = [
  "reservee_first_name",
  "reservee_last_name",
  "reservee_address_street",
  "reservee_address_zip",
  "reservee_address_city",
  "reservee_email",
  "reservee_phone",
  "home_city",
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
    "home_city",
    "reservee_is_unregistered_association",
    "reservee_id",
    ...fieldsCommon,
  ],
  business: [
    "reservee_organisation_name",
    "home_city",
    "reservee_id",
    ...fieldsCommon,
  ],
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
