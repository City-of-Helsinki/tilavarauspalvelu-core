import React from "react";
import { useTranslation } from "next-i18next";
import { gql } from "@apollo/client";
import styled from "styled-components";
import { getLocalizationLang } from "@ui/modules/helpers";
import { ShowAllContainer } from "ui/src/components";
import { breakpoints } from "ui/src/modules/const";
import type { EquipmentFieldsFragment } from "@gql/gql-types";
import { getEquipmentList } from "@/modules/reservationUnit";

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

export function EquipmentList({ equipment, itemsToShow = 6 }: Props): React.ReactElement {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);
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
