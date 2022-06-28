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
  rejectApplicationEventSchedule,
  setApplicationEventScheduleResultStatus,
  setDeclinedApplicationEventReservationUnits,
} from "../../common/api";
import {
  AllocationResult,
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
} from "../../common/types";
import { formatNumber, parseAgeGroups, parseDuration } from "../../common/util";
import { processAllocationResult } from "../../common/AllocationResult";
import { IngressContainer, NarrowContainer } from "../../styles/layout";
import { H1, H2, H3 } from "../../styles/typography";
import { BasicLink, breakpoints, Divider } from "../../styles/util";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import ApplicantBox from "./ApplicantBox";
import RecommendedSlot from "./RecommendedSlot";
import ApplicationEventStatusBlock from "../applications/ApplicationEventStatusBlock";
import Dialog from "../Dialog";
import { applicationRoundUrl } from "../../common/urls";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { applicantName } from "../applications/util";
import { useNotification } from "../../context/NotificationContext";

interface IRouteParams {
  applicationRoundId: string;
  applicationEventScheduleId: string;
}

type NotificationStatus =
  | "accepted"
  | "revertedToUnhandled"
  | "declined"
  | "ignored";

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
  margin-top: var(--spacing-l);

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
    width: 100%;

    svg {
      min-width: 24px;
    }
  }

  display: flex;
  justify-content: space-between;
  flex-direction: column-reverse;
  margin-top: var(--spacing-layout-xl);

  @media (min-width: ${breakpoints.l}) {
    button {
      width: auto;
    }

    flex-direction: row;
  }
`;

const DialogActionContainer = styled(ActionContainer)`
  button {
    margin-top: var(--spacing-s);
  }
