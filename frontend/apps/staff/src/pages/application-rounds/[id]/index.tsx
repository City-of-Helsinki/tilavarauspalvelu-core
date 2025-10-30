import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { gql } from "@apollo/client";
import { errorToast } from "ui/src/components/toast";
import { createNodeId, filterNonNullable, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { isApplicationRoundInProgress } from "@/modules/helpers";
import { Flex, H1, NoWrap, TabWrapper, TitleSection } from "ui/src/styled";
import { Button, Tabs } from "hds-react";
import { uniqBy } from "lodash-es";
import styled from "styled-components";
import {
  type ApplicationRoundAdminFragment,
  ApplicationRoundStatusChoice,
  CurrentUserQuery,
  type Maybe,
  useApplicationRoundQuery,
  UserPermissionChoice,
  ApplicationRoundQuery,
  ApplicationRoundQueryVariables,
  ApplicationRoundDocument,
  CheckPermissionsQuery,
  CheckPermissionsQueryVariables,
  CheckPermissionsDocument,
  FilterOptionsDocument,
  type FilterOptionsQuery,
  type FilterOptionsQueryVariables,
  CurrentUserDocument,
} from "@gql/gql-types";
import { ButtonLikeLink } from "@/components/ButtonLikeLink";
import { hasPermission } from "@/modules/permissionHelper";
import { useSearchParams } from "next/navigation";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import Link from "next/link";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSidePropsContext } from "next";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";
import { createClient } from "@/modules/apolloClient";
import { TimeframeStatus, ApplicationRoundStatusLabel } from "@lib/application-rounds";
import {
  ReviewEndAllocation,
  ApplicationDataLoader,
  Filters,
  ApplicationSectionDataLoader,
  TimeSlotDataLoader,
  RejectedOccurrencesDataLoader,
} from "@lib/application-rounds/[id]";
import { type TagOptionsList } from "@/modules/search";
import { getFilterOptions } from "@/hooks/useFilterOptions";
import { getApplicationRoundUrl } from "@/modules/urls";

const TabContent = styled(Flex).attrs({
  $direction: "column",
  $gap: "m",
  $marginTop: "s",
})``;

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;

