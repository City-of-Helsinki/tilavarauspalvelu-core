import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { IconArrowRight } from "hds-react";
import { breakpoints } from "common/src/common/style";
import Link from "next/link";
import { fontMedium, H3 } from "common/src/common/typography";
import type { UnitNode } from "common/types/gql-types";
import { IconButton } from "common/src/components";
import { singleSearchPrefix } from "../../modules/const";
import { getTranslation } from "../../modules/util";
import { anchorStyles, focusStyles } from "common/styles/cssFragments";

type Props = {
  units: UnitNode[];
};

const itemLimit = 8;

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-m);
`;

const Heading = styled(H3).attrs({ as: "h2" })`
  margin-top: 0;
  margin-bottom: var(--spacing-hz);
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: ${breakpoints.s}) {
    padding-right: var(--spacing-layout-l);
  }
`;

const UnitContainer = styled.div`
  margin-bottom: var(--spacing-xl);

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

const IconLinkContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2-xs);
  ${fontMedium}
`;

const Units = ({ units }: Props): JSX.Element | null => {
  const { t } = useTranslation(["home", "common"]);

  if (!units == null || units.length === 0) {
    return null;
  }
  return (
    <Wrapper>
      <Content>
        <Heading>{t("unitsHeading")}</Heading>
        <UnitContainer>
          {units.slice(0, itemLimit).map((unit) => (
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
      </Content>
      {units?.length > itemLimit && (
        <IconLinkContainer>
          <IconButton
            href={singleSearchPrefix}
            label={t("common:showAll")}
            icon={<IconArrowRight aria-hidden />}
            data-testid="front-page__units--more-link"
          />
        </IconLinkContainer>
      )}
    </Wrapper>
  );
};

export default Units;
