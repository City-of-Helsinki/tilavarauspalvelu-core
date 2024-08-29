import React, { useState } from "react";
import { Button, Notification, Tabs } from "hds-react";
import { uniqBy } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link, useSearchParams } from "react-router-dom";
import { type Maybe } from "graphql/jsutils/Maybe";
import { H2 } from "common/src/common/typography";
import { filterNonNullable } from "common/src/helpers";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import {
  ApplicationRoundStatusChoice,
  type ApplicationRoundAdminFragment,
  useEndAllocationMutation,
  ApplicationRoundReservationCreationStatusChoice,
  type ApplicationRoundQuery,
  UserPermissionChoice,
} from "@gql/gql-types";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { Container, TabWrapper } from "@/styles/layout";
import { ApplicationRoundStatusTag } from "../../ApplicationRoundStatusTag";
import TimeframeStatus from "../../TimeframeStatus";
import { ApplicationDataLoader } from "./ApplicationDataLoader";
import { Filters } from "./Filters";
import { ApplicationEventDataLoader } from "./ApplicationEventDataLoader";
import { TimeSlotDataLoader } from "./AllocatedEventDataLoader";
import { ApolloQueryResult, gql } from "@apollo/client";
import {
  getPermissionErrors,
  getValidationErrors,
} from "common/src/apolloUtils";
import { useCheckPermission } from "@/hooks";
import { isApplicationRoundInProgress } from "@/helpers";
import { breakpoints } from "common";
import RejectedOccurrencesDataLoader from "./RejectedOccurrencesDataLoader";
import { errorToast } from "common/src/common/toast";
import { hasPermission } from "@/modules/permissionHelper";
import { useSession } from "@/hooks/auth";

const HeadingContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LinkContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: var(--spacing-m);
`;

const AllocationButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 1rem;
  justify-content: space-between;

  @media (min-width: ${breakpoints.s}) {
    flex-direction: row;
    align-items: center;
  }
`;

const AllocationButtonContainer = styled.div`
  flex-shrink: 0;
  margin-left: auto;
`;

const TabContent = styled.div`
  display: grid;
  gap: var(--spacing-m);
  margin-top: var(--spacing-s);
  line-height: 1;
`;

const StyledNotification = styled(Notification)`
  margin-bottom: var(--spacing-m);
  margin-top: var(--spacing-m);
  max-width: 852px;
`;

function getUnitOptions(
  resUnits: ApplicationRoundAdminFragment["reservationUnits"]
) {
  const opts = resUnits.map((x) => x?.unit).map((x) => toOption(x));
  return filterNonNullable(opts);
}

function toOption(
  resUnit: Maybe<{ nameFi?: string | null; pk?: number | null }>
) {
  if (resUnit?.pk == null || resUnit.nameFi == null) {
    return null;
  }
  const { nameFi, pk } = resUnit;
  return { nameFi, pk };
}

type ReviewProps = {
  applicationRound: ApplicationRoundAdminFragment;
  refetch: () => Promise<ApolloQueryResult<ApplicationRoundQuery>>;
};

export const END_ALLOCATION_MUTATION = gql`
  mutation EndAllocation($pk: Int!) {
    setApplicationRoundHandled(input: { pk: $pk }) {
      pk
    }
  }
`;

