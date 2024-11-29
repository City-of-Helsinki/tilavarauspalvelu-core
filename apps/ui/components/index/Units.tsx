import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { IconArrowRight } from "hds-react";
import { breakpoints } from "common/src/common/style";
import Link from "next/link";
import { H3 } from "common/src/common/typography";
import type { UnitNode } from "@gql/gql-types";
import { IconButton } from "common/src/components";
import { singleSearchPrefix } from "@/modules/urls";
import { getTranslation } from "@/modules/util";
import { anchorStyles, focusStyles } from "common/styles/cssFragments";
import { Flex } from "common/styles/util";

type Props = {
  units: Pick<UnitNode, "pk" | "nameFi" | "nameEn" | "nameSv">[];
};

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

export function Units({ units }: Props): JSX.Element | null {
  const { t } = useTranslation(["home", "common"]);

  if (!units == null || units.length === 0) {
    return null;
  }

  return (
    <>
      <H3 as="h2" $noMargin>
        {t("unitsHeading")}
      </H3>
      <Flex $gap="none">
        <UnitContainer>
          {units.slice(0, ITEM_LIMIT).map((unit) => (
            <UnitItemLink
              key={unit.pk}
              href={`${singleSearchPrefix}?unit=${unit.pk}#content`}
              data-testid="front-page__units--unit"
            >
              {getTranslation(unit, "name") || unit.nameFi}
              <IconArrowRight size="l" aria-hidden />
            </UnitItemLink>
          ))}
        </UnitContainer>
      </Flex>
      {units.length > ITEM_LIMIT && (
        <Flex $justifyContent="flex-end" $gap="2-xs" $direction="row">
          <IconButton
            href={singleSearchPrefix}
            label={t("common:showAll")}
            icon={<IconArrowRight aria-hidden />}
            data-testid="front-page__units--more-link"
          />
        </Flex>
      )}
    </>
  );
}
