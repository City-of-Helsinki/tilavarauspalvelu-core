import type { MunicipalityChoice } from "../../gql/gql-types";

export type OptionT = Readonly<{ value: number; label: string }>;
export type OptionsListT = Readonly<{
  units: ReadonlyArray<OptionT>;
  equipments: ReadonlyArray<OptionT>;
  purposes: ReadonlyArray<OptionT>;
  reservationPurposes: ReadonlyArray<OptionT>;
  reservationUnitTypes: ReadonlyArray<OptionT>;
  ageGroups: ReadonlyArray<OptionT>;
  municipalities: ReadonlyArray<{ value: MunicipalityChoice; label: string }>;
}>;

export function mapFormToSearchParams<T extends object>(data: T): URLSearchParams {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) {
    if (v == null) {
      continue;
    }
    if (Array.isArray(v) && v.length === 0) {
      continue;
    }
    if (Array.isArray(v)) {
      if (v.length === 0) {
        continue;
      }
      for (const item of v) {
        if (item != null) {
          params.append(k, item.toString());
        }
      }
    } else {
      params.set(k, v.toString());
    }
  }
  return params;
}
