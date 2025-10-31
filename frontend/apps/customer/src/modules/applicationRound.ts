import type { ReadonlyDeep } from "ui/src/modules/helpers";
import type { LocalizationLanguages } from "ui/src/modules/urlBuilder";
import { getTranslation } from "ui/src/modules/util";
import type { Maybe, ApplicationRoundNode } from "@gql/gql-types";

type ApplicationRoundType = Maybe<Pick<ReadonlyDeep<ApplicationRoundNode>, "nameFi" | "nameSv" | "nameEn">> | undefined;

export function getApplicationRoundName(applicationRound: ApplicationRoundType, lang: LocalizationLanguages): string {
  if (applicationRound == null) {
    return "-";
  }
  return getTranslation(applicationRound, "name", lang);
}
