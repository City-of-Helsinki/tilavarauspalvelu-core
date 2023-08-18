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
import { HERO_IMAGE_URL } from "app/common/const";
import usePermission from "app/hooks/usePermission";
import KorosHeading, { Heading as KorosKorosHeading } from "../KorosHeading";
import ApplicationRoundCard from "./ApplicationRoundCard";
import { WideContainer, IngressContainer } from "../../styles/layout";
import { NotificationBox } from "../../styles/util";
import { useNotification } from "../../context/NotificationContext";
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
  const [applicationRounds, setApplicationRounds] = useState<
    ApplicationRoundType[]
  >([]);

  const { user } = usePermission();

  // TODO autoload 2000 elements by default (same as in ReservationUnitFilter) or provide pagination
  // TODO include the filter (below) into the query (state); requires backend changes
  useQuery<Query, QueryApplicationRoundsArgs>(APPLICATION_ROUNDS_QUERY, {
    skip: user == null,
    onCompleted: (data) => {
      const result = (data?.applicationRounds?.edges || []).map(
        (ar) => ar?.node as ApplicationRoundType
      );
      setApplicationRounds(result);
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
  });

  const handleRounds = applicationRounds?.filter((applicationRound) =>
    ["draft", "in_review", "review_done", "allocated", "handled"].includes(
      applicationRound.status as ApplicationRoundStatus
    )
  );

  let headingStr = t("User.welcome");
  const name = user?.firstName;
  if (name) {
    headingStr += `, ${name}`;
  }

  return (
    <Wrapper>
      <KorosHeading heroImage={HERO_IMAGE_URL}>
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
  );
}

export default ApplicationRounds;