function EndAllocation({
  applicationRound,
  refetch,
}: ReviewProps): JSX.Element {
  const [waitingForHandle, setWaitingForHandle] = useState(false);

  const isInProgress = isApplicationRoundInProgress(applicationRound);

  const { t } = useTranslation();

  const [mutation] = useEndAllocationMutation();

  const handleEndAllocation = async () => {
    try {
      const res = await mutation({
        variables: { pk: applicationRound.pk ?? 0 },
      });
      if (res.data?.setApplicationRoundHandled?.pk) {
        setWaitingForHandle(false);
      }
    } catch (err) {
      const errors = getValidationErrors(err);
      if (getPermissionErrors(err).length > 0) {
        errorToast({ text: t("errors.noPermission") });
      } else if (errors.length > 0) {
        const unhandledCode = "APPLICATION_ROUND_HAS_UNHANDLED_APPLICATIONS";
        const notInAllocationCode = "APPLICATION_ROUND_NOT_IN_ALLOCATION";
        if (errors.some((e) => e.code === unhandledCode)) {
          errorToast({
            text: t("errors.errorEndingAllocationUnhandledApplications"),
          });
        } else if (errors.some((e) => e.code === notInAllocationCode)) {
          errorToast({
            text: t("errors.errorEndingAllocationNotInAllocation"),
          });
        } else {
          errorToast({ text: t("errors.errorEndingAllocation") });
        }
      } else {
        errorToast({ text: t("errors.errorEndingAllocation") });
      }
    }
    // refetch even on errors (if somebody else has ended the allocation)
    refetch();
  };

  const handleSendResults = () => {
    errorToast({ text: "TODO: not implemented handleSendResults" });
  };

  const hasFailed =
    applicationRound.reservationCreationStatus ===
    ApplicationRoundReservationCreationStatusChoice.Failed;

  const isHandled =
    applicationRound.status === ApplicationRoundStatusChoice.Handled;
  const isResultsSent =
    applicationRound.status === ApplicationRoundStatusChoice.ResultsSent;

  const showSendResults = isHandled && !isInProgress;
  // TODO futher work: (separate spec)
  // - what if results are sent? what should we show or not show?
  const modalTitle = showSendResults
    ? t("ApplicationRound.confirmation.sendResultsTitle")
    : t("ApplicationRound.confirmation.endAllocationTitle");
  const modalContent = showSendResults
    ? t("ApplicationRound.confirmation.sendResultsMessage")
    : t("ApplicationRound.confirmation.endAllocationMessage");
  const modalAcceptLabel = showSendResults
    ? t("ApplicationRound.confirmation.sendResultsAccept")
    : t("ApplicationRound.confirmation.endAllocationAccept");
  const moddalCancelLabel = t(
    "ApplicationRound.confirmation.endAllocationCancel"
  );

  // TODO add resultsSentBody
  // requires refoctoring this a bit so we don't do multiple ternaries
  const infoBody = showSendResults
    ? t("ApplicationRound.info.handledBody")
    : t("ApplicationRound.info.allocatedBody");
  const infoButton = hasFailed
    ? t("ApplicationRound.info.failedBtn")
    : showSendResults
      ? t("ApplicationRound.info.sendResultsBtn")
      : t("ApplicationRound.info.createBtn");

  const units = filterNonNullable(
    applicationRound.reservationUnits.flatMap((ru) => ru.unit?.pk)
  );
  const { hasPermission: canEndAllocation } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanManageApplications,
    requireAll: true,
  });

  return (
    <StyledNotification type={hasFailed ? "error" : "info"} label={infoBody}>
      <Button
        isLoading={isInProgress}
        loadingText={t("ApplicationRound.info.loadingText")}
        onClick={() => setWaitingForHandle(true)}
        disabled={hasFailed || isResultsSent || !canEndAllocation}
      >
        {infoButton}
      </Button>
      {waitingForHandle && (
        <ConfirmationDialog
          isOpen={waitingForHandle}
          onAccept={showSendResults ? handleSendResults : handleEndAllocation}
          onCancel={() => setWaitingForHandle(false)}
          heading={modalTitle}
          content={modalContent}
          acceptLabel={modalAcceptLabel}
          cancelLabel={moddalCancelLabel}
        />
      )}
    </StyledNotification>
  );
}

