import React from "react";
import { Button, Tabs } from "hds-react";
import { uniqBy } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link, useSearchParams } from "react-router-dom";
import { H2 } from "common/src/common/typography";
import {
  type ApplicationRoundNode,
  ApplicationRoundStatusChoice,
} from "common/types/gql-types";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { Container } from "@/styles/layout";
import { ApplicationRoundStatusTag } from "../../ApplicationRoundStatusTag";
import TimeframeStatus from "../../TimeframeStatus";
import { ApplicationDataLoader } from "./ApplicationDataLoader";
import { Filters } from "./Filters";
import { ApplicationEventDataLoader } from "./ApplicationEventDataLoader";
import { AllocatedEventDataLoader } from "./AllocatedEventDataLoader";
import { filterNonNullable } from "common/src/helpers";

const Header = styled.div`
  margin-top: var(--spacing-l);
`;

const SpaceBetweenContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const AlignEndContainer = styled(SpaceBetweenContainer)`
  align-items: end;
  justify-content: flex-end;
`;

const TabContent = styled.div`
  display: grid;
  gap: var(--spacing-m);
  margin-top: var(--spacing-s);
  line-height: 1;
`;

type ReviewProps = {
  applicationRound: ApplicationRoundNode;
};

export function Review({ applicationRound }: ReviewProps): JSX.Element | null {
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
  const ds = filterNonNullable(
    resUnits
      .map((x) => x?.unit)
      .map((x) =>
        x?.pk != null && x.nameFi != null
          ? { pk: x.pk, nameFi: x.nameFi }
          : null
      )
  );
  const unitPks = uniqBy(ds, (unit) => unit.pk).sort((a, b) =>
    a.nameFi.localeCompare(b.nameFi)
  );

  const isAllocationEnabled =
    applicationRound.status === ApplicationRoundStatusChoice.InAllocation &&
    applicationRound.applicationsCount != null &&
    applicationRound.applicationsCount > 0;

  const activeTabIndex =
    selectedTab === "events" ? 1 : selectedTab === "allocated" ? 2 : 0;

  const reseevationUnitOptions = filterNonNullable(
    resUnits.map((x) =>
      x.pk != null && x.nameFi != null
        ? {
            nameFi: x.nameFi,
            pk: x.pk,
          }
        : null
    )
  );

  return (
    <Container>
      <Header>
        <SpaceBetweenContainer>
          {applicationRound.status != null && (
            <ApplicationRoundStatusTag status={applicationRound.status} />
          )}
          <Link to="criteria">{t("ApplicationRound.roundCriteria")}</Link>
        </SpaceBetweenContainer>
        <H2>{applicationRound.nameFi}</H2>
        <TimeframeStatus
          applicationPeriodBegin={applicationRound.applicationPeriodBegin}
          applicationPeriodEnd={applicationRound.applicationPeriodEnd}
        />
        <AlignEndContainer>
          {isAllocationEnabled ? (
            <ButtonLikeLink to="allocation" variant="primary" size="large">
              {t("ApplicationRound.allocate")}
            </ButtonLikeLink>
          ) : (
            <Button variant="primary" disabled>
              {t("ApplicationRound.allocate")}
            </Button>
          )}
        </AlignEndContainer>
      </Header>
      <Tabs initiallyActiveTab={activeTabIndex}>
        <Tabs.TabList>
          <Tabs.Tab onClick={() => handleTabChange("applications")}>
            {t("ApplicationRound.applications")}
          </Tabs.Tab>
          <Tabs.Tab onClick={() => handleTabChange("events")}>
            {t("ApplicationRound.appliedReservations")}
          </Tabs.Tab>
          <Tabs.Tab onClick={() => handleTabChange("allocated")}>
            {t("ApplicationRound.allocatedReservations")}
          </Tabs.Tab>
        </Tabs.TabList>
        <Tabs.TabPanel>
          <TabContent>
            <Filters units={unitPks} />
            <ApplicationDataLoader
              applicationRoundPk={applicationRound.pk ?? 0}
            />
          </TabContent>
        </Tabs.TabPanel>
        <Tabs.TabPanel>
          <TabContent>
            <Filters units={unitPks} statusOption="event" />
            <ApplicationEventDataLoader
              applicationRoundPk={applicationRound.pk ?? 0}
            />
          </TabContent>
        </Tabs.TabPanel>
        <Tabs.TabPanel>
          <TabContent>
            <Filters
              units={unitPks}
              reservationUnits={reseevationUnitOptions}
              enableWeekday
              enableReservationUnit
              statusOption="eventShort"
            />
            <AllocatedEventDataLoader
              applicationRoundPk={applicationRound.pk ?? 0}
            />
          </TabContent>
        </Tabs.TabPanel>
      </Tabs>
    </Container>
  );
}
