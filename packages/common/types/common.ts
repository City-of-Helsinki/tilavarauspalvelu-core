import { MunicipalityChoice } from "../gql/gql-types";

export type DAY = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type OptionType = {
  label: string;
  value: number;
};

export type OptionsRecord = Record<"purpose" | "ageGroup", Readonly<OptionType[]>> & {
  municipality: Readonly<Array<{ label: string; value: MunicipalityChoice }>>;
};
