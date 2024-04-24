import React from "react";
import { Button, Tabs } from "hds-react";
import { uniqBy } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link, useSearchParams } from "react-router-dom";
import { type Maybe } from "graphql/jsutils/Maybe";
import { H2 } from "common/src/common/typography";
import { filterNonNullable } from "common/src/helpers";
import {
  type ApplicationRoundNode,
  ApplicationRoundStatusChoice,
  type ReservationUnitNode,
  type UnitNode,
} from "common/types/gql-types";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { Container, TabWrapper } from "@/styles/layout";
import { ApplicationRoundStatusTag } from "../../ApplicationRoundStatusTag";
import TimeframeStatus from "../../TimeframeStatus";
import { ApplicationDataLoader } from "./ApplicationDataLoader";
import { Filters } from "./Filters";
import { ApplicationEventDataLoader } from "./ApplicationEventDataLoader";
import { AllocatedEventDataLoader } from "./AllocatedEventDataLoader";

const Header = styled.div`
  margin-top: var(--spacing-s);
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

const StyledH2 = styled(H2)`
  margin-top: 1.5rem;
`;

function getUnitOptions(resUnits: ReservationUnitNode[]) {
  const opts = resUnits.map((x) => x?.unit).map((x) => unitToOption(x));
  return filterNonNullable(opts);
}

// TODO these to toOption functions are identical, can they be combined (bit of type magic)?
function unitToOption(unit: Maybe<UnitNode>) {
  if (unit?.pk == null || unit.nameFi == null) {
    return null;
  }
  const { nameFi, pk } = unit;
  return { nameFi, pk };
}

function resUnitsToOption(resUnit: Maybe<ReservationUnitNode>) {
  if (resUnit?.pk == null || resUnit.nameFi == null) {
    return null;
  }
  const { nameFi, pk } = resUnit;
  return { nameFi, pk };
}

type ReviewProps = {
  applicationRound: ApplicationRoundNode;
};

export function Review({ applicationRound }: ReviewProps): JSX.Element {
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

  const ds = getUnitOptions(resUnits);
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
    resUnits.map((x) => resUnitsToOption(x))
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
        <StyledH2>{applicationRound.nameFi}</StyledH2>
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
      <TabWrapper>
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
      </TabWrapper>
    </Container>
  );
}
