import React, { useState } from "react";
import { ApolloError, useQuery } from "@apollo/client";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { H1, H2 } from "common/src/common/typography";
import {
  ApplicationRoundStatus,
  ApplicationRoundType,
  Query,
  QueryApplicationRoundsArgs,
} from "common/types/gql-types";
import KorosHeading, { Heading as KorosKorosHeading } from "../KorosHeading";
import { MainMenuWrapper } from "../withMainMenu";
import ApplicationRoundCard from "./ApplicationRoundCard";
import HeroImage from "../../images/hero-user@1x.jpg";
import { WideContainer, IngressContainer } from "../../styles/layout";
import Loader from "../Loader";
import { NotificationBox } from "../../styles/util";
import { useNotification } from "../../context/NotificationContext";
import { useAuthState } from "../../context/AuthStateContext";
import { APPLICATION_ROUNDS_QUERY } from "./queries";

const Wrapper = styled.div``;

const Ingress = styled(H2).attrs({ $legacy: true })`
  max-width: 44rem;
  margin: var(--spacing-3-xl) auto var(--spacing-2-xl);
  padding: 0 var(--spacing-xl);
  text-align: center;
  line-height: 1.8125rem;
`;

const Heading = styled(H1).attrs({ $legacy: true })`
  margin-bottom: var(--spacing-s);
`;

const RoundTypeIngress = styled.p`
  margin-bottom: var(--spacing-m);
`;

const Deck = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

const ApplicationRoundsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-l);
`;

function ApplicationRounds(): JSX.Element {
  const { t } = useTranslation();
  const { notifyError } = useNotification();
  const { authState } = useAuthState();
  const [applicationRounds, setApplicationRounds] = useState<
    ApplicationRoundType[]
  >([]);
  // TODO autoload 2000 elements by default (same as in ReservationUnitFilter) or provide pagination
  // TODO include the filter (below) into the query (state); requires backend changes
  const { loading } = useQuery<Query, QueryApplicationRoundsArgs>(
    APPLICATION_ROUNDS_QUERY,
    {
      skip: authState.state !== "HasPermissions",
      onCompleted: (data) => {
        const result = (data?.applicationRounds?.edges || []).map(
          (ar) => ar?.node as ApplicationRoundType
        );
        setApplicationRounds(result);
      },
      onError: (err: ApolloError) => {
        notifyError(err.message);
      },
    }
  );

  if (loading) {
    return <Loader />;
  }

  const handleRounds = applicationRounds?.filter((applicationRound) =>
    ["draft", "in_review", "review_done", "allocated", "handled"].includes(
      applicationRound.status as ApplicationRoundStatus
    )
  );

  let headingStr = t("User.welcome");
  const name = authState.user?.firstName;
  if (name) {
    headingStr += `, ${name}`;
  }

  return (
    <MainMenuWrapper>
      <Wrapper>
        <KorosHeading heroImage={HeroImage}>
          <KorosKorosHeading>{headingStr}!</KorosKorosHeading>
        </KorosHeading>
        <Ingress>{t("MainLander.ingress")}</Ingress>
        {handleRounds && (
          <Deck>
            <IngressContainer>
              <Heading>{t("ApplicationRound.listHandlingTitle")}</Heading>
              <RoundTypeIngress>
                {t(
                  `ApplicationRound.listHandlingIngress${
                    handleRounds.length === 0 ? "Empty" : ""
                  }`,
                  {
                    count: handleRounds.length,
                  }
                )}
              </RoundTypeIngress>
            </IngressContainer>
            <WideContainer>
              <ApplicationRoundsContainer>
                {handleRounds.length > 0 ? (
                  handleRounds.map((applicationRound) => (
                    <ApplicationRoundCard
                      applicationRound={applicationRound}
                      key={applicationRound.pk}
                    />
                  ))
                ) : (
                  <NotificationBox>
                    {t("ApplicationRound.listHandlingPlaceholder")}
                  </NotificationBox>
                )}
              </ApplicationRoundsContainer>
            </WideContainer>
          </Deck>
        )}
      </Wrapper>
    </MainMenuWrapper>
  );
}

export default ApplicationRounds;
