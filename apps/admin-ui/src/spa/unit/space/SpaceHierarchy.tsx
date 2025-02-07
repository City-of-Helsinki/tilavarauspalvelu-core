import React from "react";
import styled from "styled-components";
import type { SpaceQuery } from "@gql/gql-types";
import { fontMedium } from "common";

type Node = SpaceQuery["space"];
type Props = {
  space: Node;
};

const Tree = styled.div`
  ${fontMedium}
  font-size: var(--fontsize-heading-m);
  margin-bottom: var(--spacing-xs);
`;

type SpaceNode = Pick<NonNullable<Node>, "pk" | "nameFi" | "parent">;

function getParents(
  root?: SpaceNode | null | undefined,
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
export function SpaceHierarchy({ space }: Props): JSX.Element {
  const unitSpaces = space?.unit?.spaces;
  const tree = getParents(space, unitSpaces, []).reverse();

  return (
    <Tree>
      {tree.map((parent, i) => `${i !== 0 ? " › " : ""} ${parent.nameFi}`)}
    </Tree>
  );
}
