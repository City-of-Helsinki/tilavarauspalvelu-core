import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gql } from "@apollo/client";
import { errorToast } from "common/src/common/toast";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { isApplicationRoundInProgress } from "@/helpers";
import { CenterSpinner, Flex, H1, NoWrap, TabWrapper, TitleSection } from "common/styled";
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
import { useUnitGroupOptions } from "@/hooks/useUnitGroupOptions";

const TabContent = styled(Flex).attrs({
  $direction: "column",
  $gap: "m",
  $marginTop: "s",
})``;

function ApplicationRound({ pk }: { pk: number }): JSX.Element {
  const { t } = useTranslation();
  const [isInProgress, setIsInProgress] = useState(false);

  const isPkValid = pk > 0;
  const { data, loading, refetch } = useApplicationRoundQuery({
    skip: !isPkValid,
    variables: { id: base64encode(`ApplicationRoundNode:${pk}`) },
    pollInterval: isInProgress ? 10000 : 0,
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });
  const { applicationRound } = data ?? {};

  // NOTE: useEffect works, onCompleted does not work with refetch
  useEffect(() => {
    if (data) {
      setIsInProgress(isApplicationRoundInProgress(data.applicationRound));
    }
  }, [data]);

  const { user } = useSession();
  const unitOptions = getUserPermissionFilteredUnits(applicationRound, user);
  const { options: unitGroupOptions } = useUnitGroupOptions({ applicationRoundPk: pk });

  const canUserSeePage = unitOptions.length > 0;

  const [searchParams, setParams] = useSearchParams();
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
        setParams(p, { replace: true });
      }
    }
  }, [unitOptions, searchParams, setParams]);

  if (loading) {
    return <CenterSpinner />;
  } else if (!canUserSeePage) {
    return <div>{t("errors.noPermission")}</div>;
  } else if (!applicationRound) {
    return <div>{t("errors.applicationRoundNotFound")}</div>;
  }

  const selectedTab = searchParams.get("tab") ?? "applications";
  const activeTabIndex = selectedTab === "sections" ? 1 : selectedTab === "allocated" ? 2 : 0;
  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    setParams(params, { replace: true });
  };

  const reservationUnitOptions = getRoundReservationUnitOptions(applicationRound);
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
            <Link to="criteria">{t("ApplicationRound.roundCriteria")}</Link>
          </Flex>
        </div>
        <ApplicationRoundStatusLabel status={applicationRound.status} />
      </TitleSection>

      <Flex $justifyContent="space-between" $direction="row-reverse" $alignItems="center">
        {!isApplicationRoundEnded &&
          (isAllocationEnabled(applicationRound) ? (
            <ButtonLikeLink to="allocation" variant="primary" size="large">
              <NoWrap>{t("ApplicationRound.allocate")}</NoWrap>
            </ButtonLikeLink>
          ) : (
            <Button disabled>{t("ApplicationRound.allocate")}</Button>
          ))}
        {canSetHandledOrSendResults && <ReviewEndAllocation applicationRound={applicationRound} refetch={refetch} />}
      </Flex>

      <TabWrapper>
        <Tabs initiallyActiveTab={activeTabIndex}>
          <Tabs.TabList>
            <Tabs.Tab onClick={() => handleTabChange("applications")}>{t("ApplicationRound.applications")}</Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("sections")}>{t("ApplicationRound.appliedReservations")}</Tabs.Tab>
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
              <Filters unitGroupOptions={unitGroupOptions} unitOptions={unitOptions} enableApplicant />
              <ApplicationDataLoader applicationRoundPk={applicationRound.pk ?? 0} />
            </TabContent>
          </Tabs.TabPanel>

          <Tabs.TabPanel>
            <TabContent>
              <Filters
                unitGroupOptions={unitGroupOptions}
                unitOptions={unitOptions}
                statusOption="section"
                enableApplicant
              />
              <ApplicationSectionDataLoader applicationRoundPk={applicationRound.pk ?? 0} />
            </TabContent>
          </Tabs.TabPanel>

          <Tabs.TabPanel>
            <TabContent>
              <Filters
                unitGroupOptions={unitGroupOptions}
                unitOptions={unitOptions}
                reservationUnitOptions={reservationUnitOptions}
                enableApplicant
                enableWeekday
                enableReservationUnit
                enableAccessCodeState
                statusOption="sectionShort"
              />
              <TimeSlotDataLoader applicationRoundPk={applicationRound.pk ?? 0} unitOptions={unitOptions} />
            </TabContent>
          </Tabs.TabPanel>

          {isApplicationRoundEnded && (
            <Tabs.TabPanel>
              <TabContent>
                <Filters
                  unitGroupOptions={unitGroupOptions}
                  unitOptions={unitOptions}
                  reservationUnitOptions={reservationUnitOptions}
                  enableReservationUnit
                  statusOption="sectionShort"
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

function getRoundReservationUnitOptions(applicationRound: Pick<ApplicationRoundAdminFragment, "reservationUnits">) {
  return filterNonNullable(applicationRound.reservationUnits.map(toOption));
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

export default ApplicationRoundRouted;

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
