import { getTranslation } from "./util";

export const getApplicationRoundName = (
  // TODO should use the ApplicationRoundName fragment
  applicationRound: {
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
  }
): string => {
  return getTranslation(applicationRound, "name");
};
