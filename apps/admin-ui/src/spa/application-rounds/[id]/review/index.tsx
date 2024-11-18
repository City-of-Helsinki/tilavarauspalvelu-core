import React, { useEffect, useState } from "react";
import { Button, Notification, Tabs } from "hds-react";
import { uniqBy } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link, useSearchParams } from "react-router-dom";
import { type Maybe } from "graphql/jsutils/Maybe";
import { H1 } from "common/src/common/typography";
import { filterNonNullable } from "common/src/helpers";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import {
  ApplicationRoundStatusChoice,
  type ApplicationRoundAdminFragment,
  useEndAllocationMutation,
  ApplicationRoundReservationCreationStatusChoice,
  type ApplicationRoundQuery,
  UserPermissionChoice,
  useSendResultsMutation,
} from "@gql/gql-types";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { ApplicationRoundStatusLabel } from "../../ApplicationRoundStatusLabel";
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
import RejectedOccurrencesDataLoader from "./RejectedOccurrencesDataLoader";
import { errorToast } from "common/src/common/toast";
import { hasPermission } from "@/modules/permissionHelper";
import { useSession } from "@/hooks/auth";
import { Flex, TabWrapper, TitleSection } from "common/styles/util";

const TabContent = styled.div`
  display: grid;
  gap: var(--spacing-m);
  margin-top: var(--spacing-s);
  line-height: 1;
`;

const StyledNotification = styled(Notification)`
  margin-right: auto;
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

export const SEND_RESULTS_MUTATION = gql`
  mutation SendResults($pk: Int!) {
    setApplicationRoundResultsSent(input: { pk: $pk }) {
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
  const [sendResults] = useSendResultsMutation();

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

  const handleSendResults = async () => {
    try {
      await sendResults({
        variables: { pk: applicationRound.pk ?? 0 },
      });
    } catch (err) {
      errorToast({ text: t("errors.errorSendingResults") });
    }
    refetch();
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
  const ds = getUnitOptions(resUnits).filter(
    (unit) =>
      hasPermission(user, UserPermissionChoice.CanViewApplications, unit.pk) ||
      hasPermission(user, UserPermissionChoice.CanManageApplications, unit.pk)
  );
  const unitOptions = uniqBy(ds, (unit) => unit.pk).sort((a, b) =>
    a.nameFi.localeCompare(b.nameFi)
  );

  // user has no accesss to specific unit through URL with search params -> remove it from URL
  useEffect(() => {
    const unitParam = searchParams.getAll("unit");
    if (unitParam.length > 0) {
      const filteredUnits = unitParam.filter((u) =>
        unitOptions.some((unit) => unit.pk === Number(u))
      );
      if (filteredUnits.length !== unitParam.length) {
        const p = new URLSearchParams(searchParams);
        p.delete("unit");
        for (const u of filteredUnits) {
          p.append("unit", u);
        }
        setParams(p, { replace: true });
      }
    }
  }, [unitOptions, searchParams, setParams]);

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
  const isResultsSent =
    applicationRound.status === ApplicationRoundStatusChoice.ResultsSent;
  const hideAllocation = isHandled || isResultsSent;

  const isEndingAllowed = applicationRound.isSettingHandledAllowed;

  const activeTabIndex =
    selectedTab === "events" ? 1 : selectedTab === "allocated" ? 2 : 0;

  const reservationUnitOptions = filterNonNullable(
    resUnits.map((x) => toOption(x))
  );

  return (
    <>
      <TitleSection>
        <div>
          <H1 $noMargin>{applicationRound.nameFi}</H1>
          <Flex $justifyContent="flex-start" $direction="row" $marginTop="xs">
            <TimeframeStatus
              applicationPeriodBegin={applicationRound.applicationPeriodBegin}
              applicationPeriodEnd={applicationRound.applicationPeriodEnd}
            />
            <Link to="criteria">{t("ApplicationRound.roundCriteria")}</Link>
          </Flex>
        </div>
        <ApplicationRoundStatusLabel status={applicationRound.status} />
      </TitleSection>
      {/* NOTE this check blocks users that don't have permissions to end the allocation
       * so for them it's always showing the allocation tool
       */}
      <Flex
        $justifyContent="space-between"
        $direction="row-reverse"
        $alignItems="center"
      >
        {isEndingAllowed || isHandled ? (
          <EndAllocation
            applicationRound={applicationRound}
            refetch={refetch}
          />
        ) : null}
        {!hideAllocation && (
          <>
            {isAllocationEnabled ? (
              <ButtonLikeLink to="allocation" variant="primary" size="large">
                {t("ApplicationRound.allocate")}
              </ButtonLikeLink>
            ) : (
              <Button variant="primary" disabled>
                {t("ApplicationRound.allocate")}
              </Button>
            )}
          </>
        )}
      </Flex>
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
    </>
  );
}
