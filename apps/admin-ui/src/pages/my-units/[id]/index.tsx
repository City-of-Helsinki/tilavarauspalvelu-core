import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { Button, ButtonSize, ButtonVariant, Tabs } from "hds-react";
import { Flex, H1, TabWrapper, TitleSection } from "common/styled";
import { breakpoints } from "common/src/const";
import { formatAddress } from "@/common/util";
import { getReservationSeriesUrl } from "@/common/urls";
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { errorToast } from "common/src/components/toast";
import { UserPermissionChoice, useUnitViewQuery } from "@gql/gql-types";
import { useCheckPermission } from "@/hooks";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { gql } from "@apollo/client";
import { useModal } from "@/context/ModalContext";
import { useSearchParams } from "next/navigation";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { AuthorizationChecker } from "@/component/AuthorizationChecker";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { type GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { NOT_FOUND_SSR_VALUE } from "@/common/const";
import { CreateReservationModal, ReservationUnitCalendarView, UnitReservations } from "@lib/my-units/[id]/";
import { fromUIDate } from "common/src/common/util";
import { addMinutes } from "date-fns";

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

function MyUnitView({ unitPk: pk }: { unitPk: number }): JSX.Element {
  const { t } = useTranslation();
  const { setModalContent } = useModal();

  const id = base64encode(`UnitNode:${pk}`);
  const { loading, data, previousData } = useUnitViewQuery({
    variables: { id },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const { unit } = data ?? previousData ?? {};

  const createReservationBtnRef = useRef<HTMLButtonElement>(null);
  const { hasPermission } = useCheckPermission({
    units: pk != null ? [pk] : [],
    permission: UserPermissionChoice.CanCreateStaffReservations,
  });

  const searchParams = useSearchParams();
  const setSearchParams = useSetSearchParams();
  const selectedTab = searchParams.get("tab") ?? "unit";
  const handleTabChange = (tab: "unit" | "reservation-unit") => {
    const vals = new URLSearchParams(searchParams);
    vals.set("tab", tab);
    setSearchParams(vals);
  };

  const recurringReservationUrl = getReservationSeriesUrl(pk);

  const reservationUnitOptions = (unit?.reservationUnits ?? []).map(({ pk, nameFi }) => ({
    label: nameFi ?? "-",
    value: pk ?? 0,
  }));

  const modalCloseRef = useRef<HTMLInputElement | null>(null);

  // Find the calendar cell used to open the modal
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
  const selectedDate = fromUIDate(searchParams.get("date") ?? "") ?? new Date();
  const timeOffset = toNumber(searchParams.get("timeOffset")) ?? 0;

  const activeTab = selectedTab === "reservation-unit" ? 1 : 0;

  const title = unit?.nameFi ?? (loading ? t("common:loading") : "-");
  const canCreateReservations = hasPermission && unit != null && reservationUnitOptions.length > 0;
  const address = formatAddress(unit, "");
  return (
    <>
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
            <UnitReservations reservationUnitOptions={reservationUnitOptions} unitPk={pk} />
          </TabPanel>
          <TabPanel>
            <ReservationUnitCalendarView reservationUnitOptions={reservationUnitOptions} unitPk={pk} />
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
export default function Page({ apiBaseUrl, pk }: PropsNarrowed): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={apiBaseUrl}>
      <MyUnitView unitPk={pk} />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale, query }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.id));
  if (pk == null || pk <= 0) {
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
        spaces {
          id
          pk
        }
      }
    }
  }
`;
