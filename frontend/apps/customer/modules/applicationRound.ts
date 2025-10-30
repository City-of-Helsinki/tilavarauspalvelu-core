import type { Maybe, ApplicationRoundNode } from "@/gql/gql-types";
import { getTranslationSafe } from "ui/src/modules/util";
import type { ReadonlyDeep } from "ui/src/modules/helpers";
import type { LocalizationLanguages } from "ui/src/modules/urlBuilder";

type ApplicationRoundType = Maybe<Pick<ReadonlyDeep<ApplicationRoundNode>, "nameFi" | "nameSv" | "nameEn">> | undefined;

export function getApplicationRoundName(applicationRound: ApplicationRoundType, lang: LocalizationLanguages): string {
  if (applicationRound == null) {
    return "-";
  }
  return getTranslationSafe(applicationRound, "name", lang);
}
