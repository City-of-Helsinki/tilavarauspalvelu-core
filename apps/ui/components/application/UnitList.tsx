import React from "react";
import styled from "styled-components";
import { sortBy } from "lodash";
import { fontRegular } from "common/src/common/typography";
import { EventReservationUnitNode } from "common/types/gql-types";
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

const UnitList = ({ units }: { units: EventReservationUnitNode[] }) => {
  const elems = sortBy(units, "priority");
  return (
    <UnitListWrapper>
      {elems.map((reservationUnit, index) => (
        <UnitName key={reservationUnit.reservationUnit?.pk}>
          <div>{index + 1}</div>
          <div>
            {" "}
            {`${getTranslation(
              reservationUnit.reservationUnit ?? {},
              "name"
            ).trim()}`}{" "}
          </div>
        </UnitName>
      ))}
    </UnitListWrapper>
  );
};

export { UnitList };
