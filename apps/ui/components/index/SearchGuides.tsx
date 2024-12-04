import React from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { Button, IconArrowRight, ImageWithCard } from "hds-react";
import { fontMedium, H3 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { Flex } from "common/styles/util";

const StyledImageWithCard = styled(ImageWithCard)<{ cardAlignment: string }>`
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
        ${({ cardAlignment }) =>
          cardAlignment === "right" ? `right: 8%;` : `left: 8%;`}
        position: relative;
        min-height: unset;
      }
    }

    @media (max-width: ${breakpoints.m}) {
      display: contents;
      padding-bottom: 200px;

      > div:nth-of-type(1) {
        margin-right: 0;
        margin-left: 0;
        max-width: unset;
        max-height: unset;
      }

      > div:nth-of-type(2) {
        > div {
          position: static;
          margin-right: 0;
          margin-left: 0;
        }
      }
    }

    @media (max-width: ${breakpoints.s}) {
      > div:nth-of-type(1) {
        max-height: 160px;
      }
    }
  }
`;

const InfoContainer = styled(Flex).attrs({
  $gap: "none",
})`
  word-break: break-word;

  /* fix weird global positioning issues in the image card */
  @media (min-width: ${breakpoints.m}) {
    padding-top: var(--spacing-m);
    padding-bottom: var(--spacing-m);
  }

  a {
    ${fontMedium}
    text-decoration: underline;
  }
`;

export function SearchGuides(): JSX.Element {
  const { t } = useTranslation("home");
  const router = useRouter();

  return (
    <StyledImageWithCard
      cardAlignment="left"
      cardLayout="hover"
      color="primary"
      src="images/guide-recurring.png"
    >
      <InfoContainer data-testid="search-guide__recurring">
        <H3 as="h2" $noMargin>
          {t("infoRecurring.heading")}
        </H3>
        <p>{t("infoRecurring.text")}</p>
        <Flex $marginTop="s">
          <Button
            id="browseRecurringReservationUnits"
            onClick={() => router.push("/recurring")}
            iconRight={<IconArrowRight />}
          >
            {t("browseRecurringReservationsButton")}
          </Button>
        </Flex>
      </InfoContainer>
    </StyledImageWithCard>
  );
}
