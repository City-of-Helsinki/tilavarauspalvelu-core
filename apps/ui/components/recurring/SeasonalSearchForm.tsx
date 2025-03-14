import React from "react";
import { useTranslation } from "next-i18next";
import {
  TextInput,
  IconSearch,
  LoadingSpinner,
  ButtonVariant,
} from "hds-react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { FilterTagList } from "../FilterTagList";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { mapParamToNumber } from "@/modules/search";
import {
  Filters,
  SearchButtonContainer,
  StyledSubmitButton,
} from "../search/styled";
import { type ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { AccessType } from "@gql/gql-types";
import { ControlledNumberInput } from "common/src/components/form";
import { toNumber } from "common/src/helpers";

const filterOrder = [
  "textSearch",
  "personsAllowed",
  "reservationUnitTypes",
  "unit",
  "purposes",
  "accessType",
] as const;

export type SearchFormValues = {
  personsAllowed: number | null;
  unit: number[];
  reservationUnitTypes: number[];
  purposes: number[];
  textSearch: string;
  accessType: string[];
};

// TODO combine as much as possible with the one in single-search (move them to a common place)
function mapQueryToForm(params: ReadonlyURLSearchParams): SearchFormValues {
  return {
    purposes: mapParamToNumber(params.getAll("purposes"), 1),
    unit: mapParamToNumber(params.getAll("unit"), 1),
    reservationUnitTypes: mapParamToNumber(
      params.getAll("reservationUnitTypes"),
      1
    ),
    personsAllowed: toNumber(params.get("personsAllowed")),
    textSearch: params.get("textSearch") ?? "",
    accessType: params.getAll("accessType"),
  };
}

type OptionType = { value: number; label: string };
export type SearchFormProps = {
  options: Readonly<{
    reservationUnitTypeOptions: Readonly<OptionType[]>;
    purposeOptions: Readonly<OptionType[]>;
    unitOptions: Readonly<OptionType[]>;
  }>;
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
    values: mapQueryToForm(searchValues),
  });

  const onSubmit: SubmitHandler<SearchFormValues> = (
    data: SearchFormValues
  ) => {
    handleSearch(data);
  };

  const accessTypeOptions = Object.values(AccessType).map((value) => ({
    value,
    label: t(`reservationUnit:accessTypes.${value}`),
  }));
  const { reservationUnitTypeOptions, purposeOptions, unitOptions } = options;

  const translateTag = (key: string, value: string): string | undefined => {
    switch (key) {
      case "unit":
        return unitOptions.find((n) => String(n.value) === value)?.label;
      case "reservationUnitTypes":
        return reservationUnitTypeOptions.find((n) => String(n.value) === value)
          ?.label;
      case "purposes":
        return purposeOptions.find((n) => String(n.value) === value)?.label;
      case "accessType":
        return accessTypeOptions.find((n) => String(n.value) === value)?.label;
      default:
        return "";
    }
  };

  const multiSelectFilters = [
    "unit",
    "reservationUnitTypes",
    "purposes",
    "accessType",
  ] as const;
  const hideList = [
    "id",
    "order",
    "sort",
    "ref",
    "selectedReservationUnits",
  ] as const;

  return (
    <form
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
      <Filters>
        <TextInput
          id="search"
          label={t("searchForm:textSearchLabel")}
          {...register("textSearch")}
          placeholder={t("searchForm:searchTermPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(onSubmit)();
            }
          }}
        />
        <ControlledNumberInput
          label={t("searchForm:participantCountCombined")}
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
          options={reservationUnitTypeOptions}
          disabled={reservationUnitTypeOptions.length === 0}
          label={t("searchForm:typeLabel")}
        />
        <ControlledSelect
          multiselect
          enableSearch
          clearable
          name="unit"
          control={control}
          options={unitOptions}
          disabled={unitOptions.length === 0}
          label={t("searchForm:unitFilter")}
        />
        <ControlledSelect
          multiselect
          enableSearch
          clearable
          name="purposes"
          control={control}
          options={purposeOptions}
          disabled={purposeOptions.length === 0}
          label={t("searchForm:purposesFilter")}
        />
        <ControlledSelect
          multiselect
          clearable
          name="accessType"
          control={control}
          options={accessTypeOptions}
          label={t("searchForm:accessTypeFilter")}
        />
      </Filters>
      <SearchButtonContainer>
        <FilterTagList
          translateTag={translateTag}
          filters={filterOrder}
          multiSelectFilters={multiSelectFilters}
          hideList={hideList}
        />
        <StyledSubmitButton
          type="submit"
          variant={isLoading ? ButtonVariant.Clear : ButtonVariant.Primary}
          iconStart={isLoading ? <LoadingSpinner small /> : <IconSearch />}
          disabled={isLoading}
        >
          {t("searchForm:searchButton")}
        </StyledSubmitButton>
      </SearchButtonContainer>
    </form>
  );
}
