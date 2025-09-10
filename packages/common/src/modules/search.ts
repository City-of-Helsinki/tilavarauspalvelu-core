import { MunicipalityChoice } from "../../gql/gql-types";

export type OptionT = Readonly<{ value: number; label: string }>;
export type OptionsListT = Readonly<{
  units: Readonly<OptionT[]>;
  equipments: Readonly<OptionT[]>;
  purposes: Readonly<OptionT[]>;
  reservationPurposes: Readonly<OptionT[]>;
  reservationUnitTypes: Readonly<OptionT[]>;
  ageGroups: Readonly<OptionT[]>;
  municipalities: Readonly<{ value: MunicipalityChoice; label: string }[]>;
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
