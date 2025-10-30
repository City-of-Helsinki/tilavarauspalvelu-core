import { capitalize } from "./helpers";

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result = [];
  let index = 0;

  while (index < array.length) {
    result.push(array.slice(index, size + index));
    index += size;
  }

  return result;
};

/// Find a translation from a gql query result
/// @param lang - language to use, use useTranslation hook in get the current language inside a component
// TODO rename to getTranslation when the other one is removed
// TODO Records are bad, use a query result type instead?
// TODO key should not be a string (so we don't accidentially pass "nameFi" here)
// gather all used keys and make a string literal for them (typically it's just name)
export function getTranslationSafe(parent: Record<string, unknown>, key: string, lang: "fi" | "sv" | "en"): string {
  const keyString = `${key}${capitalize(lang)}`;
  if (parent && parent[keyString]) {
    if (typeof parent[keyString] === "string") {
      return String(parent[keyString]);
    }
  }
  const fallback = "fi";
  const fallbackKeyString = `${key}${capitalize(fallback)}`;
  if (parent && parent[fallbackKeyString]) {
    if (typeof parent[fallbackKeyString] === "string") {
      return String(parent[fallbackKeyString]);
    }
  }

  return "";
}

export function convertLanguageCode(lang: string): "fi" | "sv" | "en" {
  if (lang === "sv" || lang === "en" || lang === "fi") {
    return lang;
  }
  return "fi";
}
