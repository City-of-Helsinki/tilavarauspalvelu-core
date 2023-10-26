import React from "react";
import styled from "styled-components";
import { sortBy } from "lodash";
import { fontRegular } from "common/src/common/typography";
import { getTranslation } from "common/src/common/util";

const UnitListWrapper = styled.ol`
  margin: 0 0 var(--spacing-layout-l);
  padding: 0;
  ${fontRegular};
  width: 100%;
  list-style: none;
`;

const UnitName = styled.li`
  padding: var(--spacing-m) var(--spacing-xs);
  border-bottom: 1px solid var(--color-black-20);
  display: flex;
  gap: var(--spacing-xl);
`;

// NOTE prefer custom typing over gql for simple components
// (would be even nicer to enforce non null here)
type UnitDisplayType =
  | {
      priority?: number;
      pk: number;
      nameFi?: string;
      nameSv?: string;
      nameEn?: string;
    }
  | undefined;

const UnitList = ({ units }: { units: UnitDisplayType[] }) => {
  const elems = sortBy(units, "priority");
  return (
    <UnitListWrapper>
      {elems.map((ru, index) => (
        <UnitName key={ru?.pk}>
          <div>{index + 1}</div>
          <div>{`${getTranslation(ru ?? {}, "name").trim()}`}</div>
        </UnitName>
      ))}
    </UnitListWrapper>
  );
};

export { UnitList };
