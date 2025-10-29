import React from "react";
import { useTranslation } from "next-i18next";
import { TextInput } from "hds-react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { FilterTagList } from "../FilterTagList";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { type OptionsListT } from "common/src/modules/search";
import { SearchButton, SearchButtonContainer } from "common/src/components/SearchButton";
import { type ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { AccessType } from "@gql/gql-types";
import { ControlledNumberInput } from "common/src/components/form";
import { mapParamToInteger, toNumber } from "common/src/modules/helpers";
import { AutoGrid, Flex } from "common/src/styled";

const filterOrder = [
  "textSearch",
  "personsAllowed",
  "reservationUnitTypes",
  "units",
  "purposes",
  "accessType",
] as const;

export type SearchFormValues = {
  personsAllowed: number | null;
  units: number[];
  reservationUnitTypes: number[];
  purposes: number[];
  textSearch: string;
  accessTypes: string[];
};

// TODO combine as much as possible with the one in single-search (move them to a common place)
function mapSeasonalQueryToForm(params: ReadonlyURLSearchParams): SearchFormValues {
  return {
    purposes: mapParamToInteger(params.getAll("purposes"), 1),
    units: mapParamToInteger(params.getAll("units"), 1),
    reservationUnitTypes: mapParamToInteger(params.getAll("reservationUnitTypes"), 1),
    personsAllowed: toNumber(params.get("personsAllowed")),
    textSearch: params.get("textSearch") ?? "",
    accessTypes: params.getAll("accessTypes"),
  };
}

export type SearchFormProps = {
  options: Pick<OptionsListT, "purposes" | "reservationUnitTypes" | "units">;
  handleSearch: SubmitHandler<SearchFormValues>;
  isLoading: boolean;
};

export function SeasonalSearchForm({
  isLoading,
  options,
  handleSearch,
}: Readonly<SearchFormProps>): JSX.Element | null {
  const { t } = useTranslation();
  const searchValues = useSearchParams();
  const { control, register, handleSubmit } = useForm<SearchFormValues>({
    values: mapSeasonalQueryToForm(searchValues),
  });

  const onSubmit: SubmitHandler<SearchFormValues> = (data: SearchFormValues) => {
    handleSearch(data);
  };

  const accessTypeOptions = Object.values(AccessType).map((value) => ({
    value,
    label: t(`reservationUnit:accessTypes.${value}`),
  }));

  const translateTag = (key: string, value: string): string | undefined => {
    switch (key) {
      case "units":
        return options.units.find((n) => String(n.value) === value)?.label;
      case "reservationUnitTypes":
        return options.reservationUnitTypes.find((n) => String(n.value) === value)?.label;
      case "purposes":
        return options.purposes.find((n) => String(n.value) === value)?.label;
      case "accessTypes":
        return accessTypeOptions.find((n) => String(n.value) === value)?.label;
      default:
        return "";
    }
  };

  const multiSelectFilters = ["units", "reservationUnitTypes", "purposes", "accessTypes"] as const;
  const hideList = ["id", "order", "sort", "ref", "selectedReservationUnits", "modalShown"] as const;

  return (
    <Flex
      as="form"
      noValidate
      onSubmit={(evt) => {
        // React.createPortal does not stop propagation
        // the only way to handle nested forms in React is to move Modals out of the JSX tree (and vdom)
        // e.g. use context with a list of elements to render that moves the JSX out of the main tree
        // portal only moves the DOM element, while propagation works on the vdom
        evt.stopPropagation();
        evt.preventDefault();
        handleSubmit(onSubmit)();
      }}
    >
      <AutoGrid>
        <TextInput
          id="search"
          label={t("searchForm:labels.textSearch")}
          {...register("textSearch")}
          placeholder={t("searchForm:placeholders.textSearch")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(onSubmit)();
            }
          }}
        />
        <ControlledNumberInput
          label={t("searchForm:labels.personsAllowed")}
          name="personsAllowed"
          control={control}
          min={1}
        />
        <ControlledSelect
          multiselect
          enableSearch
          clearable
          name="reservationUnitTypes"
          control={control}
          options={options.reservationUnitTypes}
          disabled={options.reservationUnitTypes.length === 0}
          label={t("searchForm:labels.reservationUnitTypes")}
        />
        <ControlledSelect
          multiselect
          enableSearch
          clearable
          name="units"
          control={control}
          options={options.units}
          disabled={options.units.length === 0}
          label={t("searchForm:labels.units")}
        />
        <ControlledSelect
          multiselect
          enableSearch
          clearable
          name="purposes"
          control={control}
          options={options.purposes}
          disabled={options.purposes.length === 0}
          label={t("searchForm:labels.purposes")}
        />
        <ControlledSelect
          multiselect
          clearable
          name="accessTypes"
          control={control}
          options={accessTypeOptions}
          label={t("searchForm:labels.accessTypes")}
        />
      </AutoGrid>
      <SearchButtonContainer>
        <FilterTagList
          translateTag={translateTag}
          filters={filterOrder}
          multiSelectFilters={multiSelectFilters}
          hideList={hideList}
        />
        <SearchButton isLoading={isLoading} labelKey="searchForm:searchButton" />
      </SearchButtonContainer>
    </Flex>
  );
}