export function Review({
  applicationRound,
  refetch,
}: ReviewProps): JSX.Element {
  const { t } = useTranslation();

  const [searchParams, setParams] = useSearchParams();

  const selectedTab = searchParams.get("tab") ?? "applications";
  const handleTabChange = (tab: string) => {
    const vals = new URLSearchParams(searchParams);
    vals.set("tab", tab);
    setParams(vals, { replace: true });
  };

  const resUnits = filterNonNullable(
    applicationRound?.reservationUnits?.flatMap((x) => x)
  );

  const { user } = useSession();

  // need filtered list of units that the user has permission to view
  const ds = getUnitOptions(resUnits).filter((unit) =>
    hasPermission(user, UserPermissionChoice.CanViewApplications, unit.pk)
  );
  const unitOptions = uniqBy(ds, (unit) => unit.pk).sort((a, b) =>
    a.nameFi.localeCompare(b.nameFi)
  );

  const isAllocationEnabled =
    applicationRound.status === ApplicationRoundStatusChoice.InAllocation &&
    applicationRound.applicationsCount != null &&
    applicationRound.applicationsCount > 0;

  const isApplicationRoundEnded =
    applicationRound.status === ApplicationRoundStatusChoice.Handled ||
    applicationRound.status === ApplicationRoundStatusChoice.ResultsSent;

  // isHandled means that the reservations are created
  // isSettingHandledAllowed means that we are allowed to create the reservations
  // i.e. state.InAllocation -> isSettingHandledAllowed -> state.Handled -> state.ResultsSent
  const isHandled =
    applicationRound.status === ApplicationRoundStatusChoice.Handled;

  const isEndingAllowed = applicationRound.isSettingHandledAllowed;

  const activeTabIndex =
    selectedTab === "events" ? 1 : selectedTab === "allocated" ? 2 : 0;

  const reservationUnitOptions = filterNonNullable(
    resUnits.map((x) => toOption(x))
  );

  return (
    <Container>
      <>
        <HeadingContainer>
          <H2 as="h1" $legacy style={{ marginBottom: 0 }}>
            {applicationRound.nameFi}
          </H2>
          <ApplicationRoundStatusTag status={applicationRound.status} />
        </HeadingContainer>
        <LinkContainer>
          <TimeframeStatus
            applicationPeriodBegin={applicationRound.applicationPeriodBegin}
            applicationPeriodEnd={applicationRound.applicationPeriodEnd}
          />
          <Link to="criteria">{t("ApplicationRound.roundCriteria")}</Link>
        </LinkContainer>
        {/* NOTE this check blocks users that don't have permissions to end the allocation
         * so for them it's always showing the allocation tool
         */}
        <AllocationButtonsContainer>
          {isEndingAllowed || isHandled ? (
            <div>
              <EndAllocation
                applicationRound={applicationRound}
                refetch={refetch}
              />
            </div>
          ) : null}
          {!isHandled && (
            <AllocationButtonContainer>
              {isAllocationEnabled ? (
                <ButtonLikeLink to="allocation" variant="primary" size="large">
                  {t("ApplicationRound.allocate")}
                </ButtonLikeLink>
              ) : (
                <Button variant="primary" disabled>
                  {t("ApplicationRound.allocate")}
                </Button>
              )}
            </AllocationButtonContainer>
          )}
        </AllocationButtonsContainer>
      </>
      <TabWrapper>
        <Tabs initiallyActiveTab={activeTabIndex}>
          <Tabs.TabList>
            <Tabs.Tab onClick={() => handleTabChange("applications")}>
              {t("ApplicationRound.applications")}
            </Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("events")}>
              {t("ApplicationRound.appliedReservations")}
            </Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("allocated")}>
              {isApplicationRoundEnded
                ? t("ApplicationRound.madeReservations")
                : t("ApplicationRound.allocatedReservations")}
            </Tabs.Tab>
            {isApplicationRoundEnded && (
              <Tabs.Tab onClick={() => handleTabChange("rejected")}>
                {t("ApplicationRound.rejectedOccurrences")}
              </Tabs.Tab>
            )}
          </Tabs.TabList>
          <Tabs.TabPanel>
            <TabContent>
              <Filters units={unitOptions} enableApplicant />
              <ApplicationDataLoader
                applicationRoundPk={applicationRound.pk ?? 0}
              />
            </TabContent>
          </Tabs.TabPanel>
          <Tabs.TabPanel>
            <TabContent>
              <Filters
                units={unitOptions}
                statusOption="event"
                enableApplicant
              />
              <ApplicationEventDataLoader
                applicationRoundPk={applicationRound.pk ?? 0}
              />
            </TabContent>
          </Tabs.TabPanel>
          <Tabs.TabPanel>
            <TabContent>
              <Filters
                units={unitOptions}
                reservationUnits={reservationUnitOptions}
                enableApplicant
                enableWeekday
                enableReservationUnit
                statusOption="eventShort"
              />
              <TimeSlotDataLoader
                applicationRoundPk={applicationRound.pk ?? 0}
                unitOptions={unitOptions}
              />
            </TabContent>
          </Tabs.TabPanel>
          {isApplicationRoundEnded && (
            <Tabs.TabPanel>
              <TabContent>
                <Filters
                  units={unitOptions}
                  reservationUnits={reservationUnitOptions}
                  enableReservationUnit
                  statusOption="eventShort"
                />
                <RejectedOccurrencesDataLoader
                  applicationRoundPk={applicationRound.pk ?? 0}
                  unitOptions={unitOptions}
                />
              </TabContent>
            </Tabs.TabPanel>
          )}
        </Tabs>
      </TabWrapper>
    </Container>
  );
}
