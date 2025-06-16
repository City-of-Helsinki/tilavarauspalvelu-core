import React, { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gql } from "@apollo/client";
import { errorToast } from "common/src/common/toast";
import { useCheckPermission } from "@/hooks";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { isApplicationRoundInProgress } from "@/helpers";
import { CenterSpinner, Flex, TabWrapper, TitleSection, H1 } from "common/styled";
import { Button, Tabs } from "hds-react";
import { uniqBy } from "lodash-es";
import styled from "styled-components";
import {
  type Maybe,
  ApplicationRoundStatusChoice,
  type ApplicationRoundAdminFragment,
  UserPermissionChoice,
  useApplicationRoundQuery,
  CurrentUserQuery,
} from "@gql/gql-types";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { ApplicationRoundStatusLabel } from "./../ApplicationRoundStatusLabel";
import TimeframeStatus from "./../TimeframeStatus";
import { ApplicationDataLoader } from "./review/ApplicationDataLoader";
import { Filters } from "./review/Filters";
import { ApplicationSectionDataLoader } from "./review/ApplicationSectionDataLoader";
import { TimeSlotDataLoader } from "./review/AllocatedSectionDataLoader";
import { RejectedOccurrencesDataLoader } from "./review/RejectedOccurrencesDataLoader";
import { hasPermission } from "@/modules/permissionHelper";
import { useSession } from "@/hooks/auth";
import { ReviewEndAllocation } from "./review/ReviewEndAllocation";

const TabContent = styled.div`
  display: grid;
  gap: var(--spacing-m);
  margin-top: var(--spacing-s);
  line-height: 1;
`;

