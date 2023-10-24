import React, { useEffect, useState } from "react";
import { useQuery as useApolloQuery } from "@apollo/client";
import { Select, Tabs } from "hds-react";
import { useTranslation } from "react-i18next";
import { uniqBy } from "lodash";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { H1, Strongish } from "common/src/common/typography";
import {
  ApplicationType,
  QueryApplicationsArgs,
  Query,
  ApplicationEventType,
  ReservationUnitType,
  ApplicationStatus,
} from "common/types/gql-types";
import { AutoGrid, Container } from "@/styles/layout";
import { OptionType } from "@/common/types";
import { useNotification } from "@/context/NotificationContext";
import { useAllocationContext } from "@/context/AllocationContext";
import Loader from "@/component/Loader";
import LinkPrev from "@/component/LinkPrev";
import { APPLICATIONS_BY_APPLICATION_ROUND_QUERY } from "../queries";
import { getFilteredApplicationEvents } from "./modules/applicationRoundAllocation";
import ApplicationEvents from "./ApplicationEvents";

type IParams = {
  applicationRoundId: string;
};

const Ingress = styled.p`
  font-size: var(--fontsize-body-xl);
  margin-bottom: var(--spacing-xl);
`;

const TabList = styled(Tabs.TabList)`
  ${Strongish};
`;

const Tab = styled(Tabs.Tab)`
  && > span:before {
    z-index: 1;
  }
`;

function ApplicationRoundAllocation({
  applicationRoundId,
}: {
  applicationRoundId: number;
}): JSX.Element {
  const { refreshApplicationEvents, setRefreshApplicationEvents } =
    useAllocationContext();
  const { notifyError } = useNotification();
  const [selectedReservationUnit, setSelectedReservationUnit] =
    useState<ReservationUnitType | null>(null);

  const [unitFilter, setUnitFilter] = useState<OptionType | null>(null);
  const [timeFilter, setTimeFilter] = useState<OptionType[]>([]);
  const [orderFilter, setOrderFilter] = useState<OptionType[]>([]);

  const { t } = useTranslation();

  // TODO pagination
  const {
    loading: loadingApplications,
    data: applicationsData,
    refetch,
  } = useApolloQuery<Query, QueryApplicationsArgs>(
    APPLICATIONS_BY_APPLICATION_ROUND_QUERY,
    {
      skip: !applicationRoundId,
      variables: {
        applicationRound: String(applicationRoundId),
        status: [
          ApplicationStatus.Allocated,
          ApplicationStatus.Expired,
          ApplicationStatus.Handled,
          ApplicationStatus.InReview,
          ApplicationStatus.Received,
          ApplicationStatus.ReviewDone,
          ApplicationStatus.Sent,
        ],
      },
      onError: () => {
        notifyError(t("errors.errorFetchingData"));
      },
    }
  );

  const applications =
    applicationsData?.applications?.edges
      .map((e) => e?.node)
      ?.filter((x): x is ApplicationType => x != null) ?? [];

  const unitData = applications.flatMap((application) =>
    application?.applicationEvents?.flatMap((ae) =>
      ae?.eventReservationUnits
        ?.flatMap((eru) => eru?.reservationUnit?.unit)
        .filter((n): n is NonNullable<typeof n> => n != null)
    )
  );
  const units = uniqBy(unitData, "pk");

  const unitOptions = units.map((unit) => ({
    value: unit?.pk,
    label: unit?.nameFi,
  }));

  const timeOptions = [300, 200].map((n) => ({
    value: n,
    label: t(`ApplicationEvent.priority.${n}`),
  }));

  const orderOptions = [
    {
      value: 1,
      label: `1. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
    {
      value: 2,
      label: `2. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
    {
      value: 3,
      label: `3. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
    {
      value: 4,
      label: `4. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
  ];

  const reservationUnits: ReservationUnitType[] = uniqBy(
    applications.flatMap((application) =>
      application?.applicationEvents?.flatMap((applicationEvent) =>
        applicationEvent?.eventReservationUnits
          ?.flatMap((evtRu) => evtRu?.reservationUnit)
          .filter((ru): ru is ReservationUnitType => ru != null)
      )
    ),
    "pk"
  )
    .filter((ru) => unitFilter?.value === ru?.unit?.pk)
    .filter((ru): ru is ReservationUnitType => ru != null);

  // NOTE rather sketchy: this is the context event listener
  useEffect(() => {
    if (refreshApplicationEvents) {
      refetch();
      setRefreshApplicationEvents(false);
    }
  }, [refetch, refreshApplicationEvents, setRefreshApplicationEvents]);

  const applicationEvents: ApplicationEventType[] =
    getFilteredApplicationEvents(
      applications,
      unitFilter,
      timeFilter,
      orderFilter,
      selectedReservationUnit || reservationUnits[0]
    );

  if (loadingApplications) {
    return <Loader />;
  }

  return (
    <Container>
      <LinkPrev />
      <H1 $legacy>{t("Allocation.allocationTitle")}</H1>
      <Ingress>{applications[0]?.applicationRound?.nameFi}</Ingress>
      <AutoGrid>
        <Select
          clearButtonAriaLabel={t("common.clearAllSelections")}
          label={t("Allocation.filters.unit")}
          onChange={(val: OptionType) => {
            setUnitFilter(val);
            setSelectedReservationUnit(null);
          }}
          options={unitOptions as OptionType[]}
          value={unitFilter}
          placeholder={t("Allocation.filters.selectUnits")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Select
          onChange={(val) => {
            setTimeFilter(val);
          }}
          options={timeOptions}
          multiselect
          value={[...timeFilter]}
          label={t("Allocation.filters.schedules")}
          placeholder={t("Allocation.filters.selectSchedules")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Select
          onChange={(val) => {
            setOrderFilter(val);
          }}
          label={t("Allocation.filters.reservationUnitOrder")}
          multiselect
          options={orderOptions}
          value={[...orderFilter]}
          placeholder={t("Allocation.filters.selectReservationUnitOrder")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
      </AutoGrid>
      <Tabs>
        <TabList>
          {reservationUnits?.map((reservationUnit) => (
            <Tab
              onClick={() => {
                setSelectedReservationUnit(reservationUnit);
              }}
              key={reservationUnit?.pk}
            >
              {reservationUnit?.nameFi}
            </Tab>
          ))}
        </TabList>
        {/* NOTE: we want the tabs as buttons, without this the HDS tabs break */}
        <Tabs.TabPanel />
      </Tabs>
      {applicationEvents && applicationEvents.length && unitFilter ? (
        <ApplicationEvents
          applications={applications}
          applicationEvents={applicationEvents}
          reservationUnit={selectedReservationUnit || reservationUnits[0]}
        />
      ) : null}
    </Container>
  );
}

function ApplicationRoundAllocationRouted(): JSX.Element {
  const { applicationRoundId } = useParams<IParams>();
  const { t } = useTranslation();

  if (!applicationRoundId || Number.isNaN(Number(applicationRoundId))) {
    return <div>{t("errors.router.invalidApplicationRoundNumber")}</div>;
  }
  return (
    <ApplicationRoundAllocation
      applicationRoundId={Number(applicationRoundId)}
    />
  );
}

export default ApplicationRoundAllocationRouted;
