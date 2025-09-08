import type { ApplicationRoundNode } from "common/gql/gql-types";
import type { Maybe } from "@/gql/gql-types";
import { getTranslationSafe } from "common/src/common/util";
import type { ReadonlyDeep } from "common/src/helpers";
import type { LocalizationLanguages } from "common/src/urlBuilder";

type ApplicationRoundType = Maybe<Pick<ReadonlyDeep<ApplicationRoundNode>, "nameFi" | "nameSv" | "nameEn">> | undefined;

export function getApplicationRoundName(applicationRound: ApplicationRoundType, lang: LocalizationLanguages): string {
  if (applicationRound == null) {
    return "-";
  }
  return getTranslationSafe(applicationRound, "name", lang);
}
