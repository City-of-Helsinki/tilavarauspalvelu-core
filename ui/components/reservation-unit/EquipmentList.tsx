import { Button, IconAngleDown, IconAngleUp } from "hds-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { EquipmentType } from "../../modules/gql-types";
import { getEquipmentList } from "../../modules/reservationUnit";
import { breakpoint } from "../../modules/style";

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

  @media (min-width: ${breakpoint.s}) {
    grid-template-columns: 1fr 1fr;
    row-gap: var(--spacing-s);
  }
`;

const EquipmentItem = styled.li`
  font-size: var(--fontsize-body-m);

  @media (min-width: ${breakpoint.s}) {
    font-size: var(--fontsize-body-l);
  }
`;

const ToggleButton = styled(Button)`
  font-size: var(--fontsize-body-m);
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
        <ToggleButton
          variant="supplementary"
          size="small"
          onClick={() => setShowAll(!showAll)}
          iconRight={showAll ? <IconAngleUp /> : <IconAngleDown />}
        >
          {t(`common:show${showAll ? "Less" : "More"}`)}
        </ToggleButton>
      )}
    </Wrapper>
  );
};

export default EquipmentList;