export default function ApplicationRound({
  applicationRound: applicationRoundOriginal,
  optionsData,
  unitOptions,
}: PropsNarrowed): JSX.Element {
  const { t } = useTranslation();
  const [isInProgress, setIsInProgress] = useState(false);

  /// NOTE always valid since the application round exists if we are here
  const pk = applicationRoundOriginal?.pk ?? 0;
  const { data, previousData, refetch } = useApplicationRoundQuery({
    variables: { id: createNodeId("ApplicationRoundNode", pk) },
    pollInterval: isInProgress ? 10000 : 0,
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });
  const applicationRound = data?.applicationRound ?? previousData?.applicationRound ?? applicationRoundOriginal;

  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();

  // NOTE: useEffect works, onCompleted does not work with refetch
  useEffect(() => {
    if (data) {
      setIsInProgress(isApplicationRoundInProgress(data.applicationRound));
    }
  }, [data]);

  // user has no access to specific unit through URL with search params -> remove it from URL
  useEffect(() => {
    const unitParam = searchParams.getAll("unit");
    if (unitParam.length > 0) {
      const filteredUnits = unitParam.filter((u) => unitOptions.some((unit) => unit.value === Number(u)));
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

  const originalOptions = getFilterOptions(t, optionsData);
  const reservationUnitOptions = getRoundReservationUnitOptions(applicationRound);
  const options: TagOptionsList = {
    ...originalOptions,
    // overloads because we are filtering these (and because of the translations we have to do it on the client)
    reservationUnits: reservationUnitOptions,
    units: unitOptions,
  };

  const selectedTab = searchParams.get("tab") ?? "applications";
  const activeTabIndex = selectedTab === "sections" ? 1 : selectedTab === "allocated" ? 2 : 0;
  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    setParams(params);
  };

  const isApplicationRoundEnded = hasApplicationRoundEnded(applicationRound);

  // isSettingHandledAllowed = Reservations can be created
  // status.Handled = Reservations are created, but not sent to the applicants
  // i.e. status.InAllocation -> isSettingHandledAllowed -> status.Handled -> status.ResultsSent
  const canSetHandledOrSendResults =
    applicationRound.isSettingHandledAllowed || applicationRound.status === ApplicationRoundStatusChoice.Handled;

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
            <Link href={getApplicationRoundUrl(pk, "criteria")}>{t("applicationRound:roundCriteria")}</Link>
          </Flex>
        </div>
        <ApplicationRoundStatusLabel status={applicationRound.status} />
      </TitleSection>

      <Flex $justifyContent="space-between" $direction="row-reverse" $alignItems="center">
        {!isApplicationRoundEnded &&
          (isAllocationEnabled(applicationRound) ? (
            <ButtonLikeLink href={`${pk}/allocation`} variant="primary" size="large">
              <NoWrap>{t("applicationRound:allocate")}</NoWrap>
            </ButtonLikeLink>
          ) : (
            <Button disabled>{t("applicationRound:allocate")}</Button>
          ))}
        {canSetHandledOrSendResults && <ReviewEndAllocation applicationRound={applicationRound} refetch={refetch} />}
      </Flex>

      <TabWrapper>
        <Tabs initiallyActiveTab={activeTabIndex}>
          <Tabs.TabList>
            <Tabs.Tab onClick={() => handleTabChange("applications")}>{t("applicationRound:applications")}</Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("sections")}>{t("applicationRound:appliedReservations")}</Tabs.Tab>
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
              <Filters options={options} enableApplicant />
              <ApplicationDataLoader applicationRoundPk={applicationRound.pk ?? 0} />
            </TabContent>
          </Tabs.TabPanel>

          <Tabs.TabPanel>
            <TabContent>
              <Filters options={options} statusOption="section" enableApplicant />
              <ApplicationSectionDataLoader applicationRoundPk={applicationRound.pk ?? 0} />
            </TabContent>
          </Tabs.TabPanel>

          <Tabs.TabPanel>
            <TabContent>
              <Filters options={options} enableApplicant enableWeekday enableReservationUnit enableAccessCodeState />
              <TimeSlotDataLoader applicationRoundPk={applicationRound.pk ?? 0} unitOptions={unitOptions} />
            </TabContent>
          </Tabs.TabPanel>

          {isApplicationRoundEnded && (
            <Tabs.TabPanel>
              <TabContent>
                <Filters options={options} enableReservationUnit />
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
    variables: { id: createNodeId("ApplicationRoundNode", pk) },
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

  const options = await client.query<FilterOptionsQuery, FilterOptionsQueryVariables>({
    query: FilterOptionsDocument,
    variables: {
      applicationRound: pk,
    },
  });

  // User might have permissions to see the page, but not to see any units in the application round
  const user = await client.query<CurrentUserQuery>({
    query: CurrentUserDocument,
  });
  const unitOptions = getUserPermissionFilteredUnits(applicationRound, user.data.currentUser);

  if (!canSeePage || unitOptions.length === 0) {
    return NOT_FOUND_SSR_VALUE;
  }

  return {
    props: {
      pk,
      optionsData: options.data,
      unitOptions,
      applicationRound,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

function toOption(
  instance: Pick<
    | ApplicationRoundAdminFragment["reservationUnits"][number]
    | ApplicationRoundAdminFragment["reservationUnits"][number]["unit"],
    "nameFi" | "pk"
  >
) {
  if (instance?.pk == null || instance.nameFi == null) {
    return null;
  }
  const { nameFi, pk } = instance;
  return { label: nameFi, value: pk };
}

function getRoundReservationUnitOptions(
  applicationRound: Maybe<Pick<ApplicationRoundAdminFragment, "reservationUnits">> | undefined
) {
  return filterNonNullable(applicationRound?.reservationUnits.map(toOption));
}

function getRoundUnitOptions(reservationUnits: ApplicationRoundAdminFragment["reservationUnits"]) {
  return filterNonNullable(reservationUnits.map((x) => toOption(x?.unit)));
}

function getUserPermissionFilteredUnits(
  applicationRound: Maybe<ApplicationRoundAdminFragment> | undefined,
  user: CurrentUserQuery["currentUser"]
): { label: string; value: number }[] {
  // Return all units that the user has permission to view or manage in the application round
  const reservationUnits = filterNonNullable(applicationRound?.reservationUnits);
  const unitOptions = getRoundUnitOptions(reservationUnits).filter(
    (unit) =>
      hasPermission(user, UserPermissionChoice.CanViewApplications, unit.value) ||
      hasPermission(user, UserPermissionChoice.CanManageApplications, unit.value)
  );
  return uniqBy(unitOptions, (unit) => unit.value).sort((a, b) => a.label.localeCompare(b.label));
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

function hasApplicationRoundEnded(applicationRound: Pick<ApplicationRoundAdminFragment, "status">): boolean {
  return (
    applicationRound.status === ApplicationRoundStatusChoice.Handled ||
    applicationRound.status === ApplicationRoundStatusChoice.ResultsSent
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
