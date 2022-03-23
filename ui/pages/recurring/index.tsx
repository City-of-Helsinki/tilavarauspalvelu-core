import React from "react";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import { sortBy } from "lodash";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { H1, H3, HeroSubheading } from "../../modules/style/typography";
import { breakpoint } from "../../modules/style";
import { getApplicationRounds } from "../../modules/api";
import { ApplicationRound } from "../../modules/types";
import ApplicationRoundCard from "../../components/index/ApplicationRoundCard";
import { applicationRoundState } from "../../modules/util";
import KorosDefault from "../../components/common/KorosDefault";

type Props = {
  applicationRounds: ApplicationRound[];
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const now = new Date();
  const applicationRounds = await getApplicationRounds();

  const filteredApplicationRounds = sortBy(applicationRounds, ["id"]).filter(
    (applicationRound) =>
      new Date(applicationRound.publicDisplayBegin) <= now &&
      new Date(applicationRound.publicDisplayEnd) >= now
  );

  return {
    props: {
      applicationRounds: filteredApplicationRounds,
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Wrapper = styled.div`
  background-color: var(--color-white);
`;

const HeadWrapper = styled.div`
  background-color: var(--tilavaraus-hero-background-color);
  color: var(--color-white);
`;

const Head = styled.div`
  padding: var(--spacing-m) var(--spacing-m) var(--spacing-xl);

  @media (min-width: ${breakpoint.m}) {
    max-width: var(--container-width-xl);
    padding: var(--spacing-m);
    margin: 0 auto;
    padding-bottom: var(--spacing-layout-l);
  }
`;

const Heading = styled(H1)``;

const SubHeading = styled(HeroSubheading)``;

const Content = styled.div`
  padding: 0 var(--spacing-m) var(--spacing-xl);
  background-color: var(--color-white);

  @media (min-width: ${breakpoint.m}) {
    max-width: var(--container-width-xl);
    margin: 0 auto;
    padding-bottom: var(--spacing-layout-xl);
  }
`;

const RoundList = styled.div`
  margin-bottom: var(--spacing-layout-l);
`;

const RoundHeading = styled(H3)`
  margin-top: 0;
  margin-bottom: var(--spacing-m);
`;

const RecurringLander = ({ applicationRounds }: Props): JSX.Element => {
  const { t } = useTranslation();

  const activeApplicationRounds = applicationRounds.filter(
    (applicationRound) =>
      applicationRoundState(
        applicationRound.applicationPeriodBegin,
        applicationRound.applicationPeriodEnd
      ) === "active"
  );

  const pendingApplicationRounds = applicationRounds.filter(
    (applicationRound) =>
      applicationRoundState(
        applicationRound.applicationPeriodBegin,
        applicationRound.applicationPeriodEnd
      ) === "pending"
  );

  const pastApplicationRounds = applicationRounds.filter(
    (applicationRound) =>
      applicationRoundState(
        applicationRound.applicationPeriodBegin,
        applicationRound.applicationPeriodEnd
      ) === "past"
  );

  return (
    <Wrapper>
      <HeadWrapper>
        <Head>
          <Heading>{t("recurringLander:heading")}</Heading>
          <SubHeading>{t("recurringLander:subHeading")}</SubHeading>
        </Head>
      </HeadWrapper>
      <KorosDefault
        from="var(--tilavaraus-hero-background-color)"
        to="var(--color-white)"
      />
      <Content>
        {activeApplicationRounds?.length > 0 ? (
          <RoundList data-testid="recurring-lander__application-round-container--active">
            <RoundHeading>
              {t("recurringLander:roundHeadings.active")}
            </RoundHeading>
            {activeApplicationRounds.map((applicationRound) => (
              <ApplicationRoundCard
                key={applicationRound.id}
                applicationRound={applicationRound}
              />
            ))}
          </RoundList>
        ) : (
          <RoundList data-testid="recurring-lander__application-round-container--active-empty">
            <RoundHeading>
              {t("recurringLander:roundHeadings.active")}
            </RoundHeading>
            {t("recurringLander:noRounds")}
          </RoundList>
        )}
        {pendingApplicationRounds?.length > 0 && (
          <RoundList data-testid="recurring-lander__application-round-container--pending">
            <RoundHeading>
              {t("recurringLander:roundHeadings.pending")}
            </RoundHeading>
            {pendingApplicationRounds.map((applicationRound) => (
              <ApplicationRoundCard
                key={applicationRound.id}
                applicationRound={applicationRound}
              />
            ))}
          </RoundList>
        )}
        {pastApplicationRounds?.length > 0 && (
          <RoundList data-testid="recurring-lander__application-round-container--past">
            <RoundHeading>
              {t("recurringLander:roundHeadings.past")}
            </RoundHeading>
            {pastApplicationRounds.map((applicationRound) => (
              <ApplicationRoundCard
                key={applicationRound.id}
                applicationRound={applicationRound}
              />
            ))}
          </RoundList>
        )}
      </Content>
    </Wrapper>
  );
};

export default RecurringLander;
