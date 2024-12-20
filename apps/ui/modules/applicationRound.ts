import { type ApplicationRoundNode } from "common/gql/gql-types";
import { getTranslation } from "./util";
import { Maybe } from "@/gql/gql-types";

export function getApplicationRoundName(
  applicationRound?:
    | Maybe<Pick<ApplicationRoundNode, "nameFi" | "nameSv" | "nameEn">>
    | undefined
): string {
  if (applicationRound == null) {
    return "-";
  }
  return getTranslation(applicationRound, "name");
}
