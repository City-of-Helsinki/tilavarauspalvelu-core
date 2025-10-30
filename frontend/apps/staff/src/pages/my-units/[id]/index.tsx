import TimeZoneNotification from "ui/src/components/TimeZoneNotification";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { Button, ButtonSize, ButtonVariant, Tabs } from "hds-react";
import { Flex, H1, TabWrapper, TitleSection } from "ui/src/styled";
import { breakpoints } from "ui/src/modules/const";
import { formatAddress } from "@/modules/util";
import { getReservationSeriesUrl } from "@/modules/urls";
import { createNodeId, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import {
  FilterOptionsDocument,
  type FilterOptionsQuery,
  type FilterOptionsQueryVariables,
  UnitViewDocument,
  type UnitViewQuery,
  type UnitViewQueryVariables,
  UserPermissionChoice,
} from "@gql/gql-types";
import { useSession } from "@/hooks";
import { ButtonLikeLink } from "@/components/ButtonLikeLink";
import { gql } from "@apollo/client";
import { useModal } from "@/context/ModalContext";
import { useSearchParams } from "next/navigation";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { type GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";
import { CreateReservationModal, ReservationUnitCalendarView, UnitReservations } from "@lib/my-units/[id]/";
import { parseUIDate } from "ui/src/modules/date-utils";
import { addMinutes } from "date-fns";
import { createClient } from "@/modules/apolloClient";
import { hasPermission } from "@/modules/permissionHelper";
import { getFilterOptions } from "@/hooks/useFilterOptions";

const LocationOnlyOnDesktop = styled.p`
  display: none;
  margin: 0;
  @media (min-width: ${breakpoints.s}) {
    display: block;
  }
`;

const TabPanel = styled(Tabs.TabPanel)`
  padding-block: var(--spacing-m);
`;

export default function MyUnitsPage({ unit, optionsData }: Pick<PropsNarrowed, "unit" | "optionsData">): JSX.Element {
  const { t } = useTranslation();
  const { setModalContent } = useModal();

  const options = getFilterOptions(t, optionsData);

  const createReservationBtnRef = useRef<HTMLButtonElement>(null);
  const { user } = useSession();

  const searchParams = useSearchParams();
  const setSearchParams = useSetSearchParams();

  const selectedTab = searchParams.get("tab") ?? "unit";
  const activeTab = selectedTab === "reservation-unit" ? 1 : 0;

  const handleTabChange = (tab: "unit" | "reservation-unit") => {
    const vals = new URLSearchParams(searchParams);
    vals.set("tab", tab);
    setSearchParams(vals);
  };

  const recurringReservationUrl = getReservationSeriesUrl(unit.pk);

  const reservationUnitOptions = unit.reservationUnits.map(({ pk, nameFi, isDraft }) => ({
    label: nameFi ?? "-",
    value: pk ?? 0,
    isDraft,
  }));

  const modalCloseRef = useRef<HTMLInputElement | null>(null);

  // Find the calendar cell used to open the modal, so it can be focused after closing the modal
  useEffect(() => {
    const cellId = searchParams.get("cellId");
    const testId = `UnitCalendar__RowCalendar--cell-${cellId}`;
    const isModalOpen = searchParams.get("isModalOpen") === "true";
    if (isModalOpen && cellId) {
      const el = document.querySelector(`[data-testid="${testId}"]`);
      if (el) {
        modalCloseRef.current = el as HTMLInputElement;
      }
    }
  }, [searchParams]);

  // Unlike calendar opening this does not cause content jumping when using only client side (modalContext)
  // The problem with calendar is that it's deeper in the hierarchy
  // -> searchParams change (reservationUnit)
  // -> this component is redrawn
  // -> all sub components redraw
  // -> something in the chain is completely redrawn / remounted
  // -> content jumps / flashes
  const handleOpenModal = () => {
    // Legacy way of opening modal because getting React refs to work with Next.js handling of searchParams is a pain
    // using searchParams redraws the buttons, and while the ref is set correctly focus is lost
    // probably due to focus being set first, and then the button being redrawn
    setModalContent(
      <CreateReservationModal
        start={new Date()}
        focusAfterCloseRef={createReservationBtnRef}
        reservationUnitOptions={reservationUnitOptions}
        onClose={() => setModalContent(null)}
      />
    );
  };

  const isModalOpen = searchParams.get("isModalOpen") === "true";
  const selectedDate = parseUIDate(searchParams.get("date") ?? "") ?? new Date();
  const timeOffset = toNumber(searchParams.get("timeOffset")) ?? 0;

  const title = unit.nameFi ?? "-";
  const canCreateReservations =
    hasPermission(user, UserPermissionChoice.CanCreateStaffReservations, unit.pk) && reservationUnitOptions.length > 0;
  const address = formatAddress(unit, "");

  return (
    <>
      <TimeZoneNotification />
      <TitleSection>
        <H1 $noMargin>{title}</H1>
        {address !== "" && <LocationOnlyOnDesktop>{address}</LocationOnlyOnDesktop>}
      </TitleSection>
      <Flex $direction="row" $gap="m">
        <Button
          ref={createReservationBtnRef}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Small}
          onClick={handleOpenModal}
          disabled={!canCreateReservations}
        >
          {t("myUnits:Calendar.header.createReservation")}
        </Button>
        <ButtonLikeLink href={canCreateReservations ? recurringReservationUrl : ""} disabled={!canCreateReservations}>
          {t("myUnits:Calendar.header.reservationSeries")}
        </ButtonLikeLink>
      </Flex>
      <TabWrapper>
        <Tabs initiallyActiveTab={activeTab}>
          <Tabs.TabList>
            <Tabs.Tab onClick={() => handleTabChange("unit")}>{t("myUnits:Calendar.Tabs.byReservationUnit")}</Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("reservation-unit")}>{t("myUnits:Calendar.Tabs.byUnit")}</Tabs.Tab>
          </Tabs.TabList>
          <TabPanel>
            <UnitReservations
              reservationUnitOptions={reservationUnitOptions}
              unitPk={unit.pk ?? 0}
              canCreateReservations={canCreateReservations}
              tagOptions={options}
            />
          </TabPanel>
          <TabPanel>
            <ReservationUnitCalendarView reservationUnitOptions={reservationUnitOptions} unitPk={unit.pk ?? 0} />
          </TabPanel>
        </Tabs>
      </TabWrapper>
      {isModalOpen && (
        <CreateReservationModal
          reservationUnitOptions={reservationUnitOptions}
          focusAfterCloseRef={modalCloseRef}
          start={addMinutes(selectedDate, timeOffset * 30)}
          onClose={() => {
            const params = new URLSearchParams(searchParams);
            params.delete("isModalOpen");
            params.delete("timeOffset");
            params.delete("cellId");
            setSearchParams(params);
          }}
        />
      )}
    </>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;

export async function getServerSideProps({ req, locale, query }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.id));
  if (pk == null || pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }
  const start = performance.now();
  const commonProps = await getCommonServerSideProps();
  const apolloClient = createClient(commonProps.apiBaseUrl ?? "", req);
  const unitQuery = apolloClient.query<UnitViewQuery, UnitViewQueryVariables>({
    query: UnitViewDocument,
    variables: { id: createNodeId("UnitNode", pk) },
  });
  const optionsQuery = apolloClient.query<FilterOptionsQuery, FilterOptionsQueryVariables>({
    query: FilterOptionsDocument,
  });

  const [unitQueryRes, optionsQueryRes] = await Promise.all([unitQuery, optionsQuery]);
  const { data } = unitQueryRes;
  const { data: optionsData } = optionsQueryRes;

  const end = performance.now();
  // oxlint-disable-next-line no-console
  console.log(`SSR queries took: ${end - start} ms`);

  const { unit } = data;
  if (unit == null) {
    return NOT_FOUND_SSR_VALUE;
  }

  return {
    props: {
      unit,
      optionsData,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const UNIT_VIEW_QUERY = gql`
  query UnitView($id: ID!) {
    unit(id: $id) {
      id
      pk
      nameFi
      ...LocationFields
      reservationUnits {
        id
        pk
        nameFi
        isDraft
        spaces {
          id
          pk
        }
      }
    }
  }
`;
