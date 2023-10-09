import { ApplicationRoundType } from "common/types/gql-types";
import { getTranslation } from "./util";

export const getApplicationRoundName = (applicationRound: ApplicationRoundType,): string => {
  return getTranslation(applicationRound, 'name');
};
