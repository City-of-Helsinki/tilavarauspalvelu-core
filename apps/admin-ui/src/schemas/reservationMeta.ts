// Rewriting the metafields using zod validators
// TODO move to common after they are tested in use with
// CreateReservationModal / RecurringReservation / EditReservation

import { ReservationsReservationReserveeTypeChoices } from "common/types/gql-types";
import { z } from "zod";
import { OptionSchema } from "./schemaCommon";

export const reservationTypeSchema = z.enum(["STAFF", "BEHALF", "BLOCKED"]);

export const ReservationFormMetaSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  ageGroup: OptionSchema.optional(),
  applyingForFreeOfCharge: z.boolean().optional(),
  billingAddressCity: z.string().optional(),
  billingAddressStreet: z.string().optional(),
  billingAddressZip: z.string().optional(),
  billingEmail: z.string().optional(),
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingPhone: z.string().optional(),
  freeOfChargeReason: z.string().optional(),
  homeCity: OptionSchema.optional(),
  numPersons: z.number().optional(),
  purpose: OptionSchema.optional(),
  reserveeAddressCity: z.string().optional(),
  reserveeAddressStreet: z.string().optional(),
  reserveeAddressZip: z.string().optional(),
  reserveeEmail: z.string().optional(),
  reserveeFirstName: z.string().optional(),
  reserveeId: z.string().optional(),
  reserveeIsUnregisteredAssociation: z.boolean().optional(),
  reserveeLastName: z.string().optional(),
  reserveeOrganisationName: z.string().optional(),
  reserveePhone: z.string().optional(),
  // TODO the reserveeType is problematic
  // radio buttons should have a default value and form inputs don't like null (uncontrolled input)
  // TODO test what happens if the user submits a form with a null value?
  reserveeType: z
    .enum([
      ReservationsReservationReserveeTypeChoices.Individual,
      ReservationsReservationReserveeTypeChoices.Nonprofit,
      ReservationsReservationReserveeTypeChoices.Business,
    ])
    .nullable(),
});

export type ReservationFormMeta = z.infer<typeof ReservationFormMetaSchema>;
