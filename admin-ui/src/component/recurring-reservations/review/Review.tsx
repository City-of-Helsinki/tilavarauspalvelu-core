import { Tabs } from "hds-react";
import { debounce } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ApplicationRound as ApplicationRoundType } from "../../../common/types";
import { applicationRoundUrl } from "../../../common/urls";
import { Container, Content, VerticalFlex } from "../../../styles/layout";
import { H2 } from "../../../styles/new-typography";
import StatusRecommendation from "../../applications/StatusRecommendation";
import BreadcrumbWrapper from "../../BreadcrumbWrapper";
import withMainMenu from "../../withMainMenu";
import { NaviItem } from "../ApplicationRoundNavi";
import ApplicationRoundStatusBlock from "../ApplicationRoundStatusBlock";
import TimeframeStatus from "../TimeframeStatus";
import ApplicationDataLoader from "./ApplicationDataLoader";
import { Sort } from "./ApplicationsTable";
import Filters, { emptyFilterState, FilterArguments } from "./Filters";

interface IProps {
  applicationRound: ApplicationRoundType;
}

const Wrapper = styled.div`
  width: 100%;
  margin-bottom: var(--spacing-layout-xl);
`;

const Header = styled.div`
  margin-top: var(--spacing-l);
`;

const RecommendationValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: var(--spacing-layout-m);
  margin-bottom: var(--spacing-l);
`;

const StyledH2 = styled(H2)`
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1;
`;

const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  margin-top: var(--spacing-s);
  line-height: 1;
`;

const ApplicationRoundName = styled.div`
  font-size: var(--fontsize-body-xl);
  margin: var(--spacing-s) 0;
  line-height: var(--lineheight-m);
`;

const StyledApplicationRoundStatusBlock = styled(ApplicationRoundStatusBlock)`
  margin: var(--spacing-l) 0 0 0;
`;

function Review({ applicationRound }: IProps): JSX.Element | null {
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

  return (
    <Wrapper>
      <Container>
        <BreadcrumbWrapper
          route={[
            "recurring-reservations",
            "/recurring-reservations/application-rounds",
            "application-round",
          ]}
          aliases={[
            { slug: "application-round", title: applicationRound.name },
          ]}
        />

        <Content>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <StyledApplicationRoundStatusBlock
              applicationRound={applicationRound}
            />
            <NaviItem
              to={`${applicationRoundUrl(applicationRound.id)}/criteria`}
            >
              {t("ApplicationRound.roundCriteria")}
            </NaviItem>
          </div>
          <Header>
            <ApplicationRoundName>{applicationRound.name}</ApplicationRoundName>
            <StyledH2>{t("ApplicationRound.applicants")}</StyledH2>
            <TimeframeStatus
              applicationPeriodBegin={applicationRound.applicationPeriodBegin}
              applicationPeriodEnd={applicationRound.applicationPeriodEnd}
            />
            <RecommendationValue>
              <StatusRecommendation
                status="in_review"
                applicationRound={applicationRound}
              />
            </RecommendationValue>
          </Header>
          <Tabs>
            <Tabs.TabList>
              <Tabs.Tab>{t("ApplicationRound.applications")}</Tabs.Tab>
              <Tabs.Tab>{t("ApplicationRound.appliedReservations")}</Tabs.Tab>
            </Tabs.TabList>
            <Tabs.TabPanel>
              <TabContent>
                <VerticalFlex>
                  <Filters onSearch={debouncedSearch} />
                  <ApplicationDataLoader
                    applicationRound={applicationRound}
                    key={JSON.stringify({ ...search, ...sort })}
                    filters={search}
                    sort={sort}
                    sortChanged={onSortChanged}
                  />
                </VerticalFlex>
              </TabContent>
            </Tabs.TabPanel>
          </Tabs>
        </Content>
      </Container>
    </Wrapper>
  );
}

export default withMainMenu(Review);
