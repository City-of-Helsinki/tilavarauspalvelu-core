import { ApplicationRoundNode } from "common/types/gql-types";
import { getTranslation } from "./util";

export const getApplicationRoundName = (applicationRound: ApplicationRoundNode): string => {
  return getTranslation(applicationRound, 'name');
};
