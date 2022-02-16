import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Select } from "hds-react";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { Maybe, Query, SpaceType } from "../../../common/gql-types";
import { SPACE_HIERARCHY_QUERY } from "./queries";
import { spacesAsHierarchy } from "./util";

type Props = {
  unitPk: number;
  spacePk: number | null;
  parentPk: number | null;
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
}: Props): JSX.Element => {
  const [parentOptions, setParentOptions] = useState([
    independentSpaceOption,
  ] as ParentType[]);

  const { t } = useTranslation();

  useQuery<Query>(SPACE_HIERARCHY_QUERY, {
    onCompleted: ({ spaces }) => {
      const parentSpaces = spaces?.edges.map((s) => s?.node as SpaceType);
      if (parentSpaces) {
        const unitSpaces = spacesAsHierarchy(
          parentSpaces.filter((space) => {
            return space.unit?.pk === unitPk;
          }),
          "\u2007"
        );

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

        setParentOptions([independentSpaceOption, ...additionalOptions]);
      }
    },
  });

  return (
    <Select
      id="parent"
      label={t("SpaceModal.page1.parentLabel")}
      placeholder={t("SpaceModal.page1.parentPlaceholder")}
      required
      helper={t("SpaceModal.page1.parentHelperText")}
      options={parentOptions}
      value={getParent(parentPk, parentOptions)}
      onChange={(selected: ParentType) =>
        onChange(selected.value, selected.label)
      }
    />
  );
};

export default ParentSelector;
