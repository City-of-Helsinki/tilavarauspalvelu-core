import React from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, IconArrowRight, ImageWithCard } from "hds-react";
import { breakpoint } from "../../modules/style";
import Container from "../common/Container";
import { singleSearchPrefix } from "../../modules/const";

const Wrapper = styled(Container)`
  padding-top: var(--spacing-xl);
`;

const Heading = styled.h2`
  font-size: var(--fontsize-heading-l);
  margin-top: var(--spacing-s);
`;

const StyledImageWithCard = styled(ImageWithCard)`
  && {
    --card-color-primary: var(--color-black-90);
    --card-background-primary: var(--color-copper-medium-light);
    --card-background-secondary: var(--color-fog-medium-light);
    max-width: 100%;
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
            <p>{t("info.text")}</p>
          </div>
          <ButtonContainer>
            <Button
              id="browseSingleReservationUnits"
              onClick={() => router.push(singleSearchPrefix)}
              iconRight={<IconArrowRight />}
            >
              {t("browseReservationsButton")}
            </Button>
          </ButtonContainer>
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
