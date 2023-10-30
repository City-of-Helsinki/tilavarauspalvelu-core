export type Image = {
  imageUrl: string;
  smallUrl: string;
  mediumUrl: string;
  imageType: "main" | "map" | "ground_plan" | "other";
};

export interface DataFilterOption {
  key?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function?: (row: any) => boolean;
  value?: string | number | boolean;
  title: string | null;
}
export interface DataFilterConfig {
  title: string;
  filters: DataFilterOption[] | null;
}

/// @deprecated
export type OptionType = {
  label: string;
  value: string | number | null;
};

export type ReservationPriority = 100 | 200 | 300;

/// @deprecated
export type AllocationApplicationEventCardType =
  | "unallocated"
  | "allocated"
  | "declined";
