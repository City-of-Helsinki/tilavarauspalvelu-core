import React, { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import trim from "lodash/trim";
import {
  Button,
  IconArrowRight,
  IconArrowUndo,
  IconCheckCircle,
  IconCrossCircle,
  IconFaceSmile,
  IconInfoCircle,
  Notification,
} from "hds-react";
import {
  deleteAllocationResult,
  getAllocationResult,
  getApplication,
  getApplicationRound,
  setApplicationEventStatuses,
  setDeclinedApplicationEventReservationUnits,
} from "../../common/api";
import {
  AllocationResult,
  Application as ApplicationType,
  ApplicationEventStatus,
  ApplicationRound as ApplicationRoundType,
} from "../../common/types";
import {
  formatNumber,
  parseAgeGroups,
  parseDuration,
  processAllocationResult,
} from "../../common/util";
import {
  ContentContainer,
  IngressContainer,
  NarrowContainer,
} from "../../styles/layout";
import { H1, H2, H3 } from "../../styles/typography";
import { BasicLink, breakpoints, Divider } from "../../styles/util";
import LinkPrev from "../LinkPrev";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import ApplicantBox from "./ApplicantBox";
import RecommendedSlot from "./RecommendedSlot";
import ApplicationEventStatusBlock from "../Application/ApplicationEventStatusBlock";
import Dialog from "../Dialog";

interface IRouteParams {
  applicationRoundId: string;
  applicationEventScheduleId: string;
}

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

const Top = styled.div`
  & > div {
    &:nth-of-type(even) {
      padding-right: var(--spacing-3-xl);
    }
  }

  display: grid;

  @media (min-width: ${breakpoints.l}) {
    & > div {
      &:nth-of-type(even) {
        max-width: 400px;
        justify-self: right;
      }
    }

    grid-template-columns: 1fr 1fr;
    grid-gap: var(--spacing-l);
  }
`;

const LinkToOthers = styled(BasicLink)`
  text-decoration: none;
  display: block;
  margin-bottom: var(--spacing-xs);
`;

const Heading = styled(H1)`
  margin-bottom: var(--spacing-3-xs);
`;

const StyledApplicationEventStatusBlock = styled(ApplicationEventStatusBlock)`
  margin-top: var(--spacing-xl);
`;

const StyledNotification = styled(Notification)`
  margin: var(--spacing-2-xl) 0 var(--spacing-3-xl);
  padding: var(--spacing-s) var(--spacing-l) var(--spacing-l);

  div[role="heading"] {
    display: none;
  }

  h3 {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
`;

const Subheading = styled(H2)`
  font-size: 2rem;
`;

const Props = styled.div`
  display: table;
  font-size: var(--fontsize-heading-xs);
  line-height: 2.6rem;
`;

const PropRow = styled.div`
  display: table-row;
`;

const Label = styled.div`
  display: table-cell;
  padding-right: var(--spacing-3-xl);
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: 700;
`;

const Value = styled.div`
  display: table-cell;
`;

const SpaceSubtext = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-black-70);
  font-size: var(--fontsize-body-m);
`;

const Recommendations = styled.div`
  overflow-x: auto;
`;

const ActionContainer = styled.div`
  button {
    margin: 0 var(--spacing-m) var(--spacing-xs) 0;
  }

  display: flex;
  justify-content: space-between;
  flex-direction: column-reverse;

  @media (min-width: ${breakpoints.l}) {
    flex-direction: row;
  }
`;

const DialogActionContainer = styled(ActionContainer)`
  button {
    margin-top: var(--spacing-s);
  }
