import React from "react";
import { useTranslation } from "next-i18next";
import { GetStaticProps } from "next";
import { Button, IconSearch, ImageWithCard } from "hds-react";
import { useRouter } from "next/router";
import styled from "styled-components";
import { parseISO } from "date-fns";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "../components/common/Container";
import Header from "../components/index/Header";
import ApplicationPeriods from "../components/index/ApplicationPeriodList";
import { breakpoint } from "../modules/style";
import Title from "../components/common/Title";
import { ApplicationRound } from "../modules/types";
import { getApplicationRounds } from "../modules/api";

interface IProps {
  applicationRounds: ApplicationRound[];
}

export const getStaticProps: GetStaticProps<IProps> = async ({ locale }) => {
  const applicationRounds = await getApplicationRounds();
  applicationRounds.sort(
    (ar1: ApplicationRound, ar2: ApplicationRound) =>
      parseISO(ar1.applicationPeriodBegin).getTime() -
      parseISO(ar2.applicationPeriodBegin).getTime()
  );

  return {
    props: {
      ...(await serverSideTranslations(locale)),
      applicationRounds,
      // Will be passed to the page component as props
    },
    revalidate: 100, // In seconds
  };
};

const TopContainer = styled.div`
  margin-right: 30%;
  @media (max-width: ${breakpoint.m}) {
    margin-right: 0%;
  }
`;

const Heading = styled.h2`
  font-size: var(--fontsize-heading-l);
  margin-top: var(--spacing-s);
`;

const StyledImageWithCard = styled(ImageWithCard)`
  && {
    margin-top: var(--spacing-layout-xl);
    max-width: 75rem;

    > :nth-child(2) {
      height: auto;
      margin: 1em;
    }

    @media (max-width: ${breakpoint.s}) {
      margin-top: var(--spacing-layout-s);

      > :nth-child(1) {
        margin: 0;
      }

      > :nth-child(2) {
        height: auto;
        margin: var(--spacing-m) 0 0 0;
        div {
          margin: 0;
        }
      }
    }
  }
`;

const InfoContainer = styled.div`
  margin-top: var(--spacing-s);
  margin-bottom: var(--spacing-m);
`;

const ButtonContainer = styled.div`
  @media (max-width: ${breakpoint.s}) {
    display: flex;
    flex-direction: column;

    > button {
      margin-bottom: var(--spacing-m);
      margin-right: 0;
    }
  }

  margin-top: var(--spacing-xl);

  > button {
    margin-top: var(--spacing-m);
  }
`;

type Props = {
  applicationRounds: ApplicationRound[];
};

const Home = ({ applicationRounds }: Props): JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <Title>Tilavarauspalvelu</Title>
      <Header heading={t("home.head.heading")} text={t("home.head.text")} />
      <Container>
        <TopContainer>
          <Heading>{t("home.applicationTimes.heading")}</Heading>
          <p className="text-lg">{t("home.applicationTimes.text")}</p>
        </TopContainer>
        <ApplicationPeriods applicationRounds={applicationRounds} />
        <StyledImageWithCard
          cardAlignment="right"
          cardLayout="hover"
          color="secondary"
          src="main.jpg"
        >
          <InfoContainer>
            <Heading>{t("home.info.heading")}</Heading>
            <p>{t("home.info.text")}</p>
            <ButtonContainer>
              <Button
                id="browseAllButton"
                variant="secondary"
                theme="black"
                onClick={() => router.push("/search/?search=")}
                iconLeft={<IconSearch />}
              >
                {t("home.browseAllButton")}
              </Button>
            </ButtonContainer>
          </InfoContainer>
        </StyledImageWithCard>
      </Container>
    </>
  );
};

export default Home;
