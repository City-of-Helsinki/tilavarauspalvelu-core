import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Select } from "hds-react";
import { UnitSpacesQuery, useUnitSpacesQuery } from "@gql/gql-types";
import { base64encode, filterNonNullable } from "common/src/helpers";

function spacesAsHierarchy(unit: UnitSpacesQuery["unit"], paddingChar: string) {
  const allSpaces = filterNonNullable(unit?.spaces);
  type SpaceNode = (typeof allSpaces)[0];

  function recurse(
    parent: SpaceNode,
    spaces: SpaceNode[],
    depth: number,
    pad: string
  ): SpaceNode[] {
    const newParent = {
      ...parent,
      nameFi: "".padStart(depth, pad) + parent.nameFi,
    };

    const children = spaces.filter((e) => e.parent?.pk === parent.pk);

    if (children.length === 0) {
      return [newParent];
    }
    const c = children.flatMap((space) =>
      recurse(space, spaces, depth + 1, pad)
    );
    return [newParent, ...c];
  }

  const roots = allSpaces.filter((e) => e.parent == null);
  return roots.flatMap((rootSpace) =>
    recurse(rootSpace, allSpaces, 0, paddingChar)
  );
}

type Props = {
  unitPk: number;
  value: number | null;
  label: string;
  placeholder?: string;
  helperText?: string;
  noParentless?: boolean;
  errorText?: string;
  selfPk?: number;
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
  selfPk,
  helperText,
  errorText,
}: Props): JSX.Element {
  const { data } = useUnitSpacesQuery({
    fetchPolicy: "no-cache",
    variables: { id: base64encode(`UnitNode:${unitPk}`) },
    skip: !unitPk,
  });

  const { t } = useTranslation();

  const unitSpaces = spacesAsHierarchy(data?.unit, "\u2007");

  // NOTE there used to be children filtering, but it filtered out all possible options
  // this handles the first level of children, but if it's a deeper hierarchy, it's not handled
  const opts = unitSpaces
    .filter(
      (space) =>
        selfPk == null || (space.pk !== selfPk && space.parent?.pk !== selfPk)
    )
    .map((space) => ({
      label:
        space.nameFi != null && space.nameFi.length > 0 ? space.nameFi : "-",
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
