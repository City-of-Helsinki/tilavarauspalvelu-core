import { capitalize } from "./helpers";
import { LocalizationLanguages } from "./urlBuilder";

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result = [];
  let index = 0;

  while (index < array.length) {
    result.push(array.slice(index, size + index));
    index += size;
  }

  return result;
};

type PossibleKeys = string;
type Lang = Capitalize<LocalizationLanguages>;
export type RecordWithTranslation<K extends PossibleKeys, T extends string | null> = {
  // enforce {K}Fi | {K}En | {K}Sv to exist in the record
  [Property in `${K}${Lang}`]: T;
} & {
  // allow any other keys we don't care about
  [key: string]: unknown;
};

/// Find a translation from a gql query result
/// @param lang - language to use, use useTranslation hook in get the current language inside a component
/// grpaphql schema allows for nulls for translated fields -> treat them as empty strings
export function getTranslation<K extends PossibleKeys, T extends string | null>(
  dict: RecordWithTranslation<K, T>,
  key: K,
  lang: LocalizationLanguages
): string {
  const localKey: `${K}${Lang}` = `${key}${capitalize(lang)}`;
  const val = dict[localKey];
  // type guard for return type (type enforcement checks that the Keys map to strings)
  if (typeof val === "string") {
    return val;
  }
  // oxlint-disable-next-line eqeqeq -- don't allow undefined here
  if (val === null) {
    return "";
  }
  // never
  throw new Error(`Object is missing translation for ${key}`);
}
