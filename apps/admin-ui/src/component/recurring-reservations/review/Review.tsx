import React, { useState } from "react";
import { Tabs } from "hds-react";
import { debounce, uniqBy } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { H2 } from "common/src/common/typography";
import { type Query, type ApplicationRoundNode } from "common/types/gql-types";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { Container } from "@/styles/layout";
import { GQL_MAX_RESULTS_PER_QUERY } from "@/common/const";
import StatusRecommendation from "./StatusRecommendation";
import { ApplicationRoundStatusTag } from "../ApplicationRoundStatusTag";
import TimeframeStatus from "../TimeframeStatus";
import ApplicationDataLoader from "./ApplicationDataLoader";
import { type Sort } from "./ApplicationsTable";
import Filters, {
  emptyFilterState,
  type FilterArguments,
  type UnitPkName,
} from "./Filters";
import ApplicationEventDataLoader from "./ApplicationEventDataLoader";

const Header = styled.div`
  margin-top: var(--spacing-l);
`;

const SpaceBetweenContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const AlignEndContainer = styled(SpaceBetweenContainer)`
  align-items: end;
`;

const TabContent = styled.div`
  display: grid;
  gap: var(--spacing-m);
  margin-top: var(--spacing-s);
  line-height: 1;
`;

const APPLICATION_RESERVATION_UNITS_QUERY = gql`
  query reservationUnits($offset: Int, $count: Int, $pks: [ID]) {
    reservationUnits(
      onlyWithPermission: true
      offset: $offset
      first: $count
      pk: $pks
    ) {
      edges {
        node {
          unit {
            pk
            nameFi
          }
        }
      }
      totalCount
    }
  }
`;

interface ReviewProps {
  applicationRound: ApplicationRoundNode;
}

function Review({ applicationRound }: ReviewProps): JSX.Element | null {
  const [search, setSearch] = useState<FilterArguments>(emptyFilterState);
  const [sort, setSort] = useState<Sort>();
  const debouncedSearch = debounce((value) => setSearch(value), 300);

  const onSortChanged = (sortField: string) => {
    setSort({
      field: sortField,
      sort: sort?.field === sortField ? !sort?.sort : true,
    });
  };

  const { t } = useTranslation();

  // TODO this should not require an extra graphql call pass them directly here instead
  // TODO this doesn't fetch more than 100 elements
  const ruPks =
    applicationRound.reservationUnits
      ?.map((x) => x?.pk)
      .filter((x): x is NonNullable<typeof x> => x != null) ?? [];

  // Copy-paste from ReservationUnitFilter (same issues etc.)
  const { data } = useQuery<Query>(APPLICATION_RESERVATION_UNITS_QUERY, {
    variables: {
      offset: 0,
      count: GQL_MAX_RESULTS_PER_QUERY,
      pks: ruPks,
    },
  });

  const ds =
    data?.reservationUnits?.edges
      ?.map((x) => x?.node?.unit)
      .map((x) =>
        x?.pk != null && x.nameFi != null
          ? { pk: x.pk, nameFi: x.nameFi }
          : null
      )
      .filter((x): x is UnitPkName => x != null) ?? [];
  const unitPks = uniqBy(ds, (unit) => unit.pk);

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
          {applicationRound.status != null && (
            <StatusRecommendation
              status={applicationRound.status}
              name={applicationRound.nameFi ?? "-"}
              reservationPeriodEnd={applicationRound.reservationPeriodEnd}
            />
          )}
          <ButtonLikeLink to="allocation" variant="primary" size="large">
            {t("ApplicationRound.allocate")}
          </ButtonLikeLink>
        </AlignEndContainer>
      </Header>
      <Tabs>
        <Tabs.TabList>
          <Tabs.Tab>{t("ApplicationRound.applications")}</Tabs.Tab>
          <Tabs.Tab>{t("ApplicationRound.appliedReservations")}</Tabs.Tab>
        </Tabs.TabList>
        <Tabs.TabPanel>
          <TabContent>
            <Filters onSearch={debouncedSearch} units={unitPks} />
            <ApplicationDataLoader
              applicationRound={applicationRound}
              key={JSON.stringify({ ...search, ...sort })}
              filters={search}
              sort={sort}
              sortChanged={onSortChanged}
            />
          </TabContent>
        </Tabs.TabPanel>
        <Tabs.TabPanel>
          <TabContent>
            <Filters onSearch={debouncedSearch} units={unitPks} />
            <ApplicationEventDataLoader
              applicationRound={applicationRound}
              key={JSON.stringify({ ...search, ...sort })}
              filters={search}
              sort={sort}
              sortChanged={onSortChanged}
            />
          </TabContent>
        </Tabs.TabPanel>
      </Tabs>
    </Container>
  );
}

export default Review;
