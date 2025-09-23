// Rewriting the metafields using zod validators
// TODO move to common after they are tested in use with
// CreateReservationModal / ReservationSeries / EditReservation
import { MunicipalityChoice, ReserveeType } from "@gql/gql-types";
import { z } from "zod";

export const ReservationFormMetaSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  ageGroup: z.number().optional(),
  applyingForFreeOfCharge: z.boolean().optional(),
  freeOfChargeReason: z.string().optional(),
  municipality: z.enum([MunicipalityChoice.Helsinki, MunicipalityChoice.Other]).optional(),
  numPersons: z.number().optional(),
  purpose: z.number().optional(),
  reserveeAddressCity: z.string().optional(),
  reserveeAddressStreet: z.string().optional(),
  reserveeAddressZip: z.string().optional(),
  reserveeEmail: z.string().optional(),
  reserveeFirstName: z.string().optional(),
  reserveeIdentifier: z.string().optional(),
  reserveeIsUnregisteredAssociation: z.boolean().optional(),
  reserveeLastName: z.string().optional(),
  reserveeOrganisationName: z.string().optional(),
  reserveePhone: z.string().optional(),
  // TODO the reserveeType is problematic
  // radio buttons should have a default value and form inputs don't like null (uncontrolled input)
  // TODO test what happens if the user submits a form with a null value?
  reserveeType: z.enum([ReserveeType.Individual, ReserveeType.Nonprofit, ReserveeType.Company]).nullable(),
});

export type ReservationFormMeta = z.infer<typeof ReservationFormMetaSchema>;
