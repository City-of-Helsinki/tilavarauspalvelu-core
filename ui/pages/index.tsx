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
import { ApplicationRound } from "../modules/types";
import { getApplicationRounds } from "../modules/api";
import { useApiData } from "../hooks/useApiData";
import Loader from "../components/common/Loader";

interface IProps {
  applicationRounds: ApplicationRound[];
}

export const getServerSideProps = async ({ locale, params }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
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

const Home = (): JSX.Element => {
  const { t } = useTranslation("home");
  const router = useRouter();

  const applicationRounds = useApiData(getApplicationRounds, {}, (applicationRounds) => {
      applicationRounds.sort(
        (ar1: ApplicationRound, ar2: ApplicationRound) =>
          parseISO(ar1.applicationPeriodBegin).getTime() -
          parseISO(ar2.applicationPeriodBegin).getTime()
      );

      return applicationRounds;
    }
  );

  return (
    <>
      <Header heading={t("head.heading")} text={t("head.text")} />
      <Container>
        <TopContainer>
          <Heading>{t("applicationTimes.heading")}</Heading>
          <p className="text-lg">{t("applicationTimes.text")}</p>
        </TopContainer>
        <Loader datas={[applicationRounds]}>
        <ApplicationPeriods applicationRounds={applicationRounds.transformed} />
        </Loader>
        <StyledImageWithCard
          cardAlignment="right"
          cardLayout="hover"
          color="secondary"
          src="main.jpg"
        >
          <InfoContainer>
            <Heading>{t("info.heading")}</Heading>
            <p>{t("info.text")}</p>
            <ButtonContainer>
              <Button
                id="browseAllButton"
                variant="secondary"
                theme="black"
                onClick={() => router.push("/search/?search=")}
                iconLeft={<IconSearch />}
              >
                {t("browseAllButton")}
              </Button>
            </ButtonContainer>
          </InfoContainer>
        </StyledImageWithCard>
      </Container>
    </>
  );
};

export default Home;
