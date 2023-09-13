import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Select } from "hds-react";
import i18next from "i18next";
import {
  Maybe,
  Query,
  QueryUnitByPkArgs,
  SpaceType,
} from "common/types/gql-types";
import { SPACE_HIERARCHY_QUERY } from "./queries";
import { spacesAsHierarchy } from "./util";

type Props = {
  unitPk: number;
  spacePk?: number | null;
  parentPk: number | null;
  label: string;
  placeholder?: string;
  helperText?: string;
  disableNull?: boolean;
  errorText?: string;
  onChange: (val: number | null, name?: string) => void;
};

type ParentType = { label: string; value: number | null };

const getChildrenFor = (spacePk: number, hierarchy: SpaceType[]) => {
  return hierarchy.filter((s) => s.parent?.pk === spacePk);
};

const getChildrenRecursive = (spacePk: number, hierarchy: SpaceType[]) => {
  const newChildren = getChildrenFor(spacePk, hierarchy);
  return newChildren.concat(
    newChildren.flatMap((s) => getChildrenFor(s.pk as number, hierarchy))
  );
};

const independentSpaceOption = {
  label: i18next.t("SpaceEditor.noParent"),
  value: null,
};

const getParent = (v: Maybe<number> | undefined, options: ParentType[]) =>
  options.find((po) => po.value === v) || options[0];

const ParentSelector = ({
  unitPk,
  spacePk,
  onChange,
  parentPk,
  label,
  placeholder,
  disableNull = false,
  helperText,
  errorText,
}: Props): JSX.Element | null => {
  const [parentOptions, setParentOptions] = useState([] as ParentType[]);

  useQuery<Query, QueryUnitByPkArgs>(SPACE_HIERARCHY_QUERY, {
    variables: { pk: unitPk },
    onCompleted: ({ unitByPk }) => {
      const parentSpaces = unitByPk?.spaces?.map((s) => s as SpaceType);
      if (parentSpaces) {
        const unitSpaces = spacesAsHierarchy(parentSpaces, "\u2007");

        const children = spacePk
          ? getChildrenRecursive(spacePk, unitSpaces).map((s) => s.pk)
          : [];

        const additionalOptions = unitSpaces
          .filter((space) => space.pk !== spacePk)
          .filter((space) => children.indexOf(space.pk) === -1)
          .map((space) => ({
            label: space.nameFi as string,
            value: space.pk as number,
          }));

        const options = [] as {
          label: string;
          value: number | null;
        }[];

        if (!disableNull) {
          options.push(independentSpaceOption);
        }

        setParentOptions(options.concat(additionalOptions));
      }
    },
  });

  if (parentOptions.length === 0) {
    return null;
  }

  return (
    <Select
      id="parent"
      label={label}
      placeholder={placeholder}
      required
      helper={helperText}
      options={parentOptions}
      value={
        parentPk || !disableNull
          ? getParent(parentPk, parentOptions)
          : undefined
      }
      onChange={(selected: ParentType) =>
        onChange(selected.value, selected.label)
      }
      error={errorText}
      invalid={!!errorText}
    />
  );
};

export default ParentSelector;
