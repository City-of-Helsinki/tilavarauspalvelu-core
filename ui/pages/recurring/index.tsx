import React from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { IconSearch, ImageWithCard } from "hds-react";
import { sortBy } from "lodash";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { H1, H3 } from "../../modules/style/typography";
import { breakpoint } from "../../modules/style";
import { getApplicationRounds } from "../../modules/api";
import { ApplicationRound } from "../../modules/types";
import ApplicationRoundCard from "../../components/index/ApplicationRoundCard";
import { applicationRoundState } from "../../modules/util";
import { MediumButton } from "../../styles/util";
import { searchPrefix } from "../../modules/const";
import KorosPulseEasy from "../../components/common/KorosPulseEasy";

type Props = {
  applicationRounds: ApplicationRound[];
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const now = new Date();
  const applicationRounds = await getApplicationRounds();

  const filteredApplicationRounds = sortBy(
    applicationRounds.filter(
      (applicationRound) =>
        new Date(applicationRound.publicDisplayBegin) <= now &&
        new Date(applicationRound.publicDisplayEnd) >= now
    ),
    ["applicationPeriodBegin", "publicDisplayBegin"]
  );

  return {
    props: {
      applicationRounds: filteredApplicationRounds,
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Wrapper = styled.div``;

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
    padding-bottom: var(--spacing-layout-xl);
  }
`;

const Heading = styled(H1)`
  font-size: var(--fontsize-heading-xl);
`;

const Ingress = styled.p``;

const Content = styled.div`
  padding: var(--spacing-s) var(--spacing-m) var(--spacing-xl);

  @media (min-width: ${breakpoint.m}) {
    max-width: var(--container-width-xl);
    padding: var(--spacing-m);
    margin: 0 auto;
    padding-bottom: var(--spacing-layout-xl);
  }
`;

const RoundList = styled.div`
  margin-bottom: var(--spacing-xl);
`;

const RoundHeading = styled(H1)`
  font-size: var(--fontsize-heading-l);
`;

const StyledImageWithCard = styled(ImageWithCard)`
  && {
    --card-color-primary: var(--color-black-90);
    --card-background-primary: var(--color-copper-medium-light);
    --card-background-secondary: var(--color-fog-medium-light);
    max-width: 100%;
    margin-top: var(--spacing-layout-xl);
    margin-bottom: var(--spacing-layout-xl);
    margin-left: 0;

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

  button {
    --border-color: var(--color-black);
    --color: var(--color-black);
  }

  @media (max-width: ${breakpoint.s}) {
    display: flex;
    flex-direction: column;
  }
`;

const CardHeading = styled(H1)`
  font-size: var(--fontsize-heading-l);
`;

const RecurringLander = ({ applicationRounds }: Props): JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();

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

  return (
    <Wrapper>
      <HeadWrapper>
        <Head>
          <Heading>{t("recurringLander:heading")}</Heading>
          <H3>{t("recurringLander:subHeading")}</H3>
          <Ingress>{t("recurringLander:ingress")}</Ingress>
        </Head>
      </HeadWrapper>
      <KorosPulseEasy
        from="var(--tilavaraus-hero-background-color)"
        to="var(--tilavaraus-gray)"
      />
      <Content>
        {activeApplicationRounds?.length > 0 && (
          <RoundList>
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
        )}
        {pendingApplicationRounds?.length > 0 && (
          <RoundList>
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
        {applicationRounds?.length < 1 && (
          <RoundList>{t("recurringLander:noRounds")}</RoundList>
        )}
        <StyledImageWithCard
          cardAlignment="right"
          cardLayout="hover"
          color="secondary"
          src="images/guide-recurring2.jpg"
        >
          <InfoContainer data-test-id="search-guide__recurring">
            <div>
              <CardHeading>{t("home:infoRecurring.heading")}</CardHeading>
              <p>{t("home:infoRecurring.text")}</p>
            </div>
            <ButtonContainer>
              <MediumButton
                id="browseRecurringReservationUnits"
                onClick={() => router.push(searchPrefix)}
                variant="secondary"
                iconLeft={<IconSearch />}
              >
                {t("recurringLander:browseAll")}
              </MediumButton>
            </ButtonContainer>
          </InfoContainer>
        </StyledImageWithCard>
      </Content>
    </Wrapper>
  );
};

export default RecurringLander;
