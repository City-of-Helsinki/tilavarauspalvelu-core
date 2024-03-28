import React from "react";
import { useQuery } from "@apollo/client";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Select } from "hds-react";
import type { Query, QueryUnitArgs } from "common/types/gql-types";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { SPACE_HIERARCHY_QUERY } from "./queries";
import { spacesAsHierarchy } from "./util";

type Props = {
  unitPk: number;
  value: number | null;
  label: string;
  placeholder?: string;
  helperText?: string;
  noParentless?: boolean;
  errorText?: string;
  // TODO why is the label sent upstream?
  onChange: (val: number | null, name?: string) => void;
};

function parentLessOption(t: TFunction) {
  return {
    label: t("SpaceEditor.noParent"),
    value: null,
  };
}

export function ParentSelector({
  unitPk,
  onChange,
  value,
  label,
  placeholder,
  noParentless = false,
  helperText,
  errorText,
}: Props): JSX.Element {
  const { data } = useQuery<Query, QueryUnitArgs>(SPACE_HIERARCHY_QUERY, {
    fetchPolicy: "no-cache",
    variables: { id: base64encode(`UnitNode:${unitPk}`) },
    skip: !unitPk,
  });

  const { t } = useTranslation();

  const parentSpaces = filterNonNullable(data?.unit?.spaces);
  const unitSpaces = spacesAsHierarchy(parentSpaces, "\u2007");

  // NOTE there used to be children filtering, but it filtered out all possible options

  const opts = unitSpaces.map((space) => ({
    label: space.nameFi != null && space.nameFi.length > 0 ? space.nameFi : "-",
    value: space.pk ?? null,
  }));

  const options = noParentless ? opts : [...opts, parentLessOption(t)];

  return (
    <Select
      id="parentSelector"
      label={label}
      placeholder={placeholder}
      required
      helper={helperText}
      options={options}
      disabled={options.length === 0}
      value={options.find((po) => po.value === value) ?? null}
      onChange={(selected: (typeof opts)[0]) =>
        onChange(selected.value, selected.label)
      }
      error={errorText}
      invalid={!!errorText}
    />
  );
}
