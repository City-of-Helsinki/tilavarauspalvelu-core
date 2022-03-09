import React from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { Button, IconArrowRight, ImageWithCard } from "hds-react";
import { breakpoint } from "../../modules/style";
import Container from "../common/Container";
import { fontMedium, H2 } from "../../modules/style/typography";

const Wrapper = styled(Container)`
  padding-top: var(--spacing-xl);
`;

const Heading = styled(H2)`
  font-size: var(--fontsize-heading-l);
  font-family: var(--font-bold);
  font-weight: 700;
  margin-top: var(--spacing-s);
`;

const StyledImageWithCard = styled(ImageWithCard)`
  && {
    --card-color-primary: var(--color-black-90);
    --card-background-primary: var(--color-copper-medium-light);
    --card-background-secondary: var(--color-fog-medium-light);
    max-width: 100%;
    width: unset;
    margin-bottom: var(--spacing-layout-xl);

    > :nth-child(2) > div {
      min-height: unset;
    }

    @media (max-width: ${breakpoint.m}) {
      && {
        > :nth-child(1),
        > :nth-child(2) > div {
          margin-right: 0;
          margin-left: 0;
        }
      }
    }
  }
`;

const InfoContainer = styled.div`
  margin-top: var(--spacing-s);
  margin-bottom: var(--spacing-m);
  display: flex;
  flex-direction: column;
  align-content: space-between;
  word-break: break-word;

  a {
    ${fontMedium}
    text-decoration: underline;
  }
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-m);

  @media (max-width: ${breakpoint.s}) {
    display: flex;
    flex-direction: column;
  }
`;

const SearchGuides = (): JSX.Element => {
  const { t } = useTranslation("home");
  const router = useRouter();

  return (
    <Wrapper>
      <StyledImageWithCard
        cardAlignment="left"
        cardLayout="hover"
        color="primary"
        src="images/guide-single.png"
      >
        <InfoContainer data-test-id="search-guide__single">
          <div>
            <Heading>{t("info.heading")}</Heading>
            <p>
              <Trans i18nKey="home:info.text">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://varaamo.hel.fi/"
                >
                  {" "}
                </a>
              </Trans>
            </p>
          </div>
        </InfoContainer>
      </StyledImageWithCard>
      <StyledImageWithCard
        cardAlignment="right"
        cardLayout="hover"
        color="secondary"
        src="images/guide-recurring.png"
      >
        <InfoContainer data-test-id="search-guide__recurring">
          <div>
            <Heading>{t("infoRecurring.heading")}</Heading>
            <p>{t("infoRecurring.text")}</p>
          </div>
          <ButtonContainer>
            <Button
              id="browseRecurringReservationUnits"
              onClick={() => router.push("/recurring")}
              iconRight={<IconArrowRight />}
            >
              {t("browseRecurringReservationsButton")}
            </Button>
          </ButtonContainer>
        </InfoContainer>
      </StyledImageWithCard>
    </Wrapper>
  );
};

export default SearchGuides;
