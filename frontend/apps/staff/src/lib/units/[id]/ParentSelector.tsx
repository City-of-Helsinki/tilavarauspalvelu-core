import React from "react";
import { gql } from "@apollo/client";
import { Select } from "hds-react";
import { useTranslation } from "next-i18next";
import type { TFunction } from "next-i18next";
import { createNodeId, convertOptionToHDS, filterNonNullable, toNumber } from "ui/src/modules/helpers";
import type { UnitSpacesQuery } from "@gql/gql-types";
import { useUnitSpacesQuery } from "@gql/gql-types";

type AllSpaces = NonNullable<UnitSpacesQuery["unit"]>["spaces"];
type SpaceNode = AllSpaces[0];

function recurse(parent: SpaceNode, spaces: SpaceNode[], depth: number, pad: string): SpaceNode[] {
  const newParent = {
    ...parent,
    nameFi: "".padStart(depth, pad) + (parent.nameFi ?? "-"),
  };

  const children = spaces.filter((e) => e.parent?.pk === parent.pk);

  if (children.length === 0) {
    return [newParent];
  }
  const c = children.flatMap((space) => recurse(space, spaces, depth + 1, pad));
  return [newParent, ...c];
}

function spacesAsHierarchy(unit: UnitSpacesQuery["unit"] | undefined, paddingChar: string) {
  const allSpaces = filterNonNullable(unit?.spaces);

  const roots = allSpaces.filter((e) => e.parent == null);
  return roots.flatMap((rootSpace) => recurse(rootSpace, allSpaces, 0, paddingChar));
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
    label: t("spaces:noParent"),
    value: 0,
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
    variables: { id: createNodeId("UnitNode", unitPk) },
    skip: !unitPk,
  });

  const { t } = useTranslation();

  const unitSpaces = spacesAsHierarchy(data?.unit, "\u2007");

  // NOTE there used to be children filtering, but it filtered out all possible options
  // this handles the first level of children, but if it's a deeper hierarchy, it's not handled
  const opts = unitSpaces
    .filter((space) => selfPk == null || (space.pk !== selfPk && space.parent?.pk !== selfPk))
    .map((space) => ({
      label: space.nameFi != null && space.nameFi.length > 0 ? space.nameFi : "-",
      value: space.pk ?? 0,
    }));

  const options = noParentless ? opts : [...opts, parentLessOption(t)];

  const hdsOptions = options.map(convertOptionToHDS);
  return (
    <Select
      id="parentSelector"
      texts={{
        label,
        placeholder,
        error: errorText,
        assistive: helperText,
      }}
      disabled={options.length === 0}
      clearable={false}
      options={hdsOptions}
      value={hdsOptions.find((po) => toNumber(po.value) === value)?.value}
      onChange={(selection) => {
        const selected = selection.find(() => true);
        if (selected) {
          onChange(toNumber(selected.value), selected.label);
        }
      }}
      invalid={!!errorText}
    />
  );
}

export const SPACE_HIERARCHY_QUERY = gql`
  query UnitSpaces($id: ID!) {
    unit(id: $id) {
      id
      spaces {
        id
        pk
        nameFi
        parent {
          id
          pk
        }
      }
    }
  }
`;
