import { MunicipalityChoice } from "../../gql/gql-types";

export type OptionT = Readonly<{ value: number; label: string }>;
export type OptionsListT = Readonly<{
  units: Readonly<OptionT[]>;
  equipments: Readonly<OptionT[]>;
  purposes: Readonly<OptionT[]>;
  reservationUnitTypes: Readonly<OptionT[]>;
  ageGroups: Readonly<OptionT[]>;
  municipalities: Readonly<{ value: MunicipalityChoice; label: string }[]>;
}>;
