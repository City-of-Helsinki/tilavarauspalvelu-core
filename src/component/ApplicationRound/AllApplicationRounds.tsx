import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Notification } from "hds-react";
import withMainMenu from "../withMainMenu";
import ApplicationRoundCard from "./ApplicationRoundCard";
import { H1, H3 } from "../../styles/typography";
import { WideContainer, IngressContainer } from "../../styles/layout";
import { ApplicationRound as ApplicationRoundType } from "../../common/types";
import { getApplicationRounds } from "../../common/api";
import Loader from "../Loader";
import { NotificationBox } from "../../styles/util";
import Heading from "./Heading";

const Wrapper = styled.div``;

const Subtitle = styled.div`
  margin-top: var(--spacing-layout-xl);
`;

const Title = styled(H1)`
  margin-top: var(--spacing-xs);
  margin-bottom: var(--spacing-2-xl);
`;

const RoundTypeIngress = styled(H3).attrs({ as: "div" })`
  font-size: var(--fontsize-heading-s);
  margin-bottom: var(--spacing-m);
`;

function AllApplicationRounds(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [applicationRounds, setApplicationRounds] = useState<
    ApplicationRoundType[] | null
  >(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();

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

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <Heading hideAllRoundsLink />
      {applicationRounds && (
        <>
          <IngressContainer>
            <Subtitle>{t("common.youthServices")}</Subtitle>
            <Title>
              {t("ApplicationRound.titleAllRecurringApplicationRounds")}
            </Title>
            <RoundTypeIngress>
              {`${applicationRounds.length} ${t("common.volumeUnit")}`}
            </RoundTypeIngress>
          </IngressContainer>
          <WideContainer style={{ marginBottom: "var(--spacing-layout-xl)" }}>
            {applicationRounds.length > 0 ? (
              applicationRounds.map((applicationRound) => {
                const getRoute = (id: number): string => {
                  if (
                    applicationRound.status === "validated" &&
                    applicationRound.isAdmin
                  ) {
                    return `/applicationRound/${id}/approval`;
                  }
                  return `/applicationRound/${id}`;
                };
                return (
                  <ApplicationRoundCard
                    applicationRound={applicationRound}
                    key={applicationRound.id}
                    getRoute={(id) => getRoute(id)}
                  />
                );
              })
            ) : (
              <NotificationBox>
                {t("ApplicationRound.listHandlingPlaceholder")}
              </NotificationBox>
            )}
          </WideContainer>
        </>
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

export default withMainMenu(AllApplicationRounds);
