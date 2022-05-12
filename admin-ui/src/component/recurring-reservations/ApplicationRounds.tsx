import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import KorosHeading, { Heading as KorosKorosHeading } from "../KorosHeading";
import { MainMenuWrapper } from "../withMainMenu";
import ApplicationRoundCard from "./ApplicationRoundCard";
import HeroImage from "../../images/hero-user@1x.jpg";
import { H1, H2 } from "../../styles/typography";
import { WideContainer, IngressContainer } from "../../styles/layout";
import { ApplicationRound as ApplicationRoundType } from "../../common/types";
import { getApplicationRounds } from "../../common/api";

import Loader from "../Loader";
import { NotificationBox } from "../../styles/util";
import { applicationRoundUrl, prefixes } from "../../common/urls";
import { useNotification } from "../../context/NotificationContext";
import { useAuthState } from "../../context/AuthStateContext";

const Wrapper = styled.div``;

const Ingress = styled(H2)`
  max-width: 44rem;
  margin: var(--spacing-3-xl) auto var(--spacing-2-xl);
  padding: 0 var(--spacing-xl);
  text-align: center;
  line-height: 1.8125rem;
`;

const Heading = styled(H1)`
  margin-bottom: var(--spacing-s);
`;

const RoundTypeIngress = styled.p`
  margin-bottom: var(--spacing-m);
`;

const Deck = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

function ApplicationRounds(): JSX.Element {
  const { authState } = useAuthState();
  const { notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [applicationRounds, setApplicationRounds] = useState<
    ApplicationRoundType[] | null
  >(null);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setIsLoading(true);

      try {
        const result = await getApplicationRounds();
        setApplicationRounds(result);
        setIsLoading(false);
      } catch (error) {
        const msg =
          (error as AxiosError).response?.status === 404
            ? "errors.applicationRoundNotFound"
            : "errors.errorFetchingData";
        notifyError(msg);
        setIsLoading(false);
      }
    };

    if (authState.state === "HasPermissions") {
      fetchApplicationRound();
    }
  }, [notifyError, authState]);

  const isWaitingForApproval = (
    applicationRound: ApplicationRoundType
  ): boolean =>
    applicationRound.isAdmin && applicationRound.status === "validated";

  const approveRounds = applicationRounds?.filter((applicationRound) =>
    isWaitingForApproval(applicationRound)
  );
  const handleRounds = applicationRounds?.filter((applicationRound) =>
    ["draft", "in_review", "review_done", "allocated", "handled"].includes(
      applicationRound.status
    )
  );

  if (isLoading) {
    return <Loader />;
  }

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
        {approveRounds && approveRounds.length > 0 && (
          <Deck>
            <IngressContainer>
              <Heading>{t("ApplicationRound.listApprovalTitle")}</Heading>
              <RoundTypeIngress>
                {t("ApplicationRound.listApprovalIngress", {
                  count: approveRounds.length,
                })}
              </RoundTypeIngress>
            </IngressContainer>
            <WideContainer>
              {approveRounds.map((applicationRound) => {
                return (
                  <ApplicationRoundCard
                    applicationRound={applicationRound}
                    key={applicationRound.id}
                    getRoute={(id) => {
                      return applicationRound.isAdmin
                        ? `${prefixes.recurringReservations}/decisions/${id}/approval`
                        : applicationRoundUrl(id);
                    }}
                  />
                );
              })}
            </WideContainer>
          </Deck>
        )}
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
              {handleRounds.length > 0 ? (
                handleRounds.map((applicationRound) => (
                  <ApplicationRoundCard
                    applicationRound={applicationRound}
                    key={applicationRound.id}
                    getRoute={applicationRoundUrl}
                  />
                ))
              ) : (
                <NotificationBox>
                  {t("ApplicationRound.listHandlingPlaceholder")}
                </NotificationBox>
              )}
            </WideContainer>
          </Deck>
        )}
      </Wrapper>
    </MainMenuWrapper>
  );
}

export default ApplicationRounds;
