import React, { useRef } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { Button, ButtonSize, ButtonVariant, Tabs } from "hds-react";
import { Flex, H1, TabWrapper, TitleSection } from "common/styled";
import { breakpoints } from "common/src/const";
import { parseAddress } from "@/common/util";
import { getRecurringReservationUrl } from "@/common/urls";
import { ReservationUnitCalendarView } from "./ReservationUnitCalendarView";
import { UnitReservations } from "./UnitReservations";
import { base64encode, toNumber } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import { UserPermissionChoice, useUnitViewQuery } from "@gql/gql-types";
import { useCheckPermission } from "@/hooks";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { LinkPrev } from "@/component/LinkPrev";
import { gql } from "@apollo/client";
import { useModal } from "@/context/ModalContext";
import { CreateReservationModal } from "@/spa/my-units/[id]/CreateReservationModal";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

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

export function MyUnitView() {
  const { unitId } = useParams<Params>();
  const { t } = useTranslation();
  const pk = toNumber(unitId);
  const { setModalContent } = useModal();

  const isPkValid = pk != null && pk > 0;
  const id = base64encode(`UnitNode:${pk}`);
  const { loading, data } = useUnitViewQuery({
    skip: !isPkValid,
    variables: { id },
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });

  const { unit } = data ?? {};

  const createReservationBtnRef = useRef<HTMLButtonElement>(null);
  const { hasPermission } = useCheckPermission({
    units: pk != null ? [pk] : [],
    permission: UserPermissionChoice.CanCreateStaffReservations,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = searchParams.get("tab") ?? "unit";
  const handleTabChange = (tab: "unit" | "reservation-unit") => {
    const vals = new URLSearchParams(searchParams);
    vals.set("tab", tab);
    setSearchParams(vals, { replace: true });
  };

  if (!isPkValid) {
    return (
      <>
        <LinkPrev />
        {t("errors.router.unitNotFound")}
      </>
    );
  }

  const recurringReservationUrl = getRecurringReservationUrl(pk);

  const reservationUnitOptions = (unit?.reservationUnits ?? []).map(({ pk, nameFi }) => ({
    label: nameFi ?? "-",
    value: pk ?? 0,
  }));

  const handleOpenModal = () => {
    setModalContent(
      <CreateReservationModal
        start={new Date()}
        focusAfterCloseRef={createReservationBtnRef}
        reservationUnitOptions={reservationUnitOptions}
        onClose={() => {
          setModalContent(null);
        }}
      />
    );
  };

  const activeTab = selectedTab === "reservation-unit" ? 1 : 0;

  const title = loading ? t("common.loading") : (unit?.nameFi ?? "-");
  const location = unit?.location ? parseAddress(unit.location) : "-";
  const canCreateReservations = hasPermission && unit != null && reservationUnitOptions.length > 0;
  return (
    <>
      <TitleSection>
        <H1 $noMargin>{title}</H1>
        <LocationOnlyOnDesktop>{location}</LocationOnlyOnDesktop>
      </TitleSection>
      <Flex $direction="row" $gap="m">
        <Button
          ref={createReservationBtnRef}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Small}
          onClick={handleOpenModal}
          disabled={!canCreateReservations}
        >
          {t("MyUnits.Calendar.header.createReservation")}
        </Button>
        <ButtonLikeLink to={canCreateReservations ? recurringReservationUrl : ""} disabled={!canCreateReservations}>
          {t("MyUnits.Calendar.header.recurringReservation")}
        </ButtonLikeLink>
      </Flex>
      <TabWrapper>
        <Tabs initiallyActiveTab={activeTab}>
          <Tabs.TabList>
            <Tabs.Tab onClick={() => handleTabChange("unit")}>{t("MyUnits.Calendar.Tabs.byReservationUnit")}</Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("reservation-unit")}>{t("MyUnits.Calendar.Tabs.byUnit")}</Tabs.Tab>
          </Tabs.TabList>
          <TabPanel>
            <UnitReservations reservationUnitOptions={reservationUnitOptions} />
          </TabPanel>
          <TabPanel>
            <ReservationUnitCalendarView reservationUnitOptions={reservationUnitOptions} unitPk={Number(pk)} />
          </TabPanel>
        </Tabs>
      </TabWrapper>
    </>
  );
}

export const UNIT_VIEW_QUERY = gql`
  query UnitView($id: ID!) {
    unit(id: $id) {
      id
      pk
      nameFi
      location {
        ...LocationFields
      }
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
