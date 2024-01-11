import React from "react";
import { useTranslation } from "react-i18next";
import { AutoGrid, FullRow } from "@/styles/layout";
import { SearchInput, Select } from "hds-react";
import { useSearchParams } from "react-router-dom";
import { SearchTags } from "@/component/SearchTags";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "app/common/const";
import {
  ApplicantTypeChoice,
  ApplicationEventStatusChoice,
} from "common/types/gql-types";
import { debounce } from "lodash";
import { HR } from "app/component/lists/components";

export type UnitPkName = {
  pk: number;
  nameFi: string;
};

// TODO don't template this yet, make specialized versions firsts
// so the one we typically use is int (pk)
// { label: string; value: number }
function MultiSelectFilter({
  name,
  options,
}: {
  name: string;
  // TODO don't like the union (proper generics force the whole chain to be the same type unions don't)
  // what I want is to template T where T is one of string | number
  options: { label: string; value: number | string }[];
}): JSX.Element {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const filter = params.getAll(name);

  // TODO copy paste from allocation/index.tsx
  // TODO recheck that this is equal to the above before removing it
  const setFilter = (value: string[] | null) => {
    const vals = new URLSearchParams(params);
    if (value == null || value.length === 0) {
      vals.delete(name);
    } else {
      vals.set(name, value[0]);
      value.forEach((v) => {
        if (!vals.has(name, v)) {
          vals.append(name, v);
        }
      });
    }
    setParams(vals, { replace: true });
  };

  // TODO common namespace for these and separate the labels / placeholders
  const label = t(`filters.label.${name}`);
  const placeholder = t(`filters.placeholder.${name}`);
  return (
    <Select
      label={label}
      multiselect
      placeholder={placeholder}
      // @ts-expect-error -- multiselect problems
      options={options}
      disabled={options.length === 0}
      value={options.filter((v) => filter.includes(v.value.toString())) ?? null}
      onChange={(val?: typeof options) =>
        setFilter(val?.map((x) => x.value.toString()) ?? null)
      }
    />
  );
}

type Props = {
  units: UnitPkName[];
  statusOption?: "application" | "event" | "eventShort";
  enableWeekday?: boolean;
  enableReservationUnit?: boolean;
  reservationUnits?: UnitPkName[];
};

export function Filters({
  units,
  statusOption = "application",
  enableWeekday = false,
  enableReservationUnit = false,
  reservationUnits = [],
}: Props): JSX.Element {
  const { t } = useTranslation();

  const unitOptions = units.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? "",
  }));

  const statusOptions = VALID_ALLOCATION_APPLICATION_STATUSES.map((status) => ({
    label: t(`Application.statuses.${status}`),
    value: status,
  }));

  const applicantOptions = Object.values(ApplicantTypeChoice).map(
    (applicant) => ({
      label: t(`Application.applicantTypes.${applicant}`),
      value: applicant,
    })
  );

  const translateTag = (key: string, value: string) => {
    switch (key) {
      case "unit":
        return unitOptions.find((u) => u.value === Number(value))?.label ?? "-";
      case "status":
        return t(`Application.statuses.${value}`);
      case "applicant":
        return t(`Application.applicantTypes.${value}`);
      case "weekday":
        return t(`dayLong.${value}`);
      case "reservationUnit":
        return (
          reservationUnits.find((u) => u.pk === Number(value))?.nameFi ?? "-"
        );
      case "eventStatus":
        return t(`ApplicationEvent.statuses.${value}`);
      default:
        return value;
    }
  };

  const [params, setParams] = useSearchParams();
  const nameFilter = params.get("name");
  const setNameFilter = (value: string | null) => {
    const vals = new URLSearchParams(params);
    if (value == null || value.length === 0) {
      vals.delete("name");
    } else {
      vals.set("name", value);
    }
    setParams(vals, { replace: true });
  };

  // Hide the tags that don't have associated filter on the current tab
  const hideSearchTags: string[] = [
    "tab",
    "orderBy",
    ...(statusOption !== "application" ? ["status"] : ["eventStatus"]),
    ...(!enableWeekday ? ["weekday"] : []),
    ...(!enableReservationUnit ? ["reservationUnit"] : []),
  ];

  const weekdayOptions = Array.from(Array(7)).map((_, i) => ({
    label: t(`dayLong.${i}`),
    value: i,
  }));

  const reservationUnitOptions = reservationUnits.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? "",
  }));

  // event status is shared on two tabs, but allocated only has two options
  const eventStatusArrayLong = Object.values(
    ApplicationEventStatusChoice
  ).filter((x) => x !== ApplicationEventStatusChoice.Failed);
  const eventStatusArrayShort = [
    ApplicationEventStatusChoice.Approved,
    ApplicationEventStatusChoice.Declined,
  ];
  const eventStatusOptions = (
    statusOption === "eventShort" ? eventStatusArrayShort : eventStatusArrayLong
  ).map((status) => ({
    label: t(`ApplicationEvent.statuses.${status}`),
    value: status,
  }));

  return (
    <AutoGrid>
      <MultiSelectFilter name="unit" options={unitOptions} />
      {statusOption !== "application" ? (
        <MultiSelectFilter name="eventStatus" options={eventStatusOptions} />
      ) : (
        <MultiSelectFilter name="status" options={statusOptions} />
      )}
      <MultiSelectFilter name="applicant" options={applicantOptions} />
      {enableWeekday && (
        <MultiSelectFilter name="weekday" options={weekdayOptions} />
      )}
      {enableReservationUnit && (
        <MultiSelectFilter
          name="reservationUnit"
          options={reservationUnitOptions}
        />
      )}
      <SearchInput
        // TODO can we use a common label for this?
        label={t("Allocation.filters.label.search")}
        placeholder={t("Allocation.filters.placeholder.search")}
        onChange={debounce((str) => setNameFilter(str), 100, {
          leading: true,
        })}
        onSubmit={() => {}}
        value={nameFilter ?? ""}
      />
      <FullRow>
        <SearchTags hide={hideSearchTags} translateTag={translateTag} />
      </FullRow>
      <FullRow>
        <HR />
      </FullRow>
    </AutoGrid>
  );
}
