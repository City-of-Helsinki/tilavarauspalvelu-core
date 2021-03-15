import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import styled from "styled-components";
import { Button, IconCheckCircle, Notification } from "hds-react";
import { useHistory } from "react-router-dom";
import { getApplicationRound } from "../../common/api";
import Loader from "../Loader";
import { ApplicationRound as ApplicationRoundType } from "../../common/types";
import { IngressContainer, NarrowContainer } from "../../styles/layout";
import { breakpoints } from "../../styles/util";
import Heading from "../Applications/Heading";
import StatusRecommendation from "../Applications/StatusRecommendation";
import withMainMenu from "../withMainMenu";
import ApplicationRoundNavi from "./ApplicationRoundNavi";
import TimeframeStatus from "./TimeframeStatus";
import { ContentHeading, H3 } from "../../styles/typography";
import DataTable, { CellConfig } from "../DataTable";
import Dialog from "../Dialog";
import { formatNumber } from "../../common/util";
import BigRadio from "../BigRadio";

interface IProps {
  applicationRoundId: string;
}

const Wrapper = styled.div`
  width: 100%;
`;

const TopIngress = styled.div`
  & > div:last-of-type {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-top: var(--spacing-l);

    ${H3} {
      margin-left: var(--spacing-m);
      width: 50px;
      line-height: var(--lineheight-l);
    }
  }

  display: grid;

  ${ContentHeading} {
    width: 100%;
    padding: 0;
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1.8fr 1fr;
    grid-gap: var(--spacing-layout-m);
  }
`;

const StyledNotification = styled(Notification)`
  margin-top: var(--spacing-l);
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

const Recommendation = styled.div`
  margin: var(--spacing-m) 0;
`;

const RecommendationLabel = styled.label`
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: 1.375rem;
  font-weight: bold;
`;

const RecommendationValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: var(--spacing-3-xs);
`;

const ActionContainer = styled.div`
  button {
    margin-top: var(--spacing-s);
  }

  display: flex;
  justify-content: space-between;
  flex-direction: column-reverse;

  @media (min-width: ${breakpoints.l}) {
    flex-direction: row;
  }
`;

const IngressFooter = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  margin-bottom: var(--spacing-m);
  padding-top: var(--spacing-l);
  grid-gap: var(--spacing-m);

  .label {
    font-size: var(--fontsize-body-s);
    margin: var(--spacing-3-xs) 0 0 0;
    color: var(--color-black-70);
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;

    & > div:last-of-type {
      text-align: right;
    }
  }
`;

const ScheduleCount = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: bold;
  font-size: 1.375rem;
`;

const getCellConfig = (t: TFunction): CellConfig => {
  console.log(t); // eslint-disable-line
  return {
    cols: [
      { title: "Application.headings.customer", key: "organisation.name" },
      {
        title: "Application.headings.participants",
        key: "organisation.activeMembers",
      },
      {
        title: "Application.headings.applicantType",
        key: "applicantType",
      },
      {
        title: "Application.headings.resolution",
        key: "aggregatedData.reservationsTotal",
      },
    ],
    index: "id",
    sorting: "organisation.name",
    order: "asc",
    rowLink: (id) => `/application/${id}`,
  };
};

function Approval({ applicationRoundId }: IProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [
    isConfirmationDialogVisible,
    setConfirmationDialogVisibility,
  ] = useState<boolean>(false);
  const [hasBeenSentForApproval, setHasBeenSentForApproval] = useState<boolean>(
    false
  );
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const history = useHistory();

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: applicationRoundId,
        });
        setApplicationRound(result);
        setCellConfig(getCellConfig(t));
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
  }, [applicationRoundId, t]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <Heading />
      {applicationRound && (
        <>
          <IngressContainer>
            <ApplicationRoundNavi applicationRoundId={applicationRoundId} />
            <TopIngress>
              <div>
                <ContentHeading>{applicationRound.name}</ContentHeading>
                <TimeframeStatus
                  applicationPeriodBegin={
                    applicationRound.applicationPeriodBegin
                  }
                  applicationPeriodEnd={applicationRound.applicationPeriodEnd}
                />
              </div>
              <div />
            </TopIngress>
          </IngressContainer>
          <NarrowContainer style={{ marginBottom: "var(--spacing-4-xl)" }}>
            {hasBeenSentForApproval && (
              <StyledNotification
                type="success"
                label=""
                dismissible
                closeButtonLabelText={`${t("common.close")}`}
              >
                <H3>
                  <IconCheckCircle size="m" />{" "}
                  {t("ApplicationRound.sentForApprovalNotificationHeader")}
                </H3>
                <p>{t("ApplicationRound.sentForApprovalNotificationBody")}</p>
              </StyledNotification>
            )}
            <Recommendation>
              <RecommendationLabel>
                {t("Application.recommendedStage")}:
              </RecommendationLabel>
              <RecommendationValue>
                <StatusRecommendation
                  status={
                    hasBeenSentForApproval ? "approval" : "approvalPreparation"
                  }
                />
              </RecommendationValue>
            </Recommendation>
            {!hasBeenSentForApproval && (
              <ActionContainer>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    history.push(
                      `/applicationRound/${applicationRoundId}?allocated`
                    )
                  }
                >
                  {t("ApplicationRound.navigateBackToHandling")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  onClick={() => setConfirmationDialogVisibility(true)}
                >
                  {t("ApplicationRound.sendForApproval")}
                </Button>
              </ActionContainer>
            )}
          </NarrowContainer>
          <IngressContainer>
            <IngressFooter>
              <div>
                <ScheduleCount>{`${formatNumber(
                  1234,
                  t("common.volumeUnit")
                )} / ${formatNumber(5678, t("common.hoursUnit"))}
                `}</ScheduleCount>
                <p className="label">
                  {t("ApplicationRound.schedulesToBeGranted")}
                </p>
              </div>
              <div>
                <BigRadio
                  buttons={[
                    {
                      key: "orphans",
                      text: "ApplicationRound.orphanApplications",
                    },
                    {
                      key: "handled",
                      text: "ApplicationRound.handledApplications",
                    },
                  ]}
                />
              </div>
            </IngressFooter>
          </IngressContainer>
          {cellConfig && (
            <DataTable
              groups={[]}
              hasGrouping={false}
              config={{
                filtering: true,
                rowFilters: true,
                hideHandled: false,
                selection: false,
              }}
              cellConfig={cellConfig}
              filterConfig={[]}
            />
          )}
        </>
      )}
      {isConfirmationDialogVisible && (
        <Dialog
          closeDialog={() => setConfirmationDialogVisibility(false)}
          style={
            { "--padding": "var(--spacing-layout-s)" } as React.CSSProperties
          }
        >
          <H3>{t("ApplicationRound.sentForApprovalDialogHeader")}</H3>
          <p>{t("ApplicationRound.sentForApprovalDialogBody")}</p>
          <ActionContainer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmationDialogVisibility(false)}
            >
              {t("Navigation.goBack")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              onClick={() => {
                setHasBeenSentForApproval(true);
                setConfirmationDialogVisibility(false);
              }}
            >
              {t("ApplicationRound.deliverAction")}
            </Button>
          </ActionContainer>
        </Dialog>
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

export default withMainMenu(Approval);
