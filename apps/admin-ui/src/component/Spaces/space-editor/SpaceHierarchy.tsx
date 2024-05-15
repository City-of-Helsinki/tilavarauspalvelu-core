import React from "react";
import styled from "styled-components";
import type { SpaceNode } from "@gql/gql-types";

type Props = {
  space: SpaceNode;
  unitSpaces?: SpaceNode[];
};

const Tree = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--tilavaraus-admin-font-bold);
  margin-bottom: var(--spacing-xs);
`;

function getParents(
  root?: SpaceNode,
  spaces?: SpaceNode[],
  hierarchy: SpaceNode[] = []
) {
  if (root) {
    hierarchy.push(root);
    const nextParentId = root.parent?.pk;
    const nextParent = spaces?.find((s) => s.pk === nextParentId);
    if (nextParentId) {
      getParents(nextParent, spaces, hierarchy);
    }
  }
  return hierarchy;
}

// TODO this is a huge problem because we cant do a recursive query, would require backend support
export function SpaceHierarchy({ space, unitSpaces }: Props): JSX.Element {
  const tree = getParents(space, unitSpaces, []).reverse();
  // TODO there is weird: unit spaces is undefined all

  return (
    <Tree>
      {tree.map((parent, i) => `${i !== 0 ? " › " : ""} ${parent.nameFi}`)}
    </Tree>
  );
}
