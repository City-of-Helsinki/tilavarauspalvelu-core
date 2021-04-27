import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
// eslint-disable-next-line import/no-unresolved
import { useReactOidc } from "@axa-fr/react-oidc-context";
import { Notification } from "hds-react";
import KorosHeading from "../KorosHeading";
import withMainMenu from "../withMainMenu";
import ApplicationRoundCard from "./ApplicationRoundCard";
import HeroImage from "../../images/hero-user@1x.jpg";
import { H1, H2 } from "../../styles/typography";
import { WideContainer, IngressContainer } from "../../styles/layout";
import { ApplicationRound as ApplicationRoundType } from "../../common/types";
import { getApplicationRounds } from "../../common/api";
import Loader from "../Loader";
import { NotificationBox } from "../../styles/util";

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
  const [isLoading, setIsLoading] = useState(true);
  const [applicationRounds, setApplicationRounds] = useState<
    ApplicationRoundType[] | null
  >(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const { oidcUser } = useReactOidc();
  const profile = oidcUser ? oidcUser.profile : null;

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getApplicationRounds();
        setApplicationRounds(result);
        setIsLoading(false);
      } catch (error) {
        const msg =
          error.response?.status === 404
            ? "errors.applicationRoundNotFound"
            : "errors.errorFetchingData";
        setErrorMsg(msg);
        setIsLoading(false);
      }
    };

    fetchApplicationRound();
  }, []);

  const isWaitingForApproval = (
    applicationRound: ApplicationRoundType
  ): boolean =>
    applicationRound.isAdmin && applicationRound.status === "validated";

  const approveRounds = applicationRounds?.filter((applicationRound) =>
    isWaitingForApproval(applicationRound)
  );
  const handleRounds = applicationRounds?.filter((applicationRound) =>
    ["in_review", "review_done", "allocated", "handled"].includes(
      applicationRound.status
    )
  );

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <KorosHeading
        heading={t("User.welcomeUser", { firstName: profile?.given_name })}
        heroImage={HeroImage}
      />
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
                  getRoute={(id) =>
                    applicationRound.isAdmin
                      ? `/applicationRound/${id}/approval`
                      : `/applicationRound/${id}`
                  }
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
                  getRoute={(id) => `/applicationRound/${id}`}
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
      {errorMsg && (
        <Notification
          type="error"
          label={t("errors.functionFailed")}
          position="top-center"
          autoClose={false}
          dismissible
          closeButtonLabelText={t("common.close")}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
        >
          {t(errorMsg)}
        </Notification>
      )}
    </Wrapper>
  );
}

export default withMainMenu(ApplicationRounds);
