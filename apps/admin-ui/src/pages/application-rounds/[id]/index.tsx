import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { gql } from "@apollo/client";
import { errorToast } from "common/src/common/toast";
import { base64encode, filterNonNullable, ignoreMaybeArray, toNumber } from "common/src/helpers";
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
  ApplicationRoundQuery,
  ApplicationRoundQueryVariables,
  ApplicationRoundDocument,
  CheckPermissionsQuery,
  CheckPermissionsQueryVariables,
  CheckPermissionsDocument,
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
import { useSearchParams } from "next/navigation";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import Link from "next/link";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSidePropsContext } from "next";
import { NOT_FOUND_SSR_VALUE } from "@/common/const";
import Error404 from "@/common/Error404";
import { createClient } from "@/common/apolloClient";

const TabContent = styled.div`
  display: grid;
  gap: var(--spacing-m);
  margin-top: var(--spacing-s);
  line-height: 1;
`;

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;

export default function ApplicationRound({ pk }: PropsNarrowed): JSX.Element {
  const { t } = useTranslation();
  const [isInProgress, setIsInProgress] = useState(false);

  const { data, previousData, loading, refetch } = useApplicationRoundQuery({
    variables: { id: base64encode(`ApplicationRoundNode:${pk}`) },
    pollInterval: isInProgress ? 10000 : 0,
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });
  const { applicationRound } = data ?? previousData ?? {};

  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();
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
        setParams(p);
      }
    }
  }, [unitOptions, searchParams, setParams]);

  if (applicationRound == null && loading) {
    return <CenterSpinner />;
  } else if (!applicationRound) {
    return <Error404 />;
  }

  const selectedTab = searchParams.get("tab") ?? "applications";
  const handleTabChange = (tab: string) => {
    const vals = new URLSearchParams(searchParams);
    vals.set("tab", tab);
    setParams(vals);
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
              applicationPeriodBeginsAt={applicationRound.applicationPeriodBeginsAt}
              applicationPeriodEndsAt={applicationRound.applicationPeriodEndsAt}
            />
            <Link href={`${pk}/criteria`}>{t("applicationRound:roundCriteria")}</Link>
          </Flex>
        </div>
        <ApplicationRoundStatusLabel status={applicationRound.status} />
      </TitleSection>
      <Flex $justifyContent="space-between" $direction="row-reverse" $alignItems="center">
        {!hideAllocation &&
          (isAllocationEnabled(applicationRound) ? (
            <ButtonLikeLink href={`${pk}/allocation`} variant="primary" size="large">
              {t("applicationRound:allocate")}
            </ButtonLikeLink>
          ) : (
            <Button disabled>{t("applicationRound:allocate")}</Button>
          ))}
        {isEndingAllowed || isHandled ? (
          <ReviewEndAllocation applicationRound={applicationRound} refetch={refetch} />
        ) : null}
      </Flex>
      <TabWrapper>
        <Tabs initiallyActiveTab={activeTabIndex}>
          <Tabs.TabList>
            <Tabs.Tab onClick={() => handleTabChange("applications")}>{t("applicationRound:applications")}</Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("events")}>{t("applicationRound:appliedReservations")}</Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("allocated")}>
              {isApplicationRoundEnded
                ? t("applicationRound:madeReservations")
                : t("applicationRound:allocatedReservations")}
            </Tabs.Tab>
            {isApplicationRoundEnded && (
              <Tabs.Tab onClick={() => handleTabChange("rejected")}>
                {t("applicationRound:rejectedOccurrences")}
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

/// Do permission checks in SSR since they don't change and the extra query refreshes cause loading spinners
export async function getServerSideProps({ locale, query, req }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.id));

  if (pk == null || pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }

  const commonProps = await getCommonServerSideProps();
  const client = createClient(commonProps.apiBaseUrl, req);
  const { data } = await client.query<ApplicationRoundQuery, ApplicationRoundQueryVariables>({
    query: ApplicationRoundDocument,
    variables: { id: base64encode(`ApplicationRoundNode:${pk}`) },
  });
  const { applicationRound } = data;
  const units = filterNonNullable(applicationRound?.reservationUnits.map((x) => x.unit?.pk));

  if (!applicationRound) {
    return NOT_FOUND_SSR_VALUE;
  }

  const { data: viewPermissionData } = await client.query<CheckPermissionsQuery, CheckPermissionsQueryVariables>({
    query: CheckPermissionsDocument,
    variables: {
      units,
      permission: UserPermissionChoice.CanViewApplications,
    },
  });

  const { data: managePermissionData } = await client.query<CheckPermissionsQuery, CheckPermissionsQueryVariables>({
    query: CheckPermissionsDocument,
    variables: {
      units,
      permission: UserPermissionChoice.CanManageApplications,
    },
  });
  const canSeePage =
    viewPermissionData.checkPermissions?.hasPermission || managePermissionData.checkPermissions?.hasPermission;

  if (!canSeePage) {
    return NOT_FOUND_SSR_VALUE;
  }

  return {
    props: {
      pk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
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

export const APPLICATION_ROUND_ADMIN_FRAGMENT = gql`
  fragment ApplicationRoundAdmin on ApplicationRoundNode {
    id
    pk
    nameFi
    status
    applicationPeriodBeginsAt
    applicationPeriodEndsAt
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
