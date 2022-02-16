import React from "react";
import styled from "styled-components";
import { SpaceType } from "../../../common/gql-types";

type Props = {
  space: SpaceType;
  unitSpaces?: SpaceType[];
};

const Tree = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--tilavaraus-admin-font-bold);
  margin-bottom: var(--spacing-xs);
`;

const getParents = (
  root?: SpaceType,
  spaces?: SpaceType[],
  hierarchy: SpaceType[] = []
) => {
  if (root) {
    hierarchy.push(root);
    const nextParentId = root.parent?.pk;
    const nextParent = spaces?.find((s) => s.pk === nextParentId);
    if (nextParentId) {
      getParents(nextParent, spaces, hierarchy);
    }
  }
  return hierarchy;
};

const SpaceHierarchy = ({ space, unitSpaces }: Props): JSX.Element => {
  const tree = getParents(space, unitSpaces, []).reverse();

  return (
    <Tree>
      {tree.map((parent, i) => `${i !== 0 ? " › " : ""} ${parent.nameFi}`)}
    </Tree>
  );
};

export default SpaceHierarchy;
