import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { IconCheckCircle, IconInfoCircle, Notification } from "hds-react";
import queryString from "query-string";
import withMainMenu from "../withMainMenu";
import ApplicationRoundCard from "./ApplicationRoundCard";
import { H1, H3 } from "../../styles/typography";
import {
  WideContainer,
  IngressContainer,
  NarrowContainer,
} from "../../styles/layout";
import { ApplicationRound as ApplicationRoundType } from "../../common/types";
import { getApplicationRounds } from "../../common/api";
import Loader from "../Loader";
import { BasicLink, NotificationBox } from "../../styles/util";
import Heading from "./Heading";
import Accordion from "../Accordion";

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

const Title = styled(H1)`
  margin-top: var(--spacing-layout-xl);
  margin-bottom: var(--spacing-m);
`;

const Subtitle = styled.div`
  margin-bottom: var(--spacing-layout-l);
`;

const StyledNotification = styled(Notification)`
  margin-bottom: var(--spacing-layout-l);
  padding-left: var(--spacing-xl);

  h3 {
    display: flex;
    align-items: center;

    svg {
      margin-right: var(--spacing-2-xs);
    }
  }

  div[role="heading"] {
    display: none;
  }
`;

const CollectionIngress = styled(H3)`
  font-size: var(--fontsize-heading-s);
  margin-bottom: var(--spacing-m);
  margin-left: var(--spacing-m);
`;

const StyledAccordion = styled(Accordion)`
  & > div {
    margin: 0;
    padding: 0;
  }
  .heading {
    font-size: var(--fontsize-heading-s);
    margin-left: var(--spacing-m);
  }
`;

function ApplicationRoundApprovals(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [applicationRounds, setApplicationRounds] = useState<
    ApplicationRoundType[] | null
  >(null);
  const [isApplicationRoundApproved, setIsApplicationRoundApproved] =
    useState<boolean>(false);
  const [isApplicationRoundCancelled, setIsApplicationRoundCancelled] =
    useState<boolean>(false);
  const [approvedApplicationRoundId, setApprovedApplicationRoundId] = useState<
    number | null
  >(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getApplicationRounds();
        setApplicationRounds(result.filter((n) => n.isAdmin));
        setIsLoading(false);
      } catch (error) {
        const msg =
          (error as AxiosError).response?.status === 404
            ? "errors.applicationRoundNotFound"
            : "errors.errorFetchingData";
        setErrorMsg(msg);
        setIsLoading(false);
      }
    };

    fetchApplicationRound();
  }, []);

  useEffect(() => {
    const attrs = queryString.parse(window.location.search);
    if (attrs.applicationRoundId)
      setApprovedApplicationRoundId(Number(attrs.applicationRoundId));
    if (attrs.approved === null) setIsApplicationRoundApproved(true);
    if (attrs.cancelled === null) setIsApplicationRoundCancelled(true);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  const pendingResults = applicationRounds?.filter((n) =>
    ["validated"].includes(n.status)
  );
  const approvedResults = applicationRounds?.filter((n) =>
    ["approved"].includes(n.status)
  );

  const isAdmin = applicationRounds?.some((n) => n.isAdmin);

  return (
    <Wrapper>
      {applicationRounds && (
        <>
          <Heading hideAllRoundsLink />
          <IngressContainer>
            <Title>{t("ApplicationRound.approvalListTitle")}</Title>
            <Subtitle>
              {t(
                isAdmin
                  ? "ApplicationRound.approvalListSubtitle"
                  : "ApplicationRound.noApprovalRights"
              )}
            </Subtitle>
          </IngressContainer>
          {isAdmin && (
            <>
              <NarrowContainer>
                {isApplicationRoundApproved && (
                  <StyledNotification
                    type="success"
                    label=""
                    dismissible
                    closeButtonLabelText={`${t("common.close")}`}
                    onClose={() => setIsApplicationRoundApproved(false)}
                  >
                    <H3>
                      <IconCheckCircle size="m" />{" "}
                      {t("ApplicationRound.approvedNotificationHeader")}
                    </H3>
                    <p>
                      <BasicLink
                        to={`/applicationRound/${approvedApplicationRoundId}/applications`}
                        style={{ textDecoration: "underline" }}
                      >
                        {t("ApplicationRound.notificationResolutionDoneBody")}
                      </BasicLink>
                    </p>
                  </StyledNotification>
                )}
                {isApplicationRoundCancelled && (
                  <StyledNotification
                    label=""
                    dismissible
                    closeButtonLabelText={`${t("common.close")}`}
                    onClose={() => setIsApplicationRoundCancelled(false)}
                  >
                    <H3>
                      <IconInfoCircle size="m" />{" "}
                      {t(
                        "ApplicationRound.approvalCancelledNotificationHeader"
                      )}
                    </H3>
                    <p>
                      {t("ApplicationRound.approvalCancelledNotificationBody")}
                    </p>
                  </StyledNotification>
                )}
              </NarrowContainer>
              <WideContainer
                style={{ marginBottom: "var(--spacing-layout-l)" }}
              >
                <CollectionIngress>
                  {t("ApplicationRound.waitingForApproval")}
                </CollectionIngress>
                {pendingResults && pendingResults.length > 0 ? (
                  pendingResults.map((applicationRound) => (
                    <ApplicationRoundCard
                      applicationRound={applicationRound}
                      key={applicationRound.id}
                      getRoute={(id) => `/applicationRound/${id}/approval`}
                    />
                  ))
                ) : (
                  <NotificationBox>
                    {t("ApplicationRound.noPendingApprovals")}
                  </NotificationBox>
                )}
              </WideContainer>
              <WideContainer>
                <StyledAccordion
                  heading={t("ApplicationRound.approvalDoneListTitle")}
                >
                  {approvedResults && approvedResults.length > 0 ? (
                    approvedResults.map((applicationRound) => (
                      <ApplicationRoundCard
                        applicationRound={applicationRound}
                        key={applicationRound.id}
                        getRoute={(id) => `/applicationRound/${id}`}
                      />
                    ))
                  ) : (
                    <NotificationBox>
                      {t("ApplicationRound.noPendingDoneApprovals")}
                    </NotificationBox>
                  )}
                </StyledAccordion>
              </WideContainer>
            </>
          )}
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

export default withMainMenu(ApplicationRoundApprovals);
