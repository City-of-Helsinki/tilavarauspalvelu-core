import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { IconArrowRight, IconSize } from "hds-react";
import Link from "next/link";
import { breakpoints } from "common/src/modules/const";
import { Flex, H3, anchorStyles, focusStyles } from "common/src/styled";
import type { UnitListFieldsFragment } from "@gql/gql-types";
import { IconButton } from "common/src/components";
import { singleSearchPrefix } from "@/modules/urls";
import { convertLanguageCode, getTranslationSafe } from "common/src/modules/util";
import { gql } from "@apollo/client";

const ITEM_LIMIT = 8;

const UnitContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 3rem;

  @media (max-width: ${breakpoints.s}) {
    svg {
      transform: scale(0.5);
    }
    /* lower the gap because svg icon forces elements to be 48px min-height */
    gap: 0.5rem 3rem;
  }
`;

const UnitItemLink = styled(Link)`
  &:hover {
    text-decoration: underline;
  }

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs);
  line-height: var(--lineheight-l);
  font-size: var(--fontsize-body-l);

  ${focusStyles}
  ${anchorStyles}

  svg {
    min-width: 48px;
  }
`;

type Props = {
  units: Readonly<UnitListFieldsFragment[]>;
};

export function Units({ units }: Props): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  if (units.length === 0) {
    return null;
  }

  return (
    <>
      <H3 as="h2" $noMargin>
        {t("home:unitsHeading")}
      </H3>
      <Flex $gap="none">
        <UnitContainer>
          {units.slice(0, ITEM_LIMIT).map((unit) => (
            <UnitItemLink
              key={unit.pk}
              href={`${singleSearchPrefix}?units=${unit.pk}#content`}
              data-testid="front-page__units--unit"
            >
              {getTranslationSafe(unit, "name", lang) || "-"}
              <IconArrowRight size={IconSize.Large} />
            </UnitItemLink>
          ))}
        </UnitContainer>
      </Flex>
      {units.length > ITEM_LIMIT && (
        <Flex $justifyContent="flex-end" $gap="2-xs" $direction="row">
          <IconButton
            href={singleSearchPrefix}
            label={t("common:showAll")}
            icon={<IconArrowRight />}
            data-testid="front-page__units--more-link"
          />
        </Flex>
      )}
    </>
  );
}

export const UNIT_LIST_FRAGMENT = gql`
  fragment UnitListFields on UnitNode {
    id
    pk
    nameFi
    nameEn
    nameSv
  }
`;
