import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { EquipmentType } from "common/types/gql-types";
import { ShowAllContainer } from "common/src/components";
import { getEquipmentList } from "../../modules/reservationUnit";

type Props = {
  equipment: EquipmentType[];
  itemsToShow?: number;
};

const EquipmentContainer = styled(ShowAllContainer)`
  .ShowAllContainer__Content {
    list-style: none;
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-2-xs) var(--spacing-m);
    padding: 0;

    @media (min-width: ${breakpoints.s}) {
      grid-template-columns: 1fr 1fr;
      row-gap: var(--spacing-s);
    }
  }
`;

const EquipmentItem = styled.li`
  font-size: var(--fontsize-body-l);
`;

const EquipmentList = ({ equipment, itemsToShow = 6 }: Props): JSX.Element => {
  const { t } = useTranslation();

  const equipmentList = useMemo(() => {
    return getEquipmentList(equipment);
  }, [equipment]);

  return (
    <EquipmentContainer
      showAllLabel={t("common:showAll")}
      showLessLabel={t("common:showLess")}
      maximumNumber={itemsToShow}
      renderAsUl
      data-testid="reservation-unit__equipment"
    >
      {equipmentList.map((item) => (
        <EquipmentItem key={item}>{item}</EquipmentItem>
      ))}
    </EquipmentContainer>
  );
};

export default EquipmentList;
