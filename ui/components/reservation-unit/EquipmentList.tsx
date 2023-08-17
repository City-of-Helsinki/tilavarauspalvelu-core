import { Button, IconAngleDown, IconAngleUp } from "hds-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { EquipmentType } from "common/types/gql-types";
import { getEquipmentList } from "../../modules/reservationUnit";
import IconButton from "../common/IconButton";

type Props = {
  equipment: EquipmentType[];
  itemsToShow?: number;
};

const Wrapper = styled.div``;

const List = styled.ul<{ $showAll: boolean; $itemsToShow: number }>`
  & > li:nth-of-type(n + ${(props) => props.$itemsToShow + 1}) {
    display: ${(props) => (props.$showAll ? "list-item" : "none")};
  }

  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2-xs) var(--spacing-m);
  padding: 0;

  @media (min-width: ${breakpoints.s}) {
    grid-template-columns: 1fr 1fr;
    row-gap: var(--spacing-s);
  }
`;

const EquipmentItem = styled.li`
  font-size: var(--fontsize-body-l);
`;

const StyledButton = styled(IconButton)`
  display: flex;
  color: var(--color-bus);
  @media (max-width: ${breakpoints.s}) {
    justify-content: center;
  }
`;

const EquipmentList = ({ equipment, itemsToShow = 6 }: Props): JSX.Element => {
  const { t } = useTranslation();

  const [showAll, setShowAll] = useState(false);

  const equipmentList = useMemo(() => {
    return getEquipmentList(equipment);
  }, [equipment]);

  return (
    <Wrapper>
      <List $showAll={showAll} $itemsToShow={itemsToShow}>
        {equipmentList.map((item) => (
          <EquipmentItem key={item}>{item}</EquipmentItem>
        ))}
      </List>
      {itemsToShow < equipment.length && (
        <StyledButton
          label={t(`common:show${showAll ? "Less" : "All"}`)}
          icon={showAll ? <IconAngleUp /> : <IconAngleDown />}
          onClick={() => setShowAll(!showAll)}
        />
      )}
    </Wrapper>
  );
};

export default EquipmentList;