function ApplicationRound({ pk }: { pk: number }): JSX.Element {
  const { t } = useTranslation();
  const [isInProgress, setIsInProgress] = useState(false);

  const id = base64encode(`ApplicationRoundNode:${pk}`);
  const isValid = pk > 0;

  const { data, loading, refetch } = useApplicationRoundQuery({
    skip: !isValid,
    variables: { id },
    pollInterval: isInProgress ? 10000 : 0,
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });
  const { applicationRound } = data ?? {};
  const units = filterNonNullable(applicationRound?.reservationUnits.map((x) => x.unit?.pk));
  const { canSeePage, isLoadingPermissions } = useReviewCheckPermissions({
    units,
  });

  const [searchParams, setParams] = useSearchParams();
  const { user } = useSession();

  // NOTE: useEffect works, onCompleted does not work with refetch
  useEffect(() => {
    if (data) {
      if (isApplicationRoundInProgress(data.applicationRound)) {
        setIsInProgress(true);
      } else {
        setIsInProgress(false);
      }
    }
  }, [data]);

  const unitOptions = getFilteredUnits(applicationRound, user);

  // user has no accesss to specific unit through URL with search params -> remove it from URL
  useEffect(() => {
    const unitParam = searchParams.getAll("unit");
    if (unitParam.length > 0) {
      const filteredUnits = unitParam.filter((u) => unitOptions.some((unit) => unit.pk === Number(u)));
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

  if (!canSeePage && !isLoadingPermissions) {
    return <div>{t("errors.noPermission")}</div>;
  } else if (isLoadingPermissions) {
    return <CenterSpinner />;
  } else if (loading) {
    return <CenterSpinner />;
  } else if (!applicationRound) {
    return <div>{t("errors.applicationRoundNotFound")}</div>;
  }

  const selectedTab = searchParams.get("tab") ?? "applications";
  const handleTabChange = (tab: string) => {
    const vals = new URLSearchParams(searchParams);
    vals.set("tab", tab);
    setParams(vals, { replace: true });
  };

  const isApplicationRoundEnded = hasApplicationRoundEnded(applicationRound);

  // isHandled means that the reservations are created
  // isSettingHandledAllowed means that we are allowed to create the reservations
  // i.e. state.InAllocation -> isSettingHandledAllowed -> state.Handled -> state.ResultsSent
  const isHandled = applicationRound.status === ApplicationRoundStatusChoice.Handled;
  const isResultsSent = applicationRound.status === ApplicationRoundStatusChoice.ResultsSent;
  const hideAllocation = isHandled || isResultsSent;

  const isEndingAllowed = applicationRound.isSettingHandledAllowed ?? false;

  const activeTabIndex = selectedTab === "events" ? 1 : selectedTab === "allocated" ? 2 : 0;

  const reservationUnitOptions = filterNonNullable(
    applicationRound.reservationUnits.flatMap((x) => x).map((x) => toOption(x))
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
      <Flex $justifyContent="space-between" $direction="row-reverse" $alignItems="center">
        {!hideAllocation &&
          (isAllocationEnabled(applicationRound) ? (
            <ButtonLikeLink to="allocation" variant="primary" size="large">
              {t("ApplicationRound.allocate")}
            </ButtonLikeLink>
          ) : (
            <Button disabled>{t("ApplicationRound.allocate")}</Button>
          ))}
        {isEndingAllowed || isHandled ? (
          <ReviewEndAllocation applicationRound={applicationRound} refetch={refetch} />
        ) : null}
      </Flex>
      <TabWrapper>
        <Tabs initiallyActiveTab={activeTabIndex}>
          <Tabs.TabList>
            <Tabs.Tab onClick={() => handleTabChange("applications")}>{t("ApplicationRound.applications")}</Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("events")}>{t("ApplicationRound.appliedReservations")}</Tabs.Tab>
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
              <ApplicationDataLoader applicationRoundPk={applicationRound.pk ?? 0} />
            </TabContent>
          </Tabs.TabPanel>
          <Tabs.TabPanel>
            <TabContent>
              <Filters units={unitOptions} statusOption="event" enableApplicant />
              <ApplicationSectionDataLoader applicationRoundPk={applicationRound.pk ?? 0} />
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
                enableAccessCodeState
                statusOption="eventShort"
              />
              <TimeSlotDataLoader applicationRoundPk={applicationRound.pk ?? 0} unitOptions={unitOptions} />
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

type IParams = {
  applicationRoundId: string;
};

function ApplicationRoundRouted(): JSX.Element | null {
  const { t } = useTranslation();
  const { applicationRoundId } = useParams<IParams>();

  const pk = Number(applicationRoundId);
  if (pk > 0) {
    return <ApplicationRound pk={pk} />;
  }

  return <div>{t("errors.router.invalidApplicationRoundNumber")}</div>;
}

function getUnitOptions(resUnits: ApplicationRoundAdminFragment["reservationUnits"]) {
  const opts = resUnits.map((x) => x?.unit).map((x) => toOption(x));
  return filterNonNullable(opts);
}

function toOption(resUnit: Maybe<{ nameFi?: string | null; pk?: number | null }>) {
  if (resUnit?.pk == null || resUnit.nameFi == null) {
    return null;
  }
  const { nameFi, pk } = resUnit;
  return { nameFi, pk };
}

function getFilteredUnits(
  applicationRound: Maybe<ApplicationRoundAdminFragment> | undefined,
  user: CurrentUserQuery["currentUser"]
) {
  const resUnits = filterNonNullable(applicationRound?.reservationUnits?.flatMap((x) => x));

  // need filtered list of units that the user has permission to view
  const ds = getUnitOptions(resUnits).filter(
    (unit) =>
      hasPermission(user, UserPermissionChoice.CanViewApplications, unit.pk) ||
      hasPermission(user, UserPermissionChoice.CanManageApplications, unit.pk)
  );
  const unitOptions = uniqBy(ds, (unit) => unit.pk).sort((a, b) => a.nameFi.localeCompare(b.nameFi));
  return unitOptions;
}

function isAllocationEnabled(
  applicationRound: Maybe<Pick<ApplicationRoundAdminFragment, "status" | "applicationsCount">> | undefined
): boolean {
  return (
    applicationRound != null &&
    applicationRound.status === ApplicationRoundStatusChoice.InAllocation &&
    applicationRound.applicationsCount != null &&
    applicationRound.applicationsCount > 0
  );
}

function hasApplicationRoundEnded(
  applicationRound: Maybe<Pick<ApplicationRoundAdminFragment, "status">> | undefined
): boolean {
  return (
    applicationRound != null &&
    (applicationRound.status === ApplicationRoundStatusChoice.Handled ||
      applicationRound.status === ApplicationRoundStatusChoice.ResultsSent)
  );
}

function useReviewCheckPermissions({ units }: { units: number[] }) {
  const { hasPermission: canView, isLoading } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanViewApplications,
  });
  const { hasPermission: canManage, isLoading: isLoading2 } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanManageApplications,
  });
  const canSeePage = canView || canManage;
  const isLoadingPermissions = isLoading || isLoading2;
  return { canSeePage, isLoadingPermissions };
}

export default ApplicationRoundRouted;

export const APPLICATION_ROUND_ADMIN_FRAGMENT = gql`
  fragment ApplicationRoundAdmin on ApplicationRoundNode {
    id
    pk
    nameFi
    status
    applicationPeriodBegin
    applicationPeriodEnd
    applicationsCount
    isSettingHandledAllowed
    reservationCreationStatus
    reservationUnits {
      id
      pk
      nameFi
      unit {
        id
        pk
        nameFi
      }
    }
  }
`;

export const APPLICATION_ROUND_QUERY = gql`
  query ApplicationRound($id: ID!) {
    applicationRound(id: $id) {
      ...ApplicationRoundAdmin
    }
  }
`;
