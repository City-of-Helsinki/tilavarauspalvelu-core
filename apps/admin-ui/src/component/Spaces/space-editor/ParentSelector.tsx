import React from "react";
import { useQuery } from "@apollo/client";
import { Select } from "hds-react";
import i18next from "i18next";
import type { Query, QueryUnitByPkArgs } from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
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

type ParentType = { label: string; value: number | null };

const parentLessOption = {
  // TODO don't use floating i18n.t (use the hook)
  label: i18next.t("SpaceEditor.noParent"),
  value: null,
};

const ParentSelector = ({
  unitPk,
  onChange,
  value,
  label,
  placeholder,
  noParentless = false,
  helperText,
  errorText,
}: Props): JSX.Element | null => {
  const { data } = useQuery<Query, QueryUnitByPkArgs>(SPACE_HIERARCHY_QUERY, {
    variables: { pk: unitPk },
    skip: !unitPk,
  });

  const parentSpaces = filterNonNullable(data?.unitByPk?.spaces);
  const unitSpaces = spacesAsHierarchy(parentSpaces, "\u2007");

  // NOTE there used to be children filtering, but it filtered out all possible options

  const opts = unitSpaces.map((space) => ({
    label: space.nameFi ?? "-",
    value: space.pk ?? null,
  }));

  const options = noParentless ? opts : [...opts, parentLessOption];

  return (
    <Select
      id="parent"
      label={label}
      placeholder={placeholder}
      required
      helper={helperText}
      options={options}
      disabled={options.length === 0}
      value={options.find((po) => po.value === value) ?? null}
      onChange={(selected: ParentType) =>
        onChange(selected.value, selected.label)
      }
      error={errorText}
      invalid={!!errorText}
    />
  );
};

export default ParentSelector;
