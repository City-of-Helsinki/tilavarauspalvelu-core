export type Inputs = {
  pk: number;
  reserveeFirstName: string;
  reserveeLastName: string;
  reserveePhone: string;
  name: string;
  description: string;
  spaceTerms: boolean;
  resourceTerms: boolean;
  purpose: number;
  numPersons: number;
  ageGroup: number;
  reserveeAddressStreet: string;
  reserveeAddressZip: string;
  reserveeAddressCity: string;
  reserveeEmail: string;
  reserveeOrganisationName: string;
  showBillingAddress?: boolean;
  billingFirstName: string;
  billingLastName: string;
  billingPhone: string;
  billingEmail: string;
  billingAddressStreet: string;
  billingAddressCity: string;
  billingAddressZip: string;
  homeCity: number;
  applyingForFreeOfCharge: boolean;
  freeOfChargeReason: string;
  reserveeIsUnregisteredAssociation?: boolean;
  reserveeId?: number;
};

export type Reservation = {
  pk: number;
  begin: string;
  end: string;
  reservationUnitPks: number[];
  reserveeFirstName?: string;
  reserveeLastName?: string;
  reserveePhone?: string;
  name?: string;
  user?: { email: string };
  description?: string;
  calendarUrl?: string;
  state?: string;
  price?: number;
  taxPercentageValue?: number;
  spaceTerms?: boolean;
  resourceTerms?: boolean;
  purpose?: number;
  numPersons?: number;
  ageGroup?: number;
  reserveeAddressStreet?: string;
  reserveeAddressZip?: string;
  reserveeAddressCity?: string;
  reserveeEmail?: string;
  reserveeOrganisationName?: string;
  showBillingAddress?: boolean;
  billingFirstName?: string;
  billingLastName?: string;
  billingPhone?: string;
  billingEmail?: string;
  billingAddressStreet?: string;
  billingAddressCity?: string;
  billingAddressZip?: string;
  homeCity?: number;
  applyingForFreeOfCharge?: boolean;
  freeOfChargeReason?: string;
};

export type ReserveeType = "individual" | "nonprofit" | "business";

export const reservationApplicationFields = {
  individual: [
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
  ],
  nonprofit: [
    "reservee_organisation_name",
    "home_city",
    "reservee_is_unregistered_association",
    "reservee_id",
    "reservee_first_name",
    "reservee_last_name",
    "reservee_address_street",
    "reservee_address_zip",
    "reservee_address_city",
    "reservee_email",
    "reservee_phone",
    "billing_first_name",
    "billing_last_name",
    "billing_phone",
    "billing_email",
    "billing_address_street",
    "billing_address_zip",
    "billing_address_city",
  ],
  business: [
    "reservee_organisation_name",
    "home_city",
    "reservee_id",
    "reservee_first_name",
    "reservee_last_name",
    "reservee_address_street",
    "reservee_address_zip",
    "reservee_address_city",
    "reservee_email",
    "reservee_phone",
    "billing_first_name",
    "billing_last_name",
    "billing_phone",
    "billing_email",
    "billing_address_street",
    "billing_address_zip",
    "billing_address_city",
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
