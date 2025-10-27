import React from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { Button, IconArrowRight, ImageWithCard } from "hds-react";
import { Flex, H3 } from "common/src/styled";
import { breakpoints } from "common/src/modules/const";
import { seasonalPrefix } from "@/modules/urls";

const StyledImageWithCard = styled(ImageWithCard)`
  && {
    --card-color-primary: var(--color-black-90);
    --card-background-primary: var(--color-black-5);
    --card-background-secondary: var(--color-suomenlinna-light);
    max-width: 100%;
    width: unset;
    height: 420px;
    margin-bottom: var(--spacing-2-xl);

    > div:nth-of-type(1) {
      max-width: 600px;
      max-height: 409px;
    }

    > div:nth-of-type(2) {
      > div {
        position: relative;
        min-height: unset;
      }
    }

    @media (max-width: ${breakpoints.m}) {
      display: contents;
    }
  }
`;

const InfoContainer = styled(Flex).attrs({
  $gap: "none",
})`
  word-break: normal;
  overflow-wrap: anywhere;

  /* fix weird global positioning issues in the image card */
  @media (min-width: ${breakpoints.m}) {
    padding-top: var(--spacing-m);
    padding-bottom: var(--spacing-m);
  }
`;

const OuterWrapper = styled.div`
  padding: 0;
  @media (min-width: ${breakpoints.l}) {
    padding: 0 var(--spacing-2-xl);
  }
`;

export function SearchGuides(): JSX.Element {
  const { t } = useTranslation("home");
  const router = useRouter();

  return (
    <OuterWrapper>
      <StyledImageWithCard color="primary" src="images/guide-recurring.png">
        <InfoContainer data-testid="search-guide__recurring">
          <H3 as="h2" $noMargin>
            {t("infoRecurring.heading")}
          </H3>
          <p>{t("infoRecurring.text")}</p>
          <Flex $marginTop="s">
            <Button
              id="browseSeriesReservationUnits"
              onClick={() => router.push(seasonalPrefix)}
              iconEnd={<IconArrowRight />}
            >
              {t("browseReservationSeriesButton")}
            </Button>
          </Flex>
        </InfoContainer>
      </StyledImageWithCard>
    </OuterWrapper>
  );
}
