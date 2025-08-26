import React from "react";
import styled from "styled-components";
import { type SpacePageFragment } from "@gql/gql-types";
import { fontMedium } from "common/styled";

type Props = {
  space: SpacePageFragment | null;
};

const Tree = styled.div`
  ${fontMedium};
  font-size: var(--fontsize-heading-m);
  margin-bottom: var(--spacing-xs);
`;

type ParentNode = Pick<NonNullable<SpacePageFragment>, "pk" | "nameFi" | "parent">;

function getParents(root: ParentNode | null | undefined, spaces?: ParentNode[], hierarchy: ParentNode[] = []) {
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
  const unitSpaces = space?.unit?.spaces ?? [];
  // @ts-expect-error -- FIXME this wasn't working before either, the tree raversal is broken
  const tree = getParents(space, unitSpaces, []).reverse();

  return <Tree>{tree.map((parent, i) => `${i !== 0 ? " › " : ""} ${parent.nameFi}`)}</Tree>;
}