`;

function Recommendation(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recommendation, setRecommendation] = useState<AllocationResult | null>(
    null
  );
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [actionNotification, setActionNotification] = useState<string | null>(
    null
  );
  const [
    isIgnoreReservationUnitDialogVisible,
    setIsIngoreReservationUnitDialogVisible,
  ] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const history = useHistory();

  const {
    applicationRoundId,
    applicationEventScheduleId,
  } = useParams<IRouteParams>();

  const modifyRecommendation = async (
    id: number,
    status: ApplicationEventStatus
  ) => {
    try {
      setIsSaving(true);
      setActionNotification(null);
      await setApplicationEventStatuses([
        {
          status,
          applicationEventId: id,
        },
      ]);
      setErrorMsg(null);
      setActionNotification(status);
    } catch (error) {
      setErrorMsg("errors.errorSavingApplication");
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const ignoreReservationUnit = async (
    rec: AllocationResult,
    ar: ApplicationRoundType,
    revert = false
  ) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);

      if (
        !ar ||
        !rec.applicationEventScheduleId ||
        !rec.allocatedReservationUnitId
      )
        return;

      const payload = revert
        ? rec.applicationEvent.declinedReservationUnitIds.filter(
            (n) => n !== rec.allocatedReservationUnitId
          )
        : [
            ...rec.applicationEvent.declinedReservationUnitIds,
            rec.allocatedReservationUnitId,
          ];

      await setDeclinedApplicationEventReservationUnits(
        rec.applicationEvent.id,
        payload
      );

      if (revert) {
        await deleteAllocationResult(rec.applicationEventScheduleId);
        history.push(`/applicationRound/${applicationRoundId}`);
      }

      setActionNotification(revert ? null : "ignored");

      const recommendationResult = await getAllocationResult({
        id: rec.applicationEventScheduleId,
        serviceSectorId: ar.serviceSectorId,
      });

      setRecommendation(processAllocationResult([recommendationResult])[0]);
    } catch (error) {
      setErrorMsg("errors.errorSavingData");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchRecommendation = async (aesId: number, appRoundId: number) => {
    try {
      const applicationRoundResult = await getApplicationRound({
        id: appRoundId,
      });

      const recommendationResult = await getAllocationResult({
        id: aesId,
        serviceSectorId: applicationRoundResult.serviceSectorId,
      });

      setRecommendation(recommendationResult);
      setApplicationRound(applicationRoundResult);
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplication");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation(
      Number(applicationEventScheduleId),
      Number(applicationRoundId)
    );
  }, [applicationRoundId, applicationEventScheduleId]);

  useEffect(() => {
    const fetchApplication = async (aId: number) => {
      try {
        const applicationResult = await getApplication(aId);

        setApplication(applicationResult);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplication");
      } finally {
        setIsLoading(false);
      }
    };

    if (recommendation?.applicationId) {
      fetchApplication(recommendation.applicationId);
    }
  }, [recommendation]);

  if (isLoading) {
    return <Loader />;
  }

  const schedule = recommendation?.applicationEvent.applicationEventSchedules.find(
    (n) => n.id === Number(applicationEventScheduleId)
  );

  const reservationUnitRank = recommendation?.applicationEvent?.eventReservationUnits?.find(
    (n) => n.reservationUnitId === recommendation.allocatedReservationUnitId
  )?.priority;

  let mode = "";
  let actionButtons: ReactNode;
  let actionHelper = "";

  if (
    recommendation?.allocatedReservationUnitId &&
    recommendation?.applicationEvent.declinedReservationUnitIds.includes(
      recommendation.allocatedReservationUnitId
    )
  ) {
    mode = "reservationUnitIgnored";
  }

  switch (mode) {
    case "isApproved":
      actionButtons = (
        <Button
          variant="secondary"
          iconLeft={<IconArrowUndo />}
          onClick={() => console.log("palauta kasittelemattomaksi")} // eslint-disable-line no-console
          disabled={isSaving}
        >
          {t("Recommendation.actionRevertToUnhandled")}
        </Button>
      );
      break;
    case "isDeclined":
      actionButtons = (
        <Button
          variant="secondary"
          iconLeft={<IconArrowUndo />}
          onClick={() => console.log("palauta osaksi kasittelya")} // eslint-disable-line no-console
          disabled={isSaving}
        >
          {t("Recommendation.actionReturnAsPartOfAllocation")}
        </Button>
      );
      actionHelper = t("Recommendation.actionReturnAsPartOfAllocationHelper");
      break;
    case "reservationUnitIgnored":
      actionButtons = (
        <Button
          variant="secondary"
          iconLeft={<IconArrowUndo />}
          onClick={() => setIsIngoreReservationUnitDialogVisible(true)}
          disabled={isSaving}
        >
          {t("Recommendation.actionRevertIgnoreReservationUnit")}
        </Button>
      );
      actionHelper = t(
        "Recommendation.actionRevertIgnoreReservationUnitHelper"
      );
      break;
    default:
      actionButtons = (
        <>
          <div>
            <Button
              variant="secondary"
              iconLeft={<IconCrossCircle />}
              onClick={() =>
                recommendation?.applicationEventScheduleId &&
                modifyRecommendation(
                  recommendation.applicationEventScheduleId,
                  "declined"
                )
              }
              disabled={isSaving}
            >
              {t("Recommendation.actionDecline")}
            </Button>
            <Button
              variant="secondary"
              iconLeft={<IconArrowRight />}
              onClick={() =>
                recommendation &&
                applicationRound &&
                ignoreReservationUnit(recommendation, applicationRound)
              }
              disabled={isSaving}
            >
              {t("Recommendation.actionIgnoreReservationUnit")}
            </Button>
          </div>
          <div>
            <Button
              variant="primary"
              iconLeft={<IconCheckCircle />}
              onClick={() =>
                recommendation?.applicationEventScheduleId &&
                modifyRecommendation(
                  recommendation.applicationEventScheduleId,
                  "validated"
                )
              }
              disabled={isSaving}
            >
              {t("Recommendation.actionApprove")}
            </Button>
          </div>
        </>
      );
      actionHelper = t("Recommendation.actionHelperText");
  }

  return (
    <Wrapper>
      <ContentContainer>
        <LinkPrev route={`/applicationRound/${applicationRoundId}`} />
      </ContentContainer>
      {application && recommendation && (
        <>
          <IngressContainer>
            <Top>
              <div>
                <LinkToOthers
                  to={`/applicationRound/${applicationRoundId}/applicant/${recommendation.applicantId}`}
                >
                  {t("Recommendation.linkToOtherRecommendations")}
                </LinkToOthers>
                <Heading>{recommendation.applicationEvent.name}</Heading>
                <div>{applicationRound?.name}</div>
                <StyledApplicationEventStatusBlock
                  status={recommendation.applicationEvent.status}
                />
              </div>
              <div>
                {application && <ApplicantBox application={application} />}
              </div>
            </Top>
          </IngressContainer>
          <NarrowContainer>
            {actionNotification === "validated" && (
              <StyledNotification
                type="success"
                dismissible
                onClose={() => setActionNotification(null)}
                closeButtonLabelText={`${t("common.close")}`}
                label={t("Recommendation.approveSuccessHeading")}
              >
                <H3>
                  <IconFaceSmile size="s" />{" "}
                  {t("Recommendation.approveSuccessHeading")}
                </H3>
                <div>{t("Recommendation.approveSuccessBody")}</div>
              </StyledNotification>
            )}
            {actionNotification === "declined" && (
              <StyledNotification
                type="info"
                dismissible
                onClose={() => setActionNotification(null)}
                closeButtonLabelText={`${t("common.close")}`}
                label={t("Recommendation.declineSuccessHeading")}
              >
                <H3>
                  <IconInfoCircle size="s" />{" "}
                  {t("Recommendation.declineSuccessHeading")}
                </H3>
                <div>{t("Recommendation.declineSuccessBody")}</div>
              </StyledNotification>
            )}
            {actionNotification === "ignored" && (
              <StyledNotification
                type="info"
                dismissible
                onClose={() => setActionNotification(null)}
                closeButtonLabelText={`${t("common.close")}`}
                label={t("Recommendation.banSuccessHeading")}
              >
                <H3>
                  <IconInfoCircle size="s" />{" "}
                  {t("Recommendation.banSuccessHeading")}
                </H3>
                <div>{t("Recommendation.banSuccessBody")}</div>
              </StyledNotification>
            )}
            <Subheading>{t("Recommendation.summary")}</Subheading>
            <Props>
              <PropRow>
                <Label>{t("ApplicationRound.basket")}</Label>
                {trim(
                  `${recommendation.basketOrderNumber}. ${recommendation.basketName}`,
                  ". "
                )}
              </PropRow>
              <PropRow>
                <Label>{t("Application.headings.purpose")}</Label>
                <Value>{recommendation.applicationEvent.purpose}</Value>
              </PropRow>
              <PropRow>
                <Label>{t("Recommendation.labelAgeGroup")}</Label>
                <Value>
                  {parseAgeGroups(
                    recommendation.applicationEvent.ageGroupDisplay
                  )}
                </Value>
              </PropRow>
              <PropRow>
                <Label>{t("Recommendation.labelAppliedReservations")}</Label>
                <Value>
                  {trim(
                    `${formatNumber(
                      recommendation.applicationAggregatedData
                        ?.reservationsTotal,
                      t("common.volumeUnit")
                    )} / ${parseDuration(
                      recommendation.applicationAggregatedData?.minDurationTotal
                    )}`,
                    " / "
                  )}
                </Value>
              </PropRow>
              <PropRow>
                <Label>{t("ApplicationRound.appliedReservationUnit")}</Label>
                <Value>
                  {trim(
                    `${recommendation.allocatedReservationUnitName}, ${recommendation.unitName}`,
                    ", "
                  )}
                  <SpaceSubtext>
                    <IconInfoCircle />
                    {t("Recommendation.labelReservationUnitRank", {
                      rank: (reservationUnitRank || 0) + 1,
                    })}
                  </SpaceSubtext>
                </Value>
              </PropRow>
              <PropRow>
                <Label>{t("ApplicationEvent.groupSize")}</Label>
                <Value>
                  {t("common.personUnit", {
                    count: recommendation.applicationEvent.numPersons || 0,
                  })}
                </Value>
              </PropRow>
            </Props>
            <Divider />
            <H2 as="h3">{t("Recommendation.recommendedSlot")}</H2>
            <Recommendations>
              <table>
                {schedule && (
                  <RecommendedSlot
                    key={schedule.id}
                    id={schedule.id}
                    start={recommendation.applicationEvent.begin}
                    end={recommendation.applicationEvent.end}
                    weekday={schedule.day}
                    biweekly={recommendation.applicationEvent.biweekly}
                    timeStart={schedule.begin}
                    timeEnd={schedule.end}
                  />
                )}
              </table>
            </Recommendations>
            <ActionContainer>{actionButtons}</ActionContainer>
            <p style={{ lineHeight: "var(--lineheight-xl)" }}>{actionHelper}</p>
          </NarrowContainer>
        </>
      )}
      {isIgnoreReservationUnitDialogVisible && (
        <Dialog
          closeDialog={() => setIsIngoreReservationUnitDialogVisible(false)}
          style={
            {
              "--padding": "var(--spacing-layout-s)",
            } as React.CSSProperties
          }
        >
          <H3>
            {t("Recommendation.confirmationRevertIgnoreReservationUnitHeader")}
          </H3>
          <p>
            {t("Recommendation.confirmationRevertIgnoreReservationUnitBody")}
          </p>
          <DialogActionContainer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsIngoreReservationUnitDialogVisible(false)}
            >
              {t("Navigation.goBack")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              onClick={() => {
                if (recommendation && applicationRound) {
                  ignoreReservationUnit(recommendation, applicationRound, true);
                  setIsIngoreReservationUnitDialogVisible(false);
                }
              }}
            >
              {t("Recommendation.actionRevertIgnoreReservationUnitAbrv")}
            </Button>
          </DialogActionContainer>
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

export default withMainMenu(Recommendation);
