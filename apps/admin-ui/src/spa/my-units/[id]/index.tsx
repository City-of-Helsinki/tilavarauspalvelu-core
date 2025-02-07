import React from "react";
import { H1 } from "common/src/common/typography";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { Tabs } from "hds-react";
import { breakpoints } from "common/src/common/style";
import { parseAddress } from "@/common/util";
import { getRecurringReservationUrl } from "@/common/urls";
import { ReservationUnitCalendarView } from "./ReservationUnitCalendarView";
import { UnitReservations } from "./UnitReservations";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import { UserPermissionChoice, useUnitViewQuery } from "@gql/gql-types";
import { useCheckPermission } from "@/hooks";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { LinkPrev } from "@/component/LinkPrev";
import { CenterSpinner, TabWrapper, TitleSection } from "common/styles/util";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

const LocationOnlyOnDesktop = styled.p`
  display: none;
  @media (min-width: ${breakpoints.s}) {
    display: block;
  }
`;

const TabPanel = styled(Tabs.TabPanel)`
  padding-block: var(--spacing-m);
`;

export function MyUnitView() {
  const { unitId: pk } = useParams<Params>();
  const { t } = useTranslation();

  const isPkValid = pk != null && Number(pk) > 0;
  const id = base64encode(`UnitNode:${pk}`);
  const { loading, data } = useUnitViewQuery({
    skip: !isPkValid,
    variables: { id },
    onError: (err) => {
      errorToast({
        text: err.message,
      });
    },
  });

  const { unit } = data ?? {};

  const { hasPermission: canCreateReservations } = useCheckPermission({
    units: [Number(pk)],
    permission: UserPermissionChoice.CanCreateStaffReservations,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = searchParams.get("tab") ?? "unit";
  const handleTabChange = (tab: "unit" | "reservation-unit") => {
    const vals = new URLSearchParams(searchParams);
    vals.set("tab", tab);
    setSearchParams(vals, { replace: true });
  };

  if (loading) {
    return <CenterSpinner />;
  }
  if (!unit || !isPkValid) {
    return (
      <>
        <LinkPrev />
        {t("errors.router.unitNotFound")}
      </>
    );
  }

  const recurringReservationUrl = getRecurringReservationUrl(pk);

  const reservationUnitOptions = filterNonNullable(
    data?.unit?.reservationUnits
  ).map((reservationUnit) => ({
    label: reservationUnit?.nameFi ?? "-",
    value: reservationUnit?.pk ?? 0,
  }));

  const activeTab = selectedTab === "reservation-unit" ? 1 : 0;

  return (
    <>
      <TitleSection>
        <H1 $noMargin>{unit?.nameFi}</H1>
        {unit.location && (
          <LocationOnlyOnDesktop>
            {parseAddress(unit.location)}
          </LocationOnlyOnDesktop>
        )}
      </TitleSection>
      <div>
        <ButtonLikeLink
          to={canCreateReservations ? recurringReservationUrl : ""}
          disabled={!canCreateReservations}
        >
          {t("MyUnits.Calendar.header.recurringReservation")}
        </ButtonLikeLink>
      </div>
      <TabWrapper>
        <Tabs initiallyActiveTab={activeTab}>
          <Tabs.TabList>
            <Tabs.Tab onClick={() => handleTabChange("unit")}>
              {t("MyUnits.Calendar.Tabs.byReservationUnit")}
            </Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("reservation-unit")}>
              {t("MyUnits.Calendar.Tabs.byUnit")}
            </Tabs.Tab>
          </Tabs.TabList>
          <TabPanel>
            <UnitReservations />
          </TabPanel>
          <TabPanel>
            <ReservationUnitCalendarView
              reservationUnitOptions={reservationUnitOptions}
              unitPk={Number(pk)}
            />
          </TabPanel>
        </Tabs>
      </TabWrapper>
    </>
  );
}
