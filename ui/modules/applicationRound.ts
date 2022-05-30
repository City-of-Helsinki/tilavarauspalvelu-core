import { i18n } from "next-i18next";
import { ApplicationRoundType } from "./gql-types";
import { capitalize } from "./util";

export const getApplicationRoundName = (
  applicationRound: ApplicationRoundType,
  language: string = i18n.language
): string => {
  const key = `name${capitalize(language)}`;
  return applicationRound[key] || applicationRound.nameFi;
};
