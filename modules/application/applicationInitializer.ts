import { Application } from "../types";

export const minimalApplicationForInitialSave = (
  applicationRoundId: number
): Application => ({
  status: "draft",
  applicantType: null,
  applicationRoundId,
  organisation: null,
  applicationEvents: [],
  contactPerson: null,
  billingAddress: null,
  homeCityId: null,
});