`;

function Recommendation(): JSX.Element {
  const { notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recommendation, setRecommendation] = useState<AllocationResult | null>(
    null
  );
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [applicationRound, setApplicationRound] =
    useState<ApplicationRoundType | null>(null);
  const [actionNotification, setActionNotification] =
    useState<NotificationStatus | null>(null);
  const [isRevertRejectionDialogVisible, setIsRevertRejectionDialogVisible] =
    useState<boolean>(false);
  const [
    isIgnoreReservationUnitDialogVisible,
    setIsIgnoreReservationUnitDialogVisible,
  ] = useState<boolean>(false);

  const { t } = useTranslation();
  const history = useHistory();

  const { applicationRoundId, applicationEventScheduleId } =
    useParams<IRouteParams>();

  const fetchRecommendation = async (aesId: number, appRoundId: number) => {
    try {
      const applicationRoundResult = await getApplicationRound({
        id: appRoundId,
      });

      const recommendationResult = await getAllocationResult({
        id: aesId,
        serviceSectorId: applicationRoundResult.serviceSectorId,
      });

      setRecommendation(processAllocationResult([recommendationResult])[0]);
      setApplicationRound(applicationRoundResult);
    } catch (error) {
      notifyError(t("errors.errorFetchingApplication"));
      setIsLoading(false);
    }
  };

  const toggleAcceptance = async (id: number, accepted: boolean) => {
    try {
      setIsSaving(true);
      setActionNotification(null);
      await setApplicationEventScheduleResultStatus(id, accepted);
      setActionNotification(accepted ? "accepted" : "revertedToUnhandled");
    } catch (error) {
      notifyError(t("errors.errorSavingRecommendation"));
    } finally {
      fetchRecommendation(id, Number(applicationRoundId));
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const rejectRecommendation = async (
    applicationEventScheduleResultId: number
  ) => {
    try {
      setIsSaving(true);
      setActionNotification(null);
      await rejectApplicationEventSchedule(applicationEventScheduleResultId);
      setActionNotification("declined");
    } catch (error) {
      notifyError(t("errors.errorSavingRecommendation"));
    } finally {
      fetchRecommendation(
        applicationEventScheduleResultId,
        Number(applicationRoundId)
      );
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const revertRejection = async (id: number) => {
    try {
      setIsSaving(true);
      setActionNotification(null);
      await deleteAllocationResult(id);
    } catch (error) {
      notifyError(t("errors.errorSavingRecommendation"));
    } finally {
      history.push(applicationRoundUrl(applicationRoundId));
    }
  };

  const ignoreReservationUnit = async (
    rec: AllocationResult,
    ar: ApplicationRoundType,
    revert = false
  ) => {
    try {
      setIsSaving(true);

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
        history.push(applicationRoundUrl(applicationRoundId));
      }

      setActionNotification(revert ? null : "ignored");

      const recommendationResult = await getAllocationResult({
        id: rec.applicationEventScheduleId,
        serviceSectorId: ar.serviceSectorId,
      });

      setRecommendation(processAllocationResult([recommendationResult])[0]);
    } catch (error) {
      notifyError(t("errors.errorSavingData"));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchRecommendation(
      Number(applicationEventScheduleId),
      Number(applicationRoundId)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationRoundId, applicationEventScheduleId]);

  useEffect(() => {
    const fetchApplication = async (aId: number) => {
      try {
        const applicationResult = await getApplication(aId);

        setApplication(applicationResult);
      } catch (error) {
        notifyError(t("errors.errorFetchingApplication"));
      } finally {
        setIsLoading(false);
      }
    };

    if (recommendation?.applicationId) {
      fetchApplication(recommendation.applicationId);
    }
  }, [notifyError, recommendation, t]);

  if (isLoading) {
    return <Loader />;
  }

  const reservationUnitRank =
    recommendation?.applicationEvent?.eventReservationUnits?.find(
      (n) => n.reservationUnitId === recommendation.allocatedReservationUnitId
    )?.priority;

  let mode = "";
  let actionButtons: ReactNode;
  let actionHelper = "";

  if (
    applicationRound &&
    ["handled", "validated", "approved"].includes(applicationRound.status)
  ) {
    mode = "disabled";
  } else if (
    recommendation?.allocatedReservationUnitId &&
    recommendation?.applicationEvent.declinedReservationUnitIds.includes(
      recommendation.allocatedReservationUnitId
    )
  ) {
    mode = "reservationUnitIgnored";
  } else if (recommendation?.accepted) {
    mode = "isApproved";
  } else if (recommendation?.declined) {
    mode = "isDeclined";
  }

  switch (mode) {
    case "isApproved":
      actionButtons = (
        <Button
          variant="secondary"
          iconLeft={<IconArrowUndo />}
          onClick={() => {
            if (recommendation?.applicationEventScheduleId) {
              toggleAcceptance(
                recommendation.applicationEventScheduleId,
                false
              );
            }
          }}
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
          onClick={() => setIsRevertRejectionDialogVisible(true)}
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
          onClick={() => setIsIgnoreReservationUnitDialogVisible(true)}
          disabled={isSaving}
        >
          {t("Recommendation.actionRevertIgnoreReservationUnit")}
        </Button>
      );
      actionHelper = t(
        "Recommendation.actionRevertIgnoreReservationUnitHelper"
      );
      break;
    case "disabled":
      actionButtons = null;
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
                rejectRecommendation(recommendation.applicationEventScheduleId)
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
              onClick={() => {
                if (recommendation?.applicationEventScheduleId) {
                  toggleAcceptance(
                    recommendation.applicationEventScheduleId,
                    true
                  );
                }
              }}
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
      <BreadcrumbWrapper
        route={[
          "recurring-reservations",
          "/recurring-reservations/application-rounds",
          `/recurring-reservations/application-rounds/${applicationRound?.id}`,
          `/application/${application?.id}/details`,
          "recommendation",
        ]}
        aliases={[
          { slug: "application-round", title: applicationRound?.name },
          { slug: `${applicationRound?.id}`, title: applicationRound?.name },
          {
            slug: "details",
            title: applicantName(application as ApplicationType),
          },
        ]}
      />
      {application && recommendation && (
        <>
          <IngressContainer>
            <Top>
              <div>
                <LinkToOthers
                  to={`${applicationRoundUrl(applicationRoundId)}/applicant/${
                    recommendation.applicantId
                  }`}
                >
                  {t("Recommendation.linkToOtherRecommendations")}
                </LinkToOthers>
                <Heading>{recommendation.applicationEvent.name}</Heading>
                <div>{applicationRound?.name}</div>
                <StyledApplicationEventStatusBlock
                  status={recommendation.applicationEvent.status}
                  accepted={recommendation.accepted}
                />
              </div>
              <div>
                {application && <ApplicantBox application={application} />}
              </div>
            </Top>
          </IngressContainer>
          <NarrowContainer>
            {actionNotification === "accepted" && (
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
            {actionNotification === "revertedToUnhandled" && (
              <StyledNotification
                type="info"
                dismissible
                onClose={() => setActionNotification(null)}
                closeButtonLabelText={`${t("common.close")}`}
                label={t("Recommendation.revertToUnhandledSuccessHeading")}
              >
                <H3>
                  <IconInfoCircle size="s" />{" "}
                  {t("Recommendation.revertToUnhandledSuccessHeading")}
                </H3>
                <div>{t("Recommendation.revertToUnhandledSuccessBody")}</div>
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
                {recommendation.basketName
                  ? trim(
                      `${recommendation.basketOrderNumber}. ${recommendation.basketName}`,
                      ". "
                    )
                  : "-"}
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
                      recommendation.aggregatedData?.reservationsTotal,
                      t("common.volumeUnit")
                    )} / ${parseDuration(
                      recommendation.aggregatedData?.durationTotal
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
                <RecommendedSlot
                  key={recommendation.applicationEventScheduleId}
                  id={recommendation.applicationEventScheduleId}
                  start={recommendation.applicationEvent.begin}
                  end={recommendation.applicationEvent.end}
                  weekday={recommendation.allocatedDay}
                  biweekly={recommendation.applicationEvent.biweekly}
                  timeStart={recommendation.allocatedBegin}
                  timeEnd={recommendation.allocatedEnd}
                  duration={recommendation.allocatedDuration}
                />
              </table>
            </Recommendations>
            <Divider />
            <ActionContainer>{actionButtons}</ActionContainer>
            <p style={{ lineHeight: "var(--lineheight-xl)" }}>{actionHelper}</p>
          </NarrowContainer>
        </>
      )}
      {isRevertRejectionDialogVisible && (
        <Dialog
          closeDialog={() => setIsRevertRejectionDialogVisible(false)}
          style={
            {
              "--padding": "var(--spacing-layout-s)",
            } as React.CSSProperties
          }
        >
          <H3>
            {t("Recommendation.confirmationRevertDeclineRecomendationHeader")}
          </H3>
          <p>
            {t("Recommendation.confirmationRevertDeclineRecomendationBody")}
          </p>
          <DialogActionContainer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRevertRejectionDialogVisible(false)}
            >
              {t("Navigation.goBack")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              onClick={() => {
                if (recommendation?.applicationEventScheduleId) {
                  revertRejection(recommendation.applicationEventScheduleId);
                  setIsRevertRejectionDialogVisible(false);
                }
              }}
            >
              {t("Recommendation.actionRevertRejectionAbrv")}
            </Button>
          </DialogActionContainer>
        </Dialog>
      )}
      {isIgnoreReservationUnitDialogVisible && (
        <Dialog
          closeDialog={() => setIsIgnoreReservationUnitDialogVisible(false)}
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
              onClick={() => setIsIgnoreReservationUnitDialogVisible(false)}
            >
              {t("Navigation.goBack")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              onClick={() => {
                if (recommendation && applicationRound) {
                  ignoreReservationUnit(recommendation, applicationRound, true);
                  setIsIgnoreReservationUnitDialogVisible(false);
                }
              }}
            >
              {t("Recommendation.actionRevertIgnoreReservationUnitAbrv")}
            </Button>
          </DialogActionContainer>
        </Dialog>
      )}
    </Wrapper>
  );
}

export default withMainMenu(Recommendation);
