import { type ApplicationRoundNode } from "common/gql/gql-types";
import { getTranslation } from "./util";

export function getApplicationRoundName(
  applicationRound: Pick<ApplicationRoundNode, "nameFi" | "nameSv" | "nameEn">
): string {
  return getTranslation(applicationRound, "name");
}
