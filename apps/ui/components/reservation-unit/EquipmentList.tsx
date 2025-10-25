import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/modules/const";
import type { EquipmentFieldsFragment } from "@gql/gql-types";
import { ShowAllContainer } from "common/src/components";
import { getEquipmentList } from "@/modules/reservationUnit";
import { convertLanguageCode } from "common/src/modules/util";
import { gql } from "@apollo/client";

type Props = {
  equipment: EquipmentFieldsFragment[];
  itemsToShow?: number;
};

const EquipmentContainer = styled(ShowAllContainer)`
  .ShowAllContainer__Content {
    list-style: none;
    gap: var(--spacing-2-xs) var(--spacing-m);
    padding: 0;
    margin: 0;

    display: grid;
    grid-template-columns: 1fr;
    @media (min-width: ${breakpoints.s}) {
      grid-template-columns: 1fr 1fr;
      row-gap: var(--spacing-s);
    }
  }
`;

const EquipmentItem = styled.li`
  font-size: var(--fontsize-body-l);
`;

export function EquipmentList({ equipment, itemsToShow = 6 }: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const equipmentList = getEquipmentList(equipment, lang);

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
}

export const EQUIPMENT_FRAGMENT = gql`
  fragment EquipmentFields on EquipmentNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    category {
      id
      nameFi
      nameEn
      nameSv
    }
  }
`;
