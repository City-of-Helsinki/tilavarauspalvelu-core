import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { sortBy } from "lodash";
import { fontRegular } from "common/src/common/typography";
import type { EventReservationUnit } from "common/types/common";
import { getOldReservationUnitName } from "@/modules/reservationUnit";

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

const UnitList = ({ units }: { units: EventReservationUnit[] }) => {
  const { i18n } = useTranslation();
  const elems = sortBy(units, "priority");
  return (
    <UnitListWrapper>
      {elems.map((reservationUnit, index) => (
        <UnitName key={reservationUnit.reservationUnitId}>
          <div>{index + 1}</div>
          <div>
            {`${getOldReservationUnitName(
              reservationUnit.reservationUnitDetails,
              i18n.language
            )?.trim()}`}
          </div>
        </UnitName>
      ))}
    </UnitListWrapper>
  );
};

export default UnitList;
