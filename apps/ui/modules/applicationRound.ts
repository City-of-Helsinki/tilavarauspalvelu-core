import type { ApplicationRoundNode } from "@gql/gql-types";
import { getTranslation } from "./util";

export const getApplicationRoundName = (
  applicationRound: ApplicationRoundNode
): string => {
  return getTranslation(applicationRound, "name");
};
